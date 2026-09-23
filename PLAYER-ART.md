# Eigene Porträts für die Spielfigur

Wie bei Lina Sturm kann die Spielfigur ein gezeichnetes Bild statt der
zusammengesetzten SVG-Figur benutzen. Zehn Figuren sind bereits dabei
(`player-p1.png` bis `player-p10.png`) und stehen in der Charaktererstellung
unter „🧑 Fertige Figur“ zur Auswahl.

## Eigene hinzufügen oder ersetzen

Leg ein freigestelltes Bild direkt ins Hauptverzeichnis des Projekts (neben
`index.html`), benannt nach einem freien Platz, z. B. `player-p11.png`. Für
weitere Plätze über p10 hinaus in `avatar.js` bei `PLAYER_ART_SLOTS` einen
Eintrag ergänzen, etwa `{ id: "p11", label: "Name" }` – das Label erscheint
als Tooltip bei der Auswahl.

`.webp` geht auch. Das Spiel sucht beim Start nach jeder Datei; gefundene
Bilder erscheinen in der Charaktererstellung als Auswahl neben „gezeichnet“.
Fehlt eine Datei, passiert nichts – der SVG-Baukasten bleibt.

## Was die Bilder mitbringen sollten

* **Freigestellt**, PNG oder WebP mit durchsichtigem Hintergrund
* **Quadratisch oder hochformatig**, Kopf oben – das Spiel schneidet für die
  runden Rahmen von oben zu (`object-position: top center`). Ganzkörperbilder
  gehen genauso: nur der obere Teil ist in den kleinen runden Rahmen sichtbar.
* **Mindestens 400 px breit**, damit es auf großen Bildschirmen scharf bleibt
* **Unter 400 KB** je Datei, sonst wird die App träge
* Nur Bilder, an denen du die Rechte hast

## Nach dem Austausch

In `sw.js` die `VERSION` hochzählen (z. B. `v19` → `v20`) und die neuen
Dateinamen in der `SHELL`-Liste ergänzen. Sonst holt der Service Worker die
alten Dateien aus dem Zwischenspeicher.
