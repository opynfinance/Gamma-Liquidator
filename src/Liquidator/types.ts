import { BigNumber } from "ethers";

export interface ILiquidatableVault {
  latestAuctionPrice: BigNumber;
  latestUnderlyingAssetPrice: BigNumber;
  collateralAssetAddress: string;
  roundId: BigNumber;
  shortAmount: BigNumber;
  shortOtokenAddress: string;
  vaultId: BigNumber;
}

export interface ILiquidatableVaults {
  [vaultOwnerAddress: string]: ILiquidatableVault[];
}

export interface IMintAndLiquidateArgs {
  collateralToDeposit: BigNumber;
  liquidatorVaultNonce: BigNumber;
  vault: ILiquidatableVault;
  vaultOwnerAddress: string;
}

export interface ISettleableVaults {
  [settleableVaultNonce: string]: BigNumber;
}
