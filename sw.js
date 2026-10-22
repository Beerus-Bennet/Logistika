/* =========================================================================
   LOGISTIKA – Service Worker
   App-Shell offline verfügbar, Kartenkacheln werden zwischengespeichert.
   ========================================================================= */
const VERSION = "v95";
const APP   = "logistika-app-" + VERSION;
const TILES = "logistika-tiles-" + VERSION;
const MAX_TILES = 900;
/* Fotos der Auktionsautos (Wikimedia) – versionsunabhängig, bleiben erhalten */
const PICS = "logistika-carpics";
const MAX_PICS = 260;

const SHELL = [
  "./",
  "./index.html",
  "./style.css?v=95",
  "./data.js?v=95",
  "./farmdata.js?v=95",
  "./fishdata.js?v=95",
  "./erbedata.js?v=95",
  "./places.js?v=95",
  "./avatar.js?v=95",
  "./photo.js?v=95",
  "./map.js?v=95",
  "./offices.js?v=95",
  "./wallet.js?v=95",
  "./snus.js?v=95",
  "./pablo.js?v=95",
  "./extras.js?v=95",
  "./events.js?v=95",
  "./vip.js?v=95",
  "./goals.js?v=95",
  "./lucky.js?v=95",
  "./loading.js?v=95",
  "./game.js?v=95",
  "./farm.js?v=95",
  "./erbe.js?v=95",
  "./intro.js?v=95",
  "./cars.js?v=95",
  "./auction.js?v=95",
  "./customs.js?v=95",
  "./corp.js?v=95",
  "./livery.js?v=95",
  "./gl3d.js?v=95",
  "./farmmodels.js?v=95",
  "./fishmodels.js?v=95",
  "./bushes.js?v=95",
  "./woodmodels.js?v=95",
  "./forestmodels.js?v=95",
  "./forest.js?v=95",
  "./camp.js?v=95",
  "./farmview.js?v=95",
  "./worldview.js?v=95",
  "./minigames.js?v=95",
  "./fpsaw.js?v=95",
  "./fishview.js?v=95",
  "./team.js?v=95",
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

  /* Autofotos von Wikimedia (v77: und die eigenen im Ordner cars/): einmal geladen, danach auch offline da –
     über Versionen hinweg, damit sie nach einem Update nicht neu geladen werden */
  if (url.hostname === "upload.wikimedia.org" || url.hostname === "thumb.wikimedia.org" || (url.origin === self.location.origin && /\/cars\/(art\/)?[^/]+\.(jpe?g|png|webp)$/i.test(url.pathname))) {
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
