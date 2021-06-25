import { abi as erc20ABI } from "@studydefi/money-legos/erc20";
import { BigNumber, ethers } from "ethers";

import { oTokenABI } from "./abis";
import { provider } from "../../helpers";

export async function fetchCollateralAssetDecimals(
  collateralAssetAddress: string
): Promise<BigNumber> {
  const collateralAssetContract = new ethers.Contract(
    collateralAssetAddress,
    erc20ABI,
    provider
  );

  return collateralAssetContract.decimals();
}

export async function fetchShortOtokenDetails(
  shortOtokenAddress: string
): Promise<any> {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    oTokenABI,
    provider
  );

  return shortOtokenContract.getOtokenDetails();
}

export async function fetchShortOtokenInstrumentInfo(
  shortOtokenAddress: string
): Promise<any> {
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
