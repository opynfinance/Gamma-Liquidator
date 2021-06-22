import { BigNumber } from "ethers";
import fetch from "node-fetch";

const gasNowUrl =
  "https://www.gasnow.org/api/v3/gas/price?utm_source=:GammaLiquidator";

// Calculate gasPrice from gasnow.org
export default async function calculateGasPriceFromGasNow(): Promise<BigNumber> {
  return BigNumber.from((await (await fetch(gasNowUrl)).json()).data.rapid)
    .mul(
      Math.round(
        Number((process.env.GAS_PRICE_MULTIPLIER ||= "1.0")) * 100000000
      )
    )
    .div(100000000);
}
