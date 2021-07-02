import { BigNumber } from "ethers";

import Liquidator from "../../index";

export default function setLiquidationVaultNonce(
  expiryTimestamp: BigNumber,
  Liquidator: Liquidator,
  settlementVaults: Liquidator["vaultStore"]["settlementVaults"],
  {
    shortOtokenAddress,
  }: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): BigNumber {
  const liquidatorVaultNonce = Liquidator.getLatestLiquidatorVaultNonce();

  if (settlementVaults[shortOtokenAddress]) {
    settlementVaults[shortOtokenAddress][`${liquidatorVaultNonce.toString()}`] =
      {
        expiryTimestamp,
        shortAmount: BigNumber.from(0),
      };
  } else {
    settlementVaults[shortOtokenAddress] = {
      [`${liquidatorVaultNonce.toString()}`]: {
        expiryTimestamp,
        shortAmount: BigNumber.from(0),
      },
    };
  }

  Liquidator.setLatestLiquidatorVaultNonce(liquidatorVaultNonce.add(1));

  return liquidatorVaultNonce;
}
