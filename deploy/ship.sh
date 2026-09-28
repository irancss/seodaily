#!/bin/sh
# Runs on the CI runner: puts seodaily:<tag> on the server (ssh host "prod").
# Pushes to a private registry on the server through an SSH tunnel, so only
# the layers that changed travel (the Node base and dependencies do not).
# Falls back to sending the whole image when the registry path fails.
set -eu
TAG=${1:?usage: ship.sh <tag>}
REMOTE_PORT=5055   # registry on the server, on 127.0.0.1 only
LOCAL_PORT=5000    # tunnel end on the runner
SOCKET=$(mktemp -u)

# Called as an `if` condition, where `set -e` does not apply: every step checks itself.
registry() {
  ssh prod 'docker image inspect registry:2 >/dev/null 2>&1' || {
    docker pull -q registry:2 >/dev/null || return 1
    docker save registry:2 | gzip | ssh prod 'gunzip | docker load' >/dev/null || return 1
  }
  # The registry is only a transfer cache: when it grows past 3 GB it is
  # recreated empty (the next push sends every layer once).
  ssh prod "sh -s $REMOTE_PORT" <<'REMOTE' || return 1
set -e
size=$(docker exec seodaily-registry du -sm /var/lib/registry 2>/dev/null | cut -f1 || echo 0)
if [ "${size:-0}" -gt 3072 ]; then docker rm -f seodaily-registry >/dev/null; docker volume rm seodaily-registry >/dev/null; fi
if [ -z "$(docker ps -q -f name=^seodaily-registry$)" ]; then
  docker rm -f seodaily-registry >/dev/null 2>&1 || true
  # Host network, listening on loopback only: no bridge or address pool needed.
  docker run -d --name seodaily-registry --restart unless-stopped --network host \
    -e REGISTRY_HTTP_ADDR="127.0.0.1:$1" -v seodaily-registry:/var/lib/registry registry:2 >/dev/null
fi
REMOTE
  ssh -f -N -M -S "$SOCKET" -o ExitOnForwardFailure=yes -L "$LOCAL_PORT:127.0.0.1:$REMOTE_PORT" prod || return 1
  i=0
  until curl -sf "http://127.0.0.1:$LOCAL_PORT/v2/" >/dev/null; do
    i=$((i + 1)); [ "$i" -ge 15 ] && return 1
    sleep 1
  done
  docker tag "seodaily:$TAG" "127.0.0.1:$LOCAL_PORT/seodaily:$TAG" || return 1
  docker push -q "127.0.0.1:$LOCAL_PORT/seodaily:$TAG" >/dev/null || return 1
  ssh prod "docker pull -q 127.0.0.1:$REMOTE_PORT/seodaily:$TAG >/dev/null \
    && docker tag 127.0.0.1:$REMOTE_PORT/seodaily:$TAG seodaily:$TAG \
    && docker rmi 127.0.0.1:$REMOTE_PORT/seodaily:$TAG >/dev/null"
}

close_tunnel() { ssh -S "$SOCKET" -O exit prod >/dev/null 2>&1 || true; }
trap close_tunnel EXIT

start=$(date +%s)
if registry; then
  echo "shipped seodaily:$TAG through the registry in $(( $(date +%s) - start ))s"
else
  echo "::warning::registry transfer failed; sending the whole image instead"
  close_tunnel
  docker save "seodaily:$TAG" | gzip | ssh prod 'gunzip | docker load'
  echo "shipped seodaily:$TAG as a full image in $(( $(date +%s) - start ))s"
fi

# The database image is sent once; the server may not reach Docker Hub.
if ! ssh prod 'docker image inspect postgres:16-alpine >/dev/null 2>&1'; then
  docker pull -q postgres:16-alpine >/dev/null
  docker save postgres:16-alpine | gzip | ssh prod 'gunzip | docker load'
fi
