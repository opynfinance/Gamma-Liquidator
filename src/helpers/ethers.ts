import { ethers } from "ethers";
import { existsSync, readFileSync } from "fs";

import { erc20ABI, gammaControllerABI } from "./abis";
import Logger from "./logger";

if (!process.env.BOT_PRIVATE_KEY) {
  if (!existsSync("./.privateKey")) {
    Logger.error({
      at: "ethers#loadLiquidatorAccount",
      message: "BOT_PRIVATE_KEY is not provided",
      error: Error("BOT_PRIVATE_KEY is not provided."),
    });
  }

  process.env.BOT_PRIVATE_KEY = readFileSync("./.privateKey", "utf-8");
}

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_NODE_URL
);

export let gammaControllerProxyContract = new ethers.Contract(
  process.env.GAMMA_CONTROLLER_ADDRESS as string,
  gammaControllerABI,
  provider
);

export const strikePriceAssetContract = new ethers.Contract(
  process.env.STRIKE_PRICE_ASSET_ADDRESS as string,
  erc20ABI,
  provider
);

export const underlyingAssetContract = new ethers.Contract(
  process.env.UNDERLYING_ASSET_ADDRESS as string,
  erc20ABI,
  provider
);

export const liquidatorAccount = new ethers.Wallet(
  process.env.BOT_PRIVATE_KEY as string,
  provider
);

export const liquidatorAccountAddress = liquidatorAccount.address;

export const collateralCustodianAddress = process.env
  .COLLATERAL_CUSTODIAN_ADDRESS
  ? process.env.COLLATERAL_CUSTODIAN_ADDRESS
  : liquidatorAccountAddress;

export async function loadLiquidatorAccount(): Promise<void> {
  gammaControllerProxyContract =
    gammaControllerProxyContract.connect(liquidatorAccount);

  const liquidatorAddress = liquidatorAccount.address.toLowerCase();

  Logger.info({
    at: "ethers#loadLiquidatorAccount",
    message: "Loaded liquidator account",
    address: liquidatorAddress,
  });
}

export const networkInfo = provider.getNetwork();
