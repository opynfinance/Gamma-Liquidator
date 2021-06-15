import { BigNumber } from "ethers";

import { attemptLiquidations, fetchLiquidatableVaults } from "./helpers";
import { ILiquidatableVaults, ISettlementStore } from "./types";
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
  public settlementStore: ISettlementStore;
  public vaultStore: VaultStore;

  constructor(
    gasPriceStore: GasPriceStore,
    priceFeedStore: PriceFeedStore,
    vaultStore: VaultStore
  ) {
    this.gasPriceStore = gasPriceStore;
    this.latestLiquidatorVaultNonce = BigNumber.from(0);
    this.liquidatableVaults = {};
    this.priceFeedStore = priceFeedStore;
    this.settlementStore = {};
    this.vaultStore = vaultStore;
  }

  start = (): void => {
    Logger.info({
      at: "Liquidator#start",
      message: "Starting liquidator",
    });
    this._subscribe();
  };

  _attemptLiquidations = async (): Promise<void> => {
    try {
      await fetchLiquidatableVaults(this);

      const liquidatableVaultOwners = Object.keys(this.liquidatableVaults);

      if (liquidatableVaultOwners.length === 0) {
        Logger.info({
          at: "Liquidator#_attemptLiquidations",
          message: "No liquidatable vaults",
        });
        return;
      }

      Logger.info({
        at: "Liquidator#_attemptLiquidations",
        message: "Liquidatable vaults detected",
        numberOfLiquidatableVaults: Object.values(
          this.liquidatableVaults
        ).flat().length,
      });

      await attemptLiquidations(liquidatableVaultOwners, this);
    } catch (error) {
      Logger.error({
        at: "Liquidator#_attemptLiquidations",
        message: error.message,
        error,
      });
    }
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

  _subscribe = async (): Promise<void> => {
    await this._setLatestLiquidatorVaultNonce();
    await this._attemptLiquidations();

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
