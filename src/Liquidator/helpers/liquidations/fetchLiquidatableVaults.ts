import { BigNumber } from "ethers";

import slackWebhook from "./slackWebhook";
import Liquidator from "../../index";
import { gammaControllerProxyContract, Logger } from "../../../helpers";

export default async function fetchLiquidatableVaults(
  Liquidator: Liquidator
): Promise<void> {
  const nakedMarginVaults = Liquidator.vaultStore.getNakedMarginVaults();
  const vaultOwnerAddresses = Object.keys(nakedMarginVaults);

  for (const vaultOwnerAddress of vaultOwnerAddresses) {
    await Promise.all(
      nakedMarginVaults[vaultOwnerAddress].map(async (vaultId) => {
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

          const { answer, roundId } =
            Liquidator.priceFeedStore.getLatestRoundData();

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

                  if (
                    process.env.MONITOR_SYSTEM_SOLVENCY &&
                    Math.floor(Date.now() / 1000) -
                      Math.floor(
                        vault.undercollateralizedTimestamp.toNumber() / 1000
                      ) >=
                      60 * 30
                  ) {
                    await slackWebhook.send({
                      text: `\nWarning: Vault liquidatable, but unliquidated for longer than 30 minutes.\n\nvaultOwner: ${vaultOwnerAddress}\nvaultId ${vaultId.toString()}\nestimated time undercollateralized: ${
                        (Math.floor(Date.now() / 1000) -
                          Math.floor(
                            vault.undercollateralizedTimestamp.toNumber() / 1000
                          )) /
                        60
                      } minutes`,
                    });
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
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                roundId,
                shortAmount,
                shortOtokenAddress,
                undercollateralizedTimestamp: BigNumber.from(Date.now()),
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
                latestAuctionPrice: currentRoundIdCalculatedAuctionPrice,
                latestUnderlyingAssetPrice: answer,
                roundId,
                shortAmount,
                shortOtokenAddress,
                undercollateralizedTimestamp: BigNumber.from(Date.now()),
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
      })
    );
  }
}
