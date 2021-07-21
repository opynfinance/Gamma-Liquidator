import { ethers } from "ethers";

import { ZERO_ADDRESS } from "../";
import { marginCalculatorABI } from "../abis";
import { ActionType } from "../actionTypes";
import { fetchDeribitETHIndexPrice } from "../deribit";
import { IMintAndLiquidateArgs } from "../../types";
import GasPriceStore from "../../../GasPriceStore";
import {
  gammaControllerProxyContract,
  liquidatorAccountAddress,
  provider,
} from "../../../helpers";

export const generateMintAndLiquidateActions = ({
  collateralToDeposit,
  liquidatorVaultNonce,
  vault,
  vaultOwnerAddress,
}: IMintAndLiquidateArgs): any => [
  {
    actionType: ActionType.OpenVault,
    owner: liquidatorAccountAddress,
    secondAddress: liquidatorAccountAddress,
    asset: ZERO_ADDRESS,
    vaultId: liquidatorVaultNonce.toString(),
    amount: "0",
    index: "0",
    data: ethers.utils.defaultAbiCoder.encode(["uint256"], [1]),
  },
  {
    actionType: ActionType.MintShortOption,
    owner: liquidatorAccountAddress,
    secondAddress: liquidatorAccountAddress,
    asset: vault.shortOtokenAddress,
    vaultId: liquidatorVaultNonce.toString(),
    amount: vault.shortAmount.toString(),
    index: "0",
    data: ZERO_ADDRESS,
  },
  {
    actionType: ActionType.Liquidate,
    owner: vaultOwnerAddress,
    secondAddress: liquidatorAccountAddress,
    asset: ZERO_ADDRESS,
    vaultId: vault.vaultId.toString(),
    amount: vault.shortAmount.toString(),
    index: "0",
    data: ethers.utils.defaultAbiCoder.encode(["uint256"], [vault.roundId]),
  },
  {
    actionType: ActionType.DepositCollateral,
    owner: liquidatorAccountAddress,
    secondAddress: liquidatorAccountAddress,
    asset: vault.collateralAssetAddress,
    vaultId: liquidatorVaultNonce.toString(),
    amount: collateralToDeposit.toString(),
    index: "0",
    data: ZERO_ADDRESS,
  },
];

export async function calculateLiquidationTransactionCost({
  collateralToDeposit,
  gasPriceStore,
  liquidatorVaultNonce,
  vault,
  vaultOwnerAddress,
}: IMintAndLiquidateArgs & { gasPriceStore: GasPriceStore }): Promise<number> {
  const mintAndLiquidationActions = generateMintAndLiquidateActions({
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  });

  return (
    (((process.env.COLLATERAL_CUSTODIAN_ADDRESS
      ? 624875 // temp super hack for internal purposes
      : (
          await gammaControllerProxyContract.estimateGas.operate(
            mintAndLiquidationActions
          )
        ).toNumber()) *
      gasPriceStore.getLastCalculatedGasPrice().toNumber()) /
      10 ** 18) * // Ether has 18 decimals, gas is calculated in wei
    (await fetchDeribitETHIndexPrice())
  );
}

export const marginCalculatorContract = new ethers.Contract(
  process.env.MARGIN_CALCULATOR_ADDRESS as string,
  marginCalculatorABI,
  provider
);
