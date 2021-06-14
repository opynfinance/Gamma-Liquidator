import { ethers } from "ethers";

import { ActionType } from "./actionTypes";
import { fetchDeribitETHIndexPrice } from "./deribit";
import marginCalculatorABI from "./marginCalculatorABI";
import {
  gammaControllerProxyContract,
  liquidatorAccount,
  provider,
} from "../../helpers";

const liquidatorAccountAddress = liquidatorAccount.address;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const generateMintAndLiquidateActions = ({
  collateralToDeposit,
  liquidatorVaultNonce,
  vault,
  vaultOwnerAddress,
}: Record<string, any>) => [
  {
    actionType: ActionType.OpenVault,
    owner: liquidatorAccountAddress,
    secondAddress: liquidatorAccountAddress,
    asset: ZERO_ADDRESS,
    vaultId: liquidatorVaultNonce,
    amount: "0",
    index: "0",
    data: ethers.utils.defaultAbiCoder.encode(["uint256"], [1]),
  },
  {
    actionType: ActionType.MintShortOption,
    owner: liquidatorAccountAddress,
    secondAddress: liquidatorAccountAddress,
    asset: vault.shortOtokenAddress,
    vaultId: liquidatorVaultNonce,
    amount: vault.shortAmount,
    index: "0",
    data: ZERO_ADDRESS,
  },
  {
    actionType: ActionType.Liquidate,
    owner: vaultOwnerAddress,
    secondAddress: liquidatorAccount.address,
    asset: ZERO_ADDRESS,
    vaultId: vault.vaultId,
    amount: vault.shortAmount,
    index: "0",
    data: ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [vault.roundId.toString()]
    ),
  },
  {
    actionType: ActionType.DepositCollateral,
    owner: liquidatorAccount.address,
    secondAddress: liquidatorAccount.address,
    asset: vault.collateralAssetAddress,
    vaultId: liquidatorVaultNonce,
    amount: collateralToDeposit,
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
}: Record<string, any>) {
  const mintAndLiquidationActions = generateMintAndLiquidateActions({
    collateralToDeposit,
    liquidatorVaultNonce,
    vault,
    vaultOwnerAddress,
  });

  return (
    ((
      await gammaControllerProxyContract.estimateGas.operate(
        mintAndLiquidationActions
      )
    )
      .mul(gasPriceStore.getLastCalculatedGasPrice())
      .toNumber() /
      10 ** 18) * // Ether has 18 decimals, gas is calculated in wei
    (await fetchDeribitETHIndexPrice())
  );
}

export const marginCalculatorContract = new ethers.Contract(
  process.env.MARGIN_CALCULATOR_ADDRESS as string,
  marginCalculatorABI,
  provider
);
