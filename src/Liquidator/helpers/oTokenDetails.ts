import { ethers } from "ethers";

import erc20ABI from "./erc20ABI";
import oTokenABI from "./oTokenABI";
import { provider } from "../../helpers";

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
