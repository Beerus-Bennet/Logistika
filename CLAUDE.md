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
- v324: Filterleisten über den Listen (`#viewTools`) einheitlich: beschriftete Zeilen über `toolRow(label, inner)`, eigener Chip-Stil nur in `#viewTools` (die Klasse `.fchip` teilen sich Filter und Hof-Warenchips – Regeln immer mit `#viewTools` eingrenzen).
