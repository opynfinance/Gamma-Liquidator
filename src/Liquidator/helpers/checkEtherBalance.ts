import { BigNumber } from "ethers";

import { liquidatorAccount, Logger } from "../../helpers";

export default async function checkEtherBalance(): Promise<void> {
  const liquidatorAccountBalance = await liquidatorAccount.getBalance();
  if (
    liquidatorAccountBalance.lt(
      BigNumber.from(process.env.BOT_MINIMUM_ETHER_BALANCE)
    )
  ) {
    Logger.error({
      at: "Liquidator#checkEtherBalance",
      message: "Liquidator account balance less than BOT_MINIMUM_ETHER_BALANCE",
      error: Error(
        "Liquidator account balance less than BOT_MINIMUM_ETHER_BALANCE."
      ),
    });
  }
}
