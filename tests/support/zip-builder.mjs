// Builds ZIP archives for tests, including deliberately broken ones
// (traversal names, symlinks, encryption flag, lying sizes). Test-only.
import { crc32, deflateRawSync } from "node:zlib";

/**
 * entries: [{ name, data?: string|Buffer, method?: 0|8, unixMode?, flags?, declaredSize?, crc? }]
 */
export function buildZip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data ?? "", "utf8");
    const method = e.method ?? (data.length > 64 ? 8 : 0);
    const body = method === 8 ? deflateRawSync(data) : data;
    const crc = e.crc ?? crc32(data);
    const size = e.declaredSize ?? data.length;
    const flags = (e.flags ?? 0) | 0x800;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc >>> 0, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, body);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE((3 << 8) | 20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(flags, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt32LE(crc >>> 0, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(size, 24);
    cd.writeUInt16LE(name.length, 28);
    const mode = e.unixMode ?? (e.name.endsWith("/") ? 0o040755 : 0o100644);
    cd.writeUInt32LE((mode << 16) >>> 0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);
    offset += 30 + name.length + body.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cdBuf, end]);
}

/** A minimal valid plugin package. */
export function pluginZip({ folder = "hello-test", name = "Hello Test", version = "1.2.0", textDomain = folder, extra = [] } = {}) {
  return buildZip([
    { name: `${folder}/` },
    {
      name: `${folder}/${folder}.php`,
      data: `<?php\n/**\n * Plugin Name: ${name}\n * Version: ${version}\n * Author: Example Author\n * Author URI: https://example.org\n * Text Domain: ${textDomain}\n * Requires at least: 6.0\n * Requires PHP: 7.4\n * License: GPLv2 or later\n */\n\nfunction hello_test() { return 42; }\n`,
    },
    {
      name: `${folder}/readme.txt`,
      data: `=== ${name} ===\nStable tag: ${version}\nTested up to: 6.6\nRequires at least: 6.0\n\n== Description ==\nTest.\n\n== Changelog ==\n\n= ${version} =\n* Fixed something.\n\n= 1.0.0 =\n* First.\n`,
    },
    ...extra,
  ]);
}
