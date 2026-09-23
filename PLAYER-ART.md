# Eigene Porträts für die Spielfigur

Wie bei Lina Sturm kann die Spielfigur ein gezeichnetes Bild statt der
zusammengesetzten SVG-Figur benutzen.

## So geht es

Leg deine Bilder direkt ins Hauptverzeichnis des Projekts (neben `index.html`),
benannt nach diesen Plätzen:

    player-w1.png  player-w2.png  player-w3.png  player-w4.png
    player-m1.png  player-m2.png  player-m3.png  player-m4.png

`.webp` geht auch. Das Spiel sucht beim Start nach jeder Datei; gefundene
Bilder erscheinen in der Charaktererstellung als Auswahl neben „gezeichnet“.
Fehlt eine Datei, passiert nichts – der SVG-Baukasten bleibt.

## Was die Bilder mitbringen sollten

* **Freigestellt**, PNG oder WebP mit durchsichtigem Hintergrund
* **Quadratisch oder hochformatig**, Kopf oben – das Spiel schneidet für die
  runden Rahmen von oben zu (`object-position: top center`)
* **Mindestens 400 × 400 px**, damit es auf großen Bildschirmen scharf bleibt
* **Unter 400 KB** je Datei, sonst wird die App träge
* Nur Bilder, an denen du die Rechte hast

## Nach dem Austausch

In `sw.js` die `VERSION` hochzählen (z. B. `v14` → `v15`). Sonst holt der
Service Worker die alten Dateien aus dem Zwischenspeicher.
