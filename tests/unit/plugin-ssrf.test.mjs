import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";

import { checkUrl, fetchText, FetchError, isPublicAddress, safeLookup } from "../../src/modules/plugins/pipeline/safe-fetch.ts";

const opts = { timeoutMs: 5000, maxBytes: 10000, userAgent: "test" };

test("PL-T08: private, loopback, link-local, metadata and special ranges are not public (IPv4/IPv6/mapped)", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a9fe:a9fe", "::ffff:169.254.169.254"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  for (const ip of ["93.184.216.34", "185.143.232.1", "2606:4700::1111", "8.8.8.8"]) assert.equal(isPublicAddress(ip), true, ip);
});

test("PL-T08: URL checks — scheme, credentials, literal private IPs, local names", () => {
  for (const bad of ["file:///etc/passwd", "ftp://example.com/x.zip", "gopher://x", "http://user:pw@example.com/", "http://127.0.0.1/", "http://[::1]/", "http://169.254.169.254/latest/meta-data/", "http://localhost:3000/", "http://printer.local/", "http://metadata.google.internal/"]) {
    assert.throws(() => checkUrl(bad), FetchError, bad);
  }
  assert.equal(checkUrl("https://wordpress.org/plugins/x/").hostname, "wordpress.org");
});

test("PL-T08: a real request to a loopback server is refused, also through a hostname and via redirect", async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/redirect") res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end();
    else res.end("secret");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  after(() => server.close());
  const port = server.address().port;
  await assert.rejects(fetchText(`http://127.0.0.1:${port}/`, opts), (e) => e.code === "blocked");
  await assert.rejects(fetchText(`http://localhost.:${port}/`, opts), (e) => e.code === "blocked", "trailing-dot local name");
  // A hostname that resolves to a loopback address is refused at DNS time; the socket connects only to the checked address.
  const err = await new Promise((resolve) => safeLookup("localhost", { all: true }, (e) => resolve(e)));
  assert.equal(err?.code, "EBLOCKED");
  process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS = "127.0.0.1/32";
  try {
    assert.equal((await fetchText(`http://127.0.0.1:${port}/`, opts)).text, "secret", "test allowance only for the fixture address");
    await assert.rejects(fetchText(`http://127.0.0.1:${port}/redirect`, opts), (e) => e.code === "blocked", "redirect to metadata IP");
  } finally {
    delete process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS;
  }
});

test("PL-T08: the test allowance is ignored in production outside CI", () => {
  const env = { ...process.env };
  process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS = "127.0.0.1/32";
  process.env.NODE_ENV = "production";
  delete process.env.CI;
  try {
    assert.equal(isPublicAddress("127.0.0.1"), false);
  } finally {
    Object.assign(process.env, env);
    if (!("CI" in env)) delete process.env.CI;
    delete process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS;
    process.env.NODE_ENV = env.NODE_ENV;
    if (env.NODE_ENV === undefined) delete process.env.NODE_ENV;
  }
});
