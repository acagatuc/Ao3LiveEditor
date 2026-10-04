// Sends a follow-up email to the person who submitted a bug report, and records the new status.
//
//   npm run followup -- <reportId> <fixed|not-a-bug|looking-into-it> ["Optional message"]
//
// Prefix with DEPLOY_ENV=dev to follow up on a dev stack report, like the CDK app.
//
// Uses your local AWS credentials and the CONTACT_EMAIL / SES_FROM_EMAIL / CDK_DEFAULT_REGION
// values from infrastructure/.env. Set BUG_REPORTS_TABLE_NAME to skip the table lookup (the
// stack prints it as the BugReportsTableName output).
import { config as loadEnv } from "dotenv";
import * as readline from "readline/promises";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";
import {
  FOLLOW_UP_STATUSES,
  templateNames,
  type EmailEnv,
  type FollowUpStatus,
} from "../functions/shared/bugReportEmails";

function tablePrefix(env: EmailEnv): string {
  return `${env === "dev" ? "Ao3PreviewerDevStack" : "Ao3PreviewerStack"}-BugReportsTable`;
}

type Sender = { send: (command: any) => Promise<any> };

export function isFollowUpStatus(value: string): value is FollowUpStatus {
  return Object.prototype.hasOwnProperty.call(FOLLOW_UP_STATUSES, value);
}

export async function findTableName(dynamo: Sender, env: EmailEnv): Promise<string> {
  const prefix = tablePrefix(env);
  const names: string[] = [];
  let start: string | undefined;
  do {
    const page = await dynamo.send(new ListTablesCommand({ ExclusiveStartTableName: start }));
    names.push(...(page.TableNames ?? []));
    start = page.LastEvaluatedTableName;
  } while (start);
  const matches = names.filter((name) => name.startsWith(prefix));
  if (matches.length !== 1) {
    throw new Error(
      `Expected one table starting with ${prefix}, found ${matches.length}` +
        (matches.length ? ` (${matches.join(", ")})` : "") +
        ". Set BUG_REPORTS_TABLE_NAME to choose one.",
    );
  }
  return matches[0]!;
}

export interface Report {
  id: string;
  status?: string;
  intent?: string;
  contactEmail?: string;
  followedUpAt?: number;
}

export async function getReport(docClient: Sender, tableName: string, id: string): Promise<Report> {
  const { Item } = await docClient.send(new GetCommand({ TableName: tableName, Key: { id } }));
  if (!Item) throw new Error(`No bug report with id ${id} (it may have expired after 90 days).`);
  if (!Item.contactEmail) {
    throw new Error(`Report ${id} has no contact email, so there's no one to send a follow-up to.`);
  }
  return Item as Report;
}

export async function sendFollowUp(params: {
  docClient: Sender;
  ses: Sender;
  tableName: string;
  env: EmailEnv;
  report: Report;
  status: FollowUpStatus;
  message: string;
  from: string;
  // The maintainer's address. Only ever used as a hidden BCC, never shown to the reporter.
  bcc: string;
}): Promise<void> {
  const { headline, intro } = FOLLOW_UP_STATUSES[params.status];

  await params.ses.send(
    new SendTemplatedEmailCommand({
      Source: params.from,
      // The maintainer gets a blind copy for their records. There's deliberately no Reply-To:
      // the maintainer's address must never appear in email sent to reporters.
      Destination: { ToAddresses: [params.report.contactEmail!], BccAddresses: [params.bcc] },
      Template: templateNames(params.env).followUp,
      // Every template variable must be present, or SES fails to render after accepting the send.
      TemplateData: JSON.stringify({
        headline,
        intro,
        message: params.message,
        reportId: params.report.id,
      }),
    }),
  );

  await params.docClient.send(
    new UpdateCommand({
      TableName: params.tableName,
      Key: { id: params.report.id },
      UpdateExpression: "SET #status = :status, followedUpAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": params.status, ":now": Math.floor(Date.now() / 1000) },
    }),
  );
}

async function main() {
  loadEnv();
  const env: EmailEnv = process.env.DEPLOY_ENV === "dev" ? "dev" : "prod";
  const [id, status, ...messageParts] = process.argv.slice(2);
  const message = messageParts.join(" ").trim();
  const statuses = Object.keys(FOLLOW_UP_STATUSES).join("|");

  if (!id || !status || !isFollowUpStatus(status)) {
    console.error(`Usage: npm run followup -- <reportId> <${statuses}> ["Optional message"]`);
    process.exit(1);
  }

  const from = process.env.SES_FROM_EMAIL;
  const bcc = process.env.CONTACT_EMAIL;
  if (!from || !bcc) {
    console.error("SES_FROM_EMAIL and CONTACT_EMAIL must be set in infrastructure/.env");
    process.exit(1);
  }

  const dynamo = new DynamoDBClient({ region: process.env.CDK_DEFAULT_REGION });
  const docClient = DynamoDBDocumentClient.from(dynamo);
  const ses = new SESClient({ region: "us-east-1" });

  const tableName = process.env.BUG_REPORTS_TABLE_NAME || (await findTableName(dynamo, env));
  const report = await getReport(docClient, tableName, id);

  console.log(`\nStack:    ${env}`);
  console.log(`Report:   ${report.id}`);
  console.log(`Intent:   ${report.intent ?? ""}`);
  console.log(`Status:   ${report.status ?? "new"} -> ${status}`);
  if (report.followedUpAt) {
    console.log(`Note:     already followed up on ${new Date(report.followedUpAt * 1000).toLocaleString()}`);
  }
  console.log(`To:       ${report.contactEmail}`);
  console.log(`Copy:     ${bcc} (BCC, hidden from the reporter)`);
  console.log(`Headline: ${FOLLOW_UP_STATUSES[status].headline}`);
  console.log(`Message:  ${message || "(none)"}\n`);

  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question("Send this follow-up? (y/N) ");
  prompt.close();
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Cancelled, nothing sent.");
    return;
  }

  await sendFollowUp({ docClient, ses, tableName, env, report, status, message, from, bcc });
  console.log(`Sent, and report ${report.id} marked "${status}".`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
