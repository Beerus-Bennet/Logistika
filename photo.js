/* =========================================================================
   LOGISTIKA – Spielfigur aus einem Foto
   Selfie aufnehmen oder ein Bild wählen (auch ein gespeichertes Memoji oder
   Bitmoji), im Kreis ausrichten, und das Spiel zeichnet daraus ein Comic-
   Porträt. Alles passiert im Browser – das Foto verlässt das Gerät nicht.
   Gespeichert wird nur das fertige 256-px-Porträt.
   ========================================================================= */
"use strict";

const PHOTO_PX = 256;
const PHOTO_STYLES = [["comic", "Comic"], ["stark", "Comic kräftig"], ["original", "Original"]];
/* Arbeitsstand des Editors – das Originalbild bleibt nur im Speicher */
const PHOTO = { img: null, zoom: 1, ox: 0, oy: 0, style: "comic", onChange: null };

function photoPick(capture) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  if (capture) inp.setAttribute("capture", "user");     /* iPhone: Frontkamera */
  inp.style.display = "none";
  document.body.appendChild(inp);
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    inp.remove();
    if (f) photoLoad(f);
  };
  inp.click();
}
function photoLoad(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    PHOTO.img = img; PHOTO.zoom = 1; PHOTO.ox = 0; PHOTO.oy = 0;
    /* Sticker mit durchsichtigem Rand (Memoji, Bitmoji) bleiben im Original */
    PHOTO.style = photoHasAlpha(img) ? "original" : PHOTO.style;
    photoUpdate(true);
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast("Das Bild ließ sich nicht öffnen. JPG oder PNG gehen immer.", "warn"); };
  img.src = url;
}
function photoHasAlpha(img) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 240) return true;
  return false;
}

/* Bild in den Kreis setzen: bedeckend skaliert, dann Zoom und Verschiebung */
function photoGeometry() {
  const img = PHOTO.img, S0 = PHOTO_PX;
  const s = Math.max(S0 / img.width, S0 / img.height) * PHOTO.zoom;
  const w = img.width * s, h = img.height * s;
  const mx = Math.max(0, (w - S0) / 2), my = Math.max(0, (h - S0) / 2);
  PHOTO.ox = clamp(PHOTO.ox, -mx, mx);
  PHOTO.oy = clamp(PHOTO.oy, -my, my);
  return { w, h, x: (S0 - w) / 2 + PHOTO.ox, y: (S0 - h) / 2 + PHOTO.oy };
}
function photoCompose(withFilter) {
  const c = document.createElement("canvas");
  c.width = c.height = PHOTO_PX;
  const g = c.getContext("2d");
  const q = photoGeometry();
  g.imageSmoothingQuality = "high";
  g.drawImage(PHOTO.img, q.x, q.y, q.w, q.h);
  const data = g.getImageData(0, 0, PHOTO_PX, PHOTO_PX);
  let alpha = false;
  for (let i = 3; i < data.data.length; i += 4) if (data.data[i] < 250) { alpha = true; break; }
  if (withFilter && PHOTO.style !== "original") {
    comicFilter(data, PHOTO.style === "stark");
    g.putImageData(data, 0, 0);
  }
  return alpha ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.88);
}

/* ------------------------------ Comic-Filter -------------------------------
   1. Bilateral-Filter, mehrfach: glättet Haut und Flächen, Kanten bleiben
   2. Weiche Tonstufen (Cel-Shading), Farben etwas kräftiger
   3. Tuschelinien aus einer Differenz zweier Weichzeichner (XDoG),
      einzelne Krümel werden entfernt
   Bei Stickern mit Transparenz kommt eine Umrisslinie außen herum dazu.   */
const PHOTO_FX = {
  comic: { it: 3, sr: 24, bins: 7, phiQ: 2.6, sat: 1.2,  sigma: 1.0, eps: -0.010 },
  stark: { it: 4, sr: 30, bins: 4, phiQ: 5,   sat: 1.35, sigma: 1.3, eps: -0.005 }
};
function phGauss(src, W, H, sigma) {
  const r = Math.ceil(sigma * 3), k = [], tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  let s = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); s += v; }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let a = 0;
    for (let i = -r; i <= r; i++) a += src[y * W + Math.min(W - 1, Math.max(0, x + i))] * k[i + r];
    tmp[y * W + x] = a;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let a = 0;
    for (let i = -r; i <= r; i++) a += tmp[Math.min(H - 1, Math.max(0, y + i)) * W + x] * k[i + r];
    out[y * W + x] = a;
  }
  return out;
}
let phRangeTab = null, phRangeSr = 0;
function phBilateral(src, W, H, rad, ss, sr) {
  const out = new Float32Array(src.length), ks = [];
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const d2 = dx * dx + dy * dy;
    if (d2 <= rad * rad) ks.push(dx, dy, Math.exp(-d2 / (2 * ss * ss)));
  }
  if (phRangeSr !== sr) {                           /* Gewicht nach Farbabstand² */
    phRangeTab = new Float32Array(3 * 255 * 255 + 1);
    for (let i = 0; i < phRangeTab.length; i++) phRangeTab[i] = Math.exp(-i / (2 * sr * sr));
    phRangeSr = sr;
  }
  const rt = phRangeTab, top = rt.length - 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const j = (y * W + x) * 3, r0 = src[j], g0 = src[j + 1], b0 = src[j + 2];
    let ar = 0, ag = 0, ab = 0, aw = 0;
    for (let m = 0; m < ks.length; m += 3) {
      const xx = x + ks[m], yy = y + ks[m + 1];
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const i = (yy * W + xx) * 3, dr = src[i] - r0, dg = src[i + 1] - g0, db = src[i + 2] - b0;
      const w = ks[m + 2] * rt[Math.min(top, (dr * dr + dg * dg + db * db) | 0)];
      ar += src[i] * w; ag += src[i + 1] * w; ab += src[i + 2] * w; aw += w;
    }
    out[j] = ar / aw; out[j + 1] = ag / aw; out[j + 2] = ab / aw;
  }
  return out;
}
function comicFilter(id, strong) {
  const P = strong ? PHOTO_FX.stark : PHOTO_FX.comic;
  const W = id.width, H = id.height, p = id.data, n = W * H;
  let rgb = new Float32Array(n * 3), first = null;
  const lum0 = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    rgb[j * 3] = p[j * 4]; rgb[j * 3 + 1] = p[j * 4 + 1]; rgb[j * 3 + 2] = p[j * 4 + 2];
    lum0[j] = (0.299 * p[j * 4] + 0.587 * p[j * 4 + 1] + 0.114 * p[j * 4 + 2]) / 255;
  }
  for (let k = 0; k < P.it; k++) { rgb = phBilateral(rgb, W, H, 4, 2.5, P.sr); if (!k) first = rgb; }
  /* Linien: halb aus dem einmal geglätteten, halb aus dem Originalbild */
  const lum = new Float32Array(n);
  for (let j = 0; j < n; j++) lum[j] = (0.299 * first[j * 3] + 0.587 * first[j * 3 + 1] + 0.114 * first[j * 3 + 2]) / 255 * 0.5 + lum0[j] * 0.5;
  const g1 = phGauss(lum, W, H, P.sigma), g2 = phGauss(lum, W, H, P.sigma * 1.6);
  const ink = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    const D = g1[j] - 0.985 * g2[j];
    ink[j] = D >= P.eps ? 0 : Math.min(1, -Math.tanh(150 * (D - P.eps)));
  }
  const ink2 = new Float32Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const j = y * W + x;
    if (ink[j] < 0.3) continue;
    let c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && ink[yy * W + xx] >= 0.3) c++;
    }
    ink2[j] = c >= 2 ? ink[j] : 0;
  }
  let sticker = false;                          /* Bild mit durchsichtigen Stellen? */
  for (let i = 3; i < p.length; i += 4) if (p[i] < 128) { sticker = true; break; }
  const INK = [22, 27, 38], dq = 1 / P.bins;
  for (let j = 0; j < n; j++) {
    const i = j * 4;
    if (p[i + 3] < 10) continue;
    let r = rgb[j * 3] / 255, g = rgb[j * 3 + 1] / 255, b = rgb[j * 3 + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 1e-6) {
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h /= 6; if (h < 0) h += 1;
    }
    let s = mx > 0 ? d / mx : 0, v = mx;
    const q = Math.floor(v / dq) * dq + dq / 2;                 /* weiche Stufe */
    v = Math.min(1, Math.max(0, q + (dq / 2) * Math.tanh(P.phiQ * (v - q) / (dq / 2))));
    v = v * 0.95 + 0.05;
    s = Math.min(1, s * P.sat);
    const k = Math.floor(h * 6), f = h * 6 - k, a1 = v * (1 - s), a2 = v * (1 - f * s), a3 = v * (1 - (1 - f) * s);
    [r, g, b] = [[v, a3, a1], [a2, v, a1], [a1, v, a3], [a1, a2, v], [a3, a1, v], [v, a1, a2]][((k % 6) + 6) % 6];
    let e = ink2[j];
    if (sticker && p[i + 3] > 128) {            /* Außenkontur um Sticker */
      const x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && p[((yy * W + xx) * 4) + 3] < 128) { e = 1; break; }
      }
    }
    const t = e * 0.9;
    p[i] = r * 255 * (1 - t) + INK[0] * t;
    p[i + 1] = g * 255 * (1 - t) + INK[1] * t;
    p[i + 2] = b * 255 * (1 - t) + INK[2] * t;
  }
}

/* ------------------------------- Editor --------------------------------- */
let photoRaf = 0;
function photoUpdate(full) {
  if (!PHOTO.img) return;
  cancelAnimationFrame(photoRaf);
  photoRaf = requestAnimationFrame(() => {
    const url = photoCompose(full);
    if (PHOTO.onChange) PHOTO.onChange(url, !!full);
  });
}
function photoEditorHTML(hasPhoto) {
  return `<div class="ph-edit">
    <div class="ph-btns">
      <button class="btn tiny" id="phCam">📸 Selfie aufnehmen</button>
      <button class="btn tiny ghost" id="phFile">🖼️ Bild wählen</button>
    </div>
    ${PHOTO.img ? `
      <div class="ph-styles">${PHOTO_STYLES.map(([k, l]) =>
        `<button data-phstyle="${k}" class="${PHOTO.style === k ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="ph-zoom"><span>Zoom</span><input type="range" id="phZoom" min="1" max="3" step="0.02" value="${PHOTO.zoom}"></label>
      <div class="ph-hint">Zum Ausrichten das Bild im Kreis verschieben.</div>` : hasPhoto ? `
      <div class="ph-hint">Dein Porträt ist gespeichert. Für ein neues einfach nochmal ein Foto machen.</div>` : ""}
    <div class="ph-note">Memoji oder Bitmoji? Einfach als Bild in deinen Fotos sichern und über „Bild wählen“ nehmen –
      oder ein kopiertes Bild hier einfügen. Das Foto bleibt auf deinem Gerät, gespeichert wird nur das Porträt.</div>
  </div>`;
}
/* stage: das runde Vorschau-Element, in dem man das Bild verschiebt */
function bindPhotoEditor(stage, onChange, rerender) {
  PHOTO.onChange = onChange;
  const cam = $("#phCam"), file = $("#phFile");
  if (cam) cam.onclick = () => photoPick(true);
  if (file) file.onclick = () => photoPick(false);
  $$("[data-phstyle]").forEach(b => b.onclick = () => { PHOTO.style = b.dataset.phstyle; photoUpdate(true); rerender && rerender(); });
  const z = $("#phZoom");
  if (z) {
    z.oninput = () => { PHOTO.zoom = +z.value; photoUpdate(false); };
    z.onchange = () => photoUpdate(true);
  }
  if (stage && PHOTO.img) {
    stage.classList.add("ph-drag");
    let drag = null;
    stage.onpointerdown = e => {
      drag = { x: e.clientX, y: e.clientY, ox: PHOTO.ox, oy: PHOTO.oy, k: PHOTO_PX / stage.getBoundingClientRect().width };
      stage.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    stage.onpointermove = e => {
      if (!drag) return;
      PHOTO.ox = drag.ox + (e.clientX - drag.x) * drag.k;
      PHOTO.oy = drag.oy + (e.clientY - drag.y) * drag.k;
      photoUpdate(false);
    };
    stage.onpointerup = stage.onpointercancel = () => { if (drag) { drag = null; photoUpdate(true); } };
  }
}
/* Kopiertes Bild einfügen (z. B. einen Memoji-Sticker) */
document.addEventListener("paste", e => {
  if (!PHOTO.onChange || !$(".ph-edit")) return;
  const items = (e.clipboardData && e.clipboardData.items) || [];
  for (const it of items) {
    if (it.type && it.type.startsWith("image/")) {
      const f = it.getAsFile();
      if (f) { e.preventDefault(); photoLoad(f); return; }
    }
  }
});
function photoForget() { PHOTO.img = null; PHOTO.onChange = null; PHOTO.zoom = 1; PHOTO.ox = 0; PHOTO.oy = 0; }

/* ---------------------- Figur im laufenden Spiel ändern ------------------
   Tipp aufs eigene Porträt oben links. */
function openFigure() {
  if (!S.player) return;
  photoForget();
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderFigure();
}
function renderFigure() {
  const a = S.player.avatar;
  $("#modalBody").innerHTML = `
    <div class="mhead">
      <div><div class="mtitle">🧑 Deine Figur</div>
      <div class="msub">${esc(S.player.name)} · ${esc(S.player.company)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button>
    </div>
    <div class="av-stage"><div class="frame" id="figFrame">${portraitHTML(a, 170, { uid: "fig", bgColor: COMPANY_COLORS[S.player.color] + "33" })}</div></div>
    ${photoEditorHTML(!!a.photo)}
    <div class="mbtns">
      ${a.photo ? `<button class="btn ghost" id="figDrawn">Gezeichnete Figur</button>` : ""}
      <button class="btn" id="figDone">Fertig</button>
    </div>`;
  const close = () => { photoForget(); closeModal(); hudAvatarKey = ""; renderHud(); save(); };
  $("#mClose").onclick = close;
  $("#figDone").onclick = close;
  const drawn = $("#figDrawn");
  if (drawn) drawn.onclick = () => { delete a.photo; photoForget(); hudAvatarKey = ""; renderHud(); save(); renderFigure(); };
  bindPhotoEditor($("#figFrame"), (url, full) => {
    a.photo = url;
    const img = $("#figFrame img.pt-photo");
    if (full && (!img || !$("#modalBody .ph-styles"))) renderFigure();
    else if (img) img.src = url;
    else $("#figFrame").innerHTML = portraitHTML(a, 170, { uid: "fig" });
    if (full) { hudAvatarKey = ""; renderHud(); save(); }
  }, renderFigure);
}
