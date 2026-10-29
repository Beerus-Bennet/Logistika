# Zwei Stände zusammenführen (v46 + Fischerei vom Kollegen)

## Stand v215 – Briefkasten (auf v214)

- Nur `rent.js`: Briefkasten in `pathMesh` auf x −40,6, z 20,7.

## Stand v214 – Briefkasten (auf v213)

- Nur `rent.js`: Briefkasten in `pathMesh` von x −41,4 nach x −38,8.

## Stand v213 – Übergänge am Parkfleck (auf v212)

- Nur `rent.js`: neue Helfer `padK`/`padCol`, `pathMesh` mit `gnd: padCol` und längerem `fade`, `padMesh` färbt Fleck und Spuren über `padCol`; Pfadende `[-44.9, 22.35]`.

## Stand v212 – Parkfleck der Hütte (auf v211)

- Nur `rent.js`: `PATH` endet auf dem Parkfleck (`[-44.6, 22.7]`), `forestPath` mit `fade` statt Straßenmündung; neue Konstante `PAD_DIRT`; `padMesh` zeichnet die Reifenspuren entlang `CAR_IN`/`CAR_OUT`; `route` nutzt den ganzen Pfad.

## Stand v211 – Kettensäge ohne Ruckeln (auf v210)

| Datei | Änderung |
|---|---|
| `fpsaw.js` | neu `wallKey`, `wallInto`, `wallMemo`, `warmWalls`, `trunkFromWalls`, `staticTop`; `notchMesh` mit `WALLc` und Parameter `sel`; `begin`: `sty._cuts/_ylow/_yfix`, Stamm aus Wandstücken, Knoten `X.ntS`; `step`: Vorbau, fester Oberteil, Drossel 70 ms; `fall` blendet `X.ntS` aus; Testhilfen |
| `sw.js`, `index.html` | Version v211 |

## Stand v210 – Quell-Wasserfall überarbeitet (auf v209)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `SPRING_FALL` (top, foot, rinne, strands); neu `ICO_V/ICO_F`, `ROCK_*`, `stone`, `fallSheet`; `springRocks` neu; `springFall` mit Nebensträngen; `springFoam` Schaum unter den Strängen; `springHill`: Felsen über `stone`, ohne Moospolster am Zulauf, Grasbüschel |
| `gl3d.js` | `fallWater`: Fäden, Bahnen, Ränder, Nachthelligkeit, unregelmäßige Ringe |
| `worldview.js` | Partikelfarbe nach Tageslicht, Spritzer an den Strängen, `springFx.strands`, Schlüssel …210 |
| `sw.js`, `index.html` | Version v210 |

## Stand v209 – Zutaten-Tipp in Rezeptkacheln (auf v208)

| Datei | Änderung |
|---|---|
| `farmview.js` | `recChipAt`, Prüfung im Klick der Rezeptkachel, `nopress` beim Aufsetzen |
| `style.css` | `.frec.nopress:active` |
| `sw.js`, `index.html` | Version v209 |

## Stand v208 – Ladebucht quer zum Weg (auf v207)

| Datei | Änderung |
|---|---|
| `erbe.js` | `LKW_BAY`; Hauptweg mit Punkt (−41, −24,5), ohne (−40,4, −19,95); Zufahrt gerade; Umstellung `F.v208lkw` (nach v203) |
| `erbedata.js` | Stellplatz `r: 1` |
| `farmview.js` | `lkwRoute`, neu `lkwRy`, Drehung des Stellplatz-Knotens, Laster parkt gedreht |
| `bauplatz.js` | Drehung des Lkw-Bauplatzes |
| `woodmodels.js` | `sawLkw`: Fläche 2,4 cm höher |
| `worldview.js` | keine Wegkappe am Stellplatz |
| `sw.js`, `index.html` | Version v208 |

## Stand v207 – Herkunft des Quellwassers (auf v206)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `SRUN`, `srcWater`, `yAlong`, `hillH`, `springHill`, `springRun`, `springCascades`, `springRunFoam`, `springRunInfo` (+ Exporte); `springRocks` ohne Rückwand, Steinkranz offen |
| `worldview.js` | neue Knoten, Becken water 2, Partikel `WV.springRun`, Maske für den Hang |
| `erbe.js` | `FWORLD.springHill`, `inSpringHill`, `treeSpotOk`, Umstellung `F.v207hill` |
| `sw.js`, `index.html` | Version v207 |

## Stand v206 – gemeinsames Stall-Limit (auf v205)

| Datei | Änderung |
|---|---|
| `farmdata.js` | `FPEN_SHARED`, `FPEN_MAX`; `lim` der Ställe entfernt; Texte |
| `farm.js` | `shopCount`, `shopLimit` |
| `farmview.js` | Hinweis „Alle 7 Ställe belegt“ |
| `sw.js`, `index.html` | Version v206 |

## Stand v205 – Hofteich (auf v204)

| Datei | Änderung |
|---|---|
| `farmmodels.js` | `pondProps`: Ringe weg, Treibholz, Bootslage; `pondReeds`: Lage an der Wasserlinie, Horste |
| `sw.js`, `index.html` | Version v205 |

## Stand v204 – Quell-Wasserfall (auf v203)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `SPRING_FALL` (top, foot, basin), `springRocks` (Flanken, Rückwand, Mulde, Steinkranz), neu `springBasin` + Export |
| `worldview.js` | Becken-Knoten (water: 1), Modellschlüssel …204 |
| `sw.js`, `index.html` | Version v204 |

## Stand v203 – Lkw-Stellplatz neben dem Weg (auf v202)

| Datei | Änderung |
|---|---|
| `erbe.js` | `LKW_BAY`, `inLkwBay` neu; Hauptweg mit Punkt (−40,4, −19,95); Zufahrt ersetzt; Umstellung `F.v203lkw` |
| `erbedata.js` | Stellplatz x −46,5 |
| `worldview.js` | Schottersaum aus `LKW_BAY` |
| `farmview.js` | `lkwRoute` |
| `sw.js`, `index.html` | Version v203 |

## Stand v202 – Fehleranzeige (auf v201)

| Datei | Änderung |
|---|---|
| `index.html` | Fehler-Handler: nacktes „Script error.“ ohne Banner; Stack als Fundstelle; Version v202 |
| `sw.js` | Version v202 |

## Stand v201 – Neuer Ladescreen (auf v200)

| Datei | Änderung |
|---|---|
| `farmview.js` | `farmBoot` neu; neue Funktionen `ldMake`, `ldStart`, `ldTreeSVG`, Konstanten `LD_MSG`, `LD_TRUCK`, `LD_BG`, `LD_LH` |
| `style.css` | Abschnitt „v90: Ladescreen“ ersetzt durch „v201: Ladescreen“ (`#farmBoot …`) |
| `sw.js`, `index.html` | Version v201 |

## Stand v200 – Jagd: Identität, Seltenheit, Bergung, Jagdbuch, Aufträge (auf v199)

| Datei | Änderung |
|---|---|
| `hunt.js` | Neuer Abschnitt Identität: `genes`, `COATS`, `FORMS`, `AGES`, `RAR`, `RAR_V`, `withLook`/`LOOK`/`PAL0`, `lookKey`, `antF`; Hilfen `vn3`, `pie`, `scarK`. Modelle: Rumpfbreite, Mähne, Halsstärke, graues Gesicht, Schecke, Narbe (Hirsch, Keiler), Schlitzohr, Fasan ohne Ring/Federfarben (`PHC.fA…`), Stoßlänge, Geweihform `F` (Auslage, ungerade, doppelte Aug-, abnorme Sprosse, fünfte Krone). `traits(k, s, gn)` (Pl, odd, Namen). `build`, `headPts`, `calcDead` (Kopfanker `ha`, `A.headAt`), `trophyBuild`/`trophyKey` im Aussehen des Stücks. Wiesenwild mit Erbgut und Tönung. Neuer Abschnitt Wert/Schussnote/Jagdbuch/Bestleistungen/Aufträge: `valueOf`, `extraOf`, `shotOf`, `stars`, `dexAll`, `hv200` (Altbestand), `dexPut`, `pbPut`, `JOBT`, `jobsEnsure`, `jobsEval`, `jobsLost`, `stats`. `collSync` entfernt mit `weakFirst`; `sellRec` mit Aufschlag, ohne Ehrenplatz; `pinRec`. Bergung: `presOf`, `showWin` (Seltenheitsband, Enthüllung), `callHTML` + Positionierung in `harvestStep`, `cardHTML` (Plaketten, Schussnote, Rekord), `keepTrophy` (Jagdbuch, Rekorde, Aufträge, einmalig), `showSaved`. UI: `.hu-call`, `.hu-job`. Fernglas: `farFeat`. Wand: `WALL` (Reiter, Filter, Sortierung, Seiten), `wandHTML`, `buchHTML`, `jobsHTML`, `wallBind`. Schautafel `showMesh`/`showSync`, `pick`/`sheet` öffnen die Wand. Hochsitz-Fenster mit Aufträgen und Jagdbuch-Stand. Förster-Nachricht `H.jann`. Markt: Ehrenplatz ausgenommen, Aufschlag. Medaillentext Diamant „Herausragendes Stück“. Exporte `stats`, `genes`, `valueOf`, `shotOf`, `RAR`, `COATS`, `FORMS`, `dexAll`, `_v200` |
| `goals.js` | fünf Jagd-Erfolge, `huntSt()` |
| `style.css` | v200-Block: Seltenheitsband, Vignette je Stufe, Merkmals-Hinweis, Plaketten, Schussnote, Rekord, Jagdbuch-/Auftragszeilen, Auftragszeile im Revier, Hochsitz-Aufträge, Wand-Reiter/Filter/Ehrenplatz/Neu, Jagdbuch, Aufträge |
| `hunt.test.js` | 5 neue Tests (Identität, Verteilung, Modelle je Decke/Form, Wert/Schussnote, Jagdbuch/Aufträge/Ehrenplatz) |
| `index.html`, `sw.js` | Version 200 |

## Stand v199 – Mieter männlich/weiblich (auf v198)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `person()`: `fem` (Kleid, schmaler), `broad`, Armabstand |
| `rent.js` | `GEN`, `lookOf()`, `ensureActors` nutzt sie (Mesh-Schlüssel mit `g199`) |
| `index.html`, `sw.js` | Version 199 |

## Stand v198 – Arbeitermenü scrollbar (auf v197)

| Datei | Änderung |
|---|---|
| `team.js` | `renderStaffPop`: Halten bricht bei Bewegung/Scrollen ab, kein Neuzeichnen unter dem Finger |
| `style.css` | Kacheln: `touch-action: pan-y`, kein iOS-Callout |
| `index.html`, `sw.js` | Version 198 |

## Stand v197 – Zufahrt Lkw-Stellplatz (auf v196)

| Datei | Änderung |
|---|---|
| `erbe.js` | `FWORLD.paths`: Stützpunkt auf Weg 0, neuer Weg 6 (Zufahrt) |
| `worldview.js` | `loose()` ohne Lkw-Stellplatz |
| `farmview.js` | `lkwRoute` über die Zufahrt |
| `index.html`, `sw.js` | Version 197 |

## Stand v196 – Angelsteg ohne Boot, Fisch auf dem Schild (auf v195)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `pier()`: Ruderboot und Leine entfernt; Fisch auf dem Schild kleiner und mittig |
| `index.html`, `sw.js` | Version 196 |

## Stand v195 – Teich statisch und detailreicher (auf v194)

| Datei | Änderung |
|---|---|
| `farmmodels.js` | `pondCol()`/`PW_F`/`PW_LENS`, `pondWater` neu (feines Gitter, Farbfunktion), `pondProps` mit Seerosen, Ringen, Wasserlinsen, Steinen, Kieseln, Treibholz |
| `farmview.js` | Teichwasser `water: 1`; Enten ohne Wippen und Heckwelle; Schaum konstant |
| `worldview.js` | Teichwasser `water: 1` |
| `index.html`, `sw.js` | Version 195 |

## Stand v194 – Quelle–Bach-Übergang (auf v193)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `springGeo.dU` mit weichem Minimum (k = 3,2); `springPool2` schneidet am vereinigten Feld, Gitter größer (`Hs = RP·1,2 + 4,2`) |
| `worldview.js` | `CR.taper` `[0, 0]`; Topfwasser `water: 2` |
| `index.html`, `sw.js` | Version 194 |

## Stand v193 – Wasserfall im Shader (auf v192)

| Datei | Änderung |
|---|---|
| `gl3d.js` | FS: `uniform vec4 uFlow`, `hsh`/`vnoise`/`fallWater()`, Zweig `uWater > 5.5` (Farbe und Deckkraft aus `vCol` als Koordinaten), Ausgabe `aOut`; `draw()`: `uFlow` aus `n.flow`; Partikel-FS: `shape` 4 (Nebel) und 5 (Tropfen) |
| `woodmodels.js` | `springFall()` neu (Rinne + Kante + Wurfbogen, 34 × 12, beidseitig, Vertexfarbe = Koordinaten), neu `springFoam()` (exportiert), Kantenstein in `springRocks` |
| `worldview.js` | Knoten `wspringfall193` und `wspringfoam193` mit `water: 6`, `flow`, `alpha: 0.98`; Gischt in `worldStep` mit festen Raten (`WV.springFx.acc`) |
| `index.html`, `sw.js` | Version 193 |

## Stand v192 – Hütte am See, Nagel-Spiel (auf v191)

| Datei | Änderung |
|---|---|
| `rent.js` | `ruinMesh(stage)` komplett neu (Hilfen `logSeg`, `pk`, `hh`, `triUp`, Farben `RW`, Maße `RA/EAVE/RIDGE/RL/DZR`); neu `yardMesh`, `phase()` (aus `S.farm.depot.rent`), `PHASES`, `phaseHTML()`; Welt: drei Ruinen-Knoten `rent_ruin{0,1,2}_v192`, Boden `rent_yard_v192`, Pfad immer sichtbar (Deckkraft je Zustand), Staub beim Zustandswechsel; `PATH[1..2]` enger an der Veranda; `buildNow(q)` speichert `T.q`; Antippen/Hinweis höher; Export `phase`, `PHASES` |
| `minigames.js` | `MG_GAMES.nails` komplett neu (Canvas `#mgNc`, `TIER`, `zone`, `speed`, `strike`, `finish`, `draw`, `nail`, `hammer`); Schnittstelle unverändert (`short`, `title` → `{ ok, score }`) |
| `bauplatz.js` | Reihe der Hütte am See bei z 6,4 (vorher 6,15); `layout()` liefert `tools`; Werkzeugplatz-Knoten `site:tools192` in `sync()`, `toolsMesh` |
| `style.css` | `.rn-ph` (Schrittleiste), `.mg-ncv`, `.mg-nprog` |
| `index.html`, `sw.js` | Version 192 |

## Stand v191 – Wasserfall, Quelle größer (auf v190)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `SPR.RP` 3 → 4,5; `SPRING_FALL = { top, foot, S: 1.5 }`; `springRocks` rechnet lokal mit Radius 3 (`SPR.RP / S`); `springFall` komplett neu (Wurfbogen-Fläche 16 × 12, beidseitig, Rinne, Schaum-Halbscheibe) |
| `worldview.js` | Felsen-/Fall-Knoten mit `s: SF.S`, Schlüssel `wspring191`/`wspringfall191`; `WV.springFx` um `lx/lz/ly/dx/dz/side/w` erweitert; Wasserstränge und Gischt in `worldStep`; `stamp` um die Quelle 10 (Mitte 2,5 vor dem Bachanfang) |
| `erbe.js` | Baumplätze: Quelle 11 (vorher 8) |
| `team.js` | Wegnetz: Quelle 7,5 (vorher 5,5) |
| `index.html`, `sw.js` | Version 191 |

## Stand v190 – Bach breiter, große Quelle (auf v189)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `creekStations`: Breitenfaktor `o.w`; Bachsteine im Umkreis des Quelltopfs entfallen (`o.spring`); neu `springGeo` (Abstandsfeld Topf ∪ Bach), `clipLT`, `springBank` (Ufer, y 0,02), `springPool2` (Topfwasser, y 0,044), `springInfo`, `springFall`, `SPRING_FALL`, `SPR`; `springRocks` neu (Felswand); `springBed`/`springPool` liefern leere Meshes |
| `worldview.js` | `CR = { taper: [6,0], min: 0.7, w: 1.5 }`, Quellknoten (Ufer, Wasser `water: 4`, Felsen `wspring190`, Fall `wspringfall190` mit `glow`), `WV.springFx` + Gischt in `worldStep`, `stamp` Bach 3,3 und Kreis 7,5 um die Quelle, `worldPierFrame` 2,75 statt 2,3 |
| `erbe.js` | Baumplätze: Bach 3,2 (vorher 2,6) und 8 um die Quelle; zweite Prüfung 3,6 (vorher 3) |
| `farm.js` | Bauplatz-Prüfung Bach 2,8 (vorher 2,2) |
| `team.js` | Wegnetz: Wald-Bach 2,1 (vorher 1,5), Quelle 5,5 gesperrt |
| `index.html`, `sw.js` | Version 190 |

## Stand v189 – Bachsteg (auf v188)

| Datei | Änderung |
|---|---|
| `woodmodels.js` | `pier()` komplett neu (Maße gleich: Laufsteg 1,3, Kopf bis 2,25, Belag 0,15), neu `PIER_DIM` (exportiert) und `pierFish` |
| `fishdata.js` | `FGROUNDS`: Eintrag `bachsteg` (`pier: true`) direkt nach `steg` – `FGROUNDS[0]` bleibt der Seesteg |
| `erbe.js` | `farmGroundOk`: `g.pier` → Seesteg gebaut und Wald offen |
| `fishview.js` | `openFishingAt`/`fishStart` für `G.pier` (Kamera, Wurfstelle `WV.pier.cast`, Pose enger), Bootsliste ohne Bachsteg, Rute `WV.pier.rod`, Text in `stegFishHTML` |
| `worldview.js` | Steg-Knoten mit Angler/Rute (`WV.pier`, Mesh-Schlüssel `wpier189`), Wurfstelle in `FGROUNDS`, `worldPierTap` + Antippen in `worldTap`, Sichtbarkeit in `worldSync` |
| `index.html`, `sw.js` | Version 189 |

## Stand v188 – Ablegen je Material, Stapel am Bauplatz (auf v187)

| Datei | Änderung |
|---|---|
| `bauplatz.js` | **neu** – Modul `SITE3D`: Orte und Reihen je Bauplatz (`anchor`), feste Plätze nach der Bauliste (`layout`), Stapel (`sync`), Ablegen mit Kamera und fallenden Gebinden (`deliver`), Verbrauch beim Bauen, Antippen (`pick`, `open`); nutzt `SWK.UNIT` aus `sawwerk.js` |
| `farm.js` | `siteReady`, `sitePutOne` neu; `sitePutAll` legt nur noch vollständige Materialien ab und gibt `{ Ware: Gebinde }` zurück (vorher eine Zahl) |
| `farmview.js` | `siteNeedHTML` (Chip `rdy` + 📦↓), neu `siteRowHTML` (Karte mit eigenem Knopf `data-dep1="Platz|Ware"`), `siteDepHTML` (Beschriftung je nach Stand), `siteDepBind` (einzeln + alle, dann `SITE3D.deliver`) |
| `rent.js`, `hunt.js` | Material-Karten über `siteRowHTML`; Hochsitz: `siteMesh` ohne Deko-Stämme/-Bretter (Schlüssel `hunt_site_v188`) |
| `worldview.js` | `SITE3D.attach` nach `RENT.attach`, `SITE3D.sync` in `worldSync`, `SITE3D.step` nach `RENT.step`, Antippen nach der Hütte, `SITE3D.busy()` in `worldBusy` |
| `style.css` | `.hu-need.rdy/.dep`, `.fdep-one`, `.fchip.rdy`, `.fdep-st` |
| `index.html`, `sw.js` | `bauplatz.js` nach `rent.js`; Version 188 |

- Falls der Kollege `sitePutAll` anderswo aufruft: Rückgabe ist jetzt ein Objekt (leer = nichts abgelegt).

## Stand v187 – Ablegen-Knopf (auf v186)

- `farmview.js`: `siteDepHTML` ohne Erklärtext, Knopf-Klasse `fdep-btn`. `style.css`: `.fdep-row`, `.fdep-btn`, `.hu-needs ~ .fs-row .btn` (volle Breite), `.fdep-row small` entfällt.

## Stand v186 – Bauplatz-Lager (auf v185)

- `farm.js`: neue Funktionen `siteN`, `siteHave`, `siteMissing`, `sitePutAll`, `siteTake` (Spielstand `S.farm.depot[key][id]`, key z. B. `"rent"`, `"hunt"`, `"f_huette"`, `"saw:motor"`, `"saw:lkw"`, `"up:saege2"`, `"stage:4"`).
- `erbe.js`: `farmRepairCheck/Done`, `farmSawUpgrade`, `farmFishBuildCheck/Build`, `farmStageCheck/Up` rechnen mit `siteMissing`/`siteTake` statt `farmMissing`/`farmTake`.
- `farmview.js`: `siteNeedHTML`, `siteDepHTML`, `siteDepBind` (nach `itemChip`).
- `worldview.js`: `openSawRepair`, `worldRepair`, `openLkw`, `openPlot`, `machExtraHTML/Bind`, `stageHTML`, `stageBind` mit Ablage.
- `hunt.js`/`rent.js`: `missing()` und Bau über den Bauplatz, Ablegen-Zeile im Bau-Fenster. `style.css`: `.fdep-*`, `.fchip.dep`.

## Gesamtpaket v183 – v185 (auf GitHub-Stand v182)

Alle drei Stände von heute in einem Paket, Endstand v185. Einfach alle Dateien ins Hauptverzeichnis laden und überschreiben – die Einzel-ZIPs v183, v184 und v185 braucht es danach nicht mehr.

| Stand | Inhalt | Dateien |
|---|---|---|
| v183 | Spiel öffnet beim Start den zuletzt offenen Reiter | `game.js` |
| v184 | Gebietsknöpfe links am Hof entfernt | `worldview.js`, `style.css` |
| v185 | Sägewerk: neue Maschinen und sichtbarer Produktionsablauf | **neu `sawwerk.js`**, `woodmodels.js`, `worldview.js`, `farmview.js` |
| alle | Version, Ladeliste, Doku | `index.html`, `sw.js`, `AENDERUNGEN.md`, `ZUSAMMENFUEHREN.md` |

## Stand v185 – Sägewerk-Maschinen (auf v184)

| Datei | Änderung |
|---|---|
| `sawwerk.js` | **neu** – Modul `SWK`: Designsystem (`P`, `ACC`), Bausteine, Werkstücke, Maschinenmodelle (`BODY`/`PARTS`), Sägehalle (`hallInterior`, `hallParts`), Ablauf (`attach`, `step`, `st`) |
| `woodmodels.js` | `machine(t, bare)` und `saegebock(bare)` rufen nur noch `SWK`; in `sawHall(m, pv, lvl)` ist der alte Block „Gattersäge … Förderband“ durch `SWK.hallInterior` ersetzt (nur wenn die Säge kaputt ist – repariert kommt die Einrichtung als Teil mit Hallenlicht); Späne auf dem Hallenboden nur noch hinten; Export `WT, BARK` |
| `worldview.js` | `objVar`/`worldObjMesh` für `sw_halle` mit Stufe (`o.lvl`); Maschinen-Meshes heißen `mach2:`/`saegebock2`; `worldObjParts`: `SWK.attach` statt `parts.blades`; `worldStep`: `SWK.step` statt Sägeblatt-Wippen und Sägebock-Spänen; `OBJ_H` der Maschinen angepasst |
| `farmview.js` | `startPlace`: Vorschau mit `SWK.attach(proto, ghost, {}, true)` statt der Sägeblätter |
| `index.html`, `sw.js` | `sawwerk.js` nach `woodmodels.js`; Version 185 |

- Falls der Kollege in `machine()`/`saegebock()`/`sawHall()` etwas geändert hat: Die Modelle stehen jetzt in `sawwerk.js` (`BODY.<typ>`), die beweglichen Teile in `PARTS.<typ>`, der Ablauf in `STEP.<typ>`.
- Lage der Maschinenteile bezieht sich auf die Maschinenmitte (vor dem Drehen), Fluss −x → +x, Bediener +z – gedreht wird über den Wurzelknoten wie bisher.

## Stand v184 – Gebietsknöpfe entfernt (auf v183)

| Datei | Änderung |
|---|---|
| `worldview.js` | `worldDOM` legt `#farmAreas` nicht mehr an (räumt ein altes weg); `worldUI` ohne Knopf-Block |
| `style.css` | `#farmAreas`, `.farea…` und die Desktop-Variante gelöscht (`.farea-req` bleibt) |
| `index.html`, `sw.js` | Version 184 |

## Stand v183 – Letzten Reiter merken (auf v182)

| Datei | Änderung |
|---|---|
| `game.js` | `showTab`: `S.lastTab = name` (nur wenn `S.player`); `boot`: Start-Reiter aus `S.lastTab` (erlaubt: map, farm, orders, jobs, fleet, bases, market, world; nicht im Tutorial, vor der Gründung nur farm) |
| `index.html`, `sw.js` | Version 183 |

## Stand v182 – Hütte am See (auf v181)

- **Neue Datei `rent.js`** (Modul `RENT`, Spielstand `S.farm.rent`) – einfach mit übernehmen, `index.html` lädt sie nach `hunt.js`.
- `worldview.js`: `RENT.clear` in `bgTreeOk` und `wFreeGround`; `RENT.attach(R)` nach `HUNT.attach`; `RENT.pick` nach dem Hochsitz-Pick; Tag `rent` nach dem Hochsitz-Tag; `RENT.step` nach `HUNT.step`.
- `erbe.js`: `RENT.tick()` in `farmErbeTick` (nach `pvTick`).
- `team.js`: `navHit` mit `walls || []`.
- `style.css`: `.rent-iss`. `sw.js`: `rent.js` in der Liste.
- Falls der Kollege auf der Freifläche westlich vom See (x −52 … −30, z 19 … 40) etwas gebaut hat: Hütte (`H`), Pfad (`PATH`) und Parkfleck (`CAR`) stehen oben in `rent.js`.

## Stand v181 – Nachbar wegschicken (auf v180)

- `erbe.js`: neue Funktion `farmNeighborSend()` (setzt `until` und ruft `farmEvEnd()`). `worldview.js`: Knopf `#fnNo` in `openNeighbor`.

## Stand v180 – gleich breiter Strand (auf v179)

- `worldview.js`: `lkW = () => 2.2`; Wege-Einbuchtungen mit 3,5 Abstand und Breite 3,2 / Radius; Mesh-Keys `lake*180`.

## Stand v179 – runde Mündung (auf v178)

- `woodmodels.js`: `creekMouthSt` – kubische Bézierkurve vom echten Seeufer (T2) zum Bachufer (T1), Wasser-Stationen folgen dem Seeufer (`cross(l)`); Aussparungen in `lakeFoam`/`lakeShore` 0,26 rad. `worldview.js`: `mouth.R = 7`.

## Stand v178 – weichere Mündung (auf v177)

- `woodmodels.js`: `creekMouthSt` mit Bézierkurve statt Kreisbogen; Stationen haben `wS` (Strandbreite) und `cw` (Seefarben-Anteil); neu `crR`. `worldview.js`: `CL.mouth` bekommt `shoreW`.

## Stand v177 – Mündung mit Ausrundung und Fließübergang (auf v176)

- `gl3d.js`: Wellen als Funktionen `wavG`/`wavC`, neuer Wassermodus 5 (Fluss → See an `uMouth` = `R.env.mouth` [x, z, Radius]); `setScene` setzt `uMouth`.
- `woodmodels.js`: Bach komplett über Stationen (`creekFrame`, `creekMouthSt`, `creekStations`); `o.mouth = { R, shoreD }`.
- `worldview.js`: `lkShoreD`, Mündungspunkt `LK_MP`, `R.env.mouth`, Seebach `water: 5`; Mesh-Keys `lake*177`.

## Stand v176 – Bachmündung, Wasser und Ufer einheitlich (auf v175)

- `worldview.js`: der Seeufer-Block (`Lk`, `lkObs`, `lkW` …) steht jetzt **vor** dem Bach-Abschnitt (der Seebach braucht `lkShoreCol`); neu `lkDent`, `lkShoreCol`, `LK_MOUTH`, `LCR` (Seebach mit Startpunkt im See). Teich und Seebach `water: 4`. Mesh-Keys `lake*176`.
- `woodmodels.js`: `bandW` entfernt, neu `creekProfile`/`creekMouth`; `creekBank`, `creekWater`, `springBed`, `springPool` neu; `lakeShore(…, skip)` und `lakeFoam(…, skip)`.
- `gl3d.js`: `big = step(1.5, uWater)` – alle bewegten Gewässer im Muster des großen Sees.
- `farmview.js`: Teich und Netzbecken `water: 4`.

## Stand v175 – Ufer weicht auch vor Wegen zurück (auf v174)

- Nur `worldview.js`: der v174-Block (Gebäude-Dellen + `lkB`/`lkW`) ist ersetzt durch `lkObs` (Gebäude + Punkte von `LAKE_WAY`, `LAKE_EAST`, `LAKE_STEM`), daraus `setLakeDents` und `lkW`. Mesh-Keys `lakeShore/Water/Foam/Reeds175`.
- Beim Zusammenführen: falls die Wege am See verändert wurden, passt sich das Ufer automatisch an.

## Stand v174 – Ufer-Einbuchtungen (auf v173)

| Teil | Datei |
|---|---|
| `LAKE_DENTS`, `setLakeDents`, `lakeR` | `woodmodels.js` |
| Einbuchtungen je Gebäude, Mesh-Schlüssel | `worldview.js` |
| Version | `sw.js`, `index.html` |

## Stand v173 – Seeufer (auf v172)

| Teil | Datei |
|---|---|
| Sandring im Gelände raus, Strandbreite und Farbe übergeben | `worldview.js` |
| `lakeShore` mit Geländefarbe und variabler Breite | `woodmodels.js` |
| Version | `sw.js`, `index.html` |

## Stand v172 – Großer See wie der Teich (auf v171)

| Teil | Datei |
|---|---|
| Ufer, Wasserverlauf, Saum, Schilf | `woodmodels.js` |
| Einbau, flache Stellen, Wasser-Modus 4 | `worldview.js` |
| Wasser-Modus 4 im Shader | `gl3d.js` |
| Version | `sw.js`, `index.html` |

## Gesamtpaket v144 – v171 (alles von heute in einem ZIP)

Enthält den Endstand aller Dateien, die sich seit v143 geändert haben (26 Dateien, keine gelöschten, keine Tests). Einfach alle Dateien ins Repo-Wurzelverzeichnis hochladen und bestehende überschreiben – die Einzel-ZIPs v144 … v171 sind darin vollständig enthalten.

Neu hinzugekommen: `routegeo.js` (v150), `treebark.js` (v152).
Geändert: `AENDERUNGEN.md`, `ZUSAMMENFUEHREN.md`, `auction.js`, `corp.js`, `erbe.js`, `erbedata.js`, `farm.js`, `farmmodels.js`, `farmview.js`, `forestmodels.js`, `fpsaw.js`, `game.js`, `gl3d.js`, `hunt.js`, `index.html`, `lucky.js`, `map.js`, `offices.js`, `style.css`, `sw.js`, `team.js`, `vip.js`, `woodmodels.js`, `worldview.js`.

## Stand v171 – Level getrennt (auf v170)

| Teil | Datei |
|---|---|
| checkLevel aufgeteilt, logiUnlocks, logiLevelShow, Haken in showTab/closeModal | game.js |
| #logiLvl, .flv.logi | style.css |
| Version | index.html, sw.js |

## Stand v170 – Konzern-Wellen und Übernahme-Show (auf v169)

| Teil | Datei |
|---|---|
| Wellen, Marktführung, Show, Imperium, Stammkunden | corp.js |
| rivalById/Sync, Gewichtung, corpDay-Haken, Konzern-Tag | vip.js |
| #corpShow, Imperium-/Lead-Leisten | style.css |
| Version | index.html, sw.js |

## Stand v169 – Lkw-Stellplatz (auf v168)

| Teil | Datei |
|---|---|
| neue Lage, FFIXED | erbedata.js |
| inLkwBay, Migration v169lkw | erbe.js |
| Freihalten, Schotter | worldview.js |
| lkwRoute | farmview.js |
| Version | index.html, sw.js |

## Stand v168 – Ablehnen-Knopf (auf v167)

| Teil | Datei |
|---|---|
| dropGo, Delegation | farmview.js |
| Version | index.html, sw.js |

## Stand v167 – Schatz-Kamera (auf v166)

| Teil | Datei |
|---|---|
| worldTreasureCam / CamBack | worldview.js |
| Neigungs-Override FV.camOv | farmview.js |
| Version | index.html, sw.js |

## Stand v166 – Ereignis-Absicherung (auf v165)

| Teil | Datei |
|---|---|
| Spieluhr try/catch | game.js |
| Schatz-/PV-Takt abgesichert | erbe.js, worldview.js |
| X per Delegation | farmview.js |
| Version | index.html, sw.js |

## Stand v165 – Zutaten-Tipp ohne Produktion (auf v164)

| Teil | Datei |
|---|---|
| Klick auf Chip in .frec stoppen | farmview.js |
| Version | index.html, sw.js |

## Stand v164 – Favoriten-Stern (auf v163)

| Teil | Datei |
|---|---|
| Stern, Sortierung | farmview.js, style.css |
| staffFavPlan, prio 3 | team.js |
| Dispo-Vorrang | game.js, offices.js |
| Version | index.html, sw.js |

## Stand v163 – Dispo sortiert Unrentables aus (auf v162)

| Teil | Datei |
|---|---|
| dispoPurge / dispoProfitable | offices.js |
| evalFullCost, Annahmeschwelle | game.js |
| Version | index.html, sw.js |

## Stand v162 – Traktor frei beweglich, Halle entfernt (auf v161)

| Teil | Datei |
|---|---|
| Zone „wild“, Prüfung `farmWildOk`, Straßenrand-Sperren | farm.js |
| Traktor-Objekt (Größe) | erbedata.js |
| Migration `farmTractorEnsure` | erbe.js |
| Popup, Lager, Platzieren | farmview.js |
| Mesh, alte Halle/Traktor raus | worldview.js |
| Version | index.html, sw.js |

## Stand v161 – Etappen-Knopf live (auf v160)

| Teil | Datei |
|---|---|
| stageLiveTick + Animation | game.js, style.css |
| Version | index.html, sw.js |

## Stand v160 – Verhandlung emotional (auf v159)

| Teil | Datei |
|---|---|
| Emotionale Antworten + Prinzip-Aufschlag | corp.js |
| Version | index.html, sw.js |

## Stand v159 – Fortbildungs-Meldung neu (auf v158)

| Teil | Datei |
|---|---|
| Porträt-Bildgröße (`big: 2`) | worldview.js |
| Meldung neu gebaut | team.js, style.css |
| Version | index.html, sw.js |

## Stand v158 – Verschieben deckend (auf v157)

| Teil | Datei |
|---|---|
| Geisterbild deckend + Sägeblatt | farmview.js |
| Version | index.html, sw.js |

## Stand v157 – Telefonat nur mit Büro (auf v156)

| Teil | Datei |
|---|---|
| Anruf/Blase nur mit Büro | team.js |
| Version | index.html, sw.js |

## Stand v156 – Headhunter für jedes Büro (auf v155)

| Teil | Datei |
|---|---|
| Gratis-Fachkraft je Büro | lucky.js, offices.js, corp.js |
| Version | index.html, sw.js |

## Stand v155 – Sägewerk-Büro 3D-Icons (auf v154)

| Teil | Datei |
|---|---|
| Maschinen-Chips mit 3D-Bildchen | worldview.js, style.css |
| Version | index.html, sw.js |

## Stand v154 – Lack passend zum Foto (auf v153)

| Teil | Datei |
|---|---|
| Lackerkennung aus Foto, Angleich Lose/Garage/Verlauf | auction.js |
| Version | index.html, sw.js |

## Stand v153 – Grafikfehler (auf v152)

| Teil | Datei |
|---|---|
| Nahe Ebene im Auge-Blick 1,1 → 0,3 | `hunt.js` (Zeile mit `c.near = …`) |
| Lichtsäule nur bei flachem Blick, sonst Lichtfleck (`stepLife`, Knoten `lpatch`); stetige Bodenfarbe, ein Lichtungston (`worldGroundCol`) | `worldview.js` |
| `lightPatch()` | `forestmodels.js` |
| Version | `index.html`, `sw.js` |

## Stand v152 – gemeinsames Baumsystem (auf v151)

| Teil | Datei |
|---|---|
| Rinde, Relief, Stamm, Markierungen (aus fpsaw.js herausgelöst) | `treebark.js` (neu, nach woodmodels.js laden) |
| `tree(sp, sz, v, hi)`, `leafClump`, `spruceLayer`, `stub`, Stumpf, Windwurf, Setzling | `woodmodels.js` |
| Detailstufen (TLOD, `treeLodStep`, `bgGH`/`bgHi`), Inselbäume | `worldview.js` |
| Schattenmodell `smesh` für Knoten und Instanzgruppen | `gl3d.js` |
| TBARK statt eigener Rinde, Variante/Samen, `b.keep` | `fpsaw.js` |
| Obstbaum | `farmmodels.js` |
| Version, Skript/Cache-Eintrag | `sw.js`, `index.html` |

## Stand v151 – Eiche: Zacken am Stamm (auf v150)

| Teil | Datei |
|---|---|
| `taperB` (Relief kantenlinear), `emitBark` (Facettenschnitt), `barkStyle` (`fc`,`la0`) | `fpsaw.js` |
| Version | `sw.js`, `index.html` |

## Stand v150 – Routen auf echten Wegen (auf v149)

| Teil | Datei |
|---|---|
| Wege/Seewege/Flüsse/Großkreise, Straßen-Routing | `routegeo.js` (neu) |
| `pathPts` mit Fahrart, `roadLine`, `vehPoint`, `parkHere`, `routeGm` | `game.js` |
| `unwrapLons` behält `gm` | `map.js` |
| Skript eingebunden, Version | `index.html`, `sw.js` |

## Stand v149 – Säge/Axt bleibt in 3D (auf v148)

| Teil | Datei |
|---|---|
| `can()` schließt auslaufenden Lauf ab | `fpsaw.js` |
| Version | `sw.js`, `index.html` |

## Stand v148 – iOS-Lupe aus (auf v147)

| Teil | Datei |
|---|---|
| touchstart/Auswahl abfangen | `game.js` |
| Auswahl-CSS | `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v147 – Flotte: Alle Arten (auf v146)

| Teil | Datei |
|---|---|
| Chip „Alle Arten“ setzt Filter zurück | `game.js` |
| Version | `sw.js`, `index.html` |

## Stand v146 – Hindernisse für Tiere, Falter, Menschen (auf v145)

| Teil | Datei |
|---|---|
| Wegenetz um Steine/Felsen, Helfer `wanderPlan` … | `team.js` |
| Wildtiere, Falter, `WV.rockObs` | `worldview.js` |
| Wildwiese Hirsch/Keiler | `hunt.js` |
| Version | `sw.js`, `index.html` |

## Stand v145 – Tipp-Karte entfernt (auf v144)

| Teil | Datei |
|---|---|
| Tipp-Karte raus | `game.js` |
| Version | `sw.js`, `index.html` |

## Stand v144 – Stand-Schieber wie bei Arbeitern (auf v143)

| Teil | Datei |
|---|---|
| Schnellknöpfe raus, Feinknöpfe | `worldview.js` |
| Version | `sw.js`, `index.html` |

## Stand v143 – kein Köder-Vorrat (auf v142)

| Teil | Datei |
|---|---|
| Fischer-Vorrat entfernt, Aufräumen | `team.js`, `erbe.js` |
| Version | `sw.js`, `index.html` |

## Stand v142 – Mengengrenze genau, alle Berufe (auf v141)

| Teil | Datei |
|---|---|
| Grenze in Anzeige-Einheit, Umrechnung, alle Berufe, Holzfäller, Fischer-Vorrat, Schieber/Feinknöpfe | `team.js` |
| Köder-Vorrat beim Angeln | `erbe.js` |
| Feinknöpfe | `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v141 – Herkunft der Maschinenaufträge (auf v140)

| Teil | Datei |
|---|---|
| `job.who`, `S.farm.mlog`, `farmQueueBy` | `farm.js` |
| Grund beim Einstellen durch Arbeiter | `team.js` |
| Berts Dauerbestellung | `erbe.js` |
| Plakette und Verlauf im Maschinenfenster | `farmview.js`, `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v140 – Text Daueraufträge (auf v139)

| Teil | Datei |
|---|---|
| Zusatz hinter dem Preis entfernt | `farmview.js` |
| Version | `sw.js`, `index.html` |

## Stand v139 – Mengen-Schieber am Stand (auf v138)

| Teil | Datei |
|---|---|
| Schieber im Stand-Fenster | `worldview.js` |
| Schieber-Stil | `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v138 – Mengengrenze (auf v137)

| Teil | Datei |
|---|---|
| Grenze speichern/prüfen, Säen/Ernten/Rezeptwahl, Schieber und Halten in der Freigabe-Liste | `team.js` |
| Schieber-Stil | `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v137 – Produktionsstätten deaktivieren (auf v136)

| Teil | Datei |
|---|---|
| Knopf „Deaktivieren“ im Maschinenfenster | `farmview.js` |
| Arbeiter überspringen deaktivierte Maschinen | `team.js` |
| Knopf-Stil | `style.css` |
| Version | `sw.js`, `index.html` |

## Stand v136 – Daueraufträge (auf v135)

| Teil | Datei |
|---|---|
| Takt, Mengenfaktor, Preis, keine Vertragsgrenze, Migration | `farm.js` |
| Texte Bestellfenster | `farmview.js` |
| Text Auftragsliste | `game.js` |
| Version | `sw.js`, `index.html` |

## Stand v135 – Jagderfolg: Keiler, Liegepose, Bergung (auf v134)

| Teil | Datei |
|---|---|
| Keiler- und Fasanmodell, Liegepose (`calcDead`/`deadPose`), Bergung (`goHarvest`, `heroCam`, `bedMesh`, `showWin`, `cardHTML`, `keepTrophy`, `harvestDone`), Jagdhorn | `hunt.js` |
| Überschrift, Karte, Trophäen-Bestätigung, breite Bildschirme (Abschnitt „v135: Jagderfolg“; alte `.hu-reveal/.hu-banner/.hu-strip` entfernt) | `style.css` |
| Tests Modelle, Waffenlänge, Liegepose; Dreiecksgrenze Trophäen 5 600 | `hunt.test.js` |
| Version | `sw.js`, `index.html` |

## Stand v134 – Offene Kisten (auf v133; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Münzhaufen, Deckel-Innenseite | `woodmodels.js` |
| Mindestleuchten der offenen Kiste | `worldview.js` |

## Stand v133 – Nachthimmel (auf v132; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Milchstraße, Sterne, Mond, Wolken, Sternschnuppen, Auflösung | `vista.js` |
| Himmelsrichtung über dem Feld, Blick nach oben | `hunt.js` |

## Stand v132 – Revier-Bäume einheitlich (auf v131; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Mittelstufe der Nahsicht-Bäume (`lo`) | `woodmodels.js` |
| drei Stufen fein/mittel/grob, Bau-Reihenfolge | `hunt.js` |

## Stand v131 – Liegeplatz des erlegten Wilds (auf v130; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Liegeplatz-Suche, Gleiten beim Fallen | `hunt.js`, `tests/hunt.test.js` (nicht im ZIP) |

## Stand v130 – Hochsitz-Revier (auf v129; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Blickgrenzen, Kanzel-Verwerfung, Dachunterseite | `hunt.js` |

## Stand v129 – Zutaten-Chips starten keine Produktion (auf v128; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `openMachine`: Klick auf `[data-it]` ignorieren | `farmview.js` |

## Stand v128 – Ego-Sicht-Bäume (auf v127; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `NSEC`, `RELIEF`/`reliefOf`, `taperB` mit Relief, Eichen-Borke, `crownMesh` mit `skip` | `fpsaw.js` |
| Eichen-Moos als `b.skip` markiert | `woodmodels.js` |

## Stand v127 – Heuballen an der Scheune entfernt (auf v126; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `FHAY`/`farmHay*`/`hayWorld` raus, Migration mit Auszahlung | `erbe.js` |
| Ballen-Knoten raus | `farmview.js` |
| `barnHay` raus | `farmmodels.js` |
| `pickHay`/`openHay`/Klick raus | `worldview.js` |
| README | `README.md` |

## Stand v126 – See und Seebach wieder bewegt (auf v125; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Wasser-Modus 3 (See) im Shader | `gl3d.js` |
| See und Seebach `water: 3`, Seebach eigener Knoten | `worldview.js` |

## Stand v125 – Angelsteg, Fluss-Wasser, offene Kisten (auf v124; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| Angelsteg, Kisten-Korpus/Deckel | `woodmodels.js` |
| Wasser-Shader (`water: 2` = Fluss, sonst still) | `gl3d.js` |
| Fluss als eigener Knoten, Deckel-Glow, Grubenkiste | `worldview.js` |

## Stand v124 – Telefon-Meldung öffnet den Chat (auf v123; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `runMsgGo` mit `msg:`-Ziel | `game.js` |
| `phoneMsg`-Toast mit Ziel, `openPhone/renderPhone(focusId)`, `data-mid` | `offices.js` |
| `.pmsg.focus` | `style.css` |

## Stand v123 – Brotdose/Thermoskanne entfernt (auf v122; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| beide Artikel raus | `erbedata.js` |
| Ausdauer ohne Boni, Migration mit Erstattung | `erbe.js` |
| Hinweistext im Essen-Dialog | `worldview.js` |
| README | `README.md` |

## Stand v122 – alle Warenbildchen + Werkzeuge, Einsammeln (auf v121; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `skinV`, `sLathe`, `sEll`, `rrect`, `ringXZ`, `slatCrate`, `paperBag`, `feedSack`, `tray`, `bucket`, Obst/Gemüse, `sock`, `goodsItem` (36 Hof- und 3 Fischwaren), `toolNew` (6 Werkzeuge), Jutesack-Etikett | `woodmodels.js` |
| `ITEM_VIEW` erweitert, Ausbeute-Leiste mit 3D-Bildchen | `worldview.js` |
| Perle fliegt als Ware | `farmview.js` |
| `.lootbanner .lb-it` | `style.css` |
| 2 neue Tests | `tests/icons.test.js` |
| Version 122 | `index.html`, `sw.js` |

## Stand v121 – Icon-Regelwerk + Holzwaren neu (auf v120)

| Teil | Datei |
|---|---|
| Holz-Bausatz (`lumber`, `logPiece`, `splitPiece`, `extrude`, `lathe`, `rope`, `band`, `jutesack`), `woodItem` für alle 22 Holzartikel, `FWM._wk` | `woodmodels.js` |
| `THUMB_N/THUMB_NB`, Licht `thumbSun` + Icon-Umgebung, Kontur + Kontaktschatten in `thumbCrop`, `thumbURL` (WebP), `ITEM_VIEW` | `worldview.js` |
| Trophäenbilder ohne Bodenschatten (`TVIEW.noShadow`) | `hunt.js` |
| neue Tests | `tests/icons.test.js` |
| Version 121 | `index.html`, `sw.js` |

## Stand v120 – Hirsch/Keiler neu, Trophäen je Stück, Trophäenwand (auf v119)

| Teil | Datei |
|---|---|
| `skin/ring/ell/tube/curve/prof`, Hirsch-, Geweih-, Keilermodelle, Trophäen-Datensätze (`collSync`, `sellRec`), `trophyBuild`, Trophäenwand + Drehansicht, Haltung/Leerlauf | `hunt.js` |
| `thumbR(big)`, `thumbOf(key, fn, o)`, `thumbCrop(…, N)`, `THUMB.opts`, `itemView` | `worldview.js` |
| `openFarmStore`: Reiter „Trophäen“ zeigt die Wand | `farmview.js` |
| `.tw-*`, `#huntUI .hu-tro` | `style.css` |
| 5 neue Tests | `tests/hunt.test.js` |
| Version 120 | `index.html`, `sw.js` |

## Stand v119 – Atem+Schuss, Wasser, Trophäen (auf v118)

| Teil | Datei |
|---|---|
| Atem-Finger-ID, Schuss per `pointerdown`, Listener-Aufräumen in `end()`; `trophyMesh` neu | `hunt.js` |
| Wasser-Shader: wandernde Wellenbänder + Lichtfunken | `gl3d.js` |
| Test „Trophäen (v119)“ | `tests/hunt.test.js` |
| Version 119 | `index.html`, `sw.js` |

## Stand v118 – Wildwiesen-Farbe (auf v117)

| Teil | Datei |
|---|---|
| `HUNT.ground`: sanfter Wiesenton statt harter Dreifarb-Umschaltung | `hunt.js` |
| Version 118 | `index.html`, `sw.js` |

## Stand v117 – Fernglas-Bäume neu (auf v116)

| Teil | Datei |
|---|---|
| `treeRv` neu (5 Arten, Blatt-/Nadelkronen, Röhrenstämme), `icoUnit` | `woodmodels.js` |
| `revLod`, `revBuildStep`, `TREE_HI` 40, Export `_rv` | `hunt.js` |
| Test Nahsicht-Bäume (v117) | `tests/hunt.test.js` |
| Version 117 | `index.html`, `sw.js` |

## Stand v116 – Stumpf-Maßstab beim Antippen (auf v115)

| Teil | Datei |
|---|---|
| Wippschleife: Grundmaßstab `t.cut.sc` bei Sägeschnitt-Stumpf | `worldview.js` |
| Version 116 | `index.html`, `sw.js` |

## Stand v115 – Gefängnis-Feinschliff (auf v114)

| Teil | Datei |
|---|---|
| Sitzpose, Glatze, Licht, God Rays, Tasse/Buch, Kalender-UI | `jail.js`, `style.css` |
| Zeitbudget, Zwischenspeichern, `jl-open`, `jailRefresh` | `snus.js` |
| Pause von Farmszene/Karte während der Zelle | `farmview.js`, `game.js` |
| Test (`SIT_Y`, `SEAT.ry`) | `tests/jail.test.js` |
| Version 115 | `index.html`, `sw.js` |

## Stand v114 – Haft: 3D-Zelle als Wartebild (auf v113)

| Teil | Datei |
|---|---|
| Neu: Zelle, Figur, Tiere, Fortschritt (`JAIL3D`) | `jail.js` |
| `jailServe`/`jailScene`, `JAIL_MS`, `reportHide` | `snus.js` |
| `person()`: `noLegs`, `noArms` | `woodmodels.js` |
| `.jl3`, `.jl-*` | `style.css` |
| Test | `tests/jail.test.js` |
| Skript `jail.js` nach `team.js`, Version 114 | `index.html`, `sw.js` |

## Stand v113 – Fernglas: feines Nahsicht-Baummodell (auf v112)

| Teil | Datei |
|---|---|
| `treeRv` (Kiefer, Fichte, Buche, Eiche) | `woodmodels.js` |
| Nahe Bäume nutzen `treeRv` (`TREE_HI`) | `hunt.js` |
| Test Nahsicht-Bäume | `tests/hunt.test.js` |
| Version 113 | `index.html`, `sw.js` |

## Stand v112 – Lager: Outfits/Frisuren, gebeugte Arme, Werkzeugplane, Sessel entfernt (auf v111)

| Teil | Datei |
|---|---|
| Plane, Ablagebahnen, Wege mit Stopps, Sessel entfernt | `camp.js` |
| Frisuren, Kleidung, gebeugter Sitzarm (`armSit`) | `woodmodels.js` |
| `STAFF_LOOK`, Stopps/Verweilen, Bodenwerkzeug, Hinsetzen/Aufstehen, Mittagsende | `team.js` |
| Test Werkzeugplane | `tests/camp.test.js` |
| Version 112 | `index.html`, `sw.js` |

## Stand v111 – Wild auf der Wildwiese (Karte ↔ Revier), Fernglas: Tiefenpuffer und Baumgeometrie (auf v110)

| Teil | Datei |
|---|---|
| Wiesenwild `mwSpawn/mwStep/mwToRevier/mwFromRevier`, `toRv/fromRv`, `spawn(k, enter, pre)`, nahe Ebene je Ansicht | `hunt.js` |
| Kiefernmanschette, Birkenflecken | `woodmodels.js` |
| Test Wiese ↔ Revier | `tests/hunt.test.js` |
| Version 111 | `index.html`, `sw.js` |

## Stand v110 – Luckybox: Gewinnchancen oben als Balken + Kacheln (auf v109)

| Teil | Datei |
|---|---|
| Chancen-Anzeige oben statt Textzeile unten | `lucky.js`, `style.css` |
| Version 110 | `index.html`, `sw.js` |

## Stand v109 – Wegsuche: Wege bevorzugt, Brücken nur über die Planken, Bäume und Büsche als Hindernis (auf v108)

| Teil | Datei |
|---|---|
| Kosten je Gelände, Brückenplanken, Kulissenbäume/Büsche/Totholz/Hochsitz gesperrt, `navKey` erweitert | `team.js` |
| Version 109 | `index.html`, `sw.js` |

## Stand v108 – Jagd: Bau, weites Revier, strengere Jagd, Hirsch-Animation, Kino-Einsammeln (auf v107)

| Teil | Datei |
|---|---|
| Freischaltung nach fertigem Sägewerk, Förster-Anruf, Bauplatz und Bau, Revier nur in der Ich-Perspektive, Wind und Flugzeit, strenge Zonen, Hirsch mit Gelenken und Federn, Kino-Einsammeln | `hunt.js` |
| Kamera darf nahe/ferne Ebene setzen (`cam.near`, `cam.far`) | `gl3d.js` |
| Lager-Reiter „Trophäen“ erst mit gebautem Hochsitz | `erbe.js` |
| Überblendung, Wind, Medaillen-Aufblendung, Leisten, Bauplatz | `style.css` |
| Tests | `tests/hunt.test.js` |
| Version 108 | `index.html`, `sw.js` |

## Stand v107 – Jagd: Hochsitz, Wild, Trophäen (auf v106)

| Teil | Datei |
|---|---|
| Neue Datei: Wildwiese, Hochsitz, Hirsch/Keiler/Fasan, Ich-Perspektive, Fernglas, Zielfernrohr, Trefferzonen, Nachsuche, Trophäen-Karte, Trophäen im Lager, Markt-Karte | `hunt.js` |
| Wiese frei von Kulissenbäumen und Büschen, Bodenfarbe, Hochsitz einbauen (`attach`/`step`), Antippen, Blase, keine fremden Kamerafahrten in der Ich-Perspektive | `worldview.js` |
| Nebel weiter weg in der Ich-Perspektive, Lager-Text für Trophäen, `farmFocus` gesperrt bei `FV.fp` | `farmview.js` |
| Lager-Reiter „Trophäen“, keine fällbaren Bäume auf der Wiese (`huntTree`, `F.v107h`) | `erbe.js` |
| Sammler zahlen den vollen Wert, Trophäen ohne Sterne | `farm.js` |
| Karte „Trophäen-Sammler“ im Markt | `game.js` |
| Telefonat-Arm angewinkelt | `team.js` |
| Aussehen der Jagd | `style.css` |
| Tests | `tests/hunt.test.js` (neu) |
| Skript einbinden, Version 107 | `index.html`, `sw.js` |

## Stand v101 – Aussicht in der Ich-Perspektive (auf v100)

| Teil | Datei |
|---|---|
| Neue Datei: Himmel, Sonne, Berge, See, Wolken nach Uhrzeit (`VISTA.draw`, `VISTA.env`) | `vista.js` |
| Aufruf nach `R.render` und am Ende von `farmEnv` | `farmview.js` |
| Skript einbinden, Version 101 | `index.html`, `sw.js` |

## Stand v95 – Lagerfeuer: Sitzende mit Beinen, Gespräch, Wege ums Feuer (auf v94)

| Teil | Datei |
|---|---|
| Sitzfigur: längere Unterschenkel, `noHead`, `headParts`, neues `FWM.head`, Axt am Körper nicht beim Sitzen | `woodmodels.js` |
| Sitzplätze (Becken vorn, `R`/`ang` je Platz), Arme auf den Knien, Wege `gate`/`routeIn`/`routeOut`/`slotAt`/`blockedW`, Gesprächs-Regie `talkStep`/`talkOf`/`talkReset` | `camp.js` |
| Lagerplatz in der Wegsuche gesperrt (`navBuild`), Routen über Tor und Ring (`staffGo`), Kopf-Knoten und Regie-Anwendung (`worldSyncStaff`, `stepStaff`), 2 min mehr Vorlauf zum Mittag | `team.js` |
| Tests | `tests/camp.test.js` (neu) |
| Version 95 | `index.html`, `sw.js` |

## Stand v93 – Fällen mit der Axt in der Ich-Perspektive (auf v92)

| Teil | Datei |
|---|---|
| Axtmodell `axeMesh`, Kamera-Knoten (`X.rig`), Schlagablauf `axeTool`/`axeHit`, Treffpunkt `axeTarget`/`kerbW`, Splitter `axeChips`/`stepChips`, `ev("swing")`, `begin(t, "axe1"|"axe2", { kp })`, `pickView(…, op)`, `ready`, Testhilfen `_freeze`/`_axeMath` | `fpsaw.js` |
| Axtspiel: 3D starten, Tippen überall, Ton/Späne beim Einschlag, Fallrichtung aus 3D, `stop()` | `minigames.js` |
| Kein Draufsicht-Zoom, wenn die Ego-Sicht geht | `worldview.js` (`worldFell`) |
| Karte unten links, Hinweis oben (`#farmAngel.mg3d.mga`) | `style.css` |
| Tests | `tests/axe.test.js` (neu) |
| Version 93 | `index.html`, `sw.js`, `test.html` |

## Stand v92 – Waldsanierung: Boden, Baumabstände, Blumen, Pflanzenwind (auf v91)

| Teil | Datei |
|---|---|
| Pflanzenwind (`uPlant`, `uWind`, Knoten-Eigenschaft `plant`, `env.wind`) | `gl3d.js` |
| `FTREE_DIM`, `treeBody`, `treeClash`, `treeNudge`, `erbeSpaceTrees`, Umzug `F.v92s` | `erbe.js` |
| `worldGround` (Waldboden in den Eckfarben), `worldTreeSpace`, `bgWayOk`, Blätter ohne Überlappung, Blumen/Farn in Wind-Kacheln, `VEGQ`/`vegStep`/`WIND_WX`; `WBuf.blob` entfernt | `worldview.js` |
| Blumen (8 Varianten), Farn, Steine; Moospolster entfernt | `forestmodels.js` |
| Moospolster raus, Erd-/Lichtbodenflecken | `forest.js` |
| Tests | `tests/trees.test.js` (neu), `tests/forest.test.js` |
| Version 92 | `index.html`, `sw.js` |

## Stand v91 – Lebendiger Wald: Waldboden, Orte, Entdeckungen, kleines Leben (auf v90)

| Teil | Datei |
|---|---|
| Ökologie, Bodenflecken, Dinge, besondere Orte, Entdeckungen, Kompositionen (rein, Node-testbar) | `forest.js` (neu) |
| Modelle: Steine, Moospolster, Wurzeln, Zweige, Rinde, Moosstamm, Pilzgruppen, Blumen, Farn (leicht), Beeren, Nest, Fundstücke, Pfoten, Falter, Lichtschacht | `forestmodels.js` (neu) |
| `WBuf.blob`/`leafBit`/`add(y0)`, `wFreeGround`, `wWet`, `worldForest`/`worldForestBuild`, Plan und Entnahme der Bäume, Buschhooks (`hidden`), `worldMakeLife`/`stepLife`, Tippen auf Igel | `worldview.js` |
| Skript-Tags und Precache (`forestmodels.js`, `forest.js`), Version 91 | `index.html`, `sw.js` |
| Tests | `tests/forest.test.js` (neu) |

## Stand v90 – Waldbäume in Endform per Instancing, Ladescreen (auf v89)

| Teil | Datei |
|---|---|
| Instanz-Shader (`instVS`), `R.instGroup`/`instClear`, Instanz-Durchgänge in Schatten und Haupt, `setScene`, Zähler `inst`/`sInst` | `gl3d.js` |
| `bgFinal`, `bgChunkBuild` (Instanzen), `bgPromote` (gleiche Werte, `v`), `treeMeshOf` (`t.v`), Gruppen in `worldStatic`, Böen für Gruppen; `WV.bgm` entfällt | `worldview.js` |
| `farmBoot`/`farmShowGo` (Ladescreen) | `farmview.js` |
| `#farmBoot` | `style.css` |

## Stand v89 – Natürlicher Wald, Büsche ohne 7:1 (auf v88)

| Teil | Datei |
|---|---|
| `BUSH.generate` eignungsgesteuert (Bewuchsfeld, Einzelbüsche/Gruppen, offene Lichtungen), `suitability`, `zoneOf`; `targetCount`/`TREES_PER_BUSH` entfernt | `bushes.js` |
| `worldBushes` (`feat` mit `rho`/`edge`, neuer Aufruf), `treeDens` (Baumdichte in Flecken, Streuung volle Zelle) | `worldview.js` |
| neue Tests | `tests/bushes.test.js` |

## Stand v88 – Performance, Gras-Wind (auf v87)

| Teil | Datei |
|---|---|
| `uSwayT`/`swayT`, `R.stats` (Zähler) | `gl3d.js` |
| `VEGQ`, `vegMode`, `vegInfo`, `vegStep`, Gras-Chunk-Knoten, Büsche im Bodenpuffer | `worldview.js` |
| `FV.busy`, Pause bei verstecktem Tab | `farmview.js` |

## Stand v87 – Vegetation nach Zonen, Gras an Birken (auf v86)

| Teil | Datei |
|---|---|
| `BUSH.generate` zonenbasiert (Gruppen, Einzelbüsche, Lichtungen), `BUSH.grass`, `BUSH.KIND` | `bushes.js` |
| `FWM.grassTuft` | `woodmodels.js` |
| `worldBushes` (Lichtungen, Merkmale, Gras), Einbau, `WV.grass` | `worldview.js` |

## Stand v86 – Buschsystem (auf v85)

| Teil | Datei |
|---|---|
| neues Modul `BUSH` (Typtabelle, Generator, 7 : 1) | `bushes.js` (neu, in `index.html`/`sw.js` vor `woodmodels.js`), Tests `tests/bushes.test.js` |
| sieben Buschmodelle `FWM.bush(typ, variante)` | `woodmodels.js` |
| `worldBushes`, Einbau in `worldStatic`, `WBuf.add(…, sy, k)`, alter Einzelbusch entfällt | `worldview.js` |

## Stand v85 – Sägen als 3D-Ego-Minispiel (auf v84)

| Teil | Datei |
|---|---|
| neues Modul `SAW3D` | `fpsaw.js` (neu, in `index.html` nach `minigames.js`) |
| Saw-Minispiel anbinden (`st.fp`, `SAW3D.ev`) | `minigames.js` |
| `worldFell`, `stepFalling` (Holzstapel), `worldBusy` | `worldview.js` |
| `clampCam` bei `FV.fp` | `farmview.js` |
| `.mg3d`-Styles | `style.css` |

## Stand v81 – Lagerfeuerplatz und Mittagspause (auf v80)

| Änderung | Datei |
|---|---|
| Neues Modul `CAMP` (Szene, 9 Plätze, Belegung, `clear`, `attach`, `step`) | `camp.js` (neu; `index.html`, `sw.js`) |
| `person({ sit })` Sitzfigur | `woodmodels.js` |
| `staffLunch`, Job `lunch`, Sitzen/Aufstehen in `stepStaff`, Blase `.lunchb`, `CAMP.tidy` | `team.js`, `style.css` |
| Lichtung am Wegende 1 entfällt (`campEnd`), `CAMP.attach/step`, `bgTreeOk` | `worldview.js` |
| `campTree`, Umzug `v81t` | `erbe.js` |

## Stand v77 – Autofotos, Kartengrenzen, Z-Fighting, Wegübergänge (auf v76)

| Thema | Wo |
|---|---|
| Eigene Fotos `cars/credits.json` + `cars/<id>.jpg` (`loadLocalPics`), kein Sperren nach Fehlschlag, Wiederholung | `auction.js` (Abschnitt „Fotos“) |
| Gezeichnete Autos `CAR_ART`, `carArt`, `carArtShape`, `hexMix` (statt `BODY_PATH`/`carSilhouette`) | `auction.js` |
| Foto-Import `carpics.mjs`, Aktion `.github/workflows/carpics.yml` (Vorlage `carpics-workflow.yml`) | Hauptverzeichnis |
| `/cars/*.jpg` im Foto-Cache | `sw.js` |
| `#controls2` (☁️/📡) entfernt, `fog = true` beim Laden, `mapBoundsUpdate` | `index.html`, `style.css`, `game.js` |
| `setBounds`, `clampBounds`, `boundsMinZoom` | `map.js` |
| Z-Fighting behoben: `pier`, `lootCrate`, `lootLid`, `goldLid`, `solarVan`; `cowShed`, `cart`, `pigHut`, `barn`, `cow`; `bertCar`, `beach` | `woodmodels.js`, `farmmodels.js`, `fishmodels.js` |
| Prüfwerkzeug `zcheck()`, `zrender(mb)`, `zcheckMB(mb)` | `zcheck.js` (nicht in `index.html`) |
| Bogenrand über dem Wegrand (`yE2`, `tee.ey`), `wayFade` + `o.fade`, `YARD_COL` | `woodmodels.js`, `worldview.js` |
| `nearPathPt`, `FTREE_CR`, `treeCrown`, `treeWayNeed`, `treeOffPath`, Umzug `v77t` | `erbe.js` |
| `wayGap`, `wayCamSide`, `BG_CR` (Kulissenbäume, Büsche, Totholz) | `worldview.js` |

## Stand v76 – Tutorial kurz, Lina-Tipps, „jetzt machbar“ (auf v75)

| Thema | Wo |
|---|---|
| `orderDoable(o, p)` für Filter und Sortierung | `game.js` |
| `TUT_STEPS` (5 Schritte), `tutCount`, Überspringen, Zentrieren, `tutScrollBind`/`tutFollow` | `intro.js` |
| `LINA_TALKS` gekürzt (snus, extras, pablo, bases, base1), Auktion | `intro.js`, `auction.js` |
| `linaHint(key, text, {top})` + Aufrufe | `intro.js`; `game.js` (Zustellung, `acquire`), `offices.js` (`phoneMsg`), `farmview.js` (`farmHintFor`) |
| `FTUT_HOF` 9 Schritte, Umrechnung `T.v76` | `farmview.js` |
| `.tut-n`, `.tut-skipl`, `#linaHint`, `#spot.drag`, Platz unter der Liste | `style.css` |

## Stand v75 – Wegenetz, Bachenden, Angelsteg (auf v74)

| Thema | Wo |
|---|---|
| Wegbau neu: `ribbon` (weicher Rand `softEdge`), `fillet`, `snapEnd`, `wayMouth`, `wayTee`, `wayRaw`, `wayStraightAt`, `smoothLine(…, true)` zentripetal | `woodmodels.js` (Abschnitt „v75: Wegenetz“) |
| `forestPath`-Optionen neu: `gnd`, `roadCol`, `tee`, `snap`, `prepared`, `mouthR`, `teeR` | `woodmodels.js` |
| Wege am See: `LAKE_STEM`, `LAKE_WAY`, `LAKE_EAST` (alte Namen `LAKE_WAY1/2` bleiben als Alias) | `worldview.js`, `team.js` |
| Bach: `FWORLD.creek` länger, `FWORLD.spring`; `creekBank/creekWater(pts, o)` mit `taper`; Quelle; `worldWaterCheck` | `erbe.js`, `woodmodels.js`, `worldview.js` |
| Angelsteg `FWM.pier` + `worldPierFrame` (statt `FWM.jetty`) | `woodmodels.js`, `worldview.js` |
| Schattenpass verwirft flache Bodenflächen (y < 0,07, Normale oben) | `gl3d.js` (SVS/SFS) |
| `AREA_BAR2` ist jetzt eine Liste je Gebiet | `worldview.js` |

## Stand v74 – Schatzkiste-Show (auf v73)

| Thema | Wo |
|---|---|
| Intro (Schwarm-Sturzflug, Banner, Lichtsäule), Leuchtfeuer `WV.trFx`, Öffnungs-Show `worldTreasureReveal`/`stepTreasureReveal` | `worldview.js` (Abschnitt „v74: Schatzkiste“, vor „Döring GmbH“) |
| `farmTreasureDig` liefert `stars`; 3 ★ = 2 🍀, mehr EP; Kleeblatt ohne eigenen Flug | `erbe.js` |
| Modelle `goldChest`, `goldLid` | `woodmodels.js` |
| Gemeinsamer Banner-Helfer `worldLootShow` (auch `worldParcelReward`) | `worldview.js` |

## Stand v73 – Lootkiste „Besondere Lieferung“ (auf v72)

| Thema | Wo |
|---|---|
| Kiste fest vor dem Südtor (`FPARCEL_AT`), Migration alter Lieferungen | `erbe.js` |
| Seltenheiten `FPARCEL` + `farmParcelRoll`, neue Belohnung in `farmEvReward("lieferung")` | `erbe.js` |
| Lieferwagen-Ankunft, Leuchtfeuer, Öffnungs-Animation (`worldParcel*`, `stepParcel*`) | `worldview.js` |
| Modelle `lootCrate`, `lootLid`, `lootBeam`, `lootRing` | `woodmodels.js` |
| Partikelform 3 (Stern) im Shader | `gl3d.js` |
| `.lootbanner`, `.lootflash` | `style.css` |

## Stand v72 – Brücke, Wegende am Bach, Straßeneinmündungen (auf v71)

| Thema | Wo |
|---|---|
| Neue gewölbte Brücke `FWM.bridge` (5,8 lang), Hauptweg gerade darüber (`FWORLD.paths[1]`, [3], [4] neu gelegt) | `woodmodels.js`, `erbe.js`, `worldview.js` |
| Westweg endet vor dem Bach mit Angelsteg `FWM.jetty` + Bank | `erbe.js` `paths[2]`, `worldview.js` |
| `forestPath(…, { mouth: [Anfang, Ende] })` + `mouthFillet` = Ausrundung an der Straße; Wegenden am Bordstein (17,48 / 19,52) | `woodmodels.js`, `erbe.js`, `worldview.js` |
| `LAKE_WAY1` (neu) wie `LAKE_WAY2` global in `worldview.js`, `team.js` nutzt beide | `worldview.js`, `team.js` |

## Stand v71 – Weganschlüsse und Dekowege (auf v70)

| Thema | Wo |
|---|---|
| Dekowege = Deko-Objekte 1 × 1 mit `FDECO[k].weg`; alle Wegfelder über `farmWegMap()`/`farmWegAt(x, z)`, Ränder über `wegMask(o)` | `farmdata.js`, `farm.js` (Ende), `woodmodels.js` `decoWeg` |
| Wegebau-Modus `FV.weg` (eigene Geste „weg“, Zwei-Finger-Pan nur dort), Leiste in `#farmPlace` | `farmview.js` |
| `team.js`: `navBuild` (Dekowege kein Hindernis, Kosten 0,4; Uferweg aus `LAKE_WAY2`), `staffWalkLen` in `staffGo` (30 % schneller auf Dekowegen) – Fahrerin unverändert | `team.js` |
| Haustiere laufen auf Wegen (`petTiles`, `petNext`) | `worldview.js` |

## Stand v70 – Liste „Logistika 2.1“ auf `main` (v69.10) aufgesetzt

v70 baut direkt auf dem aktuellen `main` (v69.10) auf – dein Stand bis v69.10 ist drin (Freigaben,
Fahrer-Modus, Produktion, Angeln, Namens-Blase). Einzelheiten
in `AENDERUNGEN.md` unter v70. **Darauf achten, wenn du in denselben Dateien arbeitest:**

| Thema | Wo |
|---|---|
| Hofgröße kommt aus `S.farm.hl` (1 … 10) über `farmHl()`/`farmHofB()`; `S.farm.stage` ist nur noch die Optik-Stufe 1 … 4 | `erbe.js`, `erbedata.js` (`FHOF_STAGES` mit zehn Einträgen) |
| Lager haben zehn Stufen – in `fishdata.js` nur die `cost`-Reihen von Kühl- und Köderkiste verlängert | `farmdata.js`, `erbedata.js`, `fishdata.js` |
| Minispiele (auch Angeln) stehen mittig, Rest abgedunkelt – CSS `#farmAngel.mg` | `style.css` |
| Karte: Fahrzeugposition rund um den Hof über `roadDispAt`, Linien über `legDisp`/`roadLine` – Fahrzeit unverändert | `farm.js` (Ende), `game.js` |
| Neues Spielstand-Feld `S.farm.hay` (Heuballen an der Scheune) | `erbe.js` |
| `startDrive` ersetzt eine laufende Fahrt desselben Fahrzeugs | `farmview.js` |
| `team.js` nur eine Zeile: `navKey` nimmt die Hofgröße aus `farmHl()` – Fahrerin unverändert wie in `main` | `team.js` |

Version: **v70**.

## Stand v59 – Fischerei-Folgeauftrag in `main` (Teil 1 = v58, Teil 2 = v59)

Gearbeitet wurde auf zwei Branches, die nacheinander aufeinander aufbauen:
`teil1-fehler-optik` (v58) → `teil2-mechaniken` (v59). Beide sind jetzt in `main`
zusammengeführt. **Alle Einzelheiten mit Funktionsnamen stehen in `AENDERUNGEN.md`
unter v58 und v59** – hier nur der Überblick.

**Teil 1 (v58) – Fehler und Optik:** Hofausbau-Anzeige, Tagesaufgabe „Ohne Leerfahrt“ entfernt,
Preis-Ereignisse wirken wirklich auf Preise, Daueraufträge ohne direkte Wiederholung,
Fischer/in angelt nach Spielerregeln (Köder, Fanggrund, Wartegründe), Steg-Reiter, Filet-Modelle, Ruderboot.

**Teil 2 (v59) – Mechaniken:**
- Köderkiste (eigenes Lager für Köder), Notizbuch zählt nur eigene Fänge
- Fischpreise nach Gewicht (kg × €/kg × 0,5), Sterne nur noch Aufschlag; Lager merkt kg je Sternstufe
- Berts alter Kombi am Ufer = Werkstatt (Würmer, Profi-Köder, Spezialköder), Dauerbestellung Würmer,
  Köder-Entwicklung (eigener Fang → Fisch an Bert → Spezialköder nur für diese Art; nicht für Weißfische)
- Obstbäume fällen (Gedrückthalten → 🪓 in der Verschieben-Leiste)
- Fischmarkt ist ein Verkaufsstand wie an der Straße, Fischbrötchen macht das Kühlhaus
- Daueraufträge: mehr Firmen, Preis je Lieferung schon im Angebot, kündbar erst nach 2 Lieferungen
- Reusenköder nicht mehr im Laden, Steg reicht bis aufs Ufer, 3D-Bilder für Spezialköder

**Darauf achten, wenn du in denselben Dateien arbeitest:**
| Thema | Wo |
|---|---|
| Fischlager hat neben `qs[1…5]` jetzt `qkg[1…5]` – Fisch immer über `farmAdd`/`farmTake`/`farmTakeQ` ändern, nie `qs` direkt | `farm.js` |
| Fischwert über `fishPrice`/`farmStackV`, nicht `FITEMS[fisch].v × n` | `erbe.js`, `farm.js` |
| Neue Spielstand-Felder: `angel.spec`, `angel.bert.keep`, `stats.staffCatch/staffSpecies`, `F.cap.koeder`, Stand-Partien `it.parts/it.v` | `erbe.js` (`angelInit`, `erbeInit`), `farm.js` (`farmMigrate`) |
| Rezepte können `ok()`, `why`, `hide()`, `costT` haben (Bert) | `farm.js` `farmQueue`, `farmview.js` `openMachine` |
| `FMACHINES.f_markt` gibt es nicht mehr; alte Stände werden in `erbeInit` umgestellt | `fishdata.js`, `erbe.js` |
| Bert-Bild nur aus `bert.png` (Ausschnitt per CSS `.fv-fig.img.bert`) | `fishview.js`, `style.css` |

Version: **v59** (`sw.js` und `?v=59` in `index.html`). Alte Spielstände werden beim Laden umgestellt.
Danach **v60 (Hotfix)**: Hof-Fenster prüfen das Erbe-Level (`flv()`), nicht das der Spedition – siehe `AENDERUNGEN.md`.

**v61 – Freigaben für Arbeiter:** „＋ Auftrag geben“ ist für Landwirt, Tierpfleger, Hofmeister, Holzfäller, Sägewerker,
Fischwirt, Fahrer und (ab v64, Köder) Fischer durch dauerhafte Freigaben ersetzt (`S.farm.wl`, `S.farm.fahrMode`, alles in `team.js`). Wer an
Arbeiter-Logik arbeitet: neue Automatik immer über `staffWlHas(role, id)` bzw. `staffFahrOk(o)` prüfen.
Einzelheiten: `AENDERUNGEN.md` v61.

## Stand v48 – erledigt

v48 = v46 (Feinschliff, Notizbuch-Stränge, Rezepte, Minispiele …) **plus**
v47 vom Kollegen (Lehmanns Ufer: Angelstufen, Kreis-Drill, Turnier mit Bert,
Reusen, Fische nach Sternen). Git hat fast alles von selbst zusammengefügt;
von Hand gelöst wurden nur drei Stellen:

| Datei | Lösung |
|---|---|
| `sw.js` | Version **v48** (über beiden Ständen, damit Handys neu laden) |
| `farm.js` | beide Umzüge alter Spielstände hintereinander: erst der Hecht-/Turnier-Tausch des Kollegen (Notizbuch-Version 5), dann die Stränge aus v46 (Version 6). Spielstände aus v46 bekommen ihr Hecht-Häkchen an die neue Stelle. |
| `farmview.js` | Verkaufsfenster: die Sterne-Zeilen für Fisch vom Kollegen, die kürzeren Texte aus v46 |

Beim nächsten Mal am einfachsten: jeder arbeitet auf einem eigenen Branch
und stellt einen Pull Request – dann zeigt GitHub Konflikte sofort an.

---

## So war es geplant

Version 46 baut auf **v45** auf. Die drei Fischerei-Dateien `fishdata.js`,
`fishview.js` und `fishmodels.js` sind in v46 **nicht verändert** – dort kann
der Kollege frei arbeiten.

## Was v46 geändert hat

| Bereich | Dateien |
|---|---|
| Hof, Welt, Notizbuch, Rezepte | `farm.js`, `farmdata.js`, `farmview.js`, `erbe.js`, `erbedata.js`, `worldview.js`, `woodmodels.js` |
| Minispiele (nicht das Angeln) | `minigames.js` |
| Aussehen | `style.css` |
| Meldungen, Doppeltipp-Schutz | `game.js` |
| Nur kürzere Texte | `intro.js`, `offices.js`, `extras.js`, `events.js`, `goals.js`, `vip.js`, `snus.js`, `pablo.js`, `auction.js`, `corp.js`, `livery.js`, `customs.js`, `lucky.js`, `loading.js` |
| Version / Doku | `sw.js`, `README.md` |

Gemeinsam genutzte Dateien, in denen auch die Fischerei steckt:
`minigames.js` (Angeln), `worldview.js` (See, Fischmarkt), `erbe.js`,
`erbedata.js` (Kapitel 9 und 10), `style.css`. Solange dort jeder nur
**seine** Abschnitte ändert, passt alles automatisch zusammen.

## Weg 1 – am einfachsten

Der Kollege schickt seinen kompletten Ordner als ZIP. Claude führt beide
Stände zusammen, testet und liefert ein fertiges Paket.

## Weg 2 – selbst mit Git

1. Der Stand des Kollegen liegt in einem Git-Ordner, der auf **v45** aufbaut.
2. Die Datei `logistika-v46.patch` in diesen Ordner legen und ausführen:

   ```bash
   git am -3 logistika-v46.patch
   ```

3. Meldet Git einen Konflikt, stehen in der betroffenen Datei Markierungen
   `<<<<<<<`, `=======`, `>>>>>>>`. Beide Teile behalten, Markierungen
   löschen, dann `git add <datei>` und `git am --continue`.
   Typisch ist das nur bei `sw.js` (Versionsnummer) und `README.md`.
4. In `sw.js` die Versionsnummer **eins höher** als beide Stände setzen,
   damit Handys die neuen Dateien laden.

## Tipps für den Kollegen

- Möglichst in den Fischerei-Dateien arbeiten.
- In gemeinsamen Dateien nur die Fischerei-Abschnitte ändern und nichts
  umformatieren (keine Einrückungen, keine verschobenen Blöcke) – sonst
  sieht Git Änderungen, wo keine sind.
