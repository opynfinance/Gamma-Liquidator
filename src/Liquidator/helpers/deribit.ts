import fetch from "node-fetch";

const generateDeribitUrl = ({
  expiryDate,
  optionType,
  strikePrice,
  underlyingAsset,
}: Record<string, string>) =>
  `https://www.deribit.com/api/v2/public/get_order_book?instrument_name=${underlyingAsset}-${expiryDate}-${strikePrice}-${optionType}`;

export async function fetchDeribitBestAskPrice({
  expiryDate,
  optionType,
  strikePrice,
  underlyingAsset,
}: Record<string, string>): Promise<number> {
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

export async function fetchDeribitDelta({
  expiryDate,
  optionType,
  strikePrice,
  underlyingAsset,
}: Record<string, string>): Promise<number> {
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
  ).result.greeks.delta;
}

export async function fetchDeribitETHIndexPrice(): Promise<number> {
  return (
    await (
      await fetch(
        `https://deribit.com/api/v2/public/get_index_price?index_name=eth_usd`
      )
    ).json()
  ).result.index_price;
}
