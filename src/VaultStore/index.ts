import { openedNakedMarginVaultEvents } from "./eventFilters";
import { gammaControllerProxyContract, Logger } from "../helpers";

export default class VaultStore {
  public liquidatableVaults: any;

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

  _subscribe = async () => {
    Logger.info({
      at: "VaultStore#_subscribe",
      message: "Subscribing to Gamma Controller vault events...",
      address: gammaControllerProxyContract.address,
    });

    try {
      this._subscribeToOpenedNakedMarginVaultEvents();
      this._subscribeToVaultLiquidatedEvents();
      this._subscribeToVaultSettledEvents();
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
        // currently only one vault per vaultId
        const { shortAmounts, shortOtokens } =
          await gammaControllerProxyContract.getVault(vaultOwner, vaultId)[0];

        this.liquidatableVaults[vaultOwner]
          ? this.liquidatableVaults[vaultOwner].push({
              shortAmount: shortAmounts[0], // currently only one vault per vaultId
              shortOtokenAddress: shortOtokens[0], // currently only one shortOtoken address per vault
              vaultId,
            })
          : (this.liquidatableVaults[vaultOwner] = [
              {
                shortAmount: shortAmounts[0], // currently only one vault per vaultId
                shortOtokenAddress: shortOtokens[0], // currently only one shortOtoken address per vault
                vaultId,
              },
            ]);

        Logger.info({
          at: "VaultStore#_subscribeToOpenNakedMarginVaultEvents",
          message: "Vault store updated",
        });
      }
    );
  };

  _subscribeToVaultLiquidatedEvents = async () => {
    gammaControllerProxyContract.on(
      "VaultLiquidated",
      (
        _liquidator,
        _payoutRecipient,
        vaultOwner,
        debtAmount,
        _auctionPrice,
        _collateralPayoutAmount,
        _auctionStartingRoundId
      ) => {
        // If the debt is clear (Number 0 is falsy), update vault store
        if (!debtAmount.toNumber() && this.liquidatableVaults[vaultOwner]) {
          // For now assume only one liquidatable vault per owner
          // TODO change
          this.liquidatableVaults[vaultOwner].pop();

          Logger.info({
            at: "VaultStore#_subscribeToVaultLiquidatedEvents",
            message: "Vault store updated",
          });
        }
      }
    );
  };

  _subscribeToVaultSettledEvents = async () => {
    gammaControllerProxyContract.on(
      "VaultSettled",
      (
        vaultOwner,
        _payoutRecipient,
        _oTokenAddress,
        vaultId,
        _payoutAmount
      ) => {
        if (this.liquidatableVaults[vaultOwner]) {
          // vaultIds are unique & start at 1, so subtract 1 for index
          this.liquidatableVaults[vaultOwner].splice(vaultId - 1, 1);

          Logger.info({
            at: "VaultStore#_subscribeToVaultSettledEvents",
            message: "Vault store updated",
          });
        }
      }
    );
  };
}
