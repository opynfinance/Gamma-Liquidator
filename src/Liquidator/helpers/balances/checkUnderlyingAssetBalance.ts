import { BigNumber, utils } from "ethers";

import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  underlyingAssetContract,
} from "../../../helpers";

export default async function checkUnderlyingAssetBalance(): Promise<void> {
  const underlyingAssetBalance = await underlyingAssetContract.balanceOf(
    collateralCustodianAddress
  );

  if (
    underlyingAssetBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_UNDERLYING_ASSET_BALANCE)
    )
  ) {
    const underlyingAssetDecimals = await underlyingAssetContract.decimals();

    if (collateralCustodianAddress !== liquidatorAccountAddress) {
      Logger.error({
        at: "Liquidator#checkUnderlyingAssetBalance",
        message:
          "Collateral custodian underlying asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE",
        BOT_MINIMUM_UNDERYLING_ASSET_BALANCE: utils.formatUnits(
          process.env.BOT_MINIMUM_UNDERLYING_ASSET_BALANCE as string,
          underlyingAssetDecimals
        ),
        collateralCustodianAddress,
        collateralCustodianBalance: utils.formatUnits(
          underlyingAssetBalance,
          underlyingAssetDecimals
        ),
        underlyingAssetAddress: process.env.UNDERLYING_ASSET_ADDRESS,
        error: Error(
          "Collateral custodian underlying asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE."
        ),
      });

      return;
    }

    Logger.error({
      at: "Liquidator#checkUnderlyingAssetBalance",
      message:
        "Liquidator account underlying asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE",
      BOT_MINIMUM_UNDERYLING_ASSET_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_UNDERLYING_ASSET_BALANCE as string,
        underlyingAssetDecimals
      ),
      liquidatorAccountAddress,
      liquidatorAccountBalance: utils.formatUnits(
        underlyingAssetBalance,
        underlyingAssetDecimals
      ),
      underlyingAssetAddress: process.env.UNDERLYING_ASSET_ADDRESS,
      error: Error(
        "Liquidator account underlying asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE."
      ),
    });
  }
}
