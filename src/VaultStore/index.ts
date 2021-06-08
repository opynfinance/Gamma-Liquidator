import { openedNakedMarginVaultEvents } from "./eventFilters";
import { gammaControllerProxyContract, Logger } from "../helpers";

export interface ILiquidatableVaults {
  [vaultOwnerAddress: string]: number[];
}

export default class VaultStore {
  public liquidatableVaults: ILiquidatableVaults;

  constructor() {
    this.liquidatableVaults = {};
  }

  public getLiquidatableVaults() {
    return this.liquidatableVaults;
  }

  start = () => {
    Logger.info({
      at: "VaultStore#start",
      message: "Starting vault store",
    });
    this._subscribe();
  };

  _fetchLatestMarginVaultState = async () => {
    try {
      // TODO: subgraph call to fetch all naked margin vaults on startup

      // this.liquidatableVaults = ...;

      Logger.info({
        at: "VaultStore#_fetchLatestMarginVaultState",
        message: "Vault store initialized",
      });
    } catch (error) {
      Logger.error({
        at: "VaultStore#_fetchLatestMarginVaultState",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async () => {
    await this._fetchLatestMarginVaultState();

    Logger.info({
      at: "VaultStore#_subscribe",
      message: "Subscribing to Gamma Controller vault events...",
      address: gammaControllerProxyContract.address,
    });

    try {
      this._subscribeToOpenedNakedMarginVaultEvents();
    } catch (error) {
      Logger.error({
        at: "VaultStore#_subscribe",
        message: error.message,
        error,
      });
      this._subscribe();
    }
  };

  _subscribeToOpenedNakedMarginVaultEvents = async () => {
    gammaControllerProxyContract.on(
      openedNakedMarginVaultEvents,
      async (vaultOwner, vaultId) => {
        this.liquidatableVaults[vaultOwner]
          ? this.liquidatableVaults[vaultOwner].push(vaultId)
          : (this.liquidatableVaults[vaultOwner] = [vaultId]);

        Logger.info({
          at: "VaultStore#_subscribeToOpenNakedMarginVaultEvents",
          message: "Vault store updated",
        });
      }
    );
  };
}
