import { BigNumber } from "ethers";

export interface INakedMarginVaults {
  [vaultOwnerAddress: string]: BigNumber[];
}

export interface ISettlementDetails {
  expiryTimestamp: BigNumber;
  shortAmount: BigNumber;
}

export interface ISettlementVaults {
  [shortOtokenAddress: string]: ISettlementVault;
}

export interface ISettlementVault {
  [settlementVaultNonce: string]: ISettlementDetails;
}
