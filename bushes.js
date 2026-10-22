/* =========================================================================
   LOGISTIKA – bushes.js   (v87)
   Buschsystem für den Wald der großen Welt: sieben Buscharten, zentrale
   Typtabelle, seedbasierter Generator mit fester 7:1-Regel (Bäume : Büsche),
   zonenbasierte Komposition (Gruppen auf Lichtungen und an Übergängen, wenige
   Einzelbüsche) und Grasbüschel an Birken (v87). Reine Logik – kennt weder Engine noch
   Welt: die Welt reicht Probenahme, Gültigkeitsprüfung und Standortmerkmale
   als Funktionen herein (siehe worldview.js, worldBushes). Dadurch läuft das
   Modul auch in Node (Tests: tests/bushes.test.js).
   Die Geometrien der sieben Typen stehen in woodmodels.js (FWM.bush).
   ========================================================================= */
const BUSH = (() => {
  "use strict";

  /* ---- Verhältnis Bäume : Büsche ---- */
  const TREES_PER_BUSH = 7;
  /* Ziel-Buschzahl aus der tatsächlich platzierten Baumzahl (700 → 100, 140 → 20, 35 → 5) */
  const targetCount = treeCount => Math.max(0, Math.floor((treeCount | 0) / TREES_PER_BUSH));

  /* ---- Typtabelle (zentral, erweiterbar) ----
     weight     Anteil an allen Büschen (Summe 100)
     h / w      Höhen- und Breitenbereich in Welteinheiten (1 Einheit = 1 Kachel, Baum Größe 1 ≈ 2,7 hoch)
     palette    Farben je Modell (Slots siehe FWM.bush)
     prefer     bevorzugte Standorte: Gewicht je Standortmerkmal (0…1, vom Host berechnet):
                edge Waldrand · shade dichter Baumbestand · conifer Nadelbäume in der Nähe · path Wegnähe ·
                clearing Lichtung in der Nähe · rock Felsen in der Nähe · water Bach/See in der Nähe
     gap        Mindestabstand zu anderen Büschen als Anteil der Summe beider Radien (größere Büsche brauchen mehr Platz)
     resource   Kandidat für eine spätere Sammelmechanik (nur Kennzeichnung, keine Spiellogik) */
  const TYPES = [
    { id: "round_shrub", weight: 30, h: [0.45, 0.85], w: [0.60, 1.20], gap: 0.85,
      prefer: { path: 0.35, shade: 0.35, edge: 0.15 },
      palette: { dark: 0x2c6a2e, mid: 0x469035, light: 0x68ae46 } },
    { id: "spreading_shrub", weight: 18, h: [0.30, 0.65], w: [0.90, 1.50], gap: 0.9,
      prefer: { edge: 0.5, rock: 0.35, path: 0.15 },
      palette: { mid: 0x3f7a31, olive: 0x6d8030, dark: 0x1f4423, twig: 0x4d3a2a } },
    { id: "evergreen_shrub", weight: 12, h: [0.50, 0.95], w: [0.45, 0.95], gap: 0.8,
      prefer: { conifer: 0.6, shade: 0.4 },
      palette: { dark: 0x1f4d2e, fir: 0x31683f, light: 0x558a5e, trunk: 0x4a3426 } },
    { id: "fern_shrub", weight: 12, h: [0.25, 0.60], w: [0.55, 1.10], gap: 0.7,
      prefer: { shade: 0.45, water: 0.3, rock: 0.25 },
      palette: { fresh: 0x4f9a35, light: 0x86bb62, dark: 0x2c6a2b } },
    { id: "berry_shrub", weight: 10, h: [0.40, 0.75], w: [0.55, 1.00], gap: 0.85,
      prefer: { clearing: 0.5, edge: 0.3, path: 0.2 },
      resource: true,
      palette: { dark: 0x2f6b30, mid: 0x4b8a38, berry: 0x9b2233, berry2: 0x6d2b26, twig: 0x5a4030 } },
    { id: "young_shrub", weight: 10, h: [0.35, 0.80], w: [0.45, 0.95], gap: 0.75,
      prefer: { clearing: 0.35, edge: 0.35, shade: 0.3 },
      palette: { mid: 0x58a03b, light: 0x88c352, twig: 0x6b5a3a } },
    { id: "seasonal_shrub", weight: 8, h: [0.45, 0.85], w: [0.60, 1.15], gap: 0.85,
      prefer: { path: 0.4, clearing: 0.35, edge: 0.25 },
      palette: { olive: 0x6b7d2e, gold: 0xbfa040, rust: 0x9a5a2c, bronze: 0x8a6a2a } }
  ];
  const BY_ID = {}; TYPES.forEach((t, i) => { t.index = i; BY_ID[t.id] = t; });
  const VARIANTS = 3;                                 /* vorgebaute Formvarianten je Typ (Cluster-Lage und -Größe verschieden) */
  const TINT = [0.92, 1.08];                          /* Helligkeitsfaktor je Instanz (Farbvariante) */

  /* Typ nach Gewicht wählen; r ∈ [0,1) */
  function pickType(r, types) {
    types = types || TYPES;
    let sum = 0; for (const t of types) sum += t.weight;
    let x = r * sum;
    for (const t of types) { x -= t.weight; if (x < 0) return t; }
    return types[types.length - 1];
  }

  /* Einfaches Abstandsgitter (Zellen 2×2) für Bäume, Felsen, Lichtungsmitten und schon gesetzte Büsche.
     Eintrag [x, z, Radius, Gruppe]; Büsche derselben Gruppe dürfen enger stehen (Faktor ks) als verschiedene Gruppen (k). */
  class Spacing {
    constructor(cell) { this.c = cell || 2; this.m = new Map(); this.R = 0; }
    key(i, j) { return i + "," + j; }
    add(x, z, r, gid) {
      const k = this.key(Math.floor(x / this.c), Math.floor(z / this.c));
      let a = this.m.get(k); if (!a) this.m.set(k, a = []);
      a.push([x, z, r, gid == null ? -1 : gid]); if (r > this.R) this.R = r;
    }
    removeGroup(gid) { this.m.forEach((a, k) => { const r = a.filter(o => o[3] !== gid); if (r.length !== a.length) this.m.set(k, r); }); }
    /* frei, wenn zu jedem Eintrag (Radius ro) der Abstand ≥ (r + ro) · k ist; skip = Eintrag an dieser Stelle ignorieren (eigener Stamm) */
    free(x, z, r, k, gid, ks, skip) {
      const reach = Math.ceil((r + this.R) / this.c);
      const ci = Math.floor(x / this.c), cj = Math.floor(z / this.c);
      for (let i = ci - reach; i <= ci + reach; i++) for (let j = cj - reach; j <= cj + reach; j++) {
        const a = this.m.get(this.key(i, j)); if (!a) continue;
        for (const o of a) {
          if (skip && Math.abs(o[0] - skip[0]) < 1e-6 && Math.abs(o[1] - skip[1]) < 1e-6) continue;
          const d = (o[0] - x) * (o[0] - x) + (o[1] - z) * (o[1] - z), kk = gid != null && gid >= 0 && o[3] === gid ? ks : k, m = (r + o[2]) * kk;
          if (d < m * m) return false;
        }
      }
      return true;
    }
  }

  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  /* Eignung eines Standorts für einen Typ (0…1) aus den Gewichten der Tabelle und den Merkmalen des Hosts */
  function affinity(t, f) {
    let s = 0, w = 0;
    for (const k in t.prefer) { w += t.prefer[k]; s += t.prefer[k] * clamp01(f[k] || 0); }
    return w ? s / w : 0.5;
  }

  /* ---- Standortarten: welche Typen passen wohin (Faktor auf das globale Gewicht) ----
     Lichtungen: offen (wenige kleine Gruppen am Rand), Buschlichtung (mehrere Gruppen), junge Bewuchsfläche (Jungwuchs, Farn).
     Sonst: path (Wegrand), edge (Waldrand/Übergang), rock (neben Steinen), shade (dichter, dunkler Bestand), loose (lockerer Bestand). */
  const KIND = {
    clearing_bush:  { round_shrub: 3, spreading_shrub: 1.3, evergreen_shrub: 0.15, fern_shrub: 0.5, berry_shrub: 1.3, young_shrub: 1, seasonal_shrub: 0.6 },
    clearing_open:  { round_shrub: 2, spreading_shrub: 1, evergreen_shrub: 0.1, fern_shrub: 0.3, berry_shrub: 1.6, young_shrub: 0.8, seasonal_shrub: 1.2 },
    clearing_young: { round_shrub: 0.5, spreading_shrub: 0.3, evergreen_shrub: 0.05, fern_shrub: 2.2, berry_shrub: 0.6, young_shrub: 4, seasonal_shrub: 0.5 },
    path:           { round_shrub: 1.8, spreading_shrub: 1.3, evergreen_shrub: 0.3, fern_shrub: 0.3, berry_shrub: 1.8, young_shrub: 0.5, seasonal_shrub: 2.2 },
    edge:           { round_shrub: 2, spreading_shrub: 3, evergreen_shrub: 0.6, fern_shrub: 0.5, berry_shrub: 1, young_shrub: 1.5, seasonal_shrub: 1 },
    rock:           { round_shrub: 0.5, spreading_shrub: 3, evergreen_shrub: 0.4, fern_shrub: 3, berry_shrub: 0.2, young_shrub: 0.5, seasonal_shrub: 0.2 },
    shade:          { round_shrub: 1, spreading_shrub: 0.5, evergreen_shrub: 3, fern_shrub: 2.5, berry_shrub: 0.1, young_shrub: 0.3, seasonal_shrub: 0.1 },
    loose:          { round_shrub: 2, spreading_shrub: 1, evergreen_shrub: 0.5, fern_shrub: 0.5, berry_shrub: 0.6, young_shrub: 3, seasonal_shrub: 0.8 },
    single:         { round_shrub: 2, spreading_shrub: 0.6, evergreen_shrub: 1.6, fern_shrub: 1.2, berry_shrub: 0.5, young_shrub: 1, seasonal_shrub: 0.3 }
  };
  /* wie weit außen in der Gruppe ein Typ steht (breite Unterholzbüsche am Rand, runde im Kern) */
  const OUTER = { round_shrub: 0.25, young_shrub: 0.4, seasonal_shrub: 0.45, berry_shrub: 0.5, evergreen_shrub: 0.5, fern_shrub: 0.7, spreading_shrub: 0.95 };
  const SINGLE_SHARE = 0.2;            /* Anteil des Buschbudgets für Einzelbüsche (der Rest steht in Gruppen) */
  const SINGLE_MAX = 0.35;             /* nie mehr als so viel, auch wenn Gruppen keinen Platz finden */
  const SINGLE_SIZE = 0.9;             /* Einzelbüsche etwas kleiner */

  /* Büsche erzeugen – zonenbasiert: Gruppen auf Lichtungen und an Übergängen, wenige Einzelbüsche, Rest frei.
     opts.treeCount   tatsächlich platzierte Bäume (Grundlage der 7:1-Regel)
     opts.rng         () → [0,1) – seedbasiert
     opts.clearings   [{x, z, r}] Lichtungen (ausdrücklich oder aus der Baumdichte abgeleitet); Mitte bleibt frei
     opts.sample      rng → {x,z} | null   Zufallspunkt im möglichen Waldgebiet
     opts.ok          (x, z, r) → bool     Standort zulässig (Gebäude, Wege, Wasser …)
     opts.feat        (x, z) → Merkmale 0…1: edge shade conifer path clearing rock water dens
     opts.obstacles   [[x, z, r], …]       Bäume, Felsen, Totholz – Radius = Freihalteradius
     opts.trunks      [[x, z, r], …]       nur die Stämme (Einzelbüsche halten extra Abstand)
     Rückgabe: { target, placed, shortfall, instances, byType, groups, singles, kinds } – jede Instanz hat `group` (≥ 0) oder −1 (Einzelbusch). */
  function generate(opts) {
    const rng = opts.rng, target = targetCount(opts.treeCount), maxTries = opts.maxTries || 14;
    const sp = new Spacing(2), spSingle = new Spacing(4);
    (opts.obstacles || []).forEach(o => sp.add(o[0], o[1], o[2]));
    const clearings = (opts.clearings || []).filter(c => c.r >= 2);
    clearings.forEach(c => sp.add(c.x, c.z, c.r * 0.38));                                   /* Mitte der Lichtung bleibt frei */
    const inst = [], byType = {}, kinds = {}; TYPES.forEach(t => byType[t.id] = 0);
    const groups = [];
    const feat = opts.feat || (() => ({}));
    const share = {}; TYPES.forEach(t => share[t.id] = t.weight / 100);
    const R = (a, b) => a + (b - a) * rng();
    /* Typ für einen Standort: globales Gewicht × Standortfaktor × Ausgleich, damit die Gesamtanteile nahe den Gewichten bleiben */
    const pickLocal = (kind, f) => {
      const km = KIND[kind], tot = inst.length;
      const w = TYPES.map(t => {
        let m = km[t.id] || 0.01;
        if (t.id === "evergreen_shrub") m *= 0.4 + 2 * clamp01(f.conifer || 0);
        const corr = tot < 8 ? 1 : Math.min(5, Math.max(0.2, Math.pow(share[t.id] * (tot + 1) / (byType[t.id] + 1), 1.8)));
        return t.weight * m * corr;
      });
      let x = rng() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return TYPES[i]; }
      return TYPES[TYPES.length - 1];
    };
    const dims = (t, k) => { const q = rng(), q2 = clamp01(q + (rng() - 0.5) * 0.5); return { hh: lerp(t.h[0], t.h[1], q) * k, ww: lerp(t.w[0], t.w[1], q2) * k }; };
    const make = (t, x, z, d, gid, kind) => {
      const nw = (t.w[0] + t.w[1]) / 2, nh = (t.h[0] + t.h[1]) / 2, r = d.ww / 2 * 0.8;
      const b = {
        id: "b" + inst.length, typeId: t.id, position: [+x.toFixed(2), 0, +z.toFixed(2)], rotationY: +(rng() * 6.2832).toFixed(3),
        scale: [+(d.ww / nw).toFixed(3), +(d.hh / nh).toFixed(3), +(d.ww / nw).toFixed(3)], variantSeed: Math.floor(rng() * 1e6),
        tint: +lerp(TINT[0], TINT[1], rng()).toFixed(3), r, group: gid, kind
      };
      sp.add(x, z, r * 0.8 * (t.gap / 0.85), gid); byType[t.id]++; kinds[kind] = (kinds[kind] || 0) + 1; inst.push(b);
      return b;
    };

    /* ---- Gruppe: Mittelpunkt, unregelmäßige Kontur (Lappen), Teilgruppen, Kern innen – breite Büsche außen ---- */
    const placeGroup = (site, size) => {
      const gid = groups.length, f0 = feat(site.x, site.z), n0 = inst.length;
      const sel = []; for (let i = 0; i < size; i++) sel.push(pickLocal(site.kind, f0));
      sel.sort((a, b) => OUTER[a.id] - OUTER[b.id]);
      const Rg = (0.8 + 0.34 * size) * R(0.85, 1.2), orient = rng() * Math.PI, asp = R(0.55, 1), p1 = rng() * 6.28, p2 = rng() * 6.28;
      const nsub = size >= 5 ? 2 : 1, off = nsub > 1 ? R(0.55, 0.9) * Rg : 0, so = [[0, 0], [Math.cos(orient) * off, Math.sin(orient) * off]];
      let n = 0;
      for (let i = 0; i < sel.length; i++) {
        const t = sel[i], d = dims(t, 1), r = d.ww / 2 * 0.8, sub = nsub > 1 && i % 2 ? 1 : 0, rank = sel.length > 1 ? i / (sel.length - 1) : 0.5;
        let best = null;
        for (let a = 0; a < maxTries && !best; a++) {
          const th = rng() * 6.2832, lobe = 1 + 0.22 * Math.sin(2 * th + p1) + 0.14 * Math.sin(3 * th + p2);
          const u = clamp01(OUTER[t.id] * 0.7 + 0.18 + (rng() - 0.5) * 0.45) * Rg * lobe, lx = Math.cos(th) * u, lz = Math.sin(th) * u * asp;
          const x = site.x + so[sub][0] + lx * Math.cos(orient) - lz * Math.sin(orient), z = site.z + so[sub][1] + lx * Math.sin(orient) + lz * Math.cos(orient);
          if (opts.ok(x, z, r) && sp.free(x, z, r, 1, gid, 0.72)) best = { x, z };
        }
        if (best) { make(t, best.x, best.z, d, gid, site.kind); n++; }
      }
      if (n < Math.min(2, size)) {                                                            /* zu wenig Platz: Versuch zurücknehmen */
        for (let i = inst.length - 1; i >= n0; i--) { const bb = inst[i]; byType[bb.typeId]--; kinds[bb.kind]--; }
        inst.length = n0; sp.removeGroup(gid); return 0;
      }
      groups.push({ id: gid, kind: site.kind, x: site.x, z: site.z, n });
      return n;
    };

    /* ---- Plätze für Gruppen planen: erst Lichtungen, dann Übergänge/Wegränder/Steine/Schatten ---- */
    let single = Math.floor(target * SINGLE_SHARE), budget = target - single;
    const slots = [];
    clearings.forEach(c => {
      if (rng() > 0.85) return;                                                              /* nicht jede Lichtung bekommt Büsche */
      const q = rng(), big = c.r > 5.5, type = c.kind || (c.r < 3.6 || q < 0.3 ? "clearing_open" : q < 0.75 ? "clearing_bush" : "clearing_young");
      const ng = type === "rock" ? 3 : type === "clearing_open" ? (big && rng() < 0.5 ? 2 : 1) : type === "clearing_bush" ? 2 + (big ? 1 : 0) + (rng() < 0.4 ? 1 : 0) : 1;
      const a0 = rng() * 6.28;
      for (let i = 0; i < ng; i++) {
        const an = a0 + i * 6.28 / ng + R(-0.5, 0.5), rho = c.r * R(0.52, 0.88);
        const size = type === "rock" ? 2 + Math.floor(rng() * 4) : type === "clearing_open" ? 2 + Math.floor(rng() * 3) : type === "clearing_bush" ? 3 + Math.floor(rng() * 5) : 4 + Math.floor(rng() * 4);
        slots.push({ kind: type, x: c.x + Math.cos(an) * rho, z: c.z + Math.sin(an) * rho, size, clearing: c });
      }
    });
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    const placedC = [];
    let remaining = budget;
    for (const s of slots) {
      if (remaining < 2) break;
      let size = Math.min(s.size, remaining); if (remaining - size === 1) size = remaining;
      let ok = false;
      for (let a = 0; a < 6 && !ok; a++) {                                                    /* Mitte etwas verschieben, wenn dort kein Platz ist */
        const c = s.clearing, an = Math.atan2(s.z - c.z, s.x - c.x) + R(-0.3, 0.3) * a, rho = Math.hypot(s.x - c.x, s.z - c.z) * R(0.9, 1.1);
        const site = { kind: s.kind, x: c.x + Math.cos(an) * rho, z: c.z + Math.sin(an) * rho };
        if (placeGroup(site, size) > 0) ok = true;
      }
      if (ok) { remaining -= groups[groups.length - 1].n; placedC.push(s); }
    }
    /* weitere Gruppen an Wegrändern, Waldrändern, Steinen, in Schatten und lockerem Bestand */
    if (remaining >= 2 && opts.sample) {
      const need = Math.ceil(remaining / 4), pool = [];
      for (let i = 0; i < need * 40; i++) {
        const p = opts.sample(rng); if (!p || !opts.ok(p.x, p.z, 0.5)) continue;
        const f = feat(p.x, p.z), sc = { path: f.path * 1.0, edge: f.edge * 1.0, rock: f.rock * 1.3, shade: f.shade * f.dens * 0.35, loose: (1 - f.dens) * f.edge * 0.9 + (1 - f.dens) * 0.15 };
        let kind = "loose", s = -1; for (const k in sc) if (sc[k] > s) { s = sc[k]; kind = k; }
        if (kind === "shade" && f.dens < 0.7) continue;
        if (s > 0.3) pool.push({ kind, x: p.x, z: p.z, s: s * s * (0.5 + rng()) });
      }
      const gcs = groups.map(g => [g.x, g.z]), used = {}, cap = { path: 0.35, edge: 0.3, loose: 0.2, rock: 0.2, shade: 0.12 }, rem0 = remaining;
      for (let pass = 1; pass <= 3 && remaining >= 2; pass++) {
        const left = pool.slice(); pool.length = 0; let guard = 0;
        while (remaining >= 2 && left.length && guard++ < need * 40) {
          let tot = 0; left.forEach(c => tot += c.s); let x = rng() * tot, ix = 0;
          for (; ix < left.length - 1; ix++) { x -= left[ix].s; if (x < 0) break; }
          const c = left.splice(ix, 1)[0];
          if (pass < 3 && (used[c.kind] || 0) >= cap[c.kind] * rem0 * pass) { pool.push(c); continue; }   /* keine Art überwiegt: erst höchstens ihr Anteil am Budget, dann doppelt, zuletzt ohne Grenze */
          if (gcs.some(g => Math.hypot(g[0] - c.x, g[1] - c.z) < 6.5)) continue;                /* Gruppen stehen nicht dicht an dicht */
          const size = Math.min(c.kind === "rock" ? 2 + Math.floor(rng() * 4) : c.kind === "loose" ? 4 + Math.floor(rng() * 4) : 3 + Math.floor(rng() * 4), remaining);
          const sz = remaining - size === 1 ? remaining : size;
          const got = placeGroup(c, sz);
          if (got > 0) { remaining -= got; used[c.kind] = (used[c.kind] || 0) + got; gcs.push([c.x, c.z]); }
        }
      }
    }
    /* ---- Einzelbüsche: wenige, klein, in Zwischenräumen, am Rand dichterer Gruppen, bei Steinen, in Übergängen ---- */
    single = Math.min(Math.floor(target * SINGLE_MAX), single + remaining);
    const trunkObs = opts.trunks || [];
    const spTr = new Spacing(2); trunkObs.forEach(o => spTr.add(o[0], o[1], o[2]));
    for (let n = 0; n < single; n++) {
      let best = null, bs = -1, valid = 0;
      const t = pickLocal("single", {}), d = dims(t, SINGLE_SIZE), r = d.ww / 2 * 0.8;
      for (let a = 0; a < maxTries * 2 && valid < 5; a++) {
        const p = opts.sample && opts.sample(rng); if (!p) continue;
        if (!opts.ok(p.x, p.z, r) || !sp.free(p.x, p.z, r, 1.15) || !spTr.free(p.x, p.z, r, 1.0) || !spSingle.free(p.x, p.z, 0, 1, -1, 1)) continue;
        valid++;
        const f = feat(p.x, p.z), mid = 1 - Math.abs(f.dens - 0.6) / 0.6;
        const s = 0.3 * f.edge + 0.3 * clamp01(mid) + 0.2 * f.rock + 0.2 * f.clearing + rng() * 0.2;
        if (s > bs) { bs = s; best = p; }
      }
      if (!best) continue;
      make(t, best.x, best.z, d, -1, "single"); spSingle.add(best.x, best.z, 6);            /* Einzelbüsche halten mindestens ~6 Einheiten Abstand zueinander */
    }
    const placed = inst.length;
    return { target, placed, shortfall: target - placed, instances: inst, byType, groups: groups.filter(g => g.n > 0).length, singles: inst.filter(b => b.group < 0).length, kinds, groupList: groups, spacing: sp };
  }

  /* ---- Gras: grass_tuft – kleine Büschel schlanker, leicht gebogener Halme, bevorzugt am Fuß von Birken ----
     Ein separater Dekorationstyp: zählt nicht zum Baum-Busch-Verhältnis, ändert die Buschzahl nicht.
     Zufall je Baum aus einem Hash von Lage und Seed (nicht aus einer laufenden Folge): dieselbe Birke bekommt immer dasselbe Gras,
     auch wenn sich die Baumliste ändert.
     opts.birches   [{x, z, s, r}]  Birken mit Stammradius r (Weltmaß)
     opts.seed      Zahl
     opts.ok        (x, z) → bool       Boden zulässig (kein Weg, Wasser, Gebäude …)
     opts.sp        Spacing mit Stämmen, Felsen und Büschen (Gras hält Abstand zu Büschen)
     opts.clearings [{x, z, r}] · opts.rocks [[x, z, r]] · opts.sampleEdge rng → {x,z} (sonniger Wegrand) | null · opts.sampleTrans rng → {x,z} (Übergang)
     Rückgabe: { instances, birchTufted, birchTotal } */
  const GRASS = { id: "grass_tuft", h: [0.2, 0.4], w: [0.18, 0.34], palette: { mid: 0x8fac40, light: 0xb0cb55, olive: 0x75933a }, variants: 3 };
  const hash = (a, b, c) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };
  function grass(opts) {
    const seed = opts.seed || 0, out = [], ok = opts.ok || (() => true), sp = opts.sp;
    const tuft = (x, z, h1, h2, h3, h4, sk) => {
      const sc = lerp(0.75, 1.35, h1), r = 0.13 * sc;
      if (!ok(x, z) || (sp && !sp.free(x, z, r, 0.9, -1, 1, sk))) return false;
      out.push({ id: "g" + out.length, typeId: GRASS.id, position: [+x.toFixed(2), 0, +z.toFixed(2)], rotationY: +(h2 * 6.2832).toFixed(3), scale: [+sc.toFixed(3), +lerp(0.85, 1.5, h3).toFixed(3), +sc.toFixed(3)], variantSeed: Math.floor(h4 * 1e6), tint: +lerp(0.92, 1.08, h1 * 0.7 + h3 * 0.3).toFixed(3) });
      if (sp) sp.add(x, z, r * 0.6, -2);
      return true;
    };
    let tufted = 0;
    const birches = (opts.birches || []).slice().sort((a, b) => a.x - b.x || a.z - b.z);
    birches.forEach(t => {
      const hx = Math.round(t.x * 100), hz = Math.round(t.z * 100);
      if (hash(hx, hz, seed + 1) > 0.5) return;                                              /* nur ein Teil der Birken */
      const n = 2 + Math.floor(hash(hx, hz, seed + 2) * 3.999), phi = hash(hx, hz, seed + 3) * 6.2832, arc = Math.PI * (0.75 + 0.5 * hash(hx, hz, seed + 4));
      let got = 0;
      for (let i = 0; i < n; i++) {
        const k = (n > 1 ? i / (n - 1) - 0.5 : 0) * arc, an = phi + k + (hash(hx, hz, seed + 10 + i) - 0.5) * 0.5;
        const dist = (t.r || 0.1) + 0.15 + 0.4 * hash(hx, hz, seed + 20 + i);                 /* Büschel ab Stammrand + 0,15, unterschiedlich weit weg */
        if (tuft(t.x + Math.cos(an) * dist, t.z + Math.sin(an) * dist, hash(hx, hz, seed + 30 + i), hash(hx, hz, seed + 40 + i), hash(hx, hz, seed + 50 + i), hash(hx, hz, seed + 60 + i), [t.x, t.z])) got++;
      }
      if (got) tufted++;
    });
    /* vereinzelt auch an Lichtungsrändern, neben Steinen, am sonnigen Wegrand und in Übergängen */
    const cl = (x, z, ax, az, rr, n, salt) => { for (let i = 0; i < n; i++) { const an = hash(ax, az, salt + i) * 6.2832, d = rr * (0.8 + 0.5 * hash(az, ax, salt + 7 + i)); tuft(x + Math.cos(an) * d, z + Math.sin(an) * d, hash(ax, az, salt + 11 + i), hash(az, ax, salt + 13 + i), hash(ax, az, salt + 17 + i), hash(az, ax, salt + 19 + i)); } };
    (opts.clearings || []).forEach(c => {
      const ax = Math.round(c.x * 10), az = Math.round(c.z * 10), n = 2 + Math.floor(hash(ax, az, seed + 100) * 4);
      for (let i = 0; i < n; i++) { const an = hash(ax, az, seed + 110 + i) * 6.2832, d = c.r * (0.7 + 0.2 * hash(az, ax, seed + 120 + i)); cl(c.x + Math.cos(an) * d, c.z + Math.sin(an) * d, ax + i, az, 0.35, 1 + Math.floor(hash(ax, az, seed + 130 + i) * 3), seed + 140); }
    });
    (opts.rocks || []).forEach(o => {
      const ax = Math.round(o[0] * 10), az = Math.round(o[1] * 10);
      if (hash(ax, az, seed + 200) > 0.4) return;
      const an = hash(ax, az, seed + 210) * 6.2832; cl(o[0] + Math.cos(an) * (o[2] + 0.25), o[1] + Math.sin(an) * (o[2] + 0.25), ax, az, 0.3, 1 + Math.floor(hash(ax, az, seed + 220) * 3), seed + 230);
    });
    const rr = (() => { let a = (seed * 7919 + 17) >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const spots = (fn, n, salt) => { if (!fn) return; for (let i = 0; i < n; i++) { const p = fn(rr); if (p) cl(p.x, p.z, Math.round(p.x * 10), Math.round(p.z * 10), 0.3, 1 + Math.floor(rr() * 3), seed + salt); } };
    spots(opts.sampleEdge, opts.nEdge == null ? 70 : opts.nEdge, 300);
    spots(opts.sampleTrans, opts.nTrans == null ? 40 : opts.nTrans, 400);
    return { instances: out, birchTufted: tufted, birchTotal: birches.length };
  }

  return { TYPES, BY_ID, VARIANTS, TINT, TREES_PER_BUSH, KIND, GRASS, targetCount, pickType, affinity, Spacing, generate, grass };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BUSH;
