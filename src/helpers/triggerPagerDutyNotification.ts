import { event } from "@pagerduty/pdjs";
import { EventResponse } from "@pagerduty/pdjs/build/src/events";

export default async function triggerPagerDutyNotification(
  message: string
): Promise<EventResponse> {
  return event({
    data: {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY as string,
      event_action: "trigger",
      payload: {
        severity: "critical",
        source: "gamma-liquidation-bot",
        summary: message,
      },
    },
  });
}
