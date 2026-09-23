/* =========================================================================
   LOGISTIKA – Adressen
   Jeder Auftrag hat einen Auftraggeber mit eigener Adresse: abgeholt und
   zugestellt wird dort, nicht an einem festen Punkt mitten im Stadtteil.
   Die Knoten aus data.js bleiben das Verkehrsnetz; die Adressen liegen um
   sie herum. Fahrzeuge fahren die letzten Meter von der Adresse zum Netz
   und zurück und parken nach der Zustellung dort, wo sie abgeladen haben.

   Adresse = { lat, lon, t: "Torstraße 118", a: "Mitte" }
   ========================================================================= */
"use strict";

/* Berlin: echte Straßen je Stadtteil, Koordinaten auf der Straße */
const BERLIN_STREETS = {
  "b-mitte": [
    ["Torstraße", 52.5290, 13.3985], ["Rosenthaler Straße", 52.5262, 13.4020], ["Oranienburger Straße", 52.5245, 13.3945],
    ["Friedrichstraße", 52.5185, 13.3885], ["Invalidenstraße", 52.5305, 13.3845], ["Brunnenstraße", 52.5335, 13.3985],
    ["Alte Schönhauser Straße", 52.5270, 13.4080], ["Karl-Liebknecht-Straße", 52.5235, 13.4095], ["Leipziger Straße", 52.5100, 13.3925],
    ["Rungestraße", 52.5130, 13.4180], ["Chausseestraße", 52.5300, 13.3840], ["Linienstraße", 52.5275, 13.4000]
  ],
  "b-kreuz": [
    ["Oranienstraße", 52.5010, 13.4170], ["Bergmannstraße", 52.4895, 13.3935], ["Wiener Straße", 52.4980, 13.4310],
    ["Skalitzer Straße", 52.4995, 13.4230], ["Gneisenaustraße", 52.4910, 13.3985], ["Yorckstraße", 52.4925, 13.3790],
    ["Adalbertstraße", 52.5025, 13.4190], ["Wrangelstraße", 52.5010, 13.4400], ["Mehringdamm", 52.4935, 13.3880],
    ["Ritterstraße", 52.5030, 13.4080], ["Graefestraße", 52.4930, 13.4180]
  ],
  "b-pberg": [
    ["Kastanienallee", 52.5375, 13.4090], ["Schönhauser Allee", 52.5445, 13.4125], ["Danziger Straße", 52.5395, 13.4190],
    ["Prenzlauer Allee", 52.5385, 13.4235], ["Kollwitzstraße", 52.5360, 13.4170], ["Stargarder Straße", 52.5480, 13.4185],
    ["Pappelallee", 52.5450, 13.4160], ["Knaackstraße", 52.5365, 13.4195], ["Winsstraße", 52.5340, 13.4260],
    ["Lychener Straße", 52.5440, 13.4185]
  ],
  "b-char": [
    ["Kantstraße", 52.5055, 13.3130], ["Kurfürstendamm", 52.5015, 13.3180], ["Wilmersdorfer Straße", 52.5080, 13.3060],
    ["Otto-Suhr-Allee", 52.5155, 13.3110], ["Kaiserdamm", 52.5105, 13.2880], ["Bismarckstraße", 52.5120, 13.3060],
    ["Schloßstraße", 52.5160, 13.2960], ["Mommsenstraße", 52.5040, 13.3080], ["Leibnizstraße", 52.5070, 13.3165],
    ["Richard-Wagner-Straße", 52.5150, 13.3065], ["Knobelsdorffstraße", 52.5145, 13.2900]
  ],
  "b-span": [
    ["Carl-Schurz-Straße", 52.5372, 13.2035], ["Klosterstraße", 52.5345, 13.1985], ["Breite Straße", 52.5378, 13.2065],
    ["Seegefelder Straße", 52.5390, 13.1910], ["Neuendorfer Straße", 52.5445, 13.2045], ["Brunsbütteler Damm", 52.5320, 13.1820],
    ["Schönwalder Straße", 52.5430, 13.1990], ["Moritzstraße", 52.5352, 13.2010]
  ],
  "b-tempel": [
    ["Tempelhofer Damm", 52.4700, 13.3855], ["Alt-Tempelhof", 52.4660, 13.3840], ["Manfred-von-Richthofen-Straße", 52.4755, 13.3810],
    ["Friedrich-Karl-Straße", 52.4630, 13.3790], ["Colditzstraße", 52.4595, 13.3720], ["Bessemerstraße", 52.4625, 13.3650],
    ["Ringbahnstraße", 52.4690, 13.3750], ["Kaiserin-Augusta-Straße", 52.4630, 13.3850]
  ],
  "b-licht": [
    ["Frankfurter Allee", 52.5140, 13.4870], ["Möllendorffstraße", 52.5200, 13.4825], ["Weitlingstraße", 52.5085, 13.5005],
    ["Siegfriedstraße", 52.5195, 13.4985], ["Herzbergstraße", 52.5245, 13.4960], ["Rhinstraße", 52.5130, 13.5205],
    ["Josef-Orlopp-Straße", 52.5255, 13.4790], ["Alt-Friedrichsfelde", 52.5085, 13.5150]
  ],
  "b-neu": [
    ["Karl-Marx-Straße", 52.4810, 13.4385], ["Sonnenallee", 52.4800, 13.4440], ["Hermannstraße", 52.4790, 13.4250],
    ["Weserstraße", 52.4865, 13.4330], ["Flughafenstraße", 52.4815, 13.4285], ["Pannierstraße", 52.4880, 13.4335],
    ["Richardstraße", 52.4745, 13.4455], ["Boddinstraße", 52.4800, 13.4300], ["Harzer Straße", 52.4870, 13.4430]
  ],
  "b-marz": [
    ["Marzahner Promenade", 52.5425, 13.5500], ["Märkische Allee", 52.5480, 13.5650], ["Landsberger Allee", 52.5410, 13.5350],
    ["Raoul-Wallenberg-Straße", 52.5505, 13.5530], ["Mehrower Allee", 52.5570, 13.5600], ["Allee der Kosmonauten", 52.5340, 13.5500],
    ["Bitterfelder Straße", 52.5400, 13.5230], ["Blumberger Damm", 52.5480, 13.5880]
  ],
  "b-steg": [
    ["Schloßstraße", 52.4575, 13.3215], ["Albrechtstraße", 52.4540, 13.3290], ["Birkbuschstraße", 52.4480, 13.3300],
    ["Grunewaldstraße", 52.4590, 13.3170], ["Steglitzer Damm", 52.4500, 13.3400], ["Filandastraße", 52.4555, 13.3250],
    ["Hindenburgdamm", 52.4440, 13.3160]
  ]
};

/* Auftraggeber, deren Name schon verrät, wo sie sitzen: dort wird abgeholt.
   [Netzknoten, Straße, lat, lon] */
const SHIPPER_HOME = {
  "Apotheke am Rosenthaler Platz": ["b-mitte", "Rosenthaler Platz", 52.5297, 13.4013],
  "Charité Logistikzentrum": ["b-mitte", "Charitéplatz", 52.5255, 13.3775],
  "Notariat Friedrichstraße": ["b-mitte", "Friedrichstraße", 52.5185, 13.3885],
  "Fahrradwerkstatt Kreuzberg": ["b-kreuz", "Oranienstraße", 52.5010, 13.4170],
  "Fotolabor Prenzlauer Berg": ["b-pberg", "Kastanienallee", 52.5375, 13.4090],
  /* Wertsachen (JEWEL_JOBS) */
  "Juwelier am Kurfürstendamm": ["b-char", "Kurfürstendamm", 52.5024, 13.3255],
  "Uhrmacherwerkstatt Friedrichstraße": ["b-mitte", "Friedrichstraße", 52.5160, 13.3888],
  "Goldschmiede Hackesche Höfe": ["b-mitte", "Rosenthaler Straße", 52.5245, 13.4022],
  "Auktionshaus Fasanenstraße": ["b-char", "Fasanenstraße", 52.5008, 13.3285],
  "Münzhandlung am Gendarmenmarkt": ["b-mitte", "Markgrafenstraße", 52.5140, 13.3935],
  "Perlenhaus Prenzlauer Berg": ["b-pberg", "Kastanienallee", 52.5385, 13.4095],
  "Pfandleihhaus Karl-Marx-Straße": ["b-neu", "Karl-Marx-Straße", 52.4800, 13.4380],
  "Diamantschleiferei Kreuzberg": ["b-kreuz", "Ritterstraße", 52.5035, 13.4070],
  "Luxuskaufhaus am Tauentzien": ["b-char", "Tauentzienstraße", 52.5015, 13.3400],
  "Privatbank am Gendarmenmarkt": ["b-mitte", "Jägerstraße", 52.5145, 13.3920]
};
function shipperHome(name) {
  const h = SHIPPER_HOME[name];
  if (!h) return null;
  const p = jitter(h[2], h[3], 40);
  return { node: h[0], addr: { lat: +p[0].toFixed(5), lon: +p[1].toFixed(5), t: h[1] + " " + rint(1, 90), a: areaName(h[0]) } };
}

/* Wohnsiedlungen am Stadtrand – hier wohnt die Kundschaft von Mr. Snus.
   [Straße, lat, lon, Netzknoten, Gegend] */
const BERLIN_ESTATES = [
  ["Marzahner Promenade", 52.5428, 13.5480, "b-marz", "Marzahn"],
  ["Mehrower Allee", 52.5570, 13.5560, "b-marz", "Marzahn-Nord"],
  ["Hellersdorfer Straße", 52.5370, 13.6080, "b-marz", "Hellersdorf"],
  ["Stendaler Straße", 52.5335, 13.6040, "b-marz", "Hellersdorf"],
  ["Lipschitzallee", 52.4247, 13.4629, "b-neu", "Gropiusstadt"],
  ["Wutzkyallee", 52.4231, 13.4745, "b-neu", "Gropiusstadt"],
  ["Fritz-Erler-Allee", 52.4265, 13.4580, "b-neu", "Gropiusstadt"],
  ["Sonnenallee", 52.4690, 13.4620, "b-neu", "High-Deck-Siedlung"],
  ["Wilhelmsruher Damm", 52.6000, 13.3590, "b-westh", "Märkisches Viertel"],
  ["Senftenberger Ring", 52.5975, 13.3500, "b-westh", "Märkisches Viertel"],
  ["Falkenseer Chaussee", 52.5530, 13.1720, "b-span", "Falkenhagener Feld"],
  ["Obstallee", 52.5300, 13.1420, "b-span", "Staaken"],
  ["Zingster Straße", 52.5720, 13.4990, "b-licht", "Neu-Hohenschönhausen"],
  ["Falkenberger Chaussee", 52.5690, 13.5080, "b-licht", "Neu-Hohenschönhausen"],
  ["Celsiusstraße", 52.4160, 13.3090, "b-steg", "Lichterfelde-Süd"]
];

/* Großwohnsiedlungen am Rand anderer Städte – dort übergibt Don Pablos
   Kundschaft. Wo nichts eingetragen ist, gibt es eine Siedlung am Ring. */
const CITY_ESTATES = {
  leipzig: [["Grünau", 51.3190, 12.2830], ["Paunsdorf", 51.3450, 12.4500]],
  dresden: [["Gorbitz", 51.0450, 13.6570], ["Prohlis", 51.0040, 13.7960]],
  halle: [["Halle-Neustadt", 51.4850, 11.9130], ["Silberhöhe", 51.4450, 11.9600]],
  potsdam: [["Am Schlaatz", 52.3790, 13.0850], ["Drewitz", 52.3530, 13.1250]],
  cottbus: [["Sachsendorf", 51.7340, 14.3380]],
  ebw: [["Brandenburgisches Viertel", 52.8430, 13.7650]],
  bremen: [["Tenever", 53.0500, 8.9470], ["Kattenturm", 53.0350, 8.8150]],
  hannover: [["Sahlkamp", 52.4150, 9.7800], ["Mühlenberg", 52.3350, 9.6980]],
  dortmund: [["Scharnhorst", 51.5450, 7.5350], ["Clarenberg", 51.4750, 7.5230]],
  koeln: [["Chorweiler", 51.0280, 6.8960], ["Finkenberg", 50.8750, 7.0500]],
  frankfurt: [["Nordweststadt", 50.1590, 8.6330], ["Ben-Gurion-Ring", 50.1800, 8.6630]],
  stuttgart: [["Fasanenhof", 48.7130, 9.1650], ["Neugereut", 48.8200, 9.2550]],
  nuernberg: [["Langwasser", 49.4050, 11.1400]],
  muenchen: [["Neuperlach", 48.1000, 11.6450], ["Hasenbergl", 48.2150, 11.5580]],
  saarbr: [["Folsterhöhe", 49.2150, 6.9630]],
  paris: [["La Courneuve", 48.9270, 2.3960], ["Clichy-sous-Bois", 48.9110, 2.5460]],
  lyon: [["Les Minguettes", 45.7050, 4.8750]],
  bruessel: [["Peterbos", 50.8350, 4.2970]],
  madrid: [["Vallecas", 40.3800, -3.6500]],
  milano: [["Quarto Oggiaro", 45.5160, 9.1350]],
  rom: [["Tor Bella Monaca", 41.8680, 12.6600]],
  zuerich: [["Schwamendingen", 47.4050, 8.5700]],
  wien: [["Großfeldsiedlung", 48.2700, 16.4300]],
  praha: [["Jižní Město", 50.0300, 14.5100]],
  warschau: [["Bródno", 52.2950, 21.0300]],
  budapest: [["Csepel", 47.4200, 19.0700]],
  bukarest: [["Ferentari", 44.4050, 26.0700]],
  london: [["Thamesmead", 51.5010, 0.1150]],
  manchester: [["Wythenshawe", 53.3850, -2.2650]],
  moskau: [["Kapotnja", 55.6380, 37.8000]]
};

/* Deutschsprachige Knoten bekommen Straßennamen, alle anderen
   Gewerbegebiete – das Spiel ist deutsch, die Welt nicht überall. */
const GERMAN_NODES = new Set(["potsdam", "cottbus", "ebw", "leipzig", "dresden", "halle", "bremen", "hannover", "dortmund",
  "koeln", "frankfurt", "stuttgart", "nuernberg", "muenchen", "saarbr", "wien", "zuerich"]);
const GENERIC_STREETS = ["Industriestraße", "Hafenstraße", "Bahnhofstraße", "Robert-Bosch-Straße", "Carl-Benz-Straße",
  "Siemensstraße", "Gutenbergstraße", "Am Gewerbepark", "Lindenstraße", "Hauptstraße", "Otto-Hahn-Straße",
  "Daimlerstraße", "Rudolf-Diesel-Straße", "Werkstraße", "Marktstraße", "Kantstraße", "Friedrich-Ebert-Straße"];
const GENERIC_ZONES = ["Industriepark Nord", "Gewerbegebiet Ost", "Logistikpark Süd", "Gewerbegebiet West",
  "Handelszentrum", "Innenstadt, Lieferzone", "Technologiepark", "Großmarkt"];
const FACILITY_SPOTS = {
  port: ["Kai {n}", "Terminal Nord, Tor {n}", "Terminal Süd, Tor {n}", "Schuppen {n}", "Lagerhalle {n}", "Liegeplatz {n}"],
  air:  ["Cargo City Süd, Halle {n}", "Cargo City Nord, Tor {n}", "Frachtterminal {n}", "Luftfrachtzentrum, Rampe {n}"],
  rail: ["Umschlaganlage, Gleis {n}", "Kombiterminal, Modul {n}", "Güterbahnhof, Rampe {n}", "Containerterminal, Kran {n}"]
};
const ESTATE_BLOCKS = ["Block {n}", "Haus {n}", "Aufgang {n}", "Nr. {n}"];

function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function rpick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
/* Punkt in zufälliger Richtung, Abstand in km */
function offsetKm(lat, lon, km, ang) {
  const a = ang == null ? Math.random() * Math.PI * 2 : ang;
  return [lat + (km * Math.cos(a)) / 111.32, lon + (km * Math.sin(a)) / (111.32 * Math.max(0.2, Math.cos(lat * Math.PI / 180)))];
}
/* Wenige Meter hin und her, damit nicht jede Hausnummer auf demselben Punkt liegt */
function jitter(lat, lon, m) { return offsetKm(lat, lon, (Math.random() * m) / 1000); }
function areaName(id) {
  const n = N[id];
  return n ? n.short : "";
}

/* Neue Adresse im Einzugsgebiet eines Netzknotens.
   kind: "biz" Firma (Standard) · "home" Wohnung am Stadtrand · "office"
         eigenes Büro · "yard" Stellplatz · "spaeti" · "hangar"          */
function makeAddr(nodeId, kind) {
  const n = N[nodeId];
  if (!n) return null;
  kind = kind || "biz";
  if (kind === "home") return makeHomeAddr(nodeId);
  let p, t;
  const streets = BERLIN_STREETS[nodeId];
  if (streets) {
    const s = rpick(streets);
    p = jitter(s[1], s[2], 70);
    t = s[0] + " " + rint(1, 160);
  } else if (n.type !== "city" && FACILITY_SPOTS[n.type]) {
    p = offsetKm(n.lat, n.lon, 0.15 + Math.random() * 0.3);
    t = rpick(FACILITY_SPOTS[n.type]).replace("{n}", rint(1, 24));
  } else if (GERMAN_NODES.has(nodeId)) {
    p = offsetKm(n.lat, n.lon, 0.6 + Math.random() * 2.8);
    t = rpick(GENERIC_STREETS) + " " + rint(1, 180);
  } else {
    p = offsetKm(n.lat, n.lon, 0.6 + Math.random() * 3.2);
    t = rpick(GENERIC_ZONES) + ", Halle " + rint(1, 30);
  }
  if (kind === "spaeti") t = "Späti, " + t;
  else if (kind === "hangar") t = n.type === "air" ? "Hangar " + rint(3, 9) + ", Cargo City Süd" : "Lagerhalle " + rint(3, 9) + ", " + t;
  else if (kind === "yard") t = "Stellplatz, " + t;
  return { lat: +p[0].toFixed(5), lon: +p[1].toFixed(5), t, a: areaName(nodeId) };
}
/* Wohnung in einer Siedlung am Rand der Stadt des Knotens */
function makeHomeAddr(nodeId) {
  const n = N[nodeId];
  const list = CITY_ESTATES[nodeId];
  if (list) {
    const e = rpick(list), p = jitter(e[1], e[2], 180);
    return { lat: +p[0].toFixed(5), lon: +p[1].toFixed(5), t: rpick(ESTATE_BLOCKS).replace("{n}", rint(1, 40)) + ", " + e[0], a: n.short };
  }
  const p = offsetKm(n.lat, n.lon, 4 + Math.random() * 4);
  return { lat: +p[0].toFixed(5), lon: +p[1].toFixed(5),
    t: rpick(["Hochhaussiedlung", "Wohnpark am Stadtrand", "Siedlung am Ring", "Plattenbausiedlung"]) + ", " + rpick(ESTATE_BLOCKS).replace("{n}", rint(1, 40)),
    a: n.short };
}
/* Berliner Siedlung am Stadtrand in Reichweite eines Knotens: { node, addr } */
function berlinEstate(fromId, maxKm) {
  const f = N[fromId];
  if (!f) return null;
  const cands = BERLIN_ESTATES.filter(e => N[e[3]] && N[e[3]].stage <= S.stage && e[3] !== fromId
    && hav([f.lat, f.lon], [e[1], e[2]]) < (maxKm || 30));
  if (!cands.length) return null;
  const e = rpick(cands), p = jitter(e[1], e[2], 160);
  return { node: e[3], addr: { lat: +p[0].toFixed(5), lon: +p[1].toFixed(5), t: e[0] + " " + rint(1, 180), a: e[4] } };
}
/* Adresse in der Nähe eines Punkts (Anschlussauftrag nebenan) */
function addrNear(nodeId, lat, lon, km) {
  const a = makeAddr(nodeId);
  if (!a) return null;
  /* weit genug weg, dass Nadel und Fahrzeug sich auf der Karte nicht verdecken,
     nah genug, dass es noch „vor Ort“ ist (unter 500 m) */
  const p = offsetKm(lat, lon, km == null ? 0.2 + Math.random() * 0.2 : km);
  a.lat = +p[0].toFixed(5); a.lon = +p[1].toFixed(5);
  return a;
}
function addrText(a, withArea) {
  if (!a) return "";
  return withArea && a.a ? a.t + ", " + a.a : a.t;
}
function addrPt(a) { return [a.lat, a.lon]; }
