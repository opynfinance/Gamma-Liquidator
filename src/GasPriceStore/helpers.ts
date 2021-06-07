import { BigNumber } from "ethers";
import fetch from "node-fetch";

import { provider } from "../helpers";

const gasNowUrl =
  "https://www.gasnow.org/api/v3/gas/price?utm_source=:GammaLiquidator";

export async function calculateGasPriceFromGasNow() {
  return BigNumber.from((await (await fetch(gasNowUrl)).json()).data.rapid)
    .mul(Math.round(Number(process.env.GAS_PRICE_MULTIPLIER) * 100000000))
    .div(100000000);
}

// On-chain median gasPrice fallback
export async function calculateGasPriceFromNetwork() {
  return (await provider.getGasPrice())
    .mul(
      Math.round(Number(process.env.GAS_PRICE_MULTIPLIER as string) * 100000000)
    )
    .div(100000000);
}
