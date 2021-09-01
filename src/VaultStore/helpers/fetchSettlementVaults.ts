import { BigNumber } from "ethers";
import fetch from "node-fetch";

import supportedNetworkSubgraphs from "./supportedNetworkSubgraphs";
import { ISettlementVaults } from "../types";
import {
  liquidatorAccountAddress,
  Logger,
  networkInfo,
  triggerPagerDutyNotification,
} from "../../helpers";

export default async function fetchSettlementVaults(): Promise<ISettlementVaults> {
  const networkChainId = (await networkInfo).chainId.toString();

  const subgraphUrl = supportedNetworkSubgraphs[networkChainId];

  if (!subgraphUrl) {
    const message = "Warning: No subgraph for detected Ethereum network";

    Logger.error({
      at: "VaultStore#fetchSettlementVaults",
      message,
      supportedNetworkSubgraphChainIds: Object.keys(supportedNetworkSubgraphs),
    });

    if (process.env.PAGERDUTY_ROUTING_KEY) {
      await triggerPagerDutyNotification(message);
    }

    return {};
  }

  const settlementVaultQuery = JSON.stringify({
    query: `
      {
        vaults(first: 1000 where: { owner: "${liquidatorAccountAddress.toLowerCase()}" shortOToken_not: null shortAmount_gt: "0" type: 1 }) {
          shortAmount
          shortOToken {
            address: id
            expiryTimestamp
          }
          vaultId
        }
      }`,
  });

  try {
    const {
      data: { vaults },
    } = await (
      await fetch(subgraphUrl, {
        body: settlementVaultQuery,
        method: "POST",
      })
    ).json();

    const settlementVaults: ISettlementVaults = vaults.reduce(
      (
        settlementVaults: ISettlementVaults,
        {
          shortAmount,
          shortOToken: { address, expiryTimestamp },
          vaultId,
        }: {
          shortAmount: string;
          shortOToken: { address: string; expiryTimestamp: string };
          vaultId: string;
        }
      ) => {
        return {
          ...settlementVaults,
          [vaultId]: {
            [address]: {
              expiryTimestamp: BigNumber.from(expiryTimestamp),
              shortAmount: BigNumber.from(shortAmount),
            },
          },
        };
      },
      {}
    );

    return settlementVaults;
  } catch (error) {
    Logger.error({
      at: "VaultStore#fetchSettlementVaults",
      message: error.message,
      subgraphUrl,
      settlementVaultQuery,
      error,
    });
    return {};
  }
}
