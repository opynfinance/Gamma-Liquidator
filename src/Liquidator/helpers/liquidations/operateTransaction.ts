import Liquidator from "../..";
import {
  gammaControllerProxyContract,
  liquidatorAccountAddress,
  Logger,
} from "../../../helpers";

export default async function operateTransaction(
  transactionParams: Record<string, any>[],
  gasPriceStore: Liquidator["gasPriceStore"],
  gasPrice: number
): Promise<void> {
  try {
    const transaction = await gammaControllerProxyContract.operate(
      transactionParams,
      {
        gasPrice,
      }
    );

    await gammaControllerProxyContract.provider.waitForTransaction(
      transaction.hash,
      undefined,
      Number(process.env.EXPIRED_TRANSACTION_TIMEOUT) // default 60 seconds
    );

    return;
  } catch (error) {
    if (error.message.includes("cannot estimate gas")) {
      throw Error(error);
    }

    Logger.error({
      at: "Liquidator#operateTransaction",
      message:
        "Liquidation transaction timed out, retrying transaction with more gas",
      failedGasAmount: gasPrice.toString(),
      liquidatorAccountAddress,
      newGasAmount:
        (gasPriceStore.getLastCalculatedGasPrice() as any) *
        Number(process.env.EXPIRED_TRANSACTION_GAS_PRICE_MULTIPLIER),
      transactionTimeout: process.env.EXPIRED_TRANSACTION_TIMEOUT,
    });

    // try again
    await operateTransaction(
      transactionParams,
      gasPriceStore,
      (gasPriceStore.getLastCalculatedGasPrice() as any) *
        Number(process.env.EXPIRED_TRANSACTION_GAS_PRICE_MULTIPLIER) // default 1.1x
    );
  }
}
