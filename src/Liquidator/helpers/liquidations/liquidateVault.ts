import { generateMintAndLiquidateActions } from "../";
import { IMintAndLiquidateArgs } from "../../types";
import { gammaControllerProxyContract } from "../../../helpers";

export default async function liquidateVault({
  collateralToDeposit,
  liquidatorVaultNonce,
  vault,
  vaultOwnerAddress,
}: IMintAndLiquidateArgs) {
  const mintAndLiquidationActions = generateMintAndLiquidateActions({
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  });

  return gammaControllerProxyContract.operate(mintAndLiquidationActions);
}
