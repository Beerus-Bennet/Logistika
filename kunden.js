/* =========================================================================
   LOGISTIKA – v244/v245: Kundenprofile, Auftragstexte, Kundenbeziehungen, Geschäftsprojekte, Meilensteine

   · Jeder Speditionsauftrag bekommt einen Titel und eine Kundenanfrage, abgeleitet aus
     Kundenprofil, Ware, Menge, Route und Verkehrsträgern – und vor der Anzeige geprüft.
   · Beziehungsstufen: Neukunde → Bekannter Geschäftspartner (1–2) → Stammkunde (ab 3,
     +3 %) → Bevorzugter Logistikpartner (ab 10, +6 %). Mehr als 30 % verspätet: Stufe 1.
     Ab 5 Lieferungen bietet ein Stammkunde einmal einen Liefervertrag an.
   · Geschäftsprojekte (Serien): gelegentlich drei zusammenhängende Fahrten mit Bonus –
     freiwillig, immer mit der eigenen Straßenflotte fahrbar.
   · Meilensteine: zusätzliche Erfolge mit kleiner, einmaliger Belohnung.
   · Verhandlung und Ausschreibungen: vip.js (negoModel, rivalOnSpawn).
   ========================================================================= */
"use strict";

/* ===================== v245: Kundenprofile & Auftragstexte =====================
   Ursache der alten Widersprüche (v244): Titel und Zitat hingen nur an der Ladungsart – nicht an Verkehrsträger,
   Menge oder Kunde („Eine Schiffsladung voll“ bei einem Bahnauftrag, „zehn Lkw-Fahrten“ bei 1.000 t).
   Jetzt gilt: erst die Auftragsdaten (Ladung, Gewicht, Route), dann ein Kunde, der genau diese Ware in genau dieser
   Menge plausibel verschickt, dann der Text – aus den Daten abgeleitet und vor der Anzeige geprüft (orderTextCheck).
   Verkehrsträger erscheinen im Text nur so, wie sie in den tatsächlichen Routenvarianten vorkommen.

   Profil: n Name · br Branche · st Stil (konzern|mittel|familie|hafen|klinik|handel) · home Netzknoten (optional)
           port true = Start oder Ziel muss ein Hafen-/Bahnterminal sein · f Folgegeschäft (vertrag|folge|saison|projekt)
           g { Ladungsart: [Ware, …] } – Ware: w Name · u Einheit (t|kg|pal|pak|stk|teu) · t Titelstamm · z Zweck
           (beginnt mit „für“) · min/max kg · pp kg je Palette/Paket/Stück · s/pl Stückname · k Gefahrgutklasse · temp Kühlung
           dir Richtung (ex|im|sea, siehe dirOk) · at "air" = nur zum Flughafen (Kerosin) */
const CUSTOMERS = [
  /* Pakete & Kurier (Berlin) */
  { id: "apo", n: "Apotheke am Rosenthaler Platz", br: "Apotheke", st: "familie", home: "b-mitte", f: "folge",
    g: { pak: [{ w: "Medikamente", u: "pak", pp: 4, t: "Medikamentenlieferung", z: "für die Versorgung der Partnerapotheke", min: 5, max: 60 }] } },
  { id: "zalando", n: "Zalando Fulfillment", br: "Onlinehandel", st: "handel", f: "vertrag",
    g: { pak: [{ w: "Retouren", u: "pak", pp: 3, t: "Retourentransport", z: "für das Rücknahmezentrum", min: 40, max: 1200 }] } },
  { id: "charite", n: "Charité Logistikzentrum", br: "Klinikum", st: "klinik", home: "b-mitte", f: "vertrag",
    g: { pak: [{ w: "Laborproben", u: "pak", pp: 2, t: "Probentransport", z: "für das Zentrallabor", min: 5, max: 80 }],
      express: [{ w: "Gewebeproben", u: "kg", t: "Eiltransport von Laborproben", z: "für eine laufende Behandlung", min: 8, max: 120 }] } },
  { id: "ocelot", n: "Buchhandlung Ocelot", br: "Buchhandel", st: "familie", f: "folge",
    g: { pak: [{ w: "Bücher", u: "pak", pp: 12, t: "Bücherlieferung", z: "für eine Lesung in der Filiale", min: 20, max: 400 }] } },
  { id: "radwerk", n: "Fahrradwerkstatt Kreuzberg", br: "Werkstatt", st: "familie", home: "b-kreuz", f: "folge",
    g: { pak: [{ w: "Ersatzteile", u: "pak", pp: 6, t: "Ersatzteillieferung", z: "für laufende Reparaturen", min: 5, max: 150 }] } },
  { id: "notar", n: "Notariat Friedrichstraße", br: "Notariat", st: "klinik", home: "b-mitte", f: "folge",
    g: { pak: [{ w: "Urkunden und Akten", u: "pak", pp: 3, t: "Aktentransport", z: "für einen Beurkundungstermin", min: 5, max: 40 }] } },
  { id: "fotolabor", n: "Fotolabor Prenzlauer Berg", br: "Fotolabor", st: "familie", home: "b-pberg", f: "folge",
    g: { pak: [{ w: "Kunstdrucke", u: "pak", pp: 8, t: "Kunsttransport", z: "für eine Ausstellung", min: 10, max: 150 }] } },
  { id: "spreeland", n: "Spreeland Versandhandel GmbH", br: "Versandhandel", st: "mittel", f: "vertrag",
    g: { pak: [{ w: "Versandware", u: "pak", pp: 5, t: "Paketabholung", z: "für das Paketzentrum", min: 30, max: 1200 }],
      pal: [{ w: "Versandware", u: "pal", pp: 350, t: "Lagerumfuhr", z: "für das neue Logistiklager", min: 300, max: 12000 }] } },
  /* Express */
  { id: "mfteile", n: "Märkische Fahrzeugteile GmbH", br: "Automobilzulieferer", st: "mittel", f: "vertrag",
    g: { express: [{ w: "Sequenzteile", u: "kg", t: "Ersatzteillieferung für eine Produktionslinie", z: "für die Montagelinie unseres Kunden", min: 40, max: 9000 }],
      pal: [{ w: "Produktionskomponenten", u: "pal", pp: 450, t: "Werksversorgung", z: "für das Montagewerk", min: 800, max: 24000 }] } },
  { id: "halbleiter", n: "Elbtal Halbleiter GmbH", br: "Halbleiterfertigung", st: "konzern", f: "folge",
    g: { express: [{ w: "Lithografie-Ersatzmodul", u: "stk", s: "Lithografie-Ersatzmodul", pl: "Lithografie-Ersatzmodule", pp: 3000, t: "Expresslieferung eines Ersatzmoduls", z: "für die Wiederaufnahme der Produktion", min: 20, max: 2500 }] } },
  { id: "tx", n: "Transplantationszentrum Nord", br: "Klinikum", st: "klinik", f: "folge",
    g: { express: [{ w: "Transportboxen mit Proben", u: "stk", s: "Transportbox mit Proben", pl: "Transportboxen mit Proben", pp: 12, t: "Eiltransport für einen Eingriff", z: "für einen geplanten Eingriff", min: 8, max: 80 }] } },
  { id: "offshore", n: "Nordwind Offshore Service", br: "Windenergie", st: "hafen", f: "folge",
    g: { express: [{ w: "Schaltanlagen-Ersatzteile", u: "kg", t: "Ersatzteillieferung für einen Offshore-Windpark", z: "für die Wiederinbetriebnahme einer Umspannplattform", min: 100, max: 12000 }] } },
  { id: "druckerei", n: "Druckerei Tagespresse", br: "Druckerei", st: "mittel", f: "folge",
    g: { express: [{ w: "Ersatzwalze", u: "stk", s: "Ersatzwalze", pl: "Ersatzwalzen", pp: 900, t: "Expresslieferung einer Ersatzwalze", z: "für die Nachtauflage", min: 150, max: 3000 }] } },
  { id: "mode", n: "Modehaus Lindgren", br: "Modehandel", st: "handel", f: "saison",
    g: { express: [{ w: "Kollektionsmuster", u: "kg", t: "Musterversand für eine Modenschau", z: "für die Präsentation der neuen Kollektion", min: 8, max: 400 }] } },
  /* Palettenware */
  { id: "kaufland", n: "Kaufland Zentrallager", br: "Lebensmittelhandel", st: "handel", f: "vertrag",
    g: { pal: [{ w: "Getränke", u: "pal", pp: 650, t: "Filialversorgung", z: "für die Belieferung unserer Filialen", min: 2000, max: 26000 }] } },
  { id: "bosch", n: "Bosch Ersatzteillager", br: "Industriehandel", st: "konzern", f: "vertrag",
    g: { pal: [{ w: "Werkzeuge und Ersatzteile", u: "pal", pp: 400, t: "Ersatzteillieferung", z: "für den Fachhandel", min: 300, max: 20000 }] } },
  { id: "baywa", n: "BayWa Baustoffe", br: "Baustoffhandel", st: "mittel", f: "projekt",
    g: { pal: [{ w: "Baustoffe (Fliesen und Sackware)", u: "pal", pp: 800, t: "Baustofflieferung", z: "für eine Baustelle", min: 800, max: 26000 }] } },
  { id: "ikea", n: "IKEA Distribution", br: "Möbelhandel", st: "konzern", f: "vertrag",
    g: { pal: [{ w: "Möbel in Flachpaketen", u: "pal", pp: 300, t: "Möbellieferung", z: "für das Abholstudio", min: 600, max: 24000 }],
      cont: [{ w: "Container mit Möbeln aus der Fertigung", u: "teu", t: "Containertransport für den Möbelhandel", z: "für unser Verteilzentrum", min: 9000, max: 260000 }] } },
  { id: "oetker", n: "Dr. Oetker Werk", br: "Lebensmittelindustrie", st: "konzern", f: "vertrag",
    g: { pal: [{ w: "Trockenware", u: "pal", pp: 500, t: "Lagerversorgung", z: "für das Regionallager", min: 1000, max: 24000 }] } },
  { id: "wuerth", n: "Würth Handel", br: "Großhandel", st: "konzern", f: "vertrag",
    g: { pal: [{ w: "Befestigungstechnik", u: "pal", pp: 600, t: "Großhandelslieferung", z: "für den Handwerkerhof", min: 300, max: 16000 }] } },
  { id: "papier", n: "Papierfabrik Spremberg", br: "Papierindustrie", st: "mittel", f: "folge",
    g: { pal: [{ w: "Papierrollen", u: "pal", pp: 900, t: "Papiertransport", z: "für die Weiterverarbeitung", min: 2000, max: 26000 }],
      schuett: [{ w: "Holzhackschnitzel", u: "t", t: "Rohstoffversorgung", z: "für die Zellstoffproduktion", min: 200000, max: 1500000 }] } },
  { id: "hoffmann", n: "Maschinenbau Hoffmann GmbH", br: "Maschinenbau", st: "familie", f: "folge",
    g: { pal: [{ w: "Produktionskomponenten", u: "pal", pp: 450, t: "Lieferung von Produktionskomponenten", z: "für die Werkversorgung", min: 400, max: 20000 }],
      sperrig: [{ w: "Fräsmaschine", u: "stk", s: "Fräsmaschine", pl: "Fräsmaschinen", pp: 18000, t: "Maschinenlieferung an einen Industriekunden", z: "für die neue Fertigungshalle unseres Kunden", min: 8000, max: 70000 }] } },
  { id: "nordmarkt", n: "Nordmarkt Lebensmittel GmbH", br: "Lebensmittelhandel", st: "handel", f: "vertrag",
    g: { kuehl: [{ w: "Frischeprodukte", u: "pal", pp: 450, temp: "2–7 °C", t: "Frischelieferung für den Einzelhandel", z: "für unser Zentrallager", min: 500, max: 24000 }],
      pal: [{ w: "Konserven und Trockenware", u: "pal", pp: 700, t: "Filialnachschub", z: "für die Filialbelieferung", min: 1000, max: 26000 }] } },
  /* Kühlware */
  { id: "molkerei", n: "Molkerei Berchtesgadener Land", br: "Molkerei", st: "mittel", f: "vertrag",
    g: { kuehl: [{ w: "Frischmilch", u: "t", temp: "2–6 °C", t: "Kühltransport von Frischmilch", z: "für die Abfüllung", min: 1000, max: 25000 }] } },
  { id: "pharma", n: "Pharmawerk Marburg", br: "Pharmaindustrie", st: "konzern", f: "vertrag",
    g: { kuehl: [{ w: "Impfstoffe", u: "pal", pp: 250, temp: "2–8 °C", t: "Temperaturgeführter Pharmatransport", z: "für das Verteilzentrum", min: 60, max: 4000 }] } },
  { id: "fisch", n: "Nordsee Fischhandel", br: "Fischgroßhandel", st: "familie", f: "folge",
    g: { kuehl: [{ w: "Frischfisch auf Eis", u: "kg", temp: "0–2 °C", t: "Frischfischlieferung", z: "für den Großmarkt", min: 150, max: 15000 }] } },
  { id: "blumen", n: "Blumengroßmarkt Berlin", br: "Blumenhandel", st: "handel", f: "saison",
    g: { kuehl: [{ w: "Schnittblumen", u: "pal", pp: 200, temp: "konstant 8 °C", t: "Blumenlieferung", z: "für den Großmarkt", min: 100, max: 8000 }] } },
  { id: "danone", n: "Danone Werk", br: "Lebensmittelindustrie", st: "konzern", f: "vertrag",
    g: { kuehl: [{ w: "Joghurt und Desserts", u: "pal", pp: 500, temp: "2–6 °C", t: "Kühltransport für den Lebensmittelhandel", z: "für das Zentrallager eines Handelspartners", min: 1000, max: 24000 }] } },
  { id: "altesland", n: "Obsthof Altes Land", br: "Obstbau", st: "familie", f: "saison",
    g: { kuehl: [{ w: "Tafeläpfel", u: "pal", pp: 500, temp: "2–4 °C", t: "Obsttransport", z: "für den Großmarkt", min: 1000, max: 24000 }] } },
  { id: "fleisch", n: "Fleischwerk Nord", br: "Fleischverarbeitung", st: "mittel", f: "vertrag",
    g: { kuehl: [{ w: "Frischfleisch", u: "pal", pp: 500, temp: "0–4 °C", t: "Kühltransport von Frischfleisch", z: "für die Filialen eines Handelspartners", min: 500, max: 22000 }] } },
  /* Gefahrgut */
  { id: "shell", n: "Shell Tanklager", br: "Mineralöl", st: "konzern", f: "vertrag",
    g: { adr: [{ w: "Dieselkraftstoff", u: "t", k: "3", t: "Kraftstofftransport", z: "für ein Tanklager", min: 8000, max: 3000000 },
      { w: "Kerosin", u: "t", k: "3", at: "air", t: "Kerosinversorgung", z: "für die Flugzeugbetankung", min: 8000, max: 3000000 }] } },
  { id: "basf", n: "BASF Ludwigshafen", br: "Chemie", st: "konzern", f: "vertrag",
    g: { adr: [{ w: "Industriechemikalien", u: "t", k: "8", t: "Chemikalientransport", z: "für die Weiterverarbeitung", min: 900, max: 3000000 }] } },
  { id: "linde", n: "Linde Gas", br: "Industriegase", st: "konzern", f: "vertrag",
    g: { adr: [{ w: "Druckgasflaschen", u: "pal", pp: 600, k: "2", t: "Gasflaschentransport", z: "für die Versorgung von Industriekunden", min: 900, max: 22000 }] } },
  { id: "varta", n: "Varta Batteriewerk", br: "Batterieproduktion", st: "konzern", f: "folge",
    g: { adr: [{ w: "Lithium-Ionen-Zellen", u: "pal", pp: 500, k: "9", t: "Batterietransport", z: "für die Endmontage", min: 900, max: 20000 }] } },
  { id: "pck", n: "Raffinerie Schwedt", br: "Raffinerie", st: "konzern", home: "schwedt", f: "vertrag",
    g: { adr: [{ w: "Heizöl", u: "t", k: "3", t: "Mineralöltransport", z: "für einen Großhändler", min: 8000, max: 3000000 }] } },
  { id: "galvanik", n: "Galvanotechnik Lausitz GmbH", br: "Oberflächentechnik", st: "familie", f: "folge",
    g: { adr: [{ w: "Säuren in Gebinden", u: "pal", pp: 700, k: "8", t: "Chemikalienlieferung", z: "für die Galvanik", min: 900, max: 12000 }] } },
  /* Schwer- und Sperrgut */
  { id: "enercon", n: "Enercon Windkraft", br: "Windenergie", st: "konzern", f: "projekt",
    g: { sperrig: [{ w: "Rotorblatt-Segment", u: "stk", s: "Rotorblatt-Segment", pl: "Rotorblatt-Segmente", pp: 25000, t: "Schwertransport für einen Windpark", z: "für den Aufbau eines Windparks", min: 8000, max: 120000 }] } },
  { id: "siemens", n: "Siemens Energy", br: "Energietechnik", st: "konzern", f: "projekt",
    g: { sperrig: [{ w: "Maschinentransformator", u: "stk", s: "Maschinentransformator", pl: "Maschinentransformatoren", pp: 160000, t: "Schwerlasttransport eines Transformators", z: "für ein Umspannwerk", min: 40000, max: 500000 }] } },
  { id: "liebherr", n: "Liebherr Werk", br: "Kranbau", st: "konzern", f: "folge",
    g: { sperrig: [{ w: "Kranausleger", u: "stk", s: "Kranausleger", pl: "Kranausleger", pp: 22000, t: "Maschinenlieferung an einen Industriekunden", z: "für die Montage beim Kunden", min: 8000, max: 90000 }] } },
  { id: "thyssen", n: "Thyssenkrupp Stahl", br: "Stahlindustrie", st: "konzern", f: "vertrag",
    g: { sperrig: [{ w: "Stahlbrammen", u: "t", t: "Stahltransport", z: "für das Walzwerk", min: 20000, max: 3000000 }] } },
  { id: "werft", n: "Meyer Werft", br: "Schiffbau", st: "konzern", f: "projekt",
    g: { sperrig: [{ w: "Schiffsmotor", u: "stk", s: "Schiffsmotor", pl: "Schiffsmotoren", pp: 120000, t: "Schwerlasttransport für den Schiffbau", z: "für einen Neubau auf der Werft", min: 20000, max: 400000 }] } },
  { id: "bruecke", n: "Brückenbau Elbe-Havel ARGE", br: "Brückenbau", st: "mittel", f: "projekt",
    g: { sperrig: [{ w: "Stahlträger", u: "stk", s: "Stahlträger", pl: "Stahlträger", pp: 30000, t: "Bauteiltransport für ein Infrastrukturprojekt", z: "für einen Brückenneubau", min: 8000, max: 200000 }] } },
  /* Container (ein Ende im Hafen oder am Terminal) */
  { id: "hanse", n: "Hanse Exportlogistik GmbH", br: "Exportlogistik", st: "hafen", port: true, f: "folge",
    g: { cont: [{ w: "Exportcontainer", u: "teu", dir: "ex", t: "Containervorlauf", z: "für eine Überseeverschiffung", min: 9000, max: 3000000 }] } },
  { id: "hapag", n: "Hapag-Lloyd", br: "Reederei", st: "hafen", port: true, f: "vertrag",
    g: { cont: [{ w: "Exportcontainer", u: "teu", dir: "ex", t: "Exportcontainer", z: "für eine Abfahrt nach Übersee", min: 9000, max: 5000000 },
      { w: "Container im Seeverkehr", u: "teu", dir: "sea", t: "Container-Seefracht", z: "für einen Verlader in Übersee", min: 9000, max: 5000000 }] } },
  { id: "maersk", n: "Maersk Line", br: "Reederei", st: "hafen", port: true, f: "vertrag",
    g: { cont: [{ w: "FCL-Container", u: "teu", dir: "ex", t: "FCL-Containertransport", z: "für eine gebuchte Schiffsabfahrt", min: 9000, max: 5000000 },
      { w: "Feedercontainer", u: "teu", dir: "sea", t: "Feederverkehr", z: "für den Anschluss an eine Überseeabfahrt", min: 9000, max: 5000000 }] } },
  { id: "msc", n: "MSC Germany", br: "Reederei", st: "hafen", port: true, f: "vertrag",
    g: { cont: [{ w: "Importcontainer aus Fernost", u: "teu", dir: "im", t: "Hafenumschlag und Weitertransport", z: "für die Auslieferung an den Empfänger", min: 9000, max: 5000000 },
      { w: "Transshipment-Container", u: "teu", dir: "sea", t: "Containerumfuhr zwischen Seehäfen", z: "für eine Anschlussabfahrt", min: 9000, max: 5000000 }] } },
  { id: "kn", n: "Kühne + Nagel", br: "Kontraktlogistik", st: "konzern", port: true, f: "vertrag",
    g: { cont: [{ w: "Sammelcontainer", u: "teu", dir: "im", t: "Containertransport mit Zollabfertigung", z: "für mehrere Empfänger im Inland", min: 9000, max: 2000000 }] } },
  { id: "elektro", n: "Elektro-Großhandel Ostsee", br: "Elektrohandel", st: "handel", port: true, f: "saison",
    g: { cont: [{ w: "Container mit Unterhaltungselektronik", u: "teu", dir: "im", t: "Importcontainer für den Handel", z: "für das Weihnachtsgeschäft", min: 9000, max: 600000 }] } },
  /* Schüttgut */
  { id: "heidelberg", n: "Heidelberg Materials", br: "Baustoffindustrie", st: "konzern", f: "vertrag",
    g: { schuett: [{ w: "Zement", u: "t", t: "Zementlieferung", z: "für die Versorgung unseres Standorts", min: 200000, max: 3000000 },
      { w: "Zementklinker", u: "t", t: "Rohstofftransport für die Baustoffindustrie", z: "für die Zementmühle", min: 500000, max: 6000000 }] } },
  { id: "salzgitter", n: "Salzgitter Flachstahl", br: "Stahlindustrie", st: "konzern", f: "vertrag",
    g: { schuett: [{ w: "Eisenerzpellets", u: "t", t: "Versorgung eines Stahlwerks", z: "für den Hochofen", min: 1000000, max: 180000000 }] } },
  { id: "rwe", n: "RWE Kraftwerk", br: "Energieversorgung", st: "konzern", f: "vertrag",
    g: { schuett: [{ w: "Biomasse-Pellets", u: "t", t: "Brennstoffversorgung eines Kraftwerks", z: "für die Mitverbrennung", min: 500000, max: 60000000 }] } },
  { id: "agravis", n: "Agravis Raiffeisen", br: "Agrarhandel", st: "mittel", f: "saison",
    g: { schuett: [{ w: "Weizen", u: "t", t: "Getreidetransport", z: "für die Mühle", min: 200000, max: 50000000 }] } },
  { id: "kali", n: "K+S Kali", br: "Düngemittel", st: "konzern", f: "saison",
    g: { schuett: [{ w: "Düngemittel", u: "t", t: "Düngemitteltransport", z: "für den Landhandel", min: 200000, max: 60000000 }] } },
  { id: "kieswerk", n: "Kieswerk Havelland", br: "Baustoffe", st: "familie", f: "projekt",
    g: { schuett: [{ w: "Bausand", u: "t", t: "Baustoffversorgung für ein Infrastrukturprojekt", z: "für eine Betonmischanlage", min: 200000, max: 3000000 }] } },
  { id: "havelkies", n: "Havelkies Brandenburg", br: "Baustoffe", st: "familie", f: "projekt",
    g: { schuett: [{ w: "Splitt", u: "t", t: "Splittlieferung", z: "für unser Betonwerk", min: 200000, max: 2000000 }] } },
  { id: "sonnenfeld", n: "Landwirtschaftsbetrieb Sonnenfeld", br: "Landwirtschaft", st: "familie", f: "saison",
    g: { schuett: [{ w: "Futtergetreide", u: "t", t: "Futtermitteltransport", z: "für die Tierhaltung", min: 200000, max: 2000000 }],
      pal: [{ w: "Speisekartoffeln in Big Bags", u: "pal", pp: 1000, t: "Erntetransport", z: "für den Großhandel", min: 2000, max: 26000 }] } },
  { id: "hafennord", n: "Hafenlogistik Nord GmbH", br: "Hafenumschlag", st: "hafen", port: true, f: "folge",
    g: { schuett: [{ w: "Futtermittel", u: "t", dir: "im", t: "Hafenumschlag und Weitertransport", z: "für einen Agrarhandel im Hinterland", min: 200000, max: 20000000 }],
      cont: [{ w: "Container aus dem Hafen", u: "teu", dir: "im", t: "Hafenumschlag und Weitertransport", z: "für Empfänger im Hinterland", min: 9000, max: 5000000 }] } },
  /* Auffangprofile: decken jede Menge ab, damit nie ein Kunde mit unpassender Ware gewählt werden muss */
  { id: "gen_pak", n: "Kurierzentrale Spree", br: "Kurierdienst", st: "mittel", gen: true, g: { pak: [{ w: "Geschäftsunterlagen", u: "pak", pp: 6, t: "Kurierlieferung", z: "für einen Geschäftskunden", min: 0, max: 1e12 }] } },
  { id: "gen_express", n: "Express-Disposition Mitte", br: "Expressdienst", st: "mittel", gen: true, g: { express: [{ w: "Eilgut", u: "kg", t: "Expresslieferung für einen wichtigen Geschäftskunden", z: "für einen wichtigen Geschäftskunden", min: 0, max: 1e12 }] } },
  { id: "gen_pal", n: "Deutsche Handelslogistik GmbH", br: "Handelslogistik", st: "konzern", gen: true, f: "vertrag",
    g: { pal: [{ w: "Handelsware", u: "pal", pp: 500, t: "Handelswarenlieferung", z: "für ein Verteilzentrum", min: 0, max: 1e12 }],
      kuehl: [{ w: "Kühlware", u: "pal", pp: 500, temp: "2–8 °C", t: "Kühltransport für den Lebensmittelhandel", z: "für ein Verteilzentrum", min: 0, max: 1e12 }] } },
  { id: "gen_bau", n: "Mitteldeutsche Baustoff AG", br: "Baustoffindustrie", st: "konzern", gen: true, f: "projekt",
    g: { schuett: [{ w: "Baustoffe", u: "t", t: "Baustoffversorgung für ein Infrastrukturprojekt", z: "für eine Großbaustelle", min: 0, max: 1e12 }] } },
  { id: "gen_chem", n: "Chemiepark Bitterfeld Logistik", br: "Chemie", st: "konzern", gen: true, f: "vertrag",
    g: { adr: [{ w: "Lösungsmittel", u: "t", k: "3", t: "Gefahrguttransport", z: "für einen Industriekunden", min: 0, max: 1e12 }] } },
  { id: "gen_schwer", n: "Schwerlast Projektlogistik GmbH", br: "Projektlogistik", st: "mittel", gen: true, f: "projekt",
    g: { sperrig: [{ w: "Schwerlastgut", u: "t", t: "Schwer- und Sperrguttransport", z: "für ein Industrieprojekt", min: 0, max: 1e12 }] } },
  { id: "gen_cont", n: "Hinterland Container Service", br: "Containerlogistik", st: "hafen", gen: true, f: "folge",
    g: { cont: [{ w: "Container", u: "teu", t: "Containertransport", z: "für einen Verlader", min: 0, max: 1e12 }] } }
];
const CUST_BY_ID = {}, CUST_BY_NAME = {};
CUSTOMERS.forEach(p => { CUST_BY_ID[p.id] = p; CUST_BY_NAME[p.n] = p; });
const TERMINAL = id => !!(N[id] && (N[id].type === "port" || N[id].type === "rail"));
const storyHash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7);

/* Gewicht wie überall im Spiel (kgf): bis 10 t mit Komma, darüber ganze Tonnen mit Tausenderpunkt – nie „kt“ */
function wFmt(n) {
  const de = (x, d) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  if (n >= 1000) { const t = n / 1000; return (t >= 10 ? Math.round(t).toLocaleString("de-DE") : de(t, 1)) + " t"; }
  if (n < 10 && Math.round(n) !== n) return de(n, n < 1 ? 2 : 1).replace(/0$/, "") + " kg";
  return Math.round(n) + " kg";
}
const nDe = n => n.toLocaleString("de-DE");
/* Menge + Ware passend zur Einheit, z. B. „1.000 t Zement“, „12 Paletten Getränke (6,5 t)“, „3 Exportcontainer (68 t)“.
   Sehr große Palettenmengen (Schiffsladungen) werden in Tonnen angegeben statt als unrealistische Palettenzahl. */
function goodsQty(g, w) {
  const W = wFmt(w);
  switch (g.u) {
    case "pal": { const n = Math.max(1, Math.round(w / (g.pp || 500))); return n > 1000 ? W + " " + g.w : nDe(n) + (n === 1 ? " Palette " : " Paletten ") + g.w + " (" + W + ")"; }
    case "pak": { const n = Math.max(1, Math.round(w / (g.pp || 5))); return n > 2000 ? W + " " + g.w : nDe(n) + (n === 1 ? " Paket " : " Pakete ") + g.w + " (" + W + ")"; }
    case "teu": { const n = Math.max(1, Math.ceil(w / 24000)); return nDe(n) + " " + g.w + " (" + W + ")"; }   /* je Container bis 24 t */
    case "stk": { const n = Math.max(1, Math.min(6, Math.round(w / (g.pp || w)))); return (n === 1 ? "1 " + g.s : n + " " + g.pl) + " (" + W + ")"; }
    default: return W + " " + g.w;
  }
}
/* Bahn: Wagenzahl statt Lkw-Vergleich – Containertragwagen (2 Container), Kessel-, Schüttgut-, Flach- oder Güterwagen */
function railWagons(o) {
  let n, k;
  if (o.cargo === "cont") { n = Math.ceil(Math.max(1, Math.ceil(o.weight / 24000)) / 2); k = "Containertragwagen"; }
  else if (o.cargo === "schuett") { n = Math.ceil(o.weight / 60000); k = "Schüttgutwagen"; }
  else if (o.cargo === "adr") { n = Math.ceil(o.weight / 55000); k = "Kesselwagen"; }
  else if (o.cargo === "sperrig") { n = Math.ceil(o.weight / 50000); k = "Flachwagen"; }
  else { n = Math.ceil(o.weight / 25000); k = "Güterwagen"; }
  n = Math.max(1, n);
  return (n === 1 ? "ein " + k : "rund " + nDe(n) + " " + k) + (n > 40 ? ", verteilt auf mehrere Züge" : "");
}
/* Verkehrsträger der tatsächlichen Routenvarianten: Hauptlauf je Variante und alle vorkommenden Träger */
function orderModes(variants) {
  const mains = [], all = new Set();
  (variants || []).forEach(v => {
    let best = null; v.legs.forEach(l => { all.add(l.mode); if (!best || l.dist > best.dist) best = l; });
    if (best && !mains.includes(best.mode)) mains.push(best.mode);
  });
  return { mains, all: [...all], multi: (variants || []).some(v => new Set(v.legs.map(l => l.mode)).size > 1) };
}
const MODE_PER = { r: "Lkw", b: "Lastenrad", l: "Bahn", i: "Binnenschiff", s: "Seeschiff", a: "Luftfracht" };
const MODE_TITLE = { l: "Schienengütertransport", i: "Binnenschiffstransport", s: "Seetransport", a: "Luftfracht" };
/* Seehafen = Hafen mit Seeschiff-Anschluss (Westhafen Berlin, Magdeburg usw. sind Binnenhäfen) */
const SEA = id => !!(N[id] && N[id].type === "port" && String(N[id].modes || "").includes("s"));
/* Ortsangabe mit passender Präposition: „vom Hamburger Hafen“, „zum Flughafen BER“, „nach Dresden“, „in Schwedt/Oder“ */
function placeOf(id) {
  const n = N[id];
  if (!n) return { name: String(id), von: "von " + id, nach: "nach " + id, in: "in " + id };
  let name = n.name;
  if (n.type === "city") name = name.replace(/^Berlin-/, "");
  name = name.replace(/^duisport Duisburg$/, "Hafen Duisburg").replace(/^Suezkanal \/ /, "").replace(/^Panamakanal \((.+)\)$/, "$1")
    .replace(/^Memphis \(FedEx SuperHub\)$/, "Memphis").replace(/ Gateway$/, "").replace(/^GVZ Berlin Süd Großbeeren$/, "GVZ Großbeeren");
  if (/^(Hafen|Flughafen|Westhafen|Seehafen|Hamburger Hafen|Container-Terminal|Umspur-Terminal|GVZ)\b/.test(name))
    return { name, von: "vom " + name, nach: "zum " + name, in: (/^Flughafen/.test(name) ? "am " : "im ") + name };
  return { name, von: "von " + name, nach: "nach " + name, in: "in " + name };
}

/* Kunde wählen, der genau diese Ladung in genau dieser Menge und Richtung plausibel verschickt */
const AIR = id => !!(N[id] && N[id].type === "air");
/* Richtung: ex = Ziel Seehafen · im = Start Seehafen, Ziel im Hinterland · sea = Seehafen zu Seehafen.
   Flughafen: Massen-, Schwer-, Gefahrgut und Container nur mit eigens dafür gedachter Ware (at: "air", z. B. Kerosin) –
   sonst übernehmen die neutralen Auffangprofile (z. B. Baustoffe für eine Großbaustelle am Flughafen). */
const HEAVY = { schuett: 1, adr: 1, sperrig: 1, cont: 1 };
function dirOk(g, from, to, ck) {
  if (g.at === "air" && (!AIR(to) || AIR(from))) return false;
  if (ck && HEAVY[ck] && g.at !== "air" && (AIR(from) || AIR(to))) return false;
  return !g.dir || (g.dir === "ex" ? SEA(to) && !SEA(from) : g.dir === "im" ? SEA(from) && !SEA(to) : g.dir === "sea" ? SEA(from) && SEA(to) : true);
}
function custEligible(ck, w, from, to) {
  const out = [];
  CUSTOMERS.forEach(p => {
    if (p.gen || !p.g[ck]) return;
    if (p.port && !(TERMINAL(from) || TERMINAL(to))) return;
    p.g[ck].forEach((g, gi) => { if (w >= g.min && w <= g.max && dirOk(g, from, to, ck)) out.push({ p, gi }); });
  });
  return out;
}
function custFallback(ck) {
  const p = CUSTOMERS.find(x => x.gen && x.g[ck]) || CUSTOMERS.find(x => x.gen && x.g.pal);
  return { p, gi: 0 };
}
function custPick(ck, w, from, to, allowHome) {
  let list = custEligible(ck, w, from, to).filter(x => !x.p.home || (allowHome && x.p.home === from));
  if (!list.length) return custFallback(ck);
  const wt = x => (typeof custWeight === "function" ? custWeight(x.p.n) : 1);
  const tot = list.reduce((a, x) => a + wt(x), 0);
  let u = Math.random() * tot;
  for (const x of list) { u -= wt(x); if (u <= 0) return x; }
  return list[list.length - 1];
}
/* alte Aufträge (vor v245): Kunde nach Namen, sonst passendes Profil – deterministisch. Serienfahrten bleiben beim Serienkunden. */
function custAssign(o) {
  if (o.series) return;
  if (o.cid && CUST_BY_ID[o.cid]) return;
  const byName = CUST_BY_NAME[o.shipper];
  if (byName && byName.g[o.cargo]) {
    const gi = byName.g[o.cargo].findIndex(g => o.weight >= g.min && o.weight <= g.max && dirOk(g, o.from, o.to, o.cargo));
    if (gi >= 0) { o.cid = byName.id; o.gi = gi; return; }
  }
  const list = custEligible(o.cargo, o.weight, o.from, o.to).filter(x => !x.p.home || x.p.home === o.from);
  const pick = list.length ? list[storyHash(o.id) % list.length] : custFallback(o.cargo);
  o.cid = pick.p.id; o.gi = pick.gi;
  if (!o.intro) { o.shipper = pick.p.n; delete o.title; delete o.quote; }
}

/* --------------------------- Texte aus den Daten --------------------------- */
/* Anfragen je Kommunikationsstil. {menge} steht immer als Akkusativobjekt („…, der {menge} … bringt“) oder nach einem
   Doppelpunkt – so passt die Grammatik für „1.000 t Zement“, „1 Palette …“ und „3 Exportcontainer …“ gleichermaßen.
   {von}/{nach}/{in} enthalten die Präposition passend zum Ort („vom Hamburger Hafen“, „nach Dresden“). {Zweck} = Satzanfang. */
const REQ_MAIN = {
  konzern: [
    "{Zweck} suchen wir einen zuverlässigen Logistikpartner, der {menge} {von} {nach} transportiert und die Lieferung im vereinbarten Zeitfenster abwickelt.",
    "Zu vergeben ist ein Transport {von} {nach}: {menge}, {zweck}. Für uns zählen Termintreue und eine saubere Abwicklung.",
    "Wir suchen einen Partner, der {menge} {zweck} {von} {nach} übernimmt. Bitte prüfen Sie, ob Sie die Kapazität haben."
  ],
  mittel: [
    "Können Sie für uns {menge} {von} {nach} transportieren? Die Ware ist {zweck} bestimmt.",
    "Wir suchen eine verlässliche Spedition, die {menge} {von} {nach} bringt. Die Ware ist {zweck} bestimmt.",
    "{Zweck} brauchen wir einen Transport: {menge} {von} {nach}. Können Sie das übernehmen?"
  ],
  familie: [
    "Als kleiner Betrieb sind wir auf pünktliche Lieferungen angewiesen. Bitte bringen Sie {menge} {zweck} {von} {nach} – vielen Dank im Voraus.",
    "Könnten Sie uns unterstützen? Wir brauchen jemanden, der {menge} {zweck} {von} {nach} bringt.",
    "{Zweck} suchen wir einen sorgfältigen Partner, der {menge} {von} {nach} bringt."
  ],
  hafen: [
    "{in} stehen {menge} zur Übernahme bereit, Ziel {ziel}, {zweck}. Können Sie die Kapazität stellen?",
    "Wir benötigen Transportkapazität für {menge} {von} {nach}, {zweck}. Über eine verbindliche Zusage würden wir uns freuen.",
    "{Zweck} suchen wir Transportkapazität für {menge} {von} {nach}."
  ],
  klinik: [
    "Wir benötigen einen zuverlässigen Kurier, der {menge} {zweck} {von} {nach} bringt. Die Übergabe erfolgt nur an berechtigtes Personal.",
    "Bitte übernehmen Sie für uns den Transport {von} {nach}: {menge}, {zweck}. Sorgfalt und Diskretion setzen wir voraus."
  ],
  handel: [
    "{Zweck} brauchen wir {menge} {von} {nach}. Die Anlieferung muss in unser Zeitfenster passen.",
    "Aus unserem Lager {in} soll Ware {nach}: {menge}, {zweck}. Bitte bestätigen Sie, ob Sie die Tour fahren können.",
    "Für die nächste Belieferung suchen wir einen Transportpartner: {menge} {von} {nach}, {zweck}."
  ]
};
/* Folgegeschäft: nur, was das Spiel wirklich bietet (zufriedene Kunden melden sich öfter, ab 5 Lieferungen Liefervertrag) */
const REQ_CHANCE = {
  vertrag: "Bei zuverlässiger Abwicklung ist ein Liefervertrag möglich.",
  folge: "Bei guter Zusammenarbeit kommen wir gern wieder auf Sie zu.",
  saison: "Solche Transporte haben wir regelmäßig – ein verlässlicher Partner ist uns wichtig.",
  projekt: "Für das Projekt sind weitere Transporte geplant."
};
/* Beziehungsstufen: 0 Neukunde · 1 Bekannter Geschäftspartner (1–2 Lieferungen) · 2 Stammkunde (3–9) · 3 Bevorzugter Logistikpartner (ab 10).
   Mehr als 30 % verspätet: höchstens Stufe 1. */
function custTier(c) {
  if (!c || !c.n) return 0;
  if (c.late > c.n * 0.3) return 1;
  return c.n >= 10 ? 3 : c.n >= 3 ? 2 : 1;
}
const CUST_BONUS = [1, 1, 1.03, 1.06], CUST_NAME = ["Neukunde", "Bekannter Geschäftspartner", "Stammkunde", "Bevorzugter Logistikpartner"];
/* Vorteile je Stufe – bewusst maßvoll: etwas mehr Vergütung, mehr Verhandlungsspielraum, längere Angebotsfrist bei Ausschreibungen */
const CUST_PERKS = ["", "", "+3 % Vergütung · mehr Verhandlungsspielraum · längere Angebotsfrist", "+6 % Vergütung · deutlich mehr Verhandlungsspielraum · seltener Ausschreibungen"];
function relOpener(p, c, tier) {
  if (!c || !c.n) return "";
  if (c.n >= 2 && c.late > c.n * 0.3) return "Bei den letzten Lieferungen gab es Verzögerungen – wir geben Ihnen gern eine weitere Gelegenheit.";
  if (tier >= 3) return "Als unser bevorzugter Logistikpartner erhalten Sie diese Anfrage vorab.";
  if (tier === 2) return p.st === "familie" ? "Schön, dass wir uns wieder auf Sie verlassen können." : "Wie gewohnt möchten wir Ihnen auch diesen Transport anvertrauen.";
  return "Die letzte Lieferung mit Ihrer Spedition verlief reibungslos – deshalb wenden wir uns wieder an Sie.";
}
/* Nächste Beziehungsstufe – für „Bedeutung“ in den Details */
function relNext(c) {
  const n = c ? c.n || 0 : 0, t = custTier(c);
  if (c && n >= 2 && c.late > n * 0.3) return "Mehrere Verspätungen: erst mit pünktlichen Lieferungen wird der Kunde wieder Stammkunde.";
  if (t >= 3) return "Höchste Beziehungsstufe erreicht.";
  if (t === 2) return "Noch " + (10 - n) + " pünktliche Lieferung" + (10 - n === 1 ? "" : "en") + " bis „Bevorzugter Logistikpartner“ (+6 %).";
  if (t === 1) return "Noch " + (3 - n) + " pünktliche Lieferung" + (3 - n === 1 ? "" : "en") + " bis „Stammkunde“ (+3 %, mehr Verhandlungsspielraum).";
  return "Erster Auftrag dieses Kunden – ab 3 pünktlichen Lieferungen wird er Stammkunde.";
}
/* Zweck für den Titel: ohne „unser“ (der Titel spricht über den Kunden, nicht als Kunde) */
function titleZweck(z, to) {
  if (/^für die Versorgung unseres Standorts$/.test(z)) return "für den Standort " + to;
  return z.replace(/unseres Kunden/, "eines Kunden").replace(/unserer Filialen/, "der Filialen").replace(/unseres Standorts/, "des Standorts")
    .replace(/\bunseren /, "den ").replace(/\bunsere /, "die ").replace(/\bunser /, "das ").replace(/\bunserem /, "dem ");
}
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const listDe = a => a.length > 1 ? a.slice(0, -1).join(", ") + " und " + a[a.length - 1] : a.join("");
/* Benötigte Kapazität aus Gewicht, Ladungsart und Hauptlauf */
function orderCapacity(o, m) {
  const out = ["mind. " + wFmt(o.weight) + " Nutzlast"];
  const req = (typeof CARGO !== "undefined" && CARGO[o.cargo] && CARGO[o.cargo].req) || [];
  if (req.length && typeof flagName === "function") out.push(req.map(flagName).join(" + "));
  if ((m.mains || []).includes("l")) out.push("Bahn: " + railWagons(o));
  return out.join(" · ");
}
/* ctx: { modes: orderModes(...), A/B: placeOf(von/nach), frist (Text), tight (bool), c (Kundenstatistik) } */
function orderTexts(o, ctx) {
  const p = CUST_BY_ID[o.cid] || custFallback(o.cargo).p, list = p.g[o.cargo] || custFallback(o.cargo).p.g[o.cargo] || [];
  const g = list[o.gi || 0] || list[0];
  const h = storyHash(o.id + "|" + p.id), c = ctx.c || null, tier = custTier(c), m = ctx.modes || { mains: [], all: [], multi: false };
  const A = ctx.A || placeOf(o.from), B = ctx.B || placeOf(o.to);
  const menge = goodsQty(g, o.weight);
  /* Titel: nur Varianten, die zu den Daten passen */
  const T = [g.t + " " + B.nach];
  if (g.z && !/ (für|zum|zur|an|im|zwischen) /.test(g.t)) T.push(g.t + " " + titleZweck(g.z, B.name));
  if (o.cargo === "cont" && SEA(o.to) && !SEA(o.from) && g.dir !== "im") T.push("Exportcontainer " + B.nach);
  if (o.cargo === "cont" && SEA(o.from) && !SEA(o.to) && g.dir !== "ex") T.push("Importcontainer " + A.von + " " + B.nach);
  if (m.mains.length === 1 && MODE_TITLE[m.mains[0]] && !m.multi) T.push(/transport/i.test(g.t) ? g.t + " per " + MODE_PER[m.mains[0]] : MODE_TITLE[m.mains[0]] + ": " + g.t);
  if (o.cargo === "express" && !/^(Express|Eil)/.test(g.t)) T.push("Eilauftrag: " + g.t);
  const title = c && c.n >= 1 && h % 2 ? "Folgeauftrag: " + g.t + " " + B.nach : T[h % T.length];
  /* Anfrage */
  const st = REQ_MAIN[p.st] ? p.st : "mittel", tpl = REQ_MAIN[st][(h >> 2) % REQ_MAIN[st].length];
  const zweck = g.z || "für einen Geschäftskunden";
  const main = cap1(tpl.replace("{Zweck}", cap1(zweck)).replace("{zweck}", zweck).replace("{menge}", menge)
    .replace("{von}", A.von).replace("{nach}", B.nach).replace("{in}", A.in).replace("{ziel}", B.name));
  const parts = [relOpener(p, c, tier), main];
  /* Anforderung – nur aus der Ladungsart */
  const roadOnly = m.all.length && m.all.every(x => x === "r");
  if (o.cargo === "kuehl") parts.push("Die Kühlkette muss während des gesamten Transports eingehalten werden (" + (g.temp || "2–8 °C") + ").");
  else if (o.cargo === "adr") parts.push("Die Ware ist Gefahrgut der " + (roadOnly ? "ADR-Klasse " : "Klasse ") + (g.k || "3") + " – Fahrzeug, Besatzung und Begleitpapiere müssen für Gefahrgut zugelassen sein.");
  else if (o.cargo === "sperrig") parts.push("Für Gewicht und Abmessungen ist ein Spezialfahrzeug für Schwer- und Sperrgut nötig; die Genehmigungen liegen vor.");
  else if (o.cargo === "cont") parts.push("Die Container sind abgefertigt und stehen zur Übernahme bereit.");
  else if (o.cargo === "schuett") parts.push("Die Ware wird lose verladen.");
  if (o.cargo === "express") parts.push("Die Sendung ist zeitkritisch und muss bis " + ctx.frist + " ankommen.");
  else if (ctx.tight) parts.push("Bitte beachten Sie das enge Zeitfenster: Anlieferung bis " + ctx.frist + ".");
  /* Verkehrsträger – nur wie in den tatsächlichen Routenvarianten */
  if (m.mains.length === 1 && !m.multi && ["l", "i", "s", "a"].includes(m.mains[0]))
    parts.push("Vorgesehen ist der Transport per " + MODE_PER[m.mains[0]] + (m.mains[0] === "l" ? " (" + railWagons(o) + ")" : "") + ".");
  else if (m.mains.length > 1) parts.push("Möglich ist der Transport per " + m.mains.map(x => MODE_PER[x]).join(" oder ") + " – die Wahl des Verkehrsträgers überlassen wir Ihnen.");
  else if (m.multi) parts.push("Die Route kombiniert " + listDe(m.all.map(x => MODE_PER[x])) + " mit Umschlag unterwegs.");
  if (tier <= 1 && !(c && c.n) && p.f && REQ_CHANCE[p.f]) parts.push(REQ_CHANCE[p.f]);
  const req = parts.filter(Boolean).join(" ");
  /* geschäftliche Einordnung */
  const kind = o.contract ? "Liefervertrag" : o.series ? "Projekt" : o.rival ? "Ausschreibung" : tier >= 3 ? CUST_NAME[3] : tier === 2 ? CUST_NAME[2] : c && c.n ? CUST_NAME[1] : "Neukunde";
  const chance = tier >= 2 ? CUST_NAME[tier] + ": " + CUST_PERKS[tier] : p.f === "vertrag" ? "Liefervertrag möglich (ab 5 pünktlichen Lieferungen)" : p.f ? "Folgeanfragen bei guter Leistung" : "";
  return { title, req, menge, ware: g.w, kind, chance, p, g, tier, rel: CUST_NAME[tier], next: relNext(c), cap: orderCapacity(o, m), A, B };
}
/* Konsistenzprüfung: kein Verkehrsträger, keine Kühl- oder Gefahrgutangabe und keine Menge, die nicht zu den Daten passt */
const TXT_MODE = [["l", /\b(Bahn|Schiene\w*|Schienengüter\w*|Güterzug|Zug|Züge|Waggon\w*|Güterwagen|Kesselwagen|Schüttgutwagen|Flachwagen|Containertragwagen)\b/],
  ["i", /\b(Binnenschiff\w*)\b/], ["s", /\b(Seeschiff\w*|Seetransport)\b/],
  ["r", /\b(Lkw|Lastwagen|Sattelzug)\b/], ["a", /\b(Luftfracht|Flugzeug)\b/], ["b", /\b(Lastenrad|Fahrradkurier)\b/]];
function orderTextCheck(o, tx, ctx) {
  const err = [], text = tx.title + " " + tx.req, m = (ctx.modes || {}).all || [];
  TXT_MODE.forEach(([k, re]) => { if (re.test(text) && !m.includes(k)) err.push("Verkehrsträger " + k + " im Text, aber nicht in der Route"); });
  if (/\bSchiff\b|\bSchiffsladung/.test(text) && !m.includes("i") && !m.includes("s")) err.push("Schiff im Text ohne Schiffsroute");
  if (/Kühl|°C|gekühlt|Tiefkühl/.test(text) && o.cargo !== "kuehl") err.push("Kühlangabe ohne Kühlware");
  if (/ADR|Gefahrgut/.test(text) && o.cargo !== "adr") err.push("Gefahrgut im Text ohne ADR-Ladung");
  const W = wFmt(o.weight);
  (text.match(/\d[\d.]*(,\d+)?\s(t|kg)\b/g) || []).forEach(x => { if (x !== W) err.push("Menge " + x + " passt nicht zu " + W); });
  if (/\{[a-zA-Z]+\}|undefined|NaN|\bnull\b/.test(text)) err.push("Platzhalter im Text");
  if (/\.\.|\s[,.]|\s{2}|\b(für|von|nach|zum|vom) \1\b/.test(text)) err.push("Formfehler im Text");
  if (/Exportcontainer/.test(tx.title) && !SEA(o.to)) err.push("Exporttitel ohne Seehafen am Ziel");
  if (/Importcontainer/.test(tx.title) && !SEA(o.from)) err.push("Importtitel ohne Seehafen am Start");
  if (o.series) return err;
  const p = CUST_BY_ID[o.cid];
  if (!p || !p.g[o.cargo]) err.push("Kunde ohne passende Ware");
  else {
    const g = p.g[o.cargo][o.gi || 0];
    if (!g || o.weight < g.min || o.weight > g.max) err.push("Menge außerhalb des Kundenprofils");
    else if (!p.gen && !dirOk(g, o.from, o.to, o.cargo)) err.push("Richtung passt nicht zum Kundenprofil");
    if (p.port && !(TERMINAL(o.from) || TERMINAL(o.to))) err.push("Hafenkunde ohne Hafen");
  }
  return err;
}
function orderTextSafe(o, ctx) {
  const A = ctx.A || placeOf(o.from), B = ctx.B || placeOf(o.to);
  const menge = (() => { const p = CUST_BY_ID[o.cid], g = p && p.g[o.cargo] && p.g[o.cargo][o.gi || 0]; return g ? goodsQty(g, o.weight) : wFmt(o.weight) + " " + (CARGO[o.cargo] ? CARGO[o.cargo].name : "Fracht"); })();
  return { title: (CARGO[o.cargo] ? CARGO[o.cargo].name : "Transport") + " " + B.nach, req: "Wir suchen eine Spedition für folgenden Transport: " + menge + " " + A.von + " " + B.nach + ".", menge, kind: "Neukunde", chance: "", A, B };
}
/* Serienfahrten (Geschäftsereignisse): Titel und Anfrage aus der Serienvorlage, Menge und Route aus den Daten */
function seriesTexts(o, ctx) {
  const tpl = SERIES.find(x => x.k === (S.series && S.series.id === o.series.id ? S.series.k : o.series.k)) || SERIES.find(x => o.shipper === x.firm);
  const st = tpl ? tpl.steps[Math.min(2, (o.series.step || 1) - 1)] : [o.desc, o.quote || ""];
  const ck = CARGO[o.cargo], menge = o.cargo === "pal" ? nDe(Math.max(1, Math.round(o.weight / 400))) + (Math.round(o.weight / 400) <= 1 ? " Palette (" : " Paletten (") + wFmt(o.weight) + ")" : wFmt(o.weight) + " " + (ck ? ck.name : "Ware");
  const title = (tpl ? tpl.name : "Projekt") + " (" + o.series.step + "/3): " + st[0];
  const req = st[1] + " Zu transportieren: " + menge + " " + ctx.A.von + " " + ctx.B.nach + "." + (ctx.tight ? " Bitte beachten Sie das enge Zeitfenster: Anlieferung bis " + ctx.frist + "." : "");
  return { title, req, menge, kind: "Projekt " + o.series.step + "/3", chance: "Projektbonus nach der dritten Fahrt", p: tpl ? { n: tpl.firm, br: tpl.br } : null, tier: 0, A: ctx.A, B: ctx.B,
    rel: "", next: "Alle drei Fahrten pünktlich: Bonus von 35 % auf die Serienvergütung, sonst 15 %.", cap: orderCapacity(o, ctx.modes) };
}
/* Im Spiel: Kontext aus den echten Daten, Text erzeugen, prüfen (bei Fehler: neutraler Text) – zwischengespeichert je Auftrag */
const TEXT_CACHE = new Map();
let TEXT_ERRORS = 0;
function orderStory(o) {
  if (!o || o.farm || o.jewel || o.snus || o.pablo || o.vip || o.mission || o.tut || o.tutNext) return null;
  custAssign(o);
  const variants = typeof buildVariants === "function" ? buildVariants(o) : [];
  const modes = orderModes(variants), c = o.series ? null : custOf(CUST_BY_ID[o.cid] ? CUST_BY_ID[o.cid].n : o.shipper);
  const tight = !o.acc && o.deadline - S.time < (o.refTime || 0) * 1.25;
  const key = o.id + "|" + modes.mains.join("") + modes.all.join("") + "|" + (c ? c.n + ":" + c.late : 0) + "|" + (tight ? 1 : 0) + "|" + (o.rival ? 1 : 0) + "|" + (o.cid || "");
  const hit = TEXT_CACHE.get(o.id);
  if (hit && hit.key === key) return hit.tx;
  const ctx = { modes, c, tight, A: placeOf(o.from), B: placeOf(o.to), frist: typeof stamp === "function" ? stamp(o.deadline) : "" };
  let tx = o.series ? seriesTexts(o, ctx) : orderTexts(o, ctx);
  const err = orderTextCheck(o, tx, ctx);
  if (err.length) { TEXT_ERRORS++; console.warn("Auftragstext ersetzt:", o.id, err); tx = Object.assign({}, tx, orderTextSafe(o, ctx), { kind: tx.kind, chance: tx.chance }); }
  tx.modes = modes;
  if (TEXT_CACHE.size > 400) TEXT_CACHE.clear();
  TEXT_CACHE.set(o.id, { key, tx });
  return tx;
}

/* ------------------------------ Stammkunden ----------------------------- */
function custOf(name) { S.cust = S.cust || {}; return S.cust[name] || null; }
/* Wer schon beliefert wurde und zufrieden ist, meldet sich öfter (custPick) */
function custWeight(name) { const c = custOf(name); return c && c.n >= 1 ? (c.late > c.n * 0.3 ? 1 : c.n >= 3 ? 3 : 2) : 1; }
const custPlain = o => !(o.snus || o.pablo || o.farm || o.tut || o.tutNext || o.vip || o.jewel || o.contract || o.mission);
function kundenOnSpawn(o) {
  if (!o || !custPlain(o)) return;
  custAssign(o);
  const c = custOf(o.shipper), t = custTier(c);
  if (t >= 2) { o.reg = t; o.pay = Math.round(o.pay * CUST_BONUS[t]); }
  /* Stammkunden ab 5 Lieferungen: einmal ein Liefervertrag (bestehender Rahmenvertrag, mit genau dieser Strecke) */
  if (c && c.n >= 5 && !c.offer && t >= 2 && typeof offerContract === "function" && typeof fleetCanDo === "function" && fleetCanDo(o) && !o.air) {
    c.offer = S.time;
    try { offerContract(o); } catch (e) { console.warn("Liefervertrag", e); }
  }
}
function kundenDelivered(job, pay, late) {
  const o = job.order, st = extraStats();
  if (o.to && o.from && N[o.to] && N[o.from] && (N[o.to].stage >= 4 || N[o.from].stage >= 4) && !o.farm) st.intl = (st.intl || 0) + 1;
  if (o.series) seriesDelivered(o, pay, late);
  if (!custPlain(o) && !o.series) return;
  S.cust = S.cust || {};
  const c = S.cust[o.shipper] = S.cust[o.shipper] || { n: 0, late: 0, first: S.time };
  const before = custTier(c);
  c.n++; if (late) c.late++; c.last = S.time;
  st.custMax = Math.max(st.custMax || 0, c.n);
  const now = custTier(c), live = typeof lively === "function" && lively();
  if (now > before && now >= 2 && live)
    toast("🤝 " + o.shipper + ": jetzt " + CUST_NAME[now] + " – künftige Aufträge +" + Math.round((CUST_BONUS[now] - 1) * 100) + " %, bessere Verhandlung", "ok");
  /* gelegentlich ein persönlicher Dank (ohne Geld) */
  else if (now >= 2 && !late && live && storyHash(o.id) % 6 === 0 && typeof phoneMsg === "function")
    phoneMsg({ from: o.shipper, kind: "good", title: "Danke für die Zusammenarbeit", body: "Die Lieferung " + N[o.from].short + " → " + N[o.to].short + " kam wie vereinbart an. Wir melden uns gern wieder bei Ihnen." });
}

/* ----------------------------- Auftragsserien --------------------------- */
/* v245: Geschäftsereignisse statt Anekdoten – Neue Produktionshalle, Erntezeit, Großbaustelle, Hafenengpass, Filialeröffnung,
   Betriebsumzug. Drei zusammenhängende Fahrten, normal bezahlt, Bonus nach der dritten. Texte erwähnen weder Kühlung noch
   Gefahrgut noch Verkehrsträger (die Serie fährt immer mit der eigenen Straßen-/Radflotte, Palette oder Paket).
   minCap: nur ab dieser Nutzlast des größten eigenen Fahrzeugs · port: alle Fahrten starten im selben Hafen */
const SERIES = [
  { k: "halle", name: "Neue Produktionshalle", firm: "Maschinenbau Hoffmann GmbH", br: "Maschinenbau", icon: "🏭", minCap: 300,
    steps: [["Betriebsausstattung zur neuen Halle", "Unsere neue Produktionshalle ist fertig. Zuerst brauchen wir Werkbänke, Regale und Werkzeug vor Ort."],
      ["Produktionskomponenten für den Anlauf", "Der Probebetrieb startet. Für die ersten Fertigungsaufträge brauchen wir die Komponenten rechtzeitig."],
      ["Erste Fertigteile an den Kunden", "Die ersten Teile aus der neuen Halle sind fertig und gehen an unseren Kunden."]] },
  { k: "ernte", name: "Erntezeit", firm: "Landwirtschaftsbetrieb Sonnenfeld", br: "Landwirtschaft", icon: "🌾",
    steps: [["Erntekisten und Verpackung zum Hof", "Die Ernte beginnt. Ohne Kisten und Verpackungsmaterial können wir nicht anfangen."],
      ["Erntegut zum Regionallager", "Die ersten Partien sind verpackt und müssen ins Regionallager."],
      ["Ware zum Großmarkt", "Der Großmarkt hat unsere Ware fest eingeplant – die Anlieferung muss pünktlich sein."]] },
  { k: "bau", name: "Großbaustelle", firm: "BayWa Baustoffe", br: "Baustoffhandel", icon: "🏗️", minCap: 300,
    steps: [["Material für die Baustelleneinrichtung", "Für eine neue Großbaustelle brauchen wir zuerst Material für die Baustelleneinrichtung."],
      ["Baustoffe für den Rohbau", "Der Rohbau beginnt. Die Baustoffe müssen termingerecht auf der Baustelle sein."],
      ["Material für den Innenausbau", "Der Innenausbau startet – mit dieser Lieferung ist unser Teil des Projekts abgeschlossen."]] },
  { k: "hafen", name: "Hafenengpass", firm: "Hafenlogistik Nord GmbH", br: "Hafenumschlag", icon: "⚓", port: true,
    steps: [["Entlastungsfahrt ab Hafen", "Im Hafen stauen sich die Sendungen. Wir brauchen kurzfristig zusätzliche Kapazität für die Weiterverteilung."],
      ["Weiterverteilung an Empfänger", "Die nächste Partie wartet auf die Weiterverteilung an einen Empfänger im Hinterland."],
      ["Restmengen ausliefern", "Mit dieser Fahrt ist der Rückstand im Hafen abgebaut."]] },
  { k: "filiale", name: "Filialeröffnung", firm: "Bäckerei Morgenstern", br: "Bäckerei", icon: "🥖",
    steps: [["Zutaten für die Backstube", "Für die Eröffnung backen wir die doppelte Menge – dafür brauchen wir zusätzliche Zutaten."],
      ["Einrichtung für die neue Filiale", "Der Ladenbauer kommt morgen früh, die Einrichtung muss vorher vor Ort sein."],
      ["Backwaren zum Eröffnungstag", "Die Eröffnung ist früh am Morgen – die Ware muss rechtzeitig da sein."]] },
  { k: "umzug", name: "Betriebsumzug", firm: "Werkstatt Hoffmann", br: "Werkstatt", icon: "🔧",
    steps: [["Werkzeug und Regale abholen", "Wir ziehen in eine neue Halle. Die alte muss bis Monatsende geräumt sein."],
      ["Maschinenteile zur neuen Halle", "Die neue Halle ist bezugsfertig – jetzt fehlen nur noch die Maschinenteile."],
      ["Reparierte Teile zurück zu den Kunden", "Unsere Kunden warten auf ihre Teile – der Umzug darf das nicht verzögern."]] }
];
/* Gewicht so, dass das größte eigene Straßen-/Radfahrzeug es trägt */
function seriesCap() {
  const own = S.fleet.map(f => vType(f.type)).filter(t => t && !t.car && !t.special && (t.mode === "r" || t.mode === "b"));
  return own.length ? Math.max(...own.map(t => t.cap)) : 0;
}
function seriesLoad() {
  const cap = seriesCap();
  if (!cap) return null;
  const ck = cap >= 300 ? "pal" : "pak", cg = CARGO[ck];
  return { ck, w: clamp(Math.round(cap * rnd(0.45, 0.75)), cg.minKg, Math.min(cg.maxKg, cap)) };
}
function seriesOrder(S0, step, from) {
  const tpl = SERIES.find(x => x.k === S0.k); if (!tpl) return null;
  const L = seriesLoad(); if (!L) return null;
  const nodes = unlockedNodes().filter(n => n.modes.includes("r") || n.modes.includes("b"));
  const ports = nodes.filter(n => n.type === "port");
  if (tpl.port && !S0.port && ports.length) S0.port = pick(ports).id;
  for (let k = 0; k < 40; k++) {
    const a = tpl.port && S0.port && N[S0.port] ? N[S0.port] : from && N[from] ? N[from] : pick(nodes), b = pick(nodes);
    if (!a || !b || a.id === b.id) continue;
    const air = hav([a.lat, a.lon], [b.lat, b.lon]);
    if (air < 2 || air > (S.stage === 1 ? 30 : S.stage === 2 ? 160 : 400)) continue;
    const pr = priceOrder(a.id, b.id, L.ck, L.w);
    if (!pr || !pr.ref.legs.every(l => l.mode === "r" || l.mode === "b")) continue;
    const st = tpl.steps[step - 1];
    const o = { id: "A" + (S.seq++), from: a.id, to: b.id, cargo: L.ck, weight: L.w, pay: Math.round(pr.pay * 1.1), deadline: pr.deadline + 240, pk: PAY_K,
      shipper: tpl.firm, desc: st[0], title: tpl.name + " (" + step + "/3): " + st[0], quote: st[1], created: S.time,
      refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time), expire: Math.round(S.time + 1440), series: { id: S0.id, k: S0.k, step, of: 3 },
      pick: makeAddr(a.id), drop: makeAddr(b.id) };
    withLastMile(o);
    return o;
  }
  return null;
}
function seriesOffer() {
  if (S.series || !lively() || (typeof logiOn === "function" && !logiOn()) || logiDoneN() < 15) return;
  if (S.time < (S.seriesNext || 0) || Math.random() > 0.35) return;
  S.seriesNext = S.time + 4 * 1440;
  if (!seriesLoad()) return;
  const done = (extraStats().seriesK || []), cap = seriesCap();
  const ok = SERIES.filter(x => (!x.minCap || cap >= x.minCap) && (!x.port || unlockedNodes().some(n => n.type === "port" && n.modes.includes("r"))));
  const pool = ok.filter(x => !done.includes(x.k)), tpl = pick(pool.length ? pool : ok.length ? ok : SERIES);
  decisionMsg({ from: tpl.firm, kind: "contract", icon: tpl.icon, type: "series", title: "Projektanfrage: " + tpl.name, brake: false,
    body: `${tpl.steps[0][1]} Geplant sind drei zusammenhängende Fahrten: ${tpl.steps.map((s, i) => (i + 1) + ". " + s[0]).join(" · ")}. Jede Fahrt wird regulär vergütet; nach der dritten zahlen wir einen Projektbonus (35 % der Serienvergütung, bei Verspätung 15 %). ${tpl.port ? "Alle Fahrten starten im selben Hafen." : "Die nächste Fahrt startet jeweils dort, wo die vorige endet."}`,
    choices: [{ label: "Projekt annehmen", sub: "die erste Fahrt kommt gleich ins Auftragsbuch" }, { label: "Ablehnen" }], def: 1, wait: 360, ctx: { k: tpl.k } });
}
DECISIONS.series = {
  choose(m, idx) {
    if (idx !== 0) return "Abgelehnt.";
    if (S.series) return "Es läuft schon ein Projekt.";
    const S0 = { id: "R" + (S.seq++), k: m.dec.ctx.k, step: 1, pays: 0, at: S.time };
    const o = seriesOrder(S0, 1, null);
    if (!o) return "Gerade passt keine Strecke – vielleicht beim nächsten Mal.";
    S0.cur = o.id; S.series = S0; S.orders.unshift(o);
    toast("🔗 Projekt angenommen – Fahrt 1/3 liegt im Auftragsbuch.", "ok");
    return "Angenommen – Fahrt 1/3 bereit.";
  }
};
function seriesDelivered(o, pay, late) {
  const S0 = S.series; if (!S0 || o.series.id !== S0.id) return;
  S0.pays += pay; if (late) S0.late = (S0.late || 0) + 1;
  if (o.series.step >= 3) {
    const tpl = SERIES.find(x => x.k === S0.k), bonus = Math.round(S0.pays * (S0.late ? 0.15 : 0.35));
    S.money += bonus; S.revenue += bonus; logMoney("bonus", "Projektbonus · " + (tpl ? tpl.name : "Serie"), bonus);
    const st = extraStats(); st.series = (st.series || 0) + 1; st.seriesK = (st.seriesK || []).concat(S0.k);
    if (typeof phoneMsg === "function") phoneMsg({ from: tpl ? tpl.firm : "Kunde", kind: "good", title: "Projekt abgeschlossen: " + (tpl ? tpl.name : ""),
      body: `Alle drei Fahrten sind erledigt${S0.late ? " (eine davon verspätet)" : ""}. Projektbonus: +${money(bonus)}. Vielen Dank für die Zusammenarbeit.` });
    S.series = null;
    return;
  }
  const nx = seriesOrder(S0, o.series.step + 1, o.to);
  if (!nx) { S.series = null; toast("🔗 Projekt beendet – für die nächste Fahrt fand sich keine Strecke.", "warn"); return; }
  S0.step = o.series.step + 1; S0.cur = nx.id; S.orders.unshift(nx);
  toast("🔗 " + nx.title + " – Start " + placeOf(nx.from).in + ".", "ok");
}
/* Verfallen oder abgelehnt: Serie vorbei */
function seriesTick() {
  const S0 = S.series; if (!S0 || !S0.cur) return;
  if (S.orders.some(o => o.id === S0.cur) || S.jobs.some(j => j.order.id === S0.cur)) return;
  S.series = null;
  if (typeof phoneMsg === "function") phoneMsg({ from: (SERIES.find(x => x.k === S0.k) || {}).firm || "Kunde", kind: "trouble", title: "Projekt abgebrochen",
    body: "Eine Fahrt des Projekts ist verfallen oder wurde abgelehnt – der Projektbonus entfällt." });
}
function logiDoneN() { return typeof logiDone === "function" ? logiDone() : S.done || 0; }
function kundenTick() { try { seriesTick(); } catch (e) { console.warn("Serie", e); } }
function kundenDay() { try { seriesOffer(); } catch (e) { console.warn("Serie", e); } }

/* ------------------------------ Meilensteine ---------------------------- */
if (typeof ACHS !== "undefined") ACHS.push(
  { id: "heavy1", icon: "🏗️", name: "Schwergewicht", desc: "Den ersten eigenen Schwerlasttransporter gekauft.", ok: () => S.fleet.some(f => { const t = vType(f.type); return t && t.flags.includes("sperrig") && !t.special; }) },
  { id: "special1", icon: "🧊", name: "Spezialist", desc: "Die erste neue Fahrzeugklasse: Kühl-, Gefahrgut- oder Containerfahrzeug.", ok: () => S.fleet.some(f => { const t = vType(f.type); return t && !t.special && ["kuehl", "adr", "container"].some(x => t.flags.includes(x)); }) },
  { id: "cust10", icon: "🤝", name: "Hausspediteur", desc: "Zehn Lieferungen für denselben Kunden.", ok: () => (extraStats().custMax || 0) >= 10 },
  { id: "series1", icon: "🔗", name: "Am Stück", desc: "Die erste Auftragsserie abgeschlossen.", ok: () => (extraStats().series || 0) >= 1 },
  { id: "intl1", icon: "🌐", name: "Über die Grenze", desc: "Die erste internationale Lieferung.", ok: () => (extraStats().intl || 0) >= 1 }
);

/* ------------------------- Auftragskarte: Zusätze ------------------------ */
/* Mehrwert als kleine Marken – nur was tatsächlich gilt (Stammkunden-Zuschlag ist im Preis enthalten, Liefervertrag ab 5 Lieferungen) */
function orderSpecialHTML(o, tx) {
  const t = [];
  if (o.intro === "ship") t.push(["intro", "Einführung: Schifffahrt"]);
  if (o.series) t.push(["series", "Projektbonus nach Fahrt 3"]);
  if (o.reg) t.push(["reg", CUST_NAME[o.reg] + " · +" + Math.round((CUST_BONUS[o.reg] - 1) * 100) + " % enthalten"]);
  if (o.contract) t.push(["contract", "Liefervertrag"]);
  if (o.cargo === "express") t.push(["express", "Express"]);
  else if (!o.acc && o.deadline - S.time < (o.refTime || 0) * 1.25) t.push(["tight", "Enges Zeitfenster"]);
  if (tx && tx.chance && !o.reg && !o.series && !o.contract) t.push(["chance", tx.chance]);
  return t.length ? `<div class="o-tags">${t.map(([c, x]) => `<span class="o-tag ${c}">${esc(x)}</span>`).join("")}</div>` : "";
}

/* ------------------- v250: Unterschrift bei Großaufträgen ------------------- */
/* Ab 100.000 € zeichnet eine feste, erfundene Person „i. A.“ für das Unternehmen. Name, Funktion und Handschrift
   hängen nur am Firmennamen – dieselbe Firma unterschreibt immer mit derselben Person und demselben Schriftzug. */
const SIGN_MIN = 100000;
const SIGN_FIRST = ["Martina", "Thomas", "Sabine", "Jörg", "Katrin", "Michael", "Anja", "Stefan", "Claudia", "Frank", "Nadine", "Matthias",
  "Birgit", "Andreas", "Julia", "Ralf", "Melanie", "Christian", "Petra", "Dirk", "Lena", "Sebastian", "Ines", "Oliver", "Heike", "Tobias", "Carolin", "Marco"];
const SIGN_LAST = ["Kessler", "Brandt", "Hoffmann", "Lindner", "Vogt", "Krämer", "Sommer", "Albrecht", "Wendt", "Böhm", "Hartmann", "Engel",
  "Seidel", "Franke", "Lorenz", "Busch", "Winkler", "Arnold", "Pohl", "Graf", "Ludwig", "Riedel", "Schuster", "Kühn", "Haas", "Bauer", "Ebert", "Roth"];
const SIGN_ROLE = ["Leitung Logistik", "Leitung Einkauf", "Supply Chain Management", "Transportdisposition", "Leitung Versand", "Geschäftsführung",
  "Leitung Beschaffung", "Logistikkoordination"];
const SIGN_FONT = [["Great Vibes", 1], ["Allura", 1.05], ["Mrs Saint Delafield", 1.25], ["Herr Von Muellerhoff", 1.3]];
const SIGN_INK = ["#1d3f8f", "#16336e", "#22314d", "#2a2a5e", "#1b4a7a"];
function signHash(s, salt) { return [...(salt + "|" + s)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 2166136261); }
function signerOf(company) {
  const h = signHash(company, "p"), f = SIGN_FIRST[h % SIGN_FIRST.length], l = SIGN_LAST[(h >>> 7) % SIGN_LAST.length];
  return { first: f, last: l, role: SIGN_ROLE[(h >>> 13) % SIGN_ROLE.length], h: signHash(company, "s") };
}
/* Unterschrift als SVG: Schrift, Neigung, Größe und Tinte je Person; darunter ein eigener Schwung */
function signatureSVG(p) {
  let s = p.h || 1;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const [font, k] = SIGN_FONT[Math.floor(r() * SIGN_FONT.length)], ink = SIGN_INK[Math.floor(r() * SIGN_INK.length)];
  const style = r();
  const txt = style < 0.34 ? p.first + " " + p.last : style < 0.67 ? p.first[0] + ". " + p.last : p.last;
  const fs = (27 + r() * 6) * k, rot = -(2 + r() * 6), skew = -(r() * 10);
  const W = 190, y0 = 40;
  /* Schwung: ein Bogen unter dem Namen, je Person anders gelegt (mal flach, mal mit Schleife) */
  const x1 = 18 + r() * 20, x2 = 150 + r() * 30, yb = 46 + r() * 6, c1 = 30 + r() * 40, c2 = 100 + r() * 40, d1 = r() * 14 - 4, d2 = r() * 12 - 9;
  const loop = r() < 0.45;
  const path = loop
    ? `M${x1.toFixed(1)} ${(yb - 2).toFixed(1)} C${c1.toFixed(1)} ${(yb + 10 + d1).toFixed(1)} ${c2.toFixed(1)} ${(yb + 8).toFixed(1)} ${(x2 - 12).toFixed(1)} ${(yb - 6).toFixed(1)} S${(x2 + 6).toFixed(1)} ${(yb - 14).toFixed(1)} ${(x2 - 4).toFixed(1)} ${(yb - 2).toFixed(1)}`
    : `M${x1.toFixed(1)} ${(yb + d2 * 0.3).toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${(yb + 7 + d1).toFixed(1)} ${x2.toFixed(1)} ${(yb - 4 + d2 * 0.4).toFixed(1)}`;
  return `<svg class="sig-svg" viewBox="0 0 ${W} 62" aria-hidden="true"><g transform="rotate(${rot.toFixed(1)} ${W / 2} ${y0}) skewX(${skew.toFixed(1)})">
    <text x="${W / 2}" y="${y0}" text-anchor="middle" font-family="'${font}',cursive" font-size="${fs.toFixed(1)}" fill="${ink}">${esc(txt)}</text>
    <path d="${path}" fill="none" stroke="${ink}" stroke-width="${(1 + r() * 0.6).toFixed(2)}" stroke-linecap="round" opacity=".85"/></g></svg>`;
}
function orderSignHTML(o) {
  if (!o || !(o.pay > SIGN_MIN) || !o.shipper) return "";
  const p = signerOf(o.shipper);
  return `<div class="o-sign">${signatureSVG(p)}<div class="sig-name">i. A. ${esc(p.first + " " + p.last)}</div><div class="sig-role">${esc(p.role)} · ${esc(o.shipper)}</div></div>`;
}
