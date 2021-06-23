import { ethers } from "ethers";

import { erc20ABI } from "./abis";
import { liquidatorAccount, Logger, provider } from "../../helpers";

export default async function checkAssetAllowances(): Promise<void> {
  const underlyingAssetContract = new ethers.Contract(
    process.env.UNDERLYING_ASSET_ADDRESS as string,
    erc20ABI,
    provider
  );

  const underlyingAssetMarginPoolAllowance =
    await underlyingAssetContract.allowance(
      liquidatorAccount.address,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (underlyingAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message: "Underlying asset margin pool allowance less than or equal to 0",
      error: Error(
        "Underlying asset margin pool allowance less than or equal to 0"
      ),
    });

    return;
  }

  const strikePriceAssetContract = new ethers.Contract(
    process.env.STRIKE_PRICE_ASSET_ADDRESS as string,
    erc20ABI,
    provider
  );

  const strikePriceAssetMarginPoolAllowance =
    await strikePriceAssetContract.allowance(
      liquidatorAccount.address,
      process.env.MARGIN_POOL_ADDRESS
    );

  if (strikePriceAssetMarginPoolAllowance.lte(0)) {
    Logger.error({
      at: "Liquidator#checkAssetAllowances",
      message:
        "Strike price asset margin pool allowance less than or equal to 0",
      error: Error(
        "Strike price asset margin pool allowance less than or equal to 0"
      ),
    });

    return;
  }

  return;
}