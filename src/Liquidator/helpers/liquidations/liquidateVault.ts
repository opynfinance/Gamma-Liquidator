import { generateMintAndLiquidateActions } from "../";
import { updateSettlementStore } from "../settlements";
import Liquidator from "../..";
import { IMintAndLiquidateArgs } from "../../types";
import { gammaControllerProxyContract, Logger } from "../../../helpers";

export default async function liquidateVault(
  Liquidator: Liquidator,
  {
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  }: IMintAndLiquidateArgs
): Promise<any> {
  const mintAndLiquidationActions = generateMintAndLiquidateActions({
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  });

  try {
    const transaction = await gammaControllerProxyContract.operate(
      mintAndLiquidationActions,
      {
        gasPrice: Liquidator.gasPriceStore.getLastCalculatedGasPrice(),
      }
    );

    await transaction.wait(5);
  } catch (error) {
    Logger.error({
      alert: "Critical error during liquidation attempt",
      at: "Liquidator#liquidateVault",
      message: error.message,
      liquidatableVaultOwner: vaultOwnerAddress,
      roundId: vault.roundId.toString(),
      vaultId: vault.vaultId.toString(),
    });
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

  return updateSettlementStore(Liquidator, liquidatorVaultNonce, vault);
}
