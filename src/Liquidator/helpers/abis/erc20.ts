// minimal contract ABI needed for fetching ERC-20 info
const erc20ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() public view returns (uint8)",
];

export default erc20ABI;
