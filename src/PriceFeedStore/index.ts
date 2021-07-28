import { ethers } from "ethers";

import {
  chainlinkAggregatorABI,
  fetchLatestRoundData,
  updateLatestRoundData,
} from "./helpers";
import { ILatestRoundData } from "./types";
import { Logger, provider } from "../helpers";

export default class PriceFeedStore {
  public latestRoundData: ILatestRoundData;

  constructor() {
    this.latestRoundData = {};
  }

  public getLatestRoundData(): ILatestRoundData {
    return this.latestRoundData;
  }

  public setLatestRoundData(latestRoundData: ILatestRoundData): void {
    this.latestRoundData = { ...this.latestRoundData, ...latestRoundData };
  }

  start = (): void => {
    Logger.info({
      at: "PriceFeedStore#start",
      message: "Starting price feed store",
    });
    this._subscribe();
  };

  _subscribe = async (): Promise<void> => {
    await fetchLatestRoundData(this);

    Logger.info({
      at: "PriceFeedStore#_subscribe",
      message: "Subscribing to Chainlink Price Feeds...",
      numberOfChainlinkPriceFeeds: Object.keys(this.getLatestRoundData())
        .length,
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
    const chainlinkPriceFeedAddresses = Object.keys(this.getLatestRoundData());

    for (const chainlinkPriceFeedAddress of chainlinkPriceFeedAddresses) {
      const chainlinkAggregatorProxyContract = new ethers.Contract(
        chainlinkPriceFeedAddress,
        chainlinkAggregatorABI,
        provider
      );

      const chainlinkAggregatorContract =
        chainlinkAggregatorProxyContract.attach(
          await chainlinkAggregatorProxyContract.aggregator()
        );

      chainlinkAggregatorContract.on(
        "AnswerUpdated",
        (answerPrice, _roundId, updatedTimestamp) => {
          updateLatestRoundData(this, chainlinkAggregatorProxyContract, {
            answer: answerPrice,
            updatedAt: updatedTimestamp,
          });
        }
      );
    }
  };
}
