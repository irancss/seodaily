// Trusted orchestrator: install ONLY on a dedicated VM, never on the site host.
// Docker control stays here. Each test container has no socket, network, site
// volume, environment file or credentials from this process.
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { createWriteStream } from "node:fs";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const MAX_BYTES = 100 * 1024 * 1024;
const DEADLINE_MS = 180_000;
const FATAL = /(?:PHP\s+)?(?:Fatal error|Parse error|Uncaught\s+(?:Error|Exception|TypeError))/i;

export function limits() {
  return ["--runtime=runsc", "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=128", "--cpus=1", "--memory=768m", "--memory-swap=768m", "--log-driver=none"];
}

export function config() {
  return {
    token: process.env.SANDBOX_TOKEN ?? "",
    cliImage: process.env.SANDBOX_CLI_IMAGE ?? "",
    dbImage: process.env.SANDBOX_DB_IMAGE ?? "",
    template: path.resolve(process.env.SANDBOX_TEMPLATE || "/opt/seodaily-sandbox/template"),
    profile: process.env.SANDBOX_PROFILE || "",
  };
}

export async function runIsolated(input, cfg, invoke = exec) {
  const job = `seodaily-smoke-${randomUUID()}`;
  const wp = `${job}-wp`, db = `${job}-db`, socket = `${job}-socket`;
  const deadline = Date.now() + DEADLINE_MS;
  const stages = { installed: false, activated: false, request: false, noFatal: false };
  const logs = [];
  const docker = async (...args) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("deadline");
    const result = await invoke("docker", args, { timeout: remaining, maxBuffer: 64 * 1024, killSignal: "SIGKILL" });
    logs.push(result.stdout, result.stderr);
    return result.stdout.trim();
  };
  const command = (...args) => docker("exec", wp, ...args);
  const wpcli = (...args) => command("wp", "--path=/work", "--skip-themes", ...args);
  const result = (value) => ({ result: value, stages });
  if (input.requiresPlugins) return result("requires_dependency");
  try {
    await docker("volume", "create", "--label", "seodaily.sandbox=v1", socket);
    // The socket volume and the database belong to this job only. No network
    // is needed, including during install and the HTTP request on loopback.
    await docker("run", "-d", "--label", "seodaily.sandbox=v1", "--name", db, ...limits(),
      "--user=mysql", "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m",
      "--tmpfs", "/var/lib/mysql:rw,nosuid,nodev,size=512m,uid=999,gid=999",
      "--mount", `type=volume,source=${socket},target=/run/mysqld`,
      "-e", "MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=1", "-e", "MARIADB_DATABASE=wordpress",
      cfg.dbImage, "--skip-networking", "--socket=/run/mysqld/mysqld.sock");
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { await docker("exec", db, "mariadb-admin", "--socket=/run/mysqld/mysqld.sock", "ping"); ready = true; break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 500)); }
    }
    if (!ready) return result("not_testable");
    await docker("run", "-d", "--label", "seodaily.sandbox=v1", "--name", wp, ...limits(), "--user=33:33",
      "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=64m,uid=33,gid=33",
      "--tmpfs", "/work:rw,nosuid,nodev,noexec,size=512m,uid=33,gid=33",
      "--mount", `type=bind,source=${cfg.template},target=/template,readonly`,
      "--mount", `type=bind,source=${input.artifactPath},target=/artifact.zip,readonly`,
      "--mount", `type=volume,source=${socket},target=/run/mysqld`,
      "--workdir=/work", "--entrypoint=sleep", cfg.cliImage, "210");
    await command("cp", "-R", "/template/.", "/work/");
    await wpcli("config", "create", "--dbname=wordpress", "--dbuser=root", "--dbpass=", "--dbhost=localhost:/run/mysqld/mysqld.sock", "--skip-check");
    await wpcli("config", "set", "WP_DEBUG", "true", "--raw");
    await wpcli("config", "set", "WP_DEBUG_LOG", "true", "--raw");
    await wpcli("config", "set", "WP_HTTP_BLOCK_EXTERNAL", "true", "--raw");
    await wpcli("core", "install", "--url=http://127.0.0.1:8080", "--title=Disposable smoke test", "--admin_user=smoke", `--admin_password=${randomUUID()}`, "--admin_email=smoke@example.invalid", "--skip-email");
    // Everything up to this point is trusted setup. Setup failures are NOT
    // recorded as a plugin defect.
    try { await wpcli("plugin", "install", "/artifact.zip"); }
    catch { return result("install_failed"); }
    const slug = input.mainFile.split("/")[0];
    // This process runs with the plugin disabled, checking the expected path.
    await command("test", "-f", `/work/wp-content/plugins/${input.mainFile}`);
    stages.installed = true;
    try {
      await wpcli("plugin", "activate", slug);
      await wpcli("--skip-plugins", "plugin", "is-active", slug);
      stages.activated = true;
      await docker("exec", "-d", wp, "php", "-S", "127.0.0.1:8080", "-t", "/work");
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Status is checked by a separate process; plugin stdout cannot declare PASS.
      await command("php", "-r", '$c=stream_context_create(["http"=>["timeout"=>15,"ignore_errors"=>true]]);$r=file_get_contents("http://127.0.0.1:8080/",false,$c);if($r===false||!preg_match("~^HTTP/\\S+ 2[0-9]{2}~",$http_response_header[0]??"")||preg_match("~Fatal error|Parse error|Uncaught (Error|Exception)~i",$r))exit(1);');
      stages.request = true;
      const debug = await command("sh", "-c", "if [ -f /work/wp-content/debug.log ]; then head -c 65536 /work/wp-content/debug.log; fi");
      stages.noFatal = !FATAL.test(logs.join("\n") + debug);
      return result(stages.noFatal ? "installed_activated_no_fatal" : "activation_fatal");
    } catch { return result(Date.now() >= deadline ? "timeout" : "activation_fatal"); }
  } catch { return result(Date.now() >= deadline ? "timeout" : "not_testable"); }
  finally {
    // Kill the workload even when an exec timed out. Never remove by prefix.
    await invoke("docker", ["rm", "-f", wp, db], { timeout: 20_000, maxBuffer: 4096 }).catch(() => {});
    await invoke("docker", ["volume", "rm", socket], { timeout: 10_000, maxBuffer: 4096 }).catch(() => {});
  }
}

export function createRunner(cfg, run = runIsolated, readiness = async () => {
  await access(path.join(cfg.template, "wp-includes/version.php"));
  await exec("docker", ["image", "inspect", cfg.cliImage, cfg.dbImage], { timeout: 5000, maxBuffer: 256 * 1024 });
  const { stdout } = await exec("docker", ["info", "--format", "{{json .Runtimes}}"], { timeout: 5000, maxBuffer: 8192 });
  if (!JSON.parse(stdout).runsc) throw new Error("runsc unavailable");
}) {
  let busy = false;
  return createServer({ requestTimeout: 240_000, headersTimeout: 10_000, maxHeaderSize: 8192 }, async (req, res) => {
    const reply = (status, data) => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(data)); };
    const auth = Buffer.from(req.headers.authorization ?? "");
    const expected = Buffer.from(`Bearer ${cfg.token}`);
    if (cfg.token.length < 32 || auth.length !== expected.length || !timingSafeEqual(auth, expected)) return reply(401, { error: "unauthorized" });
    if (req.method === "GET" && req.url === "/v1/health") {
      try { await readiness(); return reply(200, { protocol: 1, ready: true, profile: cfg.profile }); }
      catch { return reply(503, { protocol: 1, ready: false }); }
    }
    if (req.method !== "POST" || req.url !== "/v1/check") return reply(404, { error: "not found" });
    if (busy) return reply(429, { error: "busy" });
    const requestId = req.headers["x-request-id"], sha256 = req.headers["x-artifact-sha256"];
    let mainFile, requiresPlugins;
    try { mainFile = decodeURIComponent(req.headers["x-main-file"] ?? ""); requiresPlugins = decodeURIComponent(req.headers["x-requires-plugins"] ?? ""); }
    catch { return reply(400, { error: "invalid metadata" }); }
    if (!/^[a-f0-9-]{36}$/.test(requestId ?? "") || !/^[a-f0-9]{64}$/.test(sha256 ?? "") || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_./-]+\.php$/.test(mainFile) || mainFile.includes("..") || requiresPlugins.length > 300 || req.headers["content-type"] !== "application/zip") return reply(400, { error: "invalid metadata" });
    const bytes = Number(req.headers["content-length"]);
    if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > MAX_BYTES) return reply(413, { error: "invalid size" });
    busy = true;
    let dir;
    try {
      await readiness();
      dir = await mkdtemp(path.join(tmpdir(), "seodaily-artifact-"));
      const artifactPath = path.join(dir, "plugin.zip"), hash = createHash("sha256");
      let received = 0;
      await pipeline(req, new Transform({ transform(chunk, encoding, callback) {
        received += chunk.length;
        if (received > bytes) return callback(new Error("size limit"));
        hash.update(chunk); callback(null, chunk);
      } }), createWriteStream(artifactPath, { mode: 0o644 }));
      if (received !== bytes || hash.digest("hex") !== sha256) return reply(400, { error: "artifact mismatch" });
      const outcome = await run({ artifactPath, mainFile, requiresPlugins }, cfg);
      await rm(dir, { recursive: true, force: true });
      dir = undefined;
      busy = false;
      reply(200, { protocol: 1, requestId, sha256, mainFile, profile: cfg.profile, ...outcome });
    } catch { if (!res.headersSent) reply(503, { error: "runner unavailable" }); }
    finally { if (dir) await rm(dir, { recursive: true, force: true }); busy = false; }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const cfg = config();
  if (cfg.token.length < 32 || !cfg.profile || !cfg.cliImage.includes("@sha256:") || !cfg.dbImage.includes("@sha256:")) throw new Error("Set token, profile and digest-pinned images; see README.md");
  // Recover only this single orchestrator's labelled leftovers after a crash.
  const leftovers = await exec("docker", ["ps", "-aq", "--filter", "label=seodaily.sandbox=v1"], { timeout: 5000 });
  for (const id of leftovers.stdout.trim().split(/\s+/).filter(Boolean)) await exec("docker", ["rm", "-f", id], { timeout: 20_000 });
  const volumes = await exec("docker", ["volume", "ls", "-q", "--filter", "label=seodaily.sandbox=v1"], { timeout: 5000 });
  for (const name of volumes.stdout.trim().split(/\s+/).filter(Boolean)) await exec("docker", ["volume", "rm", name], { timeout: 5000 });
  createRunner(cfg).listen(8090, "127.0.0.1");
}
