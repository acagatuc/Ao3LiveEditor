import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { Ao3PreviewerStack } from "../lib/infrastructure-stack";
import { Ao3PreviewerDevStack } from "../lib/dev-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

if (process.env.DEPLOY_ENV === "dev") {
  new Ao3PreviewerDevStack(app, "Ao3PreviewerDevStack", { env });
} else {
  new Ao3PreviewerStack(app, "Ao3PreviewerStack", { env });
}
