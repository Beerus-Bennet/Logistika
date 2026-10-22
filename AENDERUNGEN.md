# Änderungen – kurz für den Kollegen

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
