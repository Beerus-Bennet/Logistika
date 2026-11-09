# Änderungen – kurz für den Kollegen

## v316 – U-Haft-Zelle ruckelt nicht mehr (gemeinsame Ruckelbremse)
**Meldung Bennet (Handy, U-Haft):** Die Zelle ruckelt stark, besonders beim Antippen.

**Ursache (`jail.js`, im Testbrowser gemessen):**
- Der Tipp selbst ist billig (Handler 0,4–1,4 ms, 30 Zeichenaufrufe je Bild). Die Zelle ist wie das Büro grafiklastig: vollflächig mit 1,75-facher Auflösung, Schatten, Nebel, Lichtstrahlen, Staub. Ohne Reserve fällt jeder zusätzliche Aufwand (Sprechblase, Tippreaktion) sofort als Ruckler auf.
- Die Sprechblase animierte `margin-top`. Das erzwingt in jedem Bild der Animation (1,9 s) eine neue Layoutberechnung.

**Lösung:**
- Die Ruckelbremse aus v315 liegt jetzt in `gl3d.js` (`G3.governor`) und gilt für die Zelle und das Büro: Kommt das Gerät nicht auf etwa 30 Bilder/s, sinkt die Auflösung stufenweise auf 80 %, 65 %, 50 %. Nur abwärts.
- Die Blasenanimation läuft über `transform` statt `margin-top` (`style.css`, v316).

**Geprüft (Testbrowser, Software-Grafik):** Die Zelle drosselt die Auflösung (390 × 844 → 195 × 422), das Büro weiterhin (390 → 254 → 195). Tippen auf den Häftling zeigt die Blase („Ich kann nicht schlafen.“) mit `transform`-Animation. **Nicht geprüft:** auf dem Handy. Die Software-Grafik sagt nichts über die tatsächlichen Bilder pro Sekunde eines iPhones. Ruckelt es weiter, bitte melden, dann messe ich Schatten und Lichtstrahlen einzeln.

## v315 – Büro: Sprechblase bleibt über dem Kopf, Ruckelbremse
**Meldung Bennet (Handy, Konzernzentrale):** Starkes Ruckeln in den Büros. Der Text der Sprechblase stand als schmale Spalte am rechten Rand. Die Blase soll über dem Arbeiter bleiben und nicht mit skalieren.

**Ursache Sprechblase (`officefp.js`, `style.css`):** Die Blase wurde auf den Bildschirmrand geklemmt, auch wenn der Sprecher gar nicht im Bild war. Am rechten Rand blieb dem Element nur noch wenig Breite, und der Text brach nach jedem Buchstaben um.

**Lösung:**
- Die Blase hat feste Breite (`width:max-content`, mindestens 120 px, höchstens 220 px) und ändert ihre Größe nicht.
- Sie sitzt über dem Kopf der Person. Nur waagerecht wird sie so weit verschoben, dass sie ganz sichtbar ist. Liegt der Kopf nicht im Bild, verschwindet sie.

**Ursache Ruckeln (gemessen im Testbrowser, 24 Mitarbeiter, 390 × 844):** Der JS-Anteil ist klein (Profiler: unter 10 ms je Bild, Figuren-Animation 2 ms). Es sind rund 290 Zeichenaufrufe je Bild bei 1,75-facher Auflösung (683 × 1477 Pixel) mit Schatten und Nebel. Das Ruckeln liegt also an der Grafik.

**Lösung (`officefp.js` `governQuality`, `gl3d.js` `R.scale`):** Kommt das Gerät nicht auf etwa 30 Bilder pro Sekunde, sinkt die Auflösung stufenweise auf 80 %, 65 % und 50 %. Nur abwärts, damit nichts hin und her springt. Die ersten 2,5 s, Pausen und Hänger über 1,5 s zählen nicht mit. Schatten, Figuren und alle Abläufe bleiben unverändert.

**Geprüft (Testbrowser mit Software-Grafik, Büro mit 24 Mitarbeitern):** Die Auflösung sinkt stufenweise (390 → 254 → 195 px Breite), sobald die Bilder zu langsam kommen. Eine Sprechblase am rechten Rand behält ihre Breite (198 × 89 px statt einer schmalen Spalte). Positionsrechnung: Kopf im Bild bleibt über dem Kopf, am Rand wird nur waagerecht verschoben, Kopf außerhalb blendet die Blase aus. **Nicht geprüft:** auf dem Handy; ob das Ruckeln dort wirklich an der Auflösung liegt. Die Software-Grafik im Testbrowser sagt nichts über die tatsächlichen Bilder pro Sekunde eines iPhones aus. Wenn es weiter ruckelt, bitte melden, dann messe ich Schatten und Figuren einzeln.

## v313 – Echte Tür-zu-Tür-Logistik: Vorlauf, Hauptlauf, Umfuhr, Nachlauf
**Wunsch Bennet:** Jeder Auftrag läuft von der Adresse des Absenders bis zur Adresse des Empfängers. Häfen, Flughäfen und Bahnterminals sind Zwischenstationen, Vor- und Nachlauf fährt die Straße. Ware nach Schiff, Bahn oder Flugzeug darf nicht automatisch beim Kunden landen.

**Ursache (Stand v311 nachgelesen und im Testbrowser nachgestellt):**
- Die erste und die letzte Teilstrecke fuhren mit ihrem eigenen Verkehrsträger bis an die Tür (`legPts`/`legStartPt`). Ein Binnenschiff von Westhafen nach Hannover legte also an der „Siemensstraße 108“ an. Mit dem Entladen des Schiffs war der Auftrag fertig und bezahlt.
- Jede Teilstrecke brauchte genau ein Fahrzeug, das die ganze Menge auf einmal trägt. Teilmengen und mehrere Fahrten gab es nicht.
- Die Folgeteilstrecke startete erst nach dem Ende der vorigen. Es gab keinen Warenbestand am Terminal und kein Warten.
- Flughafen und Hafen derselben Stadt waren derselbe Punkt (Jebel Ali, New York, Hongkong …). Es gab keinen Transport dazwischen.
- Der Suezkanal (Knoten nur für Schiffe, ohne Straße) konnte als Absender oder Empfänger einer Ausschreibung auftauchen: „Suezkanal / Port Said“. Die Ortskarte eines angetippten Knotens blieb außerdem offen, wenn die Karte einem Fahrzeug folgte oder weit weggeschoben wurde. So stand „Suezkanal / Port Said“ noch da, während die Karte längst Casablanca zeigte.

**Lösung (`game.js`, Block „v313: Tür zu Tür“):**
- **Kette:** `chainLegs` macht aus der Netzroute die Kette.
  - Vorlauf per Lkw von der Tür zur Abgangsstation.
  - Hauptlauf nur zwischen Terminals.
  - Umfuhr per Lkw, wenn zwischen Wasser/Schiene und Luft gewechselt wird. Der Flughafen liegt an solchen Knoten 16 km entfernt (`termPt`).
  - Nachlauf von der Zielstation zum Empfänger.
  - Teilstrecken tragen `kind` (direkt · vor · haupt · strasse · umfuhr · nach) und lesbare Start-/Zielnamen (`fa`/`fb`, z. B. „Hafen Jebel Ali (Dubai) → Flughafen Jebel Ali“).
- **Ausnahme Großmengen:** Ab 60 t (`D2D_HEAVY`) übergibt der Kunde am eigenen Kai bzw. Gleisanschluss. Die Adresse heißt dann z. B. „Werkskai am Hamburger Hafen“, Merkmal `o.pickT`/`o.dropT`. Der Planer nennt das ausdrücklich („so mit dem Kunden vereinbart“). Schüttgut fährt so weiterhin von Kai zu Kai, denn kein Lkw darf Schüttgut laden.
- **Lokale Aufträge:** Reine Straßen- oder Radstrecken bleiben eine Direktfahrt mit einem Fahrzeug.
- **Mengenfluss (`d2dTick`):** Jede Teilstrecke führt `qty`, `ld` (geladen) und `dn` (abgeladen).
  - Ein Fahrzeug lädt erst, wenn seine Ware am Ladepunkt liegt. Der Bestand ist das, was die vorige Teilstrecke abgeladen hat.
  - Ein Fahrzeug nimmt höchstens seine Nutzlast (`take = min(cap, Rest)`).
  - Alle Fahrzeuge der Kette fahren bei Annahme los und warten am Terminal (Phase `wait`).
  - Straßenfahrzeuge fahren mehrmals: abladen, leer zurück, nächste Teilmenge.
  - Mehrere Fahrzeuge können sich eine Straßenteilstrecke teilen (`leg.vehs`, `extraFor`).
- **Abschluss (`finishJob`):** Erst wenn die ganze Menge beim Empfänger abgeladen ist. Geld, EP und Kundenwirkung gibt es genau einmal (`job.fin`). Teilzustellungen melden sich einmal („Teilweise zugestellt“).
- **Varianten (`buildVariants`):** Es wird die ganze Kette mit Referenzfahrzeugen bewertet, inklusive Vor-/Nachlauf und Mehrfachfahrten.
  - Kandidaten sind die schnellste und die günstigste Netzroute, beide ohne Luftfracht, und die reine Straße.
  - Was teurer UND langsamer als eine andere Variante ist, fällt weg. Schiff + Flugzeug bleibt also nur, wenn es echt Zeit oder Geld spart.
  - Zur Auswahl stehen „⚡ Schnellste“, „⚖️ Ausgewogen“ und „💶 Günstigste“.
- **Preis und Frist:** `withLastMile` rechnet Vor-, Nach- und Umfuhr (Fahrten, Umschlag) in Frist und Preis neuer Ausschreibungen ein. Das gilt jetzt auch für Luftfracht-Ausschreibungen.
- **Planer:**
  - Die Kette steht als Abfolge da: Abholung › Vorlauf › ⚓ Terminal › Hauptlauf › ⚓ Terminal › Nachlauf › Zustellung.
  - Je Teilstrecke: Art, Verkehrsträger, Start → Ziel, Menge, Nutzlast, Fahrten bzw. Runden, Zeitfenster und Kosten.
  - Weitere Fahrzeuge lassen sich hinzufügen oder entfernen.
  - Oben steht, was für die ganze Kette noch fehlt („Lkw für Nachlauf (FRA)“), mit dem Markt-Knopf je Teilstrecke.
  - Die ganze Kette übernimmt man mit einem Klick („Auftrag annehmen“).
  - Die Minikarte zeichnet die echte Linie je Teilstrecke.
- **Live und Ortskarte:**
  - Lesbarer Status: Abholung geplant, Wird abgeholt, Im Vorlauf, Wartet auf Umschlag, Auf See, Im Hafen X · Wartet auf Lkw (kommt in …), In der Umfuhr, In der Luft, In Zustellung, Teilweise zugestellt (x von y), Vollständig zugestellt.
  - Dazu, wo die Ware liegt (Absender, geladen, Terminal, Empfänger) und eine Zustellprognose aus dem tatsächlichen Stand. Halte, Stürme und Zoll schieben sie mit (`d2dEta`).
  - Mehrere Teilstrecken leuchten auf der Karte gleichzeitig, wenn Teilmengen unterwegs sind.
  - „Live verfolgen“ folgt dem Fahrzeug, das gerade Ware fährt.
- **Fahrzeuge:** Flugzeuge stehen am Flughafen, nicht im Hafen. Leerflüge gehen nicht mehr über den Hafen-/Stadtpunkt.
- **Suezkanal:** Als reine Durchfahrt markiert (`N.suez.via`). Er ist kein Kundenort mehr.
- **Ortskarte:** Sie schließt, sobald „Live verfolgen“ startet oder der Ort aus dem Bild geschoben wird.
- **Weitere Dateien:**
  - `goals.js`: Vertragsprüfung erlaubt Mehrfachfahrten auf der Straße.
  - `team.js`: Fahrerin gilt in Phase `wait` noch als am Hof.
  - `officefp.js`: Bildschirm zeigt „Wartet auf Ware“.
  - `style.css`: Kette, Mengen, Status.

**Alte Spielstände:**
- Laufende Aufträge ohne `job.v` laufen unverändert nach der alten Logik zu Ende. Sie werden nicht umgeschrieben, damit weder Ware noch Geld doppelt entsteht.
- Neue Aufträge bekommen `job.v = 313`.
- Offene Ausschreibungen werden beim ersten Planen einmalig eingeordnet (Merkmal `o.d2d`). Bei Großmengen wird die Adresse auf den Kai gesetzt. Preis und Frist alter offener Ausschreibungen bleiben, der Planer zeigt die echten Kettenkosten.
- Alles steckt im Spielstand (`ld`/`dn`/`vehs`, Fahrzeugphase und Ladung). Neuladen geht in jedem Zwischenzustand.

**Geprüft:**
- Unit-Test `d2d-v313.test.js` (lädt die echten Spieldateien in eine VM), 7 Prüfungen bestanden:
  - Direktlieferung.
  - Binnenschiff Westhafen → Hannover: Lkw wartet, Schiff endet im Hafen ohne Auszahlung, 2 Nachlauffahrten, Teilzustellung, Menge in jedem Takt erhalten, nie überladen, genau eine Auszahlung.
  - JSON-Speichern/Laden an drei Stellen.
  - See → Umfuhr → Luft → Nachlauf, Flugzeug lädt erst nach der Umfuhr.
  - Ungeeignete Fahrzeuge abgelehnt, Schüttgut am Kai.
  - Stichprobe neuer Aufträge in Etappe 2–6: kein Schiff/Zug/Flugzeug an einer Kundentür, kein Suezkanal.
  - Alter Auftrag läuft weiter.
  - Die anderen Unit-Tests: gleiche Ergebnisse wie auf main (dieselben schlagen dort schon fehl).
- Testbrowser (Chromium, Playwright, `?test`):
  - Dieselben Abläufe mit echtem `tick`.
  - Neuladen der Seite in drei Zwischenzuständen (Lkw wartet, Umschlag, Leerrückfahrt nach Teilzustellung) bis zum Abschluss, eine Auszahlung.
  - Alter laufender Auftrag nach Neuladen fertig.
  - Prognose verschiebt sich bei 3 h Halt um 180 min.
  - Planer zeigt den fehlenden Lkw. Kauf über den Markt-Knopf, zurück, Annahme mit einem Klick, dann Live-Ansicht.
  - Desktop 1280 × 860 und Mobil 390 × 844 ohne seitliches Überlaufen der Seite.
  - Antippen von Casablanca, Suezkanal und Algeciras bei Zoom 3,2/5,5/7 wählt jeweils genau diesen Ort.
  - 300 neue Aufträge in Etappe 6, keiner am Suezkanal.

**Nicht geprüft:** am Handy (nur schmale Ansicht im Testbrowser); lange Spielzeit mit Büro-Disposition und vielen gleichzeitigen Ketten; das Aussehen der Linien auf echten Kartenkacheln (im Testbrowser laden die Kacheln nicht). Die ursprüngliche Bildschirmsituation „Suezkanal / Port Said bei Casablanca“ habe ich nicht eins zu eins nachgestellt; behoben sind die beiden gefundenen Ursachen (Kanal als Kundenort, offen bleibende Ortskarte).

**Vereinfachungen:**
- Umschlag- und Wartezeiten am Terminal sind die bisherigen Pauschalen je Verkehrsträger.
- Der Flughafenpunkt an Mischknoten ist ein fester Spielpunkt 16 km neben dem Knoten, keine echte Flughafenlage.
- Hauptläufe (Schiff, Zug, Flugzeug) fahren weiterhin in einer Fahrt, mehrere Fahrten gibt es nur auf der Straße.
- Die Zustellprognose ist eine Schätzung aus dem aktuellen Stand.

## v312 – Trophäen als ruhigere Sammlerstücke präsentieren

Keilerwaffen mit aufrechteren, schlankeren Bögen, etwas unterschiedlichen Seiten, sichtbaren Wurzeln und kleinen Messingfassungen statt fast identischer Hornringe. Elfenbein verläuft von warmen Wurzeln zu hellen Spitzen. Hirschgeweihe erhalten am Präparat eine weichere Auslage und gedämpfte Spitzenfarben, der Schädel einen abgerundeten Nasensteg. Das lebende Wild bleibt unverändert. Walnussschilder mit ruhigerer Maserung hängen vor einer entsättigten grünen Rückwand. Die Sammlung nutzt einen passenden Hintergrund, weniger harte Schlagschatten, eine größere Nahansicht und Licht von vorn. Cache-Schlüssel v312 verhindert alte Vorschaubilder.

Gespeicherte Maße, Geweihenden, Sonderformen, Medaillen, Werte, Inventar und Ehrenplatzbelegung bleiben erhalten. Keine zusätzlichen Zeichenknoten oder externen Bilder.

Geprüft: 36 deterministische Präparate, Altbestände, zehn Geweih-Sonderformen, acht Ehrenplatzbelegungen ohne Überschneidung/Durchragen (trophy-layout-v310.test.js); zehn v307-Prüfgruppen einschließlich 884 Animationsbildern sowie 72 v283-Modellvarianten bestanden. Originalmodelle im Chromium vor/nach der Änderung und auf Mobilbreite gerendert, keine WebGL-Fehler. Im vollständigen Spiel bei 390 Pixeln Breite Hirsch, Keiler und Fasan öffnen/schließen, 3D-Nahansichten ohne horizontales Abschneiden, keine JavaScript-Fehler. Syntax und git diff --check erfolgreich. Nicht auf einem echten Handy geprüft.

PR #30 (Karte v311) ist inzwischen in main enthalten und in diesen Branch integriert. Beide Änderungen bleiben erhalten; gemeinsame Cache-/Versionsdateien auf v312 abgestimmt.

## v311 – Karte läuft in Ost-West-Richtung rundherum (wie die Snapchat-Karte)
**Wunsch Bennet:** Man soll auf der Karte sowohl nach Westen als auch nach Osten schieben können; danach sieht man die Welt wieder wie zu Beginn.

**Ursache (im Testbrowser nachgestellt):** Die Karte ist technisch schon mehrfach nebeneinander gezeichnet, scheiterte aber an der Begrenzung auf das erschlossene Gebiet (v77). `setBounds` bekommt als Eckpunkte den kleinsten und größten Längengrad, hat sie aber wie eine Linie über die Datumsgrenze „aufgerollt“. Reicht das Gebiet über mehr als 180° (Etappe 6: Amerika bis Asien), wurde daraus ein schmales Band an der falschen Stelle, und die Kamera ließ sich nicht mehr hinausschieben. Mit dem alten Code blieb die Karte beim Schieben nach Osten bei −125° hängen. Außerdem zeichnete der Nebel seine Lichtkreise nur auf der nächsten Weltkopie.

**Lösung:**
- **`map.js`:**
  - `setBounds` benutzt die Eckpunkte unverändert (kein Aufrollen mehr).
  - Ist das erschlossene Gebiet mindestens halb so breit wie die Welt, gibt es in Ost-West-Richtung keine Grenze: Die Karte läuft rundherum. Die Begrenzung nach Norden und Süden und das Herauszoomen bleiben.
  - Neu `screenPosAll(lat, lon)` liefert den Bildschirmort in jeder sichtbaren Weltkopie.
- **`game.js` (`drawFog`):** Lichtkreise der Orte, der Fahrzeuge und die „Bildschirm ist frei“-Prüfung berücksichtigen jede sichtbare Weltkopie. Pins, Linien und Kacheln wiederholten sich schon vorher.

**Geprüft (Testbrowser, Schieben per Pointer-Ereignissen, Gebiet −122° … 139°):**
- Alter Code: die Länge der Kartenmitte bleibt beim Schieben nach Osten bei −125° stehen.
- Neuer Code: 141° → −178° → … → 148° → −171° …, die Karte läuft mehrfach um die Welt.
- Nebel: weit herausgezoomt vier Weltkopien, das Zeichnen läuft ohne Fehler. Keine Konsolenfehler.

**Nicht geprüft:** am Handy mit echtem Wischen; das Aussehen des Nebels über der Datumsgrenze im Spiel (im Testbrowser laden die Kartenkacheln nicht); Etappen unterhalb von Etappe 6 mit schmalerem Gebiet (dort bleibt die Begrenzung wie bisher).

## v310 – Glaubwürdigere Trophäentafel und sichtbarer Wasseraufprall
**Basis:** GitHub main `0e6ee68` (v308), vor und während der Arbeit wiederholt abgeglichen. Die noch nicht auf main vorhandene Zaunkorrektur v309 ist vollständig enthalten. Die ZIP enthält nur die elf gegenüber diesem main geänderten/neuen Dateien; ältere ZIPs nicht anschließend darüberkopieren.

**Ursache:** Auf der Trophäentafel hingen volle Köpfe, Schmucksteine und lose Medaillen dicht nebeneinander; breite Geweihe ragten in Nachbarstücke und Dach. Das Dach bestand aus zwei groben, zur Tafelmitte ansteigenden Brettern. Am Wasser ragte die für das Ufer gedachte breite Überdeckung über die Absturzkanten hinaus. Die glatte blaue Fläche, große Partikeltropfen und ein vor der Seeoberfläche fast unsichtbar werdender Vorhang ließen den Fall folienartig und den Kontakt zum See undeutlich wirken.

**Trophäen (`hunt.js`):** Keilerwaffen als zwei große gebogene Unterkieferwaffen mit den kleineren Oberkieferwaffen und Befestigungen auf einem gemaserten Brett; beim Hirsch knöcherner Oberkiefer-Schädel mit Augen-/Nasenöffnungen und dem bisherigen individuellen Geweih. Die gespeicherten Waffenmaße, Geweihenden, Auslagen und Sonderformen bestimmen weiterhin das Modell. Holzrahmen und dezente Metallplaketten ersetzen Edelsteine und lose Medaillen. Fasanenfedern bleiben individuell. Geschlossene Bretterrückwand, Querverbindungen, aus einzelnen Brettern gebautes Dach mit First von links nach rechts und Neigung nach vorn/hinten, Metallpfostenschuhe auf Sockeln. Ein bis drei vollständige Präparate werden anhand ihrer tatsächlichen Modellgrenzen gleichmäßig in freie Buchten eingepasst; auch breite/ungerade Geweihe bleiben unter dem Dach und vor der Rückwand. Neuer Modellschlüssel v310.

**Wasser (`woodmodels.js`, `gl3d.js`, `worldview.js`):** Uferüberdeckung vor und nach allen vier kleinen Kaskaden weich verengt; am Hauptfall schon vor der freien Lippe vollständig zurückgeführt. Gemeinsame Anschlusspositionen, Normalen und Laufzeitkoordinaten bleiben identisch. Ruhigere blaugrüne Bachfarben und weniger flächige Spiegelung; wandernde Schaumflecken auf den Stufen. Hauptfall erst nach der Kante weich in unregelmäßige helle Fäden und transparentere Zwischenräume überblenden, zum Fuß hin stärker belüften. Wasser bleibt bis zur tatsächlichen Seehöhe sichtbar und geht dort in eine flache, über die Fallbreite verteilte Schaumzone mit auslaufendem Schweif und schwachen auseinanderlaufenden Druckwellen über. Kleinere Tropfen und weniger dichter Kaskadennebel bei unveränderten Emissionsraten und Schwerkraft. Zentralen Wandblock etwas zurückgesetzt und ruhiger geschichtet. Die früher entfernten beiden Seitenfälle bleiben entfernt; keine neuen Wasserflächen oder Bilddateien.

**Spielstand/Leistung:** Keine neue Würfelung, Migration oder Änderung an Trophäenwerten, Seltenheiten, Sammlung, Ehrenplatzreihenfolge und Jagdregeln. Alte Datensätze ohne Gene bleiben darstellbar. Kein zusätzlicher Wasser-Zeichenknoten, weiterhin 8.448 Wasserdreiecke; die Felsänderung ergänzt 60 Dreiecke. Die Zaunreparatur v309 ist ebenfalls erhalten.

**Geprüft:** `node trophy-layout-v310.test.js`: 36 tatsächliche Präparate, Altbestände, zehn Geweih-Sonderformen sowie acht Belegungen mit gemessenen Modellgrenzen; kein Überlappen/Durchragen, gespeicherte Daten und Werte gleich. `water-seams-v297.test.js` um Prüfungen gegen seitliche Überdeckung an Kaskaden und Hauptfall-Lippe ergänzt: 72 gemeinsame Kaskadenpunkte, neun Hauptfall-Anschlüsse, 576 Bachbettproben, flacher See-Aufprall und Modellbudget bestanden. `waterflow-v296.test.js`: Strömungsphasen bis 7.200 s weiterhin talwärts, echter Seekontakt, Spritzer an allen vier Kaskaden bei 30/60/120 Zeitschritten pro Sekunde, Nachtfarben und Distanzabschaltung. Bestehende 21 Jagdtests, zehn v307-Prüfgruppen einschließlich 884 Sturzbildern, 72 v283-Modellvarianten und Schenkelprüfung v290 bestanden. Alle acht originalen GLSL-Shader über Mesa/EGL kompiliert. Originalmodelle, Szenenmontage und Shader in sieben Wasser-Nahansichten und zehn Trophäen-/Tafelansichten jeweils vorher/nachher gerendert und angesehen; zusätzlich zwei Nachtansichten und sechs Zeitpunkte des Hauptfalls. Syntax, Diff und Cache-Verweise geprüft.

**Cache:** Service Worker v310. Nur die neu geänderten Produktdateien `hunt.js`, `gl3d.js`, `woodmodels.js` und `worldview.js` auf v310 gesetzt; `erbedata.js` behält den Stand v309. HTML und Service Worker konsistent.

**Grenzen:** Keine Live-Browser-/iPhone-/Safari-Prüfung und keine Mobilgerät-Leistungsmessung. Gerenderte Ansichten mit Originalgeometrie/Shadern und simuliertem Tages-/Nachtlicht, ohne die komplette Spieloberfläche und ohne Schattenkarte; kein Ersatz für den finalen Handytest. Kein Push erfolgt.

## v309 – Hofzaun ab der ersten Erweiterung instand gesetzt
**Basis:** Aktuelles GitHub main `0e6ee68` (v308). Dieser Upload ist während der Arbeit eingetroffen und enthält alle bisherigen Lieferungen v302–v308 vollständig; sein Dateibaum wurde mit dem bisherigen lokalen Stand verglichen und ist identisch. Die neue ZIP enthält deshalb nur die sechs Dateien dieser Korrektur.

**Ursache:** `farmHl()` kann bei „Weideland dazu“ bereits 2 sein, während die grobe Gestaltungsstufe `S.farm.stage` bis Ausbau 4 auf 1 bleibt. `worldSyncHof` vergrößerte dadurch zwar die Umzäunung, verwendete aber weiterhin den absichtlich morschen Zaun mit fehlenden/schiefen Querlatten. Auch das Tor und sein Schild blieben schräg. Der Hinweis „Zaun repariert“ stand erst bei Ausbau 4.

**Lösung (`worldview.js`, `erbedata.js`):** Eigene abgeleitete Zaun-Gestaltungsstufe innerhalb von `worldSyncHof`: ab `farmHl() >= 2` mindestens der vorhandene intakte Holzzaun. Für Tor und Firmenschild dieselbe Ausrichtung. Haus-/Boden-/Wegegestaltung sowie die späteren weißen Zäune und die Steinmauer bleiben an ihren bisherigen großen Ausbaustufen. Die Toröffnungen und Hofgrenzen bleiben unverändert. „Zaun und Tor instand gesetzt“ steht nun bei „Weideland dazu“; die spätere doppelte Reparaturzusage und der widersprüchliche Nur-Land-Text entfallen.

**Bestehende Höfe:** Beim Laden eines bereits erweiterten Hofs wird der Zustand aus der vorhandenen Ausbauhöhe abgeleitet; kein neuer Kauf, keine Reparaturkosten und kein neues Spielstandfeld. Auch alte Spielstände, die nur `stage` kennen, funktionieren weiter. Hofgröße, Ausbaupreise, Materialbedarf und Belohnungen unverändert.

**Geprüft:** Screenshotzustand (Ausbau 2, Gestaltungsstufe 1) mit dem vorherigen GitHub-Code reproduziert. Originale `farmStageUp`- und `worldSyncHof`-Funktionen mit echten Ausbau-/Zaunmodellen ausgeführt: Kauf 1→2 kostet weiterhin 300 €, `stage` bleibt 1, Darstellung wechselt trotzdem zu sechs intakten Zaunabschnitten. Erneutes Synchronisieren ohne Änderung baut keine zusätzlichen Modelle; JSON-Laden eines bereits erweiterten Hofs erhält die Reparatur ohne Kosten. Alle zehn Ausbauhöhen und vier alte Gestaltungsstände geprüft. Riegelgeometrie nach dem ersten Ausbau ohne Lücken; Süd-/West-Toröffnungen weiterhin 4/2,2 Einheiten, größere Hofgrenzen korrekt, Endstufe weiter Steinmauer. Hofecke vorher/nachher mit Originalgeometrie und Originalshadern über Mesa/EGL gerendert und angesehen. Syntax, Diff und Cache-Verweise geprüft.

**Cache:** Service Worker v309; nur die geänderten Produktdateien `worldview.js` und `erbedata.js` auf v309 gesetzt, in HTML und Service Worker konsistent. Keine weiteren Modelle oder Bilddateien nötig.

**Grenzen:** Kein Live-Browser-/iPhone-/Safari-Test; Zustands-/Geometrieprüfung und gerenderte Modellansichten. Kein Push erfolgt.

## v308 – Individuelle, seriösere Kunden-Monogramme in Auftragskarten
**Basis:** GitHub main `8232bbe` (v301), vor und während der Arbeit erneut abgeglichen. Die noch nicht auf main vorhandenen Lieferungen v302–v307 sind vollständig integriert.

**Ursache:** Alle Kunden hatten denselben stark umrandeten Initialenkreis, nur mit einer von acht kräftigen Farben. Das wirkte wie ein generischer Platzhalter. Die Initialenermittlung berücksichtigte außerdem nur eingeschränkt internationale Anfangsbuchstaben und erkannte getrennt geschriebenes „e. V.“ nicht zuverlässig.

**Lösung (`game.js`, `style.css`):** Gemeinsames `orderMonoHTML` für sämtliche Hof-/Speditions-Auftragskarten. Zehn gedeckte Geschäftspaletten mit vier Varianten (dunkel/hell, einfacher/doppelter feiner Rahmen, klare Systemschrift bzw. klassische Serifenschrift). Gestaltung fest aus dem vollständigen, normalisierten Firmennamen, ohne Zufall oder Auftragskennung: derselbe Kunde behält sein Zeichen bei erneutem Auftrag/Rendern/Neuladen. NFC-Normalisierung und vereinheitlichte Leerzeichen, Unicode-Initialen; Rechtsform-/Füllwörter zählen nicht als Initialen. Inline-SVG ohne Bilddateien, externe Schriftzugriffe oder SVG-IDs; Initialen als Text korrekt escaped. Dekorativ ausgeblendet für Screenreader, da daneben bereits der Firmenname steht. Windows-Kontrastmodus berücksichtigt.

**Handy:** Unverändert 32 × 32 CSS-Pixel, gleicher Platz im Absenderbereich. Die bisherige dicke Kontur und der versetzte Schatten entfallen zugunsten feiner Linien. Keine Änderung am Kartenablauf, an Aufträgen, Kundenbeziehungen oder Spielstand.

**Geprüft:** Alle 103 unterschiedlichen Kundennamen aus `CUSTOMERS`, `FTOWNS_HOF` und den Holz-/Fisch-Ergänzungen erzeugen unterschiedliche Zeichen; wiederholter Aufruf und normalisierte Leerzeichen/NFC liefern dieselbe Gestaltung. Gleiche Initialen können durch Farbe/Rahmen unterscheidbar bleiben. Initialenfälle einschließlich Fischerhütte Caputh, Hofladen Glindow, Schlosscafé Petzow, Umlauten, Akzentzeichen, einbuchstabigem Namen, leerem Namen und „e. V.“ geprüft; SVG-Escaping und keine externen Bilder/IDs geprüft. Kleinstes Textkontrastverhältnis der zehn Paletten 6,66:1. Zwölf Beispiele der tatsächlich ausgegebenen SVGs in zweifacher Handygröße gerendert und visuell kontrolliert. Syntax, Diff und unveränderte 32-Pixel-Fläche geprüft. Kein zusätzlicher Testdatei-/Paketbedarf für diese Gestaltungsänderung.

**Cache:** Service Worker v308; nur `game.js` und `style.css` auf v308 gesetzt, in HTML und Service Worker konsistent. Alle anderen Dateiverweise behalten ihren Stand.

**Grenzen:** Keine Live-Browser-/iPhone-/Safari-Prüfung; SVG-Ansichten und Quelltext-/Funktionsprüfung. Betriebssysteme können die jeweilige System-/Serifenschrift geringfügig anders darstellen.

## v307 – Keiler-Anatomie, versetztes Zusammenbrechen und korrekte Fasan-Treffer
**Basis:** GitHub main `8232bbe` (v301), während der Arbeit wiederholt abgeglichen. Die noch nicht auf main vorhandenen Lieferungen v302–v306 sind vollständig integriert.

**Ursache:** Die Keilerläufe drehten unterhalb des Rumpfs; ihre sichtbaren Muskelbäuche wirkten dadurch wie angesetzte Kugeln. Zufällige Querschnittsverformung und starke Farbunruhe machten die Schwarte wellig. Beim Zusammenbrechen wurden Rumpf und alle Gelenke fast gleichzeitig zwischen zwei Posen interpoliert. Außerdem setzte `stepAnimal` den Höhenmaßstab auf 1 zurück, obwohl Bodenauflage und Trefferzonen mit der individuellen Größe rechneten. Die Vogel-Körperzone hieß pauschal „Treffer im Flug“, auch bei einem laufenden Fasan; der Flugauftrag prüfte bisher nur die Art.

**Lösung (`hunt.js`):**
- Keiler mit gleichmäßigeren Körperquerschnitten, kräftigem Widerrist und schlankerer Hinterhand, ruhigerer Schwarte sowie stumpfer ovaler Rüsselscheibe mit sichtbaren Nasenlöchern. Schulter-/Hüftdrehpunkte jetzt innerhalb des Rumpfs; längliche obere Muskeln verjüngen sich zu den unteren Laufsegmenten. Keiler-Trefferzonen der Läufe folgen denselben beiden Gelenksegmenten einschließlich Sprunggelenkversatz. Organ-/Rumpfzonen, Preise und Medaillenregeln bleiben erhalten.
- Acht natürliche Schwarte-Familien statt sechs: neu Kastanienbraun und Aschgrau; Rötlich, Schwarz und Graubraun deutlicher unterscheidbar, weiterhin acht feste Nuancen je Familie. Weiß (0,5 %) und Schecke (2,5 %) bleiben gleich selten. Gespeicherte Merkmale/Farbschlüssel werden weiter gelesen; kein Neuwürfeln gesicherter Trophäen.
- Zusammenbrechen bei Keiler und Hirsch aus der gerade sichtbaren Lauf-/Kopf-/Rumpfhaltung: Vorderläufe zuerst, Hinterläufe etwas später; Gewichtsabsenkung, Schulterrolle, verzögertes Ablegen des Haupts und ruhiges Auslaufen. Dauer je Art/Stück etwa 1,1–1,4 s. Bewegungsweg wird früh abgebremst. Während der Bewegung begrenzen Modellpunkte von Rumpf, Läufen und Kopf/Geweih die Bodenauflage; Geometrie einmal beziehen, keine Modell-/GPU-Neuerzeugung je Bild. Berechnete Endpose und bestehende Gelenk-/Kollisionsprüfung bleiben maßgeblich. Individueller Höhenmaßstab bleibt in Bewegung und Seitenlage erhalten.
- Fasananteil normaler Begegnungen von 25 auf 32 % (Hirsch 40 %, Keiler 28 %). Flugtimer, Bestandsregeneration, Güte/Gefieder und Grenzen von zwei Bodentieren/einem Flugvogel/drei Tieren insgesamt unverändert.
- Boden-/Flugzustand beim Abdrücken erfassen und über die Geschossflugzeit erhalten. Bergungsüberschrift, Schussbewertung und Trophäenwand lesen dieselbe Beschriftung. Optionale `air`-Angabe in Sammlung und Jagdprotokoll; alte Einträge mit `mv` bleiben lesbar, ohne bekannte Zustandsdaten neutrale Trefferbezeichnung. Ein gerade startender Vogel ohne Bodenabstand zählt noch als Bodentreffer. Der Flugauftrag verlangt einen bestätigten Flugtreffer. Folgeeinschläge auf bereits zusammenbrechende/erlegte Tiere werden verworfen.
- Cache v307, nur die geänderte Produktdatei `hunt.js` hochgezählt.

**Geprüft:** `node hunt-v307.test.js`: zehn Prüfgruppen, darunter 16 echte `stepAnimal`-Sturzabläufe und 884 vermessene Animationsbilder (beide Arten/Seiten, kleine/große Tiere, Stand/Galopp, 30/60 Zeitschritte pro Sekunde), Haut/Hufe/Kopf/Geweih über Boden, kein anschließender Posensprung; tatsächliche Lauf-Treffersegmente; stabile acht Fellfamilien und alte Merkmale; echter verzögerter `fire`-Ablauf mit Start bzw. Landung zwischen Abdrücken und Einschlag; korrekte Beschriftung nach Datenspeicherung und stabile Fasan-Endpose nach Boden-/Flugtreffer; Flugauftrag und Begegnungsanteile. `hunt.test.js` mit 21 bestehenden Prüfungen einschließlich 144 Endposen bestanden, Arten-Erwartung angepasst. `hunt-v283.test.js` (72 deterministische Modelle/Nuancen) und `hunt-thighs-v290.test.js` bestanden. 18 Ansichten mit Originalmodellen, echten Animationsknoten und originalen GLSL-Shadern über Mesa/EGL gerendert und angesehen: vorher/nachher stehend/liegend, acht Fellfamilien, sechs Sturzphasen. Keiler weiter unter dem bestehenden Budget von 9.000 Dreiecken. Syntax, Diff und Cache-Verweise geprüft.

**Grenzen:** Keine Live-Browser-, iPhone-/Safari- oder Mobilgerät-Leistungsmessung. Die Modellansichten ersetzen keinen Test der kompletten Jagdszene auf dem Handy. Keine neuen Bild-/Texturdateien nötig.

## v306 – Vergleichbare Firmenwerte aus tatsächlichem Übernahmebestand
**Basis:** GitHub main `8232bbe` (v301), während der Arbeit wiederholt abgeglichen. Die bisher noch nicht auf main vorhandenen Lieferungen v302–v305 sind vollständig integriert.

**Ursache:** Konzernwellen erhielten bei ihrem Auftauchen bereits einen nach damaligem Fortschritt/Welle erhöhten Basiswert. `corpValue` multiplizierte diesen zusätzlich mit dem Etappenfaktor des Firmensitzes (z. B. Mannheim ×6, Callao/Casablanca ×90). Ähnlich große Konzerne wurden deshalb trotz 10–12 % Marktanteil um über das Hundertfache unterschiedlich bewertet. Die später übernommene Flotte wurde außerdem erst beim Kauf neu gewürfelt und war nicht die Grundlage der Bewertung.

**Lösung (`corp.js`):**
- Gemeinsamer Maßstab für alle Konkurrenten: Zeitwert der tatsächlich angebotenen Flotte plus Immobilien-Zeitwert des Firmensitzes, dazu Kunden-/Organisationswert von `Vermögenswert × (15 % + 1,8 × Marktanteil)`. Marktanteil stetig und moderat, keine pauschale Multiplikation des gesamten Unternehmens mit Standort- oder Wellenfaktoren. Die alten `base`-Felder im Spielstand bleiben kompatible Metadaten, treiben aber den Kaufpreis nicht mehr.
- Standort beeinflusst nur noch den Büro-/Immobilienanteil anhand der vorhandenen `buyPrice`-Logik. Fahrzeug-Zeitwerte verwenden dieselbe Funktion `vehValue` wie die Spielerflotte, einschließlich Verschleiß. Die Bewertung der eigenen Spedition bleibt unverändert.
- Pro Konkurrent/Etappe ein gespeichertes Flottenangebot mit Typ, Zustand und Laufleistung. Deterministischer Aufbau ohne Neuwürfeln beim Öffnen oder Neuladen; repräsentative Mischung über den bisherigen erlaubten Preispool. Konzerne verwenden weiterhin die bessere Hälfte der verfügbaren Fahrzeuge. Dadurch entstehen vergleichbare Mischflotten statt zufälliger reiner Billig- oder Luxusflotten. Fahrzeuganzahl, verfügbare Verkehrsträger und bisherige Zustandsbereiche bleiben erhalten.
- Das bisher schon etappenabhängige Übernahme-Sortiment wird bei einer neuen Etappe neu zusammengestellt; ein höherer Wert geht damit mit tatsächlich anderen/besseren angebotenen Fahrzeugen einher. Im laufenden Gespräch ist die zugesagte Flotte als Kopie fixiert und wird beim Abschluss exakt übergeben, auch wenn inzwischen eine neue Etappe geöffnet wurde.
- Verhandlungsfenster zeigt Zeitwertanteile und Fahrzeugzahlen je Verkehrsträger. Bestehende aktive Gespräche beim Wiederöffnen proportional auf die neue Bewertung umgerechnet; Gegenangebot, Angebot und Reserve im gleichen Verhältnis, Runde/Verhandlungsfortschritt und bestehende Sperrzeiten bleiben erhalten. Eine Chatzeile erklärt die aktualisierte Bewertung. Historische Kaufpreise und bereits übernommene Fahrzeuge/Büros bleiben unangetastet.
- Falls am Firmensitz schon ein eigenes Büro steht, wird nur der Immobilien-Zeitwert ausgezahlt. Der bisherige Rückfluss von 18 % des gesamten Konzernpreises konnte bei Schiffen/Flugzeugen den Immobilienwert massiv überschreiten.
- Nur `corp.js` als Produktdatei geändert, Cache v306. Keine Änderungen an Marktanteilsermittlung, Wellenhäufigkeit, eigenen Firmenverkaufsangeboten oder Kapital des Spielers durch die Neubewertung allein.

**Vorher/nachher im nachgebildeten Screenshot:** Die originalen Werte 5,70 / 636,35 / 548,41 Mio. € wurden mit dem vorherigen Code reproduziert. Mit derselben Marktanteils-/Standort-/Flottengrößenkonstellation ergeben sich nun etwa 91,263 / 105,081 / 105,100 Mio. €. Der gemeinsame Wertmaßstab berücksichtigt die tatsächlich übernommenen See-/Luftfrachtflotten. Kleine Abweichungen zwischen den beiden 17-Fahrzeug-Firmen ergeben sich aus Typen und Zustand.

**Geprüft:** `node company-values-v306.test.js`: zwölf Szenarien mit echten Fahrzeug-, Verschleiß- und Büropreisen sowie originaler Bewertungs-/Verhandlungs-/Übergabelogik. Screenshotkonstellation, Standort-/Wellenbasis ohne Gesamt-Multiplikator, gleiche Ausstattung/Anteile = gleicher Wert, stetiger Marktanteilseinfluss, alle sechs Etappen, 80 vergleichbare Flottenmischungen, gespeicherte/deterministisch wiederhergestellte Angebote, alte Verhandlungen/Sperren/Historie, exakte Übergabe und einmalige Zahlung, Etappenwechsel während des Gesprächs, Verkauf eines doppelten Sitzes ohne Mehrfacherstattung. Neuer Test ohne Git-/Netzwerkabhängigkeit nach dem Einspielen weiter ausführbar.

**Regressionen:** `office-limits.test.js`, `review-v282.test.js` und alle 13 Schatzprüfungen v305 bestanden. Syntax, Diff und Cache-Verweise geprüft.

**Prüfgrenze:** Kein Live-Browser-/iPhone-/Safari-Test und keine Messung der neuen Textzeilen im Angebotsfenster. DOM, Kandidatennamen, Auftragsgenerator und Effekte im Test ersetzt. Keine Langzeitsimulation der gesamten Firmenwirtschaft.

## v305 – Schatzbelohnungen nach Kapital, Fortschritt und Bedarf
**Basis:** GitHub main `8232bbe` (v301), während der Arbeit wiederholt abgeglichen. Die noch nicht auf main vorhandenen Lieferungen v302 (Händler), v303 (Feldmenü) und v304 (sichtbarer Gießzustand) sind vollständig enthalten.

**Ursache / Auftrag:** Die Schatzkiste vergab nur Geld nach der Formel `80 + Erbe-Level × 15`, mit kleiner Zufalls-/Grababweichung, sowie feste EP und ein bis zwei Kleeblätter. Bei Millionen auf dem Konto blieb sie damit wirtschaftlich bedeutungslos; passende Waren gab es nicht.

**Lösung (`erbe.js`):**
- Alle drei Grabqualitäten skalieren mit dem positiven Kontostand unmittelbar vor der Vergabe: Grundwert 0,5 % / 1,2 % / 2 %, mit ±10 % Zufallsabweichung. Eine Untergrenze nach Erbe-Level und Etappe hält Funde auch nach größeren Investitionen sinnvoll. Kein pauschaler Euro-Höchstbetrag, der später erneut bedeutungslos wird. Beispiel: 50 Mio. € Kapital und zwei Sterne ergeben 540.000–660.000 € vor einem eventuellen Lagerersatz.
- EP wachsen mit dem Abstand zum nächsten Erbe-Level (mindestens die bisherigen EP), Kleeblätter mit Erbe-Level/Etappe bis maximal zwölf je Fund. Drei Sterne bleiben wertvoller als zwei und einer.
- Je nach Grabqualität bis zu ein/zwei/drei verschiedene Warenpakete, Qualität drei/vier/fünf Sterne. Nur herstellbare/kaufbare, freigegebene Waren aus erreichbaren Bereichen und vorhandenen Lagern. Kein Strom/Energie, keine rohen Fische, Wildkörper oder erarbeiteten Trophäen als Zufalls-Lagerfüller.
- Fehlende Ware aktiver, noch nicht ausgelieferter Aufträge zuerst; danach schwach gefüllte passende Bestände. Umfang begrenzt durch Bedarf, Warenwert, Level/Etappe und 15 % der jeweiligen Lagerkapazität pro Paket. Bereits ausreichend gefüllte Waren ohne Bedarf entfallen. Verschiedene Pakete reservieren gemeinsam genutzten Lagerplatz schon während der Planung; kein Überfüllen.
- Fehlende Warenplätze (volle Lager/kein sinnvolles Sortiment) werden anteilig durch bis zu 10 % zusätzlichen Geldwert ersetzt. Es wird nur tatsächlich passender Inhalt gutgeschrieben.
- Einmalige Vergabe weiterhin vor der Öffnungsanimation; Ergebnis zusätzlich an `c.reward` gespeichert. Zweiter Abschluss oder Neuladen zahlt nicht erneut aus. Bestehende verbuchte Schätze werden nicht rückwirkend verändert. Schatzhäufigkeit, Grab-Minispiel und Sternegrenzen bleiben gleich.

**Anzeige (`worldview.js`):** Geld, EP, Kleeblätter und tatsächlich erhaltene Waren erscheinen gemeinsam und fliegen ins Lager. Mit Waren bleibt die vorhandene Anzeige 4,8 Sekunden sichtbar. Keine zweite Gutschrift in Animationen. Alte Ergebnisse ohne Warenliste bleiben darstellbar; kein neues Fenster oder Kameraverhalten.

**Geprüft:** `node treasure-loot-v305.test.js`: 13 Szenarien für Einsteiger/Millionen/Milliarden, Fortschritts-Untergrenze, Sternequalität, Auftragsdefizite, Freigaben/Gebiete/Lagertypen, volle/nahezu volle gemeinsame Lager, Geldersatz, bereits vorhandene Bestände, abgelaufene/ausgelieferte/angenommene Aufträge, ungültige Ergebnisse, doppelte Minispielabschlüsse, Speicherung/Neuladen und Anzeige/Effektinhalt ohne weitere Gutschrift. Zusätzlich echte Waren-/Rezepttabellen mit rekursivem `farmCanMake`: Einsteiger-Getreide sowie nach Ausbau tatsächlich verfügbare Backwaren. Kontostand, Einnahmenbuchung und Warenqualität geprüft.

**Regressionen:** Zehn Feldmenü-Szenarien v303, 66 Modellvarianten/Zustandsabgleiche v304 und alle 13 Händler-Szenarien v302 bestanden. JavaScript-Syntax, Diff und Cache-Verweise geprüft. Cache v305 ausschließlich für `erbe.js` und `worldview.js`.

**Prüfgrenze:** Kein Live-Browser-/iPhone-/Safari-Test. Der Haupttest verwendet Freigabe-/Effekt-Fixtures; die zusätzliche Produktionsprüfung verwendet echte Waren-/Rezepttabellen und die originale rekursive Freigabelogik. Keine vollständige Balance-Langzeitsimulation der Gesamtwirtschaft.

## v304 – Gegossene und trockene Beete/Obstbäume sichtbar unterscheiden
**Basis:** GitHub main `8232bbe` (v301), während der Arbeit wiederholt abgeglichen. Die noch nicht auf main vorhandenen Lieferungen v302 (Händlerkontakte) und v303 (dynamisches Feldmenü) sind vollständig integriert; diese ZIP kann direkt auf main angewendet werden.

**Ursache / Auftrag:** `o.w` beeinflusste bisher Wachstumszeit und Qualität, wurde aber bei Feldboden, Pflanzenfarben und Obstbaumdarstellung nicht berücksichtigt. Gegossene und ungewässerte Pflanzen sahen deshalb gleich aus.

**Lösung:**
- `farmmodels.js`: Beete mit heller, matter Erde und wenigen feinen Rissen in den Furchen, wenn bepflanzt und nicht gegossen. Nach dem Gießen dunklere, feuchte Erde. Leere Beete und alte Modellaufrufe ohne Gießparameter behalten ihre bisherige Darstellung.
- Ungegossenes grünes Pflanzengewebe erhält einen dezenten olivfarbenen Ton; gegossenes Grün verwendet die gesunden Originalfarben. Geometrie und Wachstumsstufen bleiben gleich. Reife rote/orange Früchte, goldene Weizenähren, Baumstämme und Pflanzstützen werden nicht umgefärbt.
- Obstbäume mit passender Laubfarbe und einer flachen, leicht unregelmäßigen Baumscheibe: hell mit kleinen Rissen bzw. dunkel nach dem Gießen. Kein dauerhaft schwebendes Symbol, keine neue HUD-Fläche oder Partikeldauerschleife. Die Baumscheiben bleiben innerhalb des vorhandenen Baumplatzes.
- `farmview.js`: Gießzustand in den Mesh-Schlüsseln berücksichtigen; Boden, Pflanzen und Baum passen sich beim bestehenden Zustandsabgleich an. Vorhandene Szenenknoten und Fruchtknoten bleiben erhalten. Getrennte Netze werden pro Sorte/Stufe/Gießzustand gemeinsam verwendet; kein neuer GPU-Upload pro Frame. Ernte/Neuaussaat setzt das Aussehen passend zum vorhandenen `o.w` zurück. Muschelleinen und übrige Objekte unverändert.
- Keine Änderung an Gießregeln, Regen, Wachstumszeiten, Qualität, Kosten oder Erträgen. Keine neue Spielstandstruktur. Cache v304 nur für `farmmodels.js` und `farmview.js`.

**Geprüft:** `node watering-look-v304.test.js`: 66 trockene/nasse Originalnetze für sieben Feldfrüchte in allen vier Wachstumsstufen, drei Obstbäume und beide Bodenarten; endliche Koordinaten, unveränderte Pflanzengeometrie/Früchte und gesunde Originalmodelle, deutlich unterschiedlicher Bodenhelligkeitswert, Kachelgrenzen und kleines Dreiecksbudget. Zustandsabgleich mit Originalfunktionen für Gießen, Ernte, Neuaussaat, Baumernte und Neuladen; identische Darstellung lädt keine neuen Netze hoch. Auch der Baum-Fallback ohne Blattbüschel funktioniert.

**Grafikprüfung:** 22 Ansichten für alle sieben Kulturen in Stufe 2, reifen Weizen und alle drei Obstbaumarten, jeweils trocken/gegossen. Tatsächliche Modellnetze und Originalshader mit Mesa/EGL gerendert und die Vergleichsansichten geprüft. Alle acht Original-GLSL-Shader kompiliert. Die Ansichten verwenden eine feste Tagesbeleuchtung und keine vollständige Hofszene/Schattenkarte.

**Regressionen:** Alle zehn Feldmenü-Szenarien v303 und alle 13 Händler-Szenarien v302 bestanden. Syntax, Diff und Cache-Verweise geprüft.

**Prüfgrenze:** Kein Live-Browser-/iPhone-/Safari-Test. Die Zustandsprüfung verwendet einen kleinen Grafik-/Upload-Ersatz; die separate Grafikprüfung rendert echte Netze/Shader ohne die vollständige Spieloberfläche. Keine Aussage über gemessene Handy-Bildrate.

## v303 – Offenes Feldmenü folgt Farmer-Aktionen
**Basis:** GitHub main `8232bbe` (v301), während der Arbeit erneut abgeglichen, einschließlich der noch nicht auf main vorhandenen Händlerlieferung v302. Die ZIP enthält diese vorherige Änderung vollständig; v302 muss nicht gesondert eingespielt werden.

**Ursache:** Das Saatmenü speicherte seine Art beim Antippen. Der Farmer änderte anschließend das Feld, aber das geöffnete Menü wurde nicht an den neuen Zustand angepasst. Die bestehende Kernfunktion `farmPlant` verhinderte zwar bereits eine doppelte Aussaat, das Menü bot sie optisch weiterhin an.

**Lösung (`farmview.js`):**
- Feldmenü beim bestehenden Nachführen seiner Position mit dem aktuellen Feld abgleichen: leer → Saat, bepflanzt → Gießen, gewässert → gegossen, reif → Sichel. Auch Ernte/Neuaussaat des Farmers und ein anderer angebauter Pflanzentyp werden berücksichtigt. Feld und Auswahl bleiben erhalten; kein erneutes Antippen nötig.
- Neuaufbau nur bei verändertem Zustand/Pflanzentyp/Bewässerung/Fruchtwechsel. Restzeit und Position werden weiterhin ohne Ersetzen der Bedienelemente nachgeführt. Nach einem automatischen Wechsel greift der vorhandene kurze Klickschutz.
- Bereits gestartete Werkzeuggesten werden nicht unter dem Finger umgebaut. Übernimmt der Farmer während einer erfolglosen Saatgeste, erscheint beim Loslassen das neue Feldmenü, statt die Auswahl zu verwerfen. Saat kann weiterhin über andere leere Felder gezogen werden.
- Ereignisse von inzwischen veralteten Saat-, Wasser- oder Sichelknöpfen starten keine unpassende Aktion. Die vorhandenen Feld-/Geld-/Erntefunktionen bleiben unverändert; keine neue Spielstandstruktur und keine Änderung der Kosten, Wachstumszeiten oder Farmerfreigaben.
- Cache v303 ausschließlich für `farmview.js`, übrige Verweise der Händlerlieferung v302 erhalten.

**Geprüft:** Fehler am bisherigen GitHub-Code mit `node field-menu-v303.test.js --before` reproduziert: nach Farmer-Aussaat bleibt die Menüart `seed` statt `grow`. Mit der Korrektur bestehen zehn Szenarien mit Originalfunktionen aus `farm.js`, `team.js` und `farmview.js`: automatischer Wechsel, Auswahl bleibt erhalten, kein ständiger DOM-Neuaufbau, Farmer-Bewässerung/Restzeit/Qualität, Reife und Farmer-Ernte/Neuaussaat, direkter Neuaufbau, alter Saatknopf ohne zweite Abbuchung, Übernahme während einer laufenden Geste, weiterhin mehrere Felder per Saatziehen und Gießen über die tatsächlich gebundenen Pointerfunktionen. Andere Menüs bleiben unverändert; entfernte Felder schließen ihr eigenes Menü.

**Regressionen:** Alle 13 Szenarien aus `dealer-contacts-v302.test.js` sowie `clearing-v291.test.js` bestanden. JavaScript-Syntax, Diff und Cache-Verweise geprüft.

**Prüfgrenze:** Kein Live-Browser-/iPhone-/Safari-Test. DOM, Grafik-/Effektausgabe und vorbereitende Farmer-Auswahl sind im Test ersetzt; ausgeführt werden die originalen Feldaktionen, der Farmer-Abschluss und die Menü-/Werkzeugeingabelogik.

## v302 – Dauerhafte Händlerkontakte, Nachschub auf Anfrage und Crack
**Basis:** GitHub main `8232bbe` (v301), wiederholt während der Arbeit abgeglichen. Die bisherigen Mitarbeiter-, Pflanzen-, Treppen- und Wasserfallkorrekturen sind vollständig enthalten. Keine Änderungen an diesen Bereichen.

**Ursache / Auftrag:** Mr. Snus und Don Pablo starteten nach jeder Absage oder abgelaufenen Offerte weitere Werbechats. Die Chats verschwinden nach 24 Spielstunden; eine bleibende Kontaktliste fehlte. Don Pablo führte ausschließlich einen ungeteilten Kokainbestand und meldete sich erst ab Europa/Luftfracht.

**Lösung:**
- Diensthandy mit vier kompakten Reitern: Chats, Kontakte, Zeitung und Rechner. Nach der ersten Händlernachricht bleibt der Kontakt dauerhaft gespeichert. Keine weiteren automatischen Werbechats, auch nicht nach Ablauf, Absage oder Neuladen. Eigene Bestandsanfragen erzeugen weder Klingeln noch ungelesene Nachrichten. Bereits offene Angebote lassen sich aus der Kontaktkarte wieder aufrufen.
- Nachschub wird über „Bestand anfragen“ bestellt, sobald Lager und laufende Kundenlieferungen leer sind. Der Hinweis nennt vorhandenen Bestand bzw. noch laufende Lieferung. Damit kann eine stornierte Lieferung weiter an ihren bisherigen Lagerort zurückgebucht werden.
- Mr. Snus bietet drei bis fünf wechselnde Sorten mit unterschiedlichen Mengen an. Don Pablo bietet Kokain und neu Crack mit getrennten Auswahl-/Lagerbeständen an; später können einzelne Waren vorübergehend fehlen. Insgesamt bleibt sein Angebot bei den bisherigen 8–40 Tonnen. Beide Waren verwenden die bestehenden fiktiven Spielpreise, Kundentypen und Folgen.
- Ein Sortiment wird pro Einkaufsrunde gespeichert. Absage, abgelaufenes Angebot oder erneutes Öffnen würfeln es nicht neu; nach dem Einkauf unterscheidet sich die nächste Lieferung. Doppelte und abgelaufene Kaufbestätigungen werden abgewiesen. Alte parallele Werbeangebote schließen sich nach einem Einkauf.
- Don Pablos Erstkontakt bereits ab **Etappe 3 „Deutschland“**, auf nachträglichen Wunsch. In dieser Etappe wird in einer per Straße erreichbaren Lagerhalle abgeholt; ab Europa kommen wie bisher Flughafen-Hangars hinzu. Anzeigen, Chat und Lina erklären den jeweiligen Ablauf.
- Don-Pablo-Kunden bestellen jeweils eine konkrete Ware. Reservierung, Entnahme, Stornorückgabe und Lageranzeige unterscheiden Kokain und Crack. Kleine Restmengen unter 300 kg sind vollständig verkaufbar. Gesamtbestand `kg` und bisherige Buchhaltung bleiben kompatibel; alte Bestände und untypisierte Aufträge gelten als Kokain. Bereits offene alte Angebote mit numerischer Auswahl bleiben nutzbar. Kontaktübernahme aus vorhandenen Chats erfolgt vor deren Löschung; frühere Einkäufe und gesehene Händlererklärungen werden ebenfalls übernommen.
- Cache v302 nur für die fünf geänderten Produktdateien; keine Änderung an Welt-, Fahrzeug- oder 3D-Daten.

**Geprüft:** `node dealer-contacts-v302.test.js`: 13 Szenarien mit echten Telefon-/Händlerfunktionen; Freischaltungen, genau eine Begrüßung über 90 Spieltage und Speicherzyklen, Altdatenmigration, echte Reiter-/Kontakt-/Mengenklickbindungen am DOM-Ersatz, stille Anfragen, keine Angebotsduplikate, stabiles Sortiment nach Absage/Ablauf/Neuladen, neue Sortimente auch bei identischer Zufallsfolge, Guthaben-/Ablauf-/Doppelbuchungsschutz, gemischter Einkauf, getrennte Reservierungen/Entnahmen/Rückgaben, Restmengen beider Waren und alte Angebote. Zusätzlich Don-Pablo-Einkauf und Crack-Kundenauftrag mit echten Weltdaten und echtem Routing aus `game.js` in Deutschland ohne Luftfracht; die Fahrzeugzuteilungsansicht ist dabei eine Fixture.

**Regressionen:** `office-limits.test.js` und `office-stairs-v301.test.js` bestanden; alle sechs Etappen/Bürogrenzen und 24 Auf-/Abgänge weiterhin korrekt. Syntax aller geänderten JavaScript-Dateien, Diff, CSS-Blockstruktur und Cache-Verweise geprüft.

**Prüfgrenze:** Kein Live-Browser-/iPhone-/Safari-Test und keine Browsermessung des neuen Telefonlayouts. Telefonbedienung mit kleinem DOM-Ersatz, Standard-Transportzuteilung als Fixture; tatsächliche Weltdaten/Routing gesondert geprüft. Keine echten Wallet-Transaktionen oder Live-Kursabfragen.

## v301 – Firmenschriftzug im Büro entfernt, Treppen nutzbar
**Basis:** GitHub main `3b2b285` (v300), während der Arbeit neu eingetroffen und vollständig übernommen. Dieser GitHub-Stand enthält bereits die vorherigen Mitarbeiter- und Pflanzenkorrekturen; sie bleiben erhalten.

**Ursachen:** Der Firmenname wurde als eigene Textur an der Küchenwand montiert. Die Treppe war nur Geometrie mit einer Sperrfläche, ohne Verbindung zur Interaktions- oder Etagenlogik. Etagen ließen sich ausschließlich über die Knöpfe oben rechts wechseln. Der Handlauf war zu kurz und entgegengesetzt zur Treppensteigung gedreht.

**Lösung:**
- `officefp.js`: Firmenschild-Knoten und `signCanvas` entfernt. Standorttafel und Personalposter bleiben erhalten; die Firmenfarbe für das Poster wird weiterhin gelesen.
- Treppen in Bürogebäuden und Konzernzentralen verwenden dieselben Maße für Modell, Kollisionsbereich, Zugang und Blickziel. Beim Hineingehen in den vorderen Treppenzugang oder beim Antippen/Benutzen des Blickziels öffnet sich die benachbarte Etage. Auf dem mittleren Stockwerk gibt es eine kleine Auswahl für hinauf/hinunter. Erdgeschoss und oberste Etage bieten jeweils nur die gültige Richtung. Auf dem Desktop löst F die Blickziel-Aktion aus; gehaltenes F wiederholt sie nicht, Strg-/Cmd-Kombinationen bleiben frei.
- Gemeinsamer Etagenwechsel mit den vorhandenen Etagenknöpfen. Ankunft vor dem Treppenbereich an einem freien Platz, auch bei Pflanzen oder Möbeln am vorgesehenen Ausgang. Bewegungs-/Blickeingaben werden zurückgesetzt und die Kamera sofort aktualisiert; kein automatisches Zurückwechseln. Während der Treppenauswahl steht die Figur. Abbrechen per Schließen, Escape oder Tipp außerhalb. Der Übergang verwendet weiterhin den vorhandenen Auf-/Abbau der getrennten Etagenräume einschließlich Ressourcenfreigabe und Küchenzuständen.
- Handlauf folgt jetzt der vollständigen Treppenlänge und steigt mit den Stufen.
- `style.css`: kompakte Treppenauswahl im vorhandenen Büro-Kartenstil mit 44 px hohen Schaltflächen. `index.html` / `sw.js`: v301 für die beiden geänderten Produktdateien; übrige Cache-Verweise unverändert. Keine neue Spielstandstruktur oder Geschäftslogik.

**Geprüft:** `node office-stairs-v301.test.js`: 24 vollständige Auf-/Abgänge in beiden Gebäudetypen mit allen vier Küchentypen und Pflanzen im Ankunftsbereich; echte Raum-/Etagen-/Kollisions-/Eingabelogik mit leichtem DOM-/Grafiktreiber-Ersatz. Direkter Laufzugang per WASD/Joystick, kurzer Touch über den Canvas-Eingabepfad, F ohne Wiederholung, freie Strg+F-Kombination, mittlere Etagenwahl, Abbrechen, gültige Etagengrenzen, Reichweite/Sichtschutz, vorhandene Etagenknöpfe, freie Ankunft, kein Rücksprung, sofort passende Kamera, Freigabe alter Netze/Texturen und Kaffeezustand nach Rückkehr. Der Firmenname erscheint nicht mehr in den gezeichneten Texten; ohne besetzte Schreibtische verbleiben nur Standort- und Postertextur. Geometrieprüfung des vollständigen, richtig steigenden Handlaufs. Gespeicherte Firma, Geld, Personal und Dekoration im Vergleich unverändert.

**Regressionen:** `office-joints-v288.test.js`, `office-workers-v284.test.js`, `office-appearance-v298.test.js`, `office-clothes-v300.test.js` und `office-plants-v299.test.js` bestanden. JavaScript-Syntax und Diff geprüft; neue CSS-Regeln auf ausgeglichene Blöcke kontrolliert.

**Prüfgrenze:** Kein Live-Browser-/3D-/iPhone-/Safari-Test und keine Browsermessung des Kartenlayouts. Die Funktionsprüfung erfolgte mit der echten Spiellogik und einem DOM-/Grafiktreiber-Ersatz, die Handlaufprüfung an den tatsächlichen Modellkoordinaten.

## v300 – Arbeiter aus Seiten- und Rückenansichten korrigiert
**Basis:** GitHub main `4b687f9` (v298), während der Arbeit wiederholt abgeglichen. Die bisher noch nicht auf main enthaltene Pflanzenlieferung v299 ist vollständig integriert. Diese ZIP kann direkt auf main angewendet werden, ohne v299 vorher einzuspielen.

**Ursachen:** Der alte Mützenumschlag bestand aus grob abgeschnittenen Kugelkacheln, die mit der neuen Kappe überlappten. Das erzeugte Lücken und flimmernde Muster. Bartflächen reichten hinter die seitliche Kopfmitte und hatten kantige Abschlüsse. Latzhosenträger waren starre Balken über den Schultern; Warnwesten standen als Platten ab. Kapuzen waren flache Kugeln auf dem Rücken. Oberarm-/Ellbogenkugeln überschnitten sich mit den Ärmeln, während der Rumpf zu früh schmal wurde. Kopfhörerbügel bestanden aus getrennten Blöcken; Brillenbügel waren nicht durchgehend an Fassung und Ohr angepasst. Diese Fehler wurden in den bisherigen Frontal-/Hand-Nahansichten nicht ausreichend erfasst.

**Lösung (`officefp.js`):**
- Geschlossener Mützenumschlag mit durchgehenden Randflächen und Abstand zur Kappe. Cap-Schirm gebogen statt quaderförmig. Undercut als eine durchgehende Oberfläche mit weich auslaufenden kurzen Seiten, ohne zweite überhängende Haarkappe. Gespeicherte Avatarmerkmale bleiben unverändert.
- Zusammenhängende Bartflächen mit auslaufender Dicke und einer Grenze vor den Ohren. Keine Bartgeometrie am Hinterkopf/Nacken. Schnurrbart mit Abstand zum Mund.
- Gemeinsames Rumpfprofil für Körper und aufliegende Stoffflächen. Latzhosenträger laufen von der Brust über die Schulter auf den Rücken; Latz und Warnweste einschließlich Reflexstreifen folgen den abgeschrägten Körperflächen. Zusätzliche Teilungen an den Schulterfasen verhindern, dass schmale Träger oder breite Stoffflächen im Hemd verschwinden. Gilt für beide Körperformen.
- Angelegte, weich gefaltete Kapuze mit Kragen statt eines aufgesetzten Ovals. Schulterprofil bis zum Ärmelansatz verbreitert; Ärmel als durchgehende, abgerundete Profile statt Kugel-/Zylinder-Überlappungen. Bestehende Handgelenke, Hände, Griffpunkte und Armlängen bleiben erhalten. Namensschild näher an der Kleidung.
- Durchgehender Kopfhörerbogen mit Polstern und verbundenem Mikrofonarm; gebogene, verbundene Brillenbügel bis zum Ohr. Alles weiter Teil der vorhandenen Figuren-Meshes, keine zusätzlichen Drawcalls, Bildassets oder Pakete.
- `index.html` / `sw.js`: v300 nur für `officefp.js`. Pflanzen aus v299, Maus-/Monitoransichten aus v298, Raumaufteilung, Animationstätigkeiten und Geschäftslogik bleiben erhalten. Keine Spielstandmigration.

**Geprüft:** `node office-clothes-v300.test.js`: 320 Kopfkombinationen, 1.216 Mützen-/Haar-Strahlproben, Bart nur auf der Gesichtsseite und über der Haut, durchgehender Kopfhörerbogen, zwölf Kombinationen aus Outfit/Körperform, anliegende Stoffflächen einschließlich Dreiecksmitten, freie Halsöffnung, angelegte Kapuze, zusammenhängende Ärmel, endliche Geometrie und Modellbudgets (Kopf höchstens 6.500 Dreiecke). Zusätzlich `office-appearance-v298.test.js`, `office-workers-v284.test.js`, `office-joints-v288.test.js`, `office-plants-v299.test.js` und `review-v282.test.js` bestanden: Maus-/Handkontakt, sieben Tätigkeiten, Notfall, Schreibkontakt, Büro-Kollisionen, Pflanzen und bestehende Modelle. Syntax und Diff geprüft.

**Grafikprüfung:** 42 Vorher-/Nachher-Ansichten mit acht animierten Figuren und sechs Kopfkombinationen jeweils von vorn, hinten und seitlich mit Originalmodellen und Originalshadern unter Mesa/EGL gerendert. Details der drei Screenshot-Motive sowie der zusätzlich aufgefallenen Brillen-/Headset-/Westenfehler einzeln und alle Kombinationen als Übersichten kontrolliert.

**Prüfgrenze:** Kein Live-3D-/iPhone-/Safari-Test. Die Sichtprüfung erfolgte in einer Grafik-Prüfkulisse mit den originalen Spielmodellen und Shadern.

## v299 – Natürliche Büropflanzen mit Stämmen, Blättern und richtigen Töpfen
**Basis:** GitHub main `4b687f9` (v298), während der Arbeit neu eingetroffen und vollständig übernommen. Die dort hochgeladene v298 entspricht der vorigen Lieferung; sämtliche Mitarbeiter-, Hand-, Maus- und Monitorverbesserungen bleiben erhalten.

**Ursache:** Grünlilie, Monstera und Ficus bestanden aus frei schwebenden groben Laubkörpern ohne Stämme/Blattstiele. Palmenblätter waren starre Quader. Der Topf wurde nach oben schmaler und hatte weder einen sichtbaren Innenrand noch einen Untersetzer.

**Lösung (`officefp.js`, `plant`):**
- Alle sechs vorhandenen Arten neu modelliert: gestreifte, überhängende Grünlilienblätter; Monstera mit verzweigten Blattstielen, breiten gelappten Blättern und gerundeten Blattfenstern; Ficus mit sichtbarem Stamm, Ästen und dichterer ovalblättriger Krone; Zimmerpalme mit mehreren Halmen und acht gebogenen, gefiederten Wedeln; Olive mit feinen Zweigen und schmalen Blättern mit silbrigen Unterseiten; gerippter Säulenkaktus mit gerundeten Kuppen und feinen Dornen.
- Nach oben weitere Pflanzgefäße mit Untersetzer, Innenwand, Rand und vertieft liegender Erde. Stämme stecken in der Erde, Astabschnitte überlappen an den Anschlüssen. Blätter sind von oben und unten sichtbar. Leichte, reproduzierbare Unterschiede in Wuchs und Grüntönen je Art/Position, ohne den Zufall anderer Raummodelle zu verändern.
- Modelle weiterhin im vorhandenen statischen Raum-Mesh: keine zusätzlichen Drawcalls, Texturen, externen Pakete oder Animationen. Je Pflanze 1.377 bis 3.921 Dreiecke (Prüfgrenze 4.500), deutlich mehr Detail als bisher. Preise, Komfort, Pflanzenkatalog, Standorte, Etagen, Kollisionsflächen und Spielstände unverändert.
- `index.html` / `sw.js`: v299 nur für das geänderte Spielskript; übrige Cache-Verweise bleiben erhalten.

**Geprüft:** `node office-plants-v299.test.js`: alle sechs Arten an drei Standorten, endliche Koordinaten/Normalen, Größen- und Modellbudgets, richtig verjüngte offene Töpfe, Erde unter dem Rand, mit der Erde verbundene Stamm-/Ast-/Blattstielketten, beidseitige Blätter, reproduzierbare Geometrie und kein Einfluss auf den Zufall anderer Modelle. Die drei bestehenden Büroprüfungen `office-appearance-v298.test.js`, `office-workers-v284.test.js`, `office-joints-v288.test.js` bestehen weiterhin. Syntax und Diff geprüft.

**Grafikprüfung:** Sechs Vorher-/Nachher-Ansichten mit den originalen Spielmodellen und Shadern unter Mesa/EGL gerendert und einzeln bzw. als Übersicht geprüft. Keine Smartphone-/Safari-/Live-3D-Prüfung und keine FPS-Messung auf echter Handyhardware.

## v298 – Mitarbeiterhaare, Ärmelanschlüsse, Maus und tatsächliche Bildschirmarbeit
**Basis:** GitHub main `c295039` (v297), während der Umsetzung wiederholt abgeglichen. Die Wasserfallkorrekturen v297 und Claudes vorherige Änderungen bleiben enthalten.

**Ursachen:** Frisuren bestanden aus nach Dreiecksmittelpunkten ausgeschnittenen Kugelkacheln und aufgesetzten Blöcken; dadurch entstanden Treppenkanten und freie Kopfhautstreifen. Am Handgelenk trafen ein geschlossenes, rechteckiges Bündchen und zwei Hautwölbungen aufeinander. Die Maus hatte aufgesetzte ovale Tasten auf der falschen Seite, ihre Handauflage passte nicht zum Griffkontakt. Monitore zeigten überwiegend allgemeine Monatszahlen statt eines aktuellen Vorgangs.

**Lösung (`officefp.js`):**
- Geschlossene, zusammenhängende Haarkappen mit exakter Haarlinie, weichen Normalen und anliegenden Rändern. Undercut ohne Kopfhautspalt; Seitenscheitel, Tolle, Locken, Wellen, Bob, Pferdeschwanz und Dutt behalten eigene Formen. Locken/Wellen als integrierte Oberfläche statt einzelner aufgeklebter Kugeln. Dichtere Kopfoberfläche, anliegende Caps/Mützen; gespeicherte Avatarmerkmale bleiben erhalten.
- Rundes, offenes Ärmelbündchen; eine durchgehende, schmal zulaufende Handwurzel bis zur Handfläche. Keine zusätzliche Hautkugel am Handgelenk. Finger, Griffpunkte und Armlängen bleiben erhalten.
- Neu geformte Maus mit höherer hinterer Handauflage, flacheren vorderen Tasten, sauberer Tastennaht und eingelassenem Scrollrad. Tasten zeigen zum Monitor bzw. in Fingerrichtung. Gehäuse und Hand sind beim Benutzen über einen gemeinsamen Kontaktpunkt verbunden; Mausdrehung folgt der Hand.
- Monitore zeigen tatsächliche Standortvorgänge: Auftragskennung, Start/Ziel, Fracht/Gewicht, Fahrzeug und aktuellen Transportstatus einschließlich Halten. Rollenbezogene Ansicht für Disposition, Fahrpersonal, Umschlag und Zoll; feste Fahrerbindung hat Vorrang. Die Tätigkeit folgt der Figur (Tippen, Maus, Unterlagen, Notieren, Telefonat, Kaffeepause, Notfall). Keine erfundene persönliche Auftragszuweisung: gezeigt wird ein echter Standortvorgang. Ohne laufende Vorgänge erscheint die reale Fahrzeugübersicht. Größere Textur (384 × 240), kurze Zeilen und begrenzte Breiten; maximal ein geänderter Monitor pro Bild, Abfrage ungefähr alle 900 ms.
- `index.html` / `sw.js`: v298 nur für das geänderte Spielskript; alle übrigen Cache-Verweise bleiben erhalten. Keine neue Spielstandmigration und keine Änderung an Geschäftslogik oder Personalzuweisungen.

**Geprüft:** `node office-appearance-v298.test.js`: 48 Kopf-/Haar-/Zubehörkombinationen mit Strahlprüfung gegen Kopfhautstreifen, 96 Hand-/Outfit-/Griffkombinationen, Modellbudgets, Mausausrichtung und animierter Mauskontakt in sechs Outfits, reale Aufträge für vier Rollen, Fahrerbindung, Ladepriorität, Unterbrechungen, leere Auftragsliste, begrenzte Texturaktualisierung und unveränderte Geschäftsdaten. Bestehende Prüfungen `office-workers-v284.test.js`, `office-joints-v288.test.js` und `review-v282.test.js` bestehen weiterhin (alle sieben Tätigkeiten, Armreichweite, Schreibkontakt, Notfall, Sitzplatzkollisionen und bestehende Modelle). JavaScript-Syntax und Diff geprüft.

**Grafikprüfung:** Vorher-/Nachher-Nahansichten der zehn Frisurentypen, Ärmel-/Handanschlüsse beim Schreiben und Mausbedienen sowie der Maus mit den tatsächlichen Spielmodellen und Originalshadern unter Mesa/EGL gerendert und geprüft. Die neuen Monitortexturen mit tatsächlicher Canvas-Zeichenroutine für alle vier Rollen gerendert. Keine neuen Bilddateien oder Fremdbibliotheken für das Spiel.

**Prüfgrenze:** Kein Live-3D-/iPhone-/Safari-Test. Die Sichtprüfung erfolgte mit Originalmodellen und Shadern in einer Grafik-Prüfkulisse sowie separat gerenderten Monitortexturen.

## v297 – Stetige Wasserübergänge, natürlicherer See-Aufprall, keine Seitenfälle
**Basis:** GitHub main `49c5f99` (v296), während der Umsetzung wiederholt abgeglichen. Alle bisherigen Änderungen einschließlich Claudes Schatz- und Wegfindungskorrekturen bleiben enthalten.

**Ursache:** Bach und kleine Wasserfälle waren unabhängig konstruierte, überlappende Streifen mit unterschiedlichen Breiten, Kantenhöhen, Normalen und Materialien (Bach undurchsichtig, Fälle als durchsichtige Glasschicht). Das erzeugte die harten Schnittlinien in Screenshot 1/2. Das Bachbett folgte außerdem einer abweichenden Fallkurve. Am Hauptfall betonten ein punktförmiger Schaumkern, große Spritzer und Nebel den Eindruck eines Lichtflecks statt eines Wasseraufpralls.

**Lösung:**
- `woodmodels.js`: gemeinsame Stützpunktfolge für Bach, vier Bergkaskaden, Rinne und Hauptfall. Alle kleinen Fälle teilen oben und unten exakt dieselben Randpunkte, Normalen und Fließkoordinaten mit dem Bach. Gekrümmte Verbindungen mit auslaufendem Gefälle statt ineinandergesteckter Flächen. Das eingeschnittene Bachbett folgt denselben Verbindungen.
- `gl3d.js` / `worldview.js`: kleine Fälle benutzen jetzt dasselbe undurchsichtige Wassermaterial wie der Bach. Spiegelung und Turbulenz neigen sich mit der Oberfläche. Am Hauptfall blendet das Bachmaterial über die gemeinsame Rinne in das Fallmaterial über; die Shaderfarben sind direkt am Anschluss identisch. Die Fließphase bleibt zeitlich stabil talwärts, auch bei örtlich wechselndem Tempo.
- Hauptfall mit dichterem Wasserkern und einem unregelmäßig zerfallenden Saum über der Seeoberfläche. Kompakter, flacher Aufprallschaum über die Fallbreite mit unregelmäßigen Flocken, schwachen Druckwellen und stromabwärts auslaufendem Schaum. Kein zentraler Nebelball und kein runder Leuchtring. Der Quelltopf verwendet die ruhigere Seerichtung statt der Flussrichtung.
- Beide abstehenden Seitenfälle vollständig entfernt: Geometrie, deren Schaumflecken und die zugehörigen Spritzer. Die bisherigen Felsen bleiben als natürliche Ufersteine erhalten. Hauptfallspritzer kleiner und kürzer, Nebel stark reduziert und auf Wassernähe begrenzt.
- Wassergeometrie insgesamt von 10.140 auf 8.448 Dreiecke reduziert (rund 17 % weniger), keine zusätzlichen Wasser-Drawcalls. Hauptfall-Emissionen von 49 auf 42 pro Sekunde reduziert; alle Bergkaskaden zusammen weiterhin 17, nur in Kameranähe. Spielstände und Geschäftslogik unverändert.
- `index.html` / `sw.js`: v297 für die drei geänderten Spielskripte. Aktuelle CSS-/Mitarbeiter-Verweise bleiben erhalten.

**Geprüft:** `node water-seams-v297.test.js`: alle 72 gemeinsamen Kaskaden-Anschlusspunkte einschließlich Normalen und Fließphase, neun Hauptfall-Anschlüsse, 576 Bachbettprüfungen, sichtbare Dreiecksausrichtung, Modellbudgets, keine Seitenfälle, Aufprallschaum auf Seehöhe und über voller Fallbreite. Die an die neue Geometrie angepassten bestehenden Tests `node waterflow-v296.test.js` und `node waterfall-v289.test.js` bestehen weiterhin (Fließrichtung bis 7200 Sekunden, endliche/deterministische Modelle, Emissionen bei 30/60/120 fps, Nachtfarben, Kameradistanz). JavaScript-Syntax und Diff geprüft.

**Grafikprüfung:** Acht originale GLSL-Shader unter Mesa/EGL kompiliert, Haupt- und Partikelprogramme verlinkt. Vorher-/Nachher-Nahansichten von allen vier Bergfällen, der Rinne/Fallkante, dem Hauptfall und dem Auftreffbereich in einer 3D-Prüfkulisse aus Originalmodellen und der tatsächlichen Szenenmontage gerendert (ohne verdeckende Kulissenbäume und Spiel-UI). Zusätzlich Ansichten der kleinen Fälle von oben und animierte Sequenzen geprüft. GPU-Bildvergleich: 21/21 Zeitproben für Hauptfall, Kaskaden und Bach von 0 bis 7200 Sekunden laufen talwärts. Die Shaderfarben beider Materialien am Hauptfall-Anschluss sind bei 0/15/3600/7200 Sekunden in sämtlichen Farbkanälen identisch.

**Prüfgrenze:** Kein Live-3D-/iPhone-/Safari-Test. Die zuvor geöffnete Live-Seite meldete im Testbrowser fehlendes WebGL 2; die aktuelle Sichtprüfung erfolgte deshalb mit den Spielmodellen und Originalshadern in der Grafik-Prüfkulisse.

## v296 – Wasserfallkorrektur mit aktuellem GitHub-Stand zusammengeführt
**Basis:** GitHub main `75af8fa` (v295), einschließlich Claudes Schatzbanner-Änderung v294 und Wegfindungsänderung v295. Diese Fassung ersetzt die frühere Wasserfall-ZIP v294. Aktuelles main vollständig integriert.

**Ursache:** Die Zeitphase im Wasserfall-Shader wurde mit der Position entlang des Falls multipliziert. Dadurch wechselte das räumliche Gefälle nach wenigen Sekunden das Vorzeichen: die Textur lief tatsächlich bergauf. Dieselbe Ursache betraf die Bergkaskaden und die vom Tempo abhängige Animation im Bergbach. Der Aufprallschaum war gegenüber dem Fall versetzt und schwach; die Partikelauswahl begann jedes Bild wieder bei der ersten Kaskade.

**Lösung:**
- `gl3d.js`: feste, streng aufsteigende Laufzeitkoordinate statt ortsabhängiger Zeitphase. Alle drei Texturschichten laufen dauerhaft talwärts; das Muster beschleunigt nach unten. Auch die mitgeführten Strukturen im Bergbach laufen in Fließrichtung. Zusammenhängenderer, halbtransparenter Wasserkern bis zum Fuß.
- Heller, kompakter Schaumkern unmittelbar am Kontakt, auslaufender Schaum und schwache, nach außen wandernde Wellen. Schaum ist auf die Wasseroberfläche begrenzt; Dunst bleibt flach und kurzlebig. Die Tropfenform verwendet definierte `smoothstep`-Kanten statt einer treiberabhängigen umgekehrten Kante.
- `woodmodels.js`: `SPR.waterY`, `springFallPath` und `springImpact` liefern für Modell, Schaum und Emission dieselbe Wasserhöhe und denselben Schnittpunkt des Falls mit dem See. Fallfläche und Schaum etwas feiner unterteilt (+624 Dreiecke zusammen), ohne zusätzliche Wasser-Drawcalls.
- `worldview.js`: mehr sichtbarer Abwärtsfluss; fallende Randtropfen folgen einer Flugbahn bis zur Seehöhe, Aufprallspritzer fliegen flach nach außen und sinken zurück. Dünne fallende Tropfen statt eines schwebenden Schleiers. Die beiden Nebenstränge erzeugen Spritzer auf den Absätzen und am Wasser. Fortlaufende Zähler versorgen alle vier Bergkaskaden gleichmäßig. Nachtfarben gelten auch außerhalb des Hauptfall-Emissionsradius.
- Partikelraten unverändert begrenzt: Hauptfall/Nebenstränge zusammen 49 pro Sekunde, alle Bergkaskaden zusammen 17; weiterhin nur bei Kameranähe. Spielregeln, Gelände, Wasserstand, Büro-, Jagd- und Produktionsänderungen bleiben erhalten. Cache-Verweise nur für die drei geänderten Spielskripte auf v296.

**Abgleich:** Die drei Spielskripte wurden nach rechnerischem Entfernen der Wasserfallkorrektur byteweise mit aktuellem GitHub verglichen: identisch. `team.js` und `CLAUDE.md` sind vollständig bytegleich mit main. Cache-Verweise auf `style.css?v=293` und `team.js?v=295` bleiben erhalten. Beide jüngsten GitHub-Änderungen bleiben enthalten.

**Erneut geprüft nach Zusammenführung:** `node waterflow-v296.test.js`: echte Shader-Koordinaten bis 7200 Sekunden, See-Kontakt, fünf Modellbudgets, alle vier Bergkaskaden und vier Nebenstrang-Kontakte, Partikelraten und Nachtfarben bei 30/60/120 fps, keine Emission bei ferner Kamera. `node waterfall-v289.test.js` mit aktualisierter Modell-Fixture bestanden. JavaScript-Syntax und Diff geprüft.

**Grafikprüfung der unveränderten Wasserfallkorrektur aus der vorherigen Lieferung:** Alle acht originalen GLSL-Shader unter Mesa/EGL kompiliert, Haupt- und Partikelprogramme verlinkt. Komplette Wasserfallszene mit originalen Modellen, Wasser-Shadern und emittierten Partikeln für Vorher/Nachher gerendert; Hauptfall und Bergkaskaden als animierte Sequenzen kontrolliert. GPU-Bildvergleich an 7 Zeitpunkten von 0 bis 7200 Sekunden für Hauptfall, Kaskaden und Bergbach: 21/21 Proben laufen talwärts; in der alten Fassung laufen alle drei nach 15 Sekunden bergauf.

**Nicht geprüft:** Die Live-Seite wurde im Testbrowser geöffnet, ihr 3D-Hof meldet jedoch „WebGL 2 fehlt“. Daher kein vollständiger Live-Spieltest und kein Test auf iPhone/Safari. Die Grafikprüfung lief mit den Spielmodellen und Originalshadern außerhalb des Browser-Spiels.

## v295 – Mitarbeiter laufen nicht mehr in der Geraden durch alles, wenn sie eingeschlossen stehen
**Wunsch Bennet:** Der Fischer läuft in normaler Spielzeit zum Lagerfeuer und geht dabei durch alles hindurch.

**Ursache (im Testbrowser nachgestellt):** Die Wegesuche (`navPath`) findet keinen Weg, wenn das Startfeld ringsum von gesperrten Feldern umgeben ist, zum Beispiel der Fischer am Steg zwischen Reusen, Boot und Hütte. `staffGo` zog dann als Notlösung eine Gerade vom Start zum Ziel. In meinem Test lief diese Gerade vom Steg zum Lagerplatz an 53 von 642 Messpunkten durch gesperrte Felder.

**Lösung (`team.js`):** Neue Wegsuche `navPathSafe` mit Notlösung: Findet `navPath` keinen Weg, dürfen im Umkreis von zwei Feldern um Start und Ziel gesperrte Felder überstiegen werden (`NAV.loose` in `navOk`). Der Rest des Weges bleibt auf freien Feldern. `staffGo` nutzt sie an den drei Stellen für Wege zum Ziel und zum Lagerplatz. Die normale Wegesuche ändert sich nicht.

**Geprüft (Testbrowser):**
- Fischer mit eingeschlossenem Startfeld: Route vorher eine Gerade mit zwei Punkten, jetzt 70 Wegpunkte entlang des Wegenetzes. Nur der Schritt aus der Einschließung gilt als gesperrt (4 von 935 Messpunkten).
- Normale Wege: über 230 Startpunkte für Fischer, Landwirt und Pfleger ohne Fehler und ohne gesperrte Felder.
- Mittagspause von der Fahrt zum Lagerfeuer bis zum Hinsetzen: wie vorher, Abstand zur Feuerstelle ≥ 1,49. Keine Konsolenfehler.

**Nicht geprüft:** dein Spielstand mit seiner echten Umgebung am Steg; ob genau das bei deinem Fischer die Ursache ist, ließ sich nur im Nachbau zeigen. Am Handy nicht geprüft.

## v294 – Schatzsuche: große Einblendung „Schatz gesichtet!“ entfällt
**Wunsch Bennet:** Die riesige Einblendung „Schatz gesichtet!“ mit „Such das rote Kreuz“ und „3 Stunden Zeit“ bei diesem Ereignis entfernen.

**Lösung (`worldview.js`, `worldTreasureIntro`):** Der Aufruf der großen Einblendung (`worldLootShow`) ist für dieses eine Ereignis entfernt. Ton, Vogelschwarm, die Meldung unten („Ein Vogelschwarm kreist über dem Seeufer …“) und der Vogelschwarm-Knopf mit der Restzeit bleiben. Die Einblendungen beim Fund der Kiste und bei Paketlieferungen (`worldLootShow`) sind unverändert.

**Geprüft (Testbrowser):** Ereignis ausgelöst – es entsteht keine Einblendung mehr, keine Konsolenfehler. **Nicht geprüft:** am Handy, der echte Ablauf mit Vogelschwarm im Spiel.

## v293 – Produktionsfenster: Überschrift wie im Kuhstall
**Wunsch Bennet:** Der Name der Mühle sah anders aus als beim Kuhstall.

**Ursache:** Bei v292 blieben die kompakten Innenmaße von v286 stehen, darunter kleinere Überschrift (20 px, engere Buchstaben), kleineres Symbol, kleinerer Knopf „Deaktivieren“ und ein kleineres ✕. Sie galten nur für die Produktionsfenster.

**Lösung (`style.css`):** Die vier Regeln für `.fs-h`, `.fs-ic`, `.fm-off` und `.fs-x` bei `.mach` sind entfernt. Titel, Symbol und Knöpfe haben jetzt die gleiche Größe wie in jedem anderen Hofblatt. Die kompakten Maße für Rezepte und Warteschlange bleiben.

**Geprüft:** Nur Stil geändert; Mühle im Testbrowser angesehen, Titel in Standardgröße. **Nicht geprüft:** am Handy.

## v292 – Produktionsfenster wieder am unteren Rand, Arbeitermenü passt in den sichtbaren Bereich
**Wunsch Bennet** (drei Handy-Screenshots): Das Fenster der Produktionsstätten (Fischerhütte) soll wieder wie der Kuhstall am unteren Rand sitzen. Beim Arbeiter mit vielen Aufträgen war sein Menü nicht vollständig einsehbar.

**Ursache:**
- Seit v278/v286 hatte das Produktionsfenster (`.mach`) eine Sonderplatzierung: eine schwebende Karte, mobil schmal über der Navigation, abgedunkelter Hintergrund.
- Das Arbeitermenü ist ein Pop-over über der Figur (`#farmPop`, `positionStaffPop`) ohne Höhengrenze. Es wuchs mit jedem Auftrag und ragte oben und unten aus dem Bild (unten unter die Navigation).

**Lösung:**
- **`style.css`:** Die Sonderplatzierung der Produktionsfenster ist entfernt, sie nutzen wieder das normale Bodenblatt. Die kompakten Innenmaße aus v286 bleiben.
- **`team.js`:**
  - Das Arbeitermenü ist höchstens so hoch wie der sichtbare Bereich zwischen Kopfleiste und Navigation (`maxHeight` in `positionStaffPop`) und scrollt innen (Regel `.fp-box.fstp` mit `overflow-y:auto`).
  - Der Scrollstand bleibt beim Neuzeichnen erhalten.

**Geprüft (Testbrowser, 390 × 700):**
- Mühle: Fenster über die volle Breite am unteren Rand.
- Arbeitermenü mit 14 künstlichen Aufträgen: bleibt zwischen Kopfleiste und Navigation, scrollt, und das Ende der Liste ist erreichbar. Die Prüfung nutzte ein künstlich gebautes Menü, weil im Test noch keine Arbeiter freigeschaltet waren.
- Keine Konsolenfehler.

**Nicht geprüft:** das echte Arbeitermenü mit echten Aufträgen und die Fischerhütte, am Handy.

## v291 – Aufräumen ohne alte Kraftkosten
**Wunsch:** Beim Wegräumen von Gerümpel keine veraltete Ausdaueranzeige mehr.
**Lösung:** Muskel-Symbol und Zahl vom Wegräumen-Knopf entfernt; farmClearJunk prüft und verbraucht keine Ausdauer mehr. Die veraltete Erschöpfungsmeldung im zugehörigen Klickpfad entfällt ebenfalls. Aufräumen funktioniert damit auch bei alten Spielständen mit sta=0. Materialien, Geld, Statistik und EP bleiben unverändert. Ein bereits entferntes Objekt kann nicht mehrfach vergütet werden.
**Geprüft:** `node clearing-v291.test.js` für alle fünf Gerümpelarten: Aufräumen bei sta=0 ohne Aufruf der Ausdauerfunktion, korrekte Belohnungen, Doppelaufruf, volles Lager, Anzeige ohne Kraftkosten. JavaScript-Syntax von erbe.js, worldview.js und sw.js geprüft. Kein visueller iPhone-Test.
**Basis:** main 1458f40 plus bereits gelieferte v285–v290, alle enthalten.


## v290 – Schenkel von Keiler und Hirsch
**Ursache:** Die in v283 hinzugefügten Ellipsoide an Schulter/Hüfte erschienen bei seitlich liegenden Tieren als separate runde Knubbel.
**Lösung:** Zusatz-Ellipsoide entfernt. Vorder- und Hinterschenkel als durchgehende, längliche Muskelprofile mit artgerechter Abstufung: kräftige kompakte Keilerkeule, schlankere Hirschläufe. Oben läuft das Profil sehr schmal im Rumpf aus; der Muskelbauch liegt unterhalb des Gelenkansatzes. Keine sichtbaren breiten runden Deckflächen mehr. Umfangsauflösung von 8 auf 10 Segmente, Längsauflösung von 11 auf 13 verbessert, innerhalb des bisherigen Modellbudgets.
**Erhalten:** Gelenkachsen, Längen, Trefferzonen, Medaillen, Farbvarianten und Speicherdaten. Liegeposen werden weiterhin aus den tatsächlichen Profilen berechnet.
**Geprüft:** 21 ursprüngliche Jagdtests bestanden, inklusive Modellbudget (<9000 Dreiecke je Keiler), Liegeposen beider Seiten, Gelenkgrenzen und Kollisionen. `node hunt-thighs-v290.test.js`: beide Arten, Vorder-/Hinterschenkel, alte/neue Datensätze, schmale Verankerung und Muskelbauch unterhalb des Ansatzes. `node hunt-v283.test.js` bestanden; dessen Ansatzprüfung an das neue Profil angepasst. Vorher-/Nachher-Ansichten im Stand und seitlich liegend aus echten Modellkoordinaten gerendert und visuell geprüft (Softwareprojektion). Kein Live-/iPhone-Test.
**Basis:** main 1458f40 plus bereits gelieferte v285–v289, alle enthalten.


## v289 – Wasserfall mit durchlässigen Strähnen und natürlicherem Aufprall
- Hauptfall am Fuß von 1,45 auf 1,16 lokale Einheiten verjüngt. Shader zeichnet ungleichmäßig dichte Wassersträhnen mit durchscheinenden Zwischenräumen statt eines durchgehend deckenden Bandes. Bestehender Fließverlauf und Anschluss an Becken bleiben erhalten.
- Schaumfläche schmaler, unregelmäßiger und in Fließrichtung gestreckt; zwei schwächere, langsamere Wellenfronten statt dreier heller Ringe. Weniger dichter Schaumkern; nachts geringere Mindesthelligkeit.
- Mehrere umgekehrte smoothstep-Kanten innerhalb fallWater durch definierte, aufsteigende Kanten mit invertiertem Ergebnis ersetzt. Damit hängen diese Übergänge nicht mehr vom treiberspezifischen Verhalten bei umgekehrten Kanten ab.
- Hauptfall-Gischt von 63 auf 49 Emissionen/Sekunde reduziert. Nebel kleiner, kürzer und transparenter; weniger Spritzer und Schleier. Die Begrenzung auf Kameranähe bleibt erhalten. Kein zusätzlicher Shader-Rauschaufruf und kein zusätzlicher Wasser-Drawcall.
- Vier kleine, nasse Felsabsätze am Fuß gliedern die große Wand, ohne den Hauptstrom zu verdecken. Gelände, Quelllauf, Teichhöhe und Spiellogik unverändert.
**Basis:** main 1458f40 plus bereits gelieferte v285–v288. Alle früheren Korrekturen enthalten.
**Geprüft:** Acht originale GLSL-Shader erfolgreich unter Mesa/EGL kompiliert, Hauptprogramm verlinkt. Vorher-/Nachher-Renderings der Wasser- und Schaumshader für Tag/Nacht mit OpenGL gerendert und visuell kontrolliert (isolierte Shaderansichten, kein kompletter Spielbrowser). `node waterfall-v289.test.js`: vier deterministische Modelle, endliche Koordinaten, gültige Strömungskoordinaten, Partikelbudget bei 30/60/120 fps und keine Emission bei ferner Kamera. Büro-Modell-/Kollisions-/Animationstests bestanden. JS-Syntax geprüft. Kein iPhone-/Safari-Livetest.


## v288 – Ein Handgelenk, Empfang hinter der Sitzreihe
- Unterarm: Ärmel und Bündchen reichen jetzt bis zum Handgelenk. Zusätzlicher hautfarbener Zylinder und Kugel am Unterarm entfernt. Der Übergang zur Hand gehört nur noch zum Handmodell; Handfläche und Finger bleiben unverändert.
- Das vermeintliche Schrankmöbel war der Empfangstresen (Plan 150–250 / 236–258), der die hintere Sitzreihe durchdrang. Er steht jetzt schmaler an der Rückwand (150–250 / 258–268), hinter den Stühlen. Grundriss und 3D benutzen dieselbe Funktion `receptionPlan(b)`.
- Bei manuell in diesen Bereich verschobenen Tischen wird der dekorative Tresen ausgelassen, statt Tisch/Person zu durchdringen. Gespeicherte Möbelpositionen werden nicht verändert.
**Basis:** main 1458f40; vorher gelieferte CSS-Korrekturen v285–v287 enthalten.
**Geprüft:** `node office-joints-v288.test.js` mit echten Raum- und Modellbauern: alle EG-Sitzplätze in Bürogebäude/Konzernzentrale ohne Empfangsüberschneidung; Obergeschoss ohne Tresen; manuelle Kollision abgefangen; kein zweiter hautfarbener Gelenkabschluss am Unterarm. `node office-workers-v284.test.js`, `node office-limits.test.js` und `node review-v282.test.js` bestanden. JavaScript-Syntax geprüft. Kein visueller Live-/iPhone-Test.


## v287 – Navigation mobil wieder vollflächig
**Wunsch:** Die untere Leiste auf dem Handy bis in alle Ecken ausfüllen; nur Desktop abrunden.
**Lösung:** #nav hat standardmäßig Eckenradius 0. Nur ab dem vorhandenen Desktop-Breakpoint von 860 px wird Radius 18 px gesetzt. Hintergrund, Safe-Area-Padding und aktive Tab-Schaltflächen bleiben erhalten. CSS-Cache/SW auf v287.
**Basis:** aktuelles main 1458f40 plus bereits gelieferte v285/v286; beide enthalten.
**Geprüft:** CSS-Kaskade, Breakpoint und Cache-Verweise kontrolliert; Service-Worker-Syntax und ZIP geprüft. Kein visueller Live-/iPhone-Test.


## v286 – Kompaktes Produktionsfenster fürs Handy
- Mobil bis 699 px: Fenster über der Navigation, maximal 56 % der sichtbaren Höhe und 380 px breit. Inhalt vertikal scrollbar, damit alle Rezepte erreichbar bleiben. Mehr Hof bleibt darüber sichtbar; Hintergrund weniger abgedunkelt.
- Warteschlange: 48-px-Plätze in einer horizontal wischbaren Reihe statt mehrerer großer Reihen. Einzelabbruch, fertige Produkte und Slotkauf bleiben bedienbar.
- Sonnenstrom-Hinweis: kompakter Text mit eigener Zeilenhöhe statt übergroßer Abstände; alle Informationen bleiben lesbar. Rezeptkarten, Zutaten und Schaltknöpfe enger gesetzt.
- Basis main 1458f40, zusätzlich die bereits gelieferte v285-Firmenliste enthalten, sofern noch nicht in main. Keine Produktionslogik geändert.
**Geprüft:** CSS-Änderungen manuell kontrolliert, Klammerstruktur und Cache-Verweise geprüft, Service-Worker-Syntax geprüft; kein visueller Live-Browser-/iPhone-Test.


## v285 – Konzern-Badge und Status in der Firmenliste
**Ursache:** Der vorherige Umbruch hing von der Viewport-Breite ab; das 430-px-Seitenpanel konnte auch auf breiten Ansichten in drei Spalten zusammengedrückt werden. Das Badge stand weiterhin neben dem Firmennamen.
**Lösung:** Zwei feste Spalten (Symbol, Inhalt) bei jeder Bildschirmbreite. Firmenname und Konzern-Badge untereinander, Status bzw. Angebotsknopf in eigener Zeile unter den Firmendaten. Lange Namen und Statusmeldungen umbrechen innerhalb ihrer Zelle.
**Basis:** aktuelles main 1458f40 (v284). Keine Geschäftslogik geändert.
**Geprüft:** CSS-Regeln und Cache-Verweise geprüft; JavaScript-Syntax des Service Workers geprüft. Kein Live-Browser-/iPhone-Test.


## v284 – Büro: Hände, Notfallverhalten, Monitor und Sprechblasen
**Basis:** GitHub main 5b36609 (v283), abschließend erneut abgeglichen; Jagdänderungen bleiben unverändert.
- Handgelenk: zusätzlicher abgerundeter Übergang zwischen Ärmel und Handfläche. Bei Tischkontakten orientiert sich die Hand am Unterarm statt starr in Figurenrichtung; übermäßiges Abknicken und Rollen begrenzt. Gezielte Stift-, Tassen- und Telefongriffe bleiben erhalten.
- Trinken: freie Hand ruht auf dem Tisch, statt gleichzeitig weiterzutippen.
- Notfall: Nach der ersten Schreckphase bleiben beide Hände in Ruhe. Arbeitsziele, Stift, Mausbewegung, Telefon-/Tassenanimationen und Tätigkeitswechsel sind während des Schocks unterbrochen. Hilferufe können weiterhin gesprochen werden. Bisher fielen die Hände nach 3,4 Sekunden auf Tastatur und Maus zurück.
- Monitor: Überschrift auf die Rollenbezeichnung verkürzt, rechts bleibt Platz für den Tag. Pixelbasierter Textumbruch/Abkürzung; lange Monatsstatistiken werden vollständig über mehrere Zeilen angezeigt. Zusammenfassungen beginnen direkt unter der Liste statt erst am unteren Bildschirmrand.
- Sprechblasen: Position anhand der tatsächlichen Blasengröße auf die sichtbare Fläche begrenzt; hinter der Kamera ausgeblendet; lange Namen umbrechen. Kein Abschneiden am rechten Bildschirmrand mehr.
**Geprüft:** `node office-workers-v284.test.js` durchläuft die echte Figurenanimation aller sieben Tätigkeiten, prüft endliche Gelenkpositionen, Armreichweite, Schreibkontakthöhe (max. etwa 7 mm im Test), Notfall nach der Schreckphase, Monitor-Umbruch und Sprechblasengrenzen. `node review-v282.test.js`, `node office-limits.test.js`, `node hunt-v283.test.js` bestanden; 21 ursprüngliche Jagdtests ebenfalls bestanden. Monitorcanvas zusätzlich als Bild gerendert und kontrolliert. JavaScript-Syntax geprüft. Kein visueller Live-Browser-/iPhone-Test; keine Aussage über vollständige Kollisionsfreiheit aller denkbaren Posen.


## v283 – Jagd: runde Laufansätze, individuelle Decken und lebendigeres Revier
**Basis:** GitHub main 7321acd, v282 bleibt vollständig erhalten.
- Hirsch: Obere Laufprofile reichen jetzt in den Gelenkbereich hinein; runde Schulter-/Hüftansätze überlappen den Rumpf statt sichtbarer flacher Schnittflächen. Keiler erhalten ebenfalls runde, kräftigere Ansätze. Gelenkachsen, Größe und Lage der kritischen Trefferzonen unverändert.
- Acht subtile Farbnuancen pro vorhandener Decke/Gefiedervariante (warm/kühl, heller/dunkler), aus gespeichertem Erbgut abgeleitet. Revier, Bergung und Trophäen verwenden denselben Aussehensschlüssel; Cache bleibt auf acht Nuancen begrenzt. Alte Stücke mit g=0 behalten die bisherigen Farben. Seltene Decken, Seltenheitswahrscheinlichkeiten und Wert bleiben unverändert.
- Gelassene, aufmerksame und wachsame Stücke: unterschiedliches Sichern sowie unterschiedliche Reaktion auf Geräusche und Witterung. Verhalten wird aus der Identität bestimmt und im Beobachtungstext angezeigt, sobald das Tier gesehen wurde.
- Witterung berücksichtigt Windrichtung, Stärke, Entfernung und Wachsamkeit. Der Zugewinn war zuvor bei mäßigem Wind kleiner als der ständige Alarmabbau. Gegenwind schützt weiterhin.
- Nahe Tiere bemerken Unruhe bei anderen Stücken (10 Reviereinheiten, gedrosselter Impuls statt Eskalation in jedem Frame). Kein neues kostenpflichtiges System und keine Spielstandmigration.
**Geprüft:** 21 bestehende Jagdtests bestanden, darunter Trefferzonen, Statistik, Medaillen, Liegeposen beider Seiten, Boden-/Körperkollision und Geweihzählung. `node hunt-v283.test.js`: 72 deterministische Körpermodelle, Farbnuancen, Palettenrücksetzung, Temperamente, Wind und alte/neue Gelenkmodelle mit endlichen Koordinaten. Syntax geprüft. Zusätzliche Vorher-nachher-Ansicht der echten 3D-Modelldaten im Stand/seitlichen Liegen visuell kontrolliert (Softwareprojektion, kein Spielbrowser). Kein Live-/iPhone-Test.


## v282 – Firmenliste, Porträtstart, Verhandlungen und Bürodetails
- Firmenliste: lange Firmennamen und Konzern-Badges umbrechen; mobil steht der Status unter den Firmendaten. Chatblasen werden im Scrollbereich nicht mehr zusammengedrückt.
- Profilbild: gespeicherte Standardporträts werden sofort mit ihrem Dateipfad angefordert; während der asynchronen Prüfung erscheint keine andere SVG-Figur. Eigene Fotos behalten Vorrang.
- Verhandlungen: neue Reserven bei 88–104 % des Firmenwerts (vor Marktdominanz/Altaufschlägen); seriöse abgelehnte Angebote erhalten ein entgegenkommendes, nicht steigendes Gegenangebot. Die Gegenforderung reduziert zugleich die Annahmeschwelle. Nur unter 60 % des Firmenwerts greift die bestehende Beleidigungsreaktion. Auch laufende alte Gespräche kommen bei seriösen Angeboten entgegen. Drei Runden bleiben bestehen.
- Übernahme: sachliche Schlagzeile und Abschlussmeldung, ruhiger Comic-Zeitungslook; kein Goldregen, keine Krone/Überlegenheitsparolen, weniger Effekte. Kompaktes Layout mit eigener Scrollfläche und dauerhaft erreichbarem Abschlussknopf. Bei extrem kleinen Ansichten wird weiterhin gescrollt, statt Informationen zu verbergen.
- Büro: eingefasstes Namensschild mit getrennten Tiefen gegen Flimmern und angedeuteten Schriftzeilen; Finger schmaler und Ansatz mit Handfläche verbunden; einzelne Tastaturtasten samt Leertaste; abgerundete Maus mit zwei Tasten und Scrollrad.
**Basis:** aktuelles GitHub-main dcbfc26 (enthält v281 samt Bürogrenzen/Wiederherstellung).
**Geprüft:** node review-v282.test.js (Verhandlungen inkl. Screenshot-Beträgen und alten Forderungen, Annahme, sofortige Porträts, Fotovorrang, echte 3D-Modellbauer mit endlichen Koordinaten); node office-limits.test.js; Syntaxprüfung aller geänderten JS-Dateien. Kein visueller Browser-/iPhone-Test möglich: Browser nicht installiert.


## v281 – Bürogrenzen je Etappe und unbegrenzte Welt
**Ursache:** `maxBases()` gab die Etappennummer zurück, somit waren selbst weltweit nur sechs Büros möglich.
**Lösung:** Berlin 1, Brandenburg & Mitteldeutschland 3, Deutschland 10, Europa 15, Eurasien & Transatlantik 20, Welt ohne numerische Grenze. Kauf, Miete und Übernahme nutzen dieselbe Grenze. Anzeige und Sperrtexte angepasst; bei Welt kein Verweis auf eine nächste Etappe. Ein Büro je Kartenort gilt weiterhin.
**Wiederherstellung v281:** Einmalig werden alle gespeicherten Firmenübernahmen auf fehlende Firmensitze geprüft, auch wenn die alte Übernahme bereits als erledigt markiert war. Fehlende Sitze werden samt neu rekonstruiertem Personal wieder vorgemerkt oder bei freiem Platz aktiviert. Bereits vorgemerktes Originalpersonal bleibt erhalten. Auch früher bewusst verkaufte Übernahme-Sitze können bei dieser einmaligen Reparatur zurückkehren, da alte Spielstände Verlust und Verkauf nicht unterscheiden. Danach verhindert `hqRestore281` erneutes Wiederherstellen bewusst verkaufter Büros. Manuell erworbene, gelöschte Büros ohne Historie sind nicht rekonstruierbar.
**Spielstände/Übernahmen:** Die bestehende Vormerkung `S.corp.hq` erhält Firmensitze samt Personal beim Erreichen der Grenze. Sie wird unverändert mit dem Spielstand gespeichert und bei freier Kapazität bzw. Etappenaufstieg automatisch aktiviert. Bestehende Büros oberhalb einer Grenze werden nicht entfernt.
**Geprüft:** `node office-limits.test.js` testet alle sechs Grenzen, reale Kauf-Funktion (inkl. Welt mit 30 Büros), Oberflächentexte, Übernahmesitz an der Grenze, JSON-Speicherzyklus, Aktivierung nach Etappenaufstieg, Schutz gegen doppelte Aktivierung und Bestandsschutz. JavaScript-Syntax und `git diff --check` geprüft. Kein visueller Browser-/Handytest: Browser in dieser Umgebung nicht installiert.
**Basis:** GitHub `main`, Commit `3f64b5d31acb253f2676fd60090731e1e4c95891`. Lieferung als ZIP auf ausdrücklichen Wunsch, kein Push.











## v280 – Tierprodukt-Restzeiten folgen der Spielzeit

Die Statuszeile im geöffneten Tier-Popup wurde nur beim Öffnen berechnet. Sie wird jetzt mit der Hofoberfläche aus der aktuellen Spielzeit aktualisiert, ohne das Popup oder seine Schaltflächen neu aufzubauen. Bei fertigen Tierprodukten entfällt die abgelaufene Wartezeit.

Geprüft in Chromium für Hühner, Kühe und Schafe: 1 h 47 min wird nach 20 Spielminuten zu 1 h 27 min, auch über Mitternacht; ohne Zeitfortschritt bleibt die Anzeige gleich; bei Fertigstellung verschwindet die Restzeit. Die Stall-Schaltfläche bleibt derselbe DOM-Knoten. Die Truhenkorrektur v279 wurde ebenfalls mit geprüft: Modell und Endpose bleiben nach der Öffnungsanimation gleich. Keine JavaScript-Fehler. Syntaxprüfungen und git diff --check erfolgreich. Nicht auf einem echten Handy geprüft.

## v279 – Geöffnete Schatztruhe behält ihr Aussehen

Die Animation ließ die Truhe zuletzt schrumpfen und ersetzte sie durch ein kleineres, anders aufgebautes Modell in der Grube. Die dauerhafte Truhe nutzt jetzt denselben Korpus und Deckel wie die Öffnungsanimation. Schrumpfen und Auflösungsfunken entfallen; beim Übergang wird die Endpose übernommen. Auch beim Neuaufbau der Szene und nach dem Laden wird dieselbe geöffnete Truhe mit identischer Größe, Deckelstellung und Höhe dargestellt. Belohnungen und Kamerarückkehr bleiben erhalten.

## v278 – Startaufstellung und Produktionsfenster

Neue Höfe starten mit der Liefertafel in Richtung der Startkamera (r=3), wie im gewünschten Screenshot. Die beiden anfänglichen Apfelbäume stehen rechts neben dem Hauptweg; ihre Stellflächen belegen keine Wegkacheln mehr. Bestehende selbst eingerichtete Höfe werden nicht umgestellt.

Im Produktionsfenster behalten gesperrte Rezepte ihr Warenbild. Schloss und Freischaltbedingung stehen zusammen in einer eigenen Zeile; beim Schaffutter hängt das Schloss dadurch nicht mehr unter dem Bild in der Zutatenzeile. Produktionsfenster sitzen mittig mit begrenzter Höhe und Abstand zur Navigation; lange Inhalte scrollen im Fenster.

Geprüft in Chromium: frischer Hof mit Tafelausrichtung r=3 und Bäumen ohne Überschneidung mit Wegkacheln; Mühlenfenster vollständig innerhalb der Ansicht bei 1280 und 390 Pixeln Breite; Schaffutter mit Warenbild, eigenem Schlossstatus und deaktivierter Rezeptwahl; Weizenmehl über den Rezeptnamen starten und in der Warteschlange bestätigen. Keine JavaScript-Fehler. Syntaxprüfungen und git diff --check erfolgreich. Nicht auf einem echten Handy geprüft.

## v277 – Schatten an linken und rechten Bildrändern vollständig

Der Schattenausschnitt war unabhängig von Fensterbreite, Zoom und Kamerablick auf eine feste Größe begrenzt. Deshalb wurden insbesondere Zaun- und Baumschatten mitten im sichtbaren Bild abgeschnitten. Die Schattenkamera umfasst jetzt die sichtbare Bodenfläche und hohe Schattenwerfer; ihre Mitte rastet weiterhin auf Schattentexel. Der bisherige lokale Ausschnitt bleibt als Mindestgröße erhalten, Blickrichtungen über den Horizont werden nicht unbegrenzt erweitert.

Geprüft: 144 Abdeckungsprüfungen über Hochformat, Quadrat und Breitbild, zwei Blickrichtungen und drei Kamerapositionen; der Regressionstest scheitert mit der alten Kameraberechnung. Syntaxprüfung und git diff --check erfolgreich. Vorher-/Nachher-Aufnahmen in Chromium nach abgeschlossenem Laden bestätigen die zusätzliche Schattenabdeckung links und rechts; keine JavaScript-Fehler. Nicht auf einem echten Handy geprüft.

## v276 – Arbeitsprinzipien in `CLAUDE.md`
**Wunsch Bennet:** Die Hinweise aus dem Repo `andrej-karpathy-skills` (nach Prüfung auf Schadcode: nur Text, keine Skripte) für Claude einbinden.

**Lösung:** Neuer Abschnitt „Arbeitsprinzipien“ am Ende von `CLAUDE.md`: vier Regeln (erst denken, Einfachheit, chirurgische Änderungen, Ziele überprüfbar machen), sinngemäß übernommen und auf Logistika zugeschnitten. Ausdrücklich: Bei Widerspruch haben Bennets feste Regeln Vorrang. Kein Spielcode geändert; `sw.js` zählt nur die Version hoch.

**Geprüft:** Nur Textdatei geändert, keine Spielfunktion betroffen; nichts im Testbrowser nötig. **Nicht geprüft:** Wirkung auf das Verhalten von Claude – das zeigt sich erst in späteren Sitzungen.

## v275 – Hofzaun beim Schwenken besser sichtbar

Die nur 0,04 Einheiten tiefen Querlatten werden in schräger Ansicht sehr schmal und sind beim Schwenken teilweise kaum noch sichtbar. Der Hofzaun erhält 0,09 × 0,09 starke Querlatten und 0,12 breite Pfosten, auch nach der Reparatur und beim weißen Zaun. Die absichtlichen Schäden des morschen Startzauns bleiben gleich. Andere Zäune behalten ihre Standardprofile. Geprüft: Chromium-Aufnahmen vor/nach der Änderung beim Schwenken nach links und rechts; keine JavaScript-Fehler. Die 21 vorhandenen Jagd-/Modelltests und Syntaxprüfungen bestehen. Nicht auf einem echten Handy geprüft.

## v274 – Lückenloser Gebietsnebel, Gebäudedrehung und runde Navigation

### Gebietsnebel

Die weichen Kanten der Sperrrechtecke wurden auch nach innen ausgeblendet. Dadurch entstanden helle Nähte an aneinanderliegenden Flächen. Die Kante läuft jetzt nur nach außen weich aus; innerhalb des gesperrten Gebiets bleibt die Nebelstärke vollständig erhalten. Die Freischaltanimation bleibt bestehen. Geprüft: Vorher-/Nachher-Aufnahmen in Chromium aus zwei Blickwinkeln, sechs aktive Sperrflächen, keine JavaScript-Fehler; Kantenberechnung für volle Deckung und weichen Außenrand geprüft. Nicht auf einem echten Handy geprüft.

### Gebäude in alle vier Richtungen drehen

Der Drehen-Button wechselte bisher nur zwischen 0° und 90°. Jetzt folgen 90°, 180°, 270° und nach dem vierten Klick wieder 0°. Vorschau und fertiges Gebäude nutzen dieselbe Drehung; rechteckige Stellflächen tauschen Breite und Tiefe nur bei ungeraden Vierteldrehungen. Bauplatz-Stapel, Lkw-Ausrichtung, Hallenwachstum und Personal-Wegecache berücksichtigen die vier Richtungen. Vorhandene Ausrichtungen 0/1 bleiben erhalten. Geprüft in Chromium: vier Drehungen eines bestehenden Auftragsbretts samt Bestätigen, rechteckige Hallenmaße und Speichern/Neuladen bei 270°. Syntaxprüfung der geänderten Skripte erfolgreich. Nicht auf einem echten Handy geprüft.

### Runde Ecken am Auswahlbereich

Die dunkle Navigationsleiste unten rechts hatte eckige Außenkanten. Der gesamte Auswahlbereich erhält 18 px abgerundete Ecken; Inhalte werden an der Rundung abgeschnitten. CSS-Cache und Service-Worker-Version aktualisiert. Geprüft: Chromium auf Desktop- und Mobilbreite, Navigation weiterhin bedienbar. Nicht auf einem echten Handy geprüft.

## v273 – Luckybox: Gewinn auf Plakette statt Lichtstreifen
**Wunsch Bennet:** Der „Lichtstrahl“ am Gewinnerfeld sitzt noch nicht sauber – je Gewinn einzeln anpassen (Screenshot beim Goldenen Bulli).

**Ursache:** Das Gewinnerfeld wurde als gefüllter Keil vom Zentrum bis zum Rand hervorgehoben. Bei schmalen Feldern (Goldener Bulli 14°) wurde daraus ein dünner heller Streifen, und das Symbol blieb winzig.

**Lösung** (`lucky3d.js`, `winMesh`, `highlight`):
- Kein gefüllter Keil mehr, nur ein dünner Rahmen um das Feld in heller Tönung der Seltenheitsfarbe.
- Das Gewinnsymbol wächst in 0,35 s auf eine runde Plakette (Scheibe in der Seltenheitsfarbe mit hellem Ring) und wird größer (0,5 statt 0,2–0,42). Lage und Größe ergeben sich aus dem jeweiligen Feld – ein schmales Feld bekommt dieselbe Plakette wie ein breites. Bei „Bewegung reduzieren“ sofort, ohne Animation.
- Die anderen Felder bleiben abgedunkelt.

**Geprüft (Testbrowser):** Goldener Bulli (schmal), Insider-Tipp (episch), Trinkgeldkasse (gewöhnlich), Empfehlungsschreiben (selten), keine Konsolenfehler. **Nicht geprüft:** am Handy.

## v272 – Luckybox: Lichtschein am Gewinnerfeld ruhiger
**Wunsch Bennet:** Den Lichtschein anpassen (Screenshot vom Rad nach dem Stopp).

**Ursache:** Das Gewinnerfeld wurde mit einem hellen Weißanteil und zusätzlichem Leuchten (`glow`) gezeichnet und wirkte wie ein weißlicher Schleier; die Farbe der Seltenheit war kaum noch zu sehen. Dazu kamen viele Funken direkt am Zeiger.

**Lösung** (`lucky3d.js`): Feld in der kräftigen Farbe der Seltenheit mit nur leichtem Verlauf, Rahmen und Trennstege in einer hellen Tönung derselben Farbe statt Weiß, Leuchten stark gedämpft (0,04–0,10 statt 0,25–0,45), weniger Funken (2 + 2 je Seltenheitsstufe statt 6 + 3). Sonst unverändert.

**Geprüft (Testbrowser):** Rad nach dem Stopp bei epischem Gewinn, goldene Box, keine Konsolenfehler. **Nicht geprüft:** am Handy.


## v271 – Luckybox-Testbühne (`index.html?test&lucky`)
**Wunsch Bennet:** Eine Testansicht, auf der man das ganze Luckybox-System kurz durchprobieren kann.

**Lösung** (neue Datei `luckytest.js`, CSS-Block v271):
- **Aufruf:** Nur mit `?test&lucky` in der Adresse. Testmodus mit eigenem Spielstand (`logistika.test.v3`), der echte Spielstand bleibt unberührt. Ohne `lucky` tut die Datei nichts.
- **Testfirma:** Fehlt im Test-Spielstand noch eine Firma, legt „Testfirma anlegen“ sie an. Der Hof-Rundgang wird dabei übersprungen.
- **Status:** Wartende Boxen (normal/golden), unterbrochener Gewinn, Zahl der Öffnungen, Serie, letzte Gewinne mit Seltenheit, aktive Wirkungen, ob der Goldene Bulli schon in der Flotte ist (dann gibt es den Jackpot).
- **Boxen:** +1 normal, +1 golden, +1 Bonus (Sonderfahrt), +10 gemischt, alle entfernen.
- **Nächster Gewinn festlegen:** Zufall, eine Seltenheit oder ein bestimmter Preis.
  - Gilt nur für die eine Ziehung beim Antippen, die Füllkacheln im Band bleiben zufällig.
  - Chancen und Preise im Spiel bleiben unverändert.
- **Darstellung:** „Bewegung reduzieren“ simulieren, ohne WebGL 2 (Band statt 3D), Ton an/aus, Serie ±1 Tag oder auf 0. Dafür fragt `lucky.js` die Testbühne ab (`lbTest`).
- **Fertige Abläufe:**
  - Goldene Box bei kurzer Serie (Herkunft ≠ Fortschritt).
  - 15 Boxen am Stück (mit „Animation überspringen“).
  - Schließen, während das Rad dreht.
  - Seite neu laden, während das Rad dreht (danach zeigt die Testbühne den gespeicherten Gewinn).
- **Chancen prüfen:** 20 000 Ziehungen je Boxart mit der echten Ziehung, Soll/Ist-Tabelle.
- **Hinweise:** Was am Handy zusätzlich zu prüfen ist – Querformat, Safari-Leisten, schnelles Mehrfachtippen, echte iOS-Einstellung „Bewegung reduzieren“.
- **Bedienung:** Einklappbar, dann bleibt unten links der Knopf „🧪 Luckybox-Test“. Einstellungen gelten für die Sitzung (sessionStorage).

**Geprüft (Testbrowser):**
- Keine Testbühne bei `?test` ohne `lucky` und im echten Spiel; echter Spielstand unverändert.
- Testfirma anlegen.
- Boxen geben.
- Festgelegte Seltenheit (Legendär) und festgelegter Preis kommen, die Füllkacheln bleiben gemischt.
- Ohne WebGL 2: Band.
- Simuliertes „Bewegung reduzieren“: Karte nach < 1 s, keine Kamerafahrt.
- Goldene Box bei kurzer Serie: „Herkunft … 7 Tage“ / „2 Tage in Folge“.
- Chancen-Tabelle nahe Soll.
- Schließen beim Drehen: einmal gutgeschrieben.
- Neuladen beim Drehen: Gewinn gespeichert und danach gezeigt, ohne neue Box.
- Einklappen.
- Keine Konsolenfehler.

**Nicht geprüft:** am Handy.

## v270 – Luckybox: räumliche Kiste mit Innenraum, zusammenhängender Ablauf, eigene Symbole, mobiles Layout
**Wunsch Bennet** (vier Handy-Screenshots):
- Kiste räumlicher und sauberer.
- Echter Innenraum.
- Weiches Licht statt hartem Kegel.
- Kiste → Rad → Karte als ein Ablauf, kürzer, mit „Animation überspringen“.
- Lesbares Rad.
- Einheitliche Symbole.
- „Nächste Box öffnen“ nicht mehr abgeschnitten, Serientexte korrekt.
- Logik und Zustände absichern.

**Ursache (im laufenden Spiel nachgeprüft, Testbrowser):**
- **Kiste:**
  - Frontal, mit zu starkem Licht (Sonne 1,3-fach): Metall lief weiß aus.
  - Der Korpus war ein voller Quader, das Stahlband ein durchgehender Block – geöffnet sah man eine Fläche statt eines Innenraums.
  - Der Lichtkegel war ein Kegelstumpf mit harten Kanten.
- **Ablauf:**
  - Die Kiste sank ab und schrumpfte, das Rad fuhr aus 5,5 Einheiten Tiefe hoch.
  - Bis zur Karte vergingen ≈ 7,6 s (legendär ≈ 10 s).
  - Die Aufladefarbe verriet die Seltenheit vorab.
- **Layout:**
  - Feste Höhen (Bühne 370 px) und Zentrieren mit `margin:auto` – auf dem Handy rutschte der Knopf unter die Browserleiste.
- **Zustände:**
  - Beim Neuladen mitten im Öffnen war die Box verbraucht, der Gewinn aber weg.
  - Ohne WebGL maß das Band die Kachelbreite während seiner Einblend-Animation (skaliert) und hielt bis zu 1,5 Kacheln neben dem Gewinn (Fehler seit v266).

**Lösung:**
- **Kiste** (`lucky3d.js`, neu aufgebaut):
  - Ruhige Dreiviertelansicht, gedämpftes Licht (Deckflächen hell, Front mittel, Seite dunkel), abgestufte Farben: dunkler Korpus, Rahmen, dunklere Beschläge, Messing-Emblem. Nur schmale Glanzkanten sind hell.
  - Keine deckungsgleichen Flächen mehr (Bänder, Beschläge und Stahlband liegen versetzt) – kein Flimmern.
  - Weicher Bodenschatten als Verlaufsbild.
  - Goldene Box mit gleichem Aufbau in warmem Messing.
- **Innenraum:**
  - Boden und vier Wände mit Wandstärke, dunkler Innenboden, eigene Innenfarbe. Das Stahlband liegt außen auf.
  - Deckel als Schale mit sichtbarer Unterseite, Drehpunkt genau an der hinteren Scharnierkante (Scharniere sichtbar), keine Durchdringung.
  - Öffnung als gedämpfte Feder (≈ 0,6 s, ein kleines Nachschwingen).
- **Licht und Funken:**
  - Beim Aufladen leuchtet nur die Deckelfuge, in der Farbe der **Box** (normal kühl, golden warm) – der Gewinn wird nicht verraten.
  - Geöffnet leuchtet der Innenboden, darüber ein weicher, nach oben und zur Seite auslaufender Lichtschein (Verlaufsbild, additiv, durch die Wände verdeckt).
  - Kleine, verschieden große Funken mit kurzer Lebenszeit, die meisten an der Öffnung.
- **Ablauf:**
  - Antippen (kurzes Nachgeben) → Aufladen → Deckel öffnet → Kamerafahrt nach oben zum Rad. Das Rad steht auf derselben Mittelachse hinter der Kiste und taucht im Licht aus dem Dunkel auf.
  - Danach: Drehen → kurzer Halt mit hervorgehobenem Gewinnerfeld → Karte.
  - Normale Box ≈ 4,8–5,3 s bis zur lesbaren Karte, goldene ≈ 5,4–5,9 s. Die Drehdauer ist je Boxart gleich, nur der Halt danach ist bei Episch/Legendär etwas länger.
  - Alle Abläufe laufen nach echter Zeit (auch bei niedriger Bildrate im Takt).
  - „Animation überspringen“ (wenn weitere Boxen warten) steht im Aktionsbereich und zeigt sofort das schon gezogene Ergebnis.
- **Rad:**
  - Feldgrößen weiter genau nach Gewinnchance.
  - Kurz beschleunigen, gleichmäßig, stetig abbremsen, endet genau im Feld (±28 % um die Mitte), kein Nachrücken.
  - Der Zeiger liegt vor dem Rad und schlägt bei jedem Stift (= Feldgrenze) dezent aus. Klick dazu, höchstens alle 55 ms.
  - Ruhige Lampen.
  - Symbole so bemessen, dass sie in schmale Felder passen.
  - Der Name unter dem Rad zeigt das Feld unter dem Zeiger, nach dem Stopp eindeutig den Gewinn.
- **Symbole** (`lbIcon` in `lucky.js`):
  - Zwölf eigene Canvas-Zeichnungen (z. B. Empfehlungsschreiben = Brief mit rotem Siegel, Goldener Bulli = goldener Kleinbus) mit gleicher Strichstärke.
  - Identisch auf Rad, Band, Anzeige und Karte, keine Emojis mehr.
- **Layout** (`style.css` Block v270):
  - Overlay so hoch wie die sichtbare Fläche (`visualViewport` → `--lb-h`, folgt Browserleisten und Drehen), Safe Areas.
  - Spalte aus Kopf, Chancen, flexibler Bühne und Aktionsbereich mit fester Höhe – die Knöpfe verschieben sich bei der Enthüllung nicht und sind kurz gesperrt.
  - Reicht die Höhe nicht, scrollt nur das Overlay.
  - Querformat: Bühne links, Rest rechts.
- **Gewinnkarte:**
  - Passt sich der Bühne an, lange Namen trennen an der Wortfuge.
  - Strahlen nur bei Episch/Legendär, kleiner, sie klingen aus. Ruhiger Hintergrund.
- **Serie:**
  - „Herkunft dieser Box“ (Grund und Tag) und „Aktueller Serienfortschritt“ sind getrennt benannt.
- **Zustände** (`lucky.js`):
  - Der Gewinn wird beim Antippen genau einmal gezogen und mit der entnommenen Box gespeichert (`S.lucky.pending`).
  - Angewendet wird er genau einmal (`lbSettle`) – beim Enthüllen, Überspringen oder Schließen.
  - Nach Neuladen zeigt das nächste Öffnen diesen Gewinn ohne neue Box. Der Ziele-Chip und das Regal zählen ihn mit (`goals.js`).
  - Jede Öffnung hat eine Kennung, alte Zeitgeber und Rückrufe laufen ins Leere.
  - Beim Schließen enden Zeitgeber, Schleife, Klänge und der WebGL-Kontext.
  - Ein schneller Doppeltipp öffnet keine weitere Box.
- **Bewegung reduzieren:**
  - Keine Kamerafahrt, kein Drehen, keine Blitze, Funken oder Vibration – kurze Überblendung zur Karte (≈ 0,35 s).
- **Ohne WebGL 2:**
  - Band mit gleichem Bewegungsprofil und den neuen Symbolen. Die Messung ist jetzt korrekt.
- **Engine** (`gl3d.js`):
  - Aufkleber können unbeleuchtet sein, einen Farbfaktor tragen und additiv leuchten, ohne die Deckkraft zu verändern.
  - Abwärtskompatibel (Hof mit alter und neuer Engine: 8 von 126 000 Pixeln verschieden, nur animierte Stellen).
- **Unverändert:** Chancen (55/28/13/4 bzw. 25/40/27/8), Preise und Wirkungen (`rollPrize`, `applyPrize`).

**Geprüft (Testbrowser Chromium/SwiftShader, Playwright, mit virtueller Uhr):**
- **Abläufe:**
  - Normale und goldene Box, je Seltenheit: Gewinn genau einmal gezogen, Mehrfachtipp verbraucht genau eine Box, Belohnung genau einmal angewendet.
  - Rad steht auf dem Gewinn, Anzeige = Karte.
  - Karte bei 4,8–5,3 s (normal) bzw. 5,3–5,8 s (golden) plus 0,3 s Auftritt.
- **Unterbrechungen:**
  - Überspringen während des Drehens: gleiches Ergebnis, Knopf „Nächste Box“ kurz gesperrt.
  - Schließen in jeder Phase (Aufladen, Öffnen, Drehen, Halt, Karte): Gewinn einmal, nichts bleibt offen, die nächste Box öffnet normal.
  - Alte Rückrufe ändern die nächste Box nicht.
  - Neuladen beim Drehen.
- **Varianten:**
  - Reduzierte Bewegung.
  - Ohne WebGL 2: Band hält mittig auf dem Gewinn.
  - Ton aus = keine Klänge, Ton an = gedrosselte Klicks.
- **Leistung:**
  - Zwölf Boxen nacheinander: je Öffnung eine Schleife und eine Zeichenfläche, danach wie vorher, JS-Heap stabil (12–18 MB).
- **Layout:**
  - Geprüfte Größen: 430 × 759, 390 × 664, 375 × 553, 320 × 480, 844 × 390, 667 × 320 und 768 × 1024.
  - Kiste und Zeiger ganz im Bild, Karte passt, Knopf „Nächste Box öffnen“ ganz sichtbar. Bei 320 × 480 und 667 × 320 ist er per Scrollen erreichbar, bei 667 × 320 trotzdem ganz sichtbar.
  - Aktionsbereich ohne Sprung.
  - Höhenwechsel 664 → 740 → 600 → 664 (Leisten): Overlay folgt.
- Keine Konsolenfehler. Unit-Tests wie bisher (nur `axe` und `trees` schlagen fehl).

**Nicht geprüft:**
- Auf einem echten iPhone oder Safari, also auch nicht die echten dynamischen Safari-Leisten.
- Echte Bildrate auf dem Handy.
- Vibration.

## v269 – Große Lagerhalle verdoppelt jedes Lager, Halle 10 × 6 nach Maß
**Wunsch Bennet:** „Alle Lager einzeln verdoppeln. Demnach bitte die Größe der Lagerhalle ingame anpassen.“ (Klarstellung zu „100 % mehr“ aus v267.)

**Ursache:** In v258/v267 gab die Halle jedem Lager einen festen Zuschlag (drei bzw. sechs Ausbaustufen). Das ist keine Verdopplung, und spätere Ausbauten zählten nicht mit.

**Lösung:**
- **Verdopplung je Lager** (`farm.js`, `farmdata.js`):
  - `FHALL.mult` 1 ersetzt `FHALL.steps`. Neu `farmStoreCapBase(st)`: Platz ohne Halle (Grundstock, Ausbau, Etappe, Sägewerk, Fischerei-Gebäude). `farmStoreCap` = Grundplatz + `farmHallBonus(st)`, und der Bonus ist der Grundplatz selbst.
  - Gilt für Silo, Scheune, Holzplatz, Kühl- und Köderkiste, sofort auch für schon gebaute Hallen.
  - Beispiele auf Stufe 1: Silo 60 → 120, Scheune 40 → 80, Holzplatz 30 → 60, Kühlkiste 24 → 48, Köderkiste 60 → 120.
  - Jeder Ausbau zählt doppelt: Silo +80 statt +40. Der Ausbauknopf im Lagerfenster zeigt das (`farmHallK`).
  - Ladentext: „Verdoppelt jedes Lager … – auch jeden späteren Ausbau.“
  - **Achtung:** Bei wenig ausgebauten Lagern gibt die Halle jetzt weniger als der feste Zuschlag aus v267 (Silo Stufe 1: 300 → 120), ab höheren Stufen mehr (Silo Stufe 10: 660 → 840).
  - Was schon über der neuen Grenze liegt, bleibt im Lager; es kommt nur nichts mehr dazu, bis wieder Platz ist.
- **Größe passend dazu:**
  - Die Halle belegt 10 × 6 Kacheln, so groß wie alle fünf Lager zusammen.
  - Neue Hallen tragen ihre Größe in `o.sz`.
- **Modell nach Maß statt vergrößert** (`FM.lagerhalle(w, d)`, `farmmodels.js`):
  - Wände, Dach (gleiche Neigung), Lichtband und Lüfter richten sich nach der Kachelgröße. Die 10 × 6-Halle ist höher (3,0 statt 2,2).
  - Tür, Fenster, Schild und Paletten behalten ihre echte Größe.
  - Ab 10 Kacheln Breite: zwei Rolltore mit je einer Rampe, Mittelstütze, drei Fenster je Giebel.
  - 6 × 4 sieht aus wie bisher. Die Schildhöhe in der Hofansicht ist 5,0.
- **Bestehende Hallen** (`farmHallGrow`, einmalig mit Merkmal `S.farm.hall269`):
  - Ohne `o.sz` gilt die alte Größe: 6 × 4, bzw. 8 × 5, wenn v267 schon geladen war (`S.farm.hall267`).
  - Die Halle wächst um ihre alte Fläche herum, möglichst mittig, auf 10 × 6. Ist dafür kein Platz, wächst sie auf 8 × 5, sonst behält sie ihre Größe.
  - Nichts wird überdeckt oder verschoben, die Verdopplung gilt in jeder Größe.

**Geprüft (Testbrowser):**
- Neue Halle: 10 × 6 auf einem frischen Hof platzierbar. Alle fünf Lager verdoppelt; Silo-Ausbau 120 → 200.
- Lagerfenster: „Davon +100 Plätze durch die Große Lagerhalle“, Knopf „Silo ausbauen: +80 Plätze“.
- Migration:
  - alte 6 × 4 mit Platz → 10 × 6;
  - v267-Halle 8 × 5 → 10 × 6;
  - nur seitlich zwei Spalten frei → 8 × 5;
  - rundum bebaut → bleibt 6 × 4.
  - Jeweils ohne Überlappung.
- Bilder der Hofansicht in allen drei Größen. Keine Fehler in der Konsole.

**Nicht geprüft:** am Handy.

## v268 – Luckybox in 3D: Kiste und Glücksrad, im Stil des Spiels
**Wunsch Bennet:**
- Die Luckybox-Bühne soll natürlich auch zum Spiel passen.
- Kiste und „Glücksrad“ (das laufende Gewinnband) sollen 3D-Modelle sein, im Farb- und Zeichenstil von v266.

**Lösung:**
- **Neue Datei `lucky3d.js`:** 3D-Bühne mit der eigenen Engine `gl3d.js`, wie Hof und Büro, ohne fremde Bibliothek.
  - **Transportkiste** in den Farben von v266: dunkler Navy-Korpus, helle Metallecken, Stahlband, Nieten, Emblem „L“. Die goldene Box ist schwarz-gold mit Stern.
  - **Ablauf der Kiste:** Sie schwebt und dreht sich leicht. Beim Aufladen ruckelt der Deckel, aus der Fuge leuchtet das Licht Stufe für Stufe bis zur Seltenheitsfarbe, mit Funken. Dann springt der Deckel auf, eine Lichtsäule steigt hoch, die Kiste sinkt ab.
  - **Glücksrad** fährt hoch: Jedes Feld ist ein Preis mit seinem Symbol.
    - Die **Feldgröße entspricht genau der Gewinnchance** (Chance der Seltenheit ÷ Anzahl der Preise dieser Seltenheit). Bei der normalen Box sind gewöhnliche Felder 49,5° groß, seltene 25,2°, epische 15,6° und der Goldene Bulli 14,4°; die goldene Box hat ihre eigenen Größen.
    - Das Rad zeigt also ehrlich, was `rollPrize` zieht, und bleibt auf dem gezogenen Preis stehen.
    - Rand mit Stiften, ein Zeiger, der bei jedem Feld federnd ausschlägt und klickt, Lauflichter, Ständer, Emblem auf der Nabe.
    - Unter dem Rad steht der Name des Felds am Zeiger. Am Ende blinken die Lampen in der Seltenheitsfarbe, danach kommt die Gewinnkarte (v266) vor dem abgeblendeten Rad.
  - **Ohne WebGL 2** bleibt automatisch die Bühne aus v266 (Kiste und Band in HTML).
- **Mehr im Stil des Spiels (`style.css` Block v268):**
  - Titel mit Tuschekontur wie die übrigen Fenster.
  - Kräftige dunkle Umrisse an Gewinnkarte, Symbolkreis, Seltenheitsschild, Knöpfen, Serienleiste und Chancenbalken.
- **Unverändert:** Chancen, Preise und Wirkungen. Schließen während des Drehens schreibt den Gewinn gut (v266).

**Geprüft (Testbrowser Chromium mit SwiftShader):**
- Normale Box (episch, legendär) und goldene Box (selten): Bildfolgen zu, Aufladen, Rad dreht, Rad steht, Karte.
- Feldgrößen nachgerechnet; das Rad blieb jedes Mal auf dem gezogenen Preis stehen.
- Ohne WebGL 2 (abgeschaltet): Bühne aus v266, das Band endet auf dem Gewinn.
- Keine Konsolenfehler.

**Nicht geprüft:**
- Am Handy (Bildrate, Akku).
- Die Töne (im Testbrowser ohne Ton).

## v267 – Große Lagerhalle: doppelter Nutzen und größer auf dem Hof
**Wunsch Bennet:** Die Lagerhalle soll mehr Nutzen bringen – 100 % mehr Lagerplatz – und auf dem Hof ggf. größer sein.

**Lösung:**
- **100 % mehr Platz durch die Halle** (`FHALL.steps` 3 → 6, `farmdata.js`). Sie gibt jedem Lager so viel wie sechs statt drei Ausbaustufen:
  - Silo +240 statt +120, Scheune +180 statt +90.
  - Holzplatz +150 statt +75, Kühlkiste +96 statt +48, Köderkiste +240 statt +120.
  - Gilt sofort auch für schon gebaute Hallen. Ladentext angepasst.
- **Größer auf dem Hof:**
  - Die Halle belegt 8 × 5 statt 6 × 4 Kacheln. Das Modell wird gleichmäßig vergrößert (Faktor 1,29, `FM.lagerhalle(w, d)`), das Namensschild sitzt höher.
  - Eine schon gebaute Halle wächst beim Laden einmalig (`farmHallGrow`, Merkmal `S.farm.hall267`) um ihre alte Fläche herum, möglichst mittig, wenn dort Platz ist. Ist ringsum alles bebaut, behält sie 6 × 4 (`o.sz`) – nichts wird überdeckt oder verschoben, der Lagerbonus gilt trotzdem voll.

**Geprüft (Testbrowser):**
- Neue Halle: 8 × 5, Silo 60 → 300 Plätze, Scheune 40 → 220.
- Alte Halle mit Platz: wächst um eine Kachel nach links.
- Alte Halle mit Nachbarn ringsum: bleibt 6 × 4 und überlappt nichts.
- Hof-Bild vorher/nachher.

**Nicht geprüft:** am Handy.

## v266 – Luckybox: seriöser und mehr Belohnungsgefühl
**Wunsch Bennet:** Das Öffnen der Luckyboxen leicht seriöser gestalten und mit mehr „Dopamin-Ausschuss“ für den Spieler.

**Vorher (Screenshot und Testbrowser):**
- Comic-Geschenk mit dicken Umrissen, große bunte Chancen-Kacheln und eine weiße Gewinnkarte.
- Zwischen Antippen und Gewinn passierte wenig: kurzes Wackeln, dann lief das Band per CSS-Übergang ohne Klang und Rückmeldung.
- Wer während des Bandlaufs schloss (Escape, Zurück), verlor den Gewinn: Die Box war schon verbraucht.

**Lösung (`lucky.js` Abschnitt „Öffnen“, `style.css` Block v266):**
- **Ruhiger, hochwertiger:**
  - Dunkle Bühne, kleine Kopfzeile („Tagesbelohnung“, „Serienbelohnung“, „Bonus“), Titel mit Metall- bzw. Goldverlauf.
  - Gewinnchancen dezent als schmaler Balken mit vier Spalten, aber immer sichtbar.
  - Statt des Geschenks eine Transportkiste mit Metallrahmen, Stahlband, Nieten und Emblem; die goldene Box ist schwarz-gold mit Stern.
- **Aufladen:** Nach dem Antippen ruckelt die Kiste immer stärker. Aus der Fuge dringt Licht, das Stufe für Stufe bis zur Farbe des Gewinns steigt (hell → grün → violett → gold), mit steigenden Tönen und kurzen Vibrationen. Dann springt der Deckel auf, mit Blitz.
- **Band:**
  - Eigene Bewegung statt CSS-Übergang.
  - Leises Klicken je Feld, das Feld unter der Markierung leuchtet; epische und legendäre Felder schimmern.
  - Am Ende rastet das Band mittig ein. Bei Episch und Legendär läuft es etwas länger.
- **Enthüllung:**
  - Fanfare je Seltenheit, Blitz in der Seltenheitsfarbe, Strahlenkranz (ab Selten).
  - Die Karte dreht sich herein, das Symbol springt auf; Geldbeträge zählen hoch.
  - Funken (Gewöhnlich, Selten) bzw. Konfetti (Episch, Legendär); bei Legendär Goldregen und ein kurzes Beben.
  - Der Knopf erscheint nach einer kurzen Pause, damit man den Moment sieht.
- **Fortschritt:** Unten die Serie mit sieben Feldern bis zur goldenen Box. Das ist nur eine Anzeige, die Regeln sind unverändert.
- **Fehler behoben:** Schließen während des Öffnens schreibt den Gewinn jetzt gut (mit Hinweis), statt ihn zu verlieren.
- **Unverändert:** Chancen, Preise und Wirkungen (`rollPrize`, `applyPrize`, `LUCKY_ODDS`), das Regal im Ziele-Fenster und das Konfetti im Auktionshaus.
- **Töne** nur bei eingeschaltetem Spielton (`S.farm.snd`). „Bewegung reduzieren“ kürzt alles; Karte und Knopf erscheinen sofort.

**Geprüft (Testbrowser Chromium, 390 × 844):**
- Bildfolgen (zu, Aufladen, Band, Gewinn, Karte) für Gewöhnlich, Selten, Episch und Legendär sowie für die goldene Box.
- Escape mitten im Band: Gewinn gutgeschrieben, nächste Box bleibt.
- Kopfzeile „Bonus“ bei der Sonderfahrt-Box.
- „Bewegung reduzieren“: Ablauf in rund 3 Sekunden fertig.
- Keine Fehler in der Konsole.

**Nicht geprüft:**
- Am Handy (Vibration gibt es unter iOS im Browser ohnehin nicht).
- Töne (im Testbrowser ohne Ton).

## v265 – Jagd: größere Toleranz für tödliche Schüsse am Träger
**Wunsch Bennet:** Schüsse gingen teils direkt durch den Hals, und das Tier wirkte nur leicht verletzt.

**Ursache (Code gelesen, nachgemessen):**
- Die Trägerzone des Hirschs war eine Kette aus fünf Kugeln (Radius 0,095) auf einer Linie am Nacken.
- Der gezeichnete Hals ist bis zu doppelt so tief: Kehle, Brunftmähne und Stich (Brustansatz vor dem Blatt).
- Gemessen mit Strahlen von der Seite durch die Silhouette des Halses:
  - nur 35 % Trägerschuss,
  - etwa 40 % „vorbei“ (die Kugel ging durch den sichtbaren Hals, ohne zu zählen),
  - etwa 10 % Weichschuss („Getroffen – aber kein guter Schuss“). Am Halsansatz traf der Strahl zuerst die Rumpf-Ellipse.
- Beim Keiler fehlte die Zone für Kehle und Stich unter dem Träger.

**Lösung (`hunt.js`, Treffertest `zoneHit`):**
- **Hirsch:** Der Träger ist jetzt eine Röhre aus 12 Abschnitten mit elliptischem Querschnitt (`deerNeckZones`, `rayTube`).
  - Gebaut aus derselben Profiltabelle wie das Modell (`NECK`, `deerNeckInto`), mit halber Mähne und 6 % Zugabe.
  - Sie dreht mit dem Hals mit (Äsen, Sichern).
- **Keiler:** Kugeln am Träger etwas größer (0,12 → 0,13) und neu der Stich (Ellipsoid unter dem Träger).
- **Durchschuss:** Trifft der Strahl zuerst die Decke und dahinter Träger oder Stich, zählt das als Trägerschuss statt als Weichschuss.
- **Vorrang:** Herz und Lunge haben auf dem ganzen Strahl Vorrang. Ein Schuss durch den Trägeransatz ins Herz bleibt Herzschuss (Medaille bis Diamant).
- **Etwas mehr Toleranz:**
  - Hirsch: Lunge 0,12 → 0,135, Herz 0,07 → 0,08, Haupt 0,11 → 0,12.
  - Keiler: Lunge 0,11 → 0,125, Herz 0,06 → 0,07.
- **Bewusst unverändert:**
  - Äser, Rüssel, Geweih und Borstenkamm bleiben ohne tödliche Zone (real kein sauberer Schuss bzw. nur Haar).
  - Keulen, Bauch und Rücken bleiben Weichschuss, die Läufe Laufschuss.
  - Medaillen-Deckel unverändert (Trägerschuss höchstens Gold).

**Geprüft:**
- **Messung von der Seite, sichtbarer Hirschhals:**
  - Vorher: 35 % Träger, 7 % Lunge, 4 % Herz, 42 % vorbei, 11 % Weichschuss.
  - Nachher: 75–78 % Träger, 7–11 % Lunge, 4–6 % Herz, 0–1 % Haupt, 7 % vorbei (äußerer Mähnensaum), 0 % Weichschuss. Gleiches Ergebnis bei vier Halshaltungen; insgesamt über 90 % tödlich.
- **Bilder der Seitenansicht vorher/nachher** für Hirsch und Keiler.
- **Im Revier (Testbrowser) mit gezeichneten Tieren auf 204 m:** Strahlen vom Hochsitz durch Punkte der Halsoberfläche (echte Weltmatrix) sind beim äsenden Hirsch zu 84 %, beim Keiler zu 81 % tödlich. Der Rest liegt am äußersten Rand oder hinter Lauf bzw. Rumpf.
- **Unit-Tests:** `hunt` (21, neuer Test „Träger v265“), `camp`, `forest`, `jail` bestanden; `axe`, `trees` wie bisher rot.

**Nicht geprüft:** am Handy; ein echter Schuss über das Zielfernrohr mit Schwanken und Wind.

## v264 – U-Haft nach dem Todesfall im Büro
**Wunsch Bennet:** Die Festnahme und Untersuchungshaft nach dem tödlichen Tassenwurf (v263) über die vorhandene Haft-Mechanik umsetzen.

**Ausgangslage:** `S.jail` (`snus.js`, Zelle in `jail.js`) kannte nur den Snus-Fall. Dauer (`SNUS_JAIL_DAYS` = 14), Texte („Zivilfahnder“, „Mr. Snus meldet sich wieder“) und die Zelle („Du verbüßt eine Haftstrafe“, „Das war's wert. Fast.“) waren fest darauf zugeschnitten.

**Lösung:**
- **`snus.js`:** `S.jail` kennt jetzt die Art `kind: "uhaft"` mit eigener Dauer `days`. Alte Spielstände ohne `kind` bleiben der Snus-Fall.
  - `jailUhaft()` merkt die Festnahme beim Todesfall vor (`state: "pending"`, gespeichert). Mehrere Opfer in derselben Szene kommen in denselben Vorgang.
  - `jailCheck()` wartet, bis die Ich-Perspektive zu ist, und zeigt dann die Festnahme. Neuladen oder vorzeitiges „Verlassen“ umgeht sie also nicht.
  - **Festnahme:** Tatvorwurf Körperverletzung mit Todesfolge (§ 227 StGB), Haftbefehl wegen Fluchtgefahr, Vorführung beim Ermittlungsrichter am nächsten Tag, Haftprüfung vom Anwalt beantragt.
  - **U-Haft:** 16 Tage (`UHAFT_DAYS`). Vorführung am nächsten Tag plus mündliche Haftprüfung binnen zwei Wochen nach Antrag (§ 118 Abs. 5 StPO). Sie läuft im Schnelldurchlauf wie bisher: Kosten laufen weiter, Büros mit Personal arbeiten.
  - **Haftprüfung:** Haftverschonung gegen Auflagen (§ 116 StPO: Meldepflicht zweimal pro Woche, Reisepass abgegeben). Das Strafverfahren läuft weiter, wird aber nicht nachgespielt. Gezeigt werden Kontostand, Aufträge ohne dich und das betroffene Team.
- **`jail.js`:** `JAIL3D.open(host, { days, kind, where })` mit eigenen Texten für die U-Haft (`TIPS_U`, `SAY_U`, ohne Verharmlosung). Dazu Schild „U-HAFT“ und Ort „Untersuchungshaft · Standort“.
- **`officefp.js`:**
  - Nach dem Todesfall ruft die nächste Person nach dem Notarzt. Etwa 8 Sekunden später kommt „Die Polizei ist da. Du wirst festgenommen.“, nach weiteren 3 Sekunden wird das Büro geschlossen.
  - Fehler behoben: Schloss die Festnahme das Büro mitten im Bild, lief die Figurenschleife noch weiter.
- **`jail.test.js`:** neuer Test für die U-Haft-Texte.

**Geprüft (Testbrowser Chromium/SwiftShader):**
- Todesfall → Hinweis → Büro schließt → Festnahme → Zelle mit 16 Tagen → Haftprüfung → „Zurück an die Arbeit“ (`S.jail` leer).
- Vorzeitiges Verlassen und Neuladen mit vorgemerkter Festnahme führen ebenfalls zur Festnahme.
- Die Snus-Haft ist unverändert (14 Tage, „Gefängnis“, „Entlassen“).
- Unit-Tests `camp`, `forest`, `hunt`, `jail` (7) bestanden; `axe`, `trees` wie bisher rot.

**Nicht geprüft:** am Handy.

## v263 – Büro: Kaffee abstellen, anbieten, werfen · Tätigkeiten der Figuren realistisch
**Wunsch Bennet:**
1. Kaffee überall abstellen, dem Personal anbieten und bei Interesse übergeben.
2. Tasse werfen: Sie zerspringt, der Kaffee liegt 5 Spielminuten an der logischen Stelle. Wird eine Person getroffen, stirbt sie sofort mit sichtbarer Verletzung.
3. Nachgereicht per Screenshot: Schreiben, Telefonieren und Kaffeetrinken der Figuren wirkten unrealistisch.

**Ursachen (Code gelesen, im Testbrowser nachgestellt, Vorher-Bilder):**
- **Abstellen:** Eine Tasse in der Hand ließ sich nur an ihren Schrankplatz zurückstellen oder in die Kaffeemaschine; andere Ablagen gab es nicht.
- **Arme gestreckt:** Tastatur und Maus lagen 40 cm, der Block 16 cm und der Bildschirm 82 cm von der Tischkante. Die Figur sitzt 20 cm hinter der Kante, deshalb mussten die Arme fast ganz durchgestreckt werden.
- **Hände:** Jede Hand war nur ein flaches Oval mit Daumenkugel, ohne Finger, ohne Griff und ohne Handgelenk-Ausrichtung.
- **Stift:** Er hing schräg am Handoval, die Spitze traf das Papier nicht.
- **Telefon:** Der Ellbogen stand seitlich ab.
- **Tasse:** Ein Zylinder mit Klötzchen, an einem festen Punkt neben der Hand. Sie kippte kaum, und der Kopf blieb starr.

**Lösung – Kaffee (`officefp.js`, `officekitchen.js`):**
- **Ablageflächen** (`room.surf`):
  - Flächen: Schreibtische, Arbeitsplatte (Kaffeemaschine, Mikrowelle, Wasserkocher und Hahn bleiben frei), Küchentisch, Fensterbank, Empfangstheke (Bürogebäude) und Boden.
  - Ein Ring zeigt die Stelle, „Hier abstellen“ stellt die Tasse ab, der Henkel zeigt nach rechts.
  - Nicht möglich auf Tastatur, Maus, Block, Papieren, Telefon, dem eigenen Becher und dort, wo die Unterarme arbeiten.
  - Auf dem Boden nicht in Möbeln und nicht unter den eigenen Füßen; man läuft um Tassen auf dem Boden herum.
  - Abstand zu anderen Tassen, Reichweite 2,4 m, freie Sicht.
  - Neue Lage `free` bleibt beim Etagenwechsel erhalten.
- **Anbieten:** Mit Kaffee in der Hand und höchstens 1,35 m Abstand erscheint „Kaffee anbieten“; über den Tisch hinweg heißt es „Näher ran zum Übergeben“. Die Person entscheidet nachvollziehbar:
  - Absage, wenn sie telefoniert oder gerade ihren eigenen Becher in der Hand hat.
  - Absage, wenn sie vor weniger als 90 Spielminuten schon einen bekommen hat.
  - Absage, wenn sie keinen Kaffee trinkt (fest je Person, etwa jede Siebte).
  - Abends ab 20 Uhr sagen die meisten nein; bei vollem Tisch ebenfalls.
  - Nach einem Todesfall sagen alle nein.
  - Sonst bedankt sie sich, nimmt die Tasse mit der Hand auf deiner Seite am Henkel, trinkt einen Schluck und stellt sie auf ihren Tisch.
  - Keine Wirkung auf Stimmung oder Geld.
- **Werfen** („Tasse werfen“, zweiter Knopf):
  - Flugbahn mit Schwerkraft, gezielt über das Fadenkreuz.
  - Prüft Wände, Decke, Boden, Möbel, offene Küchentüren, Stuhllehnen, Kopf, Oberkörper und Beine.
  - Die Tasse zerspringt beim ersten Aufprall: Scherben in Tassenfarbe (Henkel als Ganzes), Spritzer und Klirren (nur mit Ton an).
  - Aus der offenen Tasse schwappt im Flug Kaffee.
- **Logische Stelle des Kaffees:**
  - Waagerechte Fläche: Lache dort.
  - Wand, Möbelfront, Decke oder Person: Fleck mit Laufspuren an der Trefferstelle, Lache auf der höchsten Fläche darunter (z. B. Hängeschrank → Arbeitsplatte, Wand → Boden).
  - Größe nach Füllmenge; auf Teppich zieht er ein (kleiner, dunkler).
  - Kaffee und Scherben verblassen nach 5 Spielminuten (`S.time`) und bleiben bis dahin auch über einen Etagenwechsel liegen.
- **Treffer an Beinen:** „Au! Spinnst du?!“, sonst schauen alle zur Stelle und jemand fragt, was los ist.
- **Treffer an Kopf oder Oberkörper:** Die Person stirbt sofort (wie gewünscht).
  - Ablauf: kurzer Ruck vom Aufprall, dann seitlicher Sturz vom Stuhl auf den Boden (in Wurfrichtung, sonst zur freien Seite). Ist beides verstellt, sackt sie im Stuhl zusammen.
  - Sichtbare Verletzung: Platzwunde mit Rinnsal am Kopf bzw. durchgeblutete Kleidung. Dazu Blutlache, geschlossene Augen, keine Atmung.
  - Becher, Telefon, Maus und Block bleiben auf dem Tisch.
  - Das Team erschrickt: Hände vor den Mund, Blick zur Person; die nächste Person ruft nach dem Notarzt.
  - Antippen der Person: „… ist tot.“
- **Folgen im Spielstand** (wie Ausscheiden in `offices.js`, ohne Abfindung):
  - Die Person wird aus `b.staff` entfernt, ein fest zugeteiltes Fahrzeug verliert den Fahrer.
  - Stimmung −40.
  - Meldung „Todesfall im Büro“ im Diensthandy.
  - Gespeichert wird sofort.
- **Keine Migration nötig:** Die Küchenzustände sind wie bisher nur Sitzungszustand.

**Lösung – Tätigkeiten (`officefp.js`):**
- **Ergonomischer Schreibtisch:** Bildschirm etwa eine Armlänge vor den Augen, Tastatur und Maus 15–20 cm von der Kante, Becher hinter der Maus, Telefon links, Block rechts. Die Ellbogen bleiben gebeugt und am Körper.
- **Hände** (`handMesh`, `GRIPS`):
  - Daumen und vier zweigliedrige Finger; Griffe: Tippen, Maus, Stift, Henkel, Telefon, flach, offen, Ruhe.
  - Jede Hand hat einen Kontaktpunkt (Fingerkuppe, Stiftspitze, Henkel, Telefonmitte) und eine eigene Drehung.
  - Der Arm rechnet bis zum Handgelenk (`ARM_B` neu 0,211), die Hand setzt dort ohne Lücke an.
- **Schreiben:** Block mit den Fingerspitzen heranziehen, Stift vom Block nehmen (Dreipunktgriff, Spitze auf dem Papier), Zeile für Zeile mit kleinen Buchstabenschleifen und angehobenem Stift zwischen den Wörtern. Danach Stift ablegen und Block zurückschieben; der Blick folgt der Stiftspitze.
- **Telefonieren:** Handy mit links vom Tisch nehmen, Display an der Wange, Ellbogen nach vorn unten. Der Kopf neigt sich zum Telefon, der Blick wandert, die rechte Hand bleibt an der Maus.
- **Trinken:** Becher wie in der Küche (Henkel, Rand, Kaffee). Henkel greifen, anheben, Rand an die Lippe, Becher kippt, Kopf geht leicht zurück, kurz die Augen zu. Danach vor der Brust halten, bei längerer Pause ein zweiter Schluck, abstellen.
- **Tippen und Maus:** Fingerkuppen auf den Tasten, ab und zu ein Blick auf die Tastatur. Die Maus bleibt dort liegen, wo die Hand sie loslässt.
- **Lesen:** Linke Hand hält das Blatt, der Blick wandert die Zeilen hinunter.
- **Logik:** Nach dem geschenkten Kaffee greift die Person nicht sofort zum eigenen Becher.

**Geprüft (Testbrowser Chromium/SwiftShader, Unit-Tests):**
- **Abstellen:** auf Schreibtisch und Boden.
- **Anbieten:** über das Fadenkreuz angenommen, Tasse landet auf dem Tisch der Person (Füllung 0,88); ein zweites Angebot wird abgelehnt.
- **Wurf gegen den Hängeschrank:** Fleck dort, Lache auf der Arbeitsplatte darunter.
- **Wurf auf den Tisch:** Lache auf der Tischplatte.
- **Nach +5 Spielminuten:** alle Spuren weg.
- **Kopftreffer:** Sturz, Personal 6 → 5, Meldung, Stimmung 100 → 60, Ruf nach dem Notarzt.
- **Rumpftreffer bei verstellten Seiten:** Zusammensacken.
- **Bürogebäude mit Etagen** (Empfangstheke als Ablage, Etagenwechsel mit Kaffeelache) **und kleines Büro mit Nischenküche:** ohne Fehler.
- **Tätigkeiten:** Vorher-/Nachher-Bilder aus drei Blickwinkeln.
- **Unit-Tests:** `camp`, `forest`, `hunt`, `jail` bestanden; `axe` und `trees` schlagen wie bisher fehl.

**Nicht geprüft:**
- Am Handy.
- Mit echtem Spielfluss über längere Zeit.
- Der Klirr-Ton (im Testbrowser ohne Ton).

## v262 – Jagd: Liegeposen, Bergungsansicht, mehr Fasane
**Bestätigte Ursachen (Code gelesen, im Testbrowser nachgestellt, Vorher/Nachher-Bilder):**
- **Liegepose (`calcDead`, v135):** Jeder Lauf wurde nach festen Winkeln bis zu ±1,45 rad zur Seite gedreht, bis irgendein Punkt den Boden berührte. Daraus wurden steif parallel gestreckte Hinterläufe, Vorderläufe übereinander und beim Keiler oben liegende Läufe, die 69° über der Schulter abstanden. Es gab keine Prüfung von Lauf gegen Lauf oder Lauf gegen Rumpf. Für den Boden zählte nur jede dritte Modellecke.
- **Hals:** Der Träger blieb in der Ruhepose fast senkrecht zum Rücken. Liegt das Stück auf der Seite, ragt er quer ab, und das Haupt wurde über eine Drehung um die Halsachse zum Boden gezwungen. Das ergab den eingeschnürten, abgeknickten Übergang.
- **Fasan:** Die angezogenen Ständer stachen mit gespreizten Zehen aus dem Bauch. Der angelegte Flügel war ein einzelnes helles Oval und wirkte am liegenden Vogel wie ein Deckel. Beim Abschuss im Flug drehte sich der Vogel frei und sprang am Boden in die Liegepose.
- **Liegendes Stück:** Ohren zuckten und der Wedel schlug weiter.
- **Geweih:** Doppelte Augsprosse (4 %) und abnorme Sprosse (2,5 %) werden gezeichnet, aber im Namen nicht mitgezählt. Ein „12-Ender“ trug so sichtbar 7 Enden an einer Stange.
- **Erzeugung:** Der Fasan-Flugtimer prüfte keine Tiergrenze, und fliegende Fasane kreisten mit ihrem Kurvenanteil im Feld, ohne es zu verlassen. Im Test waren bis zu 5 Flieger und 5 Tiere gleichzeitig unterwegs. Während der Bergung lief der Timer weiter (−30 s) und löste danach sofort aus. Die Artenwahl stand als Zahlen im Code (58/34/8 %).
- **Bergungskamera:** Die Freisicht-Prüfung rechnete mit festem Abstand. Beim Fasan verwarf ein ferner Baum die Bauchseite, und die Kamera schaute von hinten, mit dem Kopf hinter dem Körper. Nach dem Wischen lief die Anfahrt weiter, und die Kamera pendelte leicht.

**Lösung (`hunt.js`, eigene WebGL2-Engine, Low-Poly-Stil unverändert):**
- **Neue Liegepose:** `POSE`, `calcDead`, `inTorso`, `legSamp`, `legPt`, `poseRnd`, `headParts`, `mat3`.
  - Gelenkwinkel je Lage (unten oder oben, vorn oder hinten) aus einer Tabelle, je Stück leicht verschieden (fest aus Erbgut und Güte) und an anatomische Grenzen geklemmt: Vorderfußwurzel beugt nur nach hinten, Sprunggelenk nur nach vorn.
  - Der Lauf wird nur so weit abgespreizt, bis er Boden, Rumpf oder einen schon liegenden Lauf berührt: unten liegende zuerst, oben liegende ruhen darauf.
  - Der Rumpf wird exakt über die Querschnittsprofile (`TORSO`, `BOAR_T`, `PH_T`) geprüft, der Boden über alle Ecken.
- **Hals und Haupt:** Der Träger ist nach vorn gestreckt (Verlängerung der Rückenlinie). Das Haupt wird über eine begrenzte Suche abgelegt (Biegung, Drehung und Neigung, grob und fein).
  - Haupt, Geweih, Lauscher und Waffen dürfen weder Boden noch Rumpf noch Läufe durchdringen.
  - Trägt das Geweih, darf das Haupt eine Handbreit angehoben liegen, sonst liegt es auf.
  - Der Hirsch hat eine eigene Kopfdrehung (`head.rz`).
  - Der Keiler legt Haupt und Waffen über Seitenschwenk und Drehung ab, der Fasan den Hals über eine leichte seitliche Biegung.
- **Übergänge:**
  - Das Zusammenbrechen läuft für Rumpf, Läufe, Träger und Haupt von der aktuellen Lage aus mit derselben Kurve.
  - Der Fasan dreht sich im Fallen zur Seitenlage und legt die Flügel an. Am Boden folgt der Rest über „fall“, ohne Sprung.
  - Am liegenden Stück zucken weder Ohren noch Wedel, und es atmet nicht.
- **Fasan:**
  - Neue Bauteile: angelegte Schwingen (Decken und spitze Handschwingen, zum Rumpf hin kupferfarben), Flugflügel mit Arm und Hand, ein eingekrallter Ständer für Flug und Liegen.
  - Die Flügel öffnen und schließen am Ansatz.
  - Start aus dem Stand mit weichem Steigen, dann fester Abflugkurs mit leichtem Pendeln.
  - Neu ist der Einflug vom gegenüberliegenden Waldrand mit Gleitflug, Abfangen und Landung: Die Ständer strecken sich, die Flügel klappen ein. Die Landung erfolgt nur, wenn am Boden Platz ist, sonst startet der Fasan durch.
  - Stehend reichen die Zehen jetzt bis zum Boden.
- **Geweih:** Die gemeinsame Zählung `antSides` gilt für Modell und Name. Gespeicherte Texte älterer Trophäen bleiben unverändert, Werte und Preise auch.
- **Erzeugung:**
  - Zentrale Gewichte `SPECIES_W = { hirsch: 45, keiler: 30, fasan: 25 }`.
  - Flugtimer `FLY_FIRST` 25–45 s, `FLY_NEXT` 45–75 s.
  - Gemeinsame Grenzen `LIMIT` (2 am Boden, 1 in der Luft, 3 insgesamt) für normales Wild und Flugereignisse.
  - Beide Uhren laufen nur beim Ansitzen. Ist kein Flug möglich, folgt ein neuer Versuch nach 6–12 s.
  - Kein Tier wird entfernt. Der Wildbestand hat Vorrang. Güte, Erbgut und Seltenheit würfeln unverändert.
- **Bergung:**
  - Der Liegeplatz ist innen matter und weniger grell, mit Übergang in die Wiese: Die Tageszeit bleibt erhalten.
  - Ein enger, dunkler Kontaktschatten liegt unter den Auflagestellen.
  - Flach gedrücktes Gras liegt nur außerhalb des Umrisses.
  - Die Kamera schaut etwas steiler (Schalenwild 0,64, Fasan 0,72), damit sich die Läufe trennen. Der Fasan darf näher heran.
  - Die Freisicht wird mit dem echten Kameraabstand geprüft.
  - Nach dem Wischen bleibt die Ansicht stehen.
- **Ergebniskarte:** Die Seltenheit steht nur noch oben im Band, in der Karte nur als Wertzuschlag. Lange Namen brechen um (CSS-Block v262).

**Geprüft:**
- **Unit-Tests** (`hunt.test.js`, neu bzw. erweitert):
  - Liegepose für alle drei Arten, beide Seiten, 3 Größen und 4 Erbgut-Varianten: Boden, Gelenkgrenzen, Lauf ↔ Lauf, Lauf ↔ Rumpf, Haupt und Geweih ohne Durchdringung, Haupt liegt auf oder wird vom Geweih getragen, gleiche Pose bei gleichem Stück.
  - Geweih: Modell und Name zählen dieselben Enden (alle Endenzahlen, alle Formen).
  - Artenwahl mit 12 000 festen Ziehungen (Abweichung unter 1,2 Punkten).
  - Alle Jagd-Tests grün; camp, forest, jail grün; axe und trees wie bisher rot.
- **Testbrowser** (Chromium mit SwiftShader, 390 × 844, echtes Spiel):
  - Vorher/Nachher-Bergungsbilder für Hirsch, Keiler und Fasan in beiden Liegerichtungen, klein und groß, dazu besondere Varianten.
  - 20 Minuten simulierter Ansitz, bei dem ein „Jäger“ Bodenwild nach 90 s entnimmt:
    - vorher 11 Fasane (10 Flüge), bis zu 5 Flieger gleichzeitig, 6 508 Messpunkte mit Grenzverletzung;
    - nachher 24 Fasane (20 Flüge, 4 am Boden), Flugabstände 45–72 s, nie mehr als 2/1/3 Tiere;
    - 120 s Bergung ohne neue Tiere, danach erscheint nichts auf einmal;
    - dreimaliges Wiederbetreten mit Timer im ersten Fenster und genau einer Oberfläche.
  - Einflug mit Landung und Abschuss im Flug als Ablauf (Lage und Höhe ohne Sprung).
- **Nicht geprüft:** echtes iPhone/Safari, Bildrate auf dem Handy.

## v261 – Vertragsangebote im Diensttelefon seltener
**Frage:** Kommen die Rahmenvertrags-Angebote zu oft – wurde das heute geändert? **Nein**, an den Angeboten wurde heute nichts geändert (v255–v260 betreffen sie nicht).

**Ursache:** Es gibt zwei Wege zu einem Vertragsangebot. Der tägliche Zufallsvertrag war begrenzt (ab Level 4, höchstens 2 bzw. 3 laufende Verträge, 4–7 Tage Pause, kein offenes Angebot). Der Weg über Stammkunden (`kundenOnSpawn`, ab 5 Lieferungen) hatte **keine** dieser Grenzen: je Kunde einmal, aber bei mehreren Stammkunden kamen Angebote gleichzeitig und hintereinander (wie um 13:52 im Screenshot).

**Lösung:** gemeinsame Bremse `contractMayOffer()` (`goals.js`) für beide Wege; ein Stammkunden-Angebot setzt dieselbe Pause (4–7 Spieltage, `S.contractNext`). Sonst unverändert (Vertragsinhalt, Preise, 24-h-Frist).

**Geprüft:** Testbrowser: 400 Aufträge von lauter Stammkunden ab 5 Lieferungen → vorher 40 Angebote gleichzeitig, jetzt 1 und danach rund 7 Tage Pause. Der tägliche Zufallsvertrag nutzt dieselbe Bremse, aber nicht gesondert über Tage getestet. **Nicht geprüft:** iPhone/Safari.

## v258 – Große Lagerhalle für den Hof
**Wunsch:** eine große Lagerhalle kaufen und auf dem Hof platzieren, die Lagerplatz für Hof, Sägewerk und Fischerei bringt.

**Umsetzung:**
- Neues Gebäude „Große Lagerhalle“ (`lagerhalle`, 6 × 4 Kacheln) im Hof-Laden unter „Gebäude“, ab Erbe-Level 5, 5.000 €, einmal je Hof (`FSHOP_HOF`, `FSIZE`, `FUNLOCK_HOF` in `farmdata.js`). Wird wie die anderen Gebäude platziert, gedreht und per langem Druck verschoben; nur auf dem Hof.
- Platz: je Lager so viel wie drei Ausbaustufen – Silo +120, Scheune +90, Holzplatz +75, Kühlkiste +48, Köderkiste +120 (`FHALL`, `farmHallBonus` in `farm.js`, eingerechnet in `farmStoreCap`). Gilt auch für Lager, die erst später dazukommen (Kühl- und Köderkiste mit der Fischerei). Die Ausbaustufen der einzelnen Lager bleiben unverändert; Trophäen (Jagd) sind nicht dabei.
- Antippen öffnet das Lager mit allen Reitern. Im Lagerfenster steht, wie viele Plätze die Halle beiträgt – vor dem Kauf ein Hinweis auf die Halle im Laden.
- 3D-Modell im Hof-Stil (`FM.lagerhalle` in `farmmodels.js`): Stahlhalle mit Trapezblech, flaches Satteldach mit Lichtband und Lüftern, Rolltor mit Warnstreifen und Vordach, Laderampe mit Paletten, Seitentür mit Lampe, Fenster; das Schild zeigt die fünf Lager (Ähre, Ei, Stamm, Fisch, Wurm). Bildchen im Laden aus demselben Modell (`shopModel` in `worldview.js`).
- Hofwert +4.000 € (`FBUILD_VAL`); in der Ich-Perspektive im Sägewerk zählt die Halle als hohes Gebäude (`fpsaw.js`).
- Spielstände: nichts zu migrieren – ohne Halle bleibt alles wie bisher.

**Geprüft:** Playwright/Chromium (SwiftShader, 420 × 800): Laden zeigt die Halle ab Level 5, Kauf zieht 5.000 € ab, Platzieren und Bestätigen auf freier Fläche, alle fünf Lager wachsen um die genannten Plätze, danach „Maximum erreicht 1/1“, Antippen öffnet das Lager mit Hinweiszeile, Speichern und Neuladen behalten Halle und Plätze; Hofwert steigt. Bilder der Halle im Hof. Unit-Tests wie bisher. **Nicht geprüft:** echtes iPhone/Safari.

## v257 – Büro in der Ich-Perspektive: lebendiges Personal, Küche an der Wand, Mitarbeiter des Monats
**Bestätigte Ursachen (Code gelesen, im Testbrowser gemessen bzw. gesehen):**
- Hüpfen: `step()` setzte jede Figur 7-mal pro Sekunde um bis zu 4 mm hoch (`n.y = |sin(7t)|·0,004`) und drehte sie um ±4,6° um die Hochachse. Gemessen am alten Stand: 3,7–3,9 mm Hub am Figurenursprung; neu 0 mm, 0°. Kopfwippen beim Gehen 2,5 cm → 1 cm (bei „Bewegung reduzieren“ 0).
- Steife Figuren: `FWM.person` ist ein einziges starres Netz (Hände auf den Oberschenkeln), nichts konnte sich bewegen. Stuhlsitz lag 3 cm über der Oberschenkel-Unterseite.
- Küche: Zeile stand 40 cm vor der Wand (`back = PZ(ky − 17)`), Sockel und Fronten lagen in derselben Ebene (Flimmern/Zickzack an der Front – keine Schattenfrage, die globalen Schatten bleiben unverändert), Hängeschränke ragten in den Kühlschrank, Kühlschrank mitten in der Zeile.
- Ressourcen: Wandbilder wurden bei Etagenwechsel neu angelegt, aber nie freigegeben. Alte Lade-Rückrufe prüften nur `O.alive` – nach schnellem Verlassen/Betreten liefen sie in die neue Sitzung.
- Antippen: kein Sichttest (durch Möbel hindurch ansprechbar), Reichweite 9 m.

**Lösung (`officefp.js`, eigene Engine, `FWM.person` für Hof/Wald unverändert):**
- Büro-Figur als Gliederpuppe: Becken/Beine (Becken auf dem Sitz, Füße am Boden), Oberkörper (Taille als Drehpunkt, Atmen, Vorbeugen), Kopf (Drehpunkt Hals) mit Lidern und Mund, je Arm Ober- und Unterarm mit Hand. Hände per Zwei-Gelenk-Rechnung an Tastatur, Maus, Block, Papiere, Telefon, Tasse.
- Aussehen aus `p.av` (Geschlecht, Haut, Haarfarbe und alle Frisuren, Augenfarbe, Bart, Brille/Cap/Mütze/Headset, Outfit), Hose/Schuhe/Tasse aus der festen Personal-ID – gleich auf jeder Etage und bei jedem Betreten. Namensschild in Rollenfarbe.
- Tätigkeiten je Person zeitversetzt und nach Rolle gewichtet: tippen, Maus, Unterlagen lesen, notieren (mit Stift), kurz telefonieren (mit Headset freihändig), Tasse nehmen und trinken, aufschauen. Spieler in der Nähe → gelegentlicher Blick; angesprochen → Kopf zum Spieler, Mund spricht. Kein Herumlaufen.
- Schreibtisch: Maus mit Pad rechts, Block mit Stift, Papierstapel, Telefon, Tasse; Bildschirm je Rolle mit echten Standortdaten (Fahrzeuge frei/unterwegs, Touren, Fahrerpool, Umschlag, Aufschlag, eigener Monatswert). Die kleine Kartenskizze ist reine Deko ohne Zahlen. Bildschirmbilder 256 × 160, Neuzeichnen nur bei geänderten Daten, höchstens alle 12 s.
- Küche im 60-cm-Raster an der hinteren Wand (`kitchenModules`, `kitchenX` in `offices.js`, auch der Grundriss zeigt die Module): Korpus 58 cm, 3 cm Luft für die Sockelleiste, Sockel 10 cm hoch und 6 cm zurückgesetzt, Fronten 18 mm mit 6-mm-Fugen, Arbeitsplatte bis an die Wand mit 3 cm Überstand, Spritzschutz, Hängeschränke 35 cm tief auf 1,42–2,10 m im selben Raster (nicht über Kühlschrank und Kaffeemodul), Flachschirmhaube über dem Herd, Hochschrank/Kühlschrank bündig am Ende mit Griff zur Zeile, Siebträger ganz auf der Platte mit Auslauf und Tasten nach vorn, darüber ein offenes Brett. Esstisch mit 1,2 m freier Fläche vor den Fronten. Kollision und Sichtprüfung passen dazu. Im Grundriss gleitet die Küche nur noch an der Wand entlang (gespeicherte Lage bleibt, nur die Höhe rastet ein).
- Poster „Mitarbeiter des Monats“ neben dem Whiteboard: Standort, Monat (Spielzeit, 30 Tage), Name, Rolle, Porträt (Avatar), Begründung; Antippen öffnet eine kleine Karte. Hinweis, wenn die Person versetzt wurde oder gegangen ist. Keine Prämie.
- Antippen: Strahl gegen Figur bzw. Poster, Sicht über Möbel-Kästen geprüft, Reichweite 6 m, sonst Hinweis („Zu weit weg …“, „Da steht etwas im Weg …“). Gesprächszeilen aus aktueller Tätigkeit und prüfbaren Fakten (eigener Monatswert, Fahrzeuge, Fahrerpool, Umschlag, Aufschlag, Stimmung, Auszeichnung, seit Tag N), der Reihe nach ohne direkte Wiederholung.
- Robustheit: `R.texFree` (neu in `gl3d.js`) gibt Bilder bei Etagenwechsel und Verlassen frei; Netze werden je Etage zwischengespeichert und freigegeben; Sitzungsmarke gegen alte Rückrufe; ändert sich das Team während die Ansicht offen ist, wird die Etage neu aufgebaut (Position bleibt); Statusleiste dunkel, beim Verlassen zurück; Joystick und Umsehen mit zwei Fingern unabhängig, verlorene Finger werden zurückgesetzt.

**Monatsauswertung (`offices.js`, `game.js`):** je Person `s.mo = { k, n, pk, pn }` (laufender und voriger Spielmonat). Gezählt: Disposition 1 je gestarteter Tour, Zoll 1 je betreuter Tour (wenn Zollkräfte da), Fahrpersonal 1 je abgeschlossener Fahrt (fester Fahrer, sonst Pool des Standorts), Umschlag 1 je Lade-/Entladevorgang am Standort. Verteilung innerhalb einer Rolle wie echte Arbeit (wer im Verhältnis zum Können am wenigsten hatte). Nach Monatsende Auswertung je Standort (`motmCheck`, aus `tickBases` und beim Betreten): jede Person im Verhältnis zum Schnitt ihrer Rolle im ganzen Unternehmen im selben Monat (sonst hätte Umschlag mit wenigen, großen Einzelschritten gegen die Disposition nie eine Chance – im Spieltest 4 Tage: 132 Touren disponiert, 131 Fahrten, 31 Umschlagvorgänge), Gleichstand → mehr Können → seltener schon ausgezeichnet (`b.motmWins`) → mehr Einsätze → länger dabei → Kennung. Niemand mit Einsätzen → „Diesmal niemand“. Ergebnis als Momentaufnahme in `b.motm` gespeichert. Ältere Spielstände/neue Standorte: Startmarke, erste Auszeichnung nach Ende des laufenden Monats. Funktionsname `motmCredit` (ein erster Entwurf hieß wie `staffCredit` aus `team.js` – im Test aufgefallen und umbenannt).

**Nicht vorhanden:** Einen Ablauf „Tasse nehmen / Kaffee kochen“ für den Spieler gab es in keinem Stand des Spiels – er wurde nicht erfunden. Küchentüren haben (wie bisher) keine Öffnungs-Animation; der Platz zum Aufschwingen ist frei gehalten.

**Geprüft:** Playwright/Chromium (SwiftShader, Desktop 960 × 600): Vorher/Nachher-Bilder (Küche vorn, links, rechts, oben, Sockel; Figuren seitlich und von vorn als Bildfolgen), Hub-Messung, Kontor (Nische, 2 bzw. 1 Person), Halle (Siebträger), Bürogebäude (Einbauküche, EG/1. OG), Konzernzentrale (36 Plätze), leeres Büro ohne Küche; Antippen nah/zu weit/verdeckt (künstliches Hindernis), Poster-Karte, Teamwechsel bei offener Ansicht, Etagenwechsel hin und zurück (gleiche Zahl an Netzen und Bildern), schnelles Verlassen/Betreten, Statusleistenfarbe; bestehende Unit-Tests (camp, forest, hunt, jail grün; axe und trees wie bisher rot). **Nicht geprüft:** echtes iPhone/Safari, echte Mehrfinger-Bedienung, Bildrate auf dem Handy.

## v256 – Tutorial-System mit Lina überarbeitet
**Gestaltung (alle Erklärungen sehen jetzt gleich aus):**
- Neue gemeinsame Karte `linaCardHTML` (`intro.js`) für Hof-Rundgang, Speditions-Einführung, Büro-/Snus-/Pablo-Gespräche und Rollen-Erklärungen: Lina als **Kopf-/Schulterporträt in der Karte** (statt einer abgeschnittenen Ganzkörperfigur daneben bzw. Figur + Wolke), Rolle und Kontext („Nachbarin · Hof-Rundgang“, „Disponentin · Einführung“ …), **„Schritt X von Y“** mit Balken, Titel, kurze Einordnung, Kasten **„Deine Aufgabe“** bzw. „So geht’s“, getrennter **Teilfortschritt** („1 von 3 Feldern geerntet“), Rückmeldung („✓ Geerntet! …“), Haupt- und Nebenaktion, ✕ zum Beenden.
- Fehlt `lina.png`, zeichnet `avatarSVG` ein Porträt (`linaFace`, `linaFaceFail` – auch für eine schon sichtbare Hof-Karte und offene Tipps).
- Hof: Karte unten über die Breite; **„Laden“, „Lager“ und der Gründen-Knopf sind während des Rundgangs ausgeblendet** (`body.ftut-on`). Liegt das Ziel unter der Karte, weicht sie aus (hoch: nach oben, quer: nach rechts; `farmTutPoint`). Ruhiger Ring + Finger statt springender Hand. Deckt die Karte das Ziel in beiden Lagen (kleine Schirme), schiebt die Kamera das Ziel einmal sanft in den freien Bereich (`farmTutNudge`) – nur solange der Spieler die Kamera seit dem Schrittwechsel nicht selbst bewegt hat. Niedrige Schirme: kompaktere Karte; im Querformat entfällt bei Mitmach-Aufgaben die Einleitungszeile.
- Spedition: dieselbe Karte im `#tutor`; hohe Ziele (ganze Auftragskarte) → Karte unten, damit Kopf und ⭐ sichtbar bleiben. Leuchtfenster etwas weniger dunkel, langsamer Puls.
- Kurz-Tipps mit demselben Porträt. CSS-Block „v256“ am Ende von `style.css` (44-px-Ziele, Safe Areas, Querformat, Desktop, kleine Schirme, `prefers-reduced-motion`).

**Texte:** Jeder Schritt nach dem Muster Einordnung → Handlung → Rückmeldung, Titel für alle Schritte und Gespräche (`TUT_STEPS`, `FTUT_HOF`, `TALK_TITLES`, `TALK_CTX`).

**Bestätigte Fehler und Korrekturen:**
- `farmTutShow`: Wiederholung trug zugleich `wait` und `free` (Finger sichtbar, obwohl nur „Weiter“) → ein Zustand (`farmTutMode`: info/task/finish/done).
- `farmTutSignal`: Schrittwechsel nach 650 ms ohne Prüfung → `farmTutAdvance` mit Rundgang-/Schritt-Kennung (`ftT`, `ftGen`); `farmTutNext(from)` ignoriert veraltete Aufrufe und Doppeltipps.
- `T.adv` blieb nach Speichern + Neuladen im Wechselmoment hängen → jedes weitere Signal wurde ignoriert, der Rundgang hing. Wird beim Laden zurückgesetzt; erreichte Aufgaben gehen direkt weiter.
- `hintBusy`: Tipps kamen über die Erklärseiten/den Abschluss des Hof-Rundgangs → warten jetzt, solange der Rundgang sichtbar ist (auch im Büro-Vollbild, in der Jagd).
- `probeGuideArt`: Hof-Figur und Tipps bekamen keinen Fallback → umgestellt.
- Kamera sprang bei jedem Teilfortschritt (z. B. nach dem 1. Feld) zum nächsten Ziel → nur noch beim Schrittwechsel.
- Wiederholung der Spedition-Einführung („Welt“) legte einen neuen bezahlten Übungsauftrag an → Wiederholung ohne Auftrag (`S.tut.replay`).
- Hof-Wiederholung hielt die Hofproduktion an (`farmTick`) → nur noch der erste Rundgang.
- Nach einer Hof-Wiederholung blieb `replay` gesetzt → Gieß-/Futter-Tipps kamen nie → wird beim Ende entfernt.
- `linaTalk`: auf dem Hof endlose Startversuche, mehrere Aufrufe stapelten Ketten → je Gespräch ein geplanter Versuch, begrenzt, alte Versuche nach Spielstandwechsel wirkungslos.
- Tipp-Warteschlange: ein vom Tutorial unterbrochener Tipp ging verloren (galt schon als gesehen) → kommt danach wieder; zu lange wartende Tipps verfallen, ohne als gesehen zu gelten.
- Bauernhaus-/„Welt“-Knopf überschrieb einen laufenden ersten Rundgang → geht dort weiter.

**Abläufe abgesichert:** Ziele gelten nur als erreichbar, wenn sie sichtbar, eingeblendet, nicht gesperrt und auf dem Bildschirm sind (`tutUsable`); fehlt ein Mitmach-Ziel länger als 1,5 s, gibt es „Weiter“ (Lina übernimmt). Hof-Aufgaben ohne Möglichkeit (kein reifes Feld, keine reifen Äpfel) oder nach 45 s ohne Fortschritt: „Schritt auslassen“. Beenden jederzeit über ✕ oder Esc mit kurzer Rückfrage (Folgen + Wiederholung unter „Welt“/im Bauernhaus); danach sind Sperrflächen, Klassen und Timer weg.

**Zugänglichkeit:** echte Buttons mit Beschriftung, `role="dialog"` (blockierend) bzw. `region` (Hof), Fokus auf die Karte/den Hauptknopf, sichtbarer Tastaturfokus, Schrittwechsel per `aria-live` (nur beim Wechsel), Tipps als `status`.

**Unverändert:** Pausenlogik der Spedition (Uhr steht in Einführung und Gesprächen), erster Hof-Rundgang hält den Hof an, Belohnungen, Aufträge, Spielstand-Migration (`T.v76`).

**Geprüft** im Testbrowser (Chromium, Software-WebGL): Hof-Rundgang mit Teilfortschritt, Doppeltipp, Rückfrage; Spedition vom Fahrzeug bis zur Annahme und zum Ende; Wiederholungen ohne Zusatzauftrag; fehlendes Ziel + Ausweg; Planer schließen; Doppelsignal; Esc; Büro-Gespräch, Rollen-Erklärung, Kurz-Tipp mit Unterbrechung; Neuladen im Wechselmoment; fehlende Lina-Grafik; 390 × 844, 375 × 667, 844 × 390, 1280 × 800. **Nicht auf einem echten iPhone/Safari geprüft.**
## v255 – Schatzkiste: Kamera gehört dem Spieler
- Ursache: Wischte man während der Truhen-Show weg, brach nur die Hinfahrt ab. Die Show merkte sich die alte Ansicht und flog ~2,6 s nach dem Aufspringen trotzdem dorthin zurück; die steile Show-Neigung blieb bis dahin aktiv. Beim Erscheinen eines Vogelschwarms schwenkte die Kamera ungefragt zur Fundstelle (nach 4 s ohne Berührung). Das Mausrad zählte nicht als Eingriff.
- Lösung (`worldview.js`): `trCamTaken` erkennt, dass der Spieler seit Beginn der Show die Kamera angefasst hat; `worldTreasureCamRelease` gibt sie dann sofort frei (kein Rückflug, Neigung gleitet in 0,4 s auf normal). Geprüft in der Hinfahrt (`worldTreasureCam`), während der Show (`stepTreasureReveal`) und vor dem Rückflug (`worldTreasureCamBack`). `worldTreasureIntro` bewegt die Kamera nicht mehr – hin geht es über den 🐦-Knopf. `farmview.js`: Mausrad setzt `FV.touchAt`/`FV.focusId` wie ein Wisch.
- Ohne Eingriff bleibt alles wie bisher: Kamera fährt zur Grube und nach der Show zurück.
- Geprüft im Testbrowser (echte Hof-Ansicht, Show direkt ausgelöst): ohne Eingriff Rückflug auf die alte Ansicht; mit Wisch während der Show bleibt die Kamera an der Stelle des Spielers, keine Sonderneigung mehr. Nicht auf dem Handy geprüft.
## v254 – Büro betreten (Ich-Perspektive)
- Neu: Knopf „🚪 Betreten“ links unten auf dem Grundriss jeder Standortkarte (`offices.js` `baseCard`, Bindung `[data-enter]`; „einrichten“ bleibt wie bisher).
- Nach einem Ladescreen (derselbe wie beim Hof: `ldMake`/`ldStart` aus `farmview.js`, eigene Texte, mindestens ~1,7 s) steht man in der Bürotür und läuft in der Ich-Perspektive durch den Raum.
- Neues Modul `officefp.js` (`OFFICE3D.enter`, `OFFICE3D.leave`): baut genau das, was der Grundriss zeigt – Bodenbelag mit Muster und Farbton, Wandfarbe, Fenster links, Tür rechts, Schreibtische mit Bildschirm und Stuhl, das Personal am Platz (Figuren wie auf dem Hof, `FWM.person`, Hemdfarbe nach Rolle), Küche je Ausbaustufe, Pflanzen, bei Hallen Stahlträger und Rolltor zum Hof, bei Bürogebäuden Treppe, Empfang und Etagenwahl. Whiteboard mit den echten Zahlen des Standorts, Firmenschild an der Wand.
- Steuerung: Joystick links (gehen), wischen (umsehen), Personal antippen (Name, Rolle, ein Satz); Desktop: WASD/Pfeile, Q/E drehen, Maus ziehen, Esc verlässt. Kollision mit Wänden und Möbeln.
- Solange man im Büro ist: keine Anrufe/Ereignisse (`uiBusy` erkennt `body.office3d`), Einblendungen ausgeblendet. Die Spielzeit läuft weiter.
- Icon-Links aus Bennets Upload übernommen (192, 512, Apple 180), alle auf v254 (das Apple-Icon stand auf v252).
- Geprüft im Testbrowser (Chromium mit Software-WebGL): Ladescreen, Umschlaghalle, Bürogebäude EG und 1. OG, Verlassen räumt auf. **Nicht auf dem Handy geprüft** (Bildrate und Touch-Steuerung auf echten Geräten offen).
## v253 – Versionen nach Icon-Upload vereinheitlicht, Übergabe abgelegt
- Ursache: Der Upload der neuen App-Icons brachte ältere Fassungen von `index.html` (Skripte auf `?v=250`) und `sw.js` (`v251`) mit. Handys hätten dadurch v251/v252 (Tipp-Schutz, Zeitung) eventuell nicht geladen.
- Lösung: Alle `?v=` in `index.html` und `manifest.webmanifest` sowie `VERSION` in `sw.js` auf v253. Die neuen Icons bleiben unverändert.
- Neu: `CLAUDE.md` (wird von Claude Code automatisch geladen: Regeln, Technik, aktueller Stand) und `docs/UEBERGABE.md` (Übergabe aus dem früheren Chat, Stand v245).
- Geprüft: `index.html` ist bis auf die Versionsnummern identisch mit dem Stand vor dem Upload. Nicht auf dem Handy geprüft.
## v252 – Zeitung im Diensthandy statt Einblendung
- Vergibt ein Kunde eine Ausschreibung an einen Mitbewerber, gibt es keine Einblendung mehr.
- Stattdessen erscheint eine sachliche Meldung im neuen Tab „📰 Zeitung“ des Diensthandys (Logistik-Kurier): Kunde, Mitbewerber, Strecke, Ladung, Auftragswert.
- Ungelesene Meldungen zeigt ein kleiner Zähler am Tab; das Handy klingelt dafür nicht. Meldungen bleiben 7 Tage, höchstens 40.
## v251 – Auftragskarten: Tipp-Schutz
- Eine Karte öffnet den Planer nur noch bei einem echten Tipp: Finger höchstens 6 px bewegt, kürzer als 0,6 s, Liste lief nicht mehr nach (350 ms) und hat sich währenddessen nicht bewegt.
- Schwung abbremsen, kurze Wischer und langes Halten öffnen keinen Auftrag mehr.
## v250 – Unterschrift bei Großaufträgen
- Aufträge über 100.000 € tragen unten rechts eine Unterschrift „i. A.“ mit Name, Funktion und Firma.
- Jede Firma hat eine feste, erfundene Person (Name und Funktion aus dem Firmennamen abgeleitet).
- Handschrift je Person individuell: eine von vier Schreibschriften, Neigung, Größe, Tintenfarbe, Namensform und Schwung.
## v249 – Auftragskarten: seriöser, persönlicher, klarer gegliedert
- Absenderzeile mit Firmen-Monogramm (Initialen, feste Farbe je Firma), Branche und Beziehungsstatus.
- Anfrage als ruhiges Zitat (drei Zeilen, ganzer Text in den Details).
- Route groß, darunter Eckdaten im Raster: Ladung, Strecke, Liefertermin, Fahrzeit, ggf. Angebot gültig / Vergabe.
- Hinweiszeilen (Verhandlung, Vertrag, Mission) zurückhaltender mit Akzentkante.
- Texte: einige Kundenanfragen freundlicher und verbindlicher formuliert; Hinweis bei fehlendem Fahrzeug und Verhandlungshinweis klarer.
- Keine Änderung an Logik, Preisen oder Abläufen.
## v248 – Fahrzeuge als 3D-Bildchen im Hof-Stil
- Neu `vehmodels.js`: Modelle für alle 48 Marktfahrzeuge plus Unimog-Holzlaster und goldenen T1, gebaut mit FM.MB wie die Hofmodelle.
- Gerendert über dasselbe Bildchen-System wie Silo- und Ladenwaren (`thumbSpan`/`thumbOf`): Sonne, weiche Schatten, Kontur, Kontaktschatten.
- Zu sehen in Markt, Flotte (lackierte Fahrzeuge in Firmenfarbe), Fahrzeugwahl im Planer, Auktionshaus, Hof-Fahrzeugliste und Tutorial.
- v246/v247: Markt innerhalb jeder Art nach Preis sortiert; Tiersymbol im Hochsitz entfernt.
## v245 – Aufträge auf Speditionsniveau: Kundenprofile, geprüfte Texte, Verhandlung, Ausschreibungen

### 1. Ursache der widersprüchlichen Texte
In v244 hingen Titel und Zitat nur an der Ladungsart (z. B. „Schüttgut → Geschichte Nr. 3“). Weder Verkehrsträger noch Menge noch Kunde flossen ein. Deshalb stand bei einem Bahnauftrag über 1,0 kt „Eine Schiffsladung voll“ und „Per Lkw wären es zehn Fahrten“. Außerdem kam die Einheit „kt“ aus `kgf`.

### 2. Neue Textkette (`kunden.js`)
Reihenfolge jetzt: **Auftragsdaten → passender Kunde → Text → Prüfung → Anzeige.**
1. `makeOrder` erzeugt Ladung, Gewicht und Route wie bisher. `pickShipper` ruft `custPick` auf: Gewählt wird nur ein Kunde, dessen Profil genau diese Ware in genau dieser Menge, Richtung und an diesem Ort plausibel verschickt (`custEligible`, `dirOk`).
2. `orderStory(o)` liest die tatsächlichen Routenvarianten (`buildVariants` → `orderModes`: Hauptlauf je Variante und alle Träger) und erzeugt mit `orderTexts` Titel, Anfrage, Menge, Einordnung, Mehrwert, Kapazität und Bedeutung.
3. `orderTextCheck` prüft vor jeder Anzeige: Verkehrsträger im Text ⊆ Verkehrsträger der Route (auch „Schiff“, „Güterwagen“ …), Kühlung nur bei Kühlware, Gefahrgut nur bei ADR, jede Mengenangabe = Auftragsgewicht, keine Platzhalter, keine Formfehler („..“, „von von“), Export-/Importtitel nur mit Seehafen, Kunde/Menge/Richtung passen zum Profil. Bei einem Fehler zeigt die Karte einen neutralen Sachtext (`orderTextSafe`) und zählt `TEXT_ERRORS`.
4. Mengen: Tonnen mit Tausenderpunkt (nie „kt“), Paletten/Pakete/Container/Stück je nach Ware, sehr große Palettenmengen in Tonnen. Bahn nennt Wagen (Schüttgut-, Kessel-, Flach-, Containertrag- oder Güterwagen), ab 40 Wagen „verteilt auf mehrere Züge“.
5. Orte mit richtiger Präposition (`placeOf`): „vom Hamburger Hafen“, „zum Flughafen BER“, „nach Dresden“, Berliner Bezirke ohne Abkürzung.
6. Mehrere mögliche Verkehrsträger werden als Wahl formuliert („Möglich ist der Transport per Bahn oder Binnenschiff – die Wahl überlassen wir Ihnen“), kombinierte Routen als „Die Route kombiniert … mit Umschlag unterwegs“.

### 3. Kundenprofile
64 Profile (57 Kunden und 7 neutrale Auffangprofile) mit Name, Branche, Kommunikationsstil (Konzern, Mittelstand, Familienbetrieb, Hafen, Klinik, Handel), Folgegeschäft (Liefervertrag, Folgeaufträge, Saison, Projekt), optionalem Heimatort, Hafenpflicht und Waren mit Einheit, Mengenbereich, Titelstamm, Zweck, Temperatur bzw. Gefahrgutklasse. Neu: Richtung für Container (Export zum Seehafen, Import aus dem Seehafen ins Hinterland, Seehafen zu Seehafen), Kerosin nur zum Flughafen, Massen-/Schwer-/Gefahrgut und Container am Flughafen nur über neutrale Profile (z. B. Baustoffe für eine Großbaustelle). Reale Firmennamen nur von Unternehmen, die schon vorher als Auftraggeber im Spiel vorkamen; die Texte behaupten keine bestehenden Verträge mit ihnen.

### 4. Kundenbeziehung
Neukunde → Bekannter Geschäftspartner (1–2 Lieferungen) → Stammkunde (ab 3: +3 %, mehr Verhandlungsspielraum, 25 % längere Angebotsfrist) → Bevorzugter Logistikpartner (ab 10: +6 %, noch mehr Spielraum, halb so viele Ausschreibungen, 50 % längere Frist). Mehr als 30 % verspätet: höchstens Stufe 1. Der Zuschlag wird einmal beim Erscheinen gezahlt (`kundenOnSpawn`), Texte ändern keine Vergütung. Kartendetail „Bedeutung“ zeigt, wie viele pünktliche Lieferungen bis zur nächsten Stufe fehlen. `kundenOnSpawn` läuft jetzt vor `rivalOnSpawn`, damit die Stufe Ausschreibung und Verhandlung beeinflusst.

### 5. Verhandlung (`vip.js`)
`negoModel(o)` statt Zufall (`rnd(1.05, 1.38)`): marktüblicher Spielraum +6 %, Express +6 % bzw. enges Zeitfenster +4 %, Volumen +2/+4 %, lange Strecke +2 %, Spezialladung +3 %, Stammkunde +3 %/+6 %, frühere Verspätungen −4 %, Konkurrenzangebot −5 %, dazu ein unbekannter Rest von ±2 % (internes Budget). Begrenzt auf +2 … +32 %. Der Planer zeigt alle Faktoren, eine Einschätzung (Spanne wird mit der Beziehungsstufe enger), ein Risiko-Label beim Schieberegler und den Deckungsbeitrag beim gewählten Preis. Verhandelbar: große Aufträge wie bisher (deterministisch 60 %) und Stammkunden ab halber Größe. Alte Aufträge mit Verhandlung bekommen den Spielraum nach dem neuen Modell.

### 6. Ausschreibungen
Begriffe getrennt: **Angebotsfrist** (wie lange das Angebot im Auftragsbuch steht), **Konkurrenzangebot** (es gibt tatsächlich einen Mitbewerber – die Simulation ist echt), **Vergabe** (Zeitpunkt, an dem der Kunde ohne Zusage an den Mitbewerber vergibt), **Liefervertrag** (Rahmenvertrag ab 5 Lieferungen). Karte: „Ausschreibung · Vergabe in 1 h 35 min · Mitbewerber: Blitzfracht“. Meldung bei Verlust: „Angebotsfrist abgelaufen: „Kunde“ hat an Blitzfracht vergeben.“

### 7. Geschäftsereignisse (Projekte)
Die Serien heißen jetzt Projekte: Neue Produktionshalle, Erntezeit, Großbaustelle, Hafenengpass (alle Fahrten ab demselben Hafen), Filialeröffnung, Betriebsumzug. Titel „Neue Produktionshalle (1/3): Betriebsausstattung zur neuen Halle“, Anfrage aus der Vorlage plus Menge und Route aus den Daten, ebenfalls geprüft. Laufende Serien aus v244 werden über Schlüssel bzw. Firmenname weitergeführt.

### 8. Auftragskarte (`game.js` `renderOrders`, `style.css`)
Feste Reihenfolge: **Kopf** (Ladungsart, Titel, Vergütung + ≈ Gewinn) · **Kunde** (Name, Status-Chip, Branche, Anfrage zweizeilig) · **Transport** (Route, Verkehrsträger-Symbole aus den echten Varianten, Menge, km, Lieferfrist, Fahrzeit, Angebotsfrist) · **Mehrwert** (Marken ohne Emojis) · **Details** zum Aufklappen (volle Anfrage, Auftragswert/Kosten/Gewinn, Ware, Kapazität inkl. Wagenzahl, Zeitfenster, Kunde, Bedeutung, Adressen). Weniger Emojis, auf 390 px geprüft.

### 9. Wirtschaft
Keine neuen Geldquellen: Stammkunden-Zuschläge unverändert (+3/+6 %), Verhandlungsspielraum im Mittel kleiner als vorher (vorher Zufall bis +38 %, jetzt typisch +6 … +20 %), Projektbonus unverändert.

### 10. Tests
- **Neu `auftraege.test.js`** (13 Tests, läuft wie die anderen aus einem `tests/`-Ordner): Profile vollständig; 15.000 Kombinationen aus allen Profilen × Waren × 5 Mengen × 8 Verkehrsträger-Situationen × 5 Beziehungsständen ohne einen Widerspruch; der ursprüngliche Fehlerfall (Bahn, 1.000 t: kein Schiff, kein Lkw-Vergleich, „rund 17 Schüttgutwagen“); Straßentext ohne Bahn/Schiff; eingeschmuggelte Widersprüche werden erkannt; 5.000 Zufallsaufträge wählen nur passende Kunden; Einheiten; Präpositionen; Beziehungsstufen; Zuschlag nur einmal; alte Aufträge; Projekttexte; Verhandlungsmodell.
- Browser (echte Spielfunktionen): 2.000 Aufträge über Etappe 1–6 mit typischen Flotten → 0 ersetzte Texte, 62 der 64 Profile kamen vor, rund 500 verschiedene Titel; Stichprobe von über 50 Aufträgen gelesen; 72 Spielstunden mit Annahmen, Ausschreibungen, Verhandlungen und einem Projekt ohne Fehler; Auftragskarten und Planer auf 390 px Breite angesehen.
- Bestehende Tests: camp, forest, hunt, jail grün; axe und trees schlagen wie schon auf `origin/main` fehl.

## v244 – Masterprompt V2: Wirtschaft, Fahrzeuge, Leasing raus, Etappen nach Fortschritt, Schiff in Etappe 2, persönlichere Aufträge

### 1. Analyse vorher (gemessen mit den echten Spielfunktionen, je 400 Aufträge)
Der Simulator (`makeOrder`, `buildVariants`, `assignFor`, `evaluate`, `evalFullCost`) misst, wie viel jeder Auftrag mit der eigenen Flotte netto bringt (Erlös − Fahrt, Leerfahrt, anteilige Fixkosten) und wie viele Aufträge überhaupt fahrbar sind. „Gute Aufträge“ = bestes Drittel.

| Spielstand (vorher v243) | fahrbar | gutes Drittel netto | Aufträge bis … |
|---|---|---|---|
| Etappe 1, Rad + Roller | 62 % | 161 € | Caddy 180, Sprinter 335 |
| Etappe 1, + Caddy | 97 % | 154 € | Sprinter 351 |
| Etappe 2, Transporter | 66 % | 224 € | Daily 348, Scania 571, Binnenschiff 6.027 |
| Etappe 3, Problemfall Lv 24 | 52 % | 648 € | Actros 225, Schwerlast 378, Schiff 2.083, Güterzug 3.704 |
| Etappe 3, angeschlagen (nur E-Sattelzug) | 19 % | 613 € | Sprinter 88 |

Befund: Fahrzeuge kosteten echte Neupreise, Aufträge zahlten echte Frachtraten. Ein Upgrade brauchte 150–600 gute Aufträge, ein Schiff über 1.000. Etappen kosteten zusätzlich 18.000 € bis 20 Mio. €. Leasing war der einzige Weg zu Fahrzeugen. Fast die Hälfte der Aufträge passte nicht zur Flotte (zu schwer, falscher Verkehrsträger, fehlende Spezialklasse).

### 2. Neue Preis- und Vergütungsstruktur (`data.js`)
- **Spielpreise** (`VEH_PRICE_V244`, `v.old` = alter Listenpreis): Caddy 8.900 € · Sprinter 15.000 € · eSprinter 19.500 € · **neu** Crafter Kühlkastenwagen 19.000 € · Daily 7 t 24.000 € · **neu** MAN TGM 10,5 t 28.000 € · Atego Kühl 30.000 € · Scania 39.000 € · Actros 45.000 € · **neu** Eurocargo ADR 36.000 € · **neu** Container-Chassis-Zug 47.000 € · DAF Kühlsattel 54.000 € · MAN Tankzug ADR 58.000 € · **neu** Semi-Tieflader 62.000 € · Volvo FH Electric 72.000 € · Volvo Schwerlast 76.000 € · Goldhofer 320.000 €. Räder und Roller unverändert. Schiene, See und Luft auf 15–20 % des Listenpreises.
- **Aufträge** zahlen einen Spielaufschlag `PAY_K = 2,5` (`priceOrder`, `makeAirOrder`, Schmuck). VIP, Verträge, Missionen und Serien bauen darauf auf, `VIP_MIN` wurde mitgezogen. **EP** werden weiter vom Erlös ohne Aufschlag berechnet (`o.pk`). Das Level-Tempo bleibt gleich.
- **Container** gibt es ab 9 t statt 180 t, damit auch ein Lkw (Container-Chassis) sie fahren kann.
- **Kredit** (`LOAN_BASE`) an die neuen Preise angepasst: Etappe 1–3 bietet 1,5–6 k / 5–20 k / 20–80 k €. Er bleibt das Sicherheitsnetz gegen Sackgassen.

### 3. Leasing vollständig entfernt (`game.js`, `livery.js`, `extras.js`, `data.js`)
Entfernt sind Leasing-Knopf im Markt, Leasingrate im Planer, Leasing-Filter in der Flotte, „Leasing beenden“, Leasing in der Sammelaktion, `dailyCost`-Aufschlag und Tipp-Text. `acquire` kauft nur noch. Fehlt Geld, steht da, wie viel fehlt, mit dem Hinweis auf Aufträge oder Kredit.
**Migration (`econMigrate`, einmal je Spielstand, `S.econ = 244`):** Alte Leasingfahrzeuge werden Eigentum. Die Ablöse beträgt 40 % des neuen Kaufpreises minus der schon gezahlten Leasingaufschläge (Dauer aus dem Kassenbuch „Geleast: …“, sonst 30 Tage), mindestens 10 %. Was das Konto nicht deckt, wird ein Ablösekredit über 60 Tage (+5 %), ein laufender Kredit wird aufgestockt. Eine Nachricht der Hausbank erklärt das. Im Test: Scania geleast, 1.000 € auf dem Konto → 1.000 € bezahlt, Rest als Kredit, zweiter Aufruf tut nichts.

### 4. Etappen nach Level und Fortschritt (`data.js` STAGES, `game.js`)
Kein Kaufpreis mehr. Frei werden die Etappen mit Speditions-Level und erfolgreichen Speditionslieferungen (`logiDone`, ohne Hofbestellungen):
Etappe 2: Level 3 + 25 Lieferungen · Etappe 3: Level 9 + 120 · Etappe 4: Level 26 + 600 · Etappe 5: Level 34 + 1.200 · Etappe 6: Level 42 + 2.000.
Die Level-Grenzen ab Etappe 4 sind höher als vorher (13/18/24), weil das Geld nicht mehr bremst. Bereits freigeschaltete Etappen bleiben. Der Welt-Reiter zeigt Level und Lieferungen samt Fortschritt, der Knopf heißt „Etappe N freischalten – kostenlos“ oder „Noch x Level und y Lieferungen“.

### 5. Erstes Schiff in Etappe 2
- **Schiffsstufen:** Spits-Frachtschiff 350 t für 27.000 € (Etappe 2), Kempenaar 650 t für 85.000 € (Etappe 2), Europaschiff GMS 1.350 t für 170.000 € (jetzt Etappe 3), danach Tank-, Groß- und Koppelschiff.
- **Einführung (`shipIntroCheck`):** Sobald Etappe 2 offen ist und noch kein Binnenschiff da ist (auch rückwirkend in Etappe 3), kommt „Dein erster Auftrag auf dem Wasser“. Havelkies Brandenburg braucht 250 t Splitt vom Westhafen nach Brandenburg, zahlt +25 % (im Test 4.376 €) und wartet 3 Tage. Dazu erklärt die Hafenmeisterin am Telefon das Schiff. Geschenkt wird nichts.
- **Nach dem Kauf (`shipFirstOrders`):** Sofort liegen zwei passende Wasseraufträge im Buch, danach schneidet die normale Auftragsvergabe die Aufträge auch auf das Schiff zu.

### 6. Auftragssystem (`game.js`, neues Modul `kunden.js`)
- **Zur Flotte passend:** Ladungsarten, die deine Fahrzeuge fahren können, kommen dreimal so oft (`pickCargo`). 72 % statt 60 % der Aufträge sind auf ein eigenes Fahrzeug zugeschnitten. Der freie Rest bleibt meist bei deinen Verkehrsträgern und höchstens der 1,5-fachen Nutzlast. Aufträge, die keins deiner Fahrzeuge je tragen könnte, bleiben nur noch zu etwa 30 % stehen, als Ausblick.
- **Was fehlt (`missingReason`):** Vier Fälle werden unterschieden:
  - „⏳ dein … passt – ist gerade unterwegs“
  - „braucht mindestens 2 t Nutzlast – dein größtes passendes Fahrzeug schafft 1,4 t · im Markt: … ab …“
  - „braucht Kühlung/Gefahrgut/… · im Markt: günstigstes passendes Fahrzeug“
  - „🔒 passendes Fahrzeug erst ab Etappe N“

  Der Planer hat wie bisher den Knopf direkt zum passenden Fahrzeug im Markt.
- **Geschichten:** Jeder Speditionsauftrag bekommt einen Titel (z. B. „Wettlauf gegen die Uhr“, „Die Kühlkette darf nicht reißen“, „Paletten für Dr. Oetker Werk“) und ein kurzes Zitat des Auftraggebers mit dem Grund (je Ladungsart 4–5 Titel und 4 Zitate, fest je Auftrag).
- **Stammkunden:** Ab 3, 5 und 10 pünktlichen Lieferungen an denselben Kunden gibt es +4, +8 bzw. +12 % auf dessen Aufträge (bei über 30 % Verspätungen nicht). Stammkunden melden sich dreimal so oft. Ab 5 Lieferungen bietet der Kunde einmal einen Liefervertrag über seine Strecke an (bestehende Rahmenverträge).
- **Auftragsserien:** Ab 15 Lieferungen kommt gelegentlich ein Angebot (höchstens alle 4 Tage, 35 % Chance je Tag). Es gibt drei Vorlagen: „Die große Erntelieferung“ (Sonnenfeld), „Werkstatt Hoffmann zieht um“ und „Bäckerei Morgenstern eröffnet eine Filiale“. Jede Serie hat drei Fahrten, jede beginnt am Ziel der vorigen. Das Gewicht passt immer auf dein größtes Straßenfahrzeug. Jede Fahrt zahlt 10 % mehr, am Ende gibt es +35 % der Serie als Bonus (+15 % mit Verspätung). Verfällt eine Fahrt, ist die Serie vorbei. Der Bonus wird einmal ausgezahlt (`S.series` wird gelöscht).
- **Meilensteine** (bestehende Erfolge, je einmal 100 € × Etappenfaktor): Schwergewicht (erster Schwerlasttransporter), Spezialist (erste Kühl-, Gefahrgut- oder Containerklasse), Hausspediteur (10 Lieferungen an denselben Kunden), Am Stück (erste Serie), Über die Grenze (erste internationale Lieferung). „Leinen los“ (erstes Schiff) gab es schon.

### 7. Auftragskarten (Handy)
Die Karte zeigt jetzt:
- oben die Ladungsart, den Erlös und darunter „≈ +x € Gewinn“ (aus der Vorschau: Fahrt, Leerfahrt, Umschlag)
- den Titel, den Auftraggeber und das Zitat (höchstens zwei Zeilen)
- Marken für Besonderheiten: Einführung, Serie k/3, Stammkunde +x %, Liefervertrag, Express, knappe Frist
- eine Zeile „Start → Ziel“ und Gewicht, Strecke und Frist

Unter „▸ Details“ klappen Ware und genaue Adressen auf, ohne dass sich der Planer öffnet. Einführungs- und Serienkarten haben einen farbigen Rand.

### 8. Simulationen nachher (gleiche Spielstände, 400 Aufträge)
| Spielstand | fahrbar | gutes Drittel netto | Aufträge bis … (gut/Median) |
|---|---|---|---|
| Etappe 1, Rad + Roller | 84 % | 404 € | Caddy 22/46, Sprinter 37/77 |
| Etappe 1, + Caddy | 100 % | 385 € | Sprinter 39/74 |
| Etappe 2, Transporter | 94 % | 622 € | Kühlwagen 31, Daily 39, Spits-Schiff 43, Atego 48, Scania 63 |
| Etappe 2, + Daily | 98 % | 928 € | **Spits 29**, Scania 42, Kempenaar 92 |
| Etappe 2, mit erstem Schiff | 100 % | 3.593 € | Scania 11, **Kempenaar 24** |
| Etappe 3, Problemfall Lv 24 | 89 % | 2.164 € | Spits 12, Eurocargo 17, Actros 21, Container-Zug 22, Tankzug 27, Tieflader 29, Schwerlast 35, GMS 79, Güterzug 139 |
| Etappe 3, fortgeschritten | 68 % | 6.427 € | Schwerlast 12, Güterzug 47, Tankschiff 51 |
| Etappe 3, angeschlagen (nur E-Sattelzug) | 55 % | 2.311 € | Sprinter 6, Daily 10 |

Damit ist ein bedeutendes Upgrade als Zyklus nach etwa 20–40 guten Aufträgen erreichbar: Kleintransporter und Kühlwagen früher, große Spezial-Lkw, GMS, Bahn und Tankschiff später als Langzeitziel. Ein Spieler mit Fehlkauf erholt sich durch Verkauf (62 % Restwert) und kleine Fahrzeuge nach wenigen Aufträgen. Die Fixkosten bleiben spürbar: Ein schlecht ausgelasteter Fuhrpark frisst sie täglich weg.

### 9. Tests und offene Punkte
- **Ausgeführt:** Simulator vorher und nachher, Leasing-Migration, Schiffseinführung und Schiffskauf, Etappen-Anforderungen, Serien (drei Fahrten, Bonus, Ende), Stammkunden-Zähler, neue Erfolge, Kartenansicht (Screenshot), voller Spielstart mit Hof und Spedition, alle Reiter ohne Fehler, Markt ohne Leasing, Welt mit neuen Etappen. Die Unit-Tests `camp`, `forest`, `hunt` und `jail` sind bestanden. `axe` und `trees` scheitern wie auf GitHub schon vorher.
- **Nicht geprüft:** echtes Handy und ein langer Spielverlauf über Stunden.
- **Offene Punkte:**
  - Wer Fahrzeuge zu alten Preisen gekauft hat, bekommt beim Verkauf nur 62 % des neuen, niedrigeren Preises.
  - Die Level-Grenzen für Etappe 4–6 sind Schätzungen aus dem bisherigen EP-Tempo.
  - Der Güterverkehr per Bahn bleibt in Etappe 3 ein großes Ziel (Güterzug 300.000 €).

## v243 – Firmenwerte springen nicht mehr mit der Etappe

- **Ursache:** Der Firmenwert war `Grundwert × Etappenfaktor × (0,7 + 1,6 × Marktanteil)`. Der Etappenfaktor kam aus **deiner aktuellen Etappe** (1 / 2,5 / 6 / 18 / 45 / 90). Mit dem Freischalten von Etappe 3 (Deutschland), das zeitlich mit der Übernahme von Ostwind zusammenfiel, stieg jeder Preis auf das 2,4-Fache (+140 %), obwohl Flotte, Personal und Kunden gleich blieben. Der Kauf selbst verschiebt die Anteile kaum: Der Anteil der gekauften Firma geht an dich, die Summe bleibt gleich.
- **Neu (`corp.js`, `corpStageK`):** Der Faktor richtet sich nach der Etappe, in der der **Firmensitz** liegt, höchstens nach deiner aktuellen. Kraftmann (Sitz Frankfurt/O., Etappe 2) kostet so in Etappe 2 und 3 gleich viel. Im Test bei gleichem Anteil: 162.000 € → 161.000 €, statt ×2,4. Nordstern (Sitz Hamburg, Etappe 3) erscheint erst in Etappe 3 und hat dort seinen vollen Wert. Teurer wird eine Firma nur noch mit wachsendem Marktanteil und durch Ärger in den Verhandlungen.
- **Laufende Verhandlungen:** Eine laufende Verhandlung wird auf den neuen Wert umgerechnet (Forderung, Gegenangebot und dein Regler im gleichen Verhältnis).

## v242 – Favoriten reservieren ihre Ware

- **Fehler:** Ein Favorit (★) wurde zwar zuerst bearbeitet, solange er aber noch nicht komplett war, galt jede andere Bestellung mit derselben Ware als „fertig“ (`farmOrderReady` prüft nur den Lagerbestand). Die Fahrerin schickte sie los und nahm dem Favoriten die schon gesammelte Ware wieder weg. So sank z. B. bei „Feinkost am Holländerviertel“ der Stand von 56/68 auf 14/68.
- **Behoben (`farm.js`, `team.js`):** Neu sind `farmFavReserve` (was alle offenen Favoriten zusammen brauchen) und `farmOrderReadyFree` (fertig, ohne einem Favoriten etwas wegzunehmen). Die Fahrerin nimmt nur noch solche Bestellungen (`staffFahrerJob`) und prüft beim Losschicken noch einmal (`staffDo` „send“). Übrige Ware über die Reservierung hinaus darf sie weiter ausliefern. Die Verarbeitung achtete schon vorher auf offene Bestellungen (`staffReserve`).
- **Anzeige (`farmview.js`):** Eine fertige Bestellung, die einem Favoriten Ware wegnehmen würde, zeigt „⭐ für Favorit reserviert: … – dein Team liefert das nicht aus“. Selbst losschicken kannst du sie weiterhin.
- **Geprüft** im Testbrowser: Favorit braucht 68 Krabben + 12 Zanderfilets, auf Lager sind 60 + 20. Eine Bestellung über 20 Krabben wird gesperrt (Hinweis „Krabbe“), eine über 5 Zanderfilets darf raus. Nicht geprüft: echte Fahrerin auf dem Handy.

## v241 – Kaufangebote der Konkurrenz unter 30 % Marktanteil

- **So funktioniert der Marktanteil (unverändert):** Jede gelieferte Tour zählt +1 für dich. Jeder Auftrag, den eine Konkurrentin wegschnappt (rote Zeile „greift in … zu“), zählt +1 für sie. Täglich werden alle Werte mit 0,8 multipliziert, alte Erfolge verblassen also nach etwa einer Woche. Der Anteil ist dein Wert geteilt durch die Summe aller aktiven Firmen. Bist du 14 Tage Marktführer, kommen zwei Konzerne mit eigenen Kunden. Kaufen kannst du eine Firma nur mit mindestens so viel Anteil wie sie.
- **Neu (`corp.js`):** Fällt dein Anteil unter **30 %** (bei mindestens 6 Punkten Geschäft insgesamt), schickt die stärkste Konkurrentin ein Kaufangebot aufs Diensthandy. Es kommt höchstens alle 6 Tage und gilt 3 Tage. Ohne Antwort gilt es als abgelehnt. Firmenwert (`corpMyValue`): Fahrzeugwerte (ohne Leasing, Sonderstücke und Garagenautos) + gekaufte Büros (60 %) + Personal + Firmenwert-Aufschlag (25 % + dein Anteil, mindestens 30.000 € × Etappenfaktor).
  - **Ablehnen.**
  - **25 % Beteiligung verkaufen:** 105–120 % eines Viertels des Firmenwerts sofort aufs Konto. Danach gehen bei jedem Monatsabschluss 25 % des Gewinns nach Steuern an die Käuferin. Der Rückkauf ist jederzeit möglich (Knopf im Konkurrenz-Kasten): zum heutigen Viertelwert, mindestens Verkaufspreis + 10 %. Kaufst du die Beteiligte selbst auf, fällt die Beteiligung weg. Es gibt höchstens eine Beteiligung gleichzeitig.
  - **Ganze Spedition verkaufen:** 95–112 % des Firmenwerts, nach einer Sicherheitsabfrage. Weg sind: Speditionsfahrzeuge, alle Büros mit Personal, laufende Speditionsaufträge und der Marktanteil. Neustart in **Etappe 1**. Es bleiben Hof und Erbe (auch Hoffahrzeuge und Hofaufträge), Garage, Level, Geld, Kredite und übernommene Firmen. Danach kommen 14 Tage lang keine Angebote.
- **Anzeige (`vip.js`):** Der Konkurrenz-Kasten erklärt die Zählung in einem Satz und zeigt eine bestehende Beteiligung mit Rückkauf-Knopf. Der Monatsabschluss nennt den Gewinnanteil.
- **Geprüft** im Testbrowser: 17 % Anteil löst ein Angebot aus (Firmenwert 360.000 €). Beteiligung +101.000 €, beim Monatsabschluss gehen 17.500 € Gewinnanteil ab. Ein zweites Angebot bietet keine Beteiligung mehr an. Komplettverkauf: Flotte und Büros leer, Etappe 1, neue Aufträge. Nicht geprüft: Handy.

## v240 – Easter Egg: „Handy weg, wenn der Chef redet“

- **Auslöser (`team.js`, `staffTap`):** Eine Hof-Kraft telefoniert gerade („Im Telefonat“). Wer sie in diesem Telefonat **dreimal** antippt (innerhalb von 30 s, gezählt je Kraft und je Telefonat in `WV.callTaps`), öffnet beim dritten Mal ein Chatfenster statt der kleinen Blase. Nirgends steht ein Hinweis darauf, man findet es nur durch Zufall.
- **Chat (`staffPhoneChat`):** Die Kraft wimmelt ab („Pssst, Chef – wichtiges Gespräch …“, vier Varianten je nach Person). Zur Auswahl steht eine Antwort des Spielers: „‹Vorname›, wenn dein Chef mit dir redet, ist das Handy weg. Telefonieren kannst du danach – jetzt höre ich von dir, nicht vom Büro.“ Nach kurzem Tippen kommt die Entschuldigung (drei Varianten), dazu der Hinweis „🤫 Easter Egg entdeckt“ und der Knopf „Zurück an die Arbeit“.
- **Folge, je Kraft einzeln (`s.noPhone`, gespeichert):** Diese Kraft legt ab jetzt beim Antippen sofort auf (`staffHangUp`: die restliche Telefonzeit fällt weg, die Arbeit beginnt gleich). Statt „Im Telefonat“ öffnet sich das normale Aufgabenmenü. Die anderen Kräfte telefonieren weiter wie bisher, bis man auch sie belehrt.
- **Geprüft** im Testbrowser: Chat öffnen, Antwort antippen, Entschuldigung, Merkmal gesetzt, Telefonat beendet und Arbeitszeit vorgezogen. Das dreifache Antippen der 3D-Figur selbst habe ich nicht im Browser getestet.

## v239 – Schatzkiste: Kamera schwenkt gleich nach der Show zurück

- **Vorher (`worldview.js`):** Die Kamera flog erst zurück, nachdem die geöffnete Truhe sich aufgelöst hatte. Das war etwa 7,6 s nach dem Aufspringen des Deckels, dazu kamen 1,3 s Rückflug. Man schaute lange steil von oben auf die Grube.
- **Jetzt:** Sobald Münzfontäne, Lichtsäulen und Ringe vorbei sind (2,6 s nach dem Aufspringen), geht die Kamera in 0,7 s in ihre alte Ausrichtung, Entfernung und Position zurück. Die offene Truhe ist danach weiter zu sehen und löst sich wie gewohnt auf. `worldTreasureRevealEnd` ruft den Rückflug nur noch auf, wenn er nicht schon lief.
- **Geprüft** im Testbrowser: Die Show wurde Schritt für Schritt abgespielt. Bei 2,7 s startet der Rückflug, nach 1,5 s steht die Kamera wieder auf Entfernung 30 und Blickrichtung 45°, wie vorher. Nicht geprüft: Handy.

## v238 – Hof-, Sägewerk- und Fischerei-Bestellungen lohnen sich wieder, Verarbeitung neu bepreist

- **Befund:** Bestellungen zahlten den Warenwert × 1,05–1,22 plus kleine Liefergebühr (2,50 € + 0,45 €/km). Der Fischmarkt zahlt auf Fischwaren aber +15 %, und Fisch/Reusentiere werden dort nach Gewicht bewertet. Beispiel „Feinkost am Holländerviertel“ (68 Krabben, 23 Krebse, 12 Zanderfilets): Fischmarktwert 1.032 €, Bestellung bisher ≈ 1.018 €. Liefern lohnte sich also nicht.
- **Neue Preisformel (`farm.js`, `farmOrderBase`, `farmOrderPay`):** Grundwert ist, was die Ware im besten Laden bringt. Das heißt Fisch und Reusentiere nach Durchschnittsgewicht und Fischwaren mit Fischmarkt-Aufschlag. Darauf kommen **30–50 % Aufschlag** sowie eine Liefergebühr von 5 € + 0,80 €/km. Das Feinkost-Beispiel bringt jetzt 1.355–1.561 € statt ≈ 1.018 €. Gilt für Hof, Sägewerk und Fischerei. Daueraufträge: Grundwert wie oben, +35 % (vorher +13 %), Bonus wie gehabt.
- **Bestehende Bestellungen:** Offene und angenommene Bestellungen werden einmal auf mindestens den neuen Preis angehoben (`F.econ238`). Daueraufträge behalten ihren vereinbarten Preis bis zur nächsten Lieferung.
- **Verarbeitung (`fishdata.js`, `erbedata.js`):** Rezepte, bei denen das Fertigprodukt kaum mehr (oder weniger) wert war als die Zutaten, bringen jetzt etwa +30 %:
  - Barschfilet 7 → 9 €, Forellenfilet 9 → 11 €, Karpfen blau 18 → 22 €, **Zanderfilet 40 → 46 €**
  - Fischkonserve 4,50 → 5,50 €, Fischbrötchen 4 → 4,50 €, Hechtklößchen 13 → 20 €, Frischfischkiste 26 → 58 €, Edelfisch-Box 120 → 150 €
  - Holzkisten (Sägewerk) 20 → 27 €
  - Futter und Bert-Köder bleiben bewusst bei ihrem Preis (Hilfsstoffe).
- **Geprüft** im Testbrowser: Rechnung für Fisch-, Holz- und Hof-Beispiel sowie eine Rezeptliste mit allen Margen. Nicht geprüft: dein Spielstand.

## v237 – Autohandel steuerlich absetzbar: nur der Gewinn wird versteuert, Verluste werden vorgetragen

- **Vorher:** Ein ersteigertes Auto zählte im Kaufmonat sofort als Ausgabe. Was davon über den Monatsgewinn hinausging, verfiel, weil es keinen Verlustvortrag gab. Der Verkaufserlös war im Folgemonat dann voll steuerpflichtig. Wer im einen Monat kaufte und im nächsten verkaufte, zahlte 30 % auf den **Umsatz** statt auf den Gewinn. Autohandel lohnte sich deshalb kaum.
- **Neu – Wareneinsatz (`extras.js`, `auction.js`, `game.js`):**
  - Ein ersteigertes Garagen-Auto ist Handelsware. Der Kauf (Hammerpreis + 12 % Aufgeld) wird gebucht, ist aber steuerlich noch nicht wirksam (`logMoney(..., nt)`, Merkmal `g.ware`).
  - Beim Verkauf werden Kaufpreis und Aufgeld als **Wareneinsatz** abgesetzt (`taxWare`, `S.taxAdj`). Die 8 % Provision mindern ohnehin den Erlös. Versteuert wird also nur der Handelsgewinn.
  - Wird ein Garagen-Auto als Wertkurier in die Flotte genommen, ist es ab dann Betriebsfahrzeug und wird sofort abgesetzt.
  - Autos, die vor v237 gekauft wurden, sind schon abgesetzt und zählen nicht doppelt.
- **Neu – Verlustvortrag:** Ein Monat mit Verlust (z. B. ein Auto unter Einkaufspreis verkauft) zahlt keine Steuern. Der Verlust wird vorgetragen (`S.taxLoss`) und mindert die Steuern der nächsten Monate, für das ganze Geschäft.
- **Anzeige:** Der Monatsabschluss nennt Autohandel-Erlös, Wareneinsatz, den verrechneten Verlustvortrag und den neuen Stand. Unter „Welt → Geschäft“ stehen Verlustvortrag und Autohandel-Gewinn des laufenden Monats. Die Garage erklärt die Regel. Die Verkaufsnachricht nennt den Gewinn gegenüber dem Einkauf.
- **Beispiel (getestet):** Kauf 53.760 € im Monat 1, Verkauf netto 64.400 € im Monat 2, dazu 20.000 € und 5.000 € Auftragsgewinn. Bisher: 6.000 € + 20.820 € Steuern. Jetzt: 6.000 € + 2.892 € Steuern. Ein Verlustmonat (−12.892 €) wird im nächsten Monat vollständig verrechnet.
- **Bleibt bewusst:** 12 % Aufgeld, 8 % Provision und die Wertentwicklung (Klassiker steigen, Sportwagen fallen, Kilometer drücken). Gewinn bringt der Handel also nur mit gutem Einkauf. Er ist eine zusätzliche Einnahmequelle, kein Selbstläufer.

## v236 – Nicht stören: keine Sonderaufträge und Anrufe beim Schießen, Angeln, Sägen

- **Problem:** Einladungen zur Sonderfahrt (VIP/Express), Anrufe mit Wischen-zum-Annehmen und Zufallsereignisse öffneten ihr Fenster auch mitten im Schießen auf dem Hochsitz.
- **Neu (`extras.js`):** `uiBusy()` erkennt, ob man gerade beschäftigt ist: Ich-Perspektive (`fphunt`, `fp3d`), Angeln/Sägen/Minispiele (`#farmAngel` belegt), Hammer, Zoll, Pakete, Luckybox. Dann gilt:
  - `tickCalls` zeigt keinen Anruf, die Anrufe warten in der Schlange.
  - `tickExtras` würfelt keine neuen Ereignisse, Einladungen oder Konzern-Meldungen (`busyFreeze`).
  - Offene Entscheidungen und die Frist einer Einladung laufen nicht ab: ihre Fristen werden um die gleiche Zeit verschoben (`dec.until`, `v.open.rsvp`). Nichts wird währenddessen automatisch abgelehnt.
- **`vip.js`:** Das Einladungsfenster öffnet nicht mehr nach festen 400 ms, sondern erst, wenn man nicht beschäftigt ist (prüft alle 1,5 s).
- Danach geht alles wie gewohnt: Anruf klingelt, Einladung öffnet sich, Streife/Ereignisse kommen wieder.
- **Geprüft** im Testbrowser: mit `fphunt` bleibt ein Anruf in der Schlange, die Frist verschiebt sich um 50 Minuten, nach dem Verlassen klingelt er. Nicht geprüft: echtes Schießen auf dem Handy.

## v235 – Männer sehen nicht mehr wie Frauen aus (Bewerber, Personal)

- **Befund:** Name und Geschlecht des Avatars waren in der Erzeugung immer passend (`makeCandidate`: erst Geschlecht, dann Vorname aus `STAFF_FIRST_W/M`). Der Eindruck „männlicher Name, weibliches Gesicht“ kam von drei Männerfrisuren in `AV.hairM`, die im kleinen Porträt wie Frauenhaar aussehen: Seitenscheitel, Lange Wellen, Pferdeschwanz. Ich habe alle Frisuren einzeln gerendert, um das zu prüfen.
- **Neu (`avatar.js`):** `avRandom` zieht für Männer nur noch aus `AV_HAIR_M_SAFE` = kurz, Undercut, Tolle, Locken. Die Frisuren der Frauen bleiben, die Wahl beim eigenen Charakter ebenso.
- **Rückwirkend:** `avFixMale` stellt vorhandene Männer-Avatare mit Seitenscheitel, Wellen oder Pferdeschwanz einmalig auf eine kurze Frisur um (je Person fest aus der ID abgeleitet). Läuft in `ensureOffices` für Personal und Bewerber (`offices.js`).
- Wirkt auch auf die Snus-Kunden (`snus.js` nutzt `avRandom`).
- **Geprüft** im Testbrowser: 24 neue Bewerber ohne langhaarige Männer, alter Avatar mit Hair 5 wird auf eine kurze Frisur gesetzt. Nicht geprüft: dein Spielstand.

## v234 – Schatten fehlten im Westwald (Hochsitz) bei flacher Sonne

- **Ursache (`gl3d.js`, Sonnenkamera in `updateCamera`):** Die Schattenkamera hatte einen festen Tiefenbereich 1…90, gemessen ab einem Punkt 40 Einheiten vom **Weltursprung** Richtung Sonne. Je weiter das Kamera-Ziel vom Ursprung weg liegt und je flacher die Sonne steht (Morgen, Abend), desto eher lag der Boden hinter der fernen Ebene. Der Shader wertet das als „kein Schatten“. Am Hochsitz im Westwald fehlten bei Morgensonne deshalb alle Schatten (der Turm warf keinen), bis auf Bäume, die näher an der Sonne lagen. Das ergab die scharfe Hell-Dunkel-Grenze quer durchs Bild.
- **Behoben:** Der Tiefenbereich folgt jetzt dem Ziel: `d0 = −lc[2]`, `ortho(…, max(0.5, d0 − 39), d0 + 50)`. Am Ursprung ergibt das genau den alten Bereich 1…90, in der Nähe des Hofs ändert sich also nichts. Texel-Einrasten und Schattengröße sind unverändert.
- **Geprüft** im Testbrowser: gleiche Kamera im Westwald (x −75, z −30, Draufsicht, 7:30 Uhr), vorher gar keine Schatten, nachher Turm- und Baumschatten. Nicht geprüft: dein Handy und andere Tageszeiten einzeln.

## v233 – „Streife bei …“ deutlich seltener

- `events.js`, `maybeStreife`: Die Wahrscheinlichkeit pro Snus-Lieferung sinkt von 30 % auf 8 %. Dazu gilt eine Sperre von 3 Spieltagen nach der letzten Streife (`snusState().lastStreife`). Erwartung: statt fast jeder dritten Fahrt etwa jede zwölfte, und nie zweimal in kurzer Folge. Der Ausgang der Entscheidung (35 % Risiko beim Weiterfahren) ist unverändert.

## v232 – Nach der Mittagspause auf dem Weg bleiben, Figuren laufen nicht ineinander

- **Ursache (Querlauf nach der Pause):** Das Aufstehen vom Lagerfeuer dauert gut eine Sekunde (`staffRise`). Die Uhr der nächsten Arbeit lief dabei schon, und die Figur hing danach hinter ihrer Route zurück. In `stepStaff` holte sie dann in gerader Linie auf – quer durch Bäume, Zäune und Felsen. Das betraf alle Berufe, am auffälligsten bei der Fischerin mit ihrem langen Weg.
- **Behoben (`team.js`):** (1) Beim Aufstehen läuft die Uhr der Folgearbeit nicht weiter (`gdt`, `j.t0/t1` werden verschoben). (2) Wer hinter der Route zurückhängt, holt jetzt **entlang der Route** auf (`staffFollow`, `routeProject`, `staffRouteDist`; 12 Einheiten/s), nicht mehr in Luftlinie. Nur wenn die Figur weiter als 3 Einheiten vom Weg entfernt ist, gilt wie bisher die direkte Bewegung.
- **Abstand (`team.js`, `STAFF_GAP` = 0,8):** Zwei Figuren, die sich näher kommen, weichen seitlich aus (sanft, höchstens 0,7 Einheiten; wer läuft, weicht stärker aus als wer steht). Ausgenommen: Sitzende, aufstehende Figuren, das Ablegen/Aufnehmen an der Werkzeugplane und alles auf dem Lagerplatz. Gerade nach Mittagsende laufen viele gleichzeitig los, dort greift die Regel am meisten.
- **Geprüft** nur im Testbrowser mit nachgestellten Figuren: Aufholen folgt der Routenecke, zwei Figuren am selben Punkt stehen danach 0,84 auseinander. Nicht geprüft: das echte Mittagsende mit allen Berufen auf dem Handy.

## v231 – Papierkorb auf der Bestelltafel zuverlässig und einheitlich

- **Fehler:** Das ✕ der Bestelltafel (`.fs-x`, `position:sticky`) schwebte beim Scrollen über den Karten. Wo ein Papierkorb darunter lag, traf der Finger das ✕ und schloss das Fenster. Auf der Tafel ist das ✕ jetzt nicht mehr sticky (`#farmSheet.orders .fs-x{position:relative}`).
- **Robuster:** `dropGo` zeichnet die Liste immer neu, auch wenn `save()` oder `renderFarmUI()` einen Fehler werfen. Vorher blieb die Karte dann stehen, obwohl der Auftrag schon weg war. Die Knöpfe sind größer (46×40) und haben `touch-action: manipulation`.
- **Einheitlich:** Der Zurückgeben-Knopf angenommener Aufträge (`data-ret`) zeigt jetzt auch 🗑️ statt ↩︎. Das Rückfrage-Fenster bleibt.
- **Geprüft** nur im Testbrowser mit Touch-Eingabe. Auf dem Handy konnte ich den Fehler nicht nachstellen, die Ursache ist deshalb eine begründete Annahme.

## v230 – Firmensitz nach Übernahme geht nicht mehr verloren

- **Fehler:** In `corpClose` (corp.js) wurde der Firmensitz einer übernommenen Firma sofort für 18 % des Preises verkauft, wenn sein Ort noch gesperrt war (z. B. Hamburg in Etappe 2) oder kein Standortplatz frei war (`maxBases() = S.stage`). Wer danach die Etappe freischaltete, hatte den Platz, aber das Büro war schon weg.
- **Neu:** Der Sitz wird samt Mitarbeitern in `S.corp.hq[id]` vorgemerkt. `corpHqOpen(id)` macht daraus ein Büro, sobald der Ort freigeschaltet und ein Platz frei ist (Fahrzeuge der Firma werden zugeordnet). `corpHqTry()` läuft im Tick, nach `unlockStage` und beim Laden. Steht am Ort schon ein eigenes Büro, wird der Sitz wie früher verkauft.
- **Rückwirkend:** `corpHqRepair()` legt für jede alte Übernahme ohne Büro am Firmensitz (`C.owned[id].hq` fehlt) einen vorgemerkten Sitz an. Er öffnet sich von selbst, sobald ein Platz frei ist. Der damalige Verkaufserlös bleibt als Entschädigung. Neue Übernahmen tragen `hq: 1`.
- **Anzeige:** Im Übernahme-Dialog steht jetzt „vorgemerkt“ statt „Erlös aus Verkauf“. Im Büros-Tab zeigt ein Hinweis vorgemerkte Sitze. `game.js`: Hooks in `tick`, `unlockStage`, `boot`.

## v229 – Keine Lackierung für Leasingfahrzeuge, Hofaufträge nur noch für Hofarbeiter

- **Lackierung (`livery.js`):** Neu ist `canPaint(f)`: `paintable(vType(f.type)) && !f.lease`. Das gilt überall, wo Fahrzeuge lackiert oder gezählt werden: Einzel-Button, „Flotte lackieren“, Lackierung ab Werk (`onAcquire`), Zähler im Fenster. `painted(f)` ist für Leasingfahrzeuge immer false, auch bei alten Spielständen mit gesetztem `f.liv`. Sie fahren also im Originallack und zählen nicht für den +2 %-Bonus. Der Hinweis im Fenster lautet „Sondereditionen und Leasingfahrzeuge bleiben im Original.“
- **Büro-Dispo (`game.js`, `dispatchRun`):** Kandidaten mit `o.farm` sind komplett ausgeschlossen. Bisher wurden sie genommen, sobald `farmOrderReady(o)` erfüllt war. Hofaufträge liefern jetzt nur noch die Hofarbeiter aus (`team.js`, dort unverändert).
- **Favoriten-Stern (`farmview.js`):** Im Tooltip und im Toast heißt es jetzt „das Team“ statt „Büro und Team“.

## v228 – Quellberg in der Nordostecke: verdeckter Ursprung, Bergbach über Kaskaden zum bestehenden Fall

- **Lage:** Das Quellgebiet ist ein zusammenhängender Berg in der Nordostecke der Karte. Gipfel bei Welt (49, −134,5), etwa 13 Einheiten hoch; der Ursprung liegt bei (53,75, −138,5). Bisher lag die Quelle auf dem Hang nordwestlich des Topfs bei (18,6, −122,9), in v218 nordöstlich bei etwa (47, −121). Hauptfall, Becken auf der Kante, Topf, Topf-Ufer und Abfluss sind unverändert.
- **Berg (`MTN`, Welt):** zwölf weich vereinigte Kuppen: Sockel, Gipfel, Kammarm nach Osten, Kamm südlich der Quelle, Sattel, Westwand der Mulde, Rücken hinter der Quelle, Westwand der Klamm, Ostflanke, Westschulter, vordere Stufe, Kuppe im Westen und Vorberg im Osten. Dazu Höhenstufen (breite Absätze, steile Felsstufen, Stufe 2,2), ein verbogener Rand (keine Ellipsen zu sehen) und Rauheit. Felsfarbe an Stufen und steilen Flanken, oben heller. Nadelboden und dunkles Gras am Berg, Moos und Gras unten. Licht und Schatten sind leicht in die Farben eingebacken, damit der Berg auch von oben plastisch wirkt.
- **Verdeckter Ursprung:** Das Wasser tritt in einer Felsmulde (Radius 3, Boden 6,25) unter einer Felsplatte aus. Ringsum stehen Felswände bis etwa 12. Kamm, Sattel und Kammarm liegen zwischen der Mulde und jeder möglichen Kameraposition, verdeckt wird also durch die echte Geländeform. Geprüft per Strahltest (siehe unten).
- **Bachlauf (`SRUN`, Welt → Fallrahmen):**
  - Abschnitt A: Er läuft hinter dem Kamm nach Westen und dann durch eine Klamm zwischen Gipfel und Westschulter.
  - Abschnitt B: Er tritt bei (43,7, −132,2) zwischen Felsen hervor und fällt über die 1. Kaskade auf die Bergflanke.
  - 2. Kaskade, dann Abschnitt C: Er schlängelt sich über die Hochfläche nach Westen.
  - 3. Kaskade, dann der Zulauf von Nordosten. Die bisherige Kaskade führt ins Becken auf der Kante, von dort geht es über den großen Fall in den Topf.
  - Wasserspiegel 6,55 → 6,32 | 5,5 → 5,4 | 4,72 → 4,53 | 4,08 → 3,98 | Becken 3,17. Er fällt durchgehend; die Kaskaden fallen um 0,82, 0,68, 0,45 und 0,81.
  - Der Bach bleibt ein durchgehendes Band (Shader `uWater 7`), die Kaskaden zeichnet `uWater 6`.
- **Hochfläche:** Sie läuft entlang des sichtbaren Bachs, und zwar als Maximum über die Stützpunkte (Ufer = Wasser + 0,9, Kernbreite etwa 3, weicher Abfall). Dadurch gibt es keine Stufen, wo das nächste Wasser wechselt. Am Fall bleibt der alte Felsabsatz (Becken eingebettet), um den Topf bleibt alles frei.
- **Felsen:** Felsplatte und Blöcke an der Mulde, Felswände in der Klamm, Stufen und Wächter an jeder Kaskade, Ufersteine an Außenkurven und Beckenrändern, und Felsbänder an den Stufen des Bergs (längs der Höhenlinie gestreckt). Kein Fels steht im Wasser (`rockOk`).
- **Pflanzen:** Farn, Gras und Blumen am Ufer, dazu lockeres Gras, Farn und Moossteine auf Hochfläche und Hängen. Neuer Knoten `springFlora` (Welt): oben dichte Fichten und Kiefern, unten gemischt mit Buchen und Birken, dazu Sträucher. Frei bleiben Ufer, Felsstufen, der Topf und ein Streifen vor dem sichtbaren Bach Richtung Kamera.
- **Technik:** Das Gitter liegt in Weltachsen, grob 0,6 und am Bach fein 0,3, ohne Risse an der Grenze. Das Gelände ohne Bach steht als Tabelle bereit (0,5er Raster, bilinear). Wasserstrecken und Hochfläche sind in Rastern abgelegt. Im Testbrowser dauert das Bauen etwa 0,2 s für das Gelände und 0,17 s für die Pflanzen. Gelände mit Felsen und Pflanzen: etwa 28.000 Dreiecke, Bäume und Sträucher: etwa 22.000.
- **Kamera:** Wald und Alter Wald reichen im Osten bis x = 54 (vorher 42), damit man den Berg von vorn ansehen kann.
- **Spielstand / Welt:** `FWORLD.springHill` ist jetzt ein Grundriss aus Kapseln, der alles abdeckt, wo Gelände über dem Boden liegt. Kulissenbäume halten Abstand, auf dem alten Hang im Nordwesten wachsen wieder welche. Einmalige Umstellung `F.v228hill`: Bäume im neuen Grundriss rücken an den Rand oder fallen weg. In einem neuen Spiel stehen dort keine fällbaren Bäume. Schatztruhen erscheinen nicht mehr im Berg oder im Topf. Die alten Umstellungen v207/v220 laufen nicht mehr.
- **Geprüft:**
  - Höhenprofil: kein Stück fließt bergauf, das Bett liegt nie über dem Wasser, die Ufer sind auf beiden Seiten höher als das Wasser. Einzige Ausnahme: 3 Punkte am bisherigen Beckenzulauf mit höchstens 0,045 Abweichung, wie vorher.
  - Strahltest ohne Bäume und Felsen: Kameraziele im Raster 2 über den ganzen erreichbaren Nordosten, 9 Zoomstufen, Seitenverhältnisse 0,6 bis 2,2. Die Mulde mit dem Ursprung ist aus keiner Stellung sichtbar. Nur ganz herausgezoomt am Ostrand sieht man ein Stück des Bachs hinter dem Kamm, ab etwa 3 Einheiten unterhalb der Quelle.
- Dateien: `woodmodels.js` (`setSpringFrame`, `SRUN`, `MTN`, `mtnW`, `srPlateau`, `platW`, `baseW`, `srcWater` mit Raster, `hillH`, `springHill`, `springFlora`, `springHeightW`), `worldview.js` (Rahmen setzen, Flora-Knoten, Grundriss für Kulissenbäume, keine Bläschen an der verdeckten Quelle), `erbe.js` (`springHill.caps`, `springHillNear`, `inSpringHill`, `v228hill`, Schatz), `erbedata.js` (Kamera bis x = 54).

## v227 – Buchenstämme dunkler (wirkten wie blasse Sprechblasen)

- **Befund:** Im markierten Bereich gibt es keine Sprechblasen und keine halbtransparenten Bedienelemente (die Blasen sind nur ein Knopf-Layer `#farmTags`; dort lag nichts). Die grauen Kästchen unter den Kronen sind die **Stämme der Buchen**: sehr hell (silbergrau 0xa8a79f), im Schatten der eigenen Krone blass und rechteckig, daher der Eindruck eines durchscheinenden Schildchens.
- **Jetzt:** Buchenstamm wärmer und dunkler (Rinde 0x867f72, Basis 0x6d675c, Flecken 0x5e594e; Rindenpalette im feinen Baum entsprechend), er liest sich als Stamm. Birken bleiben weiß.
- Dateien: `woodmodels.js` (`TREE_C.buche`), `treebark.js` (`GR` der Buche). Spielstand unverändert.

## v226 – Schautafel am Hochsitz: gedreht und links vom Turm, freie Sicht

- **Gedreht:** Die Tafel stand mit der Vorderseite zur Wiese (nach Westen), die Spielkamera sah von Südosten auf die Rückseite. Sie ist jetzt zur Kamera gedreht (`SHOWRY = π/4`), die Trophäen schauen den Spieler an.
- **Platz:** Von der Kamera aus **links vom Turm** (lokal x +3,1, z +0,3) statt rechts dahinter. Um die Tafel liegt ein freier Kreis (3,3), dazu eine **Sichtgasse** zur Kamera (11 lang, 5,2 breit): dort wachsen keine Bäume, Büsche und Kulissenbäume mehr (`HUNT.clear` → `showClear`).
- **Spielstand:** Einmalige Umstellung `F.v225h` entfernt fällbare Bäume in diesem Bereich.
- Dateien: `hunt.js` (`SHOWL`, `SHOWRY`, `showClear`, `clear`, Knoten in `attach`), `erbe.js` (`v225h`).

## v225 – Hochsitz: Merkmals-Blase am erlegten Stück entfernt

- Die Textblase neben dem erlegten Tier („Waffen 21 cm“, beim Hirsch „8-Ender“, beim Fasan „Stoß …“, plus Besonderheiten) erscheint bei **keinem** Tier mehr. Die Werte stehen weiter in der Trophäenkarte darunter.
- Datei: `hunt.js` (Aufruf von `callHTML` in der Bergung entfernt; die Funktion bleibt ungenutzt stehen).

## v224 – Schussnote: Sterne klar sichtbar und einheitlich

- **Fehler:** Die Schussnote nutzte für halbe Sterne das Sonderzeichen ⯪ (fehlt in vielen Handy-Schriften → Kästchen ▯) und gemischt ★/☆ aus unterschiedlichen Schriften.
- **Jetzt:** Alle Sterne sind dasselbe Zeichen ★, per CSS gefärbt (`.hu-stars`): voll = Gold mit dunkler Kontur, halb = zur Hälfte gefüllt (Farbverlauf), leer = hellgrau mit grauer Kontur. Etwas größer (1,25 em), eigene Symbol-Schriftliste. Gilt im Trophäen-Fenster nach dem Schuss, im Trophäen-Detail und bei „Beste Schussnote“ im Jagdbuch.
- Dateien: `hunt.js` (`stars`, Zeilenausgabe im Trophäen-Detail), `style.css` (`.hu-stars`).

## v223 – Holzfäller: Hosenträger-Grafikfehler behoben, Figuren geprüft

- **Fehler:** Beim Holzfäller (Flanellhemd, `garb: "plaid"`) lagen senkrechte Streifen, Querstreifen und Hosenträger auf nahezu derselben Fläche (Tiefe 0,19 / 0,19 / 0,192) und flackerten ineinander („Z-Fighting“). Die Träger ragten außerdem über die Schulter hinaus.
- **Jetzt:** Drei klare Schichten, jede ein Stück weiter vorn (Streifen 0,20 → Querstreifen 0,216 → Träger als dünne Platten vorn und hinten bei ±0,118), dazu ein Riemen über jeder Schulter und eine Schnalle vorn.
- **Alle Figuren geprüft** (alle 9 Mitarbeiter-Berufe in je 3 Aussehen, stehend und sitzend, von vorn, hinten, seitlich; dazu Förster, Nachbar, Sägewerker, See-NPC, Händler, Bootsfahrer, Baustellen-Mann). Dabei gefunden und behoben: Die **reflektierenden Streifen der Warnweste (Fahrer)** lagen vorn und hinten hinter der Weste und waren nie zu sehen – jetzt sichtbar. Taillenband von Latzhose und Schürze/Kittel und Streifen jetzt mit etwas mehr Abstand zum Hemd, damit nichts flackert.
- Dateien: `woodmodels.js` (`garbParts`: `plaid`, `hivis`, `bib`, Schürzenband).

## v222 – Hochsitz: Meldungen überlagern sich nicht mehr, keine Wild-Wartezeit mehr

- **Überlagerung:** Die Hinweis-Meldung („Das Revier ist ruhig …“, „Da draußen steht Wild …“) lag auf derselben Höhe wie der Auftrags-Chip („Erlege einen Keiler“). Sie sitzt jetzt darunter (`top:124px` statt 72px), Chip und Meldung berühren sich nicht mehr.
- **Keine Zeitangabe:** Der Spieler erfährt nicht mehr, wann das nächste Stück kommt. Meldung im Revier jetzt „Das Revier ist ruhig – such den Waldrand mit dem Fernglas ab.“; im Hochsitz-Fenster fehlt „· nächstes Stück in …“ (die Punkte für das Wild im Revier bleiben).
- Dateien: `hunt.js` (`enterRevier`, `sheet`), `style.css` (`.hu-msg`).

## v221 – Bürowechsel: Personal in ein anderes Büro versetzen

- **Neu:** Jeder Mitarbeiter (auch die ★★★★★-Fachkraft aus der Luckybox-Headhunter) lässt sich in ein anderes Büro versetzen – ab dem 2. Büro. Zwei Wege: Knopf **⇄** neben dem ✕ in der Personalliste (Leiste „… versetzen nach …“ mit den anderen Büros, antippen), oder wie bisher die Karte ziehen: in der Ablageleiste stehen jetzt die anderen Büros neben den Fahrzeugen und „Kündigen“.
- **Regeln:** kostenlos, braucht aber einen freien Schreibtisch im Zielbüro (volle Büros sind ausgegraut mit „voll“). Ein fester Fahrer verlässt sein Fahrzeug im alten Büro. Das Zielbüro schaut gleich nach Aufträgen.
- **Headhunter:** Jedes Büro bekam die Headhunter-Bewerbung schon vorher (auch später eröffnete); jetzt kann die eingestellte Kraft zusätzlich frei zwischen den Büros wechseln.
- Dateien: `offices.js` (`transferStaff`, `moveZones`, `openMoveBar`, Knopf in `staffRow`, `handleStaffDrop`), `style.css`.

## v220 – Quell-Wasserfall neu ausgerichtet: Fall zur Kamera, Bergbach als ein durchgehendes Band

- **Ausrichtung:** Felswand, Fall, Becken, Hang und Bergbach liegen jetzt hinter dem Topf (um 90° gedreht). Die Spielkamera sieht den Fall von vorn statt von der Seite. Der Weg des Wassers läuft auf dem Bildschirm von oben nach unten: Quelle am Findling → Bergbach → zwei Kaskaden → Becken auf der Kante → Fall → Topf → Abfluss. Der Topf, sein Ufer und der Bach bleiben, wie sie sind.
- **Bergbach (Priorität 1):** Er war aus einzelnen flachen Vierecken je Abschnitt plus runden Scheiben für die Becken zusammengesetzt. Die Ränder schwebten über dem Ufer, an den Knicken entstanden Zacken. Jetzt ist er **ein einziges Band** (Catmull-Rom-Mittellinie, Breite und Wasserspiegel laufen stetig, Becken sind breite Stellen des Bandes). Das Band reicht unter das Ufer, die Uferlinie entsteht dort, wo der Hang den Wasserspiegel schneidet. Er schlängelt sich stärker.
- **Neuer Wasser-Shader `uWater 7` (Bergbach):** in der Mitte tief und dunkel, zum Ufer flacher und heller. Streifen und feine Lichtlinien ziehen bachabwärts, in Becken langsam, vor einer Kante schneller. Unter den Kaskaden wanderndes weißes Gekräusel. Bleibt nachts lesbar.
- **Übergänge:** Unter den Kaskaden bleibt das Bett als Stufe hoch (kein sichtbarer Wasserrand mehr unter dem Fall). Der Bach endet im Becken nicht mehr mit einer Kante, sondern läuft im Gefälle der Rinne unter den Fall, der darüber einblendet. Die Kaskaden blenden länger aus dem Bach ein (`uFlow.w`), fallen über die Kante vor und dann steil hinab, mit unregelmäßigen Rändern. Die Rinne zur großen Kante ist kürzer (1,35 statt 2,1), die Kante ist nicht mehr schnurgerade.
- **Hang:** weiche Normalen (keine Facetten-Streifen mehr) und flachere, breitere Flanken. Keine grauen „Fels in Flecken“-Schlieren mehr, sondern Moos- und Grastöne mit etwas Erde. Nur ein schmaler nasser Saum am Wasser. In der Mitte reicht er als Absatz bis an die Rinne, sodass das Becken eingebettet auf der Kante liegt.
- **Felsen:** `stone()` hat Bruchflächen (Ebenen-Schnitte, oben eine fast waagerechte Fläche) und ergibt kantige, geschichtete Blöcke statt Kugeln. Die Flanken rahmen den Fall links und rechts, nichts steht mehr zwischen Kamera und Fall. Kein Steinkranz und keine Moospolster-Kugeln mehr. Ufersteine liegen an den Außenkurven und halb im Wasser am Rand der Becken, dazu Steine in der Schlucht zwischen den Kaskaden.
- **Topf-Ufer (neu `springRim`):** Steine in Gruppen, vorn niedrig, am Abfluss frei. Dazu Farne, Gras, ein paar Blumen, Kiesel und Treibholz in der stillen Ecke.
- **Weniger Weiß:** Schaum am Fuß des großen Falls und der Kaskaden kleiner und durchsichtiger, der Fall unten weniger vollweiß. Der Fuß des Falls taucht unter die Wasseroberfläche (keine Kante auf dem Wasser).
- **Gischt/Partikel:** laufen über die neue Fallrichtung (`WV.springFx.dx/dz` ist jetzt die Fallrichtung, nicht mehr die Bachrichtung).
- **Spielstand:** `FWORLD.springHill` liegt auf der neuen Achse (Radius 10,5). Einmalige Umstellung `F.v220hill`: Bäume auf dem neuen Hang rücken an seinen Fuß, auf einen erlaubten Platz (`treeSpotOk`). Nur wenn keiner frei ist, fällt der Baum weg. Auf dem alten Hang stehen wieder Kulissenbäume.
- Dateien: `woodmodels.js` (`stone`, `springRocks`, neu `springRim`, `SRUN`, `srSamples`, `srLinks`, `srcWater`, `yAlong`, `hillH`, `springHill`, `springRun`, `srCasc`, `springCascades`, `springRunFoam`, `springRunInfo`, `fallSheet`, `springFall`, `SPRING_FALL`), `gl3d.js` (`streamWater`, `uWater 7`, Fall-Schaum), `worldview.js` (Knoten im gedrehten Rahmen, Topf-Ufer, Partikel), `erbe.js` (`springHill`, `v220hill`).

## v219 – Ställe abreißen

- **Neu:** Im Stall-Fenster (Hühnerstall, Kuhstall, Schweinestall, Schafweide, Rinderweide) gibt es unten den Knopf **🧱 abreißen**. Er ist **ausgegraut („erst alle … abgeben“), solange noch Tiere im Stall sind**; sind alle abgegeben (Knopf „… abgeben“), wird er aktiv und fragt vor dem Abriss nach.
- **Rückzahlung:** die Hälfte vom Baupreis plus die Hälfte der bezahlten Ausbaustufen (Hühnerstall Stufe 1: 150 €). Der Platz zählt sofort wieder frei (n/7), so lassen sich z. B. Hühnerstall oder Rinderweide durch weitere Kuhställe ersetzen.
- Dateien: `farm.js` (`penDemolishBack`, `farmPenDemolish`), `farmview.js` (Knopf `#fpDel` in `openPen`). Spielstand unverändert; Mitarbeiter, deren Ziel der Stall war, suchen sich ein neues.

## v218 – Hütte: Bootssteg mit Ruderboot (+20 % Miete), strengere Feuerholz-Regel

- **Feuerholz:** pünktlich am Holztag → volle Miete; **verspätet** (Tag 2–7 der Mietwoche, Knopf „🔥 Verspätet liefern“) → halbe Miete für diese Woche; **gar nicht** → keine Miete für diese Woche („🥶 Die ganze Woche kein Feuerholz“). Abzüge stehen in `S.farm.rent.cut` und werden von den nächsten Mietzahlungen abgezogen (der Zahltag liegt nicht genau auf dem Holztag). 🔥 über der Hütte, bis geliefert ist.
- **Bootssteg:** Einen Tag nach dem Einzug fragt der Mieter („⚓ Ein Steg für mein Ruderboot?“). Am Westufer unterhalb der Hütte (zwischen den Schilfgruppen) liegt dann sein Boot kieloben am Strand, im Wasser alte Pfähle, Absteckpflöcke – Markierung ⚓.
  - Bauen: 6 Bund Pfosten, 4 Bund Hobeldielen, 3 Paar Balken, 3 Bund Bretter + 3.500 € (Material ablegen, Nagel-Spiel). Danach: Holzsteg auf Pfählen mit Pollern und Leiter, das Boot liegt daneben (Riemen eingezogen).
  - **Miete +20 %** (3.024 € die Woche); auch die Feuerholz-Abzüge rechnen damit.
  - **Bootsfahrten:** tagsüber (9–18 Uhr), wenn der Mieter zu Hause ist und es nicht regnet, fährt er ab und zu für einen 90-Minuten-Block raus: über den Pfad auf den Steg, einsteigen, zu einer Stelle auf dem See rudern, dort treiben, vor Blockende zurück, anlegen, auf die Veranda.
  - **Pfad zum Steg:** sieht aus wie der Pfad an der Hütte, läuft ohne Absatz vor den Stufen aus dem Hauptpfad heraus und endet am Strand weich im Sand an der Stegkante.
- Dateien: `rent.js` (Steg, Boot, Pfad, Tagesablauf, Feuerholz, Miete), `worldview.js` (Antippen `RENT.sheet(rn.k)`, Markierung `RENT.tagDock`).

## v217.2 – Hütte: Miete ×3 mit wöchentlichem Brennholz, Reifenspur, Kamin

- **Miete dreimal so hoch:** 2.520 € die Woche (360 €/Tag statt 120 €). Im Hütten-Fenster jetzt als Wochenmiete angezeigt.
- **Holztag:** Mietwochen zählen ab dem Einzugstag (Tag 1, 8, 15 …). Am ersten Tag jeder Mietwoche will der Mieter **15 kg Brennholz** (1 Sack). Er meldet sich morgens („🔥 Mein Feuerholz ist leer …“), über der Hütte erscheint 🔥, im Fenster gibt es den Knopf **🔥 Liefern** (mit Restzeit bis Mitternacht und Lagerbestand). Kommt bis Mitternacht nichts, gibt es für diese Woche nur die **halbe Miete** (auch der Liefertag selbst wird gekürzt) und eine Nachricht („🥶 Kein Feuerholz mehr“). Bei bestehenden Mietern gilt die laufende Woche als erledigt – nichts wird rückwirkend gekürzt.
- **Problem „Feuerholz alle“** statt „Heizung bleibt kalt“ (geheizt wird mit dem Kamin): „Mein Feuerholz ist leer – kannst du mir bitte schnell neues besorgen? …“. Erledigen mit **🪵 Holz bringen** – kostet kein Geld, nur 15 kg Brennholz aus dem Lager. Solange es offen ist, raucht der Kamin nicht. Alte offene Heizungs-Meldungen erscheinen automatisch mit dem neuen Text.
- **Reifenspur:** eine einzige, geglättete Spur – im Bogen von der Straße auf den Parkfleck, unter den Rädern am Stellplatz entlang und im Bogen zurück zur Straße; keine Kreuzungen, keine Lücke, wo das Auto steht, weich ausblendend an der Straße.
- **Kamin:** Kaminkopf mit Öffnung (Rahmen aus Deckplatten, rußiges Loch), aus der der Rauch steigt.
- Datei: `rent.js` (`RENT_DAY`, `WOOD_N`, `WOOD_CUT`, `woodDay`, `woodTick`, `deliverWood`, `rentF`, `ISSUES.heizung`, `repair`, Fenster, Markierung, `padMesh`, Kaminkopf).

## v217.1 – Hütte: Briefkasten neben dem Pfad, Pfad ohne grünen Rand an der Veranda

- **Briefkasten:** steht jetzt am Parkfleck rechts neben dem Pfad, dort wo der Pfad auf den Fleck kommt (x −43,1, z 23,4) – abseits der Reifenspuren. Parkplatz unverändert wie in v215/v217.
- **Pfadrand an der Veranda:** Der Trampelpfad blendete an seinen Rändern in die Grasfarbe, an der Hütte liegt aber der Baustellenboden (Erde) darunter – dadurch ein grüner Streifen um den Pfad. Jetzt nimmt der Rand überall die Farbe des Bodens darunter an (Erde an der Hütte, Gras draußen, Parkfleck am Parkplatz).
- Datei: `rent.js` (`YD`, `yardWob`, `yardColL`, `yardCol` – `yardMesh` nutzt sie; `pathMesh` mit `gnd: yardCol`; Briefkasten).

## v217 – Parkplatz der Hütte wieder wie in v215

- v216 (Parkplatz 3,5 Einheiten weiter westlich, Briefkasten zurück auf x −41,4) ist rückgängig gemacht: Parkfleck, Pfad und Briefkasten sind wieder genau wie in v215 (Auto bei x −46, Briefkasten bei x −40,6, z 20,7).
- Datei: `rent.js`.

## v215 – Briefkasten der Hütte näher an die Einfahrt

- v214 stand er zu weit weg. Jetzt steht er direkt am Rand des Parkflecks neben der Ausfahrt (x −40,6, z 20,7) – gut 1,2 Einheiten neben der Fahrlinie, nicht mehr in der Reifenspur.
- Datei: `rent.js` (`pathMesh`).

## v214 – Briefkasten der Hütte nicht mehr in der Reifenspur

- Der Briefkasten stand bei x −41,4 genau auf der Ausfahrt des Autos (die Reifenspur lief hindurch). Er steht jetzt östlich der Ausfahrt am Straßenrand (x −38,8, z 20,3) auf freiem Gras.
- Datei: `rent.js` (`pathMesh`).

## v213 – Parkfleck der Hütte: saubere Übergänge

- **Ursache der Kanten:** Pfad und Reifenspuren rechneten mit einer festen Erdfarbe, der Parkfleck hat aber innen einen Verlauf und einen weichen Rand ins Gras; außerdem endete der Pfad genau auf diesem Rand.
- **Jetzt:** eine gemeinsame Farbfunktion für den Parkfleck (`padCol`: Mitte → Erde → Gras). Der Fleck selbst, die Ränder des Pfads und die Reifenspuren nehmen ihre Untergrundfarbe daraus – keine Farbsprünge mehr.
- Der Pfad läuft ein Stück weiter in den Fleck hinein und blendet dort aus (2,8 Einheiten), wo der Boden schon gleichmäßig Erde ist; kein Laub mehr auf dem Fleck.
- Reifenspuren mit weichen Seitenrändern (dunkle Mitte, Rand in Bodenfarbe), Anfang und Ende laufen über 1,4 Einheiten aus.
- Datei: `rent.js` (`PAD_C`, `PAD_R`, `padK`, `padCol`, `pathMesh`, `padMesh`, Pfadende).

## v212 – Hütte am See: Pfad läuft in den Parkfleck aus, Reifenspuren auf der Fahrlinie

- **Pfad am Parkplatz:** Der Trampelpfad endet nicht mehr an der Straße, sondern läuft auf den Parkfleck und blendet dort weich in die Erde über (wie die Wege an den Hoftoren). Der Mieter geht vom Auto direkt auf den Pfad. Der Briefkasten bleibt an der Straße.
- **Reifenspuren:** Statt zweier gerader Streifen gibt es jetzt zwei Spurpaare genau auf der Fahrlinie des Autos: die Einfahrt von der Straßenkante (wo das Auto auf den Rasen fährt) bis zum Stellplatz und die Ausfahrt vom Stellplatz bis zur Straßenkante. Auf dem Erdfleck dunkel, auf dem Gras nur abgewetzt, Anfang und Ende laufen weich aus.
- Kleiner Fix: Die Meldung „Die Hütte steht! … zieht morgen ein“ merkt sich den Namen vorher (konnte einen Fehler werfen, wenn der Einzug sehr schnell kam).
- Datei: `rent.js` (`PATH`, `PAD_DIRT`, `pathMesh`, `padMesh`, Wege zum Auto).

## v211 – Kettensäge: kein Ruckeln mehr beim Kerb und beim Fällschnitt

- **Ursache (gemessen):** Der Kerb-Stamm wird je Kerbtiefe neu gebaut (20 Stufen, je zwei Rinden-Meshes `notchMesh`). Jedes Rinden-Mesh lief über die ganze Stammhöhe durch `emitBark` (Farbgrenzen, Facetten, Birkenflecken) – im Test-Browser 180–300 ms je Mesh. Direkt nach dem ersten Treffer im grünen Bereich wächst der Kerb in schneller Folge um sechs Stufen → sechs solche Neubauten hintereinander; im Fällschnitt weitere acht.
- **Lösung (`fpsaw.js`):**
  - Die Rindenwände werden an festen Höhen geteilt (`sty._cuts`: unterhalb jeder möglichen Kerbsohle, Raster 0,4 Radien, oberhalb des höchsten Dachs). Jedes Wandstück wird einmal gebaut und als fertige Vertexdaten wiederverwendet (`wallMemo`, Schlüssel aus den Eckpunkten).
  - Der Nahaufnahme-Stamm (`trunkFromWalls`, ersetzt `plainTrunk` für die Säge) besteht aus denselben Stücken und füllt den Speicher schon beim Ansetzen; `warmWalls` baut fehlende Stücke notfalls in Portionen (4 ms je Bild).
  - Der obere Stamm über dem höchsten Dach ist ein eigenes, einmal gebautes Mesh (`staticTop`, Knoten `X.ntS`, neigt sich mit); je Kerbstufe wird nur noch der Bereich um den Kerb neu gebaut (`notchMesh(..., "dyn")`).
  - Höchstens ein Neubau alle 70 ms; Zwischenstufen werden übersprungen.
- **Gemessen im Test-Browser (gleicher Baum, Birke Größe 2):** Kerb-Mesh je Stufe vorher 165–295 ms, jetzt 7–26 ms; Oberfläche und Farbe gleich (Flächenabweichung 0,02 %, Stamm 0,004 %). Der Nahaufnahme-Stamm beim Ansetzen kostet etwa so viel wie vorher (rund 13 % mehr).
- Testhilfen: `SAW3D._notch`, `_warm`, `_static`, `_trunk`, `_x`.

## v210 – Quell-Wasserfall überarbeitet (Masterprompt): Kante, Wasser, Fels, Gischt, Nacht, Details

**Gefundene Probleme (Code und Test-Browser):** Der Fall schoss in einem weiten Bogen wie aus einem Schlauch (Kante 0,3 hinter dem Topfrand); gerade, gleichmäßige Seitenränder; die Rinne lief als gerader Streifen ohne Ufersteine; nachts war der Fall ein fast schwarzes Band und der Gischtnebel leuchtete weiß (Partikel sind unbeleuchtet); Wellenringe exakt kreisrund; Felsen einfarbig je Block, große Moospolster als grüne Kugeln, zwei davon verdeckten die untere Kaskade; keine Details am Topf.

**`woodmodels.js`**
- **Kante:** `SPRING_FALL.top` (−2,65 / 1,98) statt (−3,3 / 2,0): überhängender Felsvorsprung 0,35 über dem Topfrand, der Fall stürzt steiler; Fuß (−1,6), Aufprall bleibt mitten im Wasser. Rinne 2,1 lang (`rinne`), lückenlos vom Becken.
- **Fallendes Wasser (`fallSheet`, `springFall`):** Mitte wölbt sich an der Kante vor, Breite schwankt entlang des Falls, links und rechts verschieden; zwei **Nebenstränge** (`strands`): links über die Kante, rechts schmaler aus einer Spalte darunter, je auf einen Absatz im Wasser und von dort ins Becken.
- **Felsen mit Material (`stone`):** jede Fläche eigener Ton – oben heller, Seiten mittel, unten/Ritzen dunkler, am Wasser nass und dunkel (`wet`, `wetAll`), Moos nur auf einzelnen oberen Flächen, Flechten selten; große Blöcke feiner unterteilt. Alle Felsen von Topf, Kante, Becken und Hang nutzen es. Neu: Vorsprung unter der Kante, zwei Wächtersteine, dunkle nasse Wand hinter dem Fall, Absätze der Nebenstränge, Steine an den Rinnenrändern und einer mitten im Strom.
- **Details:** Moospolster klein und flach nur außen; keine Polster mehr auf den Rahmensteinen am Zulauf. Farne und Grasbüschel in Gruppen am Topf und am Bachufer, 16 Kiesel im Sand, Treibholz mit Seitenast in der stillen Ecke. Schaumflecken unter den Nebensträngen (`springFoam`).

**`gl3d.js` (Shader `fallWater`, nur `uWater 6`):** zweite, schnellere Schicht feiner heller Fäden und langsam ziehende dichtere Bahnen (unterschiedliche Geschwindigkeiten, Tiefe); unregelmäßige Ränder, die mit dem Wasser wandern; nachts mindestens 0,36 Helligkeit für Wasser und Schaum (bleibt heller als der Fels). Wellenringe: Radius und Stärke schwanken mit der Richtung, jeder Ring etwas anders schnell, jede Runde neu geformt.

**`worldview.js`:** Gischt, Spritzer, Nebel und Blubbern richten Farbe und Deckkraft nach dem Tageslicht (`lf` aus `R.env.sunCol`), Größen und Lebensdauer variieren; Spritzer an den Absätzen der Nebenstränge. Modellschlüssel …210.

**Leistung:** Szene rund 13 500 Dreiecke (Felsen 1 842, Fall 2 400, Hang 6 828 …), alles einmal gebaut und zwischengespeichert; Partikel nur in Kameranähe, feste Raten (geschätzt unter 80 gleichzeitig, Obergrenze 700 im Renderer).

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
