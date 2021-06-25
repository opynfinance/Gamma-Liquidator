import settleVault from "./settleVault";
import Liquidator from "../../";
import { Logger } from "../../../helpers";

export default async function attemptSettlements(
  settleableVaults: Liquidator["vaultStore"]["settleableVaults"]
): Promise<void> {
  const settleableVaultNonces = Object.keys(settleableVaults);

  for (
    let nonceIndex = 0;
    nonceIndex < settleableVaultNonces.length;
    nonceIndex++
  ) {
    try {
      const settleableVaultNonce = settleableVaultNonces[nonceIndex];
      const shortAmount = settleableVaults[settleableVaultNonce];

      await settleVault(settleableVaultNonce, shortAmount);
    } catch (error) {
      Logger.error({
        at: "Liquidator#attemptSettlements",
        message: error.message,
        numberOfSettleableVaults: Object.values(settleableVaults).flat().length,
        settleableVaultNonce: settleableVaultNonces[nonceIndex],
        shortAmount:
          settleableVaults[settleableVaultNonces[nonceIndex]].toString(),
        error,
      });
    }
  }
}
