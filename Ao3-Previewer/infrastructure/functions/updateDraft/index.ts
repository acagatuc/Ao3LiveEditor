import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";
import { sanitizeHtmlContent, sanitizeCss } from "../shared/sanitize";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DRAFTS_TABLE_NAME!;
const BUCKET_NAME = process.env.DRAFTS_BUCKET_NAME!;
const TTL_DAYS = 180;

const MAX_HTML_SIZE = 5_000_000; // 5MB abuse cap - AO3's 500k-char chapter limit implies real content tops out well under 1MB even with markup; this stays safely under API Gateway's 6MB synchronous Lambda payload ceiling
const MAX_CSS_SIZE = 25000; // 25KB
const MAX_TITLE_SIZE = 500; // 500B

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Draft ID is required" }),
      };
    }

    const body = JSON.parse(event.body ?? "{}");
    const { payloadType, html, css, title } = body;

    if (payloadType !== "html-css" && payloadType !== "richtext") {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: "payloadType must be 'html-css' or 'richtext'",
        }),
      };
    }
    if (typeof html !== "string" || html.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "html is required" }),
      };
    }
    if (css !== undefined && typeof css !== "string") {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "css must be a string" }),
      };
    }
    if (title !== undefined && typeof title !== "string") {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "title must be a string" }),
      };
    }

    if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: "HTML content exceeds maximum size of 5MB",
        }),
      };
    }
    if (Buffer.byteLength(css ?? "", "utf8") > MAX_CSS_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: "CSS content exceeds maximum size of 25KB",
        }),
      };
    }
    if (Buffer.byteLength(title ?? "", "utf8") > MAX_TITLE_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Title exceeds maximum size of 500B" }),
      };
    }

    const sanitizedHtml = sanitizeHtmlContent(html);
    const content =
      payloadType === "richtext"
        ? { html: sanitizedHtml }
        : { html: sanitizedHtml, css: sanitizeCss(css ?? "") };

    const now = Math.floor(Date.now() / 1000);
    const ttl = now + TTL_DAYS * 24 * 60 * 60;

    // Update the DynamoDB metadata first — if the draft doesn't exist (or expired), fail
    // before touching S3, so we never write orphaned content for an unknown id.
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          ConditionExpression: "attribute_exists(id)",
          UpdateExpression:
            "SET payloadType = :payloadType, title = :title, updatedAt = :updatedAt, #ttl = :ttl",
          ExpressionAttributeNames: { "#ttl": "ttl" },
          ExpressionAttributeValues: {
            ":payloadType": payloadType,
            ":title": title ?? "",
            ":updatedAt": now,
            ":ttl": ttl,
          },
        }),
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          headers: corsHeaders(),
          body: JSON.stringify({ error: "Draft not found or has expired" }),
        };
      }
      throw error;
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `drafts/${id}.json`,
        Body: JSON.stringify(content),
        ContentType: "application/json",
      }),
    );

    console.log(
      JSON.stringify({
        event: "updateDraft",
        id,
        payloadType,
        htmlBytes: Buffer.byteLength(html, "utf8"),
        hasTitle: !!title,
      }),
    );

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        id,
        updatedAt: new Date(now * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("updateDraft error:", error);
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
    "Access-Control-Allow-Origin":
      process.env.ALLOWED_ORIGIN ?? "https://ficformatter.com",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
