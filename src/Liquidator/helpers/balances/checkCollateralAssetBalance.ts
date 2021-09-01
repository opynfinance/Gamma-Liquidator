import { BigNumber, ethers, utils } from "ethers";

import { erc20ABI } from "../abis";
import Liquidator from "../..";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  provider,
  triggerPagerDutyNotification,
} from "../../../helpers";

export default async function checkCollateralAssetBalance(
  collateralAssetMarginRequirement: number,
  collateralAssetDecimals: BigNumber,
  liquidatableVaultOwner: string,
  {
    collateralAssetAddress,
    vaultId,
  }: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): Promise<boolean> {
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
      const message =
        "Collateral custodian collateral asset balance less than liquidation collateral asset naked margin requirement";

      Logger.error({
        at: "Liquidator#checkCollateralAssetBalance",
        message,
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

      if (process.env.PAGERDUTY_ROUTING_KEY) {
        await triggerPagerDutyNotification(message);
      }

      return false;
    }

    const message =
      "Liquidator account collateral asset balance less than liquidation collateral asset naked margin requirement.";

    Logger.error({
      at: "Liquidator#checkCollateralAssetBalance",
      message,
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

    if (process.env.PAGERDUTY_ROUTING_KEY) {
      await triggerPagerDutyNotification(message);
    }

    return false;
  }

  return true;
}
