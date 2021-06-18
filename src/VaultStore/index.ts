import { BigNumber } from "ethers";

import { openedNakedMarginVaultEvents } from "./eventFilters";
import { gammaControllerProxyContract, Logger } from "../helpers";

export interface INakedMarginVaults {
  [vaultOwnerAddress: string]: BigNumber[];
}

export default class VaultStore {
  public nakedMarginVaults: INakedMarginVaults;

  constructor() {
    this.nakedMarginVaults = {};
  }

  public getNakedMarginVaults(): INakedMarginVaults {
    return this.nakedMarginVaults;
  }

  start = () => {
    Logger.info({
      at: "VaultStore#start",
      message: "Starting vault store",
    });
    this._subscribe();
  };

  _fetchNakedMarginVaults = async (): Promise<void> => {
    try {
      // TODO: subgraph call to fetch naked margin vaults on startup

      // this.nakedMarginVaults = ...;

      Logger.info({
        at: "VaultStore#_fetchNakedMarginVaults",
        message: "Vault store initialized",
        numberOfNakedMarginVaults: Object.values(this.nakedMarginVaults).flat()
          .length,
      });
    } catch (error) {
      Logger.error({
        at: "VaultStore#_fetchNakedMarginVaults",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async () => {
    await this._fetchNakedMarginVaults();

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

  _subscribeToOpenedNakedMarginVaultEvents = async (): Promise<void> => {
    gammaControllerProxyContract.on(
      openedNakedMarginVaultEvents,
      async (vaultOwner, vaultId) => {
        this.nakedMarginVaults[vaultOwner]
          ? this.nakedMarginVaults[vaultOwner].push(vaultId)
          : (this.nakedMarginVaults[vaultOwner] = [vaultId]);

        Logger.info({
          at: "VaultStore#_subscribeToOpenNakedMarginVaultEvents",
          message: "Vault store updated",
          numberOfNakedMarginVaults: Object.values(
            this.nakedMarginVaults
          ).flat().length,
        });
      }
    );
  };
}
