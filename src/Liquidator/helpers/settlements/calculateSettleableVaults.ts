import { BigNumber } from "ethers";

import Liquidator from "../../index";

export default function calculateSettleableVaults(
  Liquidator: Liquidator,
  updatedTimestamp: BigNumber
): Liquidator["settleableVaults"] {
  const settlementVaults = Liquidator.vaultStore.getSettlementVaults();
  const settledShortOtokens = Object.keys(settlementVaults);
  const settleableVaults = Liquidator.getSettleableVaults();

  for (const settledShortOtoken of settledShortOtokens) {
    const settlementVault = settlementVaults[settledShortOtoken];
    const settlementVaultNonce = Object.keys(settlementVault)[0];
    const settlementDetails = settlementVault[settlementVaultNonce];

    if (
      updatedTimestamp.gt(settlementDetails.expiryTimestamp) &&
      settlementDetails.shortAmount.gt(0)
    ) {
      settleableVaults[settlementVaultNonce] = settlementDetails.shortAmount;
    }
  }

  return settleableVaults;
}
