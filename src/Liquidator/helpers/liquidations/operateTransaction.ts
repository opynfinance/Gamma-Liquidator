import Liquidator from "../..";
import { gammaControllerProxyContract } from "../../../helpers";

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
      60000 // 60 seconds
    );

    return;
  } catch (_error) {
    // try again
    await operateTransaction(
      transactionParams,
      gasPriceStore,
      (gasPriceStore.getLastCalculatedGasPrice() as any) * 1.1
    );
  }
}
