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
import { attemptLiquidations, fetchLiquidatableVaults } from "./helpers";

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
    await fetchLiquidatableVaults(this);

    const liquidatableVaultOwners = Object.keys(this.liquidatableVaults);

    if (liquidatableVaultOwners.length === 0) {
      Logger.info({
        at: "Liquidator#_initialLiquidationAttempt",
        message: "No liquidatable vaults",
      });
      return;
    }

    await attemptLiquidations(liquidatableVaultOwners, this);
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
