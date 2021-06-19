import { BigNumber } from "ethers";

import Liquidator from "./";

export interface IMintAndLiquidateArgs {
  collateralToDeposit: BigNumber;
  liquidatorVaultNonce: BigNumber;
  vault: Liquidator["vaultStore"]["liquidatableVaults"][string][number];
  vaultOwnerAddress: string;
}
