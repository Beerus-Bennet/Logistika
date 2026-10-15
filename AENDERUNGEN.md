# Änderungen – kurz für den Kollegen

## v65 – Maschinen-Kräfte verteilen die Arbeit

- **Über alle Maschinen das Dringendste** (`team.js` `staffMachJob`, `staffRecipeScore`): Vorher nahm die Kraft immer die erste
  Maschine mit einem machbaren Rezept – die Fischerhütte fraß alle Forellen, bevor die Räucherei drankam; die Gattersäge
  machte nur Bretter. Jetzt zählt, was im Verhältnis zum Bedarf am wenigsten da ist; volle Warteschlangen zählen weniger.
- **Lagerplatz netto** (`staffRoomFor`): Zutaten aus demselben Lager machen beim Start Platz (Bretter → Paletten).
- **15 % Luft** (`staffPickRecipe`): Über den Grundstock hinaus wird nur produziert, solange 15 % des Lagers frei bleiben –
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
