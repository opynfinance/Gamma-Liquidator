import { BigNumber } from "ethers";

import {
  calculateGasPriceFromGasNow,
  calculateGasPriceFromNetwork,
} from "./helpers";
import { Logger, provider } from "../helpers";

export default class GasPriceStore {
  public lastCalculatedGasPrice: BigNumber;

  constructor() {
    this.lastCalculatedGasPrice = BigNumber.from(0);
  }

  public getLastCalculatedGasPrice() {
    return this.lastCalculatedGasPrice;
  }

  start = (): void => {
    Logger.info({
      at: "GasPriceStore#start",
      message: "Starting gas price store",
    });
    this._subscribe();
  };

  _calculateInitialGasPrice = async (): Promise<void> => {
    try {
      // Calculate gasPrice from gasnow.org
      this.lastCalculatedGasPrice = await calculateGasPriceFromGasNow();
    } catch (error) {
      Logger.error({
        at: "GasPriceStore#_calculateInitialGasPrice",
        message: error.message,
        error,
      });

      // Calculate gasPrice from the network On-chain median gasPrice fallback
      this.lastCalculatedGasPrice = await calculateGasPriceFromNetwork();
    }

    Logger.info({
      at: "GasPriceStore#_calculateInitialGasPrice",
      message: "Gas price store initialized",
      lastCalculatedGasPrice: this.lastCalculatedGasPrice.toString(),
    });
  };

  _subscribe = async (): Promise<void> => {
    await this._calculateInitialGasPrice();

    Logger.info({
      at: "GasPriceStore#_subscribe",
      message: "Subscribing to new blocks...",
      network: (await provider.getNetwork()).name,
    });

    try {
      this._subscribeToNewBlocks();
    } catch (error) {
      Logger.error({
        at: "GasPriceStore#_subscribe",
        message: error.message,
        error,
      });
      this._subscribe();
    }
  };

  _subscribeToNewBlocks = async (): Promise<void> => {
    provider.on("block", async (_blockNumber) => {
      let nextCalculatedGasPrice;
      try {
        // Calculate gasPrice from gasnow.org
        nextCalculatedGasPrice = await calculateGasPriceFromGasNow();
      } catch (error) {
        Logger.error({
          at: "GasPriceStore#_subscribeToNewBlocks",
          message: error.message,
          error,
        });

        // Calculate gasPrice from the network
        nextCalculatedGasPrice = await calculateGasPriceFromNetwork();
      }

      if (!nextCalculatedGasPrice.eq(this.lastCalculatedGasPrice)) {
        this.lastCalculatedGasPrice = nextCalculatedGasPrice;

        Logger.info({
          at: "GasPriceStore#_subscribeToNewBlocks",
          message: "Gas price updated",
          lastCalculatedGasPrice: this.lastCalculatedGasPrice.toString(),
        });
      }
    });
  };
}
