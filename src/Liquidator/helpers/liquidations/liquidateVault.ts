import operateTransaction from "./operateTransaction";
import { generateLiquidateActions } from "../";
import Liquidator from "../..";
import { ILiquidateArgs } from "../../types";
import { Logger } from "../../../helpers";

export default async function liquidateVault(
  Liquidator: Liquidator,
  { vault, vaultOwnerAddress }: ILiquidateArgs
): Promise<void> {
  const liquidationActions = generateLiquidateActions({
    vault,
    vaultOwnerAddress,
  });

  try {
    await operateTransaction(
      liquidationActions,
      Liquidator.gasPriceStore,
      Liquidator.gasPriceStore.getLastCalculatedGasPrice().toString()
    );
  } catch (error) {
    Logger.error({
      alert: "Critical error during liquidation attempt",
      at: "Liquidator#liquidateVault",
      message: error.message,
      liquidatableVaultOwner: vaultOwnerAddress,
      roundId: vault.roundId.toString(),
      vaultId: vault.vaultId.toString(),
    });

    return;
  }

  Logger.info({
    at: "Liquidator#liquidateVault",
    message: "Vault liquidated",
    liquidatedVaultOwnerAddress: vaultOwnerAddress,
    vaultId: vault.vaultId.toString(),
  });

  const liquidatableVaults = Liquidator.vaultStore.getLiquidatableVaults();

  liquidatableVaults[vaultOwnerAddress] = liquidatableVaults[
    vaultOwnerAddress
  ].filter((storedVault) => !storedVault.vaultId.eq(vault.vaultId));

  await Liquidator.vaultStore.writeLiquidatableVaultsToDisk(liquidatableVaults);
}
