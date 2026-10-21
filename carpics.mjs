/* =========================================================================
   LOGISTIKA – carpics.mjs
   Holt einmalig die Fotos der 77 Auktionsautos von Wikipedia/Wikimedia
   Commons und legt sie ins Spiel (Ordner cars/): je Auto ein JPEG mit
   500 px Breite und dazu cars/credits.json mit Urheber, Lizenz und Quelle.
   Das Spiel lädt diese Fotos zuerst (auction.js, loadLocalPics) – sie liegen
   auf derselben Seite wie das Spiel und brauchen Wikipedia nicht mehr.

   Läuft am einfachsten als GitHub-Aktion „Autofotos holen“
   (.github/workflows/carpics.yml, Vorlage: carpics-workflow.yml; Actions → Run workflow). Lokal:
     node carpics.mjs            → fehlende Fotos holen
     node carpics.mjs --force    → alle neu holen
   Braucht Node 18 oder neuer (fetch eingebaut).
   ========================================================================= */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "cars");
const FORCE = process.argv.includes("--force");
const W = 500;
/* Wikimedia möchte einen aussagekräftigen User-Agent (https://meta.wikimedia.org/wiki/User-Agent_policy) */
const UA = "LogistikaCarPics/1.0 (https://github.com/Beerus-Bennet/Logistika; browser game, one-time photo import)";

/* CARS aus cars.js lesen (ohne den Rest des Spiels) */
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "cars.js"), "utf8") + "\n;globalThis.__CARS = CARS;", ctx);
const CARS = ctx.__CARS;
fs.mkdirSync(OUT, { recursive: true });
const credPath = path.join(OUT, "credits.json");
const credits = fs.existsSync(credPath) ? JSON.parse(fs.readFileSync(credPath, "utf8")) : {};

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, json) {
  for (let k = 0; k < 4; k++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
    if (r.ok) return json ? r.json() : Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (k + 1)); continue; }
    throw new Error("HTTP " + r.status + " " + url);
  }
  throw new Error("zu oft gedrosselt: " + url);
}
const api = p => get("https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&" + p, true);
const plain = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();

const todo = CARS.filter(c => FORCE || !credits[c.id] || !fs.existsSync(path.join(OUT, credits[c.id].f)));
console.log(`${CARS.length} Autos, ${todo.length} ohne Foto`);

/* 1. Dateiname des Titelbilds je Artikel (oder fest vorgegeben: file) */
const file = {};
todo.forEach(c => { if (c.file) file[c.id] = c.file; });
const wp = todo.filter(c => c.wp && !c.file);
for (let i = 0; i < wp.length; i += 40) {
  const batch = wp.slice(i, i + 40);
  const j = await api("redirects=1&prop=pageimages&piprop=name&pilicense=free&pilimit=50&titles=" + batch.map(c => encodeURIComponent(c.wp)).join("%7C"));
  const q = j.query || {}, map = {};
  (q.normalized || []).concat(q.redirects || []).forEach(n => { map[n.from] = n.to; });
  const fin = t => { let x = t, k = 0; while (map[x] && k++ < 4) x = map[x]; return x; };
  const pages = {};
  (q.pages || []).forEach(p => { pages[p.title] = p; });
  batch.forEach(c => { const p = pages[fin(c.wp)]; if (p && p.pageimage) file[c.id] = p.pageimage.replace(/_/g, " "); });
}

/* 2. Vorschaubild in 500 px, Urheber und Lizenz */
const info = {};
const ids = Object.keys(file);
for (let i = 0; i < ids.length; i += 40) {
  const batch = ids.slice(i, i + 40);
  const j = await api("prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=" + W + "&iiextmetadatafilter=Artist%7CLicenseShortName%7CLicenseUrl&titles="
    + batch.map(id => encodeURIComponent("File:" + file[id])).join("%7C"));
  const q = j.query || {}, map = {};
  (q.normalized || []).forEach(n => { map[n.from] = n.to; });
  const pages = {};
  (q.pages || []).forEach(p => { pages[p.title] = p; });
  batch.forEach(id => {
    const t0 = "File:" + file[id], p = pages[map[t0] || t0], ii = p && p.imageinfo && p.imageinfo[0];
    if (!ii) return;
    const md = ii.extmetadata || {};
    info[id] = { src: ii.thumburl || ii.url, page: ii.descriptionurl || "", by: plain(md.Artist && md.Artist.value).slice(0, 80),
                 lic: plain(md.LicenseShortName && md.LicenseShortName.value), licUrl: plain(md.LicenseUrl && md.LicenseUrl.value) };
  });
}

/* 3. Herunterladen – nacheinander, mit kleiner Pause (so mag es Wikimedia) */
let ok = 0, miss = [];
for (const c of todo) {
  const I = info[c.id];
  if (!I || !/^https:\/\/upload\.wikimedia\.org\//.test(I.src)) { miss.push(c.id); continue; }
  try {
    const buf = await get(I.src, false);
    const ext = /\.png$/i.test(I.src) ? ".png" : /\.webp$/i.test(I.src) ? ".webp" : ".jpg";
    const f = c.id + ext;
    fs.writeFileSync(path.join(OUT, f), buf);
    credits[c.id] = { f, by: I.by, lic: I.lic, licUrl: I.licUrl, page: I.page, file: file[c.id] };
    ok++;
    console.log("✓", c.id, f, (buf.length / 1024).toFixed(0) + " KB", "·", I.by, "·", I.lic);
  } catch (e) { miss.push(c.id); console.warn("✗", c.id, e.message); }
  await sleep(350);
}
const sorted = {};
Object.keys(credits).sort().forEach(k => { sorted[k] = credits[k]; });
fs.writeFileSync(credPath, JSON.stringify(sorted, null, 1) + "\n");
console.log(`fertig: ${ok} neu, ${Object.keys(sorted).length} insgesamt` + (miss.length ? `, ohne Foto: ${miss.join(", ")}` : ""));
