import { BigNumber } from "ethers";

import { attemptLiquidations, fetchLiquidatableVaults } from "./helpers";
import { ILiquidatableVaults } from "./types";
import GasPriceStore from "../GasPriceStore";
import PriceFeedStore from "../PriceFeedStore";
import VaultStore from "../VaultStore";
import {
  gammaControllerProxyContract,
  liquidatorAccount,
  Logger,
  provider,
} from "../helpers";

export default class Liquidator {
  public gasPriceStore: GasPriceStore;
  public latestLiquidatorVaultNonce: BigNumber;
  public liquidatableVaults: ILiquidatableVaults;
  public priceFeedStore: PriceFeedStore;
  public vaultStore: VaultStore;

  constructor(
    gasPriceStore: GasPriceStore,
    priceFeedStore: PriceFeedStore,
    vaultStore: VaultStore
  ) {
    this.gasPriceStore = gasPriceStore;
    this.latestLiquidatorVaultNonce = BigNumber.from(1);
    this.liquidatableVaults = {};
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

  _setLatestLiquidatorVaultNonce = async (): Promise<void> => {
    try {
      this.latestLiquidatorVaultNonce = (
        await gammaControllerProxyContract.getAccountVaultCounter(
          liquidatorAccount.address
        )
      ).add(1);

      Logger.info({
        at: "Liquidator#_setLatestLiquidatorVaultNonce",
        message: "Latest Liquidator vault nonce initialized",
        vaultNonce: this.latestLiquidatorVaultNonce.toString(),
      });
    } catch (error) {
      Logger.error({
        at: "Liquidator#_setLatestLiquidatorVaultNonce",
        message: error.message,
        error,
      });
      this._setLatestLiquidatorVaultNonce();
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
    await this._initialLiquidationAttempt();
    await this._setLatestLiquidatorVaultNonce();

    Logger.info({
      at: "Liquidator#_subscribe",
      message: "Subscribing to new blocks...",
      network: (await provider.getNetwork()).name,
    });

    try {
      // this._subscribeToNewBlocks();
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
