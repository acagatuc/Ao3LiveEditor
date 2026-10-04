import { describe, it, expect, jest } from "@jest/globals";
import { findTableName, getReport, isFollowUpStatus, sendFollowUp } from "../scripts/followup";
import { bugReportEmailTemplates, templateNames } from "../functions/shared/bugReportEmails";
import { templateVariables } from "./templateVariables";

type SentCommand = { input: Record<string, any> };

function sender(...responses: unknown[]) {
  const send = jest.fn<(command: unknown) => Promise<any>>();
  for (const response of responses) send.mockResolvedValueOnce(response);
  send.mockResolvedValue({});
  return { send };
}

const REPORT = { id: "abc123", intent: "A texting skin", contactEmail: "reader@example.com" };

describe("followup script", () => {
  it("accepts only the known statuses", () => {
    expect(isFollowUpStatus("fixed")).toBe(true);
    expect(isFollowUpStatus("not-a-bug")).toBe(true);
    expect(isFollowUpStatus("looking-into-it")).toBe(true);
    expect(isFollowUpStatus("toString")).toBe(false);
    expect(isFollowUpStatus("done")).toBe(false);
  });

  it("finds the prod bug reports table across pages of tables", async () => {
    const dynamo = sender(
      { TableNames: ["Other"], LastEvaluatedTableName: "Other" },
      { TableNames: ["Ao3PreviewerStack-BugReportsTableE7464EEB-XYZ", "Ao3PreviewerDevStack-BugReportsTable-1"] },
    );
    await expect(findTableName(dynamo, "prod")).resolves.toBe("Ao3PreviewerStack-BugReportsTableE7464EEB-XYZ");
  });

  it("finds the dev table when following up on a dev report", async () => {
    const dynamo = sender({
      TableNames: ["Ao3PreviewerStack-BugReportsTableE7464EEB-XYZ", "Ao3PreviewerDevStack-BugReportsTable1234-ABC"],
    });
    await expect(findTableName(dynamo, "dev")).resolves.toBe("Ao3PreviewerDevStack-BugReportsTable1234-ABC");
  });

  it("sends dev follow-ups with the dev template", async () => {
    const ses = sender();
    await sendFollowUp({
      docClient: sender(),
      ses,
      tableName: "table",
      env: "dev",
      report: REPORT,
      status: "looking-into-it",
      message: "",
      from: "a@b.co",
      bcc: "c@d.co",
    });
    expect((ses.send.mock.calls[0]![0] as SentCommand).input.Template).toBe("FicFormatterBugReportFollowUpDev");
  });

  it("refuses to guess when the table can't be found", async () => {
    await expect(findTableName(sender({ TableNames: [] }), "prod")).rejects.toThrow("BUG_REPORTS_TABLE_NAME");
  });

  it("errors clearly for a missing report or one with no contact email", async () => {
    await expect(getReport(sender({}), "t", "missing")).rejects.toThrow("No bug report");
    await expect(getReport(sender({ Item: { id: "x" } }), "t", "x")).rejects.toThrow("no contact email");
    await expect(getReport(sender({ Item: REPORT }), "t", "abc123")).resolves.toEqual(REPORT);
  });

  it("emails the reporter with every template variable, then records the new status", async () => {
    const ses = sender();
    const docClient = sender();
    await sendFollowUp({
      docClient,
      ses,
      tableName: "table",
      env: "prod",
      report: REPORT,
      status: "fixed",
      message: "It works now!",
      from: "noreply@ficformatter.com",
      bcc: "me@example.com",
    });

    const email = (ses.send.mock.calls[0]![0] as SentCommand).input;
    expect(email.Template).toBe(templateNames("prod").followUp);
    expect(email.Destination.ToAddresses).toEqual(["reader@example.com"]);
    // The maintainer only gets a hidden BCC; their address isn't anywhere the reporter can see.
    expect(email.Destination.BccAddresses).toEqual(["me@example.com"]);
    expect(email.ReplyToAddresses).toBeUndefined();
    expect(email.Destination.ToAddresses).not.toContain("me@example.com");
    const data = JSON.parse(email.TemplateData);
    const followUp = bugReportEmailTemplates("prod").find((t) => t.key === "followUp")!;
    expect(Object.keys(data).sort()).toEqual(templateVariables(followUp));
    expect(data).toMatchObject({ headline: "Your bug report has been fixed", message: "It works now!" });

    const update = (docClient.send.mock.calls[0]![0] as SentCommand).input;
    expect(update.Key).toEqual({ id: "abc123" });
    expect(update.ExpressionAttributeValues[":status"]).toBe("fixed");
  });

  it("does not record the status if the email fails", async () => {
    const ses = { send: jest.fn<(command: unknown) => Promise<any>>().mockRejectedValue(new Error("SES down")) };
    const docClient = sender();
    await expect(
      sendFollowUp({
        docClient,
        ses,
        tableName: "table",
        env: "prod",
        report: REPORT,
        status: "fixed",
        message: "",
        from: "a@b.co",
        bcc: "c@d.co",
      }),
    ).rejects.toThrow("SES down");
    expect(docClient.send).not.toHaveBeenCalled();
  });
});
