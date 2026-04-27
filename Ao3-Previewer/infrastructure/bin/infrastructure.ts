import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { Ao3PreviewerStack } from "../lib/infrastructure-stack";

const app = new cdk.App();
new Ao3PreviewerStack(app, "Ao3PreviewerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
