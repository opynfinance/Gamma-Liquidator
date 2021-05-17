# @opyn/liquidator

A liquidation bot to automatically liquidate undercollateralized Opyn vaults.

## Usage

### Docker

Requires a running [docker](https://docker.com) engine.

```
docker run \
  --env BOT_PRIVATE_KEY=0xd89d228bb0fe8bd9b28de542827d7e5eccd26cbeb159ce263488a6a54b88bdcf \
  --env CHAINLINK_PRICE_FEED_ADDRESS=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 \
  --env ETHEREUM_NODE_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --env GAMMA_CONTROLLER_ADDRESS=0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72 \
  --env RUN_COMMAND="node ./build/src/index.js" \
  opynfinance/liquidator
```

## Overview

This service will automatically liquidate undercollateralized naked margin vaults on Opyn.

For more information about running a liquidator bot, see the [docs]()(TODO).

## Configuration

### Environment Variables

| ENV Variable                 | Description                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BOT_MINIMUM_ETHER_BALANCE    | Minimum balance of Ether the bot's wallet must have to startup and run. Denominated in wei. (Default: 0)                                                          |
| BOT_PRIVATE_KEY              | **REQUIRED** Defines the wallet the bot will use. Generate and seed with Ether before running the bot.                                                            |
| CHAINLINK_PRICE_FEED_ADDRESS | **REQUIRED** Address of the deployed Chainlink Price Feed contract to fetch vault collateral prices from. Determines which vaults the bot will be concerned with. |
| ETHEREUM_NODE_URL            | **REQUIRED** Ethereum node URL to use (i.e. an Infura url).                                                                                                       |
| GAMMA_CONTROLLER_ADDRESS     | **REQUIRED** Address of the deployed Opyn Controller contract to monitor and liquidate vaults with.                                                               |
| GAS_PRICE_MULTIPLIER         | How much to multiply the `fast` gas price by when sending transactions. (Default: 1)                                                                              |
| LIQUIDATION_POLL_DELAY_MS    | How frequently to poll for liquidatable accounts, in microseconds. (Default: 300)                                                                                 |
| SLACK_WEBHOOK                | Webhook for sending messages to a Slack channel.                                                                                                                  |
| RUN_COMMAND                  | **REQUIRED** Entry point used when the bot's Docker container starts running.                                                                                     |
