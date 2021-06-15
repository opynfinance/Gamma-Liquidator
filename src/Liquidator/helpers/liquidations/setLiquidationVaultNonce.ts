import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function setLiquidationVaultNonce(
  Liquidator: Liquidator,
  { shortOtokenAddress }: ILiquidatableVault
) {
  if (Liquidator.settlementStore[shortOtokenAddress]) {
    return BigNumber.from(
      Object.keys(Liquidator.settlementStore[shortOtokenAddress])[0]
    );
  }

  const liquidatorVaultNonce = Liquidator.latestLiquidatorVaultNonce;

  Liquidator.settlementStore[shortOtokenAddress] = {
    [`${liquidatorVaultNonce.toString()}`]: [],
  };

  Liquidator.latestLiquidatorVaultNonce =
    Liquidator.latestLiquidatorVaultNonce.add(1);

  return liquidatorVaultNonce;
}
