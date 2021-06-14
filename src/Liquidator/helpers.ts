import { ethers } from "ethers";
import fetch from "node-fetch";

import erc20ABI from "./erc20ABI";
import marginCalculatorABI from "./marginCalculatorABI";
import oTokenABI from "./oTokenABI";
import {
  liquidatorAccount,
  gammaControllerProxyContract,
  provider,
} from "../helpers";

enum ActionType {
  OpenVault,
  MintShortOption,
  BurnShortOption,
  DepositLongOption,
  WithdrawLongOption,
  DepositCollateral,
  WithdrawCollateral,
  SettleVault,
  Redeem,
  Call,
  Liquidate,
}

const liquidatorAccountAddress = liquidatorAccount.address;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const generateDeribitUrl = ({
  expiryDate,
  optionType,
  strikePrice,
  underlyingAsset,
}: Record<string, string>) =>
  `https://www.deribit.com/api/v2/public/get_order_book?instrument_name=${underlyingAsset}-${expiryDate}-${strikePrice}-${optionType}`;

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
        generateMintAndLiquidateActions
      )
    )
      .mul(gasPriceStore.getLastCalculatedGasPrice())
      .toNumber() /
      10 ** 18) * // Ether has 18 decimals, gas is calculated in wei
    (await fetchDeribitETHIndexPrice())
  );
}

export async function fetchCollateralAssetDecimals(
  collateralAssetAddress: string
) {
  const collateralAssetContract = new ethers.Contract(
    collateralAssetAddress,
    erc20ABI,
    provider
  );

  return collateralAssetContract.decimals();
}

export async function fetchDeribitBestAskPrice({
  expiryDate,
  optionType,
  strikePrice,
  underlyingAsset,
}: Record<string, string>) {
  return (
    await (
      await fetch(
        generateDeribitUrl({
          expiryDate,
          optionType,
          strikePrice,
          underlyingAsset,
        })
      )
    ).json()
  ).result.best_ask_price;
}

export async function fetchDeribitETHIndexPrice() {
  return (
    await (
      await fetch(
        `https://deribit.com/api/v2/public/get_index_price?index_name=eth_usd`
      )
    ).json()
  ).result.index_price;
}

export async function fetchShortOtokenDetails(shortOtokenAddress: string) {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    oTokenABI,
    provider
  );

  return shortOtokenContract.getOtokenDetails();
}

export async function fetchShortOtokenInstrumentInfo(
  shortOtokenAddress: string
) {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    oTokenABI,
    provider
  );

  const instrumentInfo = await shortOtokenContract.symbol();
  const [, expiryDate, strikePriceAndOptionType] =
    instrumentInfo.match(/([^-]+)/g);

  const [strikePrice, optionType] = strikePriceAndOptionType.match(/\d+|\D+/g);

  return { expiryDate, optionType, strikePrice };
}

export const marginCalculatorContract = new ethers.Contract(
  process.env.MARGIN_CALCULATOR_ADDRESS as string,
  marginCalculatorABI,
  provider
);
