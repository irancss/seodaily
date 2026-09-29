// A local HTTP server standing in for plugin sources in tests (never used in
// production). Routes are set per test: path → { status, type, body, headers }.
import http from "node:http";

export async function fixtureServer() {
  const routes = new Map();
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url);
    const r = routes.get(req.url.split("?")[0]);
    if (!r) {
      res.writeHead(404).end("not found");
      return;
    }
    const route = typeof r === "function" ? r(req) : r;
    res.writeHead(route.status ?? 200, { "content-type": route.type ?? "text/html; charset=utf-8", ...(route.headers ?? {}) });
    res.end(route.body ?? "");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    hits,
    set: (path, route) => routes.set(path, route),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
