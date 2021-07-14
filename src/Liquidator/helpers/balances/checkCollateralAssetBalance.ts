import { abi as erc20ABI } from "@studydefi/money-legos/erc20";
import { BigNumber, ethers, utils } from "ethers";

import Liquidator from "../..";
import { liquidatorAccountAddress, Logger, provider } from "../../../helpers";

export default async function checkCollateralAssetBalance(
  collateralAssetMarginRequirement: BigNumber,
  liquidatableVaultOwner: string,
  {
    collateralAssetAddress,
    vaultId,
  }: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): Promise<void> {
  const collateralAssetContract = new ethers.Contract(
    collateralAssetAddress,
    erc20ABI,
    provider
  );

  const liquidatorAccountCollateralAssetBalance =
    await collateralAssetContract.balanceOf(liquidatorAccountAddress);

  if (
    liquidatorAccountCollateralAssetBalance.lt(collateralAssetMarginRequirement)
  ) {
    const collateralAssetDecimals = await collateralAssetContract.decimals();

    Logger.error({
      at: "Liquidator#checkCollateralAssetBalance",
      message:
        "Liquidator account collateral asset balance less than liquidation collateral asset naked margin requirement",
      collateralAssetAddress,
      collateralAssetMarginRequirement: utils.formatUnits(
        collateralAssetMarginRequirement,
        collateralAssetDecimals
      ),
      liquidatorAccountAddress,
      liquidatorAccountBalance: utils.formatUnits(
        liquidatorAccountCollateralAssetBalance,
        collateralAssetDecimals
      ),
      liquidatableVaultOwner,
      vaultId: vaultId.toString(),
      error: Error(
        "Liquidator account collateral asset balance less than liquidation collateral asset naked margin requirement."
      ),
    });
  }
}
