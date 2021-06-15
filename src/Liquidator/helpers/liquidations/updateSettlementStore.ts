import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function updateSettlementStore({
  expiryTimestamp,
  Liquidator,
  liquidatorVaultNonce,
  vault: { shortAmount, shortOtokenAddress },
}: {
  expiryTimestamp: BigNumber;
  Liquidator: Liquidator;
  liquidatorVaultNonce: BigNumber;
  vault: ILiquidatableVault;
}) {
  return Liquidator.settlementStore[shortOtokenAddress][
    liquidatorVaultNonce.toString()
  ].push({ expiryTimestamp, shortAmount });
}
