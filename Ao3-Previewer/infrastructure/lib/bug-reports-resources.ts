import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ses from "aws-cdk-lib/aws-ses";
import * as path from "path";
import { Construct } from "constructs";
import { bugReportEmailTemplates, type EmailEnv } from "../functions/shared/bugReportEmails";

const bundlingConfig = { externalModules: ["@aws-sdk/*"] };

// Requests per second (and burst) allowed on POST /bug-reports, across all callers
const BUG_REPORT_RATE_LIMIT = 1;
const BUG_REPORT_BURST_LIMIT = 5;

export interface BugReportEmailConfig {
  toEmail: string;
  fromEmail: string;
  // Which set of SES templates to create and send with. Defaults to prod.
  env?: EmailEnv;
}

export function addBugReportsResources(
  stack: Construct,
  api: apigateway.RestApi,
  allowedOrigin?: string,
  email?: BugReportEmailConfig,
) {
  // ─── Storage ───────────────────────────────────────────────

  // Unlike drafts, reports are retained if the stack is torn down or these resources are
  // replaced, so iterating on the stack never loses reports that haven't been triaged yet.
  // Data still expires after 90 days via the lifecycle rule and ttl.
  const bugReportsBucket = new s3.Bucket(stack, "BugReportsBucket", {
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
    lifecycleRules: [
      {
        // Matches BugReportsTable's 90-day ttl. Reports contain users' fic text.
        expiration: cdk.Duration.days(90),
      },
    ],
  });

  const bugReportsTable = new dynamodb.Table(stack, "BugReportsTable", {
    partitionKey: {
      name: "id",
      type: dynamodb.AttributeType.STRING,
    },
    timeToLiveAttribute: "ttl",
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  });

  // ─── Lambda Function ───────────────────────────────────────

  const createBugReportFn = new lambdaNodejs.NodejsFunction(stack, "CreateBugReportFunction", {
    entry: path.join(__dirname, "../functions/createBugReport/index.ts"),
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: {
      BUG_REPORTS_TABLE_NAME: bugReportsTable.tableName,
      BUG_REPORTS_BUCKET_NAME: bugReportsBucket.bucketName,
      ...(allowedOrigin ? { ALLOWED_ORIGIN: allowedOrigin } : {}),
      ...(email
        ? { CONTACT_EMAIL: email.toEmail, SES_FROM_EMAIL: email.fromEmail, EMAIL_ENV: email.env ?? "prod" }
        : {}),
    },
    bundling: bundlingConfig,
  });

  bugReportsTable.grantWriteData(createBugReportFn);
  bugReportsBucket.grantPut(createBugReportFn);

  if (email) {
    // Templates live in functions/shared/bugReportEmails.ts, shared with the Lambda and
    // scripts/followup.ts. Names are fixed per env, so only one stack per env may create them.
    for (const template of bugReportEmailTemplates(email.env ?? "prod")) {
      new ses.CfnTemplate(stack, `${template.name}Template`, {
        template: {
          templateName: template.name,
          subjectPart: template.subject,
          htmlPart: template.html,
          textPart: template.text,
        },
      });
    }

    createBugReportFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendTemplatedEmail"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "ses:FromAddress": email.fromEmail,
          },
        },
      }),
    );
  }

  // ─── API Gateway ───────────────────────────────────────────

  const bugReports = api.root.addResource("bug-reports");
  bugReports.addMethod("POST", new apigateway.LambdaIntegration(createBugReportFn));

  // Tighter throttle for this route than the API-wide stage limit, so a flood of reports can't
  // spam the inbox, fill the bucket, or use up the shared limit that drafts and previews rely on.
  // Stage method settings are normally set in RestApi's deployOptions (in each stack); appending
  // here keeps the limit next to the route it protects. Like the stage-wide limit, this applies to
  // all callers combined, not per IP.
  const stage = api.deploymentStage.node.defaultChild as apigateway.CfnStage;
  const existingSettings = Array.isArray(stage.methodSettings) ? stage.methodSettings : [];
  stage.methodSettings = [
    ...existingSettings,
    {
      httpMethod: "POST",
      resourcePath: "/~1bug-reports", // "/bug-reports", with "/" escaped as "~1" per API Gateway
      throttlingRateLimit: BUG_REPORT_RATE_LIMIT,
      throttlingBurstLimit: BUG_REPORT_BURST_LIMIT,
    },
  ];

  // Used by scripts/followup.ts to find the table.
  new cdk.CfnOutput(stack, "BugReportsTableName", {
    value: bugReportsTable.tableName,
    description: "Bug reports table (read by `npm run followup`)",
  });

  return { bugReportsTable, bugReportsBucket, createBugReportFn };
}
