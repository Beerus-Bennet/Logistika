# Autovergleich v477 – 3D-Modelle gegen die Modellfotos

Alle 127 Katalogautos wurden im 3D-Betrachter (`RACECARVIEW`, Dreiviertel-Ansicht, Lack = Foto-Lack) gerendert und neben ihr Foto aus `cars/photos/` gelegt.

## Behoben (alle Autos oder die genannte Gruppe)
- **Bugecken (alle Autos):** Die Eckenrundung der Haube (`endZ`, Faktor .20) lief über eine Stelle, an der die Fläche nach hinten umklappt (Ableitung < 0 ab Faktor .14). Das ließ an jedem vorderen Eck einen Spalt (weißer Zacken, Durchblick). Faktor jetzt .13, die Fläche bleibt monoton und geschlossen.
- **Haubenprofil (Sport-/Hyper-/Mittelmotor-Coupés, ohne SUV/Kombi/Limousine/Klassiker):** zwei flache Kotflügelkämme außen, flache Mulde in der Mitte (wie bei LaFerrari, Huracán, Roma).
- **LaFerrari:** schwarzes Dach (`blackroof`), kein hoher Heckflügel mehr (`lip` statt `active`).

## Beobachtet, noch nicht angepasst (Vorschläge)
- Bug: Fotos zeigen oft hohe, senkrechte Kühlergrills/Stoßfänger (Klassiker, DB5, Miura, LM002), die Modelle haben eine flache Keil-Nase.
- Scheinwerfer: Form und Größe typisch je Modell (Huracán Y-Leuchten, GT Doppelrund), Modelle zeigen nur wenige Grundformen.
- Räder: Fotos haben größere, markantere Felgen (Fünfspeichen, Zentralverschluss); Modelle einheitlich.
- Fensterflächen: Fotos haben je Modell eigene Fensterlinien/Dreiecksfenster; Modelle nutzen wenige Kabinenformen.
- Geländewagen/SUV (LM002, Urus, Cayenne): Fotos deutlich höher und kantiger.
