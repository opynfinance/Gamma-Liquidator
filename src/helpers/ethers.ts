import { ethers } from "ethers";

import gammaControllerABI from "./gammaControllerABI";
import Logger from "./logger";

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_NODE_URL
);

export const gammaControllerProxyContract = new ethers.Contract(
  process.env.GAMMA_CONTROLLER_ADDRESS as string,
  gammaControllerABI,
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

  const liquidatorAccount = new ethers.Wallet(
    process.env.BOT_PRIVATE_KEY,
    provider
  );

  gammaControllerProxyContract.connect(liquidatorAccount);

  const liquidatorAddress = liquidatorAccount.address.toLowerCase();

  Logger.info({
    at: "ethers#loadLiquidatorAccount",
    message: "Loaded liquidator account",
    address: liquidatorAddress,
  });
}
