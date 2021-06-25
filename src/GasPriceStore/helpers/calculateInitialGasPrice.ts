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

    try {
      GasPriceStore.setLastCalculatedGasPrice(
        await calculateGasPriceFromNetwork()
      );
    } catch (error) {
      Logger.error({
        alert: "Critical error when fetching and calculating initial gas price",
        at: "GasPriceStore#calculateInitialGasPrice",
        context: "gasnow.org API and on-chain gasPrice call failed",
        message: error.message,
        error,
      });

      return;
    }
  }

  Logger.info({
    at: "GasPriceStore#calculateInitialGasPrice",
    message: "Gas price store initialized",
    lastCalculatedGasPrice:
      GasPriceStore.getLastCalculatedGasPrice().toString(),
  });
}
