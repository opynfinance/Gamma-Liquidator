import PriceFeedStore from "..";
import { chainlinkAggregatorProxyContract, Logger } from "../../helpers";

export default async function fetchPriceFeedPair(
  PriceFeedStore: PriceFeedStore
): Promise<void> {
  try {
    const priceFeedPair = await chainlinkAggregatorProxyContract.description();

    PriceFeedStore.setUnderlyingAsset(priceFeedPair.match(/([^\s]+)/g)[0]);

    Logger.info({
      at: "PriceFeedStore#fetchPriceFeedPair",
      message: "Price feed underlying asset set",
      priceFeedPair,
      underlyingAsset: PriceFeedStore.getUnderlyingAsset(),
    });
  } catch (error) {
    Logger.error({
      at: "PriceFeedStore#fetchPriceFeedPair",
      message: error.message,
      error,
    });
  }
}
