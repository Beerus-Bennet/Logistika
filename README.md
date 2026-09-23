# Artwork der Disponentin

`lina.png` ist die Figur, die im Willkommensbildschirm und in allen
Tutorial-Sprechblasen erscheint. Fehlt die Datei, zeichnet das Spiel die Figur
selbst als SVG – die Oberfläche stellt sich automatisch darauf ein.

**Eigene Version einsetzen**

Einfach `lina.png` austauschen. Sinnvoll sind:

* PNG oder WebP mit transparentem Hintergrund, freigestellt
* Hochformat, etwa 1:2,5 bis 1:3 (die aktuelle Datei ist 289 × 820 px)
* Figur steht auf der unteren Bildkante, ohne Sockel oder Schatten darunter
* Blickrichtung nach rechts, damit sie die Sprechblase ansieht
* unter 400 KB, sonst leidet der erste Seitenaufruf

**Weitere Figuren**

Der Ladepfad steckt in `js/intro.js` unter `GUIDE_ART`. Willst du für spätere
Etappen weitere Rollen einbauen – Fahrer, Hafenmeister, Zollbeamtin – sag
Bescheid, dann wird daraus eine Liste statt eines einzelnen Pfads.

Bitte nur Bilder verwenden, an denen du die Rechte hast.
