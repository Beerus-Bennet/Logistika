/* =========================================================================
   LOGISTIKA – Selbst beladen
   Kleines Packspiel: alle Kisten in den Laderaum, bevor die Zeit abläuft.
   Wer es schafft, bekommt 8 % mehr Erlös (sorgfältig verstaut) und das
   Fahrzeug ist schneller beladen. Keine Strafe, wenn es nicht klappt.
   ========================================================================= */
"use strict";

const PACK_CARGO = new Set(["pak", "express", "pal", "kuehl", "schmuck"]);
const PACK_BONUS = 0.08;
function packable(job) {
  if (!job || job.packed || job.curLeg !== 0 || job.order.snus || job.order.pablo) return false;
  if (!PACK_CARGO.has(job.order.cargo)) return false;
  const leg = job.legs[0], f = S.fleet.find(x => x.uid === leg.veh);
  if (!f || !"br".includes(leg.mode)) return false;
  return f.phase === "reserved" || f.phase === "repo" || f.phase === "load";
}
/* Laderaum in Rechtecke zerlegen – so ist jedes Rätsel lösbar */
function packPieces(W, H) {
  const out = [];
  const split = (x, y, w, h) => {
    const big = w * h > 6 || w > 3 || h > 3;
    if (!big && (w * h <= 2 || Math.random() < 0.45)) { out.push({ w, h }); return; }
    const vert = w > h ? true : w < h ? false : Math.random() < 0.5;
    if (vert && w > 1) { const c = 1 + Math.floor(Math.random() * (w - 1)); split(x, y, c, h); split(x + c, y, w - c, h); }
    else if (h > 1) { const c = 1 + Math.floor(Math.random() * (h - 1)); split(x, y, w, c); split(x, y + c, w, h - c); }
    else out.push({ w, h });
  };
  split(0, 0, W, H);
  return out.sort(() => Math.random() - 0.5).map((p, i) => {
    const rot = p.w !== p.h && Math.random() < 0.5;
    return { id: i, w: rot ? p.h : p.w, h: rot ? p.w : p.h, x: -1, y: -1, col: PACK_COLS[i % PACK_COLS.length] };
  });
}
const PACK_COLS = ["#f3c969", "#e8a15a", "#d9b98c", "#c9d98a", "#9fd3c7", "#f0b3a8", "#c7b8ea", "#b5d5f0"];
let pack = null;
function packEl() {
  let el = document.getElementById("pack");
  if (!el) { el = document.createElement("div"); el.id = "pack"; document.body.appendChild(el); }
  return el;
}
function openPack(jobId) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!packable(job)) return toast("Das Fahrzeug ist schon beladen.", "warn");
  const leg = job.legs[0], t = vType(S.fleet.find(f => f.uid === leg.veh).type);
  const bike = t.mode === "b";
  const W = bike ? 4 : t.cap >= 3000 ? 7 : 6, H = bike ? 3 : 4;
  pack = { job: jobId, W, H, pieces: packPieces(W, H), left: bike ? 40 : 55, sel: null, over: false };
  const el = packEl();
  el.className = "on";
  document.body.classList.add("pack-open");
  job.packed = true;                        /* ein Versuch pro Auftrag */
  renderPack();
  pack.timer = setInterval(() => {
    if (!pack || pack.over) return;
    pack.left--;
    const c = $("#pkClock"); if (c) c.textContent = pack.left + " s";
    if (pack.left <= 0) packEnd(false);
  }, 1000);
}
function packFree(p, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > pack.W || y + h > pack.H) return false;
  return !pack.pieces.some(q => q !== p && q.x >= 0 && x < q.x + q.w && x + w > q.x && y < q.y + q.h && y + h > q.y);
}
function renderPack() {
  if (!pack) return;
  const el = packEl();
  const job = S.jobs.find(j => j.id === pack.job);
  const cell = Math.floor(Math.min(46, (Math.min(window.innerWidth, 440) - 60) / pack.W));
  pack.cell = cell;
  const placed = pack.pieces.filter(p => p.x >= 0);
  const tray = pack.pieces.filter(p => p.x < 0);
  const box = p => `<div class="pk-p${pack.sel === p.id ? " sel" : ""}" data-pk="${p.id}"
      style="width:${p.w * cell - 4}px;height:${p.h * cell - 4}px;--c:${p.col}${p.x >= 0 ? `;left:${p.x * cell + 2}px;top:${p.y * cell + 2}px` : ""}"><i></i></div>`;
  el.innerHTML = `<div class="pk-card">
    <div class="pk-top"><div><b>📦 Selbst beladen</b><small>${esc(job ? job.order.shipper : "")} · alle Kisten in den Laderaum</small></div>
      <span class="pk-clock" id="pkClock">${pack.left} s</span></div>
    <div class="pk-hold" id="pkHold" style="width:${pack.W * cell}px;height:${pack.H * cell}px;--cell:${cell}px">${placed.map(box).join("")}</div>
    <div class="pk-hint">Kiste antippen, dann ins Feld tippen – oder ziehen. ↻ dreht die gewählte Kiste, Antippen im Laderaum legt sie zurück.</div>
    <div class="pk-tray" id="pkTray">${tray.map(box).join("")}</div>
    <div class="pk-btns"><button class="btn tiny ghost" id="pkRot">↻ drehen</button><button class="btn tiny ghost" id="pkQuit">Fahrer lädt selbst</button></div>
  </div>`;
  bindPack();
}
function bindPack() {
  const hold = $("#pkHold");
  $("#pkQuit").onclick = () => packEnd(false, true);
  $("#pkRot").onclick = () => {
    const p = pack.pieces.find(q => q.id === pack.sel); if (!p) return;
    if (p.x >= 0 && !packFree(p, p.x, p.y, p.h, p.w)) return toast("Dafür ist hier kein Platz.", "warn", true);
    [p.w, p.h] = [p.h, p.w]; renderPack();
  };
  hold.onclick = e => {
    if (e.target.closest(".pk-p")) return;
    const p = pack.pieces.find(q => q.id === pack.sel); if (!p) return;
    const r = hold.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / pack.cell), y = Math.floor((e.clientY - r.top) / pack.cell);
    packPlace(p, x, y);
  };
  $$("#pack [data-pk]").forEach(d => {
    const p = pack.pieces.find(q => q.id === +d.dataset.pk);
    let sx = 0, sy = 0, moved = false, ghost = null;
    d.addEventListener("pointerdown", e => {
      sx = e.clientX; sy = e.clientY; moved = false;
      try { d.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
    });
    d.addEventListener("pointermove", e => {
      if (!e.buttons && e.pointerType === "mouse") return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return;
      if (!moved) {
        moved = true; ghost = d.cloneNode(true); ghost.classList.add("ghost");
        ghost.style.left = ghost.style.top = "0"; document.body.appendChild(ghost);
      }
      ghost.style.transform = `translate(${e.clientX - (p.w * pack.cell) / 2}px,${e.clientY - (p.h * pack.cell) / 2}px)`;
    });
    d.addEventListener("pointerup", e => {
      if (ghost) { ghost.remove(); ghost = null; }
      if (!moved) {
        if (p.x >= 0) { p.x = p.y = -1; pack.sel = p.id; } else pack.sel = pack.sel === p.id ? null : p.id;
        return renderPack();
      }
      const r = hold.getBoundingClientRect();
      const x = Math.round((e.clientX - r.left) / pack.cell - p.w / 2), y = Math.round((e.clientY - r.top) / pack.cell - p.h / 2);
      pack.sel = p.id;
      packPlace(p, x, y);
    });
  });
}
function packPlace(p, x, y) {
  if (!packFree(p, x, y, p.w, p.h)) { renderPack(); return toast("Passt da nicht hin.", "warn", true); }
  p.x = x; p.y = y; pack.sel = null;
  if (pack.pieces.every(q => q.x >= 0)) return packEnd(true);
  renderPack();
}
function packEnd(ok, quit) {
  if (!pack || pack.over) return;
  pack.over = true;
  clearInterval(pack.timer);
  const job = S.jobs.find(j => j.id === pack.job);
  if (ok && job) {
    job.order.pay = Math.round(job.order.pay * (1 + PACK_BONUS));
    job.packBonus = true;
    const f = S.fleet.find(x => x.uid === job.legs[0].veh);
    if (f && f.phase === "load") f.timer *= 0.6;
    job.fastLoad = true;
    S.xp += 10;
  }
  const el = packEl();
  el.querySelector(".pk-card").insertAdjacentHTML("beforeend", `<div class="pk-res ${ok ? "ok" : ""}">${ok
    ? `<b>Perfekt verstaut!</b><small>+${Math.round(PACK_BONUS * 100)} % Erlös · schneller beladen</small>`
    : `<b>${quit ? "Der Fahrer übernimmt." : "Zeit um!"}</b><small>Er lädt wie immer – kein Bonus, keine Strafe.</small>`}</div>`);
  setTimeout(closePack, ok ? 1400 : 1100);
  save(); render();
}
function closePack() {
  pack = null;
  const el = document.getElementById("pack"); if (!el) return;
  el.className = ""; el.innerHTML = "";
  document.body.classList.remove("pack-open");
  $$(".pk-p.ghost").forEach(g => g.remove());
}
