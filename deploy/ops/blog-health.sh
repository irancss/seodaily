#!/bin/sh
# Uses this stack only; no data mutation or fixture publication.
. "$(dirname "$0")/lib.sh"
app=$(app_container)
[ -n "$app" ] || die "app is not running"
docker exec "$app" node scripts/blog-worker-health.mjs
