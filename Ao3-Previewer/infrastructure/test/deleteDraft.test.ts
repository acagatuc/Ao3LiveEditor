import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const mockDynamoSend = jest.fn();
const mockS3Send = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/client-dynamodb") as object;
  return {
    ...actual,
    DynamoDBClient: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/lib-dynamodb") as object;
  return {
    ...actual,
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockDynamoSend })) },
  };
});

jest.mock("@aws-sdk/client-s3", () => {
  const actual = jest.requireActual("@aws-sdk/client-s3") as object;
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  };
});

process.env.DRAFTS_TABLE_NAME = "test-drafts-table";
process.env.DRAFTS_BUCKET_NAME = "test-drafts-bucket";

/* eslint-disable @typescript-eslint/no-var-requires */
const { handler } = require("../functions/deleteDraft") as {
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
};
const { ConditionalCheckFailedException } = require("@aws-sdk/client-dynamodb") as {
  ConditionalCheckFailedException: new (opts: { message: string; $metadata: object }) => Error;
};

function makeEvent(id?: string): APIGatewayProxyEvent {
  return { pathParameters: id ? { id } : null } as unknown as APIGatewayProxyEvent;
}

describe("deleteDraft handler", () => {
  beforeEach(() => {
    mockDynamoSend.mockReset().mockResolvedValue({});
    mockS3Send.mockReset().mockResolvedValue({});
  });

  it("returns 400 when the id path parameter is missing", async () => {
    const res = await handler(makeEvent(undefined));
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when the draft doesn't exist (conditional check fails)", async () => {
    mockDynamoSend.mockRejectedValueOnce(new ConditionalCheckFailedException({ message: "failed", $metadata: {} }));
    const res = await handler(makeEvent("missing-id"));
    expect(res.statusCode).toBe(404);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it("deletes from DynamoDB and S3, returning 204", async () => {
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(204);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    expect(mockS3Send).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on an unexpected DynamoDB error", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("boom"));
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 if the S3 delete fails", async () => {
    mockS3Send.mockRejectedValueOnce(new Error("boom"));
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(500);
  });
});
