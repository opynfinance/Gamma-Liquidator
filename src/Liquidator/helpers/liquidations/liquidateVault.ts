import operateTransaction from "./operateTransaction";
import { generateMintAndLiquidateActions } from "../";
import Liquidator from "../..";
import { IMintAndLiquidateArgs } from "../../types";
import { Logger } from "../../../helpers";

export default async function liquidateVault(
  Liquidator: Liquidator,
  {
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  }: IMintAndLiquidateArgs
): Promise<void> {
  const mintAndLiquidationActions = generateMintAndLiquidateActions({
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  });

  try {
    await operateTransaction(
      mintAndLiquidationActions,
      Liquidator.gasPriceStore,
      Liquidator.gasPriceStore.getLastCalculatedGasPrice().toNumber()
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
