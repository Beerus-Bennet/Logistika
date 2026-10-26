/* =========================================================================
   LOGISTIKA – routegeo.js (v150)
   Routen auf echten Wegen statt Luftlinie:
   · Straße / Schiene / Fahrrad: Linie über befahrbare Straßen (Routing-Dienst, wird
     beim ersten Mal geladen und im Gerät gemerkt; bis dahin gerade Linie),
   · Seeweg: feste Seewege (Wegpunkte um Landzungen, Kanäle, Engen),
   · Binnenwasser: Flussläufe / Kanäle (Wegpunkte),
   · Luftfracht: Großkreis (kürzester Weg über die Erdkugel).
   Das Spiel rechnet weiter mit der Luftlinie (Zeit, Preis) – nur Linie und
   Fahrzeugposition folgen dem Weg (gleicher Anteil der Strecke). Siehe game.js
   roadLine / vehPoint.
   ========================================================================= */
const GEO = { ver: 0, mem: new Map(), pend: new Set(), q: [], busy: false, failAt: new Map(), ids: null, sea: null, ok: true };
const GEO_STORE = "logistika-geo-v1";
const GEO_HOSTS = {
  car: ["https://routing.openstreetmap.de/routed-car/route/v1/driving/", "https://router.project-osrm.org/route/v1/driving/"],
  bike: ["https://routing.openstreetmap.de/routed-bike/route/v1/driving/", "https://router.project-osrm.org/route/v1/driving/"]
};

/* ------------------------------ kleine Helfer ------------------------------ */
const geoRad = d => d * Math.PI / 180;
function geoHav(a, b) {
  const R = 6371, dLat = geoRad(b[0] - a[0]), dLon = geoRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(geoRad(a[0])) * Math.cos(geoRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
const geoLen = pts => { let d = 0; for (let i = 1; i < pts.length; i++) d += geoHav(pts[i - 1], pts[i]); return d; };
const geoPk = p => p[0].toFixed(4) + "," + p[1].toFixed(4);
/* Schlüssel unabhängig von der Richtung: kleinerer Punkt zuerst */
function geoKey(a, b, mode) { const ka = geoPk(a), kb = geoPk(b); return ka <= kb ? mode + "|" + ka + "|" + kb : mode + "|" + kb + "|" + ka; }
const geoFwd = (a, b) => geoPk(a) <= geoPk(b);
/* Linie vereinfachen (Douglas-Peucker, Toleranz in Grad) */
function geoSimplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const ax = pts[a][1], ay = pts[a][0], bx = pts[b][1], by = pts[b][0], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      let t = l2 ? ((pts[i][1] - ax) * dx + (pts[i][0] - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx - pts[i][1], py = ay + t * dy - pts[i][0], d = px * px + py * py;
      if (d > md) { md = d; mi = i; }
    }
    if (mi >= 0 && md > tol * tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}
/* Polyline-Kodierung (Google, 5 Stellen) – klein genug für localStorage */
function geoEnc(pts) {
  let out = "", la = 0, lo = 0;
  const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let s = ""; while (v >= 32) { s += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
  pts.forEach(p => { const a = Math.round(p[0] * 1e5), o = Math.round(p[1] * 1e5); out += e(a - la) + e(o - lo); la = a; lo = o; });
  return out;
}
function geoDec(s) {
  const pts = []; let i = 0, la = 0, lo = 0;
  const rd = () => { let r = 0, sh = 0, b; do { b = s.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32); return r & 1 ? ~(r >> 1) : r >> 1; };
  while (i < s.length) { la += rd(); lo += rd(); pts.push([la / 1e5, lo / 1e5]); }
  return pts;
}
function geoUnwrap(c) {
  if (!c.length) return c;
  const o = [[c[0][0], c[0][1]]];
  for (let i = 1; i < c.length; i++) { let lon = c[i][1]; const pv = o[i - 1][1]; while (lon - pv > 180) lon -= 360; while (pv - lon > 180) lon += 360; o.push([c[i][0], lon]); }
  return o;
}

/* ------------------------------- Speicher --------------------------------- */
function geoLoad() {
  try {
    const raw = localStorage.getItem(GEO_STORE); if (!raw) return;
    const o = JSON.parse(raw);
    Object.keys(o).forEach(k => { try { GEO.mem.set(k, geoDec(o[k])); } catch (e) { /* kaputt: ignorieren */ } });
  } catch (e) { /* kein Speicher */ }
}
let geoSaveT = 0;
function geoSave() {
  clearTimeout(geoSaveT);
  geoSaveT = setTimeout(() => {
    try {
      const o = {}; let n = 0;
      const keys = [...GEO.mem.keys()].filter(k => /^(r|l|b|d)\|/.test(k));         /* Straßenlinien – Seewege/Flüsse/Großkreise rechnen sich neu */
      keys.slice(-400).forEach(k => { o[k] = geoEnc(GEO.mem.get(k)); n += o[k].length; });
      localStorage.setItem(GEO_STORE, JSON.stringify(o));
    } catch (e) { /* voll oder gesperrt */ }
  }, 800);
}

/* ------------------------------ Luftfracht -------------------------------- */
function geoArc(a, b) {
  const la1 = geoRad(a[0]), lo1 = geoRad(a[1]), la2 = geoRad(b[0]), lo2 = geoRad(b[1]);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
  if (d < 1e-6) return null;
  const n = Math.max(2, Math.min(80, Math.ceil(d * 6371 / 250))), out = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2), y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2), z = A * Math.sin(la1) + B * Math.sin(la2);
    out.push([Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI]);
  }
  out[0] = a.slice(); out[out.length - 1] = b.slice();
  return out;
}

/* -------------------------------- Seewege ---------------------------------
   Wegpunkte im offenen Wasser; die Ketten sind befahrbare Verbindungen (Kanäle,
   Engen, Kaps). Ein Hafen hängt am nächsten Wegpunkt seiner Hafenliste. */
const GEO_WP = {
  /* Nordsee, Kanal, Atlantikküste */
  elb1: [53.58, 9.62], brun: [53.9, 9.15], cux: [53.95, 8.75], elbm: [54.0, 8.2], kc1: [54.1, 9.3], kc2: [54.3, 9.65], hol: [54.4, 10.18],
  wes1: [53.75, 8.5], wesm: [54.0, 7.9], gbi: [54.2, 7.4], fr1: [53.9, 6.5], fr2: [53.5, 5.2], fr3: [52.7, 4.1], maas: [51.99, 3.9], bank: [51.55, 2.6],
  dov: [51.05, 1.6], wsch: [51.4, 3.55], sch1: [51.38, 4.0], fel: [51.92, 1.6], fe2: [52.0, 2.7],
  ch1: [50.6, 0.5], lh: [49.65, -0.2], ch2: [50.1, -1.2], chw: [49.9, -2.5], ush: [48.75, -6.0], bis: [46.6, -6.8], fin: [43.9, -10.0], po: [40.5, -10.2],
  lis: [38.6, -9.6], sv: [36.95, -9.6], cad: [36.5, -7.3], gib: [35.97, -5.7], gx: [35.9, -8.5],
  skm: [58.2, 9.8], s1: [57.7, 8.2], s2: [56.5, 7.4], s3: [55.2, 7.4],
  /* Ostsee */
  sk: [57.95, 10.95], gbg: [57.65, 11.75], ka1: [56.8, 11.8], ka2: [56.0, 12.4], kph: [55.7, 12.72], ors: [55.3, 12.9], bal1: [54.9, 12.9], r1: [54.62, 12.3], ros: [54.4, 12.12],
  gedser: [54.5, 11.85], fehm: [54.6, 11.1], kie: [54.5, 10.28], kg3: [56.3, 11.0], gb1: [55.3, 10.85], gb2: [54.85, 10.7],
  bornS: [54.8, 15.2], bn0: [54.95, 13.8], gd0: [54.95, 19.0], gd1: [54.55, 19.0], gdn: [54.45, 18.85],
  bn1: [56.5, 17.5], bn2: [57.8, 17.8], bn3: [58.9, 19.8], stk: [59.35, 19.4], gf1: [59.6, 21.5], gf2: [59.8, 23.5], hel: [60.1, 24.8],
  gf3: [59.4, 21.5], gr0: [57.9, 20.8], irb: [57.8, 21.7], gr: [57.4, 22.9], rg: [57.1, 24.0], rg2: [56.2, 20.3],
  osf1: [59.0, 10.6], osf2: [59.5, 10.55], osl: [59.75, 10.6],
  /* Atlantik */
  a1: [48.3, -13.0], a2: [46.5, -28.0], a3: [43.8, -46.0], a4: [41.6, -62.0], nyc: [40.45, -73.9], at1: [36.0, -14.0], at2: [38.5, -30.0], at3: [40.5, -48.0],
  nm1: [40.2, -72.0], nm2: [41.8, -66.0], nm3: [42.7, -65.0], nm4: [43.5, -61.5], nm5: [45.5, -58.2], nf1: [45.8, -52.5], cab: [47.4, -59.8], gsl1: [48.7, -62.0], gsl2: [49.3, -65.0],
  sl1: [48.8, -68.5], sl2: [48.2, -69.6], sl3: [47.3, -70.6], sl4: [46.75, -71.2], sl5: [46.3, -72.5], sl6: [45.9, -73.1], mtl: [45.6, -73.5],
  mia: [25.8, -79.9], fl1: [27.5, -79.6], fl2: [30.5, -80.0], sav: [31.95, -80.7], ha1: [33.2, -77.5], ha2: [34.8, -75.1], ny1: [38.0, -73.8],
  /* Mittelmeer */
  alb: [36.3, -2.8], cn: [37.3, -0.3], cna: [38.5, 0.7], val: [39.4, 0.0], vb1: [40.3, 1.2], vb2: [41.0, 2.2], bar: [41.3, 2.25],
  bm1: [42.1, 3.7], bm2: [42.9, 4.5], mar: [43.2, 5.15], mg1: [42.95, 6.5], mg2: [43.5, 8.3], gen: [44.3, 8.95],
  gn1: [43.4, 9.5], gn2: [42.45, 9.75], gn3: [42.0, 11.0], gn4: [41.1, 12.8], gn5: [40.7, 13.6], nap: [40.8, 14.2],
  np1: [39.3, 14.9], mes: [38.2, 15.65], io1: [37.0, 17.0], io2: [36.3, 20.5], mat: [36.2, 23.4], aeg: [36.95, 23.9], sar: [37.6, 23.7],
  md1: [37.4, 2.0], md2: [38.2, 6.5], md3: [37.7, 10.5], md4: [37.3, 11.6], md5: [36.3, 14.0], md6: [35.7, 16.5],
  ae1: [38.0, 24.5], ae2: [39.4, 25.6], ae3: [39.9, 25.9], dd: [40.0, 26.2], dd2: [40.4, 26.7], mm1: [40.7, 27.7], mm2: [40.85, 28.6], ist: [41.0, 28.98],
  bsp: [41.25, 29.15], bs1: [42.5, 29.8], bs2: [43.8, 29.5], cst: [44.15, 28.85],
  cr1: [36.0, 23.5], cr2: [35.0, 23.2], cr3: [34.4, 24.5], cr4: [34.3, 26.5], psa: [33.0, 29.5], psb: [31.5, 32.3],
  /* Suez, Rotes Meer, Golf von Aden, Arabisches Meer */
  sz1: [30.6, 32.35], sz2: [29.9, 32.55], sz3: [28.9, 32.9], sz4: [27.9, 33.7], rs2: [26.5, 34.9], rs3: [24.0, 36.0], rs4: [21.0, 38.0], rs5: [17.8, 40.2], rs6: [15.0, 41.8],
  bab: [12.65, 43.3], gad: [12.0, 46.5], guard: [12.2, 52.6], eaf4: [11.0, 54.0], ar0: [14.5, 57.5], ar1: [19.5, 61.5], ar2: [22.6, 61.0], gom: [24.5, 59.5], gom2: [25.5, 57.2], hz: [26.5, 56.4], jeb: [25.4, 54.8],
  ar3: [18.8, 67.0], mum: [18.8, 72.6], in1: [16.0, 72.0], in2: [11.5, 73.5], ccom: [7.2, 77.4], cmb: [6.93, 79.7], cs1: [5.9, 80.0], cs2: [5.5, 80.8], cs3: [7.5, 82.3], cs4: [10.5, 81.5], che: [13.1, 80.5],
  /* Ostafrika, Indischer Ozean */
  eaf1: [-2.5, 43.2], eaf2: [3.5, 49.0], eaf3: [8.5, 52.2], mom: [-4.1, 39.8], ind1: [-0.5, 50.0], ind2: [3.5, 64.0], ind3: [5.0, 74.0], ccs: [5.4, 78.8],
  mz1: [-8.5, 41.0], mz2: [-14.0, 42.0], mz3: [-19.0, 40.5], mz4: [-25.0, 36.5], mz5: [-28.5, 33.4], dur: [-29.9, 31.2],
  kc: [-34.9, 18.6], ag: [-35.2, 20.0], ag2: [-35.0, 24.0], ag3: [-34.0, 27.0], ag4: [-32.0, 30.0], ag5: [-30.4, 31.4], ktb: [-33.8, 18.3],
  /* Südostasien, Pazifik-Rand */
  pkl: [2.9, 101.2], ml1: [3.5, 100.5], ml2: [2.2, 101.9], ml3: [1.2, 103.3], sin: [1.2, 104.1], ml4: [5.8, 98.5], ml5: [6.0, 95.0],
  sc1: [2.2, 106.0], sc2: [6.0, 108.6], sc3: [10.0, 109.5], sc4: [14.0, 110.0], sc5: [18.0, 111.5], sc6: [20.5, 113.5], hkk: [21.9, 114.3],
  sg1: [-0.5, 106.5], sg2: [0.9, 105.0], gas: [-3.0, 107.2], jk1: [-4.7, 107.2], jak: [-5.9, 106.8], kar: [-3.3, 108.8], js2: [-5.0, 110.0], js1: [-6.0, 114.5], lmb: [-8.8, 115.75],
  tw1: [22.4, 116.3], tw2: [23.8, 118.6], tw3: [25.0, 120.2], tw4: [27.5, 122.0], ec1: [29.5, 123.3], sha: [30.4, 122.7], nbo: [29.95, 122.4],
  ec2: [31.2, 124.0], ec3: [32.4, 126.4], kst1: [33.4, 128.5], kst2: [34.6, 128.8], bus: [35.0, 129.2],
  kyu1: [32.0, 128.6], kyu2: [31.0, 129.5], kyu3: [29.9, 131.0], kyu4: [32.0, 134.0], kyu5: [32.9, 135.6], kii: [33.9, 134.95], osa: [34.5, 135.3], kyu6: [34.0, 138.0], tkb: [34.9, 139.9], tky: [35.1, 139.8],
  pj0: [32.2, 138.0], pj1: [33.5, 142.5], pj2: [38.5, 152.0], pn1: [43.5, 165.0], pn2: [46.5, 180.0], pn3: [49.0, -165.0], pn4: [44.0, -148.0], pn5: [38.0, -132.0], pn7: [50.0, -145.0], pn8: [48.5, -130.0],
  jdf: [48.45, -125.0], jf2: [48.3, -123.7], haro: [48.5, -123.1], ge1: [49.0, -123.3], van: [49.25, -123.3],
  laxi: [33.4, -118.5], lv1: [34.2, -120.8], lv2: [37.5, -123.3], lv3: [43.0, -125.0], lv4: [47.5, -125.2],
  /* Mittelamerika, Südamerika */
  lp1: [31.0, -118.0], lp2: [27.0, -115.9], cabo: [22.0, -110.2], lp3: [19.5, -106.5], lp4: [15.0, -100.0], lp5: [13.5, -93.0], lp6: [11.5, -88.0], lp7: [8.0, -84.5], gp: [7.4, -80.6], bal: [8.85, -79.5],
  cn1: [9.0, -79.6], cn2: [9.2, -79.8], cn3: [9.3, -79.92], col: [9.45, -79.9],
  pe1: [3.0, -81.8], pe2: [-4.0, -82.0], pe3: [-10.0, -79.5], cal: [-12.05, -77.25], pe4: [-20.0, -72.5], pe5: [-30.0, -73.5], pe6: [-40.0, -75.0], pe7: [-50.0, -78.0], pe8: [-56.8, -72.5], horn: [-57.3, -67.5], pe9: [-55.0, -62.0], pe10: [-47.0, -58.0], pe11: [-40.0, -56.0], pe12: [-35.5, -52.0],
  ca1: [11.8, -76.5], ca2: [12.8, -72.0], ca3: [13.5, -68.0], ca4: [13.0, -62.0], ca5: [9.0, -54.5], ca6: [5.0, -49.5], ca7: [2.5, -46.0], ca8: [0.5, -39.5], ca9: [-4.5, -33.5],
  cw1: [18.5, -75.3], cw2: [19.95, -73.85], cw3: [21.3, -72.0], cw4: [24.0, -71.0], cw5: [28.0, -71.5], cw6: [34.0, -72.5],
  c1: [31.5, -12.5], c2: [26.0, -17.5], c3: [19.0, -20.0], c4: [12.0, -23.5], c5: [4.0, -27.5], c6: [-4.0, -30.0], c7: [-10.5, -33.0], c8: [-18.0, -36.0], c9: [-23.5, -41.0], sant: [-24.25, -46.2],
  sa1: [-27.0, -46.0], sa2: [-32.0, -50.0], sa3: [-35.2, -53.0], plata: [-35.4, -56.0], bue: [-35.1, -57.3],
  bk1: [-38.5, -50.0], bk2: [-38.0, -30.0], bk3: [-36.0, -10.0], bk4: [-35.0, 10.0], bk5: [-34.0, 17.0], sk1: [-33.0, -15.0], sk2: [-29.5, -35.0],
  /* Golf von Mexiko */
  hou: [29.2, -94.6], g1: [27.5, -92.0], g2: [28.0, -89.5], g3: [26.0, -86.0], g4: [24.4, -83.0], fkey: [24.0, -81.3], ver: [19.3, -95.9], vg1: [26.0, -95.0], vg2: [22.0, -95.5], yuc: [21.8, -85.9], ca0: [17.0, -84.0], ca00: [13.0, -80.0],
  /* Westafrika */
  cas: [33.65, -7.8], cg1: [35.5, -7.0], cl1: [30.0, -10.5], cl2: [14.0, -19.5], cl3: [9.0, -16.5], cl4: [5.0, -12.0], cl5: [3.5, -6.0], cl6: [3.5, -1.5], cl7: [4.5, 2.5], lag: [6.0, 3.4],
  lg1: [3.5, 3.5], lg2: [-1.5, 7.0], lg3: [-11.0, 10.0], lg4: [-22.0, 12.0], lg5: [-30.0, 15.0], lg6: [-33.0, 17.0],
  /* Australien, Neuseeland */
  fre: [-32.15, 115.4], pw1: [-33.5, 113.0], pw2: [-26.0, 112.5], pw3: [-20.0, 113.0], pw4: [-13.0, 113.5], leeu: [-35.5, 114.5], bi1: [-37.0, 125.0], bi2: [-38.5, 136.0], bass: [-39.3, 143.2], phh: [-38.3, 144.65],
  mb1: [-39.5, 146.3], mb2: [-37.9, 150.3], mb3: [-34.0, 151.6], syd: [-33.85, 151.4],
  ta1: [-33.5, 157.0], ta2: [-33.8, 172.0], ta3: [-34.7, 174.5], ta4: [-36.3, 175.3], auk: [-36.75, 174.85],
  pc1: [-28.0, -178.0], pc2: [-10.0, -158.0], pc3: [8.0, -143.0], pc4: [25.0, -129.0],
  ea1: [-27.0, 154.5], ea2: [-16.0, 150.5], tor: [-10.2, 142.4], ar1w: [-8.8, 136.5], bd1: [-6.5, 129.5], fs1: [-7.0, 124.0], fs2: [-7.4, 119.2],
  io_s1: [-36.0, 95.0], io_s2: [-35.5, 75.0], io_s3: [-34.5, 55.0], io_s4: [-33.0, 40.0], io_s5: [-31.5, 33.0]
};
/* Ketten: aufeinanderfolgende Wegpunkte sind verbunden */
const GEO_LANES = [
  "elb1 brun cux elbm wesm gbi fr1 fr2 fr3 maas bank dov", "wes1 wesm", "brun kc1 kc2 hol kie", "kie fehm", "wsch bank", "sch1 wsch", "fel fe2 maas", "fel bank", "fe2 bank",
  "dov ch1 lh", "ch1 ch2 chw ush", "lh ch2", "ush bis fin po lis sv cad gib", "gib gx at1", "sv at1 at2 at3 a4", "ush a1 a2 a3 a4 nyc", "gbi s3 s2 s1 skm sk",
  "sk gbg", "gbg ka1 ka2 kph ors bal1 r1 ros", "r1 gedser fehm", "ka2 kg3 gb1 gb2 fehm", "bal1 bn0 bornS", "bornS gd0 gd1 gdn", "bornS bn1 bn2 bn3 stk", "bn3 gf1 gf2 hel", "gf1 gf3 gr0 irb gr rg", "bn2 gr0", "rg2 irb", "rg2 gd0",
  "skm osf1 osf2 osl", "sk skm",
  "a3 nf1 cab gsl1 gsl2 sl1 sl2 sl3 sl4 sl5 sl6 mtl", "nyc nm1 nm2 nm3 nm4 nm5 cab", "nf1 nm5",
  "mia fl1 fl2 sav", "sav ha1 ha2 ny1 nyc", "fl2 ha1", "mia cw4 cw5 cw6 nyc", "cw3 cw4", "cw1 cw2 cw3",
  "gib alb cn cna val vb1 vb2 bar bm1 bm2 mar mg1 mg2 gen", "gen gn1 gn2 gn3 gn4 gn5 nap", "nap np1 mes io1 io2 mat aeg sar", "cn md1 md2 md3 md4 md5 md6 io2", "alb md1",
  "aeg ae1 ae2 ae3 dd dd2 mm1 mm2 ist bsp bs1 bs2 cst", "aeg cr1 cr2 cr3 cr4 psa psb sz1 sz2 sz3 sz4 rs2 rs3 rs4 rs5 rs6 bab gad guard eaf4 ar0 ar1 ar2 gom gom2 hz jeb",
  "ar1 ar3 mum in1 in2 ccom cmb", "cmb cs1 cs2 cs3 cs4 che", "cs1 ccs ind3 ind2 ind1 eaf1 mom", "eaf1 eaf2 eaf3 eaf4", "mom mz1 mz2 mz3 mz4 mz5 dur", "ccom cs1",
  "ml4 ml5 cs1", "pkl ml1 ml2 ml3 sin", "pkl ml1 ml4", "sin sc1 sc2 sc3 sc4 sc5 sc6 hkk", "sin sg2 sg1 gas jk1 jak", "sg1 kar js2 js1 lmb", "jk1 js2",
  "hkk tw1 tw2 tw3 tw4 ec1 sha", "nbo ec1", "sha nbo", "sha ec2 ec3 kst1 kst2 bus", "ec3 kyu1 kyu2 kyu3 kyu4 kyu5 kii osa", "kyu5 kyu6 tkb tky", "kyu4 pj0 pj1", "tkb pj1", "kst2 kyu1",
  "pj1 pj2 pn1 pn2 pn3 pn7 pn8 jdf jf2 haro ge1 van", "pn3 pn4 pn5 laxi", "pn7 pn4", "pn8 pn5",
  "laxi lv1 lv2 lv3 lv4 jdf", "laxi lp1 lp2 cabo lp3 lp4 lp5 lp6 lp7 gp bal cn1 cn2 cn3 col", "gp pe1 pe2 pe3 cal pe4 pe5 pe6 pe7 pe8 horn pe9 pe10 pe11 pe12 sa3", "col ca1 ca2 ca3 ca4 ca5 ca6 ca7 ca8 ca9 c7",
  "ca1 cw1", "mia g4", "hou g1 g2 g3 g4 fkey mia", "hou vg1 vg2 ver", "g3 yuc ca0 ca00 col", "ca00 ca1",
  "c1 c2 c3 c4 c5 c6 c7 c8 c9 sant", "sv c1", "gx c1", "c3 cl2 cl3 cl4 cl5 cl6 cl7 lag", "cas cl1 c2", "cas cg1 gib", "sant sa1 sa2 sa3 plata bue", "plata bk1 bk2 bk3 bk4 bk5 ktb", "bk4 kc ktb", "bk3 sa2", "sa2 sk2 c9", "bk3 sk1 bk4",
  "lag lg1 lg2 lg3 lg4 lg5 lg6 ktb", "ktb kc ag ag2 ag3 ag4 ag5 dur", "mz5 ag5",
  "fre pw1 leeu bi1 bi2 bass phh", "pw1 pw2 pw3 pw4 lmb", "phh mb1 mb2 mb3 syd", "syd ta1 ta2 ta3 ta4 auk", "ta4 pc1 pc2 pc3 pc4 laxi", "syd ea1 ea2 tor ar1w bd1 fs1 fs2 js1",
  "fre io_s1 io_s2 io_s3 io_s4 io_s5 dur", "io_s4 mz4", "leeu io_s1"
];
/* Hafen → Wegpunkt */
const GEO_PORT = {
  hamburg: "elb1", bhv: "wes1", rotterdam: "maas", antwerpen: "sch1", lehavre: "lh", felixstowe: "fel", kiel: "kie", rostock: "ros", kopenhagen: "kph", goeteborg: "gbg", oslo: "osl", stockholm: "stk", helsinki: "hel", riga: "rg",
  gdansk: "gdn", lissabon: "lis", algeciras: "gib", valencia: "val", barcelona: "bar", marseille: "mar", genua: "gen", neapel: "nap", piraeus: "sar", istanbul: "ist", constanta: "cst", suez: "psb", nyc: "nyc", montreal: "mtl",
  savannah: "sav", miami: "mia", santos: "sant", jebelali: "jeb", mumbai: "mum", colombo: "cmb", chennai: "che", singapur: "sin", mombasa: "mom", portklang: "pkl", shenzhen: "hkk", hongkong: "hkk", shanghai: "sha",
  ningbo: "nbo", busan: "bus", tokio: "tky", osaka: "osa", jakarta: "jak", lax: "laxi", vancouver: "van", panama: "col", houston: "hou", veracruz: "ver", buenos: "bue", callao: "cal", kapstadt: "ktb", casablanca: "cas",
  lagos: "lag", durban: "dur", melbourne: "phh", sydney: "syd", auckland: "auk", perth: "fre"
};
function geoSeaGraph() {
  if (GEO.sea) return GEO.sea;
  const E = {};
  const link = (a, b) => {
    if (!GEO_WP[a] || !GEO_WP[b]) { if (typeof console !== "undefined") console.warn("Seeweg: Wegpunkt fehlt", a, b); return; }
    const d = geoHav(GEO_WP[a], GEO_WP[b]);
    (E[a] = E[a] || []).push([b, d]); (E[b] = E[b] || []).push([a, d]);
  };
  GEO_LANES.forEach(s => { const c = s.split(" "); for (let i = 1; i < c.length; i++) link(c[i - 1], c[i]); });
  return (GEO.sea = E);
}
function geoSeaPath(from, to) {                      /* Wegpunktfolge (Namen) von Wegpunkt zu Wegpunkt */
  const E = geoSeaGraph(), dist = {}, prev = {}, done = {};
  dist[from] = 0;
  for (;;) {
    let u = null, du = Infinity;
    for (const k in dist) if (!done[k] && dist[k] < du) { du = dist[k]; u = k; }
    if (u === null || u === to) break;
    done[u] = 1;
    (E[u] || []).forEach(([v, d]) => { if (du + d < (dist[v] === undefined ? Infinity : dist[v])) { dist[v] = du + d; prev[v] = u; } });
  }
  if (dist[to] === undefined) return null;
  const out = [to]; while (out[0] !== from) out.unshift(prev[out[0]]);
  return out;
}
function geoSea(a, b) {
  const ia = geoIdOf(a), ib = geoIdOf(b);
  const wa = ia && GEO_PORT[ia] ? GEO_PORT[ia] : geoNearWp(a), wb = ib && GEO_PORT[ib] ? GEO_PORT[ib] : geoNearWp(b);
  const path = geoSeaPath(wa, wb);
  if (!path) return null;
  return [a.slice()].concat(path.map(n => GEO_WP[n].slice()), [b.slice()]);
}
function geoNearWp(p) { let best = null, bd = Infinity; for (const k in GEO_WP) { const d = geoHav(p, GEO_WP[k]); if (d < bd) { bd = d; best = k; } } return best; }

/* ------------------------------ Binnenwasser ------------------------------ */
const GEO_RIVER = {
  "b-westh>bbg": [[52.53, 13.2], [52.47, 13.17], [52.42, 13.12], [52.4, 13.0], [52.37, 12.92], [52.36, 12.7], [52.4, 12.6]],
  "bbg>magdeburg": [[52.41, 12.45], [52.4, 12.15], [52.27, 11.86], [52.18, 11.7]],
  "magdeburg>hamburg": [[52.3, 11.7], [52.54, 11.95], [52.8, 11.85], [52.99, 11.76], [53.14, 11.25], [53.37, 10.55], [53.45, 10.2]],
  "magdeburg>hannover": [[52.18, 11.2], [52.3, 10.9], [52.42, 10.75], [52.35, 10.3], [52.4, 9.95]],
  "hannover>bremen": [[52.4, 9.5], [52.55, 9.3], [52.8, 9.15], [52.93, 9.0]],
  "hannover>duisburg": [[52.4, 9.4], [52.3, 8.9], [52.35, 8.4], [52.37, 7.9], [52.28, 7.45], [51.97, 7.6], [51.65, 7.35], [51.53, 7.1], [51.45, 6.8]],
  "duisburg>dortmund": [[51.5, 7.0], [51.54, 7.25]],
  "duisburg>rotterdam": [[51.6, 6.6], [51.76, 6.4], [51.84, 6.2], [51.85, 5.9], [51.88, 5.4], [51.83, 5.0], [51.82, 4.65], [51.9, 4.4]],
  "duisburg>antwerpen": [[51.6, 6.6], [51.76, 6.4], [51.85, 5.9], [51.85, 5.4], [51.8, 4.8], [51.7, 4.5], [51.55, 4.3], [51.4, 4.3]],
  "duisburg>koeln": [[51.22, 6.75], [51.05, 6.95]],
  "koeln>mannheim": [[50.73, 7.1], [50.36, 7.6], [50.2, 7.7], [49.97, 7.9], [50.0, 8.27], [49.82, 8.4], [49.63, 8.37]],
  "mannheim>frankfurt": [[49.63, 8.37], [49.99, 8.3], [50.04, 8.45], [50.1, 8.6]],
  "frankfurt>nuernberg": [[50.1, 8.9], [49.97, 9.15], [49.7, 9.3], [49.79, 9.93], [50.05, 10.23], [49.89, 10.9], [49.6, 11.0]],
  "nuernberg>wien": [[49.1, 11.45], [48.92, 11.87], [49.02, 12.1], [48.83, 12.96], [48.57, 13.45], [48.3, 14.3], [48.23, 15.33], [48.4, 15.6], [48.22, 16.4]],
  "wien>budapest": [[48.14, 17.1], [47.75, 18.1], [47.8, 18.75]],
  "budapest>constanta": [[46.95, 18.95], [46.0, 18.7], [45.35, 19.0], [45.25, 19.85], [44.8, 20.45], [44.67, 22.5], [44.0, 22.9], [43.75, 24.9], [43.85, 25.95], [44.1, 27.25], [44.33, 28.03], [44.2, 28.4]],
  "b-westh>schwedt": [[52.6, 13.28], [52.7, 13.23], [52.75, 13.25], [52.77, 13.5], [52.83, 13.8], [52.88, 14.14]],
  "paris>lehavre": [[48.93, 2.05], [49.0, 1.7], [49.09, 1.48], [49.3, 1.2], [49.44, 1.09], [49.52, 0.75], [49.47, 0.45], [49.45, 0.2]],
  "lyon>marseille": [[45.5, 4.8], [44.93, 4.88], [44.4, 4.7], [43.95, 4.8], [43.68, 4.63], [43.4, 4.85], [43.38, 5.1]],
  "wuhan>shanghai": [[30.2, 115.0], [29.75, 116.0], [30.5, 117.05], [30.95, 117.8], [31.35, 118.4], [32.05, 118.75], [32.2, 119.45], [31.95, 120.3], [31.75, 121.2], [31.45, 121.9], [31.0, 122.3]]
};
function geoRiver(a, b) {
  const ia = geoIdOf(a), ib = geoIdOf(b); if (!ia || !ib) return null;
  let v = GEO_RIVER[ia + ">" + ib], rev = false;
  if (!v) { v = GEO_RIVER[ib + ">" + ia]; rev = true; }
  if (!v) return null;
  const m = v.map(p => p.slice()); if (rev) m.reverse();
  return [a.slice()].concat(m, [b.slice()]);
}

/* ---------------------- Knoten-Koordinate → Kennung ----------------------- */
function geoIdOf(p) {
  if (!GEO.ids) {
    GEO.ids = new Map();
    if (typeof N !== "undefined") Object.keys(N).forEach(id => GEO.ids.set(geoPk([N[id].lat, N[id].lon]), id));
  }
  return GEO.ids.get(geoPk(p)) || null;
}

/* ------------------------- Straße / Schiene / Rad -------------------------- */
function geoWant(a, b, mode) {
  const key = geoKey(a, b, mode);
  if (GEO.pend.has(key)) return;
  const f = GEO.failAt.get(key); if (f && Date.now() - f < 5 * 60e3) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  if (!GEO.ok) return;
  GEO.pend.add(key);
  GEO.q.push({ key, a: geoFwd(a, b) ? a : b, b: geoFwd(a, b) ? b : a, mode });
  geoPump();
}
function geoPump() {
  if (GEO.busy || !GEO.q.length) return;
  GEO.busy = true;
  const job = GEO.q.shift();
  geoFetch(job).then(pts => {
    if (pts) { GEO.mem.set(job.key, pts); GEO.ver++; geoSave(); } else GEO.failAt.set(job.key, Date.now());
  }).catch(() => { GEO.failAt.set(job.key, Date.now()); }).then(() => {
    GEO.pend.delete(job.key); GEO.busy = false;
    setTimeout(geoPump, 350);
  });
}
async function geoFetch(job) {
  if (typeof fetch === "undefined") return null;
  const hosts = job.mode === "b" ? GEO_HOSTS.bike : GEO_HOSTS.car;
  const co = job.a[1].toFixed(5) + "," + job.a[0].toFixed(5) + ";" + job.b[1].toFixed(5) + "," + job.b[0].toFixed(5);
  for (const h of hosts) {
    try {
      const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const to = ctl ? setTimeout(() => ctl.abort(), 20000) : 0;
      const r = await fetch(h + co + "?overview=full&geometries=geojson&alternatives=false&steps=false", ctl ? { signal: ctl.signal } : {});
      clearTimeout(to);
      if (!r.ok) continue;
      const j = await r.json();
      const rt = j && j.routes && j.routes[0];
      if (!rt || !rt.geometry || !rt.geometry.coordinates || rt.geometry.coordinates.length < 2) continue;
      let pts = rt.geometry.coordinates.map(c => [c[1], c[0]]);
      const straight = geoHav(job.a, job.b), len = geoLen(pts);
      /* nur sinnvolle Wege: nicht viel kürzer, nicht endlos Umweg, Start/Ziel nah am Wunschpunkt */
      if (len < straight * 0.92 || len > straight * 2.6 + 4) continue;
      if (geoHav(pts[0], job.a) > 6 || geoHav(pts[pts.length - 1], job.b) > 6) continue;
      pts = geoSimplify(pts, straight > 200 ? 0.0012 : 0.0005);
      pts = [job.a.slice()].concat(pts, [job.b.slice()]);
      return pts;
    } catch (e) { /* nächster Dienst */ }
  }
  return null;
}

/* ------------------------------ Teilstrecke ------------------------------- */
/* Linie von a nach b für die Fahrart mode (r l b d s i a) – oder null: gerade Linie.
   „d“ = Tür-Strecke (Straße). Gespeichert wird je Schlüssel in der Richtung klein→groß. */
function geoSeg(a, b, mode) {
  const door = mode === "d";
  if (door) mode = "r";
  const straight = geoHav(a, b);
  if (straight < (door ? 2 : 0.4) || !mode) return null;
  const key = geoKey(a, b, mode), fwd = geoFwd(a, b);
  let pts = GEO.mem.get(key);
  if (!pts) {
    let made = null;
    if (mode === "a") made = geoArc(a, b);
    else if (mode === "s") made = geoSea(a, b);
    else if (mode === "i") made = geoRiver(a, b);
    else if (mode === "r" || mode === "l" || mode === "b") { if (straight >= 0.8) geoWant(a, b, mode); return null; }
    if (!made) return null;
    pts = fwd ? made : made.slice().reverse();
    GEO.mem.set(key, pts);
  }
  return fwd ? pts : pts.slice().reverse();
}

/* ------------------------------ ganze Strecke ------------------------------ */
const GEOC = new WeakMap();
/* pts: Liste von [lat, lon] mit pts.gm = Fahrart je Teilstück (Länge n-1) → dichte Linie */
function geoDisp(pts) {
  if (!pts || !pts.gm || pts.length < 2) return pts;
  const c = GEOC.get(pts);
  if (c && c.ver === GEO.ver) return c.out;
  let out = [pts[0]], changed = false;
  for (let i = 1; i < pts.length; i++) {
    const seg = geoSeg(pts[i - 1], pts[i], pts.gm[i - 1]);
    if (seg && seg.length > 2) { for (let k = 1; k < seg.length; k++) out.push(seg[k]); changed = true; }
    else out.push(pts[i]);
  }
  if (!changed) out = pts; else out = geoUnwrap(out);
  GEOC.set(pts, { ver: GEO.ver, out });
  return out;
}
/* Anzeige-Linie: Weg, danach (rund um den Hof) die Hofstraßen */
function geoLine(pts) {
  const d = geoDisp(pts);
  return typeof roadDisp === "function" ? roadDisp(d) : d;
}
/* Fahrzeugposition: gleicher Anteil der Strecke auf der Anzeige-Linie wie auf der Luftlinie */
const GEOP = new WeakMap();
function geoDispAt(route, pos) {
  if (!route || route.length < 2) return null;
  const D = geoLine(route);
  if (!D || D === route) return null;
  let c = GEOP.get(route);
  if (!c || c.D !== D) {
    const cum = [0]; for (let i = 1; i < D.length; i++) cum.push(cum[i - 1] + geoHav(D[i - 1], D[i]));
    c = { D, cum, len: cum[cum.length - 1], tot: geoLen(route) }; GEOP.set(route, c);
  }
  if (!c.len || !c.tot) return null;
  const t = Math.max(0, Math.min(1, pos / c.tot)) * c.len, cum = c.cum;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= t) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo], f = seg > 0 ? (t - cum[lo]) / seg : 0;
  return [c.D[lo][0] + (c.D[hi][0] - c.D[lo][0]) * f, c.D[lo][1] + (c.D[hi][1] - c.D[lo][1]) * f];
}
if (typeof window !== "undefined") geoLoad();
