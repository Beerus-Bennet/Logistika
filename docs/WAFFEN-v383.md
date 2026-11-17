# Waffenschrank und Waffenshop (v383)

Stand der Recherche: November 2026. Ziel: reale Jagd- und Handfeuerwaffen für den Hochsitz, kaufbar, mit unterschiedlicher Wirkung.

## Annahme zum Auftrag
„Schießstand“ gibt es im Spiel nicht; umgesetzt ist der Waffenschrank im **Hochsitz-Fenster** (Hof → Hochsitz → „🔫 Waffenschrank“). Dort wird gekauft, im Stand mit „Waffe“ gewechselt.

## Was recherchiert wurde (und was nicht)
| Thema | Befund | Quelle |
|---|---|---|
| Jagdliche Mindestenergie | § 19 BJagdG: übriges Schalenwild nur mit Büchsenpatronen ab 6,5 mm und E100 ≥ 2000 J; Rehwild 1000 J. Eine Quelle meldet Streichungen – Rechtsstand nicht abschließend geprüft. | gesetze-im-internet.de/bjagdg/__19.html, kuechenfibel.de |
| Selbstlader | Jagd-Selbstlader in Deutschland: höchstens 2 Patronen im Magazin (+1 im Lauf) → im Spiel 3 Schuss. | all4shooters.com, landtreff.de |
| Repetierer | Zylinderverschluss am häufigsten; Geradezug fast so schnell wie Selbstlader; M18 mit 5-Schuss-Magazin (Mauser-Preisliste 2025). | all4shooters.com, mauser.com |
| Blaser R8 | Geradezugrepetierer, Boxmagazin; Händlerpreise ca. 3.100–8.150 €. | venari-jagdtechnik.de |
| .375 H&H / 9,3×62 | .375 H&H als Dickhäuter-Referenz (≈ 5–6 kJ); 9,3×62 gleichwertige Alternative (≈ 5 kJ); .300 Win Mag ≈ 4,7–5,2 kJ. Durchschlagsmesswerte wurden **nicht** gefunden. | all4shooters.com, americanhunter.org |
| Flinte/Fasan | Schrot Nr. 5–7 für Fasan; 12/70 Normalpatrone 740 bar, verstärkt 1050 bar. Streukreis-Werte nicht gefunden. | hubertus-fieldsports.de, Beschussamt Ulm |
| Glock 17 | 17 Patronen Standard, Länge 202 mm, Lauf 114 mm, Gewicht 708 g (Gen5, ohne Magazin). Mündungsenergie nicht auf der Herstellerseite – ≈ 0,5 kJ aus 8 g / 360 m/s selbst gerechnet. | us.glock.com |

**Nicht aus Quellen, sondern geschätzt:** Geschossgewichte/Geschwindigkeiten der übrigen Patronen (übliche Fabrikwerte), Geschwindigkeitsverlust je Entfernung (`lam`), Eindringtiefen (`pen`), Streukegel der Flinte (`cone`), Spielpreise (an Händlerangebote angelehnt), Magazin-/Feuerfolgezeiten.

## Katalog (10 Waffen)
Mauser M18 .308 (Start, gratis) · Blaser R8 Professional .30-06 (Geradezug, schnell) · Merkel SR 1 .308 (Selbstlader, 3 Schuss) · Merkel 140-2 9,3×74 R (Doppelbüchse, Durchschuss) · CZ 550 Magnum .375 H&H (Großwild, Durchschuss) · Blaser R8 Ultimate .300 Win Mag (weit) · Browning B525 12/70 (Flinte, Fasan) · Glock 17 Gen5 (Pistole, Fasan) · Ruger Super Redhawk .454 Casull (Revolver, nah) · **H&H Royal Deluxe „Goldjagd“** (nur Lucky-Rad).

## Spielregeln
- **Energie:** E = ½·m·v², Geschwindigkeit nimmt mit der Entfernung ab. Tödlich an Schalenwild nur ab 1800 J (Hirsch) bzw. 1500 J (Keiler) am Ziel, sonst „zu schwach“ – das Stück flüchtet verletzt.
- **Schrot:** 24 Körner im Streukegel; nur Fasan (mindestens 2 Treffer), nie Schalenwild.
- **Reichweite:** `maxR` je Waffe. Pistole, Flinte und Revolver (`nearD`) bekommen das Wild nah (46–80 m statt 150–240 m).
- **Magazin und Feuerfolge:** Munitionsanzeige am Schussknopf, Pause `cyc` zwischen den Schüssen, Nachladen `rel`. Kein Munitionskauf.
- **Nachschüsse:** Jeder weitere Treffer am lebenden Stück kostet eine Medaille (min. Bronze) – außer mit der Sonderwaffe.
- **Eindringtiefe:** Organe hinter dem Geschossstopp werden nicht getroffen (Herz-/Lungenschuss ohne Kontakt = Weichschuss); Keiler (Schild) verkürzt die Tiefe um 1/1,6. Schwere Kaliber (`thru`) haben immer einen Ausschuss (Ausschussloch in der Bergung), die Pistole nie.
- **Sonderwaffe:** Goldjagd nur aus dem Lucky-Rad: Durchschuss, kein Nachschuss-Abzug, +0,08 Güte bei der Bewertung. Wer sie schon hat, bekommt den Jackpot. Der Legendär-Anteil des Rads wurde verdoppelt (zwei legendäre Preise), damit der Goldene Bulli seine bisherige Chance behält.

## Spielstand
`S.farm.guns = { own: {id: 1}, sel }`, lazy angelegt; die M18 gehört jedem. Keine Migration nötig.

## Hinweis
Die Glock 17 darf in Deutschland nicht zur Jagd genutzt werden (Fangschuss ausgenommen) – im Spiel steht das auf der Karte.
