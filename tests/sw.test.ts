import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
test("service worker precaches scripts and never caches API or authenticated responses", async () => {
  const handlers: Record<string, Function> = {},
    cached = new Map<string, Response>();
  let response: Promise<Response> | undefined,
    installed: Promise<unknown> | undefined;
  const cache = {
    addAll: async (urls: string[]) => {
      for (const url of urls) await cache.add(url);
    },
    add: async (url: string) => {
      cached.set(
        url,
        new Response(
          url === "/"
            ? '<script src="/_next/static/app.js"></script><link href="/_next/static/app.css" rel="stylesheet">'
            : "asset",
        ),
      );
    },
    match: async (url: string) => cached.get(url)?.clone(),
    put: async (req: Request | string, res: Response) => {
      cached.set(
        typeof req === "string" ? req : new URL(req.url).pathname,
        res,
      );
    },
  };
  const context = {
    self: {
      addEventListener: (name: string, fn: Function) => (handlers[name] = fn),
      skipWaiting: () => {},
      clients: { claim: async () => {} },
    },
    location: { origin: "https://island.test" },
    caches: {
      open: async () => cache,
      match: async (url: string) => cache.match(url),
      keys: async () => ["study-island-shell-v1"],
      delete: async () => {},
    },
    fetch: async () => {
      throw Error("offline");
    },
    URL,
    Set,
    Promise,
  };
  vm.runInNewContext(await readFile("public/sw.js", "utf8"), context);
  handlers.install({
    waitUntil: (promise: Promise<unknown>) => (installed = promise),
  });
  await installed;
  assert.ok(cached.has("/_next/static/app.js"));
  assert.ok(cached.has("/_next/static/app.css"));
  handlers.fetch({
    request: new Request("https://island.test/api/state"),
    respondWith: (p: Promise<Response>) => (response = p),
  });
  assert.equal(response, undefined);
  handlers.fetch({
    request: new Request("https://island.test/private", {
      headers: { authorization: "Bearer test" },
    }),
    respondWith: (p: Promise<Response>) => (response = p),
  });
  assert.equal(response, undefined);
  handlers.fetch({
    request: {
      url: "https://island.test/",
      method: "GET",
      mode: "navigate",
      headers: new Headers(),
    },
    respondWith: (p: Promise<Response>) => (response = p),
  });
  assert.ok((await (await response!).text()).includes("app.js"));
  assert.ok(!cached.has("/api/state"));
});
