/* =========================================================================
   LOGISTIKA – carart.mjs
   Zeichnet die Autos des Auktionshauses im einheitlichen Comic-Stil mit der Gemini-Bild-KI
   und legt sie unter cars/art/<id>.webp ab. cars/art.json (Liste der vorhandenen Zeichnungen)
   liest das Spiel (auction.js, loadLocalPics): Zeichnungen gehen den Fotos vor, ohne Filter.

   Läuft als GitHub-Aktion „Autozeichnungen erzeugen“ (.github/workflows/carart.yml, Vorlage
   carart-workflow.yml). Der Schlüssel liegt als Repository-Geheimnis GEMINI_API_KEY – er steht
   nie im Code und nie im Protokoll. Lokal:
     GEMINI_API_KEY=… node carart.mjs --limit 3     → die ersten 3 fehlenden Autos (zum Ausprobieren)
     node carart.mjs --only f458,p930               → nur diese
     node carart.mjs --force                        → alles neu zeichnen
     node carart.mjs --prompts                      → autobilder-prompts.txt schreiben (zum Selbstmachen in Gemini)
     node carart.mjs --manifest                     → nur cars/art.json aus den vorhandenen Dateien bauen
   Selbst gemachte Bilder: als cars/art/<id>.png|jpg|webp hochladen, dann --manifest (macht die Aktion automatisch).
   ========================================================================= */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(ROOT, "cars", "art");
const arg = n => process.argv.includes(n);
const val = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : ""; };
const MODEL = val("--model") || process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
const KEY = process.env.GEMINI_API_KEY || "";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "cars.js"), "utf8") + "\n;globalThis.__X = { CARS, CAR_PAINTS, CAR_BRANDS };", ctx);
const { CARS, CAR_PAINTS, CAR_BRANDS } = ctx.__X;
const BRAND = Object.fromEntries(CAR_BRANDS);
fs.mkdirSync(DIR, { recursive: true });

const EXT = /\.(png|jpe?g|webp)$/i;
const have = id => fs.readdirSync(DIR).find(f => f.replace(EXT, "") === id && EXT.test(f));

/* ---- Liste der vorhandenen Zeichnungen für das Spiel ---- */
function manifest() {
  const out = {};
  CARS.forEach(c => { const f = have(c.id); if (f) out[c.id] = "art/" + f + "?v=" + fs.statSync(path.join(DIR, f)).size; });
  fs.writeFileSync(path.join(ROOT, "cars", "art.json"), JSON.stringify(out, null, 1) + "\n");
  console.log(`cars/art.json: ${Object.keys(out).length} von ${CARS.length} Autos haben eine Zeichnung`);
}

/* ---- Bildanweisung: gleicher Stil für alle, Lack je nach Auto abwechselnd ---- */
const paints = {}, perBrand = {};
CARS.forEach(c => {
  const n = perBrand[c.b] = (perBrand[c.b] || 0) + 1, list = CAR_PAINTS[c.b] || [["", ""]];
  paints[c.id] = list[(n - 1) % list.length][0];
});
const NAME = c => `${BRAND[c.b] || c.b} ${c.m}`;
const PROMPT = (c, paint) =>
  `Zeichne ein ${NAME(c)} (Baujahr ca. ${c.y})${paint ? ` in der Lackfarbe ${paint}` : ""} als saubere Comic-Vektor-Illustration: ` +
  `dunkle, gleichmäßige Konturlinien, flächige Farben mit sanften Schattierungen und Glanzlichtern, ` +
  `originalgetreue Proportionen und Merkmale des Modells, detaillierte Felgen, Scheinwerfer, Scheiben mit Innenraum und Rückspiegel. ` +
  `Perspektive: Dreiviertelansicht schräg von vorne und leicht von oben, das Auto zeigt nach rechts. ` +
  `Hintergrund: einfarbig sehr helles Grau mit einem weichen Schatten unter dem Auto. ` +
  `Im Bild ist nur das Auto – keine Personen, keine Gegenstände, kein Text, keine Rahmen. ` +
  `Querformat 16:9, das Auto ist mittig und füllt etwa 85 % der Bildbreite.`;

if (arg("--manifest")) { manifest(); process.exit(0); }
if (arg("--prompts")) {
  const lines = ["# Bildanweisungen fürs Auktionshaus – eine Zeile pro Auto.", "# Das fertige Bild als <Kürzel>.png (oder .jpg/.webp) in den Ordner cars/art/ legen.", ""];
  CARS.forEach(c => lines.push(`[${c.id}]  ${PROMPT(c, paints[c.id])}`, ""));
  fs.writeFileSync(path.join(ROOT, "autobilder-prompts.txt"), lines.join("\n"));
  console.log("autobilder-prompts.txt geschrieben,", CARS.length, "Anweisungen");
  process.exit(0);
}

/* ---- Zeichnen lassen ---- */
if (!KEY && arg("--need-key")) { console.error("Das Repository-Geheimnis GEMINI_API_KEY fehlt (Settings → Secrets and variables → Actions → New repository secret)."); process.exit(1); }
if (!KEY) { console.log("Kein GEMINI_API_KEY gesetzt – es wird nichts gezeichnet, nur die Liste gebaut."); manifest(); process.exit(0); }

let sharp = null;
try { sharp = (await import("sharp")).default; } catch (_) { console.warn("Hinweis: „sharp“ fehlt – Bilder werden unverkleinert gespeichert."); }

const API = "https://generativelanguage.googleapis.com/v1beta/";
async function call(pathAndQuery, body) {
  for (let k = 0; k < 4; k++) {
    const r = await fetch(API + pathAndQuery, {
      method: body ? "POST" : "GET",
      headers: { "x-goog-api-key": KEY, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.ok) return r.json();
    const txt = (await r.text()).slice(0, 400).replace(KEY, "***");
    if (r.status === 429 || r.status >= 500) { console.warn(`  HTTP ${r.status}, neuer Versuch …`); await sleep(8000 * (k + 1)); continue; }
    const e = new Error("HTTP " + r.status + " " + txt); e.status = r.status; throw e;
  }
  throw new Error("zu oft gedrosselt");
}
async function listImageModels() {
  try {
    const j = await call("models?pageSize=200");
    const m = (j.models || []).map(x => x.name.replace("models/", "")).filter(n => /image/i.test(n));
    console.log("Bild-Modelle dieses Schlüssels:", m.join(", ") || "(keine)");
  } catch (e) { console.warn("Modellliste nicht lesbar:", e.message); }
}

let todo = CARS.filter(c => arg("--force") || !have(c.id));
const only = val("--only");
if (only) { const s = new Set(only.split(",").map(x => x.trim())); todo = CARS.filter(c => s.has(c.id)); }
const lim = +val("--limit");
if (lim > 0) todo = todo.slice(0, lim);
console.log(`${CARS.length} Autos, ${todo.length} zu zeichnen (Modell ${MODEL})`);

let ok = 0; const fail = [];
for (const c of todo) {
  try {
    const j = await call(`models/${MODEL}:generateContent`, {
      contents: [{ parts: [{ text: PROMPT(c, paints[c.id]) }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } }
    });
    const parts = ((j.candidates || [])[0] || {}).content ? j.candidates[0].content.parts || [] : [];
    const img = parts.find(p => (p.inlineData || p.inline_data));
    if (!img) throw new Error("kein Bild in der Antwort: " + JSON.stringify(j).slice(0, 250));
    const d = img.inlineData || img.inline_data;
    let buf = Buffer.from(d.data, "base64"), ext = /jpe?g/i.test(d.mimeType || d.mime_type || "") ? ".jpg" : ".png";
    if (sharp) { buf = await sharp(buf).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(); ext = ".webp"; }
    fs.readdirSync(DIR).filter(f => f.replace(EXT, "") === c.id).forEach(f => fs.unlinkSync(path.join(DIR, f)));
    fs.writeFileSync(path.join(DIR, c.id + ext), buf);
    ok++;
    console.log("✓", c.id, NAME(c), (buf.length / 1024).toFixed(0) + " KB");
  } catch (e) {
    fail.push(c.id);
    console.warn("✗", c.id, e.message);
    if (e.status === 404 || e.status === 400 || e.status === 403) { await listImageModels(); console.warn("Abbruch: der Schlüssel oder das Modell passt nicht."); break; }
  }
  await sleep(2500);
}
manifest();
console.log(`fertig: ${ok} gezeichnet` + (fail.length ? `, Fehler bei: ${fail.join(", ")}` : ""));
if (todo.length && !ok) process.exit(1);
