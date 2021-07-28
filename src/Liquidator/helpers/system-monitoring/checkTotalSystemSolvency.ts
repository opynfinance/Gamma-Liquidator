import slackWebhook from "../liquidations/slackWebhook";
import Liquidator from "../..";

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

    await slackWebhook.send({
      text: `\nWarning: Total system insolvency (denominated in USD): $${totalInsolvencyInUSD}`,
    });
  }

  return;
}
