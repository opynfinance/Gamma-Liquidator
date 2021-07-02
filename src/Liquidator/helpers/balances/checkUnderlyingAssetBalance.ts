import { BigNumber, utils } from "ethers";

import {
  liquidatorAccountAddress,
  Logger,
  underlyingAssetContract,
} from "../../../helpers";

export default async function checkUnderlyingAssetBalance(): Promise<void> {
  const liquidatorAccountUnderlyingAssetBalance =
    await underlyingAssetContract.balanceOf(liquidatorAccountAddress);

  if (
    liquidatorAccountUnderlyingAssetBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_UNDERLYING_ASSET_BALANCE)
    )
  ) {
    const underlyingAssetDecimals = await underlyingAssetContract.decimals();

    Logger.error({
      at: "Liquidator#checkUnderlyingAssetBalance",
      message:
        "Liquidator account underlying asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE",
      BOT_MINIMUM_UNDERYLING_ASSET_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_UNDERLYING_ASSET_BALANCE as string,
        underlyingAssetDecimals
      ),
      liquidatorAccountBalance: utils.formatUnits(
        liquidatorAccountUnderlyingAssetBalance,
        underlyingAssetDecimals
      ),
      error: Error(
        "Liquidator account underyling asset balance less than BOT_MINIMUM_UNDERLYING_ASSET_BALANCE."
      ),
    });
  }
}
