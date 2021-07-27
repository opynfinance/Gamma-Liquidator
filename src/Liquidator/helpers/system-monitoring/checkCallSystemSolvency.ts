import slackWebhook from "../liquidations/slackWebhook";
import Liquidator from "../..";

export default async function checkCallSystemSolvency(
  collateralAssetDecimals: number,
  estimatedTotalCostToLiquidateInUSD: number,
  estimatedLiquidationTransactionCost: number,
  liquidatableVaultOwner: string,
  vault: Liquidator["vaultStore"]["liquidatableVaults"][string][number]
): Promise<void> {
  if (
    estimatedTotalCostToLiquidateInUSD >
    (((vault.collateralAmount.toString() as any) /
      10 ** collateralAssetDecimals) *
      (vault.latestUnderlyingAssetPrice.toString() as any)) /
      1e8
  ) {
    await slackWebhook.send({
      text: `\nWarning: Vault insolvent. Not profitable to liquidate.\n\nvaultOwner: ${liquidatableVaultOwner}\nvaultId: ${vault.vaultId.toString()}\nestimated total cost to liquidate (denominated in USD): $${estimatedTotalCostToLiquidateInUSD}\nvault collateral value (denominated in USD): $${
        (((vault.collateralAmount.toString() as any) /
          10 ** collateralAssetDecimals) *
          (vault.latestUnderlyingAssetPrice.toString() as any)) /
        1e8
      }\nput vault: false`,
    });
  }

  if (
    estimatedLiquidationTransactionCost >
    (((((vault.collateralAmount.toString() as any) /
      10 ** collateralAssetDecimals) *
      (vault.latestUnderlyingAssetPrice.toString() as any)) /
      1e8) *
      1) /
      10
  ) {
    await slackWebhook.send({
      text: `\nWarning: Dust amount too low. Estimated gas cost to liquidate is greater than a tenth of the vault collateral amount.\n\nvaultOwner: ${liquidatableVaultOwner}\nvaultId: ${vault.vaultId.toString()}\nestimated gas cost to liquidate (denominated in USD): $${estimatedLiquidationTransactionCost}\nvault collateral value (denominated in USD): $${
        (((vault.collateralAmount.toString() as any) /
          10 ** collateralAssetDecimals) *
          (vault.latestUnderlyingAssetPrice.toString() as any)) /
        1e8
      }\nput vault: false`,
    });
  }

  if (
    estimatedLiquidationTransactionCost >
    (((vault.latestAuctionPrice.toString() as any) /
      10 ** collateralAssetDecimals) *
      (vault.latestUnderlyingAssetPrice.toString() as any)) /
      1e8
  ) {
    await slackWebhook.send({
      text: `\nWarning: Dust amount too low. Estimated gas cost to liquidate is greater than the current auction price.\n\nvaultOwner: ${liquidatableVaultOwner}\nvaultId: ${vault.vaultId.toString()}\nestimated gas cost to liquidate (denominated in USD): $${estimatedLiquidationTransactionCost}\nvault auction price (denominated in USD): $${
        (((vault.latestAuctionPrice.toString() as any) /
          10 ** collateralAssetDecimals) *
          (vault.latestUnderlyingAssetPrice.toString() as any)) /
        1e8
      }\nput vault: false`,
    });
  }
}
