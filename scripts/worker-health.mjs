import { readFile } from "node:fs/promises";

try {
  const marker = JSON.parse(await readFile("/tmp/seodaily-worker-heartbeat.json", "utf8"));
  process.kill(marker.pid, 0);
  const age = Date.now() - marker.at;
  if (!Number.isFinite(age) || age < 0 || age > 120_000) process.exit(1);
} catch {
  process.exit(1);
}
