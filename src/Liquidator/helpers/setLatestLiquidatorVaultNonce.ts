import Liquidator from "..";

import {
  gammaControllerProxyContract,
  liquidatorAccountAddress,
  Logger,
} from "../../helpers";

export default async function setLatestLiquidatorVaultNonce(
  Liquidator: Liquidator
): Promise<void> {
  try {
    Liquidator.setLatestLiquidatorVaultNonce(
      (
        await gammaControllerProxyContract.getAccountVaultCounter(
          liquidatorAccountAddress
        )
      ).add(1)
    );

    Logger.info({
      at: "Liquidator#setLatestLiquidatorVaultNonce",
      message: "Latest Liquidator vault nonce set",
      vaultNonce: Liquidator.getLatestLiquidatorVaultNonce().toString(),
    });
  } catch (error) {
    Logger.error({
      at: "Liquidator#setLatestLiquidatorVaultNonce",
      message: error.message,
      error,
    });
    setLatestLiquidatorVaultNonce(Liquidator);
  }
}
