import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { sandboxRunner } from "../../src/modules/plugins/pipeline/sandbox.ts";
import { createRunner, runIsolated } from "../../deploy/sandbox/runner.mjs";

test("sandbox protocol authenticates, streams exact bytes, binds evidence and fails closed", async () => {
  const token = "isolated-test-token-".repeat(3), dir = await mkdtemp(path.join(tmpdir(), "runner-client-"));
  const artifactPath = path.join(dir, "fixture.zip"), bytes = Buffer.from("inert protocol fixture");
  await writeFile(artifactPath, bytes);
  let mode = "pass", calls = 0;
  const server = createRunner({ token, profile: "test WP/PHP/MariaDB" }, async () => {
    calls++;
    if (mode === "wrong-hash") return { sha256: "0".repeat(64), result: "installed_activated_no_fatal", stages: { installed: true, activated: true, request: true, noFatal: true } };
    if (mode === "incomplete") return { result: "installed_activated_no_fatal", stages: { installed: true } };
    if (mode === "dependency") return { result: "requires_dependency" };
    if (mode === "fatal") return { result: "activation_fatal" };
    return { result: "installed_activated_no_fatal", stages: { installed: true, activated: true, request: true, noFatal: true } };
  }, async () => {});
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const client = sandboxRunner(url, token, 2000);
  const input = { artifactPath, sha256: createHash("sha256").update(bytes).digest("hex"), mainFile: "hello/hello.php", wpVersion: "", phpVersion: "" };
  try {
    assert.equal((await client.health()).available, true);
    assert.equal((await client.run(input)).status, "PASS");
    for (const [value, expected] of [["wrong-hash", "UNAVAILABLE"], ["incomplete", "UNAVAILABLE"], ["dependency", "WARNING"], ["fatal", "FAIL"]]) {
      mode = value;
      assert.equal((await client.run(input)).status, expected);
    }
    assert.equal((await client.run({ ...input, sha256: "a".repeat(64) })).status, "UNAVAILABLE");
    assert.equal(calls, 5, "hash mismatch was rejected before execution");
    assert.equal((await sandboxRunner(url, "wrong-token".repeat(4)).health()).available, false);
    assert.equal((await sandboxRunner("", token).run(input)).status, "UNAVAILABLE");
    assert.equal(sandboxRunner("http://external.example", token).available, false);
    assert.equal(sandboxRunner("https://example.com", "").available, false);
  } finally { await new Promise((resolve) => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});

test("isolated execution has fixed commands, no network/socket/secrets and always tears down", async () => {
  const calls = [];
  const invoke = async (bin, args) => { calls.push({ bin, args }); if (args.includes("activate")) throw new Error("fixture activation fatal"); return { stdout: "", stderr: "" }; };
  const result = await runIsolated({ artifactPath: "/tmp/one.zip", mainFile: "hello/hello.php", requiresPlugins: "" }, { cliImage: "cli@sha256:fixture", dbImage: "db@sha256:fixture", template: "/template" }, invoke);
  assert.equal(result.result, "activation_fatal");
  const launches = calls.filter((c) => c.args[0] === "run");
  assert.equal(launches.length, 2);
  for (const { args } of launches) {
    for (const required of ["--runtime=runsc", "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=128"]) assert.ok(args.includes(required));
    assert.ok(!args.join(" ").includes("docker.sock"));
    assert.ok(!args.includes("--privileged"));
    assert.ok(!args.join(" ").includes("SANDBOX_TOKEN"));
  }
  assert.deepEqual(calls.at(-2).args.slice(0, 2), ["rm", "-f"]);
  assert.deepEqual(calls.at(-1).args.slice(0, 2), ["volume", "rm"]);
});
