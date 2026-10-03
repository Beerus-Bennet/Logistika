/* =========================================================================
   LOGISTIKA – Kartenmodul
   Eigene Slippy-Map-Engine auf <canvas>, ohne externe Bibliothek.
   Kachelquelle: OpenStreetMap (konfigurierbar, siehe TILE_SOURCES).
   ========================================================================= */
"use strict";

/* Kachelquellen. Die Standardkacheln von openstreetmap.org sind für
   kleine Projekte frei nutzbar (Tile Usage Policy beachten). Wer viel
   Traffic erwartet, trägt hier einen eigenen Anbieter mit Schlüssel ein. */
const TILE_SOURCES = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    max: 19,
    attribution: "© OpenStreetMap-Mitwirkende"
  },
  osmde: {
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    max: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }
};

const TILE = 256;                 // Kachelgröße in Pixeln
const WORLD = 256;                // Weltbreite bei Zoom 0 (Projektionseinheit)

/* ----------------------- Web-Mercator-Projektion ------------------------ */
function projX(lon) { return (lon + 180) / 360 * WORLD; }
function projY(lat) {
  const s = Math.sin(Math.max(-85.05, Math.min(85.05, lat)) * Math.PI / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WORLD;
}
function unprojLon(x) { return x / WORLD * 360 - 180; }
function unprojLat(y) {
  const n = Math.PI - 2 * Math.PI * y / WORLD;
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/* Längengrade einer Linie fortlaufend machen (Datumsgrenze) */
function unwrapLons(coords) {
  if (!coords.length) return coords;
  const out = [[coords[0][0], coords[0][1]]];
  for (let i = 1; i < coords.length; i++) {
    let lon = coords[i][1];
    const prev = out[i - 1][1];
    while (lon - prev > 180) lon -= 360;
    while (prev - lon > 180) lon += 360;
    out.push([coords[i][0], lon]);
  }
  return out;
}

/* ============================ Kartenengine ============================== */
function createMap(canvas, opts) {
  opts = opts || {};
  const ctx = canvas.getContext("2d", { alpha: false });
  let source = TILE_SOURCES[opts.source || "osm"];

  const cam = { x: projX(13.405), y: projY(52.52), zoom: 11 };
  let minZoom = 2, maxZoom = 18;
  let W = 0, H = 0, dpr = 1;
  let padBottom = 0, padRight = 0;   // vom Panel verdeckter Bereich
  let anim = null;

  /* ------------------------- Kachelverwaltung ------------------------- */
  const tiles = new Map();        // "z/x/y" -> {img, ok, t}
  let pending = 0;
  const MAX_PARALLEL = 10;
  const queue = [];

  function tileKey(z, x, y) { return z + "/" + x + "/" + y; }

  /* Comic-Look: Kachel einmal beim Laden aufhellen und sättigen.
     Pro Bild zu filtern wäre um Größenordnungen teurer. */
  let canFilter = null;
  function stylize(img) {
    try {
      if (canFilter === null) {
        const t = document.createElement("canvas").getContext("2d");
        canFilter = typeof t.filter === "string";
      }
      if (!canFilter) return img;
      const c = document.createElement("canvas");
      c.width = TILE; c.height = TILE;
      const cc = c.getContext("2d");
      cc.filter = "saturate(1.12) contrast(1.1) brightness(1.06)";
      cc.drawImage(img, 0, 0, TILE, TILE);
      cc.filter = "none";
      cc.fillStyle = "rgba(205,228,250,0.2)";
      cc.fillRect(0, 0, TILE, TILE);
      return c;
    } catch (_) { return img; }
  }

  function requestTile(z, x, y) {
    const key = tileKey(z, x, y);
    if (tiles.has(key)) return tiles.get(key);
    const rec = { img: null, ok: false, t: performance.now() };
    tiles.set(key, rec);
    const job = () => {
      pending++;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => { rec.img = stylize(img); rec.ok = true; pending--; drain(); requestDraw(); };
      img.onerror = () => { rec.ok = false; rec.failed = true; pending--; drain(); };
      img.src = source.url.replace("{z}", z).replace("{x}", x).replace("{y}", y);
    };
    queue.push(job);
    drain();
    return rec;
  }
  function drain() {
    while (pending < MAX_PARALLEL && queue.length) queue.shift()();
    if (tiles.size > 700) {
      const arr = [...tiles.entries()].sort((a, b) => a[1].t - b[1].t);
      for (let i = 0; i < 200; i++) tiles.delete(arr[i][0]);
    }
  }

  /* ---------------------------- Geometrie ----------------------------- */
  function scale() { return Math.pow(2, cam.zoom); }
  /* Mittelpunkt des tatsächlich sichtbaren Kartenausschnitts */
  function midX() { return (W - padRight) / 2; }
  function midY() { return (H - padBottom) / 2; }
  function screenX(wx) { return (wx - cam.x) * scale() + midX(); }
  function screenY(wy) { return (wy - cam.y) * scale() + midY(); }
  function toScreen(lat, lon, off) { return [screenX(projX(lon) + (off || 0)), screenY(projY(lat))]; }
  function fromScreen(px, py) {
    const wx = (px - midX()) / scale() + cam.x;
    const wy = (py - midY()) / scale() + cam.y;
    return [unprojLat(wy), unprojLon(((wx % WORLD) + WORLD) % WORLD)];
  }
  /* Sichtbare Weltkopien (für die Datumsgrenze) */
  function copies() {
    const half = W / scale();
    const from = Math.floor((cam.x - half) / WORLD);
    const to = Math.floor((cam.x + half) / WORLD);
    const out = [];
    for (let k = from; k <= to; k++) out.push(k * WORLD);
    return out.length ? out : [0];
  }

  /* --------------------------- Kachelebene ---------------------------- */
  function drawTiles() {
    const tz = Math.max(0, Math.min(source.max, Math.round(cam.zoom)));
    const n = Math.pow(2, tz);
    const tileWorld = WORLD / n;                 // Breite einer Kachel in Projektionseinheiten
    const px = tileWorld * scale();              // Breite auf dem Bildschirm
    const left = midX() / scale(), right = (W - midX()) / scale();
    const up = midY() / scale(), down = (H - midY()) / scale();
    const x0 = Math.floor((cam.x - left) / tileWorld);
    const x1 = Math.floor((cam.x + right) / tileWorld);
    const y0 = Math.max(0, Math.floor((cam.y - up) / tileWorld));
    const y1 = Math.min(n - 1, Math.floor((cam.y + down) / tileWorld));

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const wrapX = ((tx % n) + n) % n;
        const sx = screenX(tx * tileWorld);
        const sy = screenY(ty * tileWorld);
        const rec = requestTile(tz, wrapX, ty);
        rec.t = performance.now();
        if (rec.ok && rec.img) {
          ctx.drawImage(rec.img, sx, sy, px + 1, px + 1);
        } else if (!drawAncestor(tz, wrapX, ty, sx, sy, px)) {
          ctx.fillStyle = "#dce8f2";
          ctx.fillRect(sx, sy, px + 1, px + 1);
        }
      }
    }
  }
  /* Notbehelf: gröbere, bereits geladene Kachel hochskalieren */
  function drawAncestor(z, x, y, sx, sy, px) {
    for (let up = 1; up <= 5; up++) {
      const pz = z - up;
      if (pz < 0) return false;
      const f = Math.pow(2, up);
      const rec = tiles.get(tileKey(pz, Math.floor(x / f), Math.floor(y / f)));
      if (rec && rec.ok && rec.img) {
        const sub = TILE / f;
        ctx.drawImage(rec.img, (x % f) * sub, (y % f) * sub, sub, sub, sx, sy, px + 1, px + 1);
        return true;
      }
    }
    return false;
  }

  /* ----------------------------- Zeichnen ----------------------------- */
  let drawQueued = false;
  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => { drawQueued = false; draw(); });
  }

  function draw() {
    if (!W || !H) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#b9d9ec";
    ctx.fillRect(0, 0, W, H);
    drawTiles();
    if (opts.onDraw) opts.onDraw(api, ctx);
    drawAttribution();
    ctx.restore();
  }

  function drawAttribution() {
    const txt = source.attribution;
    ctx.font = "10px system-ui, sans-serif";
    const w = ctx.measureText(txt).width + 10;
    const y = H - padBottom - 15;
    ctx.fillStyle = "rgba(234,242,251,0.85)";
    ctx.fillRect(W - padRight - w - 2, y, w, 14);
    ctx.fillStyle = "#2a3b4d";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(txt, W - padRight - w + 3, y + 7);
  }

  /* ------------------------------ Größe ------------------------------- */
  function resize() {
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    requestDraw();
  }

  /* ---------------------------- Interaktion --------------------------- */
  const ptrs = new Map();
  let dragged = false, pinchDist = 0, pinchZoom = 0, downAt = 0;

  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false; downAt = performance.now();
    anim = null;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchZoom = cam.zoom;
    }
  });
  canvas.addEventListener("pointermove", e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (ptrs.size === 1) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        if (!dragged && opts.onUserPan) opts.onUserPan();
        dragged = true;
      }
      cam.x -= dx / scale();
      cam.y -= dy / scale();
      clampCam();
      requestDraw();
    } else if (ptrs.size === 2) {
      dragged = true;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) setZoom(pinchZoom + Math.log2(d / pinchDist));
      return;
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  function endPtr(e) {
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinchDist = 0;
    if (p && !dragged && performance.now() - downAt < 500 && opts.onTap) {
      const r = canvas.getBoundingClientRect();
      opts.onTap(e.clientX - r.left, e.clientY - r.top);
    }
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", e => ptrs.delete(e.pointerId));

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAround(e.clientX - r.left, e.clientY - r.top, -Math.sign(e.deltaY) * 0.45);
  }, { passive: false });

  function zoomAround(px, py, dz) {
    const before = fromScreen(px, py);
    setZoom(cam.zoom + dz, true);
    const wxBefore = projX(before[1]), wyBefore = projY(before[0]);
    // Kamera so verschieben, dass der Punkt unter dem Finger bleibt
    cam.x = wxBefore - (px - midX()) / scale();
    cam.y = wyBefore - (py - midY()) / scale();
    clampCam();
    requestDraw();
  }
  function setZoom(z, silent) {
    cam.zoom = Math.max(minZoom, Math.min(maxZoom, z));
    clampCam();
    if (!silent) requestDraw();
  }
  function clampCam() {
    const up = midY() / scale(), down = (H - midY()) / scale();
    cam.y = Math.max(up, Math.min(WORLD - down, cam.y));
    if (WORLD * scale() < H) cam.y = WORLD / 2;
    cam.x = ((cam.x % WORLD) + WORLD) % WORLD;
  }

  /* ------------------------------ Kamera ------------------------------ */
  function panTo(latlon) {
    anim = null;
    let tx = projX(latlon[1]);
    while (tx - cam.x > WORLD / 2) tx -= WORLD;
    while (cam.x - tx > WORLD / 2) tx += WORLD;
    cam.x = tx; cam.y = projY(latlon[0]);
    clampCam(); requestDraw();
  }
  function setView(latlon, zoom) {
    cam.x = projX(latlon[1]); cam.y = projY(latlon[0]);
    if (zoom != null) cam.zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    clampCam(); requestDraw();
  }
  function flyTo(latlon, zoom, ms) {
    const from = { x: cam.x, y: cam.y, zoom: cam.zoom };
    let tx = projX(latlon[1]);
    while (tx - from.x > WORLD / 2) tx -= WORLD;
    while (from.x - tx > WORLD / 2) tx += WORLD;
    const to = { x: tx, y: projY(latlon[0]), zoom: zoom == null ? cam.zoom : zoom };
    const t0 = performance.now(), dur = ms || 1200;
    anim = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.x = from.x + (to.x - from.x) * e;
      cam.y = from.y + (to.y - from.y) * e;
      cam.zoom = from.zoom + (to.zoom - from.zoom) * e;
      clampCam(); requestDraw();
      if (k < 1 && anim) requestAnimationFrame(anim);
      else anim = null;
    };
    requestAnimationFrame(anim);
  }
  function fitBounds(pts, padPx, maxZ) {
    if (!pts || !pts.length) return;
    const un = unwrapLons(pts);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    un.forEach(p => {
      const x = projX(p[1]), y = projY(p[0]);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    const pad = padPx == null ? 60 : padPx;
    const dx = Math.max(1e-6, maxX - minX), dy = Math.max(1e-6, maxY - minY);
    const availW = W - padRight, availH = H - padBottom;
    const z = Math.min(
      Math.log2(Math.max(50, availW - pad * 2) / dx),
      Math.log2(Math.max(50, availH - pad * 2) / dy)
    );
    flyTo([unprojLat((minY + maxY) / 2), unprojLon(((minX + maxX) / 2 % WORLD + WORLD) % WORLD)],
      Math.max(minZoom, Math.min(maxZ == null ? 12 : maxZ, z)), 900);
  }

  /* --------------------------- Zeichenhilfen -------------------------- */
  /* Strecke auf das sichtbare Rechteck zuschneiden (Liang–Barsky).
     Ohne das zeichnet der Browser beim Hineinzoomen jede Route auf ihrer
     vollen Länge – bei Zoom 15 sind das Hunderttausende Bildpunkte, und
     gestrichelt muss er jedes Stück einzeln ausrechnen. */
  function clipSeg(x1, y1, x2, y2, x0, y0, xm, ym) {
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy], q = [x1 - x0, xm - x1, y1 - y0, ym - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; continue; }
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [t0, t1];
  }
  /* Bildschirmpunkte → sichtbare Teilstücke mit ihrer Startlänge (für die Strichelung) */
  function clipRuns(sp, margin) {
    const m = margin == null ? 40 : margin, x0 = -m, y0 = -m, xm = W + m, ym = H + m;
    const runs = [];
    let cur = null, acc = 0;
    for (let i = 0; i < sp.length - 1; i++) {
      const ax = sp[i][0], ay = sp[i][1], bx = sp[i + 1][0], by = sp[i + 1][1];
      const len = Math.hypot(bx - ax, by - ay);
      const c = len > 0 ? clipSeg(ax, ay, bx, by, x0, y0, xm, ym) : null;
      if (c) {
        const p0 = [ax + (bx - ax) * c[0], ay + (by - ay) * c[0]], p1 = [ax + (bx - ax) * c[1], ay + (by - ay) * c[1]];
        if (cur && c[0] === 0) cur.pts.push(p1);
        else { cur = { start: acc + len * c[0], pts: [p0, p1] }; runs.push(cur); }
        if (c[1] < 1) cur = null;
      } else if (len > 0) cur = null;
      acc += len;
    }
    return runs;
  }
  /* Geokoordinaten → sichtbare Teilstücke in Bildschirmkoordinaten (alle Weltkopien) */
  function screenRuns(coords, margin) {
    const un = unwrapLons(coords);
    const pts = un.map(p => [projX(p[1]), projY(p[0])]);
    const out = [];
    copies().forEach(off => {
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
      const sp = pts.map(p => {
        const sx = screenX(p[0] + off), sy = screenY(p[1]);
        if (sx < minx) minx = sx; if (sx > maxx) maxx = sx; if (sy < miny) miny = sy; if (sy > maxy) maxy = sy;
        return [sx, sy];
      });
      if (maxx < -40 || minx > W + 40 || maxy < -40 || miny > H + 40) return;
      clipRuns(sp, margin).forEach(r => out.push(r));
    });
    return out;
  }
  function tracePath(c, runs) {
    c.beginPath();
    runs.forEach(r => { r.pts.forEach((p, i) => { if (i === 0) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }); });
  }
  function line(coords, style) {
    const runs = screenRuns(coords, style.width + (style.outlineWidth || 0) + 24);
    if (!runs.length) return;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (style.outline) {
      tracePath(ctx, runs);
      ctx.strokeStyle = style.outline;
      ctx.lineWidth = style.width + style.outlineWidth;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
    if (style.dash && style.dash.length) {
      /* jedes Teilstück mit seiner Startlänge – sonst springt das Muster am Bildrand */
      ctx.setLineDash(style.dash);
      runs.forEach(r => { tracePath(ctx, [r]); ctx.lineDashOffset = (style.dashOffset || 0) + r.start; ctx.stroke(); });
    } else {
      ctx.setLineDash([]);
      tracePath(ctx, runs);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = 1;
  }

  /* Vorprojizierte Segmente in einem Zug zeichnen (Infrastrukturnetz).
     arr = Float64Array [wx1,wy1,wx2,wy2, ...] in Projektionseinheiten */
  function segments(arr, style) {
    if (!arr || !arr.length) return;
    const sc = scale(), cx0 = cam.x, cy0 = cam.y, hw = midX(), hh = midY();
    copies().forEach(off => {
      ctx.beginPath();
      let drew = false;
      for (let i = 0; i < arr.length; i += 4) {
        const x1 = (arr[i] + off - cx0) * sc + hw, y1 = (arr[i + 1] - cy0) * sc + hh;
        const x2 = (arr[i + 2] + off - cx0) * sc + hw, y2 = (arr[i + 3] - cy0) * sc + hh;
        if ((x1 < 0 && x2 < 0) || (x1 > W && x2 > W) || (y1 < 0 && y2 < 0) || (y1 > H && y2 > H)) continue;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); drew = true;
      }
      if (!drew) return;
      ctx.lineCap = "round";
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.globalAlpha = style.alpha == null ? 1 : style.alpha;
      ctx.setLineDash(style.dash || []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });
  }

  function pin(lat, lon, draw) {
    const wx = projX(lon), wy = projY(lat);
    copies().forEach(off => {
      const sx = screenX(wx + off), sy = screenY(wy);
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) return;
      draw(ctx, sx, sy);
    });
  }

  function screenPos(lat, lon) {
    const wx = projX(lon), wy = projY(lat);
    let best = null;
    copies().forEach(off => {
      const sx = screenX(wx + off), sy = screenY(wy);
      if (!best || Math.abs(sx - midX()) < Math.abs(best[0] - midX())) best = [sx, sy];
    });
    return best || [screenX(wx), screenY(wy)];
  }

  const api = {
    get zoom() { return cam.zoom; },
    get width() { return W; },
    get dpr() { return dpr; },
    get height() { return H; },
    ctx, line, pin, segments, screenPos, toScreen, fromScreen, screenRuns, clipRuns, tracePath,
    projectPoint: (lat, lon) => [projX(lon), projY(lat)],
    setView, flyTo, panTo, fitBounds, resize, redraw: requestDraw,
    animating: () => !!anim,
    zoomBy: (d) => zoomAround(midX(), midY(), d),
    setPadding: (bottom, right) => { padBottom = bottom || 0; padRight = right || 0; requestDraw(); },
    setSource: (k) => { if (TILE_SOURCES[k]) { source = TILE_SOURCES[k]; tiles.clear(); requestDraw(); } },
    setZoomRange: (a, b) => { minZoom = a; maxZoom = b; }
  };

  window.addEventListener("resize", resize);
  resize();
  return api;
}
