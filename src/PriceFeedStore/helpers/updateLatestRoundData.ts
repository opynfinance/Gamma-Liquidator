import { BigNumber } from "ethers";

import PriceFeedStore from "..";
import { chainlinkAggregatorProxyContract, Logger } from "../../helpers";

export default async function updateLatestRoundData(
  PriceFeedStore: PriceFeedStore,
  { answer, updatedAt }: Record<string, BigNumber>
): Promise<void> {
  const { roundId } = await chainlinkAggregatorProxyContract.latestRoundData();

  PriceFeedStore.setLatestRoundData({
    answer,
    roundId,
    updatedAt,
  });

  Logger.info({
    at: "PriceFeedStore#_subscribeToAnswerUpdatedEvents",
    message: "Price feed store updated",
    answer: answer.toString(),
    roundId: roundId.toString(),
    updatedAt: updatedAt.toString(),
  });
}
