import { BigNumber } from "ethers";

import parseUnderlyingAssetPriceFeedContractAddress from "./parseUnderlyingAssetPriceFeedContractAddress";
import { checkUnderwaterSystemSolvency } from "../system-monitoring";
import Liquidator from "../../index";
import { gammaControllerProxyContract, Logger } from "../../../helpers";

export default async function fetchLiquidatableVaults(
  Liquidator: Liquidator
): Promise<void> {
  const nakedMarginVaults = Liquidator.vaultStore.getNakedMarginVaults();
  const vaultOwnerAddresses = Object.keys(nakedMarginVaults);

  for (const vaultOwnerAddress of vaultOwnerAddresses) {
    await nakedMarginVaults[vaultOwnerAddress].reduce(
      async (previousPromise, vaultId) => {
        await previousPromise;

        try {
          const [vaultDetails] =
            await gammaControllerProxyContract.getVaultWithDetails(
              vaultOwnerAddress,
              vaultId
            );

          if (!vaultDetails) return;

          if (!vaultDetails.shortAmounts[0]) return;

          if (vaultDetails.shortAmounts[0].eq(0))
            // currently only one vault per vaultId
            // here we check if the vault is no longer short
            return;

          // currently only one collateral asset per vault
          const collateralAmount = vaultDetails.collateralAmounts[0];
          // currently only one collateralAsset address per vault
          const collateralAssetAddress = vaultDetails.collateralAssets[0];
          // currently only one short position per vault
          const shortAmount = vaultDetails.shortAmounts[0];
          // currently only one shortOtoken address per vault
          const shortOtokenAddress = vaultDetails.shortOtokens[0];

          const { underlyingAssetPriceFeedContractAddress, underlyingAsset } =
            await parseUnderlyingAssetPriceFeedContractAddress(
              shortOtokenAddress
            );

          const { answer, roundId } =
            Liquidator.priceFeedStore.getLatestRoundData()[
              underlyingAssetPriceFeedContractAddress
            ];

          let isUnderCollateralized = false,
            currentRoundIdCalculatedAuctionPrice = BigNumber.from(0);

          try {
            [isUnderCollateralized, currentRoundIdCalculatedAuctionPrice] =
              await gammaControllerProxyContract.isLiquidatable(
                vaultOwnerAddress,
                vaultId,
                roundId
              );
          } catch (error) {
            // assume false
          }

          const liquidatableVaults =
            Liquidator.vaultStore.getLiquidatableVaults();

          if (liquidatableVaults[vaultOwnerAddress]) {
            let vaultPresent = false;
            await Promise.all(
              liquidatableVaults[vaultOwnerAddress].map(async (vault) => {
                vault.collateralAmount = BigNumber.from(vault.collateralAmount);
                vault.latestAuctionPrice = BigNumber.from(
                  vault.latestAuctionPrice
                );
                vault.roundId = BigNumber.from(vault.roundId);
                vault.undercollateralizedTimestamp = BigNumber.from(
                  vault.undercollateralizedTimestamp
                );
                vault.vaultId = BigNumber.from(vault.vaultId);

                if (vaultId.eq(vault.vaultId)) {
                  vaultPresent = true;

                  if (!isUnderCollateralized) {
                    vault.undercollateralizedTimestamp = BigNumber.from(
                      Date.now()
                    );
                    return;
                  }

                  if (process.env.MONITOR_SYSTEM_SOLVENCY) {
                    await checkUnderwaterSystemSolvency(
                      vault,
                      vaultId,
                      vaultOwnerAddress
                    );
                  }

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
                  } else {
                    if (
                      currentRoundIdCalculatedAuctionPrice.gt(
                        vault.latestAuctionPrice
                      )
                    ) {
                      vault.latestAuctionPrice =
                        currentRoundIdCalculatedAuctionPrice;
                    }
                  }
                }
              })
            );

            if (!vaultPresent) {
              if (!isUnderCollateralized) return;

              liquidatableVaults[vaultOwnerAddress].push({
                collateralAmount,
                collateralAssetAddress,
                insolvencyAmountInUSD: 0,
                isPutVault: null,
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                roundId,
                shortAmount,
                shortOtokenAddress,
                undercollateralizedTimestamp: BigNumber.from(Date.now()),
                underlyingAsset,
                vaultId,
              });

              return await Liquidator.vaultStore.writeLiquidatableVaultsToDisk(
                liquidatableVaults
              );
            }

            return await Liquidator.vaultStore.writeLiquidatableVaultsToDisk(
              liquidatableVaults
            );
          } else {
            if (!isUnderCollateralized) return;

            liquidatableVaults[vaultOwnerAddress] = [
              {
                collateralAmount,
                collateralAssetAddress,
                insolvencyAmountInUSD: 0,
                isPutVault: null,
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                roundId,
                shortAmount,
                shortOtokenAddress,
                undercollateralizedTimestamp: BigNumber.from(Date.now()),
                underlyingAsset,
                vaultId,
              },
            ];

            return await Liquidator.vaultStore.writeLiquidatableVaultsToDisk(
              liquidatableVaults
            );
          }
        } catch (error) {
          Logger.error({
            at: "Liquidator#fetchLiquidatableVaults",
            message: error.message,
            vaultOwnerAddress,
            vaultId: vaultId.toString(),
            error,
          });
        }
      },
      Promise.resolve()
    );
  }
}
