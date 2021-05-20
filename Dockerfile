# This docker container can be pulled from opyn/liquidator on dockerhub.
# To get the latest image, run: docker pull opyn/liquidator
# This docker container is used to access and run Opyn liquidator bots.
# Settings for these bots are defined via enviroment variables.
# For example to run a liquidator bot run:
# docker run --env BOT_MINIMUM_ETHER_BALANCE="<balance in wei>" \
#     --env BOT_PRIVATE_KEY="<private key>" \
#     --env CHAINLINK_PRICE_FEED_ADDRESS="<address>" \
#     --env ETHEREUM_NODE_URL="<url>" \
#     --env GAMMA_CONTROLLER_ADDRESS="<address>" \
#     --env GAS_PRICE_MULTIPLIER="<decimal number>" \
#     --env LIQUIDATION_POLL_DELAY_MS="<number in ms>" \
#     --env LOGS="<boolean>" \
#     --env SLACK_WEBHOOK="<slack webhook>" \
#     --env RUN_COMMAND="node ./build/src/index.js" \
#     opyn/liquidator:latest
#
# To build the docker image locally, run the following command from the root directory:
#   docker build -t <username>/<imagename> .
#
# To `docker run` with your locally built image, replace `opyn/liquidator` with <username>/<imagename>.

FROM node:lts

# All source code and execution happens from the root directory.
WORKDIR /

COPY . ./

RUN npm ci
RUN npm run build

# Command to run any command provided by the COMMAND env variable.
ENTRYPOINT ["/bin/bash", "scripts/runDockerCommand.sh"]
