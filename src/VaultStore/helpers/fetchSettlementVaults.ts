import { BigNumber } from "ethers";
import fetch from "node-fetch";

import supportedNetworkSubgraphs from "./supportedNetworkSubgraphs";
import { ISettlementVaults } from "../types";
import { liquidatorAccountAddress, Logger, provider } from "../../helpers";

export default async function fetchSettlementVaults(): Promise<ISettlementVaults> {
  const networkChainId = (await provider.getNetwork()).chainId.toString();

  const subgraphUrl = supportedNetworkSubgraphs[networkChainId];

  if (!subgraphUrl) {
    Logger.error({
      at: "VaultStore#fetchSettlementVaults",
      message: "Warning: No subgraph for detected Ethereum network",
    });
    return {};
  }

  const settlementVaultQuery = JSON.stringify({
    query: `
      {
        vaults(where: { owner: "${liquidatorAccountAddress}" shortOToken_not: null type: 1 }) {
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
          [address]: {
            [vaultId]: {
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
      error,
    });
    return {};
  }
}
