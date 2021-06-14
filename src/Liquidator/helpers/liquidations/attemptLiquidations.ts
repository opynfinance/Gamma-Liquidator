import {
  calculateLiquidationTransactionCost,
  fetchCollateralAssetDecimals,
  fetchDeribitBestAskPrice,
  fetchShortOtokenDetails,
  fetchShortOtokenInstrumentInfo,
  marginCalculatorContract,
} from "../";
import Liquidator from "../../index";

export default async function fetchLiquidatableVaults(
  liquidatableVaultOwners: string[],
  Liquidator: Liquidator
) {
  const underlyingAsset = Liquidator.priceFeedStore.getUnderlyingAsset();

  for (const liquidatableVaultOwner of liquidatableVaultOwners) {
    await Promise.all(
      Liquidator.liquidatableVaults[liquidatableVaultOwner].map(
        async (vault) => {
          const shortOtokenInstrumentInfo =
            await fetchShortOtokenInstrumentInfo(vault.shortOtokenAddress);

          const [
            ,
            underlyingAssetAddress,
            strikeAssetAddress,
            strikePrice,
            expiryTimestamp,
            isPutOption,
          ] = await fetchShortOtokenDetails(vault.shortOtokenAddress);

          const collateralAssetDecimals = await fetchCollateralAssetDecimals(
            vault.collateralAssetAddress
          );

          const deribitBestAskPrice = await fetchDeribitBestAskPrice({
            ...shortOtokenInstrumentInfo,
            underlyingAsset,
          });

          const collateralAssetNakedMarginRequirement =
            await marginCalculatorContract.getNakedMarginRequired(
              underlyingAssetAddress,
              strikeAssetAddress,
              vault.collateralAssetAddress,
              vault.shortAmount,
              strikePrice,
              vault.latestUnderlyingAssetPrice,
              expiryTimestamp,
              collateralAssetDecimals,
              isPutOption
            );

          const estimatedLiquidationTransactionCost =
            await calculateLiquidationTransactionCost({
              collateralToDeposit: collateralAssetNakedMarginRequirement,
              gasPriceStore: Liquidator.gasPriceStore,
              liquidatorVaultNonce: Liquidator.liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });

          const estimatedProfit =
            deribitBestAskPrice +
            estimatedLiquidationTransactionCost +
            Math.max(
              Number(process.env.DERIBIT_PRICE_MULTIPLIER) *
                deribitBestAskPrice,
              Number(process.env.MINIMUM_LIQUIDATION_PRICE)
            );

          if (isPutOption) {
            if (
              vault.latestAuctionPrice.toNumber() / 10 ** 8 >
              estimatedProfit
            ) {
              // liquidate
              return;
            }
            return;
          }

          if (
            ((vault.latestAuctionPrice.toNumber() /
              10 ** collateralAssetDecimals) *
              vault.latestUnderlyingAssetPrice.toNumber()) /
              10 ** 8 >
            estimatedProfit
          ) {
            // liquidate
            return;
          }
          return;
        }
      )
    );
  }
}
