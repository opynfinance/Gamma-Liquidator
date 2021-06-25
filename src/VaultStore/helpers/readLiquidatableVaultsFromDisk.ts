import { ILiquidatableVaults } from "../types";
import { Logger } from "../../helpers";
import db from "./database";

export default async function readLiquidatableVaultsFromDisk(): Promise<ILiquidatableVaults> {
  try {
    return JSON.parse(await db.get("liquidatableVaults"));
  } catch (error) {
    if (error.notFound) {
      return {};
    }

    Logger.error({
      alert: "Critical error when reading liquidatable vaults from disk",
      at: "VaultStore#readLiquidatableVaultsFromDisk",
      message: error.message,
      error,
    });

    return {};
  }
}
