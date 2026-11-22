#!/bin/sh
# Entrypoint for the roster-images compose service.
#
# `docker compose run --rm roster-images --strategy attention` appends its
# arguments here, which is why this is an entrypoint and not a `command`.
set -e

# npm ci wipes and reinstalls, so only pay for it when sharp is missing. The
# image's node_modules lives on a named volume, so this is a one-time cost.
if [ ! -d node_modules/sharp ]; then
  echo "Installing dependencies (first run only)..."
  npm ci
fi

exec node scripts/normalize-roster-images.js "$@"
