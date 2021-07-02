import checkEtherBalance from "./checkEtherBalance";
import checkStrikePriceAssetBalance from "./checkStrikePriceAssetBalance";
import checkUnderlyingAssetBalance from "./checkUnderlyingAssetBalance";

import { Logger } from "../../../helpers";

export default async function checkAssetBalances(): Promise<void> {
  try {
    await checkEtherBalance();
    await checkStrikePriceAssetBalance();
    await checkUnderlyingAssetBalance();
  } catch (error) {
    Logger.error({
      at: "Liquidator#checkAssetBalances",
      message: error.message,
      error,
    });
  }
}
