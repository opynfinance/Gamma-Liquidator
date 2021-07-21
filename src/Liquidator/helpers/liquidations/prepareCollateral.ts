import { ethers } from "ethers";

import Liquidator from "../..";
import {
  collateralCustodianAddress,
  erc20ABI,
  liquidatorAccount,
  liquidatorAccountAddress,
  Logger,
} from "../../../helpers";

export default async function prepareCollateral(
  Liquidator: Liquidator,
  {
    collateralAssetAddress,
    collateralAssetMarginRequirement,
  }: Record<string, any>
): Promise<void> {
  if (collateralCustodianAddress !== liquidatorAccountAddress) {
    try {
      const collateralAssetContract = new ethers.Contract(
        collateralAssetAddress,
        erc20ABI,
        liquidatorAccount
      );

      const transaction = await collateralAssetContract.transferFrom(
        collateralCustodianAddress,
        liquidatorAccountAddress,
        collateralAssetMarginRequirement,
        { gasPrice: Liquidator.gasPriceStore.getLastCalculatedGasPrice() }
      );

      await collateralAssetContract.provider.waitForTransaction(
        transaction.hash,
        undefined,
        Number(process.env.EXPIRED_TRANSACTION_TIMEOUT) // default 60 seconds
      );

      return;
    } catch (error) {
      Logger.error({
        alert: "Critical error during collateral transferFrom attempt",
        at: "Liquidator#prepareCollateral",
        message: error.message,
        collateralAmountToTransfer: collateralAssetMarginRequirement.toString(),
        collateralAssetAddress,
        collateralCustodianAddress,
        liquidatorAccountAddress,
        error,
      });

      return;
    }
  }

  return;
}
