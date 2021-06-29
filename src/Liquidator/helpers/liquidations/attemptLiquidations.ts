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

          const collateralAssetDecimals = await fetchCollateralAssetDecimals(
            vault.collateralAssetAddress
          );

          let aggressiveLiquidationMode = false,
            deribitBestAskPrice = 0;

          try {
            deribitBestAskPrice = await fetchDeribitBestAskPrice({
              ...shortOtokenInstrumentInfo,
              underlyingAsset,
            });
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

          vault.latestAuctionPrice = BigNumber.from(vault.latestAuctionPrice);
          vault.latestUnderlyingAssetPrice = BigNumber.from(
            vault.latestUnderlyingAssetPrice
          );
          vault.roundId = BigNumber.from(vault.roundId);
          vault.shortAmount = BigNumber.from(vault.shortAmount);
          vault.vaultId = BigNumber.from(vault.vaultId);

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

          if (aggressiveLiquidationMode) {
            if (isPutOption) {
              return await liquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
            } else {
              // call option
              await prepareCallCollateral(Liquidator, {
                collateralAssetDecimals,
                collateralAssetNakedMarginRequirement,
                vaultLatestUnderlyingAssetPrice:
                  vault.latestUnderlyingAssetPrice,
              });

              return await liquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetNakedMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
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

          const estimatedProfitInUSD =
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
              estimatedProfitInUSD
            ) {
              return await liquidateVault(Liquidator, {
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
            ((vault.latestAuctionPrice.toNumber() /
              10 ** collateralAssetDecimals.toNumber()) *
              vault.latestUnderlyingAssetPrice.toNumber()) /
              10 ** 8 >
            estimatedProfitInUSD
          ) {
            await prepareCallCollateral(Liquidator, {
              collateralAssetDecimals,
              collateralAssetNakedMarginRequirement,
              vaultLatestUnderlyingAssetPrice: vault.latestUnderlyingAssetPrice,
            });

            return await liquidateVault(Liquidator, {
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
