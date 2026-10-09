# 🌍 LOGISTIKA – Welt der Logistik

Eine Logistik-Simulation im Comic-Look auf einer echten OpenStreetMap-Karte.
Du erbst einen heruntergekommenen Obsthof bei Werder (Havel), erntest, backst
und lieferst deine Ware per Lastenrad und Moped in die Dörfer. Hinter dem Zaun
warten der Wald, das alte Sägewerk vom Nachbarn und der Glindower See – erst
wenn Hof, Holz und Fischerei laufen, wird daraus eine Spedition, die bis zur
weltweiten Containerflotte wächst.

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
2. **Erbe antreten** – Name des Betriebs, Hausfarbe – und Opas **Obsthof**
   bei Werder (Havel): 500 €, ein bisschen heruntergekommen, mit Feldern,
   Apfelbäumen, drei Hühnern, Backofen, Futtermühle, einem Lastenrad und
   seiner alten Simson. „Erbe antreten“ führt direkt hin, ein Fahrzeugkauf ist
   nicht nötig. (Ältere Spielstände mit Kurierstart laufen unverändert weiter;
   Spielstände mit der früheren Ostsee-Fischerei werden beim Laden zu Opas Hof
   – mit 5.000 € Ausgleich, behaltener Erfahrung und einer Nachricht von Lina.)
3. **Fuhrpark kaufen** (nur Kurierstart älterer Spielstände) – ohne Fahrzeug
   keine Spedition. Erst wenn mindestens eins im Hof steht, wird der Betrieb
   angemeldet und Karte wie Auftragsbuch gehen auf.
4. **Interaktives Tutorial** – Disponentin Lina Sturm geht mit dir einen
   echten Übungsauftrag durch, der genau dort startet, wo dein Fahrzeug steht:
   Auftrag finden, Leerfahrt-Hinweis lesen, Planung mit Minikarte verstehen,
   annehmen, verfolgen – und danach wartet ein Anschlussauftrag am Zielort.
   Die Uhr steht so lange still, und außer Linas „Weiter“ bzw. dem leuchtenden
   Feld ist alles gesperrt – kein Scrollen, kein Danebentippen, kein Überspringen.
   Wer mittendrin neu lädt, macht dort weiter. Unter *Welt* lässt sich das Tutorial jederzeit
   wiederholen. Eigene Artwork für Lina: `lina.png` ersetzen, siehe [ART.md](ART.md).

## Der Hof (3D)

Der Hof ist eine eigene 3D-Ansicht im Stil von Hay Day – schwenken mit einem
Finger, zoomen mit zwei. Auf dem Hof gibt es weder Pause noch Tempo: Bis zur
Speditionsgründung läuft die Zeit immer in Echtzeit (eine Spielminute pro
Sekunde) – Weizen braucht zwei Minuten, ein Ei anderthalb.

* **Felder** – antippen, Saat wählen (alle freigeschalteten Sorten stehen in
  mehreren Reihen untereinander) und über die leeren Felder **ziehen**.
  Reif? Die **Sichel** über alle goldenen Felder ziehen. Gießen macht 25 %
  schneller und einen Stern besser, **Fruchtwechsel** (andere Sorte als zuletzt)
  bringt noch einen Stern. Je Saat gibt es zwei Ernten, manchmal eine
  Rekordernte mit drei.
* **Obstbäume** – Äpfel, ab Level 4 Werderaner Kirschen, ab Level 7 Birnen.
  Antippen, wenn sie reif sind; alte Bäume tragen bessere Früchte.
* **Tiere** – Hühner legen Eier, Kühe geben Milch, **Schafe** werden
  geschoren (ein Vlies Rohwolle je Durchgang, danach stehen sie sichtbar
  „nackt“ da). Futter kommt aus der Futtermühle (Hühner-, Kuh-, Schweine- und
  Schaffutter). Stall antippen sammelt alles ein, Futter über die Tiere ziehen
  füttert sie. Ein Tier antippen und streicheln: das nächste Produkt wird
  einen Stern besser.
* **Masttiere** – **Schweine** (ab Level 4) und **Rinder** (ab Level 6) wachsen
  mit jeder Mahlzeit; nach drei bzw. vier Mahlzeiten sind sie schlachtreif
  (✓ über dem Stall). Ein Tipp bringt sie zum Metzger: je Schwein drei, je Rind
  vier Fleischpakete à 5 kg – danach kauft man Ferkel und Kälber nach.
* **Metzgerei und Spinnstube** – Bratwurst, Schinken und Gulasch aus eigenem
  Fleisch; Wollknäuel, Wollsocken und Pullover aus eigener Wolle.
* **Platz = Qualität** – je mehr Auslauf jedes Tier hat, desto besser die Ware:
  von „zu eng – Massenhaltung“ (★) über Bodenhaltung und Freilandhaltung bis
  „Bio-Weidehaltung“ (★★★★★). Mehr Tiere bringen mehr Eier, aber auf engem Raum
  sinkt der Preis. Auslauf und Weide lassen sich in drei Stufen vergrößern – der
  Zaun wächst sichtbar mit.
* **Backofen, Mühle, Molkerei** – Rezepte antippen, sie laufen nacheinander in
  der Warteschlange: Brot, Maisfladen, Apfelkuchen, Möhren-Muffins, Pizza,
  Kirschtorte; Butter, Pudding, Käse; Hühner- und Kuhfutter. Weitere Plätze
  kosten Geld.
* **Silo und Scheune** – zeigen jede Ware mit Menge und Sternen. Volle Lager
  lassen sich ausbauen; der Großhandel kauft sofort, zahlt aber nur den halben
  Wert.
* **Kundschaft** – die Bestelltafel am Tor sammelt Bestellungen aus Werder,
  Glindow, Petzow, Geltow, Caputh, Michendorf und Potsdam (Bäckerei, Café,
  Kita, Hotel, Wochenmarkt …), Berlin kommt erst mit der Spedition dazu.
  „Liefern“ zeigt die freien Fahrzeuge mit Fahrzeit und Kosten; die Fahrt
  läuft danach ganz normal auf der Karte und unter *Live*. Gute Qualität
  bringt bis zu 16 % mehr.
* **Echte Mengen und Preise** – gehandelt wird in üblichen Gebinden: Weizen
  im 10-kg-Sack, Tomaten und Äpfel in 2-kg-Kisten, Eier in 6er-Schachteln,
  Milch in 5-l-Kannen, Butter zu 250 g. Bestellungen zeigen die echte Menge
  („18 Eier, 4 kg Tomaten“) und zahlen den Hofladenpreis plus Liefergebühr –
  rund 25 bis 35 € statt Fantasiepreisen. Auch Saat, Tiere, Ställe und
  Ausbauten kosten entsprechend weniger.
* **Nur die eigenen Orte** – vor der Speditionsgründung liegt alles unter
  dem Nebel außer dem Hof und den Orten, aus denen beim aktuellen Level schon
  Bestellungen kommen (zum Start Werder und Glindow, ab Level 2 Petzow und
  Geltow, ab Level 3 Caputh und Potsdam …), jeweils in einem kleinen
  Sichtkreis von gut 2 km. Mit jedem Level-Aufstieg meldet ein Hinweis die
  neue Kundschaft auf der Karte; Berlin bleibt bis zur Gründung zu.
* **Teich** – mit Tiefenverlauf, feinen Wellen, Sandufer, Schilf, Seerosen,
  Steg mit Ruderboot und Enten, die ihre Runden ziehen. Im Wasser wächst kein
  Baum – ältere Spielstände rücken solche Bäume ans Ufer.
* **Laden und Bauen** – Felder, Bäume, Tiere, Kuhstall, Schweinestall,
  Schafweide, Rinderweide, Molkerei, Metzgerei, Spinnstube, zweiter
  Hühnerstall und Deko. Neues erscheint als Vorschau im Raster: hinziehen, ↻
  drehen, ✓ setzen. Lange auf ein Objekt drücken verschiebt es.
* **Opas Notizbuch** – oben links immer die nächste Aufgabe mit Belohnung,
  aufgeteilt in vier Kapitel: *Ankommen* (Felder, Ofen, Hühner, erste
  Lieferungen), *Wachsen* (Kuhstall, Milch, Kuchen, Potsdam), *Vieh & Handwerk*
  (Schweine, Schafe, Metzgerei, Spinnstube) und *Meisterhof* (Molkerei, Käse,
  Pizza, Rinder, beste Qualität, volle Regale). Was schon steht, zählt
  sofort; jedes Kapitel endet mit einer Feier, einem Bonus und einem Satz von
  Opa. Spielstände von v38 machen an derselben Aufgabe weiter.
* **Erfahrungspunkte (EP)** – für Ernten, Gießen, Backen, Tiere, Lieferungen
  und das Notizbuch, immer als ganze Zahl. Wie in Hay Day springt ein
  goldener Stern mit „+N“ aus dem Objekt, schwebt kurz und fliegt dann im
  Bogen in den EP-Balken oben, der beim Ankommen aufleuchtet und funkelt.
  Der Balken zeigt, wie viele EP bis zum nächsten Level fehlen; ein Tipp
  darauf erklärt es.
* **Erfolgsmomente** – fliegende Waren ins Lager, Münzen und EP-Sterne,
  Level-Feier mit allem, was neu freigeschaltet ist, Rauch aus dem Ofen,
  drehende Mühlenflügel, Tag und Nacht mit leuchtenden Fenstern, dazu
  kleine Töne (abschaltbar).
* **Linas Rundgang** – zum Start zeigt Lina mit dem Finger, was zu tun ist:
  ernten, säen, gießen, Eier holen, füttern, backen, pflücken, die erste
  Lieferung losschicken und mit Opas Axt den ersten jungen Baum am Teich
  fällen.

## Wald, Sägewerk und See (3D)

Der Hof ist der Mittelpunkt einer großen Welt: im Norden und Westen der
Plötziner Forst mit Bach, Brücke und Lichtungen, dahinter der alte Wald, am
Waldweg Krügers verfallenes Sägewerk und im Süden der Glindower See mit Insel,
Schilf und Seerosen. Was noch nicht dir gehört, ist **grau** und mit einer
rot-weißen Schranke gesperrt. Die runden Knöpfe links springen zwischen
**Hof, Wald, Sägewerk, altem Wald und See**; oben rechts stehen Ausdauer 💪,
Kleeblätter 🍀, Wetter mit Tageszeit und das laufende Ereignis.

* **Fertig? Gelber Rand** – reife Felder und Obstbäume, Ställe mit Eiern,
  Milch oder Wolle, Gebäude mit fertiger Ware, der Verkaufsstand mit
  Einnahmen und die Bestelltafel mit lieferbarer Bestellung leuchten mit einem
  leichten gelben Umriss.
* **Hof-Ausbau in vier Stufen** – am Anfang grau und verwittert: morscher Zaun
  mit Lücken, Erdwege voller Unkraut, alte Reifen, Schrott und Bretter zum
  Wegräumen (kostet Ausdauer, bringt Holzreste und EP). Stufe 2 *Ausgebauter
  Hof*: frischer Anstrich, neuer Zaun, Kieswege, Traktor, mehr Platz in Silo
  und Scheune, ein Warteplatz mehr. Stufe 3 *Professioneller Betrieb*:
  Pflaster, Laternen, Blumen, weißer Zaun. Stufe 4 *Großer Wirtschaftshof*:
  Steinmauer mit Steintor, Maschinenhalle, das Gelände wächst um zwei Kacheln
  nach jeder Seite. Ausbau im Wohnhaus unter „🏡 Ausbau“ – mit Holz aus dem Wald
  und später aus dem Sägewerk.
* **Der Wald** – sobald drei Bäume am Teich gefällt sind und das Erbe Level 5
  erreicht hat, kommt **Förster Bruno Wendt** ans Westtor (antippen auf einen
  gesperrten Knopf zeigt jede Bedingung mit Häkchen und Zähler): „Der Förster hat einen Weg durch den Wald freigegeben.“ Der Weg
  wird freigeschnitten, der Wald deckt sich Stück für Stück auf. 175 fällbare
  Bäume: Birken am Waldrand, Kiefern und Fichten im Westen, Buchen und Eichen
  im Norden, selten eine blühende Wildkirsche (Edelholz) – klein, mittel,
  groß und im alten Wald uralt. Gefällte Bäume werden zum Stumpf, treiben aus
  und wachsen wieder nach.
* **Axt** – Timing-Minispiel: Die Nadel pendelt, tippen, wenn sie im Grünen
  steht. Drei Volltreffer im dunkelgrünen Feld oder sieben gute Schläge im
  hellgrünen fällen den Baum; sauber gefällt gibt einen Stamm extra. Jeder
  Schlag kostet **Ausdauer**; sie kommt langsam zurück oder sofort mit einer
  Brotzeit aus dem Lager (Brot, Kuchen, Wurst, Fisch …). Wer aufhört, findet
  den Baum angeschlagen wieder. Die Stahlaxt (Level 3) hat mehr Wucht und
  schafft große Bäume.
* **Kettensäge** (Level 7, nach 25 Bäumen) – erst die **Fallrichtung** wählen
  (frei, nicht auf Bäume, Wege oder den Hof), dann den **Fallkerb** auf
  Kniehöhe setzen, dann gedrückt halten zum Sägen – ohne den Motor zu
  **überhitzen**. Gute Richtung bringt mehr Holz, Hängenbleiben kostet
  Qualität; Sprit 3 € je Baum. Mit der Säge kommt der **Sägebock** auf den
  Hof: Bretter, Pfosten und Brennholz. Die Profi-Säge (Level 13) schafft die
  uralten Eichen im alten Wald.
* **Holzhändler** – im Holzplatz-Lager: Rohholz zum vollen Preis, Holzwaren
  zum halben (Bestellungen zahlen mehr). Neue Kundschaft: Baumarkt,
  Kaminstudio, Tischlerei, Zimmerei, Werft, Holzhandel, Möbelhaus.
* **Das alte Sägewerk** – Nachbar **Erwin Krüger** verschenkt es (Level 9,
  Kettensäge, 30 Bäume). Fünf Reparaturen, jede ein Handwerks-Minispiel:
  **Dach** (Nägel im richtigen Moment einschlagen), **Elektrik** (Kabel in der
  richtigen Reihenfolge anklemmen), **Sägemaschine** (Zahnräder auf die
  passenden Achsen), **Förderband** (Teile in die passenden Lücken),
  **Motor** (Dreck wegwischen, Teile der Reihe nach einsetzen). Man sieht das
  Sägewerk mit jeder Reparatur wieder heil werden. Danach: **Kessel** verfeuert
  Holzreste und Äste zu Strom, die **Gattersäge** macht Bretter, Balken,
  Holzplatten, Kisten, Pfosten und Eichenbohlen; dazu kaufbar Holzspalter
  (Brennholz, Kaminholz), Hobelmaschine (Dielen), Trockenkammer (Bauholz),
  Verpackungsmaschine (Europaletten), Schleifmaschine (Möbelteile,
  Schatullen) und Fräse (Zaunelemente, Türen) – Laden-Reiter „🪚 Sägewerk“.
  Ausbau: Blockbandsäge (ein Drittel schneller), größerer Kessel. Krügers
  alter **Unimog** läuft nach der Motor-Reparatur in der eigenen Flotte.
* **Der Glindower See** – die Bürgermeisterin verpachtet das Ufer (Level 15,
  Sägewerk läuft, 40 Holzwaren gemacht). Am Ufer liegen sieben **Bauplätze**:
  Steg, Fischerhütte, Bootshaus (mit Ruderboot), Fischlager, Räucherei,
  Kühlhaus und Fischmarkt – jedes braucht Holz aus dem Sägewerk, beim Bauen
  wird mitgenagelt. Die frühere kleine Fischerei an der Ostsee gibt es nicht
  mehr.
* **Angeln** – vom Steg oder mit dem Boot an sechs Stellen (Seerosenbucht,
  Schilfgürtel, Steinkante, mit dem Motorboot auch Tiefe Mitte und
  Bachmündung). Was beißt, hängt von **Tageszeit und Wetter** ab: Forellen
  morgens, Zander und Aal nachts, bei Regen Aale und selten die Gold-Schleie.
  Auswerfen, auf den Biss warten, anschlagen, dann im **Drill** die Spannung
  im grünen Bereich halten – zu straff reißt die Schnur, zu locker ist er
  weg. Ein ruhiger Drill gibt mehr Sterne. Verarbeitung: Filets, Karpfen blau,
  Räucherforelle und -aal (mit Brennholz aus dem Sägewerk), Konserven,
  Frischfischkisten (in Holzkisten), Edelfisch-Boxen, Hechtklößchen,
  Fischbrötchen.
* **Mitarbeiter** (ab Level 8, im Wohnhaus unter „👷 Team“) – Fahrer/in (mehr
  Liefergeld), Landwirt/in (gießt mit), Mechaniker/in (Reparaturen und Strom
  günstiger, keine klemmende Säge), Holzfäller/in (mehr Holz, fällt selbst)
  und Fischer/in (fischt selbst). Jede Person hat eine Eigenschaft, will
  täglich Lohn und eine Brotzeit aus dem Lager – und steht sichtbar bei der
  Arbeit.
* **Ereignisse** – Sturm (danach liegen Bäume zum Aufsammeln), fliegender
  Händler (höchstens einmal am Tag, eine Stunde an der Straße), Fischschwarm, Nachbar braucht Holz, Holz- und Fischpreise steigen,
  weißer Hirsch (Glücksbringer), kreisende Vögel über einem Schatz
  (Graben-Minispiel), klemmende Säge (Zahnräder richten), Paket am Tor,
  Wildschweine mit Pilzen, Reh auf dem Weg (Reh und Hirsch nicht mitten in
  der Nacht).
* **Wildtiere je nach Tageszeit** – tagsüber Rehe, Hasen, Eichhörnchen,
  Singvögel und ein Graureiher im flachen Wasser am See; in der Dämmerung
  Wildschweine; nachts Füchse und Igel, Eulen gleiten über Hof und Wald (ihre
  Augen leuchten, wie die der Füchse), Fledermäuse flattern um die Scheune
  und am Ufer. Jedes Tier zeigt sich nur eine Weile und zieht sich dann
  zurück – im Schnitt sind nur drei, vier gleichzeitig unterwegs. Antippen
  scheucht sie auf (beim ersten Mal +1 EP). Kreisen über einem Schatz nachts
  Vögel, sind es die Eulen.
* **Verkaufsstand** an der Straße (3 bis 6 Plätze je Ausbaustufe) und
  **Fischmarkt** am See (Fisch +15 %): Ware einstellen, Preis wählen –
  günstig geht schnell, teuer dauert –, später kassieren.
* **Kleeblätter 🍀 und Extras** – Kleeblätter gibt es fürs Spielen (Level,
  Kapitel, neue Gebiete, Ereignisse, Tagesbonus). Im Laden unter „🍀 Extras“:
  Scheune in Taubenblau oder Moosgrün, Schieferdach, grüner Traktor,
  Haustiere (Hofhund, Katze, Ziege laufen über den Hof), Saison-Deko
  (Weihnachtsbaum, Kürbislaternen, Maibaum, Schneemann, Osterhase) und Komfort
  (große Brotdose, Thermoskanne, Werkzeuggürtel). Nichts davon ist nötig zum
  Weiterkommen. Die Vorschaubilder sind das echte 3D-Modell, so wie es danach
  auf dem Hof steht – das gilt im ganzen Laden (Felder, Bäume, Tiere, Ställe,
  Gebäude, Sägewerk, Deko). „Kleeblätter kaufen“ und „Bonus-Video“ sind nur
  Platzhalter.
* **Opas Notizbuch** hat jetzt **elf Kapitel**: vier auf dem Hof, dann *Der
  Wald*, *Die Kettensäge*, *Das alte Sägewerk*, *Holzproduktion*, *Am See*,
  *Fischverarbeitung* und *Wirtschaftshof*. Das Erbe hat ein eigenes Level;
  nach der Speditionsgründung fängt die Spedition bei Level 1 an.

### Vom Hof zur Spedition

Erst wird das Erbe einmal durchgespielt – Hof, Wald mit Sägewerk und der
See: Solange Opas Notizbuch nicht abgehakt ist, gibt es nur die eigene Ware,
und Linas Erklärungen zur Spedition warten. Ist das letzte der elf Kapitel
geschafft, heißt es „Alles läuft!“, und Lina ruft an: Die Leute fragen, ob man nicht auch ihre Sachen
mitnimmt. Mit **„Spedition gründen“** kommen
fremde Aufträge, Büros, Etappen und alles Weitere dazu – Linas
Dispositions-Tutorial startet. Der Hof läuft weiter und ist jederzeit über den
Reiter **Hof** erreichbar. Im Wohnhaus lässt er sich auch **verkaufen**: Der
Hofwert (Land, Felder, Bäume, Tiere, Ställe, Lager und Level) kommt auf einen
Schlag aufs Konto – endgültig, aber ein kräftiger Schub für die Spedition.

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
bleibt die Karte links stehen und die Ansicht dockt rechts an. Hof bzw. Hafen
füllen dort den ganzen Bildschirm bis zum unteren Rand; die Leiste sitzt
rechts unten darüber, Fenster öffnen sich mittig in der freien Fläche daneben.

| Aktion | Wie |
|---|---|
| Karte bewegen | Ziehen, zwei Finger zum Zoomen, Mausrad |
| Station oder Fahrzeug ansehen | Antippen |
| Fahrzeug live verfolgen | Fahrzeug antippen → *live verfolgen*, oder 📡 |
| Verfolgung beenden | Karte ziehen oder ✕ am Live-Band |
| Tempo | Leiste links an der Karte: ⏸ (hält an / läuft weiter), 1×, 3×, 10×, 30× |
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

### Mehr Leben im Betrieb

Wer nur auf 30× stellt und zusieht, verpasst das Beste – und verliert Aufträge.

* **Einladungen zur Sonderfahrt** ✉️ – selten (alle paar Spieltage), eilig und
  fürstlich bezahlt: Blutkonserven für die Notaufnahme, eine Stradivari fürs
  Konzerthaus, das Ersatzgetriebe bei Bandstillstand, später Impfstoff nach
  Mailand oder ein Gemälde nach New York. Sie kommen als Brief mit Wachssiegel,
  der sich öffnet: Briefkopf, Anrede, Gegenstand, Abholung, Frist, Honorar,
  handschriftliche Unterschrift. Zusagen muss man vor Ablauf der Antwortfrist,
  disponieren nur der Chef – die Dispo fasst sie nie an. Pünktlich geliefert
  gibt es ein Dankschreiben und viel Ruf.
* **Konkurrenz** ⚔️ – Blitzfracht, Rabe & Söhne und ab Etappe 3 Nordstern Cargo
  schnappen umkämpfte Ausschreibungen weg; auf der Karte steht, wann. Unter
  *Welt* zeigt der Marktanteil, wer gerade vorn liegt.
* **Verhandeln** 🤝 – bei Großaufträgen im Planer per Schieberegler einen
  Aufschlag verlangen. Zu gierig, und der Kunde geht zur Konkurrenz; knapp
  drüber, und es kommt ein Gegenangebot.
* **Störungen** 🚧 – Stau, Sturm am Flughafen, Orkan vor dem Hafen,
  Hafenstreik, Lokführerstreik, Niedrigwasser. Auf der Karte eingezeichnet,
  oben ein Knopf „🚧 3 Störungen ▾“, der die Liste aufklappt (antippen fliegt
  hin), im Planer als Warnung. Sind eigene Fahrten betroffen, fragt die
  Verkehrsleitstelle: umfahren, abwarten oder um Aufschub bitten.
* **Pannen und Vorfälle** 🔧 – hängen am Verschleiß und kommen höchstens alle
  paar Spieltage. Der Fahrer, Lokführer oder die Kapitänin ruft an (zum
  Annehmen wischen). Je nach Verkehrsträger: Lkw-Panne oder Motorschaden
  (Pannendienst, Abschleppen, selbst versuchen), Lokschaden oder Heißläufer
  (Ersatzlok, Diesellok, warten), Ruderschaden auf dem Fluss (Schlepper,
  Leichterschiff, halbe Kraft), Maschinenschaden oder Brand auf See
  (Hochseeschlepper, Techniker per Hubschrauber, mit halber Kraft weiter),
  Triebwerksschaden, Vogelschlag oder Hydraulikleck beim Flugzeug (AOG-Team,
  Charter, auf das Ersatzteil warten). Die Kosten richten sich nach Fahrzeug-
  und Auftragswert – ein liegengebliebener Frachter kostet schnell sechs- bis
  siebenstellig. Ab Etappe 4 trifft es seltener die Lkw und eher die großen
  Brocken. Gratis-Wege lassen sich immer wählen, auch im Minus. Bei Mr. Snus
  kann unterwegs eine **Streife** auftauchen.
* **Tempo** ⏱️ – kommt ein Anruf oder eine Einladung, bremst das Spiel auf 1×.
  Solange etwas offen ist, geht es höchstens mit 3×. Wer nicht antwortet, für
  den entscheidet nach einer Weile jemand anderes – meist die billigste Lösung.
* **Verschleiß & Werkstatt** – jedes Fahrzeug hat einen Zustand; alte fallen
  öfter aus und bringen beim Verkauf weniger. Die Dispo im Büro schickt stark
  abgenutzte Fahrzeuge selbst zur Inspektion.
* **Treibstoffpreis** ⛽ – Diesel und Kerosin schwanken täglich (mit
  gelegentlichen Ölpreis-Sprüngen); Räder und E-Fahrzeuge sind nicht betroffen.
* **Versicherung, Hausbank, Monatsabschluss** – die Flottenversicherung zahlt
  80 % bei Pannen und Unfällen, die Hausbank leiht Geld für schnelles Wachstum
  (60 Tage, tägliche Rate, vorzeitig ablösbar), alle 30 Tage gehen 30 % Steuern
  auf den Gewinn der offiziellen Bücher ab.
* **Ruf** ⭐ – je Region; pünktlich hebt ihn langsam, verspätet oder geplatzt
  senkt ihn schnell. Er ändert die Preise (−10 % bis +15 %), wie oft die
  Konkurrenz zugreift und wie oft Einladungen kommen.
* **Rahmenverträge** 📑 – ab Level 4 bieten Großkunden Verträge an: täglich
  feste Fahrten über mehrere Tage, gut bezahlt, mit Vertragsstrafe je Ausfall
  und 15 % Bonus, wer mindestens 90 % schafft.
* **Missionen** 🧭 – Lina meldet sich mit kleinen Geschichten:
  Weihnachtsgeschäft, Grüne Woche, Kühlkette, Hochwasserhilfe Dresden,
  Messe-Marathon Hannover, Rekordwoche im Hafen, Luftbrücke.
* **Tagesaufgaben & Erfolge** 🎯 – jeden Morgen drei Aufgaben mit Prämie
  (alle drei gibt Extra-Bonus und eine Luckybox), dazu 24 Erfolge mit
  Abzeichen. Alles unter 🎯 neben dem Telefon.
* **Luckybox** 🎁 – siehe unten.
* **Selbst beladen** 📦 – unter *Live* bei noch nicht beladenen Fahrten: Kisten
  in den Laderaum ziehen oder antippen, ↻ dreht. Alles verstaut in der Zeit
  bringt 8 % mehr Erlös und schnelleres Beladen.

Lina erklärt das alles einmal, sobald Level 2 erreicht ist; unter *Welt* lässt
sich das wiederholen.

### Luckybox

Wer an einem Tag alle drei Tagesaufgaben schafft, bekommt eine 🎁 Luckybox,
eine pünktliche Sonderfahrt bringt eine als Dankeschön. Sieben Tage in Folge
alles geschafft gibt zusätzlich eine 💎 goldene Box mit besseren Chancen. Die
Boxen warten unter 🎯 (der Knopf zeigt dann 🎁 und die Anzahl). Beim Öffnen
wackelt die Box, springt auf, und ein Preisband läuft durch, bis es auf dem
Gewinn stehen bleibt.

| Seltenheit | Chance (gold) | Preise |
|---|---|---|
| Gewöhnlich | 55 % (25 %) | 💶 Trinkgeldkasse · ⭐ Erfahrungsschub · ⛽ Tankkarte (24 h Diesel/Kerosin halber Preis) · 🔧 Werkstattgutschein |
| Selten | 28 % (40 %) | ☕ Kaffeemaschine (+15 Stimmung in allen Büros) · 🤝 Empfehlungsschreiben (+6 Ruf) · 🛡️ Rundum-Schutz (7 Tage gratis versichert) · 🏷️ Händlerrabatt (−20 % aufs nächste Fahrzeug) |
| Episch | 13 % (27 %) | 📈 Hochsaison (24 h +20 % Frachterlös) · 🕴️ Headhunter (★★★★★-Fachkraft ohne Vermittlungsgebühr) · ✉️ Insider-Tipp (nächste Sonderfahrt in wenigen Stunden) |
| Legendär | 4 % (8 %) | 🏆 **Hauptpreis: der Goldene Bulli** – VW T1 Samba „Goldstück“, 900 kg, Wertkurier, +10 % Erlös auf jeder Tour, nicht käuflich. Wer ihn schon hat, bekommt den Jackpot. |

Beträge wachsen mit der Etappe mit. Aktive Vorteile stehen im Regal unter 🎯
und oben unter *Flotte*.

### Auktionshaus Falkenried

Unter *Markt* schaltet oben ein Umschalter zwischen **Fahrzeugmarkt** und
**Auktionshaus** um. Dort laufen immer etwa acht Lose: 77 reale Sport-,
Super- und Hypercars von Porsche, Audi, Mercedes-Benz, BMW, Ferrari, Bugatti
und Lamborghini – vom Porsche 924 über Countach, F40, 300 SL, CLK GTR und
Carrera GT bis zu Chiron, Divo, La Voiture Noire und Tourbillon – dazu ab und
zu gebrauchte Nutzfahrzeuge aus einer Insolvenzmasse.

* **Ansehen** – jedes Los mit Foto, Baujahr, Kilometerstand, Originalfarbe,
  Zustandsnote, Leistungsdaten, Stückzahl und Schätzpreis. Der **Katalog**
  zeigt alle Modelle mit Marktwert und Wertentwicklung, filterbar nach Marke.
* **Bieten** – „bieten“ legt das nächste Gebot, im Los lässt sich ein
  **Limit** setzen, bis zu dem das Haus automatisch mitsteigert. Sammler,
  Telefonbieter und die Konkurrenz bieten dagegen. Auf den Zuschlag kommen
  12 % Aufgeld.
* **Schlussphase** – bietest du mit, hält beim Ablauf die Uhr an: Der
  Auktionator ruft „Zum Ersten … Zum Zweiten … Zum Dritten“, andere legen nach,
  du kannst live erhöhen. Am Ende fällt der Hammer.
* **Garage** – ersteigerte Autos mit Marktwert und Gewinn/Verlust. Klassiker
  steigen meist, neue Sportwagen fallen eher. Ein Auto kann als **Wertkurier**
  mitfahren (Schmuck & Uhren), jeder Kilometer kostet aber Sammlerwert.
* **Verkaufen** – Autos aus der Garage und eigene Flottenfahrzeuge (unter
  *Flotte* „versteigern“) lassen sich einliefern, auf Wunsch mit Mindestpreis.
  8 % Provision, unverkauft kommt alles zurück.

Die Fotos lädt das Spiel zur Laufzeit von Wikipedia/Wikimedia Commons (das
Titelbild des jeweiligen Artikels als 500-px-Vorschaubild, eine
Standardgröße, die Wikimedia fertig vorhält) und zeigt Fotograf und Lizenz
direkt am Bild. Die Fotos kommen **nacheinander** statt alle auf einmal; wird
Wikimedia gedrosselt (HTTP 429), wartet das Spiel kurz und versucht es
erneut, sonst über eine kleinere Größe oder das Original. Jedes Foto läuft
einmal durch einen eigenen **Comic-Filter für Autos** (im Hintergrund, ohne
Ruckeln): kräftig geglättet, damit Lack zur Fläche wird, weiche Tonstufen
statt harter Treppen, kräftigere Farben und schwarze Tuschelinien aus
Helligkeits- und Farbkanten – Schatten bleiben Fläche. Danach wird es
gespeichert, beim nächsten Mal steht es sofort da. Bleibt Wikipedia
unerreichbar, sagt ein Hinweis warum und bietet „Erneut versuchen“. Bis dahin
steht eine leicht pulsierende Silhouette in der Originalfarbe.

### Zoll

Ab Etappe 4 gehen Fahrten über Zollgrenzen (Schweiz, Norwegen, Türkei,
Großbritannien, Übersee). Für selbst disponierte Fahrten steht unter *Live*
„🛃 Zollanmeldung offen · prüfen“: Links die Handelsrechnung, rechts was der
Azubi angemeldet hat – Versender, Empfänger, Zolltarifnummer, Gewicht,
Packstücke, Warenwert, Ursprung, Incoterm. Fehler antippen, abschicken, auf
Zeit. Fehlerfrei gibt es die **Grüne Spur** (+4 % Erlös, kein Halt), ein
Fehler bedeutet eine **Stichprobe** (1–2 h), mehr eine **Beschau** (3–6 h und
Bußgeld). Wer es liegen lässt, zahlt einen Zollagenten und hofft. Büros mit
Zoll & Papiere erledigen ihre eigenen Fahrten selbst und geben dir bei
deinen einen Tipp und zehn Sekunden mehr.

### Übernahmen

Unter *Welt* → „🦈 Übernahmen“: ab Level 5 und sobald du mehr Marktanteil
hast als die Konkurrentin, kannst du ihr ein Angebot machen. Bis zu drei
Runden, mit Gegenangeboten – wer zu frech bietet, wird zwei Tage nicht mehr
angehört. Nach dem Kauf gehören dir ihre Flotte (noch in alten Farben), ihr
Firmensitz als Büro samt zwei Leuten (oder der Erlös aus dem Verkauf) und ihr
Marktanteil; sie schnappt keine Aufträge mehr weg. Neu dazu: Atlas Global
Freight (Etappe 4) und Pacific Star Lines (Etappe 5).

### Lackierung & Logo

Unter *Flotte* oder *Welt* → „🎨 Lackierung & Logo“: Grund- und Zweitfarbe
(acht Vorgaben oder jede beliebige Farbe über das Farbrad mit Helligkeitsregler),
sieben Muster (Rallyestreifen, Zweifarbig, Diagonal, Welle, Zielflagge,
Flammen), ein Logo als Monogramm oder Symbol in fünf Formen – live an einem
Transporter mit Firmennamen. Lackieren kostet je Fahrzeug, lackierte
Fahrzeuge fahren in Firmenfarben über die Karte und bringen 2 % mehr Erlös.
Das Logo steht oben am Porträt, die Büros auf der Karte tragen die
Firmenfarbe. Sammlerautos und Sondereditionen bleiben im Original.

### Größere Büros

Fünf Größen: Kontor, Umschlaghalle, Logistikzentrum, ab Etappe 2 das
**Bürogebäude** 🏬 (2 Etagen, 24 Plätze, 60 Stellplätze, +3 % Prestige auf
jeden Auftrag) und ab Etappe 4 die **Konzernzentrale** 🏙️ (3 Etagen, 36
Plätze, 100 Stellplätze, +6 % Prestige). Beim Einrichten schaltet man oben
zwischen EG und den Obergeschossen um; Empfang, Küche und Hof sind im EG, die
Schreibtische verteilen sich auf alle Etagen, oben sitzt der Vorstand.

### Bewerbungen

Jeden Morgen kommen neue Bewerbungen – im Kontor drei, in größeren Häusern
mehr (in der Konzernzentrale bis zu acht zusätzliche). Wer nicht bis morgen
warten will, schaltet unter den Bewerbungen eine **Stellenanzeige** für eine
bestimmte Stelle: sofort drei passende Leute, gegen eine Anzeigengebühr.

Neue Pflanzen stellt das Büro paarweise in die unteren Ecken, dann nach oben
– nie auf Treppe, Tür oder Küche. Verschieben geht weiter mit dem Finger.

### Die Stellen im Büro

Im Büro-Rundgang stellt Lina jede der vier Stellen einzeln vor – Disposition,
Fahrpersonal, Umschlag, Zoll & Papiere. Tippt man später im Büro auf eine
Stelle, erklärt sie sie noch einmal, mit den Zahlen genau dieses Büros (wie
viele Fahrzeuge die Dispo schafft, wie viele gleichzeitig fahren können, wie
viel schneller umgeschlagen wird, wie viel Zuschlag es gibt).

### Live-Verfolgung filtern

Unter *Live* filtert eine Leiste die laufenden Fahrten: Alle, 📦 Regulär,
🕶️ Grau (Mr. Snus und Don Pablo), ✉️ Sonderfahrt und ⚠️ Probleme
(verspätet oder liegengeblieben). Grau und Sonderfahrt erscheinen nur, wenn
es solche Fahrten gibt.

### Disposition: selbst oder im Büro

Eine eigene Auto-Disposition gibt es nicht mehr – automatisch disponieren nur
die Leute aus der **Disposition** in deinen Büros. Jedes Fahrzeug gehört
entweder einem Büro (zuordnen unter *Büros* oder direkt am Fahrzeug unter
*Flotte*) oder bleibt bei dir: Dann nimmst du die Aufträge selbst an. Der
Reiter *Flotte* zeigt oben, welches Büro wie viele Fahrzeuge fährt.

**Schnell zuordnen:** Jedes Büro zeigt, wie viele Fahrzeuge es betreuen kann
(was die Disposition schafft, höchstens so viele wie Stellplätze). „Auffüllen“
ordnet genau so viele zu – wahlweise alle, nur große (ab Lkw) oder nach
Verkehrsträger, zuerst die im Einzugsgebiet, dann die größten. Unter *Flotte*
verteilt „⚡ Große verteilen“ bzw. „alle verteilen“ die ganze Flotte auf einen
Schlag: jedes Fahrzeug ins nächste Büro mit freier Kapazität. „alle lösen“
holt die Fahrzeuge eines Büros wieder zu dir.

Die Dispo nimmt nur Aufträge an, die sie pünktlich schafft – Verspätungen
kosten Ruf. Wie viel ein Büro schafft, hängt am Team (Können × Stimmung): eine
Disponentin mit ★★★ betreut rund zehn Fahrzeuge und schaut etwa alle 25
Minuten nach freien Fahrzeugen, zwei gute schaffen deutlich mehr. Fahrpersonal
begrenzt, wie viele davon gleichzeitig rollen, Zoll & Papiere bringen
Zuschlag. Jedes Büro lässt sich mit einem Schalter pausieren.

### Flotte filtern und aufräumen

Unter *Flotte* filtert eine Leiste nach Nutzung (🚚 im Einsatz, 💤 frei,
🕸️ ungenutzt seit mindestens 1–14 Tagen), nach Besitz (Eigentum, Leasing, im
Büro, selbst) und nach Verkehrsträger; sortieren lässt sich nach Art, längster
Standzeit, geringster Auslastung, Fixkosten oder Wert. Jedes Fahrzeug zeigt,
seit wann es frei steht und wie ausgelastet es die letzten Tage war. Sobald
ein Filter aktiv ist, steht oben ein Sammelknopf: alle freien Fahrzeuge der
Auswahl auf einmal verkaufen bzw. Leasing beenden – mit Summe, eingesparten
Fixkosten und Sicherheitsabfrage. Fahrzeuge im Einsatz und Sondereditionen
bleiben.

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
extras.js               Entscheidungen, Anruf, Tempo-Bremse, Diesel, Verschleiß, Werkstatt, Versicherung, Kredit, Steuern, Ruf
events.js               Störungen auf der Karte, Pannen und Unfälle, Streife
vip.js                  Einladungen zur Sonderfahrt, Konkurrenz, Verhandeln
goals.js                Rahmenverträge, Missionen, Tagesaufgaben, Erfolge
lucky.js                Luckybox: Preise, Preisband, Goldener Bulli, Vorteile
cars.js                 Sammlerautos fürs Auktionshaus: 77 reale Modelle mit Daten
auction.js              Auktionshaus: Lose, Bieten, Zuschlag live, Garage, Einliefern, Fotos
customs.js              Zoll: Grenzen, Zollanmeldung als Minispiel, Grüne Spur, Beschau
corp.js                 Übernahmen der Konkurrenz: Firmenwert, Verhandlung, Übergabe
livery.js               Firmen-Lackierung und Logo: Editor, Kosten, Kartenfarben
loading.js              Packspiel „Selbst beladen“
snus.js                 Mr. Snus: Chat, Einkauf, Lager, Kunden, Zivilfahnder, Haft
pablo.js                Don Pablo: Angebot, Hangar, Kunden, Interpol-Bericht
game.js                 Simulation, Routing, Wirtschaft, Oberfläche
farmdata.js             Hof: Waren, Pflanzen, Tiere, Rezepte, Kundschaft, Notizbuch, Dorfknoten, Erbe-Register (FSITES)
fishdata.js             Fischerei am See: Fische, Fischwaren, Gebäude, Boote, Fangplätze, Tageszeit, Wetter
erbedata.js             große Welt: Holz, Baumarten, Werkzeug, Ausdauer, Sägewerk, Gebiete, Ausbaustufen, Team, Ereignisse, Extras, Kapitel 5–11
farm.js                 Erbe: Spielstand, Ernte, Tiere mit Platz-Qualität, Mast, Rezepte, Bestellungen, Verkauf, Umwandlung alter Spielstände
erbe.js                 Spiellogik der großen Welt: Erbe-Level, Gebiete, Bäume, Ausdauer, Sägewerk, Strom, See, Team, Ereignisse, Stand
gl3d.js                 eigene kleine WebGL2-Engine: Low-Poly, Schatten, Wasser, Partikel, Sichtkegel-Test, Sperrgebiete
farmmodels.js           alle 3D-Modelle des Hofs, prozedural gebaut
fishmodels.js           3D-Modelle für Räucherei, Kühlhaus, Angler und Rute
woodmodels.js           3D-Modelle der Welt: Bäume je Art und Größe, Gelände, Wege, Bach, See, Sägewerk, Fischerei, Boote, Tiere, Leute, Deko
farmview.js             3D-Ansicht des Erbes: Kamera, Gesten, Werkzeuge, Fenster, Effekte, Rundgang
worldview.js            große Welt in 3D: Kulisse in Kacheln, Sperrgebiete mit Aufdecken, Bäume, Wildtiere, Ereignisse, Wetter, Fenster
minigames.js            Minispiele: Axt, Kettensäge, Nageln, Kabel, Zahnräder, Förderband, Motor, Graben, Angeln
fishview.js             See in Bewegung: Angeln vom Steg, Bootsfahrten, Pose und Rute, Enten, springende Fische
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

### Flüssig beim Hineinzoomen

Routen, Nebel-Schneisen und Störungskreise werden vor dem Zeichnen auf den
sichtbaren Ausschnitt zugeschnitten (Liang–Barsky). Vorher zeichnete der
Browser bei Zoom 15 jede Strecke auf ihrer vollen Länge – Hunderttausende
Bildpunkte, gestrichelt –, das kostete pro Bild über eine halbe Sekunde.
Liegt der ganze Bildschirm im erschlossenen Gebiet, entfällt der Nebel ganz.

### Pause und Störungsliste

Den Pause-Knopf neben dem Firmennamen gibt es nicht mehr; angehalten wird mit
⏸ oben in der Tempo-Leiste links an der Karte. Ein zweiter Tipp lässt die Uhr
wieder laufen, solange angehalten ist, leuchtet der Knopf gelb. Die Störungen
stehen nicht mehr als Reihe über der Karte, sondern als ein Knopf mit Anzahl,
der eine Liste aufklappt.

### 3D ohne Fremdbibliothek

Die Hofansicht rendert mit einer eigenen, kleinen WebGL2-Engine (`gl3d.js`,
rund 700 Zeilen): flach schattierte Low-Poly-Modelle mit Vertexfarben, Sonne
mit weichen Schatten (Schattenkarte mit PCF), Himmelslicht, Nebel am Rand,
Wasser mit Wellen und Glitzern, wiegende Pflanzen und Bäume sowie Partikel
für Staub, Rauch, Tropfen und Herzen. Alle Modelle entstehen beim Start aus
Grundkörpern (`farmmodels.js`, `woodmodels.js`) – keine einzige Modell- oder
Texturdatei. Die große Welt (gut 260 × 260 Kacheln, Tausende Kulissenbäume)
wird in Kacheln direkt in Float32Arrays gebaut; ein Sichtkegel-Test zeichnet
nur, was im Bild (oder im Schatten) liegt. Gesperrte Gebiete färbt der Shader
grau, beim Freischalten wächst ein Kreis, der sie aufdeckt. Ohne WebGL 2 meldet
die Ansicht das; Lager, Kundschaft und Laden gehen trotzdem.

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
