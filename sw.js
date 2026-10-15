/* =========================================================================
   LOGISTIKA – Service Worker
   App-Shell offline verfügbar, Kartenkacheln werden zwischengespeichert.
   ========================================================================= */
const VERSION = "v69.5";
const APP   = "logistika-app-" + VERSION;
const TILES = "logistika-tiles-" + VERSION;
const MAX_TILES = 900;
/* Fotos der Auktionsautos (Wikimedia) – versionsunabhängig, bleiben erhalten */
const PICS = "logistika-carpics";
const MAX_PICS = 160;

const SHELL = [
  "./",
  "./index.html",
  "./style.css?v=69.5",
  "./data.js?v=69.5",
  "./farmdata.js?v=69.5",
  "./fishdata.js?v=69.5",
  "./erbedata.js?v=69.5",
  "./places.js?v=69.5",
  "./avatar.js?v=69.5",
  "./photo.js?v=69.5",
  "./map.js?v=69.5",
  "./offices.js?v=69.5",
  "./wallet.js?v=69.5",
  "./snus.js?v=69.5",
  "./pablo.js?v=69.5",
  "./extras.js?v=69.5",
  "./events.js?v=69.5",
  "./vip.js?v=69.5",
  "./goals.js?v=69.5",
  "./lucky.js?v=69.5",
  "./loading.js?v=69.5",
  "./game.js?v=69.5",
  "./farm.js?v=69.5",
  "./erbe.js?v=69.5",
  "./intro.js?v=69.5",
  "./cars.js?v=69.5",
  "./auction.js?v=69.5",
  "./customs.js?v=69.5",
  "./corp.js?v=69.5",
  "./livery.js?v=69.5",
  "./gl3d.js?v=69.5",
  "./farmmodels.js?v=69.5",
  "./fishmodels.js?v=69.5",
  "./woodmodels.js?v=69.5",
  "./farmview.js?v=69.5",
  "./worldview.js?v=69.5",
  "./minigames.js?v=69.5",
  "./fishview.js?v=69.5",
  "./team.js?v=69.5",
  "./manifest.webmanifest",
  "./favicon-64.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./lina.png",
  "./bert.png",
  "./player-p1.png",
  "./player-p2.png",
  "./player-p3.png",
  "./player-p4.png",
  "./player-p5.png",
  "./player-p6.png",
  "./player-p7.png",
  "./player-p8.png",
  "./player-p9.png",
  "./player-p10.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(APP)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== APP && k !== TILES && k !== PICS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimTiles(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  /* Kartenkacheln: zuerst Cache, sonst Netz und ablegen */
  if (/(^|\.)tile\.openstreetmap\.(org|de)$/.test(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(TILES);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) { cache.put(req, res.clone()); trimTiles(cache); }
        return res;
      } catch (_) {
        return hit || new Response("", { status: 504 });
      }
    })());
    return;
  }

  /* Autofotos von Wikimedia: einmal geladen, danach auch offline da */
  if (url.hostname === "upload.wikimedia.org") {
    e.respondWith((async () => {
      const cache = await caches.open(PICS);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) {   /* nur CORS-Antworten – undurchsichtige belegen viel Speicher */
          cache.put(req, res.clone());
          cache.keys().then(ks => { for (let i = 0; i < ks.length - MAX_PICS; i++) cache.delete(ks[i]); });
        }
        return res;
      } catch (_) {
        return hit || new Response("", { status: 504 });
      }
    })());
    return;
  }

  /* Seitenaufrufe: Netz zuerst, bei Ausfall die gespeicherte Startseite */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  /* Eigene Dateien: Cache zuerst, im Hintergrund auffrischen */
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(APP);
      const hit = await cache.match(req);
      const net = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
  }
});
