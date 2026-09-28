#!/bin/sh
# Runs on the CI runner: puts seodaily:<tag> on the server (ssh host "prod").
# Pushes to a private registry on the server over SSH, so only the layers that
# changed travel (the Node base and dependencies do not). The server refuses
# SSH port forwarding, so deploy/registry-proxy.mjs carries each connection
# in its own SSH session. Falls back to sending the whole image on any failure.
set -eu
TAG=${1:?usage: ship.sh <tag>}
REMOTE_PORT=5055   # registry on the server, on 127.0.0.1 only
LOCAL_PORT=15055   # proxy on the runner (off the commonly used 5000)
TUNNEL_LOG=$(mktemp)
PROXY_PID=
STEP=start

# Called as an `if` condition, where `set -e` does not apply: every step checks itself.
registry() {
  STEP="registry image on the server"
  ssh prod 'docker image inspect registry:2 >/dev/null 2>&1' || {
    docker pull -q registry:2 >/dev/null || return 1
    docker save registry:2 | gzip | ssh prod 'gunzip | docker load' >/dev/null || return 1
  }
  # The registry is only a transfer cache: when it grows past 3 GB it is
  # recreated empty (the next push sends every layer once).
  STEP="registry container"
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
  STEP="SSH proxy"
  node "$(dirname "$0")/registry-proxy.mjs" "$LOCAL_PORT" "$REMOTE_PORT" "$TUNNEL_LOG" >/dev/null &
  PROXY_PID=$!
  STEP="registry reachable through the proxy"
  i=0
  until CURL_ERROR=$(curl -fsS -o /dev/null "http://127.0.0.1:$LOCAL_PORT/v2/" 2>&1); do
    i=$((i + 1)); [ "$i" -ge 15 ] && return 1
    sleep 1
  done
  STEP="push"
  docker tag "seodaily:$TAG" "127.0.0.1:$LOCAL_PORT/seodaily:$TAG" || return 1
  docker push -q "127.0.0.1:$LOCAL_PORT/seodaily:$TAG" >/dev/null || return 1
  STEP="pull on the server"
  ssh prod "docker pull -q 127.0.0.1:$REMOTE_PORT/seodaily:$TAG >/dev/null \
    && docker tag 127.0.0.1:$REMOTE_PORT/seodaily:$TAG seodaily:$TAG \
    && docker rmi 127.0.0.1:$REMOTE_PORT/seodaily:$TAG >/dev/null"
}

stop_proxy() { [ -z "$PROXY_PID" ] || kill "$PROXY_PID" 2>/dev/null || true; }
trap 'stop_proxy; rm -f "$TUNNEL_LOG"' EXIT

# Why the registry path failed, for the next person reading the log.
diagnose() {
  echo "::warning::registry transfer failed at: $STEP; sending the whole image instead"
  [ -n "${CURL_ERROR:-}" ] && echo "  curl: $CURL_ERROR"
  [ -s "$TUNNEL_LOG" ] && sed 's/^/  ssh: /' "$TUNNEL_LOG"
  ssh prod 'docker ps -a -f name=^seodaily-registry$ --format "  registry container: {{.Status}}"; docker logs --tail 5 seodaily-registry 2>&1 | sed "s/^/  registry log: /"
    # A registry that cannot start would otherwise restart forever.
    [ "$(docker inspect -f "{{.State.Status}}" seodaily-registry 2>/dev/null)" = running ] || docker rm -f seodaily-registry >/dev/null 2>&1' || true
}

start=$(date +%s)
if registry; then
  echo "shipped seodaily:$TAG through the registry in $(( $(date +%s) - start ))s"
else
  diagnose
  stop_proxy
  docker save "seodaily:$TAG" | gzip | ssh prod 'gunzip | docker load'
  echo "shipped seodaily:$TAG as a full image in $(( $(date +%s) - start ))s"
fi

# The database image is sent once; the server may not reach Docker Hub.
if ! ssh prod 'docker image inspect postgres:16-alpine >/dev/null 2>&1'; then
  docker pull -q postgres:16-alpine >/dev/null
  docker save postgres:16-alpine | gzip | ssh prod 'gunzip | docker load'
fi
