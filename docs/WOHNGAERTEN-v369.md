# v369 – Bewohnte Gärten in Seeblick

## Reale Vorbilder und Gestaltung

Am 17. November 2026 wurden diese beiden Gartenplanungsartikel samt Fotos angesehen:

- [HORNBACH: Garten planen](https://www.hornbach.de/projekte/garten-planen/): Garten zunächst in praktische Bereiche gliedern – Sitzplatz, Beete, Spielbereich und Grillecke; kurze Wege und genügend Platz für spätere Ausstattung berücksichtigen.
- [OBI: Kleinen Garten gestalten](https://www.obi.de/magazin/garten/gartengestaltung/kleinen-garten-gestalten): klare Struktur, Sichtachsen, aufeinander abgestimmte Wege/Sitzflächen und niedrige Pflanzung. Das Gartenfoto zeigt eine kleine Sitzecke zwischen Beeten unter einem Baum.

Daraus abgeleitet: Terrasse auf der freien Hausseite, Stauraum hinten am Rand, Nutz-/Ruhe-/Spielbereich im hinteren Garten und dazwischen freie Rasenflächen. Der Anbau des Familienhauses wird berücksichtigt. Kleine Obstbäume passen nur bei den kleineren Holzhäusern in die vordere Pflanzzone. Es wurden eigene prozedurale Modelle im Spielstil gebaut; keine fremden Fotos oder Assets übernommen.

## Ausstattung und Einzug

`VILLAGE_GARDEN` in `villagegarden.js` erzeugt anhand von Haushalt, Beruf und stabilem Bewohner-Seed vier Gartenprofile:

- Familie: Gartenhäuschen mit Regentonne, Tisch mit Stühlen, klassischer Kugelgrill, A-Rahmen-Schaukel und Sandkasten.
- Beete: Häuschen, Sitzplatz, zwei Hochbeete, Vogelbad, niedrige Pflanzung und bei genügend Platz ein kleiner Obstbaum.
- Gesellig: Häuschen, Sitzplatz, Grill und eingefasste Feuerstelle mit Bänken.
- Ruhe: Sitzplatz, Gartenhäuschen, Staudenbeet, Feuerstelle mit Bänken und gegebenenfalls Obstbaum.

Alle erhalten eine Terrasse, verbundene Seitenwege und Pflanzkästen. Drei zurückhaltende Holz-/Dach-/Textil-/Blütenpaletten sorgen für Variation. Die Feuerstelle enthält Holz und bleibt unbefeuert. Eine leere Terrasse oder unbenutzte Schaukel erzeugt keine dauernden Effekte.

Die Einrichtung erscheint erst bei vorhandenem Bewohner mit Status `resident`, `rented` oder `sold`. Unterschriebene Verträge, bestehende Nachbarn und bereits bewohnte gekaufte Häuser werden unterstützt. Baustellen und bezugsfertige Häuser mit bloßen Interessenten erhalten keine Ausstattung. Die Ansicht aktualisiert sich direkt bei Einzug, auch wenn Haustyp und Hausknoten unverändert bleiben. Bei Leerstand verschwindet die Einrichtung wieder.

Der Plan wird abgeleitet, nicht im Spielstand gespeichert. Es gibt keine neuen Gebühren, Erträge, Bauaufträge oder Veränderungen an bestehenden Verträgen. Bewohner behalten nach Laden denselben Garten. Die bisherigen fünf allgemeinen Blumenkugeln entfallen, damit sie nicht unter Häuschen oder Spielgeräten stehen.

## Platzierung, Hindernisse und Fernansicht

Alle Gegenstände verwenden einen gemeinsamen Plan mit Grundstückskoordinaten, Größen und Ausrichtung. Die sichtbaren Modelle bleiben innerhalb dieser Flächen und des Zauns. Derselbe Plan sperrt die belegten Flächen für die Wegprüfung der Bewohner. Tor, Haustür, Briefkasten und Radbucht bleiben frei. Es handelt sich bewusst um konservative Grundflächen, nicht um exakte Kollision gegen jedes Stuhlbein.

Die Detailansicht bleibt bis Kameraabstand 112 aktiv; beim Heranzoomen kehrt sie unter 98 zurück. Dazwischen gibt es keinen ständigen Wechsel. Weit entfernt bleiben vereinfachte Silhouetten der Ausstattung erhalten; Nahdetails wie Roststäbe, Griffe, Blüten und Bretterfugen werden ausgelassen. Die Ich-Perspektive verwendet die Nahdarstellung. Kollisionen und Gartenplan ändern sich durch den Zoom nicht.

Modelle werden je Profil/Farbpalette/Haustyp/Straßenseite geteilt und zwischengespeichert. Maximal 1.986 zusätzliche Dreiecke je Garten im Prüfraster, maximal 782 in der Fernstufe. Keine neue laufende Objektanimation oder Partikelschleife. Die parallelen allgemeinen Fernstufen aus PR #86/v368 (`eb91b68`) sind vollständig integriert; main/Pages wurden nicht automatisch veröffentlicht.

## Sichtprüfung

Echter WebGL-Renderer und echte Hausmodelle, generierte Testspielstände:

- [Familiengarten auf der vollständigen Insel, mobil](assets/v369/familiengarten-insel-mobil.png)
- [Blumen-/Nutzgarten](assets/v369/blumengarten.png)
- [Ruhebereich mit Feuerstelle](assets/v369/ruhe-feuerstelle.png)
- [Ganzes Quartier](assets/v369/quartier-uebersicht.png)
- [Vollständige Insel in der Fernansicht](assets/v369/insel-gaerten-fern.png)

## Prüfungen

`node gaerten-v369.test.js`: fünf Prüfgruppen. Echter Kauf/Bau/Verhandlung/Einzug; bestehende und gekaufte Haushalte; Leerstand/Baustelle; deterministischer Plan nach Laden ohne Geld-/Saveänderung; alle 20 Grundstücke × zwei Haustypen × vier Gartenprofile. Geometrie innerhalb von Grundstück und Hindernisflächen, außerhalb von Haus/Anbau; keine überlappenden Ausstattungszonen, freie Haustür-/Tor-/Briefkasten-/Radzugänge. Dreiecksbudget und kleinere Fernmodelle geprüft.

`node gaerten-v369.browser.js`: echte Vermietung mit sofort sichtbarer Ausstattung bei unverändertem Hausknoten; vier Profile und beide Straßenseiten, mobiles Bild und Quartierübersicht; Fernstufen samt Hysterese und Ich-Perspektive; 40 Synchronisationen ohne zusätzliche Knoten/Meshes oder Geldänderung; Ausstattung bei Leerstand verborgen und nach Wiederherstellung wieder sichtbar. Vollständige Insel mit 20 Gärten, Schatten in weiter Ansicht aus und bei Rückkehr wieder an. Keine JavaScript-Laufzeitfehler.

Regressionen: `village-v340.test.js` (12 Gruppen), `village-life-v343.test.js` (13 Gruppen, nun mit aktivem Gartenmodul), `fixes-v354.test.js` (9 Gruppen, ebenfalls mit Gärten), `floating-island-v358.test.js`, `inselrand-v366.test.js` und `release-v358.test.js`. Letztere prüft zusätzlich das neue Offline-Asset und seine Versionsreferenz.

Chromium mit Software-WebGL; kein echtes iPhone/Safari getestet. Dreieckszahlen sind keine Aussage über die tatsächliche Bildrate auf dem Telefon.
