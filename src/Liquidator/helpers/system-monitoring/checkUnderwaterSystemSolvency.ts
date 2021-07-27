import { BigNumber } from "ethers";

import slackWebhook from "../liquidations/slackWebhook";
import Liquidator from "../..";

export default async function checkUnderwaterSystemSolvency(
  vault: Liquidator["vaultStore"]["liquidatableVaults"][string][number],
  vaultId: BigNumber,
  vaultOwnerAddress: string
): Promise<void> {
  const vaultTimeUnderwaterInSeconds =
    Math.floor(Date.now() / 1000) -
    Math.floor((vault.undercollateralizedTimestamp.toString() as any) / 1000);

  await slackWebhook.send({
    text: `\nWarning: Vault liquidatable, but unliquidated for longer than 30 minutes.\n\nvaultOwner: ${vaultOwnerAddress}\nvaultId ${vaultId.toString()}\nestimated time undercollateralized: ${
      vaultTimeUnderwaterInSeconds / 60
    } minutes`,
  });
}
