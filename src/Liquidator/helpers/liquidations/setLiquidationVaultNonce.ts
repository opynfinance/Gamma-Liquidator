import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function setLiquidationVaultNonce(
  Liquidator: Liquidator,
  { shortOtokenAddress }: ILiquidatableVault
) {
  if (Liquidator.settlementStore[shortOtokenAddress]) {
    return Liquidator.settlementStore[shortOtokenAddress];
  }

  Liquidator.settlementStore[shortOtokenAddress] =
    Liquidator.latestLiquidatorVaultNonce;

  Liquidator.latestLiquidatorVaultNonce =
    Liquidator.latestLiquidatorVaultNonce.add(1);

  return Liquidator.settlementStore[shortOtokenAddress];
}
