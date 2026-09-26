/* =========================================================================
   LOGISTIKA – Standorte, Personal und Telefon

   Ein Standort ist ein gemietetes oder gekauftes Büro an einem erschlossenen
   Knoten. Wer dort Personal einstellt und Fahrzeuge zuordnet, lässt den
   Betrieb von selbst laufen: die Disposition nimmt Aufträge an, der Umschlag
   verkürzt Lade- und Löschzeiten, das Fahrpersonal bestimmt, wie viele
   Fahrzeuge gleichzeitig unterwegs sein können, Zoll & Papiere bringen einen
   Servicezuschlag.

   Teams reiben sich aneinander, wenn die Arbeit schlecht verteilt ist:
   zu viele Fahrzeuge auf zu wenige Fahrer, eine Rolle, die alles allein
   stemmt, kein Ausgleich im Schichtplan. Dann meldet sich das Telefon.
   ========================================================================= */
"use strict";

/* ------------------------------ Bürotypen ------------------------------- */
const OFFICE_TIERS = [
  { id: "kontor", name: "Kontor", icon: "🗄️",
    desks: 3, slots: 4, reach: 90, buy: 28000, rent: 48,
    info: "Zwei Schreibtische, ein Drucker, viel Kaffee." },
  { id: "halle", name: "Umschlaghalle", icon: "🏭",
    desks: 6, slots: 12, reach: 800, buy: 145000, rent: 235,
    info: "Vier Tore, ein Stapler, eigene Disposition." },
  { id: "zentrum", name: "Logistikzentrum", icon: "🏢",
    desks: 12, slots: 30, reach: 6000, buy: 620000, rent: 980,
    info: "Eigenes Terminal, Zollabfertigung, Nachtschicht." },
  /* Mehrere Etagen: je Etage bis zu zwölf Plätze, Empfang, Prestige */
  { id: "gebaeude", name: "Bürogebäude", icon: "🏬", floors: 2, st: 2, prestige: 0.03, comfort: 4,
    desks: 24, slots: 60, reach: 15000, buy: 2400000, rent: 3600,
    info: "Zwei Etagen, Empfang, Konferenzraum – ein echter Firmensitz. +3 % Prestige auf jeden Auftrag." },
  { id: "tower", name: "Konzernzentrale", icon: "🏙️", floors: 3, st: 4, prestige: 0.06, comfort: 8,
    desks: 36, slots: 100, reach: 40000, buy: 9500000, rent: 13000,
    info: "Drei Etagen mit Blick über die Stadt, Kantine, Vorstandsetage. +6 % Prestige auf jeden Auftrag." }
];
const tierFloors = t => t.floors || 1;
const perFloor = t => Math.ceil(t.desks / tierFloors(t));
const tierOpen = t => (t.st || 1) <= S.stage;

/* ------------------------------- Rollen --------------------------------- */
const ROLES = {
  disp: { key: "disp", name: "Disposition", icon: "🗂️", wage: 168,
          info: "Nimmt Ausschreibungen selbstständig an." },
  fahr: { key: "fahr", name: "Fahrpersonal", icon: "🧑‍✈️", wage: 152,
          info: "Bestimmt, wie viele Fahrzeuge gleichzeitig rollen." },
  ums:  { key: "ums",  name: "Umschlag", icon: "📦", wage: 134,
          info: "Verkürzt Lade- und Löschzeiten am Standort." },
  zoll: { key: "zoll", name: "Zoll & Papiere", icon: "📑", wage: 186,
          info: "Bringt einen Servicezuschlag auf jeden Auftrag." }
};
const ROLE_KEYS = ["disp", "fahr", "ums", "zoll"];

/* Eine Halle in Rotterdam kostet nicht so viel wie eine in Steglitz: der
   Preis richtet sich nach Etappe und Art des Knotens. */
const SITE_STAGE = [0.55, 0.74, 0.98, 1.2, 1.42, 1.65];
const SITE_TYPE = { city: 1, port: 1.18, air: 1.3, rail: 0.92 };
function siteFactor(nodeId) {
  const n = N[nodeId];
  if (!n) return 1;
  return (SITE_STAGE[n.stage - 1] || 1) * (SITE_TYPE[n.type] || 1);
}
function buyPrice(nodeId, tier) { return Math.round(tier.buy * siteFactor(nodeId) / 100) * 100; }
function rentPrice(nodeId, tier) { return Math.round(tier.rent * siteFactor(nodeId)); }

/* Vornamen getrennt, damit Name und Gesicht zusammenpassen. */
const STAFF_FIRST_W = [
  "Mira", "Leyla", "Nele", "Svenja", "Amira", "Katja", "Ronja", "Elif", "Johanna", "Silke",
  "Anneke", "Marlene", "Bente", "Gesa", "Ida", "Frauke", "Nadja", "Sarah", "Merle", "Hanna"
];
const STAFF_FIRST_M = [
  "Jonas", "Tobias", "Hakan", "Paul", "Finn", "Deniz", "Markus", "Bastian", "Ousmane", "Tim",
  "Piotr", "Yusuf", "Rafael", "Nils", "Kemal", "Lasse", "Malte", "Arne", "Jannis", "Sven"
];
const STAFF_LAST = [
  "Brandt", "Özdemir", "Kruse", "Wagner", "Lindner", "Nowak", "Behrens", "Sahin", "Vogt", "Peters",
  "Dräger", "Kowalski", "Hansen", "Bauer", "Yilmaz", "Reimers", "Engel", "Diallo", "Stamm", "Roth"
];
/* Ein Satz zur Person – reine Farbe, ohne Spielwirkung. */
const STAFF_TRAITS = [
  "kennt jeden Schleichweg um den Ring",
  "sortiert Frachtbriefe nach Farbe",
  "war zwölf Jahre im Fernverkehr",
  "redet mit jedem Fahrer wie mit einem Nachbarn",
  "hat noch nie eine Zollnummer verwechselt",
  "packt beim Umschlag selbst mit an",
  "bringt freitags Kuchen mit",
  "kommt vom Hafen und sagt „Leinen los“ statt „Feierabend“",
  "führt Buch über jede Verspätung",
  "kann Paletten auf den Zentimeter stapeln",
  "hat die Ruhe weg, auch wenn der Kunde brüllt",
  "spricht vier Sprachen, drei davon am Telefon"
];

/* --------------------------- Vorfälle im Team ---------------------------
   Jeder Vorfall hat eine echte Ursache aus dem Speditionsalltag. „need“
   prüft, ob die Lage am Standort überhaupt dazu passt – so erzählt das
   Telefon nichts, was nicht zur eigenen Aufstellung gehört. */
const INCIDENTS = [
  {
    id: "schichtplan", w: 3,
    need: b => b.staff.length >= 2,
    title: "Streit um den Schichtplan",
    text: (b, a, c) => `${a.name} und ${c.name} stehen beide für Samstag im Plan und beide haben etwas vor. `
      + `Seit heute Morgen läuft die Disposition über zwei getrennte Zettel, und keiner weiß mehr, wer welche Rampe hat.`,
    hours: [3, 7], mood: -12,
    fix: [
      { label: "Samstagszuschlag zahlen", cost: b => 220 + b.staff.length * 60, mood: 14, cut: 0.8,
        note: "Beide nehmen die Schicht, das Wochenende danach wird getauscht." },
      { label: "Schichtplan selbst neu schreiben", cost: 0, mood: 6, cut: 0.45,
        note: "Kostet dich einen halben Nachmittag, hält aber länger." },
      { label: "Sollen sie das unter sich klären", cost: 0, mood: -6, cut: 0,
        note: "Sie klären es. Irgendwann." }
    ]
  },
  {
    id: "ueberstunden", w: 4,
    need: b => loadRatio(b) > 1.05,
    title: "Lenkzeiten am Anschlag",
    text: (b, a) => `${a.name} ruft aus der Fahrerkabine an: „Ich habe die Woche voll. `
      + `Wir fahren ${b.vehicles.length} Fahrzeuge mit ${roleCount(b, "fahr")} Leuten – das geht sich hinten und vorne nicht aus.“ `
      + `Im Hintergrund hört man den Digitalen Tachographen piepen.`,
    hours: [4, 10], mood: -16,
    fix: [
      { label: "Fahrzeuge vorerst stilllegen", cost: 0, mood: 10, cut: 0.6,
        note: "Ein Teil der Flotte bleibt am Hof, bis mehr Fahrpersonal da ist." },
      { label: "Überstunden auszahlen", cost: b => 340 + b.vehicles.length * 110, mood: 12, cut: 0.7,
        note: "Gekauft, nicht gelöst – aber diese Woche läuft es weiter." },
      { label: "Durchziehen", cost: 0, mood: -14, cut: 0,
        note: "Das Kontrollgerät schreibt jede Minute mit." }
    ]
  },
  {
    id: "rollenluecke", w: 4,
    need: b => b.staff.length >= 2 && coverage(b) <= 1,
    title: "Alle machen dasselbe",
    text: (b, a, c) => `Am Standort sitzen ${b.staff.length} Leute – und alle in derselben Rolle. `
      + `${a.name} und ${c.name} haben sich heute zweimal denselben Auftrag gegriffen, `
      + `und die Ware stand am Ende trotzdem ungerührt auf der Rampe.`,
    hours: [3, 6], mood: -10,
    fix: [
      { label: "Aufgaben klar verteilen", cost: 0, mood: 8, cut: 0.5,
        note: "Hilft, solange nicht die halbe Arbeit liegen bleibt." },
      { label: "Jemanden für die fehlende Rolle suchen", cost: 0, mood: 4, cut: 0.3,
        note: "Die Bewerbungen liegen im Büro bereit." }
    ]
  },
  {
    id: "einzelkaempfer", w: 3,
    need: b => b.staff.length === 1 && b.vehicles.length >= 3,
    title: "Einer für alles",
    text: (b, a) => `${a.name} macht hier Disposition, Umschlag und Papierkram in Personalunion. `
      + `Heute ist ein Anruf liegen geblieben, morgen sind es zwei. `
      + `„Ich sag’s ungern“, kommt am Telefon, „aber so halte ich das nicht durch.“`,
    hours: [5, 11], mood: -14,
    fix: [
      { label: "Sofort jemanden dazuholen", cost: 0, mood: 10, cut: 0.4,
        note: "Im Büro liegen Bewerbungen." },
      { label: "Zulage zahlen und weitermachen", cost: 400, mood: 6, cut: 0.6,
        note: "Verschafft Luft, löst es nicht." },
      { label: "Abwarten", cost: 0, mood: -10, cut: 0, note: "Die Anrufe stapeln sich." }
    ]
  },
  {
    id: "praemie", w: 2,
    need: b => b.staff.length >= 2 && b.done >= 6,
    title: "Wem gehört die Expressprämie?",
    text: (b, a, c) => `${a.name} hat den Eiltransport disponiert, ${c.name} ist ihn gefahren. `
      + `Die Prämie steht auf einem Zettel, zwei Namen daneben, ein Pfeil dazwischen. `
      + `Seit dem Mittag reden die beiden nur noch über dich.`,
    hours: [2, 5], mood: -9,
    fix: [
      { label: "Prämie teilen", cost: 260, mood: 12, cut: 0.9, note: "Sauber geregelt, Thema erledigt." },
      { label: "Regel für alle aufschreiben", cost: 0, mood: 9, cut: 0.6,
        note: "Ab jetzt weiß jeder vorher, was er bekommt." },
      { label: "Nicht mein Thema", cost: 0, mood: -7, cut: 0, note: "Wird es aber." }
    ]
  },
  {
    id: "einarbeitung", w: 3,
    need: b => b.staff.length >= 2 && b.staff.some(s => S.time - s.since < 2600),
    title: "Neue ohne Einweisung",
    text: (b, a, c) => `${c.name} ist neu und hat einen Lkw an Tor 4 geschickt – Tor 4 gibt es hier nicht. `
      + `${a.name} hat das vor allen kommentiert, und jetzt redet am Standort keiner mehr mit keinem.`,
    hours: [2, 6], mood: -11,
    fix: [
      { label: "Einarbeitung ansetzen", cost: 180, mood: 13, cut: 0.75,
        note: "Zwei Tage Übergabe, danach läuft es." },
      { label: "Kurz durchatmen lassen", cost: 0, mood: 5, cut: 0.4, note: "Der Ton wird wieder normal." },
      { label: "Laufen lassen", cost: 0, mood: -8, cut: 0, note: "Der nächste Lkw steht auch falsch." }
    ]
  },
  {
    id: "ladungssicherung", w: 2,
    need: b => roleCount(b, "ums") >= 1 && b.staff.length >= 2,
    title: "Streit an der Rampe",
    text: (b, a, c) => `${a.name} wollte die Ladung mit zwei Gurten sichern, ${c.name} hat auf vier bestanden `
      + `und den Stapler stehen lassen. Am Ende steht die Palette noch da – und beide haben recht behalten wollen.`,
    hours: [2, 5], mood: -8,
    fix: [
      { label: "Nach Vorschrift sichern, vier Gurte", cost: 0, mood: 11, cut: 0.7,
        note: "Richtig so. Dauert länger, hält aber auch." },
      { label: "Schulung Ladungssicherung buchen", cost: 520, mood: 15, cut: 0.9,
        note: "Danach diskutiert hier niemand mehr über Gurte." }
    ]
  },
  {
    id: "kaffeekueche", w: 2,
    need: b => b.staff.length >= 3,
    title: "Der Kühlschrank",
    text: (b, a, c) => `Es geht um ein Mittagessen. ${a.name} hat es mitgebracht, ${c.name} hat es gegessen, `
      + `und inzwischen kleben drei Zettel an der Kühlschranktür. Die Disposition läuft seit einer Stunde auf Sparflamme.`,
    hours: [1, 3], mood: -5,
    fix: [
      { label: "Essen für alle bestellen", cost: 140, mood: 12, cut: 0.9, note: "Zettel ab, Thema durch." },
      { label: "Zweiten Kühlschrank kaufen", cost: 380, mood: 8, cut: 0.8, note: "Erstaunlich wirksam." },
      { label: "Ignorieren", cost: 0, mood: -4, cut: 0, note: "Es kommt ein vierter Zettel." }
    ]
  },
  {
    id: "krank", w: 3,
    need: b => b.staff.length >= 2,
    title: "Zwei Krankmeldungen",
    text: (b, a, c) => `${a.name} und ${c.name} liegen flach. Der Rest des Teams hält den Laden, `
      + `aber die angenommenen Aufträge laufen heute im Schneckentempo.`,
    hours: [4, 9], mood: -6,
    fix: [
      { label: "Aushilfe über die Agentur", cost: b => 300 + b.vehicles.length * 40, mood: 8, cut: 0.8,
        note: "Teuer, aber der Betrieb läuft." },
      { label: "Ohne sie durchkommen", cost: 0, mood: -3, cut: 0, note: "Wird eine lange Woche." }
    ]
  },
  {
    id: "zollpapiere", w: 2,
    need: b => roleCount(b, "zoll") === 0 && S.stage >= 3,
    title: "Papiere zurückgewiesen",
    text: (b, a) => `Die Ausfuhranmeldung kam zurück, und am Standort weiß keiner genau, warum. `
      + `${a.name} hat es zweimal versucht und dann das Telefon aufgelegt. Ohne jemanden für Zoll und Papiere `
      + `bleibt das hier jedes Mal hängen.`,
    hours: [3, 8], mood: -10,
    fix: [
      { label: "Zollagentur beauftragen", cost: 640, mood: 6, cut: 0.85, note: "Diesmal geklärt." },
      { label: "Selbst durcharbeiten", cost: 0, mood: 3, cut: 0.4, note: "Dauert, geht aber." }
    ]
  },
  {
    id: "parkplatz", w: 1,
    need: b => b.vehicles.length >= 4,
    title: "Der Hof ist zu klein",
    text: (b, a, c) => `${a.name} hat zugeparkt, ${c.name} kam nicht raus, und die Abfahrt um sechs `
      + `wurde die Abfahrt um halb acht. Auf dem Hof stehen inzwischen mehr Fahrzeuge, als hier hinpassen.`,
    hours: [2, 4], mood: -7,
    fix: [
      { label: "Stellplatz nebenan anmieten", cost: 480, mood: 10, cut: 0.85, note: "Platz ist das halbe Leben." },
      { label: "Abfahrtszeiten staffeln", cost: 0, mood: 7, cut: 0.6, note: "Kostet nichts und wirkt sofort." }
    ]
  },
  {
    id: "funkstille", w: 2,
    need: b => b.staff.length >= 3 && b.mood < 60,
    title: "Es redet keiner mehr",
    text: (b, a, c) => `Zwischen ${a.name} und ${c.name} läuft seit Tagen alles über Zettel. `
      + `Was der eine annimmt, plant der andere um. Heute sind zwei Fahrzeuge zur selben Rampe gefahren.`,
    hours: [3, 7], mood: -12,
    fix: [
      { label: "Beide an einen Tisch holen", cost: 0, mood: 12, cut: 0.6, note: "Unangenehm, aber es wirkt." },
      { label: "Rollen sauber trennen", cost: 0, mood: 9, cut: 0.5, note: "Jeder hat wieder seinen Bereich." },
      { label: "Aussitzen", cost: 0, mood: -9, cut: 0, note: "Die Zettel werden mehr." }
    ]
  }
];

/* Gute Nachrichten – das Telefon soll nicht nur Ärger bringen. */
const GOOD_NEWS = [
  { id: "qualifikation", w: 3, need: b => b.staff.length >= 1,
    title: "Fortbildung bestanden",
    text: (b, a) => `${a.name} hat die Prüfung bestanden und arbeitet ab sofort eine Stufe souveräner. `
      + `Am Standort ${N[b.node].name} merkt man das sofort.`,
    apply: (b, a) => { a.skill = Math.min(5, a.skill + 1); a.wage = Math.round(a.wage * 1.08); } },
  { id: "lob", w: 2, need: b => b.done >= 10,
    title: "Kunde ruft an",
    text: (b, a) => `Ein Verlader hat sich gemeldet, nur um zu sagen, dass bei euch alles pünktlich war. `
      + `${a.name} hat den Anruf entgegengenommen und strahlt seitdem.`,
    apply: b => { b.mood = Math.min(100, b.mood + 8); } },
  { id: "empfehlung", w: 2, need: b => b.staff.length >= 2,
    title: "Empfehlung aus dem Team",
    text: (b, a) => `${a.name} kennt jemanden, der zu euch passen würde. Die Bewerbung liegt im Büro – `
      + `und die Person kommt günstiger rein als über die Agentur.`,
    apply: b => { refreshPool(b, true); } }
];

/* ============================ Zustand & Helfer =========================== */
function ensureOffices() {
  if (!S.bases) S.bases = [];
  if (!S.phone) S.phone = { msgs: [], unread: 0 };
  S.bases.forEach(b => {
    b.staff = b.staff || [];
    b.vehicles = (b.vehicles || []).filter(u => S.fleet.some(f => f.uid === u));
    if (typeof b.mood !== "number") b.mood = 80;
    if (typeof b.done !== "number") b.done = 0;
    if (typeof b.rentDue !== "number") b.rentDue = S.time + 30 * 1440;
    decoOf(b);
  });
}
function basesOf() { ensureOffices(); return S.bases; }
function baseById(id) { return (S.bases || []).find(b => b.id === id); }
function baseAtNode(nodeId) { return (S.bases || []).find(b => b.node === nodeId); }
function baseOfVehicle(uid) { return (S.bases || []).find(b => b.vehicles.includes(uid)); }
function tierOf(b) { return OFFICE_TIERS[b.tier]; }
function maxBases() { return S.stage; }

function roleCount(b, role) { return b.staff.filter(s => s.role === role).length; }
function rolePower(b, role) { return b.staff.filter(s => s.role === role).reduce((a, s) => a + s.skill, 0); }
function coverage(b) { return ROLE_KEYS.filter(r => roleCount(b, r) > 0).length; }
function moodFactor(b) { return 0.45 + clamp(b.mood, 0, 100) / 100 * 0.55; }
/* Wie viele Fahrzeuge dieses Team gleichzeitig bewegen kann. */
function assignedDriverIds(b) {
  const set = new Set();
  b.vehicles.forEach(u => { const f = S.fleet.find(x => x.uid === u); if (f && f.driver) set.add(f.driver); });
  return set;
}
/* Wer fest auf einem Fahrzeug sitzt, steht dem Pool nicht mehr zur Verfügung. */
function poolDrivers(b) {
  const a = assignedDriverIds(b);
  return b.staff.filter(s => s.role === "fahr" && !a.has(s.id));
}
function driverCap(b) {
  const p = poolDrivers(b);
  return Math.floor(p.reduce((x, s) => x + s.skill, 0) * 0.9 + p.length * 0.6);
}
function loadRatio(b) {
  const cap = driverCap(b);
  const open = b.vehicles.filter(u => { const f = S.fleet.find(x => x.uid === u); return f && !f.driver; }).length;
  return cap <= 0 ? (open ? 99 : 0) : open / cap;
}
function teamPower(b) {
  return b.staff.reduce((a, s) => a + s.skill, 0) * (1 + coverage(b) * 0.09) * moodFactor(b);
}
/* Reichweite, in der die Disposition Ausschreibungen abgreift. */
function reachKm(b) { return tierOf(b).reach * (1 + (S.stage - 1) * 0.35); }
function wagesDaily(b) { return b.staff.reduce((a, s) => a + s.wage, 0); }
/* Miete läuft monatlich ab, Löhne täglich. Wer gekauft hat, zahlt statt
   Miete die Nebenkosten – Strom, Heizung, Hausmeister. */
function monthlyRent(b) {
  const r = rentPrice(b.node, tierOf(b)) * 30;
  return Math.round(b.rent ? r : r * 0.28);
}
function baseDaily(b) { return wagesDaily(b) + Math.round(monthlyRent(b) / 30); }
function basePaused(b) { return b.pausedUntil && S.time < b.pausedUntil; }

/* Umschlagzeit am Knoten – ein Team mit Umschlagkräften ist schneller. */
function umschlagFactor(nodeId) {
  const b = baseAtNode(nodeId);
  if (!b || basePaused(b)) return 1;
  return 1 - Math.min(0.34, rolePower(b, "ums") * 0.045 * moodFactor(b));
}

/* ------------------------------ Standorte -------------------------------- */
function openBase(nodeId, tierIdx, rent) {
  ensureOffices();
  const t = OFFICE_TIERS[tierIdx];
  if (!t || !isUnlocked(nodeId)) return;
  if (!tierOpen(t)) return toast(t.name + " gibt es ab Etappe " + t.st + ".", "warn");
  if (baseAtNode(nodeId)) return toast("Hier steht bereits ein Standort.", "warn");
  if (S.bases.length >= maxBases())
    return toast("In Etappe " + S.stage + " kannst du " + maxBases() + " Standort"
      + (maxBases() > 1 ? "e" : "") + " führen. Die nächste Etappe gibt einen weiteren frei.", "warn");
  const price = rent ? rentPrice(nodeId, t) * 30 : buyPrice(nodeId, t);
  if (S.money < price) return toast("Dafür fehlen " + money(price - S.money) + ".", "warn");
  S.money -= price; S.expense += price;
  logMoney("base", (rent ? "Angemietet: " : "Gekauft: ") + N[nodeId].name, -price);
  const b = {
    id: "S" + (S.seq++), node: nodeId, tier: tierIdx, rent: !!rent,
    staff: [], vehicles: [], mood: 82, opened: S.time, done: 0,
    nextAt: S.time + 30, pausedUntil: 0, pool: null, poolDay: -1,
    rentDue: S.time + 30 * 1440,
    deco: { floor: "beton", tint: "natur", wall: "weiss", kitchen: "keine", plants: [] }
  };
  S.bases.push(b);
  refreshPool(b);
  toast("🏢 Standort " + N[nodeId].name + " " + (rent ? "gemietet" : "gekauft") + ".", "ok");
  phoneMsg({
    from: N[nodeId].name, kind: "info", title: "Schlüsselübergabe",
    body: "Der " + t.name + " in " + N[nodeId].name + " gehört jetzt zu " + S.player.company + ". "
      + "Solange hier niemand arbeitet, passiert allerdings auch nichts: "
      + "stell Personal ein und ordne dem Standort Fahrzeuge zu.", baseId: b.id
  });
  save(); render();
  /* Erstes Büro: Lina erklärt Personal, Rollen und Einrichtung */
  if (typeof tutTabHook === "function") tutTabHook("bases");
}

function closeBase(id) {
  const b = baseById(id); if (!b) return;
  const back = b.rent ? 0 : Math.round(buyPrice(b.node, tierOf(b)) * 0.55);
  if (back) { S.money += back; S.revenue += back; logMoney("base", "Verkauft: " + N[b.node].name, back); }
  else logMoney("base", "Mietvertrag gekündigt: " + N[b.node].name, 0);
  b.vehicles.forEach(u => { /* Fahrzeuge bleiben, nur die Zuordnung fällt weg */ });
  S.bases = S.bases.filter(x => x.id !== id);
  toast(b.rent ? "Mietvertrag gekündigt." : "Standort verkauft: " + money(back), "ok");
  save(); render();
}

function upgradeBase(id) {
  const b = baseById(id); if (!b || b.tier >= OFFICE_TIERS.length - 1) return;
  const next = OFFICE_TIERS[b.tier + 1];
  if (!tierOpen(next)) return toast(next.name + " gibt es ab Etappe " + next.st + ".", "warn");
  const price = b.rent ? rentPrice(b.node, next) * 30
    : Math.round(buyPrice(b.node, next) - buyPrice(b.node, tierOf(b)) * 0.6);
  if (S.money < price) return toast("Dafür fehlen " + money(price - S.money) + ".", "warn");
  S.money -= price; S.expense += price; b.tier++;
  logMoney("base", "Vergrößert: " + N[b.node].name + " → " + next.name, -price);
  toast("🏢 " + N[b.node].name + " ist jetzt " + next.name + ".", "ok");
  save(); render();
}

/* ------------------------------- Personal -------------------------------- */
function makeCandidate(cheap) {
  const role = pick(ROLE_KEYS);
  /* Erst das Geschlecht der Figur, dann der passende Vorname. */
  const sex = Math.random() < 0.5 ? 0 : 1;
  const first = pick(AV.sexes[sex] === "w" ? STAFF_FIRST_W : STAFF_FIRST_M);
  const r = ROLES[role];
  const skill = clamp(Math.round(rnd(1, 5.4)), 1, 5);
  const wage = Math.round(r.wage * (0.62 + skill * 0.19) * (cheap ? 0.84 : 1) * rnd(0.94, 1.08));
  return {
    id: "P" + (S.seq++),
    name: first + " " + pick(STAFF_LAST),
    role, skill, wage, trait: pick(STAFF_TRAITS),
    av: avRandom(sex),
    fee: Math.round(wage * rnd(3.2, 5.5))
  };
}
function refreshPool(b, bonus) {
  const n = 3 + Math.floor(S.stage / 2);
  b.pool = (b.pool || []).filter(c => c.hh);   /* der Headhunter-Kandidat wartet */
  for (let i = 0; i < n; i++) b.pool.push(makeCandidate(bonus && i === 0));
  b.poolDay = dayOf(S.time);
}
function hire(baseId, candId) {
  const b = baseById(baseId); if (!b) return;
  const c = (b.pool || []).find(x => x.id === candId); if (!c) return;
  if (b.staff.length >= tierOf(b).desks)
    return toast("Im " + tierOf(b).name + " ist kein Platz mehr. Größeres Büro nötig.", "warn");
  if (S.money < c.fee) return toast("Die Vermittlung kostet " + money(c.fee) + ".", "warn");
  S.money -= c.fee; S.expense += c.fee;
  logMoney("staff", "Vermittlung: " + c.name, -c.fee);
  b.staff.push({ id: c.id, name: c.name, role: c.role, skill: c.skill, wage: c.wage,
                 trait: c.trait, av: c.av, since: S.time, jobs: 0 });
  b.pool = b.pool.filter(x => x.id !== candId);
  b.mood = Math.min(100, b.mood + 4);
  toast("🤝 " + c.name + " fängt in " + N[b.node].short + " an.", "ok");
  save(); render();
}
function fire(baseId, staffId) {
  const b = baseById(baseId); if (!b) return;
  const s = b.staff.find(x => x.id === staffId); if (!s) return;
  const sev = Math.round(s.wage * 14);
  if (S.money < sev) return toast("Die Abfindung von " + money(sev) + " ist nicht gedeckt.", "warn");
  S.money -= sev; S.expense += sev;
  logMoney("staff", "Abfindung: " + s.name, -sev);
  S.fleet.forEach(f => { if (f.driver === staffId) f.driver = null; });
  b.staff = b.staff.filter(x => x.id !== staffId);
  b.mood = Math.max(0, b.mood - 9);
  toast(s.name + " ist ausgeschieden. Abfindung " + money(sev) + ".", "warn");
  save(); render();
}

/* --------------------------- Fahrzeugzuordnung --------------------------- */
function assignVehicle(baseId, uid) {
  const b = baseById(baseId); if (!b) return;
  const old = baseOfVehicle(uid);
  if (old === b) return;
  if (b.vehicles.length >= tierOf(b).slots) {
    toast("Der Hof am Standort ist voll (" + tierOf(b).slots + " Stellplätze).", "warn");
    return render();
  }
  if (old) {
    old.vehicles = old.vehicles.filter(u => u !== uid);
    const f = S.fleet.find(x => x.uid === uid);
    if (f && f.driver && !b.staff.some(st => st.id === f.driver)) f.driver = null;   /* Fahrer bleibt im alten Büro */
  }
  b.vehicles.push(uid);
  b.nextAt = Math.min(b.nextAt || 0, S.time + 5);   /* Dispo schaut gleich drauf */
  save(); render();
}
function unassignVehicle(uid) {
  const b = baseOfVehicle(uid); if (!b) return;
  const f = S.fleet.find(x => x.uid === uid);
  if (f) f.driver = null;                    /* ohne Standort kein fester Fahrer */
  b.vehicles = b.vehicles.filter(u => u !== uid);
  save(); render();
}
function assignedUids() {
  const s = new Set();
  (S.bases || []).forEach(b => b.vehicles.forEach(u => s.add(u)));
  return s;
}

/* ====================== Betrieb: Aufträge automatisch ==================== */
/* Wie oft ein Standort eine Ausschreibung greift (in Spielminuten). */
/* Die Disposition ist die einzige Automatik im Spiel. Wie viel sie schafft,
   hängt am Team: Können × Stimmung. Daraus folgt, wie viele Fahrzeuge es
   gleichzeitig im Blick behält und wie schnell es auf ein frei gewordenes
   Fahrzeug reagiert. */
function dispoPower(b) { return rolePower(b, "disp") * moodFactor(b); }
function dispCap(b) { const p = dispoPower(b); return p <= 0 ? 0 : Math.floor(2 + p * 3); }
function dispatchInterval(b) {
  const p = dispoPower(b);
  if (p <= 0) return Infinity;
  return clamp(Math.round(90 / (1 + p)), 8, 60);
}
function baseBonus(b) { return Math.min(0.12, rolePower(b, "zoll") * 0.022 * moodFactor(b)) + (tierOf(b).prestige || 0); }

function baseDispatch(b) {
  if (basePaused(b) || b.dispOff || !b.vehicles.length || dispoPower(b) <= 0) return false;
  const fleet = b.vehicles.map(u => S.fleet.find(x => x.uid === u)).filter(Boolean);
  const room = dispCap(b) - fleet.filter(f => f.phase !== "idle").length;
  if (room <= 0) return false;
  /* Ohne festen Fahrer rollen nur so viele, wie Fahrpersonal da ist */
  let openLeft = driverCap(b) - fleet.filter(f => f.phase !== "idle" && !f.driver).length;
  const usable = fleet.filter(f => f.phase === "idle" && (f.driver || openLeft > 0));
  if (!usable.length) return false;

  const here = [N[b.node].lat, N[b.node].lon];
  const reach = reachKm(b);
  const pool = new Set(usable.map(f => f.uid));
  let got = 0;
  dispatchPool = pool;
  try {
    got = dispatchRun({
      maxTake: room,
      accept: o => !o.pablo && hav(here, [N[o.from].lat, N[o.from].lon]) <= reach,
      onBefore: o => {
        const bonus = baseBonus(b);
        if (bonus > 0 && !o.snus) o.pay = Math.round(o.pay * (1 + bonus));
        o.viaBase = b.id;
      },
      onStart: (o, assign) => {
        b.done++;
        b.staff.forEach(s => { if (s.role === "disp") s.jobs++; });
        /* Wer ohne festen Fahrer losfuhr, belegt einen Platz im Fahrerpool */
        assign.forEach(u => {
          const f = S.fleet.find(x => x.uid === u);
          if (f && !f.driver) openLeft--;
          pool.delete(u);
        });
        if (openLeft <= 0) fleet.forEach(f => { if (!f.driver) pool.delete(f.uid); });
      }
    });
  } finally { dispatchPool = null; }
  return got > 0;
}

/* --------------------------- Stimmung & Vorfälle ------------------------- */
function moodDrift(b) {
  let d = 3;
  const lr = loadRatio(b);
  if (lr > 1) d -= Math.min(22, (lr - 1) * 16 + 4);
  if (b.staff.length >= 2 && coverage(b) === 1) d -= 7;
  if (b.staff.length === 1 && b.vehicles.length >= 3) d -= 6;
  if (b.staff.length === 0 && b.vehicles.length) d -= 2;
  if (b.staff.length > tierOf(b).desks) d -= 5;
  if (coverage(b) >= 3) d += 2;
  d += comfortOf(b) * 0.13;                 /* ein schönes Büro fängt viel ab */
  b.mood = clamp(b.mood + d, 0, 100);
}
function incidentChance(b) {
  if (!b.staff.length) return 0;
  let p = 0.05;
  if (b.mood < 70) p += (70 - b.mood) / 100 * 0.55;
  if (loadRatio(b) > 1) p += 0.12;
  if (b.staff.length >= 2 && coverage(b) === 1) p += 0.12;
  p += Math.max(0, b.staff.length - 4) * 0.02;
  p -= comfortOf(b) * 0.004;
  return Math.max(0.02, Math.min(0.62, p));
}
function twoStaff(b) {
  const a = pick(b.staff);
  const others = b.staff.filter(x => x.id !== a.id);
  return [a, others.length ? pick(others) : a];
}
function fireIncident(b) {
  const pool = INCIDENTS.filter(i => { try { return i.need(b); } catch (_) { return false; } });
  if (!pool.length) return;
  const total = pool.reduce((a, i) => a + i.w, 0);
  let r = Math.random() * total, inc = pool[0];
  for (const i of pool) { r -= i.w; if (r <= 0) { inc = i; break; } }
  const [a, c] = twoStaff(b);
  const hours = rnd(inc.hours[0], inc.hours[1]);
  b.pausedUntil = S.time + hours * 60;
  b.mood = clamp(b.mood + inc.mood, 0, 100);
  phoneMsg({
    from: N[b.node].name, kind: "trouble", title: inc.title,
    body: inc.text(b, a, c), baseId: b.id, incident: inc.id,
    note: "Der Standort arbeitet " + dur(hours * 60) + " lang nicht weiter.",
    actions: inc.fix.map((f, i) => ({
      label: f.label, idx: i,
      cost: typeof f.cost === "function" ? Math.round(f.cost(b)) : f.cost
    }))
  });
}
function applyFix(msgId, idx) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.handled) return;
  const b = baseById(m.baseId);
  const inc = INCIDENTS.find(i => i.id === m.incident);
  if (!b || !inc) return;
  const f = inc.fix[idx]; if (!f) return;
  const cost = typeof f.cost === "function" ? Math.round(f.cost(b)) : f.cost;
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  if (cost) { S.money -= cost; S.expense += cost; logMoney("staff", f.label + " · " + N[b.node].short, -cost); }
  b.mood = clamp(b.mood + f.mood, 0, 100);
  if (f.cut > 0) {
    const rest = Math.max(0, b.pausedUntil - S.time);
    b.pausedUntil = S.time + rest * (1 - f.cut);
  }
  m.handled = true; m.result = f.note;
  toast(f.note, f.mood >= 0 ? "ok" : "warn");
  save(); renderPhone(); render();
}
function fireGoodNews(b) {
  const pool = GOOD_NEWS.filter(g => { try { return g.need(b); } catch (_) { return false; } });
  if (!pool.length) return;
  const g = pick(pool);
  const a = pick(b.staff);
  g.apply(b, a);
  phoneMsg({ from: N[b.node].name, kind: "good", title: g.title, body: g.text(b, a), baseId: b.id });
}

/* -------------------------------- Telefon -------------------------------- */
function phoneMsg(m) {
  ensureOffices();
  m.id = "M" + (S.seq++);
  m.time = S.time;
  S.phone.msgs.unshift(m);
  if (S.phone.msgs.length > 40) S.phone.msgs.length = 40;
  S.phone.unread++;
  renderPhoneBadge(true);
  toast(m.toastText || "📞 Anruf aus " + m.from + ": " + m.title, m.kind === "trouble" ? "warn" : "ok");
}
/* Sicherheitsmaßnahme: Nachrichten löschen sich nach 24 Spielstunden */
const PHONE_TTL = 24 * 60;
function prunePhone() {
  if (!S.phone || !S.phone.msgs.length) return;
  const before = S.phone.msgs.length;
  S.phone.msgs = S.phone.msgs.filter(m => S.time - m.time < PHONE_TTL);
  if (S.phone.msgs.length === before) return;
  S.phone.unread = Math.min(S.phone.unread, S.phone.msgs.length);
  renderPhoneBadge(false);
  if (phoneOpen()) renderPhone();
}
function phoneTTL(m) {
  const left = PHONE_TTL - (S.time - m.time);
  const txt = left >= 60 ? Math.ceil(left / 60) + " h" : Math.max(1, Math.ceil(left)) + " min";
  return `<span class="pmsg-ttl${left < 180 ? " soon" : ""}" title="Löscht sich automatisch">🔥 ${txt}</span>`;
}
function phoneOpen() { return $("#modal").classList.contains("open") && !!$("#modalBody .phone"); }
let phoneTab = "msgs";
function renderPhoneBadge(ring) {
  const el = $("#phoneBtn"); if (!el) return;
  const n = (S.phone && S.phone.unread) || 0;
  el.classList.toggle("ring", n > 0);
  if (ring && n > 0) {                       /* Klingelanimation neu starten */
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 4400);
  }
  const b = $("#phoneCount");
  if (b) { b.textContent = n > 9 ? "9+" : n; b.style.display = n ? "" : "none"; }
}
function openPhone() {
  ensureOffices();
  phoneTab = "msgs";                     /* der Rechner bleibt versteckt, bis man ihn antippt */
  S.phone.unread = 0;
  renderPhoneBadge();
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderPhone();
  save();
  /* Solana-Kurs schon mal holen, damit Angebote gleich in SOL dastehen */
  if (typeof solFetch === "function") solFetch().then(() => { if (phoneOpen()) renderPhone(); });
}
function renderPhone() {
  if (!$("#modal").classList.contains("open")) return;
  prunePhoneSilent();
  const msgs = S.phone.msgs;
  const body = msgs.length ? msgs.map(m => {
    if (m.kind === "snus" && typeof snusMsgHTML === "function") return snusMsgHTML(m);
    if (m.kind === "pablo" && typeof pabloMsgHTML === "function") return pabloMsgHTML(m);
    if (m.kind === "invite" && typeof inviteMsgHTML === "function") return inviteMsgHTML(m);
    if (m.dec && typeof decisionMsgHTML === "function") return decisionMsgHTML(m);
    const b = baseById(m.baseId);
    const acts = (m.actions || []).map(a =>
      `<button class="btn tiny${a.cost > S.money ? " disabled" : ""}" data-fix="${m.id}" data-idx="${a.idx}">
         ${esc(a.label)}${a.cost ? " · " + money(a.cost) : ""}</button>`).join("");
    return `<div class="pmsg ${m.kind}${m.handled ? " done" : ""}">
      <div class="pmsg-head">
        <span class="pmsg-from">${esc(m.from)}</span>
        <span class="pmsg-time">${stamp(m.time)} ${phoneTTL(m)}</span>
      </div>
      <b>${esc(m.title)}</b>
      <p>${esc(m.body)}</p>
      ${m.note && !m.handled ? `<div class="pmsg-note">${esc(m.note)}</div>` : ""}
      ${m.handled ? `<div class="pmsg-note ok">✔ ${esc(m.result || "erledigt")}</div>`
                  : (acts ? `<div class="pmsg-acts">${acts}</div>` : "")}
      ${b && !m.handled && m.kind === "trouble"
        ? `<div class="pmsg-note">Stimmung in ${esc(N[b.node].short)}: ${Math.round(b.mood)} %</div>` : ""}
    </div>`;
  }).join("") : `<div class="empty">Noch keine Anrufe. Sobald du Standorte mit Personal führst,
     meldet sich hier dein Team.</div>`;
  const scroll = $(".phone-list") ? $(".phone-list").scrollTop : 0;
  const calc = phoneTab === "calc";

  $("#modalBody").innerHTML = `
    <div class="mhead phone">
      <div><div class="mtitle">📞 Diensttelefon</div>
      <div class="msub">${calc ? "Rechner" : msgs.length + " Nachricht" + (msgs.length === 1 ? "" : "en") + " · löschen sich nach 24 h"}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button>
    </div>
    <div class="ptabs">
      <button class="ptab${calc ? "" : " on"}" data-ptab="msgs">💬 Nachrichten</button>
      <button class="ptab calc${calc ? " on" : ""}" data-ptab="calc" title="Rechner" aria-label="Rechner">🧮</button>
    </div>
    <div class="phone-list">${calc && typeof shadowBookHTML === "function" ? shadowBookHTML() : body}</div>
    <div class="mbtns"><button class="btn ghost" id="mCancel">Schließen</button></div>`;
  $(".phone-list").scrollTop = scroll;          /* beim Tippen im Chat nicht nach oben springen */
  $("#mClose").onclick = closeModal;
  $("#mCancel").onclick = closeModal;
  $$("#modalBody [data-ptab]").forEach(b => b.onclick = () => { phoneTab = b.dataset.ptab; $(".phone-list").scrollTop = 0; renderPhone(); });
  $$("#modalBody [data-fix]").forEach(btn =>
    btn.onclick = () => applyFix(btn.dataset.fix, +btn.dataset.idx));
  if (typeof bindSnusMsgs === "function") bindSnusMsgs();
  if (typeof bindPabloMsgs === "function") bindPabloMsgs();
  if (typeof bindDecisionMsgs === "function") bindDecisionMsgs($("#modalBody"));
  $$("#modalBody [data-openinvite]").forEach(b => b.onclick = () => { closeModal(); openInvite(); });
}

function prunePhoneSilent() {
  if (!S.phone) return;
  S.phone.msgs = S.phone.msgs.filter(m => S.time - m.time < PHONE_TTL);
  S.phone.unread = Math.min(S.phone.unread, S.phone.msgs.length);
}

/* ------------------------------ Tagesablauf ------------------------------ */
function tickBases(dtMin) {
  ensureOffices();
  for (const b of S.bases) {
    if (b.poolDay !== dayOf(S.time) && Math.random() < 0.4) refreshPool(b);
    if (S.time >= (b.nextAt || 0)) {
      baseDispatch(b);
      b.nextAt = S.time + Math.min(dispatchInterval(b), 60);
    }
  }
}
/* Einmal pro Spieltag: Kosten, Stimmung, Vorfälle. */
function baseDayChange(days) {
  ensureOffices();
  let cost = 0, rentCost = 0;
  for (const b of S.bases) {
    cost += wagesDaily(b) * days;
    while (S.time >= b.rentDue) {            /* Monatsmiete */
      rentCost += monthlyRent(b);
      b.rentDue += 30 * 1440;
    }
    for (let d = 0; d < days; d++) {
      moodDrift(b);
      if (!basePaused(b) && Math.random() < incidentChance(b)) fireIncident(b);
      else if (b.staff.length && Math.random() < 0.07) fireGoodNews(b);
    }
  }
  if (cost > 0) {
    S.money -= cost; S.expense += cost;
    logMoney("staff", "Löhne der Standorte", -cost);
  }
  if (rentCost > 0) {
    S.money -= rentCost; S.expense += rentCost;
    logMoney("rent", "Monatsmiete und Nebenkosten", -rentCost);
    toast("🏢 Monatsmiete abgebucht: " + money(rentCost), "warn", true);
  }
}

/* ================================ Ansicht ================================ */
function moodWord(m) {
  if (m >= 85) return "bestens";
  if (m >= 70) return "gut";
  if (m >= 50) return "angespannt";
  if (m >= 30) return "schlecht";
  return "am Boden";
}
function faceHTML(p, uid) {
  return `<span class="face">${p.av ? avatarSVG(p.av, 40, { uid: uid, bg: true }) : ""}</span>`;
}
function stars(n) { return `<i class="sskill">${"★".repeat(n)}<u>${"★".repeat(5 - n)}</u></i>`; }

function staffRow(b, s) {
  const r = ROLES[s.role];
  const drives = S.fleet.find(f => f.driver === s.id);
  return `<div class="staff" data-staffdrag="${b.id}|${s.id}">
    ${faceHTML(s, "s" + s.id)}
    <div class="stx">
      <b>${esc(s.name)}</b>
      <small>${r.icon} ${esc(r.name)} · ${stars(s.skill)} · ${money(s.wage)}/Tag</small>
      <small class="trait">${drives ? "🧑‍✈️ fährt " + esc(vType(drives.type).name) : esc(s.trait)}</small>
    </div>
    <button class="xmini" data-fire="${b.id}|${s.id}" title="kündigen">✕</button>
  </div>`;
}
function candRow(b, c) {
  const r = ROLES[c.role];
  return `<div class="staff cand${c.hh ? " hh" : ""}">
    ${faceHTML(c, "c" + c.id)}
    <div class="stx">
      <b>${esc(c.name)}</b>
      <small>${r.icon} ${esc(r.name)} · ${stars(c.skill)} · ${money(c.wage)}/Tag</small>
      <small class="trait">${esc(c.trait)}</small>
    </div>
    <button class="btn tiny${S.money >= c.fee ? "" : " disabled"}" data-hire="${b.id}|${c.id}"
      title="einstellen · Vermittlung ${c.fee ? money(c.fee) : "gratis"}">🤝 ${c.fee ? money(c.fee) : "gratis"}</button>
  </div>`;
}

function baseCard(b) {
  const t = tierOf(b), n = N[b.node];
  const cap = driverCap(b), lr = loadRatio(b);
  const paused = basePaused(b);
  const rest = paused ? dur(b.pausedUntil - S.time) : "";
  const free = S.fleet.filter(f => !baseOfVehicle(f.uid));
  const mine = b.vehicles.map(u => S.fleet.find(f => f.uid === u)).filter(Boolean);
  const covered = ROLE_KEYS.map(r => `<button class="cov${roleCount(b, r) ? " on" : ""}" title="${ROLES[r].name} – antippen, Lina erklärt" data-role="${r}" data-rolebase="${b.id}">
      ${ROLES[r].icon}<i>${rolePower(b, r) || "–"}</i><small>${ROLES[r].name.split(" ")[0]}</small></button>`).join("");

  return `<div class="card base${paused ? " halted" : ""}">
    <div class="card-top">
      <span class="vicon">${t.icon}</span>
      <div class="vname">${esc(n.name)}<small>${t.name} · ${b.rent ? "gemietet" : "im Eigentum"}</small></div>
      <span class="price">${money(monthlyRent(b))}<small>/Monat</small></span>
    </div>

    <div class="planpeek" data-office="${b.id}" role="button" tabindex="0"
         title="Büro einrichten">${officeSVG(b, 240, false)}${tierFloors(t) > 1 ? `<span class="floorbadge">${tierFloors(t)} Etagen</span>` : ""}
      <span class="planhint">🪴 einrichten</span></div>

    ${paused ? `<div class="halt">⛔ Der Betrieb steht still · noch ${rest} · <b>siehe Telefon</b></div>` : ""}

    <div class="moodbar" title="Stimmung im Team">
      <i style="width:${Math.round(b.mood)}%;background:${b.mood >= 70 ? "var(--green)" : b.mood >= 45 ? "var(--amber)" : "var(--red)"}"></i>
      <span>Stimmung ${Math.round(b.mood)} % · ${moodWord(b.mood)}</span>
    </div>

    <div class="covrow">${covered}</div>

    <div class="meta small">
      <span>👥 ${b.staff.length}/${t.desks} Plätze</span>
      <span>🚚 ${b.vehicles.length}/${t.slots} Stellplätze</span>
      <span class="${lr > 1 ? "bad" : ""}">🧑‍✈️ ${cap} gleichzeitig fahrbar</span>
      <span>📡 ${kmf(Math.round(reachKm(b)))} Einzugsgebiet</span>
      <span>📦 ${b.done} selbst disponiert</span>
      ${dispCap(b) ? `<span class="${mine.length > dispCap(b) ? "bad" : ""}">🗂️ betreut bis ${dispCap(b)} Fahrzeuge</span>
      <span>⏱️ schaut alle ${dur(dispatchInterval(b))} nach</span>` : ""}
      <span>💶 ${money(wagesDaily(b))} Löhne/Tag</span>
      <span>🛋️ Behaglichkeit ${comfortOf(b)}</span>
      <span>🗓️ nächste Miete ${stamp(b.rentDue)}</span>
      ${baseBonus(b) > 0 ? `<span class="good">📑 +${Math.round(baseBonus(b) * 100)} % Servicezuschlag</span>` : ""}
    </div>

    ${rolePower(b, "disp") > 0 ? `<div class="dispotoggle">
      <div><b>🗂️ Disposition</b><small>${b.dispOff ? "pausiert – die Fahrzeuge hier teilst du gerade selbst ein"
        : "nimmt Aufträge im Einzugsgebiet an und schickt das passende Fahrzeug"}</small></div>
      <button class="toggle ${b.dispOff ? "" : "on"}" data-dispo="${b.id}" aria-label="Disposition an/aus"><i></i></button>
    </div>` : ""}
    ${rolePower(b, "disp") <= 0
      ? `<div class="hintbox">Ohne Disposition nimmt dieser Standort nichts an – die Fahrzeuge hier fahren dann nur, wenn du sie selbst einteilst. Stell jemanden aus der Disposition ein.</div>`
      : mine.length > dispCap(b)
        ? `<div class="hintbox warn">${mine.length} Fahrzeuge, aber die Disposition betreut nur ${dispCap(b)} – der Rest wartet. Mehr oder bessere Disponenten helfen.</div>`
        : lr > 1
          ? `<div class="hintbox warn">Mehr Fahrzeuge als Fahrpersonal – ${mine.length} Fahrzeuge, ${cap} gleichzeitig möglich. Das drückt die Stimmung.</div>`
          : ""}

    <div class="sechead sm">Team</div>
    ${b.staff.length ? b.staff.map(s => staffRow(b, s)).join("")
                     : `<div class="empty sm">Noch niemand eingestellt.</div>`}

    <div class="sechead sm">Bewerbungen<small>wechseln täglich</small></div>
    ${(b.pool || []).length ? b.pool.map(c => candRow(b, c)).join("")
                            : `<div class="empty sm">Heute keine Bewerbungen.</div>`}

    <div class="sechead sm">Fahrzeuge am Standort</div>
    ${mine.length ? mine.map(f => {
      const vt = vType(f.type);
      const dr = driverOf(f.uid);
      return `<div class="staff veh" data-drop="veh:${f.uid}">
        <span class="srole">${vt.icon}</span>
        <div class="stx"><b>${esc(vt.name)}</b>
          <small>${esc(phaseLabel(f))} · ${esc(N[f.at].short)}</small>
          <small class="${dr ? "driver" : "trait"}">${dr
            ? "🧑‍✈️ " + esc(dr.name) + " · +" + Math.round(dr.skill * 2) + " % Tempo"
            : "kein fester Fahrer – jemanden hierher ziehen"}</small></div>
        ${dr ? `<button class="xmini" data-nodriver="${f.uid}" title="Fahrer abziehen">↩</button>` : ""}
        <button class="xmini" data-unassign="${f.uid}" title="Zuordnung lösen">✕</button>
      </div>`;
    }).join("") : `<div class="empty sm">Diesem Standort ist noch kein Fahrzeug zugeordnet.</div>`}
    ${free.length && b.vehicles.length < t.slots ? `<div class="assignrow">
      <select data-assignsel="${b.id}">
        ${free.map(f => `<option value="${f.uid}">${vType(f.type).icon} ${esc(vType(f.type).name)} · ${esc(N[f.at].short)}</option>`).join("")}
      </select>
      <button class="btn tiny" data-assign="${b.id}">zuordnen</button>
    </div>` : ""}

    <div class="firezone" data-drop="fire">🗑️ zum Kündigen hierher ziehen</div>

    <div class="baserow">
      ${b.tier < OFFICE_TIERS.length - 1
        ? (tierOpen(OFFICE_TIERS[b.tier + 1])
          ? `<button class="btn tiny ghost" data-up="${b.id}">vergrößern → ${OFFICE_TIERS[b.tier + 1].icon} ${OFFICE_TIERS[b.tier + 1].name}</button>`
          : `<span class="lockchip">🔒 ${OFFICE_TIERS[b.tier + 1].name} ab Etappe ${OFFICE_TIERS[b.tier + 1].st}</span>`) : ""}
      <button class="btn tiny ghost danger" data-close="${b.id}">${b.rent ? "kündigen" : "verkaufen"}</button>
    </div>
  </div>`;
}

function newBaseCard() {
  const taken = new Set((S.bases || []).map(b => b.node));
  const free = unlockedNodes().filter(n => !taken.has(n.id))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  const room = (S.bases || []).length < maxBases();
  /* Preise beziehen sich auf den gerade gewählten Ort. */
  const sel = (newBaseCard.sel && free.some(n => n.id === newBaseCard.sel))
    ? newBaseCard.sel : (free[0] ? free[0].id : null);
  newBaseCard.sel = sel;
  return `<div class="card">
    <div class="card-top"><span class="vicon">➕</span>
      <div class="vname">Neuer Standort<small>${(S.bases || []).length} von ${maxBases()} belegt · jede Etappe gibt einen weiteren frei</small></div></div>
    ${!room ? `<div class="hintbox">Alle Standorte dieser Etappe sind vergeben. Die nächste Etappe schaltet einen weiteren frei.</div>` : `
      <div class="assignrow">
        <select id="newBaseNode">${free.map(n =>
          `<option value="${n.id}"${n.id === sel ? " selected" : ""}>${TYPE_GLYPH[n.type] || "🏙"} ${esc(n.name)}</option>`).join("")}</select>
      </div>
      <div class="tierlist">${OFFICE_TIERS.map((t, i) => `
        <div class="tier${tierOpen(t) ? "" : " locked"}${tierFloors(t) > 1 ? " big" : ""}">
          <div class="tier-head"><span>${t.icon}</span><b>${t.name}</b>${tierFloors(t) > 1 ? `<em>${tierFloors(t)} Etagen</em>` : ""}</div>
          <small>${esc(t.info)}</small>
          <div class="meta small">
            <span>👥 ${t.desks}</span><span>🚚 ${t.slots}</span><span>📡 ${kmf(Math.round(t.reach * (1 + (S.stage - 1) * 0.35)))}</span>
          </div>
          ${tierOpen(t) ? `<div class="buyrow">
            <button class="btn tiny${S.money >= buyPrice(sel, t) ? "" : " disabled"}" data-open="${i}|0">kaufen · ${money(buyPrice(sel, t))}</button>
            <button class="btn tiny ghost${S.money >= rentPrice(sel, t) * 30 ? "" : " disabled"}" data-open="${i}|1">mieten · ${money(rentPrice(sel, t))}/Tag</button>
          </div>` : `<div class="lockrow">🔒 ab Etappe ${t.st}</div>`}
        </div>`).join("")}</div>`}
  </div>`;
}

function renderBases() {
  ensureOffices();
  const el = $("#tab-bases"); if (!el) return;
  el.innerHTML =
    (S.bases.length
      ? `<div class="sechead" style="margin-top:0">Deine Standorte</div>` + S.bases.map(baseCard).join("")
      : `<div class="card"><div class="vname">Noch kein eigenes Büro<small>Standorte nehmen dir die Arbeit ab</small></div>
         <p class="pintro">Ein Standort greift Ausschreibungen in seinem Einzugsgebiet selbst ab, sobald dort jemand
         aus der <b>Disposition</b> sitzt – das ist die einzige Automatik im Spiel. Alles ohne Büro teilst du selbst ein. <b>Fahrpersonal</b> bestimmt, wie viele der zugeordneten Fahrzeuge
         gleichzeitig rollen, <b>Umschlag</b> verkürzt die Standzeiten, <b>Zoll &amp; Papiere</b> bringen Zuschlag.
         Wer die Rollen einseitig besetzt oder zu wenige Leute für zu viele Fahrzeuge hat, bekommt Ärger im Team –
         das Telefon meldet sich dann.</p></div>`) +
    `<div class="sechead">Standort eröffnen</div>` + newBaseCard();

  $$("#tab-bases [data-hire]").forEach(b => b.onclick = () => {
    const [bid, cid] = b.dataset.hire.split("|"); hire(bid, cid);
  });
  $$("#tab-bases [data-fire]").forEach(b => b.onclick = () => {
    const [bid, sid] = b.dataset.fire.split("|");
    const st = baseById(bid).staff.find(x => x.id === sid);
    askConfirm(st.name + " kündigen?",
      "Die Abfindung beträgt " + money(st.wage * 14) + ". Die Stelle ist danach frei.",
      "Kündigen", () => fire(bid, sid), true);
  });
  $$("#tab-bases [data-assign]").forEach(b => b.onclick = () => {
    const sel = $(`[data-assignsel="${b.dataset.assign}"]`);
    if (sel && sel.value) assignVehicle(b.dataset.assign, sel.value);
  });
  $$("#tab-bases [data-unassign]").forEach(b => b.onclick = () => unassignVehicle(b.dataset.unassign));
  $$("#tab-bases [data-role]").forEach(b => b.onclick = () => { if (typeof linaRole === "function") linaRole(b.dataset.role, b.dataset.rolebase); });
  $$("#tab-bases [data-dispo]").forEach(t => t.onclick = () => {
    const base = baseById(t.dataset.dispo); if (!base) return;
    base.dispOff = !base.dispOff;
    if (!base.dispOff) base.nextAt = S.time + 2;
    toast(base.dispOff ? "Disposition " + N[base.node].short + " pausiert." : "Disposition " + N[base.node].short + " läuft wieder.", "ok");
    save(); render();
  });
  $$("#tab-bases [data-nodriver]").forEach(b => b.onclick = () => clearDriver(b.dataset.nodriver));
  $$("#tab-bases [data-staffdrag]").forEach(el => makeDraggable(el, el.dataset.staffdrag));
  $$("#tab-bases [data-office]").forEach(b => {
    b.onclick = () => openOffice(b.dataset.office);
    b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openOffice(b.dataset.office); } };
  });
  $$("#tab-bases [data-up]").forEach(b => b.onclick = () => upgradeBase(b.dataset.up));
  $$("#tab-bases [data-close]").forEach(b => b.onclick = () => {
    const base = baseById(b.dataset.close);
    askConfirm(base.rent ? "Mietvertrag kündigen?" : "Standort verkaufen?",
      base.rent
        ? "Das Büro in " + N[base.node].name + " wird geräumt. Personal und Einrichtung sind weg."
        : "Du bekommst " + money(Math.round(buyPrice(base.node, tierOf(base)) * 0.55))
          + " zurück. Personal und Einrichtung sind weg.",
      base.rent ? "Kündigen" : "Verkaufen", () => closeBase(b.dataset.close), true);
  });
  const nodeSel = $("#newBaseNode");
  if (nodeSel) nodeSel.onchange = () => { newBaseCard.sel = nodeSel.value; renderBases(); };
  $$("#tab-bases [data-open]").forEach(b => b.onclick = () => {
    const [tier, rent] = b.dataset.open.split("|");
    const sel = $("#newBaseNode");
    if (sel && sel.value) openBase(sel.value, +tier, rent === "1");
  });
}

/* =========================================================================
   Einrichtung: Boden, Wände, Küche, Pflanzen – und die Ansicht von oben.

   Jedes Stück kostet einmalig und bringt Behaglichkeit. Die wirkt auf die
   Stimmung im Team: ein Büro mit Küche, Licht und ein bisschen Grün fängt
   mehr Ärger ab als vier Tische auf Sichtbeton.
   ========================================================================= */
const FLOORS = [
  { id: "beton",   name: "Sichtbeton",      price: 0,     comfort: 0, pattern: "none",   base: "#c6cad0" },
  { id: "vinyl",   name: "Vinyl",           price: 1600,  comfort: 2, pattern: "tiles",  base: "#b3bcc6" },
  { id: "fliesen", name: "Fliesen",         price: 3400,  comfort: 3, pattern: "tiles",  base: "#e1e7ee" },
  { id: "parkett", name: "Eichenparkett",   price: 7800,  comfort: 6, pattern: "planks", base: "#c89a60" },
  { id: "teppich", name: "Teppichfliesen",  price: 4900,  comfort: 5, pattern: "carpet", base: "#6d8cb5" }
];
/* Farbton, der über den Bodenbelag gelegt wird. */
const FLOOR_TINTS = [
  { id: "natur",  name: "Natur",      mix: null },
  { id: "warm",   name: "Warmgrau",   mix: "#b39a7c" },
  { id: "kuehl",  name: "Kühlgrau",   mix: "#8fa2b5" },
  { id: "sand",   name: "Sand",       mix: "#d8c49a" },
  { id: "schiefer", name: "Schiefer", mix: "#5d6672" },
  { id: "salbei", name: "Salbei",     mix: "#9bb8a3" }
];
const WALLS = [
  { id: "weiss",   name: "Reinweiß",     price: 0,    comfort: 0, color: "#f2f6fb" },
  { id: "creme",   name: "Creme",        price: 380,  comfort: 1, color: "#f6efe0" },
  { id: "salbei",  name: "Salbeigrün",   price: 520,  comfort: 2, color: "#d9e8db" },
  { id: "himmel",  name: "Himmelblau",   price: 520,  comfort: 2, color: "#d6e6f8" },
  { id: "terra",   name: "Terrakotta",   price: 640,  comfort: 2, color: "#f0d7c8" },
  { id: "petrol",  name: "Petrol",       price: 760,  comfort: 3, color: "#bcd9dd" },
  { id: "anthra",  name: "Anthrazit",    price: 760,  comfort: 1, color: "#9ba4ae" }
];
const KITCHENS = [
  { id: "keine",    name: "Keine Küche",      price: 0,     comfort: -2,
    info: "Mittagspause heißt: Bäcker um die Ecke." },
  { id: "nische",   name: "Kochnische",       price: 2400,  comfort: 3,
    info: "Spüle, Wasserkocher, Mikrowelle." },
  { id: "einbau",   name: "Einbauküche",      price: 9800,  comfort: 6,
    info: "Herd, großer Kühlschrank, Tisch für alle." },
  { id: "barista",  name: "Küche mit Siebträger", price: 18500, comfort: 10,
    info: "Wer guten Kaffee hat, bleibt länger freundlich." }
];
const PLANTS = [
  { id: "gruenlilie", name: "Grünlilie",     price: 60,   comfort: 1, h: 12, col: "#63b06a" },
  { id: "monstera",   name: "Monstera",      price: 180,  comfort: 2, h: 20, col: "#3f9257" },
  { id: "ficus",      name: "Ficus",         price: 260,  comfort: 2, h: 24, col: "#4b8f4e" },
  { id: "palme",      name: "Zimmerpalme",   price: 420,  comfort: 3, h: 28, col: "#57a46b" },
  { id: "olive",      name: "Olivenbäumchen", price: 640, comfort: 4, h: 26, col: "#8aa87c" },
  { id: "kaktus",     name: "Säulenkaktus",  price: 150,  comfort: 1, h: 18, col: "#6ea36b" }
];

function decoOf(b) {
  if (!b.deco) b.deco = { floor: "beton", tint: "natur", wall: "weiss", kitchen: "keine", plants: [] };
  if (!Array.isArray(b.deco.plants)) b.deco.plants = [];
  if (!b.deco.pos) b.deco.pos = { desks: {}, plants: {}, kitchen: null };
  const p = b.deco.pos;
  if (!p.desks) p.desks = {};
  if (!p.plants) p.plants = {};
  return b.deco;
}

/* Wohin ein Möbelstück gehört, wenn es noch nie jemand angefasst hat. */
const PLANT_SPOTS = [[46, 64], [354, 64], [46, 236], [354, 236], [46, 150], [354, 150],
                     [112, 258], [288, 258], [200, 258], [80, 100], [320, 100]];
function deskHome(b, i) {
  const t = tierOf(b), pf = perFloor(t), li = i % pf;
  const cols = pf <= 3 ? 2 : pf <= 6 ? 3 : 4;
  const rows = Math.ceil(pf / cols);
  const gw = 250 / cols, gh = 120 / Math.max(1, rows);
  return [84 + (li % cols) * gw + gw / 2, 128 + Math.floor(li / cols) * gh + gh / 2];
}
const deskFloor = (b, i) => Math.floor(i / perFloor(tierOf(b)));
const plantFloor = (b, i) => i % tierFloors(tierOf(b));
const floorName = f => f === 0 ? "Erdgeschoss" : f + ". Obergeschoss";
let officeFloor = 0;
function deskPos(b, i) { return decoOf(b).pos.desks[i] || deskHome(b, i); }
function plantPos(b, i) { return decoOf(b).pos.plants[i] || PLANT_SPOTS[i % PLANT_SPOTS.length]; }
function kitchenPos(b) { return decoOf(b).pos.kitchen || [200, 57]; }
function setPos(b, kind, i, xy) {
  const p = decoOf(b).pos;
  if (kind === "kitchen") p.kitchen = xy;
  else if (kind === "desk") p.desks[i] = xy;
  else p.plants[i] = xy;
}
function resetPos(b) {
  const p = decoOf(b).pos;
  p.desks = {}; p.plants = {}; p.kitchen = null;
}
function findBy(list, id) { return list.find(x => x.id === id) || list[0]; }
function plantSlots(b) { return [4, 7, 11, 18, 27][b.tier] || 4; }

/* Behaglichkeit: 0 bis etwa 30. */
function comfortOf(b) {
  const d = decoOf(b);
  let c = findBy(FLOORS, d.floor).comfort + findBy(WALLS, d.wall).comfort
        + findBy(KITCHENS, d.kitchen).comfort;
  d.plants.forEach(p => { const it = PLANTS.find(x => x.id === p); if (it) c += it.comfort; });
  c += tierOf(b).comfort || 0;                   /* Empfang, Kantine, Tageslicht */
  return Math.max(-2, Math.min(38, c));
}

function buyDeco(baseId, kind, id) {
  const b = baseById(baseId); if (!b) return;
  const d = decoOf(b);
  const list = { floor: FLOORS, wall: WALLS, kitchen: KITCHENS }[kind];
  if (!list) return;
  const it = findBy(list, id);
  if (d[kind] === it.id) return;
  if (it.price > S.money) return toast("Dafür fehlen " + money(it.price - S.money) + ".", "warn");
  if (it.price) { S.money -= it.price; S.expense += it.price; logMoney("deco", it.name + " · " + N[b.node].short, -it.price); }
  d[kind] = it.id;
  b.mood = clamp(b.mood + 2, 0, 100);
  toast(it.name + " eingebaut.", "ok", true);
  save(); renderOfficeModal(baseId); render();
}
function setTint(baseId, id) {
  const b = baseById(baseId); if (!b) return;
  decoOf(b).tint = findBy(FLOOR_TINTS, id).id;
  save(); renderOfficeModal(baseId);
}
function addPlant(baseId, id) {
  const b = baseById(baseId); if (!b) return;
  const d = decoOf(b), it = PLANTS.find(x => x.id === id);
  if (!it) return;
  if (d.plants.length >= plantSlots(b))
    return toast("Mehr Platz für Pflanzen ist hier nicht. Ein größeres Büro hätte mehr.", "warn");
  if (it.price > S.money) return toast("Dafür fehlen " + money(it.price - S.money) + ".", "warn");
  S.money -= it.price; S.expense += it.price;
  logMoney("deco", it.name + " · " + N[b.node].short, -it.price);
  d.plants.push(it.id);
  b.mood = clamp(b.mood + 1, 0, 100);
  save(); renderOfficeModal(baseId); render();
}
function removePlant(baseId, idx) {
  const b = baseById(baseId); if (!b) return;
  decoOf(b).plants.splice(idx, 1);
  save(); renderOfficeModal(baseId);
}

/* ------------------------- Ansicht von oben ------------------------------
   Ein Grundriss als SVG: Wände, Boden, Schreibtische mit den Gesichtern der
   Leute, Küchenzeile, Pflanzen, Tor zum Hof. Kein 3D – das würde auf dem
   Handy mehr kosten, als es bringt, und von oben sieht man ohnehin mehr. */
function officeSVG(b, w, detail, floor) {
  const d = decoOf(b), t = tierOf(b);
  const fl0 = clamp(floor || 0, 0, tierFloors(t) - 1);
  const fl = findBy(FLOORS, d.floor), tint = findBy(FLOOR_TINTS, d.tint);
  const wall = findBy(WALLS, d.wall), kit = findBy(KITCHENS, d.kitchen);
  const u = "of" + b.id;
  const W = 400, H = 300;
  const floorCol = tint.mix ? avMix(fl.base, tint.mix, 0.5) : fl.base;
  const dark = avMix(floorCol, "#000000", 0.16);

  const pattern = fl.pattern === "planks"
    ? `<pattern id="fp${u}" width="52" height="15" patternUnits="userSpaceOnUse">
         <rect width="52" height="15" fill="${floorCol}"/>
         <path d="M0 15 H52 M26 0 V15" stroke="${dark}" stroke-width="1" opacity="0.5"/></pattern>`
    : fl.pattern === "tiles"
    ? `<pattern id="fp${u}" width="26" height="26" patternUnits="userSpaceOnUse">
         <rect width="26" height="26" fill="${floorCol}"/>
         <path d="M0 26 H26 M26 0 V26" stroke="${dark}" stroke-width="1" opacity="0.45"/></pattern>`
    : fl.pattern === "carpet"
    ? `<pattern id="fp${u}" width="8" height="8" patternUnits="userSpaceOnUse">
         <rect width="8" height="8" fill="${floorCol}"/>
         <circle cx="2" cy="2" r="0.9" fill="${dark}" opacity="0.5"/>
         <circle cx="6" cy="6" r="0.9" fill="${dark}" opacity="0.5"/></pattern>`
    : `<pattern id="fp${u}" width="40" height="40" patternUnits="userSpaceOnUse">
         <rect width="40" height="40" fill="${floorCol}"/></pattern>`;

  /* Schreibtische: so viele wie Arbeitsplätze, besetzte bekommen ein Gesicht.
     Jedes Möbelstück sitzt in einer eigenen Gruppe und lässt sich ziehen. */
  let desks = "";
  for (let i = 0; i < t.desks; i++) {
    if (deskFloor(b, i) !== fl0) continue;
    const [cx, cy] = deskPos(b, i);
    const p = b.staff[i];
    desks += `<g class="fur" data-drag="desk|${i}" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">
      <rect x="-26" y="-13" width="52" height="26" rx="4" fill="#e4d3b6" stroke="#5d4a32" stroke-width="2"/>
      <rect x="-22" y="-10" width="16" height="11" rx="2" fill="#39485a" stroke="#22303f" stroke-width="1.4"/>
      ${p ? `<g transform="translate(9 0)">
               <circle r="12" fill="#cfe3fb" stroke="#0d1b2a" stroke-width="2"/>
               ${detail && p.av ? `<clipPath id="dc${u}${i}"><circle r="11"/></clipPath>
               <g clip-path="url(#dc${u}${i})" transform="translate(-11 -11) scale(0.183)">
                 ${avatarSVG(p.av, 120, { uid: "d" + u + i, bg: false }).replace(/^<svg[^>]*>/, "<g>").replace(/<\/svg>$/, "</g>")}
               </g>`
               : `<circle r="5" cy="-2" fill="#8fb6ff" stroke="#0d1b2a" stroke-width="1.6"/>
                  <path d="M-8 9 A9 8 0 0 1 8 9" fill="#8fb6ff" stroke="#0d1b2a" stroke-width="1.6"/>`}
             </g>`
          : `<circle cx="9" cy="0" r="7" fill="none" stroke="#8b99a8" stroke-width="2" stroke-dasharray="3 3"/>`}
    </g>`;
  }

  /* Küchenzeile – als Ganzes verschiebbar */
  const [kx, ky] = kitchenPos(b);
  const kitchen = fl0 > 0 ? "" : kit.id === "keine"
    ? `<text x="200" y="66" text-anchor="middle" font-size="11" fill="#7c8794"
             font-family="system-ui">keine Küche</text>`
    : `<g class="fur" data-drag="kitchen|0" transform="translate(${kx} ${ky})">
        <rect x="-80" y="-17" width="160" height="34" rx="5" fill="#dfe6ee" stroke="#0d1b2a" stroke-width="2.4"/>
        <rect x="-72" y="-11" width="34" height="22" rx="3" fill="#b9c4d0" stroke="#4a5867" stroke-width="1.6"/>
        <circle cx="-20" cy="0" r="7" fill="#9fb0c2" stroke="#4a5867" stroke-width="1.6"/>
        ${kit.id !== "nische" ? `<rect x="-2" y="-12" width="26" height="24" rx="3" fill="#f4f7fa" stroke="#4a5867" stroke-width="1.6"/>` : ""}
        ${kit.id === "barista" ? `<rect x="34" y="-13" width="34" height="26" rx="4" fill="#8d5a3b" stroke="#3c2617" stroke-width="2"/>
          <circle cx="51" cy="0" r="5" fill="#f0e2d2" stroke="#3c2617" stroke-width="1.4"/>` : ""}
        ${kit.id !== "nische" ? `<g><rect x="-50" y="29" width="90" height="28" rx="5" fill="#e4d3b6" stroke="#5d4a32" stroke-width="2"/>
          <circle cx="-60" cy="43" r="8" fill="#cbd6e2" stroke="#4a5867" stroke-width="1.8"/>
          <circle cx="50" cy="43" r="8" fill="#cbd6e2" stroke="#4a5867" stroke-width="1.8"/></g>` : ""}
       </g>`;

  /* Pflanzen */
  const plants = d.plants.map((pid, i) => {
    const it = PLANTS.find(x => x.id === pid); if (!it || plantFloor(b, i) !== fl0) return "";
    const [x, y] = plantPos(b, i);
    const r = it.h * 0.42;
    return `<g class="fur" data-drag="plant|${i}" transform="translate(${x} ${y})">
      <ellipse cx="0" cy="6" rx="${r * 0.9}" ry="${r * 0.45}" fill="#00000022"/>
      <circle r="${r}" fill="${it.col}" stroke="#20402a" stroke-width="2"/>
      <circle r="${r * 0.62}" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.25"/>
      <path d="M0 ${-r} V${r}" stroke="#20402a" stroke-width="1.2" opacity="0.4"/>
      <path d="M${-r} 0 H${r}" stroke="#20402a" stroke-width="1.2" opacity="0.4"/>
    </g>`;
  }).join("");

  /* Tor zum Hof, sobald es eine Halle ist */
  /* Treppenhaus und Etagenschild bei mehrstöckigen Gebäuden */
  const multi = tierFloors(t) > 1;
  const stairs = multi
    ? `<g transform="translate(318 44)"><rect width="46" height="40" rx="3" fill="#cfd6df" stroke="#0d1b2a" stroke-width="2"/>
        ${[0, 1, 2, 3, 4].map(k => `<path d="M${4 + k * 8} 36 V${8 + k * 6}" stroke="#7c8794" stroke-width="2"/>`).join("")}
        <text x="23" y="-4" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0d1b2a" font-family="system-ui">TREPPE</text></g>
       ${(() => { const lbl = (fl0 === 0 ? "EG" : fl0 + ". OG") + (fl0 === tierFloors(t) - 1 && fl0 > 0 && b.tier >= 4 ? " · Vorstand" : "");
          const w = Math.max(44, Math.round(lbl.length * 6.4 + 18));
          return `<g transform="translate(42 44)"><rect width="${w}" height="18" rx="9" fill="#0d1b2a"/>
        <text x="${w / 2}" y="12.5" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff" font-family="system-ui">${lbl}</text></g>`; })()}
       ${fl0 === 0 ? `<g transform="translate(150 236)"><rect width="100" height="22" rx="6" fill="#e9dcc0" stroke="#5d4a32" stroke-width="2"/>
        <text x="50" y="15" text-anchor="middle" font-size="9.5" font-weight="700" fill="#5d4a32" font-family="system-ui">EMPFANG</text></g>` : ""}` : "";
  const dock = b.tier > 0 && fl0 === 0
    ? `<rect x="300" y="268" width="76" height="14" rx="3" fill="#b8c3d0" stroke="#0d1b2a" stroke-width="2.4"/>
       <text x="338" y="279" text-anchor="middle" font-size="9" font-weight="700"
             fill="#0d1b2a" font-family="system-ui">HOF</text>` : "";

  return `<svg viewBox="0 0 ${W} ${H}" width="${w}" height="${Math.round(w * H / W)}"
    xmlns="http://www.w3.org/2000/svg" class="officeplan" role="img"
    aria-label="Grundriss ${esc(N[b.node].name)}">
    <defs>${pattern}</defs>
    <rect x="18" y="18" width="364" height="264" rx="10" fill="${wall.color}"
          stroke="#0d1b2a" stroke-width="7"/>
    <rect x="30" y="30" width="340" height="240" rx="5" fill="url(#fp${u})"
          stroke="${avMix(wall.color, "#000000", 0.25)}" stroke-width="2"/>
    <rect x="30" y="30" width="340" height="240" rx="5" fill="none"
          stroke="#ffffff" stroke-width="10" opacity="0.14"/>
    ${stairs}${kitchen}${desks}${plants}${dock}
    <rect x="30" y="140" width="9" height="46" fill="#8fb6ff" stroke="#0d1b2a" stroke-width="2"/>
    <path d="M361 96 a30 30 0 0 0 -30 30" fill="none" stroke="#0d1b2a" stroke-width="2" opacity="0.5"/>
    <rect x="361" y="96" width="9" height="34" fill="#c8b48f" stroke="#0d1b2a" stroke-width="2"/>
  </svg>`;
}

/* ------------------------- Einrichtungsdialog ---------------------------- */
let decoTab = "floor";
function openOffice(baseId) {
  decoTab = "floor"; officeFloor = 0;
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderOfficeModal(baseId);
}
function decoItemRow(b, kind, it, active) {
  return `<button class="decoitem${active ? " on" : ""}${!active && it.price > S.money ? " poor" : ""}"
      data-deco="${kind}|${b.id}|${it.id}">
    <span class="dn">${esc(it.name)}</span>
    ${it.info ? `<span class="di">${esc(it.info)}</span>` : ""}
    <span class="dp">${active ? "eingebaut" : (it.price ? money(it.price) : "kostenlos")}</span>
    ${it.comfort ? `<span class="dc${it.comfort < 0 ? " bad" : ""}">${it.comfort > 0 ? "+" : ""}${it.comfort} Behaglichkeit</span>` : ""}
  </button>`;
}
function renderOfficeModal(baseId) {
  const b = baseById(baseId); if (!b) return;
  if (!$("#modal").classList.contains("open")) return;
  const d = decoOf(b);
  const tabs = [["floor", "Boden"], ["wall", "Wände"], ["kitchen", "Küche"], ["plants", "Pflanzen"]];
  let list = "";
  if (decoTab === "floor") {
    list = FLOORS.map(it => decoItemRow(b, "floor", it, d.floor === it.id)).join("")
      + `<div class="sechead sm">Farbton</div><div class="tintrow">`
      + FLOOR_TINTS.map(t => `<button class="tint${d.tint === t.id ? " on" : ""}" data-tint="${b.id}|${t.id}"
          style="background:${t.mix || findBy(FLOORS, d.floor).base}" title="${esc(t.name)}"></button>`).join("")
      + `</div>`;
  } else if (decoTab === "wall") {
    list = WALLS.map(it => decoItemRow(b, "wall", it, d.wall === it.id)).join("");
  } else if (decoTab === "kitchen") {
    list = KITCHENS.map(it => decoItemRow(b, "kitchen", it, d.kitchen === it.id)).join("");
  } else {
    list = `<div class="sechead sm">Aufgestellt<small>${d.plants.length} von ${plantSlots(b)} Plätzen</small></div>`
      + (d.plants.length
        ? `<div class="plantrow">` + d.plants.map((pid, i) => {
            const it = PLANTS.find(x => x.id === pid) || PLANTS[0];
            return `<button class="plantchip" data-rmplant="${b.id}|${i}" title="entfernen">
              <i style="background:${it.col}"></i>${esc(it.name)}<b>✕</b></button>`;
          }).join("") + `</div>`
        : `<div class="empty sm">Noch nichts Grünes hier drin.</div>`)
      + `<div class="sechead sm">Kaufen</div>`
      + PLANTS.map(it => `<button class="decoitem${it.price > S.money ? " poor" : ""}" data-plant="${b.id}|${it.id}">
          <span class="dn"><i class="pdot" style="background:${it.col}"></i>${esc(it.name)}</span>
          <span class="dp">${money(it.price)}</span>
          <span class="dc">+${it.comfort} Behaglichkeit</span>
        </button>`).join("");
  }

  $("#modalBody").innerHTML = `
    <div class="mhead">
      <div><div class="mtitle">${tierOf(b).icon} ${esc(N[b.node].name)}</div>
      <div class="msub">${tierOf(b).name} · Behaglichkeit ${comfortOf(b)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button>
    </div>
    ${tierFloors(tierOf(b)) > 1 ? `<div class="vswitch floors">${Array.from({ length: tierFloors(tierOf(b)) }, (_, f) =>
      `<button class="${f === officeFloor ? "on" : ""}" data-floor="${f}">${f === 0 ? "EG" : f + ". OG"}</button>`).join("")}</div>` : ""}
    <div class="planwrap">${officeSVG(b, 360, true, officeFloor)}</div>
    <div class="planhint2">Möbel, Pflanzen und die Küche lassen sich mit dem Finger verschieben.</div>
    <div class="vswitch">${tabs.map(([k, n]) =>
      `<button class="${k === decoTab ? "on" : ""}" data-decotab="${k}">${n}</button>`).join("")}</div>
    <div class="decolist">${list}</div>
    <div class="mbtns">
      <button class="btn ghost" id="planReset">Möbel zurücksetzen</button>
      <button class="btn" id="mCancel">Fertig</button>
    </div>`;

  $("#mClose").onclick = closeModal;
  $("#mCancel").onclick = closeModal;
  const rs = $("#planReset");
  if (rs) rs.onclick = () => { resetPos(b); save(); renderOfficeModal(baseId); render(); };
  bindPlanDrag(baseId);
  $$("#modalBody [data-decotab]").forEach(x => x.onclick = () => { decoTab = x.dataset.decotab; renderOfficeModal(baseId); });
  $$("#modalBody [data-floor]").forEach(x => x.onclick = () => { officeFloor = +x.dataset.floor; renderOfficeModal(baseId); });
  $$("#modalBody [data-deco]").forEach(x => x.onclick = () => {
    const [kind, bid, id] = x.dataset.deco.split("|"); buyDeco(bid, kind, id);
  });
  $$("#modalBody [data-tint]").forEach(x => x.onclick = () => {
    const [bid, id] = x.dataset.tint.split("|"); setTint(bid, id);
  });
  $$("#modalBody [data-plant]").forEach(x => x.onclick = () => {
    const [bid, id] = x.dataset.plant.split("|"); addPlant(bid, id);
  });
  $$("#modalBody [data-rmplant]").forEach(x => x.onclick = () => {
    const [bid, i] = x.dataset.rmplant.split("|"); removePlant(bid, +i);
  });
}

/* =========================================================================
   Ziehen und Ablegen

   Zwei Fälle: Möbel im Grundriss an eine andere Stelle schieben, und Leute
   aus der Personalliste auf ein Fahrzeug oder in den Papierkorb ziehen.
   Beides über Zeigerereignisse, damit es auf dem Handy genauso läuft wie
   mit der Maus.
   ========================================================================= */

/* ---------------------- Möbel im Grundriss ------------------------------ */
function bindPlanDrag(baseId) {
  const svg = $("#modalBody .officeplan");
  if (!svg) return;
  const b = baseById(baseId); if (!b) return;
  let cur = null;

  const toPlan = (e) => {
    const r = svg.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 300];
  };

  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest ? e.target.closest("[data-drag]") : null;
    if (!g) return;
    e.preventDefault();
    const [kind, idx] = g.dataset.drag.split("|");
    const [px, py] = toPlan(e);
    const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute("transform") || "");
    const ox = m ? +m[1] : px, oy = m ? +m[2] : py;
    cur = { g, kind, idx: +idx, dx: ox - px, dy: oy - py };
    g.classList.add("dragging");
    svg.setPointerCapture(e.pointerId);
  });

  svg.addEventListener("pointermove", (e) => {
    if (!cur) return;
    const [px, py] = toPlan(e);
    /* Innerhalb der Wände bleiben */
    const x = clamp(px + cur.dx, 48, 352), y = clamp(py + cur.dy, 48, 252);
    cur.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    cur.last = [Math.round(x), Math.round(y)];
  });

  const end = () => {
    if (!cur) return;
    cur.g.classList.remove("dragging");
    if (cur.last) { setPos(b, cur.kind, cur.idx, cur.last); save(); renderDirty = true; }
    cur = null;
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
}

/* ------------------- Personal auf Fahrzeuge ziehen ---------------------- */
/* Ein Fahrzeug mit eigenem Fahrer fährt immer, unabhängig davon, wie viele
   andere gerade unterwegs sind – und ein Stück schneller. */
function driverOf(uid) {
  const f = S.fleet.find(x => x.uid === uid);
  if (!f || !f.driver) return null;
  for (const b of (S.bases || [])) {
    const s = b.staff.find(x => x.id === f.driver);
    if (s) return s;
  }
  return null;
}
function setDriver(uid, staffId) {
  const f = S.fleet.find(x => x.uid === uid); if (!f) return;
  const b = baseOfVehicle(uid); if (!b) return;
  const s = b.staff.find(x => x.id === staffId); if (!s) return;
  if (s.role !== "fahr")
    return toast(s.name + " ist " + ROLES[s.role].name + " – ein Fahrzeug übernimmt nur Fahrpersonal.", "warn");
  /* Niemand fährt zwei Fahrzeuge gleichzeitig */
  S.fleet.forEach(x => { if (x.driver === staffId) x.driver = null; });
  f.driver = staffId;
  toast("🧑‍✈️ " + s.name + " übernimmt " + vType(f.type).name + ".", "ok");
  save(); render();
}
function clearDriver(uid) {
  const f = S.fleet.find(x => x.uid === uid); if (!f) return;
  f.driver = null; save(); render();
}
function vehSpeedFactor(veh) {
  const d = driverOf(veh.uid);
  return d ? 1 + d.skill * 0.02 : 1;
}

/* Allgemeine Ziehhilfe für Listeneinträge. */
function makeDraggable(el, payload) {
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;        /* Knöpfe bleiben Knöpfe */
    const startX = e.clientX, startY = e.clientY;
    let ghost = null, active = false;
    const move = (ev) => {
      if (!active && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 9) return;
      if (!active) {
        active = true;
        document.body.classList.add("dragging-staff");
        openDropBar(payload);
        ghost = document.createElement("div");
        ghost.className = "dragghost";
        ghost.innerHTML = el.innerHTML;
        document.body.appendChild(ghost);
        el.classList.add("ghosted");
      }
      ev.preventDefault();
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = under && under.closest ? under.closest("[data-drop]") : null;
      $$("[data-drop]").forEach(z => z.classList.toggle("over", z === zone));
    };
    const up = (ev) => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      if (!active) return;
      document.body.classList.remove("dragging-staff");
      el.classList.remove("ghosted");
      if (ghost) ghost.remove();
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const zone = under && under.closest ? under.closest("[data-drop]") : null;
      $$("[data-drop]").forEach(z => z.classList.remove("over"));
      if (zone) handleStaffDrop(payload, zone.dataset.drop);
      closeDropBar();
    };
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  });
}

/* Beim Ziehen erscheinen die Ziele als Leiste am unteren Rand. Auf dem
   Handy liegt die Fahrzeugliste sonst außerhalb des Bildes, und man müsste
   mit dem Finger am Kartenrand entlangscrollen. */
function openDropBar(payload) {
  const [baseId, staffId] = payload.split("|");
  const b = baseById(baseId); if (!b) return;
  const s = b.staff.find(x => x.id === staffId);
  const bar = $("#dropbar"); if (!bar) return;
  const vehs = b.vehicles.map(u => S.fleet.find(f => f.uid === u)).filter(Boolean);
  const canDrive = s && s.role === "fahr";
  bar.innerHTML = `
    <div class="dropbar-in">
      <div class="dropbar-t">${esc(s ? s.name : "")} ablegen auf …</div>
      <div class="dropbar-row">
        <div class="dropbar-scroll">
        ${canDrive ? vehs.map(f => {
          const dr = driverOf(f.uid);
          return `<div class="dropzone veh" data-drop="veh:${f.uid}">
            <i>${vType(f.type).icon}</i><span>${esc(vType(f.type).name)}</span>
            <small>${dr ? "jetzt " + esc(dr.name.split(" ")[0]) : "frei"}</small></div>`;
        }).join("") || `<div class="dropzone dead"><i>🚚</i><span>Kein Fahrzeug am Standort</span></div>`
        : `<div class="dropzone dead"><i>🚚</i><span>Nur Fahrpersonal übernimmt ein Fahrzeug</span></div>`}
        </div>
        <div class="dropzone fire" data-drop="fire"><i>🗑️</i><span>Kündigen</span>
          <small>${s ? money(s.wage * 14) + " Abfindung" : ""}</small></div>
      </div>
    </div>`;
  bar.classList.add("on");
}
function closeDropBar() {
  const bar = $("#dropbar");
  if (bar) { bar.classList.remove("on"); bar.innerHTML = ""; }
}

function handleStaffDrop(payload, target) {
  const [baseId, staffId] = payload.split("|");
  const b = baseById(baseId); if (!b) return;
  const s = b.staff.find(x => x.id === staffId); if (!s) return;
  if (target === "fire") {
    askConfirm(s.name + " kündigen?",
      "Die Abfindung beträgt " + money(s.wage * 14) + ". Die Stelle ist danach frei.",
      "Kündigen", () => fire(baseId, staffId), true);
    return;
  }
  const [kind, uid] = target.split(":");
  if (kind === "veh") setDriver(uid, staffId);
}
