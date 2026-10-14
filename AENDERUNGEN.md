# Änderungen – kurz für den Kollegen

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
