// minimal contract ABI needed for fetching naked margin requirements
const marginCalculatorABI = [
  "function getMarginRequired((address[] shortOtokens, address[] longOtokens, address[] collateralAssets, uint256[] shortAmounts, uint256[] longAmounts, uint256[] collateralAmounts) memory _vault, uint256 _vaultType) external view returns (int256, int256)",
];

export default marginCalculatorABI;
