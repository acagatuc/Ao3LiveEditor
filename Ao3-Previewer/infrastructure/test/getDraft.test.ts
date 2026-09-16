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
const { handler } = require("../functions/getDraft") as {
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
};
const { NoSuchKey } = require("@aws-sdk/client-s3") as { NoSuchKey: new (opts: { message: string; $metadata: object }) => Error };

function makeEvent(id?: string): APIGatewayProxyEvent {
  return { pathParameters: id ? { id } : null } as unknown as APIGatewayProxyEvent;
}

function s3Body(content: object) {
  return { Body: { transformToString: async () => JSON.stringify(content) } };
}

describe("getDraft handler", () => {
  beforeEach(() => {
    mockDynamoSend.mockReset();
    mockS3Send.mockReset();
  });

  it("returns 400 when the id path parameter is missing", async () => {
    const res = await handler(makeEvent(undefined));
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when the DynamoDB item doesn't exist", async () => {
    mockDynamoSend.mockResolvedValue({ Item: undefined });
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(404);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it("returns 404 when the S3 object is missing (NoSuchKey)", async () => {
    mockDynamoSend.mockResolvedValue({
      Item: { payloadType: "richtext", title: "t", createdAt: 1, updatedAt: 2, ttl: 3 },
    });
    mockS3Send.mockRejectedValue(new NoSuchKey({ message: "not found", $metadata: {} }));
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 with the draft content on success", async () => {
    const now = Math.floor(Date.now() / 1000);
    mockDynamoSend.mockResolvedValue({
      Item: { payloadType: "html-css", title: "My Draft", createdAt: now, updatedAt: now, ttl: now + 100 },
    });
    mockS3Send.mockResolvedValue(s3Body({ html: "<p>Hi</p>", css: ".x{color:red}" }));

    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toMatchObject({
      id: "abc123",
      payloadType: "html-css",
      title: "My Draft",
      html: "<p>Hi</p>",
      css: ".x{color:red}",
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockDynamoSend.mockRejectedValue(new Error("boom"));
    const res = await handler(makeEvent("abc123"));
    expect(res.statusCode).toBe(500);
  });
});
