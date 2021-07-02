import { BigNumber } from "ethers";

import {
  attemptLiquidations,
  attemptSettlements,
  calculateSettleableVaults,
  checkAssetAllowances,
  checkEtherBalance,
  fetchLiquidatableVaults,
  setLatestLiquidatorVaultNonce,
} from "./helpers";
import GasPriceStore from "../GasPriceStore";
import PriceFeedStore from "../PriceFeedStore";
import VaultStore from "../VaultStore";
import { Logger, provider } from "../helpers";

export default class Liquidator {
  public activeLiquidationState: boolean;
  public gasPriceStore: GasPriceStore;
  public latestLiquidatorVaultNonce: BigNumber;
  public priceFeedStore: PriceFeedStore;
  public vaultStore: VaultStore;

  constructor(
    gasPriceStore: GasPriceStore,
    priceFeedStore: PriceFeedStore,
    vaultStore: VaultStore
  ) {
    this.activeLiquidationState = false;
    this.gasPriceStore = gasPriceStore;
    this.latestLiquidatorVaultNonce = BigNumber.from(0);
    this.priceFeedStore = priceFeedStore;
    this.vaultStore = vaultStore;
  }

  public getLatestLiquidatorVaultNonce(): BigNumber {
    return this.latestLiquidatorVaultNonce;
  }

  public getActiveLiquidationState(): boolean {
    return this.activeLiquidationState;
  }

  public setLatestLiquidatorVaultNonce(
    nextLatestLiquidatorVaultNonce: BigNumber
  ): void {
    this.latestLiquidatorVaultNonce = nextLatestLiquidatorVaultNonce;
  }

  public setActiveLiquidationState(activeLiquidationState: boolean): void {
    this.activeLiquidationState = activeLiquidationState;
  }

  start = (): void => {
    Logger.info({
      at: "Liquidator#start",
      message: "Starting liquidator",
    });
    this._subscribe();
  };

  _attemptLiquidations = async (): Promise<void> => {
    this.setActiveLiquidationState(true);

    try {
      await fetchLiquidatableVaults(this);

      const liquidatableVaults = this.vaultStore.getLiquidatableVaults();
      const liquidatableVaultOwners = Object.keys(liquidatableVaults);
      const numberOfLiquidatableVaults =
        Object.values(liquidatableVaults).flat().length;

      if (numberOfLiquidatableVaults === 0) {
        Logger.info({
          at: "Liquidator#_attemptLiquidations",
          message: "No liquidatable vaults",
        });

        return this.setActiveLiquidationState(false);
      }

      Logger.info({
        at: "Liquidator#_attemptLiquidations",
        message: "Liquidatable vaults detected",
        numberOfLiquidatableVaults,
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
        numberOfLiquidatableVaults: Object.values(
          this.vaultStore.getLiquidatableVaults()
        ).flat().length,
        error,
      });
    }

    this.setActiveLiquidationState(false);
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
        numberOfSettleableVaults: Object.values(
          this.vaultStore.getSettleableVaults()
        ).flat().length,
        error,
      });
    }
  };

  _subscribe = async (): Promise<void> => {
    await checkAssetAllowances();
    await checkEtherBalance();
    await setLatestLiquidatorVaultNonce(this);
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
            updatedTimestamp: updatedTimestamp.toString(),
            error,
          });
        }
      }
    );
  };

  _subscribeToNewBlocks = async (): Promise<void> => {
    provider.on("block", async (blockNumber: BigNumber) => {
      try {
        await checkEtherBalance();

        if (this.getActiveLiquidationState() === false) {
          await this._attemptLiquidations();
        }
      } catch (error) {
        Logger.error({
          at: "Liquidator#_subscribeToNewBlocks",
          message: error.message,
          blockNumber: blockNumber.toString(),
          error,
        });
      }
    });
  };
}
