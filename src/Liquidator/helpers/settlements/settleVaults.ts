import { BigNumber } from "ethers";

import { ZERO_ADDRESS } from "../";
import { ActionType } from "../actionTypes";
import Liquidator from "../../";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  gammaControllerProxyContract,
} from "../../../helpers";

export default async function settleVaults(
  settleableVaults: Liquidator["vaultStore"]["settleableVaults"]
): Promise<void> {
  const settlementActions = [];

  for (const settleableVault in settleableVaults) {
    settlementActions.push({
      actionType: ActionType.SettleVault,
      owner: liquidatorAccountAddress,
      secondAddress: collateralCustodianAddress,
      asset: ZERO_ADDRESS,
      vaultId: BigNumber.from(settleableVault),
      amount: settleableVaults[settleableVault],
      index: "0",
      data: ZERO_ADDRESS,
    });
  }

  const transaction = await gammaControllerProxyContract.operate(
    settlementActions
  );

  return transaction.wait(1);
}
