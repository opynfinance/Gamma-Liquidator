import { BigNumber } from "ethers";

import Liquidator from "../../index";
import { ILiquidatableVault } from "../../types";

export default function updateSettlementStore(
  { vaultStore: { settlementVaults } }: Liquidator,
  liquidatorVaultNonce: BigNumber,
  { shortAmount, shortOtokenAddress }: ILiquidatableVault
) {
  return settlementVaults[shortOtokenAddress][
    liquidatorVaultNonce.toString()
  ].shortAmount.add(shortAmount);
}
