export const supportedChainlinkPriceFeeds: {
  [chainId: string]: { [description: string]: string };
} = {
  // mainnet
  "1": {
    "ETH / USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  },
  // kovan
  "42": {
    "ETH / USD": "0x3E861C966A52012e17b4C34B79147AB479f6b86a", // mock Chainlink Price Feed & Pricer
  },
};

export default supportedChainlinkPriceFeeds;
