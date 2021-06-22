import Liquidator from "..";

import { gammaControllerProxyContract, liquidatorAccount, Logger } from "../../helpers";

export default async function setInitialLiquidatorVaultNonce(Liquidator: Liquidator): Promise<void> {
    try {
      Liquidator.setLatestLiquidatorVaultNonce(
        (await gammaControllerProxyContract.getAccountVaultCounter(
          liquidatorAccount.address
        )).add(1));

      Logger.info({
        at: "Liquidator#setInitialLiquidatorVaultNonce",
        message: "Latest Liquidator vault nonce initialized",
        vaultNonce: Liquidator.getLatestLiquidatorVaultNonce().toString(),
      });
    } catch (error) {
      Logger.error({
        at: "Liquidator#setInitialLiquidatorVaultNonce",
        message: error.message,
        error,
      });
      setInitialLiquidatorVaultNonce(Liquidator);
    }
}
