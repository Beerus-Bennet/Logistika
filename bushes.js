/* =========================================================================
   LOGISTIKA – bushes.js   (v89)
   Buschsystem für den Wald der großen Welt: sieben Buscharten, zentrale
   Typtabelle und ein seedbasierter, eignungsgesteuerter Generator. Es gibt KEIN festes
   Baum-Busch-Verhältnis und keine feste Gruppengröße mehr (v89): die Menge ergibt sich aus der
   Waldsituation – lokale Baumdichte, Übergänge, Lichtungsränder, Felsen, Wege – und einem
   fleckigen Bewuchsfeld; wo nichts passt, bleibt der Boden frei. Dazu Grasbüschel an Birken.
   Reine Logik – kennt weder Engine noch Welt: die Welt reicht Gültigkeitsprüfung und
   Standortmerkmale als Funktionen herein (worldview.js, worldBushes). Dadurch läuft das
   Modul auch in Node (Tests: tests/bushes.test.js).
   Die Geometrien der sieben Typen stehen in woodmodels.js (FWM.bush).
   ========================================================================= */
const BUSH = (() => {
  "use strict";

    /* ---- Typtabelle (zentral, erweiterbar) ----
     weight     Vorrang des Typs bei der Typwahl (Summe 100; seit v89 kein Soll-Anteil mehr – die Standortart entscheidet mit)
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

  /* ---- Standortarten: welche Typen wohin passen (Faktor auf das Grundgewicht des Typs – das Gewicht ist nur noch ein Vorrang, kein Anteil) ----
     dense  dichter Bestand: klein und zurückhaltend (Farn, Nadelstrauch, Jungwuchs)
     loose  lockerer Bestand zwischen Bäumen: rund, jung, Farn
     edge   Übergang/Waldrand: breite Unterholzsträucher, runde, junge, Beeren
     path   Wegrand: Beere, saisonal, rund
     rock   neben Felsen: breite Sträucher, Farn
     rim    Rand einer Lichtung: rund, Beere, jung, breit */
  const KIND = {
    dense: { round_shrub: 0.5, spreading_shrub: 0.15, evergreen_shrub: 2.5, fern_shrub: 3, berry_shrub: 0.05, young_shrub: 1.2, seasonal_shrub: 0.03 },
    loose: { round_shrub: 2, spreading_shrub: 0.8, evergreen_shrub: 0.5, fern_shrub: 0.9, berry_shrub: 0.5, young_shrub: 2.4, seasonal_shrub: 0.4 },
    edge:  { round_shrub: 1.8, spreading_shrub: 3, evergreen_shrub: 0.5, fern_shrub: 0.5, berry_shrub: 1, young_shrub: 1.6, seasonal_shrub: 0.8 },
    path:  { round_shrub: 1.6, spreading_shrub: 1.2, evergreen_shrub: 0.25, fern_shrub: 0.3, berry_shrub: 2, young_shrub: 0.5, seasonal_shrub: 1.8 },
    rock:  { round_shrub: 0.5, spreading_shrub: 3, evergreen_shrub: 0.4, fern_shrub: 3.5, berry_shrub: 0.2, young_shrub: 0.5, seasonal_shrub: 0.15 },
    rim:   { round_shrub: 2.4, spreading_shrub: 1.4, evergreen_shrub: 0.1, fern_shrub: 0.4, berry_shrub: 1.5, young_shrub: 1.2, seasonal_shrub: 0.9 },
    sprout:{ round_shrub: 0.3, spreading_shrub: 0.2, evergreen_shrub: 0.03, fern_shrub: 2, young_shrub: 4, berry_shrub: 0.3, seasonal_shrub: 0.1 }
  };
  /* je Standortart: Wahrscheinlichkeit, dass aus einem Einzelbusch eine kleine Gruppe wird, und höchste Zahl Begleiter (Gruppe = 1 + Begleiter) */
  const GROW = { dense: [0.1, 1], loose: [0.35, 3], edge: [0.45, 4], path: [0.3, 3], rock: [0.55, 4], rim: [0.45, 3] };
  const SIZE = { dense: 0.86, loose: 1, edge: 1.06, path: 1, rock: 1.04, rim: 1.08, sprout: 0.9 };
  const RATE = 0.3;                  /* Dichte-Rate der Keimpunkte je Kandidat – KEIN Mengenziel; die Anzahl ergibt sich aus Eignung und Fleckenfeld */

  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const h2 = (i, j, s) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = (x, z, s) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(h2(i, j, s), h2(i + 1, j, s), u), lerp(h2(i, j + 1, s), h2(i + 1, j + 1, s), u), v);
  };
  /* stückweise lineare Kurve durch Punkte [x, y] */
  const curve = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts[pts.length - 1][1];
  };
  /* Eignung eines Standorts als Untervegetation (0…~1,4) aus der lokalen Waldsituation:
     rho  Baumdichte im Umkreis relativ zum dichten Kernwald (1 = Kernwald, 0 = keine Bäume)
     Im dichten Bestand wenig, im lockeren Bestand und in Übergängen am meisten; Übergänge, Felsen, Wege und Lichtungsnähe erhöhen. */
  const RHO_CURVE = [[0, 0.5], [0.2, 0.8], [0.35, 1], [0.6, 1], [0.85, 0.22], [1.1, 0.08], [1.6, 0.04]];
  function suitability(f) {
    const mod = 0.55 + 0.9 * Math.max(f.edge || 0, 0.8 * (f.rock || 0), 0.5 * (f.path || 0), 0.7 * (f.clearing || 0));
    return curve(RHO_CURVE, f.rho == null ? 0.5 : f.rho) * mod;
  }
  function zoneOf(f) {
    if (f.rock > 0.5) return "rock";
    if ((f.rho || 0) > 0.8) return "dense";
    if (f.clearing > 0.45) return "rim";
    if (f.path > 0.5) return "path";
    if (f.edge > 0.5) return "edge";
    return "loose";
  }

  /* Büsche erzeugen – eignungsgesteuert, ohne Mengenvorgabe.
     opts.rng        () → [0,1) – seedbasiert
     opts.seed       Zahl für das Bewuchsfeld (Flecken); Standard: aus rng
     opts.area       {x0, z0, x1, z1}  Suchgebiet · opts.step Rasterweite der Kandidaten (2,4)
     opts.inForest   (x, z) → bool     Punkt gehört zum Wald
     opts.ok         (x, z, r) → bool  Standort zulässig (Gebäude, Wege, Wasser …)
     opts.feat       (x, z) → { rho, edge, conifer, path, clearing, rock, water }  Standortmerkmale (rho s. suitability)
     opts.clearings  [{x, z, r, kind?, explicit?}]  Lichtungen: werden zuerst und überwiegend offen gehalten (Typ nach Seed)
     opts.rocks      [[x, z, r]]       Felsen (bei einigen steht ein Busch daneben)
     opts.obstacles  [[x, z, r], …]    Bäume, Felsen, Totholz – Radius = Freihalteradius
     opts.trunks     [[x, z, r], …]    nur die Stämme (Büsche halten extra Abstand)
     opts.rate       Dichte-Rate (Standard RATE) – nur zu Testzwecken
     Rückgabe: { placed, instances, byType, groups, singles, kinds, groupList, clearingTypes, spacing } – jede Instanz hat `group` (≥ 0) oder −1 (Einzelbusch). */
  function generate(opts) {
    const rng = opts.rng, maxTries = opts.maxTries || 10, rate = opts.rate == null ? RATE : opts.rate;
    const sp = new Spacing(2), spSeed = new Spacing(4), spTr = new Spacing(2);
    (opts.obstacles || []).forEach(o => sp.add(o[0], o[1], o[2]));
    (opts.trunks || []).forEach(o => spTr.add(o[0], o[1], o[2]));
    const clearings = (opts.clearings || []).filter(c => c.r >= 2);
    clearings.forEach(c => sp.add(c.x, c.z, c.r * 0.38));                                   /* Mitte der Lichtung bleibt frei */
    const inst = [], byType = {}, kinds = {}, groups = [], clearingTypes = []; TYPES.forEach(t => byType[t.id] = 0);
    const feat = opts.feat || (() => ({ rho: 0.5 }));
    const R = (a, b) => a + (b - a) * rng();
    const s1 = opts.seed != null ? opts.seed : Math.floor(rng() * 1e6), s2 = s1 + 17.3;
    /* fleckiges Bewuchsfeld: großflächige Wechsel zwischen bewachsenen und leeren Bereichen */
    const patch = (x, z) => smooth(0.34, 0.8, 0.62 * vnoise(x / 26, z / 26, s1) + 0.38 * vnoise(x / 9, z / 9, s2));
    const seasonal = [];

    /* Typ für einen Standort: Grundgewicht × Faktor der Standortart – kein Ausgleich auf Gesamtanteile */
    const pickLocal = (kind, f, near) => {
      const km = KIND[kind];
      const w = TYPES.map(t => {
        let m = km[t.id] || 0.01;
        if (t.id === "evergreen_shrub" && kind !== "sprout") m *= 0.12 + 2.4 * clamp01(f.conifer || 0);
        if (t.id === "seasonal_shrub" && seasonal.some(p => Math.hypot(p[0] - near[0], p[1] - near[1]) < 16)) m *= 0.08;      /* Farbbüsche bleiben selten und stehen nie dicht beieinander */
        return t.weight * m;
      });
      let x = rng() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return TYPES[i]; }
      return TYPES[TYPES.length - 1];
    };
    const dims = (t, k) => { const q = rng(), q2 = clamp01(q + (rng() - 0.5) * 0.5); return { hh: lerp(t.h[0], t.h[1], q) * k, ww: lerp(t.w[0], t.w[1], q2) * k }; };
    const radiusOf = d => d.ww / 2 * 0.8;
    const make = (t, x, z, d, gid, kind) => {
      const nw = (t.w[0] + t.w[1]) / 2, nh = (t.h[0] + t.h[1]) / 2, r = radiusOf(d);
      const b = {
        id: "b" + inst.length, typeId: t.id, position: [+x.toFixed(2), 0, +z.toFixed(2)], rotationY: +(rng() * 6.2832).toFixed(3),
        scale: [+(d.ww / nw).toFixed(3), +(d.hh / nh).toFixed(3), +(d.ww / nw).toFixed(3)], variantSeed: Math.floor(rng() * 1e6),
        tint: +lerp(TINT[0], TINT[1], rng()).toFixed(3), r, group: gid, kind
      };
      sp.add(x, z, r * 0.8 * (t.gap / 0.85), gid); byType[t.id]++; kinds[kind] = (kinds[kind] || 0) + 1; inst.push(b);
      if (t.id === "seasonal_shrub") seasonal.push([x, z]);
      return b;
    };
    /* Platz prüfen: zulässig, frei von Bäumen/Felsen/Büschen und Abstand zu Stämmen */
    const fits = (x, z, r, gid, kk, ks) => opts.ok(x, z, r) && sp.free(x, z, r, kk, gid, ks) && spTr.free(x, z, r, 1);

    /* ---- eine Gruppe aus 1 + n Büschen: Keimpunkt, dann Wachstum Schritt für Schritt von einem schon stehenden Busch aus
       entlang einer Vorzugsrichtung (längliche, unregelmäßige Form, kein Mittelpunkt, kein Kreis); die Größe folgt dem verfügbaren Platz ---- */
    const growGroup = (zone, x, z, extra, opt) => {
      opt = opt || {};
      const gid = groups.length, f0 = feat(x, z), k = (SIZE[zone] || 1) * (opt.size || 1), kind = opt.kind || zone;
      const t0 = opt.type || pickLocal(opt.pick || zone, f0, [x, z]), d0 = dims(t0, k), r0 = radiusOf(d0);
      if (!fits(x, z, r0, gid, 1.05, 0.85)) return 0;
      const first = make(t0, x, z, d0, gid, kind), mem = [first]; let n = 1;
      const orient = rng() * Math.PI, kk = opt.space || R(1, 1.3);
      for (let i = 0; i < extra; i++) {
        let done = false;
        for (let a = 0; a < maxTries && !done; a++) {
          const m = mem[rng() < 0.65 ? mem.length - 1 : Math.floor(rng() * mem.length)];
          const same = rng() < 0.4, t = opt.type || (same ? BY_ID[m.typeId] : pickLocal(opt.pick || zone, f0, [m.position[0], m.position[2]]));
          const d = dims(t, k * R(0.72, 1.08)), r = radiusOf(d);
          const th = orient + (rng() < 0.5 ? 0 : Math.PI) + (rng() - 0.5) * 2.0, dist = (m.r + r) * R(0.78, 1.45) * kk;
          const px = m.position[0] + Math.cos(th) * dist, pz = m.position[2] + Math.sin(th) * dist;
          if (fits(px, pz, r, gid, 1.05, 0.85)) { mem.push(make(t, px, pz, d, gid, kind)); n++; done = true; }
        }
      }
      if (n > 1) groups.push({ id: gid, kind, x, z, n }); else { first.group = -1; groups.push({ id: gid, kind, x, z, n: 1 }); }
      return n;
    };
    const extraFor = (zone, v) => {
      const g = GROW[zone] || GROW.loose; let cap = g[1]; if (v > 0.85 && zone !== "dense" && rng() < 0.08) cap += 3;     /* größere Gruppen sind selten und nur in sehr bewachsenen Flecken */
      if (rng() > g[0]) return 0;
      let n = 1; while (n < cap && rng() < 0.5) n++;
      return n;
    };

    /* ---- 1) Lichtungen: zuerst offene Fläche. offen (nur Rand, selten ein Strauch) · leicht bewachsen (1–3 kleine Gruppen an gewählten Stellen)
       · junger Bewuchs (lockerer Sektor aus Jungwuchs/Farn) – nie ein geschlossener Kranz ---- */
    clearings.forEach(c => {
      const q = rng(), type = c.kind === "rock" ? "light" : c.explicit ? (q < 0.65 ? "open" : q < 0.9 ? "light" : "young") : (q < 0.5 ? "open" : q < 0.8 ? "light" : "young");
      let got = 0;
      const ctr = (an, rho) => [c.x + Math.cos(an) * c.r * rho, c.z + Math.sin(an) * c.r * rho];
      if (type === "open") {
        if (rng() < 0.35) { const p = ctr(rng() * 6.2832, R(0.7, 0.95)); got += growGroup("rim", p[0], p[1], 0, { size: 0.92 }); }
      } else if (type === "light") {
        const ng = 1 + (rng() < 0.3 ? 1 : 0) + (rng() < 0.08 ? 1 : 0), a0 = rng() * 6.2832;
        for (let i = 0; i < ng; i++) {
          const an = a0 + (i ? (rng() < 0.5 ? 1 : -1) * R(0.9, 2.4) * i : 0), p = ctr(an, R(0.62, 0.92));
          let ok = false; for (let a = 0; a < 5 && !ok; a++) { const q2 = ctr(an + R(-0.4, 0.4) * a, R(0.6, 0.95)); ok = growGroup("rim", q2[0], q2[1], c.r < 4.5 ? (rng() < 0.4 ? 1 : 0) : Math.floor(rng() * 3), { size: 0.95 }) > 0; }
          if (ok) got++;
        }
      } else {
        const phi = rng() * 6.2832, wd = R(1.1, 2.2), nn = Math.min(Math.floor(c.r * 0.7), 2 + Math.floor(rng() * 4));
        for (let i = 0; i < nn; i++) { const p = ctr(phi + (rng() - 0.5) * wd, R(0.5, 0.95)); got += growGroup("rim", p[0], p[1], 0, { pick: "sprout", space: R(1.15, 1.6), size: 0.95 }); }
      }
      clearingTypes.push({ x: c.x, z: c.z, r: c.r, type, n: got });
    });

    /* ---- 2) neben einzelnen Felsen ---- */
    (opts.rocks || []).forEach(o => {
      if (rng() > 0.16) return;
      const an = rng() * 6.2832, d = o[2] + R(0.45, 0.8);
      growGroup("rock", o[0] + Math.cos(an) * d, o[1] + Math.sin(an) * d, rng() < 0.5 ? 1 : 0);
    });

    /* ---- 3) Waldfläche: Kandidatenraster → Eignung × Bewuchsfeld → Keimpunkte mit Abstandssperre → kleine Gruppen oder Einzelbüsche ---- */
    const A = opts.area, step = opts.step || 2.4, cand = [];
    if (A && opts.inForest) {
      for (let gx = A.x0; gx < A.x1; gx += step) for (let gz = A.z0; gz < A.z1; gz += step) {
        const x = gx + rng() * step, z = gz + rng() * step;
        if (!opts.inForest(x, z)) continue;
        let cd = 1e9; for (const c of clearings) cd = Math.min(cd, Math.hypot(x - c.x, z - c.z) - c.r);
        if (cd < 0.9) continue;                                                              /* Lichtungen und ihr Rand gehören Schritt 1 */
        const v = patch(x, z); if (v < 0.12) continue;
        const f = feat(x, z), s = suitability(f), w = s * v;
        if (w < 0.03 || !opts.ok(x, z, 0.4)) continue;
        cand.push({ x, z, w, v, f, u: rng() });
      }
    }
    cand.sort((a, b) => a.u - b.u);                                                           /* Reihenfolge seedbasiert gemischt */
    for (const c of cand) {
      if (rng() > rate * c.w * step * step / 4) continue;                              /* Rate je Flächeneinheit: unabhängig von der Rasterweite */
      const Rs = R(3, 7.5);
      if (!spSeed.free(c.x, c.z, Rs / 2, 1)) continue;
      const zone = zoneOf(c.f);
      const n = growGroup(zone, c.x, c.z, extraFor(zone, c.v));
      if (n > 0) spSeed.add(c.x, c.z, Rs / 2);
    }
    return { placed: inst.length, instances: inst, byType, groups: groups.filter(g => g.n > 1).length, singles: inst.filter(b => b.group < 0).length, kinds, groupList: groups.filter(g => g.n > 0), clearingTypes, spacing: sp, candidates: cand.length };
  }

  /* ---- Gras: grass_tuft – kleine Büschel schlanker, leicht gebogener Halme, bevorzugt am Fuß von Birken ----
     Ein separater Dekorationstyp: ändert die Buschzahl nicht.
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

  return { TYPES, BY_ID, VARIANTS, TINT, KIND, GROW, RATE, GRASS, pickType, affinity, suitability, zoneOf, Spacing, generate, grass };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BUSH;
