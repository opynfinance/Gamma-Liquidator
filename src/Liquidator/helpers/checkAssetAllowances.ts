import { ethers } from "ethers";

import { erc20ABI } from "./abis";
import supportedLiquidationAssets from "./supportedLiquidationAssets";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  networkInfo,
  provider,
  triggerPagerDutyNotification,
} from "../../helpers";

export default async function checkAssetAllowances(): Promise<void> {
  const networkChainId = (await networkInfo).chainId.toString();

  const { strikePriceAssets, underlyingAssets } =
    supportedLiquidationAssets[networkChainId];

  for (const underlyingAssetAddress of underlyingAssets) {
    const underlyingAssetContract = new ethers.Contract(
      underlyingAssetAddress,
      erc20ABI,
      provider
    );

    const underlyingAssetMarginPoolAllowance =
      await underlyingAssetContract.allowance(
        liquidatorAccountAddress,
        process.env.MARGIN_POOL_ADDRESS
      );

    if (underlyingAssetMarginPoolAllowance.lte(0)) {
      const message =
        "Underlying asset margin pool allowance less than or equal to 0";

      Logger.error({
        at: "Liquidator#checkAssetAllowances",
        message,
        liquidatorAccountAddress,
        marginPoolAddress: process.env.MARGIN_POOL_ADDRESS,
        underlyingAssetAddress,
        error: Error(
          "Underlying asset margin pool allowance less than or equal to 0."
        ),
      });

      if (process.env.PAGERDUTY_ROUTING_KEY) {
        await triggerPagerDutyNotification(message);
      }
    }

    if (collateralCustodianAddress !== liquidatorAccountAddress) {
      const underlyingAssetLiquidatorAccountAllowance =
        await underlyingAssetContract.allowance(
          collateralCustodianAddress,
          liquidatorAccountAddress
        );

      if (underlyingAssetLiquidatorAccountAllowance.lte(0)) {
        const message =
          "Underlying asset liquidator account allowance less than or equal to 0";

        Logger.error({
          at: "Liquidator#checkAssetAllowances",
          message,
          collateralCustodianAddress,
          liquidatorAccountAddress,
          underlyingAssetAddress,
          error: Error(
            "Underlying asset liquidator account allowance less than or equal to 0."
          ),
        });

        if (process.env.PAGERDUTY_ROUTING_KEY) {
          await triggerPagerDutyNotification(message);
        }
      }
    }
  }

  for (const strikePriceAssetAddress of strikePriceAssets) {
    const strikePriceAssetContract = new ethers.Contract(
      strikePriceAssetAddress,
      erc20ABI,
      provider
    );

    const strikePriceAssetMarginPoolAllowance =
      await strikePriceAssetContract.allowance(
        liquidatorAccountAddress,
        process.env.MARGIN_POOL_ADDRESS
      );

    if (strikePriceAssetMarginPoolAllowance.lte(0)) {
      const message =
        "Strike price asset margin pool allowance less than or equal to 0";

      Logger.error({
        at: "Liquidator#checkAssetAllowances",
        message,
        liquidatorAccountAddress,
        marginPoolAddress: process.env.MARGIN_POOL_ADDRESS,
        strikePriceAssetAddress,
        error: Error(
          "Strike price asset margin pool allowance less than or equal to 0."
        ),
      });

      if (process.env.PAGERDUTY_ROUTING_KEY) {
        await triggerPagerDutyNotification(message);
      }
    }

    if (collateralCustodianAddress !== liquidatorAccountAddress) {
      const strikePriceAssetLiquidatorAccountAllowance =
        await strikePriceAssetContract.allowance(
          collateralCustodianAddress,
          liquidatorAccountAddress
        );

      if (strikePriceAssetLiquidatorAccountAllowance.lte(0)) {
        const message =
          "Strike price asset liquidator account allowance less than or equal to 0";

        Logger.error({
          at: "Liquidator#checkAssetAllowances",
          message,
          collateralCustodianAddress,
          liquidatorAccountAddress,
          strikePriceAssetAddress,
          error: Error(
            "Strike price asset liquidator account allowance less than or equal to 0."
          ),
        });

        if (process.env.PAGERDUTY_ROUTING_KEY) {
          await triggerPagerDutyNotification(message);
        }
      }
    }
  }
}
