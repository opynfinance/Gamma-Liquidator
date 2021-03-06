import { ethers } from "ethers";

import { erc20ABI } from "../abis";
import Liquidator from "../..";
import { collateralCustodianAddress, provider } from "../../../helpers";

export default async function checkOtokenBalance({
  shortOtokenAddress,
  shortAmount,
}: Liquidator["vaultStore"]["liquidatableVaults"][string][number]): Promise<boolean> {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    erc20ABI,
    provider
  );

  const shortOtokenBalance = await shortOtokenContract.balanceOf(
    collateralCustodianAddress
  );

  if (shortOtokenBalance.lt(shortAmount)) {
    return false;
  }

  return true;
}
