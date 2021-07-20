import { BigNumber, ethers } from "ethers";

import { oTokenABI } from "./abis";
import { erc20ABI, provider } from "../../helpers";

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

export async function fetchShortOtokenInstrumentInfo(
  shortOtokenAddress: string
): Promise<any> {
  const shortOtokenContract = new ethers.Contract(
    shortOtokenAddress,
    oTokenABI,
    provider
  );

  const instrumentInfo = await shortOtokenContract.symbol();
  const [, rawExpiryDate, strikePriceAndOptionType] =
    instrumentInfo.match(/([^-]+)/g);

  const parsedExpiryDate = /^0(.*)/g.exec(rawExpiryDate);

  const expiryDate = parsedExpiryDate ? parsedExpiryDate[1] : rawExpiryDate;

  const [strikePrice, optionType] = strikePriceAndOptionType.match(/\d+|\D+/g);

  return { expiryDate, optionType, strikePrice };
}
