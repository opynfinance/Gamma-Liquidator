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
    collateralAssetNakedMarginRequirement: collateralAmountToPurchase,
    vaultLatestUnderlyingPrice,
  }: Record<string, BigNumber>
): Promise<any> {
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
        (((collateralAmountToPurchase.toNumber() /
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

      if (collateralAmountReceived.lt(collateralAmountToPurchase)) {
        Logger.error({
          alert: "Critical error during collateral purchase",
          at: "Liquidator#prepareCallCollateral",
          message:
            "collateral amount received from swap less than collateral needed to liquidate",
          error: Error("Critical error during collateral purchase."),
        });
      }

      return;
    } catch (error) {
      Logger.error({
        alert: "Critical error during collateral purchase attempt",
        at: "Liquidator#prepareCallCollateral",
        message: error.message,
        error,
      });
    }
  } else {
    return;
  }
}
