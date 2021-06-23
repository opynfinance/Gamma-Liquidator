export const supportedNetworkSubgraphs: { [chainId: string]: string } = {
  "1": "https://api.thegraph.com/subgraphs/name/opynfinance/gamma-mainnet", // mainnet subgraph
  "3": "https://api.thegraph.com/subgraphs/name/opynfinance/gamma-internal-ropsten", // internal ropsten subgraph
  "42": "https://api.thegraph.com/subgraphs/name/opynfinance/gamma-internal-kovan", // internal kovan subgraph
};

export default supportedNetworkSubgraphs;
