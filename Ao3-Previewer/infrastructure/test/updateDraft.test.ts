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
const { handler } = require("../functions/updateDraft") as {
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
};
const { ConditionalCheckFailedException } = require("@aws-sdk/client-dynamodb") as {
  ConditionalCheckFailedException: new (opts: { message: string; $metadata: object }) => Error;
};

function makeEvent(id: string | undefined, body: unknown): APIGatewayProxyEvent {
  return {
    pathParameters: id ? { id } : null,
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEvent;
}

describe("updateDraft handler", () => {
  beforeEach(() => {
    mockDynamoSend.mockReset().mockResolvedValue({});
    mockS3Send.mockReset().mockResolvedValue({});
  });

  it("returns 400 when the id path parameter is missing", async () => {
    const res = await handler(makeEvent(undefined, { payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an invalid payloadType", async () => {
    const res = await handler(makeEvent("abc123", { payloadType: "bogus", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 413 when html exceeds the 5MB cap", async () => {
    const res = await handler(makeEvent("abc123", { payloadType: "richtext", html: "a".repeat(5_000_001) }));
    expect(res.statusCode).toBe(413);
  });

  it("returns 404 when the draft doesn't exist (conditional check fails)", async () => {
    mockDynamoSend.mockRejectedValueOnce(new ConditionalCheckFailedException({ message: "failed", $metadata: {} }));
    const res = await handler(makeEvent("missing-id", { payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(404);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it("updates DynamoDB metadata before writing to S3, and returns 200", async () => {
    const res = await handler(makeEvent("abc123", { payloadType: "richtext", html: "<p>Updated</p>", title: "New title" }));
    expect(res.statusCode).toBe(200);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    const body = JSON.parse(res.body);
    expect(body.id).toBe("abc123");
  });

  it("sanitizes html and does not persist css for richtext payloads", async () => {
    await handler(makeEvent("abc123", { payloadType: "richtext", html: "<p>x</p><script>alert(1)</script>", css: ".x{color:red}" }));
    const putCall = mockS3Send.mock.calls[0][0] as { input: { Body: string } };
    const stored = JSON.parse(putCall.input.Body);
    expect(stored.html).not.toContain("<script>");
    expect(stored.css).toBeUndefined();
  });

  it("does not write to S3 if the DynamoDB update fails for a reason other than a missing draft", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("throttled"));
    const res = await handler(makeEvent("abc123", { payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(500);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it("returns 500 if the S3 write fails", async () => {
    mockS3Send.mockRejectedValueOnce(new Error("boom"));
    const res = await handler(makeEvent("abc123", { payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(500);
  });
});
