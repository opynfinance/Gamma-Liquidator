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

  await gammaControllerProxyContract.operate(mintAndLiquidationActions);

  Logger.info({
    at: "Liquidator#attemptLiquidations",
    message: "Vault liquidated",
    liquidatedVaultOwnerAddress: vaultOwnerAddress,
    vaultId: vault.vaultId.toString(),
  });

  return updateSettlementStore(Liquidator, liquidatorVaultNonce, vault);
}
