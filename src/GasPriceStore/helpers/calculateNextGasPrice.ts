import calculateGasPriceFromGasNow from "./calculateGasPriceFromGasNow";
import calculateGasPriceFromNetwork from "./calculateGasPriceFromNetwork";
import GasPriceStore from "../";
import { Logger } from "../../helpers";

export default async function calculateNextGasPrice(
  GasPriceStore: GasPriceStore
): Promise<void> {
  let nextCalculatedGasPrice;
  try {
    // Calculate gasPrice from gasnow.org
    nextCalculatedGasPrice = await calculateGasPriceFromGasNow();
  } catch (error) {
    Logger.info({
      at: "GasPriceStore#calculateNextGasPrice",
      message: error.message,
      error,
    });

    try {
      // Calculate gasPrice from the network
      nextCalculatedGasPrice = await calculateGasPriceFromNetwork();
    } catch (error) {
      Logger.error({
        alert: "Critical error when fetching and calculating latest gas price",
        at: "GasPriceStore#calculateNextGasPrice",
        context: "gasnow.org API and on-chain gasPrice call failed",
        message: error.message,
        error,
      });

      return;
    }

    return;
  }

  if (!nextCalculatedGasPrice.eq(GasPriceStore.getLastCalculatedGasPrice())) {
    GasPriceStore.setLastCalculatedGasPrice(nextCalculatedGasPrice);

    Logger.info({
      at: "GasPriceStore#calculateNextGasPrice",
      message: "Gas price updated",
      lastCalculatedGasPrice:
        GasPriceStore.getLastCalculatedGasPrice().toString(),
    });
  }
}
