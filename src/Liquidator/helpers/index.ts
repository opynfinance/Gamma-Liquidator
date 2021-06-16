import { liquidatorAccount } from "../../helpers";

export { fetchDeribitBestAskPrice } from "./deribit";
export {
  attemptLiquidations,
  calculateLiquidationTransactionCost,
  generateMintAndLiquidateActions,
  marginCalculatorContract,
  fetchLiquidatableVaults,
} from "./liquidations";
export {
  fetchCollateralAssetDecimals,
  fetchShortOtokenDetails,
  fetchShortOtokenInstrumentInfo,
} from "./oTokenDetails";
export { attemptSettlements, calculateSettleableVaults } from "./settlements";

export const liquidatorAccountAddress = liquidatorAccount.address;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
