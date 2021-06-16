import { BigNumber } from "ethers";

import { liquidatorAccountAddress, ZERO_ADDRESS } from "../";
import { ActionType } from "../actionTypes";
import { gammaControllerProxyContract } from "../../../helpers";

export default async function settleVault(
  settleableVaultNonce: string,
  shortAmount: BigNumber
) {
  const settleAction = [
    {
      actionType: ActionType.SettleVault,
      owner: liquidatorAccountAddress,
      secondAddress: liquidatorAccountAddress,
      asset: ZERO_ADDRESS,
      vaultId: BigNumber.from(settleableVaultNonce),
      amount: shortAmount,
      index: "0",
      data: ZERO_ADDRESS,
    },
  ];

  return gammaControllerProxyContract.operate(settleAction);
}
