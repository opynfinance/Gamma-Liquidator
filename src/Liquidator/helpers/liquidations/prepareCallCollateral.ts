import { abi as erc20ABI } from "@studydefi/money-legos/erc20";
import { router02 as uniswapV2Router02 } from "@studydefi/money-legos/uniswapV2";
import { BigNumber, ethers, constants } from "ethers";

import Liquidator from "../..";
import {
  collateralCustodianAddress,
  liquidatorAccount,
  liquidatorAccountAddress,
  Logger,
} from "../../../helpers";

export default async function prepareCallCollateral(
  Liquidator: Liquidator,
  {
    collateralAssetDecimals,
    collateralAssetNakedMarginRequirement: collateralAmountNeededToPurchase,
    vaultLatestUnderlyingPrice,
  }: Record<string, BigNumber>
): Promise<void> {
  if (
    process.env.PURCHASE_CALL_COLLATERAL &&
    collateralCustodianAddress !== liquidatorAccountAddress
  ) {
    try {
      const strikePriceAssetContract = new ethers.Contract(
        process.env.STRIKE_PRICE_ASSET_ADDRESS as string,
        erc20ABI,
        liquidatorAccount
      );

      const strikePriceAssetDecimals =
        await strikePriceAssetContract.decimals();

      const safetyBuffer = 1.5;

      const calculatedAmountToTransferAndPurchaseCallCollateral =
        (((collateralAmountNeededToPurchase.toNumber() /
          10 ** collateralAssetDecimals.toNumber()) *
          vaultLatestUnderlyingPrice.toNumber()) /
          10 ** 8) *
        strikePriceAssetDecimals.toNumber() *
        safetyBuffer;

      await strikePriceAssetContract.transferFrom(
        collateralCustodianAddress,
        liquidatorAccountAddress,
        calculatedAmountToTransferAndPurchaseCallCollateral,
        { gasPrice: Liquidator.gasPriceStore.getLastCalculatedGasPrice() }
      );

      const uniswapV2Router02Contract = new ethers.Contract(
        uniswapV2Router02.address,
        uniswapV2Router02.abi,
        liquidatorAccount
      );

      const purchaseCollateralSwapPath = [
        process.env.STRIKE_PRICE_ASSET_ADDRESS, // input ->
        process.env.UNDERLYING_ASSET_ADDRESS, // output
      ];

      const [, collateralAmountReceived] =
        await uniswapV2Router02Contract.swapExactTokensForTokens(
          calculatedAmountToTransferAndPurchaseCallCollateral,
          0,
          purchaseCollateralSwapPath,
          collateralCustodianAddress,
          constants.MaxUint256,
          { gasPrice: Liquidator.gasPriceStore.getLastCalculatedGasPrice() }
        );

      if (collateralAmountReceived.lt(collateralAmountNeededToPurchase)) {
        Logger.error({
          alert: "Critical error during collateral purchase",
          at: "Liquidator#prepareCallCollateral",
          message:
            "collateral amount received from swap less than collateral needed to liquidate",
          collateralAmountNeededToPurchase:
            collateralAmountNeededToPurchase.toNumber() /
            10 ** collateralAssetDecimals.toNumber(),
          collateralAmountReceived:
            collateralAmountReceived.toNumber() /
            10 ** collateralAssetDecimals.toNumber(),
          error: Error("Critical error during collateral purchase."),
        });
      }

      return;
    } catch (error) {
      Logger.error({
        alert: "Critical error during collateral purchase attempt",
        at: "Liquidator#prepareCallCollateral",
        message: error.message,
        collateralAmountNeededToPurchase:
          collateralAmountNeededToPurchase.toNumber() /
          10 ** collateralAssetDecimals.toNumber(),
        purchaseCollateralSwapPath: [
          process.env.STRIKE_PRICE_ASSET_ADDRESS,
          process.env.UNDERLYING_ASSET_ADDRESS,
        ],
        uniswapV2Router02Address: uniswapV2Router02.address,
        vaultLatestUnderlyingPrice: vaultLatestUnderlyingPrice.toString(),
        error,
      });
    }
  } else {
    return;
  }
}
