import PriceFeedStore from "..";
import { chainlinkAggregatorProxyContract, Logger } from "../../helpers";

export default async function updateLatestRoundData(
  PriceFeedStore: PriceFeedStore
): Promise<void> {
  const { answer, roundId, updatedAt } =
    await chainlinkAggregatorProxyContract.latestRoundData();

  if (!roundId.eq(PriceFeedStore.getLatestRoundData().roundId)) {
    PriceFeedStore.setLatestRoundData({
      answer,
      roundId,
      updatedAt,
    });

    (process.emit as NodeJS.EventEmitter["emit"])(
      "chainlinkTimestampUpdate",
      updatedAt
    );

    Logger.info({
      at: "PriceFeedStore#_subscribeToAnswerUpdatedEvents",
      message: "Price feed store updated",
      answer: answer.toNumber(),
      roundId: roundId.toString(),
      updatedAt: updatedAt.toNumber(),
    });
  }

  return;
}
