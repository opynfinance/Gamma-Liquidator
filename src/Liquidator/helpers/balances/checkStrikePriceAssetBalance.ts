import { BigNumber, ethers, utils } from "ethers";

import { erc20ABI } from "../abis";
import supportedLiquidationAssets from "../supportedLiquidationAssets";
import {
  collateralCustodianAddress,
  liquidatorAccountAddress,
  Logger,
  networkInfo,
  provider,
} from "../../../helpers";

export default async function checkStrikePriceAssetBalance(): Promise<void> {
  const networkChainId = (await networkInfo).chainId.toString();

  const { strikePriceAssets } = supportedLiquidationAssets[networkChainId];

  for (const strikePriceAssetAddress of strikePriceAssets) {
    const strikePriceAssetContract = new ethers.Contract(
      strikePriceAssetAddress,
      erc20ABI,
      provider
    );

    const strikePriceAssetBalance = await strikePriceAssetContract.balanceOf(
      collateralCustodianAddress
    );

    if (
      strikePriceAssetBalance.lt(
        BigNumber.from(process.env.MINIMUM_STRIKE_PRICE_ASSET_BALANCE)
      )
    ) {
      const strikePriceAssetDecimals =
        await strikePriceAssetContract.decimals();

      if (collateralCustodianAddress !== liquidatorAccountAddress) {
        Logger.error({
          at: "Liquidator#checkStrikePriceAssetBalance",
          message:
            "Collateral custodian strike price asset balance less than MINIMUM_STRIKE_PRICE_ASSET_BALANCE",
          MINIMUM_STRIKE_PRICE_ASSET_BALANCE: utils.formatUnits(
            process.env.MINIMUM_STRIKE_PRICE_ASSET_BALANCE as string,
            strikePriceAssetDecimals
          ),
          collateralCustodianAddress,
          collateralCustodianBalance: utils.formatUnits(
            strikePriceAssetBalance,
            strikePriceAssetDecimals
          ),
          strikePriceAssetAddress,
          error: Error(
            "Collateral custodian strike price asset balance less than MINIMUM_STRIKE_PRICE_ASSET_BALANCE."
          ),
        });

        continue;
      }

      Logger.error({
        at: "Liquidator#checkStrikePriceAssetBalance",
        message:
          "Liquidator account strike price asset balance less than MINIMUM_STRIKE_PRICE_ASSET_BALANCE",
        MINIMUM_STRIKE_PRICE_ASSET_BALANCE: utils.formatUnits(
          process.env.MINIMUM_STRIKE_PRICE_ASSET_BALANCE as string,
          strikePriceAssetDecimals
        ),
        liquidatorAccountAddress,
        liquidatorAccountBalance: utils.formatUnits(
          strikePriceAssetBalance,
          strikePriceAssetDecimals
        ),
        strikePriceAssetAddress,
        error: Error(
          "Liquidator account strike price asset balance less than MINIMUM_STRIKE_PRICE_ASSET_BALANCE."
        ),
      });
    }
  }
}
