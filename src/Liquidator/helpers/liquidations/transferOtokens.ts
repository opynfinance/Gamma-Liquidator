import { ethers } from "ethers";

import { erc20ABI } from "../abis";
import Liquidator from "../..";
import {
  collateralCustodianAddress,
  liquidatorAccount,
  liquidatorAccountAddress,
  Logger,
  triggerPagerDutyNotification,
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
    const alert = "Critical error during oToken transferFrom attempt";

    Logger.error({
      alert,
      at: "Liquidator#transferOtokens",
      message: error.message,
      collateralCustodianAddress,
      liquidatorAccountAddress,
      shortAmount: shortAmount.toString(),
      shortOtokenAddress,
      error,
    });

    if (process.env.PAGERDUTY_ROUTING_KEY) {
      await triggerPagerDutyNotification(`${alert}: ${error.message}`);
    }

    return;
  }
}
