# PR172: Bergfarben, Fahrzeuge und Training · v474

PR172 basierte auf einem älteren Stand mit Gesamtversion472. Im Hauptbranch lagen inzwischen die Fahrzeugformen472; der bereits angeforderte Trainingsfix473 stand in PR174. Die gemeinsamen Versionszeilen und ergänzten Dokumentationseinträge ließen sich nicht automatisch zusammenführen.

Der gemeinsame Stand enthält main **58774ff**, Training **c9e6be5** aus PR174 und Bergfarben **c803496** aus PR172. PR172 wird per normalem Fast-Forward-Push auf diesen gemeinsamen Nachfahren aktualisiert. Keine Originalcommits werden entfernt, kein Force-Push und kein automatischer Merge nach main.

## Erhalt der Änderungen

| Bestandteil | Nachweis |
| --- | --- |
| Bergfuß übernimmt Wiesenfarbe; Felsfärbung erst nach Höhenübergang | `alpine.js` bytegleich zum ursprünglichen PR172-Head `c803496` |
| Aktuelle Fahrzeugmodelle und Vorschau | `carforms.js`, `carmodels.js`, `racecars.js`, `racecarview.js`, `cars.js` bytegleich zu main58774ff |
| Trainingsziel nach zwei Runden einschließlich Randbereich | `racedrive.js` und `racing.js` bytegleich zu PR174/c9e6be5 |
| Versions-/Cachezuordnung | Gesamt-/SW/LOGI_V474; alpine474, Fahrzeug-Assets472, Trainings-Assets473; beide Änderungsprotokolle erhalten |

PR172 enthält damit den kompletten Trainingsfix aus PR174. Wird zuerst PR174 gemergt, bleiben dessen Änderungen beim nachfolgenden Merge von PR172 enthalten. Beim Merge von PR172 gelangen beide Korrekturen gemeinsam nach main. Keine neuen Spielstandfelder oder Migration.

## Geprüft

- Bytevergleiche mit den oben genannten Quellen, keine ungelösten Konfliktmarker, Syntax und Assetverweise.
- `node gebirge-v429.test.js`: Kamerahöhe, weiche Farben, 9.918 Geländedreiecke und Tiergelenke.
- `node gebirge-v413.test.js`: Kamm, Hütte, Pfad und feste Geometriebudgets.
- `node wasseroptik-v386.test.js`: Wasser-/Uferanschlüsse, Tiere, Zoom und Spielstandschutz.
- `node trainingsziel-v473.test.js`: 18 Gruppen, neun vollständige Kontrollpunktläufe auf drei Kursen.
- `node fahrzeugformen-v472.test.js`: alle 127 Modelle/Referenzen, Maße, Normalen und Budget.
- Chromium/SwiftShader: gemeinsame Version474 mit Gebirge, 127 Formdatensätzen und Renn-/Trainingsfunktionen ohne JavaScript-Seitenfehler geladen.

Die Bergfarblogik wurde bei dieser Konfliktbehebung nicht verändert. Keine neue visuelle Farbprüfung bei Abendlicht oder auf einem echten iPhone/Safari; die Grenzen des ursprünglichen Bergfarben-PRs gelten weiterhin.
