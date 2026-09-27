#!/bin/sh
set -e

# Apply database migrations, create the first admin / default content, then
# start the server. Both steps are idempotent.
node scripts/migrate.mjs
node scripts/seed.mjs

exec node server.js
