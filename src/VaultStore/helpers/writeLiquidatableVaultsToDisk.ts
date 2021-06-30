import { ILiquidatableVaults } from "../types";
import { Logger } from "../../helpers";
import db, { vaultStorePath } from "./database";

export default async function writeLiquidatableVaultsToDisk(
  liquidatableVaults: ILiquidatableVaults
): Promise<void> {
  try {
    await db.put("liquidatableVaults", JSON.stringify(liquidatableVaults));

    Logger.info({
      at: "VaultStore#writeLiquidatableVaultsToDisk",
      message: "Liquidatable vault store updated and saved to disk",
      numberOfliquidatableVaults:
        Object.values(liquidatableVaults).flat().length,
      path: vaultStorePath,
    });
  } catch (error) {
    Logger.error({
      alert:
        "Critical error when updating and saving liquidatable vaults to disk",
      at: "VaultStore#writeLiquidatableVaultsToDisk",
      message: error.message,
      liquidatableVaults: JSON.stringify(liquidatableVaults),
      numberOfliquidatableVaults:
        Object.values(liquidatableVaults).flat().length,
      path: vaultStorePath,
      error,
    });
  }
}
