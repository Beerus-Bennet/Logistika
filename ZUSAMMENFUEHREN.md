# Zwei Stände zusammenführen (v46 + Fischerei vom Kollegen)

## Stand v70 – Liste „Logistika 2.1“ auf `main` (v69.10) aufgesetzt

v70 baut direkt auf dem aktuellen `main` (v69.10) auf – dein Stand bis v69.10 ist drin (Freigaben,
Fahrer-Modus, Produktion, Angeln, Namens-Blase). Einzelheiten
in `AENDERUNGEN.md` unter v70. **Darauf achten, wenn du in denselben Dateien arbeitest:**

| Thema | Wo |
|---|---|
| Hofgröße kommt aus `S.farm.hl` (1 … 10) über `farmHl()`/`farmHofB()`; `S.farm.stage` ist nur noch die Optik-Stufe 1 … 4 | `erbe.js`, `erbedata.js` (`FHOF_STAGES` mit zehn Einträgen) |
| Lager haben zehn Stufen – in `fishdata.js` nur die `cost`-Reihen von Kühl- und Köderkiste verlängert | `farmdata.js`, `erbedata.js`, `fishdata.js` |
| Minispiele (auch Angeln) stehen mittig, Rest abgedunkelt – CSS `#farmAngel.mg` | `style.css` |
| Karte: Fahrzeugposition rund um den Hof über `roadDispAt`, Linien über `legDisp`/`roadLine` – Fahrzeit unverändert | `farm.js` (Ende), `game.js` |
| Neues Spielstand-Feld `S.farm.hay` (Heuballen an der Scheune) | `erbe.js` |
| `startDrive` ersetzt eine laufende Fahrt desselben Fahrzeugs | `farmview.js` |
| `team.js` nur eine Zeile: `navKey` nimmt die Hofgröße aus `farmHl()` – Fahrerin unverändert wie in `main` | `team.js` |

Version: **v70**.

## Stand v59 – Fischerei-Folgeauftrag in `main` (Teil 1 = v58, Teil 2 = v59)

Gearbeitet wurde auf zwei Branches, die nacheinander aufeinander aufbauen:
`teil1-fehler-optik` (v58) → `teil2-mechaniken` (v59). Beide sind jetzt in `main`
zusammengeführt. **Alle Einzelheiten mit Funktionsnamen stehen in `AENDERUNGEN.md`
unter v58 und v59** – hier nur der Überblick.

**Teil 1 (v58) – Fehler und Optik:** Hofausbau-Anzeige, Tagesaufgabe „Ohne Leerfahrt“ entfernt,
Preis-Ereignisse wirken wirklich auf Preise, Daueraufträge ohne direkte Wiederholung,
Fischer/in angelt nach Spielerregeln (Köder, Fanggrund, Wartegründe), Steg-Reiter, Filet-Modelle, Ruderboot.

**Teil 2 (v59) – Mechaniken:**
- Köderkiste (eigenes Lager für Köder), Notizbuch zählt nur eigene Fänge
- Fischpreise nach Gewicht (kg × €/kg × 0,5), Sterne nur noch Aufschlag; Lager merkt kg je Sternstufe
- Berts alter Kombi am Ufer = Werkstatt (Würmer, Profi-Köder, Spezialköder), Dauerbestellung Würmer,
  Köder-Entwicklung (eigener Fang → Fisch an Bert → Spezialköder nur für diese Art; nicht für Weißfische)
- Obstbäume fällen (Gedrückthalten → 🪓 in der Verschieben-Leiste)
- Fischmarkt ist ein Verkaufsstand wie an der Straße, Fischbrötchen macht das Kühlhaus
- Daueraufträge: mehr Firmen, Preis je Lieferung schon im Angebot, kündbar erst nach 2 Lieferungen
- Reusenköder nicht mehr im Laden, Steg reicht bis aufs Ufer, 3D-Bilder für Spezialköder

**Darauf achten, wenn du in denselben Dateien arbeitest:**
| Thema | Wo |
|---|---|
| Fischlager hat neben `qs[1…5]` jetzt `qkg[1…5]` – Fisch immer über `farmAdd`/`farmTake`/`farmTakeQ` ändern, nie `qs` direkt | `farm.js` |
| Fischwert über `fishPrice`/`farmStackV`, nicht `FITEMS[fisch].v × n` | `erbe.js`, `farm.js` |
| Neue Spielstand-Felder: `angel.spec`, `angel.bert.keep`, `stats.staffCatch/staffSpecies`, `F.cap.koeder`, Stand-Partien `it.parts/it.v` | `erbe.js` (`angelInit`, `erbeInit`), `farm.js` (`farmMigrate`) |
| Rezepte können `ok()`, `why`, `hide()`, `costT` haben (Bert) | `farm.js` `farmQueue`, `farmview.js` `openMachine` |
| `FMACHINES.f_markt` gibt es nicht mehr; alte Stände werden in `erbeInit` umgestellt | `fishdata.js`, `erbe.js` |
| Bert-Bild nur aus `bert.png` (Ausschnitt per CSS `.fv-fig.img.bert`) | `fishview.js`, `style.css` |

Version: **v59** (`sw.js` und `?v=59` in `index.html`). Alte Spielstände werden beim Laden umgestellt.
Danach **v60 (Hotfix)**: Hof-Fenster prüfen das Erbe-Level (`flv()`), nicht das der Spedition – siehe `AENDERUNGEN.md`.

**v61 – Freigaben für Arbeiter:** „＋ Auftrag geben“ ist für Landwirt, Tierpfleger, Hofmeister, Holzfäller, Sägewerker,
Fischwirt, Fahrer und (ab v64, Köder) Fischer durch dauerhafte Freigaben ersetzt (`S.farm.wl`, `S.farm.fahrMode`, alles in `team.js`). Wer an
Arbeiter-Logik arbeitet: neue Automatik immer über `staffWlHas(role, id)` bzw. `staffFahrOk(o)` prüfen.
Einzelheiten: `AENDERUNGEN.md` v61.

## Stand v48 – erledigt

v48 = v46 (Feinschliff, Notizbuch-Stränge, Rezepte, Minispiele …) **plus**
v47 vom Kollegen (Lehmanns Ufer: Angelstufen, Kreis-Drill, Turnier mit Bert,
Reusen, Fische nach Sternen). Git hat fast alles von selbst zusammengefügt;
von Hand gelöst wurden nur drei Stellen:

| Datei | Lösung |
|---|---|
| `sw.js` | Version **v48** (über beiden Ständen, damit Handys neu laden) |
| `farm.js` | beide Umzüge alter Spielstände hintereinander: erst der Hecht-/Turnier-Tausch des Kollegen (Notizbuch-Version 5), dann die Stränge aus v46 (Version 6). Spielstände aus v46 bekommen ihr Hecht-Häkchen an die neue Stelle. |
| `farmview.js` | Verkaufsfenster: die Sterne-Zeilen für Fisch vom Kollegen, die kürzeren Texte aus v46 |

Beim nächsten Mal am einfachsten: jeder arbeitet auf einem eigenen Branch
und stellt einen Pull Request – dann zeigt GitHub Konflikte sofort an.

---

## So war es geplant

Version 46 baut auf **v45** auf. Die drei Fischerei-Dateien `fishdata.js`,
`fishview.js` und `fishmodels.js` sind in v46 **nicht verändert** – dort kann
der Kollege frei arbeiten.

## Was v46 geändert hat

| Bereich | Dateien |
|---|---|
| Hof, Welt, Notizbuch, Rezepte | `farm.js`, `farmdata.js`, `farmview.js`, `erbe.js`, `erbedata.js`, `worldview.js`, `woodmodels.js` |
| Minispiele (nicht das Angeln) | `minigames.js` |
| Aussehen | `style.css` |
| Meldungen, Doppeltipp-Schutz | `game.js` |
| Nur kürzere Texte | `intro.js`, `offices.js`, `extras.js`, `events.js`, `goals.js`, `vip.js`, `snus.js`, `pablo.js`, `auction.js`, `corp.js`, `livery.js`, `customs.js`, `lucky.js`, `loading.js` |
| Version / Doku | `sw.js`, `README.md` |

Gemeinsam genutzte Dateien, in denen auch die Fischerei steckt:
`minigames.js` (Angeln), `worldview.js` (See, Fischmarkt), `erbe.js`,
`erbedata.js` (Kapitel 9 und 10), `style.css`. Solange dort jeder nur
**seine** Abschnitte ändert, passt alles automatisch zusammen.

## Weg 1 – am einfachsten

Der Kollege schickt seinen kompletten Ordner als ZIP. Claude führt beide
Stände zusammen, testet und liefert ein fertiges Paket.

## Weg 2 – selbst mit Git

1. Der Stand des Kollegen liegt in einem Git-Ordner, der auf **v45** aufbaut.
2. Die Datei `logistika-v46.patch` in diesen Ordner legen und ausführen:

   ```bash
   git am -3 logistika-v46.patch
   ```

3. Meldet Git einen Konflikt, stehen in der betroffenen Datei Markierungen
   `<<<<<<<`, `=======`, `>>>>>>>`. Beide Teile behalten, Markierungen
   löschen, dann `git add <datei>` und `git am --continue`.
   Typisch ist das nur bei `sw.js` (Versionsnummer) und `README.md`.
4. In `sw.js` die Versionsnummer **eins höher** als beide Stände setzen,
   damit Handys die neuen Dateien laden.

## Tipps für den Kollegen

- Möglichst in den Fischerei-Dateien arbeiten.
- In gemeinsamen Dateien nur die Fischerei-Abschnitte ändern und nichts
  umformatieren (keine Einrückungen, keine verschobenen Blöcke) – sonst
  sieht Git Änderungen, wo keine sind.
