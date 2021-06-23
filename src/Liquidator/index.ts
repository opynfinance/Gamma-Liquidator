import { BigNumber } from "ethers";

import {
  attemptLiquidations,
  attemptSettlements,
  calculateSettleableVaults,
  checkAssetAllowances,
  checkEtherBalance,
  fetchLiquidatableVaults,
  setInitialLiquidatorVaultNonce,
} from "./helpers";
import GasPriceStore from "../GasPriceStore";
import PriceFeedStore from "../PriceFeedStore";
import VaultStore from "../VaultStore";
import { Logger, provider } from "../helpers";

export default class Liquidator {
  public gasPriceStore: GasPriceStore;
  public latestLiquidatorVaultNonce: BigNumber;
  public priceFeedStore: PriceFeedStore;
  public vaultStore: VaultStore;

  constructor(
    gasPriceStore: GasPriceStore,
    priceFeedStore: PriceFeedStore,
    vaultStore: VaultStore
  ) {
    this.gasPriceStore = gasPriceStore;
    this.latestLiquidatorVaultNonce = BigNumber.from(0);
    this.priceFeedStore = priceFeedStore;
    this.vaultStore = vaultStore;
  }

  public getLatestLiquidatorVaultNonce(): BigNumber {
    return this.latestLiquidatorVaultNonce;
  }

  public setLatestLiquidatorVaultNonce(
    nextLatestLiquidatorVaultNonce: BigNumber
  ): void {
    this.latestLiquidatorVaultNonce = nextLatestLiquidatorVaultNonce;
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

      const liquidatableVaults = this.vaultStore.getLiquidatableVaults();
      const liquidatableVaultOwners = Object.keys(liquidatableVaults);

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
        numberOfLiquidatableVaults:
          Object.values(liquidatableVaults).flat().length,
      });

      await attemptLiquidations(
        liquidatableVaultOwners,
        liquidatableVaults,
        this
      );
    } catch (error) {
      Logger.error({
        at: "Liquidator#_attemptLiquidations",
        message: error.message,
        error,
      });
    }
  };

  _attemptSettlements = async (updatedTimestamp: BigNumber): Promise<void> => {
    try {
      const settleableVaults = await calculateSettleableVaults(
        this,
        updatedTimestamp
      );

      if (Object.keys(settleableVaults).length === 0) {
        Logger.info({
          at: "Liquidator#_attemptSettlements",
          message: "No settleable vaults",
        });
        return;
      }

      Logger.info({
        at: "Liquidator#_attemptSettlements",
        message: "Settleable vaults detected",
        numberOfSettleableVaults: Object.values(settleableVaults).flat().length,
      });

      await attemptSettlements(settleableVaults);
    } catch (error) {
      Logger.error({
        at: "Liquidator#_attemptSettlements",
        message: error.message,
        error,
      });
    }
  };

  _subscribe = async (): Promise<void> => {
    await checkAssetAllowances();
    await checkEtherBalance();
    await setInitialLiquidatorVaultNonce(this);
    await this._attemptLiquidations();
    await this._attemptSettlements(
      this.priceFeedStore.getLatestRoundData().updatedAt
    );

    Logger.info({
      at: "Liquidator#_subscribe",
      message: "Subscribing to new blocks...",
      network: (await provider.getNetwork()).name,
    });

    try {
      this._subscribeToNewBlocks();
      this._subscribeToChainlinkTimestampUpdate();
    } catch (error) {
      Logger.error({
        at: "Liquidator#_subscribe",
        message: error.message,
        error,
      });
      this._subscribe();
    }
  };

  _subscribeToChainlinkTimestampUpdate = async (): Promise<void> => {
    process.on(
      "chainlinkTimestampUpdate",
      async (updatedTimestamp: BigNumber) => {
        try {
          await this._attemptSettlements(updatedTimestamp);
        } catch (error) {
          Logger.error({
            at: "Liquidator#_subscribeToChainlinkTimestampUpdate",
            message: error.message,
            error,
          });
        }
      }
    );
  };

  _subscribeToNewBlocks = async (): Promise<void> => {
    provider.on("block", async (_blockNumber) => {
      try {
        await checkEtherBalance();
        await this._attemptLiquidations();
      } catch (error) {
        Logger.error({
          at: "Liquidator#_subscribeToNewBlocks",
          message: error.message,
          error,
        });
      }
    });
  };
}
