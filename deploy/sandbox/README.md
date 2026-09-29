# Isolated WordPress runner

Deploy this package on a **dedicated Linux VM with no production data or credentials**.
It is intentionally not part of the website's Compose stack. The trusted Node 22
orchestrator controls Docker on that VM. Untrusted PHP sees neither the Docker
socket nor the orchestrator's token. No fallback to the ordinary `runc` runtime
exists: an absent gVisor runtime leaves the check unavailable.

Prerequisites: Node 22, Docker, and [gVisor/runsc](https://gvisor.dev/docs/user_guide/quick_start/docker/).
These are runner dependencies; the Next.js application has no new npm dependencies.
The profile uses official WordPress CLI (PHP 8.3) and MariaDB 11.4 images plus a
versioned WordPress core image. It does not install anything into a real website.

1. Copy this directory to `/opt/seodaily-sandbox` on the separate VM. Create a
   dedicated `seodaily-sandbox` user and add it to the Docker group. Treat that
   account as a privileged orchestrator and restrict VM access accordingly.
2. Select supported WordPress/PHP versions for the test profile. Pull the official
   core (`wordpress:<version>-php8.3-apache`), CLI (`wordpress:cli-php8.3`) and
   database (`mariadb:11.4`) images. Record each RepoDigest using `docker image inspect`.
3. Run `sh prepare.sh CORE@sha256:DIGEST CLI@sha256:DIGEST DB@sha256:DIGEST` with
   those three complete references. This copies trusted WordPress core to the
   read-only template and checks runsc/PHP. The MariaDB image must use UID 999 for
   mysql (the preparation output reports it); changing that image contract requires
   updating and testing the temporary database directory ownership in runner.mjs.
4. Install `sandbox.env.example` as `/etc/seodaily-sandbox.env`, readable only by
   the service account. Generate a random token of at least 32 characters, set
   digest-pinned CLI/database images, the absolute template path and an honest
   profile label such as `WordPress <version>; PHP 8.3; MariaDB 11.4; gVisor`.
5. Install the systemd unit. Expose its loopback port 8090 only through an HTTPS
   reverse proxy, restricted to the worker's address. Permit a 100 MB upload and
   a 240 second request. Never forward Authorization headers to third parties.
6. Set `PLUGIN_SANDBOX_URL=https://runner.example.invalid` and the same
   `PLUGIN_SANDBOX_TOKEN` in the site's environment, then recreate its worker.
7. Verify authenticated `/v1/health`, then enqueue a known benign fixture and a
   deliberate fatal fixture. Require respectively PASS and FAIL, confirm the
   plugin cannot reach the network, and confirm both containers and the socket
   volume disappear. Recheck an existing review release from the admin monitor.
   Do not enable automatic publication until these deployment checks pass.

Every job uses separate WordPress and MariaDB containers with gVisor, no network,
read-only roots, dropped capabilities, process/CPU/memory limits, temporary
filesystems and a private Unix socket. Only the immutable core template and the
one checked ZIP are mounted. The database and all plugin writes are disposable.
PHP is invoked only after the worker has recorded passing ZIP validation and scan.
The runner installs the archive, checks the expected main-file path, activates it,
independently checks activation, requests WordPress through isolated loopback and
checks errors. A plugin's stdout alone cannot produce a passing result.

The authenticated protocol binds every response to request UUID, complete
SHA-256, main file and profile. It reports `requires_dependency` for declared
dependencies; it does not download dependencies, provide commercial licenses or
emulate external services. Additional dependency profiles need separate trusted
preparation and testing. PHP fatals are reported separately from unavailable
infrastructure. A PASS describes only this profile, not universal compatibility
or a guarantee against malicious behavior.

**Validation boundary:** protocol, bounds, failure handling and command isolation
are tested in CI. This repository does not claim a deployed, tested gVisor VM;
the operator checks in step 7 are required on the new environment.
