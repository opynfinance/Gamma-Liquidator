import { BigNumber } from "ethers";

import { ZERO_ADDRESS } from "../";
import { ActionType } from "../actionTypes";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  gammaControllerProxyContract,
} from "../../../helpers";

export default async function settleVault(
  settleableVaultNonce: string,
  shortAmount: BigNumber
): Promise<void> {
  const settleAction = [
    {
      actionType: ActionType.SettleVault,
      owner: liquidatorAccountAddress,
      secondAddress: collateralCustodianAddress,
      asset: ZERO_ADDRESS,
      vaultId: BigNumber.from(settleableVaultNonce),
      amount: shortAmount,
      index: "0",
      data: ZERO_ADDRESS,
    },
  ];

  return gammaControllerProxyContract.operate(settleAction);
}
