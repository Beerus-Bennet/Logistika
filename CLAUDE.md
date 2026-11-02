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
- Testmodus: `index.html?test` bzw. `?test=100`.
- Unit-Tests: `*.test.js` im Wurzelordner, erwarten `ROOT = path.join(__dirname, "..")` → zum Ausführen in `tests/` kopieren. `axe.test.js` und `trees.test.js` schlagen schon länger fehl.
- Browser-Tests: Playwright (vorinstalliertes Chromium) gegen `python3 -m http.server`. Das Intro überdeckt das Spiel; Inhalte zum Ansehen in eine leere Seite kopieren. Für 3D-Bildchen Chromium mit `--use-angle=swiftshader` starten.

## Feste Regeln (Bennet)
- Immer auf Deutsch antworten.
- **Jede Lieferung bekommt eine neue Version:** `sw.js` → `const VERSION = "vNNN"`, alle `?v=NNN` in `index.html` (und `manifest.webmanifest`) anpassen, oben in `AENDERUNGEN.md` einen Abschnitt `## vNNN – …` (Ursache, Lösung, geprüft/nicht geprüft); bei größeren Änderungen auch `ZUSAMMENFUEHREN.md`.
- Commit-Nachrichten beginnen mit `vNNN: …`.
- **Vor jeder Arbeit `git fetch` und den Stand von `main` prüfen.** Bennet lädt teils selbst Dateien über die GitHub-Weboberfläche hoch – dabei können ältere Fassungen von `index.html`/`sw.js` mitkommen und Versionsnummern zurücksetzen (zuletzt passiert nach v252, behoben in v253).
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
