# Änderungen – kurz für den Kollegen

## v209 – Rezeptkacheln: Tipp auf eine Zutat startet keine Produktion mehr

- **Problem:** Ein Tipp auf den Zutaten-Chip (z. B. „5/1“ Eichenstämme) stellte auf dem iPhone trotzdem das Produkt in die Warteschlange, und die Kachel drückte sich mit ein. Die Abwehr aus v129/v165 prüfte nur das Ziel des Klicks (`e.target`); iOS meldet den Tipp innerhalb eines Knopfs teils am Knopf selbst.
- **Lösung (`farmview.js`):** neue Hilfe `recChipAt(b, e)` prüft die Fingerposition gegen die Rechtecke der Chips (6 px Rand). Liegt der Tipp auf einer Zutat, zeigt sie nur ihren Namen und Bestand, das Rezept startet nicht. Beim Aufsetzen auf einer Zutat bekommt die Kachel `nopress` und drückt sich nicht ein (`style.css`).
- Im Test-Browser nachgestellt: Klick am Knopf mit Chip-Koordinaten → nichts eingestellt; Tipp auf das Produkt → eingestellt.

## v208 – Lkw-Stellplatz als Ladebucht quer zum Weg, gerade Zufahrt

- **Analyse:** Der Stellplatz lag parallel zum Hauptweg, der Laster sollte von Süden einfahren. Die Zufahrt musste deshalb vom Weg aus einen Haken um 90° schlagen und lief als Bogen mit Grasinsel auf die Stirnseite zu. Dazu zeichnete sich ihr rundes Ende über dem Stellplatz (Weg 6 lag mit y 0,044 höher als die Fläche mit 0,034).
- **Neu:** Der Stellplatz ist um 90° gedreht und steht quer zum Hauptweg wie eine Ladebucht – offene Stirnseite zum Weg, Radstopper hinten (Westen). Fläche, Maße und Markierung sind unverändert. Mitte (−46,5, −24,5), Objekt `x −33, z −10, r 1` (Drehung +90°, `farmview.js` und `bauplatz.js`).
- **Zufahrt:** gerade, 3 m kurz, quer vom Hauptweg (neuer Abzweigpunkt (−41, −24,5) auf dem Hauptweg; der v203-Punkt (−40,4, −19,95) ist wieder weg). Das Wegende an der Bucht hat keine runde Kappe mehr (`cap` in `worldview.js`) und liegt unter der Fläche, die 2,4 cm angehoben ist (`sawLkw`).
- **Laster:** parkt mit der Front zur Zufahrt (`lkwRy`), fährt gerade heraus und biegt im Bogen nach Süden auf den Hauptweg (`lkwRoute`); Ankunft umgekehrt. Beladen nutzt die Drehung des Lasters (unverändert).
- `LKW_BAY` auf die neue Lage; einmalige Umstellung `F.v208lkw` (Platz, Drehung, Bäume aus der Bucht).

## v207 – Quell-Wasserfall: Herkunft des Wassers (Hangquelle, Bergbach, Kaskaden)

- **Idee:** Hinter der Felswand steigt jetzt ein bemooster Felshang in den Wald an. Oben tritt das Wasser am Fuß eines großen Findlings aus (Quelltopf, sprudelt sichtbar), läuft als schmaler Bergbach in einer Rinne den Hang hinab, fällt über zwei kleine Kaskaden mit einem Becken dazwischen in das Becken auf der Felskante und von dort als großer Fall in den Topf. Der Weg des Wassers ist damit von der Quelle bis zum Topf durchgehend sichtbar.
- **`woodmodels.js`:** neue Daten `SRUN` (Bachlauf, Kaskaden, Becken, Quellaustritt) und Funktionen `srcWater`, `yAlong`, `hillH` (Höhenfeld; Kamm hängt stetig von der Hangachse ab, Rinne und Becken eingetieft, Hang läuft an den Seiten und vorn weich aus), `springHill` (Gelände mit Farben aus dem Waldboden, Moos, Fels in Flecken, nasser Stein am Wasser; Findling, Stufensteine unter den Kanten, Blöcke, Moos, Farne), `springRun` (Bachwasser und Becken, water 2), `springCascades` (Shader 6 wie der große Fall), `springRunFoam` (Schaum an den Kaskadenfüßen, Sprudeln an der Quelle), `springRunInfo`. In `springRocks`: Rückwand hinter dem Becken entfernt (zwei Rahmensteine im Hang ersetzen sie), Steinkranz zum Zulauf hin offen.
- **`worldview.js`:** Knoten für Hang, Bach, Kaskaden, Schaum; Becken fließt jetzt (water 2). Spritzer und feiner Nebel an den Kaskadenfüßen, Blubbern am Quellaustritt (nur in Kameranähe). Kulissenbäume, Büsche und Bodendeko halten den Hang frei (Maske).
- **`erbe.js`:** `FWORLD.springHill` (Achse und Halbbreite des Hangs), `inSpringHill`; fällbare Bäume entstehen dort nicht mehr. Einmalige Umstellung `F.v207hill`: Bäume, die in bestehenden Spielständen auf dem Hang stehen, rücken an seinen Fuß.

## v206 – Ställe: gemeinsames Limit von 7

- **Neu** (`farmdata.js`): `FPEN_SHARED` (Hühnerstall, Kuhstall, Schweinestall, Schafweide, Rinderweide) und `FPEN_MAX = 7`. Zusammen dürfen höchstens 7 Ställe stehen; welche und wie viele von jeder Art, entscheidet der Spieler – wie bei den Obstbäumen.
- Das Limit gilt ab Beginn und wächst nicht mit dem Level; die einzelnen `lim`-Regeln der Ställe (1 bzw. 2 ab Level 5/8) sind entfernt. Die Freischaltstufen der Stallarten (Kuhstall Lv 3, Schweine Lv 4, Hühner/Schafe Lv 5, Rinder Lv 6) bleiben.
- **`farm.js`**: `shopCount` zählt bei Ställen alle Ställe zusammen, `shopLimit` liefert 7.
- **Laden** (`farmview.js`): Anzeige „n/7“ an jedem Stall, bei vollem Limit „Alle 7 Ställe belegt“. Text Hühnerstall ohne „Zweiter“, Level-5-Freischaltung „zweiter Hühnerstall“ entfernt.
- Der Start-Hühnerstall zählt mit (neuer Spielstand: 1/7). Bestehende Spielstände bleiben unverändert.

## v205 – Hofteich aufgeräumt

- **Ringe entfernt** (`farmmodels.js`, `pondProps`): keine hellen Kreise mehr um Seerosen, Steine im Wasser und Treibholz (aus v195, wirkten wie Auswahlkreise).
- **Treibholz** liegt ganz im Wasser (80 % des Uferradius), parallel zum Ufer und halb eingetaucht – vorher quer über der Uferkante.
- **Schilf** (`pondReeds`): Halme stehen im nassen Sand direkt an der Wasserlinie (4–34 cm außerhalb) statt bis 30 cm im Wasser, wo die Oberfläche sie abschnitt; einige mit grünem Horst am Fuß.
- **Ruderboot** weiter draußen (lokal x 0,75 / z 0,98 statt 0,1 / 0,86): schwimmt frei, mit Abstand zu Steg und Ufer.

## v204 – Quell-Wasserfall: offenes Becken oben, Aufprall mitten im Topf

- **Ursprung:** Oben liegt jetzt ein stilles Becken (`springBasin`, `SPRING_FALL.basin`) in einer Felsmulde mit Steinkranz, zur Rinne hin offen. Die Rinne läuft sichtbar und oberirdisch zur Kante. Vorher steckte sie im hinteren Felsen (die Rückwand reichte über die Rinne, die Flanken ragten in sie hinein).
- **Felsen (`springRocks`):** Flanken weiter außen, Rückwand hinter das Becken versetzt, zwei Seitenfelsen der Mulde, zwei Bettfelsen unter Becken und Rinne.
- **Lage:** Kante `top` (−3,3 / 2,0) statt (−3,6 / 2,15), Fuß `foot` x −1,45 statt −2,6 (lokal, ×1,5). Der Aufprall liegt 2,3 m innerhalb des Topfrands statt 0,6 m – nicht mehr am Ufer. Schaum, Wellenringe und Gischt hängen am Fuß und wandern mit.
- Modellschlüssel `wspring204`, `wspringfall204`, `wspringfoam204`, `wspringbasin204`.

## v203 – Lkw-Stellplatz neben dem Hauptweg, kurze Zufahrt

- **Stellplatz** (Fläche, Markierung, Radstopper unverändert) rückt 3 m nach Westen: Mitte (−46,5, −24,5) statt (−43,5, −24,5). Zwischen ihm und dem Hauptweg bleibt ein Grasstreifen; der Hauptweg läuft unverändert gerade zum Südtor.
- **Zufahrt:** kurzer Weg vom Südende des Stellplatzes, der im flachen Bogen vom Hauptweg abzweigt (neuer Abzweigpunkt (−40,4, −19,95) auf dem Hauptweg). Die alte v197-Zufahrt mit der Ausbuchtung ist weg.
- **Schotter:** `LKW_BAY` (erbe.js) umschließt nur noch den Stellplatz; der Schottersaum reichte vorher über den Hauptweg und bildete den unsauberen Erdfleck.
- **Laster-Route** (`lkwRoute`) über die neue Zufahrt.
- **Speicherstand:** einmalige Umstellung `F.v203lkw` setzt den Stellplatz um; Bäume in der neuen Bucht rücken nach Westen.

## v202 – Fehleranzeige: nacktes „Script error.“

- `index.html`: Ein „Script error.“ ohne Datei, Zeile und Fehlerobjekt (von iOS so maskiert, nicht auswertbar, nicht reproduzierbar im Test-Browser) zeigt kein Banner mehr, sondern wird nur in `localStorage` `logistika.lastScriptError` gemerkt. Echte Fehler zeigen weiterhin das Banner, jetzt mit Fundstelle aus dem Stack, falls die Zeile fehlt.

## v201 – Neuer Ladescreen: Holz-Lkw fährt über die Ladeleiste

- **Ort:** `farmBoot` in `farmview.js` (Ladescreen beim ersten Aufbau des Hofs), Hilfen `ldMake`, `ldStart`, Grafiken `LD_TRUCK`, `LD_BG`, `ldTreeSVG`. Gestaltung in `style.css` (Abschnitt „v201: Ladescreen“).
- **Aufbau:** abgerundetes Fenster mit Kontur und Schatten, im Hintergrund Berge und Tannen. Die Leiste ist ein Waldweg, der sich in Grün (`#28A745` mit `#1E7E34`) füllt. Ein Low-Poly-Holz-Lkw fährt mit dem Fortschritt, hinter ihm wachsen Setzlinge auf. Darüber steht die Prozentzahl.
- **Sprüche:** 0–30 % „Setzlinge werden auf dem Hof gepflanzt …“, 31–70 % „Sägewerk wird eingerichtet & Holztransport bereitgestellt …“, 71–99 % „Sägen werden geschärft – gleich geht's los!“, 100 % „Willkommen auf dem Erbhof!“.
- **Wichtig:** Der Aufbau blockiert den Hauptthread, daher ist der Fortschritt eine **Schätzung** aus der letzten Ladezeit (gespeichert in `localStorage` `fbMs`, Standard 1,8 s). Alles läuft als Web-Animation (transform/opacity). Ist der Hof fertig, fährt der Rest in unter 1 s auf 100 %, dann kurz „Willkommen“ und Ausblenden. Die Ladezeit selbst wird dadurch nicht länger als etwa 1,2 s Anzeige.
- **Daten:** keine Änderung am Speicherstand.

## v200 – Jagd: jedes Stück einzigartig, Seltenheit, abgestufte Bergung, Jagdbuch, Aufträge, Ehrenplatz

Alles läuft in der vorhandenen Technik: eigene WebGL-Engine `gl3d.js` für die Tiere, DOM/CSS für die Oberfläche. Es gibt keine neue Bibliothek und keine neue 3D-Engine.

**Identität je Stück (`hunt.js`, Abschnitt „v200: Identität jedes Stücks“)**
- **Erbgut:** Jedes Stück bekommt beim Erscheinen einen Erbgut-Wert `g`. Aus `g` und der Güte `s` folgen über `genes(k, s, g)` fest, ohne Zufall beim Zeichnen: Decke bzw. Gefieder, Altersklasse, Körperbau (±3 %), Besonderheiten und Seltenheit.
- **Datensatz:** Die kurze Fassung `gn` wird im Datensatz der Trophäe gespeichert (`S.farm.hunt.coll[].gn`, auch im Jagdbuch-Log). Sie enthält nur Schlüssel, keine Farben.
- **Gleiches Stück überall:** Revier, Bergung, Trophäenwand, Drehansicht, Bildchen und Schautafel zeichnen aus `gn` dasselbe Stück.
- **Wiesenwild:** Das Wild auf der Wildwiese der Karte trägt sein Erbgut schon dort. Ein weißes oder geschecktes Stück fällt auch auf der Karte auf (Tönung). Steigt man auf, steht genau dieses Stück im Revier.
- **Decken mit Häufigkeit:**
  - Hirsch: rotbraun 55 %, dunkel 17 %, hell 14 %, graubraun 10 %, Schecke 3,2 %, weiß 0,8 %.
  - Keiler: graubraun 56 %, schwarz 20 %, rötlich 15 %, silbergrau 6 %, Schecke 2,5 %, weiß 0,5 %.
  - Fasan: mit Halsring 74 %, ohne Halsring 18 %, dunkel 6,8 %, weiß 1,2 %.
- **Besonderheiten am Hirsch:**
  - Auslage: weit 10 %, eng 8 %.
  - Geweihform: ungerade 14 %, doppelte Augsprosse 4 %, abnorme Sprosse 2,5 %.
  - Alter Recke 5 %, nur bei mittlerer Güte: graues Gesicht, schwere Mähne.
  - Kampfnarbe 4 %: heller Streifen über Schulter und Flanke.
- **Besonderheiten an Keiler und Fasan:** Keiler mit Narbe 9 % oder Schlitzohr 8 % (eingerissener Teller); Fasan mit langem Stoß 10 %.
- **Altersklassen:** jung, mittelalt, reif, alt (Fasan: jung, ausgewachsen). Sichtbar wird das Alter an der Mähne und am grauen Gesicht alter Hirsche bzw. am grauen Bart alter Keiler.
- **Modelle:** Gleiche Basismodelle, keine Kopien. Die Farben werden nur für die Dauer des Baus ersetzt (`withLook`). Der Schlüssel im Modellspeicher enthält das Aussehen (`lookKey`, `antKey`). Trefferzonen und Skelett bleiben unverändert.
- **Seltenheit aus Punkten:**
  - Die Decke bzw. das Gefieder und jedes Merkmal geben 0–5 Punkte, die Güte ab 0,86 einen Punkt und ab 0,95 zwei.
  - 0 = gewöhnlich, 1 = auffällig, 2 = selten.
  - Außergewöhnlich braucht ein Merkmal mit 3 Punkten oder 4 Punkte insgesamt mit einem Merkmal ab 2 Punkten.
  - Legendär sind die weiße Decke oder 6 Punkte mit einem deutlich sichtbaren Merkmal (gescheckte Decke, dunkler Fasan, abnorme oder doppelte Sprosse, alter Recke).
- **Gemessene Verteilung** (Simulation, 200 000 Stücke je Art; in %: gewöhnlich / auffällig / selten / außergewöhnlich / legendär):

  | Art | gewöhnlich | auffällig | selten | außergewöhnlich | legendär |
  |---|---|---|---|---|---|
  | Hirsch | 46,4 | 31,3 | 15,1 | 6,2 | 1,0 |
  | Keiler | 63,1 | 24,6 | 9,3 | 2,5 | 0,5 |
  | Fasan | 65,5 | 24,3 | 2,2 | 6,9 | 1,2 |
- **Namen:** Weißer Rothirsch, Gescheckter Rothirsch, Alter Recke, Silbergrauer Basse, Weißer Keiler, Weißer Fasan, Dunkler Fasanenhahn. Ungerade Geweihe heißen nach Jägerbrauch „Ungerader 14-Ender“ (doppelte Zahl der stärkeren Stange).

**Wert und Bewertung**
- **Sammlerwert:** Er ist der Preis der Medaille mal dem Seltenheitsaufschlag (×1 / 1,1 / 1,3 / 1,8 / 3). Die Lagerware bleibt `tro_<art>_<medaille>`; der Aufschlag wird beim Verkauf an der Wand oder am Markt dazugezahlt.
- **Medaillenregeln** bleiben unverändert.
- **Schussnote** (0,5–5 Sterne, neu): Trefferlage, Entfernung (ab 160 / 190 / 220 m), ziehendes Stück (+1), Wind ab 4 m/s (+0,5), erst krank geschossen (−1,5). Die Gründe stehen auf der Karte.
- **Bestleistungen** werden dauerhaft in `H.pb` gespeichert: stärkstes Stück je Art, weitester Schuss, beste Schussnote. Die Karte vergleicht mit dem bisherigen Rekord („Neuer Rekord: Güte 81 – bisher 74“).

**Bergung (abgestufte Präsentation, `presOf`)**
- **Stufen:** 0 Standard · 1 gutes Stück (Gold/Diamant oder auffällig) · 2 neuer Rekord oder neues Merkmal · 3 selten/außergewöhnlich · 4 legendär.
- **Seltenheitsband:** Es erscheint unter dem Namen; ab „selten“ einen Moment später mit Glanz, eigenem Klang, Rütteln und feinen Lichtpunkten am Stück, bei „legendär“ golden und mit zweitem Klang.
- **Ab Stufe 3:** farbige Vignette, längere, ruhigere Kamerafahrt, danach wandert die Kamera langsam weiter um das Stück, bis man selbst wischt.
- **Merkmals-Hinweis:** Er sitzt neben dem Haupt bzw. Geweih des liegenden Stücks, z. B. „Ungerader 18-Ender · Ungerades Geweih“ oder „Waffen 18 cm“, folgt beim Drehen und verblasst nach 6 s.
- **Karte:**
  - Seltenheit und Merkmale als Plaketten, neue Einträge mit dem Zusatz „neu“, Altersklasse, „Neuer Rekord“.
  - Sammlerwert mit Aufschlag.
  - Aufklappbar: Gewicht, Treffer, Flucht, Güte auf der Medaillenskala, Schussnote mit Gründen, Rekordvergleich.
- **Nach dem Sichern:** „Neu im Jagdbuch: …“ mit Stand der Art, erfüllte Aufträge mit Belohnung.
- **Überspringen:** Antippen überspringt das Warten wie bisher.
- **Medaillentext:** Diamant heißt jetzt „Herausragendes Stück“ (vorher „Außergewöhnliches Stück“, Verwechslung mit der Seltenheit).
- **Schautafel:** Sie steht links neben dem Hochsitz, die Vorderseite zeigt zur offenen Wiese.
- **Fernglas:** Es zeigt, was man schon sehen kann (Decke, Geweihform, alter Recke). Die Seltenheit zeigt sich erst beim Bergen.

**Trophäenwand und Jagdbuch (Lager → Trophäen)**
- **Reiter:** Wand, Jagdbuch, Aufträge.
- **Wand:**
  - Filter nach Art und Seltenheit, Sortierung nach Stärke, Neuheit oder Wert.
  - Rahmen in der Farbe der Seltenheit, Kennzeichen „Neu“ seit dem letzten Besuch, nach je 24 Stücken „Weitere zeigen“.
  - Nahansicht mit Seltenheit, Merkmalen, Alter, Schussnote, Rekord-Abzeichen.
- **Jagdbuch je Art:**
  - Fortschritt (Hirsch 22, Keiler 17, Fasan 12 Einträge) und die Bestleistungen.
  - Die drei besten Stücke als Bild.
  - Alle Einträge nach Gruppen (Decke, Geweih, Alter, Körper, Seltenheit). Fehlende zeigen einen Hinweis, ohne zu verraten, wie es aussieht.
- **Ehrenplatz:** bis zu drei Stücke. Sie hängen an einer neuen Schautafel neben dem Hochsitz (3D, dieselben Präparate) und werden weder an der Wand noch am Markt verkauft. Antippen der Schautafel öffnet die Trophäenwand.
- **Markt:** Er verkauft je Stufe das schwächste gewöhnliche Stück; Ehrenplätze und seltene Stücke gehen zuletzt.

**Jagdaufträge vom Förster**
- **Drei Aufträge:** immer einer leicht (150 € / 15 EP), einer mittel (350 € / 30 EP) und einer schwer (800 € / 60 EP), aus 15 Vorlagen.
- **Arten:** Art erlegen, zwei Trophäen, Fasan im Flug, Silber/Gold, Herzschuss über 170 m, Kammerschuss bei Wind, neues Merkmal, 4-Sterne-Schuss, drei Trophäen ohne krank geschossenes Stück (setzt bei einem Krankschuss zurück), ziehendes Stück, über 210 m, mindestens auffällig, eigenen Rekord übertreffen.
- **Ohne Glück erfüllbar:** Nur einer verlangt Glück (mindestens auffällig, etwa jedes zweite Stück).
- **Belohnung:** Jeder Auftrag zahlt genau einmal; danach kommt sofort ein anderer.
- **Anzeige:** Hochsitz-Fenster, Reiter „Aufträge“, im Revier wechselnd eingeblendet (nicht im Zielfernrohr).
- **Förster-Nachricht:** einmal, sobald der Hochsitz steht.

**Erfolge (`goals.js`)**
- Neu: Waidmannsheil, Kapitales Stück, Seltener Anblick, Gut dokumentiert (20 Merkmale), Rechte Hand des Försters (10 Aufträge). Belohnung wie alle Erfolge.

**Speicherstand und Altbestand**
- **Nur Ergänzungen:**
  - Trophäen-Datensatz: `gn`, `mv`, `wv`, `cw`, `pin`.
  - Jagdzustand `S.farm.hunt`: `dex`, `pb`, `jobs`, `jn`, `jd`, `jlast`, `jann`, `wseen`, `v200`.
- **Alte Trophäen ohne `gn`:** klassisches Aussehen und Seltenheit nur aus der Güte. Beim ersten Laden kommen sie ins Jagdbuch, ihre Bestwerte nach `H.pb`.

**Tests:** `tests/hunt.test.js` hat jetzt 23 Tests. Die 5 neuen prüfen:
- gleiches Erbgut ergibt dasselbe Stück;
- die Verteilung je Art, wobei legendäre Stücke immer sichtbar besonders sind;
- jede Decke und Form baut ohne NaN, und die Farben werden zurückgesetzt;
- Wert und Schussnote;
- Altbestand im Jagdbuch, Aufträge zahlen genau einmal, der Ehrenplatz ist geschützt, Seltene gehen zuletzt.

## v199 – Mieter an der Hütte passt zum Namen (männlich / weiblich)

- **Geschlecht nach Vornamen** (`rent.js`, `GEN`, `lookOf`): Jonas, Lukas, Tim, Felix → männlich; Mia, Sophie, Lea, Emma → weiblich. Gilt auch für Mieter, die schon im Spielstand stehen (kein neuer Spielstandwert nötig). Frisur, Bart und Kleidung ergeben sich fest aus der `seed` des Mieters, ändern sich also nicht von Besuch zu Besuch.
- **Weiblich:** schmalerer Oberkörper, Kleid mit Gürtel und weitem Rock, dunkle Beine, Frisur lang, Pferdeschwanz, Dutt oder Locken.
- **Männlich:** breitere Schultern, Frisur kurz, Scheitel oder Stoppeln, oft Bart, oft Flanellhemd (karierte Streifen), Stiefel, manchmal Cap.
- **`woodmodels.js` `person()`:** neue Optionen `fem`, `dress`, `broad`; Arme sitzen passend zur Schulterbreite. Alle anderen Figuren im Spiel sind unverändert.

## v198 – Arbeitermenü: Scrollen öffnet nicht mehr die Mengengrenze

- **Ursache:** Das Halten einer Kachel (Mengengrenze) startete nach 0,45 s, auch wenn der Finger dabei die Liste verschob. Dazu kam: Das Menü zeichnet sich alle 0,5 s neu; die Kachel unterm Finger wurde dabei ersetzt, das Scrollen brach ab und der alte Zeitgeber lief weiter.
- **Behebung (`team.js`, `renderStaffPop`):** Das Halten bricht ab, sobald sich der Finger mehr als 6 px bewegt (`pointermove`, `touchmove`) oder die Liste scrollt; der Zeitgeber löst auf einer entfernten Kachel nichts mehr aus; solange ein Finger auf einer Kachel liegt, wird nicht neu gezeichnet; Haltezeit 0,55 s.
- **`style.css`:** Kacheln ohne iOS-Textmenü beim Halten (`-webkit-touch-callout`, `user-select`), `touch-action: pan-y`.

## v197 – Lkw-Stellplatz: Zufahrt zum Waldweg

- **Zufahrt:** Neuer kurzer Weg (`FWORLD.paths`, `erbe.js`) vom Südende des Stellplatzes (dort fährt der Laster ein, die Radstopper liegen im Norden) in sanftem Bogen zum Waldweg. Er mündet als Abzweig mit Ausrundung auf dem Hauptweg (neuer Stützpunkt (−39,8 / −18,9) auf der Strecke von (−37 / −14) nach (−41 / −21), geometrisch unverändert).
- **Fahrweg:** `lkwRoute` (`farmview.js`) führt den Laster jetzt über diese Zufahrt statt quer über die Wiese.
- **Kein Lichtungsende:** `worldview.js`: das freie Wegende am Stellplatz bekommt keine Lichtung mit Bank (`inLkwBay`).

## v196 – Angelsteg: Fisch passt aufs Schild, Ruderboot entfernt

- **Schild:** Der Fisch war zu groß (Schwanz ragte über den linken Rand). Er ist jetzt auf 1,1 verkleinert und mittig, liegt auf beiden Seiten ganz auf dem Brett (`pierFish` in `woodmodels.js`).
- **Boot:** Das Ruderboot längsseits rechts am Steg samt Leine zum Poller ist aus `pier()` gelöscht, nicht nur ausgeblendet. Kein anderer Code erzeugt es dort neu. Das Boot am Bootshaus (Fischerei) und das Boot am Teichsteg sind unverändert.

## v195 – Teich im Osten: statisches Wasser, mehr Details

- **Statisch:** Das Teichwasser nutzt die ruhige Wasserart (`water: 1`), es bewegt sich nichts mehr. Das Pulsieren des Uferschaums, das Wippen der Enten und ihre Heckwellen sind entfernt. Die Enten schwimmen weiter ihre Runden, Schilf wiegt sich im Wind.
- **Wasserfarbe:** feinerer Tiefenverlauf (28 statt 5 Ringe, 96 Segmente), dunkle Tiefstellen, helle sandige Flachstellen und sechs weiche Himmelsreflexe, alles als Vertexfarbe aus einer gemeinsamen Funktion `pondCol`.
- **Details in `pondProps`:** fünf neue Seerosen mit Blüten, feine Wellenringe um alle Seerosen, Wasserlinsen in einer Bucht, fünf Steine im flachen Wasser mit hellem Rand, 38 Kiesel unter der Oberfläche, Treibholz am Ufer mit Ring.
- Geändert in `farmmodels.js`, `farmview.js`, `worldview.js`.

## v194 – Quelle und Bach gehen weich ineinander über

- **Form:** Quelltopf und Bachanfang werden mit einer weichen Vereinigung (Radius 3,2) verschmolzen, der Topf läuft trichterförmig in den Bach aus. Vorher stieß der Kreis mit hartem Knick auf den schmalen Bach.
- **Bachbreite:** Der Bach verjüngt sich am Anfang nicht mehr (`taper: [0, 0]`), er hat von Anfang an volle Breite und passt damit zum Topf.
- **Wasser:** Der Topf hat dasselbe Wellenmuster wie der Bach (`water: 2` statt 4) und überdeckt auch den Bachanfang im Trichter. Die Farben hängen vom Abstand zur gemeinsamen Wasserkante ab, daher gibt es keine Farbkante mehr an der Verbindung.
- **Ufer:** Die Sandstreifen folgen derselben weichen Kante (`springGeo.dU`) und laufen im Trichter rund um die Verbindung.

## v193 – Wasserfall fließt: Strömung im Shader, weiche Gischt, Wellenringe

- **Hinweis zur Technik:** Die Welt ist keine 2D-, DOM- oder SVG-Ebene, sondern läuft in der eigenen WebGL-Engine (`gl3d.js`, kein Three.js). Deshalb läuft alles dort, im Shader, und dreht und zoomt mit der Kamera mit. CSS- oder SVG-Überlagerungen würden das nicht.
- **Fließendes Wasser** (neue Wasserart `water: 6`):
  - Der Wasserfall ist eine durchgehende Fläche: Rinne oben im Fels, eine abgerundete Kante, dann der Wurfbogen bis in den Topf.
  - Die Vertexfarben tragen dort Koordinaten (entlang der Strömung, quer). Der Shader zeichnet daraus Wasserstränge, die laufend nach unten fließen und nach unten schneller werden.
  - Das Wasser ist halbtransparent mit weichen, weiß ausfransenden Rändern, oben dunkler und ruhig, unten heller bis schaumig weiß.
  - Die Farbe nimmt nur die Helligkeit der Sonne, nicht ihre Tönung, damit das Wasser auch morgens blau-weiß bleibt.
- **Austritt:** Unter der Kante liegt ein runder Stein, über den sich das Wasser gießt. Die Fläche blendet weich aus der Felsspalte ein, statt als Block herauszukommen.
- **Schaum und Wellenringe am Fuß:**
  - Eine Fläche statt der weißen Plättchen und Kreise.
  - Innen dichter, wandernder, pulsierender Schaum mit unregelmäßigem Rand.
  - Außen laufen ständig drei weiche Wellenringe nach außen und verblassen.
  - Nach vorn reicht die Fläche weit in den Topf, zum Fels hin ist sie kurz.
- **Gischt:**
  - Zwei neue Partikelformen: `shape 4` für ganz weichen Nebel, `shape 5` für Tropfen mit hellem Kern und weichem Saum.
  - Am Aufprall: Nebel, der wächst und verweht (9 je Sekunde), und feine Spritzer nach oben und außen (34 je Sekunde).
  - Am Fall: ein Nebelschleier am unteren Teil (5 je Sekunde) und vereinzelte Tropfen an den Rändern der Kante (7 je Sekunde).
  - Die Raten sind fest je Sekunde, unabhängig von der Bildrate, und laufen nur, wenn die Kamera in der Nähe ist.
- Die alte Rinne aus Blöcken, der leuchtende Schaum (`glow`) und die großen Gischt-Kreise sind weg.
- Dateien:
  - `gl3d.js`: `fallWater` im Shader, Uniform `uFlow` je Knoten (`n.flow`), Partikelformen 4 und 5
  - `woodmodels.js`: `springFall` neu, `springFoam` neu, Kantenstein in `springRocks`
  - `worldview.js`: Knoten und Gischt
  - `index.html`, `sw.js`

## v192 – Hütte am See: Ruine mit Bauzuständen, neues Nagel-Spiel, Weg und Baustellenboden

- **Ruine nachvollziehbar gebaut** (`rent.js`, `ruinMesh(stage)`):
  - **Grundaufbau:** Steinsockel mit feuchtem, bemoostem Rand auf der Schattenseite, Bodenbalken mit Dielen. Rechts vorn sind die Dielen weggefault, darunter sieht man den dunklen Unterboden.
  - **Wände:** Rundholz, an den Ecken verkämmt, in verwitterten Braun- und Grautönen, die unterste Lage dunkler und feucht.
  - **Öffnungen:** Türzarge mit schief offener Tür. Vorn ein Fenster mit Resten der Scheibe, hinten ein vernageltes Fenster mit alten Nägeln.
  - **Eingestürzte Ecke:** Die rechte vordere Ecke ist eingestürzt. Dort fehlen die oberen Lagen gestuft, die Stämme haben Bruchenden mit Splittern.
  - **Dachstuhl:** Firstbalken, Stiel und Sparren, darauf alte Dachbretter. Die linke Seite ist fast geschlossen, mit Lücken, Moos an der Traufe und Nagelreihen. Rechts vorn ist das Dach offen und die Sparren sind abgebrochen.
  - **Giebel und Veranda:** Giebelbretter mit Lücken. Die Veranda hat noch ihren Rahmen, ein paar Dielen und einen schiefen, abgebrochenen Pfosten.
  - **Spuren des Fischers:** Netz mit Korkschwimmern neben der Tür, Laterne am Haken, alte Angel, Kiste mit Seil, Holzeimer, Fass.
- **Bauzustand aus dem echten Spielstand** (`phase()`; das am Bauplatz abgelegte Material, nichts Neues gespeichert):
  - 0 **Verfallen:** Nichts abgelegt. Die Stämme der eingestürzten Ecke liegen darunter im Gras, Dachbretter daneben, Unkraut und ein junger Strauch in der Hütte.
  - 1 **Baustelle eingerichtet:** Ab dem ersten abgelegten Material. Der Schutt liegt sortiert auf einem Ausschusshaufen hinten rechts, das Unkraut ist weg, rechts vorn steht ein Arbeitsplatz mit Sägebock, Brett und Werkzeugkiste.
  - 2 **Gesichert, Dach in Arbeit:** Ab 3 vollständig abgelegten Materialien. Stützen an der eingestürzten Wand, neue Sparren und Latten, die Lücken im Dach mit neuen Brettern geschlossen, eine Leiter an der Traufe.
  - 3 **Fertig:** Nach dem Bauen die fertige Hütte wie bisher.
  - Beim Wechsel des Zustands steigt Staub auf, beim Laden nicht.
  - Im Fenster der Hütte zeigt eine Schrittleiste denselben Zustand, mit Hinweis auf den nächsten Schritt.
- **Boden der Baustelle** (`yardMesh`):
  - Festgetretene Erde um die Hütte, mit weichem Übergang ins Gras.
  - Vor den Stufen und am Arbeitsplatz fester und dunkler, ein feuchter Fleck unter dem Fass.
  - Kies und Steinchen, Grasbüschel nur am Rand, wo niemand läuft.
- **Weg:**
  - Der Trampelpfad von der Straße zum Eingang ist jetzt immer da: an der Ruine zugewachsen und blass, auf der Baustelle ausgetretener, an der fertigen Hütte deutlich.
  - Der Bogen an der Veranda liegt enger. Die Materialreihe am Bauplatz liegt etwas weiter vorn (z 6,4), so liegen keine Stapel mehr auf dem Pfad.
- **Nagel-Spiel neu** (`minigames.js`, gilt für alle Bauten, die nageln: Hütte, Dach, Fischerei):
  - **Ansicht:** eine Nahaufnahme. Ein Brett mit Maserung, Ästen, Hirnholz und Kante liegt über Ständern. Die Nagelstellen sind mit Bleistift markiert, der Nagel hat Kopf und Schaft, darüber holt der Hammer aus.
  - **Bedienung:** Unten läuft ein Zeiger über eine Taktleiste, Tippen schlägt zu. Ein Schlag folgt auf den anderen, Doppelschläge sind nicht möglich. Es gibt keinen Zeitdruck.
  - **Treffer:**
    - Perfekt: ein Schlag, goldener Kopf.
    - Gut: ein Stück tiefer, ein zweiter Schlag macht ihn fest.
    - Schief: Der Nagel verbiegt sich sichtbar.
    - Daneben: eine Delle im Brett, der Nagel bleibt stehen.
    - Nach spätestens 3 Schlägen ist jeder Nagel drin.
  - **Rückmeldung:** Holzstaub, das Brett gibt kurz nach, die Bewertung springt auf, die Fortschrittspunkte färben sich nach der Qualität.
  - **Schwierigkeit:** Von Nagel zu Nagel läuft der Zeiger schneller und das grüne Feld wird schmaler. Ab dem dritten Nagel wandert das Feld.
  - **Abschluss:** Bauqualität in Prozent mit 1–3 Sternen und Staub über dem Brett.
  - **Ergebnis:** wie bisher `{ ok, score }`, bestanden ab 0,4. Die Hütte speichert die Qualität als `S.farm.rent.q`, nur zur Anzeige.
- **Andere Bauplätze** (`bauplatz.js`): Sobald dort etwas abgelegt ist, steht neben der ersten Materialreihe ein Werkzeugplatz mit Kiste, Säge und Nagelschachtel, aber nur wo Platz ist. Am Hochsitz, am Unimog und am Kessel ist dafür kein Platz.
- Dateien: `rent.js`, `minigames.js`, `bauplatz.js`, `style.css`, `index.html`, `sw.js`

## v191 – Wasserfall als fließende Wasserfläche, Quelle größer

- **Wasserfall neu:**
  - Statt drei Quaderstufen gibt es jetzt eine durchgehende, gebogene Wasserfläche. Das Wasser schießt über die Felskante und fällt im Wurfbogen in den Topf.
  - Die Fläche besteht aus senkrechten Strängen in wechselnden Blautönen. An der Kante ist sie glatt und dunkler, nach unten wird sie heller bis weiß. Die Ränder sind weiß ausgefranst, und der Fall wird nach unten breiter.
  - Oben auf dem Fels läuft das Wasser in einer Rinne zur Kante.
  - Bewegung: Wasserstränge schießen laufend über die Kante und fallen im Bogen in den Topf. Unten steigt Gischt auf. Beides läuft nur, wenn die Kamera in der Nähe ist.
  - Am Fuß liegt ein weicher Schaumteppich, der ins Topfwasser ausläuft. Die einzelnen weißen Plättchen sind weg.
- **Quelle größer, auch aus der Hofansicht von oben:**
  - Der Topf hat jetzt einen Radius von 4,5 (v190: 3).
  - Felswand und Wasserfall sind 1,5-mal so groß, die Wand ist bis etwa 4,5 hoch.
  - Mehr Platz um die Quelle: Kulisse 10 statt 7,5, Bäume 11 statt 8, Wegnetz 7,5 statt 5,5.
- Dateien:
  - `woodmodels.js`: `SPR.RP` 4,5; `SPRING_FALL` mit Maßstab `S`; `springFall` neu; `springRocks` lokal unverändert
  - `worldview.js`: Felsen und Fall mit `s: 1.5` (Mesh-Schlüssel `wspring191`/`wspringfall191`), `WV.springFx` mit Kante, Wasserstränge in `worldStep`, `stamp` um die Quelle
  - `erbe.js`, `team.js`: Abstände zur Quelle
  - `index.html`, `sw.js`

## v190 – Bach breiter, große Quelle, saubere Übergänge

- **Grafikfehler behoben:**
  - Das Flimmern im Wasser kam daher, dass Quelltopf und Bachanfang auf genau derselben Höhe übereinander lagen. Jetzt liegt der Topf höher als das Bachwasser.
  - Die kantigen Ränder kamen daher, dass das runde Ufer der Quelle auf gleicher Höhe über den geraden Uferstreifen des Bachs lag. Jetzt gibt es dort ein gemeinsames Ufer aus einem Guss:
    - Die Farbe hängt nur vom Abstand zur Wasserkante von Topf und Bach ab.
    - Die Farben sind dieselben wie am Bachufer.
    - Der Rand wird sauber beschnitten.
- **Bach breiter:**
  - Der Wald-Bach ist überall 1,5-mal so breit.
  - Er wird erst auf den letzten 6 Einheiten vor der Quelle schmaler und bleibt dort kräftig (vorher auf 9 Einheiten bis auf fast nichts).
- **Quelle deutlich größer:**
  - Der Quelltopf hat jetzt einen Radius von 3 (vorher etwa 1), mit leicht unregelmäßigem Rand und zur Mitte hin dunklerem Wasser.
  - Dahinter steht eine Felswand mit Moos, bis etwa 3 hoch, mit Blöcken am Topfrand.
  - Ein Wasserfall fällt in drei Stufen in den Topf. Er leuchtet leicht, damit er vor dem Felsen hell bleibt.
  - Am Fuß des Wasserfalls steigt Gischt auf, aber nur, wenn die Kamera in der Nähe ist.
- **Platz gemacht:**
  - Bäume, Büsche, Bauplätze und Wege halten mehr Abstand zum breiteren Bach und zur Quelle.
  - Der Bachsteg steht 0,45 weiter am Ufer, damit sein Anfang wieder an Land liegt.
  - Die Brücke überspannt den Bach weiter.
- Dateien:
  - `woodmodels.js`: Breite `w` in `creekStations`; neu `springBank`, `springPool2`, `springInfo`, `springFall`, `SPRING_FALL`, `SPR`; `springRocks` neu; Bachsteine am Topf entfallen; `springBed`/`springPool` sind jetzt leer
  - `worldview.js`: Bach- und Quell-Aufbau, Gischt in `worldStep`, Abstände in `stamp`, Steg-Lage
  - `erbe.js`, `farm.js`, `team.js`: Abstände zum Bach und zur Quelle
  - `index.html`, `sw.js`

## v189 – Bachsteg im Wald: aufgeräumt und zum Angeln

- **Steg neu gebaut** (`FWM.pier`, gleiche Lage und Größe, Wege passen weiter):
  - Bohlen quer mit Fugen, Stirnbretter, Längsträger und Querriegel; die Pfähle haben einen nassen Ring an der Wasserlinie, vorn sind sie über Kreuz verstrebt.
  - Die vorderen Eckpfähle ragen als Poller heraus.
- **Jedes Teil hat seinen Platz:**
  - Schild links am Stegbeginn: zwei Pfosten, Rahmen und kleines Dach, schräg zum Weg gedreht. Statt Quadern zeigt es einen richtigen Fisch mit Auge, Schwanz- und Rückenflosse über Wellenlinien, auf beiden Seiten.
  - Hängende Laterne rechts, Rettungsring senkrecht an einem Pfosten.
  - Angelkiste und Eimer nebeneinander an der hinteren Kante, eine Bank an der rechten Kante.
  - Zwei Rutenhalter vorn mit parallelen Ruten (etwa 30°), Schnur und Pose.
  - Das Ruderboot liegt längsseits am Kopf und ist am Poller festgemacht.
- **Angeln am Bachsteg:** neuer Fangplatz „Bachsteg im Wald“ (`FGROUNDS`, `pier: true`) mit Bachfischen: Ukelei, Rotauge, Barsch, Forelle, seltener Aal und Hecht.
  - Steg antippen öffnet das Angel-Spiel wie am Seesteg: gleiche Köder, Ruten, Würfe und Fangbuch.
  - Beim Angeln sitzt der Angler vorn am Stegkopf, die Pose landet im Bach, beim Biss wippt die Rute.
  - Voraussetzung wie am See: Der Seesteg ist gebaut (dort gibt es die Angel) und der Wald ist offen. Sonst erscheint ein Hinweis.
  - Der Platz steht auch in der Fangplatz-Liste im Steg-Fenster am See, aber nicht in der Bootsliste.
- Dateien:
  - `woodmodels.js`: `pier`, `PIER_DIM`, `pierFish`
  - `fishdata.js`: Fangplatz
  - `erbe.js`: `farmGroundOk`
  - `fishview.js`: Angeln am Bachsteg, Kamera, Wurfstelle, Rute
  - `worldview.js`: Angler und Rute am Steg, Antippen, Wurfstelle
  - `index.html`, `sw.js`

## v188 – Material je Stück ablegen, sichtbar am Bauplatz

- **Ablegen je Material, sobald es vollständig ist:** Liegt von einem Material die ganze nötige Menge im Lager, kann man es ablegen – auch wenn anderes noch fehlt. Teilmengen werden nicht mehr abgelegt (aus älteren Spielständen schon abgelegte Teilmengen zählen weiter mit).
  - Hütte und Hochsitz: jede Material-Karte hat dann einen eigenen Knopf **📦 Ablegen** (Karte gelb = bereit, grün = liegt am Bauplatz).
  - Überall (auch Fischerei, Sägewerk, Hof-Ausbau): der große Knopf legt alle vollständigen Materialien auf einmal ab („📦 Bretter ablegen“ / „📦 3 Materialien ablegen“, sonst „Ablegen, sobald ein Material vollständig ist“); Chips mit **📦↓** sind bereit.
- **Sichtbar und animiert:** Das Fenster schließt, die Kamera fährt zum Bauplatz, die Gebinde fallen nacheinander auf ihren Stapel (Staub beim Aufsetzen), danach öffnet sich das Fenster wieder. Jedes Material hat einen festen, nach der Bauliste reservierten Platz auf Kanthölzern – die Reihe bleibt ordentlich, egal in welcher Reihenfolge man ablegt. Stämme liegen als Pyramide, alles andere in gleich hohen Stapeln.
  - **Hütte am See:** eine Reihe vor der Ruine.
  - **Hochsitz:** auf dem abgesteckten Platz (das Deko-Holz dort ist weg – was jetzt dort liegt, ist echt).
  - **Fischerei:** landseitig im jeweiligen Bauplatz.
  - **Sägewerk:** Reparaturen und Blockbandsäge vor der Halle, großer Kessel neben der Kesseltür, Unimog neben dem Stellplatz.
  - Hof-Ausbau: kein fester Platz – dort wird nur abgelegt, nicht gezeichnet.
- **Beim Bauen** werden die Stapel sichtbar verbraucht (sie sinken mit Staub weg), während das Gebäude entsteht. Stapel antippen öffnet das Fenster des Bauplatzes.
- **Unverändert:** Abgelegtes ist aus dem Lager raus – Arbeiter, Verkäufe und Rezepte kommen nicht dran; beim Bauen wird zuerst das Abgelegte verbraucht.
- Dateien: **neu `bauplatz.js`** (Modul `SITE3D`), `farm.js` (`siteReady`, `sitePutOne`, `sitePutAll` nur vollständige), `farmview.js` (`siteNeedHTML`, `siteRowHTML`, `siteDepHTML`, `siteDepBind`), `rent.js` und `hunt.js` (Karten über `siteRowHTML`; Hochsitz-Bauplatz ohne Deko-Holz), `worldview.js` (anhängen, abgleichen, Schritt, Antippen, `worldBusy`), `style.css`, `index.html`, `sw.js`.

## v187 – Ablegen-Knopf so groß wie „Bauen“

- Der Erklärtext neben **📦 Material ablegen** ist weg; der Knopf ist jetzt so groß wie der Bauen-Knopf (volle Breite, gleiche Schrift).
- Bei Hütte und Hochsitz ist der Bauen-Knopf dafür ebenfalls auf volle Breite gesetzt, damit beide gleich groß sind.
- Dateien: `farmview.js` (`siteDepHTML`), `style.css` (`.fdep-btn`, `.hu-needs ~ .fs-row .btn`).

## v186 – Baumaterial am Bauplatz ablegen

- **Problem:** Beim Bauen konnte es fehlschlagen, weil Arbeiter (Verkauf, Rezepte) im selben Moment das gesammelte Material aus dem Lager verbraucht oder verkauft haben.
- **Lösung:** Jeder Bauplatz hat jetzt ein eigenes kleines Lager. Im Bau-Fenster gibt es den Knopf **📦 Material ablegen**: Er legt alles, was im Lager liegt, an den Bauplatz – je Material höchstens so viel, wie dort noch gebraucht wird (2 Türen gebraucht und 2 im Lager → beide liegen danach am Bauplatz). Abgelegtes ist **nicht mehr im Lager**, Arbeiter, Verkäufe und Rezepte kommen nicht mehr dran.
- Beim Bauen wird zuerst das Abgelegte verbraucht, der Rest aus dem Lager; danach ist der Bauplatz leer.
- Anzeige: Die Material-Chips zählen Abgelegtes + Lager, 📦 zeigt, was schon am Bauplatz liegt (grün = komplett abgelegt). Bei Hütte und Hochsitz steht es unter jedem Material („📦 abgelegt“, „📦 10 abgelegt · 4 im Lager“).
- **Gilt für:** Hütte am See, Hochsitz, alle Fischerei-Bauplätze, Sägewerk-Reparaturen und Unimog, Säge-Ausbau (Halle Stufe 2, Kessel), Hof-Ausbau (nur Stufen mit Material).
- Nicht dabei: Kauf von Sägewerksmaschinen im Laden und das Motorboot (keine Bauplätze).
- Dateien: `farm.js` (`siteN`, `siteHave`, `siteMissing`, `sitePutAll`, `siteTake` – Spielstand `S.farm.depot`), `farmview.js` (`siteNeedHTML`, `siteDepHTML`, `siteDepBind`), `erbe.js` (Reparatur, Ausbau, Fischerei, Hof-Ausbau nutzen den Bauplatz), `worldview.js` (Fenster), `hunt.js`, `rent.js`, `style.css`.

## v185 – Sägewerk: neue Maschinen und sichtbarer Produktionsablauf

- **Neue Datei `sawwerk.js`** (Modul `SWK`): alle Maschinen des Sägewerks neu modelliert, in einem gemeinsamen Stil – Graphitrahmen, satinierter Stahl, Gummi, Betonfundament mit gelber Linie um den Arbeitsbereich, je Maschine eine gedämpfte Akzentfarbe (das Lila der Schleifmaschine war ein Platzhalter und ist jetzt Stahlblau).
- **Materialfluss überall gleich:** links Zufuhr, Mitte Bearbeitung, rechts Ausgabe, vorn der Bediener.
- **Maschinen:**
  - **Holzspalter:** mobiler Senkrechtspalter – Säule, Hydraulikzylinder, Keil, Motor mit Öltank, Zweihandhebel, Räder und Deichsel, Gitterbox für die Scheite.
  - **Hobelmaschine:** Dickenhobel mit Rollentischen, Haube über der Hobelwelle, Handrad, Vorschubwalzen, Absaugung mit Filtersack. Paletten für Roh- und Hobelware.
  - **Schleifmaschine:** Breitbandschleifer – Förderband durch ein Portal, im Fenster die Walzen des Schleifbands, Staubabsaugung mit zwei Säcken, Rollwagen für die fertigen Teile.
  - **Fräse:** CNC-Portalfräse – Nutentisch, Portal auf Linearführungen, Spindel, Energiekette, Schaltschrank mit Bildschirm, Gestell für Türen und Zaunfelder.
  - **Verpackungsmaschine:** Palettennagler – Spanntisch, Portal mit Druckluftnagler, Kompressor, Palettenstapel.
  - **Trockenkammer:** Kammer aus Sandwichpaneelen, Flügeltor, Gleis mit Trockenwagen und Stapel mit Stapellatten, Lüfter und Dampfabzug auf dem Dach, Schaltkasten mit Temperaturanzeige.
  - **Sägebock:** Holzböcke in X-Form, Hackklotz mit Kettensäge, Kanister.
  - **Sägehalle:** Die Säge steht jetzt vorn in der offenen Halle, wo man hineinsieht. Zuführwagen auf dem Gleis, Vorschubwalzen, Rollentisch, Querförderband zum Stapelplatz. Stufe 1 ist eine **Gattersäge** mit Schwungrad, Kurbel und Pleuel, die den Sägerahmen genau mitbewegen. **Stufe 2** (Ausbau „Blockbandsäge“) zeigt jetzt wirklich eine Blockbandsäge. Mit Strom gibt es ein warmes Hallenlicht.
- **Ablauf am echten Spielstand:** Der laufende Auftrag gibt den Fortschritt vor, das Werkstück fährt sichtbar durch die Maschine.
  - Hobel, Schleifer und Säge wechseln an der Schnittkante vom Rohzustand zum bearbeiteten Stück: sägerau → gehobelt, Stamm → Bretter zwischen den Schwarten.
  - Der Spalter spaltet die Rolle in drei Hüben und wirft die Scheite in die Gitterbox.
  - Der Nagler legt die Deckbretter auf und nagelt sie.
  - Die Fräse fährt ihr Muster ab und gibt die fertige Tür oder das Zaunfeld frei.
  - Der Trockenwagen fährt in die Kammer, das Tor schließt, nach dem Trocknen kommt hell gestempeltes Bauholz heraus.
- **Was wo liegt:** An der Zufuhr liegt das Material wartender Aufträge. An der Ausgabe liegt genau die abholbereite Ware; bei Maschinen mit mehreren Stücken je Auftrag kommen die schon fertigen Stücke des laufenden Auftrags dazu.
- **Nichts an Spielwerten, Zeiten, Rezepten oder Inventar geändert.**
- **Signalleuchte an jeder Maschine:** grün = läuft, gelb blinkend = abholbereit, rot blinkend = Störung, aus = Leerlauf. Bei einer Störung bleibt alles stehen, wo es ist. Nachts sind laufende Maschinen angestrahlt.
- **Leistung:**
  - je Maschine etwa 1.500–2.800 Dreiecke (vorher ~150) und 10–18 Knoten;
  - alle Meshes werden einmal gebaut und zwischengespeichert;
  - Maschinen weit außerhalb der Kamera werden nur einmal pro Sekunde nachgeführt;
  - Partikel nur im Betrieb und sparsam.
- Dateien: **neu `sawwerk.js`**.
  - `woodmodels.js`: `machine`/`saegebock` → SWK, `sawHall(m, pv, lvl)` ohne die alte Gattersäge, `WT`/`BARK` exportiert.
  - `worldview.js`: Mesh-Schlüssel, `SWK.attach` in `worldObjParts`, `SWK.step` in `worldStep` statt der alten Blätter-/Späne-Animation, Tag-Höhen.
  - `farmview.js`: Vorschau beim Verschieben mit Teilen.
  - dazu `index.html` und `sw.js`.

## v184 – Gebietsknöpfe links am Hof entfernt

- Die fünf runden Schnellsprung-Knöpfe am linken Rand des Hofs (Hof, Wald, Sägewerk, Alter Wald, See) sind weg – Aufbau, Styles und Neuzeichnen. Ein eventuell noch vorhandenes Element wird beim Start entfernt.
- Die Gebiete erreicht man weiter über Kamera/Welt, Nachrichten (z. B. „Zum Montagewagen“) und die Freischalt-Fenster. `worldGo` und `AREA_SPOTS` bleiben, weil andere Stellen sie nutzen.
- Dateien: `worldview.js` (`worldDOM`, `worldUI`), `style.css` (`#farmAreas`, `.farea`; `.farea-req` bleibt), `index.html`, `sw.js`.

## v183 – Letzten Reiter beim Start wieder öffnen

- Das Spiel merkt sich den zuletzt offenen Reiter (Hof, Karte, Aufträge, Live, Fuhrpark, Standorte, Markt, Welt & Kontor) im Spielstand (`S.lastTab`) und öffnet ihn nach dem Schließen/Neuladen wieder – in jedem Browser, auch Safari.
- Ausnahmen (dort bleibt es beim bisherigen Start): vor der Speditionsgründung (nur Hof möglich), mitten im Tutorial, und bei Spielständen ohne gemerkten Reiter.
- Gespeichert wird wie bisher beim Verlassen der Seite und alle 6 Sekunden – es ist kein zusätzliches Speichern nötig.
- Dateien: `game.js` (`showTab` merkt sich den Reiter, `boot` wählt den Start-Reiter), `index.html`, `sw.js`.

## v182 – Hütte am See: aufbauen und vermieten

- **Wo:** Auf der Freifläche westlich vom Glindower See (zwischen Straße und See, ca. x −39 / z 31) steht eine **verfallene Blockhütte**, sobald das See-Gebiet offen ist. Ab **Level 18** meldet sich Nachbar Erwin Krüger per Handy.
- **Aufbauen:** Antippen → Bau-Fenster. Kosten: **9.000 €** + 6 Paar Kanthölzer, 6 Paar Balken, 8 Bund Bretter, 4 Bund Hobeldielen, 4 Stapel Holzplatten, 2 Holztüren (alles aus dem Sägewerk). Danach das Nagel-Minispiel wie bei der Fischerei; die Hütte wächst aus dem Boden (+150 XP).
- **Die Hütte:** zweistöckig und rustikal – Erdgeschoss aus Rundholz, Obergeschoss aus Brettern mit Deckleisten, steiles Schindeldach, Steinkamin, grüne Fensterläden, offene Veranda mit Geländer, Bank, Tischchen, Blumenkübeln und Laterne, Brennholzstapel und Regentonne.
- **Mieter:** zieht am Tag nach dem Bau um 10 Uhr ein (Nachricht aufs Handy). **Miete 120 € am Tag**, jede Woche überwiesen (Toast + Kassenbuch).
- **Probleme:** In jedem 90-Tage-Zyklus meldet der Mieter **1–2 Probleme**, nie gleichzeitig (Heizung, Wasserhahn, Fenster, Dach, Sicherung, Abfluss, Haustür, Mäuse). Reparatur kostet 30–280 €. Bleibt ein Problem länger als 2 Tage liegen, zahlt er nur die halbe Miete.
- **Instandhaltung:** alle **90 Tage** (900 €, ab 10 Tage vorher möglich). Ist sie länger als 7 Tage überfällig, hält der Mieter die Miete zurück.
- **Leben an der Hütte:** abends Licht im Erdgeschoss (ab 18 Uhr), vor dem Schlafengehen oben, nachts alles aus; Rauch aus dem Kamin morgens und abends (nicht bei kaputter Heizung). Der Mieter sitzt auf der Veranda oder steht vor der Hütte und schaut zum See; bei Regen bleibt er auf der Veranda. An Werktagen geht er morgens (ca. 6:50–8:30) über den **Trampelpfad** zum Auto und fährt nach Osten weg, nachmittags (ca. 15:30–17:30) kommt er von Westen zurück und parkt auf dem **Erdfleck** an der Straße. Pfad und Parkfleck sind anfangs blass und werden mit der Zeit deutlicher.
- Markierung über der Hütte nur, wenn etwas zu tun ist (🔨 Bauplatz, ❗ Problem, 🔧 Instandhaltung). Antippen der Hütte öffnet immer das Fenster.
- **Fix nebenbei:** `team.js` `navHit` – die Zaunliste konnte beim allerersten Aufruf (Schmetterlinge) noch fehlen → „walls is not iterable“ und die Animation blieb stehen.
- Dateien: **neu `rent.js`**; Anbindung in `worldview.js` (Bäume/Büsche freihalten, Szene, Antippen, Markierung, Animation), `erbe.js` (Takt), `index.html`, `sw.js`, `style.css` (`.rent-iss`), `team.js` (Fix).

## v181 – Nachbar Erwin Krüger vorzeitig wegschicken

- Im Gesprächsfenster von Erwin Krüger gibt es unter „Übergeben“ jetzt den Knopf **👋 Wegschicken**. Der Besuch endet sofort (wie wenn die Zeit abgelaufen wäre); danach die übliche Pause bis zum nächsten Ereignis (2,5–5 Spielstunden). Keine Belohnung, keine Strafe.
- Dateien: `erbe.js` (`farmNeighborSend`), `worldview.js` (`openNeighbor`: Knopf `#fnNo`).

## v180 – Seestrand überall gleich breit

- **Problem:** Vor den Fischerei-Gebäuden und an den Uferwegen war der Strand absichtlich schmaler (0,7 bzw. 1,2 statt 2,2) – das sah ungleichmäßig und ungewollt aus.
- **Lösung:** Der Strand ist jetzt rundum gleich breit (2,2). Damit er vor Gebäuden und Wegen Platz hat, weicht dort stattdessen die Uferlinie etwas weiter zurück: Wege jetzt 3,5 Einheiten Abstand zur Wasserlinie (vorher 3,0, die Einbuchtung ist auch etwas breiter für einen weicheren Verlauf); Gebäude unverändert 3,2.
- Nur Optik. Datei: `worldview.js` (`lkObs` ohne `w`, `lkW` konstant 2,2, Mesh-Keys `lake*180`).

## v179 – Mündung: durchgehend runder Bogen statt Gerade + Knick

- **Problem (Screenshot):** Die Wasserlinie lief vom Seeufer erst ein Stück gerade und knickte dann eng in den Bach ab. Grund: Die Rundung nahm das Seeufer als gerade Linie an (es ist aber gebogen), und die Ecke war zu eng.
- **Lösung:** Die Rundung beginnt jetzt auf dem echten, gebogenen Seeufer etwa 7 Einheiten neben dem Bach (in Richtung des Seeufers dort) und läuft als große, kreisähnliche Kurve (kubische Bézierkurve) bis 7 Einheiten in den Bach hinein. Das Wasser dazwischen folgt dem echten Seeufer. Schaumsaum und Ufersteine des Sees sind an der breiteren Mündung ausgespart.
- Nur Optik. Dateien: `woodmodels.js` (creekMouthSt, lakeFoam/lakeShore-Aussparung 0,26 rad), `worldview.js` (`mouth.R = 7`).

## v178 – Mündung: keine gerade Kante mehr, natürlichere Rundung

- **Gerade Linie entfernt:** Rechts an der Mündung ist der Seestrand wegen des Wegs schmal, der Bachstrand war aber breit – dort endete der Sand mit einer geraden Kante. Jetzt hat der Bachstrand am Seeufer genau die Breite und die Farben des Seestrands an dieser Stelle und wird erst entlang der Rundung allmählich breiter (über ca. 10 Einheiten).
- **Natürlichere Rundung:** Statt eines Kreisbogens (Radius 3,5) läuft das Ufer in einer weichen Kurve (quadratische Bézierkurve, Schenkellänge 5) ins Seeufer – sie berührt beide Uferlinien tangential, ohne Krümmungssprung.
- Nur Optik. Datei: `woodmodels.js` (creekMouthSt/creekStations/creekBank), `worldview.js` (`mouth: { R: 5, shoreD, shoreW }`).

## v177 – Bachmündung: Uferlinien und Fließrichtung gehen sauber in den See über

- **Uferlinien:** An der Mündung des Seebachs wird die Ecke zwischen Bachufer und Seeufer auf beiden Seiten durch einen Kreisbogen ausgerundet (Radius 3,5, bei spitzen Ecken kleiner), der beide Uferlinien tangential berührt. Die Uferstreifen (Sand, nasser Sand, Schlamm) folgen dem Bogen und liegen am Ende genau parallel zum Seeufer. Das funktioniert auch auf der Seite, wo der Bach schräg auf das Ufer trifft.
- **Fließrichtung:** Der Seebach fließt jetzt sichtbar Richtung See (wie der nördliche Fluss), und die Bewegung geht im Umkreis von etwa 5 bis 14 Einheiten um die Mündung stufenlos in die Seebewegung über. Es gibt keine Kante mehr zwischen den beiden Wassermustern.
- Bachufer allgemein jetzt mit genau den Streifenbreiten des Seeufers (Sand 2,2 breit).
- Nur Optik.
- Dateien: `woodmodels.js` (creekFrame/creekMouthSt/creekStations, creekBank/creekWater), `worldview.js` (Mündungspunkt, `lkShoreD`, `water: 5`), `gl3d.js` (Wasser-Shader: Wellenfunktionen `wavG`/`wavC`, Modus 5, Uniform `uMouth`).

## v176 – Bachmündung, einheitliches Wasser und Ufer

- **Bachmündung am See (rechts unten):** Der Seebach beginnt jetzt 4 Einheiten im See (unter dem Seewasser), sein Wasser wird zur Mündung hin so hell wie der Seerand, und sein Ufer läuft nahtlos in den Seestrand über. An der Mündung kein Schaumsaum, kein Schilf, keine Steine mehr im Wasser.
- **Einheitliches Wasser:** Alle Gewässer (Seebach, nördlicher Fluss, Quelltopf, Teich, Fischnetz-Becken) nutzen das ruhige Wellenmuster des großen Sees. Der nördliche Fluss fließt weiterhin von Ost nach West. Bach- und Quellwasser haben die Seefarben (türkis in der Mitte, hell am Rand) statt einem flachen Blau.
- **Einheitliche Ufer:** Fluss- und Quellufer sind wie am See aufgebaut: Wiese → trockener Sand → nasser Sand → Schlamm unter dem Wasserrand, Steine am Ufer. Vorher war es ein graues Kiesband.
- Fix nebenbei: Ufersteine am Bach wurden nur in x-Richtung versetzt und lagen deshalb bei west-östlich laufenden Bächen teils im Wasser – jetzt quer zur Bachrichtung.
- Nur Optik, keine Spiellogik geändert (`LAKE_CREEK`, Angeln, `inLake` unverändert).
- Dateien: `woodmodels.js` (creekProfile/creekBank/creekWater/springBed/springPool, lakeFoam/lakeShore mit `skip`), `worldview.js`, `gl3d.js` (Wassermuster), `farmview.js` (Wassermodus).

## v175 – Uferweg nicht mehr direkt am Wasser

- **Problem:** Seit dem neuen Ufer (v173) lief der Weg am Ostufer (und kurz vor der Bachbrücke) direkt an der Wasserlinie entlang.
- **Lösung:** Gleiches Prinzip wie bei den Gebäuden in v174: Die Uferlinie weicht dort, wo ein Weg (Ostweg, Südweg, Abzweig zum Steg) näher als 3 Einheiten am Wasser liegt, weich zurück, und der Sandstreifen bleibt dort schmal. Jetzt liegt überall ein Grasstreifen zwischen Weg und Strand.
- Die Gebäude-Abstände rechnen jetzt mit derselben (genaueren) Formel, inkl. der welligen Uferform.
- Nur Optik: Angeln, Boote, Wege, `inLake`/`lakeE` sind unverändert.
- Dateien: `worldview.js` (Hindernisliste `lkObs` beim Seebau, Mesh-Keys `lake*175`).

## v174 – Räucherei und Fischerhütte stehen nicht mehr am Uferübergang

- **Problem:** Räucherei (ca. 1 Einheit) und Fischerhütte (ca. 1,7) standen so nah am Wasser, dass sie genau auf dem Übergang See → Land saßen. Verschieben geht nicht (direkt dahinter liegt der Uferweg).
- **`woodmodels.js`:** neue Ufer-Einbuchtungen `LAKE_DENTS` / `setLakeDents(list)` – `lakeR` zieht die Uferlinie dort weich zurück (Wasser, Strand, Saum, Schilf).
- **`worldview.js`:** für jedes Fischerei-Gebäude an Land (nicht Steg/Bootshaus), das näher als 3,2 Einheiten am Wasser steht, wird eine Einbuchtung gesetzt, bis der Abstand reicht. Nur Optik – Angeln, Boote und `inLake`/`lakeE` bleiben unverändert. Mesh-Schlüssel `*174`.

## v173 – Seeufer: einheitlicher Übergang Land → Wasser

- **Gelände (`worldview.js`, `worldGroundCol`):** kein eigener Sandring um den See mehr – im 4er-Raster war er breit, eckig und hatte eine harte Kante zur Wiese. Unter dem Wasser bleibt der dunkle Seegrund (ab `lakeE < 0.92`).
- **Strand (`woodmodels.js`, `lakeShore(rx, rz, colAt, wAt)`):** Außenkante nimmt genau die Geländefarbe an dieser Stelle (`wGroundAt`) – kein sichtbarer Rand zwischen Wiese und Strand. Breite je Uferstelle: Standard 2,2, vor den Fischerei-Gebäuden (Südufer) nur 0,7, damit sie auf Gras statt auf dem Strand stehen. Steine liegen im Sandstreifen.
- Mesh-Schlüssel `lakeShore173`.

## v172 – Großer See wie der Teich gestaltet

- **Ufer (`woodmodels.js`, `lakeShore`):** Bänder wie am Teich – Wiese → trockener Sand → nasser Sand → Uferschlamm unter dem Wasserrand, dazu Steine am Ufer (vorher eine breite, einfarbige Sandfläche).
- **Wasser (`lakeWater`):** Verlauf wie am Teich – dunkelblau in der Mitte, türkis und hell zum Ufer (gleiche sechs Farbstufen). Flache, hellere Stellen unter Schilf, Steinkante und Insel (`sh`, Liste in `worldview.js`), damit Schilf und Steine nicht mitten im tiefen Wasser stehen.
- **Saum und Schilf:** heller, halb durchsichtiger Saum am Wasserrand (`lakeFoam`) und Schilf mit Rohrkolben in Gruppen rund ums Ufer (`lakeReeds`, nicht vor Steg und Bootshaus).
- **Wellenbild (`gl3d.js`):** neuer Wasser-Modus 4 „großer See“ – bewegt sich wie Modus 3, aber mit größerem, ruhigerem Muster (auf der großen Fläche wirkte Modus 3 fleckig). Seebach bleibt Modus 3.
- Neue Mesh-Schlüssel `lakeShore145`, `lakeWater145`, `lakeFoam145`, `lakeReeds145` (`worldview.js`).

## v171 – Speditions-Level und Hof-Level sauber getrennt

Gemeldet: Beim Aufstieg im Logistik-Bereich (Karte, Aufträge …) kam die Hof-Feier mit Hof-/Sägewerk-/Fischerei-Freischaltungen (z. B. „Level 12 – Hobelmaschine, Trockenkammer, Blockbandsäge“). Ursache: `checkLevel` (`game.js`) rief nach der Gründung mit dem Speditions-Level die Hof-Feier `farmLevelUp` (Liste `FUNLOCK`) auf, dazu Kleeblätter-Text und Hof-Ereignis „level“.

Jetzt:
- **Vor der Gründung** (Erbe-Phase) bleibt alles wie gehabt: Hof-Feier mit Hof-Freischaltungen.
- **Nach der Gründung** feiert der Hof nur noch sein eigenes Erbe-Level (`farmCheckLevel`, unverändert). Das Speditions-Level hat eine **eigene Feier** (`logiLevelShow`, `#logiLvl`): „🚚 Firmenname · Level N · Spedition – geschafft!“ mit Speditions-Inhalten (`logiUnlocks`): Sonderfahrt-Einladungen und Missionen (3), Rahmenverträge (4), Übernahmen (5), nächste Etappe freischaltbar (mit Preis), Sichtweite auf der Karte.
- Steigst du auf, während du im Hof-Reiter bist, kommt dort nur ein kurzer Hinweis („🚚 Spedition: Level N erreicht! Neu: …“); die Feier erscheint, sobald du zu Karte/Aufträgen/… wechselst oder ein Fenster schließt. Mehrere Aufstiege werden zusammengefasst.
- Kein Hof-Ereignis „level“ und keine Hof-Kleeblätter mehr durch Speditions-Aufstiege.

## v170 – Konzern-Wellen nach 14 Tagen Marktführung, epische Übernahme-Show

**Marktführung zählt** (`corp.js` `corpDay`, täglich über `shareDay` in `vip.js`): Liegst du vor jeder aktiven Konkurrentin (oder gibt es keine mehr), läuft die Uhr. Anzeige im Konkurrenz-Kasten: „👑 Marktführer seit X Tagen – noch Y Tage, dann werden größere Konzerne aufmerksam“ mit Balken; liegt jemand vorn: „⚔️ X führt den Markt an“.

**Nach 14 Tagen an der Spitze kommt eine Welle** (`corpWave`): zwei Konzerne aus einem Pool von acht (Kraftmann Logistik AG, Ostwind Express, Falkner & Partner Holding, Vulkan Schwerlast, Orbis Transcontinental, Zenit Logistics Group, Eisberg Frischelogistik, Titan Freight Holding; danach „International“, „Global“ …). Höchstens drei Konzerne gleichzeitig offen.
- **Teurer:** Firmenwert = größter Firmenwert der Etappe × (1,5 + 1,5 × Welle) – in Etappe 2, Welle 1 rund 285.000–300.000 € (Blitzfracht ~76.000 €).
- **Besser aufgestellt:** Flotte 6 + 2 × Welle (+ Etappe/2), Firmensitz ab Umschlaghalle in einer großen freigeschalteten Stadt, starten mit **mehr Marktanteil als du** – du verlierst die Spitze und musst sie dir zurückholen, bevor du kaufen kannst.
- **Aggressiver:** schnappen öfter (bis +36 %) und schneller (Zugriff bis ~40 % früher) Aufträge weg; Konzern-Ton in der Verhandlung.
- Ankunft: Kampfansage aufs Diensthandy und eine Zeitungs-Titelseite „KONZERNE GREIFEN AN“ (Stempel KAMPFANSAGE, Eckdaten, Zitat des Chefs) – erscheint, sobald du nicht im Hof-Reiter bist und kein Fenster offen ist.

**Übernahme-Show** (`corpShow`, `style.css` `#corpShow`): Nach dem Handschlag schließt die Verhandlung, eine Zeitung wirbelt herein („WEITWIND SCHLUCKT BLITZFRACHT“ / „MACHTWECHSEL …“ / „SENSATION …“), der Stempel **ÜBERNOMMEN** knallt aufs Logo der Gegnerin (Bildschirm wackelt, Blitz, Vibration), ihr Logo wird grau und reißt. Beute zählt mit Münzklang hoch (Fahrzeuge, Marktanteil, Büro, Leute, Stammkunden, Ruf), Goldregen, Krone „Dein Imperium: N Firmen geschluckt · investiert · Fahrzeuge“, Machtsatz („Der Markt gehört dir.“ – ohne Gegner: „Du BIST der Markt.“), Knopf „👑 Weiter herrschen“. Bei „reduzierter Bewegung“ ohne Wirbel.

**Mehr Beute:** jede Übernahme bringt Stammkunden (2, bei Konzernen 2 + Welle) als gut bezahlte Aufträge (+25 % / +40 %) sofort ins Auftragsbuch. Konzerne liefern die besseren, kaum gefahrenen Fahrzeuge, ein größeres Büro mit 3–4 erfahrenen Leuten und +5 Ruf.

**Welt-Reiter:** „👑 Dein Imperium“-Leiste, offene Gegner oben (Konzerne mit „NEU · Konzern“), geschluckte Firmen als Trophäen (grau, rotes ✕, „👑 geschluckt“).

Spielstand: `S.corp.rivals` (Konzerne), `S.corp.wave`, `S.corp.leadSince`, `S.corp.showQ`; `corpSyncRivals` trägt sie nach dem Laden in `RIVALS`/`CORP` ein.

## v169 – Lkw-Stellplatz fest vor dem Sägewerk, direkt am Weg

Der Holzlaster fuhr beim Start/Ankommen durch die Sägewerks-Gebäude. Jetzt:
- **Stellplatz** liegt fest außerhalb des Zauns südwestlich vom Südtor (Mitte −43,5 / −24,5), mit Schotterfläche (`worldview.js` Bodenfarbe) und direkter Anbindung an den Waldweg am Wegknick (−41 / −21). Nicht verschiebbar (`FFIXED`, `erbedata.js`).
- **Fahrt** (`farmview.js` `lkwRoute`): Stellplatz → Süden → Wegknick → Waldweg → Straße, kein Weg mehr durch Gebäude.
- **Beladen** weiterhin auf dem Stellplatz (Paletten fliegen aus dem Holzlager).
- **Bäume/Büsche** halten das Gelände dort frei (`inLkwBay` in `erbe.js`, `worldview.js`).
- **Alte Spielstände** (`erbe.js`, Marke `v169lkw`): der Stellplatz zieht einmalig um; Bäume im Weg rücken zur Seite.

## v168 – Ablehnen-Knopf (🗑️) bei Bestellungen zuverlässiger

Gemeldet: Der Papierkorb an Angeboten tat nichts. Im Test ließ sich die alte Version nicht zum Fehlschlagen bringen (nur die Zeile, wo das Fenster unter dem Finger neu gezeichnet werden könnte, ist unsicher). Darum (`farmview.js`):
- Ablehnen läuft per Delegation (Tippen **und** Klick), unabhängig davon, ob der Knopf zwischen Berühren und Loslassen ersetzt wurde. Ein nachgereichter Klick wird unterdrückt, damit er nie die nächste Karte trifft.
- Rückmeldung: Ton und Hinweis „… abgelehnt“.
- Sicherheitsprüfung: nur Bestellungen des Hofs (`o.farm`), nie Tutorial-Bestellungen.

## v167 – Schatztruhe immer sichtbar (Kamera der Öffnungs-Show)

Die Show „Truhe bricht aus der Grube“ konnte hinter/in einer Baumkrone verschwinden. Jetzt (`worldview.js`, `worldTreasureCam`):
- Die Kamera fliegt **steiler von oben** (Neigung 1,22, Abstand 13) – Kronen verdecken dann nur noch ganz nahe Bäume.
- Aus 24 Blickrichtungen wird die gewählt, bei der **kein Baum** auf der Linie Kamera–Grube steht (Standardrichtung bevorzugt, sonst Drehung um die Grube).
- Nach der Show fliegt die Kamera sanft in die alte Ansicht zurück; fasst der Spieler die Kamera an, übernimmt er sofort.
- `farmview.js` `clampCam`: Neigung kann kurzzeitig überschrieben werden (`FV.camOv`).

## v166 – Ereignis bei offenem Fenster blockiert nichts mehr

Gemeldet: Kam ein Ereignis (Schatzkiste/Vogelschwarm) während das Bestellfenster offen war, ließ es sich nicht mehr schließen. Die Ursache konnte ich im Test nicht nachstellen (Fenster schloss sich dort immer); darum drei Absicherungen:
- `game.js` Spieluhr: Fehler in `tick`/`tickFollow` beenden die Schleife nicht mehr (vorher blieb dann alles stehen).
- `erbe.js`/`worldview.js`: Schatz-Ereignis und Döring-Solar-Takt sowie die Anzeige des Ereignisses sind abgefangen – ein Fehler dort bricht den Takt nicht ab.
- `farmview.js`: Schließen-X und Hintergrund-Tipp per Delegation (click + pointerup) – gilt auch, wenn das Fenster unter dem Finger neu aufgebaut wird.

## v165 – Zutat antippen startet keine Produktion mehr

Tippt man in einem Rezept (Sägewerk, Hof, Fischerei …) auf den Zutaten-Button, erscheint nur noch der Name mit „im Lager“; die Karte darunter (Produzieren) bleibt unberührt (`farmview.js`, Tipp-Listener stoppt den Klick bei `.frec`).

## v164 – Bestellungen als Favorit (★) markieren

Jede Bestellung in **Hof, Sägewerk und Fischerei** hat oben rechts einen Stern (`farmview.js`, `.fo-star` in `style.css`); `o.fav` je Bestellung, jede Station einzeln. Favoriten stehen oben in der Liste, goldener Rahmen.

Höchste Dringlichkeit:
- **Team** (`staffFavPlan` in `team.js`): Fahrer/in nimmt Favoriten sofort an (ohne Drei-Aufträge-Limit); Aufgaben der Bestellung und alle Unteraufträge (Zutaten, Rohstoffe) bekommen **prio 3** und werden vor allem anderen erledigt (bis 9 offene Aufgaben je Kraft, verfallen nicht so schnell). Ohne Fahrer/in bekommt der Hersteller der fehlenden Ware (sonst du) den Auftrag direkt.
- **Fahrer/in:** fertige Favoriten werden zuerst ausgeliefert; Angebote/Reihenfolge bevorzugen Favoriten.
- **Büros/Dispo** (`game.js` `dispatchRun`): Favoriten zuerst, die Rentabilitätsschwelle gilt für sie nicht; `dispoPurge` löscht Favoriten nie.

## v163 – Disposition sortiert unrentable Aufträge automatisch aus

- **`dispoPurge(b)` / `dispoProfitable()`** (`offices.js`): Bei jedem Dispo-Takt prüft jedes Büro mit aktiver Disposition die Aufträge in seiner Reichweite. Gerechnet wird mit dem günstigsten passenden Fahrzeug des Büros (auch wenn es gerade unterwegs ist) und der besten Routenvariante: Erlös (inkl. Büro-Bonus) − Kosten. Reicht das nicht für mehr als 10 % Marge, wird der Auftrag **gelöscht** (ohne Rufverlust) und eine Meldung „🗑️ Dispo …: n Aufträge aussortiert“ erscheint (höchstens alle 2 Spielstunden).
- **Kosten** (`evalFullCost` in `game.js`): Fahrtkosten inkl. Leerfahrt **plus** anteilige Tagesfixkosten der Fahrzeuge (Fahrtdauer/24 h). Dieselbe Rechnung gilt jetzt auch bei der Annahme durch die Dispo.
- Ausgenommen: Pablo-, VIP-, Tutorial-, Missions- und Hofbestellungen; Aufträge, für die kein passendes Fahrzeug im Büro existiert, bleiben liegen (nicht beurteilbar). Ohne Büro/Disponent wird nichts gelöscht. Abschaltbar über `S.autoPurge = false`.

## v162 – Maschinenhalle entfernt, Traktor frei beweglich

- **Maschinenhalle** (das Gebäude mit Solardach östlich vom Hof) ist entfernt – samt ihrer Sperrzonen (`worldview.js`, `erbe.js`, `farm.js`).
- **Traktor mit Anhänger ist jetzt ein Objekt** (`t: "tractor"`, 5×2 Kacheln, `FSIZE` in `erbedata.js`): antippen → *Bewegen* oder *Ins Lager*; Ziehen mit Langdruck wie bei anderen Gebäuden; ↻ dreht ihn.
- **Ins Lager:** `farmTractorStore()` (`farmview.js`) – der Traktor verschwindet, `S.farm.trkStored = true`. Im Lager-Fenster (🌾 Lager) erscheint oben „Traktor im Lager“ → `farmTractorPlace()` → Aufstellen wie beim Bauen (✕ bricht ab, er bleibt im Lager).
- **Neue Zone „wild“ = rund um den Hof** (`FWILD`, `farmWildOk` in `farm.js`): erlaubt nur, wo nichts im Weg steht – nicht im Zaun/Hof (0,7 m Abstand), nicht im Sägewerkshof, nicht auf Nachbars Feldern, Teich, See, Bach, Wegen oder der Straße, nicht an Laternen/Blumen, nicht an Bäumen, Büschen, Steinen, Totholz, Hochsitz, Lagerplatz oder anderen Objekten (nutzt die Hindernis-Karte `NAV` der Laufwege). Auf dem Hof gelten die normalen Hofregeln. Zonenknopf 🌳/🏡 springt zwischen „rund um den Hof“ und „auf den Hof“.
- **Spielstände:** `farmTractorEnsure()` stellt ab Stufe 2 einmalig einen Traktor an die alte Stelle (vor dem Zaun); die alten Sperren im Straßenrand (`farmRoadKeep`) für Traktor/Halle sind weg. Farbe aus der Kosmetik (`cos.on.tractor`) bleibt.

## v161 – Etappen-Knopf schaltet live frei

Wartest du im Menü „Welt“ auf das Geld (oder das Level) für die nächste Etappe, musste man das Menü neu öffnen. Jetzt prüft `stageLiveTick()` (`game.js`, alle 0,4 s, nur wenn „Welt“ offen ist) den Knopf:
- Der Text „Dir fehlen noch …“ zählt live mit.
- Reicht das Kapital, blendet der Knopf weich auf (Deckkraft-Übergang), poppt kurz, bekommt einen Lichtstreifen, die Etappenkarte ein grünes Aufleuchten, dazu der Münzton; danach pulsiert er ruhig. Fällt das Geld wieder, wird er sanft ausgegraut.
- `prefers-reduced-motion` schaltet die Animationen ab. CSS: `#unlockBtn`, `.stage-ready` in `style.css`.

## v160 – Übernahme-Verhandlung: Gegenseite wird emotional

Ist dein Angebot zu niedrig, reagiert die Gegenseite jetzt gekränkt und sagt klar, dass sie **aus Prinzip teurer** verkauft (`corp.js`, `corpOffer`):
- Unter 90 % ihres Wunschpreises: emotionale Antwort (mehrere Varianten, beim zweiten Mal gereizter), Wunschpreis +4 %, Gegenangebot entsprechend höher.
- Unter 70 %: „Beleidigung/Frechheit“ mit Prinzip-Ansage, Gespräch endet wie bisher (2 Tage Pause), Preis +8 %.
- Der Aufschlag bleibt für spätere Gespräche mit derselben Firma bestehen (`S.corp.spite`, höchstens +30 %).
- Angebote ab 90 % bleiben freundlich („Wir sind nah dran“).

## v159 – Fortbildungs-Meldung (Vertretung): neues Layout, scharfes Porträt

Die Meldung nach „Fortbildung“ wirkte unfertig (kleines, weiches Bildchen im Kreis, vom Text überdeckt, Fließtext). Jetzt:
- **Porträt in hoher Auflösung:** neue Bildgröße `big: 2` in `thumbOf/thumbR` (`worldview.js`): 1024 px gerendert, 512 px ausgegeben (vorher 144 px) – Figur von vorn, vollständig im Rahmen.
- **Neues Layout** (`staffSubPopup` in `team.js`, `.stp*` in `style.css`): Porträtkarte links, Name/Rolle/„Fortbildung“-Tag und Sprechblase rechts, darunter zwei Infokarten (Fortbildung, Vertretung) und der Button.

## v158 – Verschieben: Sägewerk als Ganzes statt durchsichtig

Beim Verschieben war das Gebäude-„Geisterbild“ durchscheinend (alpha 0.82) – bei der Gattersäge sah man dadurch Förderband, Sägetisch und Bretter im Inneren. Jetzt wird alles, was verschoben wird, und alle Sägewerks-Hauptgebäude **deckend** gezeigt (`startPlace` in `farmview.js`); rot bleibt nur die Färbung bei ungültigem Platz. Das Sägeblatt (Kindteil der Halle) wandert jetzt mit dem Geisterbild mit.

## v157 – „Im Telefonat“ erst mit Büro

Die Sprechblase „Im Telefonat“ (Mitarbeiter am Steg usw.) und die 10 Minuten Anruf-Wartezeit gibt es erst, wenn mindestens ein Büro gekauft/gemietet ist (`staffHasOffice()` in `team.js`, gilt in `staffCalling` und beim Job-Start). Vorher legen die Leute sofort los.

## v156 – Luckybox „Headhunter“: Fachkraft für jedes Büro

Vorher landete die Gratis-★★★★★-Fachkraft nur im höchsten Büro. Jetzt bekommt **jedes** Büro seine eigene (je Gewinn eine pro Büro, solange dort nicht schon eine wartet). Büros, die später gebaut oder per Firmensitz-Wechsel angelegt werden, bekommen ebenfalls eine (`perks().hhAll`).

- `lucky.js` (`luckyHeadFor`, Gewinn `head`, Beschreibung), `offices.js` und `corp.js` (neues Büro), Version v156.

## v155 – Sägewerk-Büro: Maschinen als 3D-Icons

Die Maschinen-Chips („Maschinen im Sägewerk“) zeigten Emojis (Axt, Gleis, Thermometer …). Jetzt dieselben 3D-Bildchen wie im Maschinenladen (`thumbSpan("shop:"+id, shopModel(it), …)`, Emoji nur als Platzhalter/Fallback), etwas größer (34 px); fehlende Maschinen (Lv-Chip) leicht ausgegraut.

- `worldview.js` (`openSawOffice`), `style.css` (`.fchip.mch`), Version v155.

## v154 – Auktionshaus: Lack in der Notiz passt jetzt zum Autofoto

Problem: Das Foto gehört fest zum Modell (z. B. blauer RS 2 Avant), der Lack der Notiz („Kyalamigrün“) wurde aber zufällig gewürfelt.

- `auction.js`: `detectPaint()` bestimmt beim Laden von Foto/Zeichnung die Karosseriefarbe (Mittelbereich, Reifen/Scheiben ausgeblendet, Lab-Abstand zu den Herstellerlacken in `CAR_PAINTS`) und speichert sie als `PICS[id].pc`.
- `ahFixPaints()` gleicht Lose, Garage und Verlauf an (beim Rendern, Lot-Fenster, `openCar`, sofort nach Erkennung); neue Lose nehmen `paintOfPhoto()`.
- Gilt für alle Autos. Ohne Foto (offline) bleibt der gewürfelte Lack, bis das Foto geladen ist.
- Version: v154 (index.html `?v=`, sw.js).

## v153 – Grafikfehler: Hochsitz-Blick, eckige Flächen auf Wiese und Wasser

Drei Screenshots (Hochsitz unten rechts, Flussufer mit Wasser, Lichtung mit Reh) – drei Ursachen, zwei davon dieselbe:

- **Hochsitz (`hunt.js`):** Im Auge-Blick stand die nahe Ebene der Kamera auf 1,1 m (seit v111, damit die Ferne nicht flimmert). Brüstung, Gewehrauflage, Eckpfosten und Dach liegen aber nur 0,8–1,2 m vom Auge – sie wurden in scharfen Diagonalen abgeschnitten (Brett-Enden liefen spitz aus, der rechte Eckpfosten fehlte). Jetzt 0,3 m; bei 200 m Entfernung bleibt der 24-Bit-Tiefenpuffer auf ≈ 1 cm genau, die Ferne flimmert nicht. Fernglas (3,2 m) und Zielfernrohr unverändert.
- **Lichtsäulen (`worldview.js` stepLife, `forestmodels.js`):** In den Lichtungen steht eine durchscheinende Lichtsäule (6-seitiges Prisma, 6,5 m hoch, bis 10 % deckend). Aus der Hofansicht (Blick schräg von oben, Neigung immer ≥ 0,8) ist das ein hartes, flaches Sechseck mit geraden Kanten und zwei sich überlagernden Wänden: große eckige Flächen mitten auf der Wiese, über Wasser ein helles Rechteck mit Streifen. Jetzt gibt es die Säule nur noch bei flachem Blick (Ich-Perspektive oder Neigung < 0,55); aus der Hofansicht liegt an derselben Stelle ein weicher Lichtfleck (`FWM.lightPatch`, 8 flache Scheiben mit abnehmendem Radius, je ≈ 1,6 % deckend – kein erkennbarer Rand).
- **Bodenfarbe (`worldview.js` worldGroundCol):** Grün- und Waldbodentöne wählten je Gitterpunkt (4 m) hart einen von drei Tönen, die Lichtung einen von zwei. Jetzt stetige Mischung (smoothstep) und ein einziger Lichtungston – weicher Verlauf statt flacher Flächen.
- Nicht geändert: Sonnenglanz auf dem Wasser bei Blick gegen die Sonne (bewusst), Schattenform der Bäume auf dem Wasser.

## v152 – Bäume: ein gemeinsames Rinden- und Kronensystem für Hof-/Waldansicht und Ich-Perspektive

**Ursache der Qualitätsunterschiede:** Die Ich-Perspektive (Säge/Axt, `fpsaw.js`) hatte einen eigenen, fein gestalteten Stamm (28 Facetten, Borkenrelief, Birkenstreifen), die Hof-/Waldansicht (`woodmodels.js tree()`) dagegen ein 7-Eck-Rohr mit aufgesetzten Klötzchen bzw. schwarzen Sechseck-Scheiben (die „Punkte“ auf der Birke). Die Krone war in beiden Ansichten dieselbe, aber aus wenigen großen Ikosaeder-Flächen mit zufälligen Farben.

- **Neu `treebark.js` (TBARK):** Rinde, Relief, Verjüngung und Stamm aus `fpsaw.js` herausgelöst – Hof-/Waldansicht, Ich-Perspektive, Stumpf, umgestürzte Bäume nutzen dasselbe System. Samen je Art/Größe/Variante (`seedOf`), damit Relief und Markierungen in allen Ansichten gleich sind. Drei Stufen: 0 = Ich-Perspektive (Markierungen als geschnittene Rindenflächen, nötig für den Kerb), 1 = nah in der Hofansicht (28 Facetten, Markierungen als anliegende Auflage auf den Facetten, 1,5 % über der Rinde), 2 = fern (7 bzw. 14 Facetten – Teiler von 28, gleicher Umriss; gröbere Bänder, nur die großen Markierungen).
- **Rinde je Art:** Birke cremeweiß in gebrochenen Tönen, dunkler rissiger Fuß mit zackigem Übergang, lange spitze Querbänder, kurze Striche, breite Flecken unten, Lentizellen, Astnarben unter den Ästen. Kiefer unten graubraune Schuppenborke (starkes Relief), zackig übergehend in fuchsrote, glatte Spiegelrinde; Aststummel. Eiche wie v128 (Furchen, Platten, Moosfuß). Buche glatt silbergrau, leicht gefleckt, Hauch Grünalgen, „Buchenaugen“, stärkerer Wurzelanlauf. Fichte kleinschuppig graubraun. Kirsche rotbraun mit unterbrochenen hellen Lentizellenbändern.
- **Kronen (`woodmodels.js`):** `leafClump` – gleiche Lage/Größe wie bisher, Farbverlauf oben hell → unten dunkel (nie schwarz, nie grell), Licht-Normale halb Fläche/halb von der Kronenmitte (Volumen statt loser Platten), Formzufall aus Hashes (beide Stufen gleiche Grundform). Nah: eine Stufe feiner und Blattbüschel auf der Oberfläche. Fichte: Etagen als Stern mit hängenden Astspitzen (nah mit gewölbtem Mittelring und Unterseite). Birke: graue Äste, nah doppelt so viele hängende Zweige.
- **Detailstufen (`worldview.js` TLOD):** echte Bäume und Kulissenbäume wechseln je nach Abstand Auge–Baum (17 Einheiten, größere Bäume früher, Hysterese) zwischen fein und grob; feine Modelle werden bei Bedarf gebaut (≤ ~6 ms je Bild). Kulissen-Instanzen wandern zwischen den Gruppen (`WV.bgGH`, `WV.bgHi`).
- **`gl3d.js`:** Knoten (`n.smesh`) und Instanzgruppen (`smesh`) können ein eigenes Schattenmodell haben – feine Bäume werfen den Schatten der groben Stufe.
- **`fpsaw.js`:** nutzt TBARK; Krone aus dem feinen Modell (gleich wie nah in der Hofansicht), Variante wie in der Hofansicht (`t.v`, vorher `t.id % 3` – die Krone konnte beim Zoom wechseln), Samen gemeinsam, Aststummel (`b.keep`) werden mitgenommen, Stumpf merkt sich die Variante.
- **Auch angepasst:** umgestürzte Bäume (Windwurf) und natürliche Stümpfe mit Artrinde, Setzlinge, Obstbäume am Hof (`farmmodels.js treeMesh`: Plattenborke, runde Äste, Volumenkrone), die zwei Bäume auf der Insel im See (jetzt die Waldmodelle statt alter Kulissenbäume).
- Nicht geändert: die Fernglas-/Revier-Modelle (`treeRv`, für 7-fache Vergrößerung eigens gebaut); `FTREE_DIM` (Abstände) bleibt – die grobe Stufe weicht meist < 0,1 ab.

## v151 – Eiche: Zacken-Dreiecke am Stamm beim Sägen behoben

- **Ursache (`fpsaw.js`, `taperB`):** Das Rinden-Relief der Eiche (Rippen/Furchen) wurde an jedem Eckpunkt über dessen Winkel berechnet. Schnittpunkte in der Mitte einer Stamm-Facette (Höhenteilung der Rindenbänder, Kerb) bekamen dadurch einen anderen Wert als die Fläche an dieser Stelle hat – die Flächen knickten sägezahnartig ein, bei mittelgroßen Eichen (viele Rindenbänder) besonders sichtbar als dunkle Dreiecke.
- **Fix:** Relief wird nur noch an den Facettenkanten ausgewertet und dazwischen linear gemischt (Kanten bleiben gleich, die Fläche bleibt eben). Zusätzlich werden Eichen-Rindenflächen an den Facettengrenzen geschnitten (`sty.fc`/`sty.la0` in `emitBark`), damit die Farbe pro Facette stimmt.

## v150 – Routen auf echten Wegen (Straße, Seeweg, Flug)

- **Neu `routegeo.js`:** Die Linie einer Strecke und die Fahrzeugposition folgen jetzt echten Wegen statt der Luftlinie.
  - **Straße, Schiene, Fahrrad und Tür-Strecken:** Weg über befahrbare Straßen (Routing-Dienst `routing.openstreetmap.de`, Ersatz `router.project-osrm.org`). Jede Strecke wird einmal geladen, im Gerät gemerkt (`localStorage` „logistika-geo-v1“, bis 400 Linien) und danach auch offline gezeigt. Solange sie lädt oder ohne Netz bleibt es die gerade Linie. Unsinnige Antworten (viel kürzer/länger als die Luftlinie) werden verworfen. Schiene nutzt mangels Schienen-Routing die Straßenführung.
  - **Seeweg:** feste Seewege über Wegpunkte (Ärmelkanal, Kieler Kanal, Ostsee-Engen, Gibraltar, Suezkanal, Rotes Meer, Malakka, Panamakanal, Kap Hoorn, Kap der Guten Hoffnung u. a.), Hafen → nächster Wegpunkt, kürzester Weg im Wegpunkt-Netz.
  - **Binnenwasser:** Flussläufe und Kanäle (Elbe, Rhein, Main-Donau, Donau, Havel, Mittellandkanal, Seine, Rhône, Jangtse).
  - **Luftfracht:** Großkreis (kürzester Weg über die Erdkugel, z. B. Frankfurt–Shanghai nördlich über Russland).
- **`game.js`:** `pathPts(nodes, a, b, mode)` hängt jedem Teilstück die Fahrart an (`pts.gm`); `roadLine` → `geoLine` (danach wie bisher die Hofstraßen), `vehPoint`/`parkHere` → `geoDispAt` (gleicher Streckenanteil auf der Weg-Linie). `routeGm` heftet nach dem Laden eines Spielstands die Fahrart wieder an laufende Fahrzeuge. Zeit, Kosten und Entfernung im Spiel bleiben auf der Luftlinie – nur die Anzeige ändert sich.
- **`map.js`:** `unwrapLons` behält `gm`. **`index.html`/`sw.js`:** `routegeo.js` eingebunden.
- Nicht geändert: die kleine Schemakarte im Planer (gerade Knotenlinie).

## v149 – Säge/Axt: kein 2D-Fenster mehr nach dem vorigen Baum

- **Fehler:** Direkt nach einem gefällten Baum läuft die 3D-Ansicht noch bis zu 3,5 s aus (Kamera zurück, Baum fällt). Wer in der Zeit den nächsten Baum anging, bekam statt der Ich-Perspektive das alte 2D-Fenster („Kerb setzen“ mit Stamm im Dialog) – und das blieb auch hängen, wenn der Lauf nie sauber endete (`FV.fp` blieb gesetzt).
- **`fpsaw.js`, `can()`:** Ein auslaufender oder liegengebliebener Lauf (`X.mode === "out"` oder kein Minispiel mehr offen) wird sofort abgeschlossen (`finish()`), dann startet der neue Baum wieder in 3D.
- Test: zwei Bäume hintereinander – vorher 2. Mal ohne 3D (`st.fp` leer), jetzt mit 3D.

## v148 – iOS-Lupe beim langen Halten überall aus

- **`game.js`:** Auf der Spielfläche (`#farmCv`, `#farmAngel`, `#huntUI`, Minispiel-Bühne, Halten-Knöpfe) wird `touchstart` abgefangen, außer bei Eingabefeldern und normalen Knöpfen; zusätzlich wird jede Textauswahl sofort verworfen (`selectionchange`, `touchend`). Eingabefelder bleiben bedienbar.
- **`style.css`:** `user-select`/`-webkit-touch-callout` auch für `html`, `body`; Auswahlfarbe transparent (außer Eingabefelder).
- Hinweis: die Lupe ist ein iOS-Systemverhalten und nur auf einem echten iPhone sicher zu prüfen.

## v147 – Flotte: „Alle Arten“ zeigt wirklich alle Fahrzeuge

- **`game.js`:** Der Chip „Alle Arten“ setzt jetzt auch die Filter „Besitz“ (z. B. „✋ selbst“, das Büro-Fahrzeuge ausblendet) und „Einsatz“ zurück und zeigt die Gesamtzahl der Flotte. Der Zurücksetzen-Knopf („✕ Filter aus“) steht nun in der Arten-Zeile und ist immer sichtbar, solange ein Filter aktiv ist (vorher lag er außerhalb des Bildes in der scrollbaren Zeile).

## v146 – Tiere, Falter und Menschen laufen nicht mehr durch Hindernisse

- **`team.js`:** Das Wegenetz (Raster + A*) kennt jetzt auch Steine, Felsen (`WV.rockObs`), Moosstämme, Stümpfe und Wurzeln als Hindernisse. Neue Helfer: `navWallsFor(role)` (Igel: Zäune zählen nicht; Wild: Hoftore sind zu), `navHit`, `navStepBlocked`, `navSide`, `wanderPlan`, `wanderMove`.
- **`worldview.js`:** Wildtiere (`stepWild`) planen ihren Weg und laufen außen um Gebäude, Zäune, Bäume, Felsen und Wasser herum – keine Sprunganimation. Der Igel schlüpft unter Zäunen durch, kommt aber ebenfalls nicht durch Bäume, Steine oder Wasser. Start (`wildHome`) nie in einem Hindernis und nie auf der anderen Zaunseite. Falter (`stepLife`) drehen an Hindernissen um und ziehen die Schleife enger (wächst langsam wieder). `WV.rockObs` wird beim Aufbau gesetzt.
- **`hunt.js`:** Hirsch/Keiler auf der Wildwiese (`mwSpawn`, `mwStep`) laufen ebenfalls auf dem Wegenetz.
- Menschen (Personal) liefen schon über das Wegenetz; sie sehen jetzt auch Steine und Felsen.

## v145 – Tipp-Karte in „Welt & Kontor“ entfernt

- **`game.js`:** Die Karte „Tipp“ mit dem zufälligen Spieltipp (`TIPS` aus `data.js`) ist aus der Welt-Ansicht raus; die Liste bleibt unbenutzt in `data.js`. Aufgebaut auf dem GitHub-Stand v144.

## v144 – Verkaufsstand: Schieber wie bei den Arbeitern

- **`worldview.js`, `openStall`:** Schnellknöpfe 1 / 5 / 10 / alles entfernt. Stattdessen Schieber (kleinstes Gebinde bis alles) und darunter Feinknöpfe −10 / −1 / +1 / +10 Gebinde wie bei der Mengengrenze der Arbeiter (Beschriftung in der Anzeige-Einheit, z. B. „+3“ bei Paletten, „+20 kg“ bei Äpfeln). Verkauft wird weiter in ganzen Gebinden.

## v143 – Kein Köder-Vorrat für den Fischer

- **`team.js`, `erbe.js`:** Der „Vorrat behalten“ aus v142 ist wieder raus. Die Mengengrenze deckelt nur das Herstellen – wer die Ware braucht (auch der Fischer beim Angeln und Beködern), nutzt sie mit. Fischer/in hat deshalb keine Grenze mehr (`STAFF_LIM` ohne „fischer“, `staffBaitKeep` entfernt). Gespeicherte Fischer-Vorräte (`S.farm.limU["f:…"]`) werden beim Laden gelöscht (`limV3`).

## v142 – Mengengrenze genau und für alle Berufe mit Freigaben

- **Jede Zahl einstellbar (`team.js`):** Grenze jetzt in der Anzeige-Einheit (`S.farm.limU`: Stück, kg, l …) statt in Gebinden – vorher sprang z. B. der Paletten-Schieber nur zwischen 102 und 201 (Stapel à 3). Schieber 0 … Lagerplatz der Ware (mind. 100) in Einzelschritten, dazu Knöpfe −10 / −1 / keine / +1 / +10. Alte Grenzen (v138, `S.farm.lim` in Gebinden) werden beim ersten Zugriff umgerechnet (`limV2`).
- **Alle Berufe mit Freigaben außer Tierpfleger/in (`STAFF_LIM`):** Landwirt/in, Sägewerker/in, Hofmeister/in, Fischwirt/in (Maschinen ohne Auftrag, `staffPickRecipe`), Holzfäller/in (fällt keine Bäume der Sorte mehr, wenn die Stämme die Grenze erreichen), Fischer/in. Fahrer/in und Mechaniker/in haben keine Freigaben.
- **Fischer/in:** die Kacheln sind Köder – dort heißt die Zahl „Vorrat behalten“: der Köder wird nur genommen, solange mehr da ist (`staffBaitKeep`, in `staffBaitOk` (`erbe.js`) und beim Beködern der Reusen). Eigener Schlüssel `f:<köder>`, damit z. B. Mais des Landwirts getrennt bleibt.
- CSS `.fst-lim-b` (`style.css`).

## v141 – Maschinenaufträge zeigen, wer sie eingestellt hat

- **Hintergrund:** Schaffutter tauchte auf, obwohl laut Freigaben niemand es macht. Im Code gibt es nur drei Wege in eine Maschine (du im Fenster, Arbeiter, Berts Dauerbestellung) – ohne Spielstand nicht eindeutig zu klären, deshalb jetzt sichtbar.
- **`farm.js`:** jeder Auftrag in `farmQueue` bekommt `who` („du“ oder „rolle|Grund“), dazu Verlauf `S.farm.mlog` (letzte 30). Neu `farmQueueBy(who, o, rid)` für Aufrufer.
- **`team.js`:** Arbeiter melden den Grund: „Freigabe“, „Auftrag von … für …“ oder „Zwischenprodukt für …“. **`erbe.js`:** Berts Tauwürmer „Dauerbestellung“.
- **`farmview.js`:** Plakette oben links in jedem Warteschlangen-Platz (👤 du, sonst Berufssymbol; Tooltip mit Grund) und unten im Maschinenfenster „Zuletzt eingestellt“ (letzte 5 dieser Maschine mit Grund und Zeit). CSS `.fq-who`, `.fq-log`.

## v140 – Daueraufträge: Zusatz „danach mehr“ entfernt

- `farmview.js`: Hinweis „· danach mehr“ / „· Höchstmenge“ hinter dem Preis laufender Verträge entfernt.

## v139 – Mengen-Schieber am Verkaufsstand und Fischmarkt

- **`worldview.js`, `openStall`:** unter den Knöpfen 1 / 5 / 10 / alles ein Schieber von einer Einheit bis zum ganzen Lagerbestand (Schritt = kleinstes Gebinde, z. B. 10 kg Mais, 1 Räucherforelle). Menge und Preis laufen beim Ziehen mit, Loslassen zeichnet neu; der passende Schnellknopf leuchtet mit. Preislogik unverändert (`stallBase` × Preisfaktor).
- CSS `.fstl-sl` (`style.css`).

## v138 – Mengengrenze für Landwirt/in und Sägewerker/in

- **Bedienung (`team.js`, `staffWlHTML`, `renderStaffPop`):** In der Freigabe-Liste eine Kachel gedrückt halten (0,45 s) → Schieber „Grenze für …“ mit Stufen keine / 20 / 50 / 100 / 200 / 300 / 500 / 750 / 1 000 / 1 500 / 2 000 / 3 000 / 5 000 (in der Anzeige-Einheit: kg, Stück …), „Fertig“ schließt. Antippen schaltet weiter an/aus. Kachel zeigt „✓ bis 200 kg“, ⛔ wenn erreicht.
- **Wirkung:** gespeichert in `S.farm.lim[id]` (in Gebinden, fehlt = keine Grenze). Landwirt/in sät nicht mehr, wenn Lager + was auf den Feldern wächst die Grenze erreicht (`staffCrop`, `staffGrowing`), und erntet/pflückt/gießt nichts mehr davon, solange das Lager auf der Grenze steht (`staffFarmerJob`). Maschinen ohne Auftrag: kein Rezept mehr, wenn Lager + was in den Maschinen läuft die Grenze erreicht (`staffPickRecipe`, gilt für alle Maschinen-Berufe, einstellbar bei Landwirt/in und Sägewerker/in). Aufträge für Bestellungen gehen weiter.
- CSS `.fst-lim*`, `.wl-lim`, `.wl-sel` (`style.css`).

## v137 – Produktionsstätten für Arbeiter deaktivieren

- **Knopf im Maschinenfenster (`farmview.js`, `openMachine`):** „⏸ Deaktivieren“ / „▶ Aktivieren“ oben neben dem Namen, bei allen Produktionsstätten, die Arbeiter bedienen (nicht bei Fangfahrten und Berts Werkstatt). Deaktiviert steht ein Hinweis unter dem Namen; selbst produzieren geht weiter. Gespeichert als `o.off` am Objekt (fehlt = aktiv, keine Migration).
- **Arbeiter (`team.js`):** `staffMachines` und `staffRecipeFor` überspringen deaktivierte Maschinen (kein Befüllen, kein Abholen, keine Aufträge dafür). Die Freigabe-Liste (Whitelist) zeigt weiter alle Rezepte (`staffMachines(role, true)`). Statuszeile: „alle Maschinen deaktiviert“.
- CSS `.fs-h .fm-off` (`style.css`).

## v136 – Daueraufträge: ohne Grenze, zweimal pro Woche, Menge steigt

- **Keine Grenze mehr (`farm.js`, `farmAboTick`):** Vorher kamen keine Angebote mehr, sobald an einer Station zwei Verträge liefen. Jetzt gibt es beliebig viele Verträge; je Station stehen weiter bis zu zwei Angebote offen.
- **Takt und Menge (`FABO_EVERY`, `farmAboPalN`, `farmAboQty`):** Lieferung alle 3,5 Tage statt einmal pro Woche. Die Menge startet beim 2,5-Fachen der Grundladung und steigt mit jeder Lieferung um ein Viertel bis zum 4-Fachen (Beispiel Mosterei: vorher 32 kg Äpfel pro Woche, jetzt 80 kg je Lieferung, bis 128 kg). Jede Lieferung muss aufs größte eigene Fahrzeug passen.
- **Preis (`farmAboPrice`, `farmAboBonus`):** folgt der aktuellen Menge, der Bonus wächst mit dem Mengenfaktor. Der Preis steht weiter vor der Annahme im Angebot.
- **Alte Verträge (`farmAboMigrate`):** bekommen beim ersten Zugriff den Startfaktor, die nächste Lieferung rückt in den neuen Takt (höchstens 3,5 Tage). Keine Spielstand-Migration nötig.
- Nach drei verpassten Lieferungen kündigt die Firma (vorher: drei Wochen). Texte in Bestellfenster und Liste angepasst (`farmview.js`, `game.js`).

## v135 – Jagderfolg: Keiler neu, Liegepose, Bergung als Erfolgsmoment, Trophäe sichern

- **Keiler neu modelliert (`hunt.js`, `boarBody`/`boarHead`/`boarUpper`/`boarLower`):** keilförmiger Rumpf mit Widerrist-Buckel, tiefer Brust, aufgezogenem Bauch und Keulen; Borstenkamm aus einzelnen Büscheln; langes Keilhaupt mit Rüsselscheibe, kleinen Lichtern unter Brauenwulst, aufrechten spitzen Tellern und hellem Backenbart; Gewehre wachsen am Gebrech nach außen/oben/hinten, Haderer kurz nach außen – Länge weiter nach den gespeicherten cm. Läufe mit Gelenk (eigene Knoten oben/unten, gespaltene Schalen, Afterklauen). Schwarte graubraun mit Grannenspitzen statt fast schwarz. **Trefferzonen unverändert** (das Gelenk ist nur Optik).
- **Fasan neu (`phBody`/`phHead`/`phLeg`):** organisch statt Kugeln/Quader, Stoß aus den Trophäen-Federn, Hals mit weißem Ring, Rosen, Federohren; Ständer als eigene Knoten (im Flug und erlegt angezogen).
- **Liegepose (`calcDead`, `deadPose`, `deadLeg`):** aus den echten Modellpunkten – Rumpf genau auf dem Boden (vorher fest `lie`, Keiler ~5 cm schwebend), jeder Lauf angewinkelt und so weit gesenkt, dass er aufliegt (oben liegende fallen auf den Boden), Haupt bzw. Träger zum Boden gedreht. Fest je Stück, kein Zufall. Gilt für Keiler, Hirsch, Fasan (auch Fasan aus dem Flug).
- **Bergung neu (`goHarvest`, `heroCam`, `harvestStep`):** kurze Abblende, Kamera nah von der Bauchseite schräg zum Haupt, fährt in 2,6 s auf eine Einstellung, die das Stück **aus seinen Punkten** in den freien Bereich zwischen Überschrift und Karte einpasst (jede Bildschirmgröße; breite Bildschirme: Karte rechts, Stück links). Danach steht sie; Wischen dreht um das Stück. Stück leuchtet nach dem Schnitt kurz warm auf, leichte Vignette. Antippen überspringt das Warten. Entfernt: drehende Riesenmedaille mit Strahlen, große Funken vor der Kamera (nur noch bei Gold/Diamant wenige feine Lichtpunkte hinter dem Stück).
- **Liegeplatz (`bedMesh`, `groundColAt`):** Fleck unter dem Stück mit Kontaktschatten aus den Modellpunkten, niedergedrücktem Gras und sanften Flecken; innen der weiche Wiesenverlauf (das grobe Bodengitter zeigt aus der Nähe gerade Farbkanten), außen exakt die Gitterfarbe – keine Kante. Grasbüschel im/am Stück werden für die Bergung weggenommen und danach wieder eingesetzt.
- **Erfolgsanzeige (`showWin`, `cardHTML`, CSS „v135: Jagderfolg“):** oben „Waidmannsheil!“, Name des Stücks, Treffer und Entfernung, darunter **nur echte Bestmarken** (`feats`: erste Trophäe, erstes Stück der Art, stärkstes bisher, erstmals eine Medaillenstufe). Karte: Medaille, „Silber-Trophäe“, Stufenwort, Trophäe, Sammlerwert; aufklappbar Gewicht, Treffer, Flucht (aus der Fluchtstrecke) und Güte als Balken auf der bestehenden Medaillenskala (50/72/90, Herz-/Lungenzuschlag sichtbar). Kleine Bildschirme starten zugeklappt, Wischen klappt zu, Antippen der Kopfzeile auf.
- **Trophäe sichern (`keepTrophy`, `showSaved`, `harvestDone`):** Knopf sperrt sofort (doppeltes Tippen speichert nur einmal), gespeichert wird **genau der angezeigte Datensatz** (`A.rec`: Art, Medaille, Güte, Variante). Danach Bestätigung mit dem Präparat dieses Stücks, Wandzähler und EP, Knöpfe „Weiter jagen“ / „Trophäenwand“ (verlässt den Hochsitz und öffnet das Lager). Wand voll: Verkauf wie bisher. Neu im Spielstand (nur Zusatz, keine Migration nötig): `S.farm.hunt.n` (Stücke je Art) und `S.farm.hunt.top` (beste Güte je Art).
- **Rückmeldung:** „Liegt!“-Hinweis, wenn das Stück zusammenbricht; leises Jagdhorn-Motiv je Art beim Erfolg (nur mit Ton), kurzes Rütteln auf Geräten mit Vibration (erst nach einer echten Berührung), „Klonk“ + Münze beim Sichern.
- **Tests (`hunt.test.js`):** neu „Modelle v135“, „Waffen wachsen mit den cm“, „Liegepose v135“; Dreiecksgrenze der Trophäen-Prüfung von 4 000 auf 5 600 (der Hirsch liegt seit v120 bei 4 600–5 000 – die alte Grenze schlug schon auf v134 fehl).
- Werte, Medaillen, Preise, EP, Treffer- und Fluchtlogik unverändert. Entfernt (nicht mehr gebraucht): `SP.*.lie`, `SP.*.orbit`, `harvestCam`, `showReveal`, `showPanels`.

## v134 – Offene Kisten (Lieferung und Schatztruhe): Innenleben statt flacher Platten

- **Fehler:** Die offene Kiste zeigte eine flache, einfarbige Deckel-Innenseite und im Korpus nur eine flache Goldplatte mit ein paar Steinen; nachts zusätzlich dunkel und matt. (`woodmodels.js`)
- **Korpus:** `chestHeap` – Münzhaufen aus 74 schrägen Münzen (vier Goldtöne, hellere Oberseite) mit größeren Edelsteinen auf dem Haufen, roter Boden.
- **Deckel:** `lidInside` – Holzrahmen, gepolstertes rotes Futter mit vier Kissen, Goldpaspel (Kreuz) und neun Nieten; beide Kisten (`lootCrate/lootLid`, `goldChest/goldLid`).
- **Licht (`worldview.js`):** offene Kiste bleibt mit Mindestleuchten (`glow` 0,14, Deckel 0,3) auch nachts gut sichtbar.
- Enthält v133 bis v121 – ein Upload genügt.

## v133 – Nachthimmel neu (Hochsitz und Ich-Sicht beim Fällen)

- **Himmel (`vista.js`):** nachts volle Bildschärfe (vorher halbe CSS-Auflösung → auf dem iPhone sehr unscharf). Milchstraße als einmal berechnete Textur (Band mit Staubstreifen, Körnung, warmer Kern), rund 5 000 Sterne in Spektralfarben (helle mit Lichthof, die hellsten mit Strahlen, Funkeln), Himmel dreht sich 15° je Stunde, Sternschnuppen alle 15–45 s, Lichtglocke der Städte am Horizont und Luftleuchten.
- **Mond:** Bild mit Maren, Kratern, Randverdunklung und Phase nach Spieltag (29,5 Tage); Helligkeit dämpft schwache Sterne und Milchstraße; steht über dem Feld leicht rechts (`X.skyAz` in `hunt.js`).
- **Wolken:** vorgerechnete, gelockte Formen (unten Schatten, oben Licht) statt Ellipsen-Ballen, nachts dunkel vor den Sternen mit silbernem Mondrand; gilt auch tagsüber und im Abendrot.
- **Blick (`hunt.js`):** nach oben bis 0,62 statt 0,3, damit man den Himmel ansehen kann.
- Enthält v132 bis v121 – ein Upload genügt.

## v132 – Hochsitz-Revier: alle Bäume in der schönen Optik

- **Bäume (`woodmodels.js`, `hunt.js`):** Mit bloßem Auge waren nur Bäume bis 40 m fein, alles dahinter das grobe Standardmodell (kantige Kugelkronen). Neu: Mittelstufe `FWM.treeRv(sp, 3, v, true)` – gleiche Gestalt, Farben und Blattoptik wie das feine Modell, aber etwa ein Viertel der Blätter (dafür größer), weniger Rinden-/Nadelsegmente (1 400–2 800 statt ~6 000 Dreiecke). Bis 40 m und im Fernglas/Zielfernrohr weiterhin fein, dahinter Mittelstufe; das grobe Modell erscheint nur noch kurz beim Betreten, bis die Mittelstufe gebaut ist (wird vor den feinen Modellen gebaut).
- Enthält v131 bis v121 – ein Upload genügt.

## v131 – Erlegtes Wild liegt nie mehr in Felsen oder Stämmen

- **Liegeplatz (`hunt.js`):** Beim Zusammenbrechen (Herz-/Lungen-/Trägerschuss, Fasan) wird aus der Ausrutschrichtung ein Zielpunkt bestimmt; liegt dort ein Fels, Totholz oder Baumstamm im Weg (Platzbedarf je Art: Hirsch 1,15 m, Keiler 0,75 m, Fasan 0,35 m), sinkt das Stück am nächsten freien Fleck zusammen (Suche in Ringen, bevorzugt in Laufrichtung, innerhalb des Feldes) und gleitet beim Fallen weich dorthin. Auch der abgeschossene Fasan landet frei. Neuer Test `Liegeplatz v131`.
- Enthält v130 bis v121 – ein Upload genügt.

## v130 – Hochsitz-Revier: Blickbereich und Kanzel-Grafik

- **Blick (`hunt.js`):** Wischen schwenkt nur noch ±65° um die Feldmitte (`X.th0`) – dahinter lag nur leere Wiese ohne Wald; Neigung nach unten höchstens −0,34 (vorher −0,6: man starrte aus nächster Nähe auf Brüstung und Boden, riesige flache Bretterflächen), nach oben 0,3 (Dachunterseite).
- **Kanzel:** Verwerfung der Balken von 0,16 auf 0,04 (aus der Ego-Sicht wirkten Pfosten und Bretter zackig/verzogen), Dachunterseite etwas heller.
- Enthält v129 bis v121 – ein Upload genügt.

## v129 – Zutaten-Chips starten keine Produktion mehr

- In allen Produktionsstätten (Mühle, Bäckerei, Sägewerk, Molkerei, Räucherei, Kessel, Fischerei-Fahrten – alles über `openMachine`) startete ein Tipp auf eine Zutat im Rezept sofort die Produktion. Jetzt zeigt der Tipp auf einen Zutaten-Chip (`[data-it]`) nur Namen und Lagerbestand; produziert wird erst beim Tipp auf die übrige Karte. (`farmview.js`)
- Enthält v128 bis v121 – ein Upload genügt.

## v128 – Bäume in der Ich-Perspektive: kein Moos mehr in der Luft, Eichenborke mit Relief

- **Moos in der Luft:** Die Moospolster am Stamm großer Eichen lagen im Baummodell hinter der Stamm-Marke (`b.tk`) und wurden deshalb von der Ego-Sicht als „Krone“ übernommen. Nach dem Kerb hingen sie frei in der Luft. Jetzt markiert `tree()` sie als `b.skip`, `crownMesh` (`fpsaw.js`) lässt sie weg. Im normalen Hof-Blick ändert sich nichts.
- **Stamm in der Nahsicht (`fpsaw.js`):** 28 statt 14 Sektoren; Relief je Art über `taperB` (`reliefOf`: Rippen/Furchen je Winkel, Wurzelanlauf unten) – wirkt auf Rinde, Kerbflächen und den Stumpf in der Welt gleich, alles bleibt dicht. Eiche: tief gefurchte Borke, Rippen in Platten mit wechselnder Helligkeit, dunkle Furchen, moosig-dunkler Fuß. Buche bleibt nahezu glatt, die anderen Arten leicht strukturiert.
- Enthält v127 bis v121 – ein Upload genügt (alle Spieldateien seit v120, ohne Testdateien).

## v127 – Heuballen an der Scheune entfernt

- Komplett raus: Ballen-Modelle am Scheunentor (`farmview.js`, `barnHay` in `farmmodels.js`), Antippen/Verkaufsdialog (`pickHay`, `openHay` in `worldview.js`), Nachwachs-Logik und Verkauf (`FHAY`, `farmHayTick`, `farmHaySell`, `hayWorld` in `erbe.js`), README-Eintrag. Die Deko „Heuballen“ im Laden (`hayBale`) und das Kuhfutter-Icon bleiben.
- **Alte Spielstände:** einmalige Auszahlung noch nicht verkaufter Ballen (8 € je Stück), `F.hay` wird gelöscht.
- Hinweis: v126 (See/Seebach wieder bewegt) ist enthalten, ebenso alles bis v121 – ein Upload genügt.

## v126 – See und Seebach wieder bewegt

- `water: 3` (`gl3d.js`) = Wellen wie vor v125 (alle Richtungen, v119-Look) – für den See und den anbindenden Seebach (`LAKE_CREEK`, eigener Knoten in `worldview.js`). `water: 2` = nördlicher Fluss, Ost→West. `water: 1` = still (Teich, Quelltümpel, Netzgehege).
- Enthält v125 bis v121 – ein Upload genügt (alle Spieldateien seit v120, ohne Testdateien).

## v125 – Angelsteg, Wasser nur im Fluss in Bewegung (Ost→West), Belohnungs-/Schatzkiste offen sauber

- **Angelsteg (`woodmodels.js` `pier`):** etwas länger; Schild mit Fisch am Stegbeginn, Laterne (nachts warm), zwei Angeln in Haltern mit Schnur und rot-weißer Pose, Fischeimer mit Fischen, Kiste mit Netz, Rettungsring, Ruderboot am Steg.
- **Wasser (`gl3d.js`, `worldview.js`):** `water: 1` = still (Zeit 0 im Shader: Teich, See, Seebach, Quelltümpel, Netzgehege), `water: 2` = Fluss. Nur der nördliche Fluss (`FWORLD.creek`, eigener Knoten) bewegt sich; Wellen, Bänder und Funken laufen jetzt von Osten nach Westen (−x). Nur die Richtungen der Terme geändert, Tempo/Stärke gleich.
- **Belohnungskiste vorm Hoftor / Schatztruhe aus der Grube:** offen sah der Korpus wie eine schwarze Fläche aus und der Deckel innen fast schwarz. Jetzt hohler Korpus mit Futter, Rahmenbrettern, Münzhaufen und Edelsteinen; Deckel-Unterseite hell bzw. rot, leichtes Eigenleuchten des offenen Deckels. Auch die Kiste, die in der Grube stehen bleibt, hat rotes Futter.
- Enthält v124 bis v121 – ein Upload genügt (alle Dateien seit v120).

## v124 – Telefon-Meldung antippen → direkt in den Chat

- Die Meldung unten (z. B. „💬 Mr. Snus: „Jo brauchst du Snus?““, ebenso Don Pablo, Entscheidungen, Teamanrufe) ist jetzt antippbar: öffnet das Diensttelefon, scrollt zu genau dieser Nachricht/diesem Chat und hebt sie kurz mit goldenem Rahmen hervor.
- Technik: `phoneMsg` gibt dem Toast das Ziel `"msg:"+id` (eigenes `m.go` bleibt vorrangig), `runMsgGo` (`game.js`) erkennt das Präfix, `openPhone(focusId)`/`renderPhone(focusId)` (`offices.js`) springen per `data-mid`-Anker; `.pmsg.focus` in `style.css`.
- Enthält v123, v122, v121 – ein Upload genügt (alle Dateien seit v120).

## v123 – Große Brotdose und Thermoskanne entfernt

- Beide Komfort-Artikel sind aus dem Laden (`erbedata.js`) und aus der Spiellogik (`erbe.js`: Ausdauer-Maximum wieder fest 100, Erholung ohne Faktor) sowie dem Essen-Dialog (`worldview.js`) und der README entfernt.
- **Alte Spielstände:** einmalige Migration (`F.v123`): wer eine der beiden gekauft hatte, bekommt die 🍀 zurück (30 bzw. 35), Besitz-/Aktiv-Eintrag wird gelöscht, Ausdauer auf höchstens 100 gekappt.
- Der Werkzeuggürtel bleibt die einzige Komfort-Karte.
- Enthält v122 und v121 – ein Upload genügt (ZIP mit allen Dateien seit v120).

## v122 (aufbauend auf v121) – alle übrigen Warenbildchen neu, Werkzeuge neu, Einsammeln zeigt die 3D-Bildchen

Enthält v121 vollständig – **ein Upload genügt** (ZIP mit allen Dateien, die sich seit v120 geändert haben).

- **Bausatz erweitert (`woodmodels.js`):** `skinV` (weiche Haut über Ringe, Farbe je Ecke), `sLathe` (weicher Drehkörper mit Rippen/Dellen), `sEll` (Ellipsoid mit Beule), `rrect`/`ringXZ` (abgerundete Umrisse), `slatCrate` (Lattenkiste), `paperBag`, `feedSack`, `tray`, `bucket`, Obst- und Gemüseteile (`tomato`, `apple`, `strawberry`, `corncob`, `wheatEar`), `sock`. Jutesack mit aufgenähtem Etikett und Füllfarbe.
- **Neu gebaut (Hof):** Weizenmehl und Maismehl als Papiertüte mit Falz, Farbband und Bild; Weizen und Mais im offenen Jutesack mit Ähren bzw. Kolben (Körnerraster, Lieschblätter); Kartoffeln im Sack mit Augen; Tomaten, Äpfel (rot/grün), Birnen (liegend) in der Lattenkiste; Erdbeeren (Nüsschen, Kelch) in der grünen Schale; Kirschen mit Stielen; Karottenbund mit Laub; gerippter Kürbis mit Stiel und Blatt; Rohwolle als lockiges Vlies mit Schnur; Schweine-/Rindfleisch in der Schale (Kotelett mit Fettrand und Knochen bzw. marmoriertes Steak, Folienglanz, Etikett); Hühnerfutter im Zinkeimer mit Körnermix und Schaufel; Kuhfutter als Heuballen (Halme, Garne); Schweine- und Schaffutter im Futtersack mit Farbband, Etikett und Tierbild; Brot mit Einschnitten und Mehlstaub; Butter halb in Goldfolie; Käselaib mit Keil und Löchern; Wollknäuel mit Wicklungen; Wollsocken flach (Bündchen, Ferse, Spitze); Pullover mit Rippen, Norwegerband, Kragen, eingeschlagenen Ärmeln.
- **Fisch:** Fische und Fischgerichte waren schon detailliert (v58) und bekommen das neue Licht/Kontur; neu gebaut: Reusenköder-Dose, Wurmdose (Erde, Würmer mit Ringeln), Abfalleimer (Zink, Gräte, Kopf).
- **Werkzeug:** Äxte (geschwungener Stiel mit Maser, geschmiedeter Kopf, helle Schneide), Kettensägen (Gehäuse, Griffe, Schwert mit Kettengliedern), Sichel (gedrechselter Griff, Klinge mit heller Schneide), Gießkanne (Drehkörper, Rohr, Brause, Bügel). Gleicher Bezugsrahmen wie vorher – die Mitarbeiter halten sie richtig (geprüft).
- **Blickwinkel-Ausnahmen** (`ITEM_VIEW`): Käse, Fladen flacher; Socken, Pullover steiler.
- **Einsammeln:** fliegende Waren nutzen schon `itemImg` (3D-Bildchen) – jetzt auch die Ausbeute-Leiste bei Paketen (vorher Emoji-Chips) und die Perle (vorher Emoji). Münzen, Kleeblätter und EP bleiben bewusst Symbole.
- Tests: `tests/icons.test.js` 5 Tests (neu: alle übrigen 3D-Waren heil und im Budget, Werkzeuge heil und im alten Rahmen).
- Dateien v122: `woodmodels.js`, `worldview.js`, `farmview.js`, `style.css`, `tests/icons.test.js`, `index.html`, `sw.js`.

## v121 (aufbauend auf v120) – Warenbildchen: neues Icon-Regelwerk für alle, Holzwaren komplett neu

**Wie die Icons entstehen (unverändert):** keine Bilddateien. Jedes Warenbildchen wird einmal zur Laufzeit aus dem 3D-Modell gerendert (`thumbOf` in `worldview.js`, Modelle in `FWM.item` / `woodmodels.js`), zugeschnitten und als Daten-URL zwischengespeichert. Angezeigt wird es in Lager (40 px), Rezepten (44 px), Warteschlangen (36 px), Chips/Aufträgen (22 px), Markt, Blasen und fliegenden Waren. Bestand: 88 Waren mit 3D-Bildchen (davon 22 Holz), dazu Köder, Trophäen, Werkzeuge, Tiere, Personal, Laden-Gebäude.

**Gemeinsames Regelwerk (wirkt auf alle Bildchen):**
- **Schärfe:** gerendert 288 px, ausgegeben 144 px (vorher 160 → 112 px). Glatte Kanten und scharf bei 3-facher Pixeldichte (40 px Zelle = 120 Gerätepixel; vorher wurde hochgezogen). Großer Zeichner (Trophäenwand) 576 → 288 px.
- **Licht fest zur Kamera:** Hauptlicht oben links leicht von vorn (`thumbSun`), egal wie das Modell gedreht ist → Oberseite hell, linke Fläche im Licht, rechte im Halbschatten. Gedämpfte Belichtung (keine ausgebrannten hellen Hölzer mehr), kühler Himmel, warmer dunkler Boden.
- **Freistellung:** dezente warme Comic-Kontur rundum (liest sich auf hellem und dunklem Grund) und ein weicher Kontaktschatten unter dem Gegenstand (an der Wand hängende Trophäen ohne). Beides einmal ins Bild gerechnet, kostet beim Anzeigen nichts.
- **Komposition:** Gegenstand füllt 86 % des Quadrats, leicht nach oben gesetzt (Platz für den Schatten). Blickwinkel einheitlich schräg von vorn oben; Ausnahmen nur, wo sonst das Wichtigste verdeckt wäre (`ITEM_VIEW`: Tür und Zaun von vorn, Schatulle steiler).
- **Dateigröße:** WebP, wo der Browser es schreiben kann (Chrome/Android ~9 KB je Bildchen, vorher PNG ~11 KB); sonst PNG (~30 KB).

**Holzwaren neu (alle 22 Artikel), eigener Bausatz in `woodmodels.js`:** `lumber` (Kantholz/Brett mit Fasen als Glanzkanten, Maserstreifen und dunklen Maserlinien, Hirnholz mit Jahresringen um den Kern, optional Sägespuren und Schwundriss), `logPiece` (Rinde je Holzart, Hirnholz mit Kern, Splint, Ringen, Rindenrand und Trockenriss), `splitPiece` (Scheit), `extrude`, `lathe`, `rope`, `band`, `jutesack`.
- Stämme: Birke weiß mit schwarzen Querstrichen, Kiefer rotbraun geschuppt, Buche glatt grau, Eiche dunkel gefurcht, Edelholz (Kirsche) rotbraun mit hellen Korkbändern und zwei kleinen Funkeln.
- Äste: krummes Bündel mit Zweigstummeln und hellen Schnittflächen, zweimal mit Hanfschnur gebunden.
- Holzreste: gefüllter Jutesack (Webstruktur, Naht, umgeschlagener Rand), Abschnitte schauen heraus und liegen davor.
- Brennholz: gestapelte Scheite mit Rinde, Spaltflächen und dreieckigem Hirnholz. Kaminholz: liegender oranger Netzsack mit Buchenscheiten, hinten zugebunden mit Etikett.
- Pfosten: geschälte, angespitzte Rundpfosten mit Beilflächen, Bund mit Spannband.
- Bretter (Bund, Spannbänder), Hobeldielen (Nut und Feder an der Stirn, glatter, blaues Band), Balken (sägerau, Kern mittig, Schwundriss), Kantholz (hell, gehobelt, blauer Prüfstempel), Eichenbohlen (unbesäumt: wellige Baumkante mit Rindenstreifen), Holzplatten (Sperrholz: Deckfurnier mit Maser, Lagen an der Kante).
- Kisten: Lattenkisten mit Eckleisten, Spalten, Grifflöchern. Europaletten: 3 Kufen, 9 Klötze mit Brandstempel, 3 Querbretter, 5 Deckbretter.
- Möbelteile: Buchenstuhl mit gedrechselten Beinen, Sitz mit Fase, Lehne mit Sprossen, ein loses Bein daneben. Tür: Kassettentür mit vier Füllungen, Messingdrücker und Bändern. Zaun: Latten mit Spitze, zwei Riegel, Z-Strebe. Schatulle: Kirschbaum, Deckel mit Fase und heller Einlegeader, Messingecken, Schlossblech.
- Item-IDs, Mengen, Preise, Lager-, Markt- und Rezeptlogik unverändert.
- Tests: neu `tests/icons.test.js` (alle 22 Holzartikel haben ein eigenes heiles Modell im Budget, sind als 3D-Bildchen eingetragen, deterministisch, Holzarten unterscheidbar; Bauteile zeigen nach außen).
- Dateien: `woodmodels.js`, `worldview.js`, `hunt.js` (Trophäen ohne Bodenschatten), `tests/icons.test.js`, `index.html`, `sw.js`.

## v120 (aufbauend auf v119) – Hirsch neu modelliert, Trophäen als Kopfpräparate je erlegtem Stück, Trophäenwand

**Technik (unverändert):** eigene WebGL2-Engine `gl3d.js`, alles prozedural im Code (Dreiecke mit Eckfarben, keine Texturen, keine Modelldateien). Der Hirsch war aus Kugeln, Quadern und Stäben gebaut (Kastenkopf, Stockbeine, Stockgeweih), die Trophäe nur ein Brett mit Symbol und hing nur an der Medaille.

- **Neue Bauweise `skin()` (`hunt.js`):** Haut über Querschnitts-Ringe mit Profil-Tabellen (Rückenlinie, Bauchlinie, Breite), weiche Normalen, Farbe je Ecke. Dazu `ring`, `ell` (Ellipsoid mit korrekten Normalen), `tube` (Röhre ohne Verdrehen), `curve`, `prof`.
- **Rothirsch:** durchgehender Rumpf (Widerrist, tiefe Brust, aufgezogener Bauch, runde Keulen), Muskelzeichnung über Farbe (Schulter/Keule heller, Flanke dunkler), Spiegel cremefarben mit Saum, Wedel; Träger mit dunkler Brunftmähne (unruhige Kante); Haupt mit Stirn, Augenbögen, Äser, dunklem Windfang, Nüstern, Lippenlinie, Augenring und Tränengrube; Augen dunkelbraun mit Glanzlicht und Lidwulst, im Schädel liegend; Lauscher mit hellem Inneren und dunklem Rand; Läufe mit Unterarm/Keule, Vorderfußwurzel- bzw. Sprunggelenk (Fersenhöcker), schlankem Röhrbein, Fesselgelenk, Fessel, Schalen und Afterklauen.
- **Geweih:** Rosenstock, Rose, Stange in Leierform, Augsprosse, ab 10 Enden Eissprosse, Mittelsprosse, oben Gabel oder Krone (12/14/16 Enden → 3/4/5 Kronenenden); Farbe dunkel am Ansatz, elfenbeinfarbene Enden, Perlung über Farbrauschen. Jede Stange etwas anders – fester Seed aus Enden, Güte und Variante `A.vr`.
- **Skelett unverändert** (Gelenkpunkte, Längen, Hals-/Kopfdrehpunkt) → Trefferzonen und Gangarten passen weiter. Haltung angepasst: Hals beim Sichern/Ziehen weiter vorn, Haupt leicht gesenkt; im Stehen leichte Gewichtsverlagerung.
- **Keiler** in derselben Bauweise: keilförmiger Rumpf mit Borstenkamm, Kopf mit Gebrech, Rüsselscheibe, Lichtern, Tellern, Gewehren und Haderern – Waffenlänge folgt den gespeicherten Zentimetern.
- **Dreiecke:** Hirsch ~5 800 (vorher ~1 100), Keiler ~3 400 (vorher ~500). Im Fernglas-Bild sind es insgesamt ~179 000 Dreiecke, der Hirsch macht also ~3 % aus. Gebaut wird einmal je Stück (~50 ms), danach zwischengespeichert.
- **Trophäe gehört zum erlegten Tier:** beim Einlagern entsteht ein Datensatz in `S.farm.hunt.coll` (Art, Medaille, Güte `s`, Variante `vr`, Zeit, Treffer, Entfernung). Enden/cm/Gewicht/Name folgen aus `s` genau wie im Revier; die Güte wird beim Erscheinen auf drei Stellen gerundet, damit Revier und Wand identisch sind. Lagerware bleibt `tro_<art>_<medaille>` (Preise, Markt, Plätze, alte Stände unverändert). `collSync()` hält Datensätze und Bestand gleich: Altbestand bekommt Datensätze aus dem Jagdbuch (sonst ein Musterstück der Medaille, als „Altbestand – Werte geschätzt“ markiert); verkauft der Markt eins, geht das schwächste Stück der Stufe.
- **Trophäenmodelle:** Eichenschild (Wappenform bzw. oval beim Fasan) mit gefaster Kante, Maserung, erhabenem Spiegel, Zierleiste (ab Silber Metall), Messingschild mit Gravur, Medaille am rot-weißen Band; Gold mit Beschlägen, Diamant mit Steinen. Hirsch und Keiler als Kopfpräparat aus denselben Bauteilen wie das lebende Tier (gleiches Geweih, gleiche Waffen), Fasan als Stoß aus langen gebänderten Schwanzfedern (Länge = cm, Anzahl nach Medaille).
- **Trophäenwand** (Lager → Trophäen, `farmview.js` ruft `HUNT.wallHTML/wallBind`): jedes Stück einzeln als großes Bild (eigener 320-px-Zeichner in `worldview.js`, Blick von vorn), Medaille, Name, Enden bzw. Länge, Wert; Antippen öffnet die Nahansicht mit langsam hin- und herdrehendem Präparat (eigener kleiner Zeichner, läuft nur solange offen), Bewertung, Gewicht, Treffer, Entfernung, Tag; Einzelverkauf genau dieses Stücks. Nach dem Erlegen zeigt die obere Leiste das Bild der Trophäe.
- `thumbOf(key, fn, o)` (worldview.js) kann jetzt Blickrichtung und großes Bild; Trophäen-Symbole im Lager/Markt werden von vorn gezeigt.
- Tests: `tests/hunt.test.js` 19 Tests (neu: Hirschteile heil/Vorderseiten außen/Läufe am Boden/Budget, Geweihplan und Determinismus, Keilerwaffen nach cm, zwölf Trophäen, Datensätze/Altbestand/Verkauf).
- Dateien: `hunt.js`, `worldview.js`, `farmview.js`, `style.css`, `tests/hunt.test.js`, `index.html`, `sw.js`.

## v119 (aufbauend auf v118) – Jagd: Atem + Schuss gleichzeitig, bewegtes Wasser, neue Trophäen

- **Atem halten und schießen:** Vorher beendete *jedes* `pointerup` (auch das des zweiten Fingers auf „Schuss“) den Atem, und der Schuss kam erst über `click`, den iOS bei gedrücktem ersten Finger oft verschluckt. Jetzt merkt sich „Atem“ seine eigene Finger-ID (`breathId`) und endet nur damit; „Schuss“ löst schon beim Auflegen aus (`pointerdown`), der folgende `click` wird unterdrückt (kein Doppelschuss). Fenster-Listener werden in `end()` wieder entfernt. Im Browser mit synthetischen Touch-Events getestet (ein Schuss, Atem bleibt, endet nur mit Finger 1) – nicht auf einem echten Handy.
- **Wasser:** Fragment-Shader (`gl3d.js`, Wasserzweig): zusätzlich zu den Kräuselnormalen wandern langsame helle/dunkle Wellenbänder über die Fläche und vereinzelte Lichtfunken. Gilt für Bach, Teich, See; ruhig, kein Mehraufwand an Geometrie.
- **Trophäen (`hunt.js`, `trophyMesh`):** Eichenschild mit gewölbtem Kopf, dunklem Rahmen und Maserung; Messingschild mit Gravurzeilen und Schrauben; darunter Medaille am rot-weißen Band. Hirsch: Schädelplatte mit Geweih (Enden wachsen mit der Stufe); Keiler: zwei gebogene Waffen auf Schädelplatte; Fasan: Federfächer mit Binden. Stufen: Bronze, Silber (Eckbeschläge), Gold (mehr Beschläge, goldenes Schild), Diamant (Edelsteine, Diamant in der Medaille).
- Test: `tests/hunt.test.js` neu „Trophäen (v119)“ (15 Tests).
- Dateien: `hunt.js`, `gl3d.js`, `tests/hunt.test.js`, `index.html`, `sw.js`.

## v118 (aufbauend auf v117) – Wildwiese: eckiger heller Fleck weg

- **Fehler:** Auf der Wildwiese (Karte) lag ein großer, eckiger, heller Fleck mit geraden Kanten. **Ursache:** `HUNT.ground` (`hunt.js`) wählte die Wiesenfarbe je Gitterpunkt des 4er-Bodenrasters hart zwischen drei deutlich verschiedenen Grüntönen (`0xa6c95a` / `0x93c452` / `0x86ba4a`); die Dreiecke des Rasters zeichneten daraus kantige Flächen.
- **Fix:** ein gleichmäßiger Wiesenton mit sanfter Schwankung (`0x8cc04e` bis `0x96c654`), weiche Ränder. Gras und Blumen liefern weiter die Lebendigkeit.
- Dateien: `hunt.js`, `index.html`, `sw.js`.

## v117 (aufbauend auf v116) – Fernglas/Zielfernrohr: Bäume neu und realistischer (alle fünf Arten)

**Warum es vorher nicht passte:** Das v113-Nahsicht-Modell galt nur bis 80 Einheiten vom Hochsitz. Im Fernglas (7-fach) sieht man meist weiter, dort kamen wieder die groben Standardbäume. Die Birke hatte gar kein Nahsicht-Modell. Und auch das v113-Modell bestand aus wenigen großen Laubklumpen, die vergrößert wie Felsflächen wirkten.

- **`woodmodels.js` `treeRv(sp, sz, v)` komplett neu** (Buche, Eiche, Birke, Kiefer, Fichte; Kirsche bleibt Standard):
  - Kronen aus vielen kleinen Blättern (Rauten) bzw. Nadeln statt großer Klumpen. Die Licht-Normalen zeigen von der Kronenmitte nach außen, so wird die Krone wie ein Volumen beleuchtet. Ein dunkler, weich schattierter Kern mit denselben Beulen verhindert Durchblick und schwarze Löcher.
  - Stämme als gewachsene Röhren mit Wurzelanlauf, Furchen (Eiche, Kiefer unten), weichen Normalen und leichter Biegung. Äste als gebogene Röhren, Eiche mit Knick.
  - **Birke:** weiße Rinde mit feinen schwarzen Querstrichen, dunkler rissiger Fuß, dünne Äste, lichte Krone mit hängenden Zweigen.
  - **Kiefer:** unten graubraun gefurcht, oben fuchsrot; flache Nadelpolster an krummen Ästen; tote Aststummel.
  - **Fichte:** 15–18 Astquirle mit hängendem Nadelvorhang, fein gezackt, helle Oberseite und Triebspitzen; Leittrieb.
  - Gleiche Höhe, Farben und Fußpunkt wie das Standardmodell. Etwa 4 000–6 400 Dreiecke je Baum, Bauzeit je Modell ca. 10–30 ms (Rechner).
- **`hunt.js` Detailstufen:** Feine Modelle werden je Art und Variante einmal gebaut (bei Größe 3) und auf die Baumgröße skaliert, also 15 Modelle statt 45. Im Fernglas, im Zielfernrohr und bei der Bergung sind **alle** Bäume fein; der enge Sichtkegel schneidet fast alles weg, gezeichnet werden nur die sichtbaren. Mit bloßem Auge bleiben sie fein bis 40 Einheiten (`TREE_HI`), weiter weg Standard. Gebaut wird nach und nach über eine Warteschlange (≤ 8 ms je Bild, nahe Bäume zuerst) – kein Hänger beim Wechsel ins Fernglas. Fehlertolerant: scheitert ein Modell, bleibt der Standardbaum.
- Gemessen im Test-Browser: Fernglas 86 000–174 000 Dreiecke je Bild, bloßes Auge ca. 70 000.
- Test `tests/hunt.test.js`: fünf Arten, Höhe, NaN, Normalen, Dreiecksbudget.
- Dateien: `woodmodels.js`, `hunt.js`, `tests/hunt.test.js`, `index.html`, `sw.js`.

## v116 (aufbauend auf v115) – Baumstumpf wird beim Antippen nicht mehr riesig

- **Ursache:** Beim Antippen wippt ein Baum kurz (`worldview.js`, Wipp-Schleife). Sie setzte danach den Maßstab auf `t.s` zurück. Ein per Säge gekappter Stumpf (`t.cut`) wird aber mit `t.cut.sc` skaliert, sein Mesh ist darauf gerechnet. Nach dem Tippen wuchs er daher auf den Maßstab des ganzen Baums.
- **Fix:** Die Wippschleife nimmt für Sägeschnitt-Stümpfe `t.cut.sc` als Grundmaßstab. Nur `worldview.js`, `index.html`, `sw.js`.

## v115 (aufbauend auf v114) – Gefängnis-Feinschliff und saubere Entlassung

- **Sitzpose:** Oberschenkel liegen jetzt flach auf der Matratze (Hüfte `SIT_Y = UM + 0.115`), Figur sitzt an der Bettkante (`SEAT` x −0,3 / z −0,93, leicht gedreht), Unterschenkel hängen an der Kante herunter, Hände ruhen auf den Oberschenkeln.
- **Kopf:** glatte Low-Poly-Glatze wie die Standardfiguren; Brauen-/Mundstriche und Bart entfernt (die dunklen Ringe waren Haar und Striche).
- **Licht/Farben:** hellere Ziegel, Sockel, Fliesen, Matratze und Decke; wärmeres, stärkeres Sonnenlicht und hellerer Himmel. Neu `raysMesh()`: vier gelbe God-Ray-Streifen zwischen den Gitterstäben zusätzlich zum Lichtkegel, Farbe und Stärke wandern mit der Tageszeit.
- **Details:** Tasse mit aufsteigendem Dampf auf dem Boden, Buch auf dem oberen Bett (`cupMesh`, `bookMesh`). Tropfhahn, Maus, Staub waren schon da.
- **UI:** Kalenderfelder passen zum Balken: gleiche Amber-Farbe mit dunklem ✕ statt rot, 14 Spalten genau unter den 14 Strichen im Balken, aktueller Tag pulsiert amber, Tagzahl in „Tag **6** / 14 (36 %)“ amber.
- **Hintergrundprozesse:** `jailServe` rechnet mit Zeitbudget (10 ms je Bild statt fester 400 Schritte) und speichert alle 2 s. Während der Zelle (`body.jl-open`) pausieren Farmszene (`farmLoop`) und Karte (`mapRedraw`). Bei Entlassung ruft `jailRefresh()` HUD, Farmszene, Farm-UI, Karte und `save()` auf (auch beim Klick auf „Zurück an die Arbeit“).
- Dateien: `jail.js`, `snus.js`, `farmview.js`, `game.js`, `style.css`, `tests/jail.test.js`, `index.html`, `sw.js`.

## v114 (aufbauend auf v113) – Haft: 3D-Zelle als Wartebild (neu `jail.js`)

**Vorher:** Beim Haftantritt kam nur ein Dialog mit grauem Balken (2,8 s). **Jetzt** eine eigene 3D-Szene (eigene Engine `gl3d.js`, nicht Three.js), die das Haftfenster füllt:
- **Zelle:** Ziegel- und Sockelwände, Fliesenboden, Doppelstockbett, Tisch mit Büchern, Waschbecken/Klo aus Edelstahl, Regal mit Pflanze, Gitterwand als Tür, Poster, Bild, Zettel, Rohr mit Ventil. Fenster in der linken Wand: der Lichtstrahl fällt schräg über das Bett, die Gitterstäbe werfen echte Schatten auf den Boden (Sonnen-Schattenkarte).
- **Figur:** sitzt im oberen Bett, Beine baumeln. Hautfarbe, Haarfarbe und Bart kommen aus dem Charakter des Spielers (Frau: Zopf, Mann: Bürstenschnitt). Teile einzeln animiert: Atmen, Beine, Kopf, Arme. Posen im Wechsel: Hände auf den Knien, rechts/links schauen, seufzen, strecken, grübeln, zum Fenster schauen; Antippen = winken.
- **Damit es nicht langweilig wird:** Ratte „Hubert“ kommt aus dem Mauseloch, knabbert, schaut sich um und flieht, wenn man sie antippt; Wasserhahn tropft (Spritzer); Staub tanzt im Lichtstrahl; Vogel fliegt am Fenster vorbei; Wärter mit Taschenlampe läuft draußen am Gitter vorbei; Lampe flackert; Himmel und Licht wechseln über die Haft von Morgen zu Abend. Antippbar: Figur, Ratte, Hahn, Fenster (Sprechblase).
- **Fortschritt:** Balken, „Tag n / 14 (x %)“, 14 Kalenderfelder (je Tag ein rotes ✕) und eine Strichliste an der Rückwand (je Tag ein Kreidestrich, Fünferbündel, Kreidewölkchen). Dazu live Kontostand und „Ohne dich zugestellt“ sowie wechselnde Tipps.
- Ablauf in `snus.js`: `jailServe` zeigt die Szene (`jailScene`), Mindestdauer `JAIL_MS` = 9 s (vorher 2,8 s; Spielzeit läuft im Schnelldurchlauf mit), am Ende Blitz, dann wie bisher „Entlassen“. Ohne WebGL 2 bleibt der alte Balken.
- `woodmodels.js` `person()`: neue Optionen `noLegs`, `noArms` (Teile einzeln animieren).
- `style.css`: `.jl3`, `.jl-*` (Vollbild, Titelschild, Balken, Kalender, Tipp).
- Test `tests/jail.test.js` (6 Tests: Modelle ohne NaN, Dreiecksbudget, Strahl im Raum, Figur sitzt, Texte, Aussehen); alle Suiten grün.
- **Geprüft** im Software-Browser (Hochformat 430×900 und Querformat 1100×800): Szene, Posen, Fortschritt, Antippen von Figur/Hahn, Übergang zu „Entlassen“. **Nicht geprüft:** echtes Handy (Bildrate: Zelle ca. 4 700 Dreiecke, Schatten 1024 px, Pixeldichte max. 1,75), Ton gibt es keinen.

## v113 (aufbauend auf v112) – Bäume im Fernglas: eigenes Nahsicht-Modell

**Ursache:** Im Fernglas (7×) und Zielfernrohr sieht man die Bäume stark vergrößert. Die Standardmodelle haben nur wenige große Flächen: Kronen wie Felsbrocken, Fichte ein glatter Kegel, Stämme wie Kisten (7 Ecken, starre Streifen, lose „Marken“-Latten an der Kiefer). Die Birke war schon feiner und fiel deshalb nicht auf.

**Behebung (`woodmodels.js` `treeRv`, `hunt.js`):**
- Neues Modell `FWM.treeRv(art, größe, variante)` für Kiefer, Fichte, Buche, Eiche (Birke bleibt `tree`). Gleiche Höhe und Farben wie `tree`.
  - Stamm: Wurzelanlauf, Rillen, Farbverlauf (Kiefer unten grau, oben fuchsrot).
  - Äste mit Zweig sichtbar; Kronen aus 20–30 kleinen Laubpolstern (oben hell, unten dunkel) statt weniger Klumpen.
  - Fichte aus Quirlen hängender Astfächer um einen dunklen Kern, oben kürzer und aufrecht.
  - Kiefer: kurze Aststummel statt loser Latten, flache Nadelpolster mit hängenden Büscheln.
- `hunt.js` `revBuild`: Bäume bis `TREE_HI` = 80 Einheiten vom Hochsitz nutzen `treeRv`, weiter entfernte das Standardmodell (Nebel ab 70). Etwa 530–850 statt 230–560 Dreiecke je Baum.
- Test `tests/hunt.test.js`: alle Arten/Größen ohne NaN, Höhe ±20 %, Dreiecksbudget, Birke unverändert (14 Tests grün; alle Suiten grün).
- **Geprüft** im Software-Browser: Fernglas-Bilder mit Eiche, Buche, Fichte, Kiefer (deutlich feiner). **Nicht geprüft:** echtes Handy (Bildrate mit mehr Dreiecken, ggf. `TREE_HI` senken), Zielfernrohr-Ansicht, Nachtlicht.

## v112 (aufbauend auf v111) – Lager: Kleidung/Frisuren je Beruf, gebeugte Arme, Werkzeugplane, realistischer Pausenübergang

**Aussehen (`woodmodels.js`, `team.js`):**
- Arme im Sitzen jetzt **angewinkelt** (Oberarm, Unterarm nach vorn, leicht nach innen; `bentArm`, `armSit`) statt gestreckt.
- Kleidung je Beruf (`STAFF_LOOK`): Landwirt Latzhose + Strohhut, Pfleger Weste ohne Hut, Hofmeister Schürze + Bäckermütze, Fahrer Warnweste + Kappe + Cargotaschen, Holzfäller Karohemd + Helm, Säger Lederschürze + Helm, Mechaniker Overall ohne Hut, Fischer Wathose + Strickmütze, Fischwirt Kittel + Schürze ohne Hut. Dazu Taschen (`cargo`, Schürzen/Westen) und Stiefel.
- **Frisuren** (`hairdo`): wo kein Hut passt, sieht man Haare (verschiedene Schnitte/Farben/Bärte, Hauttöne). Annahme: „Friseur“ = Frisuren.

**Lager (`camp.js`):**
- Der Korbsessel ist entfernt.
- **Werkzeugplane** (Segeltuch, 4 Randsteine) vor der Feuerstelle (`tarp`); je Sitzplatz eine eigene Ablagebahn (`LANES`, `toolSpot`).
- Weg zum Platz: Tor → Standreihe → Werkzeug **ablegen** (Stopp „drop“, beugt sich) → Ring/Bogen → Hinsetzen. Weg zurück: aufstehen → Standreihe → Werkzeug **aufnehmen** (Stopp „pick“) → Tor.
- Lücke im Randsteinkranz („Zugang“) vor der Plane.

**Ablauf (`team.js`):**
- `staffGo` kennt Stopps (Verweilzeit als Wegäquivalent `STAFF_STOP_W`=4), `staffRoutePos` liefert Verweilfortschritt; im Verweilen beugt sich die Figur (`rx`, `y`), Arm greift zur Plane.
- Werkzeug in der Hand wird beim Ablegen unsichtbar und liegt als Bodenknoten (`gt`) auf der Plane; beim Aufnehmen umgekehrt.
- Weiches Hinsetzen/Aufstehen (`staffSitDown`, `staffRise`).
- Mittagsende: Arbeit startet unmittelbar (`s.work`/`s.jobEnd` gesetzt), kein langes Herumsitzen mehr.
- `tests/camp.test.js`: Standreihe, neun eigene Bahnen, Stopps drop/pick (10 Tests grün; alle Suiten grün).
- **Geprüft** im Software-Browser: Stopp je Mittagsjob, Werkzeuge liegen auf der Plane und sind danach wieder in der Hand, Beugen im Einzelbild, Outfits in der Reihe. **Nicht geprüft:** Aufstehen/Arme in Nahaufnahme, Gedränge bei allen 9 gleichzeitig, echtes Handy.

## v111 (aufbauend auf v110) – Wild auf der Wildwiese, saubere Bäume im Fernglas

**Wild auf der Wiese (`hunt.js`, Abschnitt „Wild auf der Wildwiese“):**
- Steht der Hochsitz und ist Wild im Revier (Punkte oben), zieht hin und wieder ein **Hirsch oder Keiler** über die Wildwiese auf der Karte (Abstand 55–125 s, erstes Mal nach ca. 10 s). Tagsüber meist Hirsch, abends gemischt, nachts Keiler. Das Tier tritt vom Waldrand ein (blendet ein), äst 25–60 s mit kleinen Schritten und zieht auf der anderen Seite wieder ab. Das Hochsitz-Symbol zeigt 🦌/🐗, solange eines da ist.
- **Aufstieg:** genau dieses Tier steht dann im Revier (gleiche Art, gleiche Güte/Trophäenwerte, gleicher Winkel zum Hochsitz, gleiche Blickrichtung, äst oder geht wie vorher). Kein zusätzlicher Zufallsspawn gleich danach.
- **Abstieg:** lebt es noch und ist ruhig, steht es wieder auf der Wiese. Wurde es geschossen, ist geflüchtet oder aufgescheucht, ist es fort (neues Wild nach der Pause).
- Umrechnung Wiese ↔ Revier: `toRv`/`fromRv` (Winkel relativ zur Richtung Mitte→Hochsitz, Randfaktor bleibt, Revier-Ellipse). `spawn(k, enter, pre)` nimmt eine Vorgabe.
- Test: `tests/hunt.test.js` (Rückweg trifft den Ausgangspunkt, Tier im Feld, Hochsitz-Seite näher als Gegenseite).

**Bäume im Fernglas:**
- Ursache 1: Tiefenpuffer. Die Kamera sah im Revier von 0,35 bis 300 – in der Ferne zerreißen dann nah beieinander liegende Flächen (Stamm/Manschette, Rindenflecken). Jetzt `c.near` je Ansicht: Fernglas/Zielfernrohr 3,2, Ich-Sicht 1,1, sonst 0,6 (`hunt.js`, `step`).
- Ursache 2: Geometrie. Kiefer: die dunkle Manschette am Stammfuß war oben schmaler als der Stamm → der Stamm stach zackig heraus (jetzt 0,9 r). Birke: schwarze Rindenflecken lagen teils im Stamm → jetzt knapp außerhalb der Rinde (`woodmodels.js`). Das gilt auch für die Bäume im Wald der Karte.
- **Nicht geprüft:** echtes Handy (der Fehler zeigte sich im Testbrowser nicht eindeutig, die Behebung zielt auf die zwei sicheren Ursachen); die Tiefe-Ursache hängt von der Tiefenpuffer-Bitzahl des Geräts ab.

## v110 (aufbauend auf v109) – Luckybox: Gewinnchancen oben als Balken + Kacheln

- `lucky.js` `openLucky`: Die Chancen stehen jetzt **direkt unter Titel und Unterzeile** statt als Textzeile ganz unten. Oben ein Balken, dessen vier Abschnitte so breit sind wie die Chance (Gewöhnlich/Selten/Episch/Legendär in den Seltenheitsfarben), darunter vier Kacheln mit Prozentzahl in Farbe und Name. Werte kommen weiter aus `LUCKY_ODDS` (normale und goldene Box).
- `style.css`: `.lk-odds`, `.lk-oddbar`, `.lk-oddlist`. Die alte Textzeile unten ist entfernt.
- **Nicht geprüft:** echtes Handy.

## v109 (aufbauend auf v108) – Mitarbeiter laufen auf Wegen, nicht durch alles hindurch

Wegsuche der Mitarbeiter (`team.js` `navBuild`, A* auf dem 1×1-Raster):
- **Wege lohnen sich:** quer durch den Wald kostet 2,6, über die Wiese 1,4, im Hof 1,1, Wege und Straße 0,45/0,6 (vorher alles außer Wegen 1). So nehmen die Leute den Weg, solange der Umweg nicht riesig ist. Gemessen: Hof → Wald hinter der Brücke 97 % auf Wegen, Hof → Sägewerk 85 %, Hof → Hochsitz 72 %.
- **Brücken:** über einen Bach geht es nur noch über die Planken (±3,3 längs, ±0,85 quer, Hauptbrücke und Seebach-Brücke). Vorher war ein Kreis von 2,4 um die Brückenmitte frei, deshalb liefen Leute neben dem Geländer durchs Wasser.
- **Hindernisse:** Kulissenbäume (Stamm), größere Büsche, Baumstümpfe, Totholz, Wurzeln und der Hochsitz/Bauplatz sperren ihr Feld. Wegfelder werden nie gesperrt.
- Der Raster-Schlüssel (`navKey`) enthält jetzt auch Kulissenbäume, Büsche und Hochsitz, die Suche darf länger rechnen (300 000 Schritte, Schätzung mit 0,4).
- **Geprüft** im Software-Browser: Wege zwischen Hof, Wald, Sägewerk, Schuppen, Fischerei und Hochsitz (Anteil auf Wegen, kein gesperrtes Feld, Bach nur auf der Brücke), Route über die Brücke im Bild, 4 Stunden Arbeit simuliert ohne Fehler; alle Tests grün. **Nicht geprüft:** echtes Handy (Rechenzeit der Wegsuche dort), jeder einzelne Arbeitsort.

## v108 (aufbauend auf v107) – Jagd: Bau des Hochsitzes, weites Revier (180 m), strengere Jagd, Hirsch mit Gelenken, Kino-Einsammeln

Alles in `hunt.js`, dazu eine kleine Engine-Erweiterung in `gl3d.js`. Weiterhin kein Three.js: gezeichnet wird mit `gl3d.js` (WebGL im HTML5-Canvas), die Jagd-Oberfläche ist DOM/CSS/SVG.

**Freischaltung und Bau**
- Der Hochsitz taucht erst auf, wenn das **Sägewerk fertig repariert** ist (`sawRepaired()`). Vorher gibt es keinen Turm, keine Blase, keinen Lager-Reiter „Trophäen“ und keine Markt-Karte.
- Danach ruft **Förster Bruno Wendt** an („Ein Hochsitz für die Wildwiese“, Knopf „Zum Bauplatz“). An der Wildwiese steht ein abgesteckter **Bauplatz** (Pflöcke, Flatterband, Stämme, Bretter, Schild) mit Blase 🔨.
- **Material:** 6 Kiefernstämme, 8 Balken, 30 Bretter, 8 Holzpfosten, 10 Bündel Äste (`HUNT.NEED`).
- „Hochsitz bauen“ nimmt das Material, Staubwolken, der Hochsitz **wächst aus dem Boden** und federt nach, +40 EP.
- Wer in v107 schon gejagt hat, behält seinen Hochsitz.

**Weites Revier in der Ich-Perspektive**
- Die Wiese auf der Karte bleibt so klein wie sie ist. Beim Hinaufsteigen fährt die Kamera auf die Plattform, **blendet ab** und steht im **Revier**: einer großen Wiese (Ellipse 88 × 64 Einheiten) mit Waldrand, Einzelbäumen, Gras, Farn, Steinen und Totholz, dahinter die Aussicht aus v101.
- Das Revier liegt weit außerhalb der Karte (x −470) und wird nur in der Ich-Perspektive gebaut: Instanzen kommen hinzu und werden beim Verlassen wieder entfernt.
- `gl3d.js`: die Kamera darf nahe und ferne Ebene selbst setzen (`cam.near`, `cam.far`), damit man 300 Einheiten weit sieht und trotzdem die Brüstung vorn im Bild hat.
- Das Wild steht **150–240 m** entfernt (Anzeige: Einheiten × 4).

**Schwierigere, realistischere Jagd**
- **Wenig Wild:** höchstens 2 Tiere, Bestand 2, alle 120 Spielminuten kommt eins zurück. Oft steht anfangs nichts da: das erste kommt nach 12–34 s aus dem Wald, das zweite deutlich später.
- **Zielfernrohr 4×/8×/12×**, Haltepunkte im Absehen wachsen mit dem Zoom (1 Punkt = 2 mrad).
- **Schwanken** spürbar stärker. Ohne „Atem anhalten“ ist ein Treffer auf 180 m Glückssache, mit angehaltenem Atem (höchstens 3 s) liegt das Absehen fast ruhig. Danach zittert es kurz.
- **Wind** in Stärke und Richtung, mit Böen. Er versetzt das Geschoss; der Entfernungsmesser sagt „4,6 m/s von hinten links · 0,5 Pkt. links halten“. Weht der Wind vom Hochsitz zum Tier, wittert es dich langsam.
- **Geschossflugzeit** (820 m/s): laufendes Wild muss man vorhalten.
- **Strenge Zonen:** erlegt wird nur mit **Herz** (Diamant möglich), **Lunge**, **Träger** (höchstens Gold) oder **Kopf** (höchstens Silber, Haupt beschädigt). **Körper- oder Laufschuss:** das Stück flüchtet krank in den Wald und ist verloren, keine Trophäe, Bestand −1. Lunge und Herz sind kleiner als in v107.
- Die Nachsuche aus v107 entfällt.

**Hirsch mit Gelenken**
- **Aufbau:** Rumpf, Träger (Hals), Haupt mit Geweih, zwei Lauscher, Wedel, vier Läufe aus Ober- und Unterteil (Knie).
- **Gänge:** im Schritt mit Viertaktgang, im Galopp mit Flugphase; der Übergang richtet sich weich nach dem Tempo.
- **Federn** (kritisch gedämpft) für Hals, Kopf, Lauscher und Wedel: alles bewegt sich weich, beim Aufschrecken schnell.
- **Äsen:** Hals tief, Äser am Boden, Zupfen, ab und zu ein Schritt.
- **Aufschrecken:** Ruck, Kopf hoch, Blick und Lauscher zum Geräusch, Wedel hoch, starr sichern.
- **Ohrenspiel:** jede Lauscher zuckt für sich.
- **Vorsichtiges Ziehen** mit Pausen, ein Vorderlauf bleibt dabei in der Luft.
- **Flucht:** Absprung, schneller Galopp (10,5 Einheiten/s) mit Haken quer über das Feld, weißer Spiegel unter dem hochgestellten Wedel.

**Kino-Einsammeln, freie Sicht**
- **Ablauf:** Abblende, Schnitt nah ans Stück, dann fährt die Kamera in 5,5 s zurück in die **Totale** (Hirsch 8,6 Einheiten) und schwenkt dabei um das Stück.
- **Funken:** goldene Lichtpunkte steigen auf.
- **Medaille:** blendet groß mit drehenden Lichtstrahlen auf und wandert dann weg.
- **Leisten statt Karte:** oben Name, Trophäe und Gewicht, unten Treffer, Entfernung, Bewertung, Wert und „Trophäe ins Lager legen“. Die Mitte mit dem Tier bleibt frei.
- Danach Abblende und zurück auf den Hochsitz.

**Geprüft** im Software-Browser:
- Vor der Freischaltung ist nichts zu sehen. Danach kommen Anruf, Bauplatz, Material, Bau-Animation und der Lager-Reiter.
- Im Revier: Fernglas (184 m), Zielfernrohr mit Windhinweis, Lungenschuss Hirsch, Herzschuss Keiler (Gold) und Hirsch (Diamant).
- Medaillen-Aufblendung, Leisten, Trophäe im Lager, Weichschuss mit Verlust, Verlassen (Kamera wieder normal).
- Hirsch-Posen von der Seite (Äsen, Aufschrecken, Ziehen, Pause mit gehobenem Lauf, Galopp).
- Tests: `tests/hunt.test.js` (12) und alle alten grün.

**Nicht geprüft:** auf einem echten Handy (Bildrate im großen Revier, Touch), Töne, Jagd bei Nacht und Regen, Fasan-Überflug im Revier.

## v107 (aufbauend auf v106) – Jagd: Hochsitz an der Wildwiese, Trophäen

Neues Minispiel nach dem Vorbild „The Hunter: Call of the Wild“, im Low-Poly-Stil und in unserer eigenen Engine (`gl3d.js`, kein Three.js). Alles steckt in der **neuen Datei `hunt.js`** (`HUNT`).

**Welt**
- **Wildwiese** westlich vom Sägewerk (Mitte x −78, z −24, Radius ~14), am Ostrand ein **Hochsitz** aus Rundholz (vier Stämme, Kreuzstreben, Kanzel mit Dach, Gewehrauflage, Leiter).
- Auf der Wiese stehen keine Bäume und Büsche, Gras und Blumen schon. Fällbare Bäume dort werden einmalig entfernt (`F.v107h`).
- Hochsitz antippen → Fenster mit Wildbestand, Schüssen, Trophäen, „Hinaufsteigen“. Über dem Turm eine Blase 🔭 mit der Zahl der Tiere. Voraussetzung: der Wald ist freigeschaltet.

**Ich-Perspektive** (wie beim Sägen, `FV.fp`)
- Die Kamera fährt in 1,7 s auf die Plattform. Ziehen = Umsehen, die Brüstung ist unten im Bild. Fernsicht mit der Aussicht aus v101.
- **Fernglas** (4×): Doppelkreis mit weichem Rand. Wild in der Mitte wird nach 0,35 s **gespottet**: Art, Entfernung, Verhalten, mögliche Medaille, Sammlerwert. Danach eine Markierung über dem Tier.
- **Zielfernrohr**: Mil-Dot-Absehen, roter Punkt, Zoom 2×/4×/8× (Knopf oder Mausrad), Entfernungsanzeige. Das Bild schwankt leicht. **Atem halten** (Knopf gedrückt halten oder Leertaste) beruhigt es für höchstens 3 s, danach wackelt es kurz stärker.
- **Schuss**: Strahl durch die Bildmitte gegen **Trefferzonen** in Tierkoordinaten (Herz, Lunge, Kopf, Träger, Körper, Lauf). Stämme halten die Kugel auf. Knall mit Echo, Repetieren, Mündungsrauch, Rückstoß.

**Wild** (2–4 Tiere, je nach Bestand)
- **Rothirsch**: äst, sichert (Kopf hoch), zieht über die Wiese, flüchtet bei Schuss und schnellem Umsehen. Geweih mit 6–16 Enden je nach Güte.
- **Keiler**: bricht im Boden, wechselt unberechenbar die Richtung, sehr wachsam.
- **Fasan**: pickt auf der Wiese, fliegt bei Unruhe im Bogen über die Baumkronen. Ab und zu Überflüge, auch im Flug schießbar.
- Bestand: höchstens 4, jede Trophäe kostet eins, alle 90 Spielminuten kommt eins zurück. Geflüchtetes Wild kommt wieder.

**Treffer und Trophäe**
- Herz/Lunge/Kopf/Träger: das Stück liegt nach wenigen Metern, dann fährt die Kamera hin und **kreist um das Stück**.
- Weichschuss (höchstens Silber) und Laufschuss (höchstens Bronze): es flüchtet und hinterlässt eine Schweißfährte. „🩸 Nachsuche“ geht die Fährte ab bis zum Stück.
- Vorbei: das Wild auf der Wiese flüchtet.
- **Trophäen-Karte**: Tierart, Gewicht, Treffer und Entfernung, Trophäe (z. B. „12-Ender Geweih“, „Keilerwaffen · 18 cm“, „Fasanenfeder · 50 cm“), Bewertung, Medaille (Bronze/Silber/Gold/Diamant), Sammlerwert. Knopf „Trophäe ins Lager legen“, bei voller Trophäenwand gleich verkaufen.
- Medaille aus Güte (0–1) plus Bonus für kritische Treffer: Diamant ≥ 0,9, Gold ≥ 0,72, Silber ≥ 0,5.

**Lager und Markt**
- Neuer Lager-Reiter **🏆 Trophäen** (`FSTORE.troph`, 24 Plätze, ausbaubar), zwölf Trophäen (Art × Medaille) mit eigenem 3D-Bildchen (Brett mit Geweih, Waffen oder Feder, Medaille).
- Sammler zahlen den **vollen Wert** (`farm.js` `farmSellPrice`), im Lager und auf dem **Markt** (Karte „Trophäen-Sammler“ über den Fahrzeugen). Preise: Hirsch 180/420/950/2.600 €, Keiler 120/300/700/1.900 €, Fasan 40/90/200/520 €.

**Nebenbei**
- Telefonat-Arm aus v106 neu gebaut: Oberarm hängt, Unterarm angewinkelt zum Ohr, Handy mit heller Rückseite (`team.js` `staffPhoneArm`).
- Kamera-Fahrten anderer Ereignisse (z. B. Schatz-Intro) unterbrechen die Ich-Perspektive nicht mehr (`farmFocusXZ`, `farmFocus`).
- Leere Lager zeigen den Hinweis über die ganze Breite.

**Geprüft** im Software-Browser: Hochsitz und Wiese in der Welt, Antippen, Kamerafahrt, Fernglas mit Spotten, Zielfernrohr, Herzschuss mit Diamant-Trophäe, Weichschuss mit Nachsuche, Fasan im Flug, Fehlschuss mit Flucht, Ziehen zum Umsehen, Lager-Reiter, Markt-Karte, Verlassen. Neue Tests `tests/hunt.test.js` (8) und alle alten Tests grün. **Nicht geprüft:** auf einem echten Handy (Bildrate, Touch), Töne (im Testbrowser stumm), Jagd bei Nacht und Regen.

## v106 (aufbauend auf v105) – Sprechblasen über dem Kopf, Telefonat mit dem Büro

**Sprechblase „Mittagspause“** (`team.js`, `style.css`): kleine Kapsel mit Symbol statt des großen weißen Quadrats. Sie sitzt über dem Kopf **der angetippten Figur**, folgt ihr jedes Bild und blendet nach etwa 3 Sekunden aus.
**Antippen am Feuer:** Sitzende werden mit ihrer wirklichen (niedrigeren) Höhe getroffen und nur, wenn sie sichtbar sind. Vorher traf ein Tipp ins Feuer eine Figur weiter vorn (außerhalb des Bildes), und die Blase stand mitten im Feuer.
**Telefonat mit dem Büro:** Bekommt eine Kraft einen Auftrag, ruft das Büro an und erklärt ihn, **10 Spielminuten** lang. Die Figur steht dabei am Platz und hält ein Handy ans Ohr (Arm mit angewinkeltem Ellbogen, `staffPhoneArm`), wippt leicht, Werkzeug ist weg. Danach geht sie los. Der Text in der Team-Liste heißt dabei „Telefonat mit dem Büro“.
**Antippen im Telefonat:** kleine Blase „Im Telefonat“ (📞) über der Figur, kein Winken.
**Regeln:** nur bei Aufträgen (nicht Mittagspause, Heimweg oder eigener Plan); derselbe Auftrag wird innerhalb von 10 Spielstunden nur einmal angerufen. Technisch: `staffGo` verschiebt `t0`/`t1` um `STAFF_CALL`, `job.cT1` markiert das Ende des Anrufs, `staffCalling(s)`.
- **Geprüft** im Browser: Blase über der richtigen Figur (jede Person am Feuer liefert beim Tippen die eigene Blase, ein Tipp ins Feuer trifft keine), Telefonierhaltung von mehreren Seiten, Auftrag startet nach 10 Min, Blase blendet aus; Tests grün. **Nicht geprüft:** Handy in Bewegung (Wippen), Zusammenspiel mit vielen Aufträgen über einen ganzen Spieltag, echtes Handy.

## v105 (aufbauend auf v104) – Fuhrpark-Schuppen vor dem Hof, Fahrzeuge fahren nicht mehr durch den Hof

Die Lieferfahrzeuge fuhren durchs Hoftor mitten über den Hof zum Schuppen. Jetzt:
- **Schuppen** steht vor dem Hof an der Straße (Grasstreifen zwischen Hofmauer und Straße, östlich vom Tor; Kachel 30 / 31, Welt x 14…17, z 15…17), Öffnung zur Straße (`farm.js` Startstand).
- **Fahrzeuge** kommen von der Straße direkt in den Schuppen und fahren von dort wieder auf die Straße. Der Weg durch Tor und Hof ist weg (`farmview.js` `farmSyncVehicles`, Stellplätze etwas weiter vorn).
- **Fest:** der Schuppen lässt sich nicht mehr verschieben (`FFIXED` in `farmdata.js`), sonst stünde er wieder im Hof.
- **Alte Spielstände:** ziehen einmalig um (`F.v105s` in `erbe.js`).
- **Geprüft** im Browser: Schuppen und Stellplätze an der neuen Stelle, Abfahrtsroute `[Schuppen → Straße → Westen]`; Tests grün. **Nicht geprüft:** ganze Fahrt mit allen Aufträgen, Fahrer/in, die zum neuen Schuppen laufen (Wegsuche außerhalb des Hofs), echtes Handy.

## v104 (aufbauend auf v103) – Stumpf bleibt beim Sägen fest stehen

Beim Sägen und Fällen in der Ich-Perspektive neigte sich der ganze Stamm samt Stumpf um den Fuß. Jetzt (`fpsaw.js`):
- Der **untere Teil** (Stumpf bis zur Kerbsohle) bleibt senkrecht stehen. Nur das **obere Stück mit Krone** neigt sich, und zwar um die Kerbsohle (Scharnier), nicht um den Fuß.
- Technisch: `notchMesh` kennt die Teile `"low0"`/`"up0"` (Teilung ohne Bruchstufe), neue Knoten `X.nl`/`X.nlw` für den festen unteren Teil; der obere Teil und die Krone werden mit `rotV` um den Punkt (0, ny, 0) gedreht. Der Fall selbst (Stumpf mit Bruchstufe bleibt) war schon so.
- **Geprüft:** Tests grün (axe 4, trees 7, forest 15, bushes 30, camp 9), Drehpunkt rechnerisch. **Nicht im Bild bestätigt:** die Neigung beim echten Sägen (im Testbrowser nicht auslösbar), nichts auf einem echten Handy.
- **v103:** Testmodus (`?test=1`) setzt 1 Mio. € und Level 100, sobald Spieler und Hof existieren.

## v102 (aufbauend auf v101) – Testmodus

- **`index.html?test=1`** startet einen **eigenen Test-Spielstand** (`logistika.test.v3`) mit **1.000.000 €** und **Level 100** (`game.js`: `TEST_MODE`, Start in `boot`). Der echte Spielstand wird nicht gelesen und nicht verändert. Ohne `?test` verhält sich das Spiel wie vorher.
- Zurücksetzen: Browserdaten der Seite löschen.
- **Geprüft:** Geld 1.000.000, Level 100, echter Spielstand bleibt leer. **Nicht geprüft:** jede Funktion auf Level 100 durchgespielt, echtes Handy.

## v101 (aufbauend auf v100) – Aussicht in der Ich-Perspektive (Sonnenuntergang)

Wer in der Ich-Perspektive (Säge/Axt) an den Kartenrand blickte, sah ins Leere. Jetzt gibt es dort eine Aussicht, die **nur** in der Ich-Perspektive erscheint:
- **Neue Datei `vista.js`** (`VISTA`): zeichnet hinter das 3D-Bild (`#fpVista`, Canvas halber Auflösung) Himmel, Sterne/Mond, Sonne mit Hof, Wolken (abends lange rote Bänder), ferne Berge, einen See mit Sonnenspiegelung, Hügel und Wiese. Ein heller Schein (`#fpGlow`) liegt darüber.
- **Tageszeit:** Farbverlauf nach Uhrzeit (Nacht, Morgenrot, Tag, goldene Stunde, **rotes Abendrot um 19:30–20:30**, Dämmerung, Nacht mit Sternen). Regen/Nebel/Sturm graut den Himmel ein.
- **Nebel passend:** `VISTA.env` färbt den 3D-Nebel in der Ich-Perspektive zum Horizontdunst, damit die Landschaft weich in die Aussicht übergeht.
- **Sonne** steht beim ersten Hinsehen leicht rechts vor dir; im Bergrücken ist an ihrer Stelle eine Senke.
- **Einbindung:** `farmview.js` (`VISTA.draw` nach `R.render`, `VISTA.env` am Ende von `farmEnv`), `index.html`, `sw.js`.
- **Geprüft** im Software-Browser: Himmel, Berge, See, Sonne und Sterne zu mehreren Uhrzeiten (3D ausgeblendet), Abendrot in der echten Szene; alle Tests grün (axe 4, trees 7, forest 15, bushes 30, camp 9). **Nicht geprüft:** auf einem echten Handy, Leistung dort; Baumkronen können die Aussicht verdecken.

## v100 (aufbauend auf v99) – Etappen-Karten und Hinweise präziser formuliert

Auf der Welt-Seite („Welt & Kontor“, `game.js` `stagesHTML`) hieß der gesperrte Knopf „noch Level 8 nötig“. Das las sich, als fehlten 8 Level. Jetzt:
- **Knopf (nächste Etappe):** „Erst ab Level 8 – noch 4 Level“ (fehlende Level = Pflichtlevel − dein Level) · „Dir fehlen noch 82.607 €“ · „Freischalten für 120.000 €“ (statt „Kapital fehlt: …“ und „freischalten“).
- **Kopfzeile jeder Etappe:** „🚦 ab Level 8“ und „💰 Kosten 120.000 €“ (vorher „Level 8“ und nur die Summe).
- **Weitere Etappen** (ab der übernächsten, vorher ohne Hinweis): „Gesperrt – erst Etappe 3 freischalten (ab Level 13)“.
- **Stand:** „Aktuelle Etappe – freigeschaltet“ (vorher „aktuell freigespielt“), frühere Etappen „Freigeschaltet“ (vorher „abgeschlossen“).
- **Hinweise beim Antippen:** „Diese Etappe gibt es erst ab Level 8 – dir fehlen noch 4 Level (du bist Level 4).“ und „Die Freischaltung kostet 120.000 € – dir fehlen noch 82.607 €.“ (vorher „Dafür brauchst du Level 8.“ und „Investition von … nötig.“).
- **Hof und Fischerei:** „Erst ab Level N.“ nennt jetzt auch, wie viele Level fehlen („… – dir fehlen noch k Level.“, `erbe.js`, sechs Stellen). „Zu wenig Geld – benötigt: X“ heißt jetzt „Dir fehlen noch Y“ mit dem echten Fehlbetrag (`fishview.js`, drei Stellen).
- **Geprüft** im Browser: Karten für Stufe 2 mit Level 4 / Level 9 und zu wenig Geld. **Nicht geprüft:** jede einzelne Meldung im Spiel durchgeklickt. Weitere Texte mit „ab Level N“ blieben, sie sind eindeutig.

## v99 (aufbauend auf v98) – Bäume stehen nicht mehr im Zaun

- **Fällbare Bäume** (`erbe.js`): Neu `fenceNear` (nächster Punkt auf dem größten Hofzaun, Stufe 10, und dem Sägewerkszaun) und `treeOffFence`. Jeder Baum hält Abstand 0,8 + Kronenradius zur Zaunlinie (vorher nur 1 Einheit Rand, die Krone und bei großen Bäumen der Stamm standen im Zaun).
  - Zu nahe Bäume rücken nach außen (höchstens 2,5 Einheiten, nur auf freien Platz, nicht auf Wege oder in andere Bäume). In einer neuen Welt fällt ein Baum weg, wenn kein Platz ist, die übrigen behalten ihre Nummern (wie bei den Wegen, v77).
  - **Ältere Stände:** einmalig (`F.v99f`) rücken die vorhandenen Bäume nach außen. Es wird nie ein Baum entfernt.
- **Kulissenbäume** (`worldview.js`, `bgTreeOk`): Abstand zum Hofzaun jetzt 3,2 (vorher 1,5), zum Sägewerkszaun 3,4 (vorher 1,8). Die Zufallszahlen der Kulisse bleiben gleich, es entfallen nur Bäume dicht am Zaun.
- **Gemessen** im Browser (neue Welt): bei allen 168 fällbaren Bäumen liegt der Abstand zum Zaun mindestens beim geforderten Wert (kleinster Überschuss 0,03).
- **Nicht getestet:** ein vorhandener Spielstand auf dem Telefon, und die Kulissenbäume habe ich nur über die Regel geändert, nicht einzeln nachgemessen.

## v98 (aufbauend auf v97) – Schatztruhe aus der Grube: wie die Lieferkiste

Gilt für die Schatzsuche (Truhe nach dem Graben, `worldview.js`: `worldTreasureReveal`, `stepTreasureReveal`, `stepTreasure`).
- **Zum Spieler gedreht:** Die Truhe schaut zur Kamera (`parcelFace()`, wie bei der Lieferkiste), beim Aufsteigen, Drehen und Stehen. Die offene Truhe in der Grube, die danach bleibt, dreht sich ebenfalls sanft zur Kamera mit.
- **Öffnen:** unverändert (aus der Erde brechen, schweben, drei Umdrehungen, Deckel springt auf, Fontäne, Banner).
- **Danach offen stehen, ohne Leuchten:** Statt nach 2,3 s zu verschwinden, setzt die Truhe mit Staubwolke auf und bleibt rund 4,5 s offen stehen. Licht, Glühen und Ringe sind dann aus. Danach löst sie sich in Funken auf, und die offene Truhe in der Grube bleibt wie bisher.
- **Unverändert:** Die Lichtsäule und die Ringe über dem roten Kreuz **vor** dem Graben bleiben, damit man die Stelle findet.
- **Im Browser geprüft** (Software-Grafik, Zeitraffer): Aufsteigen, Drehen, offen stehend, Auflösen, Grubentruhe zur Kamera. **Nicht getestet:** auf dem echten Telefon.

## v97 (aufbauend auf v96) – Lieferkiste: Öffnen wie bei der Schatztruhe, danach offen ohne Leuchten, zum Spieler gedreht

Gilt für die „Besondere Lieferung“ (Kiste vorm Hoftor, `worldview.js`).
- **Im Stand kein Leuchten mehr:** keine Lichtsäule, keine Bodenringe, kein Funkeln. Nur der kleine „Tipp mich an“-Hüpfer bleibt.
- **Zum Spieler gedreht:** Die Vorderseite (Schloss) zeigt zur Kamera (`parcelFace()`), auch beim Hereinhüpfen vom Lieferwagen. Dreht man die Kamera, dreht sich die Kiste sanft mit.
- **Öffnen wie bei der Schatztruhe:** Nach dem Antippen hebt die Kiste ab, rüttelt und dreht sich immer schneller (zwei Umdrehungen), dabei bauen sich Licht und Funken auf. Dann springt der Deckel auf (Fontäne, Banner, Belohnungen wie bisher).
- **Danach bleibt die offene Kiste kurz stehen** (rund 4,5 s nach dem Ausblenden der Effekte), mit Staubwolke beim Aufsetzen, ohne jedes Leuchten, zur Kamera gewandt, und löst sich dann in Funken auf (vorher sofort nach 2 s).
- Die Belohnung wird wie bisher beim Öffnen verbucht, das Stehenbleiben ändert nichts daran.
- **Im Browser geprüft** (Software-Grafik, Zeitraffer der Phasen): Stand ohne Licht, Abheben/Drehen, offen stehend, Auflösen. **Nicht getestet:** auf dem echten Telefon, und die Schatztruhe aus der Grube (Schatzsuche) habe ich nicht verändert.

## v96 (aufbauend auf v95) – Lupe nach dem Fällen weg

- Die iOS-Lupe erschien, wenn der Finger beim Weiterhacken auf der Ergebniskarte („… gefällt!“) lag und länger hielt. Die Karte nimmt jetzt keine Berührung mehr an (`pointer-events:none`, in `worldview.js` und `style.css`), der Finger landet auf dem Bild, wo Textauswahl und Lupe schon unterbunden sind.
- Ein Tipp irgendwo schließt die Karte weiter wie bisher (er geht durch), sonst nach 2,6 s.
- Nicht auf einem echten iPhone getestet (hier nur Software-Browser).

## v95 (aufbauend auf v94) – Lagerfeuer: Sitzende mit Beinen, Gespräch, Wege ums Feuer

- **Sitzen:** Die Sitzfigur sitzt vorn auf der Sitzfläche (Becken 0,10 vor der Sofamitte statt dahinter). Die Oberschenkel liegen waagerecht auf Sitzhöhe, die Unterschenkel hängen mit Schuhen vor der Sofakante frei. Man sieht die ganze Beinpartie (`woodmodels.js`, `person({sit:true})`).
- **Kein Werkzeug:** Am Lagerfeuer trägt niemand mehr etwas in der Hand. Das Werkzeug bleibt unsichtbar (auch die Axt am Körper der Holzfäller entfällt beim Sitzen). Die Arme liegen auf den Knien (statt waagerecht nach vorn zu stehen, was wie ein Stock aussah).
- **Kopf als eigenes Teil:** Die Sitzfigur wird ohne Kopf gebaut (`noHead`), der Kopf (`FWM.head`, Drehpunkt Nacken, Höhe 0,8) hängt als Kind der Figur. Die Regie dreht ihn: Blick, Nicken, Kopfschütteln.
- **Gespräch** (`CAMP.talkStep`, `talkOf`): Eine Regie für alle, die sitzen.
  - Abwechselnd spricht einer, 2,4–7,5 s lang, danach manchmal eine Pause. Wer dran kommt und wie lange, ist zufällig (keine feste Reihenfolge, kein Takt).
  - Zuhörer schauen zu 72 % zum Sprecher, sonst zu einem Nachbarn oder ins Feuer; der Sprecher blickt reihum. Jeder hat eine eigene Reaktionszeit.
  - Zuhörer nicken (während der Sprecher spricht), selten schütteln sie den Kopf, der Sprecher bewegt Kopf und Hand (Geste).
  - Kopfdrehung höchstens ±1,1 rad (Nacken), Körper bleibt zum Feuer.
- **Wege:** Niemand läuft mehr durchs Feuer, durch Sofas oder Wände.
  - Der Lagerplatz ist für die Wegsuche (A*) gesperrt. Hinein führen nur das Tor vorn (`CAMP.gate`) und der Mittelgang.
  - Dann auf einem Ring (Radius 1,5) außen ums Feuer herum, auf dem kürzeren Bogen zum Platz, zuletzt auf den Standpunkt vor der Sofakante. Zum Hinsetzen geht die Figur rückwärts auf den Sitz und dreht sich zum Feuer.
  - Zurück (`CAMP.routeOut`) derselbe Weg rückwärts bis zum Tor, danach normale Wegsuche. Wer mitten im Platz unterbrochen wird, geht ebenso über den Ring hinaus.
  - Die Vorlaufzeit zum Mittag ist 2 Minuten länger, weil der Weg etwas länger ist.
- **Tests:** `node tests/camp.test.js` (9): Füße ≥ 1,7 vom Feuer, Wege nie näher als 1,45 ans Feuer, nur Mittelgang/Ring/Endstück, Tor frei, Sprecherwechsel unregelmäßig, Blick beiderseits, Nicken ≫ Kopfschütteln, Zuhörer schauen überwiegend zum Sprecher.
- **Im Browser geprüft (Software-Grafik):** alle neun sitzen auf ihren Plätzen mit sichtbaren Beinen, kleinster Abstand der Gehenden zum Feuer in der Messung 1,49, keine Wegpunkte außerhalb der freien Wege.
- **Nicht getestet:** auf einem echten Telefon.

## v94 (aufbauend auf v93) – Ausdauerleiste aus der Ansicht entfernt, Axt-Karte tiefer

- Die Ausdauer-Anzeige (💪) ist weg: der Chip oben rechts im Hof (`fcSta`) und die Kraftleiste im Axtspiel (`mgStaBox`).
- Die Axt-Karte (Nadel, Baumleiste, „Hacken!“) sitzt jetzt direkt über der unteren Leiste und ist kompakter (ohne Kraftzeile rund 55 px niedriger). Die Schlaganimation hat mehr Platz.
- **Unverändert:** Die Ausdauer selbst läuft weiter (Schläge kosten Kraft, bei 0 erscheint „Keine Kraft mehr“ mit Brotzeit). Nur die Anzeige fehlt. Die Brotzeit-Karte zeigt weiter 💪 x / y.

## v93 (aufbauend auf v92) – Fällen mit der Axt in der Ich-Perspektive

**Hinweis Technik:** Das Spiel nutzt kein Three.js, sondern die eigene Engine `gl3d.js`. Die Wünsche aus dem Auftrag sind dort mit den Entsprechungen umgesetzt:
- `camera.add(axeGroup)` → ein Kamera-Knoten ohne Mesh (`X.rig`) übernimmt Augpunkt und Blickrichtung, die Axt hängt als Kind (`R.addChild`) daran.
- `BoxGeometry`-Splitter → kleine Quader-Knoten.
- Tweening → eigene Ablaufsteuerung mit Quaternion-Übergängen.

**Was neu ist:**
- **Axtmodell** (`axeMesh`, ein Mesh = ein Zeichenaufruf): Achsen +y = Stiel, −z = Schneide.
  - Ovaler Stiel mit Knauf, Kopf mit Auge, Blatt mit Bart, blanker Fase und kurzem Nacken hinten.
  - Stahlaxt mit hellem Stiel und rotem Band, Opas Axt dunkler.
  - Die Schneide zeigt nach vorne zum Stamm, der Nacken nach hinten (Test).
- **Kamera:** Der Waldarbeiter steht eine Armlänge plus Stiel vor dem Stamm.
  - Abstand 1,42 m + 0,5·Stammradius, Neigung 0,5, Augenhöhe ≈ 1,25 m, fov 0,9.
  - Der Kerb sitzt wie bei der Säge rechts am Stamm, 75° von der Blickachse; der Blick ist leicht nach rechts versetzt.
  - Die Blickrichtung wählt dieselbe Hindernissuche (`pickView`, jetzt mit Optionen für kürzeren Abstand).
- **Ruhelage:** Die Hände sind unten am Bildrand rechts der Mitte, der Stiel geht schräg nach vorn-oben, die Schneide zeigt auf die nächste Kerbstelle.
  - Die Lage wird aus dem Bildausschnitt gerechnet, nicht als feste Meter: Die Werte aus dem Auftrag (0,3 / −0,35 / −0,5) gelten für Three.js mit 75° im Querformat und lägen im Hochformat außerhalb des Bilds.
  - Nicht näher als 0,66 m, weil die Nahebene bei 0,5 m liegt.
- **Schlag** (`ev("swing", st, { q, kp })` je Tipp, Ablauf in `axeTool`):
  1. **Ausholen** 0,15 s: Hände 15 cm höher, die Axt halb in die Lage des Schnitttyps gedreht und 0,32 rad zurückgekippt. Sie bleibt im Bild.
  2. **Schlag** 0,10 s: beschleunigt (k^1,8) im Bogen um die Hände bis zum Treffer, die Hände gehen nach vorn.
  3. **Treffer:**
     - Die Schneidenmitte sitzt 12 mm tief im Holz. Der Treffpunkt wird aus der echten Kerbform gerechnet (gleiche Rechnung wie `notchMesh`, mit Verjüngung und Neigung).
     - Der Kerb springt auf die neue Tiefe.
     - 9–12 Splitter fliegen, und es gibt einen kurzen Ruck auf der Hochachse.
     - Ton „chop“ erst jetzt; der Stiel federt 60 ms nach.
  4. **Zurück** 0,3 s weich in die Ruhelage.
  - **Daneben:** Die Axt trifft die Rinde über bzw. unter dem Kerb und prallt ab. Es fliegen Rindensplitter, und der Kerb bleibt.
- **Dach/Sohle im Wechsel:**
  - Erster Treffer Dachschnitt: Die Schneide kommt 45° von oben rechts und trifft die Mitte der schrägen Dachfläche.
  - Zweiter Sohlenschnitt: waagerecht an die Kerbspitze.
  - Nur Treffer schalten weiter.
- **kerbProgress** = Schaden/Lebenspunkte des Baums (dieselbe Regel wie bisher: Volltreffer 7, gut 3, Serien-Bonus). Ein angeschlagener Baum zeigt seinen Kerb schon beim Hinsehen. Ab 80 % neigt sich der Baum leicht zur Fallseite.
- **Splitter** (`axeChips`/`stepChips`): echte kleine Quader (3–5,5 × 0,6–1,1 × 1,6–3,2 cm) aus hellem Holz `#E5C396`, etwa jeder fünfte mit Rinde.
  - Sie fliegen seitlich aus dem Kerbmund, drehen sich, springen am Boden auf, liegen und schrumpfen weg.
  - Höchstens 36 gleichzeitig, Knoten werden wiederverwendet, kein Schatten.
- **Fällung:** Bei vollem Kerb kippt der obere Teil wie bei der Säge um den Drehpunkt an der Kerbsohle zur Kerbseite (rechts im Bild).
  - Der Stumpf mit Sohle und Bruchleiste bleibt (`t.cut`, `stumpMesh`), die Kamera schwenkt in 1,25 s zurück.
  - Schließt das Fenster, bevor der letzte Schwung das Holz erreicht (langsames Gerät), zählt sein Treffer trotzdem.
- **Bedienung:** Die Nadel-, Baum- und Kraftleiste bleiben als schmale Karte unten links (`.mga`), der Hinweis steht oben.
  - Getippt wird überall im Bild oder auf „Hacken!“.
  - Zwischen zwei Schlägen liegen mindestens 0,3 s (vorher 0,18 s), weil ein Schwung 0,25 s bis ins Holz braucht.
  - Ohne Kraft erscheinen Essen und „Später weiter“ wie im 2D-Fenster.
  - Ohne 3D (andere Ansicht) bleibt das alte 2D-Axtspiel.

**Getestet:**
- `node tests/axe.test.js` (4, neu):
  - Lage → Winkel für gl3d ergibt dieselbe Drehung, 2000 Zufallslagen.
  - Die Schneide zeigt exakt in Schlagrichtung, der Stiel steht senkrecht dazu, keine Spiegelung.
  - Übergänge zwischen Lagen sind sauber.
  - Axtmodell: Schneide vorn, Trefferpunkt mittig auf der Schneide.
- Weiterhin `trees` (7), `forest` (15) und `bushes` (30) grün.
- Im Browser (SwiftShader, Hochformat 390 × 844 und 1100 × 760), keine Fehler:
  - Gemessen aus der gezeichneten Weltmatrix der Axt gegen das echte Kerb-Mesh: Die Schneide liegt im tiefen Kerb 4 mm (Dach) bzw. 6 mm (Sohle) an der Holzfläche, vor dem ersten Treffer 5–12 mm in der Rinde.
  - Die Schneidenrichtung stimmt exakt mit der Schlagrichtung überein (Skalarprodukt 1,000).
  - Keine Ecke der Axt wird an der Nahebene sichtbar abgeschnitten (nächster Punkt 0,68 m).
  - Bilder: Ruhe, Ausholen, Schlag und Treffer je Dach/Sohle, Splitter, Fehlschlag, kein Kraft mehr, Fall, Stumpf.
  - Säge-Ego-Sicht weiterhin in Ordnung (Bild und Kerb-Treffer).
- Zeichenaufrufe in der Ego-Sicht etwa wie bei der Säge (Axt 56 / 113 000 Dreiecke, Säge am selben Baum 62 / 86 000), dazu kurz bis zu 12 Splitter.

**Nicht verifiziert / offen:**
- Wie sich Tempo und Wucht des Schlags auf einem echten Handy anfühlen; der Software-Renderer läuft nur mit wenigen Bildern pro Sekunde.
- Der Ruck beim Treffer dauert rund 0,1 s statt 20 ms: 20 ms sind bei 60 Bildern/s nur ein Bild und wären nicht zu sehen. Die Wirkung ist auf die ersten ~30 ms gelegt.
- Hände/Arme sind nicht modelliert; der Stiel läuft unten aus dem Bild.
- Die Fallrichtung ist wie bei der Säge die Kerbseite. Steht dort ein Baum, bleibt es beim bisherigen Hinweis, eine Ausweichrichtung gibt es nicht.

## v92 (aufbauend auf v91) – Waldsanierung: Boden ohne Überlagerungen, Bäume nicht mehr ineinander, Blumen und Wind

**Befunde (aus dem Code und Messungen, nicht vermutet):**
1. **Bodenfehler** (seit v91): Jeder Waldbodenfleck war ein eigenes 7-Eck knapp über dem Boden. Flecken lagen übereinander, und der Rand jedes Flecks lief zur *Grundfarbe* aus statt zum Fleck darunter. Das gab harte Kanten, helle Ränder und eckige Formen. Prüfung aller waagrechten Bodenflächen: **3 775 exakt übereinanderliegende Dreiecke und 49 393 mit weniger als 4 mm Abstand**. Die flach gedrückten Moospolster lasen sich von oben als helle Scherben.
2. **Helle Stellen unter Blumen:** Die Blumen standen absichtlich auf dem hellen „Lichtboden“-Fleck (hellstes Grün, noch um 8 % aufgehellt). Jede Blumengruppe hatte außerdem ein hellgrünes Blatt flach am Fuß, das voll in der Sonne lag. Kleine Steine waren zu hell grau und mit einem Moosstück in der Mitte, von oben ein weißer Ring.
3. **Bäume ineinander** (seit v89): Kulissenbäume wurden über die volle Zellbreite (3,2) gestreut, **ohne jede Abstandsprüfung untereinander**. Zu fällbaren Bäumen galt pauschal 2,2, unabhängig von der Größe; eine uralte Eiche hat aber 5,1 Kronenradius. Fällbare Bäume untereinander hatten pauschal 2,6. Gemessen mit den echten Modellmaßen: **28 Stamm-in-Stamm, 28 Stämme mitten in fremder Krone, 307 starke Kronenüberschneidungen** (Kulisse/Kulisse), dazu 20 Kulisse/fällbar und 6 fällbar/fällbar.
4. **Wind:** Der Shader verschob die Pflanzen linear mit der Höhe, also als starre Scherung. Die ganze Pflanze hatte eine Phase, die Spitze rund 3 cm Ausschlag. Im Auto-Modus kam der Wind erst ab ≥ 50 Bildern/s und ging nach 90 s ohne Berührung aus. Blumen und Farn (v91) waren gar nicht animiert.

**Behebung:**
- **Waldboden als Farbfeld im Gelände** (`worldGround`): Wo Flecken liegen, wird die 4er-Bodenkachel in 3 × 3 Teilkacheln (1⅓) geteilt, und die Flecken gehen in die Eckfarben ein. Mitte deckend, Rand weich, Umriss gewellt, Deckkraft je Bodenart; der Lichtboden ist nur noch ein Hauch. **Keine zweite Fläche mehr über dem Boden.** Kanten zu ungeteilten Nachbarkacheln sind nahtlos: Der Einfluss endet innerhalb der markierten Kacheln, dort gilt genau die Dreiecks-Interpolation der groben Kachel. Jede Ecke wird einmal berechnet. Laubblätter liegen nie übereinander. Prüfung danach: **0 übereinanderliegende Dreiecke (auch nicht unter 4 mm)**. `WBuf.blob` und die Moospolster sind entfernt; Moos ist Bodenfarbe, in Senken liegen bemooste Steine.
- **Blumen neu** (`FWM.flowers`): 8 Varianten (4 Farben × Sternblüten/Ähren). Klare, nach oben gerichtete Blüte, dreikantiger Stängel, Blatt am Stängel, **dunkle** Rosette am Boden statt hellem Blatt. **Farn neu** (`fern2`): 6 gefiederte Wedel. Steine dunkler, Moos deckt die Oberseite.
- **Baumabstände je Art und Größe:**
  - Maße aus den Modellen in `FTREE_DIM` (erbe.js): Kronenradius, Stammradius, Kronenunter- und -oberkante. Ein Node-Test rechnet sie aus `FWM.tree` nach.
  - Regel `treeClash`: Stämme brauchen ≥ 0,3 Luft. Kronen auf gleicher Höhe dürfen höchstens 80 % des kleineren Radius ineinandergreifen (gleich große: Abstand ≥ 1,2 r). Ein kleiner Baum darf unter den Rand einer höher ansetzenden Krone, aber nicht an deren Stamm.
  - Kulissenbäume (`worldTreeSpace`): Fällbare Bäume (in ausgewachsener Größe) und Felsen stehen fest, dann kommen die Kulissenbäume von groß nach klein. Bei Konflikt gibt es feste Ausweichstellen aus dem Baumschlüssel, sonst entfällt der Baum. Ergebnis: von 3 080 sind 418 verschoben und 271 entfallen.
  - Fällbare Bäume (`erbeSpaceTrees`): bei neuen Spielen und einmal für alte Stände (`F.v92s`). Der spätere rückt aus, keiner wird entfernt.
  - Reproduzierbar, `bgCut`-Schlüssel bleiben gültig, Antippen/Befördern geprüft.
- **Pflanzenwind** (gl3d.js, `uPlant`/`uWind`, eine Erweiterung des vorhandenen Wind-Shaders):
  - Die Pflanzen biegen sich statt geschert zu werden: Fuß fest, Auslenkung überproportional zur Höhe, die Spitze schwingt verzögert nach (Phase sinkt mit der Höhe).
  - Phase aus einer glatten Funktion des Ortes; eine Pflanze bleibt ganz, Nachbarn schwingen verschieden.
  - Böen laufen als langsame Welle über die Fläche, mit einer kleinen Querbewegung. Beim Biegen sinkt die Spitze, nichts wird länger.
  - Stärke nach Wetter (`WIND_WX`: Nebel 0,5 … Sturm 2,3), weich überblendet; Amplituden blenden je Kachel weich ein und aus.
  - Blumen, Farn und Farn am Wegrand liegen jetzt in den Wind-Kacheln (ohne eigenen Schattenwurf, wie das Gras). Auto-Modus: Wind gleich an, aus erst unter 25 Bildern/s (60 s Sperre, danach wieder an). Kein Ausschalten nach Ruhe mehr.
  - Bäume (Instanzen) behalten ihren bisherigen Wind.

### Messung (Handy-Emulation 390 × 800, DSF 2, CPU 4× gedrosselt, SwiftShader; Wetter und Zeit fest)
| Größe | v90 | v91 | v92 |
|---|---|---|---|
| Dreiecke, Ausschnitt (−60, 10) / dichter Wald (−125, −20) / Lichtung (−60, −55) | 35 725 / 45 253 / 25 075 | 80 634 / 91 362 / 62 457 | 65 160 / 74 435 / 70 327 |
| Draw Calls | 33 / 31 / 21 | 33 / 31 / 24 | 36 / 36 / 27 |
| Schatten-Dreiecke | 46 879 / 82 720 / 44 772 | 46 879 / 82 947 / 46 038 | 45 242 / 82 052 / 44 251 (weniger Bäume) |
| Aufbau Waldboden (gedrosselt) | – | 1 954 ms | 1 540 ms |
| übereinanderliegende Bodendreiecke (< 4 mm) | – | 53 168 | 0 |
| Baum-Konflikte Stamm / Krone stark (gemessen am v91-Stand, Kulisse wie v90) | 28 / 307 (+26 mit fällbaren) | 28 / 307 (+26 mit fällbaren) | 0 / 0 Kulisse; 2 fällbar/fällbar (uralte Eichen) |
Die zusätzlichen Draw Calls kommen von Wind-Kacheln, die jetzt Blumen/Farn tragen (vorher nur Gras). Zeiten aus dem Software-Renderer sind keine Handy-Werte; belastbar sind die Zähler.

**Getestet:** `node tests/trees.test.js` (7: Maße = Modelle, Abstandsregel, reproduzierbar, kein Stamm im Stamm, Ausweichen ohne Entfernen), `node tests/forest.test.js` (15), `node tests/bushes.test.js` (30). Browser: keine Fehler, Bodenprüfung (überlagerte Flächen) und Baumprüfung wie oben, Befördern eines verschobenen Kulissenbaums, vier Seeds, Bilder aus der Spielkamera (Neigung wie im Spiel) an Waldrand, Lichtung, Senke, dichtem Wald, bei Nacht; Bildfolge zum Wind.
**Nicht verifiziert / offen:** Wie sich der Wind auf einem echten Handy anfühlt (Stärke über `VEGQ.grassSway`, `WIND_WX` einstellbar). Flimmern beim Bewegen auf Geräten mit 16-Bit-Tiefenpuffer: geometrisch gibt es keine überlagerten Flächen mehr, auf einem echten Gerät nicht geprüft. Zwei uralte Eichen-Paare (fällbar) finden keinen freien Platz und überlappen weiter. Büsche bewegen sich weiterhin nicht im Wind.

## v91 (aufbauend auf v90) – Lebendiger Wald: Waldboden, besondere Orte, Entdeckungen, kleines Leben

**Befund (v90):** Der Boden war eine einzige grüne Fläche mit ein paar Farn-/Pilz-/Totholz-Stücken nur direkt an den Wegen (`worldStatic`, feste Wahrscheinlichkeiten). Büsche, Gras und Bäume waren gut verteilt, aber nichts verband sie mit dem Boden: kein Moos im Schatten, kein Laub unter alten Laubbäumen, keine Nadelschicht unter Fichten, keine offenen Lichtinseln, keine kleinen Orte zum Entdecken. Aus der Spielkamera (Südost, Abstand 22–50) wirkte der Wald deshalb flach und gleichförmig.

**Jetzt – ein Regelwerk statt Streuung** (`forest.js`, rein und ohne Engine, in Node testbar; Aufbau in `worldview.js`):
- **Ökologie je Punkt** (`feat`): Schatten (Baumdichte), Feuchte (Rauschen + Wassernähe + Schatten), Nadel-/Laubanteil, alter Laubbaum in der Nähe, Offenheit/Lichtung, Wegabstand, Buschnähe. Daraus entscheidet jedes Stück Boden, was dort wächst – keine freie Streuung.
- **Bodenarten (Flecken, weiche Ränder zum Untergrund):** Moos (Schatten + feucht), feuchter Waldboden (nur Schatten + feucht, häufiger am Wasser), Laubschicht (unter Laubbäumen, besonders unter alten, mit einzelnen gelben/rostbraunen/dunkelbraunen Blättern), Nadelboden (unter Fichten/Kiefern), nackte Erde (an Wegen, Felsen, Buschfüßen, Waldrändern), heller Lichtboden (Lichtungen und offene Stellen). Je Fleck 7 Ecken mit gestörtem Radius, in die Länge gezogen, gedreht; Mitte in Bodenart-Farbe, Rand in der Farbe des darunterliegenden Bodens (`WBuf.blob`, Farbe aus dem Boden-Farbgitter).
- **Inhalte, an Bodenart und Ort gebunden:** Moospolster und Farn auf Moos, Zweige/Rinde/Pilze auf Laub, rote Pilze im Nadelwald, braune/gelbe/weiße Pilze unter Laubbäumen, Kiesel und Steine auf Erde, Blumen (weiß/gelb/violett/rosa) nur im Licht, Steine mit Moos, Wurzelanläufe an alten Bäumen. Pilze stehen in Gruppen und häufiger auf feuchtem Boden.
- **Vegetationszonen:** dichter Wald (wenig Unterwuchs), lichter Wald, dichter Unterwuchs (Büsche mit feuchtem Fuß), natürliche Ränder – kommen aus Baumdichte und Waldmaske, nicht aus Kacheln.
- **Besondere Orte** (je nach Komposition 2–9 je Art, mit Schutzkreis gegen Überlappung): *verstecktes Lichtungsstück* (Bäume werden vor dem Buschaufbau entnommen, Büsche setzen sich an den Rand, Blumen, Steine, weiße Pilze, ab und zu ein Fundstück), *moosige Senke*, *alter Baum mit Wurzeln*, *umgestürzter Moosstamm mit Farn und Pilzen*, *Blumenwiese/Pilz-Farn-Feld*, *Sonnenplatz mit Lichtschacht*, *ungewöhnlich großer Busch*.
- **Büsche als Entdeckungsorte** (rund 10 % der Büsche, der Rest bleibt normal; Obergrenzen je Art): Igel schaut aus dem Busch (auf die Kamera zugewandter Seite, mit Pfotenspur), Beeren (Farbe je Busch), Vogelnest mit Eiern, Spuren, extra dichter Busch, Laubhaufen (Blätter, Zweige, Früchte), Durchblick (zweiter Busch daneben, dahinter Stiefel/Laterne/Korb).
- **Kleines Leben, nur an passenden Orten** (`stepLife`): Igel schieben sich aus ihrem Busch, bleiben und gehen wieder (eigene Zeiten je Tier über `wildPres`; nur bei Trockenheit; Antippen → zieht sich zurück, einmalig 1 EP); Falter schweben unregelmäßig über Blumenwiesen/Lichtinseln/versteckten Lichtungen (nur Tag, trocken, zwischendurch Segelflug); ein Vogel sitzt auf einem Moosstamm; vereinzelt fallendes Laub von alten Laubbäumen in Kameranähe; Lichtschächte nur bei Sonne, „atmen“ langsam. Kein Takt, keine Dauerpartikel, keine neuen dynamischen Schatten.
- **Wiederholung vermeiden:** vier Kompositionen (`COMP`: Moosgrund, Laubwald, Nadelhang, Lichtungswald), gewählt über den Seed (`?fseed=7328…7331`, Standard 7331 = Lichtungswald); Fleckgrößen/-formen/-töne, Drehung und Maßstab je Ding, Schwerpunkte (je Komposition fünf Stellen, an denen eine Bodenart verstärkt wird) und Jitter-Raster statt festem Gitter. Ergebnis ist deterministisch (gleicher Seed → identisches Ergebnis).

**Leistung:** Alles Statische steckt in den vorhandenen Boden-Kacheln (`chunk.g`, ohne Schatten) – **für die statischen Teile keine neuen Knoten, keine neuen Draw Calls, keine JS-Schleifen je Bild**. Das kleine Leben besteht aus rund 65 winzigen Knoten (Igel, Falter mit Flügeln, Vogel, Schächte), die nur in Kameranähe sichtbar geschaltet werden; `stepLife` rechnet nur für diese. Modelle bewusst grob (Blumen 42, Farn 21, Pilze 81, Moospolster 20, Zweig 18 Dreiecke; Farn vorher 84). Räumliche Abfragen mit numerischen Zellschlüsseln.

### Messung (v90 → v91, Chromium/SwiftShader, Handy-Emulation 390×800, DSF 2, CPU 4× gedrosselt, Wetter/Uhrzeit fest)
| Größe | v90 | v91 |
|---|---|---|
| Dreiecke Hauptdurchgang, Ausschnitt (−60, 10) / dichter Wald (−125, −20) | 35 725 / 45 253 | 80 634 / 91 362 |
| Dreiecke Schattendurchgang | 46 879 / 82 720 | 46 879 / 82 947 (unverändert) |
| Draw Calls | 33 / 31 | 33 / 31 |
| Boden-Flecken / -Dinge im ganzen Wald (Standard-Seed) | – | ≈ 6 200 Flecken (≈ 144 000 Dreiecke inkl. Laubblättchen) / ≈ 7 800 Dinge (≈ 229 000 Dreiecke) |
| Aufbau (`FOREST.generate` + Bau), Messumgebung gedrosselt 4× | – | ≈ 1,7–2,4 s, im Ladescreen versteckt (ungedrosselt ≈ 0,6–0,9 s) |
**Grenzen:** Messwerte stammen vom Software-Renderer, nicht von einem Handy; belastbar sind Zähler (Dreiecke, Aufrufe). Im sichtbaren Ausschnitt verdoppelt der Waldboden die Dreiecke ohne zusätzliche Aufrufe – auf einem echten Handy bitte Bildrate im dichten Wald prüfen. Falls nötig: `FSCALE`/Dichte in `FOREST.COMP` senken (`flowers`, `cushion`) oder Flecken-Ecken in `WBuf.blob` weiter reduzieren.

**Getestet:** `node tests/forest.test.js` (15 Tests: Determinismus, vier verschiedene Kompositionen, keine Dinge auf Wegen/Teich/Lichtungsmitte/Felsen/Stämmen, Ökologie-Regeln mit Zahlen, Entdeckungsgrenzen, Muster, Menge, Rechenzeit), `node tests/bushes.test.js` (30, unverändert). Browser: Aufbau ohne Fehler, Bilder aus der Spielkamera an allen Ortsarten, Antippen eines Igels, Falter/Lichtschacht/Vogel sichtbar, vier Seeds.
**Noch nicht geprüft (bitte auf dem Handy ansehen):** Bildrate im dichten Wald, Gesamteindruck der Bodenfarben bei Abend/Nacht, ob der Igel/Vogel im echten Tagesverlauf oft genug zu sehen ist (Zeiten stehen in `stepLife`/`wildPres`), Gefühl der Menge an Entdeckungen.

## v90 (aufbauend auf v89) – Alle Waldbäume von Anfang an in Endform, Ladescreen

**Vorher:** Kulissenbäume waren je Kachel zu einem Mesh aus der *einfachen* `FWM.bgTree`-Form (31–208 Dreiecke) verschmolzen, ohne Wind. Erst beim Antippen (`bgPromote`) wurde daraus ein echter Baum mit `FWM.tree` (200–1510 Dreiecke, anderer Größenklasse, Wind) – man sah den Wechsel.

**Jetzt:**
- Jeder Kulissenbaum steht von Beginn an **in genau der Form, die er nach dem Antippen hätte**: gleiche Art, Größenklasse (`fz`), Maßstab (`fs`), Variante (`fv`), gleiche gerundete Lage, gleicher Wind (0,22 + Böen). Die Berechnung steckt in `bgFinal(b)`; `bgPromote` verwendet dieselben Werte → **kein Wechsel mehr**.
- Gezeichnet per **GPU-Instancing** (`R.instGroup` in `gl3d.js`, `drawArraysInstanced`, je Instanz `vec4(x, z, cos·s, sin·s)`): je Art/Größe/Variante *ein* Mesh (45 Typen, zusammen ≈ 2 MB), geteilt mit den echten Bäumen (`fmesh("wt:…")`). Ein Verschmelzen aller Bäume in Endform hätte ≈ 1,3 Mio. Dreiecke und ≈ 139 MB Vertexdaten bedeutet.
- Je Bild wird pro Instanz im Sichtkegel bzw. im Schattenausschnitt geprüft (nur sichtbare gehen an die GPU); eigene Instanz-Shader (gleicher Code wie die normalen, nur die Modellmatrix kommt aus dem Attribut), Schatten und Nebel wie bisher, Kontextverlust stellt die Gruppen wieder her.
- `bgChunkBuild(c)` gleicht jetzt die Instanzen mit `c.trees` ab (angetippt / im Säge-Minispiel ausgeblendet → Instanz weg; zurück → wieder da) – `fpsaw.js` bleibt unverändert.
- Die Variante eines Kulissenbaums kommt aus dem Schlüssel (`t.v`, gespeichert am echten Baum); `treeMeshOf` nimmt `t.v`, sonst wie bisher `id % 3` (alte Spielstände, selbst gepflanzte Bäume).
- **Ladescreen** (`farmBoot` in `farmview.js`, Stil in `style.css`): beim ersten Öffnen des Hofs wird erst der Schirm gemalt, dann gebaut (der Aufbau blockiert den Hauptthread); Animation läuft auf dem Compositor weiter; mindestens 0,5 s sichtbar, dann ausgeblendet, nachdem zwei Bilder gezeichnet sind.
- Aufbauzeit: `bgChunkBuild` für alle 3077 Bäume ≈ 143 ms beim ersten Mal (45 Meshes erzeugen), ≈ 21 ms danach; der gesamte Weltaufbau liegt weiter bei ≈ 2 s in der Messumgebung (vorher ebenso).

### Messung (v89 → v90, Chromium/SwiftShader-Harness, dichtester Waldausschnitt bei (−120, −20), Kamera nah/mittel/weit)
| Größe | v89 | v90 |
|---|---|---|
| Dreiecke Hauptdurchgang | 50 919 / 45 148 / 41 381 | 66 367 / 75 492 / 92 240 |
| Dreiecke Schattendurchgang | 26 518 / 26 518 / 26 518 | 83 591 / 83 591 / 83 453 |
| Draw Calls Hauptdurchgang | 29 / 29 / 28 | 38 / 39 / 40 |
| sichtbare Baum-Instanzen (Haupt / Schatten) | – | 126 / 163 / 215 · 250 |
| JS-Heap | 54,7 / 63,9 / 71,4 MB | 43,0 / 47,7 / 51,9 MB |
| „GPU“-Zeit (SwiftShader-Software-Renderer, kein Handy!) | 273 / 276 / 270 ms | 493 / 503 / 535 ms |

Pixelvergleich *vor/nach dem Antippen* eines Waldbaums (Zeit und Sonne eingefroren): identisch außerhalb der Bedienelemente. Geprüft: Antippen/Promotion, Ausblenden und Zurücksetzen im Säge-Minispiel, Weltneuaufbau (Instanzen 3077 = 3077), Kontextverlust und Wiederherstellung (gleiche Zähler), alter Spielstand ohne `t.v`.
**Grenzen:** Messwerte stammen vom Software-Renderer, nicht von einem Handy; belastbar sind Zähler (Dreiecke, Aufrufe, Speicher). Im dichtesten Ausschnitt sind es rund 2,5- bis 3-mal so viele Dreiecke wie bei v89, dafür deutlich weniger Speicher.

## v89 (aufbauend auf v88) – Natürlicher Wald: Büsche ohne 7:1, aus der Waldsituation; Baumdichte in Flecken

**Ursache der künstlichen Wirkung (aus dem Code, nicht geraten):**
1. *Bäume:* `worldStatic` setzte pro 3,2-Zelle mit **überall gleicher Wahrscheinlichkeit 0,86** einen Baum an eine um bis zu 0,8 Zellbreite versetzte Stelle – ein gejittertes Raster, das im Kernwald überall gleich dicht ist (Clark-Evans-Index 1,25 = gleichmäßiger als Zufall; 1 = zufällig). Keine Haine, keine Lücken.
2. *Büsche:* v86/v87 starteten mit einer **Sollzahl `floor(Bäume / 7)`** und füllten sie, bis sie erreicht war (Gruppen aus 3–7, Obergrenzen je Art, am Ende „dritter Durchgang ohne Grenzen“, damit 533/533 stimmt). Wo keine Stelle gut war, wurde trotzdem gesetzt; Gruppen waren ähnlich groß und kompakt (Mittelpunkt + Lappen) – „Buschinseln“. Alle Lichtungen (13) wurden als gleichwertige Gruppenplätze behandelt, 85 % bekamen Büsche.
3. Die Typwahl **glich auf die Gewichte 30/18/12/… aus** (`corr`), statt dem Standort zu folgen. Die 2.5D-Kamera/Tiefensortierung ist nicht die Ursache: die Draufsicht zeigte dasselbe Muster (Gruppen gleicher Größe auf freien Punkten).
4. Neuerzeugen häuft nichts an: Instanzen entstehen einmal je Weltaufbau in neuen Puffern (kein Altbestand).

**Was sich geändert hat**
- **Kein 7:1, keine Sollzahl, keine feste Gruppengröße** (`BUSH.targetCount`, `TREES_PER_BUSH`, `target`, `shortfall` entfernt). Die Menge ergibt sich aus der Eignung; wo nichts passt, bleibt der Boden frei.
- **Eignung (`BUSH.suitability`)** je Punkt aus der lokalen Waldsituation (`feat` in `worldBushes`): Baumdichte im Umkreis von 5 relativ zum Kernwald (`rho`), Übergang (`edge`: Waldrand oder deutlicher Dichteunterschied zwischen nahem und weitem Umkreis), Nähe Lichtung/Felsen/Weg/Wasser, Nadelbäume. Kurve: im dichten Bestand (rho > 0,85) sehr wenig, im lockeren Bestand und in Übergängen am meisten; Übergang/Felsen/Weg/Lichtungsnähe erhöhen. Dazu ein **fleckiges Bewuchsfeld** (Wertrauschen, Seed 7331): großflächig bewachsen ↔ leer.
- **Platzierung:** Kandidatenraster (2,4) → Eignung × Bewuchsfeld → Keimpunkte mit zufälliger Abstandssperre (3–7,5) → jeder Keimpunkt wird **Einzelbusch oder wächst als kleine Gruppe** (Wahrscheinlichkeit und Obergrenze je Standortart: dicht 0,1/1 · locker 0,35/3 · Übergang 0,45/4 · Weg 0,3/3 · Fels 0,55/4 · Lichtungsrand 0,45/3; Begleiter geometrisch verteilt; selten +3 in sehr bewachsenen Flecken). Das Wachstum läuft Schritt für Schritt von einem stehenden Busch aus entlang einer Vorzugsrichtung → längliche, unregelmäßige Formen ohne Mittelpunkt; Größe und Abstand variieren; die Gruppengröße folgt dem verfügbaren Platz.
- **Lichtungen bleiben offen:** je Lichtung seedbasiert *offen* (Rand, nur gelegentlich ein Strauch), *leicht bewachsen* (1–3 kleine Gruppen an gewählten Randstellen, ungleichmäßig verteilt) oder *junger Bewuchs* (lockerer Sektor aus Jungwuchs/Farn). Die Mitte (38 % des Radius) bleibt immer frei. Abgeleitete Lichtungen erst ab 4,0 freiem Radius (vorher 3,4).
- **Typen nach Standort** (`BUSH.KIND`, Faktor auf das Grundgewicht, **kein Ausgleich auf Gesamtanteile mehr**): dicht → Farn/Nadel/jung; locker → rund/jung; Übergang → breit/rund/Beere/jung; Weg → Beere/saisonal/rund; Fels → breit/Farn; Lichtungsrand → rund/Beere/jung. Nadelsträucher nur bei Nadelbäumen, saisonale Farbbüsche selten und nie dicht beieinander. 40 % der Begleiter gleicher Art wie der Nachbar, sonst gemischt.
- **Baumdichte (Abschnitt 4 der Aufgabe):** `treeDens` – glattes Dichtefeld (zwei Oktaven, feste Samen) moduliert die Setzwahrscheinlichkeit der Kulissenbäume (`p = 0,30 + 0,85·dm` im Kern statt 0,86; am Rand `f·0,6·(0,4+1,2·dm)`), Streuung innerhalb der Zelle jetzt volle Zellbreite. Der Zufallsstrom bleibt unverändert (gleiche `rnd()`-Aufrufe), nur die Annahme ändert sich. Folge: dichte Haine, lockere Stücke, natürliche Lücken; **Baumzahl 3731 → 3247 (−13 %)**. Gefällte Kulissenbäume (`bgCut`) bleiben je Zelle verknüpft; stehende, schon hochgestufte Bäume sind unberührt.
- **Gras** an Birken, Lichtungsrändern, Felsen unverändert (Hash je Birke); keine Flächendeckung. `FWM.bush`/`grassTuft` unverändert.
- **Performance:** weniger Bäume und Büsche (siehe Messung), Erzeugung einmal beim Weltaufbau (≈ 150 ms für `BUSH.generate`, ≈ 200 ms gesamt `worldBushes` inkl. Gras, gemessen in Chromium/Node-Harness ohne Drosselung), kein Rechnen pro Frame.

### Messung (v87 → v89, derselbe Seed/dieselbe Welt, Auswertung im Spiel)
| Größe | v87 | v89 |
|---|---|---|
| Bäume (Kulisse + Hof) | 3731 | 3247 |
| Büsche | 533 (erzwungen = ⌊Bäume/7⌋) | 346 (ergibt sich) |
| Einzelbüsche / Gruppen | 108 / 96 | 137 / 79 (Größen 2:47 · 3:16 · 4:13 · 5:3) |
| Büsche je 100 Einheiten² bei Baumdichte <0,3 / 0,3–0,6 / 0,6–0,85 / >0,85 | 1,98 / 3,21 / 1,89 / 0,93 | 0,06 / 0,99 / 0,95 / 0,33 |
| Clark-Evans-Index Bäume (1 = zufällig, >1 gleichmäßiger) | 1,25 | 1,16 |
| Clark-Evans-Index Büsche (<1 = geklumpt) | 0,41 | 0,55 |
| Anteil Waldfläche ohne Busch im Umkreis (Radius + 1,2) | 93 % | 97 % |
| Lichtungen (abgeleitet + 5 ausdrückliche) | 13 (laut v87-Doku) | 30 (offen 16 · leicht 9 · jung 5), größter Bewuchsanteil 2 % der Fläche |
| Mindestabstand Busch-Rand ↔ Wegmitte / ↔ Stammmitte | 0,96 / 0,30 | 0,99 / 0,48 |
| Hash der Vegetation, zweimal erzeugt | gleich | gleich (−342153307) |
| Draw Calls Hauptdurchgang (3 Ansichten, SwiftShader-Harness) | 17 / 21 / 25 (v88) | 18 / 21 / 27 |
| Dreiecke Hauptdurchgang | 38 624 / 41 742 / 40 878 (v88) | 25 005 / 31 077 / 33 418 |
| Dreiecke Schattendurchgang | 43 462 / 43 398 / 58 449 (v88) | 40 503 / 42 085 / 53 353 |
| „GPU“-Zeit je Bild (SwiftShader-Software-Renderer!) | 175 / 184 / 226 ms (v88) | 152 / 178 / 194 ms |

Bildrate und GPU-Zeit stammen vom Software-Renderer (kein Handy); belastbar sind die Zähler. Spielkamera geprüft: 10 Ansichten an verschiedenen Waldstellen (dist 20–30, Pitch 0,95), je Lichtungsart eine; Draufsicht-Plot mit allen Bäumen, Büschen, Gras und Lichtungen.

**Einschränkungen:** Die Waldfläche am Rand der Karte ist sehr locker und bekommt wenig Büsche (gewollt, aber „leer“ wirkend, wenn man dort hinzoomt). Die Baumzahl sinkt um 13 %, Bestandsspielstände behalten gefällte Kulissenbäume je Zelle, einzelne Zellen tragen aber jetzt keinen Baum mehr. Jungbäume wurden nicht ergänzt (keine passende Variante). Die Kamera-Verdeckung wird nur über Wegabstand und Größenbereiche begrenzt, nicht über Blickrichtung.

## v88 (aufbauend auf v87) – Mobile-Performance und Vegetationsanimation

**Ziel:** Der Wald soll auf schwachen Handys laufen. Bäume und Büsche bleiben statisch, nur Grasbüschel dürfen sehr langsam und schwach wehen –
und nur, wenn die Bildrate es hergibt. (Architektur-Hinweis wie v86: eigene Engine `gl3d.js`; keine React-Renders, keine Three.js-Instanzen –
die „Instanzen“ sind je Kachel zusammengefasste Meshes, Wind läuft im gemeinsamen Vertex-Shader.)

- **Gemeinsamer Wind-Shader (`gl3d.js`):** der vorhandene Sway-Shader (Teichschilf, Felder, Bäume) bekommt einen eigenen Zeitfaktor je Knoten (`swayT`, Uniform `uSwayT`;
  Standard 1 = bisheriges Verhalten). Die Auslenkung ist proportional zur Höhe über dem Boden und hängt von der Weltposition ab → benachbarte Büschel schwingen **phasenversetzt**,
  kein Gummi-Effekt. Gras: `sway = 2,0` (≈ 0,03 Einheiten bei einem 0,3 hohen Büschel, die Spitze bewegt sich um ~10 % der Büschelhöhe), `swayT = 0,4` (Periode ≈ 10 s).
  **Kein JS pro Halm, Büschel oder Busch** – pro sichtbarem Gras-Knoten wird nur ein Uniform-Wert gesetzt.
- **Gras in eigenen Chunk-Knoten (`worldview.js`):** je 24-Einheiten-Kachel ein Knoten (68 Stück, 874 Büschel, ≈ 36 600 Dreiecke, 3,8 MB Vertexdaten), **ohne Schattenwurf**.
  Das bestehende Frustum-Culling der Engine (Kugeltest je Knoten) zählt sie mit – Gras außerhalb des Bildes kostet nichts (weder Zeichnen noch Schatten noch Wind).
- **Büsche werfen keinen dynamischen Schatten mehr** (`VEGQ.bushShadow = false`): sie sitzen jetzt im ohnehin schattenlosen Bodenpuffer der Kachel (kein zusätzlicher Draw Call);
  sie empfangen weiter Schatten und haben ihr statisches Shading (Vertexfarben). Wieder einschalten: `?vegshadow=1` oder `localStorage.logistika_vegshadow = "1"`.
- **Statische Basis + Auto-Zuschalten (`VEGQ`, `vegStep`):** Standard ist `auto` – zuerst **statisch**. Der Wind wird erst eingeschaltet, wenn unter Last (nur Bilder mit voller Rate, nicht der
  30-Bilder-Ruhemodus) zweimal in Folge 90 Bilder im Mittel ≤ 20 ms brauchten (≥ 50 Bilder/s) und die Szene ≥ 6 s läuft; fällt die Rate unter ~33 Bilder/s, geht er wieder aus (60 s Sperre).
  Manuell: `?veg=static|wind|auto`, `localStorage.logistika_veg` oder `vegMode("static")` in der Konsole; `prefers-reduced-motion` startet statisch. `vegInfo()` zeigt Zustand und Grund.
- **Pause/Reduzierung:** Tab im Hintergrund → `farmLoop` rechnet und zeichnet nichts (zusätzlich zum Browser-Stopp von `requestAnimationFrame`), Stichproben werden verworfen;
  Wind nur für Kacheln im Umkreis von ~28 Einheiten um die Kamera; nach 90 s ohne Berührung (und ohne laufende Aktion) Wind aus; im Sturm bis 2,2-fache Amplitude.
- **Zähler (`R.stats`):** Draw Calls, Dreiecke (Haupt-/Schattendurchgang), Knoten, sichtbare Knoten, schwingende Knoten je Bild.

### Messung (ehrlich)
Es gibt **kein echtes Handy und keinen GPU-Zähler eines Mobilchips** in dieser Umgebung. Gemessen wurde in Chromium/Playwright mit dem **Software-Renderer SwiftShader**
(Viewport 390 × 844, Touch-Profil, DPR 1), drei Waldansichten (Spielkamera, Abstand 22–26), je ~7 s. Bildrate und „GPU-Zeit“ (Timer-Query `EXT_disjoint_timer_query_webgl2`) beschreiben deshalb
die Software-Rasterisierung, **nicht** ein Handy; belastbar sind vor allem die Zähler (deterministisch). Schwankung von Lauf zu Lauf: grob ± 10–15 %.

| Größe (Ansicht 1 / 2 / 3) | v87 | v88 statisch | v88 Wind |
|---|---|---|---|
| Draw Calls (Hauptdurchgang) | 20 / 21 / 25 | 17 / 21 / 25 | 17 / 21 / 26 |
| Dreiecke Schattendurchgang | 72 863 / 74 557 / 84 073 | 43 462 / 43 398 / 58 449 | 43 462 / 43 398 / 58 449 |
| Dreiecke Hauptdurchgang | 39 564 / 41 826 / 41 084 | 38 624 / 41 742 / 40 878 | 38 624 / 41 742 / 41 202 |
| GPU-Zeit je Bild (SwiftShader), Mittel ms | 200 / 207 / 222 | 175 / 184 / 226 | 172 / 193 / 200 |
| CPU-Zeit `R.render` (JS), Mittel ms | 3,1 / 1,3 / 1,8 | 1,9 / 1,3 / 1,3 | 1,5 / 1,7 / 1,8 |
| Bildrate (SwiftShader) | 2,5 / 2,4 / 2,1 | 2,7 / 2,6 / 2,2 | 2,4 / 2,5 / 2,4 |
| JS-Heap MB | 70 / 87 / 61 | 71 / 61 / 59 | 72 / 66 / 60 |

- Sicher: **Schatten-Dreiecke −40 % / −42 % / −30 %** (Büsche und Gras werfen keinen Schatten mehr), Hauptdurchgang praktisch unverändert (Gras und Büsche werden weiter gezeichnet), Draw Calls gleich oder −3.
  Vertexdaten insgesamt unverändert 53,8 MB (nur verschoben). Der Wind kostet in der Messung nichts Messbares (Unterschiede statisch ↔ Wind liegen im Rauschen; im Bild schwingen nur 1–3 Gras-Knoten).
- Nicht belegt: eine Verbesserung der Bildrate oder GPU-Zeit **auf einem Handy**. In SwiftShader liegen die Unterschiede (−12 %, −11 %, +2 % GPU-Zeit) im Rauschen. Nicht gemessen: GPU-Auslastung in %, Akku, echter Speicher auf dem Gerät.
- Auto-Schaltung getestet mit künstlich schnellem bzw. langsamem Render: schaltet bei ~87 Bilder/s zu, bei 23 Bilder/s ab (kein Handy-Test).
- Sicht: Vergleichsbilder v87/v88 (zwei Waldansichten) ohne sichtbaren Unterschied; die Büsche sitzen weiter am Boden.

## v87 (aufbauend auf v86) – Vegetation nach Zonen: Buschgruppen, Lichtungen, Einzelbüsche, Gras an Birken

**Warum es vorher unnatürlich aussah:** In v86 wählte `BUSH.generate` für jeden Busch einen gleichverteilten Zufallspunkt im ganzen Waldgebiet
(nur die „Eignung“ entschied zwischen 5 Kandidaten), Gruppen gab es nur als gelegentliches Paar (25 %). Dadurch stand der Großteil als
Einzelbusch irgendwo zwischen den Bäumen – gleichmäßig über die ganze Karte, ohne Bezug zu Lichtungen, Wegen oder Steinen. (Architektur-Hinweis wie
v86: eigene Engine `gl3d.js`, keine Three.js/React-Instanzen; Kulissenobjekte sind je Kachel zusammengefasste Meshes.)

- **Zonen (Schritt 2):** `worldBushes` (worldview.js) bestimmt Lichtungen aus den vorhandenen Daten: die fünf ausdrücklichen (`FWORLD.clearings`)
  plus freie Flächen aus der Baumdichte (Raster 3 × 3, im Umkreis von ≥ 3,4 Einheiten – der mittlere Baumabstand beträgt 3,4 – kein Baum, zulässiger
  Boden; Überlappungen zusammengelegt; der Steinbereich im Altwald trägt die Art `rock`). Im aktuellen Wald: 13 Lichtungen. Zusätzlich liefert
  `feat()` je Punkt Merkmale 0…1: Waldrand, Schatten/Baumdichte, Nadelbäume, Wegnähe, Lichtungsnähe, Felsen, Wasser.
- **Gruppen (Schritt 3):** `BUSH.generate` plant zuerst Lichtungen (85 % bekommen Büsche; Art offen = 1–2 kleine Gruppen am Rand, Buschlichtung = 2–4
  Gruppen, junge Bewuchsfläche = eine lockere Gruppe aus Jungwuchs/Farn; die Art folgt dem Seed und der Größe, jede Lichtung wird anders), dann
  weitere Gruppen an Wegrändern, Waldrändern/Übergängen, neben Steinen, in Schattenbereichen und lockerem Bestand (Obergrenzen je Art, damit keine Art
  überwiegt). Eine Gruppe hat 2–7 Büsche (an kleine Budgets angepasst), einen Mittelpunkt, einen variablen Radius, eine unregelmäßige Kontur (Lappen), bei ≥ 5 Büschen
  zwei versetzte Teilgruppen, runde Büsche im Kern, breite Unterholzbüsche außen; innerhalb der Gruppe dürfen die Büsche enger stehen (0,72) als zu anderen Gruppen (1,0).
  Die Mitte jeder Lichtung (38 % des Radius) bleibt frei; Gruppen sitzen am Rand (52–88 % des Radius).
- **Typwahl nach Standort:** gewichtetes Los aus globalem Gewicht × Faktor je Standortart (`BUSH.KIND`: z. B. Buschlichtung vor allem rund/breit/Beere, junge Fläche
  Jungwuchs + Farn, Steine breit + Farn, Schatten Nadel + Farn, Wegrand Beere/saisonal/rund, Nadelsträucher nur bei Nadelbäumen) × Ausgleich, der die Gesamtanteile
  nahe den Gewichten hält (jetzt 36/15/15/12/7/9/6 % statt 30/18/12/12/10/10/8 – bewusst abweichend, weil die Standorte die Typen mitbestimmen).
- **Einzelbüsche (Schritt 4):** 20 % des Budgets (nie über 35 %, falls Gruppen keinen Platz finden), kleiner (× 0,9), bevorzugt Waldrand/mittlere Baumdichte/Steine/Lichtungsnähe,
  ≥ 6 Einheiten Abstand zueinander, Abstand zu Stämmen (0,4 + 0,1·s + Radius), überwiegend die kompakten Typen.
- **7 : 1:** unverändert `floor(Bäume / 7)` = 533 bei 3731 Bäumen – Gruppen und Einzelbüsche zählen zusammen zum Budget, 533/533 gesetzt (96 Gruppen mit 425 Büschen, 108 Einzelbüsche). Gras zählt nicht.
- **Gras `grass_tuft` (Schritt 5, `BUSH.grass`, `FWM.grassTuft`):** 6–8 schlanke, gebogene Halme in zwei Segmenten (Rückseite dunkler), 36–48 Dreiecke, drei Varianten, gedämpfte Oliv-/Grüntöne.
  Birken werden an `sp === "birke"` erkannt; ob und wie viel Gras eine Birke bekommt, kommt aus einem **Hash ihrer Lage** (nicht aus einer laufenden Zufallsfolge) – dieselbe Birke bekommt immer dasselbe,
  auch wenn Bäume dazukommen oder gefällt werden. Rund 40 % der Birken (228 von 592) haben 2–5 Büschel im lockeren Halbkreis (Winkel ± 70–110°), 0,15–0,55 vom Stammrand entfernt;
  kein Halm im Stamm, Abstand zu Büschen, Wegen, Hof, Wasser gewahrt. Zusätzlich vereinzelt an Lichtungsrändern, neben Steinen, an Wegrändern und in Übergängen (insgesamt 874 Büschel ≈ 31 000 Dreiecke).
- **Rendering:** wie v86 (gemeinsame Modelle, Einfügen in die Chunk-Puffer, keine Animation), Vegetation einmal beim Aufbau der Welt; alle Daten in `WV.bushes`, `WV.grass`, `WV.bushInfo`.
- **Tests:** `node tests/bushes.test.js` – 31 Tests (v86-Tests angepasst + Gruppen/Einzelbüsche/Lichtungen/Typwahl/kleine Budgets/Gras). Browser: keine Konsolenfehler, Aufbau reproduzierbar (zweimal identischer Hash),
  keine Büsche/Gräser auf Hof, Feldern, Wegen, Wasser; Bildkontrolle im Handy-Format (430 × 900) und 900 × 900 an Lichtungen, Steinen, Birken.
- **Grenzen:** die Vegetation ist statisch (Aufbau der Welt); fallen Bäume, bleiben Büsche und Gras stehen (Stumpf/Setzling zählen weiter). Derzeit gibt es nur 13 Lichtungen – der Großteil der Gruppen
  steht deshalb an Wegrändern, Waldrändern und in Schattenbereichen (37 % der Gruppenbüsche in dichtem Schatten, als Rückfall, wenn andere Standorte voll sind). Terrain ist flach (y = 0), deshalb keine Bodenhöhe.
  Kronen großer Bäume verdecken in der Draufsicht einen Teil der Büsche. Version v87; Dateien: `bushes.js`, `woodmodels.js`, `worldview.js`, `tests/bushes.test.js`, `index.html`, `sw.js`.

## v86 (aufbauend auf v85) – Buschsystem im Wald: sieben Arten, Verhältnis 7 Bäume : 1 Busch

Die Aufgabe war für Three.js/React Native formuliert; LOGISTIKA läuft auf der eigenen Engine `gl3d.js` (kein Three.js, kein
React). Umgesetzt ist es deshalb in der vorhandenen Architektur: Kulissenobjekte werden je Kachel (Chunk) zu einem Mesh
zusammengefasst (`WBuf`), gemeinsame Modelle werden nur kopiert. Es gibt kein `InstancedMesh`, die Chunk-Meshes sind der Ersatz.

- **Neu `bushes.js` (Modul `BUSH`, reine Logik, läuft auch in Node):** zentrale Typtabelle `BUSH.TYPES` (Typname, Gewicht,
  Höhen-/Breitenbereich, Farbpalette, bevorzugte Standorte, Abstandsfaktor, `resource`-Kennzeichen für Beerenstrauch),
  gewichtete Typwahl `pickType`, Abstandsgitter `Spacing` und der Generator `BUSH.generate`.
- **Sieben Arten** (Anteile an allen Büschen): `round_shrub` 30 % · `spreading_shrub` 18 % · `evergreen_shrub` 12 % ·
  `fern_shrub` 12 % · `berry_shrub` 10 % · `young_shrub` 10 % · `seasonal_shrub` 8 %. Modelle in `woodmodels.js`
  (`FWM.bush(typ, variante)`): Ikosaeder-Cluster (rund, breit, saisonal), versetzte Kegelschichten (Nadelstrauch), Fiederwedel aus
  flachen Dreiecken (Farn), Zweige mit Laubbüscheln (jung), verzweigt mit Oktaeder-Beeren (Beere). Je Typ drei Formvarianten,
  alle auf das Nennmaß (Mitte der Bereiche) gebracht; Höhe und Breite je Busch kommen aus der Skalierung.
- **7 : 1:** `BUSH.targetCount(Bäume) = floor(Bäume / 7)` (700 → 100, 140 → 20, 35 → 5). Grundlage ist die **tatsächlich
  platzierte** Baumzahl: Kulissenbäume (Kacheln) plus alle Einträge in `S.farm.trees` (angetippte Kulissenbäume stehen dort, nicht
  mehr in den Kacheln – so wird jeder Baum genau einmal gezählt; Stumpf/Setzling/Windwurf bleiben in der Liste). Es gibt keine
  Wahrscheinlichkeit je Busch: der Generator setzt genau so viele Büsche, wie das Ziel verlangt, solange gültige Standorte da
  sind. Im aktuellen Wald: 3731 Bäume → Ziel 533 → 533 gesetzt (0 Fehlplatzierungen).
- **Platzierung:** Zufallspunkte im Waldgebiet (`forestK > 0,2`), je Busch bis zu 16 Versuche, aus den gültigen Kandidaten gewinnt
  der mit der besten Eignung für den Typ (Waldrand, Schatten/dichter Bestand, Nadelbäume, Wegnähe, Lichtung, Felsen, Wasser – Gewichte
  je Typ in der Tabelle). Gültig = nicht auf/neben Hof, Feldern, Hofgelände, Sägewerk-Hof, Straße, Bach, See, Teich, Lagerplatz, Lichtungsmitte,
  mindestens 1,0 + 0,9 · Radius von der Wegmitte (kein Busch ragt auf den Schotter), Abstand zu Stämmen, Felsen, Totholz und anderen
  Büschen (größere Büsche halten mehr Abstand). Ein Viertel der Büsche steht als Paar neben einem Einzelbusch (Gruppen, ändert
  die Gesamtzahl nicht). Findet sich kein Platz, bleibt die Zahl darunter (`WV.bushInfo.shortfall`) – es wird nichts erzwungen.
- **Reproduzierbar:** alle Zufallswerte kommen aus `wRng(7331 + 4242)` und werden beim Aufbau der Welt einmal bestimmt und in
  `WV.bushes` gespeichert (`{ id, typeId, position, rotationY, scale[w,h,w], variantSeed, tint }`) – kein `Math.random`, nichts wird je
  Frame neu gewürfelt. Gleiche Welt → gleiche Büsche (zweimal gebaut: identischer Hash).
- **Performance:** je Typ drei gemeinsame Modelle (Float32Array), je Instanz nur Drehung, Breite/Höhe und Helligkeitsfaktor beim
  Einfügen in den Chunk-Puffer (`WBuf.add(m, x, z, ry, s, sy, k)` – neu: eigene Höhenskalierung und Farbfaktor); keine Materialien je Busch,
  keine Animation, kein Licht, kein Objekt je Frame. 533 Büsche ≈ 110 000 Dreiecke über die ganze Karte (Ø 208 je Busch, davon nur
  die sichtbaren Kacheln im Bild), Beeren sind Oktaeder (8 Dreiecke). Der alte einzelne Waldboden-Busch (`FM.bushes()` an Wegen) entfällt,
  Farn/Pilze/Totholz bleiben; die Zufallsfolge des Kulissenbaus ist unverändert (Bäume bleiben wo sie waren).
- **Tests:** `node tests/bushes.test.js` (17 Tests: Typtabelle und Größen, 7:1 mit 700/140/35, gewichtete Typwahl, Reproduzierbarkeit,
  Unabhängigkeit von der Baumreihenfolge, keine Überlappung, gesperrte Flächen, Fehlschlag ohne Erzwingen, Gruppen, bevorzugte Standorte).
  Außerdem im Browser-Test (Playwright/SwiftShader): keine Konsolenfehler, Aufbau reproduzierbar, alle Büsche außerhalb gesperrter Flächen,
  Bildkontrolle im Handy-Format (430 × 900) und eine Galerie aller 7 Typen × 3 Varianten.
- **Grenzen:** die Buschzahl wird beim Aufbau der Welt bestimmt und ändert sich nicht, wenn einzelne Bäume später fallen
  (sie bleiben als Stumpf/Setzling in `S.farm.trees` und zählen weiter); beim nächsten Aufbau der Welt kommt dieselbe Menge heraus. Die
  Kronen großer Bäume verdecken in der Draufsicht einen Teil der Büsche – das ist so gewollt (Unterholz). Ein Sammelmechanismus für
  den Beerenstrauch existiert nicht (nur `resource: true` in der Tabelle). Neue Dateien: `bushes.js`, `tests/bushes.test.js`; geändert:
  `woodmodels.js`, `worldview.js`, `index.html`, `sw.js` (Version v86).

## v85 (aufbauend auf v84) – Sägen als 3D-Ego-Minispiel

- **Neu `fpsaw.js` (Modul `SAW3D`)**: Beim Fällen mit der Säge fliegt die Kamera in 0,95 s weich vom Hof-Blick direkt vor den
  Stamm (Ego-Sicht, leichte Zoom-/FOV-Änderung). Die Low-Poly-Säge steht im Vordergrund und zielt auf die Schnittstelle.
  (Eigene Engine `gl3d.js`, kein Three.js.)
- **Fallkerb in 3D:** grüne Zielzone (gelbe Perfekt-Zone) als Ring am Stamm, die rote Markierung pendelt darüber –
  der Button / Tippen auf den Bildschirm setzt den Kerb. Treffer: Säge stößt vor, Kamerawackeln, Späne (kleine gelb-braune
  Würfel), Kerb sichtbar im Stamm. Fehlschlag: Säge prallt zurück, kräftiges Wackeln, Ausdauer sinkt, kein Fortschritt.
- **Fällschnitt:** halten = Säge vibriert, Schlitz wächst quer über den Stamm, Späne fliegen; Überhitzen = Säge stockt, Rauch.
- **Abschluss:** Kamera schwenkt in 1,25 s zurück, der Baum kippt (langsames Ankippen, Aufprall mit Nachfedern), zerfällt in
  einen kurzen Holzstapel, der verschwindet; danach Belohnung wie bisher.
- **Überarbeitung (Ego-Sicht ohne Menü):** Die Fenster-Leiste ist in 3D komplett weg (nur ✕ bleibt); Tippen/Halten irgendwo
  auf dem Bild. Überhitzung = Balken an der Säge (grün/orange/rot) plus Rauch, kurzer Hinweis oben. Der Baum verrät den Fall:
  ab ca. 25 % neigt er sich in Fallrichtung und zittert stärker. In der Ego-Sicht sind alle Meldungen, Chips und
  Seitenleisten ausgeblendet (`body.fp3d`).
- **Nachbesserung:** Hitze-Anzeige als großer Thermometer-Balken links im Bild (pulsiert bei Überhitzung); in der Ego-Sicht
  steht ein klarer Nahaufnahme-Stamm in Rindenfarbe vor dem Baum (Äste/Nadeln verdecken die Zone nicht mehr); der Fällschnitt
  hat einen dunklen Schlitz mit hellem Holzrand, der sich quer über den Stamm zieht.
- **Kerbe/Zittern:** Die Kerbe ist ein dunkler Keil mit hellem Holzrand (klar erkennbar). Der Baum zittert nicht mehr, er neigt
  sich nur noch gleichmäßig (max. 0,13 rad); Kerbe und Schnitt wandern mit der Neigung mit.
- **V-Kerb als echte 3D-Geometrie** (`fpsaw.js`, `notchMesh`): Stamm besteht aus drei Teilen (unten / Kerb / oben). Der Kerb-Teil ist
  ein Zylinder, der an einer 58°-Dachebene beschnitten ist (schräger Oberschnitt) und eine waagerechte Sohle (Kreissegment) hat;
  Rinde außen, frisches Holz (#F2D9AC / #E8C590, leuchtend) innen. `kerbProgress` (`X.kpv`, 0…1, Ziel `X.kpT`) bestimmt die
  Tiefe bis 65 % des Durchmessers; Mesh wird in 20 Stufen gecacht. Zwei Treffer nötig (3D): 1. Treffer 0,3, 2. Treffer 0,6,
  im Fällschnitt vertieft die Säge bis 1,0. Sägeschiene zielt in die Kerbtiefe. Kamera-Neigung 0,3 (Sohle sichtbar).
- **Kerbe für alle Bäume:** echter Stammradius je Art/Größe (`trunkR`, wie `woodmodels.js`), Kamera-Abstand skaliert mit dem Stamm;
  der echte Baum (Krone/Nadeln) ist in der Ego-Sicht ausgeblendet, stattdessen Nahaufnahme-Stamm + einfache Krone (kein
  Zugewuchert-Sein bei Fichten). Kerbe steiler (KS 1,9), Innenholz mit Farbverlauf (dunkel an der Spitze → hell an der Öffnung,
  leuchtend), wächst gleichmäßig mit Spänen am Maul; Kamera fährt nach dem 1. Treffer näher an die Kerbe heran.
- **Stamm aus einem Stück:** unteres Stück, Kerb und oberes Stück sind jetzt EIN Mesh (gleiche Punkte an den Nahtstellen) –
  keine Farbunterschiede oder Fugen mehr zwischen den beiden Baumhälften; Stamm gerade statt verjüngt.
- **Nadelbäume (Fichte/Kiefer):** statt Kugelkrone eine Krone aus gestaffelten Kegeln, damit sie in der Ego-Sicht wie Tannen wirken.
- **Sichtschutz:** Vor der Kamerafahrt prüft `pickView` 13 Blickrichtungen um den Baum (Abstand/Korridor zu echten und
  Kulissenbäumen) und wählt die mit dem wenigsten Hindernis (nächstliegende bevorzugt, kürzester Drehweg). Steht trotzdem noch ein
  Baum im Weg, wird er für die Dauer des Minispiels ausgeblendet (echte Bäume unsichtbar, Kulissenbäume aus der Kachel genommen)
  und danach zurückgesetzt.
- **Eichen & breite Bäume:** Die Ersatz-Krone liegt jetzt immer über der Bildoberkante (aus Kamerahöhe/-abstand berechnet, Größe
  nach Stammradius); der Nahaufnahme-Stamm reicht bis dorthin. Dicke Eichen verdecken die Kerbe nicht mehr.
- **Fehler behoben (Anflug):** Die Ersatz-Krone/-Stamm waren schon während der Zoom-Fahrt sichtbar (jeder Baum wurde kurz zur
  „Tanne“ in seiner Farbe). Jetzt wird erst kurz vor der Ankunft (>92 % der Fahrt) getauscht; im Anflug sieht man den echten
  Baum. Ausgeblendete Kulissenbäume werden ebenfalls erst dann aus der Kachel genommen.
- **Kerb rechts, Fall nach rechts:** Der V-Kerb sitzt (aus Spielersicht) auf der rechten Stammseite – Öffnung nach rechts, die Spitze
  wandert beim Sägen nach links in den Stamm (`faceOf`, 75° von der Blickachse nach rechts, damit man das helle Innenholz noch sieht).
  Die Säge arbeitet sich von rechts nach links in den Kerb. Die Fallrichtung ist genau diese Richtung (`st.dir`); die Kamera-Blickrichtung
  wird so gewählt, dass rechts möglichst frei ist (`fallBlocked`, sonst „Baum hängt“-Chance wie bisher).
- **Fall-Animation (`SAW3D.fall`/`fallStep`):** Stumpf bleibt stehen, oberes Stück + Krone knicken an der Kerbsohle ab (Drehpunkt unten
  rechts), Winkel beschleunigt θ ∝ t^2,2 (langsamer Beginn, schneller Aufschlag), danach rutscht der Stamm auf den Boden. Aufschlag:
  Kamerawackeln, Staub und Holzspäne (Würfel), Holzstapel (`treeLanded`/`stepLogs` in `worldview.js`) und die Kamera schwenkt zurück.
- **Säge aus Sicht des Waldarbeiters (Referenzfoto):** Das Gehäuse hängt fest im Kameraraum vorn unten im Bild (von hinten/oben gesehen,
  hinterer Griff zum Spieler; Tiefe hinter der Nahebene, Größe skaliert mit der Tiefe, Breite abhängig vom Seitenverhältnis). Die Schiene läuft
  leicht schräg nach vorne in den Kerbmund und liegt flach auf der Sohle; sie ist ein eigenes Teil mit Einheitslänge, das so weit gestreckt wird,
  dass die Spitze (eigenes Teil, runde Nase) im Kerb steckt. Dachschnitt (1. Treffer): Rolle um die Längsachse (`ROOF_ANG`, 35°), damit die Platte
  in der Dachfläche liegt; Sohlen- und Fällschnitt flach. Beim Sägen schiebt sich die ganze Säge entlang der Schiene tiefer (Kerbtiefe + kleines
  Vor/Zurück), in Ruhe ein Stück zurück; Vibration seitlich/oben. Sägemehl fliegt vom Kerbmund zum Spieler/seitlich weg.
  Kamera unverändert gegenüber der letzten Runde (niedriger, Blick leicht auf die Kerbseite). Das gemeinsame `FWM.tool` bleibt unverändert.
- **Säge erscheint erst beim Sägen:** Während der Anflug-Kamera ist die Säge unsichtbar; erst wenn die Kamera angekommen ist, blendet sie
  in 0,4 s ein und gleitet leicht von unten ins Bild (`X.app`; Zeichenreihenfolge Spitze → Schiene → Gehäuse, damit das Einblenden sauber aussieht).
  Vor dem 1. Treffer zielt sie ruhig auf die Mitte des grünen Bereichs statt der wandernden Markierung hinterher.
- **Keine iOS-Lupe mehr:** Langes Halten (Sägen) hat auf der Ergebniskarte Text markiert und die Lupe gezeigt. Jetzt ist Textauswahl überall aus
  (`*{user-select:none}`, Eingabefelder ausgenommen) und `selectstart` wird abgefangen (`minigames.js`).
- **Stämme wie im restlichen Spiel:** Der Nahaufnahme-Stamm (vor und nach dem ersten Treffer, samt bleibendem Stumpf) hat jetzt je Art dieselbe
  Rindenzeichnung wie die Spielbäume (`barkStyle`, `plainTrunk`): Birke weiß mit dunklem Fuß und schwarzen Flecken, Kiefer unten graubraun/oben
  fuchsrot, Eiche mit dunklen Streifen, Kirsche mit hellen Ringen, Fichte/Buche einfarbig wie im Spiel. Wände werden an den Farbwechseln geteilt;
  `t.cut` speichert dafür zusätzlich `sp`/`sz`.
- **Stumpf als eigenes, bleibendes Mesh:** `notchMesh(…, "low")` hat jetzt die fertige Bruchform: flache Sohle rechts (Kerbseite), links eine
  unregelmäßig erhöhte Bruchleiste mit senkrechter Stufe (`STEP`, `lh()`); das obere Stück (`"up"`) bekommt dazu die formgleiche Unterseite.
  Beim Fall kippt nur `upB/upW` (+ Krone), der Stumpf bleibt stehen. `SAW3D.fall` vermerkt die Form am Baum (`t.cut = {q, ny, sc, ry, bark}`),
  `worldview.js` baut daraus den bleibenden Stumpf (`SAW3D.stumpMesh`, Rinde + Holz in einem Mesh, `wood === 2`) – bis der Setzling
  nachwächst (`treeUpdate` löscht `cut`). Spielstände ohne `cut` zeigen weiter den alten Stumpf.
- **Rindenfarbe bleibt beim Ansetzen der Säge gleich:** Das Rindenmuster hing bisher an der Segmentnummer, und der glatte Stamm war anders
  gedreht als der Kerb-Stamm – beim ersten Treffer sprangen Flecken/Bänder. Jetzt richtet sich die Farbe nach Höhe und absolutem Winkel
  (14 Sektoren, `barkStyle().bf(y, Winkel)`), der glatte Stamm hat dieselbe Drehung (`ry = fryN`), und alle Ringe des Kerb-Meshs liegen auf
  denselben Facettengrenzen (`angs()`/`strip()` in `notchMesh`) wie `plainTrunk`. Nachgemessen: Kiefer/Kirsche 0 Abweichungen,
  Birke/Eiche nur wenige Randdreiecke an der Kerböffnung.
- **Kamera meidet Zäune, Mauern und Gebäude:** `pickView` prüft jetzt nicht nur Bäume, sondern auch Hofzaun/Steinmauer (mit Toren), Sägewerkszaun,
  Gebäude und Ausläufe (`obstacles()`, `sightCost()`: Sichtlinien vom Auge zu Stammfuß, Mitte und seitlich – vor und nach dem 1. Treffer).
  Neben der Blickrichtung (13 Winkel) werden auch Abstand (100/80/65 %) und Neigung (+0,15/+0,3) variiert; auch ein Zaun, über den man nur
  hinwegsieht, kostet Punkte. Man sägt nicht mehr „durch den Zaun“.
- **Fallender Baum sieht aus wie der Spielbaum:** Krone und Äste des Baums (`woodmodels.js tree()` merkt sich dafür `b.tk` = Ende des Stammteils
  und `b.tp` = Radius unten/oben, Höhe, Neigung) werden unverändert übernommen (`crownMesh`) statt der Ersatzkrone; sie stehen im selben Bezugssystem
  wie die Stammteile, neigen sich mit und kippen im Fall um dieselbe Achse. Der Ersatz-Stamm hat jetzt Verjüngung und Neigung wie der echte
  (`taperB`), Höhe wie am Spielbaum (mind. 2,1) und die Rindenzeichnung nach Baumgröße `t.s`. Fichten: die untersten Äste (unter 1,3) entfallen
  in der Ego-Sicht, sonst verdecken sie die Schnittstelle. `t.cut` speichert zusätzlich `s`.
- **Birke: keine Zacken am Fuß, stabile Querstreifen:** Die Zacken am Übergang dunkler Fuß → weiße Rinde entstanden, wenn Dreiecke des Kerb-Meshs
  über die Farbgrenze reichten (je Dreieck nur eine Farbe). Rindendreiecke werden jetzt an den Farbgrenzen der Art geschnitten (`emitBark`,
  `splitF`) – die Kante ist gerade. Die Birkenmaserung sind schwarze, querliegende Streifen mit spitzen Enden wie bei echter Birkenrinde (teils
  lang um den Stamm, teils kurze Striche, in Reihen; je Baum eigene Verteilung über `t.id`). Sie werden an einem **festen Gitter** (Höhe × Winkel)
  geschnitten und mit Farbe je Ecke ausgegeben – das Gitter hängt nicht von der Form des Kerb-Meshs ab, deshalb bleibt das Muster beim Sägen,
  Kippen, Fallen und am Stumpf exakt gleich (vorher änderten sich die Flecken mit jedem neuen Mesh). Am Spielbaum (`woodmodels.js`) sind die
  Marken ebenfalls dünne, lange Striche aus drei überlappenden Sechseck-Scheiben (Zufallsfolge unverändert, Kronen bleiben gleich).
- **Beute-Karte („Birke gefällt!“) schließt per Tipp:** Ein Tipp irgendwo auf dem Bild (oder auf die Karte) blendet sie aus; der Tipp geht
  trotzdem durch. Sonst weiterhin automatisch nach 2,6 s (`fellReward` in `worldview.js`).
- Fallback: ist die Ansicht nicht verfügbar, läuft das alte 2D-Minispiel. Axt bleibt 2D.
- Geändert: `minigames.js`, `worldview.js` (`worldFell`, `stepFalling`, `worldBusy`), `farmview.js` (`clampCam` bei `FV.fp`),
  `style.css` (`.mg3d`), `index.html`, `sw.js`. Neu: `fpsaw.js`.

## v84 (aufbauend auf v83) – Weg gestreckt, sauberer Übergang, ein großer Lichtkreis

- **Wegverlauf gestreckt** (`erbe.js` `FWORLD.paths[1]`): die letzten ~15 Einheiten laufen schnurgerade (Bildschirm senkrecht)
  auf den Platz zu, die Kurve liegt weiter hinten und ist flacher (Umzug `F.v83p` für Bäume auf der neuen Linie).
- **Fehler in der Wegzusammensetzung behoben:** der zusätzliche Kiesstreifen (`funnel`) lag als eigene Ebene über dem
  Weg – mit Farbstufe und harter Kante. Weg: jetzt über die vorhandene Auslauf-Funktion `fade` (`worldview.js`,
  `wayFade`) – die letzten 7 Einheiten gehen samt Rand weich in die Kiesfarbe des Platzes über (`CAMP.GRAVEL`).
  Nur ein paar Kiesel bleiben am Wegende liegen.
- **Beleuchtung nachts:** statt vieler kleiner Lampenkreise ein großer, gleichmäßiger warmer Lichtkreis um das Feuer über
  den ganzen Platz (sieben weiche Stufen, flackert leicht). Die Lampen behalten ihre leuchtende Birne.
- `index.html`/`sw.js`: v84.

## v83 (aufbauend auf v82) – Weg gerade auf den Lagerfeuerplatz, Pflanzen nicht mehr durch die Wand

- **Wegverlauf:** der Hauptweg (`erbe.js` `FWORLD.paths[1]`, letzte Punkte) läuft jetzt in der Blickrichtung gerade auf den
  Platz zu – auf dem Bildschirm senkrecht und mittig zum Eingang; der Kiesstreifen (`camp.js` `funnel`) sitzt in derselben
  Achse, Endfarbe an den Weg angeglichen. Bäume auf der neuen Linie weichen oder entfallen (Umzug `F.v82p`).
- **Pflanzen:** stehen etwas weiter von der Wand weg; alles, was über die Rück- oder Seitenwände hinausragt, wird
  abgeschnitten (`camp.js` `trim`: Dreiecke mit einer Ecke hinter der Wand entfallen).
- `index.html`/`sw.js`: v83.

## v82 (aufbauend auf v81) – Lagerfeuerplatz: Wand, Eingang, Seitenwände

- **Hängezweige von der Wand entfernt** (die grünen „Steine“ und dünnen Stäbe in der Holzwand).
- **Eingang läuft fließend in den Weg:** der Kies verjüngt sich als Streifen mit Farbverlauf (Kiesgrau → Wegsand) in den
  Waldweg, nach außen immer weniger Steine; die dunklen Kantenplatten vorn sind weg (`camp.js` `funnel`).
- **Zwei Seitenwände** docken links und rechts an die Rückwand an und reichen bis vorn; nur die Blickseite bleibt offen.
  Bäume und Kulisse im Wandbereich sind entfernt (`CAMP.clear`, Umzug `F.v81u` für bestehende Stände).
- `index.html`/`sw.js`: v82.

## v81 (aufbauend auf v80) – Lagerfeuerplatz und Mittagspause

**Neu: `camp.js`** (eigenes Modul, in `index.html`/`sw.js` eingetragen) – der Lagerfeuerplatz am Ende des Hauptwegs im Wald
(Weg 1, Welt ≈ −53 / −120,5; die alte Lichtung mit Baumstamm ist dort ersetzt, `worldview.js` `campEnd`).
- **Szene:** runde Feuerstelle aus dunklem Naturstein (hellere Deckplatten, Scheite, Asche, animierte Flammen + Funken +
  Lichtschein), drei geschwungene Sofas im offenen U zur Kamera (links, hinten, rechts, taupe/greige, Anthrazit-Rahmen,
  Zierkissen), dunkle Holzwand (Walnuss/Kastanie, senkrechte Latten), Pflanzen in mehreren Tiefen (große Blätter, Farne,
  Büsche, Gräser, Weinrot-Akzent, Bodendecker, Hängezweige – nichts im Sitzbereich), Kies mit Randsteinen und freiem
  Zugang vom Weg, Korbsessel links vorn, Steine/Hocker rechts vorn, sieben Gartenlampen. Nachts leuchten Lampen (Lichtinseln)
  und Feuer; es gibt keine dynamischen Lichter, kein Nebel, keine Tiefenschärfe (Handy-tauglich: ein starres Modell
  ≈ 14 500 Dreiecke, 9 kleine bewegliche Knoten; `zcheck` ohne Befund).
- **Neun feste Plätze** `worker_slot_01 … 09` (`CAMP.slots`: id, Gruppe, Sitz, Welt-/Ortsposition, Blickrichtung zum
  Feuer, Haltung). Belegung `S.farm.camp.slots = { slotId: staffId }` (gespeichert, springt nie um); `CAMP.assign / remove /
  slotOf / workerOf / free / slotFor`. Leere Plätze = leeres Sofa (kein Platzhalter, keine unsichtbaren Figuren).
  Haltung je Platz in `CAMP.POSES` (Drehung, Arm, Neigung – keine zwei gleich), `CAMP.pose(slot)` ist die Stelle, an der
  später eine Animation einsteigt.
- **Mittagspause 12–13 Uhr** (`team.js` `staffLunch`, Job `k:"lunch"`): jede Kraft (außer auf Fortbildung/Fahrt) läuft
  über das normale Wegenetz (A*) zum eigenen Platz – wer weit weg ist, geht ab 11:00 früher los, wer arbeitet, macht erst fertig –,
  setzt sich (Sitzfigur: `FWM.person({ sit: true })`, Werkzeug weg), schaut zum Feuer und steht um 13:00 auf, dann
  weiter wie gewohnt. Rolle → Platz in der Reihenfolge der Rollen (Landwirt 1 … Fischwirt 9), Vertretungen nehmen den ersten
  freien. Entlassene geben ihren Platz frei. Weniger als neun Leute: nur diese Plätze sind besetzt.
- **Sprechblase:** Antippen einer Kraft in der Pause zeigt eine quadratische weiße Blase, schwarzer Rand, runde Ecken, mit
  „*Mittagspause*“ in blasser Kursivschrift (`style.css` `.lunchb`); außerhalb der Pause bleibt die bisherige Blase.
- **Freihalten:** keine fällbaren Bäume (Umzug `F.v81t` für alte Stände; neue Welt: nach der Ziehung gefiltert, Nummern
  bleiben) und keine Kulissenbäume/-pflanzen im Platz und im Sichtkeil zur Kamera (`CAMP.clear` in `bgTreeOk`).
- `woodmodels.js` `person`: Option `sit`. `index.html`/`sw.js`: v81.

## v80 (aufbauend auf v79) – Erbe-Level und Spedition-Level auseinanderhalten

Nach der Gründung hat das Erbe (Hof, Wald, Sägewerk, See) sein eigenes Level und die Spedition ein eigenes (je eigene
EP) – das war in der Kopfleiste nicht zu unterscheiden („warum nur Level 3?“). Jetzt (`game.js` `renderHud`, `style.css`):
- **Hof-Reiter = Erbe:** grüne Kopfleiste, Level-Chip „🏡 Lv 12“ in Gold, goldener EP-Balken mit „🌾 40 / 1.150 EP“,
  rechts „Erbhof · Werder“. **Karte, Aufträge, Flotte … = Spedition:** blaue Kopfleiste, „🚚 Lv 3“ in Türkis,
  türkiser Balken mit „⭐ 2 / 250 EP“, „Etappe 1 · Berlin“. Antippen/Halten am Chip zeigt einen Hinweis (title).
- **Farbanimation beim Wechsel:** die grüne Schicht blendet weich ein/aus (0,6 s), der Level-Chip klappt um, über den
  EP-Balken läuft ein Glanzstreifen (nur ohne „weniger Bewegung“-Einstellung). Vor der Gründung (nur Erbe) bleibt alles
  wie bisher.

## v79 (aufbauend auf v78) – Autos im Auktionshaus als KI-Zeichnungen (Comic-Vektor-Stil)

- **Zeichnungen gehen den Fotos vor** (`auction.js`, `loadLocalPics`): `cars/art.json` nennt je Auto eine Datei in
  `cars/art/` (`{ "f458": "art/f458.webp?v=<Größe>" }`). Das Spiel zeigt sie direkt, **ohne Comic-Filter**; Credit
  „🎨 KI-Illustration“. Fehlt eine Zeichnung, gilt wie bisher Foto → Comic-Filter → gezeichnete Silhouette. Wird eine
  Zeichnung aus der Liste genommen, räumt das Spiel sie auf. `sw.js` hält `cars/art/…` im Foto-Cache; das `?v=` in
  der Liste sorgt dafür, dass ein neu gemachtes Bild den Cache ersetzt.
- **`carart.mjs` + Aktion „Autozeichnungen erzeugen“** (`carart-workflow.yml` → `.github/workflows/carart.yml`):
  fragt die Gemini-Bild-KI (`gemini-2.5-flash-image`, 16:9) je Auto mit einer festen Stilvorgabe (saubere Konturen,
  flache Farben, Dreiviertelansicht, hellgrauer Grund, nur das Auto), verkleinert auf 960 px WebP (`sharp`) und legt
  alles als Commit ab. Der Schlüssel liegt als Repository-Geheimnis `GEMINI_API_KEY` (nie im Code/Protokoll, Header
  statt URL). „limit 3“ zum Ausprobieren, „limit 0“ für alle. Bei Fehlern (Modell/Schlüssel) listet das Protokoll die
  Bild-Modelle des Schlüssels. Auch selbst gemachte Bilder (`cars/art/<Kürzel>.png|jpg|webp`) werden beim Hochladen
  automatisch in `art.json` aufgenommen (Push-Auslöser der Aktion).
- `autobilder-prompts.txt`: die 77 fertigen Bildanweisungen zum Selbstmachen in der Gemini-App (`node carart.mjs --prompts`).

## v78 (aufbauend auf v77) – Autofotos: Wikimedia-Bilder werden wieder akzeptiert

- **Ursache für „Bilder laden nicht“ gefunden:** Wikipedia liefert Vorschaubilder inzwischen von `thumb.wikimedia.org`
  statt `upload.wikimedia.org`. Die Adressprüfung `okSrc` (`auction.js`) ließ nur `upload.…` zu und verwarf damit alle
  77 Fotos. Jetzt sind beide Hosts erlaubt; der Service Worker (`sw.js`) legt auch `thumb.…` in den Foto-Cache.
- **`carpics.mjs`:** gleiche Korrektur (die Aktion „Autofotos holen“ hatte aus demselben Grund 0 Fotos geholt); entfernt
  die `?utm_…`-Anhänge der Bild-Adressen, zweiter Weg über die Wikipedia-Kurzinfo, Diagnose-Ausgabe im Protokoll und
  roter Lauf, wenn kein Foto geholt wurde.

## v77 (aufbauend auf v76) – Autofotos, Karte nur so weit wie erschlossen, Steg ohne Flimmern, Wege sauber

1. **Auktionshaus: Fotos zuverlässig** (`auction.js`, neu `carpics.mjs`, `carpics-workflow.yml`):
   - **Eigene Fotos im Spiel:** liegt `cars/credits.json` (mit `cars/<id>.jpg`) im Repository, nimmt das Spiel diese
     Fotos zuerst (`loadLocalPics`) – gleiche Seite wie das Spiel, kein Wikipedia nötig, auch wenn es blockiert ist.
     Der Service Worker hält sie versionsübergreifend im Foto-Cache (`sw.js`). Der Comic-Filter läuft wie gehabt.
   - **Holen per GitHub-Aktion „Autofotos holen“**: `carpics.mjs` fragt Wikipedia nach dem Titelbild jedes der 77 Autos,
     lädt es in 500 px, schreibt Urheber und Lizenz nach `cars/credits.json` und legt alles als Commit ab. Die Aktion
     muss einmal als `.github/workflows/carpics.yml` angelegt werden (Vorlage `carpics-workflow.yml`, Inhalt kopieren).
   - **Kein Zehn-Minuten-Aus mehr:** Schlug die Abfrage fehl, merkte sich das Spiel für alle 77 Autos „kein Foto“ –
     daher „0 von 77 Fotos geladen“ ohne Fehler. Jetzt nur noch, wenn die Abfrage selbst geklappt hat; sonst neuer
     Versuch nach 45 s, 2 und 5 Minuten.
   - **Gezeichnete Autos** statt Silhouette (`carArt`, `CAR_ART`): Seitenansicht im Comic-Stil je Bauform (Coupé,
     flacher Mittelmotor-Keil für Super-/Hypercars, Roadster, SUV, Kombi, Limousine, Klassiker mit Chrom und
     Weißwandreifen), Lack mit Glanzverlauf in der Originalfarbe, Scheiben, Radhäuser, Felgen, Lichter.
2. **Karte** (`index.html`, `game.js`, `map.js`): die Knöpfe ☁️ und 📡 oben rechts sind weg. Der Nebel ist immer an
   (`load` setzt `fog = true`); live verfolgt man über „Live“ oder das Fahrzeug. **Verschieben und Herauszoomen enden am
   erschlossenen Gebiet** (`mapBoundsUpdate` → `map.setBounds`): Sichtkreise der freigeschalteten Orte plus Fahrzeuge,
   18 % Rand. Auf dem Hof ist das die Gegend um Hof und Kundschaft, mit jeder Etappe/jedem Level mehr.
3. **Angelsteg flimmerte** (`woodmodels.js` `pier`): die Pfahlköpfe lagen genau in der Belagfläche (y = 0,15) –
   jetzt enden sie 5 mm darunter. **Neues Prüfwerkzeug `zcheck.js`** (wird vom Spiel nicht geladen): zeichnet jedes
   Modell aus der Spielkamera von vier Seiten und findet Flächen, die gleichauf liegen (Tiefentextur, MIN/MAX-Blend).
   Damit gefunden und behoben: Lieferkiste (Eckbeschläge), Schatztruhen-Deckel (Goldbänder), Deckelstern,
   Kuhunterstand, Schweinehütte, Handwagen, Scheune (Eckleisten), Kuh (Maul), Solar-Bulli, Bert-Kombi (Säulen, Grill),
   Strand (Muscheln). Vor jeder Ausgabe: `zcheck()` in der Konsole – übrig bleiben nur zufällige Schilfhalme.
4. **Wege: Übergänge und Ränder** (`woodmodels.js`, `worldview.js`):
   - An Mündungen und Abzweigen blitzte am Ansatz jeder Rundung ein heller Keil ins Gras: Bogenrand und Wegrand lagen
     gleich hoch, der äußere (grasfarbene) Teil des Wegrands gewann. Der Bogenrand liegt jetzt eine Spur darüber
     (am Abzweig auch über dem Rand des Hauptweges, `tee.ey`).
   - **Tore des Sägewerkshofs:** der Weg reicht 1 Einheit in den Hof und läuft dort samt Rand in die Schotterfarbe aus
     (`wayFade`, `o.fade`); Hofschotter und Boden rundherum haben dieselbe Farbe (`FWM.YARD_COL`). Kein Laub im Tor.
5. **Bäume auf den Wegen** (`erbe.js`, `worldview.js`): Bäume standen nur 2,2 vom Weg – egal wie groß die Krone.
   Jetzt muss die ausgewachsene Krone neben dem Schotter bleiben (`FTREE_CR` je Art und Größe, Kameraseite +0,9).
   Fällbare Bäume rücken bis 2,5 weg oder fallen weg (`treeOffPath`; neue Spiele gleich, alte Stände einmal `v77t`;
   die übrigen Bäume behalten ihre Nummern). Kulissenbäume, Büsche und Totholz halten ebenso Abstand (`wayGap`).
   Betroffen u. a. die große Eiche am Westtor des Hofs und die Kiefer am Teichweg nordöstlich des Hofs.
- `index.html`/`sw.js`: v77.

## v76 (aufbauend auf v75) – „jetzt machbar“, Tutorial-Spotlight, kürzeres Tutorial, Lina-Tipps

1. **Filter „✅ jetzt machbar“** (`game.js` `orderDoable`): zählt und zeigt nur noch, was sofort losfahren kann –
   passendes Fahrzeug frei **und** bei Hofware die ganze Bestellung im Lager (vorher zählten Bestellungen mit
   „fehlt noch 3/13“ mit, weil nur das Fahrzeug geprüft wurde). Die Sortierung „📍 Leerfahrt“ nimmt dieselbe Regel.
2. **Spotlight im Tutorial** (`intro.js` `renderTutStep`, `tutScrollBind`, `tutFollow`):
   - Das Ziel wird jetzt auch im großen Tutorial in die Liste gescrollt und **mittig in den freien Teil neben Lina**
     gerückt (vorher nur bei den späteren Gesprächen – darum lag der Auftrag unter „Live“ halb hinter der Leiste).
     Unten in der Liste gibt es im Tutorial Platz (`padding-bottom: 45vh`), damit auch die letzte Karte in die Mitte kann.
   - **Wischen und Mausrad** auf den Sperrscheiben scrollen die Liste bzw. den Planer; das Leuchtfenster läuft sofort
     mit. Tippen bleibt gesperrt (außer „Weiter“ und das leuchtende Feld).
3. **Tutorial gekürzt** (`intro.js` `TUT_STEPS`): von 15 auf **5 Blasen** (2 davon zum Mitmachen):
   Fahrzeug zeigen → Übung antippen → annehmen (mit einem Satz zum Deckungsbeitrag) → unter „Live“ zuschauen → Uhr.
   Raus: Stecknadel-Farben, Leerfahrt-Radar, Minikarte, Fahrzeugwahl, Profi-Trick, Flotte, Büros, Diensthandy.
   Neu: Schrittzähler („2/5“) und „Kenn ich schon – überspringen“ in der ersten Blase.
4. **Linas Gespräche gekürzt**: Mr. Snus 5 → 2, Ziele/Konkurrenz 5 → 2, Don Pablo 5 → 2, Büros 5 → 2,
   erstes Büro 14 → 3, Auktionshaus 4 → 2. Übrig bleibt, was man wissen muss, um nicht in eine Falle zu laufen
   (Fahnder, Interpol, Stimmung unter 70 %, ohne Disposition läuft nichts). Die Stellen im Büro erklärt Lina
   weiter auf Zuruf; unter „Welt“ lässt sich alles wiederholen.
5. **Hof-Rundgang gekürzt** (`farmview.js` `FTUT_HOF`): 12 → 9 Schritte – Gießen, Füttern und Bäumefällen sind raus.
   Alte Spielstände mitten im Rundgang werden auf die neue Schrittfolge umgerechnet (`T.v76`).
6. **Neu: Lina-Tipps** (`intro.js` `linaHint`): kleine Blase mit Linas Gesicht, blockiert nichts, die Uhr läuft weiter,
   Tipp drauf schließt, nach ein paar Sekunden geht sie von allein; jeder Tipp nur einmal (`S.tutSeen.h_*`). Sie bringen
   das Weggelassene genau dann, wenn es passt:
   - erste Zustellung → Anschlussauftrag am Ziel ohne Leerfahrt (`game.js`),
   - zweites Fahrzeug → auf Stadtteile verteilen (`game.js` `acquire`),
   - erster Anruf → Diensthandy (`offices.js` `phoneMsg`),
   - Hof: erstes Säen nach dem Rundgang → Gießen, erste Eier → Füttern (`farmview.js` `farmHintFor`).
   Während eines Tutorials/Gesprächs warten sie; Meldungen unten rücken für die Blase nach oben.
- `index.html`/`sw.js`: v76.

## v75 (aufbauend auf v74) – Wegenetz, Einmündungen, Bachenden, Angelsteg, Bodenschatten

Umsetzung der sechs Fehlerbilder aus „Map & Graphics Refactoring“ (Screenshots vom 21.10.). Unsere Engine ist
eigenes WebGL (`gl3d.js`), kein Three.js – die geforderten Ansätze sind darauf übertragen (siehe jeweils „Wo“).

1. **Wegzunge am Kühlhaus ohne Anschluss** (`worldview.js` `LAKE_WAY`): Der Uferweg endete als runde Zunge vor dem
   Kühlhaus. Jetzt läuft er weiter nach Westen und biegt in einem Bogen (r = 1,6) bei **x = −31** zur Straße ab –
   genau gegenüber dem Feldweg vom Westtor: eine echte **Kreuzung**.
2. **Einmündungen in die Straße** (`woodmodels.js` `wayMouth`, `fillet`, `snapEnd`):
   - **Kanten-Snap**: die letzten ~1,5 Einheiten jedes Weges laufen exakt senkrecht auf die Bordsteinkante zu
     (vorher schräg → eine Rundung ragte auf den Asphalt, die andere war abgehackt).
   - **Ausrundungen mit berechnetem Radius**: Tangentenlänge `t = r / tan(θ/2)`, Mittelpunkt auf der
     Winkelhalbierenden (`r / sin(θ/2)`) – funktioniert für jeden Winkel. Radien jetzt 0,85 (Waldwege) bzw. 0,75 (Wege am See).
   - **Staubfächer** auf dem Asphalt vor jeder Mündung: Vertex-Farben laufen von leicht kiesfarben exakt in die
     Straßenfarbe aus (statt harter Kante „Schotter auf Asphalt“). Der helle Bordstein bleibt als saubere Linie sichtbar.
   - **Glättung zentripetal** (`smoothLine(pts, n, true)`, Barry–Goldman): die alte Catmull-Rom-Glättung schoss vor
     kurzen geraden Stücken über das Wegende hinaus und zurück – dadurch knickten die Ränder an den Mündungen.
   - Zufahrt vom Südtor endet jetzt am Bordstein (vorher 0,2 auf dem Asphalt) und hat gepflasterte Ausrundungen.
3. **Wegenetz als Knoten** (Abzweige, `wayTee`, `wayStraightAt`, `wayRaw`): Wegenden werden klassifiziert – Mündung
   (Straße), Abzweig (liegt auf einem Stützpunkt eines anderen Weges), Steg, Tor/Hof, sonst Lichtung. Abzweige bekommen
   Ausrundungen zwischen den Wegkanten (T- und Y-Kreuzungen, z. B. Westtor, Brücke/Ostweg, Altwaldweg). Der Hauptweg
   wird am Abzweig für die Darstellung gerade gezogen, damit die Ausrundung sauber an seiner Kante liegt.
   - Am See jetzt drei Wege statt zwei ineinander geschobener: `LAKE_STEM` (Südtor → T-Kreuzung), `LAKE_WAY` (Uferweg
     x = −31 … x = 40), `LAKE_EAST` (**neuer Ostuferweg**: Straße bei x = 40, genau gegenüber dem Teichweg → am Ostufer
     entlang **über die Brücke am Seebach**, die bisher an keinem Weg lag → Lichtung mit Bank). Die alte grüne „Insel“
     zwischen Abzweig und Bogen bei x = 5 ist weg.
   - Schranken am See (solange er gesperrt ist) jetzt auch an den Zugängen x = −31 und x = 40 (`AREA_BAR2` = Liste).
   - `team.js`: Laufwege nutzen die drei neuen Wege. Kulissenbäume halten Abstand zu den Seewegen.
4. **Weiche Ränder** (`softEdge`): statt des harten, dunklen Streifens (wirkte wie ein Schatten → „schwebender“ Weg)
   ein schmaler ruhiger Randstreifen und ein kurzer Verlauf exakt in die Bodenfarbe darunter (`o.gnd = wGroundAt`,
   dieselbe Interpolation wie das Gelände). Gilt für Wege, Ausrundungen, Kappen, Lichtungen und das Bachufer.
5. **Angelsteg statt „Brücke ins Nichts“** (`woodmodels.js` `pier`, `worldview.js` `worldPierFrame`): Der alte Steg
   war 4,2 lang und lag auf dem anderen Ufer auf. Jetzt wird seine Lage aus dem Bachverlauf berechnet (senkrecht zum
   Bach, Auflager am Kies), er ist 1,9 lang mit breiterem Kopf, endet vor der Bachmitte, hat Poller, Eimer und Angel,
   kein Brückengeländer. Der Westweg wird beim Zeichnen genau auf das Auflager und in die Stegachse ausgerichtet.
6. **Bach endet nicht mehr auf der Wiese** (`erbe.js` `FWORLD.creek`, `FWORLD.spring`; `woodmodels.js` `creekScale`,
   `springBed`, `springPool`, `springRocks`): im Nordosten entspringt er an einer **Quelle mit Felsen** und Quelltopf und
   verjüngt sich auf den letzten 9 Einheiten; im Westen läuft er bis über den Kartenrand (x = −160). Der Seebach beginnt
   im See und endet hinter dem Kartenrand. **Edge-Check** `worldWaterCheck()` warnt in der Konsole, falls ein Bach je
   wieder offen endet (Kartenrand, See oder Quelle sind erlaubt).
7. **Bodenschicht wirft keine Schatten** (`gl3d.js` Schattenpass): flache, nach oben zeigende Flächen unter y = 0,07
   werden im Schattenpass verworfen (Wege, Pflaster, Felder, Dekowege …) – kein Haarschatten neben dem Pflaster mehr.
   Wände, Zäune, Stämme werfen weiter ab dem Boden Schatten (kein Spalt am Fuß). Entspricht polygonOffset/Render-Layern.
- Tafel am See steht eine Kachel weiter östlich neben dem Stichweg (alte Spielstände werden einmal verschoben).
- Fällbare Bäume eines neuen Spiels sind unverändert (Weg- und Bachdaten so gewählt, geprüft).
- `index.html`/`sw.js`: v75.

## v74 (aufbauend auf v73) – Schatzkiste: Erscheinen, Leuchtfeuer und große Öffnungs-Show

Zufallsereignis „Schatzkiste“ (Vogelschwarm + rotes Kreuz, Grabungs-Minispiel `MG dig` unverändert). Vorher: nur ein Toast,
beim Ausgraben ein Textchen und Münzflug. Jetzt:

- **Erscheinen** (`worldview.js` `worldTreasureIntro`, aufgerufen aus `farmTreasureView("start")`): Der Schwarm stürzt von
  weit her aus großer Höhe heran (`b.out`), am Kreuz schießt ein Goldfunken-Ausbruch auf, eine **goldene Lichtsäule wächst
  aus dem Boden** und ein Banner „🐦 Schatz gesichtet!“ nennt die Fundstelle. Die Kamera fährt zur Fundstelle, aber nur,
  wenn der Spieler sie gerade nicht bedient (`FV.touchAt`). Nur wenn die Ansicht offen ist und kein Minispiel läuft.
- **Leuchtfeuer** (`worldSyncTreasure` → `WV.trFx`, `stepTreasure`): Solange die Kiste liegt, steht über dem Kreuz eine
  schmale, atmende Lichtsäule (schon von weitem zu sehen), Ping-Ringe laufen über den Boden, ab und zu blitzt ein großer
  Stern auf, goldene Funken steigen auf.
- **Öffnen** (`worldTreasureReveal`/`stepTreasureReveal`, nach dem Minispiel): Die Truhe (`FWM.goldChest`/`goldLid`, dunkles Holz,
  Goldbeschläge, Edelsteine) **bricht rumpelnd aus der Grube** (Dreck fliegt, Säule wächst), **schwebt, dreht sich in drei immer
  schnelleren Umdrehungen** und zieht Funken an, dann **springt der Deckel mit Überschlag auf**: Lichtblitz, Schockwellen-Ringe,
  Fontäne aus Münzen, Sternen und bunten Edelsteinen. Danach löst sich die schwebende Truhe in Funken auf, die offene Truhe
  in der Grube bleibt wie bisher.
- **Sterne = Show-Stufe** (aus `res.score` des Minispiels, `erbe.js` `farmTreasureDig` liefert jetzt `stars`):
  1 ★ „Schatz gefunden!“; 2 ★ „Prächtiger Schatz!“ + **Goldregen**; 3 ★ „Meisterhaft gegraben!“ + stärkerer Goldregen, zweite
  Edelstein-Explosion, pulsierendes Banner. **3 ★ geben 2 🍀 und 35 EP** (2 ★: 26 EP, 1 ★: 20 EP); Geld wie bisher.
- Das Kleeblatt wird in `farmTreasureDig` direkt gutgeschrieben (kein eigener Flug mehr); die Show fliegt Münzen, 🍀 und EP
  nacheinander zur Leiste. Banner/Blitz laufen jetzt über den gemeinsamen Helfer `worldLootShow` (auch die Lieferkiste).
- Neu: `woodmodels.js` `goldChest`, `goldLid`. `index.html`/`sw.js`: v74.

## v73 (aufbauend auf v72) – Lootkiste: vor dem Hoftor, mit Lieferwagen und großer Öffnungs-Animation

Zufallsereignis „Besondere Lieferung“ (`FEVENTS.lieferung`, 📦). Die Kiste lag als schlichter Karton mitten auf dem Hof
(`farmParcelSpot` suchte ein freies Feld im Hof) und gab beim Antippen sofort die Belohnung.

- **Platz** (`erbe.js` `FPARCEL_AT`, `farmParcelSpot`): feste Stelle **direkt vor dem Südtor** (`FGATE.x + 0.45 | 15.9`), also
  immer sichtbar und nie im Weg von Gebäuden. Alte Spielstände mit laufender Lieferung werden in `erbeInit` einmal
  umgesetzt (`data.v73`).
- **Ankunft** (`worldview.js` `worldParcelIntro`/`stepParcelIntro`): Ein gelber Lieferwagen fährt auf der Straße an,
  die Kiste hüpft in einem Bogen vor das Tor (Staub, Poltern), die Kamera folgt über `farmFocusXZ`.
- **Leuchtfeuer** (`stepParcel`): goldene Lichtsäulen (`FWM.lootBeam`), pulsierende Ringe am Boden, Funken
  (neue Partikelform 3 = Stern in `gl3d.js`), die Kiste wippt und hüpft alle ~3,4 s. Die Blase ist über der Kiste.
- **Öffnen** (`worldParcelOpen`/`stepParcelOpen`): Wackeln → Deckel springt mit Überschlag auf (`FWM.lootLid`) →
  Lichtblitz, Fontäne aus Münzen und Sternen, Ring-Schockwelle → Kiste löst sich in Funken auf.
- **Seltenheit** (`erbe.js` `FPARCEL`, `farmParcelRoll`): Gut 58 % / Selten 28 % / Episch 11 % / Legendär 3 %. Höhere
  Stufe = mehr Geschenke (Brot, Apfelkuchen, Bretter, Köder, Brennholz – nur was ins Lager passt), Geld
  (Buchung „Besondere Lieferung“), 1–3 🍀 und mehr EP. Die Belohnung wird in `farmEvReward("lieferung")` genau
  einmal vergeben, bevor die Animation startet.
- **Belohnungs-Show**: farbiges Banner mit Seltenheit und Chips der Beute (`.lootbanner`, `.lootflash` in `style.css`),
  danach fliegen Items, Münzen, 🍀 und EP nacheinander zur Leiste (`flyItem`, `coinFly`, `farmCloverFlyAt`, `xpFly`).
- Die Schatzkiste (Grabungs-Minispiel) ist unverändert.
- Neu: `woodmodels.js` `lootCrate`, `lootLid`, `lootBeam`, `lootRing`. `index.html`/`sw.js`: v73.

## v72 (aufbauend auf v71) – Brücke, Wegende am Bach, Straßeneinmündungen

Drei Stellen mit unsauberen Wegverbindungen (Screenshots vom 19.10.), alle in `worldview.js`, `woodmodels.js`, `erbe.js`:

1. **Brücke im Wald** (`woodmodels.js` `bridge`, `erbe.js` `FWORLD.paths[1]`, `worldview.js`):
   - Die alte Brücke war 3,1 Felder lang – kürzer als Bach plus Ufer – und lag schräg (Wegrichtung, Bach kreuzte im
     45°-Winkel). Der Belag verschwand halb im Ufer, der Weg lief unter dem Brückenende durch.
   - Jetzt: Brücke 5,8 lang, **leicht gewölbt** (Enden auf Wegniveau, Mitte 0,3 höher), Längsbalken folgen der
     Wölbung, Pfosten und Geländer ebenso, an beiden Enden ein Querbalken als Auflager. Planken 2,0 breit (Weg 1,8).
   - **Hauptweg läuft gerade über die Brücke** (x = −33,8, Nord–Süd): Die Wegpunkte von Weg 1 wurden neu gelegt,
     die Abzweige (Weg 3 nach Osten, Weg 4 nach Westen) sitzen jetzt 3 bzw. 5 Felder vom Brückenende entfernt.
     Die Brücke ist über `ry = π/2` in die Wegachse gedreht. Cache-Schlüssel `wbridge2`.
2. **Waldweg am Bach** (Westweg, `FWORLD.paths[2]`): Er endete mitten im Wasser; die „lose Ende“-Lichtung mit Bank
   lag im Bach. Jetzt endet er **3,6 Felder vor dem Bach** (nahe am Bach gibt es keine lose-Ende-Lichtung mehr:
   `loose()` prüft `distLine(creek) > 7`), läuft auf einen neuen **Angelsteg** (`FWM.jetty`, 4,2 lang) und eine Bank
   steht am Ufer mit Blick aufs Wasser.
3. **Wege an der Straße** (`woodmodels.js` `forestPath` mit Option `mouth`, neu `mouthFillet`):
   - Die Wege endeten 0,03–0,14 Felder vor dem Bordstein (eckig abgeschnitten, Rand lief als Keil aus).
     Jetzt enden alle genau an der Bordsteinkante (`z = 17,48` nördlich, `19,52` südlich) und **weiten sich mit
     zwei Viertelkreis-Ausrundungen** (Radius 1,1) zur Straße auf – Belag und Rand (`ey` unter allen Wegflächen).
     Schmaler Überlapp entlang der Wegkante, damit keine Haarrisse durchblitzen.
   - Betrifft: Feldweg vom Westtor (x = −31), Hauptweg Ost (x = 40) und der Uferweg gegenüber, Abzweig zum See (x = 5).
   - Der Weg zum See (`LAKE_WAY1`, neu, auch in `team.js` `navBuild` und im „See“-Staubspur) beginnt am Bordstein,
     läuft 1,7 Felder gerade und biegt dann in einem weiten Bogen nach Westen; der Ostast zweigt bei (5 | 21) ab.
     Letzte Wegpunkte vor der Straße liegen auf einer Geraden, damit die Ausrundung sauber ansetzt.
- Navigation (`navBuild`): Wege und Brücke bleiben begehbar; Weglängen vom Hof zu Sägewerk, Altem Wald, Ufer und See
  geprüft (gleich wie vorher, ±3 Felder).
- `index.html`/`sw.js`: v72.

## v71 (aufbauend auf v70) – Weganschlüsse und Dekowege

**Wege sauber verbunden**
- **Westtor** (`worldview.js` `worldSyncHof`, Paths-Schleife in `worldStatic`): Der Waldweg endete mit einer runden
  Kappe, die aufs Hofpflaster ragte, dazu lagen Laub und Steinchen auf dem Pflaster. Jetzt: Pflaster bis zur
  Außenkante der Steinmauer (bzw. bis zum Zaun), davor ein gerade abgeschnittener Feldweg bis zum Waldweg
  (`forestPath` mit `leaves: false`), Waldweg-Enden am Hof ohne Kappe. Gilt für alle zehn Ausbaustufen.
- **Straße im Osten** (`erbe.js` `FWORLD.paths[3]`, `worldview.js` `LAKE_WAY2`): Der Weg vom Teich trifft die
  Straße jetzt senkrecht bei x = 40 und endet an der Bordsteinkante; der Uferweg biegt genau gegenüber zur
  Straße ab – eine Kreuzung statt eines schrägen Endes und einer Sackgasse mit runder Kappe.
- `woodmodels.js` `forestPath`: neue Optionen `leaves: false` und `leafOk(x, z)` – kein Laub auf Pflaster und
  Straße (auch am Feldweg zur Straße). `team.js` `navBuild` nimmt den neuen Uferweg (`LAKE_WAY2`).

**Dekowege** (Laden → 🌷 Deko)
- Fünf Sorten in `FDECO` (`farmdata.js`, Merkmal `weg: 1`, Preis je Feld): Kiesweg 3 €, Rindenmulch 2 €,
  Trittplatten 3 €, Holzbohlenweg 4 €, Pflasterweg 5 € (ab Level 2–5). Jedes Feld ist ein Deko-Objekt 1 × 1.
- **Wegebau** (`farmview.js` `startWeg`, `wegStroke`, `renderWegBar`, `endWeg`): Ein Finger zieht Weg Feld für
  Feld (nur gerade Schritte – auch schräg gezogen bleibt alles verbunden). Fängt der Strich auf einem Weg
  derselben Sorte an, nimmt er ihn weg (halber Preis zurück); eine andere Sorte drüberziehen tauscht. Zwei
  Finger (oder ✋) bewegen die Karte – setzt der zweite Finger gleich nach dem ersten auf, wird das erste Feld
  zurückgenommen (`wegUndoStroke`). Sorten wechseln in der Leiste, ✓ beendet: ein Eintrag im Kassenbuch, EP
  (1 je 4 Felder), Notizbuch „buy:deco“ (`farm.js` `farmWegFinish`).
- **Ränder von selbst** (`woodmodels.js` `decoWeg(k, mask)`, `farm.js` `wegMask`): Zu Nachbarwegen – auch zu den
  festen Hofwegen (`FPATH`) – reicht der Belag bis an die Feldkante, nur offene Seiten bekommen einen Rand
  (Bordstein, Kantholz, Saum). Die Maske steckt in `objVar` → Nachbarn werden beim Legen neu gezeichnet.
- Weg antippen: Popup „🖌️ Wege bauen“ / „🗑️ Entfernen“. Laden zeigt drei Felder am Stück als Bild.
- **Wozu?**
  - **Haustiere** (`worldview.js` `petTiles`, `petNext`, `stepPets`): Ziege Tim und Katze Minka spazieren auf den
    Dekowegen (Feld für Feld, an Abzweigen zufällig, bleiben mal stehen), Hofhund Bello auch auf den Hofwegen.
    Ohne Dekowege die alte Runde (`PET_WAY`).
  - **Personal** (`team.js` `navBuild`, `staffWalkLen`, `staffGo`): Dekowege sind kein Hindernis mehr, die Leute
    nehmen sie am liebsten (Kosten 0,4) und brauchen darauf 30 % weniger Laufzeit.
  - **Fahrzeuge** fahren weiter nur ihre festen Wege (Tor, Straße, Waldweg) – nie über Dekowege.
- Meldungen weichen beim Bauen und im Wegebau nach oben aus (`body.fplace-on`).
- Wichtig: `farmWegMap()` (farm.js) liefert alle Wegfelder (Schlüssel „x,z“ in Kacheln) und wird nur neu gebaut,
  wenn sich Objekte ändern.

Version: **v71** (`sw.js`, `?v=71` und `window.LOGI_V` in `index.html`).

## v70 (aufbauend auf v69.10 von `main`) – Liste „Logistika 2.1“

Alles auf dem Stand von `main` (v58–v69.10 bleiben erhalten, auch Freigaben, Fahrer-Modus und die
Namens-Blase aus v69.3). Fischerei-Logik nicht angefasst; in Fischerei-Dateien nur zwei Zahlenreihen
(siehe unten). Die Fahrerin (Punkt 7 der Liste) bleibt bewusst wie in `main` – `team.js` ist bis auf
eine Zeile (`navKey` nimmt die Hofgröße aus `farmHl()`) unverändert.

**Bedienung**
- **Ton an/aus bei Meldung** (`farmview.js`, `style.css`): Bei offenem Hof-Fenster stehen
  Meldungen oben (`body.fsheet-on`, gesetzt in `openFarmSheet`/`closeFarmSheet`). Vorher lag die
  Meldung genau über „🔊 Ton an“ – antippbare Meldungen (mit „›“) fingen den Tipp ab.
- **Warenname** (`itemTip`): verschwindet, sobald man scrollt (Finger oder Mausrad), wischt oder etwas
  anderes antippt (`itemTipHide`, Listener auf `wheel`/`touchmove`/`pointerdown`) und beim Schließen des
  Fensters. Baut sich das Fenster nach dem Antippen neu auf, folgt die Blase wie in v69.3 ihrer Ware.
- **Minispiele mittig** (`style.css` `#farmAngel.mg`): Box mittig, Rest abgedunkelt und nicht
  antippbar. Gilt für alle Spiele über `MG.open`, auch das Angeln (eigenes Wasser in der Box).

**Welt**
- **Feldweg zur Straße** (`erbe.js` `FWORLD.paths[3]`): Der Weg von der Brücke nach Osten endete
  auf der Wiese, jetzt läuft er östlich am Teich vorbei bis zur Straße (x ≈ 39). Solange der Wald zu
  ist, steht dort eine zweite Schranke (`AREA_BAR2` in `worldview.js`).
- **Wege sauber verbunden** (`woodmodels.js` `ribbon(…, ey)`, `forestPath` `o.ey`): Alle Wegränder
  liegen unter allen Wegflächen – an Abzweigen (Brücke, Feldweg am Westtor, Uferweg) läuft der
  Rand nicht mehr quer über den anderen Weg.
- **Kirschen rund** (`woodmodels.js` `tree`/`bgTree` „kirsche“): rote Kirschen paarweise am Stiel
  statt eckiger weißer Blüten; Obstbaum-Kirschen auf dem Hof runder (`farmmodels.js` `treeFruit`).
- **Häuser Wand an Wand** (`farmmodels.js` `house`/`barn`): Wohnhaus und Scheune füllen ihre
  Kacheln (Wände 4,9 bzw. 3,9 breit, beide 3,3 tief, Dächer 3,9 tief) – nebeneinander Traufe an
  Traufe, Fronten in einer Flucht. Seitenfenster des Hauses nach Westen, Fachwerkstreben und
  Torkreuz der Scheune ragen nicht mehr heraus, Heuboden-Luke unter der Traufe.
- **Steintor** (`woodmodels.js` `stoneGate`): rotes Kästchen oben entfernt. Laternen an der
  Steinmauer stehen frei neben den Pfeilern (`worldview.js` `worldSyncHof`).
- **Ladebalken** (`style.css` `.ftag.work`): Blase deckend (die Spitze überdeckt den Rand sauber),
  Füllstand als eigenes Element mit runden Enden.

**Fahrzeuge**
- **Holzlaster** (`woodmodels.js` `holzTruckMB`, `palletLoad`; `farmview.js` `TRUCK_SLOTS`,
  `stepLoading`; `worldview.js` `brandPallet`): steht immer leer (Holzboden, Bordwände). Beim
  Beladen kommen sechs volle Paletten (Bretterstapel, Spanngurte) aus dem Holzlager, zwei
  nebeneinander in drei Reihen, mit dem Hoflogo als Aufkleber außen und hinten.
- **Holzlaster bleibt nicht mehr im Wald stehen** (`farmview.js` `startDrive`): Kam er noch an,
  als er schon wieder losmusste, liefen zwei Fahrten gegeneinander. Jetzt gilt je Fahrzeug nur
  die neueste Fahrt, und sie beginnt dort, wo es gerade steht.
- **Karte: echte Straßen** (`farm.js` Abschnitt „Straßen rund um den Hof“: `ROADS_HOF`,
  `roadDisp`, `roadDispAt`; `game.js`: `vehPoint`, `parkHere`, `legDisp`/`roadLine` beim Zeichnen):
  Rund um den Hof folgen Fahrzeug und Linie den Straßen (L 90, Glindow–Werder, B1 über
  Baumgartenbrück und Geltow, Petzow, Caputh, Michendorf; nachgezeichnet aus der Karte). Nur
  Darstellung – Fahrzeit, Kilometer und Kosten rechnen weiter mit `veh.route`/`routeDist`.
  Außerhalb von `ROADS_BOX` (Potsdam-Mitte, Berlin) geht es wie bisher geradeaus weiter.

**Mechanik**
- **Heuballen verkaufen** (`erbe.js` `FHAY`, `farmHaySell`, `hayWorld`; `farmview.js` Knoten
  `parts.hay` an der Scheune; `worldview.js` `pickHay`/`openHay`; Modell `FM.barnHay`): zwei
  Ballen am Scheunentor, antippen → verkaufen (je 8 €), alle 12 Spielstunden ein neuer (max. 2).
  Neues Spielstand-Feld `S.farm.hay = { n, t }`.
- **Tiere als Warteschlange in 3D** (`farmview.js` `penAnisHTML`, `bindPenAnis`): Stall-Fenster
  zeigt jedes Tier als 3D-Bild in einem Platz wie bei den Maschinen, mit Fortschritt (Mast: bis
  zum Metzger), Animation (kauen, hungrig zappeln, fertig hüpfen). Antippen: füttern bzw.
  einsammeln. Kopf zeigt das Tier in 3D. Über dem Stall steht – wenn alle satt sind – eine Blase
  mit Ware und Ladebalken wie bei den Maschinen (`farmview.js`, Blasen-Schleife).
- **Lager mit zehn Stufen**: `FSTORE[*].cost` hat jetzt neun Ausbauten – Silo, Scheune
  (`farmdata.js`), Holzplatz (`erbedata.js`), **Kühlkiste und Köderkiste (`fishdata.js`, nur die
  beiden `cost`-Reihen verlängert)**. Das Lager-Fenster zeigt „Stufe x von 10“.
- **Hofausbau in zehn milderen Stufen** (`erbe.js`): neues Feld `S.farm.hl` (1 … 10), jede Stufe
  eine Kachel nach Westen, Norden und Osten (`FHOF_B` hat zehn Einträge, 30 × 32 … 48 × 41,
  Endgröße wie bisher). `S.farm.stage` bleibt die **Optik-Stufe** 1 … 4 (`hofTier`: ab 4, 7, 10) –
  aller Code, der `stage` fragt (Zaun, Laternen, Mauer, Lagerbonus, Warteplätze, Verkaufsstand),
  verhält sich wie vorher. Größe immer über `farmHl()`/`farmHofB()`. `FHOF_STAGES` (erbedata.js)
  hat zehn Einträge; die großen (4, 7, 10) haben die alten Bedingungen, die kleinen kosten nur
  Geld. Alte Stände: Stufe 1/2/3/4 → `hl` 1/4/7/10 (gleiche Größe, keine Umzüge).
  Notizbuch-Texte „Bau den Hof aus: Stufe 4/7/10“ (Bedingung unverändert).

Version: **v70** (`sw.js`, `?v=70` und `window.LOGI_V` in `index.html` – das stand noch auf 57).

## v69.10 – Köderauswahl beim Angeln kompakter
- **Köder-Kacheln einheitlich:** feste Kachelgröße im Raster (4 pro Zeile), Namen brechen sauber um statt die Kacheln zu verziehen.
- **Kurze Gründe auf den Kacheln:** `angelBaitWhy(b, gid, short)` hat einen Kurz-Modus („keine Karpfen hier“ ohne Ortsliste, „bei Bert bestellen“). Die lange Variante bleibt für die Meldung beim Auswerfen (minigames.js `cast`). Gilt auch für die Steg-Ansicht (fishview.js).
- **Hinweistext entfernt:** „Mitten auf dem See … / Köder wählen, auswerfen …“ fällt weg, leeres Meldungsfeld nimmt keinen Platz ein (`#mgMsg:empty`). Das Fenster ist kürzer, die Kopfzeile mit Ort bleibt sichtbar.

## v69.9 – Spezialköder: „immer“

- **Angel-Minispiel** (`minigames.js` `odds`): Beißt sicher nur eine Art (Spezialköder), steht dort „Wels · immer“ statt „oft“.
- Version: **v69.9** (`sw.js` und `?v=69.9` in `index.html`).

## v69.8 – „Zuletzt“ zeigt die echte Arbeit

- **Arbeiter-Popup** (`team.js` `staffDo` → `s.lastTxt`, `staffPopHTML`): Statt „Zuletzt erledigt“ (letzte abgeschlossene
  Aufträge – seit den Freigaben selten und oft veraltet) steht dort „Zuletzt: …“ mit den letzten drei Ergebnissen der Kraft,
  neueste zuerst – Fänge, Erzeugnisse, Ernten, Lieferungen („Lieferung an …“). Alte Spielstände zeigen bis zur ersten
  neuen Arbeit noch die alte Zeile.
- Version: **v69.8** (`sw.js` und `?v=69.8` in `index.html`).

## v69.7 – Reusentiere nach Gewicht, Reusenköder ohne Qualität

- **Reusentiere wie Fische** (`fishdata.js` `FPOTS.*.kgAvg/ekg`, `erbe.js` `fishPrice`, `farm.js` `farmKgAvg`, `farmHaul`):
  Teichmuscheln, Wollhandkrabben und Edelkrebse bekommen ihre Sterne nur noch aus Größe und Kondition (`specQ(s)`), der
  Köder zählt nicht mehr. Der Preis richtet sich nach dem Gewicht (18 / 27 / 83 €/kg, Faktor 0,5 wie bei Fisch; ein Tier
  mittlerer Größe bringt so viel wie vorher). Höhere Reusenstufen fangen größere Tiere – die sind jetzt mehr wert.
- **Reusenköder ohne Sterne** (`farmHasQ`): wie die Angelköder seit v69.6.
- Version: **v69.7** (`sw.js` und `?v=69.7` in `index.html`).

## v69.6 – Angelköder ohne Qualität

- **Keine Sterne mehr bei Angelködern** (`farm.js` `farmHasQ`, `farmSellPrice`; `farmview.js` Lager-Kacheln und Verkaufszeile):
  Tauwürmer, Profi-Köder und Spezialköder hatten Sterne, die nirgends wirkten (beim Angeln zählen nur Größe und Kondition
  des Fischs) – nur der Großhandelspreis schwankte ±8 % je Stern. Jetzt ohne Sterne, Preis neutral.
- **Reusenköder behalten ihre Sterne**: die Köderqualität geht in die Reuse (`o.bq`) und in die Sterne des Fangs (`farmHaul`).
- Version: **v69.6** (`sw.js` und `?v=69.6` in `index.html`).

## v69.5 – Kamera bei der Bootsfahrt

- **Hinweg** (`farmview.js` `farmCamLocked`, `fishview.js` `fishStep`): Auf der Fahrt zum Fanggrund folgt die Kamera dem Boot
  fest – Ziehen, Zoomen (zwei Finger) und Mausrad sind so lange gesperrt.
- **Rückweg** zum Bootshaus: Die Kamera folgt nicht mehr und ist frei beweglich (vorher folgte sie auch zurück).
- Version: **v69.5** (`sw.js` und `?v=69.5` in `index.html`).

## v69.4 – Angel-Fenster: Bilder statt Emojis, Boot nicht mehr in Steinen und Seerosen

- **Liegeplätze** (`fishdata.js` `FGROUNDS[].bx/bz`, `fishview.js` `fishSail`): Seerosenbucht, Schilfgürtel und Steinkante haben
  eigene Liegeplätze im freien Wasser – vorher lag das Boot in Seerosen, Schilf oder Steinen.
- **3D-Bildchen** (`fishmodels.js` `groundIcon(id)`, `rodIcon(n)`; `minigames.js` `fishGroundIc`, `fishRodIc`, `mgHtml`):
  Fanggrund in der Kopfzeile, Rute und Köder in der Zeile darunter (vor „… Würfe“ das Köder-Bild); auch im Steg-Fenster
  (Fanggründe, Ruten). Drei Ruten unterscheidbar: Holz, blau, schwarz-gold.
- **Knöpfe**: „Auswerfen“ und „Zurück“ ohne Emoji.
- Version: **v69.4** (`sw.js` und `?v=69.4` in `index.html`).

## v69.3 – Namens-Blase bleibt über der Ware

- **Namens-Blase** (`farmview.js` `itemTip`): Nach dem Antippen einer Ware baut sich das Fenster oft neu auf und rutscht
  (Verkaufsfeld erscheint, Fenster-Animation) – die Blase blieb an der alten Stelle stehen und sprang. Jetzt folgt sie ihrer
  Ware, solange sie zu sehen ist (auch wenn das Element neu gezeichnet wurde).
- Version: **v69.3** (`sw.js` und `?v=69.3` in `index.html`).

## v69.2 – Eindeutige Knöpfe im Bestätigungsfenster

- **Bestätigungsfenster** (`game.js` `askConfirm`): Der Knopf zum Schließen heißt jetzt „Zurück“ statt „Abbrechen“ – gilt für
  alle Rückfragen. Beim Abbrechen in der Warteschlange (`farmview.js`) heißt die Aktion „Ja, abbrechen“ bzw.
  „Ja, alle abbrechen“. Vorher stand zweimal „Abbrechen“ nebeneinander.
- Version: **v69.2** (`sw.js` und `?v=69.2` in `index.html`).

## v69.1 – Angel-Minispiel: alle möglichen Fische sichtbar

- **Fische im Wasser** (`style.css` `.mg-water:has(.mg-odds)`, `.mg-water .mg-odd`): Die Wasserfläche hatte feste 84 px und
  schnitt die zweite Reihe ab. Jetzt wächst sie mit; die Kacheln sind kompakter (Bild neben dem Text).
- Version: **v69.1** (`sw.js` und `?v=69.1` in `index.html`).

## v69 – v68 zurückgenommen

- Die Änderungen aus v68 (Spezialköder-Namen „Forelle-Köder“, Wartegründe des Fischers) sind wieder raus – auf Wunsch,
  Stand wie v67. Neue Versionsnummer, damit Handys neu laden.
- Version: **v69** (`sw.js` und `?v=69` in `index.html`).

## v67 – Produzieren bis das Lager voll ist

- **15 % Luft wieder raus** (`team.js` `staffPickRecipe`): Freigegebenes wird produziert, bis das Lager wirklich voll ist
  (Netto-Platz und laufende Warteschlangen zählen weiter, v65/v66).
- **Wartegrund nennt das Lager** (`staffMachWhy`): z. B. „Köderkiste voll“, „Kühlkiste und Köderkiste voll“,
  „Zutaten fehlen: Forellen · Köderkiste voll“ – vorher „Lager fast voll“, auch wenn nur die Köderkiste voll war.
- Version: **v67** (`sw.js` und `?v=67` in `index.html`).

## v66 – Arbeiter füllen die Warteschlange

- **Warteschlange füllen** (`team.js` `staffDo` „mach“): Bei jedem Gang füllt die Kraft alle freien Plätze der Maschine –
  je Platz neu entschieden (`staffPickRecipe`), mit denselben Regeln: Freigabe, Zutaten, Reserve für Bestellungen,
  Lagerplatz, 15 % Luft. Vorher kam je Gang nur ein Rezept in die Schlange.
- **Was schon läuft, zählt mit** (`staffPending(st, id)`): Erzeugnisse in Warteschlangen (auch Nebenprodukte) gelten beim
  Lagerplatz, bei den 15 % Luft und bei der Dringlichkeit (`staffRecipeScore`) als schon da – so läuft das Lager beim
  Abholen nicht über, und eine Maschine wird nicht nur mit derselben Ware gefüllt.
- Version: **v66** (`sw.js` und `?v=66` in `index.html`).

## v65 – Maschinen-Kräfte verteilen die Arbeit

- **Über alle Maschinen das Dringendste** (`team.js` `staffMachJob`, `staffRecipeScore`): Vorher nahm die Kraft immer die erste
  Maschine mit einem machbaren Rezept – die Fischerhütte fraß alle Forellen, bevor die Räucherei drankam; die Gattersäge
  machte nur Bretter. Jetzt zählt, was im Verhältnis zum Bedarf am wenigsten da ist; volle Warteschlangen zählen weniger.
- **Lagerplatz netto** (`staffRoomFor`): Zutaten aus demselben Lager machen beim Start Platz (Bretter → Paletten).
- **15 % Luft** (`staffPickRecipe`, in v67 wieder entfernt): Über den Grundstock hinaus wird nur produziert, solange 15 % des Lagers frei bleiben –
  Platz zum Weiterverarbeiten. Wartegrund dann „Lager fast voll – Platz zum Weiterverarbeiten bleibt frei“.
- **Zwischenprodukte** (`staffTaskJob`, `staffDo` „mach“): Braucht ein freigegebenes Rezept eine Zutat, die dieselbe Kraft
  macht (Balken für Paletten), macht sie diese im nötigen Umfang – auch wenn die Kachel aus ist (nur eigene Ketten-Aufträge
  mit `parent`, `from` = eigene Rolle).
- Version: **v65** (`sw.js` und `?v=65` in `index.html`).

## v64 – Fischer mit Köder-Freigaben, Reusen nach Köder, Bestellungen für Reusentiere

- **Fischer/in bekommt Freigaben – für Köder** (`team.js`, `STAFF_WL` + „fischer“): Mais, Tauwürmer, Profi-Köder,
  Spezialköder je Art und **Reusenköder**. Reusenköder an = er beködert die Reusen (mit Dosen, sonst Mais, falls Mais an);
  aus = Reusen bleiben leer, volle werden weiter geleert (`staffPotBait`). „＋ Auftrag geben“ entfällt auch hier;
  alte Chef-Aufträge an den Fischer löscht `staffWlInit` (Stand `F.wlV = 2`).
  - `staffBaitOk` (erbe.js) beachtet die Freigabe – damit auch Ketten-Aufträge (Fischwirt braucht Forellen).
  - Ohne Auftrag (`staffFishPlan` ohne Ziel): bester freigegebener Köder, der da ist (Spezial → Profi → Würmer → Mais),
    am erreichbaren Fanggrund mit dem höchsten Durchschnittswert. Vorher nur Mais/Würmer am Steg.
  - Sperren: Turnier, Rute, Spezialköder erst entwickelt, Reusenköder erst mit Reuse.
- **Reusen** (`farm.js` `farmPotBest`, `farmBait(o, kind, bait)`, `farmview.js` Popup „bait“): Du wählst nur noch den Köder
  (Reusenköder oder Mais); die Reuse fängt immer mit der besten freigeschalteten Stufe (Stufe 3 = Edelkrebse).
- **Bestellungen für Reusentiere** (`erbedata.js` Kundschaft): Gartenteich-Center Werder (Teichmuscheln), Asia-Markt Caputh
  (Wollhandkrabben), Feinkost am Holländerviertel Potsdam (Edelkrebse, Wollhandkrabben, Zanderfilets).
- Version: **v64** (`sw.js` und `?v=64` in `index.html`).

## v63 (Hotfix zu v61) – Freigegeben heißt „bitte machen“

- **Hofmeister, Sägewerker, Fischwirt** (`team.js` `staffPickRecipe`): Mit Freigaben produzieren sie freigegebene Rezepte,
  solange Zutaten und Lagerplatz da sind – auch über den alten Grundstock (Bedarf + 6) hinaus; was am meisten fehlt, zuerst.
  Für Bestellungen reservierte Zutaten bleiben geschützt (`staffReserve`). Vorher standen sie mit „Lager reicht“ still.
- **Wartegrund** (`staffMachWhy`): statt „Lager reicht oder Zutaten fehlen“ jetzt der echte Grund – „Lager voll“,
  „Zutaten fehlen: …“, „alle Plätze belegt“, „zu wenig Geld“, „noch keine Maschinen“.
- Version: **v63** (`sw.js` und `?v=63` in `index.html`).

## v62 (Hotfix zu v61) – Fahrer nutzt auch Fahrzeuge von unterwegs

- **Fahrer/in** (`team.js` `staffSendOpt`, `staffSendJob`): Steht kein Fahrzeug am Hof, schickt die Kraft ein freies von
  unterwegs, das pünktlich ankommt – es holt die Ware am Hof ab, genau wie „Liefern“ von Hand. Vorher hieß es
  „kein freies Fahrzeug am Hof“, obwohl Fahrzeuge frei waren (Verhalten schon vor v61). Mit Fahrzeug am Hof wie bisher:
  die Kraft fährt mit (`s.ride` nur dann). Wartegrund jetzt „kein freies Fahrzeug – alle unterwegs oder zu klein“.
- Version: **v62** (`sw.js` und `?v=62` in `index.html`).

## v61 (aufbauend auf v60) – Freigaben für Arbeiter (Branch `whitelist-arbeiter`)

Statt einzelner Aufträge („＋ Auftrag geben“) legt der Spieler je Beruf dauerhaft fest, was die Kraft machen darf.
Alles in `team.js` (Abschnitt „v61: Freigaben“ hinter `staffOptions`), Stil in `style.css` (`.ftool.wl`, `.fst-mode`).

- **Grundsystem:** `STAFF_WL` = Landwirt, Tierpfleger, Hofmeister, Holzfäller, Sägewerker, Fischwirt. Gespeichert **je Beruf**
  in `S.farm.wl[role]`, und zwar nur die abgeschalteten Einträge (`id: false`) – alles andere ist an (auch neu Verfügbares).
  Bleibt bei Entlassen/Neueinstellen und Vertretung erhalten. Helfer: `staffWlOn/Has/Set`, `staffWlAll(role)` (Vollliste aus den
  Daten), `staffWlLock(role, id, ctx)` (Grund, warum noch nicht: Level, kein Stall, kein Baum, Stahlaxt, Maschine fehlt).
- **Geltung:** eigener Plan **und** Aufträge der Kollegen (Ketten). Ein Ketten-Auftrag für Abgeschaltetes wartet mit
  „<Ware> – bei <Name> nicht freigegeben“ und verfällt wie bisher. „＋ Auftrag geben“ gibt es für diese Berufe und den Fahrer
  nicht mehr; alte Chef-Aufträge dieser Berufe löscht `staffWlInit` einmalig beim Laden (`F.wlV`).
- **Landwirt:** sät, gießt, erntet, pflückt nur freigegebene Früchte (`staffFarmerJob`, `staffCrop`, `staffDo` field/pick/water).
- **Tierpfleger:** Produkt-Freigabe steuert Sammeln, Füttern **und** Nachkauf der Tierart (`staffKindOn` über `FANIMALS.out`):
  `staffPflegerJob`, `staffDo` „pen“, Futter-Auftrag in `staffPlan`, `staffWant` (Futterziel), `staffCrop` (Futtergetreide),
  `staffIdleWhy`. Nachkauf weiter nur bis zur 5★-Belegung (`staffPenTarget`/`staffPen5`). Abschalten nimmt nichts zurück.
- **Hofmeister, Sägewerker, Fischwirt:** nur freigegebene Rezepte (`staffPickRecipe(o, role)` – neuer 2. Parameter,
  `staffPlan` Stillstand, `staffDo` „mach“). Fertiges wird immer abgeholt, das Kessel-Heizen (Strom) läuft immer.
- **Holzfäller:** fällt nur Bäume freigegebener Holzarten (`staffAutoJob`, `staffTaskJob`). „Äste“ ist kein Eintrag mehr –
  sie fallen bei jedem gefällten Baum an. Ein schon begonnener Gang wird zu Ende gefällt.
- **Fahrer:** `S.farm.fahrMode` = `all` (wie bisher) · `ready` (nur fertige Bestellungen, nimmt nichts vorab an, legt keine
  Order-Aufträge/Ketten an) · `abo` (nur Daueraufträge). `staffFahrOk(o)` in `staffFahrerJob`, `staffPlan`, `staffTaskJob`,
  `staffDo` „send“. Neu: angenommen wird erst beim Losschicken (`staffDo` „send“), Moduswechsel unterwegs → nichts angenommen,
  nichts geschickt. Bereits angenommene Bestellungen und die wöchentlichen Daueraufträge (`farmAboOrder`) bleiben davon unberührt.
- **Unverändert:** Fischer/in (Code, Menü mit „Auftrag geben“, Angeln, Reusen), Mechaniker/in, alle Handgriffe des Spielers
  (`farmview.js`). Hinweis: Schaltet man beim Fischwirt „Reusenköder“ ab, beködert der Fischer mit Mais (wie bisher ohne Köder).
- Version: **v61** (`sw.js` und `?v=61` in `index.html`).

## v60 (Hotfix)

- **Hof-Laden, Gebäude-Fenster, Saat-Auswahl gesperrt trotz Level** (`farmview.js`): Die drei Fenster nahmen
  `level()` – das ist nach der Gründung der Spedition deren Level, nicht das des Erbes. Jetzt `flv()` (Erbe-Level),
  wie überall sonst im Hof (`farmQueue`, `farmCanMake`, `farmCropOk`). Der Fehler war schon vor v58 im Code und zeigt
  sich bei Spielständen, deren Spedition ein niedrigeres Level hat als der Hof.
- Version: **v60** (`sw.js` und `?v=60` in `index.html`).

## v59 (aufbauend auf v58) – Größere Spielmechaniken (Branch `teil2-mechaniken`)

- **Köderkiste** (`fishdata.js` `FSTORE.koeder`): Reusenköder, Tauwürmer, Profi- und Spezialköder haben
  `st: "koeder"` und belegen keine Kühlkisten-Plätze mehr (60 Plätze, Ausbau 100/250/500 €). `farmStores()`
  zeigt sie ab dem Steg, `erbeInit` setzt `F.cap.koeder`, `farmItemArea`: Köder → See. Alte Stände: die Köder
  wandern beim Laden automatisch in die Köderkiste (Lagerort hängt nur am Artikel).
- **Notizbuch zählt nur deine Fänge** (`team.js` `staffDo` „fish“, `farm.js` `farmHaul(o, staff)`):
  Fänge und Reusen der Fischerin/des Fischers lösen kein `farmEvent("catch"/"harvest:…")` mehr aus und
  zählen in `stats.staffCatch`/`stats.staffSpecies` statt `stats.catch`/`species`/`harvest`.
- **Fischpreise nach Gewicht** (`erbe.js` `fishPrice(id, kg, q)`, Daten `FFISH_KG` in `fishdata.js`):
  Wert = kg × echter €/kg × 0,5 (`FPRICE_KG`), Sterne nur noch Aufschlag (4★ +5 %, 5★ +10 %, kein Abzug),
  mindestens 0,30 €. Gold-Schleie und Reusentiere: Stückpreis mit demselben Aufschlag.
  `FITEMS[fisch].v` = Wert eines Durchschnittsfisches (`kgAvg`).
  - Lager: neben `qs[1…5]` jetzt `qkg[1…5]` (Gewicht je Sternstufe). `farmAdd(id, n, q, kg)`,
    `farmTake`/`farmTakeQ` nehmen das Gewicht anteilig mit. Neu: `farmInvKg`, `farmKgQ`, `farmStackV(id, n, q)`
    (voller Wert, von unten nach oben wie `farmTake`). Migration in `farmMigrate`: `qkg = qs × kgAvg`.
  - Großhandel `farmSellPrice` = Wert × 0,5 × Preis-Ereignis; Stand/Fischmarkt `stallBase(id, n, market, v)`.
    Partien am Stand behalten Sterne und Gewicht (`it.parts`, `it.v`), auch beim Zurücknehmen.
  - Fisch als Zutat: `farmQueue` merkt das Gewicht (`job.kg`), `farmUnqueue` gibt es zurück.
  - `specValue(id, q, kg)`, `farmValue`, Händler-Ereignis und Stand-Auswahl rechnen mit `farmStackV`.
  - Rezeptwerte: Zanderfilet 40 € (vorher 32), Hechtklößchen 13 € (vorher 7).
- **Berts alter Kombi** (`FMACHINES.bert_car`, `bert: true`, `hof: false`): steht nach dem Turnier am Ufer
  zwischen Steg und Bootshaus (`bertCarPlace` in `erbe.js`, Modell `FFM.bertCar` in `fishmodels.js` – älterer
  Kombi, erinnert an einen Mercedes, kein Logo). Antippen öffnet direkt die Werkstatt; oben Bert, die
  Dauerbestellung und ganz unten der Knopf „🎯 Köder-Entwicklung“ (`bertTopHTML`/`bertDevBtnHTML` in `openMachine`,
  `bertWorkHTML`/`bertWorkBind` über `machExtraHTML`,
  Liste in `openBertDev`, `fishview.js`). Der Reiter „🧔 Bert“ am Steg und der Sofortkauf von Würmern sind weg.
  - Werkstatt-Rezepte: Tauwürmer (10 Stück, 3 €, 20 min, nach dem Turnier), Profi-Köder (5 Stück, 60 €,
    120 min, `bertLureOk`), Spezialköder `sk_<art>` (5 Stück aus 2 Tauwürmern, 60 min, Preis je Art).
  - `farmQueue`: optional `r.ok()` (sonst „locked“, Grund `r.why` im Fenster), `r.costT` statt „Sprit · …“
    im Kassenbuch, `r.hide()` blendet nicht entwickelte Spezialköder aus.
  - Kein Personal: `staffMachRole` → „bert“, `staffMachines`/`staffRecipeFor` lassen `bert` aus
    (`staffMaker("wurm")` = niemand).
  - Dauerbestellung Tauwürmer 0/20/50/100 (`angel.bert.keep`, `bertKeepTick` in `angelTick`): reiht ein,
    solange Bestand + Warteschlange darunter liegen, holt fertige Würmer ab, wenn die Köderkiste Platz hat.
  - Alte Profi-Köder-Bestellung (`angel.bert.lureQ`) bleibt im Bert-Fenster abholbar.
- **Spezialköder** (`FSPEC_BAIT`, `FBAITS.sk_<art>` mit `spec`): `angelOdds` liefert nur die Zielart; wo es
  sie nicht gibt, ist Auswerfen gesperrt („nur an: …“). Hecht und Wels brauchen auch damit die Raubfischrute.
  Keiner für Rotauge, Rotfeder, Ukelei und die Gold-Schleie – bei denen meldet sich Bert auch nicht.
  - Zustand je Art in `angel.spec[art]`: `found` (erster **eigener** Fang, `specFound` in `farmCatch`),
    `dev.end` (Entwicklung 5 Spielstunden), `done`. Migration: Arten aus `angel.best` gelten als entdeckt.
  - Nach dem Angeln fragt Bert per Dialog nach dem Fisch (`bertAskOpen`, plus Handy-Nachricht);
    Übergabe (`specGive`) nimmt den Fisch mit den wenigsten Sternen. Fertig meldet sich Bert per Nachricht.
  - Köder-Auswahl zeigt Spezialköder erst, wenn sie entwickelt oder vorrätig sind (`angelBaitShow`);
    im Minispiel brechen die Köder-Knöpfe auf dem Handy in eine zweite Reihe um (`style.css` `.mg-stage .mg-bait`).
  - 3D-Bilder: Spezialköder = Köderdose in den Farben der Art mit der Art davor (`fishmodels.js` `specBait`,
    `ITEM_3D` in `worldview.js`); die Köder-Knöpfe am Steg und im Minispiel zeigen jetzt die 3D-Bilder statt Emojis.
  - Fischer/in nimmt für einen Auftrag zuerst den Spezialköder der Art (`staffFishPlan`).
- **Steg** (`woodmodels.js` `lakeSteg`): sechs Bohlen mehr bis aufs Ufer, Schwelle und Stützen – vorher lag Wasser
  zwischen Ufer und Steg. Nur Optik: Kachelfläche, Angelplatz und Fischer-Platz bleiben gleich.
- **Laden**: Reusenköder sind raus (`erbedata.js`, `s-koeder`) – sie kommen aus der Fischerhütte.
- **Fischmarkt = Verkaufsstand** (`worldview.js` `worldObjAction`): Antippen öffnet direkt den Stand (`openStall(true)`) wie
  an der Straße, keine Maschine mehr (`FMACHINES.f_markt` entfällt). Fischbrötchen macht jetzt das Kühlhaus
  (`FMACHINES.f_kuehl`, ab Lv 19). Alte Stände (`erbeInit`): Fischbrötchen aus der Markt-Warteschlange kommen ins
  Lager, gekaufte Warteschlangen-Plätze werden erstattet.
- **Obstbäume fällen** (`worldview.js` `fruitFell(o)`, Knopf „🪓“ in der Verschieben-Leiste beim Gedrückthalten des Baums, `farmview.js` `renderPlaceBar`): Axt-Minispiel mit
  Hilfsbaum (nur Anzeige), reife Früchte werden vorher geerntet, danach verschwindet der Baum: 2 Bündel
  Äste, Kirschbaum dazu 1 Edelholzstamm. Platz und Baum-Limit (16) werden frei.
- **Daueraufträge** (`farm.js` `FABO`): 24 statt 12 Firmen, neue mit Mindestlevel `lv`; Prüfung alle 6 h,
  bis zu 2 offene Angebote je Station (1 Tag gültig), Menge und Bonus wachsen mit dem Level (±25 %).
  Fester Preis je Lieferung (`farmAboPrice`: Warenwert + Liefergebühr + Bonus) steht schon im Angebot und gilt
  für jede Wochenbestellung; kündbar erst nach 2 Lieferungen (`FABO_MIN`, `farmAboCanQuit`).
- Version: **v59** (`sw.js` und `?v=59` in `index.html`).

## v58 (aufbauend auf v57) – Fehler und Optik (Branch `teil1-fehler-optik`)

- **Hofausbau** (`worldview.js` `stageHTML`): erreichte Stufen grün mit ✓ (auch Stufe 4), die
  nächste kaufbare gelb. Vorher blieb die aktuelle Stufe immer gelb.
- **Tagesaufgabe „Ohne Leerfahrt“ entfernt** (`goals.js` `TASKS`, Zählung in `goalsDelivered`).
  `dailyState()` ersetzt Aufgaben mit unbekannter ID aus alten Ständen.
- **Preis-Ereignisse** (`erbe.js` `farmPriceBoost(id)`): „Fischpreise steigen“ = ganze Fische ×1,3,
  „Holzpreise steigen“ = Rohholz ×1,3 – in `farmSellPrice` (Großhandel), `farmWoodPrice`,
  `farmPileValue` und `stallBase` (Preisvorschlag am Stand). Vorher erhöhte das Fisch-Ereignis nur
  die Verkaufschance am Fischmarkt, keinen Preis; der doppelte Faktor in `stallTick` ist raus.
  `FEVENTS`: Dauer 240 statt 1800 Minuten, Gewicht 3 statt 7, neu `gap` (2 Spieltage Abstand je Sorte,
  `F.ev.last`). Meldungen in `worldview.js` angepasst.
- **Daueraufträge** (`farm.js` `farmAboTick`): Abgelaufene Angebote werden sofort ersetzt, und zwar nicht
  durch dieselbe Firma, solange es eine andere gibt (`F.aboSeen`).
- **Fischer/in** (`team.js`, neue Helfer in `erbe.js` hinter `angelLog`):
  - `staffOptions("fischer")`: Fehler behoben (Listenposition aus `forEach` landete als „gesperrt“
    in `add`). Wählbar sind alle Arten aller Fanggründe (gesperrt ohne Boot) und die Reusentiere.
  - `staffMaker`: Fisch irgendeines Fanggrunds und Reusentiere → Fischer (vorher nur „Am Steg“, deshalb
    „Zander macht niemand“ bei Zanderfilet-Aufträgen).
  - Angeln nach Spielerregeln: `staffFishPlan` wählt den besten Köder für die Art des Auftrags
    (Mais → klein, Tauwürmer → mittel, Profi-Köder nur mit Raubfischrute) und den Fanggrund mit der besten
    Chance; `staffFishCatch` verbraucht 1 Köder je Wurf (eigener Mais-Zähler `angel.staffMais`) und würfelt
    wie beim Spieler. Gefangen wird, was beißt; gutgeschrieben wird nur die bestellte Art.
  - Er bleibt am Stegende auf den Planken (`staffStegSpot`, Blick aufs Wasser) und bearbeitet die
    Reusen von dort; Reusenaufträge beködern gezielt (`j.kind`).
  - Wartemeldung mit echtem Grund (`s.fwhy`: Boot, Köder, Reusenstufe, Kühlkiste).
  - Fänge stehen im Fangbuch mit 👷 (`angelLog(..., staff)`), zählen nicht für Rekorde, Turnier- und
    Profi-Köder-Schwellen.
- **Steg-Fenster** (`fishview.js`): Reiter „🏆 Turnier“ nur bis zur Siegerehrung, danach „🧔 Bert“;
  Turnier steht im Fangbuch (`angel.tour.at`). „Zu wenig Geld – benötigt: …“ bei Ruten, Reusenstufe
  und weiterer Reuse.
- **Modelle**: Barsch- und Zanderfilet unterscheidbar (`fishmodels.js` `fishItem`), Ruderboot als
  Karve (`woodmodels.js` `rowboat`).
- Version: **v58** (`sw.js` und `?v=58` in `index.html`).

## v57 (aufbauend auf v56)

- **Kessel:** Bei vollem Solardach tagsüber gesperrt – `farmQueue` liefert
  dann `"sun"` (`kesselSunOff(o, r)` in `farm.js`), im Fenster steht
  „🌙 erst nachts“. Ohne oder mit halb belegtem Dach wie bisher.
- **Fortbildung:** Ein Freund / eine Freundin springt ein (`team.js`:
  `s.away.sub`, `staffStandIn(s)`, `staffName(s)` = „Tom (für Svenja)“,
  Meldung `staffSubPopup`). Die Kraft arbeitet während der Fortbildung
  weiter (mit dem Aussehen der Vertretung), der Lohn läuft weiter, ohne den
  Fortbildungsbonus.
- **Figur:** Selbstgestalten (Regler, Würfeln) ist raus – `intro.js` kennt
  nur noch „Fertige Figur“ (Standard, erste vorgewählt) und „Aus Foto“;
  im Spiel (Tipp aufs Porträt, `photo.js`) lassen sich fertige Figuren wählen.
- **Ereignisse:** Nach jedem Ereignis 2½–5 Spielstunden Pause (`FEV_PAUSE`
  in `erbe.js`). Die „Besondere Lieferung“ liegt auf einem freien Fleck mitten
  im Hof, wohin die Kamera beim Öffnen schaut (`farmParcelSpot`).
- **Krüger:** Blase sagt jetzt „zwei Kleeblätter“ (`FNEIGHBOR_CLOVER`).
- Fischerei-Dateien unverändert. Version: **v57**.

## v56 (aufbauend auf v55)

**Weltumbau** (Welt = 1 Einheit je Kachel, Süden = +z, Hofkachel = Welt + 16)
- Der Hof liegt zwei Kacheln weiter von der Straße weg und ist größer. Grenzen
  je Ausbaustufe stehen in `erbe.js` als `FHOF_B` (Zaunlinien x0, z0, x1, z1):
  30 × 32, 36 × 35, 42 × 38, 48 × 41. Der Südzaun (z = 14) bleibt, jede Stufe
  gibt drei Kacheln nach Westen, Norden und Osten (Pflöcke mit roter Spitze
  zeigen auf der Wiese die nächste Stufe). Helfer: `farmHofB()`, `FHOF_MAX`,
  `FGATE` (Südtor x = 5, Westtor z = −9,5).
- `farm.js`: statt `FIN0/FIN1` gibt es `FIN = { x0, z0, x1, z1 }`, das
  Belegungsraster geht über `fgi(x, z)` (Kacheln −16 … 47), `FPATH` speichert
  `fgi`-Schlüssel (`fgXZ(k)` rechnet zurück). `FG` = 32 bleibt nur für die
  Umrechnung Welt ↔ Kachel.
- Teich +11,5 nach Osten, Sägewerk samt Wald, Bach, Lichtungen, Felsen und
  altem Wald −12 / −12 nach Nordwesten (`FWORLD`, `FSAW`, `FYARD`,
  `FAREAS`). Neu: Feldweg vom Westtor zur Straße (letzter Eintrag in
  `FWORLD.paths`), Nachbarfelder in `FWORLD.fields`.
- **See und Fischerei sind unverändert** – `fishdata.js`, `fishview.js`,
  `fishmodels.js` nicht angefasst.
- Alte Spielstände ziehen beim Laden einmal um (`erbeMove56`, Merker
  `F.v56`): Hofobjekte z − 2, Sägewerk −12 / −12, Bäume neu (alle wieder
  gewachsen), Leute starten zu Hause.

**Bäume**
- Jeder Baum im Wald ist fällbar: Kulissenbäume liegen je Kachel in
  `WV.bgChunks` (`worldview.js`); Antippen macht daraus einen echten Baum in
  `S.farm.trees` (`bg` = Schlüssel, `S.farm.bgCut` merkt sich die Stelle).
- Neue, artgerechte Modelle in `woodmodels.js`: `tree(sp, sz, v)` und
  `bgTree(sp, v)` (wenige Dreiecke), Farben in `TREE_C`, Höhen in `TREE_H`.

**Sägewerk**
- Krügers Holzstapel (`FWORLD.piles`) sind antippbar: verkaufen oder ins
  Holzlager (`farmPileTake`, Merker `S.farm.piles`); danach ist der Platz frei.
- Waldwege enden an den Toren gerade am Zaun (keine runde Kappe mehr im Hof).

Version: **v56** (Service Worker und `?v=56` in `index.html`).

## v55 (Hotfix)

- `erbedata.js` war auf GitHub leer hochgeladen – dadurch startete der Hof
  nicht. Die Datei ist wieder vollständig.
- Fehler beim Start erscheinen als roter Hinweis oben (`window.logiErr`),
  der Hof-Start ist abgesichert, alle Dateien werden mit `?v=…` geladen
  (kein Mischen alter und neuer Dateien aus dem Cache).

## v54 (aufbauend auf v53)

- Firmenschild am Hoftor zeigt Name und Logo direkt auf der Tafel (Bild in 3D,
  vorn und hinten; Stufe 4 auf der Steintafel). Der schwebende Name ist weg.
- Logo als Aufkleber auf allen Firmenfahrzeugen im Hof (Lastenrad, Moped,
  Transporter, Holzlaster), lackierte Fahrzeuge in Firmenfarben, Kartons beim
  Beladen mit kleinem Logo. Logo ändern → alles zieht sofort nach.
- Technik: `gl3d.js` kann jetzt „Aufkleber“ (Canvas als Bild auf einem
  Viereck: Knoten mit `decal: { t, w, h }`, Bild über `R.texture(canvas)`).
  Gemalt wird in `worldview.js` (Abschnitt „Firmenauftritt“).
- Verkaufsstand startet auf einem freien Platz an der Straße (nicht mehr im
  Traktor); Maschinen dürfen vor der Sägehalle stehen, Dörings Wagen parkt
  dann woanders. Holzlaster-Stellplatz flimmert nicht mehr.
- Fischerei-Dateien unverändert.

Version im Service Worker: **v54**.

## v53 (aufbauend auf v52)

**Personal**
- Laufwege: Die Leute laufen auf Wegen und durch die Tore (A*-Raster in
  `team.js`, Abschnitt „Wege“), nicht mehr durch Gebäude, Ställe, Zäune oder
  Felder – nur der Landwirt geht aufs Feld. Arbeitsplatz immer vor dem
  Gebäude bzw. direkt vor dem Baum.
- Fortbildung (Team-Fenster): kostet Geld, Kraft einen Tag weg, danach +2 %,
  je Kraft alle zwei Wochen. „📍 Orten“ fährt die Kamera hin.
- Fahrerin nimmt die lukrativsten Angebote selbst an, arbeitet nach Erlös ab,
  steigt selbst ins Fahrzeug und kommt danach zu Fuß zurück.
- Mechaniker heizt nachts den Kessel (Solarstrom gibt es nur noch tagsüber).
- Landwirt: bis zu vier Felder je Gang. Tierpfleger: nie mehr Tiere als
  für 5 Sterne Platz haben. Werkzeug richtig in der Hand (Sichel, Axt, Säge).

**Bestellungen**
- Eine Bestelltafel je Station (Hof, Sägewerk, Fischerei); im Auftrags-Tab
  Filter Hof / Sägewerk / Fischerei.
- Angebote verfallen nach einem Tag, „Annehmen“ = ohne Frist.
- Daueraufträge: Wochenlieferung größerer Firmen mit Bonus, bis zur Kündigung.

**Hof und Sägewerk**
- Sägewerksgebäude verschiebbar, Maschinen wechseln zwischen Hof und
  Sägewerk (Bauzonen in `farm.js`), Verkaufsstand an der Straße.
- Weidestufen für Kuh, Schaf, Rind erweitert (5 Sterne bei voller Belegung).
- Warteschlange: einzelne Aufträge oder alle abbrechen (Zutaten zurück).
- Wildschwein-/Pilze-Ereignis entfernt; jeder Baum fällbar; Fällmenge stimmt.
- Kunden- und Ton-Knopf weg (Ton im Wohnhaus im Buch).

**Grafik und Bedienung**
- Alle Fische und Fischwaren als 3D-Modell; Ware antippen zeigt den Namen.
- Keine Bildvorschau, kein Kopier-Menü, keine Lupe beim langen Drücken.
- Wege ohne Flimmern und mit Abschluss, Felder flimmern nicht beim Zoomen,
  Holzlaster mit Beladen und Fahrer, Fahrzeuge nie mehr leer unterwegs.
- Kamera springt nach dem Füttern nicht mehr in den Wald; Döring-Nachricht
  führt zum Montagewagen.

**Bitte beachten (Fischerei-Dateien)**
- `fishmodels.js`: nur ein **neuer Block** vor dem `return` (Fische und
  Fischwaren als Ware: `FISH`, `fishUp`, `fishLie`, `fishItem`) plus die
  vier Namen im `return`. Sonst nichts verändert.
- `fishview.js`: nur Symbole – Emojis der Fische durch 3D-Bildchen ersetzt
  (`itemIc`/`icHTML`), keine Logik.
- Spielstände laufen weiter: Pilze verschwinden aus dem Lager, der
  Verkaufsstand zieht an die Straße, Tafeln für Sägewerk und Fischerei
  erscheinen, sobald die Station offen ist.
