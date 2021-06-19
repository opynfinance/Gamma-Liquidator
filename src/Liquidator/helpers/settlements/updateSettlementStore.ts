import { BigNumber } from "ethers";

import Liquidator from "../../index";

export default function updateSettlementStore(
  { vaultStore: { settlementVaults } }: Liquidator,
  liquidatorVaultNonce: BigNumber,
  {
    shortAmount,
    shortOtokenAddress,
  }: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): BigNumber {
  return settlementVaults[shortOtokenAddress][
    liquidatorVaultNonce.toString()
  ].shortAmount.add(shortAmount);
}
