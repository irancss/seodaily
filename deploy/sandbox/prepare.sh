#!/bin/sh
# Trusted setup only. Run on a dedicated sandbox VM, before accepting ZIPs.
set -eu
cd "$(dirname "$0")"
CORE=${1:?usage: prepare.sh core-image@sha256:digest cli-image@sha256:digest db-image@sha256:digest}
CLI=${2:?CLI image required}
DB=${3:?database image required}
for image in "$CORE" "$CLI" "$DB"; do
  case "$image" in *@sha256:*) ;; *) echo "Digest-pinned images are required" >&2; exit 1 ;; esac
  docker pull "$image"
done
[ ! -e template ] || { echo "template already exists; use a new profile directory" >&2; exit 1; }
container="seodaily-core-setup-$$"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT HUP INT TERM
docker create --name "$container" "$CORE" >/dev/null
mkdir template
docker cp "$container:/usr/src/wordpress/." template/
chmod -R a+rX template
# Verify the hardened runtime, PHP and the database image before configuring
# the service. No unknown plugin runs during preparation.
docker run --rm --runtime=runsc --network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --entrypoint php "$CLI" -r 'if (!extension_loaded("mysqli")) exit(1); echo PHP_VERSION, PHP_EOL;'
docker run --rm --network=none --entrypoint id "$DB" mysql
echo "Verify mysql has UID 999, then set sandbox.env using sandbox.env.example."
