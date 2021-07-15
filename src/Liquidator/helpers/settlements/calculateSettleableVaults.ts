import { BigNumber } from "ethers";

import Liquidator from "../../index";

export default function calculateSettleableVaults(
  { vaultStore }: Liquidator,
  updatedTimestamp: BigNumber
): Liquidator["vaultStore"]["settleableVaults"] {
  const settlementVaults = vaultStore.getSettlementVaults();
  const settlementVaultNonces = Object.keys(settlementVaults);
  const settleableVaults = vaultStore.getSettleableVaults();

  for (const settlementVaultNonce of settlementVaultNonces) {
    const settlementVault = settlementVaults[settlementVaultNonce];
    const shortOtokenAddress = Object.keys(settlementVault)[0];
    const settlementDetails = settlementVault[shortOtokenAddress];

    if (
      updatedTimestamp.gt(settlementDetails.expiryTimestamp) &&
      settlementDetails.shortAmount.gt(0)
    ) {
      settleableVaults[settlementVaultNonce] = settlementDetails.shortAmount;
    }
  }

  return settleableVaults;
}
