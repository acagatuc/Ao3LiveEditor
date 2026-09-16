import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DRAFTS_TABLE_NAME!;
const BUCKET_NAME = process.env.DRAFTS_BUCKET_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Draft ID is required" }) };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) {
      return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: "Draft not found or has expired" }) };
    }

    const { payloadType, title, createdAt, updatedAt, ttl } = result.Item;

    let content: { html: string; css?: string };
    try {
      const object = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: `drafts/${id}.json` })
      );
      content = JSON.parse((await object.Body!.transformToString()) as string);
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: "Draft not found or has expired" }) };
      }
      throw error;
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        id,
        payloadType,
        title: title ?? "",
        html: content.html,
        css: content.css,
        createdAt: new Date(createdAt * 1000).toISOString(),
        updatedAt: new Date(updatedAt * 1000).toISOString(),
        expiresAt: new Date(ttl * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("getDraft error:", error);
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
