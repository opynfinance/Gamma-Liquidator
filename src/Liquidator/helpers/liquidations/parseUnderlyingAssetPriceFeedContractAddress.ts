import { ethers } from "ethers";

import { oTokenABI } from "../abis";
import {
  networkInfo,
  provider,
  supportedChainlinkPriceFeeds,
} from "../../../helpers";

export default async function parseUnderlyingAssetPriceFeedContractAddress(
  shortOtokenAddress: string
): Promise<Record<string, string>> {
  const networkChainId = (await networkInfo).chainId.toString();

  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    oTokenABI,
    provider
  );

  const instrumentInfo = await shortOtokenContract.symbol();

  if (instrumentInfo.includes("WETHUSDC")) {
    return {
      underlyingAssetPriceFeedContractAddress:
        supportedChainlinkPriceFeeds[networkChainId]["ETH / USD"],
      underlyingAsset: "ETH",
    };
  }

  throw Error(
    `Unexpected finding —— oToken being parsed is not whitelisted!\n\noToken contract address: ${shortOtokenAddress}`
  );
}
