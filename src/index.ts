import "dotenv/config";

import GasPriceStore from "./GasPriceStore";
// import Liquidator from "./Liquidator";
import PriceFeedStore from "./PriceFeedStore";
import VaultStore from "./VaultStore";
import { loadLiquidatorAccount, Logger } from "./helpers";

async function start() {
  Logger.info({
    at: "main#start",
    message: "Starting Gamma Liquidator",
  });

  const gasPriceStore = new GasPriceStore();
  const priceFeedStore = new PriceFeedStore();
  const vaultStore = new VaultStore();
  // const liquidator = new Liquidator(priceFeedStore, vaultStore);

  await loadLiquidatorAccount();

  gasPriceStore.start();
  priceFeedStore.start();
  vaultStore.start();

  //     liquidator.start();
}

start();
