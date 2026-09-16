import { DynamoDBClient, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id },
          ConditionExpression: "attribute_exists(id)",
        })
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: "Draft not found or has expired" }) };
      }
      throw error;
    }

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: `drafts/${id}.json` })
    );

    console.log(JSON.stringify({ event: "deleteDraft", id }));

    return { statusCode: 204, headers: corsHeaders(), body: "" };
  } catch (error) {
    console.error("deleteDraft error:", error);
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
