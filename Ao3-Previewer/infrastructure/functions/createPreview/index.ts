import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { randomBytes } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.PREVIEWS_TABLE_NAME!;
const TTL_DAYS = 7;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { html, css, title, author } = body;

    if (!html && !css) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "html and css are required" }),
      };
    }

    const id = randomBytes(4).toString("hex");
    const createdAt = Math.floor(Date.now() / 1000);
    const ttl = createdAt + TTL_DAYS * 24 * 60 * 60;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id,
          html,
          css,
          title: title ?? "",
          author: author ?? "",
          createdAt,
          ttl,
        },
      })
    );

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        id,
        expiresAt: new Date(ttl * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("createPreview error:", error);
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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
