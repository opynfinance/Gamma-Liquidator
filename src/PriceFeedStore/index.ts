import { BigNumber } from "ethers";

import {
  fetchLatestRoundData,
  fetchPriceFeedPair,
  updateLatestRoundData,
} from "./helpers";
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

  _subscribe = async (): Promise<void> => {
    await fetchLatestRoundData(this);
    await fetchPriceFeedPair(this);

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
        chainlinkAggregatorProxyContractAddress:
          chainlinkAggregatorProxyContract.address,
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
        updateLatestRoundData(this, {
          answer: answerPrice,
          roundId,
          updatedAt: updatedTimestamp,
        });
      }
    );
  };
}
