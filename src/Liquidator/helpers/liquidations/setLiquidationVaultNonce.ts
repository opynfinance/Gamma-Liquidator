import { BigNumber } from "ethers";

import Liquidator from "../../index";

export default function setLiquidationVaultNonce(
  Liquidator: Liquidator
): BigNumber {
  const liquidatorVaultNonce = Liquidator.getLatestLiquidatorVaultNonce();

  Liquidator.setLatestLiquidatorVaultNonce(liquidatorVaultNonce.add(1));

  return liquidatorVaultNonce;
}
