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
// Take over open pages right away, so an update shows after one reload.
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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

// A playing video asks for many small pieces of its file. Reading the whole
// file out of the cache for every piece was slow on the iPad (the video kept
// stopping to wait, and the sound with it), so the last few files read are
// kept in memory.
const blobs = new Map();  // cache key -> Promise<Blob>
function blobOf(key, res) {
  if (!blobs.has(key)) {
    blobs.set(key, res.blob().catch((e) => { blobs.delete(key); throw e; }));
    while (blobs.size > 3) blobs.delete(blobs.keys().next().value);
  }
  return blobs.get(key);
}

async function ranged(req, res) {
  const range = req.headers.get("range");
  if (!range) return res;
  const blob = await blobOf(res.url || req.url, res);
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
        // Always ask the server for the newest page code (skip the browser's
        // own cache). Only a real network failure (or a very slow answer)
        // falls back to the saved copy, so updates show up right away.
        if (self.navigator && self.navigator.onLine === false) throw new Error("offline");
        const res = await withTimeout(fetch(req.mode === "navigate" ? req.url : req, { cache: "no-cache" }), 15000);
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
    // a player already reading this file from the network before this worker
    // took over keeps reading it from the network
    let mode = starting ? null : (sources.get(k) || "net");
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
