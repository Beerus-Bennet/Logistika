/* =========================================================================
   LOGISTIKA – Nachtwallet
   Bezahlt wird bei Mr. Snus und Don Pablo nicht bar, sondern in Solana (◎).
   Das Firmenkonto wird zum aktuellen Kurs getauscht; der Kurs kommt live aus
   dem Netz (Coinbase, sonst CoinGecko, sonst Binance) und wird alle 15 s
   erneuert, solange die Wallet offen ist. Ohne Netz gilt der letzte bekannte
   Kurs. Bestätigt wird wie ein Anruf: Knopf nach rechts wischen.
   Alles Spielgeld – es wird nichts wirklich überwiesen.
   ========================================================================= */
"use strict";

const SOL_FALLBACK = { eur: 103.35, at: Date.parse("2026-09-24T16:40:00Z"), src: "Stand 24.09.2026" };
const SOL_SOURCES = [
  ["Coinbase", "https://api.coinbase.com/v2/prices/SOL-EUR/spot", j => +j.data.amount],
  ["CoinGecko", "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur", j => +j.solana.eur],
  ["Binance", "https://api.binance.com/api/v3/ticker/price?symbol=SOLEUR", j => +j.price]
];
const SOL_FEE = 0.000005;          /* Grundgebühr einer Solana-Überweisung: 5.000 Lamports */
const SOL_LIVE_MS = 30000;         /* so lange gilt ein abgerufener Kurs als frisch */

let solRate = null;                /* { eur, at, src, live } */
let solBusy = null;

function solKnown() {
  if (solRate) return solRate;
  const s = typeof S !== "undefined" && S && S.sol;
  return Object.assign({}, s && s.eur > 0 ? s : SOL_FALLBACK, { live: false });
}
async function solFetch(force) {
  const cur = solKnown();
  if (!force && cur.live && Date.now() - cur.at < SOL_LIVE_MS) return cur;
  if (solBusy) return solBusy;
  solBusy = (async () => {
    for (const [name, url, get] of SOL_SOURCES) {
      try {
        const ctl = typeof AbortController === "function" ? new AbortController() : null;
        const t = ctl ? setTimeout(() => ctl.abort(), 4000) : 0;
        const r = await fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined });
        clearTimeout(t);
        if (!r.ok) continue;
        const v = get(await r.json());
        if (!(v > 0) || !isFinite(v)) continue;
        solRate = { eur: v, at: Date.now(), src: name, live: true };
        if (typeof S !== "undefined" && S) S.sol = { eur: v, at: solRate.at, src: name };
        return solRate;
      } catch (e) { /* nächste Quelle */ }
    }
    solRate = Object.assign({}, solKnown(), { live: false });
    return solRate;
  })();
  try { return await solBusy; } finally { solBusy = null; }
}
const solAmt = (eur, rate) => eur / (rate || solKnown()).eur;
function solf(x, d) {
  const dd = d != null ? d : x >= 1000 ? 2 : x >= 1 ? 4 : 6;
  return "◎ " + fmt(x, dd);
}
function solAge(r) {
  const s = Math.max(0, Math.round((Date.now() - r.at) / 1000));
  if (r.live) return s < 5 ? "gerade eben" : s < 60 ? "vor " + s + " s" : "vor " + Math.round(s / 60) + " min";
  const d = new Date(r.at);
  const hm = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (Date.now() - r.at < 864e5 ? "von " : "vom " + d.toLocaleDateString("de-DE") + ", ") + hm;
}

/* Adressen im Base58-Stil: fest je Empfänger, damit Mr. Snus immer dieselbe hat */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58(seed, n) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let out = "";
  for (let i = 0; i < n; i++) { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ (i * 374761393); out += B58[(h >>> 0) % 58]; }
  return out;
}
const walletAddr = who => b58("addr:" + who + ":" + ((S && S.player && S.player.company) || ""), 44);
const shortAddr = a => a.slice(0, 4) + "…" + a.slice(-4);

/* Beleg für Kasse und Chat: was in SOL rausging */
function walletQuote(eur, rate) {
  const r = rate || solKnown();
  return { eur, sol: solAmt(eur, r), rate: r.eur, live: !!r.live, src: r.src,
           sig: b58("sig:" + eur + ":" + Date.now() + ":" + Math.random(), 88) };
}
function walletTxBubble(tx) {
  return `<div class="bub out tx"><b>${solf(tx.sol)} SOL gesendet</b>
    <small>≈ ${money(tx.eur)} · 1 SOL = ${fmt(tx.rate, 2)} € · Sig. ${esc(shortAddr(tx.sig))}</small></div>`;
}

/* ------------------------------ Oberfläche ------------------------------ */
let walletState = null;            /* { to, eur, onPaid, timer, stage } */
function walletEl() {
  let el = document.getElementById("wallet");
  if (!el) {
    el = document.createElement("div");
    el.id = "wallet";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Nachtwallet");
    document.body.appendChild(el);
  }
  return el;
}
function walletOpen() { return !!walletState; }

/* opts: { to, icon, eur, memo, onPaid(tx) } */
function walletPay(opts) {
  if (walletState) return;
  if (opts.eur > S.money) return toast("Dafür fehlen " + money(opts.eur - S.money) + ".", "warn");
  walletState = Object.assign({ stage: "confirm", addr: walletAddr(opts.to) }, opts);
  const el = walletEl();
  el.classList.add("on");
  document.body.classList.add("wallet-open");
  renderWallet();
  solFetch().then(() => { if (walletState && walletState.stage === "confirm") renderWallet(); });
  walletState.timer = setInterval(() => {
    if (!walletState || walletState.stage !== "confirm" || walletState.drag) return;
    solFetch(true).then(() => { if (walletState && walletState.stage === "confirm") renderWallet(true); });
  }, 15000);
}
function walletClose() {
  if (!walletState) return;
  clearInterval(walletState.timer);
  walletState = null;
  const el = walletEl();
  el.classList.remove("on");
  el.innerHTML = "";
  document.body.classList.remove("wallet-open");
}

function renderWallet(tick) {
  const w = walletState; if (!w) return;
  const el = walletEl();
  const r = solKnown();
  const sol = solAmt(w.eur, r), bal = solAmt(S.money, r);
  if (w.stage === "confirm") {
    const prev = el.querySelector(".wl-amt b");
    el.innerHTML = `<div class="wl-card">
      <div class="wl-top">
        <div class="wl-brand"><i>◎</i><b>Nachtwallet</b></div>
        <span class="wl-net"><i class="${r.live ? "on" : ""}"></i>Solana</span>
        <button class="wl-x" id="wlClose" aria-label="Abbrechen">✕</button>
      </div>
      <div class="wl-bal"><small>Guthaben · Firmenkonto getauscht</small><b>${solf(bal)} SOL</b><span>≈ ${money(S.money)}</span></div>
      <div class="wl-to">
        <span class="wl-av">${w.icon || "👤"}</span>
        <div><small>An</small><b>${esc(w.to)}</b><code>${esc(shortAddr(w.addr))}</code></div>
      </div>
      <div class="wl-amt${tick && prev && prev.textContent !== solf(sol) ? " tick" : ""}">
        <b>${solf(sol)}</b><span>SOL</span>
        <small>≈ ${money(w.eur)}${w.memo ? " · " + esc(w.memo) : ""}</small>
      </div>
      <div class="wl-rows">
        <div><span>Kurs</span><b>1 SOL = ${fmt(r.eur, 2)} €</b></div>
        <div><span>Quelle</span><b class="${r.live ? "live" : "old"}">${r.live ? "● live · " + esc(r.src) + " · " + solAge(r) : "offline · letzter Kurs " + solAge(r)}</b></div>
        <div><span>Netzwerkgebühr</span><b>${solf(SOL_FEE, 6)} <small>≈ ${fmt(SOL_FEE * r.eur, 4)} €</small></b></div>
      </div>
      <div class="wl-slide" id="wlSlide">
        <div class="wl-fill" id="wlFill"></div>
        <span class="wl-hint">Zum Senden wischen</span>
        <button class="wl-knob" id="wlKnob" aria-label="Zum Senden nach rechts wischen">➜</button>
      </div>
      <button class="wl-cancel" id="wlCancel">Abbrechen</button>
    </div>`;
    $("#wlClose").onclick = walletClose;
    $("#wlCancel").onclick = walletClose;
    bindSlide();
  } else if (w.stage === "send") {
    el.innerHTML = `<div class="wl-card sending">
      <div class="wl-spin"></div>
      <b class="wl-st">Wird bestätigt …</b>
      <small class="wl-sub">${solf(w.tx.sol)} SOL an ${esc(w.to)}</small>
      <div class="wl-conf"><i id="wlConf"></i></div>
      <small class="wl-sub" id="wlConfTx">0 von 32 Bestätigungen</small>
    </div>`;
  } else if (w.stage === "done") {
    el.innerHTML = `<div class="wl-card done">
      <div class="wl-ok">✓</div>
      <b class="wl-st">Gesendet</b>
      <div class="wl-amt"><b>${solf(w.tx.sol)}</b><span>SOL</span><small>≈ ${money(w.eur)} an ${esc(w.to)}</small></div>
      <div class="wl-rows">
        <div><span>Signatur</span><b><code>${esc(shortAddr(w.tx.sig))}</code></b></div>
        <div><span>Kurs</span><b>1 SOL = ${fmt(w.tx.rate, 2)} €</b></div>
      </div>
      <button class="wl-cancel solid" id="wlDone">Fertig</button>
    </div>`;
    $("#wlDone").onclick = walletClose;
  }
}

/* Wischen wie beim Anruf: erst ganz rechts gilt es, sonst schnappt der Knopf zurück */
function bindSlide() {
  const track = $("#wlSlide"), knob = $("#wlKnob"), fill = $("#wlFill");
  if (!track || !knob) return;
  let x0 = 0, x = 0, drag = false;
  const max = () => track.clientWidth - knob.offsetWidth - 8;
  const put = (v, anim) => {
    x = clamp(v, 0, max());
    knob.style.transition = fill.style.transition = anim ? "transform .25s ease, width .25s ease" : "none";
    knob.style.transform = `translateX(${x}px)`;
    fill.style.width = (x + knob.offsetWidth + 4) + "px";
    track.style.setProperty("--p", (x / Math.max(1, max())).toFixed(3));
  };
  knob.addEventListener("pointerdown", e => {
    drag = true; x0 = e.clientX - x;
    if (walletState) walletState.drag = true;
    try { knob.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
    e.preventDefault();
  });
  knob.addEventListener("pointermove", e => { if (drag) put(e.clientX - x0, false); });
  const end = () => {
    if (!drag) return;
    drag = false;
    if (walletState) walletState.drag = false;
    if (x >= max() * 0.9) { put(max(), true); walletConfirm(); }
    else put(0, true);
  };
  knob.addEventListener("pointerup", end);
  knob.addEventListener("pointercancel", end);
  knob.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); put(max(), true); walletConfirm(); } });
  put(0, false);
}

function walletConfirm() {
  const w = walletState;
  if (!w || w.stage !== "confirm") return;
  if (w.eur > S.money) { toast("Dafür fehlen " + money(w.eur - S.money) + ".", "warn"); return walletClose(); }
  w.tx = walletQuote(w.eur);
  w.stage = "send";
  clearInterval(w.timer);
  renderWallet();
  if (navigator.vibrate) { try { navigator.vibrate(18); } catch (_) { /* egal */ } }
  /* Solana ist schnell: gut eine Sekunde bis zur Bestätigung */
  let k = 0;
  const step = setInterval(() => {
    k = Math.min(32, k + 4 + Math.floor(Math.random() * 5));
    const bar = $("#wlConf"), tx = $("#wlConfTx");
    if (bar) bar.style.width = (k / 32 * 100) + "%";
    if (tx) tx.textContent = k + " von 32 Bestätigungen";
    if (k < 32 || !walletState) return;
    clearInterval(step);
    const cb = w.onPaid;
    w.stage = "done";
    renderWallet();
    if (cb) cb(w.tx);
    setTimeout(() => { if (walletState === w) walletClose(); }, 2200);
  }, 170);
}
