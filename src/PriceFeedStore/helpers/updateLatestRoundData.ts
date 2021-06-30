import PriceFeedStore, { ILatestRoundData } from "..";
import { Logger } from "../../helpers";

export default function updateLatestRoundData(
  PriceFeedStore: PriceFeedStore,
  { answer, roundId, updatedAt }: ILatestRoundData
): void {
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
