# 🌍 LOGISTIKA – Welt der Logistik

Eine Logistik-Simulation im Comic-Look auf einer echten OpenStreetMap-Karte.
Du baust dir eine Figur, gründest eine Spedition und arbeitest dich vom ersten
Lastenrad in Berlin bis zur weltweiten Containerflotte hoch.

Läuft als **PWA** – installierbar auf iPhone, Android und Desktop, offline
lauffähig, ohne Framework, ohne Build-Schritt, ohne externe Bibliothek.

---

## Der Start

1. **Charakter bauen** – Frisur, Haarfarbe, Hautton, Kleidung, Zubehör und ein
   Name. Die Figuren sind halbrealistisch gezeichnet: Gesichtsanatomie,
   Hautschattierung, Haarsträhnen mit Glanz – alles als reines SVG, ohne eine
   einzige Bilddatei. Aus der Sicht dieser Figur läuft das ganze Spiel.
   Alternativ zehn **fertig gezeichnete Figuren** zur Auswahl (unter
   „🧑 Fertige Figur“) – eigene lassen sich nach [PLAYER-ART.md](PLAYER-ART.md)
   ergänzen.
   **📸 Aus Foto:** Selfie aufnehmen oder ein Bild wählen – das Spiel zeichnet
   daraus direkt im Browser ein Comic-Porträt (Stile: Comic, Comic kräftig,
   Original; mit Zoom und Verschieben). Ein gespeichertes Memoji oder Bitmoji
   lässt sich genauso als Bild nehmen oder einfügen. Das Foto verlässt das
   Gerät nicht, gespeichert wird nur das fertige 256-px-Porträt. Im laufenden
   Spiel genügt ein Tipp aufs eigene Porträt oben links, um die Figur zu ändern.
2. **Firma anmelden** – Firmenname, Hausfarbe und eine Herkunft, die über
   Startkapital und Startfahrzeug entscheidet:
   Fahrradkurier (1.000 € + zwei Lastenräder), Rollerkurier (1.000 € + zwei
   Simson-Mopeds) oder Werkstatterbe (1.000 € + Kastenwagen). Klein anfangen,
   der Rest kommt über die ersten Aufträge.
3. **Fuhrpark kaufen** – ohne Fahrzeug keine Spedition. Erst wenn mindestens
   eins im Hof steht, wird der Betrieb angemeldet und Karte wie Auftragsbuch
   gehen auf.
4. **Interaktives Tutorial** – Disponentin Lina Sturm geht mit dir einen
   echten Übungsauftrag durch, der genau dort startet, wo dein Fahrzeug steht:
   Auftrag finden, Leerfahrt-Hinweis lesen, Planung mit Minikarte verstehen,
   annehmen, verfolgen – und danach wartet ein Anschlussauftrag am Zielort.
   Die Uhr steht so lange still, und außer Linas „Weiter“ bzw. dem leuchtenden
   Feld ist alles gesperrt – kein Scrollen, kein Danebentippen, kein Überspringen.
   Wer mittendrin neu lädt, macht dort weiter. Unter *Welt* lässt sich das Tutorial jederzeit
   wiederholen. Eigene Artwork für Lina: `lina.png` ersetzen, siehe [ART.md](ART.md).

## Spielprinzip

Du bist Spediteur. Verlader schreiben Transporte aus, du planst die Kette und
setzt die passenden Fahrzeuge ein.

1. **Auftrag wählen** – jede Ausschreibung nennt Ladung, Gewicht, Relation,
   Erlös und Zustellfrist.
2. **Route disponieren** – das Spiel berechnet den Weg über das echte
   Verkehrsnetz (Straße, Schiene, Binnenwasser, Seewege, Luftkorridore) und
   bietet die schnellste und die günstigste Variante an. Für jede Teilstrecke
   wählst du selbst ein Fahrzeug.
3. **Leerfahrten vermeiden** – ein Fahrzeug steht nach der Zustellung am Ziel.
   Muss es für den nächsten Auftrag erst leer zum Ladeort, kostet das Sprit und
   Zeit. Darum zeigt jede Ausschreibung, welches Fahrzeug sie übernehmen würde
   (✅ steht schon am Abholort, ↩️ müsste erst leer hinfahren, 🚫 gerade keins
   passend), die Liste lässt sich nach „📍 Leerfahrt“ sortieren, und im
   Planer zeigt eine Minikarte Abholung, Ziel und alle Fahrzeuge – die
   gestrichelte Linie ist die Leerfahrt, samt Kilometern und Kosten. Ein Teil der
   Ausschreibungen startet bewusst dort, wo gerade ein Fahrzeug frei steht.
   Fehlt für eine Teilstrecke das passende Fahrzeug (etwa ein Binnenschiff),
   springt der Knopf „🛒 … im Markt“ direkt zu den Fahrzeugen, die genau diese
   Strecke schaffen. Gekauft oder geleast wird es gleich an den Ladeort
   überführt, und danach geht es zurück zum Auftrag.
4. **Kosten im Blick behalten** – Umschlagzeiten beim Moduswechsel und
   Tagesfixkosten gehen ebenfalls von der Marge ab.
5. **Wachsen** – Erfahrung bringt Level, Level und Kapital schalten die nächste
   Weltregion frei.

### Ablehnen und stornieren

Jede Ausschreibung hat oben rechts ein **✕** (auch im Planer und an der
Stecknadel): weg damit, ohne Kosten. Bei Snus- und Pablo-Kunden wird der Kunde
dabei gleich blockiert. Schon angenommene Aufträge lassen sich unter *Live*
stornieren – regulär kostet das 20 % Vertragsstrafe, eine Übergabe im
Schattengeschäft abzubrechen kostet nichts, die Ware geht zurück ins Lager.
Das Fahrzeug bleibt dort stehen, wo es gerade ist.

### Adressen und Stecknadeln

Jeder Auftraggeber hat eine eigene Adresse – in Berlin echte Straßen je
Stadtteil (Torstraße, Bergmannstraße, Sonnenallee …), an Häfen, Flughäfen und
Terminals ein Tor, Kai oder eine Halle. Wer schon im Namen sagt, wo er sitzt
(„Apotheke am Rosenthaler Platz“), wird genau dort abgeholt. Die Stadtteile
selbst sind nur noch Knoten im Netz: aus der Nähe verschwindet ihr Punkt, dafür
stehen auf der Karte **Stecknadeln** im Comic-Stil:

* 🟡 **gelb** – offene Ausschreibung beim Auftraggeber (⭐ = Linas Übung)
* ⚪ **grau** – Kundschaft von Mr. Snus (mit seinem Logo) und Don Pablo – die
  Nadel steht beim Kunden in der Siedlung, abgeholt wird im eigenen Lager
* 🟠 **orange** – angenommen und in Arbeit: an der Abholung, bis geladen ist,
  danach am Ziel; eine kleine 🏁-Fahne zeigt vorher schon, wohin es geht

Antippen öffnet die Ausschreibung mit beiden Adressen – „Planen & annehmen“
führt in den Planer, „In der Auftragsliste“ springt zur Karte im Menü und hebt
sie hervor. Liegen Nadeln zu dicht, werden sie mit einer Zahl gebündelt;
Antippen zoomt hinein. Stehen mehrere Aufträge an genau derselben Adresse,
erscheint stattdessen eine kleine Auswahl. Fahrzeuge fahren bis vor die Tür, laden dort und parken
nach der Zustellung beim Empfänger. Eigene Büros stehen als kleines Haus in der
Firmenfarbe an ihrer Adresse.

### Mr. Snus

Ab Level 2 schreibt gelegentlich ein Schatten mit Zylinder aufs Diensttelefon:
„Jo brauchst du Snus?“ Wer mit „Ja was hast du da?“ antwortet, bekommt seine
Liste (ein paar Sorten, je 68 bis 128 Dosen) und kauft für 5 € pro Dose ein.
Die Ware liegt dann in einem Späti in der Stadt, und private Kunden melden
sich als **graue Aufträge**: 10 € pro Dose, geliefert wird mit der eigenen
Flotte – in die großen Siedlungen am Stadtrand (Marzahn, Hellersdorf,
Gropiusstadt, Märkisches Viertel, Falkenhagener Feld, Neu-Hohenschönhausen …).
„Nein, danke mein Akh“ lehnt ab.

Unter den Kunden sind **Zivilfahnder**. Sie zahlen mehr als 10 € pro Dose,
wollen gleich 16 oder mehr Dosen, haben „deine Nummer von einem Kumpel“ und
tragen **weißes Hemd und sind glatt rasiert**. Wer an sie liefert, verliert
Ware und Geld und sitzt **14 Tage** – die Zeit läuft im Schnelldurchlauf
weiter, Fixkosten, Löhne und Miete auch. Mehr zahlen aber auch **großzügige
Stammkunden** (Geburtstag, Trinkgeld, WG-Vorrat) – die haben nie Hemd UND
glatte Wange zugleich. Also: Profilbild prüfen.

Die **Disposition im Büro** fährt unauffällige Kunden selbst. Zahlt einer mehr
oder will auffällig viel, lässt sie ihn liegen, meldet sich mit „🕵️ Dispo
lässt … liegen“ und markiert die Karte – dann entscheidet der Spieler. Don
Pablo bleibt immer Handarbeit.

### Nachtwallet: bezahlt wird in Solana

Mr. Snus und Don Pablo nehmen kein Bargeld. „◎ Bezahlen“ im Chat öffnet die
**Nachtwallet**: Empfänger mit Wallet-Adresse, die Summe in SOL und in Euro,
der aktuelle Kurs samt Quelle und Alter, die Netzwerkgebühr (◎ 0,000005).
Bestätigt wird wie ein angenommener Anruf – den Knopf ganz nach rechts wischen,
halb gewischt schnappt er zurück. Dann laufen die Bestätigungen der Blockchain
durch, der Beleg (SOL, Kurs, Signatur) landet im Chat und im Schattenbuch.

Der Kurs kommt live aus dem Netz – zuerst Coinbase, sonst CoinGecko, sonst
Binance – und wird alle 15 Sekunden erneuert, solange die Wallet offen ist.
Ohne Netz gilt der letzte bekannte Kurs, deutlich als „offline“ markiert.
Alles Spielgeld, es wird nichts wirklich überwiesen.

### Diensthandy

Nachrichten löschen sich nach **24 Stunden** von selbst („Sicherheits­maßnahmen“,
sagt Lina) – 🔥 zeigt, wie lange eine noch bleibt. Hinter dem unscheinbaren
**🧮** im Handy liegt das Schattenbuch: Einkauf, Verkauf, Beschlagnahmtes,
Lagerbestand und der Gewinn aus Mr. Snus und Don Pablo, dazu die letzten
Buchungen. In der offiziellen Kasse taucht davon nichts auf.

### Don Pablo

Ab Etappe 4 (Luftfracht) ruft gelegentlich Don Pablo an und bietet Kokain in
Tonnen an (35.000 € je Tonne). Die Ware wartet in einem Hangar an einem
Flughafen. Seine Kunden heißen wie ihre Stadt – „Mr. Hamburg“, „Mr. Paris“ –
und nehmen ein paar hundert Kilo bis ein paar Tonnen zu 80.000 € je Tonne.
Übergeben wird in einer Großsiedlung am Rand der Zielstadt (Grünau, Chorweiler,
Neuperlach, La Courneuve …).
Wer anders heißt („Mr. Banane“), ermittelt für Interpol: Eine Lieferung an ihn
zeigt den Interpol-Abschlussbericht und beendet das Spiel.

Lina Sturm erklärt Mr. Snus, Don Pablo und die Büros jeweils beim ersten
Auftauchen; unter *Welt* lassen sich die Erklärungen wiederholen.

### Nebel über unerschlossenem Gebiet

Was du noch nicht erschlossen hast, liegt im Dunkeln. Um jeden erschlossenen
Standort liegt ein Lichtkegel, dessen Radius mit **Level und Etappe** wächst –
von 16 km rund um Berlin bis zu mehreren tausend Kilometern am Ende. Deine
laufenden Routen und deine Fahrzeuge leuchten sich zusätzlich frei. Wer lieber
alles sieht, schaltet den Nebel mit ☁️ ab.

### Die sechs Etappen

| # | Region | Neue Verkehrsträger | Voraussetzung |
|---|--------|--------------------|----------------|
| 1 | Berlin | Fahrrad, Straße | Start |
| 2 | Brandenburg & Mitteldeutschland | Binnenschiff | Level 3 · 18.000 € |
| 3 | Deutschland | Schiene | Level 8 · 120.000 € |
| 4 | Europa | Seeschiff, Luftfracht | Level 13 · 700.000 € |
| 5 | Eurasien & Transatlantik | – | Level 18 · 3,5 Mio. € |
| 6 | Die ganze Welt | – | Level 24 · 20 Mio. € |

### Verkehrsträger und Fahrzeuge

Alle Fahrzeuge gibt es wirklich, mit realistischen Nutzlasten,
Reisegeschwindigkeiten, Reichweiten und Betriebskosten:

* **Fahrrad** – Kurierrad mit Messenger-Bag, Larry vs Harry Bullitt, Urban Arrow
  Cargo L, Chike E-Kart mit Kurierbox
* **Moped & Roller** – Simson S51 mit Kurierbox, Piaggio Liberty 50, Kumpan 54 Ride
* **Straße** – VW Caddy Cargo, Mercedes Sprinter und eSprinter, Iveco Daily,
  Mercedes Atego, Scania R 450, Mercedes Actros 1851, Volvo FH Electric,
  DAF XG+ mit Schmitz-Kühlauflieger, MAN TGS Tankzug (ADR),
  Volvo FH16 750 Schwerlastzug, Goldhofer Modul-Tieflader
* **Binnenschiff** – Europaschiff GMS, Tankmotorschiff, Großmotorgüterschiff,
  Koppelverband
* **Schiene** – DB Cargo BR 185, BR 232 „Ludmilla“, Siemens Vectron MS mit
  Taschenwagen, China-Europa-Blockzug
* **Seeschiff** – Feeder 1.000 TEU, Supramax- und Capesize-Bulker,
  Panamax 5.000 TEU, RoRo-Autotransporter, Maersk Triple-E, HMM Algeciras
* **Luftfracht** – Cessna 208B, ATR 72-600F, Boeing 737-800BCF, Airbus A330-200F,
  Boeing 777F, Boeing 747-8F, Antonow An-124. Ab Etappe 4 gibt es eigene
  Luftfracht-Aufträge von Flughafen zu Flughafen mit knappen Fristen – nur wer
  fliegt, schafft sie.

**Rad oder Moped?** Räder tragen weniger (10–40 kg gegenüber 50–60 kg), sind
dafür im Unterhalt am günstigsten (1–3 € am Tag, 1–3 Cent je km gegenüber
4,5–5 € und 5–9 Cent beim Moped). Eine Leerfahrt kostet deshalb mit dem Rad
fast nichts, mit dem Transporter wegen des Sprits deutlich mehr (10 km:
Bullitt 0,20 € · Simson 0,90 € · Caddy 3,20 € · Sprinter 4,20 €).

Jedes Fahrzeug lässt sich **kaufen** (viel Kapital, niedrige Tageskosten) oder
**leasen** (kein Kapital, höhere Tageskosten). Wer zu groß einkauft, zahlt die
Fixkosten auch im Stillstand.

### Ladungsarten

Pakete · Expressfracht · Palettenware · Kühlware · Gefahrgut (ADR) ·
Schwer- und Sperrgut · Container (FCL) · Schüttgut · Schmuck & Uhren

Kühlware braucht einen Kühlaufbau, Gefahrgut eine ADR-Zulassung, ein Rotorblatt
einen Tieflader – die Symbole am Fahrzeug sagen, was geht.

### Wertsachen-Kurier

Juweliere, Uhrmacher, Goldschmiede, Auktionshäuser, Münzhandlung, Pfandhaus
und Privatbank verschicken innerhalb Berlins Wertsachen: eine Rolex zur
Revision, einen Verlobungsring, Familienschmuck aus dem Schließfach. 💎
**Schmuck & Uhren** fahren nur Rad und Moped (diskret, schnell, versichert) –
kein Transporter. Bezahlt wird ein paar Promille vom Warenwert plus
Grundgebühr, deutlich mehr als für ein Paket. Mit jeder Etappe wird die
Kundschaft reicher (von der Omega bis zur Patek Philippe und zum Diamanten),
so lohnen sich Räder bis ins späte Spiel.

### Klimabilanz

Unter *Welt → Deine Bilanz* rechnet eine Klimabilanz das CO₂ aus allen
gefahrenen Kilometern – Leerfahrten eingeschlossen, leer weniger als voll,
je Fahrzeug nach realen Verbrauchswerten (Lieferwagen ≈ 16–19 kg je 100 km,
Bahn ≈ 6 g, Luftfracht ≈ 300–400 g je Tonnenkilometer). Dazu: Gramm je
Tonnenkilometer mit Vergleichswerten, der Anteil der Leerfahrten, was die
Räder gegenüber einem Lieferwagen gespart haben, und die Aufteilung nach
Verkehrsträger.

---

## Bedienung

Unten wechselst du die Ansicht – jede bekommt den ganzen Bildschirm:
**Karte · Aufträge · Live · Flotte · Markt · Welt**. Auf breiten Bildschirmen
bleibt die Karte links stehen und die Ansicht dockt rechts an.

| Aktion | Wie |
|---|---|
| Karte bewegen | Ziehen, zwei Finger zum Zoomen, Mausrad |
| Station oder Fahrzeug ansehen | Antippen |
| Fahrzeug live verfolgen | Fahrzeug antippen → *live verfolgen*, oder 📡 |
| Verfolgung beenden | Karte ziehen oder ✕ am Live-Band |
| Tempo | Leiste links: Pause, 1×, 3×, 10×, 30× |
| Nebel ein-/ausblenden | ☁️ |

Über den **Aufträgen** sitzt eine feste Leiste: oben sortieren (💶 Erlös,
📍 Leerfahrt, ⏳ Frist), darunter filtern – alle, nur jetzt machbare oder nach
Ladungsart, jeweils mit Anzahl. Der **Fahrzeugmarkt** hat dieselbe Leiste:
Kategorie (Rad, Moped, Transporter, Lkw, Binnenschiff, Schiene, Seeschiff,
Flugzeug), Sortierung (Preis, Nutzlast, € je km, € je Tag, Tempo, Reichweite)
und Häkchen für „freigeschaltet“, „bezahlbar“ und Eigenschaften wie Kühlung,
Gefahrgut oder Wertkurier. Die Auswahl bleibt gespeichert.

Doppeltippen zoomt nicht mehr (auch nicht die Seite), damit schnelles Tippen
nichts verschiebt. Eine Sekunde Echtzeit entspricht bei 1× einer Spielminute. Der Spielstand wird
automatisch im Browser gespeichert (`localStorage`).

### Disposition: selbst oder im Büro

Eine eigene Auto-Disposition gibt es nicht mehr – automatisch disponieren nur
die Leute aus der **Disposition** in deinen Büros. Jedes Fahrzeug gehört
entweder einem Büro (zuordnen unter *Büros* oder direkt am Fahrzeug unter
*Flotte*) oder bleibt bei dir: Dann nimmst du die Aufträge selbst an. Der
Reiter *Flotte* zeigt oben, welches Büro wie viele Fahrzeuge fährt.

Wie viel ein Büro schafft, hängt am Team (Können × Stimmung): eine
Disponentin mit ★★★ betreut rund zehn Fahrzeuge und schaut etwa alle 25
Minuten nach freien Fahrzeugen, zwei gute schaffen deutlich mehr. Fahrpersonal
begrenzt, wie viele davon gleichzeitig rollen, Zoll & Papiere bringen
Zuschlag. Jedes Büro lässt sich mit einem Schalter pausieren.

### Das passende Fahrzeug

Zugeteilt wird nicht mehr einfach das nächstbeste Fahrzeug, sondern das
günstigste in Euro gerechnet: Anfahrt und Strecke mal Kilometerkosten, dazu
die Fixkosten der Zeit, in der es gebunden ist – je leerer es fährt, desto
teurer (ein 24-Tonner für eine Uhr fehlt der nächsten Palettenladung) –, ein
kleiner Preis je Minute Anfahrt und ein dicker Malus, wenn die Frist reißt.
So fährt die Uhr aufs Rad oder Moped, die Paletten auf den Lkw. Im Planer
steht das beste Fahrzeug oben (💡 passt am besten), bei jedem steht die
Auslastung, und zu große sind als „überdimensioniert“ markiert.

---

## Lokal starten

Die Seite braucht einen Webserver (Service Worker und Kartenkacheln funktionieren
nicht über `file://`):

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

---

## Auf GitHub Pages veröffentlichen

1. Neues Repository auf GitHub anlegen, zum Beispiel `logistika`.
2. Den Inhalt dieses Ordners hineinlegen und hochladen:

   ```bash
   git init
   git add .
   git commit -m "LOGISTIKA – erste Version"
   git branch -M main
   git remote add origin https://github.com/<DEIN-NAME>/logistika.git
   git push -u origin main
   ```

3. Im Repository unter **Settings → Pages** bei *Source* **GitHub Actions**
   auswählen. Der mitgelieferte Workflow `.github/workflows/pages.yml`
   veröffentlicht die Seite dann bei jedem Push auf `main`.

   Alternativ ohne Workflow: *Source* auf **Deploy from a branch**, Branch
   `main`, Ordner `/ (root)`. Die Datei `.nojekyll` sorgt dafür, dass GitHub
   nichts umschreibt.

4. Nach ein bis zwei Minuten liegt das Spiel unter
   `https://<DEIN-NAME>.github.io/logistika/`.

Alle Pfade im Projekt sind relativ – es läuft also genauso in einem
Unterverzeichnis wie unter einer eigenen Domain.

### Als App installieren

* **iOS/Safari**: Teilen-Symbol → *Zum Home-Bildschirm*
* **Android/Chrome**: Menü → *App installieren*
* **Desktop**: Installationssymbol in der Adressleiste

---

## Technik

Kein Framework, kein Build, keine Abhängigkeit. Reine Skriptdateien, eine
CSS-Datei, ein Service Worker.

```
index.html              Aufbau der Oberfläche
style.css               Comic-Design in Blau, Ansichten, Dialoge
data.js                 Weltdaten: Knoten, Strecken, Fahrzeuge, Ladungen, Etappen, Nebel
avatar.js               Charakter-Baukasten: Porträts und Brustbilder als reines SVG
photo.js                Figur aus Foto: Selfie/Bild → Comic-Porträt, alles im Browser
places.js               Adressen: Berliner Straßen, Terminals, Siedlungen am Stadtrand
lina.png, ART.md        optionale eigene Artwork für die Disponentin
player-p1.png … p10.png, PLAYER-ART.md  fertige und eigene Porträts für die Spielfigur
map.js                  eigene Slippy-Map-Engine auf <canvas>
offices.js              Standorte, Personal, Möblierung, Diensttelefon
wallet.js               Nachtwallet: Solana-Kurs live, Wischen zum Bezahlen
snus.js                 Mr. Snus: Chat, Einkauf, Lager, Kunden, Zivilfahnder, Haft
pablo.js                Don Pablo: Angebot, Hangar, Kunden, Interpol-Bericht
game.js                 Simulation, Routing, Wirtschaft, Oberfläche
intro.js                Charaktererstellung, Firmengründung, Tutorial
sw.js                   Service Worker: App offline, Kacheln im Cache
manifest.webmanifest    PWA-Manifest
icon-*.png, favicon-64.png   App-Symbole
```

Alle Dateien liegen bewusst flach im Hauptverzeichnis (keine Unterordner) –
so lässt sich das Projekt auch vom Handy aus per „Add file → Upload files“
auf GitHub pflegen, ohne dass eine Ordnerstruktur verloren geht.

**Karte** – eine selbst geschriebene Kartenengine auf einem einzigen
`<canvas>`: Web-Mercator-Projektion, Kachel-Nachladen mit Rückfall auf gröbere
Zoomstufen, Schwenken, Pinch-Zoom, Datumsgrenzen-korrekte Linien und ein
gebündelter Renderer, der das komplette Weltnetz in sechs Zeichenoperationen
ausgibt.

**Figuren** – jedes Gesicht entsteht aus Parametern, nicht aus Bilddateien:
Kopfform mit Stirn, Schläfe, Wange und Kinn, mandelförmige Lidöffnung mit
angeschnittener Iris, Limbusring, Irisfasern, Lidschatten, zwei Glanzlichtern,
Wimpernkranz mit Schwung und Lidfalte, Brauen aus einzelnen Haarstrichen, Nase
mit Schattenseite und Glanzkante, Lippen mit Amorbogen. Dazu eine Spur
Asymmetrie, damit das Gesicht nicht wie ein Symbol wirkt.

**Foto-Porträt** – kein KI-Dienst und kein Server: `photo.js` schneidet das Bild
auf 256 × 256 px zu und filtert es auf dem Gerät. Ein mehrfacher Bilateral-Filter
glättet Flächen und lässt Kanten stehen, weiche Tonstufen sorgen für
Cel-Shading, und eine Differenz zweier Weichzeichner (XDoG) liefert die
Tuschelinien. Sticker mit Transparenz bekommen zusätzlich eine Außenkontur.

**Nebel** – ein halbtransparenter Layer auf einem zweiten Canvas, aus dem
Lichtkegel, Routenkorridore und Fahrzeuge per `destination-out` ausgestanzt
werden. Er rechnet in halber Auflösung, weil weiche Kanten nichts verlieren.

**Weltmodell** – 136 reale Logistikstandorte, daraus rund 3.700 Kanten. Straßen-
und Bahnverbindungen entstehen aus Landmasse und plausibler Netzdichte,
See- und Binnenwasserwege sowie besondere Strecken (Eurotunnel, Transsib,
Neue Seidenstraße, Trans-Australian Railway) sind einzeln hinterlegt.

**Netzdarstellung** – geroutet wird über das volle Netz, gezeichnet nur ein
Grundgerüst aus den je Knoten kürzesten Verbindungen. So bleibt die Karte
lesbar statt zum Spinnennetz zu werden.

**Routing** – Dijkstra über Knoten-Modus-Paare, damit Umschlagzeiten beim
Wechsel des Verkehrsträgers real zu Buche schlagen. Kantengewicht ist die
Zeit oder die Kosten des günstigsten Fahrzeugs, das diese Ladung auf dieser
Etappenlänge überhaupt fahren könnte. Ergebnisse werden zwischengespeichert.

**Wirtschaft** – Der Frachterlös ergibt sich aus Tonnenkilometer-Tarifen je
Verkehrsträger, Umschlagpauschalen und einer Mindestgrenze in Höhe der
Charterkosten, multipliziert mit Ladungsart, Dringlichkeit und Marge. Wer ein zu
großes Fahrzeug einsetzt, zahlt drauf. Der Markt reagiert auf die eigene Flotte:
freie Kapazität zieht passende Ladung an.

### Kachelquelle ändern

Standard sind die Kacheln von openstreetmap.org. Sie sind für kleine Projekte
frei nutzbar, es gilt die [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
Wer mehr Traffic erwartet, trägt in `map.js` unter `TILE_SOURCES` einen
eigenen Anbieter ein (etwa MapTiler, Stadia Maps oder Carto) und wählt ihn beim
Start der Karte aus.

---

## Lizenz

Code: MIT, siehe [LICENSE](LICENSE).

Kartendaten: © OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright).

Fahrzeug-, Firmen- und Markennamen dienen der Wiedererkennung und gehören den
jeweiligen Rechteinhabern. LOGISTIKA ist ein freies Hobbyprojekt ohne
Verbindung zu den genannten Unternehmen. Alle Spielfiguren, auch die
Disponentin Lina Sturm, sind frei erfunden.
