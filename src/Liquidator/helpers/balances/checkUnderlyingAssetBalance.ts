import { BigNumber, ethers, utils } from "ethers";

import { erc20ABI } from "../abis";
import supportedLiquidationAssets from "../supportedLiquidationAssets";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  networkInfo,
  provider,
  triggerPagerDutyNotification,
} from "../../../helpers";

export default async function checkUnderlyingAssetBalance(): Promise<void> {
  const networkChainId = (await networkInfo).chainId.toString();

  const { underlyingAssets } = supportedLiquidationAssets[networkChainId];

  for (const underlyingAssetAddress of underlyingAssets) {
    const underlyingAssetContract = new ethers.Contract(
      underlyingAssetAddress,
      erc20ABI,
      provider
    );

    const underlyingAssetBalance = await underlyingAssetContract.balanceOf(
      collateralCustodianAddress
    );

    if (
      underlyingAssetBalance.lt(
        BigNumber.from(process.env.MINIMUM_UNDERLYING_ASSET_BALANCE)
      )
    ) {
      const underlyingAssetDecimals = await underlyingAssetContract.decimals();

      if (collateralCustodianAddress !== liquidatorAccountAddress) {
        const message =
          "Collateral custodian underlying asset balance less than MINIMUM_UNDERLYING_ASSET_BALANCE";

        Logger.error({
          at: "Liquidator#checkUnderlyingAssetBalance",
          message,
          MINIMUM_UNDERYLING_ASSET_BALANCE: utils.formatUnits(
            process.env.MINIMUM_UNDERLYING_ASSET_BALANCE as string,
            underlyingAssetDecimals
          ),
          collateralCustodianAddress,
          collateralCustodianBalance: utils.formatUnits(
            underlyingAssetBalance,
            underlyingAssetDecimals
          ),
          underlyingAssetAddress,
          error: Error(
            "Collateral custodian underlying asset balance less than MINIMUM_UNDERLYING_ASSET_BALANCE."
          ),
        });

        if (process.env.PAGERDUTY_ROUTING_KEY) {
          await triggerPagerDutyNotification(message);
        }

        continue;
      }

      const message =
        "Liquidator account underlying asset balance less than MINIMUM_UNDERLYING_ASSET_BALANCE";

      Logger.error({
        at: "Liquidator#checkUnderlyingAssetBalance",
        message,
        MINIMUM_UNDERYLING_ASSET_BALANCE: utils.formatUnits(
          process.env.MINIMUM_UNDERLYING_ASSET_BALANCE as string,
          underlyingAssetDecimals
        ),
        liquidatorAccountAddress,
        liquidatorAccountBalance: utils.formatUnits(
          underlyingAssetBalance,
          underlyingAssetDecimals
        ),
        underlyingAssetAddress,
        error: Error(
          "Liquidator account underlying asset balance less than MINIMUM_UNDERLYING_ASSET_BALANCE."
        ),
      });

      if (process.env.PAGERDUTY_ROUTING_KEY) {
        await triggerPagerDutyNotification(message);
      }

      return;
    }
  }
}
