# @opyn/liquidator

A liquidation bot to automatically liquidate undercollateralized Opyn naked margin vaults.

## Usage

### Docker

Requires a running [docker](https://docker.com) engine.

```
docker run \
  --env BOT_PRIVATE_KEY=0xd89d228bb0fe8bd9b28de542827d7e5eccd26cbeb159ce263488a6a54b88bdcf \
  --env ETHEREUM_NODE_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --env RUN_COMMAND="node ./build/src/index.js" \
  opyn/liquidator
```

## Overview

This service will automatically liquidate undercollateralized naked margin vaults on Opyn.

For more information about running a liquidator bot, see the [docs]()(TODO).

## Configuration

### Environment Variables

| ENV Variable                 | Description                                                                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BOT_MINIMUM_ETHER_BALANCE    | Minimum balance of Ether the bot's wallet should possess. Denominated in wei. (Default: 0)                                                                                                                                                                                            |
| BOT_PRIVATE_KEY              | **REQUIRED** Defines the wallet the bot will use. Generate and seed with Ether before running the bot.                                                                                                                                                                                |
| CHAINLINK_PRICE_FEED_ADDRESS | Address of the deployed Chainlink Price Feed contract to fetch vault underlying prices from. Determines which vaults the bot will be concerned with. (Default: [0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419](https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419)) |
| DERIBIT_PRICE_MULTIPLIER     | Amount to multiply the Deribit best ask price of a given option when determing liquidation profitability. (Default: 1.0)                                                                                                                                                              |
| ETHEREUM_NODE_URL            | **REQUIRED** Ethereum node URL to use (i.e. an Infura url).                                                                                                                                                                                                                           |
| GAMMA_CONTROLLER_ADDRESS     | Address of the deployed Opyn Controller contract to monitor and liquidate vaults with. (Default: [0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72](https://etherscan.io/address/0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72))                                                               |
| GAS_PRICE_MULTIPLIER         | Amount to multiply the `rapid` [GasNow](https://www.gasnow.org/) gas price by when sending transactions. Multiplied against the on-chain median gas price as a fallback. (Default: 1.0)                                                                                               |
| LOGS                         | Output logs to stdout. (Default: True)                                                                                                                                                                                                                                                |
| MARGIN_CALCULATOR_ADDRESS    | Address of the deployed Opyn Margin Calculator contract used to calculate margin requirements for partially collateralized vaults. (Default: [0x7A48d10f372b3D7c60f6c9770B91398e4ccfd3C7](https://etherscan.io/address/0x7a48d10f372b3d7c60f6c9770b91398e4ccfd3c7))                   |
| MINIMUM_LIQUIDATION_PRICE    | Lowest liquidation price the bot will liquidate for. Denominated and formatted as USD. (Default: 1.00)                                                                                                                                                                                |
| SLACK_WEBHOOK                | Webhook for sending messages to a Slack channel.                                                                                                                                                                                                                                      |
| RUN_COMMAND                  | **REQUIRED** Entry point used by the bot's Docker container on startup.                                                                                                                                                                                                               |
