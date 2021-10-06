# @opyn/liquidator

A liquidation bot to automatically liquidate undercollateralized Opyn naked margin vaults.

## Usage

### Docker

Requires a running [docker](https://docker.com) engine.

```
docker run -v db:/db \
  --env BOT_PRIVATE_KEY=0xd89d228bb0fe8bd9b28de542827d7e5eccd26cbeb159ce263488a6a54b88bdcf \
  --env ETHEREUM_NODE_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --env RUN_COMMAND="node ./build/src/index.js" \
  opyn/liquidator
```

## Overview

This service will automatically liquidate undercollateralized naked margin vaults on Opyn.

For more information about running a liquidator bot, see the [docs]() (TODO).

## Configuration

### Environment Variables

| ENV Variable                             | Description                                                                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BOT_MINIMUM_ETHER_BALANCE                | Minimum balance of Ether the bot's wallet should possess. Denominated in wei. (Default: 0)                                                                                                                                                                          |
| BOT_PRIVATE_KEY                          | **REQUIRED** Defines the wallet the bot will use. Generate and seed with Ether before running the bot.                                                                                                                                                              |
| DERIBIT_MAX_SPREAD_MULTIPLIER            | Amount to multiply the calculated Deribit max spread of a given option by when determining liquidation profitability. (Default: 4)                                                                                                                                  |
| DERIBIT_MAX_SPREAD                       | Amount to multiply the Deribit delta of a given option when determining liquidation profitability. Defined as decimal percent. (Default: 0.04)                                                                                                                      |
| DERIBIT_MIN_SPREAD                       | The minimum spread of a given Deribit option when determining liquidation profitability. Defined as decimal percent. (Default: 0.01)                                                                                                                                |
| DERIBIT_PRICE_MULTIPLIER                 | Amount to multiply the Deribit best ask price of a given option when determining liquidation profitability. (Default: 1.1)                                                                                                                                          |
| ETHEREUM_NODE_URL                        | **REQUIRED** Ethereum node URL to use (i.e. an Infura url).                                                                                                                                                                                                         |
| EXPIRED_TRANSACTION_GAS_PRICE_MULTIPLIER | Amount to multiply the `rapid` [GasNow](https://www.gasnow.org/) gas price by when retrying timed out transactions. Multiplied against the on-chain median gas price as a fallback. (Default: 1.1)                                                                  |
| EXPIRED_TRANSACTION_TIMEOUT              | How long to wait before retrying transactions with a higher gas price. Denominated in microseconds. (Default: 60000)                                                                                                                                                |
| GAMMA_CONTROLLER_ADDRESS                 | Address of the deployed Opyn Controller contract. Used for monitoring and liquidating vaults. (Default: [0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72](https://etherscan.io/address/0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72))                                      |
| ETH_GASSTATION_GAS_PRICE_MULTIPLIER             | Amount to multiply the `rapid` [GasNow](https://www.gasnow.org/) gas price by when sending transactions. (Default: 1.0)                                                                                                                                             |
| LOGS                                     | Output logs to stdout. (Default: True)                                                                                                                                                                                                                              |
| MARGIN_CALCULATOR_ADDRESS                | Address of the deployed Opyn Margin Calculator contract. Used to calculate margin requirements of partially collateralized vaults. (Default: [0xfaa67e3736572645B38AF7410B3E1006708e13F4](https://etherscan.io/address/0xfaa67e3736572645B38AF7410B3E1006708e13F4)) |
| MARGIN_POOL_ADDRESS                      | Address of the deployed Opyn Margin Pool contract. Used to transfer collateral during liquidations. (Default: [0x5934807cC0654d46755eBd2848840b616256C6Ef](https://etherscan.io/address/0x5934807cC0654d46755eBd2848840b616256C6Ef))                                |
| MINIMUM_COLLATERAL_TO_LIQUIDATE_FOR      | Minimum percent amount of vault collateral the bot will liquidate for. Defined as decimal percent. Used when liquidating non-Deribit priced options. (Default: 0.95)                                                                                                |
| MINIMUM_LIQUIDATION_PRICE                | Lowest liquidation price the bot will liquidate for. Denominated and formatted as USD. (Default: 5.00)                                                                                                                                                              |
| MINIMUM_STRIKE_PRICE_ASSET_BALANCE       | Minimum balance of strike price asset the liquidator account should have access to. Denominated in strike price asset decimals. (Default: 0)                                                                                                                        |
| MINIMUM_UNDERLYING_ASSET_BALANCE         | Minimum balance of underyling asset the liquidator account should have access to. Denominated in underlying asset decimals. (Default: 0)                                                                                                                            |
| ON_CHAIN_GAS_PRICE_MULTIPLIER            | Amount to multiply the on-chain median gas price as a fallback. (Default: 1.5)                                                                                                                                                                                      |
| PAGERDUTY_ROUTING_KEY                    | Routing key for triggering and sending critical error messages to PagerDuty.                                                                                                                                                                                        |
| SENTRY_DSN                               | DSN url for monitoring and sending error messages to Sentry.                                                                                                                                                                                                        |
| SETTLEMENT_FREQUENCY                     | How frequently to fetch settlement vaults and attempt to settle them. Denominated in microseconds. (Default: 86400000 [every 24 hours])                                                                                                                             |
| SLACK_WEBHOOK                            | Webhook for sending error messages to a Slack channel.                                                                                                                                                                                                              |
| RUN_COMMAND                              | **REQUIRED** Entry point used by the bot's Docker container on startup.                                                                                                                                                                                             |
