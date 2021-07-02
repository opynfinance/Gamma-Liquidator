import { BigNumber, utils } from "ethers";

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
      BOT_MINIMUM_ETHER_BALANCE: utils.formatUnits(
        process.env.BOT_MINIMUM_ETHER_BALANCE as string
      ),
      liquidatorAccountBalance: utils.formatUnits(liquidatorAccountBalance),
      error: Error(
        "Liquidator account balance less than BOT_MINIMUM_ETHER_BALANCE."
      ),
    });
  }
}
