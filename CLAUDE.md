# LOGISTIKA – Hinweise für Claude

Diese Datei wird in jeder Claude-Code-Sitzung automatisch geladen. Ausführliche Projektübergabe (Stand v245, aus einem früheren Chat): `docs/UEBERGABE.md`.

## Projekt in Kürze
- Logistik-Simulation im Comic-Look auf echter OSM-Karte, deutsch. Start als Erbe eines Obsthofs bei Werder (Havel) (3D-Hof, Wald, Sägewerk, Fischerei), daraus wächst eine Spedition in 6 Etappen (Berlin → Welt).
- Verkehrsträger: Rad, Lkw, Bahn, Binnenschiff, Seeschiff, Luftfracht – reale Fahrzeugmodelle, realistische Aufträge, comichaftes Design. PWA, läuft auch auf dem Handy.
- Bennet entwickelt mit Claude und testet über GitHub Pages (`beerus-bennet.github.io`). Ein Kollege arbeitet parallel an der Fischerei (Branch `Fischerei` u. a.), Zusammenführungen in `ZUSAMMENFUEHREN.md`.

## Technik
- Vanilla JS (`"use strict"`, globale Skripte, keine Module), kein Framework, kein Build, keine externen Bibliotheken.
- 3D: eigene WebGL2-Engine `gl3d.js` (kein Three.js – so gewollt). Modelle mit `FM.MB` (`farmmodels.js`), Bildchen über `thumbSpan`/`thumbOf` (`worldview.js`).
- Karte: eigene Slippy-Map `map.js`. Spielstand: globales `S` in `localStorage` (`logistika.save.v3`), Hof in `S.farm`.
- Testmodus: `index.html?test` bzw. `?test=100`. Luckybox-Testbühne: `index.html?test&lucky` (v271, `luckytest.js`).
- Unit-Tests: `*.test.js` im Wurzelordner, erwarten `ROOT = path.join(__dirname, "..")` → zum Ausführen in `tests/` kopieren. `axe.test.js` und `trees.test.js` schlagen schon länger fehl.
- Browser-Tests: Playwright (vorinstalliertes Chromium) gegen `python3 -m http.server`. Das Intro überdeckt das Spiel; Inhalte zum Ansehen in eine leere Seite kopieren. Für 3D-Bildchen Chromium mit `--use-angle=swiftshader` starten.

## Feste Regeln (Bennet)
- Immer auf Deutsch antworten.
- **Jede Lieferung bekommt eine neue Version:** `sw.js` → `const VERSION = "vNNN"`, alle `?v=NNN` in `index.html` (und `manifest.webmanifest`) anpassen, oben in `AENDERUNGEN.md` einen Abschnitt `## vNNN – …` (Ursache, Lösung, geprüft/nicht geprüft); bei größeren Änderungen auch `ZUSAMMENFUEHREN.md`.
- Commit-Nachrichten beginnen mit `vNNN: …`.
- **Vor jeder Arbeit `git fetch` und den Stand von `main` prüfen.** Bennet lädt teils selbst Dateien über die GitHub-Weboberfläche hoch – dabei können ältere Fassungen von `index.html`/`sw.js` mitkommen und Versionsnummern zurücksetzen (zuletzt passiert nach v252, behoben in v253).
- Vor jedem Push zusätzlich den aktuellen Pull Request und seine Mergefähigkeit prüfen. Aktuelles `main` integrieren, Konflikte lösen und nach dem Push den Merge-Status auf GitHub erneut kontrollieren.
- Arbeit auf eigenem Branch `claude/…`, dann Pull Request auf `main` (Push funktioniert inzwischen; die frühere ZIP-Lieferung ist nicht mehr nötig).
- Ehrlich berichten, was wie geprüft wurde (Testbrowser, Unit-Test). **Nie behaupten, etwas sei auf dem Handy geprüft.**
- Spielstände nie brechen: Migrationen einmalig mit Merkmal (z. B. `S.econ = 244`), alte Felder tolerieren.
- Code-Kommentare auf Deutsch mit Versionsmarke (`/* v253: … */`); neue CSS-Blöcke ans Ende von `style.css` mit Kopfzeile.
- Keine Geschäftslogik ändern, wenn nur Gestaltung oder Texte gewünscht sind.

## Bekannte Fehlerquellen (zum Merken)
- **Bewegung, die „wild hin und her“ geht (v388):** Zuerst messen, nicht raten – Richtungswechsel je Figur pro Bild zählen (Bewegung > 0,03, Richtungsprodukt < −0,5) und den Ort/Zustand dazu ausgeben. Typische Ursache: zwei Systeme setzen dieselbe Position gegeneinander, z. B. `staffFollow` (setzt Hofkräfte jedes Bild auf ihre Route) gegen `PEOPLE_TRAFFIC` (seitliches Ausweichen). Ein Ausweichschritt, den der Routenfolger im nächsten Bild zurücknimmt, ergibt Pendeln und eine stehende Wegeuhr. Lösung dort: Figuren, die fest einer Route folgen, nicht seitlich ausweichen lassen. Regressionstest: `worker-motion-v351.test.js` („v388 Pausenende“).

## Wichtige Dateien
`data.js` (Welt, Fahrzeuge, Ladungsarten, Etappen) · `game.js` (Kern: Aufträge, Routing, Planer, Listen, Tick, Speichern) · `kunden.js` (Kundenprofile, Auftragstexte mit Prüfung, Beziehungsstufen, Projekte, Unterschriften) · `vip.js` (Sonderfahrten, Konkurrenz/Ausschreibungen, Verhandlung, Zeitung) · `extras.js` (Telefon, Entscheidungen, Steuern, Kredit) · `offices.js` (Büros, Personal, Diensthandy) · `goals.js` · `corp.js` · `vehmodels.js` (3D-Fahrzeugbildchen) · `officefp.js` (Büro in der Ich-Perspektive) · Hof/Welt: `farm*.js`, `worldview.js`, `team.js` u. a. Vollständige Tabelle in `docs/UEBERGABE.md`.

## Stand nach v245 (Kurzfassung der Änderungen seit der Übergabe)
- v245 (Nachtrag, gleiche Nummer wie die Übergabe): Scrollen löst keinen Klick über den Doppeltipp-Schutz mehr aus.
- v246: Markt innerhalb jeder Fahrzeugart nach Preis sortiert. v247: Tiersymbol im Hochsitz entfernt.
- v248: Fahrzeuge als 3D-Bildchen im Hof-Stil (`vehmodels.js`).
- v249: Auftragskarten neu gegliedert (Absender-Monogramm, Anfrage als Zitat, Eckdaten-Raster). v250: Unterschrift „i. A.“ bei Aufträgen über 100.000 €.
- v251: Tipp-Schutz für Auftragskarten (`realTap` in `game.js`). v252: Vergaben an Mitbewerber als Meldung im Tab „Zeitung“ des Diensthandys statt Einblendung.
- v253: Versionsnummern nach Bennets Icon-Upload wieder vereinheitlicht; Übergabe und diese Datei angelegt.
- v254: Büro betreten – Ich-Perspektive mit Ladescreen (`officefp.js`, Knopf auf dem Grundriss).
- v255: Schatzkiste – Show-Kamera gibt bei jedem Eingriff des Spielers sofort frei, kein Rückflug, kein ungefragter Schwenk beim Vogelschwarm.
- v256: Tutorial-System überarbeitet – eine gemeinsame Lina-Karte (`linaCardHTML` in `intro.js`) für Hof-Rundgang (`FTUT_HOF`, `farmview.js`), Spedition (`TUT_STEPS`) und Gespräche; Schrittzähler, Teilfortschritt, Ausweg bei fehlenden Zielen, Beenden mit Rückfrage. Bei Cache-Versionen nur geänderte Dateien hochzählen (Bennets Wunsch in v256).
- v257: Büro-Ich-Perspektive (`officefp.js`): eigene Gliederpuppe mit Arm-IK und Tätigkeiten, Aussehen aus `p.av`; Küche im 60-cm-Raster an der Wand (`kitchenModules` in `offices.js`); Bildschirme je Rolle; Poster „Mitarbeiter des Monats“ (`b.motm`, Zählung `s.mo` über `motmCredit` – Achtung: `staffCredit` gehört `team.js`); Antippen mit Sichtprüfung; `R.texFree` in `gl3d.js`.
- v258: Große Lagerhalle (`lagerhalle`, Hof-Laden „Gebäude“, ab Level 5, einmal) – +3 Ausbaustufen für Silo, Scheune, Holzplatz, Kühl- und Köderkiste (`FHALL`, `farmHallBonus` in `farmStoreCap`); Modell `FM.lagerhalle`.
- v262: Jagd – Liegepose neu (`POSE`, `calcDead` mit Gelenkgrenzen, Rumpf-Innenprüfung über die Profile, Kopf-Suche, `poseCheck` für Tests); Fasan mit Flügeln am Ansatz, Einflug/Landung; Artgewichte `SPECIES_W` 45/30/25, Flugtimer `FLY_FIRST`/`FLY_NEXT`, Grenzen `LIMIT`; Geweih-Enden `antSides` (Modell = Name); Bergung mit Kontaktschatten. Prüfstände: `_dead`, `_poseCheck`, `_flyEvent`, `_counts`.
- v263: Büro – Kaffee überall abstellen (`room.surf`, `dropSpot`), Personal anbieten (`offerTo`, realistische Absagen), Tasse werfen (`throwCup`/`sweep`, Spuren 5 Spielminuten über `fxAdd` mit `until` = `S.time`), Kopf-/Rumpftreffer tödlich (`killStaff`: Person aus `b.staff`, Stimmung −40, Meldung). Figuren: ergonomischer Schreibtisch, Hände mit Fingern (`handMesh(L, side, grip)`, `GRIPS`, `HROT`), Arm-IK bis Handgelenk (`ARM_B` 0,211), Abläufe in `animFigure` über Ziele je Hand (`want`); Block zieht die Figur heran (`F.noteK`). Prüfstand `OFFICE3D._t`.
- v264: U-Haft nach Todesfall im Büro – `S.jail.kind = "uhaft"` (`snus.js`: `jailUhaft`, Zustand `pending` bis das Büro zu ist, 16 Tage `UHAFT_DAYS`, Haftverschonung gegen Auflagen), Zelle mit eigenen Texten (`jail.js`: `kind`, `where`, `TIPS_U`, `SAY_U`). `S.jail` ohne `kind` = Snus.
- v265: Jagd – Trägerzone des Hirschs als Röhre nach dem Halsmodell (`deerNeckZones`, `rayTube`), Stich beim Keiler (`SP.keiler.stich`), Rumpf-Durchschuss in den Träger zählt als `hals`; Herz/Lunge/Haupt etwas größer.
- v266: Luckybox-Bühne neu (`lucky.js` „Öffnen“, CSS `lb-*`): Kiste mit Licht in Seltenheitsfarbe beim Aufladen, Band mit Klick und Einrasten (`lbRoll`), Enthüllung mit Blitz, Strahlen, Karte, Zähler, Serienfortschritt. Logik unverändert; Schließen während des Öffnens schreibt den Gewinn gut.
- v267: Große Lagerhalle – doppelter Bonus (`FHALL.steps` 6), 8 × 5 Kacheln (`FSIZE`), alte Hallen wachsen beim Laden nur bei freiem Platz (`farmHallGrow`, `S.farm.hall267`), sonst `o.sz` = [6, 4].
- v268: Luckybox in 3D (`lucky3d.js`, `LUCKY3D.open`): Kiste wie v266 und Glücksrad mit einem Feld je Preis, Feldgröße = Gewinnchance, bleibt auf dem gezogenen Preis stehen (`lb3dSpin`); ohne WebGL 2 die v266-Bühne. Titel/Karte/Knöpfe mit Tuschekontur im Spielstil.
- v269: Große Lagerhalle verdoppelt jedes Lager einzeln samt Ausbau (`FHALL.mult`, `farmStoreCapBase`, `farmHallBonus(st, base)`, `farmHallK`), 10 × 6 Kacheln mit Modell nach Maß (`FM.lagerhalle(w, d)`, zwei Tore); alte Hallen wachsen beim Laden auf 10 × 6 bzw. 8 × 5, wenn Platz ist (`farmHallGrow`, `S.farm.hall269`, Größe in `o.sz`).
- v270: Luckybox überarbeitet – `lucky3d.js` neu (Kiste mit Innenraum und Deckel-Schale, Licht aus Fuge/Innenraum, Kamerafahrt Kiste → Rad, Rad mit Beschleunigen/Abbremsen, `finish` fürs Überspringen); `lucky.js`: Gewinn einmal ziehen und als `S.lucky.pending` sichern, einmal anwenden (`lbSettle`), Kennung je Öffnung, eigene Symbole `lbIcon`, Layout an `visualViewport` (`--lb-h`); `gl3d.js`: Aufkleber `unlit`/`mul`/`add`.
- v271: Luckybox-Testbühne `index.html?test&lucky` (`luckytest.js`, nur Testmodus): Boxen geben, Gewinn festlegen, reduzierte Bewegung/ohne WebGL simulieren, Ton, Serie, fertige Abläufe (Neuladen/Schließen beim Drehen, goldene Box bei kurzer Serie, 15 Boxen), Chancen prüfen.
- v272: Luckybox – Gewinnerfeld am Rad in Seltenheitsfarbe statt weißem Schleier, weniger Funken am Zeiger (`winMesh`, `highlight` in `lucky3d.js`).
- v273: Luckybox – Gewinnerfeld mit dünnem Rahmen und Plakette (`BADGE_R`, `BADGE_S`) statt gefülltem Keil; Gewinnsymbol wächst darauf.

## Arbeitsprinzipien (v276, nach Karpathy-Hinweisen, MIT-Lizenz, `forrestchang/andrej-karpathy-skills`)
Gelten zusätzlich zu den festen Regeln oben. **Bei Widerspruch haben die Projektregeln (Bennet) Vorrang** – zum Beispiel Version, Doku und Pull Request je Lieferung, und: Bennets klare Aufträge werden umgesetzt, nicht zerredet.
1. **Erst denken:** Annahmen nennen. Bei echter Unklarheit (mehrere sinnvolle Deutungen mit unterschiedlichem Ergebnis) kurz nachfragen oder die gewählte Deutung klar benennen. Einfachere Wege vorschlagen, wenn es sie gibt.
2. **Einfachheit zuerst:** So wenig Code wie nötig, keine ungefragten Zusatzfunktionen, keine Abstraktion für Einmaliges, keine Fehlerbehandlung für Unmögliches.
3. **Chirurgische Änderungen:** Nur anfassen, was der Auftrag braucht. Fremden Code, Kommentare und Formatierung nicht „verbessern“. Eigene Reste (ungenutzte Variablen, Funktionen) entfernen, fremden toten Code nur melden.
4. **Zielgetriebenes Arbeiten:** Erfolg vorher überprüfbar festlegen (Fehler zuerst reproduzieren, danach beheben; vorher/nachher prüfen) und erst melden, wenn es geprüft ist – ehrlich, was nicht geprüft wurde.
- v292: Produktionsfenster (`.mach`) wieder als normales Bodenblatt (Sonderplatzierung aus v278/v286 entfernt); Arbeitermenü (`positionStaffPop`) mit `maxHeight` bis zur Navigation, scrollt innen, Scrollstand bleibt.
- v293: Produktionsfenster – Überschrift, Symbol und Knöpfe wieder in Standardgröße (v286-Sonderregeln für `.fs-h`, `.fs-ic`, `.fm-off`, `.fs-x` entfernt).
- v294: Schatzsuche – keine große Einblendung „Schatz gesichtet!“ mehr (`worldTreasureIntro`); Meldung und Vogelschwarm-Knopf bleiben.
- v295: Wegesuche mit Notlösung `navPathSafe` (`NAV.loose` in `navOk`): Eingeschlossene Leute laufen nicht mehr in der Geraden durch alles, sondern auf dem Wegenetz; genutzt in `staffGo`.
- v313: Tür-zu-Tür-Logistik (`game.js`, Block „v313: Tür zu Tür“):
  - Kette aus `chainLegs`: Vorlauf, Hauptlauf nur zwischen Terminals, Umfuhr Hafen↔Flughafen über `termPt` (16 km), Nachlauf.
  - Großmengen über 60 t am eigenen Kai (`o.pickT`/`o.dropT`, `d2dInit`).
  - Mengenfluss `qty`/`ld`/`dn` je Teilstrecke, Fahrzeugphase `wait`, mehrere Fahrzeuge/Fahrten auf der Straße (`leg.vehs`, `extraFor`, `D2D_TRIPS`), `d2dTick`.
  - Abschluss genau einmal (`finishJob`, `job.fin`); Status/Prognose `d2dStatus`/`d2dWhere`/`d2dEta`; Varianten Schnellste/Ausgewogen/Günstigste ohne dominierte.
  - Altaufträge ohne `job.v` laufen nach alter Logik. Suezkanal ist reine Durchfahrt (`N.suez.via`). Test: `d2d-v313.test.js`.
- v311: Karte läuft in Ost-West-Richtung rundherum, wenn das erschlossene Gebiet ≥ halbe Welt ist (`endless` in `clampBounds`); `setBounds` rollt die Eckpunkte nicht mehr über die Datumsgrenze auf; `screenPosAll` für den Nebel auf jeder Weltkopie.
- v314–v323 (Sammellieferung v323, siehe `AENDERUNGEN.md`): Karte lädt fehlgeschlagene Kacheln nach (v314, `map.js`); Büro-Sprechblase und Ruckelbremse `G3.governor` mit `R.scale` (v315/v316, `gl3d.js`, `officefp.js`, `jail.js`); U-Haft-Beine (v317); Stellenanzeige fest 750 € (v318, `AD_FEE`); Übernahme-Zeitung (v319, `corp.js`); Beet-Farben (v320); Züge über OpenRailRouting und Routen erst berechnen, dann zeichnen (v321, `geoPending`/`routeHold`, Speicher `logistika-geo-v2`); Büros aufwerten und Fahrzeugkauf am Standort (v322, `offices.js`).
- v324: Filterleisten über den Listen (`#viewTools`) einheitlich: eine Zeile je Liste (wichtige Chips vorn, Seltenes als Auswahlfeld `selChip`), Zeilen über `toolRow(label, inner)`, eigener Chip-Stil nur in `#viewTools` (die Klasse `.fchip` teilen sich Filter und Hof-Warenchips – Regeln immer mit `#viewTools` eingrenzen).
- v336: Auktionshaus – keine Nutzfahrzeug-Zufallslose mehr (`makeLot` nur noch für eigene Einlieferung, `ensureLots` räumt alte fremde Lose auf); `cars.js` 127 Modelle, 10 neue Marken (Aston Martin, McLaren, Rolls-Royce, Bentley, Maserati, Jaguar, Pagani, Koenigsegg, Lotus, Ford); Foto-Filter `CAR_FX` sanft (`lineA` 0, Cache `/__carcomic/v3/`).
- v337: Auktionshaus – `ahPurgeVeh` entfernt alte fremde Nutzfahrzeug-Lose auch mit Spielergebot, beim Nachlegen und beim Öffnen.
- v338: Auktionshaus – Limit-Feld zeigt Tausenderpunkte (`ahGroup`, `ahGroupInput`, `ahDigits` in `auction.js`).
- v339: Auktionshaus – fehlende Autofotos per Wikipedia-Suche („Marke Modell“, Treffer muss die Marke im Titel haben) als vierter Schritt in `resolvePics`.
- v341: Seeblick – Zoomgrenze beim Verlassen des Ortsbereichs weich statt hart (`FV.distSoft`, `distLim` in `clampCam`/`farmLoop`); keine Namensschilder über bewohnten Häusern (`tags` in `villageview.js`).
- v342: Hochsitz – Wolken (`cloud` in `vista.js`) über echte Projektion `R.project` und feste Form je Wolke statt Näherung `hy − f·tan(e)` und Zähler.
- v350: Jagd – Trefferbild/Röntgen (`XR`, `xrShow`/`xrBuild`, `ORG`, `shotRec`/`shotOrgans`, `A.shots`, Knopf `data-hu="xray"`, CSS `.hu-xr`); Liegeformen `LIE`/`lieVariant` (5 je Schalenwild, 4 Fasan mit `dp.wings`); Modelle: Teller, Keule mit versetztem Sprunggelenk (`BHOCK`/`DHOCK` in `legDim`), Lauscher, Fasan-Schenkel. Prüfstand-Exporte `_shotRec`, `_shotOrgans`, `_xray`, `_legDim`.
- v352: Hochsitz-Himmel – `sky(a, e)` in `vista.js` (echte Projektion) für Wolken, Sterne, Sonne, Mond; Wolken mit fester Größe; Farbverlauf am Himmel verankert.
- v353: Jagd-Testbühne `index.html?test&jagd` (`jagdtest.js`); Streifschüsse nicht tödlich (`ellDepth`, `GRAZE`, Zonen `streif`/`haupt`, Hirnschädel `SP.*.brain`); Organe farbig je Art (`OC`, Legende), Fasan nach Vogelanatomie.
- v354 (Sammelkorrektur, Details in `AENDERUNGEN.md`): Rundgang-Karte weicht dem Werkzeugmenü aus (`farmTutFree`, Klassen `ft-mini`/`ft-tiny`/`ft-drag` – nicht `.mini`, die ist global vergeben), Säen zählt je Feld einmal (`T.ids`, `farmEvent(key, n, ref)`); Bewohner: gemeinsame Lage `pose`/`poseClear`/`stepClear` in `villagepeople.js`, Schritt `turn`, Rechtsverkehr, `VILLAGE_SITE.stallBox`/`farmStallShift`, Hofzaun in `blocked`, `rail` in `peopletraffic.js`, `recheck` nach Umbauten; Jagd: Zoom beim erlegten Stück (`Hv.zoom`, `hvTake`, `.hu-zoom`), Trefferbild-Haupt am Träger, Keilerteller, `flankCol`; Wendeplatz `VILLAGE_SITE.turn`; Landschaftskulisse `worldApron` (`WV.apron`). Test: `fixes-v354.test.js`.

- v355: Unternehmenskauf mit verbindlichem Paket (corpassets.js), atomarer Übertragung und dauerhaftem Kaufbeleg (corpreport.js), neuer Weißhai-Inszenierung; enthält PR #72/v354. Interne Speicherfelder deal353/receipt353/sites353 unverändert. Übergabe in ZUSAMMENFUEHREN.md, Prüfbericht docs/UNTERNEHMENSKAUF-v355.md.

- v356: Flotte/Standorte/Personal separat eingeklappt (corpDealContents), kompakte Konzernmeldung (corpThreatReport), suchbare Ortsauswahl ohne Emojis (openBaseLocation356, newBaseNode jetzt Button mit value). Übernahmefahrzeuge bekommen konkrete Hof-/Terminalparkpunkte; C.parking356 einmalig für unbenutzte Standardplätze. Daten/Preis bleiben erhalten. Übergabe und Tests in ZUSAMMENFUEHREN.md.

- v358: Endliche schwebende Insel in worldApron/WV.apron (APRON margin/depth/cell, keine Ferntrees); CAMP.toolSpot/rackRy und dynamische Seitenfächer, STAFF_GEAR.relocate für alte Frontregal-Wege. viewport.js früh im Kopf, --app-height/--app-top und gemeinsamer fester Body-Rahmen; Luckybox darin ohne eigenen Offset. Native iOS-Browseroberfläche nicht steuerbar. Tests/Vorschauen in docs/INSEL-WERKZEUGE-v358.md.

- v357: Jagd – Trefferbild mit Bildebene über der Zeichnung (`xrOverlay`/`xrOverlayBuild`, Daten `XR.ov`, `ellSeg`): Einschuss, Kanal, Trefferring mit Schild, Organnamen mit Linien; Organlage `ORG` für Hirsch/Keiler nach Anatomie (Wertungszonen `SP` unverändert); Zoomknöpfe entfernt, Zwei-Finger-Zoom auch im Trefferbild, Karte klappt bei wenig Platz ein (`Hv.userCard`). Prüfstand `_shootAt`. Test: `trefferbild-v357.test.js`.
- v359: Jagd – Aura um Gold-/Diamant-Stücke in der Bergung (`AURA`, `auraShow`/`auraStep`/`auraClear` in `hunt.js`, additive Aufkleber, Klassen `md3`/`md4` an `#huntUI`); Diamant größer, heller, mit abgedunkelter Umgebung. Prüfstand `_aura`. Test: `aura-v359.test.js`.
- v360: Seeblick – Vermittlungstext ohne Zeitangabe für die ersten Wohnanfragen (`villageview.js`, nur Text).
- v361: Insel – Grasdecke von `worldApron` mit zwei Zwischenringen in der Bodenfarbe der Welt (`worldGroundCol` über die Kante hinaus), keine sichtbare Naht mehr.
- v362: Kaufbeleg der Übernahme (`corpWinReport` in `corpreport.js`) auf einer Seite: Aufbau `.crp-sheet.crp2` mit `.crp2-body` (Belegteil) und festem Knopf; Bestand als eigene Ansicht über dem Beleg (`details[open]` absolut). Klassen `crp2-*`, CSS-Block am Ende von `style.css`.
- v363: Karte folgt der Größe ihres Elements (`ResizeObserver` in `map.js`) – kein gestrecktes Bild mehr, wenn `viewport.js` die App-Höhe ohne Fenster-„resize“ ändert.
- v364: Seeblick – Kacheln des Grundstücksplans als 3D-Bildchen (`townIc`/`townModel` in `villageview.js`, Schlüssel `town:…` für `thumbSpan`).

- v365: PDF 3 – zentrale Wohnanzeige (VILLAGE.advertise, optionale campaign), Vormerkung im Bau/sign erst ready; stabiler nativer Preisdialog; abrufbare Tiergütehilfe/direkter Kollaps; anatomische Trefferorgane und Touch-Scroll-Ausnahmen in game+index; kompakte Lagerfilter/SVG. G3.pacer(30)/governor(frameMs,minScale) für Büro/Haft, gestaffelter Büroaufbau, verdeckte Ansichten pausieren, Haftschritte begrenzen. Schienen ohne Geometrie bleiben ausstehend, geoStatus, Cache v3 ohne alte l-Linien. PR #78–#82 integriert, Details docs/PDF-3-v365.md und ZUSAMMENFUEHREN.md.
- v366: Insel – weite Übersicht überall (`lim = 450` in `clampCam`), Bäche bis über die Kante (`creekToRim`, Wasserfall `rimFall`), Baumsaum `worldApronTrees`; Kantenformel `apronRim` (alles `worldview.js`, Kinder von `WV.apron`). Test: `inselrand-v366.test.js`.

- v367: Tierfall mit Hufstütze/Schwerpunkt statt Knick-Zwischenpose; Hochsitz ohne Fragezeichen, alle Jagdaufträge im Dropdown (Touch-Ausnahme game+index). VISTA-Wolken vollständig projizierte feste Flächen ohne Drift. Organmesh zugleich Strahlgeometrie, neue kritische Treffer mit echtem Kontakt; `xrShot` korrigiert Altdaten nur als Ansichtskopie, keine erzwungenen Primärorgane. Kaufbeleg mit eigenem Flex-Scroller, direkt ohne Hai-Skript/Audio. PR #84 integriert, Inselassets bleiben366; Gesamtversion367. Prüfungen/Bilder/Videos docs/JAGD-UEBERNAHME-v367.md.
- v368: Fernstufen der Hofansicht in `worldStep` (`WV.far`: Gras ab Abstand 110 aus, Schatten ab 130 über `R.noShadow`, Fernbäume ab 170 über `treeFarMesh`/`treeFarSet` und `g.hide`, Kleinteile `WV.farD` ab 230). Messen mit `FV.R.stats`.

- v369: `villagegarden.js` – deterministische Haushaltsgärten erst nach Einzug, vier Profile mit selbst modellierter Ausstattung. `VILLAGE_VIEW` eigene yardGround/yard/yardFar-Knoten, Einzug/Leerstand unabhängig von Haustypänderung, Fernstufe112/98 (Ich-Perspektive voll). `villagesite.blocked` nutzt denselben Plan; Tore/Briefkasten/Radbucht frei. Kein Save-/Kostenmechanismus. PR #86 vollständig integriert, gl3d/worldview bleiben368; Lieferung369. Quellen/Bilder/Prüfung docs/WOHNGAERTEN-v369.md.
- v370: Fernstufen stufenlos (`gl3d.js`: Shader-Überblendung `uFade`/`uFadeInv`, `n.fade`, `g.fade`/`g.inv`, `R.shadowK`; `worldview.js`: Verläufe in `worldStep` über `ramp`, `treeFarSet(t)`).
- v371: Fernbäume aus dem echten Modell per Eckpunkt-Raster (`treeFarMesh`); antippbare Meldungen: Ziele `tab:`/`veh:`/`job:`/`order:`/`village:` in `runMsgGo`, Auto-Zuordnung `TOAST_GO`/`toastAutoGo` in `game.js` (nur Ereignis-Meldungen mit Symbol am Anfang).

- v372: Autofotos fest in carphotos.js (127 lokale cars/photos-Dateien, Lizenz/SHA in cars/credits.json), vor auction.js laden. Keine Wikipedia-Titel-/Markensuche oder Pixel-Lackmigration. Neue Lose Fotofarbe, alte Lacke bleiben und bei Abweichung Illustration. Modelljahre carBuildYears/carValidYear, einmaliges A.modelYears372. Comic v4 nach Bild-SHA mit COMIC_SOURCE/Abschlussprüfung. carpics.mjs --check prüft Freigaben offline; Download akzeptiert nur denselben SHA. Tests autofotos-v372.test.js/.browser.js; Details docs/AUTOFOTOS-v372.md. main einschließlich v371 integriert, gemeinsame Lieferung372.
- v373: Jagd – geschlossene Auftragsleiste im Hochsitz schmal und niedrig (`#huntUI .hu-job:not([open])` am Ende von `style.css`), aufgeklappt unverändert.

- v374: Werkzeug-Übergabe am Regal – Körper dreht sich zum Fach (`team.js`, `gearAction.stop.rack351`), Oberkörper beugt sich (`staffgear.js`, `node.rx`).

- v375: Nordöstliches Quellgebirge in alpine.js (nach woodmodels, vor worldview), See mit Auslauf zum vorhandenen Bergbach. Gemeinsames Höhenfeld für Gelände/Rim/Tiere; adaptive Nahauflösung am Wasser, feste Fernstufe, gecachte fmesh-Netze. 5 Steinböcke/2 Murmeltiere/2 Adler, verbundene Beine mit Hufkontakt, Tag/Nacht, keine Save-Migration. n.inv nun optional auch bei normalen G3-Knoten; komplementäre Stufen verwenden denselben Fade-Wert. Nav/Pflanzplätze/Aufsteller im Gebirge gesperrt. Landschaftssamen373 bleibt konstant. Tests berglandschaft-v375.test.js/.browser.js; Bericht docs/BERGLANDSCHAFT-v375.md.

- v376: PR #92/v374 mit main e6f1713 (v375) zusammengeführt. Werkzeugausrichtung/Beugung erhalten, Bergnavigation unverändert. Gesamt-/Cacheversion376 und team.js/staffgear.js376, andere Assets behalten ihre Versionen. Keine zusätzliche Spiel-/Speicherlogikänderung.

- v377: Trefferbild – Lunge/Leber/Pansen nach Rumpfprofil (`lungeY`, `LUNG_LO`), Halsorgane `NORG`/`neckContacts` im Schusskanal; Nebel beim Hochsitz-Übergang stufenlos (`fogMix`). Tests `trefferbild-v357`/`hunt.test.js` angepasst.

- v378: Revier-Layout auf der Karte (`worldRevier`, `WRV` in `hunt.js`): Bäume (60 %), Steine, Stämme der Ich-Perspektive stehen verkleinert auf der Wildwiese; `clear("tree")` mit Ring `WRV.margin`.

- v379: Hof – Seitenknöpfe Laden/Lager kleiner (Block am Ende von `style.css`), Seeblick-Knopf `#fbTown` entfernt; Zugang über das Bauernhaus-Fenster (`#fhTown`) besteht noch.

- v380: ALPINE ersetzt alte SPI-Quellanlage (worldview: SPI=null, springFx/springRun=null). Bergsee→freier Fall→POOL→DRAIN→FWORLD.creek, alte Hill-Masken aus; Kanal nach Beckenrandbildung schneiden. Nah/Fern am schmalen Überlauf verfeinern, nicht nur Nahmodell. Fall/Pool/Schaum feste Meshes mit vorhandenen Materialien, Partikel nur nah begrenzt. Westliche Mäander/konstante3,45 Breite, südlicher Austritt; o.meander verändert nur trockene Ufer, o.prefix verbindet Strömungsmuster. F.river380 verschiebt betroffene Bäume unter Datenerhalt. Neue Tests bergwasserfall-v380.* ersetzen v375-Erwartungen zur alten Wasserführung. Details docs/WASSERLANDSCHAFT-v380.md.

- v384: Wasserlandschaft als gemeinsames Flussmesh ALPINE.riverLine(), FWM optional level/bankY/bankCut. Ein festes adaptives Geländenetz; replacesGround für Bodenersatz getrennt von contains für Sperrfläche. Sechs Vorberge, fünf Terrassen/Steinböcke. apronEdges/apronEdgeRadius/islandClip und rimFall teilen echte Küsten-/Wasserpunkte; zweite Fallbreite korrigiert. Erhaltende Baummigration F.mountains384, keine erneute river380-Migration. Tests wasserlandschaft-v384.test.js/.browser.js, Bericht docs/WASSERLANDSCHAFT-v384.md. Basis main5d0076e; Jagd-/Waffen-PRs #98–#100 aus aktuellem main integriert.

- v381: Trefferbild – Todesursache (`deathCause`, `neckFate`), Trägerschuss ohne Wirbelsäule rennt noch (`runL` 3–18), Kanal durch den ganzen Hals, Halsmaße von Keiler/Fasan aus dem Netz (`neckExt`).

- v382: Jagd – Einschussloch in der Bergung (`woundSpot`/`woundMesh`/`addWound`, `A.woundM`/`A.woundX`), Fallseite `fallSide`; gedämpft, ohne Blutspritzer.

- v383: Waffenschrank (`weapons.js`, `S.farm.guns`, Katalog `LIST`, `canKill`, 3D-Modelle `MODELS`) im Hochsitz-Fenster; `hunt.js`: `gun()`, `gunZone`, Zone `schwach`, Magazin/Feuerfolge, Schrot (`pellets`/`cone`), `nearD`, Eindringtiefe (`stop`/`thru`), Nachschuss-Abzug; Lucky-Preis `gun` (Sonderwaffe Goldjagd). Recherche `docs/WAFFEN-v383.md`, Test `weapons-v383.test.js`.

- v385: Inselrand – Baumsaum aus echten Waldbäumen (`worldApronTreeSpots` → `WV.bgG`, Wind/Fernstufen), Grasdecke mit acht Ringen (`APRON_RINGS`) gegen Streifen; Dreiecksbudget im Test 8000.
- v386: Größerer Bergfall/Becken, optionale FWM.width mit ALPINE.riverWidth; Wasser8 gemeinsame Palette mit7, Weltkoordinatenwellen in Becken. uFallStart optional(Standard.24/Berg.05), Aufprallwellen und begrenzte Sprühpartikel. worldGround/ALPINE.setGroundSampler für gleiche Randfarben; dezente Felsfacetten. Keine neue Migration. Tests wasseroptik-v386.*, Bericht docs/WASSEROPTIK-v386.md; parallelen Inselrand-PR102/v385 beim Mergen vollständig erhalten.
- v388: Trefferbild ohne doppeltes Primärschild/Todesursachenblock, Herzstatus direkt in Organliste. organName nutzt anatomische Tierseite(−X rechts/+X links), alte IDs erhalten; Lungenlappen entsprechend. xrShot beachtet sh.stop ohne gespeicherte Wirkung zu ändern. Tests trefferklarheit-v388.*, Bericht docs/TREFFERKLARHEIT-v388.md. Andere offene PRs beim Mergen erhalten.
- v386: Fliegender Händler nach Bedarf (`farmTraderNeed`/`farmTraderDeals` in `erbe.js`): Auftragshilfe für Fehlmengen, Ankauf nach Geldlage (Richtwert 20.000·(1+Level/10)²), Kleeblatt-Paket/Luckybox/Edelholz für Wohlhabende; Grund-Marke `fr-why` in `openTrader`.
- v387: Rahmenvertrag – „Machbarkeit prüfen“ (`contractFeasibility`/`contractFeasHTML` in `goals.js`, Knopf `data-feas` in `extras.js`): je Büro Reichweite, Fahrpersonal, Fahrzeugkette, 20-h-Frist, freie Fahrten/Tag; grüner/roter Daumen (`.feas`, `.fth`).
- v388: Pausenende ohne Pendeln – Hofkräfte weichen einander in `peopletraffic.js` nicht mehr aus (Ausweichen kollidierte mit `staffFollow`); Test „v388 Pausenende“ in `worker-motion-v351.test.js`; Merkpunkt unter „Bekannte Fehlerquellen“.

- v389: Weißer Hirsch/Reh/Paket – Zusatzspruch entfernt, nur die Kleeblatt-Anzeige bleibt (`worldEvAct` in `worldview.js`).

- v390: Hof-Ereignismeldungen antippbar – `farmEvGo`/`MSG_GO.farmev` in `worldview.js` (Kamera zum Ereignis, Händler/Nachbar öffnen), Ziel von `farmEvView` gesetzt.
- v394: Fasan – Laufanimation: Ständer im Wechselschritt mit Fußheben und Rumpfwippen (`A.pph` in `hunt.js`).
