import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import { addDraftsResources } from "./drafts-resources";
import { addBugReportsResources } from "./bug-reports-resources";
import { routingFunctionCode } from "./routing-function";

export class Ao3PreviewerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── Environment Variables ───────────────────────────────────

    const certificateArn = process.env.CERTIFICATE_ARN!;
    const hostedZoneId = process.env.HOSTED_ZONE_ID!;
    const domainName = process.env.DOMAIN_NAME!;

    // ─── Frontend ───────────────────────────────────────────────

    const reactAppBucket = new s3.Bucket(this, "ReactAppBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "SiteCertificate",
      certificateArn,
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: domainName,
      },
    );

    const routingFunction = new cloudfront.Function(this, "RoutingFunction", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(routingFunctionCode(domainName)),
    });

    // Browser caching. S3 sends no Cache-Control, which leaves browsers to
    // guess, and they'd keep using a stale copy of one page's HTML (pointing at
    // an old build) after a deploy. Pages must be checked on every load (a
    // cheap 304 when unchanged); /assets/* files have content hashes in their
    // names, so they can be kept for a year.
    const revalidateHeaders = new cloudfront.ResponseHeadersPolicy(this, "RevalidateHeaders", {
      customHeadersBehavior: {
        customHeaders: [{ header: "Cache-Control", value: "no-cache", override: true }],
      },
    });
    const immutableHeaders = new cloudfront.ResponseHeadersPolicy(this, "ImmutableHeaders", {
      customHeadersBehavior: {
        customHeaders: [
          { header: "Cache-Control", value: "public, max-age=31536000, immutable", override: true },
        ],
      },
    });

    const siteOrigin = origins.S3BucketOrigin.withOriginAccessControl(reactAppBucket);

    const cloudFrontDistribution = new cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin: siteOrigin,
          responseHeadersPolicy: revalidateHeaders,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          functionAssociations: [
            {
              function: routingFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        // Hashed build output. No routing function: nothing here is a page.
        additionalBehaviors: {
          "/assets/*": {
            origin: siteOrigin,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            responseHeadersPolicy: immutableHeaders,
          },
        },
        defaultRootObject: "index.html",
        domainNames: [domainName, `www.${domainName}`],
        certificate,
        // Known routes are rewritten to real files by routingFunction, so a
        // miss here is a genuinely unknown path (mostly bots probing for
        // WordPress). S3 reports missing objects as 403 under OAC.
        errorResponses: [403, 404].map((httpStatus) => ({
          httpStatus,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        })),
      },
    );

    new route53.ARecord(this, "SiteAliasRecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(cloudFrontDistribution),
      ),
    });

    new route53.ARecord(this, "WwwAliasRecord", {
      zone: hostedZone,
      recordName: "www",
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(cloudFrontDistribution),
      ),
    });

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
        },
        bundling: bundlingConfig,
      },
    );

    // Grant Lambda functions access to DynamoDB
    previewsTable.grantWriteData(createPreviewFn);
    previewsTable.grantReadData(getPreviewFn);

    // ─── API Gateway ─────────────────────────────────────────────

    const api = new apigateway.RestApi(this, "PreviewsApi", {
      restApiName: "ao3-previewer-api",
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${domainName}`],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
      deployOptions: {
        // Guards GET /drafts/{id} against brute-force id scanning (128-bit random ids are
        // "unguessable link" privacy, not real access control — this raises the practical
        // cost). Blanket across the whole API/all callers combined; generous enough that
        // normal usage never sees it.
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
    });

    const previews = api.root.addResource("previews");
    previews.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createPreviewFn),
    );

    const preview = previews.addResource("{id}");
    preview.addMethod("GET", new apigateway.LambdaIntegration(getPreviewFn));

    const contactFormFn = new lambdaNodejs.NodejsFunction(
      this,
      "ContactFormFunction",
      {
        entry: path.join(__dirname, "../functions/contactForm/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          CONTACT_EMAIL: process.env.CONTACT_EMAIL!,
          SES_FROM_EMAIL: process.env.SES_FROM_EMAIL!,
        },
        bundling: bundlingConfig,
      }
    );

    contactFormFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "ses:FromAddress": process.env.SES_FROM_EMAIL!,
          },
        },
      })
    );

    const contact = api.root.addResource("contact");
    contact.addMethod("POST", new apigateway.LambdaIntegration(contactFormFn));

    // ─── Drafts ──────────────────────────────────────────────────

    addDraftsResources(this, api);

    // ─── Bug Reports ─────────────────────────────────────────────

    addBugReportsResources(this, api, undefined, {
      toEmail: process.env.CONTACT_EMAIL!,
      fromEmail: process.env.SES_FROM_EMAIL!,
    });

    // ─── Outputs ─────────────────────────────────────────────────

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${cloudFrontDistribution.distributionDomainName}`,
      description: "CloudFront URL for the AO3 Previewer",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });

    new cdk.CfnOutput(this, "DomainUrl", {
      value: `https://${domainName}`,
      description: "Custom domain URL",
    });
  }
}
