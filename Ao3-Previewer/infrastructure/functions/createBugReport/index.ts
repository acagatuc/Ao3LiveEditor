import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { randomBytes } from "crypto";
import { corsHeaders } from "../shared/cors";
import { followUpCommand, templateNames, type EmailEnv } from "../shared/bugReportEmails";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const ses = new SESClient({ region: "us-east-1" });

const TABLE_NAME = process.env.BUG_REPORTS_TABLE_NAME!;
const BUCKET_NAME = process.env.BUG_REPORTS_BUCKET_NAME!;
// Optional: the dev stack has no SES, so reports are only stored there.
const TO_EMAIL = process.env.CONTACT_EMAIL;
const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const EMAIL_ENV: EmailEnv = process.env.EMAIL_ENV === "dev" ? "dev" : "prod";
const TEMPLATES = templateNames(EMAIL_ENV);
const TTL_DAYS = 90; // Reports hold users' fic text, so they aren't kept longer than needed to triage

const MAX_HTML_SIZE = 5_000_000; // 5MB, same cap as drafts
const MAX_CSS_SIZE = 25000; // 25KB, same cap as drafts
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_INTENT_LENGTH = 500;
const MAX_SITE_SKIN_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_META_LENGTH = 500; // userAgent, viewport, appVersion
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { html, css, description, intent, siteSkin, contactEmail, userAgent, viewport, appVersion } =
      body;

    if (typeof html !== "string" || typeof css !== "string") {
      return badRequest(event, "html and css must be strings");
    }
    if (!html.trim() && !css.trim()) {
      return badRequest(event, "A report needs some HTML or CSS");
    }
    if (typeof description !== "string" || !description.trim()) {
      return badRequest(event, "description is required");
    }
    if (typeof intent !== "string" || !intent.trim()) {
      return badRequest(event, "intent is required");
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return badRequest(event, `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    if (intent.length > MAX_INTENT_LENGTH) {
      return badRequest(event, `intent must be at most ${MAX_INTENT_LENGTH} characters`);
    }
    if (
      siteSkin !== undefined &&
      (typeof siteSkin !== "string" || siteSkin.length > MAX_SITE_SKIN_LENGTH)
    ) {
      return badRequest(event, `siteSkin must be a string of at most ${MAX_SITE_SKIN_LENGTH} characters`);
    }
    if (
      contactEmail !== undefined &&
      contactEmail !== "" &&
      (typeof contactEmail !== "string" ||
        contactEmail.length > MAX_EMAIL_LENGTH ||
        !EMAIL_REGEX.test(contactEmail))
    ) {
      return badRequest(event, "contactEmail must be a valid email address");
    }
    for (const [name, value] of Object.entries({ userAgent, viewport, appVersion })) {
      if (value !== undefined && (typeof value !== "string" || value.length > MAX_META_LENGTH)) {
        return badRequest(event, `${name} must be a string of at most ${MAX_META_LENGTH} characters`);
      }
    }

    const htmlBytes = Buffer.byteLength(html, "utf8");
    const cssBytes = Buffer.byteLength(css, "utf8");
    if (htmlBytes > MAX_HTML_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(event),
        body: JSON.stringify({ error: "HTML content exceeds maximum size of 5MB" }),
      };
    }
    if (cssBytes > MAX_CSS_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(event),
        body: JSON.stringify({ error: "CSS content exceeds maximum size of 25KB" }),
      };
    }

    const id = randomBytes(16).toString("hex");
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + TTL_DAYS * 24 * 60 * 60;
    const s3Key = `bug-reports/${id}.json`;
    const replyTo = contactEmail || undefined;

    // Stored exactly as the user had it (not sanitized) so the problem can be reproduced.
    // Only ever read by the maintainer, never rendered by the site.
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify({ html, css }),
        ContentType: "application/json",
      }),
    );

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id,
          status: "new",
          description,
          intent,
          siteSkin: siteSkin || "Not given",
          ...(replyTo ? { contactEmail: replyTo } : {}),
          userAgent: userAgent ?? "",
          viewport: viewport ?? "",
          appVersion: appVersion ?? "",
          htmlBytes,
          cssBytes,
          createdAt: now,
          ttl,
        },
      }),
    );

    console.log(
      JSON.stringify({ event: "createBugReport", id, htmlBytes, cssBytes, hasContact: !!replyTo }),
    );

    // The report is already saved, so a failed email shouldn't fail the request.
    if (TO_EMAIL && FROM_EMAIL) {
      await Promise.all([
        sendNotice(FROM_EMAIL, TO_EMAIL, replyTo, {
          reportId: id,
          description,
          intent,
          // Subjects can't hold line breaks, and long ones get cut off by mail clients anyway.
          subjectIntent: truncate(intent.replace(/\s+/g, " ").trim(), 80),
          siteSkin: siteSkin || "Not given",
          contact: replyTo ?? "Not provided",
          contactEmail: replyTo ?? "",
          userAgent: userAgent || "Unknown",
          viewport: viewport || "Unknown",
          appVersion: appVersion || "Unknown",
          htmlBytes: String(htmlBytes),
          cssBytes: String(cssBytes),
          codeUrl: s3ConsoleUrl(BUCKET_NAME, s3Key),
          followUpCommand: followUpCommand(EMAIL_ENV),
        }),
        replyTo ? sendReceived(FROM_EMAIL, replyTo, id) : Promise.resolve(),
      ]);
    }

    return {
      statusCode: 201,
      headers: corsHeaders(event),
      body: JSON.stringify({ id }),
    };
  } catch (error) {
    console.error("createBugReport error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(event),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// SES reports a template variable missing from TemplateData as a rendering failure after
// accepting the send, so the Lambda would never see it. Always pass every variable.
function sendTemplated(params: {
  from: string;
  to: string;
  replyTo?: string;
  template: string;
  data: Record<string, string>;
}) {
  return ses.send(
    new SendTemplatedEmailCommand({
      Source: params.from,
      Destination: { ToAddresses: [params.to] },
      ...(params.replyTo ? { ReplyToAddresses: [params.replyTo] } : {}),
      Template: params.template,
      TemplateData: JSON.stringify(params.data),
    }),
  );
}

// New-report notice to the maintainer, with Reply-To set to the reporter so replying reaches them.
async function sendNotice(from: string, to: string, replyTo: string | undefined, data: Record<string, string>) {
  try {
    await sendTemplated({ from, to, replyTo, template: TEMPLATES.notice, data });
  } catch (error) {
    console.error("createBugReport notice email error:", error);
    // SES rejects some addresses the form accepts (e.g. non-ASCII ones), which fails the
    // whole send. Retry without Reply-To; the address is still in the body to reply by hand.
    if (replyTo) {
      try {
        await sendTemplated({ from, to, template: TEMPLATES.notice, data });
      } catch (retryError) {
        console.error("createBugReport notice email retry error:", retryError);
      }
    }
  }
}

// Confirmation to the reporter. Deliberately has no Reply-To: the maintainer's address must never
// appear in email sent to reporters.
async function sendReceived(from: string, to: string, reportId: string) {
  try {
    await sendTemplated({ from, to, template: TEMPLATES.received, data: { reportId } });
  } catch (error) {
    console.error("createBugReport confirmation email error:", error);
  }
}

function s3ConsoleUrl(bucket: string, key: string): string {
  const region = process.env.AWS_REGION ?? "us-east-1";
  return (
    `https://s3.console.aws.amazon.com/s3/object/${bucket}` +
    `?region=${region}&bucketType=general&prefix=${encodeURIComponent(key)}`
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function badRequest(event: APIGatewayProxyEvent, error: string) {
  return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error }) };
}
