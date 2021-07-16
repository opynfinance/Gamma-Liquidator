import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { gammaControllerProxyContract } from "../../../helpers";

export default async function calculateSettleableVaults(
  { vaultStore }: Liquidator,
  updatedTimestamp: BigNumber
): Promise<Liquidator["vaultStore"]["settleableVaults"]> {
  const settlementVaults = vaultStore.getSettlementVaults();
  const settlementVaultNonces = Object.keys(settlementVaults);
  const settleableVaults = vaultStore.getSettleableVaults();

  for await (const settlementVaultNonce of settlementVaultNonces) {
    const settlementVault = settlementVaults[settlementVaultNonce];
    const shortOtokenAddress = Object.keys(settlementVault)[0];
    const settlementDetails = settlementVault[shortOtokenAddress];

    if (
      updatedTimestamp.gt(settlementDetails.expiryTimestamp) &&
      settlementDetails.shortAmount.gt(0) &&
      (await gammaControllerProxyContract.isSettlementAllowed(
        shortOtokenAddress
      ))
    ) {
      settleableVaults[settlementVaultNonce] = settlementDetails.shortAmount;
    }
  }

  return settleableVaults;
}
