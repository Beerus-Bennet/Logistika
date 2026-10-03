/* =========================================================================
   LOGISTIKA – Fahrzeuge fürs Auktionshaus
   Reale Modelle von Porsche, Audi, Mercedes-Benz, BMW, Ferrari, Bugatti und
   Lamborghini. Leistungsdaten nach Herstellerangaben, Marktwerte angelehnt an
   reale Auktions- und Händlerpreise (gerundet, Zustand „sehr gut“).
   Fotos: Titelbild des englischen Wikipedia-Artikels (wp) bzw. eine
   bestimmte Datei auf Wikimedia Commons (file) – geladen zur Laufzeit,
   mit Urheber und Lizenz (siehe auction.js).
   ========================================================================= */
"use strict";

const CAR_CLS = {
  young:   { name: "Youngtimer", col: "#2fa85c" },
  classic: { name: "Klassiker",  col: "#b07a2a" },
  sport:   { name: "Sportwagen", col: "#2f6fed" },
  super:   { name: "Supercar",   col: "#e2465f" },
  hyper:   { name: "Hypercar",   col: "#8a5cff" },
  legend:  { name: "Legende",    col: "#e0a800" }
};
const CAR_BRANDS = [
  ["porsche", "Porsche"], ["audi", "Audi"], ["mercedes", "Mercedes"], ["bmw", "BMW"],
  ["ferrari", "Ferrari"], ["bugatti", "Bugatti"], ["lambo", "Lamborghini"]
];
/* Echte Lacknamen der Hersteller */
const CAR_PAINTS = {
  porsche:  [["Indischrot", "#c8102e"], ["Speedgelb", "#f5c400"], ["Rivierablau", "#1f8fd6"], ["GT-Silber", "#b8bcc0"], ["Kreide", "#d9d4c7"], ["Python Grün", "#79a33a"], ["Schwarz", "#15161a"]],
  audi:     [["Nardograu", "#8d9297"], ["Ibisweiß", "#f2f2f2"], ["Sepangblau", "#1d3f8f"], ["Tangorot", "#b3121c"], ["Mythosschwarz", "#16171a"], ["Kyalamigrün", "#3f6b3b"]],
  mercedes: [["Obsidianschwarz", "#1a1b1e"], ["Iridiumsilber", "#b9bec4"], ["Hyazinthrot", "#7a1122"], ["Magnograu", "#6b6e70"], ["Brillantblau", "#1c3b73"], ["AMG Solarbeam", "#f2cf00"]],
  bmw:      [["Alpinweiß", "#f5f5f2"], ["Imolarot", "#c40d1e"], ["Estorilblau", "#1a4fa3"], ["Le-Mans-Blau", "#1a3d7c"], ["Brooklyn Grau", "#8a8f94"], ["Hellrot", "#d1202f"]],
  ferrari:  [["Rosso Corsa", "#d40000"], ["Giallo Modena", "#f7d000"], ["Nero Daytona", "#121212"], ["Blu Tour de France", "#1a2c5b"], ["Bianco Avus", "#f4f4f2"], ["Grigio Silverstone", "#8e9092"]],
  bugatti:  [["French Racing Blue", "#1c3f94"], ["Nocturne Black", "#101114"], ["Italian Red", "#b3121c"], ["Argent Silver", "#c0c4c8"], ["Atlantic Blue", "#1d4a8a"]],
  lambo:    [["Verde Mantis", "#6fbe2c"], ["Arancio Borealis", "#ff7a00"], ["Giallo Orion", "#f5c700"], ["Blu Cepheus", "#1a4ecb"], ["Nero Noctis", "#101010"], ["Bianco Monocerus", "#f2f2f2"], ["Viola Pasifae", "#6b2fa0"]]
};

/* b Marke · m Modell · y typisches Baujahr · ps Leistung · vmax km/h ·
   acc 0–100 km/h in s · n gebaute Exemplare (null = laufende Serie) ·
   cls Klasse · val Marktwert in € · tr Wertentwicklung in % pro Jahr ·
   cap Gepäck in kg (für Wertkurier-Fahrten) · e Antrieb · body Bauform */
const CARS = [
  /* ------------------------------ Porsche ------------------------------ */
  { id: "p356", b: "porsche", m: "356 B 1600 Super", wp: "Porsche 356", yrs: "1948–1965", y: 1961, ps: 75, vmax: 175, acc: 14.5, n: 76000, cls: "classic", val: 120000, tr: 3, cap: 60, eng: "1,6-l-Vierzylinder-Boxer", body: "classic",
    note: "Der erste Serien-Porsche – Käfer-Technik unter handgedengeltem Blech." },
  { id: "p550", b: "porsche", m: "550 Spyder", wp: "Porsche 550", yrs: "1953–1956", y: 1955, ps: 110, vmax: 220, acc: null, n: 90, cls: "legend", val: 4200000, tr: 5, cap: 10, eng: "1,5-l-Boxer (Fuhrmann-Motor)", body: "roadster",
    note: "Leichtbau-Rennsportwagen für die Straße – nur 90 Exemplare." },
  { id: "p930", b: "porsche", m: "911 Turbo 3.3 (930)", wp: "Porsche 930", yrs: "1975–1989", y: 1987, ps: 300, vmax: 260, acc: 5.4, n: 21589, cls: "classic", val: 140000, tr: 4, cap: 60, eng: "3,3-l-Boxer, Turbo", body: "coupe",
    note: "Der „Witwenmacher“: brachialer Turbo-Schub und breiter Heckflügel." },
  { id: "p959", b: "porsche", m: "959", wp: "Porsche 959", yrs: "1986–1993", y: 1988, ps: 450, vmax: 317, acc: 3.7, n: 292, cls: "legend", val: 1900000, tr: 5, cap: 50, eng: "2,85-l-Boxer, Biturbo", body: "coupe",
    note: "Technologieträger mit Allrad und Biturbo – 1986 das schnellste Serienauto der Welt." },
  { id: "pcgt", b: "porsche", m: "Carrera GT", wp: "Porsche Carrera GT", yrs: "2004–2006", y: 2005, ps: 612, vmax: 330, acc: 3.9, n: 1270, cls: "hyper", val: 1400000, tr: 6, cap: 40, eng: "5,7-l-V10", body: "roadster",
    note: "V10 aus dem Le-Mans-Projekt, Keramikkupplung und Handschaltung." },
  { id: "p918", b: "porsche", m: "918 Spyder", wp: "Porsche 918 Spyder", yrs: "2013–2015", y: 2014, ps: 887, vmax: 345, acc: 2.6, n: 918, cls: "hyper", val: 1700000, tr: 3, cap: 30, eng: "4,6-l-V8 + 2 E-Motoren", e: "hybrid", body: "roadster",
    note: "Plug-in-Hybrid mit V8 und zwei E-Motoren – Nordschleife in 6:57 Minuten." },
  { id: "pgt3", b: "porsche", m: "911 GT3 (992)", wp: "Porsche 911 GT3", yrs: "seit 2021", y: 2022, ps: 510, vmax: 318, acc: 3.4, n: null, cls: "sport", val: 220000, tr: 0, cap: 130, eng: "4,0-l-Boxer", body: "coupe",
    note: "Saugmotor bis 9.000 Touren – der Rennwagen mit Nummernschild." },
  { id: "pgt2", b: "porsche", m: "911 GT2 RS (991)", wp: "Porsche 911 GT2", yrs: "2017–2019", y: 2018, ps: 700, vmax: 340, acc: 2.8, n: 1000, cls: "super", val: 420000, tr: 2, cap: 110, eng: "3,8-l-Boxer, Biturbo", body: "coupe",
    note: "Stärkster Elfer seiner Zeit, 2017 Rekord auf der Nordschleife." },
  { id: "p924", b: "porsche", m: "924", wp: "Porsche 924", yrs: "1976–1988", y: 1981, ps: 125, vmax: 204, acc: 9.6, n: 150000, cls: "young", val: 11000, tr: 3, cap: 150, eng: "2,0-l-Reihenvierzylinder", body: "coupe",
    note: "Transaxle-Einstieg in die Porsche-Welt, Motor aus dem VW-Regal." },
  { id: "p944", b: "porsche", m: "944", wp: "Porsche 944", yrs: "1982–1991", y: 1986, ps: 163, vmax: 220, acc: 8.4, n: 163000, cls: "young", val: 17000, tr: 4, cap: 180, eng: "2,5-l-Reihenvierzylinder", body: "coupe",
    note: "Breite Backen, ausgewogene Achslast – ein Liebling der Kurvenfans." },
  { id: "p928", b: "porsche", m: "928 S4", wp: "Porsche 928", yrs: "1977–1995", y: 1988, ps: 320, vmax: 270, acc: 5.9, n: 61000, cls: "classic", val: 42000, tr: 4, cap: 200, eng: "5,0-l-V8", body: "coupe",
    note: "V8-Gran-Turismo, der einmal den 911 ablösen sollte." },
  { id: "p986", b: "porsche", m: "Boxster (986)", wp: "Porsche Boxster (986)", yrs: "1996–2004", y: 2000, ps: 204, vmax: 240, acc: 6.9, n: 164000, cls: "young", val: 13000, tr: 1, cap: 130, eng: "2,5-l-Boxer", body: "roadster",
    note: "Der Mittelmotor-Roadster, der Porsche in den 90ern gerettet hat." },
  { id: "ptay", b: "porsche", m: "Taycan Turbo S", wp: "Porsche Taycan", yrs: "seit 2019", y: 2021, ps: 761, vmax: 260, acc: 2.8, n: null, cls: "sport", val: 115000, tr: -6, cap: 150, eng: "2 E-Motoren, 800 Volt", e: "elektro", body: "limo",
    note: "Elektrische Sportlimousine – leise, aber brutal schnell." },
  { id: "pcay", b: "porsche", m: "Cayenne Turbo", wp: "Porsche Cayenne", yrs: "seit 2002", y: 2020, ps: 550, vmax: 286, acc: 3.9, n: null, cls: "sport", val: 95000, tr: -5, cap: 500, eng: "4,0-l-V8, Biturbo", body: "suv",
    note: "Sport-SUV mit riesigem Kofferraum – der schnellste Weg für viele Wertsachen." },

  /* -------------------------------- Audi -------------------------------- */
  { id: "aurq", b: "audi", m: "quattro („Ur-quattro“)", wp: "Audi Quattro", yrs: "1980–1991", y: 1985, ps: 200, vmax: 222, acc: 7.1, n: 11452, cls: "classic", val: 65000, tr: 5, cap: 300, eng: "2,1-l-Fünfzylinder, Turbo", body: "coupe",
    note: "Machte den Allradantrieb im Pkw salonfähig – und Rallye-Geschichte." },
  { id: "asq", b: "audi", m: "Sport quattro", file: "Audi Sport Quattro.jpg", yrs: "1984–1985", y: 1984, ps: 306, vmax: 250, acc: 4.8, n: 214, cls: "legend", val: 650000, tr: 6, cap: 150, eng: "2,1-l-Fünfzylinder, Turbo", body: "coupe",
    note: "Kurzer Homologations-Kraftprotz für die Rallye-Gruppe B." },
  { id: "ars2", b: "audi", m: "RS 2 Avant", wp: "Audi RS 2 Avant", yrs: "1994–1995", y: 1995, ps: 315, vmax: 262, acc: 4.8, n: 2891, cls: "classic", val: 80000, tr: 6, cap: 390, eng: "2,2-l-Fünfzylinder, Turbo", body: "kombi",
    note: "Kombi mit Porsche-Hilfe – der Urahn aller RS-Modelle." },
  { id: "ar8a", b: "audi", m: "R8 4.2 FSI (Typ 42)", wp: "Audi R8 (Type 42)", yrs: "2006–2015", y: 2008, ps: 420, vmax: 301, acc: 4.6, n: null, cls: "sport", val: 65000, tr: 0, cap: 100, eng: "4,2-l-V8", body: "coupe",
    note: "Erster Mittelmotor-Sportwagen von Audi – mit offener Schaltkulisse." },
  { id: "ar8", b: "audi", m: "R8 V10 performance (Typ 4S)", wp: "Audi R8 (Type 4S)", yrs: "2015–2024", y: 2020, ps: 620, vmax: 331, acc: 3.1, n: null, cls: "sport", val: 165000, tr: -3, cap: 110, eng: "5,2-l-V10", body: "coupe",
    note: "Saug-V10 mit Mittelmotor, eng verwandt mit dem Huracán." },
  { id: "ars6", b: "audi", m: "RS 6 Avant (C8)", wp: "Audi RS 6", yrs: "seit 2019", y: 2022, ps: 600, vmax: 305, acc: 3.6, n: null, cls: "sport", val: 115000, tr: -5, cap: 560, eng: "4,0-l-V8, Biturbo", body: "kombi",
    note: "Der Familienkombi, der Supersportwagen jagt – mit 565 Litern Kofferraum." },
  { id: "aetr", b: "audi", m: "RS e-tron GT", wp: "Audi e-tron GT", yrs: "seit 2021", y: 2022, ps: 646, vmax: 250, acc: 3.3, n: null, cls: "sport", val: 105000, tr: -7, cap: 180, eng: "2 E-Motoren, 800 Volt", e: "elektro", body: "limo",
    note: "Elektrischer Gran Turismo auf der Technik des Taycan." },
  { id: "ars4", b: "audi", m: "RS 4 Avant (B9)", wp: "Audi RS 4", yrs: "seit 2017", y: 2019, ps: 450, vmax: 280, acc: 4.1, n: null, cls: "sport", val: 62000, tr: -4, cap: 450, eng: "2,9-l-V6, Biturbo", body: "kombi",
    note: "V6-Biturbo-Kombi – Alltag und Autobahn in einem." },

  /* ---------------------------- Mercedes-Benz --------------------------- */
  { id: "m300", b: "mercedes", m: "300 SL Flügeltürer (W 198)", wp: "Mercedes-Benz 300 SL", yrs: "1954–1957", y: 1955, ps: 215, vmax: 250, acc: 9.5, n: 1400, cls: "legend", val: 1350000, tr: 4, cap: 40, eng: "3,0-l-Reihensechszylinder, Direkteinspritzung", body: "classic",
    note: "Direkteinspritzung und Flügeltüren – der Supersportwagen des Wirtschaftswunders." },
  { id: "m113", b: "mercedes", m: "280 SL „Pagode“ (W 113)", wp: "Mercedes-Benz W113", yrs: "1963–1971", y: 1969, ps: 170, vmax: 200, acc: 9.3, n: 48912, cls: "classic", val: 110000, tr: 3, cap: 120, eng: "2,8-l-Reihensechszylinder", body: "roadster",
    note: "Das gewölbte Hardtop gab ihr den Spitznamen." },
  { id: "m129", b: "mercedes", m: "500 SL (R 129)", wp: "Mercedes-Benz SL-Class (R129)", yrs: "1989–2001", y: 1994, ps: 326, vmax: 250, acc: 6.2, n: 204940, cls: "young", val: 28000, tr: 4, cap: 250, eng: "5,0-l-V8", body: "roadster",
    note: "Mit Überrollbügel, der in 0,3 Sekunden hochschnellt – Ingenieurskunst der 90er." },
  { id: "mclk", b: "mercedes", m: "CLK GTR", wp: "Mercedes-Benz CLK GTR", yrs: "1998–1999", y: 1998, ps: 612, vmax: 320, acc: 3.8, n: 26, cls: "legend", val: 9000000, tr: 6, cap: 10, eng: "6,9-l-V12", body: "coupe",
    note: "Straßenversion des GT1-Rennwagens – eines der seltensten Autos der Welt." },
  { id: "mslr", b: "mercedes", m: "SLR McLaren", wp: "Mercedes-Benz SLR McLaren", yrs: "2003–2010", y: 2005, ps: 626, vmax: 334, acc: 3.8, n: 2157, cls: "super", val: 420000, tr: 4, cap: 150, eng: "5,4-l-V8, Kompressor", body: "coupe",
    note: "Kompressor-V8 unter der Pfeilnase, Seitenrohre hinter den Vorderrädern." },
  { id: "msls", b: "mercedes", m: "SLS AMG", wp: "Mercedes-Benz SLS AMG", yrs: "2010–2014", y: 2012, ps: 571, vmax: 317, acc: 3.8, n: null, cls: "super", val: 240000, tr: 3, cap: 120, eng: "6,2-l-V8", body: "coupe",
    note: "Die Flügeltüren sind zurück – mit 6,2-Liter-Saugmotor." },
  { id: "mamg", b: "mercedes", m: "AMG GT S (C 190)", wp: "Mercedes-AMG GT", yrs: "2014–2021", y: 2017, ps: 522, vmax: 310, acc: 3.8, n: null, cls: "sport", val: 85000, tr: -3, cap: 180, eng: "4,0-l-V8, Biturbo", body: "coupe",
    note: "Lange Haube, kurzes Heck, Biturbo-V8 im „heißen V“." },
  { id: "mone", b: "mercedes", m: "AMG One", wp: "Mercedes-AMG One", yrs: "2022–2023", y: 2022, ps: 1063, vmax: 352, acc: 2.9, n: 275, cls: "hyper", val: 3300000, tr: 2, cap: 5, eng: "1,6-l-V6-Turbo + 4 E-Motoren", e: "hybrid", body: "coupe",
    note: "Formel-1-Antrieb mit Straßenzulassung." },
  { id: "mg63", b: "mercedes", m: "AMG G 63", wp: "Mercedes-Benz G-Class", yrs: "seit 2018", y: 2021, ps: 585, vmax: 220, acc: 4.5, n: null, cls: "sport", val: 165000, tr: -2, cap: 650, eng: "4,0-l-V8, Biturbo", body: "suv",
    note: "Kastenform, Seitenrohre, drei Sperren – Kult seit 1979." },

  /* --------------------------------- BMW -------------------------------- */
  { id: "b507", b: "bmw", m: "507", wp: "BMW 507", yrs: "1956–1959", y: 1957, ps: 150, vmax: 220, acc: 11.1, n: 252, cls: "legend", val: 2300000, tr: 4, cap: 80, eng: "3,2-l-V8", body: "roadster",
    note: "Elvis Presley fuhr einen – nur 252 Exemplare entstanden." },
  { id: "be9", b: "bmw", m: "3.0 CSi (E9)", wp: "BMW E9", yrs: "1968–1975", y: 1972, ps: 200, vmax: 220, acc: 7.5, n: 30546, cls: "classic", val: 95000, tr: 5, cap: 300, eng: "3,0-l-Reihensechszylinder", body: "classic",
    note: "Das elegante Coupé, aus dem das „Batmobil“ 3.0 CSL wurde." },
  { id: "bm1", b: "bmw", m: "M1", wp: "BMW M1", yrs: "1978–1981", y: 1980, ps: 277, vmax: 262, acc: 5.6, n: 453, cls: "legend", val: 650000, tr: 5, cap: 50, eng: "3,5-l-Reihensechszylinder", body: "coupe",
    note: "Einziger Mittelmotor-Sportwagen von BMW, Karosserie von Giugiaro." },
  { id: "bm3", b: "bmw", m: "M3 (E30)", file: "BMW M3 E30.jpg", yrs: "1986–1991", y: 1989, ps: 200, vmax: 235, acc: 6.7, n: 17970, cls: "classic", val: 95000, tr: 7, cap: 350, eng: "2,3-l-Reihenvierzylinder", body: "limo",
    note: "Tourenwagen-Champion für die Straße – Kultobjekt mit Kotflügelverbreiterung." },
  { id: "bm5", b: "bmw", m: "M5 (E39)", file: "BMW M5 E39 (5763351352).jpg", yrs: "1998–2003", y: 2001, ps: 400, vmax: 250, acc: 5.3, n: 20482, cls: "young", val: 38000, tr: 6, cap: 460, eng: "5,0-l-V8", body: "limo",
    note: "V8-Limousine, die viele für den besten M5 aller Zeiten halten." },
  { id: "bz3", b: "bmw", m: "Z3 roadster 2.8", wp: "BMW Z3", yrs: "1995–2002", y: 1998, ps: 193, vmax: 230, acc: 7.1, n: 297000, cls: "young", val: 12000, tr: 3, cap: 165, eng: "2,8-l-Reihensechszylinder", body: "roadster",
    note: "Der Roadster aus dem Bond-Film „GoldenEye“." },
  { id: "bz8", b: "bmw", m: "Z8", wp: "BMW Z8", yrs: "2000–2003", y: 2001, ps: 400, vmax: 250, acc: 4.7, n: 5703, cls: "super", val: 260000, tr: 5, cap: 200, eng: "5,0-l-V8", body: "roadster",
    note: "Retro-Roadster als Hommage an den 507 – mit dem V8 aus dem M5." },
  { id: "bi8", b: "bmw", m: "i8", wp: "BMW i8", yrs: "2014–2020", y: 2016, ps: 374, vmax: 250, acc: 4.4, n: 20465, cls: "sport", val: 55000, tr: -4, cap: 90, eng: "1,5-l-Dreizylinder-Turbo + E-Motor", e: "hybrid", body: "coupe",
    note: "Plug-in-Hybrid mit Flügeltüren – die Zukunft zum Anfassen." },
  { id: "bm2", b: "bmw", m: "M2 (G87)", wp: "BMW M2", yrs: "seit 2023", y: 2024, ps: 460, vmax: 285, acc: 4.1, n: null, cls: "sport", val: 72000, tr: -4, cap: 390, eng: "3,0-l-Reihensechszylinder, Biturbo", body: "coupe",
    note: "Kompakter Hecktriebler mit Reihensechser, auf Wunsch handgeschaltet." },

  /* ------------------------------- Ferrari ------------------------------ */
  { id: "f250", b: "ferrari", m: "250 GTO", wp: "Ferrari 250 GTO", yrs: "1962–1964", y: 1962, ps: 300, vmax: 280, acc: 6.1, n: 36, cls: "legend", val: 48000000, tr: 5, cap: 20, eng: "3,0-l-V12", body: "classic",
    note: "Der „Heilige Gral“ der Sammler: 36 Stück, Rekordpreise jenseits von 50 Millionen." },
  { id: "f308", b: "ferrari", m: "308 GTB", wp: "Ferrari 308 GTB/GTS", yrs: "1975–1985", y: 1978, ps: 255, vmax: 252, acc: 6.5, n: 12000, cls: "classic", val: 85000, tr: 4, cap: 90, eng: "2,9-l-V8", body: "coupe",
    note: "Pininfarina-Klassiker mit V8 in der Mitte – Magnum fuhr die offene Version." },
  { id: "f288", b: "ferrari", m: "288 GTO", wp: "Ferrari 288 GTO", yrs: "1984–1987", y: 1985, ps: 400, vmax: 305, acc: 4.9, n: 272, cls: "legend", val: 3600000, tr: 5, cap: 30, eng: "2,9-l-V8, Biturbo", body: "coupe",
    note: "Gruppe-B-Homologation und Urahn der Ferrari-Hypercars." },
  { id: "ftr", b: "ferrari", m: "Testarossa", wp: "Ferrari Testarossa", yrs: "1984–1991", y: 1987, ps: 390, vmax: 290, acc: 5.8, n: 7177, cls: "classic", val: 150000, tr: 4, cap: 180, eng: "4,9-l-Flach-Zwölfzylinder", body: "coupe",
    note: "Seitenkiemen, Zwölfzylinder, Miami Vice – die Ikone der 80er." },
  { id: "ff40", b: "ferrari", m: "F40", wp: "Ferrari F40", yrs: "1987–1992", y: 1990, ps: 478, vmax: 324, acc: 4.1, n: 1315, cls: "legend", val: 2600000, tr: 6, cap: 20, eng: "2,9-l-V8, Biturbo", body: "coupe",
    note: "Enzo Ferraris letztes Werk – Biturbo, Kevlar, kein Komfort." },
  { id: "ff50", b: "ferrari", m: "F50", wp: "Ferrari F50", yrs: "1995–1997", y: 1996, ps: 520, vmax: 325, acc: 3.7, n: 349, cls: "legend", val: 5000000, tr: 6, cap: 20, eng: "4,7-l-V12", body: "roadster",
    note: "V12 direkt aus der Formel 1, der Motor trägt das Heck." },
  { id: "fenz", b: "ferrari", m: "Enzo", wp: "Ferrari Enzo", yrs: "2002–2004", y: 2003, ps: 660, vmax: 350, acc: 3.3, n: 400, cls: "hyper", val: 4000000, tr: 5, cap: 20, eng: "6,0-l-V12", body: "coupe",
    note: "Benannt nach dem Firmengründer – Michael Schumacher half bei der Abstimmung." },
  { id: "flaf", b: "ferrari", m: "LaFerrari", wp: "LaFerrari", yrs: "2013–2016", y: 2015, ps: 963, vmax: 350, acc: 2.6, n: 499, cls: "hyper", val: 3900000, tr: 3, cap: 20, eng: "6,3-l-V12 + E-Motor (HY-KERS)", e: "hybrid", body: "coupe",
    note: "Der erste Hybrid-Ferrari – „die Ferrari“ schlechthin." },
  { id: "f458", b: "ferrari", m: "458 Italia", wp: "Ferrari 458", yrs: "2009–2015", y: 2012, ps: 570, vmax: 325, acc: 3.4, n: null, cls: "super", val: 190000, tr: 2, cap: 110, eng: "4,5-l-V8", body: "coupe",
    note: "Der letzte Mittelmotor-V8 ohne Turbo – dreht bis 9.000." },
  { id: "f812", b: "ferrari", m: "812 Superfast", wp: "Ferrari 812 Superfast", yrs: "2017–2023", y: 2019, ps: 800, vmax: 340, acc: 2.9, n: null, cls: "super", val: 340000, tr: 1, cap: 200, eng: "6,5-l-V12", body: "coupe",
    note: "800 PS aus einem Saug-V12 – Frontmotor, Heckantrieb, Gänsehaut." },
  { id: "fsf90", b: "ferrari", m: "SF90 Stradale", wp: "Ferrari SF90 Stradale", yrs: "seit 2019", y: 2021, ps: 1000, vmax: 340, acc: 2.5, n: null, cls: "super", val: 430000, tr: -1, cap: 74, eng: "4,0-l-V8-Biturbo + 3 E-Motoren", e: "hybrid", body: "coupe",
    note: "Plug-in-Hybrid mit 1.000 PS – 25 Kilometer rein elektrisch." },
  { id: "f296", b: "ferrari", m: "296 GTB", wp: "Ferrari 296", yrs: "seit 2022", y: 2023, ps: 830, vmax: 330, acc: 2.9, n: null, cls: "super", val: 290000, tr: -2, cap: 120, eng: "3,0-l-V6-Biturbo + E-Motor", e: "hybrid", body: "coupe",
    note: "V6-Hybrid, von Fans „piccolo V12“ genannt." },
  { id: "fsp3", b: "ferrari", m: "Daytona SP3", wp: "Ferrari Daytona SP3", yrs: "2022–2024", y: 2022, ps: 840, vmax: 340, acc: 2.85, n: 599, cls: "hyper", val: 3000000, tr: 3, cap: 30, eng: "6,5-l-V12", body: "roadster",
    note: "Hommage an den Dreifachsieg von Daytona 1967." },
  { id: "fpur", b: "ferrari", m: "Purosangue", wp: "Ferrari Purosangue", yrs: "seit 2022", y: 2023, ps: 725, vmax: 310, acc: 3.3, n: null, cls: "super", val: 480000, tr: 0, cap: 470, eng: "6,5-l-V12", body: "suv",
    note: "Ferraris erster Viertürer mit V12 – das Wort SUV hört man in Maranello nicht gern." },

  /* ------------------------------- Bugatti ------------------------------ */
  { id: "bt57", b: "bugatti", m: "Type 57", wp: "Bugatti Type 57", yrs: "1934–1940", y: 1937, ps: 135, vmax: 153, acc: null, n: 710, cls: "legend", val: 1500000, tr: 4, cap: 60, eng: "3,3-l-Reihenachtzylinder", body: "classic",
    note: "Jean Bugattis Meisterwerk der Art-déco-Zeit." },
  { id: "beb110", b: "bugatti", m: "EB110 GT", wp: "Bugatti EB110", yrs: "1991–1995", y: 1993, ps: 560, vmax: 342, acc: 3.4, n: 139, cls: "legend", val: 2500000, tr: 7, cap: 30, eng: "3,5-l-V12, vier Turbos", body: "coupe",
    note: "Vier Turbos, Allrad, Carbon – Bugattis Wiedergeburt in Italien." },
  { id: "bvey", b: "bugatti", m: "Veyron 16.4", wp: "Bugatti Veyron", yrs: "2005–2015", y: 2008, ps: 1001, vmax: 407, acc: 2.5, n: 450, cls: "hyper", val: 1800000, tr: 3, cap: 25, eng: "8,0-l-W16, vier Turbos", body: "coupe",
    note: "Das erste Serienauto mit über 1.000 PS und über 400 km/h." },
  { id: "bchi", b: "bugatti", m: "Chiron", wp: "Bugatti Chiron", yrs: "2016–2024", y: 2019, ps: 1500, vmax: 420, acc: 2.4, n: 500, cls: "hyper", val: 3000000, tr: 2, cap: 25, eng: "8,0-l-W16, vier Turbos", body: "coupe",
    note: "1.500 PS – elektronisch abgeregelt bei 420 km/h." },
  { id: "bdiv", b: "bugatti", m: "Divo", wp: "Bugatti Divo", yrs: "2019–2021", y: 2020, ps: 1500, vmax: 380, acc: 2.4, n: 40, cls: "hyper", val: 6500000, tr: 4, cap: 20, eng: "8,0-l-W16, vier Turbos", body: "coupe",
    note: "Auf Kurven getrimmt, benannt nach Targa-Florio-Sieger Albert Divo." },
  { id: "bnoi", b: "bugatti", m: "La Voiture Noire", wp: "Bugatti La Voiture Noire", yrs: "2019", y: 2021, ps: 1500, vmax: 420, acc: 2.4, n: 1, cls: "legend", val: 16700000, tr: 3, cap: 20, eng: "8,0-l-W16, vier Turbos", body: "coupe",
    note: "Ein einziges Exemplar – Hommage an den verschollenen Type 57 SC Atlantic." },
  { id: "b110", b: "bugatti", m: "Centodieci", wp: "Bugatti Centodieci", yrs: "2022", y: 2022, ps: 1600, vmax: 380, acc: 2.4, n: 10, cls: "hyper", val: 9000000, tr: 4, cap: 20, eng: "8,0-l-W16, vier Turbos", body: "coupe",
    note: "Zehn Stück zum 110. Geburtstag der Marke – Hommage an den EB110." },
  { id: "bbol", b: "bugatti", m: "Bolide", wp: "Bugatti Bolide", yrs: "2024", y: 2024, ps: 1600, vmax: 380, acc: 2.2, n: 40, cls: "hyper", val: 4500000, tr: 2, cap: 0, eng: "8,0-l-W16, vier Turbos", body: "coupe", track: true,
    note: "Reines Rennstreckenauto auf W16-Basis – keine Straßenzulassung." },
  { id: "bmis", b: "bugatti", m: "W16 Mistral", wp: "Bugatti Mistral", yrs: "2024–2025", y: 2024, ps: 1600, vmax: 420, acc: 2.5, n: 99, cls: "hyper", val: 5500000, tr: 3, cap: 20, eng: "8,0-l-W16, vier Turbos", body: "roadster",
    note: "Der letzte Bugatti mit W16 – Roadster-Weltrekord mit 453,9 km/h." },
  { id: "btou", b: "bugatti", m: "Tourbillon", wp: "Bugatti Tourbillon", yrs: "ab 2026", y: 2026, ps: 1800, vmax: 445, acc: 2.0, n: 250, cls: "hyper", val: 3900000, tr: 1, cap: 25, eng: "8,3-l-V16 + 3 E-Motoren", e: "hybrid", body: "coupe",
    note: "V16-Hybrid mit Instrumenten wie ein Uhrwerk – Nachfolger des Chiron." },

  /* ----------------------------- Lamborghini ---------------------------- */
  { id: "lmiu", b: "lambo", m: "Miura P400", wp: "Lamborghini Miura", yrs: "1966–1973", y: 1968, ps: 350, vmax: 280, acc: 6.7, n: 764, cls: "legend", val: 2100000, tr: 5, cap: 30, eng: "3,9-l-V12, quer eingebaut", body: "coupe",
    note: "Der erste Supersportwagen mit quer eingebautem Mittelmotor-V12." },
  { id: "lcou", b: "lambo", m: "Countach 5000 QV", wp: "Lamborghini Countach", yrs: "1974–1990", y: 1985, ps: 455, vmax: 295, acc: 4.9, n: 1999, cls: "classic", val: 550000, tr: 6, cap: 50, eng: "5,2-l-V12", body: "coupe",
    note: "Das Poster über jedem Kinderbett der 80er – Scherentüren inklusive." },
  { id: "llm2", b: "lambo", m: "LM002", wp: "Lamborghini LM002", yrs: "1986–1993", y: 1988, ps: 450, vmax: 210, acc: 7.7, n: 328, cls: "classic", val: 420000, tr: 6, cap: 700, eng: "5,2-l-V12", body: "suv",
    note: "Der „Rambo-Lambo“: Countach-V12 im Geländewagen." },
  { id: "ldia", b: "lambo", m: "Diablo", wp: "Lamborghini Diablo", yrs: "1990–2001", y: 1994, ps: 492, vmax: 325, acc: 4.5, n: 2884, cls: "classic", val: 320000, tr: 6, cap: 50, eng: "5,7-l-V12", body: "coupe",
    note: "Nachfolger des Countach und erstes Serienauto über 320 km/h." },
  { id: "lmur", b: "lambo", m: "Murciélago", wp: "Lamborghini Murciélago", yrs: "2001–2010", y: 2004, ps: 580, vmax: 330, acc: 3.8, n: 4099, cls: "super", val: 240000, tr: 4, cap: 60, eng: "6,2-l-V12", body: "coupe",
    note: "Erster Lamborghini unter Audi-Regie, benannt nach einem Kampfstier." },
  { id: "lgal", b: "lambo", m: "Gallardo", wp: "Lamborghini Gallardo", yrs: "2003–2013", y: 2006, ps: 520, vmax: 315, acc: 4.0, n: 14022, cls: "sport", val: 105000, tr: 2, cap: 110, eng: "5,0-l-V10", body: "coupe",
    note: "Der „Baby-Lambo“ mit V10 – der meistverkaufte Lamborghini seiner Zeit." },
  { id: "lven", b: "lambo", m: "Veneno", wp: "Lamborghini Veneno", yrs: "2013–2014", y: 2013, ps: 750, vmax: 355, acc: 2.8, n: 12, cls: "legend", val: 9000000, tr: 5, cap: 20, eng: "6,5-l-V12", body: "coupe",
    note: "Drei Coupés und neun Roadster zum 50. Firmenjubiläum." },
  { id: "lave", b: "lambo", m: "Aventador LP 700-4", wp: "Lamborghini Aventador", yrs: "2011–2022", y: 2014, ps: 700, vmax: 350, acc: 2.9, n: 11465, cls: "super", val: 280000, tr: 1, cap: 150, eng: "6,5-l-V12", body: "coupe",
    note: "Carbon-Monocoque, Scherentüren und ein 6,5-Liter-V12." },
  { id: "lhur", b: "lambo", m: "Huracán LP 610-4", wp: "Lamborghini Huracán", yrs: "2014–2024", y: 2016, ps: 610, vmax: 325, acc: 3.2, n: null, cls: "super", val: 190000, tr: 0, cap: 100, eng: "5,2-l-V10", body: "coupe",
    note: "V10-Sauger mit Allrad – erfolgreich wie kein Lamborghini vor dem Urus." },
  { id: "lcen", b: "lambo", m: "Centenario", wp: "Lamborghini Centenario", yrs: "2016–2017", y: 2016, ps: 770, vmax: 350, acc: 2.8, n: 40, cls: "hyper", val: 3000000, tr: 4, cap: 20, eng: "6,5-l-V12", body: "coupe",
    note: "Zum 100. Geburtstag von Ferruccio Lamborghini – 20 Coupés, 20 Roadster." },
  { id: "lsian", b: "lambo", m: "Sián FKP 37", wp: "Lamborghini Sián FKP 37", yrs: "2020–2021", y: 2020, ps: 819, vmax: 350, acc: 2.8, n: 63, cls: "hyper", val: 3500000, tr: 3, cap: 20, eng: "6,5-l-V12 + E-Motor (Superkondensator)", e: "hybrid", body: "coupe",
    note: "Erster Hybrid-Lamborghini – 63 Stück für das Gründungsjahr 1963." },
  { id: "luru", b: "lambo", m: "Urus", wp: "Lamborghini Urus", yrs: "seit 2018", y: 2021, ps: 650, vmax: 305, acc: 3.6, n: null, cls: "sport", val: 210000, tr: -3, cap: 550, eng: "4,0-l-V8, Biturbo", body: "suv",
    note: "Super-SUV – ein Lamborghini, in den auch Koffer passen." },
  { id: "lrev", b: "lambo", m: "Revuelto", wp: "Lamborghini Revuelto", yrs: "seit 2023", y: 2024, ps: 1015, vmax: 350, acc: 2.5, n: null, cls: "super", val: 560000, tr: 0, cap: 80, eng: "6,5-l-V12 + 3 E-Motoren", e: "hybrid", body: "coupe",
    note: "V12-Plug-in-Hybrid mit 1.015 PS, Nachfolger des Aventador." }
];
const CAR = {};
CARS.forEach(c => { CAR[c.id] = c; });
const carBrand = c => (CAR_BRANDS.find(x => x[0] === c.b) || [0, ""])[1];
const carName = c => c.m === "LaFerrari" ? c.m
  : (c.b === "mercedes" ? (/^AMG/.test(c.m) ? "Mercedes-" : "Mercedes-Benz ") : carBrand(c) + " ") + c.m;
