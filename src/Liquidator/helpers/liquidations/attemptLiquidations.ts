import liquidateVault from "./liquidateVault";
import setLiquidationVaultNonce from "./setLiquidationVaultNonce";
import {
  calculateLiquidationTransactionCost,
  fetchCollateralAssetDecimals,
  fetchDeribitBestAskPrice,
  fetchShortOtokenDetails,
  fetchShortOtokenInstrumentInfo,
  marginCalculatorContract,
} from "../";
import { updateSettlementStore } from "../settlements";
import Liquidator from "../../index";
import { Logger } from "../../../helpers";

export default async function attemptLiquidations(
  liquidatableVaultOwners: string[],
  liquidatableVaults: Liquidator["vaultStore"]["liquidatableVaults"],
  Liquidator: Liquidator
): Promise<void> {
  const settlementVaults = Liquidator.vaultStore.getSettlementVaults();
  const underlyingAsset = Liquidator.priceFeedStore.getUnderlyingAsset();

  for (const liquidatableVaultOwner of liquidatableVaultOwners) {
    await Promise.all(
      liquidatableVaults[liquidatableVaultOwner].map(async (vault) => {
        try {
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

          const liquidatorVaultNonce = setLiquidationVaultNonce(
            expiryTimestamp,
            Liquidator,
            settlementVaults,
            vault
          );

          const estimatedLiquidationTransactionCost =
            await calculateLiquidationTransactionCost({
              collateralToDeposit: collateralAssetNakedMarginRequirement,
              gasPriceStore: Liquidator.gasPriceStore,
              liquidatorVaultNonce,
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
              await liquidateVault({
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
            }
          }

          if (
            ((vault.latestAuctionPrice.toNumber() /
              10 ** collateralAssetDecimals) *
              vault.latestUnderlyingAssetPrice.toNumber()) /
              10 ** 8 >
            estimatedProfit
          ) {
            await liquidateVault({
              collateralToDeposit: collateralAssetNakedMarginRequirement,
              liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });
          }

          Logger.info({
            at: "Liquidator#attemptLiquidations",
            message: "Vault liquidated",
            liquidatedVaultOwnerAddress: liquidatableVaultOwner,
            vaultId: vault.vaultId.toString(),
          });

          return await updateSettlementStore(
            Liquidator,
            liquidatorVaultNonce,
            vault
          );
        } catch (error) {
          Logger.error({
            alert: "Critical error during liquidation attempt",
            at: "Liquidator#attemptLiquidations",
            message: error.message,
            error,
          });
        }
      })
    );
  }
}
