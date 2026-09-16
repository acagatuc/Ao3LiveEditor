import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

const bundlingConfig = { externalModules: ["@aws-sdk/*"] };

export function addDraftsResources(
  stack: Construct,
  api: apigateway.RestApi,
  allowedOrigin?: string,
) {
  // ─── Storage ───────────────────────────────────────────────

  const draftsBucket = new s3.Bucket(stack, "DraftsBucket", {
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    lifecycleRules: [
      {
        // Mirrors DraftsTable's rolling 180-day ttl: both are refreshed on every save
        // (this rule keys off S3's LastModified, which resets on every overwrite PUT).
        expiration: cdk.Duration.days(180),
      },
    ],
  });

  const draftsTable = new dynamodb.Table(stack, "DraftsTable", {
    partitionKey: {
      name: "id",
      type: dynamodb.AttributeType.STRING,
    },
    timeToLiveAttribute: "ttl",
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  // ─── Lambda Functions ──────────────────────────────────────

  const commonEnv: Record<string, string> = {
    DRAFTS_TABLE_NAME: draftsTable.tableName,
    DRAFTS_BUCKET_NAME: draftsBucket.bucketName,
    ...(allowedOrigin ? { ALLOWED_ORIGIN: allowedOrigin } : {}),
  };

  const createDraftFn = new lambdaNodejs.NodejsFunction(stack, "CreateDraftFunction", {
    entry: path.join(__dirname, "../functions/createDraft/index.ts"),
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: commonEnv,
    bundling: bundlingConfig,
  });

  const updateDraftFn = new lambdaNodejs.NodejsFunction(stack, "UpdateDraftFunction", {
    entry: path.join(__dirname, "../functions/updateDraft/index.ts"),
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: commonEnv,
    bundling: bundlingConfig,
  });

  const getDraftFn = new lambdaNodejs.NodejsFunction(stack, "GetDraftFunction", {
    entry: path.join(__dirname, "../functions/getDraft/index.ts"),
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: commonEnv,
    bundling: bundlingConfig,
  });

  const deleteDraftFn = new lambdaNodejs.NodejsFunction(stack, "DeleteDraftFunction", {
    entry: path.join(__dirname, "../functions/deleteDraft/index.ts"),
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: commonEnv,
    bundling: bundlingConfig,
  });

  draftsTable.grantWriteData(createDraftFn);
  draftsBucket.grantPut(createDraftFn);

  draftsTable.grantReadWriteData(updateDraftFn);
  draftsBucket.grantPut(updateDraftFn);

  draftsTable.grantReadData(getDraftFn);
  draftsBucket.grantRead(getDraftFn);

  draftsTable.grantWriteData(deleteDraftFn);
  draftsBucket.grantDelete(deleteDraftFn);

  // ─── API Gateway ───────────────────────────────────────────

  const drafts = api.root.addResource("drafts");
  drafts.addMethod("POST", new apigateway.LambdaIntegration(createDraftFn));

  const draft = drafts.addResource("{id}");
  draft.addMethod("GET", new apigateway.LambdaIntegration(getDraftFn));
  draft.addMethod("PUT", new apigateway.LambdaIntegration(updateDraftFn));
  draft.addMethod("DELETE", new apigateway.LambdaIntegration(deleteDraftFn));

  // Note: brute-force throttling of GET /drafts/{id} (ids are private-by-obscurity, 128-bit
  // random) is applied via stage-level `deployOptions.throttlingRateLimit`/`throttlingBurstLimit`
  // on the RestApi itself, in infrastructure-stack.ts / dev-stack.ts. A bare UsagePlan does
  // nothing here — it only rate-limits requests that present an associated API key, and these
  // are anonymous, unauthenticated endpoints.

  return { draftsTable, draftsBucket, createDraftFn, updateDraftFn, getDraftFn, deleteDraftFn };
}
