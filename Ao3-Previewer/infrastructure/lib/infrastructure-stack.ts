import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class Ao3PreviewerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── Frontend ───────────────────────────────────────────────

    const reactAppBucket = new s3.Bucket(this, "ReactAppBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const cloudFrontDistribution = new cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin:
            origins.S3BucketOrigin.withOriginAccessControl(reactAppBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new s3deploy.BucketDeployment(this, "ReactAppDeployment", {
      sources: [s3deploy.Source.asset("../frontend/dist")],
      destinationBucket: reactAppBucket,
      distribution: cloudFrontDistribution,
      distributionPaths: ["/*"],
    });

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
    const bundlingConfig = {
      externalModules: ["@aws-sdk/*"],
    };

    const createPreviewFn = new lambdaNodejs.NodejsFunction(
      this,
      "CreatePreviewFunction",
      {
        entry: path.join(__dirname, "../functions/createPreview/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PREVIEWS_TABLE_NAME: previewsTable.tableName,
        },
        bundling: bundlingConfig,
      }
    );

    const getPreviewFn = new lambdaNodejs.NodejsFunction(
      this,
      "GetPreviewFunction",
      {
        entry: path.join(__dirname, "../functions/getPreview/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PREVIEWS_TABLE_NAME: previewsTable.tableName,
        },
        bundling: bundlingConfig,
      }
    );

    // Grant Lambda functions access to DynamoDB
    previewsTable.grantWriteData(createPreviewFn);
    previewsTable.grantReadData(getPreviewFn);

    // ─── API Gateway ─────────────────────────────────────────────

    const api = new apigateway.RestApi(this, "PreviewsApi", {
      restApiName: "ao3-previewer-api",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const previews = api.root.addResource("previews");
    previews.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createPreviewFn)
    );

    const preview = previews.addResource("{id}");
    preview.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getPreviewFn)
    );

    // ─── Outputs ─────────────────────────────────────────────────

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${cloudFrontDistribution.distributionDomainName}`,
      description: "CloudFront URL for the AO3 Previewer",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });
  }
}