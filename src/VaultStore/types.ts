import { BigNumber } from "ethers";

export interface ILiquidatableVault {
  collateralAmount: BigNumber;
  collateralAssetAddress: string;
  insolvencyAmountInUSD: number;
  isPutVault: boolean | null;
  latestAuctionPrice: BigNumber;
  latestUnderlyingAssetPrice: BigNumber;
  roundId: BigNumber;
  shortAmount: BigNumber;
  shortOtokenAddress: string;
  undercollateralizedTimestamp: BigNumber;
  vaultId: BigNumber;
}

export interface ILiquidatableVaults {
  [vaultOwnerAddress: string]: ILiquidatableVault[];
}

export interface INakedMarginVaults {
  [vaultOwnerAddress: string]: BigNumber[];
}

export interface ISettleableVaults {
  [settleableVaultNonce: string]: BigNumber;
}

export interface ISettlementDetails {
  expiryTimestamp: BigNumber;
  shortAmount: BigNumber;
}

export interface ISettlementVaults {
  [settlementVaultNonce: string]: ISettlementVault;
}

export interface ISettlementVault {
  [shortOtokenAddress: string]: ISettlementDetails;
}
