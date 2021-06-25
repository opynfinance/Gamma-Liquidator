import PriceFeedStore from "..";
import { chainlinkAggregatorProxyContract, Logger } from "../../helpers";

export default async function fetchPriceFeedPair(
  PriceFeedStore: PriceFeedStore
): Promise<void> {
  try {
    const { answer, roundId, updatedAt } =
      await chainlinkAggregatorProxyContract.latestRoundData();

    PriceFeedStore.setLatestRoundData({ answer, roundId, updatedAt });

    Logger.info({
      at: "PriceFeedStore#fetchLatestRoundData",
      message: "Price feed store initialized",
      answer: answer.toNumber(),
      roundId: roundId.toString(),
      updatedAt: updatedAt.toNumber(),
    });
  } catch (error) {
    Logger.error({
      at: "PriceFeedStore#fetchLatestRoundData",
      message: error.message,
      chainlinkAggregatorProxyContractAddress:
        chainlinkAggregatorProxyContract.address,
      error,
    });
  }
}
