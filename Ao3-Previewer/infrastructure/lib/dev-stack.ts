import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class Ao3PreviewerDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── DynamoDB ────────────────────────────────────────────────

    const previewsTable = new dynamodb.Table(this, "PreviewsTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "ttl",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ─── Lambda Functions ────────────────────────────────────────

    const createPreviewFn = new lambdaNodejs.NodejsFunction(
      this,
      "CreatePreviewFunction",
      {
        entry: path.join(__dirname, "../functions/createPreview/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PREVIEWS_TABLE_NAME: previewsTable.tableName,
          ALLOWED_ORIGIN: "http://localhost:5173",
        },
        bundling: { externalModules: ["@aws-sdk/*"] },
      },
    );

    const bundlingConfig = { externalModules: ["@aws-sdk/*"] };

    const getPreviewFn = new lambdaNodejs.NodejsFunction(
      this,
      "GetPreviewFunction",
      {
        entry: path.join(__dirname, "../functions/getPreview/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PREVIEWS_TABLE_NAME: previewsTable.tableName,
          ALLOWED_ORIGIN: "http://localhost:5173",
        },
        bundling: bundlingConfig,
      },
    );

    previewsTable.grantWriteData(createPreviewFn);
    previewsTable.grantReadData(getPreviewFn);

    // ─── API Gateway ─────────────────────────────────────────────

    const api = new apigateway.RestApi(this, "PreviewsApi", {
      restApiName: "ao3-previewer-api-dev",
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://localhost:5173"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const previews = api.root.addResource("previews");
    previews.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createPreviewFn),
    );

    const preview = previews.addResource("{id}");
    preview.addMethod("GET", new apigateway.LambdaIntegration(getPreviewFn));

    // ─── Outputs ─────────────────────────────────────────────────

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description:
        "Dev API Gateway URL — set this as VITE_API_URL in frontend/.env.local",
    });
  }
}
