import settleVault from "./settleVault";
import { ISettleableVaults } from "../../types";
import { Logger } from "../../../helpers";

export default async function attemptSettlements(
  settleableVaults: ISettleableVaults
) {
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
        error,
      });
    }
  }
}
