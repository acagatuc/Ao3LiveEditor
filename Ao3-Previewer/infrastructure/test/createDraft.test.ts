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
const { handler } = require("../functions/createDraft") as {
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
};

function makeEvent(body: unknown): APIGatewayProxyEvent {
  return { body: JSON.stringify(body) } as unknown as APIGatewayProxyEvent;
}

describe("createDraft handler", () => {
  beforeEach(() => {
    mockDynamoSend.mockReset().mockResolvedValue({});
    mockS3Send.mockReset().mockResolvedValue({});
  });

  it("rejects an invalid payloadType", async () => {
    const res = await handler(makeEvent({ payloadType: "bogus", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects a missing html field", async () => {
    const res = await handler(makeEvent({ payloadType: "richtext" }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects html over the 5MB size cap", async () => {
    const bigHtml = "a".repeat(5_000_001);
    const res = await handler(makeEvent({ payloadType: "richtext", html: bigHtml }));
    expect(res.statusCode).toBe(413);
  });

  it("rejects css over the 25KB size cap", async () => {
    const bigCss = "a".repeat(25_001);
    const res = await handler(makeEvent({ payloadType: "html-css", html: "<p>x</p>", css: bigCss }));
    expect(res.statusCode).toBe(413);
  });

  it("creates a draft and returns 201 with a 32-char hex id", async () => {
    const res = await handler(makeEvent({ payloadType: "richtext", html: "<p>Hello</p>", title: "My Draft" }));
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toMatch(/^[0-9a-f]{32}$/);
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
  });

  it("sanitizes html before persisting it to S3", async () => {
    await handler(makeEvent({ payloadType: "richtext", html: "<p>x</p><script>alert(1)</script>" }));
    const putCall = mockS3Send.mock.calls[0][0] as { input: { Body: string } };
    const stored = JSON.parse(putCall.input.Body);
    expect(stored.html).not.toContain("<script>");
  });

  it("does not persist css for richtext payloads", async () => {
    await handler(makeEvent({ payloadType: "richtext", html: "<p>x</p>", css: ".x{color:red}" }));
    const putCall = mockS3Send.mock.calls[0][0] as { input: { Body: string } };
    const stored = JSON.parse(putCall.input.Body);
    expect(stored.css).toBeUndefined();
  });

  it("persists sanitized css for html-css payloads", async () => {
    await handler(makeEvent({ payloadType: "html-css", html: "<p>x</p>", css: '@import "evil.css"; .x{color:red}' }));
    const putCall = mockS3Send.mock.calls[0][0] as { input: { Body: string } };
    const stored = JSON.parse(putCall.input.Body);
    expect(stored.css).not.toContain("@import");
    expect(stored.css).toContain(".x{color:red}");
  });

  it("returns 500 if the S3 write fails", async () => {
    mockS3Send.mockRejectedValueOnce(new Error("boom"));
    const res = await handler(makeEvent({ payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 if the DynamoDB write fails", async () => {
    mockDynamoSend.mockRejectedValueOnce(new Error("boom"));
    const res = await handler(makeEvent({ payloadType: "richtext", html: "<p>x</p>" }));
    expect(res.statusCode).toBe(500);
  });
});
