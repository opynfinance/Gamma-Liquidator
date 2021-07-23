import settleVaults from "./settleVaults";
import Liquidator from "../../";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
} from "../../../helpers";

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

    return;
  }

  Logger.info({
    at: "Liquidator#mintAndLiquidateVault",
    message: "Vaults settled",
    liquidatorAccountAddress,
    numberOfSettledVaults: Object.values(settleableVaults).flat().length,
    settledCollateralRecipient: collateralCustodianAddress,
  });
}
