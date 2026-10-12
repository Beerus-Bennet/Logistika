# Zwei Stände zusammenführen (v46 + Fischerei vom Kollegen)

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
