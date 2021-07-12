import { IncomingWebhook } from "@slack/webhook";

export const slackWebhook = new IncomingWebhook(
  process.env.SLACK_WEBHOOK as string
);

export default slackWebhook;
