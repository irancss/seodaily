#!/bin/sh
set -e

# `entrypoint.sh worker` runs the plugin worker (source checks, package
# checks, nightly schedule). The web app applies migrations; the worker waits
# for them.
if [ "${1:-}" = "worker" ]; then
  exec node worker.mjs
fi

# Apply database migrations, create the first admin / default content, then
# start the server. Both steps are idempotent.
node scripts/migrate.mjs
node scripts/seed.mjs

exec node server.js
