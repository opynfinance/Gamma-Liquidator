# This docker container can be pulled from opyn/liquidator on dockerhub.
# To get the latest image, run: docker pull opyn/liquidator
# This docker container is used to access and run Opyn liquidator bots.
# Settings for these bots are defined via enviroment variables.
# For example to run a liquidator bot run:
# docker run -v db:/db --env BOT_PRIVATE_KEY="<private key>" \
#     --env ETHEREUM_NODE_URL="<url>" \
#     --env RUN_COMMAND="node ./build/src/index.js" \
#     opyn/liquidator
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
