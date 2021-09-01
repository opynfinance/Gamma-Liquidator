import { ethers } from "ethers";

import { chainlinkAggregatorABI } from "./abis";
import PriceFeedStore from "..";
import {
  Logger,
  networkInfo,
  provider,
  supportedChainlinkPriceFeeds,
  triggerPagerDutyNotification,
} from "../../helpers";

export default async function fetchLatestRoundData(
  PriceFeedStore: PriceFeedStore
): Promise<void> {
  try {
    const networkChainId = (await networkInfo).chainId.toString();

    const chainlinkPriceFeeds = supportedChainlinkPriceFeeds[networkChainId];

    for (const chainlinkPriceFeed in chainlinkPriceFeeds) {
      const chainlinkAggregatorProxyContract = new ethers.Contract(
        chainlinkPriceFeeds[chainlinkPriceFeed],
        chainlinkAggregatorABI,
        provider
      );

      if (
        chainlinkPriceFeed !==
        (await chainlinkAggregatorProxyContract.description())
      ) {
        const message = `Supported Chainlink Price Feed for ${chainlinkPriceFeed} does not match the description at ${chainlinkPriceFeeds[chainlinkPriceFeed]}.`;

        if (process.env.PAGERDUTY_ROUTING_KEY) {
          await triggerPagerDutyNotification(message);
        }

        throw Error(message);
      }

      const { answer, roundId, updatedAt } =
        await chainlinkAggregatorProxyContract.latestRoundData();

      PriceFeedStore.setLatestRoundData({
        [chainlinkPriceFeeds[chainlinkPriceFeed]]: {
          answer,
          roundId,
          updatedAt,
        },
      });

      Logger.info({
        at: "PriceFeedStore#fetchLatestRoundData",
        message: "Price feed store updated",
        chainlinkPriceFeedAddress: chainlinkAggregatorProxyContract.address,
        answer: answer.toString(),
        roundId: roundId.toString(),
        updatedAt: updatedAt.toString(),
      });
    }

    Logger.info({
      at: "PriceFeedStore#fetchLatestRoundData",
      message: "Price feed store initialized",
      numberOfChainlinkPriceFeeds: Object.keys(
        PriceFeedStore.getLatestRoundData()
      ).length,
    });
  } catch (error) {
    Logger.error({
      at: "PriceFeedStore#fetchLatestRoundData",
      message: error.message,
      error,
    });
  }
}
