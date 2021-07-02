import { router02 as uniswapV2Router02 } from "@studydefi/money-legos/uniswapV2";

import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  strikePriceAssetContract,
  underlyingAssetContract,
} from "../../helpers";

export default async function checkAssetAllowances(): Promise<void> {
  const underlyingAssetMarginPoolAllowance =
    await underlyingAssetContract.allowance(
      collateralCustodianAddress,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (underlyingAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message: "Underlying asset margin pool allowance less than or equal to 0",
      collateralCustodianAddress,
      marginPoolAddress: process.env.MARGIN_POOL_ADDRESS,
      underlyingAssetAddress: process.env.UNDERLYING_ASSET_ADDRESS,
      error: Error(
        "Underlying asset margin pool allowance less than or equal to 0."
      ),
    });

    return;
  }

  const strikePriceAssetMarginPoolAllowance =
    await strikePriceAssetContract.allowance(
      collateralCustodianAddress,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (strikePriceAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message:
        "Strike price asset margin pool allowance less than or equal to 0",
      collateralCustodianAddress,
      marginPoolAddress: process.env.MARGIN_POOL_ADDRESS,
      strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
      error: Error(
        "Strike price asset margin pool allowance less than or equal to 0."
      ),
    });

    return;
  }

  if (
    process.env.PURCHASE_CALL_COLLATERAL &&
    collateralCustodianAddress !== liquidatorAccountAddress
  ) {
    const strikePriceAssetLiquidatorAccountAllowance =
      await strikePriceAssetContract.allowance(
        collateralCustodianAddress,
        liquidatorAccountAddress
      );

    if (strikePriceAssetLiquidatorAccountAllowance.lte(0)) {
      Logger.error({
        at: "Liquidator#checkAssetAllowances",
        message:
          "Strike price asset liquidator account allowance less than or equal to 0",
        collateralCustodianAddress,
        liquidatorAccountAddress,
        strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
        error: Error(
          "Strike price asset liquidator account allowance less than or equal to 0."
        ),
      });

      return;
    }

    const strikePriceAssetUniswapV2Router02Allowance =
      await strikePriceAssetContract.allowance(
        liquidatorAccountAddress,
        uniswapV2Router02.address
      );

    if (strikePriceAssetUniswapV2Router02Allowance.lte(0)) {
      Logger.error({
        at: "Liquidator#checkAssetAllowances",
        message:
          "Strike price asset Uniswap V2 Router02 allowance less than or equal to 0",
        liquidatorAccountAddress,
        uniswapV2Router02Address: uniswapV2Router02.address,
        strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
        error: Error(
          "Strike price asset Uniswap V2 Router02 allowance less than or equal to 0."
        ),
      });

      return;
    }
  }

  return;
}
