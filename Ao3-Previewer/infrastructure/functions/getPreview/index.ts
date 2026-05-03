import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.PREVIEWS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Preview ID is required" }),
      };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Preview not found or has expired" }),
      };
    }

    const { html, css, title, author, createdAt, ttl } = result.Item;

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        html,
        css,
        title: title ?? "",
        author: author ?? "",
        createdAt: new Date(createdAt * 1000).toISOString(),
        expiresAt: new Date(ttl * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("getPreview error:", error);
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
