export const supportedLiquidationAssets: {
  [chainId: string]: { [assetType: string]: string[] };
} = {
  // mainnet
  "1": {
    strikePriceAssets: [
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    ],
    underlyingAssets: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    ],
  },
  // kovan
  "42": {
    strikePriceAssets: [
      "0x7e6edA50d1c833bE936492BF42C1BF376239E9e2", // Opyn USDC
    ],
    underlyingAssets: [
      "0xd0a1e359811322d97991e03f863a0c30c2cf029c", // WETH
    ],
  },
};

export default supportedLiquidationAssets;
