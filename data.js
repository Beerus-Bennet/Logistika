/* =========================================================================
   LOGISTIKA – Weltdaten
   ---------------------------------------------------------------------
   Knoten  = reale Logistikstandorte (Häfen, Terminals, Flughäfen, Städte)
   Kanten  = reale Verkehrsinfrastruktur
             b Fahrrad | r Straße | l Schiene | i Binnenwasser
             s Seeweg  | a Luftkorridor
   ========================================================================= */
"use strict";

/* [id, Name, lat, lon, Landmasse, Etappe, Modi, Typ, Kurzname] */
const NODES = [
  // ---------- Etappe 1: Berlin ----------
  ["b-mitte",   "Berlin-Mitte",                  52.5200, 13.4050, "EUR", 1, "br",   "city", "Mitte"],
  ["b-kreuz",   "Berlin-Kreuzberg",              52.4980, 13.4030, "EUR", 1, "br",   "city", "Kreuzberg"],
  ["b-pberg",   "Berlin-Prenzlauer Berg",        52.5400, 13.4240, "EUR", 1, "br",   "city", "P'Berg"],
  ["b-char",    "Berlin-Charlottenburg",         52.5160, 13.3040, "EUR", 1, "br",   "city", "Charlottenb."],
  ["b-span",    "Berlin-Spandau",                52.5360, 13.2000, "EUR", 1, "br",   "city", "Spandau"],
  ["b-tempel",  "Berlin-Tempelhof",              52.4730, 13.3860, "EUR", 1, "br",   "city", "Tempelhof"],
  ["b-licht",   "Berlin-Lichtenberg",            52.5150, 13.4970, "EUR", 1, "br",   "city", "Lichtenberg"],
  ["b-neu",     "Berlin-Neukölln",               52.4810, 13.4350, "EUR", 1, "br",   "city", "Neukölln"],
  ["b-marz",    "Berlin-Marzahn",                52.5450, 13.5870, "EUR", 1, "br",   "city", "Marzahn"],
  ["b-steg",    "Berlin-Steglitz",               52.4560, 13.3320, "EUR", 1, "br",   "city", "Steglitz"],
  ["b-westh",   "Westhafen Berlin",              52.5370, 13.3430, "EUR", 1, "bri",  "port", "Westhafen"],
  ["b-gvz",     "GVZ Berlin Süd Großbeeren",     52.3600, 13.3200, "EUR", 1, "rl",   "rail", "GVZ Großbeeren"],
  ["b-ber",     "Flughafen BER",                 52.3667, 13.5033, "EUR", 1, "rla",  "air",  "BER"],

  // ---------- Etappe 2: Brandenburg & Mitteldeutschland ----------
  ["potsdam",   "Potsdam",                       52.3906, 13.0645, "EUR", 2, "r",    "city", "Potsdam"],
  ["ffo",       "Frankfurt (Oder)",              52.3412, 14.5487, "EUR", 2, "rl",   "rail", "Frankfurt/O."],
  ["cottbus",   "Cottbus",                       51.7563, 14.3329, "EUR", 2, "rl",   "city", "Cottbus"],
  ["bbg",       "Brandenburg an der Havel",      52.4125, 12.5316, "EUR", 2, "ri",   "port", "Brandenburg"],
  ["ebw",       "Eberswalde",                    52.8340, 13.8180, "EUR", 2, "r",    "city", "Eberswalde"],
  ["schwedt",   "Schwedt/Oder",                  53.0600, 14.2830, "EUR", 2, "ri",   "port", "Schwedt"],
  ["magdeburg", "Hafen Magdeburg",               52.1205, 11.6276, "EUR", 2, "rli",  "port", "Magdeburg"],
  ["leipzig",   "Leipzig",                       51.3397, 12.3731, "EUR", 2, "rl",   "city", "Leipzig"],
  ["lej",       "Flughafen Leipzig/Halle",       51.4239, 12.2364, "EUR", 2, "rla",  "air",  "LEJ"],
  ["dresden",   "Dresden",                       51.0504, 13.7373, "EUR", 2, "rl",   "city", "Dresden"],
  ["halle",     "Halle (Saale)",                 51.4825, 11.9700, "EUR", 2, "rl",   "city", "Halle"],

  // ---------- Etappe 3: Deutschland ----------
  ["hamburg",   "Hamburger Hafen",               53.5417,  9.9296, "EUR", 3, "rlis", "port", "Hamburg"],
  ["ham-air",   "Flughafen Hamburg",             53.6304,  9.9882, "EUR", 3, "ra",   "air",  "HAM"],
  ["bhv",       "Container-Terminal Bremerhaven",53.5396,  8.5810, "EUR", 3, "rls",  "port", "Bremerhaven"],
  ["bremen",    "Bremen",                        53.0793,  8.8017, "EUR", 3, "rli",  "city", "Bremen"],
  ["hannover",  "Hannover",                      52.3759,  9.7320, "EUR", 3, "rli",  "city", "Hannover"],
  ["duisburg",  "duisport Duisburg",             51.4344,  6.7623, "EUR", 3, "rli",  "port", "Duisburg"],
  ["dortmund",  "Dortmund",                      51.5136,  7.4653, "EUR", 3, "rli",  "city", "Dortmund"],
  ["koeln",     "Köln",                          50.9375,  6.9603, "EUR", 3, "rli",  "city", "Köln"],
  ["frankfurt", "Frankfurt am Main",             50.1109,  8.6821, "EUR", 3, "rli",  "city", "Frankfurt"],
  ["fra",       "Flughafen Frankfurt",           50.0379,  8.5622, "EUR", 3, "rla",  "air",  "FRA"],
  ["mannheim",  "Hafen Mannheim",                49.4875,  8.4660, "EUR", 3, "rli",  "port", "Mannheim"],
  ["stuttgart", "Stuttgart",                     48.7758,  9.1829, "EUR", 3, "rl",   "city", "Stuttgart"],
  ["nuernberg", "Nürnberg",                      49.4521, 11.0767, "EUR", 3, "rli",  "city", "Nürnberg"],
  ["muenchen",  "München",                       48.1351, 11.5820, "EUR", 3, "rl",   "city", "München"],
  ["muc",       "Flughafen München",             48.3538, 11.7861, "EUR", 3, "ra",   "air",  "MUC"],
  ["rostock",   "Seehafen Rostock",              54.1500, 12.1000, "EUR", 3, "rls",  "port", "Rostock"],
  ["kiel",      "Hafen Kiel",                    54.3233, 10.1228, "EUR", 3, "rs",   "port", "Kiel"],
  ["saarbr",    "Saarbrücken",                   49.2402,  6.9969, "EUR", 3, "rl",   "city", "Saarbrücken"],

  // ---------- Etappe 4: Europa ----------
  ["rotterdam", "Hafen Rotterdam",               51.9490,  4.1400, "EUR", 4, "rlis", "port", "Rotterdam"],
  ["antwerpen", "Hafen Antwerpen",               51.2600,  4.3500, "EUR", 4, "rlis", "port", "Antwerpen"],
  ["ams",       "Flughafen Amsterdam-Schiphol",  52.3105,  4.7683, "EUR", 4, "rla",  "air",  "AMS"],
  ["bruessel",  "Brüssel",                       50.8503,  4.3517, "EUR", 4, "rl",   "city", "Brüssel"],
  ["paris",     "Paris",                         48.8566,  2.3522, "EUR", 4, "rli",  "city", "Paris"],
  ["cdg",       "Flughafen Paris-CDG",           49.0097,  2.5479, "EUR", 4, "rla",  "air",  "CDG"],
  ["lehavre",   "Hafen Le Havre",                49.4944,  0.1079, "EUR", 4, "rlis", "port", "Le Havre"],
  ["lyon",      "Lyon",                          45.7640,  4.8357, "EUR", 4, "rli",  "city", "Lyon"],
  ["marseille", "Hafen Marseille-Fos",           43.2965,  5.3698, "EUR", 4, "rlis", "port", "Marseille"],
  ["barcelona", "Hafen Barcelona",               41.3851,  2.1734, "EUR", 4, "rls",  "port", "Barcelona"],
  ["valencia",  "Hafen Valencia",                39.4699, -0.3763, "EUR", 4, "rls",  "port", "Valencia"],
  ["madrid",    "Madrid",                        40.4168, -3.7038, "EUR", 4, "rla",  "city", "Madrid"],
  ["algeciras", "Hafen Algeciras",               36.1408, -5.4562, "EUR", 4, "rls",  "port", "Algeciras"],
  ["lissabon",  "Hafen Lissabon",                38.7223, -9.1393, "EUR", 4, "rls",  "port", "Lissabon"],
  ["milano",    "Mailand",                       45.4642,  9.1900, "EUR", 4, "rl",   "city", "Mailand"],
  ["genua",     "Hafen Genua",                   44.4056,  8.9463, "EUR", 4, "rls",  "port", "Genua"],
  ["rom",       "Rom",                           41.9028, 12.4964, "EUR", 4, "rl",   "city", "Rom"],
  ["neapel",    "Hafen Neapel",                  40.8518, 14.2681, "EUR", 4, "rls",  "port", "Neapel"],
  ["zuerich",   "Zürich",                        47.3769,  8.5417, "EUR", 4, "rl",   "city", "Zürich"],
  ["wien",      "Wien",                          48.2082, 16.3738, "EUR", 4, "rli",  "city", "Wien"],
  ["praha",     "Prag",                          50.0755, 14.4378, "EUR", 4, "rl",   "city", "Prag"],
  ["warschau",  "Warschau",                      52.2297, 21.0122, "EUR", 4, "rl",   "city", "Warschau"],
  ["gdansk",    "Hafen Gdańsk",                  54.3520, 18.6466, "EUR", 4, "rls",  "port", "Gdańsk"],
  ["budapest",  "Budapest",                      47.4979, 19.0402, "EUR", 4, "rli",  "city", "Budapest"],
  ["bukarest",  "Bukarest",                      44.4268, 26.1025, "EUR", 4, "rl",   "city", "Bukarest"],
  ["constanta", "Hafen Constanța",               44.1598, 28.6348, "EUR", 4, "rlis", "port", "Constanța"],
  ["istanbul",  "Hafen Istanbul-Ambarlı",        41.0082, 28.9784, "EUR", 4, "rlsa", "port", "Istanbul"],
  ["piraeus",   "Hafen Piräus",                  37.9470, 23.6370, "EUR", 4, "rls",  "port", "Piräus"],
  ["kopenhagen","Kopenhagen",                    55.6761, 12.5683, "EUR", 4, "rls",  "port", "Kopenhagen"],
  ["goeteborg", "Hafen Göteborg",                57.7089, 11.9746, "EUR", 4, "rls",  "port", "Göteborg"],
  ["oslo",      "Oslo",                          59.9139, 10.7522, "EUR", 4, "rls",  "port", "Oslo"],
  ["stockholm", "Stockholm",                     59.3293, 18.0686, "EUR", 4, "rls",  "port", "Stockholm"],
  ["helsinki",  "Helsinki",                      60.1699, 24.9384, "EUR", 4, "rls",  "port", "Helsinki"],
  ["riga",      "Riga",                          56.9496, 24.1052, "EUR", 4, "rls",  "port", "Riga"],
  ["london",    "London",                        51.5074, -0.1278, "UK",  4, "rl",   "city", "London"],
  ["felixstowe","Hafen Felixstowe",              51.9540,  1.3510, "UK",  4, "rls",  "port", "Felixstowe"],
  ["lhr",       "Flughafen London-Heathrow",     51.4700, -0.4543, "UK",  4, "ra",   "air",  "LHR"],
  ["manchester","Manchester",                    53.4808, -2.2426, "UK",  4, "rl",   "city", "Manchester"],

  // ---------- Etappe 5: Eurasien & Transatlantik ----------
  ["minsk",     "Minsk",                         53.9006, 27.5590, "EUR", 5, "rl",   "city", "Minsk"],
  ["malasz",    "Umspur-Terminal Małaszewicze",  52.0500, 23.5000, "EUR", 5, "rl",   "rail", "Małaszewicze"],
  ["moskau",    "Moskau",                        55.7558, 37.6173, "EUR", 5, "rla",  "city", "Moskau"],
  ["ekb",       "Jekaterinburg",                 56.8389, 60.6057, "EUR", 5, "rl",   "rail", "Jekaterinburg"],
  ["astana",    "Astana",                        51.1694, 71.4491, "EUR", 5, "rl",   "rail", "Astana"],
  ["khorgos",   "Khorgos Gateway",               44.2000, 80.4000, "EUR", 5, "rl",   "rail", "Khorgos"],
  ["urumqi",    "Ürümqi",                        43.8256, 87.6168, "EUR", 5, "rl",   "rail", "Ürümqi"],
  ["lanzhou",   "Lanzhou",                       36.0611,103.8343, "EUR", 5, "rl",   "rail", "Lanzhou"],
  ["xian",      "Xi'an",                         34.3416,108.9398, "EUR", 5, "rl",   "rail", "Xi'an"],
  ["chongqing", "Chongqing",                     29.5630,106.5516, "EUR", 5, "rla",  "rail", "Chongqing"],
  ["wuhan",     "Wuhan",                         30.5928,114.3055, "EUR", 5, "rli",  "city", "Wuhan"],
  ["shanghai",  "Hafen Shanghai/Yangshan",       30.6260,122.0650, "EUR", 5, "rlis", "port", "Shanghai"],
  ["pvg",       "Flughafen Shanghai-Pudong",     31.1443,121.8083, "EUR", 5, "rla",  "air",  "PVG"],
  ["ningbo",    "Hafen Ningbo-Zhoushan",         29.8683,121.5440, "EUR", 5, "rls",  "port", "Ningbo"],
  ["shenzhen",  "Hafen Shenzhen-Yantian",        22.5431,114.0579, "EUR", 5, "rls",  "port", "Shenzhen"],
  ["hongkong",  "Hafen Hongkong",                22.3193,114.1694, "EUR", 5, "rsa",  "port", "Hongkong"],
  ["busan",     "Hafen Busan",                   35.1796,129.0756, "KR",  5, "rls",  "port", "Busan"],
  ["tokio",     "Hafen Tokio",                   35.6528,139.8395, "JP",  5, "rls",  "port", "Tokio"],
  ["nrt",       "Flughafen Tokio-Narita",        35.7720,140.3929, "JP",  5, "ra",   "air",  "NRT"],
  ["osaka",     "Hafen Osaka",                   34.6413,135.4300, "JP",  5, "rls",  "port", "Osaka"],
  ["singapur",  "Hafen Singapur",                 1.2644,103.8200, "SG",  5, "rsa",  "port", "Singapur"],
  ["portklang", "Port Klang",                     3.0000,101.4000, "MY",  5, "rs",   "port", "Port Klang"],
  ["jakarta",   "Hafen Tanjung Priok",           -6.1050,106.8800, "ID",  5, "rsa",  "port", "Jakarta"],
  ["mumbai",    "Hafen Nhava Sheva (JNPT)",      18.9490, 72.9490, "IN",  5, "rls",  "port", "Nhava Sheva"],
  ["delhi",     "Delhi",                         28.6139, 77.2090, "IN",  5, "rla",  "city", "Delhi"],
  ["chennai",   "Hafen Chennai",                 13.0827, 80.2707, "IN",  5, "rls",  "port", "Chennai"],
  ["colombo",   "Hafen Colombo",                  6.9271, 79.8612, "LK",  5, "rsa",  "port", "Colombo"],
  ["jebelali",  "Hafen Jebel Ali (Dubai)",       25.0100, 55.0600, "ME",  5, "rsa",  "port", "Jebel Ali"],
  ["suez",      "Suezkanal / Port Said",         31.2653, 32.3019, "SUZ", 5, "s",    "port", "Suezkanal"],
  ["nyc",       "Hafen New York/New Jersey",     40.6840,-74.1500, "NA",  5, "rlsa", "port", "New York"],
  ["chicago",   "Chicago",                       41.8781,-87.6298, "NA",  5, "rla",  "city", "Chicago"],
  ["memphis",   "Memphis (FedEx SuperHub)",      35.0456,-89.9773, "NA",  5, "rla",  "air",  "Memphis"],
  ["lax",       "Hafen Los Angeles/Long Beach",  33.7550,-118.2160,"NA",  5, "rlsa", "port", "Los Angeles"],
  ["houston",   "Hafen Houston",                 29.7604,-95.3698, "NA",  5, "rls",  "port", "Houston"],
  ["miami",     "Hafen Miami",                   25.7617,-80.1918, "NA",  5, "rsa",  "port", "Miami"],
  ["savannah",  "Hafen Savannah",                32.0809,-81.0912, "NA",  5, "rls",  "port", "Savannah"],
  ["vancouver", "Hafen Vancouver",               49.2827,-123.1207,"NA",  5, "rls",  "port", "Vancouver"],
  ["montreal",  "Hafen Montreal",                45.5017,-73.5673, "NA",  5, "rls",  "port", "Montreal"],
  ["panama",    "Panamakanal (Colón)",            9.3547,-79.9000, "PA",  5, "rs",   "port", "Panamakanal"],
  ["santos",    "Hafen Santos",                 -23.9608,-46.3336, "SA",  5, "rlsa", "port", "Santos"],

  // ---------- Etappe 6: Die ganze Welt ----------
  ["mexiko",    "Mexiko-Stadt",                  19.4326,-99.1332, "NA",  6, "rla",  "city", "Mexiko-Stadt"],
  ["veracruz",  "Hafen Veracruz",                19.1738,-96.1342, "NA",  6, "rls",  "port", "Veracruz"],
  ["anchorage", "Flughafen Anchorage",           61.2181,-149.9003,"AK",  6, "ra",   "air",  "Anchorage"],
  ["buenos",    "Hafen Buenos Aires",           -34.6037,-58.3816, "SA",  6, "rlsa", "port", "Buenos Aires"],
  ["santiago",  "Santiago de Chile",            -33.4489,-70.6693, "SA",  6, "rla",  "city", "Santiago"],
  ["callao",    "Hafen Callao (Lima)",          -12.0464,-77.0428, "SA",  6, "rls",  "port", "Callao"],
  ["lagos",     "Hafen Lagos (Apapa)",            6.4550,  3.3841, "AF",  6, "rsa",  "port", "Lagos"],
  ["casablanca","Hafen Casablanca",              33.5731, -7.5898, "AF",  6, "rs",   "port", "Casablanca"],
  ["mombasa",   "Hafen Mombasa",                 -4.0435, 39.6682, "AF",  6, "rls",  "port", "Mombasa"],
  ["durban",    "Hafen Durban",                 -29.8587, 31.0218, "AF",  6, "rls",  "port", "Durban"],
  ["kapstadt",  "Hafen Kapstadt",               -33.9249, 18.4241, "AF",  6, "rlsa", "port", "Kapstadt"],
  ["nairobi",   "Nairobi",                       -1.2921, 36.8219, "AF",  6, "rla",  "city", "Nairobi"],
  ["sydney",    "Hafen Sydney (Botany)",        -33.8688,151.2093, "AU",  6, "rlsa", "port", "Sydney"],
  ["melbourne", "Hafen Melbourne",              -37.8136,144.9631, "AU",  6, "rls",  "port", "Melbourne"],
  ["perth",     "Hafen Fremantle (Perth)",      -32.0569,115.7439, "AU",  6, "rls",  "port", "Fremantle"],
  ["auckland",  "Hafen Auckland",               -36.8485,174.7633, "NZ",  6, "rsa",  "port", "Auckland"]
];

/* Maximale Kantenlänge je Landmasse (km) – bildet die reale Netzdichte ab */
const LAND_LIMITS = {
  EUR: { r: 700,  l: 1700 },
  NA:  { r: 1400, l: 2600 },
  SA:  { r: 1400, l: 2000 },
  AF:  { r: 1200, l: 1400 },
  AU:  { r: 1000, l: 1600 },
  IN:  { r: 1400, l: 1800 },
  UK:  { r: 400,  l: 500  },
  JP:  { r: 600,  l: 700  },
  KR:  { r: 300,  l: 400  },
  ME:  { r: 300,  l: 400  },
  SG:  { r: 60,   l: 60   },
  MY:  { r: 400,  l: 400  },
  ID:  { r: 200,  l: 200  },
  LK:  { r: 200,  l: 200  },
  PA:  { r: 100,  l: 100  },
  AK:  { r: 200,  l: 200  },
  NZ:  { r: 400,  l: 400  },
  SUZ: { r: 0,    l: 0    }
};

/* Rechnerisch nah, real aber durch Wasser getrennt: keine Straße/Schiene */
const NO_LAND_LINK = [
  ["stockholm","helsinki"], ["stockholm","riga"], ["stockholm","gdansk"],
  ["helsinki","riga"], ["oslo","kopenhagen"], ["oslo","goeteborg_x"],
  ["kopenhagen","gdansk"], ["rostock","kopenhagen"], ["rostock","gdansk"],
  ["rostock","goeteborg"], ["kiel","kopenhagen"], ["kiel","goeteborg"],
  ["rostock","stockholm"], ["hamburg","kopenhagen"], ["kiel","gdansk"],
  ["bhv","kiel"], ["riga","stockholm"], ["helsinki","gdansk"],
  ["barcelona","genua"], ["barcelona","rom"], ["barcelona","marseille"],
  ["valencia","marseille"], ["valencia","genua"], ["marseille","rom"],
  ["marseille","neapel"], ["genua","neapel"], ["piraeus","neapel"],
  ["piraeus","istanbul"], ["piraeus","rom"], ["algeciras","casablanca"],
  ["neapel","istanbul"], ["piraeus","constanta"], ["rom","piraeus"],
  ["miami","mexiko"], ["miami","houston"], ["miami","savannah"],
  ["santos","buenos"], ["lissabon","casablanca"], ["santos","callao"],
  ["buenos","callao"], ["santiago","buenos"], ["mombasa","durban"],
  ["lagos","casablanca"], ["kapstadt","mombasa"], ["perth","melbourne"],
  ["perth","sydney"], ["hongkong","tokio"], ["shanghai","osaka"],
  ["mumbai","chennai_x"], ["felixstowe","rotterdam"], ["london","rotterdam"],
  ["london","bruessel"], ["manchester","dortmund"], ["felixstowe","antwerpen"]
];

/* Reale Sonderverbindungen, die die Distanzregel nicht erzeugt */
const EXTRA_EDGES = [
  ["london","paris","l"],          // Eurotunnel
  ["b-westh","b-mitte","r"],
  ["b-gvz","b-tempel","r"],
  ["b-gvz","b-steg","r"],
  ["b-ber","b-neu","r"],
  ["mumbai","chennai","l"],        // indisches Streckennetz
  ["mumbai","delhi","l"],
  ["delhi","chennai","l"],
  ["perth","melbourne","l"],       // Trans-Australian Railway
  ["moskau","ekb","l"],            // Transsib
  ["ekb","astana","l"],
  ["astana","khorgos","l"],
  ["khorgos","urumqi","l"],
  ["urumqi","lanzhou","l"],
  ["lanzhou","xian","l"],
  ["xian","chongqing","l"],
  ["xian","wuhan","l"],
  ["wuhan","shanghai","l"],
  ["chongqing","shenzhen","l"],
  ["malasz","minsk","l"],
  ["minsk","moskau","l"],
  ["warschau","malasz","l"],
  ["chicago","lax","l"],           // US-Transkontinentalbahn
  ["chicago","houston","l"],
  ["vancouver","chicago","l"],
  ["nairobi","mombasa","l"],       // Standard Gauge Railway
  ["lagos","nairobi","r"]
];

/* Seewege – reale Hauptrouten der Linienschifffahrt */
const SEA_ROUTES = [
  // Nordsee / Ärmelkanal
  ["hamburg","rotterdam"],["hamburg","bhv"],["bhv","rotterdam"],
  ["rotterdam","antwerpen"],["antwerpen","lehavre"],["lehavre","felixstowe"],
  ["felixstowe","hamburg"],["rotterdam","felixstowe"],["rotterdam","lehavre"],
  // Ostsee
  ["hamburg","kiel"],["kiel","rostock"],["rostock","kopenhagen"],
  ["kopenhagen","goeteborg"],["goeteborg","oslo"],["goeteborg","stockholm"],
  ["stockholm","helsinki"],["helsinki","riga"],["riga","gdansk"],
  ["gdansk","rostock"],["kopenhagen","gdansk"],
  // Atlantik / Mittelmeer
  ["lehavre","lissabon"],["lissabon","algeciras"],["algeciras","valencia"],
  ["valencia","barcelona"],["barcelona","marseille"],["marseille","genua"],
  ["genua","neapel"],["neapel","piraeus"],["piraeus","istanbul"],
  ["istanbul","constanta"],["piraeus","suez"],["algeciras","piraeus"],
  ["rotterdam","lissabon"],
  // Transatlantik
  ["rotterdam","nyc"],["hamburg","nyc"],["algeciras","nyc"],["nyc","montreal"],
  ["nyc","savannah"],["savannah","miami"],["algeciras","santos"],
  ["lissabon","santos"],["felixstowe","montreal"],
  // Suez – Naher Osten – Südasien
  ["suez","jebelali"],["jebelali","mumbai"],["mumbai","colombo"],
  ["colombo","chennai"],["chennai","singapur"],["colombo","singapur"],
  ["suez","mombasa"],["mombasa","jebelali"],["mombasa","colombo"],
  // Südostasien / Ostasien
  ["singapur","portklang"],["portklang","colombo"],["singapur","shenzhen"],
  ["shenzhen","hongkong"],["hongkong","shanghai"],["shanghai","ningbo"],
  ["ningbo","busan"],["shanghai","busan"],["busan","tokio"],
  ["tokio","osaka"],["osaka","shanghai"],["singapur","jakarta"],
  ["jakarta","shenzhen"],
  // Transpazifik
  ["shanghai","lax"],["busan","lax"],["shanghai","vancouver"],
  ["tokio","lax"],["lax","vancouver"],["lax","panama"],["busan","vancouver"],
  // Amerika
  ["panama","nyc"],["panama","miami"],["miami","nyc"],["houston","miami"],
  ["houston","panama"],["houston","veracruz"],["veracruz","miami"],
  ["santos","buenos"],["panama","santos"],["panama","callao"],
  ["callao","santos"],["buenos","kapstadt"],
  // Afrika / Ozeanien
  ["casablanca","algeciras"],["casablanca","lagos"],["lagos","kapstadt"],
  ["kapstadt","durban"],["durban","mombasa"],["kapstadt","santos"],
  ["singapur","melbourne"],["melbourne","sydney"],["sydney","auckland"],
  ["auckland","lax"],["sydney","singapur"],["perth","singapur"],
  ["perth","melbourne"],["perth","durban"]
];

/* Binnenwasserstraßen – Havel, Elbe, Mittellandkanal, Rhein, Main-Donau, Rhône */
const INLAND_ROUTES = [
  ["b-westh","bbg"],["bbg","magdeburg"],["magdeburg","hamburg"],
  ["magdeburg","hannover"],["hannover","bremen"],["bremen","hamburg"],
  ["hannover","duisburg"],["duisburg","dortmund"],["duisburg","rotterdam"],
  ["duisburg","antwerpen"],["duisburg","koeln"],["koeln","mannheim"],
  ["mannheim","frankfurt"],["frankfurt","nuernberg"],["nuernberg","wien"],
  ["wien","budapest"],["budapest","constanta"],["b-westh","schwedt"],
  ["paris","lehavre"],["lyon","marseille"],["wuhan","shanghai"]
];

/* ------------------------------ Fahrzeuge -------------------------------
   cap    Nutzlast in kg
   speed  Reisegeschwindigkeit km/h (Tür zu Tür, inkl. Pausen)
   costKm Betriebskosten €/km (Energie, Maut, Personal, Wartung)
   daily  Fixkosten €/Tag im Eigentum (Personal, Versicherung, Stellplatz)
   price  Kaufpreis €   |   range  max. Einzeletappe km
   flags  Fähigkeiten: kuehl adr sperrig container schuett
   ----------------------------------------------------------------------- */
const VEHICLES = [
  /* ---- Fahrrad ---- */
  {id:"v-bullitt",  name:"Larry vs Harry Bullitt",             brand:"Lastenrad",        mode:"b", cap:100,       speed:19,  costKm:0.05, daily:4,     price:6200,      stage:1, range:60,    icon:"🚲", flags:[]},
  {id:"v-urbanarrow",name:"Urban Arrow Cargo L (Kühlbox)",     brand:"E-Lastenrad",      mode:"b", cap:125,       speed:22,  costKm:0.06, daily:6,     price:8900,      stage:1, range:80,    icon:"🚲", flags:["kuehl"]},
  {id:"v-chike",    name:"Chike E-Kart Anhängerzug",           brand:"E-Lastenrad",      mode:"b", cap:180,       speed:20,  costKm:0.07, daily:8,     price:11500,     stage:2, range:70,    icon:"🚲", flags:[]},

  /* ---- Straße: Zweirad ---- */
  {id:"v-simson",   name:"Simson S51 mit Kurierbox",           brand:"Moped",            mode:"r", cap:35,        speed:46,  costKm:0.07, daily:3,     price:2900,      stage:1, range:230,   icon:"🛵", flags:[]},
  {id:"v-liberty",  name:"Piaggio Liberty 50 mit Topcase",     brand:"Motorroller",      mode:"r", cap:45,        speed:40,  costKm:0.06, daily:3.5,   price:3400,      stage:1, range:200,   icon:"🛵", flags:[]},
  {id:"v-kumpan",   name:"Kumpan 54 Ride (E-Roller)",          brand:"E-Roller",         mode:"r", cap:40,        speed:40,  costKm:0.03, daily:4,     price:4600,      stage:1, range:70,    icon:"🛵", flags:[]},

  /* ---- Straße: leicht ---- */
  {id:"v-caddy",    name:"VW Caddy Cargo Maxi",                brand:"Kastenwagen",      mode:"r", cap:670,       speed:78,  costKm:0.29, daily:26,    price:29000,     stage:1, range:900,   icon:"🚐", flags:[]},
  {id:"v-sprinter", name:"Mercedes-Benz Sprinter 317 CDI",     brand:"Transporter",      mode:"r", cap:1400,      speed:84,  costKm:0.38, daily:38,    price:54000,     stage:1, range:1100,  icon:"🚐", flags:[]},
  {id:"v-esprinter",name:"Mercedes-Benz eSprinter",            brand:"E-Transporter",    mode:"r", cap:1000,      speed:80,  costKm:0.21, daily:34,    price:69000,     stage:2, range:400,   icon:"🚐", flags:[]},
  {id:"v-daily",    name:"Iveco Daily 7t Koffer",              brand:"Leicht-Lkw",       mode:"r", cap:4200,      speed:80,  costKm:0.55, daily:56,    price:78000,     stage:2, range:1200,  icon:"🚚", flags:[]},
  {id:"v-atego",    name:"Mercedes-Benz Atego 1223 Kühlkoffer",brand:"Verteiler-Lkw",    mode:"r", cap:6800,      speed:78,  costKm:0.68, daily:78,    price:112000,    stage:2, range:1000,  icon:"🚚", flags:["kuehl"]},

  /* ---- Straße: schwer ---- */
  {id:"v-scania",   name:"Scania R 450 Sattelzug",             brand:"Sattelzug",        mode:"r", cap:24000,     speed:74,  costKm:0.95, daily:135,   price:128000,    stage:2, range:2200,  icon:"🚛", flags:[]},
  {id:"v-actros",   name:"Mercedes-Benz Actros 1851",          brand:"Sattelzug",        mode:"r", cap:25000,     speed:76,  costKm:1.02, daily:145,   price:146000,    stage:3, range:2400,  icon:"🚛", flags:[]},
  {id:"v-volvofhe", name:"Volvo FH Electric Sattelzug",        brand:"E-Sattelzug",      mode:"r", cap:22000,     speed:72,  costKm:0.71, daily:150,   price:265000,    stage:3, range:330,   icon:"🚛", flags:[]},
  {id:"v-dafreefer",name:"DAF XG+ mit Schmitz Kühlauflieger",  brand:"Kühlsattelzug",    mode:"r", cap:22000,     speed:74,  costKm:1.28, daily:180,   price:172000,    stage:3, range:2200,  icon:"🚛", flags:["kuehl"]},
  {id:"v-manadr",   name:"MAN TGS 26.470 Tankzug (ADR)",       brand:"Gefahrgutzug",     mode:"r", cap:28000,     speed:72,  costKm:1.35, daily:195,   price:185000,    stage:3, range:2000,  icon:"🚛", flags:["adr"]},
  {id:"v-volvoheavy",name:"Volvo FH16 750 Schwerlastzug",      brand:"Schwertransport",  mode:"r", cap:64000,     speed:52,  costKm:2.35, daily:290,   price:245000,    stage:3, range:1800,  icon:"🚛", flags:["sperrig"]},
  {id:"v-goldhofer",name:"Goldhofer Modul-Tieflader 250 t",    brand:"Großraumtransport",mode:"r", cap:250000,    speed:28,  costKm:6.80, daily:820,   price:1150000,   stage:4, range:900,   icon:"🚛", flags:["sperrig"]},

  /* ---- Binnenschiff ---- */
  {id:"v-gms",      name:"Europaschiff GMS (85 m)",            brand:"Binnenschiff",     mode:"i", cap:1350000,   speed:13,  costKm:2.40, daily:430,   price:1350000,   stage:2, range:5000,  icon:"🛥️", flags:["container","schuett"]},
  {id:"v-tms",      name:"Tankmotorschiff (110 m)",            brand:"Tankschiff",       mode:"i", cap:2400000,   speed:12,  costKm:3.10, daily:590,   price:2200000,   stage:3, range:5000,  icon:"🛥️", flags:["adr","schuett"]},
  {id:"v-gross",    name:"Großmotorgüterschiff (135 m)",       brand:"Binnenschiff",     mode:"i", cap:3000000,   speed:12,  costKm:3.60, daily:650,   price:2600000,   stage:3, range:5000,  icon:"🛥️", flags:["container","schuett","sperrig"]},
  {id:"v-koppel",   name:"Koppelverband (185 m)",              brand:"Schubverband",     mode:"i", cap:5400000,   speed:11,  costKm:4.90, daily:840,   price:3900000,   stage:4, range:5000,  icon:"🛥️", flags:["container","schuett","sperrig"]},

  /* ---- Schiene ---- */
  {id:"v-br185",    name:"DB Cargo BR 185 Güterzug",           brand:"Güterzug",         mode:"l", cap:1400000,   speed:58,  costKm:8.20, daily:940,   price:2400000,   stage:3, range:6000,  icon:"🚂", flags:["container","schuett"]},
  {id:"v-ludmilla", name:"DB Cargo BR 232 „Ludmilla“",         brand:"Diesel-Güterzug",  mode:"l", cap:1100000,   speed:48,  costKm:9.40, daily:880,   price:1450000,   stage:3, range:4000,  icon:"🚂", flags:["schuett","sperrig"]},
  {id:"v-vectron",  name:"Siemens Vectron MS + 30 Taschenwagen",brand:"Kombiverkehr",    mode:"l", cap:1650000,   speed:72,  costKm:11.50,daily:1300,  price:4300000,   stage:4, range:9000,  icon:"🚆", flags:["container","kuehl","adr","sperrig"]},
  {id:"v-silkroad", name:"China-Europa-Blockzug (41 × 40 ft)", brand:"Neue Seidenstraße",mode:"l", cap:950000,    speed:55,  costKm:7.80, daily:1500,  price:5200000,   stage:5, range:14000, icon:"🚆", flags:["container","kuehl"]},

  /* ---- Seeschiff ---- */
  {id:"v-feeder",   name:"Feederschiff 1.000 TEU",             brand:"Containerschiff",  mode:"s", cap:13000000,  speed:30,  costKm:21,   daily:3300,  price:14000000,  stage:4, range:20000, icon:"🚢", flags:["container","kuehl"]},
  {id:"v-supramax", name:"Supramax-Bulker (58.000 dwt)",       brand:"Massengutfrachter",mode:"s", cap:58000000,  speed:26,  costKm:34,   daily:5600,  price:31000000,  stage:4, range:25000, icon:"🚢", flags:["schuett"]},
  {id:"v-panamax",  name:"Panamax 5.000 TEU",                  brand:"Containerschiff",  mode:"s", cap:62000000,  speed:32,  costKm:46,   daily:8400,  price:46000000,  stage:5, range:25000, icon:"🚢", flags:["container","kuehl","adr"]},
  {id:"v-roro",     name:"RoRo-Autotransporter (6.500 CEU)",   brand:"RoRo-Schiff",      mode:"s", cap:21000000,  speed:36,  costKm:52,   daily:7600,  price:58000000,  stage:5, range:22000, icon:"🚢", flags:["sperrig"]},
  {id:"v-triplee",  name:"Maersk Triple-E (18.000 TEU)",       brand:"ULCV",             mode:"s", cap:195000000, speed:34,  costKm:94,   daily:19500, price:158000000, stage:5, range:30000, icon:"🚢", flags:["container","kuehl","adr"]},
  {id:"v-capesize", name:"Capesize-Bulker (180.000 dwt)",      brand:"Massengutfrachter",mode:"s", cap:180000000, speed:25,  costKm:78,   daily:14000, price:74000000,  stage:6, range:30000, icon:"🚢", flags:["schuett"]},
  {id:"v-hmm",      name:"HMM Algeciras (24.000 TEU)",         brand:"ULCV",             mode:"s", cap:228000000, speed:36,  costKm:108,  daily:23500, price:212000000, stage:6, range:30000, icon:"🚢", flags:["container","kuehl","adr"]},

  /* ---- Luftfracht ---- */
  {id:"v-caravan",  name:"Cessna 208B Grand Caravan",          brand:"Frachtflugzeug",   mode:"a", cap:1400,      speed:320, costKm:3.20, daily:950,   price:2600000,   stage:4, range:1900,  icon:"🛩️", flags:[]},
  {id:"v-atr",      name:"ATR 72-600F",                        brand:"Frachtflugzeug",   mode:"a", cap:8200,      speed:460, costKm:6.40, daily:2300,  price:26000000,  stage:4, range:1500,  icon:"🛩️", flags:["kuehl"]},
  {id:"v-737",      name:"Boeing 737-800BCF",                  brand:"Frachtflugzeug",   mode:"a", cap:23900,     speed:780, costKm:14,   daily:6300,  price:36000000,  stage:4, range:3750,  icon:"✈️", flags:["kuehl"]},
  {id:"v-a330f",    name:"Airbus A330-200F",                   brand:"Frachtflugzeug",   mode:"a", cap:70000,     speed:840, costKm:24,   daily:12500, price:105000000, stage:5, range:7400,  icon:"✈️", flags:["kuehl","adr"]},
  {id:"v-777f",     name:"Boeing 777F",                        brand:"Langstreckenfrachter",mode:"a",cap:102000,  speed:880, costKm:31,   daily:16500, price:182000000, stage:5, range:9200,  icon:"✈️", flags:["kuehl","adr"]},
  {id:"v-7478f",    name:"Boeing 747-8F",                      brand:"Langstreckenfrachter",mode:"a",cap:137700,  speed:880, costKm:36,   daily:19000, price:196000000, stage:5, range:8130,  icon:"✈️", flags:["kuehl","sperrig"]},
  {id:"v-an124",    name:"Antonow An-124-100 Ruslan",          brand:"Schwerlastfrachter",mode:"a",cap:120000,    speed:780, costKm:54,   daily:24500, price:148000000, stage:6, range:5200,  icon:"✈️", flags:["sperrig"]}
];

/* ------------------------------- Etappen -------------------------------- */
const STAGES = [
  {n:1, name:"Berlin", modes:"br", reqLevel:1, cost:0,
   center:[52.5100,13.4050], zoom:11,
   info:"Kurierfahrten in der Hauptstadt: Lastenrad, Kastenwagen und enge Zeitfenster zwischen Mitte, Kreuzberg und Spandau."},
  {n:2, name:"Brandenburg & Mitteldeutschland", modes:"bri", reqLevel:3, cost:18000,
   center:[52.20,13.10], zoom:7,
   info:"Der Nahverkehrsraum öffnet sich: schwere Lkw, das GVZ Großbeeren, der Frachthub Leipzig/Halle und die ersten Binnenschiffe auf Havel und Elbe."},
  {n:3, name:"Deutschland", modes:"bril", reqLevel:8, cost:120000,
   center:[51.20,10.20], zoom:6,
   info:"Bundesweites Netz mit Hamburger Hafen, duisport, Rheinschiene und Ganzzügen der DB Cargo."},
  {n:4, name:"Europa", modes:"brilsa", reqLevel:13, cost:700000,
   center:[49.00,10.00], zoom:4,
   info:"Rotterdam, Antwerpen, Le Havre, Piräus: europäischer Seeverkehr, Kombiverkehr und die erste Luftfracht."},
  {n:5, name:"Eurasien & Transatlantik", modes:"brilsa", reqLevel:18, cost:3500000,
   center:[38.00,55.00], zoom:3,
   info:"Neue Seidenstraße per Blockzug, Suezkanal, Transpazifik und die großen Container-Carrier."},
  {n:6, name:"Die ganze Welt", modes:"brilsa", reqLevel:24, cost:20000000,
   center:[10.00,10.00], zoom:2,
   info:"Afrika, Südamerika und Ozeanien. Capesize-Bulker, 24.000-TEU-Riesen und Schwerlast per An-124 – das komplette Weltnetz ist frei."}
];

/* ----------------------------- Ladungsarten ------------------------------
   req   erforderliche Fahrzeugfähigkeit
   rate  Ertragsfaktor
   minStage  ab welcher Etappe diese Ladung ausgeschrieben wird           */
const CARGO = {
  pak:     {name:"Pakete",             icon:"📦",  req:[],           rate:1.20, minStage:1, minKg:5,      maxKg:1200},
  express: {name:"Expressfracht",      icon:"⚡",  req:[],           rate:1.85, minStage:1, minKg:8,      maxKg:40000},
  pal:     {name:"Palettenware",       icon:"🧱",  req:[],           rate:1.05, minStage:1, minKg:120,    maxKg:250000},
  kuehl:   {name:"Kühlware",           icon:"🧊",  req:["kuehl"],    rate:1.40, minStage:2, minKg:60,     maxKg:200000000},
  schuett: {name:"Schüttgut",          icon:"⛏️",  req:["schuett"],  rate:0.85, minStage:2, minKg:200000, maxKg:180000000},
  adr:     {name:"Gefahrgut (ADR)",    icon:"☣️",  req:["adr"],      rate:1.60, minStage:3, minKg:900,    maxKg:200000000},
  sperrig: {name:"Schwer- & Sperrgut", icon:"🏗️",  req:["sperrig"],  rate:1.75, minStage:3, minKg:8000,   maxKg:180000000},
  cont:    {name:"Container (FCL)",    icon:"📮",  req:["container"],rate:1.10, minStage:3, minKg:180000, maxKg:220000000},
  /* Nur für Mr. Snus' Privatkunden – taucht in normalen Ausschreibungen nie auf */
  snus:    {name:"Snus",               icon:"🥫",  req:[],           rate:1.00, minStage:99,minKg:1,      maxKg:50},
  /* Nur für Don Pablos Kundschaft */
  ware:    {name:"Ware",               icon:"❄️",  req:[],           rate:1.00, minStage:99,minKg:1,      maxKg:200000000}
};

/* Auftraggeber & Ladungsbeschreibungen – realistische Situationen */
const SHIPPERS = {
  pak:[
    ["Apotheke am Rosenthaler Platz","Nacht-Notdienst: Medikamente für die Partnerapotheke"],
    ["Zalando Fulfillment","Retourenbündel für das Rücknahmezentrum"],
    ["Charité Logistikzentrum","Laborproben mit Transportbegleitschein"],
    ["Buchhandlung Ocelot","Vorbestellte Neuerscheinungen für die Filiale"],
    ["Fahrradwerkstatt Kreuzberg","Ersatzteilkiste, Kundenrad steht auf der Hebebühne"],
    ["Notariat Friedrichstraße","Beurkundete Originale, Zustellung noch heute"],
    ["Fotolabor Prenzlauer Berg","Belichtete Großformate für eine Vernissage"]
  ],
  express:[
    ["Formel-1-Team","Getriebeteil für den Rennwagen, Qualifying morgen früh"],
    ["Transplantationszentrum","Medizinisches Eilgut mit Kurierbegleitung"],
    ["Halbleiterwerk","Ersatzmodul für die Belichtungsanlage, Fab steht still"],
    ["Modekonzern","Kollektions-Sample für die Schau am Abend"],
    ["Offshore-Windpark","Ersatzpumpe, Umspannplattform abgeschaltet"],
    ["Druckerei Tagespresse","Ersatzwalze, Nachtauflage wartet"],
    ["Automobilwerk Band 3","Sequenzteil, Bandstillstand kostet pro Minute"]
  ],
  pal:[
    ["Kaufland Zentrallager","Getränkepaletten für die Filialbelieferung"],
    ["Bosch Ersatzteillager","Werkzeugpaletten für den Fachhandel"],
    ["BayWa Baustoffe","Fliesen und Zementsäcke für eine Baustelle"],
    ["IKEA Distribution","Flachpackmöbel für das Abholstudio"],
    ["Dr. Oetker Werk","Trockenware für das Regionallager"],
    ["Würth Handel","Verbindungselemente für den Handwerkerhof"],
    ["Papierfabrik","Rollenpapier für die Weiterverarbeitung"]
  ],
  kuehl:[
    ["Molkerei Berchtesgadener Land","Frischmilch, Kühlkette lückenlos 2–6 °C"],
    ["Pharmawerk Marburg","Impfstoffcharge, temperaturgeführt und dokumentiert"],
    ["Nordsee Fischhandel","Frischfisch auf Eis, Ankunft vor Marktöffnung"],
    ["Blumengroßmarkt","Schnittblumen aus der Auktion, konstant 8 °C"],
    ["Danone Werk","Joghurtpaletten, durchgehend gekühlt"],
    ["Obstplantage Altes Land","Äpfel unter kontrollierter Atmosphäre"],
    ["Fleischwerk Nord","Frischfleisch, Temperaturschreiber mitführen"]
  ],
  adr:[
    ["Shell Tanklager","Dieselkraftstoff, ADR Klasse 3"],
    ["BASF Ludwigshafen","Industriechemikalien mit Gefahrgutbegleitpapier"],
    ["Linde Gas","Druckgasflaschen, ADR Klasse 2"],
    ["Varta Batteriewerk","Lithiumzellen, UN 3480, Sondervorschrift 188"],
    ["Bergbaubetrieb","Zündmittel, begleitete Fahrt vorgeschrieben"],
    ["Raffinerie Schwedt","Heizöl schwer, Tankfahrzeug mit Restentleerung"],
    ["Galvanikbetrieb","Säuren in Verpackungsgruppe II"]
  ],
  sperrig:[
    ["Enercon Windkraft","Rotorblatt-Segment mit Begleitfahrzeugen"],
    ["Siemens Energy","Maschinentransformator, Schwerlastgenehmigung liegt vor"],
    ["Liebherr Werk","Raupenkran-Ausleger, Überbreite"],
    ["Thyssenkrupp Stahl","Brammen, Punktlast beachten"],
    ["Meyer Werft","Schiffsmotorblock, Tieflader erforderlich"],
    ["Brückenbau Konsortium","Stahlfachwerkträger, 42 m Länge"],
    ["Tunnelbau Projekt","Segment einer Tunnelbohrmaschine"]
  ],
  cont:[
    ["Maersk Line","FCL-Container, Slot auf dem Abfahrer gebucht"],
    ["Hapag-Lloyd","Konsolidierte Exportcontainer für Übersee"],
    ["MSC Germany","Importcontainer aus Fernost, Zoll bereits avisiert"],
    ["CMA CGM","Transshipment über den Hub-Hafen"],
    ["Kühne + Nagel","Sammelcontainer mit Zollabfertigung"],
    ["Elektronikkonzern","Konsumgüter für das Weihnachtsgeschäft"],
    ["Möbelimporteur","Containerladung aus der Fertigung in Fernost"]
  ],
  schuett:[
    ["Salzgitter Stahl","Eisenerzpellets für den Hochofen"],
    ["RWE Kraftwerk","Biomasse-Pellets für die Mitverbrennung"],
    ["HeidelbergCement","Zementklinker lose"],
    ["Agravis Raiffeisen","Weizen aus der Ernte, Feuchte geprüft"],
    ["K+S Kali","Düngemittel lose geschüttet"],
    ["Aluminiumhütte","Bauxit für die Tonerdegewinnung"],
    ["Kieswerk Havelland","Bausand für die Betonmischanlage"]
  ]
};

const TIPS = [
  "Leerfahrten fressen die Marge. Such den nächsten Auftrag dort, wo dein Fahrzeug schon steht.",
  "Im Kombiverkehr bringt der Lkw die Ladung zum Terminal, der Zug fährt die Hauptstrecke.",
  "Ein Feederschiff sammelt Container für die großen Häfen – nicht jede Route braucht ein 24.000-TEU-Schiff.",
  "Ein zu großes Fahrzeug kostet pro Kilometer mehr, egal wie leicht die Ladung ist.",
  "Luftfracht ist unschlagbar schnell, aber nur bei Expressaufträgen wirklich lohnend.",
  "Binnenschiffe sind langsam, dafür pro Tonne kaum zu schlagen.",
  "Geleaste Fahrzeuge kosten kein Kapital, aber jeden Tag Geld – auch im Stillstand.",
  "Kühlware ohne Kühlaufbau lehnt der Verlader ab. Achte auf die Symbole am Fahrzeug.",
  "Die Umschlagzeit beim Moduswechsel ist real: Hafen und Terminal brauchen Stunden.",
  "Mit der Auto-Disposition übernimmst du die Strategie, das Spiel den Klickaufwand."
];

/* Gleiche Farben und Kennwerte für Karte, Routing und Preisbildung
   tariff    Frachtrate € je Tonnenkilometer (Basis der Erlösrechnung)
   handleFix Umschlagpauschale € je Teilstrecke
   handleTon Umschlag € je Tonne
   umschlag  Umschlagdauer in Minuten                                     */
const MODE_INFO = {
  b: {key:"b", name:"Fahrrad",      icon:"🚲", color:"#2fa85c", tariff:0.75,   handleFix:4,   handleTon:1,  umschlag:10},
  r: {key:"r", name:"Straße",       icon:"🚛", color:"#f0812b", tariff:0.058,  handleFix:30,  handleTon:3,  umschlag:40},
  l: {key:"l", name:"Schiene",      icon:"🚆", color:"#7c5cff", tariff:0.011,  handleFix:180, handleTon:4,  umschlag:170},
  i: {key:"i", name:"Binnenwasser", icon:"🛥️", color:"#1fa6c4", tariff:0.0027, handleFix:200, handleTon:3,  umschlag:230},
  s: {key:"s", name:"Seeweg",       icon:"🚢", color:"#1667c4", tariff:0.0024, handleFix:450, handleTon:5,  umschlag:540},
  a: {key:"a", name:"Luftfracht",   icon:"✈️", color:"#e0344f", tariff:0.45,   handleFix:320, handleTon:25, umschlag:200}
};

/* Grundgebühr je Auftrag (Disposition, Papiere, Avisierung) */
const BASE_FEE = 9;
/* Leasingfaktor: Tagesrate = Fixkosten + Kaufpreis × Faktor.
   0,00055 entspricht etwa fünf Jahren bis zum Kaufpreis und liegt damit
   nahe an realen Charter- und Leasingraten. */
const LEASE_RATE = 0.00055;
/* CO₂ in kg je Tonnenkilometer */
const CO2 = { b: 0, r: 0.075, l: 0.018, i: 0.031, s: 0.008, a: 0.50 };

/* ---------------------------- Kartennebel --------------------------------
   Sichtweite um jeden erschlossenen Standort in Kilometern. Sie wächst mit
   der Etappe und mit jedem Level – der Nebel lichtet sich beim Aufsteigen. */
const FOG = [
  { base: 16,   perLevel: 2   },
  { base: 85,   perLevel: 9   },
  { base: 210,  perLevel: 17  },
  { base: 480,  perLevel: 36  },
  { base: 1250, perLevel: 95  },
  { base: 2900, perLevel: 210 }
];
function fogRadiusKm(stage, lvl) {
  const f = FOG[Math.max(0, Math.min(FOG.length - 1, stage - 1))];
  return Math.round(f.base + f.perLevel * Math.max(0, lvl - 1));
}
