import { ethers } from "ethers";

import chainlinkAggregatorABI from "./chainlinkAggregatorABI";
import gammaControllerABI from "./gammaControllerABI";
import Logger from "./logger";

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_NODE_URL
);

export const chainlinkAggregatorProxyContract = new ethers.Contract(
  process.env.CHAINLINK_PRICE_FEED_ADDRESS as string,
  chainlinkAggregatorABI,
  provider
);

export let gammaControllerProxyContract = new ethers.Contract(
  process.env.GAMMA_CONTROLLER_ADDRESS as string,
  gammaControllerABI,
  provider
);

export const liquidatorAccount = new ethers.Wallet(
  process.env.BOT_PRIVATE_KEY as string,
  provider
);

export async function loadLiquidatorAccount() {
  if (!process.env.BOT_PRIVATE_KEY) {
    Logger.error({
      at: "ethers#loadLiquidatorAccount",
      message: "BOT_PRIVATE_KEY is not provided",
      error: new Error("BOT_PRIVATE_KEY is not provided"),
    });
    return;
  }

  gammaControllerProxyContract =
    gammaControllerProxyContract.connect(liquidatorAccount);

  const liquidatorAddress = liquidatorAccount.address.toLowerCase();

  Logger.info({
    at: "ethers#loadLiquidatorAccount",
    message: "Loaded liquidator account",
    address: liquidatorAddress,
  });
}
