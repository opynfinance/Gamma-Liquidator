import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function setLiquidationVaultNonce(
  expiryTimestamp: BigNumber,
  Liquidator: Liquidator,
  settlementVaults: Liquidator["vaultStore"]["settlementVaults"],
  { shortOtokenAddress }: ILiquidatableVault
): BigNumber {
  if (settlementVaults[shortOtokenAddress]) {
    return BigNumber.from(Object.keys(settlementVaults[shortOtokenAddress])[0]);
  }

  const liquidatorVaultNonce = Liquidator.latestLiquidatorVaultNonce;

  settlementVaults[shortOtokenAddress] = {
    [`${liquidatorVaultNonce.toString()}`]: {
      expiryTimestamp,
      shortAmount: BigNumber.from(0),
    },
  };

  Liquidator.latestLiquidatorVaultNonce =
    Liquidator.latestLiquidatorVaultNonce.add(1);

  return liquidatorVaultNonce;
}
