import { BigNumber, ethers } from "ethers";

import PriceFeedStore from "..";
import { Logger } from "../../helpers";

export default async function updateLatestRoundData(
  PriceFeedStore: PriceFeedStore,
  chainlinkAggregatorProxyContract: ethers.Contract,
  { answer, updatedAt }: Record<string, BigNumber>
): Promise<void> {
  const { roundId } = await chainlinkAggregatorProxyContract.latestRoundData();

  PriceFeedStore.setLatestRoundData({
    [chainlinkAggregatorProxyContract.address]: {
      answer,
      roundId,
      updatedAt,
    },
  });

  Logger.info({
    at: "PriceFeedStore#updateLatestRoundData",
    message: "Price feed store updated",
    chainlinkPriceFeedAddress: chainlinkAggregatorProxyContract.address,
    answer: answer.toString(),
    roundId: roundId.toString(),
    updatedAt: updatedAt.toString(),
  });
}
