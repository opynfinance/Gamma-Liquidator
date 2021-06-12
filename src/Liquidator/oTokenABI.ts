// minimal contract ABI needed for fetching oToken instrument info
const oTokenABI = [
  "function getOtokenDetails() external view returns (address, address, address, uint256, uint256, bool)",
  "function symbol() public view returns (string)",
];

export default oTokenABI;
