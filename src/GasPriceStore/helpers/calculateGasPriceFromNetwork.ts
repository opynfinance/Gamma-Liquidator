import { BigNumber } from "ethers";

import { provider } from "../../helpers";

// On-chain median gasPrice fallback
export default async function calculateGasPriceFromNetwork(): Promise<BigNumber> {
  return (await provider.getGasPrice())
    .mul(
      Math.round(Number(process.env.GAS_PRICE_MULTIPLIER as string) * 100000000)
    )
    .div(100000000);
}
