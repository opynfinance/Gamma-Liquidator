import { BigNumber, utils } from "ethers";

import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  strikePriceAssetContract,
} from "../../../helpers";

export default async function checkStrikePriceAssetBalance(): Promise<void> {
  const strikePriceAssetBalance = await strikePriceAssetContract.balanceOf(
    collateralCustodianAddress
  );

  if (
    strikePriceAssetBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE)
    )
  ) {
    const strikePriceAssetDecimals = await strikePriceAssetContract.decimals();

    if (collateralCustodianAddress !== liquidatorAccountAddress) {
      Logger.error({
        at: "Liquidator#checkStrikePriceAssetBalance",
        message:
          "Collateral custodian strike price asset balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE",
        BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE: utils.formatUnits(
          process.env.BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE as string,
          strikePriceAssetDecimals
        ),
        collateralCustodianAddress,
        collateralCustodianBalance: utils.formatUnits(
          strikePriceAssetBalance,
          strikePriceAssetDecimals
        ),
        strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
        error: Error(
          "Collateral custodian strike price asset balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE."
        ),
      });

      return;
    }

    Logger.error({
      at: "Liquidator#checkStrikePriceAssetBalance",
      message:
        "Liquidator account strike price asset balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE",
      BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE as string,
        strikePriceAssetDecimals
      ),
      liquidatorAccountAddress,
      liquidatorAccountBalance: utils.formatUnits(
        strikePriceAssetBalance,
        strikePriceAssetDecimals
      ),
      strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
      error: Error(
        "Liquidator account strike price asset balance less than BOT_MINIMUM_STRIKE_PRICE_ASSET_BALANCE."
      ),
    });
  }
}
