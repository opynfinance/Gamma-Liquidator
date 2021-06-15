import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function updateSettlementStore(
  Liquidator: Liquidator,
  liquidatorVaultNonce: BigNumber,
  { shortAmount, shortOtokenAddress }: ILiquidatableVault
) {
  return Liquidator.settlementStore[shortOtokenAddress][
    liquidatorVaultNonce.toString()
  ].shortAmount.add(shortAmount);
}
