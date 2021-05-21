import "dotenv/config";

import GasPriceStore from "./GasPriceStore";
// import Liquidator from "./Liquidator";
import PriceFeedStore from "./PriceFeedStore";
import VaultStore from "./VaultStore";
import { loadLiquidatorAccount } from "./helpers/ethers";

console.log(`Starting Gamma Liquidator`);

async function start() {
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
