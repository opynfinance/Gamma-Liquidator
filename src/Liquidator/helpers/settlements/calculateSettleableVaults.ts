import Liquidator from "../../index";
import { gammaControllerProxyContract } from "../../../helpers";

export default async function calculateSettleableVaults(
  { vaultStore }: Liquidator,
  timestamp: number
): Promise<Liquidator["vaultStore"]["settleableVaults"]> {
  const settlementVaults = vaultStore.getSettlementVaults();
  const settlementVaultNonces = Object.keys(settlementVaults);
  const settleableVaults = vaultStore.getSettleableVaults();

  for await (const settlementVaultNonce of settlementVaultNonces) {
    const settlementVault = settlementVaults[settlementVaultNonce];
    const shortOtokenAddress = Object.keys(settlementVault)[0];
    const settlementDetails = settlementVault[shortOtokenAddress];

    if (
      timestamp > (settlementDetails.expiryTimestamp as any) &&
      settlementDetails.shortAmount.gt(0) &&
      (await gammaControllerProxyContract.isSettlementAllowed(
        shortOtokenAddress
      ))
    ) {
      settleableVaults[settlementVaultNonce] = settlementDetails.shortAmount;
    }
  }

  return settleableVaults;
}
