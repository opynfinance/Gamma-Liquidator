import { BigNumber } from "ethers";

import liquidateVault from "./liquidateVault";
import mintAndLiquidateVault from "./mintAndLiquidateVault";
import prepareCollateral from "./prepareCollateral";
import setLiquidationVaultNonce from "./setLiquidationVaultNonce";
import transferOtokens from "./transferOtokens";
import {
  calculateLiquidationTransactionCost,
  fetchCollateralAssetDecimals,
  fetchDeribitBestAskPrice,
  fetchDeribitDelta,
  fetchDeribitMarkPrice,
  fetchShortOtokenInstrumentInfo,
  marginCalculatorContract,
  setLatestLiquidatorVaultNonce,
} from "../";
import { checkCollateralAssetBalance, checkOtokenBalance } from "../balances";
import {
  checkCallSystemSolvency,
  checkPutSystemSolvency,
  checkTotalSystemSolvency,
} from "../system-monitoring";
import Liquidator from "../../index";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  triggerPagerDutyNotification,
} from "../../../helpers";

export default async function attemptLiquidations(
  liquidatableVaultOwners: string[],
  liquidatableVaults: Liquidator["vaultStore"]["liquidatableVaults"],
  Liquidator: Liquidator
): Promise<void> {
  for await (const liquidatableVaultOwner of liquidatableVaultOwners) {
    for await (const vault of liquidatableVaults[liquidatableVaultOwner]) {
      try {
        const shortOtokenInstrumentInfo = await fetchShortOtokenInstrumentInfo(
          vault.shortOtokenAddress
        );

        const isPutOption = shortOtokenInstrumentInfo.optionType === "P";

        if (vault.isPutVault === null) {
          vault.isPutVault = isPutOption;
        }

        const collateralAssetDecimals = await fetchCollateralAssetDecimals(
          vault.collateralAssetAddress
        );

        vault.collateralAmount = BigNumber.from(vault.collateralAmount);
        vault.collateralAssetDecimals = collateralAssetDecimals;
        vault.latestAuctionPrice = BigNumber.from(vault.latestAuctionPrice);
        vault.latestUnderlyingAssetPrice = BigNumber.from(
          vault.latestUnderlyingAssetPrice
        );
        vault.roundId = BigNumber.from(vault.roundId);
        vault.shortAmount = BigNumber.from(vault.shortAmount);
        vault.vaultId = BigNumber.from(vault.vaultId);

        let optionExistsOnDeribit = true,
          calculatedDeribitPrice = 0;

        try {
          // returned in underlying
          let deribitBestAskPrice = await fetchDeribitBestAskPrice({
            ...shortOtokenInstrumentInfo,
            underlyingAsset: vault.underlyingAsset,
          });

          deribitBestAskPrice =
            (deribitBestAskPrice *
              (vault.latestUnderlyingAssetPrice.toString() as any)) /
            10 ** 8;

          // returned in underlying
          const deribitDelta = await fetchDeribitDelta({
            ...shortOtokenInstrumentInfo,
            underlyingAsset: vault.underlyingAsset,
          });

          const calculatedMaxSpread =
            Number(process.env.DERIBIT_MAX_SPREAD_MULTIPLIER) *
            Math.max(
              Number(process.env.DERIBIT_MIN_SPREAD),
              Number(process.env.DERIBIT_MAX_SPREAD) * deribitDelta
            );

          // returned in underlying
          const deribitMarkPrice = await fetchDeribitMarkPrice({
            ...shortOtokenInstrumentInfo,
            underlyingAsset: vault.underlyingAsset,
          });

          let calculatedMarkPrice =
            deribitMarkPrice * (calculatedMaxSpread / 2);

          calculatedMarkPrice =
            (calculatedMarkPrice *
              (vault.latestUnderlyingAssetPrice.toString() as any)) /
            10 ** 8;

          if (deribitBestAskPrice === 0) {
            deribitBestAskPrice = calculatedMarkPrice;
          }

          calculatedDeribitPrice = Math.min(
            calculatedMarkPrice,
            deribitBestAskPrice
          );
        } catch (error) {
          if (error.message.includes("best_ask_price")) {
            optionExistsOnDeribit = false;
          } else {
            Logger.error({
              alert: "Critical error when fetching Deribit best ask price",
              at: "Liquidator#attemptLiquidations",
              message: error.message,
              ...shortOtokenInstrumentInfo,
              underlyingAsset: vault.underlyingAsset,
              error,
            });

            return;
          }
        }

        let [, collateralAssetMarginRequirement]: any =
          await marginCalculatorContract.getMarginRequired(
            {
              collateralAmounts: [vault.collateralAmount],
              collateralAssets: [vault.collateralAssetAddress],
              longAmounts: [],
              longOtokens: [],
              shortAmounts: [vault.shortAmount],
              shortOtokens: [vault.shortOtokenAddress],
            },
            0
          );

        collateralAssetMarginRequirement =
          (collateralAssetMarginRequirement / 1e27) *
          10 ** collateralAssetDecimals;

        const collateralAssetBalanceSufficient =
          await checkCollateralAssetBalance(
            collateralAssetMarginRequirement,
            collateralAssetDecimals,
            liquidatableVaultOwner,
            vault
          );

        const liquidatorVaultNonce = await setLiquidationVaultNonce(Liquidator);

        if (!optionExistsOnDeribit) {
          if (
            (vault.latestAuctionPrice
              .mul(vault.shortAmount)
              .div(vault.collateralAmount)
              .toString() as any) /
              1e8 >
            Number(process.env.MINIMUM_COLLATERAL_TO_LIQUIDATE_FOR)
          ) {
            if (collateralAssetBalanceSufficient) {
              await prepareCollateral(Liquidator, {
                collateralAssetAddress: vault.collateralAssetAddress,
                collateralAssetMarginRequirement,
              });
            }

            if (isPutOption) {
              return await mintAndLiquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
            } else {
              // call option
              return await mintAndLiquidateVault(Liquidator, {
                collateralToDeposit: collateralAssetMarginRequirement,
                liquidatorVaultNonce,
                vault,
                vaultOwnerAddress: liquidatableVaultOwner,
              });
            }
          }

          return;
        }

        const estimatedLiquidationTransactionCost =
          await calculateLiquidationTransactionCost({
            collateralToDeposit: collateralAssetMarginRequirement,
            gasPriceStore: Liquidator.gasPriceStore,
            liquidatorVaultNonce,
            vault,
            vaultOwnerAddress: liquidatableVaultOwner,
          });

        const estimatedTotalCostToLiquidateInUSD =
          ((calculatedDeribitPrice +
            Math.max(
              Number(process.env.DERIBIT_PRICE_MULTIPLIER) *
                calculatedDeribitPrice,
              Number(process.env.MINIMUM_LIQUIDATION_PRICE)
            )) *
            (vault.shortAmount.toString() as any)) /
            10 ** 8 +
          estimatedLiquidationTransactionCost;

        if (isPutOption) {
          if (
            (((vault.latestAuctionPrice.toString() as any) /
              10 ** collateralAssetDecimals) *
              (vault.shortAmount.toString() as any)) /
              10 ** 8 >
            estimatedTotalCostToLiquidateInUSD
          ) {
            if (collateralCustodianAddress !== liquidatorAccountAddress) {
              if (await checkOtokenBalance(vault)) {
                await transferOtokens(Liquidator, vault);

                return await liquidateVault(Liquidator, {
                  vault,
                  vaultOwnerAddress: liquidatableVaultOwner,
                });
              }
            }

            if (collateralAssetBalanceSufficient) {
              await prepareCollateral(Liquidator, {
                collateralAssetAddress: vault.collateralAssetAddress,
                collateralAssetMarginRequirement,
              });
            }

            return await mintAndLiquidateVault(Liquidator, {
              collateralToDeposit: collateralAssetMarginRequirement,
              liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });
          }

          if (process.env.MONITOR_SYSTEM_SOLVENCY) {
            await checkPutSystemSolvency(
              estimatedLiquidationTransactionCost,
              estimatedTotalCostToLiquidateInUSD,
              liquidatableVaultOwner,
              vault
            );
          }

          return await setLatestLiquidatorVaultNonce(Liquidator);
        } else {
          // call option
          if (
            (((((vault.latestAuctionPrice.toString() as any) /
              10 ** collateralAssetDecimals) *
              (vault.shortAmount.toString() as any)) /
              10 ** 8) *
              (vault.latestUnderlyingAssetPrice.toString() as any)) /
              10 ** 8 >
            estimatedTotalCostToLiquidateInUSD
          ) {
            if (collateralCustodianAddress !== liquidatorAccountAddress) {
              if (await checkOtokenBalance(vault)) {
                await transferOtokens(Liquidator, vault);

                return await liquidateVault(Liquidator, {
                  vault,
                  vaultOwnerAddress: liquidatableVaultOwner,
                });
              }
            }

            if (collateralAssetBalanceSufficient) {
              await prepareCollateral(Liquidator, {
                collateralAssetAddress: vault.collateralAssetAddress,
                collateralAssetMarginRequirement,
              });
            }

            return await mintAndLiquidateVault(Liquidator, {
              collateralToDeposit: collateralAssetMarginRequirement,
              liquidatorVaultNonce,
              vault,
              vaultOwnerAddress: liquidatableVaultOwner,
            });
          }

          if (process.env.MONITOR_SYSTEM_SOLVENCY) {
            await checkCallSystemSolvency(
              estimatedLiquidationTransactionCost,
              estimatedTotalCostToLiquidateInUSD,
              liquidatableVaultOwner,
              vault
            );
          }

          return await setLatestLiquidatorVaultNonce(Liquidator);
        }
      } catch (error) {
        const alert = "Critical error during liquidation attempt";

        Logger.error({
          alert,
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

        if (process.env.PAGERDUTY_ROUTING_KEY) {
          await triggerPagerDutyNotification(`${alert}: ${error.message}`);
        }

        return await setLatestLiquidatorVaultNonce(Liquidator);
      }
    }
  }

  if (process.env.MONITOR_SYSTEM_SOLVENCY) {
    await checkTotalSystemSolvency(liquidatableVaults);
  }
}
