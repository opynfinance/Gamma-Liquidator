import { BigNumber } from "ethers";

import liquidateVault from "./liquidateVault";
import prepareCallCollateral from "./prepareCallCollateral";
import setLiquidationVaultNonce from "./setLiquidationVaultNonce";
import {
  calculateLiquidationTransactionCost,
  fetchCollateralAssetDecimals,
  fetchDeribitBestAskPrice,
  fetchShortOtokenDetails,
  fetchShortOtokenInstrumentInfo,
  marginCalculatorContract,
} from "../";
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

          const collateralAssetDecimals: any =
            await fetchCollateralAssetDecimals(vault.collateralAssetAddress);

          vault.latestAuctionPrice = BigNumber.from(vault.latestAuctionPrice);
          vault.latestUnderlyingAssetPrice = BigNumber.from(
            vault.latestUnderlyingAssetPrice
          );
          vault.roundId = BigNumber.from(vault.roundId);
          vault.shortAmount = BigNumber.from(vault.shortAmount);
          vault.vaultId = BigNumber.from(vault.vaultId);

          let aggressiveLiquidationMode = false,
            deribitBestAskPrice = 0;

          try {
            // returned in underlying
            deribitBestAskPrice = await fetchDeribitBestAskPrice({
              ...shortOtokenInstrumentInfo,
              underlyingAsset,
            });

            deribitBestAskPrice =
              (deribitBestAskPrice *
                vault.latestUnderlyingAssetPrice.toNumber()) /
              10 ** 8;
          } catch (error) {
            if (error.message.includes("best_ask_price")) {
              aggressiveLiquidationMode = true;
            } else {
              Logger.error({
                alert: "Critical error when fetching Deribit best ask price",
                at: "Liquidator#attemptLiquidations",
                message: error.message,
                ...shortOtokenInstrumentInfo,
                underlyingAsset,
                error,
              });

              return;
            }
          }

          const collateralAssetNakedMarginRequirement: any =
            (await marginCalculatorContract.getNakedMarginRequired(
              underlyingAssetAddress,
              strikeAssetAddress,
              vault.collateralAssetAddress,
              vault.shortAmount,
              strikePrice,
              vault.latestUnderlyingAssetPrice,
              expiryTimestamp,
              collateralAssetDecimals,
              isPutOption
            )) * 2;

          const liquidatorVaultNonce = setLiquidationVaultNonce(
            expiryTimestamp,
            Liquidator,
            settlementVaults,
            vault
          );

          if (aggressiveLiquidationMode) {
            if (isPutOption) {
              await liquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });

              return;
            } else {
              // call option
              await prepareCallCollateral(Liquidator, {
                collateralAssetDecimals,
                collateralAssetNakedMarginRequirement,
                vaultLatestUnderlyingAssetPrice:
                  vault.latestUnderlyingAssetPrice,
              });

              await liquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });

              return;
            }
          }

          const estimatedLiquidationTransactionCost =
            await calculateLiquidationTransactionCost({
              collateralToDeposit: collateralAssetNakedMarginRequirement,
              gasPriceStore: Liquidator.gasPriceStore,
              liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });

          const estimatedCostToLiquidateInUSD =
            deribitBestAskPrice +
            estimatedLiquidationTransactionCost +
            Math.max(
              Number(process.env.DERIBIT_PRICE_MULTIPLIER) *
                deribitBestAskPrice,
              Number(process.env.MINIMUM_LIQUIDATION_PRICE)
            );

          if (isPutOption) {
            if (
              vault.latestAuctionPrice.toNumber() /
                10 ** collateralAssetDecimals >
              estimatedCostToLiquidateInUSD
            ) {
              await liquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
            }

            return;
          }

          // call option
          if (
            (((vault.latestAuctionPrice.toString() as any) /
              10 ** collateralAssetDecimals) *
              vault.latestUnderlyingAssetPrice.toNumber()) /
              10 ** 8 >
            estimatedCostToLiquidateInUSD
          ) {
            await prepareCallCollateral(Liquidator, {
              collateralAssetDecimals,
              collateralAssetNakedMarginRequirement,
              vaultLatestUnderlyingAssetPrice: vault.latestUnderlyingAssetPrice,
            });

            await liquidateVault(Liquidator, {
              collateralToDeposit: collateralAssetNakedMarginRequirement,
              liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });
          }

          return;
        } catch (error) {
          Logger.error({
            alert: "Critical error during liquidation attempt",
            at: "Liquidator#attemptLiquidations",
            message: error.message,
            liquidatableVaultOwner,
            vault: {
              latestAuctionPrice: vault.latestAuctionPrice.toString(),
              latestUnderlyingAssetPrice:
                vault.latestUnderlyingAssetPrice.toString(),
              collateralAssetAddress: vault.collateralAssetAddress,
              roundId: vault.roundId.toString(),
              shortAmount: vault.shortAmount.toString(),
              shortOtokenAddress: vault.shortOtokenAddress,
              vaultId: vault.vaultId.toString(),
            },
            error,
          });
        }
      })
    );
  }
}
