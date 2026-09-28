import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const mockDynamoSend = jest.fn();
const mockS3Send = jest.fn();
const mockSesSend = jest.fn();

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

jest.mock("@aws-sdk/client-ses", () => {
  const actual = jest.requireActual("@aws-sdk/client-ses") as object;
  return {
    ...actual,
    SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
  };
});

process.env.BUG_REPORTS_TABLE_NAME = "test-bug-reports-table";
process.env.BUG_REPORTS_BUCKET_NAME = "test-bug-reports-bucket";
process.env.CONTACT_EMAIL = "me@example.com";
process.env.SES_FROM_EMAIL = "noreply@ficformatter.com";

import { bugReportEmailTemplates, templateNames, type TemplateKey } from "../functions/shared/bugReportEmails";
import { templateVariables } from "./templateVariables";

const TEMPLATE_NAMES = templateNames("prod");

function template(key: TemplateKey) {
  return bugReportEmailTemplates("prod").find((t) => t.key === key)!;
}

/* eslint-disable @typescript-eslint/no-var-requires */
const { handler } = require("../functions/createBugReport") as {
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
};

function makeEvent(body: unknown): APIGatewayProxyEvent {
  return { body: JSON.stringify(body) } as unknown as APIGatewayProxyEvent;
}

const VALID = {
  html: '<div class="my-class">Hi</div>',
  css: ".my-class { color: red; }",
  description: "The text is red here but black on AO3",
  intent: "A texting skin",
  siteSkin: "Reversi",
  userAgent: "Mozilla/5.0 Firefox",
  viewport: "1280x800",
  appVersion: "0.12.0",
};

type SentCommand = { input: Record<string, unknown> };

describe("createBugReport handler", () => {
  beforeEach(() => {
    mockDynamoSend.mockReset().mockResolvedValue({});
    mockS3Send.mockReset().mockResolvedValue({});
    mockSesSend.mockReset().mockResolvedValue({});
  });

  it("rejects a missing description", async () => {
    const res = await handler(makeEvent({ ...VALID, description: "  " }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects a missing intent", async () => {
    const res = await handler(makeEvent({ ...VALID, intent: undefined }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects a report with no html or css", async () => {
    const res = await handler(makeEvent({ ...VALID, html: "", css: "" }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects an invalid contact email", async () => {
    const res = await handler(makeEvent({ ...VALID, contactEmail: "not-an-email" }));
    expect(res.statusCode).toBe(400);
  });

  it("rejects a site skin over 200 characters", async () => {
    const res = await handler(makeEvent({ ...VALID, siteSkin: "a".repeat(201) }));
    expect(res.statusCode).toBe(400);
  });

  it("records 'Not given' when no site skin is provided", async () => {
    await handler(makeEvent({ ...VALID, siteSkin: undefined }));
    const item = (mockDynamoSend.mock.calls[0][0] as SentCommand).input.Item as Record<string, unknown>;
    expect(item.siteSkin).toBe("Not given");
  });

  it("rejects html over the 5MB size cap", async () => {
    const res = await handler(makeEvent({ ...VALID, html: "a".repeat(5_000_001) }));
    expect(res.statusCode).toBe(413);
  });

  it("rejects css over the 25KB size cap", async () => {
    const res = await handler(makeEvent({ ...VALID, css: "a".repeat(25_001) }));
    expect(res.statusCode).toBe(413);
  });

  it("stores the code unsanitized in S3 and the metadata in DynamoDB", async () => {
    const html = "<p>x</p><script>alert(1)</script>";
    const res = await handler(makeEvent({ ...VALID, html }));
    expect(res.statusCode).toBe(201);
    const { id } = JSON.parse(res.body);
    expect(id).toMatch(/^[0-9a-f]{32}$/);

    const put = mockS3Send.mock.calls[0][0] as SentCommand;
    expect(put.input.Key).toBe(`bug-reports/${id}.json`);
    expect(JSON.parse(put.input.Body as string)).toEqual({ html, css: VALID.css });

    const item = (mockDynamoSend.mock.calls[0][0] as SentCommand).input.Item as Record<string, unknown>;
    expect(item).toMatchObject({
      id,
      status: "new",
      description: VALID.description,
      intent: VALID.intent,
      siteSkin: "Reversi",
    });
    expect(item.contactEmail).toBeUndefined();
  });

  function sesCalls() {
    return mockSesSend.mock.calls.map((call) => (call[0] as SentCommand).input as Record<string, any>);
  }
  function callsFor(template: string) {
    return sesCalls().filter((input) => input.Template === template);
  }

  it("sends you the notice with every template variable filled, and no code or Reply-To without a contact", async () => {
    await handler(makeEvent(VALID));
    expect(mockSesSend).toHaveBeenCalledTimes(1);
    const [notice] = callsFor(TEMPLATE_NAMES.notice);
    expect(notice.Destination.ToAddresses).toEqual(["me@example.com"]);
    expect(notice.ReplyToAddresses).toBeUndefined();
    const data = JSON.parse(notice.TemplateData);
    expect(Object.keys(data).sort()).toEqual(expect.arrayContaining(templateVariables(template("notice"))));
    expect(data.description).toBe(VALID.description);
    expect(data.contactEmail).toBe("");
    expect(notice.TemplateData).not.toContain("my-class");
  });

  it("keeps the notice subject on one line and short", async () => {
    await handler(makeEvent({ ...VALID, intent: "line one\nline two " + "x".repeat(200) }));
    const data = JSON.parse(callsFor(TEMPLATE_NAMES.notice)[0]!.TemplateData);
    expect(data.subjectIntent).not.toContain("\n");
    expect(data.subjectIntent.length).toBeLessThanOrEqual(80);
  });

  it("with a contact: Reply-To on your notice is the reporter, and they get a confirmation", async () => {
    await handler(makeEvent({ ...VALID, contactEmail: "reader@example.com" }));
    expect(mockSesSend).toHaveBeenCalledTimes(2);
    expect(callsFor(TEMPLATE_NAMES.notice)[0]!.ReplyToAddresses).toEqual(["reader@example.com"]);

    const received = callsFor(TEMPLATE_NAMES.received)[0]!;
    expect(received.Destination.ToAddresses).toEqual(["reader@example.com"]);
    expect(received.ReplyToAddresses).toEqual(["me@example.com"]);
    const data = JSON.parse(received.TemplateData);
    expect(Object.keys(data).sort()).toEqual(templateVariables(template("received")));
    // Nothing the reporter typed is echoed back to the address they entered.
    expect(received.TemplateData).not.toContain(VALID.description);
    expect(received.TemplateData).not.toContain(VALID.intent);
  });

  it("retries your notice without Reply-To when SES rejects it, keeping the address in the body", async () => {
    mockSesSend.mockImplementation(async (command) => {
      const input = (command as SentCommand).input as Record<string, any>;
      if (input.Template === TEMPLATE_NAMES.notice && input.ReplyToAddresses) {
        throw new Error("InvalidParameterValue");
      }
      return {};
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler(makeEvent({ ...VALID, contactEmail: "jose@example.com" }));
    expect(res.statusCode).toBe(201);
    const notices = callsFor(TEMPLATE_NAMES.notice);
    expect(notices).toHaveLength(2);
    expect(notices[1]!.ReplyToAddresses).toBeUndefined();
    expect(JSON.parse(notices[1]!.TemplateData).contact).toBe("jose@example.com");
    errorSpy.mockRestore();
  });

  it("does not retry the notice when there was no Reply-To to blame", async () => {
    mockSesSend.mockRejectedValue(new Error("SES down"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await handler(makeEvent(VALID));
    expect(mockSesSend).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("still sends your notice when the reporter's confirmation fails", async () => {
    mockSesSend.mockImplementation(async (command) => {
      if (((command as SentCommand).input as Record<string, any>).Template === TEMPLATE_NAMES.received) {
        throw new Error("SES rejected");
      }
      return {};
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler(makeEvent({ ...VALID, contactEmail: "reader@example.com" }));
    expect(res.statusCode).toBe(201);
    expect(callsFor(TEMPLATE_NAMES.notice)).toHaveLength(1);
    errorSpy.mockRestore();
  });

  it("still returns 201 when all email fails, since the report is stored", async () => {
    mockSesSend.mockRejectedValue(new Error("SES down"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler(makeEvent({ ...VALID, contactEmail: "reader@example.com" }));
    expect(res.statusCode).toBe(201);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("allows the www origin on its response", async () => {
    const event = {
      body: JSON.stringify(VALID),
      headers: { origin: "https://www.ficformatter.com" },
    } as unknown as APIGatewayProxyEvent;
    const res = await handler(event);
    expect(res.statusCode).toBe(201);
    expect(res.headers?.["Access-Control-Allow-Origin"]).toBe("https://www.ficformatter.com");
  });

  it("returns 500 when storage fails", async () => {
    mockS3Send.mockRejectedValue(new Error("S3 down"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await handler(makeEvent(VALID));
    expect(res.statusCode).toBe(500);
    expect(mockSesSend).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("createBugReport handler on the dev stack", () => {
  it("sends with the Dev templates and shows the dev follow-up command", async () => {
    mockDynamoSend.mockReset().mockResolvedValue({});
    mockS3Send.mockReset().mockResolvedValue({});
    mockSesSend.mockReset().mockResolvedValue({});
    process.env.EMAIL_ENV = "dev";
    let devHandler!: typeof handler;
    jest.isolateModules(() => {
      devHandler = (require("../functions/createBugReport") as { handler: typeof handler }).handler;
    });
    delete process.env.EMAIL_ENV;

    await devHandler(makeEvent({ ...VALID, contactEmail: "reader@example.com" }));
    const templates = mockSesSend.mock.calls.map(
      (call) => ((call[0] as SentCommand).input as Record<string, any>).Template,
    );
    expect(templates.sort()).toEqual(["FicFormatterBugReportNoticeDev", "FicFormatterBugReportReceivedDev"]);
    const notice = mockSesSend.mock.calls
      .map((call) => (call[0] as SentCommand).input as Record<string, any>)
      .find((input) => input.Template === "FicFormatterBugReportNoticeDev")!;
    expect(JSON.parse(notice.TemplateData).followUpCommand).toBe("DEPLOY_ENV=dev npm run followup --");
  });
});
