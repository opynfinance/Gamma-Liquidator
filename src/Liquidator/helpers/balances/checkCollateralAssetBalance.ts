import { BigNumber, ethers, utils } from "ethers";

import Liquidator from "../..";
import {
  collateralCustodianAddress,
  erc20ABI,
  liquidatorAccountAddress,
  Logger,
  provider,
} from "../../../helpers";

export default async function checkCollateralAssetBalance(
  collateralAssetMarginRequirement: number,
  collateralAssetDecimals: BigNumber,
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

  const collateralAssetBalance = await collateralAssetContract.balanceOf(
    collateralCustodianAddress
  );

  if (collateralAssetBalance < collateralAssetMarginRequirement) {
    if (collateralCustodianAddress !== liquidatorAccountAddress) {
      Logger.error({
        at: "Liquidator#checkCollateralAssetBalance",
        message:
          "Collateral custodian collateral asset balance less than liquidation collateral asset naked margin requirement",
        collateralAssetAddress,
        collateralAssetMarginRequirement: utils.formatUnits(
          collateralAssetMarginRequirement,
          collateralAssetDecimals
        ),
        collateralCustodianAddress,
        collateralCustodianBalance: utils.formatUnits(
          collateralAssetBalance,
          collateralAssetDecimals
        ),
        liquidatableVaultOwner,
        vaultId: vaultId.toString(),
        error: Error(
          "Collateral custodian collateral asset balance less than liquidation collateral asset naked margin requirement."
        ),
      });

      return;
    }

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
        collateralAssetBalance,
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
