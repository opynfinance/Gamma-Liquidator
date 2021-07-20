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
      liquidatorAccountAddress,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (underlyingAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message: "Underlying asset margin pool allowance less than or equal to 0",
      liquidatorAccountAddress,
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
      liquidatorAccountAddress,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (strikePriceAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message:
        "Strike price asset margin pool allowance less than or equal to 0",
      liquidatorAccountAddress,
      marginPoolAddress: process.env.MARGIN_POOL_ADDRESS,
      strikePriceAssetAddress: process.env.STRIKE_PRICE_ASSET_ADDRESS,
      error: Error(
        "Strike price asset margin pool allowance less than or equal to 0."
      ),
    });

    return;
  }

  if (collateralCustodianAddress !== liquidatorAccountAddress) {
    const underlyingAssetLiquidatorAccountAllowance =
      await underlyingAssetContract.allowance(
        collateralCustodianAddress,
        liquidatorAccountAddress
      );

    if (underlyingAssetLiquidatorAccountAllowance.lte(0)) {
      Logger.error({
        at: "Liquidator#checkAssetAllowances",
        message:
          "Underlying asset liquidator account allowance less than or equal to 0",
        collateralCustodianAddress,
        liquidatorAccountAddress,
        underlyingAssetAddress: process.env.UNDERLYING_ASSET_ADDRESS,
        error: Error(
          "Underlying asset liquidator account allowance less than or equal to 0."
        ),
      });

      return;
    }

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
  }

  return;
}
