import { gammaControllerProxyContract, Logger } from "../helpers";
import { openedNakedMarginVaultEvents } from "./eventFilters";
import fetchNakedMarginVaults from "./fetchNakedMarginVaults";
import fetchSettlementVaults from "./fetchSettlementVaults";
import {
  ILiquidatableVaults,
  INakedMarginVaults,
  ISettleableVaults,
  ISettlementVaults,
} from "./types";

export default class VaultStore {
  public liquidatableVaults: ILiquidatableVaults;
  public nakedMarginVaults: INakedMarginVaults;
  public settleableVaults: ISettleableVaults;
  public settlementVaults: ISettlementVaults;

  constructor() {
    this.liquidatableVaults = {};
    this.nakedMarginVaults = {};
    this.settleableVaults = {};
    this.settlementVaults = {};
  }

  public getLiquidatableVaults(): ILiquidatableVaults {
    return this.liquidatableVaults;
  }

  public getNakedMarginVaults(): INakedMarginVaults {
    return this.nakedMarginVaults;
  }

  public getSettleableVaults(): ISettleableVaults {
    return this.settleableVaults;
  }

  public getSettlementVaults(): ISettlementVaults {
    return this.settlementVaults;
  }

  start = (): void => {
    Logger.info({
      at: "VaultStore#start",
      message: "Starting vault store",
    });
    this._subscribe();
  };

  _fetchNakedMarginVaults = async (): Promise<void> => {
    try {
      this.nakedMarginVaults = await fetchNakedMarginVaults();

      Logger.info({
        at: "VaultStore#_fetchNakedMarginVaults",
        message: "Naked margin vault store initialized",
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

  _fetchSettlementVaults = async (): Promise<void> => {
    try {
      this.settlementVaults = await fetchSettlementVaults();

      Logger.info({
        at: "VaultStore#_fetchSettlementVaults",
        message: "Settlement vault store initialized",
        numberOfSettlementVaults: Object.values(this.settlementVaults).flat()
          .length,
      });
    } catch (error) {
      Logger.error({
        at: "VaultStore#_fetchSettlementVaults",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async (): Promise<void> => {
    await this._fetchNakedMarginVaults();
    await this._fetchSettlementVaults();

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
