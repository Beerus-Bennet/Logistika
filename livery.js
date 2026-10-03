/* =========================================================================
   LOGISTIKA – Firmen-Lackierung und Logo
   Eigene Farben, Muster und ein Logo (Symbol oder Monogramm) gestalten,
   live an einem Transporter sehen und die Flotte umlackieren lassen.
   Lackierte Fahrzeuge fahren in Firmenfarben über die Karte und bringen
   durch den Wiedererkennungswert 2 % mehr Erlös. Neue Fahrzeuge kommen auf
   Wunsch gleich in Firmenfarben vom Händler.
   ========================================================================= */
"use strict";

const LIV_COLORS = ["#2f6fed", "#1b4fc4", "#19b8c9", "#20a97a", "#17805c", "#9bd13a", "#f2c200", "#f2a33c", "#ff6a2b",
  "#e2465f", "#a3213b", "#7c5cff", "#d14fb0", "#ffffff", "#c9ced6", "#6b7480", "#2a2f38", "#0d1b2a"];
const LIV_PATTERNS = [["uni", "Uni"], ["streifen", "Rallyestreifen"], ["zwei", "Zweifarbig"], ["schraeg", "Diagonal"],
  ["welle", "Welle"], ["karo", "Zielflagge"], ["flammen", "Flammen"]];
const LOGO_SHAPES = [["kreis", "Kreis"], ["schild", "Schild"], ["raute", "Raute"], ["sechs", "Sechseck"], ["banner", "Banner"]];
const LOGO_SYMS = ["⚡", "🦅", "🐺", "🦊", "🐻", "🦁", "🐝", "🚀", "🌍", "⭐", "🔥", "💎", "🧭", "⚓", "🪶", "🌊", "🏔️", "🍀"];

if (typeof LEDGER_KIND === "object" && !LEDGER_KIND.paint) LEDGER_KIND.paint = { icon: "🎨", name: "Lackierung" };

function initials(name) {
  const w = String(name || "").replace(/[^A-Za-zÄÖÜäöü\s&-]/g, " ").split(/[\s&-]+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "LG").slice(0, 2)).toUpperCase();
}
function livery() {
  if (!S.livery) {
    const c = S.player ? COMPANY_COLORS[S.player.color] : "#2f6fed";
    S.livery = { c1: c, c2: "#ffffff", pat: "streifen", ver: 0, auto: true,
      logo: { shape: "kreis", mode: "txt", sym: "⚡", txt: initials(S.player && S.player.company), bg: c, fg: "#ffffff" } };
  }
  return S.livery;
}
const liveryOn = () => !!(S.livery && S.livery.ver > 0);
const painted = f => liveryOn() && f.liv === S.livery.ver;
const paintable = t => !t.special;
function paintCost(t) { return Math.round(clamp(t.price * 0.03, 60, 60000)); }

/* ------------------------------- Zeichnen ------------------------------ */
function logoSVG(L, size, uid) {
  const s = size || 64, id = "lg" + (uid || "");
  const sh = {
    kreis: `<circle cx="50" cy="50" r="44"/>`,
    schild: `<path d="M50 6 L90 18 Q90 64 50 94 Q10 64 10 18 Z"/>`,
    raute: `<path d="M50 4 L96 50 L50 96 L4 50 Z"/>`,
    sechs: `<path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"/>`,
    banner: `<rect x="4" y="22" width="92" height="56" rx="14"/>`
  }[L.shape] || `<circle cx="50" cy="50" r="44"/>`;
  const txt = String(L.txt || "").slice(0, 3);
  const inner = L.mode === "sym"
    ? `<text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-size="${L.shape === "banner" ? 40 : 46}">${L.sym}</text>`
    : `<text x="50" y="${L.shape === "schild" ? 56 : 54}" text-anchor="middle" dominant-baseline="middle" font-family="Bangers, 'Baloo 2', sans-serif"
        font-size="${txt.length > 2 ? 34 : 44}" letter-spacing="1.5" fill="${L.fg}" stroke="#0d1b2a" stroke-width="2.4" paint-order="stroke">${esc(txt)}</text>`;
  return `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="${L.bg}" stroke="#0d1b2a" stroke-width="5" stroke-linejoin="round">${sh}</g>
    <g fill="none" stroke="${L.fg}" stroke-width="2.2" opacity=".55" transform="translate(50 50) scale(.82) translate(-50 -50)">${sh}</g>
    ${inner}</svg>`;
}
function patternSVG(pat, c2, id) {
  switch (pat) {
    case "streifen": return `<rect x="0" y="74" width="340" height="12" fill="${c2}"/><rect x="0" y="90" width="340" height="5" fill="${c2}"/>`;
    case "zwei": return `<rect x="0" y="96" width="340" height="60" fill="${c2}"/>`;
    case "schraeg": return `<path d="M150 0 L240 0 L150 160 L60 160 Z" fill="${c2}"/>`;
    case "welle": return `<path d="M0 100 Q45 78 90 100 T180 100 T270 100 T360 100 L360 160 L0 160 Z" fill="${c2}"/>`;
    case "karo": {
      let r = "";
      for (let x = 0; x < 340; x += 10) for (let y = 0; y < 2; y++) if ((x / 10 + y) % 2 === 0) r += `<rect x="${x}" y="${78 + y * 10}" width="10" height="10" fill="${c2}"/>`;
      return r;
    }
    case "flammen": return `<path d="M310 112 C270 112 250 92 215 98 C235 86 240 70 214 74 C232 62 226 48 198 58 C214 40 196 34 176 52
        C186 30 160 28 150 54 C140 40 118 48 126 66 C104 60 96 82 116 92 C80 96 74 120 60 132 L310 132 Z" fill="${c2}" opacity=".95"/>`;
  }
  return "";
}
/* Transporter von der Seite – Karosserie, Muster, Logo, Firmenname */
function vanSVG(Lv, w, uid) {
  const id = "van" + (uid || "x");
  const name = S.player ? S.player.company : "LOGISTIKA";
  const body = "M14 132 L14 46 Q14 30 30 30 L218 30 Q232 30 240 40 L272 78 L312 88 Q326 92 326 108 L326 132 Z";
  return `<svg class="van" viewBox="0 0 340 170" width="${w || 320}" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>
    <ellipse cx="170" cy="152" rx="160" ry="8" fill="rgba(0,0,0,.18)"/>
    <path d="${body}" fill="${Lv.c1}"/>
    <g clip-path="url(#${id})">${patternSVG(Lv.pat, Lv.c2, id)}</g>
    <path d="M226 44 L262 84 L226 84 Z" fill="#bfe2f5" stroke="#0d1b2a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M226 44 L232 44 L262 80" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
    <path d="${body}" fill="none" stroke="#0d1b2a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M216 34 L216 130" stroke="#0d1b2a" stroke-width="2.5" opacity=".55"/>
    <rect x="300" y="96" width="18" height="8" rx="3" fill="#ffe27a" stroke="#0d1b2a" stroke-width="2"/>
    <g transform="translate(34 40)">${logoSVG(Lv.logo, 62, id + "l").replace('class="logo"', 'class="logo" x="0" y="0"')}</g>
    ${nameLines(name).map((ln, i, a) => `<text x="104" y="${a.length > 1 ? 60 + i * 26 : 72}" font-family="Bangers, 'Baloo 2', sans-serif" font-size="${nameSize(a)}" letter-spacing="1.2"
      fill="${Lv.c2.toLowerCase() === Lv.c1.toLowerCase() ? "#ffffff" : Lv.c2}" stroke="#0d1b2a" stroke-width="3" paint-order="stroke">${esc(ln)}</text>`).join("")}
    ${[78, 270].map(x => `<circle cx="${x}" cy="134" r="20" fill="#1b2330" stroke="#0d1b2a" stroke-width="4"/><circle cx="${x}" cy="134" r="8" fill="#c9d1da"/>`).join("")}
  </svg>`;
}

/* Firmenname auf der Seitenwand: bei Bedarf zweizeilig, Größe passend */
function nameLines(name) {
  const n = String(name || "").trim().slice(0, 28);
  if (n.length <= 11 || !n.includes(" ")) return [n];
  let best = [n], bd = Infinity;
  const w = n.split(" ");
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(" "), b = w.slice(i).join(" "), d = Math.max(a.length, b.length);
    if (d < bd) { bd = d; best = [a, b]; }
  }
  return best;
}
function nameSize(lines) { const m = Math.max(...lines.map(l => l.length)); return Math.round(clamp(106 / (m * 0.6), 12, 25)); }

/* -------------------------------- Editor ------------------------------- */
let livDraft = null;
function openLivery() {
  livWheel = null;
  livDraft = JSON.parse(JSON.stringify(livery()));
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderLivery();
}
function closeLivery() { livDraft = null; closeModal(); }
/* ------------------------------ Farbwahl ---------------------------------
   Acht schnelle Vorgaben plus Farbrad: Farbton rundherum, Sättigung nach
   außen, Helligkeit per Regler – jede beliebige Farbe.                   */
const LIV_QUICK = ["#2f6fed", "#20a97a", "#f2c200", "#ff6a2b", "#e2465f", "#7c5cff", "#ffffff", "#0d1b2a"];
let livWheel = null;                               /* welches Farbfeld gerade das Rad offen hat */
function hexToHsv(hex) {
  const h = String(hex || "#000").replace("#", ""), n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16) || 0;
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hu = 0;
  if (d > 1e-6) { if (mx === r) hu = ((g - b) / d) % 6; else if (mx === g) hu = (b - r) / d + 2; else hu = (r - g) / d + 4; hu *= 60; if (hu < 0) hu += 360; }
  return { h: hu, s: mx ? d / mx : 0, v: mx };
}
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
const hsvToHex = (h, s, v) => "#" + hsvToRgb(h, s, v).map(x => x.toString(16).padStart(2, "0")).join("");
function sw(attr, cur) {
  cur = String(cur || "").toLowerCase();
  const custom = !LIV_QUICK.includes(cur), open = livWheel === attr;
  const hsv = hexToHsv(cur);
  return `<div class="liv-sw">${LIV_QUICK.map(c => `<button data-${attr}="${c}" class="${c === cur ? "on" : ""}" style="--c:${c}" aria-label="${c}"></button>`).join("")}
      <button class="liv-wheel${custom ? " on" : ""}${open ? " open" : ""}" data-wheel="${attr}" style="--c:${cur}" aria-label="Eigene Farbe wählen" title="Eigene Farbe"><i></i></button></div>
    ${open ? `<div class="liv-pick" data-pick="${attr}">
      <div class="lp-wheel"><canvas width="360" height="360"></canvas><span class="lp-dot"></span></div>
      <div class="lp-side">
        <div class="lp-prev" style="background:${cur}"></div>
        <b class="lp-hex">${cur.toUpperCase()}</b>
        <label class="lp-lab">Helligkeit</label>
        <input class="lp-val" type="range" min="8" max="100" value="${Math.round(hsv.v * 100)}" aria-label="Helligkeit">
        <button class="btn tiny" data-wheeldone="1">Fertig</button>
      </div>
    </div>` : ""}`;
}
/* Rad zeichnen und bedienen; set(hex) schreibt die Farbe in den Entwurf */
function bindWheel(box, cur, set, onLive) {
  const cv = box.querySelector("canvas"), dot = box.querySelector(".lp-dot"), val = box.querySelector(".lp-val");
  const prev = box.querySelector(".lp-prev"), hexEl = box.querySelector(".lp-hex");
  const st = hexToHsv(cur);
  const draw = () => {
    const c = cv.getContext("2d"), W = cv.width, R = W / 2 - 2, id = c.createImageData(W, W), p = id.data;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const dx = x - W / 2, dy = y - W / 2, r = Math.hypot(dx, dy) / R;
      const i = (y * W + x) * 4;
      if (r > 1) { p[i + 3] = 0; continue; }
      const h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      const [rr, gg, bb] = hsvToRgb(h, r, st.v);
      p[i] = rr; p[i + 1] = gg; p[i + 2] = bb; p[i + 3] = r > 0.985 ? Math.round((1 - r) / 0.015 * 255) : 255;
    }
    c.putImageData(id, 0, 0);
    val.style.setProperty("--top", hsvToHex(st.h, st.s, 1));
  };
  const place = () => {
    const a = st.h * Math.PI / 180, r = st.s * 50;
    dot.style.left = (50 + Math.sin(a) * r) + "%"; dot.style.top = (50 - Math.cos(a) * r) + "%";
    const hex = hsvToHex(st.h, st.s, st.v);
    dot.style.background = hex; prev.style.background = hex; hexEl.textContent = hex.toUpperCase();
    return hex;
  };
  let raf = 0;
  const apply = () => { const hex = place(); set(hex); if (!raf) raf = requestAnimationFrame(() => { raf = 0; onLive(hex); }); };
  const pickAt = e => {
    const b = cv.getBoundingClientRect(), dx = e.clientX - b.left - b.width / 2, dy = e.clientY - b.top - b.height / 2;
    st.h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    st.s = Math.min(1, Math.hypot(dx, dy) / (b.width / 2));
    if (st.v < 0.15) { st.v = 0.85; val.value = 85; draw(); }   /* aus Schwarz heraus: erst mal hell */
    apply();
  };
  cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); pickAt(e); };
  cv.onpointermove = e => { if (cv.hasPointerCapture(e.pointerId)) pickAt(e); };
  val.oninput = () => { st.v = +val.value / 100; draw(); apply(); };
  draw(); place();
}
function fleetPaintInfo() {
  const todo = S.fleet.filter(f => paintable(vType(f.type)) && f.liv !== (livery().ver || 1) && (f.phase === "idle"));
  return { todo, cost: todo.reduce((a, f) => a + paintCost(vType(f.type)), 0) };
}
function renderLivery() {
  const d = livDraft, L = d.logo, changed = JSON.stringify(Object.assign({}, d, { ver: 0, auto: 0 })) !== JSON.stringify(Object.assign({}, livery(), { ver: 0, auto: 0 }));
  const all = S.fleet.filter(f => paintable(vType(f.type)));
  const done = all.filter(f => f.liv === livery().ver && livery().ver > 0).length;
  const fp = fleetPaintInfo();
  $("#modalBody").innerHTML = `<div class="livm">
    <div class="mhead"><div><div class="mtitle">🎨 Lackierung &amp; Logo</div><div class="msub">${esc(S.player ? S.player.company : "")} · ${done} von ${all.length} Fahrzeugen in Firmenfarben</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <div class="liv-prev">${vanSVG(d, 340, "ed")}</div>
    <div class="liv-sec">Grundfarbe</div>${sw("c1", d.c1)}
    <div class="liv-sec">Zweitfarbe</div>${sw("c2", d.c2)}
    <div class="liv-sec">Muster</div>
    <div class="liv-chips">${LIV_PATTERNS.map(([k, n]) => `<button class="fchip${d.pat === k ? " on" : ""}" data-pat="${k}">${n}</button>`).join("")}</div>
    <div class="liv-logo">
      <div class="liv-lprev">${logoSVG(L, 96, "big")}</div>
      <div class="liv-lctl">
        <div class="liv-chips">${LOGO_SHAPES.map(([k, n]) => `<button class="fchip${L.shape === k ? " on" : ""}" data-shape="${k}">${n}</button>`).join("")}</div>
        <div class="liv-chips">
          <button class="fchip${L.mode === "txt" ? " on" : ""}" data-lmode="txt">Monogramm</button>
          <button class="fchip${L.mode === "sym" ? " on" : ""}" data-lmode="sym">Symbol</button>
          ${L.mode === "txt" ? `<input id="livTxt" maxlength="3" value="${esc(L.txt)}" aria-label="Monogramm">` : ""}
        </div>
      </div>
    </div>
    ${L.mode === "sym" ? `<div class="liv-syms">${LOGO_SYMS.map(s => `<button data-sym="${s}" class="${L.sym === s ? "on" : ""}">${s}</button>`).join("")}</div>` : ""}
    <div class="liv-sec">Logo-Hintergrund</div>${sw("lbg", L.bg)}
    <div class="liv-sec">Logo-Schrift</div>${sw("lfg", L.fg)}
    <label class="liv-auto"><input type="checkbox" id="livAuto" ${d.auto ? "checked" : ""}> Neue Fahrzeuge gleich in Firmenfarben kaufen (kostet die Lackierung extra)</label>
    <div class="lim">Lackierte Fahrzeuge bringen <b>+2 % Erlös</b> – man kennt deine Farben. Sammlerautos und Sondereditionen bleiben im Original.</div>
    <div class="mbtns">
      <button class="btn ghost" id="livSave">${changed || !livery().ver ? "Design speichern" : "Gespeichert ✓"}</button>
      <button class="btn${fp.todo.length || changed ? "" : " disabled"}" id="livAll">🎨 Flotte lackieren${(() => {
        const n = changed ? all.filter(f => S.fleet.includes(f) && f.phase === "idle").length : fp.todo.length;
        const c = changed ? all.filter(f => f.phase === "idle").reduce((a, f) => a + paintCost(vType(f.type)), 0) : fp.cost;
        return n ? " · " + n + " für " + money(c) : "";
      })()}</button>
    </div>
  </div>`;
  const re = () => renderLivery();
  $("#mClose").onclick = closeLivery;
  $$("#modalBody [data-c1]").forEach(b => b.onclick = () => { d.c1 = b.dataset.c1; livWheel = null; re(); });
  $$("#modalBody [data-c2]").forEach(b => b.onclick = () => { d.c2 = b.dataset.c2; livWheel = null; re(); });
  $$("#modalBody [data-lbg]").forEach(b => b.onclick = () => { L.bg = b.dataset.lbg; livWheel = null; re(); });
  $$("#modalBody [data-lfg]").forEach(b => b.onclick = () => { L.fg = b.dataset.lfg; livWheel = null; re(); });
  /* Farbrad: auf, zu, und beim Ziehen nur die Vorschauen neu zeichnen */
  const setters = { c1: v => { d.c1 = v; }, c2: v => { d.c2 = v; }, lbg: v => { L.bg = v; }, lfg: v => { L.fg = v; } };
  const getters = { c1: () => d.c1, c2: () => d.c2, lbg: () => L.bg, lfg: () => L.fg };
  $$("#modalBody [data-wheel]").forEach(b => b.onclick = () => { livWheel = livWheel === b.dataset.wheel ? null : b.dataset.wheel; re(); });
  $$("#modalBody [data-wheeldone]").forEach(b => b.onclick = () => { livWheel = null; re(); });
  const pk = $("#modalBody [data-pick]");
  if (pk) {
    const k = pk.dataset.pick;
    bindWheel(pk, getters[k](), setters[k], hex => {
      const v = $("#modalBody .liv-prev"); if (v) v.innerHTML = vanSVG(d, 340, "ed");
      const p = $("#modalBody .liv-lprev"); if (p) p.innerHTML = logoSVG(L, 96, "big");
      const w = $(`#modalBody [data-wheel="${k}"]`); if (w) { w.style.setProperty("--c", hex); w.classList.add("on"); }
      $$(`#modalBody [data-${k}]`).forEach(x => x.classList.remove("on"));
    });
  }
  $$("#modalBody [data-pat]").forEach(b => b.onclick = () => { d.pat = b.dataset.pat; re(); });
  $$("#modalBody [data-shape]").forEach(b => b.onclick = () => { L.shape = b.dataset.shape; re(); });
  $$("#modalBody [data-lmode]").forEach(b => b.onclick = () => { L.mode = b.dataset.lmode; re(); });
  $$("#modalBody [data-sym]").forEach(b => b.onclick = () => { L.sym = b.dataset.sym; re(); });
  const tx = $("#livTxt");
  if (tx) tx.oninput = () => {
    L.txt = tx.value.toUpperCase().replace(/[^A-Z0-9ÄÖÜ&]/g, "").slice(0, 3);
    const p = $("#modalBody .liv-lprev"); if (p) p.innerHTML = logoSVG(L, 96, "big");
    const v = $("#modalBody .liv-prev"); if (v) v.innerHTML = vanSVG(d, 340, "ed");
  };
  $("#livAuto").onchange = e => { d.auto = e.target.checked; };
  $("#livSave").onclick = () => { saveLivery(); renderLivery(); };
  $("#livAll").onclick = () => { saveLivery(); paintFleet(); renderLivery(); };
}
function saveLivery() {
  const cur = livery(), d = livDraft;
  const same = JSON.stringify(Object.assign({}, d, { ver: 0, auto: 0 })) === JSON.stringify(Object.assign({}, cur, { ver: 0, auto: 0 }));
  const ver = same && cur.ver ? cur.ver : (cur.ver || 0) + 1;
  S.livery = Object.assign(JSON.parse(JSON.stringify(d)), { ver });
  livDraft = JSON.parse(JSON.stringify(S.livery));
  if (ver !== cur.ver) toast("🎨 Neues Design gespeichert" + (ver > 1 ? " – bisher lackierte Fahrzeuge tragen noch das alte." : "."), "ok", true);
  logoHudKey = "";
  save(); render();
}
function paintVeh(f, quiet) {
  const t = vType(f.type);
  if (!paintable(t) || !liveryOn() || f.liv === S.livery.ver) return 0;
  if (f.phase !== "idle") { if (!quiet) toast("Nur freie Fahrzeuge können in die Lackiererei.", "warn"); return 0; }
  const c = paintCost(t);
  if (c > S.money) { if (!quiet) toast("Für die Lackierung fehlen " + money(c - S.money) + ".", "warn"); return -1; }
  S.money -= c; S.expense += c;
  logMoney("paint", "Lackierung · " + t.name, -c);
  f.liv = S.livery.ver; delete f.foreign;
  return c;
}
function paintFleet() {
  let n = 0, sum = 0, broke = false, busy = 0;
  S.fleet.forEach(f => {
    if (!paintable(vType(f.type)) || f.liv === S.livery.ver) return;
    if (f.phase !== "idle") { busy++; return; }
    if (broke) return;
    const c = paintVeh(f, true);
    if (c > 0) { n++; sum += c; } else if (c < 0) broke = true;
  });
  toast(n ? "🎨 " + n + " Fahrzeug" + (n === 1 ? "" : "e") + " in Firmenfarben lackiert (" + money(sum) + ")." + (busy ? " " + busy + " unterwegs – die kommen danach dran." : "")
    : broke ? "Für die Lackierung fehlt das Kapital." : busy ? "Alle übrigen Fahrzeuge sind gerade unterwegs." : "Die Flotte trägt schon deine Farben.", n ? "ok" : "warn");
  save(); render();
}
/* Neu gekaufte Fahrzeuge (game.js acquire) */
function onAcquire(v) {
  if (!liveryOn() || !S.livery.auto) return;
  const t = vType(v.type);
  if (!paintable(t)) return;
  const c = paintCost(t);
  if (c > S.money) return;
  S.money -= c; S.expense += c;
  logMoney("paint", "Lackierung ab Werk · " + t.name, -c);
  v.liv = S.livery.ver;
}
/* Erlös: +2 % wenn alle Fahrzeuge der Fahrt in Firmenfarben fahren */
function liveryBoost(job) {
  if (!liveryOn()) return 1;
  const vs = job.legs.map(l => S.fleet.find(f => f.uid === l.veh)).filter(Boolean);
  return vs.length && vs.every(f => painted(f)) ? 1.02 : 1;
}
/* Kartenfarbe eines Fahrzeugs (aufgehellt, damit das Symbol lesbar bleibt) */
function tint(hex, k) {
  const h = String(hex).replace("#", ""), n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, m = v => Math.round(v * k + 255 * (1 - k));
  return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
}
function vehLiveryCol(f) {
  if (painted(f)) return S.livery.c1;
  if (f.foreign) return f.foreign.col;
  return null;
}

/* ------------------------------ Anzeigen ------------------------------- */
function liveryVehHTML(v) {
  const t = vType(v.type);
  if (!paintable(t)) return "";
  if (painted(v)) return `<span class="livtag"><i style="--c:${S.livery.c1};--c2:${S.livery.c2}"></i>Firmenfarben</span>`;
  const r = v.foreign && typeof rivalById === "function" ? rivalById(v.foreign.id) : null;
  if (!liveryOn()) return r ? `<span class="livtag old"><i style="--c:${r.col};--c2:#fff"></i>noch in ${esc(r.name)}-Farben</span>` : "";
  return `<button class="btn tiny ghost" data-paint="${v.uid}">🎨 lackieren · ${money(paintCost(t))}</button>`
    + (r ? `<span class="livtag old"><i style="--c:${r.col};--c2:#fff"></i>${esc(r.name)}</span>` : "");
}
function bindLiveryFleet() {
  $$("#tab-fleet [data-paint]").forEach(b => b.onclick = () => {
    const f = S.fleet.find(x => x.uid === b.dataset.paint); if (!f) return;
    const c = paintVeh(f);
    if (c > 0) toast("🎨 " + vType(f.type).name + " lackiert (" + money(c) + ").", "ok", true);
    save(); render();
  });
  const lb = $("#livBtn"); if (lb) lb.onclick = openLivery;
}
function liveryWorldHTML() {
  const L = livery();
  return `<div class="card livcard">
    <div class="card-top"><span class="livcard-logo">${logoSVG(L.logo, 46, "w")}</span>
      <div class="vname">Firmenauftritt<small>${liveryOn() ? "Deine Farben und dein Logo – auf Flotte, Karte und Büros." : "Noch kein eigenes Design. Gestalte Lackierung und Logo."}</small></div>
      <button class="btn tiny" id="livWorld">🎨 gestalten</button></div>
    ${liveryOn() ? `<div class="liv-mini">${vanSVG(L, 220, "w")}</div>` : ""}
  </div>`;
}
function bindLiveryWorld() { const b = $("#livWorld"); if (b) b.onclick = openLivery; }
/* Logo neben dem Firmennamen oben */
let logoHudKey = "";
function renderLogoHud() {
  const host = document.querySelector("#hud .hud-top"), av = document.getElementById("hudAvatar");
  if (!host || !av) return;
  let el = document.getElementById("hudLogo");
  if (!liveryOn()) { if (el) el.remove(); logoHudKey = ""; return; }
  const key = JSON.stringify(S.livery.logo) + S.livery.ver;
  if (el && key === logoHudKey) return;
  if (!el) { el = document.createElement("span"); el.id = "hudLogo"; av.after(el); el.onclick = openLivery; }
  el.innerHTML = logoSVG(S.livery.logo, 22, "hud");
  logoHudKey = key;
}
