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
    Logger.error({
      at: "GasPriceStore#calculateNextGasPrice",
      message: error.message,
      error,
    });

    // Calculate gasPrice from the network
    nextCalculatedGasPrice = await calculateGasPriceFromNetwork();
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
