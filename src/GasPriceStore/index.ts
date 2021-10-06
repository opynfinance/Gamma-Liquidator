import { BigNumber } from "ethers";

import { calculateInitialGasPrice, calculateNextGasPrice } from "./helpers";
import { Logger, networkInfo, provider } from "../helpers";

export default class GasPriceStore {
  public lastCalculatedGasPrice: BigNumber;

  constructor() {
    this.lastCalculatedGasPrice = BigNumber.from(0);
  }

  public getLastCalculatedGasPrice(): BigNumber {
    return this.lastCalculatedGasPrice;
  }

  public setLastCalculatedGasPrice(nextCalculatedGasPrice: BigNumber): void {
    console.log(nextCalculatedGasPrice.toString())
    this.lastCalculatedGasPrice = nextCalculatedGasPrice;
  }

  start = (): void => {
    Logger.info({
      at: "GasPriceStore#start",
      message: "Starting gas price store",
    });
    this._subscribe();
  };

  _subscribe = async (): Promise<void> => {
    await calculateInitialGasPrice(this);

    Logger.info({
      at: "GasPriceStore#_subscribe",
      message: "Subscribing to new blocks...",
      network: (await networkInfo).name,
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
      await calculateNextGasPrice(this);
    });
  };
}
