import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import { randomBytes } from "crypto";
import { sanitizeHtmlContent, sanitizeCss } from "../shared/sanitize";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DRAFTS_TABLE_NAME!;
const BUCKET_NAME = process.env.DRAFTS_BUCKET_NAME!;
const TTL_DAYS = 180;

const MAX_HTML_SIZE = 10_000_000; // 10MB — content lives in S3, not a DynamoDB item, so this is an abuse cap, not a hard platform ceiling
const MAX_CSS_SIZE = 25000;       // 25KB
const MAX_TITLE_SIZE = 500;       // 500B

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { payloadType, html, css, title } = body;

    if (payloadType !== "html-css" && payloadType !== "richtext") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "payloadType must be 'html-css' or 'richtext'" }) };
    }
    if (typeof html !== "string" || html.length === 0) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "html is required" }) };
    }
    if (css !== undefined && typeof css !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "css must be a string" }) };
    }
    if (title !== undefined && typeof title !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "title must be a string" }) };
    }

    if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE) {
      return { statusCode: 413, headers: corsHeaders(), body: JSON.stringify({ error: "HTML content exceeds maximum size of 10MB" }) };
    }
    if (Buffer.byteLength(css ?? "", "utf8") > MAX_CSS_SIZE) {
      return { statusCode: 413, headers: corsHeaders(), body: JSON.stringify({ error: "CSS content exceeds maximum size of 25KB" }) };
    }
    if (Buffer.byteLength(title ?? "", "utf8") > MAX_TITLE_SIZE) {
      return { statusCode: 413, headers: corsHeaders(), body: JSON.stringify({ error: "Title exceeds maximum size of 500B" }) };
    }

    const sanitizedHtml = sanitizeHtmlContent(html);
    const content =
      payloadType === "richtext"
        ? { html: sanitizedHtml }
        : { html: sanitizedHtml, css: sanitizeCss(css ?? "") };

    const id = randomBytes(16).toString("hex");
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + TTL_DAYS * 24 * 60 * 60;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `drafts/${id}.json`,
        Body: JSON.stringify(content),
        ContentType: "application/json",
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id,
          payloadType,
          title: title ?? "",
          createdAt: now,
          updatedAt: now,
          ttl,
        },
      })
    );

    console.log(JSON.stringify({
      event: "createDraft",
      id,
      payloadType,
      htmlBytes: Buffer.byteLength(html, "utf8"),
      hasTitle: !!title,
    }));

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        id,
        updatedAt: new Date(now * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("createDraft error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "https://ficformatter.com",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
