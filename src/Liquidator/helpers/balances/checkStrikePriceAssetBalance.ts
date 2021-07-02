import { BigNumber, utils } from "ethers";

import {
  liquidatorAccountAddress,
  Logger,
  strikePriceAssetContract,
} from "../../../helpers";

export default async function checkStrikePriceAssetBalance(): Promise<void> {
  const liquidatorAccountStrikePriceAssetBalance =
    await strikePriceAssetContract.balanceOf(liquidatorAccountAddress);

  if (
    liquidatorAccountStrikePriceAssetBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE)
    )
  ) {
    const strikePriceAssetDecimals = await strikePriceAssetContract.decimals();

    Logger.error({
      at: "Liquidator#checkStrikePriceAssetBalance",
      message:
        "Liquidator account balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE",
      BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE as string,
        strikePriceAssetDecimals
      ),
      liquidatorAccountBalance: utils.formatUnits(
        liquidatorAccountStrikePriceAssetBalance,
        strikePriceAssetDecimals
      ),
      error: Error(
        "Liquidator account balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE."
      ),
    });
  }
}
