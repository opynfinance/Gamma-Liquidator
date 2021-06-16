import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ISettleableVaults } from "../../types";

export default function calculateSettleableVaults(
  Liquidator: Liquidator,
  updatedTimestamp: BigNumber
) {
  const settleableVaults: ISettleableVaults = {};
  const settledShortOtokens = Object.keys(Liquidator.settlementStore);

  for (const settledShortOtoken of settledShortOtokens) {
    const settlementVault = Liquidator.settlementStore[settledShortOtoken];
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
