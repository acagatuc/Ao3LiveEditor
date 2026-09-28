import { describe, it, expect } from "@jest/globals";
import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { addBugReportsResources, type BugReportEmailConfig } from "../lib/bug-reports-resources";

function buildStack(email?: BugReportEmailConfig) {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  const api = new apigateway.RestApi(stack, "TestApi");
  addBugReportsResources(stack, api, "https://ficformatter.com", email);
  return stack;
}

const EMAIL = { toEmail: "me@example.com", fromEmail: "noreply@ficformatter.com" };

describe("addBugReportsResources", () => {
  it("creates a private S3 bucket with a 90-day expiration rule", () => {
    const template = Template.fromStack(buildStack());
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({ Status: "Enabled", ExpirationInDays: 90 }),
        ]),
      },
    });
  });

  it("creates a DynamoDB table with TTL enabled on the ttl attribute", () => {
    const template = Template.fromStack(buildStack());
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      TimeToLiveSpecification: { AttributeName: "ttl", Enabled: true },
      BillingMode: "PAY_PER_REQUEST",
    });
  });

  it("retains the bucket and table when the stack is torn down", () => {
    const template = Template.fromStack(buildStack());
    template.hasResource("AWS::S3::Bucket", { DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain" });
    template.hasResource("AWS::DynamoDB::Table", { DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain" });
    // No auto-delete custom resource, which would empty the bucket on teardown.
    template.resourceCountIs("Custom::S3AutoDeleteObjects", 0);
  });

  it("wires up POST /bug-reports", () => {
    const template = Template.fromStack(buildStack());
    template.hasResourceProperties("AWS::ApiGateway::Resource", { PathPart: "bug-reports" });
    template.hasResourceProperties("AWS::ApiGateway::Method", { HttpMethod: "POST" });
  });

  it("throttles POST /bug-reports and keeps the API's stage-wide throttle", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "ThrottleStack");
    const api = new apigateway.RestApi(stack, "TestApi", {
      deployOptions: { throttlingRateLimit: 50, throttlingBurstLimit: 100 },
    });
    addBugReportsResources(stack, api);
    Template.fromStack(stack).hasResourceProperties("AWS::ApiGateway::Stage", {
      MethodSettings: Match.arrayWith([
        Match.objectLike({ HttpMethod: "*", ResourcePath: "/*", ThrottlingRateLimit: 50, ThrottlingBurstLimit: 100 }),
        Match.objectLike({
          HttpMethod: "POST",
          ResourcePath: "/~1bug-reports",
          ThrottlingRateLimit: 1,
          ThrottlingBurstLimit: 5,
        }),
      ]),
    });
  });

  it("configures email and an SES policy scoped to the from address when email is given", () => {
    const template = Template.fromStack(buildStack(EMAIL));
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: Match.objectLike({
          BUG_REPORTS_TABLE_NAME: Match.anyValue(),
          CONTACT_EMAIL: EMAIL.toEmail,
          SES_FROM_EMAIL: EMAIL.fromEmail,
        }),
      },
    });
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "ses:SendTemplatedEmail",
            Condition: { StringEquals: { "ses:FromAddress": EMAIL.fromEmail } },
          }),
        ]),
      },
    });
  });

  it("creates the three SES email templates when email is given", () => {
    const template = Template.fromStack(buildStack(EMAIL));
    template.resourceCountIs("AWS::SES::Template", 3);
    for (const name of ["FicFormatterBugReportNotice", "FicFormatterBugReportReceived", "FicFormatterBugReportFollowUp"]) {
      template.hasResourceProperties("AWS::SES::Template", {
        Template: Match.objectLike({ TemplateName: name }),
      });
    }
  });

  it("creates separate Dev-suffixed templates for the dev stack, with marked subjects", () => {
    const template = Template.fromStack(buildStack({ ...EMAIL, env: "dev" }));
    template.resourceCountIs("AWS::SES::Template", 3);
    template.hasResourceProperties("AWS::SES::Template", {
      Template: Match.objectLike({
        TemplateName: "FicFormatterBugReportNoticeDev",
        SubjectPart: Match.stringLikeRegexp("^\\[Dev\\] "),
      }),
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: { Variables: Match.objectLike({ EMAIL_ENV: "dev" }) },
    });
  });

  it("outputs the table name for the follow-up script", () => {
    Template.fromStack(buildStack()).hasOutput("BugReportsTableName", Match.anyValue());
  });

  it("omits email settings and SES permissions when no email is given", () => {
    const template = Template.fromStack(buildStack());
    const fns = template.findResources("AWS::Lambda::Function", {
      Properties: {
        Environment: { Variables: Match.objectLike({ BUG_REPORTS_TABLE_NAME: Match.anyValue() }) },
      },
    });
    for (const fn of Object.values(fns) as { Properties: { Environment: { Variables: Record<string, unknown> } } }[]) {
      expect(fn.Properties.Environment.Variables.CONTACT_EMAIL).toBeUndefined();
    }
    expect(JSON.stringify(template.findResources("AWS::IAM::Policy"))).not.toContain("ses:Send");
    template.resourceCountIs("AWS::SES::Template", 0);
  });
});
