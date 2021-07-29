import { ethers } from "ethers";

import { erc20ABI } from "../abis";
import Liquidator from "../..";
import {
  collateralCustodianAddress,
  liquidatorAccount,
  liquidatorAccountAddress,
  Logger,
} from "../../../helpers";

export default async function transferOtokens(
  Liquidator: Liquidator,
  {
    shortOtokenAddress,
    shortAmount,
  }: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): Promise<void> {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    erc20ABI,
    liquidatorAccount
  );

  try {
    const transaction = await shortOtokenContract.transferFrom(
      collateralCustodianAddress,
      liquidatorAccountAddress,
      shortAmount,
      { gasPrice: Liquidator.gasPriceStore.getLastCalculatedGasPrice() }
    );

    await shortOtokenContract.provider.waitForTransaction(
      transaction.hash,
      undefined,
      Number(process.env.EXPIRED_TRANSACTION_TIMEOUT) // default 60 seconds
    );

    return;
  } catch (error) {
    Logger.error({
      alert: "Critical error during oToken transferFrom attempt",
      at: "Liquidator#transferOtokens",
      message: error.message,
      collateralCustodianAddress,
      liquidatorAccountAddress,
      shortAmount: shortAmount.toString(),
      shortOtokenAddress,
      error,
    });

    return;
  }
}
