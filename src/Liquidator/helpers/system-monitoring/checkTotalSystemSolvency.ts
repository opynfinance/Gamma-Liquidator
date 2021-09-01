import slackWebhook from "../liquidations/slackWebhook";
import Liquidator from "../..";
import { triggerPagerDutyNotification } from "../../../helpers";

export default async function checkTotalSystemSolvency(
  liquidatableVaults: Liquidator["vaultStore"]["liquidatableVaults"]
): Promise<void> {
  const insolventVaults = Object.values(liquidatableVaults)
    .flat()
    .filter((vault) => vault.insolvencyAmountInUSD);

  if (insolventVaults.length > 0) {
    let totalInsolvencyInUSD = 0;

    await insolventVaults.forEach((vault) => {
      totalInsolvencyInUSD = totalInsolvencyInUSD + vault.insolvencyAmountInUSD;
    });

    const message = `\nWarning: Total system insolvency (denominated in USD): $${totalInsolvencyInUSD}`;

    await slackWebhook.send({
      text: message,
    });

    await triggerPagerDutyNotification(message);
  }

  return;
}
