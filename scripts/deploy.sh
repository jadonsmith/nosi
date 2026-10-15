#!/bin/sh
# Push the working tree to a Docker-Compose NOSI server and rebuild.
#
#   NOSI_SSH=jadon@nosi.jadon.me NOSI_PATH=/opt/nosi ./scripts/deploy.sh
set -eu

: "${NOSI_SSH:?set NOSI_SSH, e.g. jadon@nosi.jadon.me}"
NOSI_PATH="${NOSI_PATH:-/opt/nosi}"

echo "→ syncing to $NOSI_SSH:$NOSI_PATH"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .pglite \
  --exclude .env \
  --exclude .env.local \
  ./ "$NOSI_SSH:$NOSI_PATH/"

echo "→ rebuilding"
# shellcheck disable=SC2029
ssh "$NOSI_SSH" "cd $NOSI_PATH && docker compose up -d --build"

echo "done."
