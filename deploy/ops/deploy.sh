#!/bin/sh
# Switches production to seodaily:<tag>, keeping the running version live until
# the new one has proved itself:
#   1. database backup (the undo for a migration)
#   2. candidate container from the new image: migrations, seed and server
#      start while the old app keeps serving; stops here if anything fails
#   3. switch (a few seconds while the container is recreated), health check,
#      automatic return to the previous image if the new one is unhealthy
# Usage (on the server): sh ops/deploy.sh <tag>
. "$(dirname "$0")/lib.sh"

TAG=${1:?usage: deploy.sh <image tag>}
IMAGE="seodaily:$TAG"
CANDIDATE=seodaily-candidate
docker image inspect "$IMAGE" >/dev/null 2>&1 || die "$IMAGE is not on this server"

if command -v flock >/dev/null 2>&1; then
  exec 9>"$DEPLOY_PATH/.deploy.lock"
  flock -n 9 || die "another deploy is running"
fi

# Internal secrets of the plugin library (OTP digests, worker→app cache call):
# generated once on this server when missing, never printed, never in Git.
ensure_secret() {
  if ! grep -q "^$1=." .env; then
    umask 077
    printf '%s=%s\n' "$1" "$(head -c 48 /dev/urandom | base64 | tr -d '\n/+=' | cut -c1-56)" >> .env
    log "generated $1 in .env"
  fi
}
ensure_secret OTP_HMAC_SECRET
ensure_secret INTERNAL_API_SECRET

log "database"
docker compose up -d --no-recreate --wait db

if [ -n "$(app_container)" ]; then
  log "backup before migrations"
  sh "$OPS/backup.sh" pre-deploy || die "backup failed; production unchanged"
fi

log "candidate $IMAGE: migrations, seed, start"
docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
APP_IMAGE_TAG=$TAG docker compose run -d --no-deps --name "$CANDIDATE" app >/dev/null
i=0
until healthy "$CANDIDATE"; do
  i=$((i + 1))
  if [ "$(docker inspect -f '{{.State.Running}}' "$CANDIDATE" 2>/dev/null)" != true ] || [ "$i" -ge 60 ]; then
    docker logs --tail 60 "$CANDIDATE" 2>&1 || true
    docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
    die "the new version did not start (see its log above); production still runs the previous version"
  fi
  sleep 2
done
docker logs "$CANDIDATE" 2>&1 | grep -E "migrations|service content|seeded|admin user" | tail -5 || true
docker rm -f "$CANDIDATE" >/dev/null

log "switch to $IMAGE"
current=$(app_container)
if [ -n "$current" ]; then docker tag "$(docker inspect -f '{{.Image}}' "$current")" seodaily:previous; fi
docker tag "$IMAGE" seodaily:latest
docker compose up -d --no-deps app

wait_live() {
  i=0
  until healthy "$(app_container)"; do
    i=$((i + 1)); [ "$i" -ge 45 ] && return 1
    sleep 2
  done
}
if ! wait_live; then
  docker compose logs --tail 60 app || true
  if [ -n "$current" ]; then
    log "new version unhealthy: back to the previous image"
    docker tag seodaily:previous seodaily:latest
    docker compose up -d --no-deps app worker
    wait_live || die "the previous version is not healthy either"
    die "deploy of $TAG failed; the previous version is live again"
  fi
  die "deploy of $TAG failed"
fi

# The plugin worker follows the app to the same image (it finishes or hands
# back its running jobs on SIGTERM; interrupted jobs are retried).
log "plugin worker"
docker compose up -d --no-deps clamav worker || log "WARNING: the plugin worker did not start (the site is live; see docker compose logs worker)"

printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$TAG" >> "$DEPLOY_PATH/deploys.log"
log "live: $TAG"

# Keep the six most recent versions for rollback (plus latest/previous), and
# nothing that is no longer tagged.
docker images seodaily --format '{{.CreatedAt}}|{{.Tag}}' | sort -r | cut -d'|' -f2 | grep -Ev '^(latest|previous)$' \
  | tail -n +7 | sed 's/^/seodaily:/' | xargs -r docker rmi >/dev/null 2>&1 || true
docker image prune -f >/dev/null
