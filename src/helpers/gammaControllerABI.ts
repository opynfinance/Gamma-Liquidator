// minimal contract ABI needed for liquidations
const gammaControllerABI = [
  "event VaultOpened(address indexed accountOwner, uint256 vaultId, uint256 indexed vaultType)",
  "function getVault(address _owner, uint256 _vaultId) public view",
  "function isLiquidatable(address _owner, uint256 _vaultId, uint256 _roundId) external view returns (bool, uint256, uint256)",
  "function operate((uint8 actionType, address owner, address secondAddress, address asset, uint256 vaultId, uint256 amount, uint256 index, bytes data)[] memory _actions) external",
];

export default gammaControllerABI;
