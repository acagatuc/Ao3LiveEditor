import { describe, it, expect } from "@jest/globals";
import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { addDraftsResources } from "../lib/drafts-resources";

function buildStack() {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  const api = new apigateway.RestApi(stack, "TestApi");
  addDraftsResources(stack, api, "https://ficformatter.com");
  return stack;
}

describe("addDraftsResources", () => {
  it("creates a private S3 bucket with a 180-day expiration rule", () => {
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
          Match.objectLike({ Status: "Enabled", ExpirationInDays: 180 }),
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

  it("creates all four draft Lambda functions with the allowed origin configured", () => {
    // Counting by DRAFTS_TABLE_NAME rather than a blanket resourceCountIs, since the bucket's
    // autoDeleteObjects:true also provisions a CDK-managed custom-resource Lambda that shows up
    // as an unrelated AWS::Lambda::Function in the template.
    const template = Template.fromStack(buildStack());
    const draftFns = template.findResources("AWS::Lambda::Function", {
      Properties: {
        Environment: {
          Variables: Match.objectLike({
            DRAFTS_TABLE_NAME: Match.anyValue(),
            ALLOWED_ORIGIN: "https://ficformatter.com",
          }),
        },
      },
    });
    expect(Object.keys(draftFns)).toHaveLength(4);
  });

  it("wires up POST /drafts and GET/PUT/DELETE /drafts/{id}", () => {
    const template = Template.fromStack(buildStack());
    const methods = Object.values(template.findResources("AWS::ApiGateway::Method")).map(
      (m) => (m as { Properties: { HttpMethod: string } }).Properties.HttpMethod,
    );
    expect(methods.filter((m) => m === "POST")).toHaveLength(1);
    expect(methods.filter((m) => m === "GET")).toHaveLength(1);
    expect(methods.filter((m) => m === "PUT")).toHaveLength(1);
    expect(methods.filter((m) => m === "DELETE")).toHaveLength(1);
  });

  it("omits ALLOWED_ORIGIN when none is provided, falling back to the handler default", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStackNoOrigin");
    const api = new apigateway.RestApi(stack, "TestApi");
    addDraftsResources(stack, api);
    const template = Template.fromStack(stack);
    const fns = template.findResources("AWS::Lambda::Function");
    for (const fn of Object.values(fns) as { Properties: { Environment?: { Variables?: Record<string, unknown> } } }[]) {
      expect(fn.Properties.Environment?.Variables?.ALLOWED_ORIGIN).toBeUndefined();
    }
  });
});
