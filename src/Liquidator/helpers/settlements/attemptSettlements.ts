import settleVaults from "./settleVaults";
import Liquidator from "../../";
import { Logger } from "../../../helpers";

export default async function attemptSettlements(
  settleableVaults: Liquidator["vaultStore"]["settleableVaults"]
): Promise<void> {
  try {
    await settleVaults(settleableVaults);
  } catch (error) {
    Logger.error({
      at: "Liquidator#attemptSettlements",
      message: error.message,
      numberOfSettleableVaults: Object.values(settleableVaults).flat().length,
      settleableVaultNonces: Object.keys(settleableVaults).join(", "),
      shortAmounts: Object.values(settleableVaults).join(", "),
      error,
    });
  }
}
