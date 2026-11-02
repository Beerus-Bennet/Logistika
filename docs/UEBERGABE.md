# Übergabe: Projekt LOGISTIKA (Stand v245, 02.11.2026)

> **Historisches Dokument.** Übergabe aus einer früheren Claude-Sitzung (ohne Push-Rechte, Lieferung per ZIP). Der Stand auf GitHub ist inzwischen weiter – aktuelle Hinweise und Regeln stehen in `CLAUDE.md`, die Versionsgeschichte in `AENDERUNGEN.md`.
> Bereits erledigt: v245 ist auf `main` angekommen, Push-Rechte funktionieren (Arbeit läuft über Branches `claude/…` und Pull Requests).
> Gekürzt gegenüber dem Original: Abschnitt 5 (Code-Auszüge) – der Code steht vollständig in `kunden.js`, `vip.js` und `game.js`.

---

## 1. Projektziel

- **LOGISTIKA** ist eine Logistik-Simulation im Comic-Look auf einer echten OpenStreetMap-Karte. Das Spiel ist deutsch, Code-Kommentare und Texte ebenso.
- **Spielverlauf:** Man startet als Erbe von Opas heruntergekommenem Obsthof bei Werder (Havel). Der Hof ist eine 3D-Ansicht im Aufbau-Stil: Felder, Obstbäume, Tiere, Backofen und Mühle, Lieferungen per Lastenrad und Simson in die Dörfer. Dahinter folgen Wald, das alte Sägewerk von Nachbar Krüger und die Fischerei am Glindower See. Wenn Hof, Holz und Fischerei laufen, wird daraus eine **Spedition**.
- **Spedition:** wächst in 6 Etappen von Berlin (Etappe 1) über Brandenburg/Mitteldeutschland, Deutschland, Europa und Eurasien/Transatlantik bis zur ganzen Welt.
- **Verkehrsträger:** Lastenrad/Fahrrad, Lkw, Bahn, Binnenschiff, Seeschiff, Luftfracht. Die Fahrzeuge sind reale Modelle.
- **Wunsch von Bennet:** Fahrzeuge, Situationen und Aufträge sollen realistisch sein, das Design comicmäßig. Das Spiel soll eine PWA sein und auch unterwegs auf dem Handy laufen.
- **Nebenstränge:** Auktionshaus mit realen Sportwagen, Übernahmen von Konkurrenten (Konzerne), Büros und Personal, VIP-Sonderfahrten, Missionen, Rahmenverträge, Graumarkt-Nebengeschäfte (Mr. Snus, Don Pablo), Jagd/Hochsitz, Holzfällen in der Ich-Perspektive, Hütte zum Vermieten, Zoll, Minispiele.
- **Für wen:** Spieler auf Handy und Desktop, Veröffentlichung über GitHub Pages. Zielgruppe darüber hinaus nicht festgelegt **(unklar)**.
- **Beteiligte:** Bennet entwickelt mit Claude und testet selbst über GitHub Pages. Ein **Kollege** arbeitet parallel am Fischerei-Teil (siehe `ZUSAMMENFUEHREN.md`).

---

## 2. Stand der Übergabe

### Umgesetzt in der damaligen Sitzung (v230–v245)
Alles im Testbrowser (Playwright, Chromium, 390 px) geprüft, **nichts auf einem echten Handy**.

- **v230 – Firmensitz nach Übernahme (`corp.js`):** Sitz wird in `S.corp.hq[id]` vorgemerkt statt für 18 % verkauft; `corpHqOpen`, `corpHqTry`, rückwirkend `corpHqRepair`, neue Übernahmen `hq: 1`.
- **v231 – Papierkorb auf der Bestelltafel:** ✕ nicht mehr sticky, `dropGo` zeichnet neu, größere Knöpfe, 🗑️ statt ↩︎. Ursache nur angenommen.
- **v232 – Arbeiter nach der Mittagspause (`team.js`):** `staffRise`, Aufholen entlang der Route (`staffFollow`, `routeProject`, `staffRouteDist`), `STAFF_GAP = 0,8`.
- **v233 – Streife seltener (`events.js`, `maybeStreife`):** 8 % statt 30 %, 3 Spieltage Sperre.
- **v234 – Schatten (`gl3d.js`, `updateCamera`):** Tiefenbereich folgt dem Kameraziel.
- **v235 – Männer-Avatare (`avatar.js`):** nur `AV_HAIR_M_SAFE`, `avFixMale` stellt alte um.
- **v236 – Nicht stören (`extras.js`, `vip.js`):** `uiBusy()`, `busyFreeze`, Fristen verschieben sich.
- **v237 – Autohandel steuerlich:** Garagenautos als Handelsware, `taxWare`, `S.taxAdj`, Verlustvortrag `S.taxLoss`.
- **v238 – Preise Hof/Sägewerk/Fischerei (`farm.js`):** bester Ladenpreis +30–50 % plus 5 € + 0,80 €/km, Daueraufträge +35 %, Migration `F.econ238`.
- **v239 – Schatzkiste (`worldview.js`):** Kamera fliegt zurück.
- **v240 – Easter Egg (`team.js`):** dreimal telefonierende Kraft antippen → Chat, danach `s.noPhone`.
- **v241 – Kaufangebote unter 30 % Marktanteil (`corp.js`):** Beteiligung oder Komplettverkauf.
- **v242 – Favoriten reservieren Ware:** `farmFavReserve`, `farmOrderReadyFree`.
- **v243 – Firmenwert (`corp.js` `corpStageK`):** Etappe des Firmensitzes zählt.
- **v244 – „Masterprompt V2“ Wirtschaft:** Spielpreise, `PAY_K = 2.5`, Leasing entfernt (mit Migration), Etappen nach Level und Lieferungen, erstes Binnenschiff in Etappe 2, flottengerechte Aufträge, Modul `kunden.js`.
- **v245 – Aufträge auf Speditionsniveau:** Textkette mit Konsistenzprüfung, 64 Kundenprofile, Beziehungsstufen, Verhandlung aus nachvollziehbaren Faktoren, klare Begriffe bei Ausschreibungen, Geschäftsprojekte, neue Kartenstruktur, Test `auftraege.test.js` (nur lokal), `o.regK` für alte Aufträge.

### Damals nachgewiesen
- `auftraege.test.js`: 13 Tests grün (u. a. 15.000 Text-Kombinationen ohne Widerspruch).
- Browser-Massentest: 2.000 Aufträge über Etappe 1–6, 0 ersetzte Texte, 62 von 64 Profilen, rund 500 Titel.
- Laufzeittest: 72 Spielstunden ohne Fehler.
- camp, forest, hunt, jail grün; **axe und trees schlagen fehl, auch schon vorher**.

---

## 3. Technik

- Vanilla JavaScript (`"use strict"`, globale Skripte), HTML, CSS. Kein Framework, kein Build, keine externe Bibliothek. 3D: eigene WebGL2-Engine `gl3d.js` (kein Three.js, gewollt). Karte: eigene Slippy-Map `map.js` mit OSM-Kacheln.
- PWA: `manifest.webmanifest`, `sw.js` (App-Shell, Kartenkacheln `MAX_TILES = 900`, Autofotos `logistika-carpics`).
- Speicherung: globales `S` in `localStorage`, Schlüssel `logistika.save.v3`; Testmodus `?test` / `?test=100` unter `logistika.test.v3` (Level 100, 1 Mio. €). Hof in `S.farm` (intern `F`).
- Tests: Node mit `vm` und `assert`, `*.test.js` im Wurzelordner, zum Ausführen nach `tests/` kopieren.
- Browser-Tests: Playwright mit vorinstalliertem Chromium gegen `python3 -m http.server` (Server getrennt starten, nicht über eine Pipe). `renderHud` wirft im Teststand harmlose Fehler.
- Ladereihenfolge: siehe `index.html`.

### Wichtige Dateien

| Datei | Aufgabe |
|---|---|
| `data.js` | `NODES`, `VEHICLES`, `VEH_PRICE_V244`, `PAY_K`, `STAGES`, `CARGO`, `SHIPPERS` (Fallback), `MODE_INFO`, `NO_LAND_LINK` |
| `game.js` | Kern: Weltmodell, Aufträge (`makeOrder`, `priceOrder`, `pickShipper`, `spawnOrders`), Routing (`buildVariants`, `assignFor`, `planOptions`), Vorschau (`dispatchPreview`, `missingReason`, `previewHTML`), Planer, `renderOrders`, `tick`, `save`/`boot`, `econMigrate`, Etappen |
| `kunden.js` | Kundenprofile `CUSTOMERS`, Textkette (`orderStory`), Beziehungsstufen, Projekte `SERIES`, Erfolge, `orderSpecialHTML` |
| `vip.js` | Sonderfahrten, Konkurrenz (`RIVALS`, `rivalOnSpawn`, `tickRivals`), Verhandlung (`negoModel`, `negoHTML`, `bindNego`), Marktanteil, `orderExtraHTML` |
| `extras.js` | `calm()`, Telefon (`phoneMsg`), Entscheidungen (`DECISIONS`), Reputation, Hooks `onOrderSpawn`/`onJobStart`/`onDelivered`, Steuern, Kredit, `uiBusy` |
| `goals.js` | Rahmenverträge, Missionen, Tagesaufgaben, Erfolge (`ACHS`) |
| `corp.js` | Übernahmen, Konzerne, Firmenwert, Kaufangebote |
| `offices.js` | Standorte/Büros, Personal, Diensthandy |
| `events.js` | Störungen, Pannen, Streife |
| `auction.js`, `cars.js` | Auktionshaus, Sportwagen |
| `customs.js`, `livery.js`, `places.js`, `routegeo.js`, `map.js` | Zoll, Lackierung, Adressen, Routen, Karte |
| `snus.js`, `pablo.js`, `wallet.js` | Graumarkt, Solana |
| `farm*.js`, `erbe*.js`, `fish*.js`, `team.js` | Hof, große Welt, Fischerei, Personal |
| `worldview.js`, `woodmodels.js`, `forest*.js` u. a. | 3D-Welt |
| `hunt.js`, `fpsaw.js`, `minigames.js`, `jail.js`, `lucky.js`, `loading.js` | Jagd, Ich-Perspektive, Minispiele, Haft, Luckybox, Packspiel |
| `intro.js`, `avatar.js`, `photo.js` | Charaktererstellung, Tutorial, Avatare |
| `zcheck.js` | Entwicklerwerkzeug, nicht geladen |
| `carart.mjs`, `carpics.mjs`, Workflows, `cars/` | Autobilder fürs Auktionshaus (Ablauf **unklar**) |

### Ablauf eines Speditionsauftrags (v245)
1. `makeOrder` → Ladungsart (`pickCargo`), Gewicht, Route; `priceOrder` → Preis.
2. `pickShipper` → `custPick`, setzt `o.shipper`, `o.desc`, `o.cid`, `o.gi`.
3. `onOrderSpawn(o)`: `repPayFactor`, dann `kundenOnSpawn`, dann `rivalOnSpawn`.
4. `renderOrders` mit `orderStory(o)` und `dispatchPreview(o)`.
5. Planer: `negoHTML`, `bindNego`.
6. `onJobStart` entfernt `o.rival`. 7. `onDelivered` → `kundenDelivered`.
8. `tick` → `tickRivals`, `kundenTick`; täglich `kundenDay` → `seriesOffer`.

---

## 4. Getroffene Entscheidungen

### v245 – Aufträge
- Text aus den Daten statt aus Geschichtentöpfen je Ladungsart (vorher Widersprüche wie „Schiffsladung“ bei Bahnaufträgen).
- Prüfung vor jeder Anzeige mit neutralem Ersatztext; Fehler zählen in `TEXT_ERRORS`.
- Verkehrsträger nur aus den echten Routenvarianten (`buildVariants`).
- Keine Einheit „kt“; Bahn nennt Wagenzahl.
- Unplausible Kombinationen werden über die Kundenauswahl gelöst, die Auftragserzeugung blieb unverändert.
- Reale Firmennamen nur für Unternehmen, die schon vorher vorkamen; keine behaupteten Verträge.
- Konkurrenz nur dort, wo sie simuliert wird (`o.rival`).
- Verhandlung deterministisch aus sichtbaren Faktoren, ±2 % verdeckter Rest.
- Stammkunden-Zuschläge: +3 % (ab 3), +6 % (ab 10) statt +4/+8/+12 %.
- Projekte als Geschäftsereignisse; alte Schlüssel `ernte`, `filiale`, `umzug` bleiben.

### v244 – Wirtschaft
- Spielpreise statt Listenpreise, `PAY_K = 2.5`.
- Bennets Vorgabe: „Die 20–35 Aufträge sollten als wirtschaftlicher Fortschrittszyklus verstanden werden, nicht als starre Kaufregel. Ein günstiger Kleintransporter kann früher erreichbar sein, während ein großer Spezial-Lkw länger benötigt. Dadurch bleibt die Herausforderung erhalten, ohne dass Spieler in Etappe 2 oder 3 feststecken.“
- Leasing entfernt mit Migration; Etappen nach Level und Lieferungen; Erfahrungspunkte ohne Aufschlag (`o.pk`).

### Frühere
- v230 Firmensitz vormerken · v237 Autos als Wareneinsatz · v238 Futter/Köder als Hilfsstoffe · v241 „Beides zur Wahl“ · v243 Etappe des Firmensitzes.

---

## 6. Anforderungen & Regeln

### Arbeitsweise mit Bennet
- Immer Deutsch. Versionierung bei jeder Lieferung (`sw.js`, `index.html`, `AENDERUNGEN.md`, `ZUSAMMENFUEHREN.md`).
- Damals: Lieferung als ZIP ohne `*.test.js` (inzwischen durch Branches und Pull Requests ersetzt).
- Ehrlich berichten, nie Handy-Tests behaupten. Commits beginnen mit `vNNN: …`. Vor Arbeit `git fetch`.
- Kollege an der Fischerei: Zusammenführungen dokumentieren.

### Code-Konventionen
- Deutsche Kommentare mit Versionsmarken; CSS-Blöcke am Ende von `style.css`.
- Spielstände nie brechen (Migrationen mit Merkmal, alte Felder tolerieren).
- IDs: Knoten `b-mitte`, `b-ber`, `hamburg` …; Fahrzeuge `v-…`; Kundenprofile kurze Schlüssel.
- Ladungsarten: `pak`, `express`, `pal`, `kuehl`, `schuett`, `adr`, `sperrig`, `cont` (+ Sonderarten `schmuck`, `snus`, `ware` mit `minStage: 99`).
- Verkehrsträger: `r` Straße, `b` Rad, `l` Bahn, `i` Binnenschiff, `s` See, `a` Luft.
- Auftragsfelder: `id`, `from`, `to`, `cargo`, `weight` (kg), `pay`, `deadline`, `expire`, `refDist`, `refTime`, `shipper`, `desc`, `cid`, `gi`, `pk`, optional `rival`, `nego`, `reg`, `regK`, `series`, `contract`, `intro`, `air`, `acc`, `abo`, `farm`, `jewel`, `vip`, `mission`, `tut`/`tutNext`.

### Wirtschaft (v244)
- Fahrzeugpreise in `VEH_PRICE_V244` (z. B. Caddy 8.900 €, Sprinter 15.000 €, Scania 39.000 €, Goldhofer 320.000 €; Schiene/See/Luft 15–20 % des Listenpreises). Schiffe: Spits 27.000 € (E2), Kempenaar 85.000 € (E2), GMS 170.000 € (E3).
- `PAY_K = 2.5`, Container ab 9 t, Kredit je Etappe (`LOAN_BASE`).
- Etappen: E2 Level 3 + 25 Lieferungen · E3 Level 9 + 120 · E4 Level 26 + 600 · E5 Level 34 + 1.200 · E6 Level 42 + 2.000.
- Leasing-Migration (`econMigrate`, `S.econ = 244`).
- Flottengerechte Aufträge: fahrbare Ladungsarten dreimal so oft, 72 % zugeschnitten.

### Aufträge, Kunden, Konkurrenz (v245)
- Kundenprofil `{ id, n, br, st, home?, port?, f, gen?, g }`; 64 Profile (57 + 7 Ersatzprofile).
- Mengenformate: ab 1.000 kg Tonnen, nie „kt“; Container 24 t; Stückgut höchstens 6.
- Bahn-Wagen: Container 2 je Wagen, Schüttgut 60 t, Kessel 55 t, Flach 50 t, Güter 25 t; über 40 Wagen „verteilt auf mehrere Züge“.
- Seehafen = Typ `port` mit `s`.
- Beziehungsstufen: 0 Neukunde · 1 Bekannter Geschäftspartner · 2 Stammkunde (ab 3) · 3 Bevorzugter Logistikpartner (ab 10); über 30 % verspätet höchstens Stufe 1.
- Verhandlung: Faktoren +6 % Basis, Express +6 % / enges Zeitfenster +4 %, Volumen +2/+4 %, Strecke > 800 km +2 %, Spezialladung +3 %, Stufe 2/3 +3/+6 %, Verspätungen −4 %, Konkurrenz −5 %, Rest ±2 %; Grenze +2 … +32 %.
- Begriffe: Angebotsfrist (`o.expire`), Konkurrenzangebot (`o.rival`), Vergabe (bei `o.rival.at`), Liefer-/Rahmenvertrag (`goals.js`).
- Projekte (`SERIES`): `halle`, `ernte`, `bau`, `hafen`, `filiale`, `umzug`; ab 15 Lieferungen, Bonus 35 % (verspätet 15 %).
- Sprachstandard: professionell, sachlich, wenig Emojis auf Karten.

### Weitere Regeln
- Marktanteil: +1 je eigene Tour, +1 für Mitbewerber je verlorenem Auftrag, täglich ×0,8; unter 30 % Kaufangebot (Beteiligung 25 % oder Komplettverkauf).
- Firmenwert der Konkurrenz: Grundwert × Etappenfaktor × (0,7 + 1,6 × Marktanteil).
- Steuern 30 %, Autohandel mit Wareneinsatz und Verlustvortrag.

---

## 7. Offene Punkte (Stand Übergabe)

1. ~~Push-Rechte / ZIP v245~~ – erledigt.
2. `auftraege.test.js` existiert nicht im Repository; bei Bedarf neu anlegen (Prüfumfang: Profile vollständig, 15.000 Kombinationen, Bahnfall 1.000 t, Straßentext, Widerspruchserkennung, 5.000 Zufallsaufträge, Einheiten, Präpositionen, Beziehungsstufen, Zuschlag einmalig, alte Aufträge, Projekttexte, Verhandlungsmodell). Hinweis: vm-Arrays nicht mit `deepStrictEqual` vergleichen.
3. Nicht auf dem Handy geprüft: v231–v245 (besonders v231, v232, v240, v245-Karten).
4. Routenplanung bietet unplausible Verkehrsträger an (Luftfracht für Diesel, Express per Binnenschiff) – nur in `buildVariants`/`makeOrder` änderbar.
5. Etappe 6 erzeugt sehr große Mengen (z. B. 200.000 t Kühlware).
6. Fahrzeuge zu alten Preisen gekauft: Verkauf nur 62 % des neuen Preises.
7. Level-Grenzen Etappe 4–6 sind Schätzungen.
8. `axe.test.js` und `trees.test.js` schlagen fehl.
9. `sw.js` `SHELL` enthält `?v=109`-Adressen **(unklar, ob gewollt)**.
10. Autobilder fürs Auktionshaus (Gemini, in 10er-Schritten; erste 10 Porsches erledigt) – Stand **unklar**.
11. Zusammenführung mit dem Kollegen (Fischerei) – Stand **unklar**.

## 8. Offene Fragen

- Unplausible Verkehrsträger in der Auftragserzeugung unterbinden?
- Auftragsmengen in Etappe 5–6 begrenzen?
- Sollen Testdateien ins Repository?
- Ist die `?v=109`-Liste in `sw.js` gewollt?
- Passen Stammkunden-Zuschläge und Verhandlungsspannen aus Spielersicht?
- Stand der Autobilder und der Fischerei-Arbeit des Kollegen?
