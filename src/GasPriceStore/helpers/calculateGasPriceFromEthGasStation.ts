import { BigNumber } from "ethers";
import fetch from "node-fetch";

const ethGasStationUrl =
  `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETH_GAS_STATION_KEY}`;

// Calculate gasPrice from ethgasstation.info
export default async function calculateGasPriceFromEthGasStation(): Promise<BigNumber> {
  return BigNumber.from((await (await fetch(ethGasStationUrl)).json()).data.fastest)
    .mul(
      Math.round(Number(process.env.ETH_GASSTATION_GAS_PRICE_MULTIPLIER) * 100000000)
    )
    .div(100000000);
}
