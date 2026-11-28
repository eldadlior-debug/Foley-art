/* Offline support. The page downloads every file in offline-assets.js into the
   cache (see the OFFLINE block at the end of script.js); this worker answers
   requests from that cache, so the deck runs with no internet. Videos are
   served in byte ranges (206), which Safari needs to play a <video>. */
importScripts("offline-assets.js");

const CACHE = "foley-offline";
const FONT_CACHE = "foley-fonts";
const CORE = /\.(html|css|js|json|webmanifest)$/;
const scopeUrl = new URL(self.registration.scope);
const REVS = new Map((self.OFFLINE_ASSETS || []).map(([p, r]) => [p, r]));

self.addEventListener("install", () => self.skipWaiting());
// No clients.claim(): a page that started without the worker keeps loading its
// videos straight from the network (switching mid-video breaks playback).

// "assets/x.mp4" -> the exact cache key for its current version
function relPath(url) {
  let p = decodeURIComponent(url.pathname.slice(scopeUrl.pathname.length));
  return p === "" ? "index.html" : p;
}
function keyFor(path) {
  const r = REVS.get(path);
  return r ? new URL(`${path}?v=${r}`, scopeUrl).href : null;
}
async function fromCache(path) {
  const c = await caches.open(CACHE);
  const k = keyFor(path);
  return (k && (await c.match(k))) || (await c.match(new URL(path, scopeUrl).href, { ignoreSearch: true }));
}

async function ranged(req, res) {
  const range = req.headers.get("range");
  if (!range) return res;
  const blob = await res.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = blob.size;
  let start = m && m[1] !== "" ? +m[1] : 0;
  let end = m && m[2] !== "" ? +m[2] : size - 1;
  if (m && m[1] === "" && m[2] !== "") { start = Math.max(0, size - +m[2]); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

const sources = new Map();  // "client|file" -> "cache" | "net"

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: from the cache when we have them
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONT_CACHE).then(async (c) => {
      const hit = await c.match(req.url);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") c.put(req.url, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  if (url.searchParams.has("__dl")) return;  // the page downloading a file to save: straight to the network
  const path = req.mode === "navigate" ? "index.html" : relPath(url);

  // Page code (html / css / js): the newest from the network when it answers
  // quickly, otherwise the saved copy.
  if (req.mode === "navigate" || CORE.test(path)) {
    e.respondWith((async () => {
      try {
        const res = await withTimeout(fetch(req), 3000);
        if (res.ok) return res;
        throw new Error(res.status);
      } catch (_) {
        return (await fromCache(path)) || fetch(req);
      }
    })());
    return;
  }

  // Media: the saved copy first (in ranges for video / audio). A player must
  // get all the pieces of one file from the same place, so the choice
  // (saved copy or network) is made when it starts reading the file and kept
  // until it starts over; otherwise a file saved mid-play breaks playback.
  const range = req.headers.get("range");
  const k = `${e.clientId}|${path}`;
  const starting = !range || /^bytes=0-/.test(range);
  e.respondWith((async () => {
    let mode = starting ? null : sources.get(k);
    if (!mode) {
      mode = (await fromCache(path)) ? "cache" : "net";
      sources.set(k, mode);
      if (sources.size > 200) sources.delete(sources.keys().next().value);
    }
    if (mode === "cache") {
      const hit = await fromCache(path);
      if (hit) return ranged(req, hit);
    }
    return fetch(req);
  })());
});
