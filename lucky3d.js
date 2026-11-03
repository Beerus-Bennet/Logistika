/* =========================================================================
   LOGISTIKA – lucky3d.js (v268, neu aufgebaut in v270)
   Luckybox in 3D mit der eigenen Engine (gl3d.js, wie Hof und Büro): eine Transportkiste und ein Glücksrad.
   v270:
   - Kiste in ruhiger Dreiviertelansicht, Licht und Farben so, dass Korpus, Metallrahmen, Beschläge und Emblem
     in klaren Helligkeitsstufen bleiben (nur schmale Glanzkanten sind hell). Keine überlappenden, gleich liegenden
     Flächen mehr (kein Flimmern), weicher Bodenschatten als Verlaufsbild statt schwarzer Scheibe.
   - Echter Innenraum: Boden und vier Wände mit Wandstärke, dunkler Innenboden, Innenflächen; das Stahlband liegt
     außen auf. Deckel als Schale mit sichtbarer Unterseite, Drehpunkt genau an der hinteren Scharnierkante,
     weiche Öffnung mit höchstens einem kleinen Nachschwingen, ohne Durchdringung.
   - Licht entsteht im Innenraum (leuchtender Boden, weicher Lichtschein als Verlaufsbild, additiv, ohne Kanten),
     beim Aufladen dringt es nur aus der Deckelfuge. Kleine, kurz lebende Funken nahe der Öffnung.
     Die Farbe beim Aufladen zeigt die Qualität der Box (normal kühl, golden warm), nicht den Gewinn.
   - Zusammenhängender Ablauf: Antippen → Aufladen → Deckel öffnet → Kamerafahrt nach oben zum Rad, das im
     Licht der Kiste aus dem Dunkel auftaucht (gleiche Mittelachse, kein Absinken, kein Maßstabssprung).
   - Rad: Feldgröße = Gewinnchance (wie v268). Kurz beschleunigen, gleichmäßig drehen, stetig abbremsen,
     kein Nachrücken. Zeiger vor dem Rad, reagiert dezent auf jeden vorbeilaufenden Stift (= Feldgrenze).
     Symbole passen in ihr Feld. Ruhige Lampen, Gewinnerfeld hervorgehoben.
   - Symbole aus opt.icon (gleiche Bilder wie auf der Gewinnkarte, lucky.js).
     LUCKY3D.open(host, { gold, odds, prizes, rarity, reduced, icon }) → Steuerung oder null (kein WebGL 2)
       .tap()                  kurze Reaktion auf das Antippen
       .charge(k, n)           Aufladen, Stufe k von n (Licht in der Farbe der Box)
       .openLid()              Deckel öffnet, Licht aus dem Innenraum, Funken
       .toWheel(ms)            Kamerafahrt zum Rad (ms Dauer)
       .spin(id, o)            Rad dreht und bleibt auf Preis id stehen; o: ta/tb/tc (s), turns, onTick(prize, speed), onDone()
       .highlight(col, rank)   Gewinnerfeld und Lampen in der Seltenheitsfarbe
       .finish(id)             sofort Endzustand (Überspringen): Rad auf Preis id, hervorgehoben
       .close()                alles freigeben (Schleife, Puffer, Bilder, WebGL-Kontext)
   ========================================================================= */
"use strict";

const LUCKY3D = (() => {
  const PI = Math.PI, TAU = PI * 2;
  /* Reihenfolge auf dem Rad: Seltenheiten wechseln sich ab, keine zwei gleichfarbigen Felder nebeneinander */
  const ORDER = ["cash", "insure", "boost", "fuel", "rep", "bulli", "xp", "coupon", "head", "repair", "mood", "vip"];
  /* Kiste: Korpus außen CW × CH × CD, Wandstärke T, Metallauflagen O (Bänder), O2 (Beschläge), O3 (Stahlband) */
  const CW = 1.36, CH = 0.6, CD = 0.8, T = 0.06, O = 0.012, O2 = 0.022, O3 = 0.018, LH = 0.2, GAP = 0.012, CASE_RY = -0.46;
  /* Rad: steht hinter der Kiste auf derselben Mittelachse, die Kamera fährt vom Kistenblick nach oben */
  const R_WHEEL = 1.25, HUB_Y = 3.35, WZ = -1.6;
  const hex = c => typeof c === "number" ? c : parseInt(String(c).replace("#", ""), 16);
  const rgb = c => G3.col(hex(c));
  const mixc = (a, b, k) => { const A = rgb(a), B = rgb(b); return [0, 1, 2].map(i => A[i] + (B[i] - A[i]) * k); };
  const clamp01 = k => k < 0 ? 0 : k > 1 ? 1 : k;
  const smooth = k => { k = clamp01(k); return k * k * (3 - 2 * k); };
  const smoother = k => { k = clamp01(k); return k * k * k * (k * (k * 6 - 15) + 10); };

  /* ------------------------------ Bilder -------------------------------- */
  /* Verlaufsbilder für Lichtschein und Schatten (weiß bzw. schwarz, Deckkraft im Alphakanal) */
  function gradTex(w, h, fn, dark) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), im = g.createImageData(w, h), d = im.data, v0 = dark ? 0 : 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = clamp01(fn((x + 0.5) / w, 1 - (y + 0.5) / h));
      d[i] = d[i + 1] = d[i + 2] = v0; d[i + 3] = Math.round(a * 255);
    }
    g.putImageData(im, 0, 0);
    return c;
  }
  /* Lichtschein über der Öffnung: unten am hellsten, nach oben und zu den Seiten weich auslaufend, unten kurz eingeblendet */
  const shaftFn = (u, v) => Math.exp(-Math.pow((u - 0.5) / 0.2, 2)) * Math.pow(1 - v, 1.8) * smooth(v / 0.07);
  const bloomFn = (u, v) => { const r = Math.hypot(u - 0.5, v - 0.5) * 2; return r >= 1 ? 0 : Math.exp(-r * r * 4) * (1 - r * r); };
  const lineFn = (u, v) => Math.exp(-Math.pow((v - 0.5) / 0.16, 2)) * Math.exp(-Math.pow((u - 0.5) / 0.36, 4));
  const shadowFn = (u, v) => { const r = Math.hypot(u - 0.5, v - 0.5) * 2; return r >= 1 ? 0 : 0.78 * Math.exp(-r * r * 2.4) * (1 - r * r); };
  function letterCanvas(ch, col) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    if (ch === "★") {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 22 : 50; g[i ? "lineTo" : "moveTo"](64 + Math.cos(a) * r, 68 + Math.sin(a) * r); }
      g.closePath(); g.lineJoin = "round"; g.lineWidth = 9; g.strokeStyle = "#0d1420"; g.stroke(); g.fillStyle = col; g.fill();
      return c;
    }
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "92px Bangers, 'Baloo 2', sans-serif";
    g.lineWidth = 10; g.strokeStyle = "#0d1420"; g.lineJoin = "round";
    g.strokeText(ch, 64, 70); g.fillStyle = col; g.fillText(ch, 64, 70);
    return c;
  }

  /* ------------------------------- Modelle ------------------------------ */
  /* Normal: Navy-Stahl mit mittelhellem Rahmen, dunkleren Beschlägen, Messing-Emblem. Golden: schwarzbraun mit warmem Messing.
     Die Werte sind mit dem Licht unten abgestimmt: Deckflächen ≈ 1,15-fach, Front ≈ 0,85, Seite ≈ 0,5 – nichts läuft weiß aus. */
  function palette(gold) {
    return gold
      ? { body: 0x2e2416, inner: 0x1e170d, floor: 0x120d07, lidIn: 0x251c10, frame: 0xa47826, frameHi: 0xe6c470, fit: 0x86621f, fitHi: 0xcfa952,
          rivet: 0xd9b866, strap: 0xb48731, strapS: 0x5a4114, emb: 0xe0b74e, embIn: 0x16100a, letter: "#f6cf5f", ch: "★", seam: 0x0b0803,
          light: [1.0, 0.8, 0.42], dark: [0.075, 0.05, 0.02], stand: 0x2a2014, standTop: 0x3a2e1c, rim: 0xa47826, rimHi: 0xd9b25a, hub: 0xcfa952 }
      : { body: 0x2b3c5a, inner: 0x18202e, floor: 0x0e131c, lidIn: 0x1d2739, frame: 0x7c899e, frameHi: 0xc4cedb, fit: 0x5d6a80, fitHi: 0xa3aebf,
          rivet: 0xaab5c4, strap: 0x8996ab, strapS: 0x3a4659, emb: 0xc9a54a, embIn: 0x111a29, letter: "#f2c443", ch: "L", seam: 0x0a0f18,
          light: [0.7, 0.85, 1.0], dark: [0.045, 0.075, 0.14], stand: 0x24324a, standTop: 0x33466a, rim: 0x7c899e, rimHi: 0xb9c4d3, hub: 0xa3aebf };
  }
  /* Beschlag an einer Ecke: zwei Platten außen auf Vorder-/Rückseite und Seite (L-Form), optional eine Deckplatte oben.
     xF/zF = Lage der äußeren Seiten- bzw. Stirnfläche, sx/sz = Richtung nach außen. Die Platten stehen O2 vor der Wand. */
  function corner(b, P, xF, zF, sx, sz, y0, h, c, top) {
    b.box(c, h, O2, P.fit, { x: xF + sx * (O2 - c / 2), y: y0, z: zF + sz * O2 / 2, top: P.fitHi });
    b.box(O2, h, c - O2, P.fit, { x: xF + sx * O2 / 2, y: y0, z: zF - sz * (c - O2) / 2, top: P.fitHi });
    if (top) b.box(c, O2, c, P.fit, { x: xF + sx * (O2 - c / 2), y: y0 + h, z: zF + sz * (O2 - c / 2), top: P.fitHi });
  }
  /* Korpus: Boden und vier Wände mit Wandstärke (innen dunkler), Metallbänder oben und unten, senkrechte Kanten,
     Eckbeschläge, Stahlband vorn und hinten (liegt außen auf, durchschneidet den Innenraum nicht), Nieten, Emblem, Scharniere */
  function caseBody(P) {
    const b = new G3.MB(), W = CW, H = CH, D = CD, t = T;
    b.box(W - 2 * t - 0.002, 0.05, D - 2 * t - 0.002, P.body, { top: P.floor });
    b.box(W, H, t, P.body, { z: D / 2 - t / 2, back: P.inner, top: P.frame });
    b.box(W, H, t, P.body, { z: -D / 2 + t / 2, front: P.inner, top: P.frame });
    b.box(t, H, D - 2 * t, P.body, { x: -W / 2 + t / 2, right: P.inner, top: P.frame });
    b.box(t, H, D - 2 * t, P.body, { x: W / 2 - t / 2, left: P.inner, top: P.frame });
    /* Bänder: die Stirnbänder decken die Ecken, die Seitenbänder stoßen stumpf an (keine gleich liegenden Flächen) */
    const band = (y, h, top) => {
      [-1, 1].forEach(s => b.box(W + 2 * O, h, O, P.frame, { y, z: s * (D / 2 + O / 2), top }));
      [-1, 1].forEach(s => b.box(O, h, D, P.frame, { y, x: s * (W / 2 + O / 2), top }));
    };
    band(0, 0.07, P.frame); band(H - 0.07, 0.07, P.frameHi);
    /* senkrechte Kanten zwischen den Bändern */
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      b.box(0.05, H - 0.14, O, P.frame, { x: sx * (W / 2 + O - 0.025), y: 0.07, z: sz * (D / 2 + O / 2) });
      b.box(O, H - 0.14, 0.05 - O, P.frame, { x: sx * (W / 2 + O / 2), y: 0.07, z: sz * (D / 2 - (0.05 - O) / 2) });
      /* Beschläge oben (knapp über der Bandkante) und unten */
      corner(b, P, sx * W / 2, sz * D / 2, sx, sz, CH - 0.13 + 0.004, 0.13, 0.13, false);
      corner(b, P, sx * W / 2, sz * D / 2, sx, sz, -0.004, 0.12, 0.13, false);
    }));
    /* Stahlband vorn und hinten, Seiten dunkel abgesetzt */
    [-1, 1].forEach(s => b.box(0.2, H - 0.004, O3, P.strap, { z: s * (D / 2 + O3 / 2), top: P.frameHi, left: P.strapS, right: P.strapS }));
    /* Nieten auf den Bändern */
    [-0.5, -0.3, 0.3, 0.5].forEach(x => [0.035, H - 0.035].forEach(y => b.sphere(0.016, 8, 5, P.rivet, { x, y, z: D / 2 + O + 0.004, smooth: true })));
    /* Emblem auf dem Band: Messingring, dunkle Scheibe (Buchstabe als Aufkleber) */
    b.cyl(0.15, 0.15, 0.022, 28, P.emb, { y: H * 0.47, z: D / 2 + O3, rx: PI / 2, top: P.frameHi });
    b.cyl(0.118, 0.118, 0.026, 28, P.embIn, { y: H * 0.47, z: D / 2 + O3, rx: PI / 2 });
    /* Scharniere an der hinteren Oberkante – ihre Achse ist die Drehachse des Deckels */
    [-0.42, 0.42].forEach(x => b.cyl(0.028, 0.028, 0.16, 10, P.fit, { x: x - 0.08, y: H + GAP, z: -(D / 2 + O), rz: -PI / 2 }));
    return b;
  }
  /* Deckel: Schale (Platte oben, Schürze mit Wandstärke) – Unterseite und Innenrand sichtbar, wenn er offen ist.
     Lokal liegt die Scharnierkante bei y 0, z 0; der Deckel reicht nach +z (vorn) und +y, nichts liegt darunter. */
  function caseLid(P) {
    const b = new G3.MB(), W = CW + 2 * O, D = CD + 2 * O, H = LH, t = T, pt = 0.06;
    b.box(W, pt, D, P.body, { y: H - pt, z: D / 2, bot: P.lidIn });
    b.box(W, H - pt, t, P.body, { z: D - t / 2, back: P.lidIn, bot: P.frame });
    b.box(W, H - pt, t, P.body, { z: t / 2, front: P.lidIn, bot: P.frame });
    b.box(t, H - pt, D - 2 * t, P.body, { x: -W / 2 + t / 2, z: D / 2, right: P.lidIn, bot: P.frame });
    b.box(t, H - pt, D - 2 * t, P.body, { x: W / 2 - t / 2, z: D / 2, left: P.lidIn, bot: P.frame });
    /* Lippe unten und Kante oben */
    b.box(W + 2 * O, 0.05, O, P.frame, { z: D + O / 2 });
    b.box(W + 2 * O, 0.05, O, P.frame, { z: -O / 2 });
    [-1, 1].forEach(s => b.box(O, 0.05, D, P.frame, { x: s * (W / 2 + O / 2), z: D / 2 }));
    b.box(W + 2 * O, 0.035, O, P.frame, { y: H - 0.035, z: D + O / 2, top: P.frameHi });
    /* Eckbeschläge oben (mit Deckplatte) */
    [-1, 1].forEach(sx => [[0, -1], [D, 1]].forEach(([zF, sz]) => corner(b, P, sx * W / 2, zF, sx, sz, H - 0.1 - O2 * 0.5, 0.1, 0.11, true)));
    /* Stahlband über den Deckel und vorn herunter */
    b.box(0.2, O3, D, P.strap, { y: H, z: D / 2, top: P.strap, left: P.strapS, right: P.strapS });
    b.box(0.2, H + O3, O3, P.strap, { z: D + O3 / 2, top: P.frameHi, left: P.strapS, right: P.strapS });
    /* Griff oben */
    [-0.22, 0.22].forEach(x => b.box(0.05, 0.075, 0.05, P.fit, { x, y: H, z: D / 2 }));
    b.box(0.5, 0.045, 0.065, P.frame, { y: H + 0.075, z: D / 2, top: P.frameHi });
    return b;
  }
  /* Fuge zwischen Korpus und Deckel: dunkler Ring, beim Aufladen leuchtet er (Licht nur aus der Fuge) */
  function seamRing(P) {
    const b = new G3.MB(), W = CW + 2 * O, D = CD + 2 * O, h = GAP - 0.003, s = 0.008;
    [-1, 1].forEach(q => b.box(W, h, s, 0xffffff, { y: CH + 0.0015, z: q * (D / 2 - s / 2) }));
    [-1, 1].forEach(q => b.box(s, h, D - 2 * s, 0xffffff, { y: CH + 0.0015, x: q * (W / 2 - s / 2) }));
    return b;
  }
  /* leuchtender Innenboden */
  function lightPlate() { const b = new G3.MB(); b.box(CW - 2 * T - 0.02, 0.004, CD - 2 * T - 0.02, 0xffffff, { y: 0.051 }); return b; }

  /* Glücksrad: Felder als Fächer (innen dunkler, außen heller), Rand mit Stiften an den Feldgrenzen, Nabe */
  function wheelMesh(segs, P) {
    const b = new G3.MB(), R = R_WHEEL, z = 0.06;
    const pt = (a, r, zz) => [Math.sin(a) * r, Math.cos(a) * r, zz];
    segs.forEach(s => {
      const n = Math.max(2, Math.ceil(s.w / (TAU / 90))), c = hex(s.col), cIn = mixc(c, 0x0d1420, 0.42), cOut = mixc(c, 0xffffff, 0.1);
      for (let i = 0; i < n; i++) {
        const a0 = s.a0 + s.w * i / n, a1 = s.a0 + s.w * (i + 1) / n;
        b.triV(pt(0, 0, z), pt(a1, R, z), pt(a0, R, z), cIn, cOut, cOut);
      }
    });
    for (let i = 0; i < 64; i++) { const a0 = TAU * i / 64, a1 = TAU * (i + 1) / 64; b.tri(pt(0, 0, -0.06), pt(a0, R, -0.06), pt(a1, R, -0.06), 0x111827); }
    const N = 72, R1 = R + 0.13;
    for (let i = 0; i < N; i++) {
      const a0 = TAU * i / N, a1 = TAU * (i + 1) / N;
      b.quad(pt(a0, R1, 0.1), pt(a0, R1, -0.1), pt(a1, R1, -0.1), pt(a1, R1, 0.1), P.rim);
      b.quad(pt(a0, R, 0.1), pt(a0, R1, 0.1), pt(a1, R1, 0.1), pt(a1, R, 0.1), P.rimHi);
      b.quad(pt(a1, R, -0.1), pt(a1, R1, -0.1), pt(a0, R1, -0.1), pt(a0, R, -0.1), P.rim);
      b.quad(pt(a1, R, 0.1), pt(a1, R, z), pt(a0, R, z), pt(a0, R, 0.1), 0x1a2333);
    }
    segs.forEach(s => b.cyl(0.028, 0.028, 0.14, 8, P.hub, { x: Math.sin(s.a0) * (R + 0.02), y: Math.cos(s.a0) * (R + 0.02), z: 0.06, rx: PI / 2 }));
    b.cyl(0.3, 0.3, 0.16, 28, P.hub, { z: 0.02, rx: PI / 2 });
    b.cyl(0.24, 0.24, 0.17, 28, 0x111a29, { z: 0.025, rx: PI / 2 });
    return b;
  }
  function spokes(segs) {
    const b = new G3.MB(), L = R_WHEEL - 0.3;
    segs.forEach(s => b.at({ rz: -s.a0 }, () => b.box(0.035, L, 0.03, 0x0d1420, { y: 0.3, z: 0.065 })));
    return b;
  }
  /* Gewinnerfeld: eigene helle Fläche knapp vor dem Feld und ein Rahmen, der es umschließt */
  function winMesh(s, col) {
    const b = new G3.MB(), R = R_WHEEL - 0.02, z = 0.064, n = Math.max(2, Math.ceil(s.w / (TAU / 90))), w = 0.045;
    const pt = (a, r, zz) => [Math.sin(a) * r, Math.cos(a) * r, zz];
    const cIn = mixc(col, 0xffffff, 0.15), cOut = mixc(col, 0xffffff, 0.45);
    for (let i = 0; i < n; i++) { const a0 = s.a0 + s.w * i / n, a1 = s.a0 + s.w * (i + 1) / n; b.triV(pt(0, 0.3, z), pt(a1, R, z), pt(a0, R, z), cIn, cOut, cOut); }
    for (let i = 0; i < n; i++) { const a0 = s.a0 + s.w * i / n, a1 = s.a0 + s.w * (i + 1) / n; b.quad(pt(a0, R - w, z + 0.004), pt(a1, R - w, z + 0.004), pt(a1, R, z + 0.004), pt(a0, R, z + 0.004), 0xffffff); }
    [s.a0, s.a0 + s.w].forEach(a => b.at({ rz: -a }, () => b.box(0.04, R - 0.3, 0.012, 0xffffff, { y: 0.3, z: z + 0.002 })));
    return b;
  }
  function standMesh(P) {
    const b = new G3.MB(), z = -0.36;
    /* schmaler Fuß (steht verdeckt hinter der Kiste), schlanke Streben */
    b.box(0.9, 0.12, 0.7, P.stand, { y: 0, z: z + 0.01, top: P.standTop });
    [-1, 1].forEach(s => b.box(0.11, HUB_Y + 0.05, 0.11, P.stand, { x: s * 0.36, y: 0.1, z: z - 0.05, rz: s * 0.1 }));
    b.box(0.18, HUB_Y, 0.18, P.stand, { y: 0.1, z });
    b.cyl(0.08, 0.08, 0.4, 12, P.rim, { y: HUB_Y, z, rx: PI / 2 });
    return b;
  }
  /* Zeiger: Keil nach unten, dunkler Rand, Drehpunkt oben; liegt klar vor Rad und Stiften */
  function pointerMesh(P) {
    const b = new G3.MB(), f = 0.075, bk = -0.035, ink = 0x0d1420;
    const tri = (w, h, z, col) => { b.tri([-w, 0, z], [w, 0, z], [0, -h, z], col); b.tri([w, 0, z - 0.06], [-w, 0, z - 0.06], [0, -h, z - 0.06], col); };
    tri(0.17, 0.36, f, ink);
    tri(0.125, 0.285, f + 0.012, 0xe2465f);
    b.tri([-0.06, -0.02, f + 0.016], [0.0, -0.02, f + 0.016], [-0.03, -0.12, f + 0.016], 0xf59aa8);
    b.quad([-0.17, 0, f], [-0.17, 0, bk], [0, -0.36, bk], [0, -0.36, f], ink);
    b.quad([0, -0.36, f], [0, -0.36, bk], [0.17, 0, bk], [0.17, 0, f], ink);
    b.quad([0.17, 0, f], [0.17, 0, bk], [-0.17, 0, bk], [-0.17, 0, f], ink);
    b.cyl(0.07, 0.07, 0.15, 14, P.hub, { z: -0.02, rx: PI / 2 });
    return b;
  }
  function bulbMesh() { const b = new G3.MB(); b.sphere(0.042, 8, 6, 0xffffff, { smooth: true }); return b; }

  /* ------------------------------- Szene -------------------------------- */
  function open(host, opt) {
    opt = opt || {};
    if (typeof G3 === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.className = "lb-3d";
    host.insertBefore(cv, host.firstChild);
    let R = null;
    try { R = G3.create(cv, { shadowSize: 256, shadowBox: 4, maxDpr: 1.75 }); } catch (e) { R = null; }
    if (!R) { cv.remove(); return null; }
    const P = palette(!!opt.gold), red = !!opt.reduced, meshes = [], texs = [];
    const M = mb => { const m = R.mesh(mb); meshes.push(m); return m; };
    const TX = c => { const t = R.texture(c); texs.push(t); return t; };
    const add = (m, o, parent) => { const n = R.node(m, Object.assign({ shadow: false }, o || {})); if (parent) R.addChild(parent, n); else R.nodes.push(n); return n; };
    /* Licht: Sonne von vorn oben links, gedämpfter Himmel – Deckflächen hell, Front mittel, Seite dunkel, nichts gesättigt */
    const E = R.env;
    E.sun = G3.norm([-0.2, 0.85, 0.6]); E.sunCol = [0.92, 0.88, 0.82]; E.sky = [0.4, 0.44, 0.54]; E.ground = [0.12, 0.13, 0.17];
    E.fog = [0.05, 0.08, 0.14]; E.fogR = [80, 160]; E.night = 0;
    const cam = R.cam; cam.fov = 0.6; cam.yaw = PI / 2;

    /* Felder des Rads aus den Chancen (unverändert seit v268) */
    const odds = opt.odds, prizes = opt.prizes, rar = opt.rarity;
    const byR = {}; prizes.forEach(p => { byR[p.r] = (byR[p.r] || 0) + 1; });
    const tot = ["c", "r", "e", "l"].reduce((a, k) => a + (odds[k] || 0), 0);
    let a = 0;
    const segs = ORDER.map(id => prizes.find(p => p.id === id)).filter(Boolean).concat(prizes.filter(p => !ORDER.includes(p.id))).map(p => {
      const w = TAU * (odds[p.r] / tot) / byR[p.r], s = { p, a0: a, w, mid: a + w / 2, col: rar[p.r].col };
      a += w; return s;
    });

    /* Bilder */
    const tShadow = TX(gradTex(96, 96, shadowFn, true)), tShaft = TX(gradTex(48, 128, shaftFn)), tBloom = TX(gradTex(96, 96, bloomFn)), tLine = TX(gradTex(128, 24, lineFn));
    const tLetter = TX(letterCanvas(P.ch, P.letter));
    const L = P.light, lmul = k => [L[0] * k, L[1] * k, L[2] * k];

    /* Kiste (in Dreiviertelansicht gedreht), Deckel am Scharnier, Fuge, Innenlicht */
    const caseRoot = add(null, { ry: CASE_RY });
    add(M(caseBody(P)), {}, caseRoot);
    const lid = add(M(caseLid(P)), { y: CH + GAP, z: -(CD / 2 + O) }, caseRoot);
    add(null, { y: CH * 0.47, z: CD / 2 + O3 + 0.028, decal: { t: tLetter, w: 0.2, h: 0.2, unlit: true } }, caseRoot);
    const seam = add(M(seamRing(P)), { tint: [...rgb(P.seam), 1] }, caseRoot);
    const plate = add(M(lightPlate()), { tint: [...L, 1], glow: 0.6, visible: false }, caseRoot);
    const seamGlow = add(null, { y: CH + GAP * 0.5, z: CD / 2 + 0.05, decal: { t: tLine, w: 1.9, h: 0.22, unlit: true, add: true, mul: lmul(0) } }, caseRoot);
    /* weicher Bodenschatten (Verlaufsbild, liegt flach) und Lichtschein über der Öffnung (zur Kamera gedreht, additiv) */
    const shadow = add(null, { y: 0.004, z: 0.12, rx: -PI / 2, decal: { t: tShadow, w: 2.7, h: 1.9, unlit: true } });
    const shaft = add(null, { y: CH + 0.95, z: 0.0, decal: { t: tShaft, w: 1.25, h: 2.1, unlit: true, add: true, mul: lmul(0) } });
    const bloom = add(null, { y: CH + 0.22, z: -0.12, decal: { t: tBloom, w: 2.0, h: 1.3, unlit: true, add: true, mul: lmul(0) } });

    /* Glücksrad: Ständer, Rad (dreht um z), Symbole, Lampen, Zeiger – bis zum Öffnen dunkel und unsichtbar */
    const wheelRoot = add(null, { y: 0, z: WZ, visible: false });
    add(M(standMesh(P)), {}, wheelRoot);
    const wheel = add(M(wheelMesh(segs, P)), { y: HUB_Y }, wheelRoot);
    add(M(spokes(segs)), {}, wheel);
    add(null, { z: 0.2, decal: { t: tLetter, w: 0.34, h: 0.34, unlit: true } }, wheel);
    const iconT = {}, iconN = [];
    segs.forEach(s => {
      /* Symbol passt ins Feld: Quadrat mit Rand zur Feldgrenze, so weit außen wie möglich */
      const h = s.w / 2, tn = Math.tan(Math.min(h, 0.9)), avail = R_WHEEL - 0.1;
      const size = Math.min(0.42, 0.88 * avail * tn / (0.5 + tn)), r = Math.min(R_WHEEL * 0.66, avail - size / 2);
      const t = iconT[s.p.id] || (iconT[s.p.id] = TX(opt.icon ? opt.icon(s.p.id, 128) : letterCanvas("?", "#fff")));
      iconN.push(add(null, { x: Math.sin(s.mid) * r, y: Math.cos(s.mid) * r, z: 0.075, rz: -s.mid, decal: { t, w: size, h: size, unlit: true }, seg: s }, wheel));
      s.iconSize = size; s.iconR = r;
    });
    const bulbM = M(bulbMesh()), bulbs = [], NB = 20;
    for (let i = 0; i < NB; i++) { const an = TAU * i / NB; bulbs.push(add(bulbM, { x: Math.sin(an) * (R_WHEEL + 0.065), y: HUB_Y + Math.cos(an) * (R_WHEEL + 0.065), z: 0.12, glow: 0.3, tint: [1, 0.9, 0.6, 1] }, wheelRoot)); }
    const ptr = add(M(pointerMesh(P)), { y: HUB_Y + R_WHEEL + 0.31, z: 0.22 }, wheelRoot);
    let winNode = null;

    /* Zustand */
    const S3 = {
      t: 0, phase: "idle", tapT: -9, charge: 0, chargeT: -9, lidT: -1, open: 0, glow: 0, camK: 0, camT: -1, camD: 1,
      reveal: 0, spin: null, ang: Math.random() * TAU, flap: 0, flapV: 0, lit: -1, litCol: [1, 0.9, 0.6], rank: 0, winSeg: null
    };
    wheel.rz = S3.ang;
    /* Zeit: Abläufe (Deckel, Kamera, Licht) laufen nach echter Zeit wie das Rad – auch bei niedriger Bildrate bleibt alles
       im Takt; nur Federn und Funken rechnen mit einem begrenzten Zeitschritt */
    let raf = 0, last = performance.now(), alive = true;
    const T0 = last;
    function segAt(ang) { const x = ((ang % TAU) + TAU) % TAU; return segs.find(s => x >= s.a0 && x < s.a0 + s.w) || segs[segs.length - 1]; }
    /* Kamera: Abstand aus dem Seitenverhältnis der Bühne, damit Kiste bzw. Rad immer ganz und möglichst groß im Bild sind */
    const VIEW_CASE = { tx: 0, ty: 0.42, tz: 0.04, pitch: 0.42, hw: 1.2, hh: 0.76 };
    const VIEW_WHEEL = { tx: 0, ty: HUB_Y + 0.02, tz: WZ, pitch: 0.07, hw: 1.52, hh: 1.82 };
    function fit(v) { const tf = Math.tan(cam.fov / 2), asp = Math.max(0.3, (cv.clientWidth || 1) / (cv.clientHeight || 1)); return Math.max(v.hh / tf, v.hw / (tf * asp)) * 1.04; }
    function setCam(k) {
      const A = VIEW_CASE, B = VIEW_WHEEL, e = smoother(k);
      cam.tx = A.tx + (B.tx - A.tx) * e; cam.ty = A.ty + (B.ty - A.ty) * e; cam.tz = A.tz + (B.tz - A.tz) * e;
      cam.pitch = A.pitch + (B.pitch - A.pitch) * e; cam.dist = fit(A) + (fit(B) - fit(A)) * e;
    }
    /* Deckel: weich auslaufende Öffnung (gedämpfte Feder, höchstens ein kleines Nachschwingen von ~4 %) */
    const LID_MAX = 1.9;
    const lidCurve = u => { if (u >= 1) return 1; const w = 9.5, z = 0.72, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + z * w / wd * Math.sin(wd * u)); };

    const frame = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S3.t = (now - T0) / 1000;
      const t = S3.t;
      /* Kiste: fast ruhig – nur ein leichtes Schweben, beim Antippen ein kurzes Nachgeben */
      const tap = t - S3.tapT, sq = tap < 0.32 && !red ? Math.sin(Math.min(1, tap / 0.32) * PI) * Math.exp(-tap * 6) * 0.06 : 0;
      const bob = red || S3.phase !== "idle" ? 0 : Math.sin(t * 2.0) * 0.012;
      caseRoot.y = 0.03 + bob; caseRoot.sy = 1 - sq; caseRoot.sx = caseRoot.sz = 1 + sq * 0.5;
      caseRoot.ry = CASE_RY + (red || S3.phase !== "idle" ? 0 : Math.sin(t * 0.7) * 0.02);
      /* Aufladen: dezentes Zittern, der Deckel hebt sich kaum merklich, die Fuge leuchtet stufenweise */
      if (S3.phase === "charge") {
        const k = t - S3.chargeT, A = red ? 0 : 0.4 + S3.charge * 0.6, pulse = Math.exp(-k * 7);
        caseRoot.rz = Math.sin(t * 61) * 0.006 * A; caseRoot.x = Math.sin(t * 47) * 0.004 * A;
        lid.rx = -(0.012 + 0.03 * pulse) * A;
        S3.glow = 0.25 + 0.5 * S3.charge + 0.35 * pulse;
      } else { caseRoot.rz = 0; caseRoot.x = 0; }
      if (S3.lidT >= 0) {
        const u = red ? 1 : (t - S3.lidT) / 0.62;
        S3.open = clamp01(u); lid.rx = -LID_MAX * lidCurve(clamp01(u));
      }
      /* Licht: Fuge (nur geschlossen), Innenboden und Lichtschein (nur offen), weicher Ausklang während der Kamerafahrt */
      const lidOpen = S3.lidT >= 0, fade = S3.camT >= 0 ? 1 - smooth((t - S3.camT - 0.35) / 1.1) : 1;
      const gs = S3.phase === "charge" ? S3.glow : 0;
      seam.tint = gs > 0 ? [...lmul(Math.min(1, 0.35 + gs)), Math.min(1, gs * 1.2)] : [...rgb(P.seam), 1]; seam.glow = gs * 0.5;
      seamGlow.decal.mul = lmul(gs * 0.75);
      plate.visible = lidOpen;
      const og = lidOpen ? smooth(S3.open * 1.6) * fade : 0;
      plate.tint = [...L, 0.62]; plate.glow = 0.35 * og;
      shaft.decal.mul = lmul(0.5 * og); bloom.decal.mul = lmul(0.2 * og);
      shadow.alpha = red || S3.phase !== "idle" ? 1 : 0.94 - bob * 4;
      /* Rad taucht im Licht auf (aus der Hintergrundfarbe), Symbole blenden mit */
      if (S3.camT >= 0) S3.reveal = red ? 1 : clamp01((t - S3.camT - 0.15) / 0.75);
      const rv = smooth(S3.reveal);
      wheelRoot.visible = S3.camT >= 0;
      wheelRoot.tint = rv < 1 ? [...P.dark, 1 - rv] : null;
      /* Rad drehen: kurz beschleunigen, gleichmäßig, stetig abbremsen – endet genau auf dem Zielwinkel */
      if (S3.spin) {
        const sp = S3.spin, tt = Math.max(0, (now - sp.t0) / 1000), w0 = sp.w0;
        let th, vel;
        if (tt < sp.ta) { th = w0 * tt * tt / (2 * sp.ta); vel = w0 * tt / sp.ta; }
        else if (tt < sp.ta + sp.tb) { th = w0 * sp.ta / 2 + w0 * (tt - sp.ta); vel = w0; }
        else if (tt < sp.D) { const u = (tt - sp.ta - sp.tb) / sp.tc; th = w0 * sp.ta / 2 + w0 * sp.tb + w0 * sp.tc * (1 - Math.pow(1 - u, 3)) / 3; vel = w0 * (1 - u) * (1 - u); }
        else { th = sp.a1 - sp.a0; vel = 0; }
        S3.ang = sp.a0 + Math.min(th, sp.a1 - sp.a0);
        const cur = segAt(S3.ang);
        if (cur !== sp.cur) { sp.cur = cur; S3.flapV -= Math.min(4.5, 1.2 + vel * 0.22); if (sp.onTick) sp.onTick(cur.p, vel); }
        if (tt >= sp.D) { S3.spin = null; S3.ang = sp.a1; if (sp.onDone) setTimeout(() => { if (alive) sp.onDone(); }, 0); }
      }
      wheel.rz = S3.ang;
      /* Zeiger: dezent ausschlagen, gedämpft zurückfedern */
      S3.flapV += (-S3.flap * 230 - S3.flapV * 19) * dt; S3.flap += S3.flapV * dt; S3.flap = Math.max(-0.22, Math.min(0.06, S3.flap));
      ptr.rz = S3.flap;
      /* Lampen: ruhig – im Stand gleichmäßig, beim Drehen eine langsame Welle, beim Gewinn in Seltenheitsfarbe */
      for (let i = 0; i < NB; i++) {
        const n = bulbs[i];
        let k, c = [1, 0.9, 0.6];
        if (S3.lit >= 0) { const q = t - S3.lit; c = S3.litCol; k = q < 1.2 && !red ? 0.65 + 0.35 * Math.cos(q * TAU * 1.6) : 0.9; }
        else if (S3.spin && !red) k = 0.35 + 0.45 * Math.max(0, Math.cos(i / NB * TAU - t * 2.2));
        else k = 0.45;
        n.tint = [c[0] * (0.3 + 0.7 * k), c[1] * (0.3 + 0.7 * k), c[2] * (0.3 + 0.7 * k), 1]; n.glow = k * 0.9;
        if (rv < 1) n.tint = n.tint.map((v, j) => j < 3 ? v * rv + P.dark[j] * (1 - rv) : 1);
      }
      if (winNode) winNode.glow = S3.lit >= 0 ? 0.25 + (red ? 0 : 0.2 * Math.max(0, Math.cos((t - S3.lit) * TAU * 1.2)) * Math.exp(-(t - S3.lit) * 1.2)) : 0;
      iconN.forEach(n => { n.alpha = (S3.winSeg && n.seg !== S3.winSeg && S3.lit >= 0 ? 0.42 : 1) * rv; });
      /* Kamera */
      if (S3.camT >= 0) S3.camK = red ? 1 : clamp01((t - S3.camT) / S3.camD);
      setCam(S3.camK);
      R.stepParticles(dt);
      try { R.render(S3.t); } catch (e) { /* Kontextverlust */ }
      raf = requestAnimationFrame(frame);
    };
    setCam(0);
    raf = requestAnimationFrame(frame);

    /* Funken: klein, unterschiedlich groß, kurz – die meisten bleiben nahe der Öffnung, einzelne steigen höher */
    const sparkCols = () => [[...L, 1], [1, 1, 1, 0.9], [...lmul(0.85), 0.9]];
    function sparks(n, high) {
      if (red) return;
      const cr = Math.cos(CASE_RY), sr = Math.sin(CASE_RY), cols = sparkCols();
      for (let i = 0; i < n; i++) {
        const lx = (Math.random() - 0.5) * (CW - 0.3), lz = (Math.random() - 0.5) * (CD - 0.3), far = Math.random() < (high || 0.15);
        R.emit({
          x: lx * cr + lz * sr, y: CH - 0.02 + Math.random() * 0.05, z: -lx * sr + lz * cr,
          vx: (Math.random() - 0.5) * 0.35, vy: far ? 1.1 + Math.random() * 0.7 : 0.35 + Math.random() * 0.45, vz: (Math.random() - 0.5) * 0.3,
          g: -0.5, drag: 1.6, life: far ? 0.8 + Math.random() * 0.4 : 0.35 + Math.random() * 0.35,
          size: 0.014 + Math.random() * 0.026, size2: 0.004, col: cols[i % cols.length], shape: i % 3 === 0 ? 3 : 0
        });
      }
    }

    return {
      canvas: cv,
      tap() { S3.tapT = S3.t; },
      charge(k, n) {
        S3.phase = "charge"; S3.chargeT = S3.t; S3.charge = n > 1 ? k / (n - 1) : 1;
        if (!red && k === n - 1) sparks(4, 0);
      },
      openLid() {
        if (S3.lidT >= 0) return;
        S3.phase = "open"; S3.lidT = S3.t;
        if (!red) { sparks(16, 0.18); setTimeout(() => { if (alive) sparks(8, 0.25); }, 180); }
      },
      toWheel(ms) { if (S3.camT >= 0) return; S3.camT = S3.t; S3.camD = Math.max(0.05, (ms || 1000) / 1000); },
      spin(id, o) {
        const s = segs.find(x => x.p.id === id) || segs[0];
        /* Ziel: im Feld, mit Abstand zu den Grenzen (±28 % der Feldbreite um die Mitte) */
        const off = (Math.random() - 0.5) * s.w * 0.56, turns = o.turns || 3;
        let a1 = s.mid + off; while (a1 < S3.ang + turns * TAU) a1 += TAU;
        const ta = o.ta || 0.35, tb = o.tb || 0.5, tc = o.tc || 1.75, A = a1 - S3.ang;
        S3.spin = { t0: performance.now(), a0: S3.ang, a1, ta, tb, tc, D: ta + tb + tc, w0: A / (ta / 2 + tb + tc / 3), cur: segAt(S3.ang), onTick: o.onTick, onDone: o.onDone };
        S3.winSeg = s;
      },
      highlight(col, rank) {
        S3.lit = S3.t; S3.litCol = rgb(col); S3.rank = rank || 0;
        const s = S3.winSeg; if (!s) return;
        if (!winNode) winNode = add(M(winMesh(s, col)), { tint: [1, 1, 1, 0] }, wheel);
        wheel.tint = [0.04, 0.06, 0.1, 0.32];
        if (!red && rank >= 2) {
          const cr = rgb(col);
          for (let i = 0; i < 6 + rank * 3; i++) {
            const sx = Math.random() < 0.5 ? -1 : 1;
            R.emit({ x: sx * (0.35 + Math.random() * 0.55), y: HUB_Y + R_WHEEL * 0.75 + Math.random() * 0.25, z: WZ + 0.25, vx: sx * (0.3 + Math.random() * 0.5), vy: 0.4 + Math.random() * 0.6, vz: 0.1,
              g: -1.2, drag: 1.4, life: 0.5 + Math.random() * 0.4, size: 0.03 + Math.random() * 0.03, size2: 0.006, col: i % 2 ? [...cr, 1] : [1, 1, 1, 0.9], shape: 3 });
          }
        }
      },
      finish(id) {
        S3.spin = null;
        const s = segs.find(x => x.p.id === id) || segs[0];
        S3.ang = s.mid; wheel.rz = s.mid; S3.winSeg = s;
        S3.phase = "open"; if (S3.lidT < 0) S3.lidT = S3.t - 5; S3.open = 1; lid.rx = -LID_MAX;
        if (S3.camT < 0) S3.camT = S3.t - 5; S3.camK = 1; S3.reveal = 1;
      },
      close() {
        alive = false; cancelAnimationFrame(raf);
        try {
          meshes.forEach(m => R.free(m)); texs.forEach(tx => R.texFree && R.texFree(tx)); R.nodes.length = 0;
          const ext = R.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
        } catch (e) { /* egal */ }
        cv.remove();
      },
      alive: () => alive,
      _segs: segs, _state: S3, _cam: cam, _R: R
    };
  }
  return { open, ORDER };
})();
