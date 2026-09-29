import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { inspectPackage, ZipError } from "../../src/modules/plugins/pipeline/zip.ts";
import { buildZip, pluginZip } from "../support/zip-builder.mjs";

const dir = mkdtempSync(path.join(tmpdir(), "plzip-"));
const LIMITS = { maxEntries: 1000, maxUnpackedBytes: 50 * 1024 * 1024, maxRatio: 200 };
let n = 0;
async function inspect(buf, limits = LIMITS) {
  const file = path.join(dir, `t${n++}.zip`);
  writeFileSync(file, buf);
  return inspectPackage(file, buf.length, limits);
}
async function rejects(buf, re, limits) {
  await assert.rejects(inspect(buf, limits), (e) => e instanceof ZipError && re.test(e.message));
}

test("valid plugin: header read without running PHP, readme fields and changelog", async () => {
  const r = await inspect(pluginZip({ version: "1.2.0" }));
  assert.equal(r.folder, "hello-test");
  assert.equal(r.mainFile, "hello-test.php");
  assert.equal(r.header.pluginName, "Hello Test");
  assert.equal(r.header.version, "1.2.0");
  assert.equal(r.header.textDomain, "hello-test");
  assert.equal(r.header.author, "Example Author");
  assert.equal(r.readme.testedUpTo, "6.6");
  assert.match(r.readme.changelog["1.2.0"], /Fixed something/);
  assert.equal(r.fileCount, 2);
  assert.equal(Object.keys(r.fileHashes).length, 2);
  assert.match(r.fileHashes["hello-test.php"], /^[a-f0-9]{64}$/);
});

test("PL-T09: HTML instead of ZIP", async () => {
  await rejects(Buffer.from("<!doctype html><html><body>Login</body></html>"), /HTML/);
});

test("PL-T09: truncated / not a zip", async () => {
  const good = pluginZip();
  await rejects(good.subarray(0, good.length - 30), /معتبر نیست|خراب|ناقص/);
  await rejects(Buffer.from("PK\u0003\u0004 garbage garbage garbage"), /معتبر نیست|خراب|ناقص/);
});

test("PL-T09: path traversal, absolute path, backslash", async () => {
  await rejects(buildZip([{ name: "p/p.php", data: "<?php // Plugin Name: X" }, { name: "p/../../evil.php", data: "x" }]), /traversal/);
  await rejects(buildZip([{ name: "/etc/passwd", data: "x" }]), /مطلق/);
  await rejects(buildZip([{ name: "p\\..\\evil.php", data: "x" }]), /بک‌اسلش/);
});

test("PL-T09: symlink and encrypted entries", async () => {
  await rejects(buildZip([{ name: "p/p.php", data: "<?php" }, { name: "p/link", data: "/etc/passwd", unixMode: 0o120777 }]), /symlink/);
  await rejects(buildZip([{ name: "p/p.php", data: "<?php", flags: 1 }]), /رمزدار/);
});

test("PL-T09: bomb — entry inflates beyond its declared size, and huge ratio", async () => {
  const big = Buffer.alloc(3 * 1024 * 1024, 0x41);
  await rejects(buildZip([{ name: "p/p.php", data: "<?php // Plugin Name: X" }, { name: "p/a.txt", data: big, method: 8, declaredSize: 1000 }]), /bomb|CRC|نمی‌خواند/);
  await rejects(buildZip([{ name: "p/p.php", data: "<?php // Plugin Name: X" }, { name: "p/a.txt", data: Buffer.alloc(40 * 1024 * 1024, 0), method: 8 }]), /bomb|نسبت/);
  await rejects(pluginZip(), /سقف/, { ...LIMITS, maxUnpackedBytes: 100 });
});

test("PL-T09: CRC mismatch, duplicate names, too many entries", async () => {
  await rejects(buildZip([{ name: "p/p.php", data: "<?php // Plugin Name: X", crc: 1234 }]), /CRC/);
  await rejects(buildZip([{ name: "p/p.php", data: "<?php" }, { name: "p/P.php", data: "<?php" }]), /تکراری/);
  await rejects(pluginZip(), /سقف/, { ...LIMITS, maxEntries: 2 });
});

test("not a plugin: files outside one folder, theme, nested zip, no header", async () => {
  await rejects(buildZip([{ name: "a.php", data: "<?php" }, { name: "b/b.php", data: "<?php" }]), /یک پوشه/);
  await rejects(buildZip([{ name: "t/style.css", data: "/*\nTheme Name: T\n*/" }, { name: "t/index.php", data: "<?php" }]), /قالب/);
  await rejects(buildZip([{ name: "plugin.zip", data: "x" }, { name: "docs/readme.txt", data: "x" }]), /تودرتو/);
  await rejects(buildZip([{ name: "p/p.php", data: "<?php echo 1;" }]), /Plugin Name/);
});

test("risky binaries are reported for review, not silently accepted", async () => {
  const r = await inspect(pluginZip({ extra: [{ name: "hello-test/bin/tool.exe", data: "MZ..." }] }));
  assert.deepEqual(r.riskyBinaries, ["bin/tool.exe"]);
});
