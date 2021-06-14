import { BigNumber } from "ethers";

import GasPriceStore from "../GasPriceStore";
import PriceFeedStore from "../PriceFeedStore";
import VaultStore from "../VaultStore";
import {
  gammaControllerProxyContract,
  liquidatorAccount,
  Logger,
  provider,
} from "../helpers";
import {
  calculateLiquidationTransactionCost,
  fetchCollateralAssetDecimals,
  fetchDeribitBestAskPrice,
  fetchShortOtokenDetails,
  fetchShortOtokenInstrumentInfo,
  marginCalculatorContract,
} from "./helpers";

export interface ILiquidatableVault {
  latestAuctionPrice: BigNumber;
  latestUnderlyingAssetPrice: BigNumber;
  collateralAssetAddress: string;
  roundId: BigNumber;
  shortAmount: BigNumber;
  shortOtokenAddress: string;
  vaultId: BigNumber;
}

export interface ILiquidatableVaults {
  [vaultOwnerAddress: string]: ILiquidatableVault[];
}

export default class Liquidator {
  public gasPriceStore: GasPriceStore;
  public liquidatableVaults: ILiquidatableVaults;
  public liquidatorVaultNonce: BigNumber;
  public priceFeedStore: PriceFeedStore;
  public vaultStore: VaultStore;

  constructor(
    gasPriceStore: GasPriceStore,
    priceFeedStore: PriceFeedStore,
    vaultStore: VaultStore
  ) {
    this.gasPriceStore = gasPriceStore;
    this.liquidatableVaults = {};
    this.liquidatorVaultNonce = BigNumber.from(1);
    this.priceFeedStore = priceFeedStore;
    this.vaultStore = vaultStore;
  }

  start = (): void => {
    Logger.info({
      at: "Liquidator#start",
      message: "Starting liquidator",
    });
    this._subscribe();
  };

  _fetchLiquidatorVaultNonce = async (): Promise<void> => {
    try {
      this.liquidatorVaultNonce =
        await gammaControllerProxyContract.getAccountVaultCounter(
          liquidatorAccount.address
        );

      Logger.info({
        at: "Liquidator#_fetchLiquidatorVaultNonce",
        message: "Liquidator vault nonce initialized",
        vaultNonce: this.liquidatorVaultNonce.toString(),
      });
    } catch (error) {
      Logger.error({
        at: "Liquidator#_fetchLiquidatorVaultNonce",
        message: error.message,
        error,
      });
      this._fetchLiquidatorVaultNonce();
    }
  };

  _initialLiquidationAttempt = async (): Promise<void> => {
    const nakedMarginVaults = this.vaultStore.getNakedMarginVaults();
    const vaultOwnerAddresses = Object.keys(nakedMarginVaults);

    for (const vaultOwnerAddress of vaultOwnerAddresses) {
      await Promise.all(
        nakedMarginVaults[vaultOwnerAddress].map(async (vaultId) => {
          try {
            /* eslint-disable no-var */
            var [vaultDetails] = await gammaControllerProxyContract.getVault(
              vaultOwnerAddress,
              vaultId
            );

            if (!vaultDetails) return;
          } catch (error) {
            Logger.error({
              at: "Liquidator#_initialLiquidationAttempt",
              message: error.message,
              error,
            });
          }

          // currently only one vault per vaultId
          // here we check if the vault is no longer short
          if (vaultDetails.shortAmounts[0].eq(0)) return;

          // currently only one collateralAsset address per vault
          const collateralAssetAddress = vaultDetails.collateralAssets[0];
          // currently only one short position per vault
          const shortAmount = vaultDetails.shortAmounts[0];
          // currently only one shortOtoken address per vault
          const shortOtokenAddress = vaultDetails.shortOtokens[0];

          try {
            /* eslint-disable no-var, @typescript-eslint/no-non-null-assertion */
            var { answer, roundId } = this.priceFeedStore.getLatestRoundData()!;

            /* eslint-disable no-var */
            var [isUnderCollateralized, currentRoundIdCalculatedAuctionPrice] =
              await gammaControllerProxyContract.isLiquidatable(
                vaultOwnerAddress,
                vaultId,
                roundId
              );

            if (!isUnderCollateralized) return;
          } catch (error) {
            Logger.error({
              at: "Liquidator#_initialLiquidationAttempt",
              message: error.message,
              error,
            });
          }

          if (this.liquidatableVaults[vaultOwnerAddress]) {
            let vaultPresent = false;
            await Promise.all(
              this.liquidatableVaults[vaultOwnerAddress].map(async (vault) => {
                if (vaultId.eq(vault.vaultId)) {
                  vaultPresent = true;

                  if (!roundId.eq(vault.roundId)) {
                    const [, oldRoundIdRecalculatedAuctionPrice] =
                      await gammaControllerProxyContract.isLiquidatable(
                        vaultOwnerAddress,
                        vaultId,
                        vault.roundId
                      );
                    if (
                      currentRoundIdCalculatedAuctionPrice.gt(
                        oldRoundIdRecalculatedAuctionPrice
                      )
                    ) {
                      vault.latestAuctionPrice =
                        currentRoundIdCalculatedAuctionPrice;
                      vault.roundId = roundId;
                    } else {
                      vault.latestAuctionPrice =
                        oldRoundIdRecalculatedAuctionPrice;
                    }
                  }
                }
              })
            );
            if (!vaultPresent) {
              this.liquidatableVaults[vaultOwnerAddress].push({
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                collateralAssetAddress,
                roundId,
                shortAmount,
                shortOtokenAddress,
                vaultId,
              });
            }
          } else {
            this.liquidatableVaults[vaultOwnerAddress] = [
              {
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                collateralAssetAddress,
                roundId,
                shortAmount,
                shortOtokenAddress,
                vaultId,
              },
            ];
          }
        })
      );
    }

    const liquidatableVaultOwners = Object.keys(this.liquidatableVaults);

    if (liquidatableVaultOwners.length === 0) {
      Logger.info({
        at: "Liquidator#_initialLiquidationAttempt",
        message: "No liquidatable vaults",
      });
      return;
    }

    const underlyingAsset = this.priceFeedStore.getUnderlyingAsset();

    for (const liquidatableVaultOwner of liquidatableVaultOwners) {
      await Promise.all(
        this.liquidatableVaults[liquidatableVaultOwner].map(async (vault) => {
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
              gasPriceStore: this.gasPriceStore,
              liquidatorVaultNonce: this.liquidatorVaultNonce,
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
        })
      );
    }
  };

  _subscribe = async (): Promise<void> => {
    await this._fetchLiquidatorVaultNonce();
    await this._initialLiquidationAttempt();

    Logger.info({
      at: "Liquidator#_subscribe",
      message: "Subscribing to new blocks...",
      network: (await provider.getNetwork()).name,
    });

    try {
      //   this._subscribeToNewBlocks();
    } catch (error) {
      Logger.error({
        at: "Liquidator#_subscribe",
        message: error.message,
        error,
      });
      this._subscribe();
    }
  };
}
