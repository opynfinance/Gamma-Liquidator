import calculateGasPriceFromGasNow from "./calculateGasPriceFromGasNow";
import calculateGasPriceFromNetwork from "./calculateGasPriceFromNetwork";
import GasPriceStore from "../";
import { Logger } from "../../helpers";

export default async function calculateInitialGasPrice(
  GasPriceStore: GasPriceStore
): Promise<void> {
  try {
    GasPriceStore.setLastCalculatedGasPrice(
      await calculateGasPriceFromGasNow()
    );
  } catch (error) {
    Logger.error({
      at: "GasPriceStore#calculateInitialGasPrice",
      message: error.message,
      error,
    });

    GasPriceStore.setLastCalculatedGasPrice(
      await calculateGasPriceFromNetwork()
    );
  }

  Logger.info({
    at: "GasPriceStore#calculateInitialGasPrice",
    message: "Gas price store initialized",
    lastCalculatedGasPrice:
      GasPriceStore.getLastCalculatedGasPrice().toString(),
  });
}
