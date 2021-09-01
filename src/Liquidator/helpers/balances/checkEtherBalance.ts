import { BigNumber, utils } from "ethers";

import {
  liquidatorAccount,
  liquidatorAccountAddress,
  Logger,
  triggerPagerDutyNotification,
} from "../../../helpers";

export default async function checkEtherBalance(): Promise<void> {
  const liquidatorAccountBalance = await liquidatorAccount.getBalance();

  if (
    liquidatorAccountBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_ETHER_BALANCE)
    )
  ) {
    const message =
      "Liquidator account balance less than BOT_MINIMUM_ETHER_BALANCE";

    Logger.error({
      at: "Liquidator#checkEtherBalance",
      message,
      BOT_MINIMUM_ETHER_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_ETHER_BALANCE as string
      ),
      liquidatorAccountAddress,
      liquidatorAccountBalance: utils.formatUnits(liquidatorAccountBalance),
      error: Error(
        "Liquidator account balance less than BOT_MINIMUM_ETHER_BALANCE."
      ),
    });

    if (process.env.PAGERDUTY_ROUTING_KEY) {
      await triggerPagerDutyNotification(message);
    }

    return;
  }
}
