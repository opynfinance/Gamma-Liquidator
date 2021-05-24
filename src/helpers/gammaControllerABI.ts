// minimal contract ABI needed for liquidations
const gammaControllerABI = [
  "event VaultLiquidated(address indexed liquidator, address indexed receiver, address indexed vaultOwner, uint256 debt, uint256 auctionPrice, uint256 collateralPayout, uint256 auctionStartingRound)",
  "event VaultOpened(address indexed accountOwner, uint256 vaultId, uint256 indexed vaultType)",
  "event VaultSettled(address indexed AccountOwner, address indexed to, address indexed otoken, uint256 vaultId, uint256 payout)",
  "function getVault(address _owner, uint256 _vaultId) public view",
  "function isLiquidatable(address _owner, uint256 _vaultId, uint256 _roundId) external view returns (bool, uint256, uint256)",
  "function operate((uint8 actionType, address owner, address secondAddress, address asset, uint256 vaultId, uint256 amount, uint256 index, bytes data)[] memory _actions) external",
];

export default gammaControllerABI;
