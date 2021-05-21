import { Logger, provider } from "../helpers";

export default class GasPriceStore {
  public lastCalculatedGasPrice: any;

  constructor() {
    this.lastCalculatedGasPrice = 0;
  }

  public getLastCalculatedGasPrice() {
    return this.lastCalculatedGasPrice;
  }

  start = () => {
    Logger.info({
      at: "GasPriceStore#start",
      message: "Starting gas price store",
    });
    this._subscribe();
  };

  _calculateInitialGasPrice = async () => {
    try {
      this.lastCalculatedGasPrice = (await provider.getGasPrice())
        .mul(
          Math.round(
            Number(process.env.GAS_PRICE_MULTIPLIER as string) * 100000000
          )
        )
        .div(100000000);

      Logger.info({
        at: "GasPriceStore#_calculateInitialGasPrice",
        message: "Gas price store initialized",
        lastCalculatedGasPrice: this.lastCalculatedGasPrice.toString(),
      });
    } catch (error) {
      Logger.error({
        at: "GasPriceStore#_calculateInitialGasPrice",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async () => {
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

  _subscribeToNewBlocks = async () => {
    provider.on("block", async (_blockNumber) => {
      const nextCalculatedGasPrice = (await provider.getGasPrice())
        .mul(
          Math.round(
            Number(process.env.GAS_PRICE_MULTIPLIER as string) * 100000000
          )
        )
        .div(100000000);

      if (nextCalculatedGasPrice.gt(this.lastCalculatedGasPrice)) {
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
