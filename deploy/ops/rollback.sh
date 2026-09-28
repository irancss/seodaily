#!/bin/sh
# Puts an earlier image back live (same checks as a deploy).
#   sh ops/rollback.sh            the version before the current one (deploys.log)
#   sh ops/rollback.sh <tag>      a specific one; `docker images seodaily` lists them
# The database is not rolled back: migrations only add, so older code keeps
# working. To undo a migration itself, restore the pre-deploy dump (RUNBOOK.md).
. "$(dirname "$0")/lib.sh"

TAG=${1:-}
if [ -z "$TAG" ]; then
  [ -f deploys.log ] || die "no deploys.log; pass a tag"
  TAG=$(awk '{print $2}' deploys.log | uniq | tail -n 2 | head -n 1)
  [ "$TAG" != "$(awk '{print $2}' deploys.log | tail -n 1)" ] || die "no earlier version in deploys.log; pass a tag"
fi
log "rolling back to $TAG"
exec sh "$OPS/deploy.sh" "$TAG"
