import { BigNumber } from "ethers";

import { chainlinkAggregatorProxyContract, Logger } from "../helpers";

export interface ILatestRoundData {
  answer: BigNumber;
  roundId: BigNumber;
  updatedAt: BigNumber;
}

export default class PriceFeedStore {
  public latestRoundData: ILatestRoundData;
  public underlyingAsset: string;

  constructor() {
    this.latestRoundData = {
      answer: BigNumber.from(0),
      roundId: BigNumber.from(0),
      updatedAt: BigNumber.from(0),
    };
    this.underlyingAsset = "";
  }

  public getLatestRoundData(): ILatestRoundData {
    return this.latestRoundData;
  }

  public getUnderlyingAsset(): string {
    return this.underlyingAsset;
  }

  public setLatestRoundData(nextLatestRoundData: ILatestRoundData): void {
    this.latestRoundData = nextLatestRoundData;
  }

  public setUnderlyingAsset(underlyingAsset: string): void {
    this.underlyingAsset = underlyingAsset;
  }

  start = (): void => {
    Logger.info({
      at: "PriceFeedStore#start",
      message: "Starting price feed store",
    });
    this._subscribe();
  };

  _fetchPriceFeedPair = async (): Promise<void> => {
    try {
      const priceFeedPair =
        await chainlinkAggregatorProxyContract.description();

      this.underlyingAsset = priceFeedPair.match(/([^\s]+)/g)[0];

      Logger.info({
        at: "PriceFeedStore#_fetchPriceFeedPair",
        message: "Price feed underlying asset set",
        priceFeedPair,
        underlyingAsset: this.underlyingAsset,
      });
    } catch (error) {
      Logger.error({
        at: "PriceFeedStore#_fetchPriceFeedPair",
        message: error.message,
        error,
      });
    }
  };

  _fetchLatestRoundData = async (): Promise<void> => {
    try {
      const { answer, roundId, updatedAt } =
        await chainlinkAggregatorProxyContract.latestRoundData();

      this.latestRoundData = { answer, roundId, updatedAt };

      Logger.info({
        at: "PriceFeedStore#_fetchLatestRoundData",
        message: "Price feed store initialized",
        answer: answer.toNumber(),
        roundId: roundId.toString(),
        updatedAt: updatedAt.toNumber(),
      });
    } catch (error) {
      Logger.error({
        at: "PriceFeedStore#_fetchLatestRoundData",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async (): Promise<void> => {
    await this._fetchLatestRoundData();
    await this._fetchPriceFeedPair();

    Logger.info({
      at: "PriceFeedStore#_subscribe",
      message: "Subscribing to Chainlink Price Feed...",
      address: chainlinkAggregatorProxyContract.address,
    });

    try {
      this._subscribeToAnswerUpdatedEvents();
    } catch (error) {
      Logger.error({
        at: "PriceFeedStore#_subscribe",
        message: error.message,
        error,
      });
      this._subscribe();
    }
  };

  _subscribeToAnswerUpdatedEvents = async (): Promise<void> => {
    const chainlinkAggregatorContract = chainlinkAggregatorProxyContract.attach(
      await chainlinkAggregatorProxyContract.aggregator()
    );

    chainlinkAggregatorContract.on(
      "AnswerUpdated",
      (answerPrice, roundId, updatedTimestamp) => {
        this.latestRoundData = {
          answer: answerPrice,
          roundId,
          updatedAt: updatedTimestamp,
        };

        (process.emit as NodeJS.EventEmitter["emit"])(
          "chainlinkTimestampUpdate",
          updatedTimestamp
        );

        Logger.info({
          at: "PriceFeedStore#_subscribeToAnswerUpdatedEvents",
          message: "Price feed store updated",
          answer: answerPrice.toNumber(),
          roundId: roundId.toString(),
          updatedAt: updatedTimestamp.toNumber(),
        });
      }
    );
  };
}
