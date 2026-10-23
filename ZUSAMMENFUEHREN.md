# Zwei Stände zusammenführen (v46 + Fischerei vom Kollegen)

## Stand v122 – alle Warenbildchen + Werkzeuge, Einsammeln (auf v121; ein ZIP mit allem seit v120)

| Teil | Datei |
|---|---|
| `skinV`, `sLathe`, `sEll`, `rrect`, `ringXZ`, `slatCrate`, `paperBag`, `feedSack`, `tray`, `bucket`, Obst/Gemüse, `sock`, `goodsItem` (36 Hof- und 3 Fischwaren), `toolNew` (6 Werkzeuge), Jutesack-Etikett | `woodmodels.js` |
| `ITEM_VIEW` erweitert, Ausbeute-Leiste mit 3D-Bildchen | `worldview.js` |
| Perle fliegt als Ware | `farmview.js` |
| `.lootbanner .lb-it` | `style.css` |
| 2 neue Tests | `tests/icons.test.js` |
| Version 122 | `index.html`, `sw.js` |

## Stand v121 – Icon-Regelwerk + Holzwaren neu (auf v120)

| Teil | Datei |
|---|---|
| Holz-Bausatz (`lumber`, `logPiece`, `splitPiece`, `extrude`, `lathe`, `rope`, `band`, `jutesack`), `woodItem` für alle 22 Holzartikel, `FWM._wk` | `woodmodels.js` |
| `THUMB_N/THUMB_NB`, Licht `thumbSun` + Icon-Umgebung, Kontur + Kontaktschatten in `thumbCrop`, `thumbURL` (WebP), `ITEM_VIEW` | `worldview.js` |
| Trophäenbilder ohne Bodenschatten (`TVIEW.noShadow`) | `hunt.js` |
| neue Tests | `tests/icons.test.js` |
| Version 121 | `index.html`, `sw.js` |

## Stand v120 – Hirsch/Keiler neu, Trophäen je Stück, Trophäenwand (auf v119)

| Teil | Datei |
|---|---|
| `skin/ring/ell/tube/curve/prof`, Hirsch-, Geweih-, Keilermodelle, Trophäen-Datensätze (`collSync`, `sellRec`), `trophyBuild`, Trophäenwand + Drehansicht, Haltung/Leerlauf | `hunt.js` |
| `thumbR(big)`, `thumbOf(key, fn, o)`, `thumbCrop(…, N)`, `THUMB.opts`, `itemView` | `worldview.js` |
| `openFarmStore`: Reiter „Trophäen“ zeigt die Wand | `farmview.js` |
| `.tw-*`, `#huntUI .hu-tro` | `style.css` |
| 5 neue Tests | `tests/hunt.test.js` |
| Version 120 | `index.html`, `sw.js` |

## Stand v119 – Atem+Schuss, Wasser, Trophäen (auf v118)

| Teil | Datei |
|---|---|
| Atem-Finger-ID, Schuss per `pointerdown`, Listener-Aufräumen in `end()`; `trophyMesh` neu | `hunt.js` |
| Wasser-Shader: wandernde Wellenbänder + Lichtfunken | `gl3d.js` |
| Test „Trophäen (v119)“ | `tests/hunt.test.js` |
| Version 119 | `index.html`, `sw.js` |

## Stand v118 – Wildwiesen-Farbe (auf v117)

| Teil | Datei |
|---|---|
| `HUNT.ground`: sanfter Wiesenton statt harter Dreifarb-Umschaltung | `hunt.js` |
| Version 118 | `index.html`, `sw.js` |

## Stand v117 – Fernglas-Bäume neu (auf v116)

| Teil | Datei |
|---|---|
| `treeRv` neu (5 Arten, Blatt-/Nadelkronen, Röhrenstämme), `icoUnit` | `woodmodels.js` |
| `revLod`, `revBuildStep`, `TREE_HI` 40, Export `_rv` | `hunt.js` |
| Test Nahsicht-Bäume (v117) | `tests/hunt.test.js` |
| Version 117 | `index.html`, `sw.js` |

## Stand v116 – Stumpf-Maßstab beim Antippen (auf v115)

| Teil | Datei |
|---|---|
| Wippschleife: Grundmaßstab `t.cut.sc` bei Sägeschnitt-Stumpf | `worldview.js` |
| Version 116 | `index.html`, `sw.js` |

## Stand v115 – Gefängnis-Feinschliff (auf v114)

| Teil | Datei |
|---|---|
| Sitzpose, Glatze, Licht, God Rays, Tasse/Buch, Kalender-UI | `jail.js`, `style.css` |
| Zeitbudget, Zwischenspeichern, `jl-open`, `jailRefresh` | `snus.js` |
| Pause von Farmszene/Karte während der Zelle | `farmview.js`, `game.js` |
| Test (`SIT_Y`, `SEAT.ry`) | `tests/jail.test.js` |
| Version 115 | `index.html`, `sw.js` |

## Stand v114 – Haft: 3D-Zelle als Wartebild (auf v113)

| Teil | Datei |
|---|---|
| Neu: Zelle, Figur, Tiere, Fortschritt (`JAIL3D`) | `jail.js` |
| `jailServe`/`jailScene`, `JAIL_MS`, `reportHide` | `snus.js` |
| `person()`: `noLegs`, `noArms` | `woodmodels.js` |
| `.jl3`, `.jl-*` | `style.css` |
| Test | `tests/jail.test.js` |
| Skript `jail.js` nach `team.js`, Version 114 | `index.html`, `sw.js` |

## Stand v113 – Fernglas: feines Nahsicht-Baummodell (auf v112)

| Teil | Datei |
|---|---|
| `treeRv` (Kiefer, Fichte, Buche, Eiche) | `woodmodels.js` |
| Nahe Bäume nutzen `treeRv` (`TREE_HI`) | `hunt.js` |
| Test Nahsicht-Bäume | `tests/hunt.test.js` |
| Version 113 | `index.html`, `sw.js` |

## Stand v112 – Lager: Outfits/Frisuren, gebeugte Arme, Werkzeugplane, Sessel entfernt (auf v111)

| Teil | Datei |
|---|---|
| Plane, Ablagebahnen, Wege mit Stopps, Sessel entfernt | `camp.js` |
| Frisuren, Kleidung, gebeugter Sitzarm (`armSit`) | `woodmodels.js` |
| `STAFF_LOOK`, Stopps/Verweilen, Bodenwerkzeug, Hinsetzen/Aufstehen, Mittagsende | `team.js` |
| Test Werkzeugplane | `tests/camp.test.js` |
| Version 112 | `index.html`, `sw.js` |

## Stand v111 – Wild auf der Wildwiese (Karte ↔ Revier), Fernglas: Tiefenpuffer und Baumgeometrie (auf v110)

| Teil | Datei |
|---|---|
| Wiesenwild `mwSpawn/mwStep/mwToRevier/mwFromRevier`, `toRv/fromRv`, `spawn(k, enter, pre)`, nahe Ebene je Ansicht | `hunt.js` |
| Kiefernmanschette, Birkenflecken | `woodmodels.js` |
| Test Wiese ↔ Revier | `tests/hunt.test.js` |
| Version 111 | `index.html`, `sw.js` |

## Stand v110 – Luckybox: Gewinnchancen oben als Balken + Kacheln (auf v109)

| Teil | Datei |
|---|---|
| Chancen-Anzeige oben statt Textzeile unten | `lucky.js`, `style.css` |
| Version 110 | `index.html`, `sw.js` |

## Stand v109 – Wegsuche: Wege bevorzugt, Brücken nur über die Planken, Bäume und Büsche als Hindernis (auf v108)

| Teil | Datei |
|---|---|
| Kosten je Gelände, Brückenplanken, Kulissenbäume/Büsche/Totholz/Hochsitz gesperrt, `navKey` erweitert | `team.js` |
| Version 109 | `index.html`, `sw.js` |

## Stand v108 – Jagd: Bau, weites Revier, strengere Jagd, Hirsch-Animation, Kino-Einsammeln (auf v107)

| Teil | Datei |
|---|---|
| Freischaltung nach fertigem Sägewerk, Förster-Anruf, Bauplatz und Bau, Revier nur in der Ich-Perspektive, Wind und Flugzeit, strenge Zonen, Hirsch mit Gelenken und Federn, Kino-Einsammeln | `hunt.js` |
| Kamera darf nahe/ferne Ebene setzen (`cam.near`, `cam.far`) | `gl3d.js` |
| Lager-Reiter „Trophäen“ erst mit gebautem Hochsitz | `erbe.js` |
| Überblendung, Wind, Medaillen-Aufblendung, Leisten, Bauplatz | `style.css` |
| Tests | `tests/hunt.test.js` |
| Version 108 | `index.html`, `sw.js` |

## Stand v107 – Jagd: Hochsitz, Wild, Trophäen (auf v106)

| Teil | Datei |
|---|---|
| Neue Datei: Wildwiese, Hochsitz, Hirsch/Keiler/Fasan, Ich-Perspektive, Fernglas, Zielfernrohr, Trefferzonen, Nachsuche, Trophäen-Karte, Trophäen im Lager, Markt-Karte | `hunt.js` |
| Wiese frei von Kulissenbäumen und Büschen, Bodenfarbe, Hochsitz einbauen (`attach`/`step`), Antippen, Blase, keine fremden Kamerafahrten in der Ich-Perspektive | `worldview.js` |
| Nebel weiter weg in der Ich-Perspektive, Lager-Text für Trophäen, `farmFocus` gesperrt bei `FV.fp` | `farmview.js` |
| Lager-Reiter „Trophäen“, keine fällbaren Bäume auf der Wiese (`huntTree`, `F.v107h`) | `erbe.js` |
| Sammler zahlen den vollen Wert, Trophäen ohne Sterne | `farm.js` |
| Karte „Trophäen-Sammler“ im Markt | `game.js` |
| Telefonat-Arm angewinkelt | `team.js` |
| Aussehen der Jagd | `style.css` |
| Tests | `tests/hunt.test.js` (neu) |
| Skript einbinden, Version 107 | `index.html`, `sw.js` |

## Stand v101 – Aussicht in der Ich-Perspektive (auf v100)

| Teil | Datei |
|---|---|
| Neue Datei: Himmel, Sonne, Berge, See, Wolken nach Uhrzeit (`VISTA.draw`, `VISTA.env`) | `vista.js` |
| Aufruf nach `R.render` und am Ende von `farmEnv` | `farmview.js` |
| Skript einbinden, Version 101 | `index.html`, `sw.js` |

## Stand v95 – Lagerfeuer: Sitzende mit Beinen, Gespräch, Wege ums Feuer (auf v94)

| Teil | Datei |
|---|---|
| Sitzfigur: längere Unterschenkel, `noHead`, `headParts`, neues `FWM.head`, Axt am Körper nicht beim Sitzen | `woodmodels.js` |
| Sitzplätze (Becken vorn, `R`/`ang` je Platz), Arme auf den Knien, Wege `gate`/`routeIn`/`routeOut`/`slotAt`/`blockedW`, Gesprächs-Regie `talkStep`/`talkOf`/`talkReset` | `camp.js` |
| Lagerplatz in der Wegsuche gesperrt (`navBuild`), Routen über Tor und Ring (`staffGo`), Kopf-Knoten und Regie-Anwendung (`worldSyncStaff`, `stepStaff`), 2 min mehr Vorlauf zum Mittag | `team.js` |
| Tests | `tests/camp.test.js` (neu) |
| Version 95 | `index.html`, `sw.js` |

## Stand v93 – Fällen mit der Axt in der Ich-Perspektive (auf v92)

| Teil | Datei |
|---|---|
| Axtmodell `axeMesh`, Kamera-Knoten (`X.rig`), Schlagablauf `axeTool`/`axeHit`, Treffpunkt `axeTarget`/`kerbW`, Splitter `axeChips`/`stepChips`, `ev("swing")`, `begin(t, "axe1"|"axe2", { kp })`, `pickView(…, op)`, `ready`, Testhilfen `_freeze`/`_axeMath` | `fpsaw.js` |
| Axtspiel: 3D starten, Tippen überall, Ton/Späne beim Einschlag, Fallrichtung aus 3D, `stop()` | `minigames.js` |
| Kein Draufsicht-Zoom, wenn die Ego-Sicht geht | `worldview.js` (`worldFell`) |
| Karte unten links, Hinweis oben (`#farmAngel.mg3d.mga`) | `style.css` |
| Tests | `tests/axe.test.js` (neu) |
| Version 93 | `index.html`, `sw.js`, `test.html` |

## Stand v92 – Waldsanierung: Boden, Baumabstände, Blumen, Pflanzenwind (auf v91)

| Teil | Datei |
|---|---|
| Pflanzenwind (`uPlant`, `uWind`, Knoten-Eigenschaft `plant`, `env.wind`) | `gl3d.js` |
| `FTREE_DIM`, `treeBody`, `treeClash`, `treeNudge`, `erbeSpaceTrees`, Umzug `F.v92s` | `erbe.js` |
| `worldGround` (Waldboden in den Eckfarben), `worldTreeSpace`, `bgWayOk`, Blätter ohne Überlappung, Blumen/Farn in Wind-Kacheln, `VEGQ`/`vegStep`/`WIND_WX`; `WBuf.blob` entfernt | `worldview.js` |
| Blumen (8 Varianten), Farn, Steine; Moospolster entfernt | `forestmodels.js` |
| Moospolster raus, Erd-/Lichtbodenflecken | `forest.js` |
| Tests | `tests/trees.test.js` (neu), `tests/forest.test.js` |
| Version 92 | `index.html`, `sw.js` |

## Stand v91 – Lebendiger Wald: Waldboden, Orte, Entdeckungen, kleines Leben (auf v90)

| Teil | Datei |
|---|---|
| Ökologie, Bodenflecken, Dinge, besondere Orte, Entdeckungen, Kompositionen (rein, Node-testbar) | `forest.js` (neu) |
| Modelle: Steine, Moospolster, Wurzeln, Zweige, Rinde, Moosstamm, Pilzgruppen, Blumen, Farn (leicht), Beeren, Nest, Fundstücke, Pfoten, Falter, Lichtschacht | `forestmodels.js` (neu) |
| `WBuf.blob`/`leafBit`/`add(y0)`, `wFreeGround`, `wWet`, `worldForest`/`worldForestBuild`, Plan und Entnahme der Bäume, Buschhooks (`hidden`), `worldMakeLife`/`stepLife`, Tippen auf Igel | `worldview.js` |
| Skript-Tags und Precache (`forestmodels.js`, `forest.js`), Version 91 | `index.html`, `sw.js` |
| Tests | `tests/forest.test.js` (neu) |

## Stand v90 – Waldbäume in Endform per Instancing, Ladescreen (auf v89)

| Teil | Datei |
|---|---|
| Instanz-Shader (`instVS`), `R.instGroup`/`instClear`, Instanz-Durchgänge in Schatten und Haupt, `setScene`, Zähler `inst`/`sInst` | `gl3d.js` |
| `bgFinal`, `bgChunkBuild` (Instanzen), `bgPromote` (gleiche Werte, `v`), `treeMeshOf` (`t.v`), Gruppen in `worldStatic`, Böen für Gruppen; `WV.bgm` entfällt | `worldview.js` |
| `farmBoot`/`farmShowGo` (Ladescreen) | `farmview.js` |
| `#farmBoot` | `style.css` |

## Stand v89 – Natürlicher Wald, Büsche ohne 7:1 (auf v88)

| Teil | Datei |
|---|---|
| `BUSH.generate` eignungsgesteuert (Bewuchsfeld, Einzelbüsche/Gruppen, offene Lichtungen), `suitability`, `zoneOf`; `targetCount`/`TREES_PER_BUSH` entfernt | `bushes.js` |
| `worldBushes` (`feat` mit `rho`/`edge`, neuer Aufruf), `treeDens` (Baumdichte in Flecken, Streuung volle Zelle) | `worldview.js` |
| neue Tests | `tests/bushes.test.js` |

## Stand v88 – Performance, Gras-Wind (auf v87)

| Teil | Datei |
|---|---|
| `uSwayT`/`swayT`, `R.stats` (Zähler) | `gl3d.js` |
| `VEGQ`, `vegMode`, `vegInfo`, `vegStep`, Gras-Chunk-Knoten, Büsche im Bodenpuffer | `worldview.js` |
| `FV.busy`, Pause bei verstecktem Tab | `farmview.js` |

## Stand v87 – Vegetation nach Zonen, Gras an Birken (auf v86)

| Teil | Datei |
|---|---|
| `BUSH.generate` zonenbasiert (Gruppen, Einzelbüsche, Lichtungen), `BUSH.grass`, `BUSH.KIND` | `bushes.js` |
| `FWM.grassTuft` | `woodmodels.js` |
| `worldBushes` (Lichtungen, Merkmale, Gras), Einbau, `WV.grass` | `worldview.js` |

## Stand v86 – Buschsystem (auf v85)

| Teil | Datei |
|---|---|
| neues Modul `BUSH` (Typtabelle, Generator, 7 : 1) | `bushes.js` (neu, in `index.html`/`sw.js` vor `woodmodels.js`), Tests `tests/bushes.test.js` |
| sieben Buschmodelle `FWM.bush(typ, variante)` | `woodmodels.js` |
| `worldBushes`, Einbau in `worldStatic`, `WBuf.add(…, sy, k)`, alter Einzelbusch entfällt | `worldview.js` |

## Stand v85 – Sägen als 3D-Ego-Minispiel (auf v84)

| Teil | Datei |
|---|---|
| neues Modul `SAW3D` | `fpsaw.js` (neu, in `index.html` nach `minigames.js`) |
| Saw-Minispiel anbinden (`st.fp`, `SAW3D.ev`) | `minigames.js` |
| `worldFell`, `stepFalling` (Holzstapel), `worldBusy` | `worldview.js` |
| `clampCam` bei `FV.fp` | `farmview.js` |
| `.mg3d`-Styles | `style.css` |

## Stand v81 – Lagerfeuerplatz und Mittagspause (auf v80)

| Änderung | Datei |
|---|---|
| Neues Modul `CAMP` (Szene, 9 Plätze, Belegung, `clear`, `attach`, `step`) | `camp.js` (neu; `index.html`, `sw.js`) |
| `person({ sit })` Sitzfigur | `woodmodels.js` |
| `staffLunch`, Job `lunch`, Sitzen/Aufstehen in `stepStaff`, Blase `.lunchb`, `CAMP.tidy` | `team.js`, `style.css` |
| Lichtung am Wegende 1 entfällt (`campEnd`), `CAMP.attach/step`, `bgTreeOk` | `worldview.js` |
| `campTree`, Umzug `v81t` | `erbe.js` |

## Stand v77 – Autofotos, Kartengrenzen, Z-Fighting, Wegübergänge (auf v76)

| Thema | Wo |
|---|---|
| Eigene Fotos `cars/credits.json` + `cars/<id>.jpg` (`loadLocalPics`), kein Sperren nach Fehlschlag, Wiederholung | `auction.js` (Abschnitt „Fotos“) |
| Gezeichnete Autos `CAR_ART`, `carArt`, `carArtShape`, `hexMix` (statt `BODY_PATH`/`carSilhouette`) | `auction.js` |
| Foto-Import `carpics.mjs`, Aktion `.github/workflows/carpics.yml` (Vorlage `carpics-workflow.yml`) | Hauptverzeichnis |
| `/cars/*.jpg` im Foto-Cache | `sw.js` |
| `#controls2` (☁️/📡) entfernt, `fog = true` beim Laden, `mapBoundsUpdate` | `index.html`, `style.css`, `game.js` |
| `setBounds`, `clampBounds`, `boundsMinZoom` | `map.js` |
| Z-Fighting behoben: `pier`, `lootCrate`, `lootLid`, `goldLid`, `solarVan`; `cowShed`, `cart`, `pigHut`, `barn`, `cow`; `bertCar`, `beach` | `woodmodels.js`, `farmmodels.js`, `fishmodels.js` |
| Prüfwerkzeug `zcheck()`, `zrender(mb)`, `zcheckMB(mb)` | `zcheck.js` (nicht in `index.html`) |
| Bogenrand über dem Wegrand (`yE2`, `tee.ey`), `wayFade` + `o.fade`, `YARD_COL` | `woodmodels.js`, `worldview.js` |
| `nearPathPt`, `FTREE_CR`, `treeCrown`, `treeWayNeed`, `treeOffPath`, Umzug `v77t` | `erbe.js` |
| `wayGap`, `wayCamSide`, `BG_CR` (Kulissenbäume, Büsche, Totholz) | `worldview.js` |

## Stand v76 – Tutorial kurz, Lina-Tipps, „jetzt machbar“ (auf v75)

| Thema | Wo |
|---|---|
| `orderDoable(o, p)` für Filter und Sortierung | `game.js` |
| `TUT_STEPS` (5 Schritte), `tutCount`, Überspringen, Zentrieren, `tutScrollBind`/`tutFollow` | `intro.js` |
| `LINA_TALKS` gekürzt (snus, extras, pablo, bases, base1), Auktion | `intro.js`, `auction.js` |
| `linaHint(key, text, {top})` + Aufrufe | `intro.js`; `game.js` (Zustellung, `acquire`), `offices.js` (`phoneMsg`), `farmview.js` (`farmHintFor`) |
| `FTUT_HOF` 9 Schritte, Umrechnung `T.v76` | `farmview.js` |
| `.tut-n`, `.tut-skipl`, `#linaHint`, `#spot.drag`, Platz unter der Liste | `style.css` |

## Stand v75 – Wegenetz, Bachenden, Angelsteg (auf v74)

| Thema | Wo |
|---|---|
| Wegbau neu: `ribbon` (weicher Rand `softEdge`), `fillet`, `snapEnd`, `wayMouth`, `wayTee`, `wayRaw`, `wayStraightAt`, `smoothLine(…, true)` zentripetal | `woodmodels.js` (Abschnitt „v75: Wegenetz“) |
| `forestPath`-Optionen neu: `gnd`, `roadCol`, `tee`, `snap`, `prepared`, `mouthR`, `teeR` | `woodmodels.js` |
| Wege am See: `LAKE_STEM`, `LAKE_WAY`, `LAKE_EAST` (alte Namen `LAKE_WAY1/2` bleiben als Alias) | `worldview.js`, `team.js` |
| Bach: `FWORLD.creek` länger, `FWORLD.spring`; `creekBank/creekWater(pts, o)` mit `taper`; Quelle; `worldWaterCheck` | `erbe.js`, `woodmodels.js`, `worldview.js` |
| Angelsteg `FWM.pier` + `worldPierFrame` (statt `FWM.jetty`) | `woodmodels.js`, `worldview.js` |
| Schattenpass verwirft flache Bodenflächen (y < 0,07, Normale oben) | `gl3d.js` (SVS/SFS) |
| `AREA_BAR2` ist jetzt eine Liste je Gebiet | `worldview.js` |

## Stand v74 – Schatzkiste-Show (auf v73)

| Thema | Wo |
|---|---|
| Intro (Schwarm-Sturzflug, Banner, Lichtsäule), Leuchtfeuer `WV.trFx`, Öffnungs-Show `worldTreasureReveal`/`stepTreasureReveal` | `worldview.js` (Abschnitt „v74: Schatzkiste“, vor „Döring GmbH“) |
| `farmTreasureDig` liefert `stars`; 3 ★ = 2 🍀, mehr EP; Kleeblatt ohne eigenen Flug | `erbe.js` |
| Modelle `goldChest`, `goldLid` | `woodmodels.js` |
| Gemeinsamer Banner-Helfer `worldLootShow` (auch `worldParcelReward`) | `worldview.js` |

## Stand v73 – Lootkiste „Besondere Lieferung“ (auf v72)

| Thema | Wo |
|---|---|
| Kiste fest vor dem Südtor (`FPARCEL_AT`), Migration alter Lieferungen | `erbe.js` |
| Seltenheiten `FPARCEL` + `farmParcelRoll`, neue Belohnung in `farmEvReward("lieferung")` | `erbe.js` |
| Lieferwagen-Ankunft, Leuchtfeuer, Öffnungs-Animation (`worldParcel*`, `stepParcel*`) | `worldview.js` |
| Modelle `lootCrate`, `lootLid`, `lootBeam`, `lootRing` | `woodmodels.js` |
| Partikelform 3 (Stern) im Shader | `gl3d.js` |
| `.lootbanner`, `.lootflash` | `style.css` |

## Stand v72 – Brücke, Wegende am Bach, Straßeneinmündungen (auf v71)

| Thema | Wo |
|---|---|
| Neue gewölbte Brücke `FWM.bridge` (5,8 lang), Hauptweg gerade darüber (`FWORLD.paths[1]`, [3], [4] neu gelegt) | `woodmodels.js`, `erbe.js`, `worldview.js` |
| Westweg endet vor dem Bach mit Angelsteg `FWM.jetty` + Bank | `erbe.js` `paths[2]`, `worldview.js` |
| `forestPath(…, { mouth: [Anfang, Ende] })` + `mouthFillet` = Ausrundung an der Straße; Wegenden am Bordstein (17,48 / 19,52) | `woodmodels.js`, `erbe.js`, `worldview.js` |
| `LAKE_WAY1` (neu) wie `LAKE_WAY2` global in `worldview.js`, `team.js` nutzt beide | `worldview.js`, `team.js` |

## Stand v71 – Weganschlüsse und Dekowege (auf v70)

| Thema | Wo |
|---|---|
| Dekowege = Deko-Objekte 1 × 1 mit `FDECO[k].weg`; alle Wegfelder über `farmWegMap()`/`farmWegAt(x, z)`, Ränder über `wegMask(o)` | `farmdata.js`, `farm.js` (Ende), `woodmodels.js` `decoWeg` |
| Wegebau-Modus `FV.weg` (eigene Geste „weg“, Zwei-Finger-Pan nur dort), Leiste in `#farmPlace` | `farmview.js` |
| `team.js`: `navBuild` (Dekowege kein Hindernis, Kosten 0,4; Uferweg aus `LAKE_WAY2`), `staffWalkLen` in `staffGo` (30 % schneller auf Dekowegen) – Fahrerin unverändert | `team.js` |
| Haustiere laufen auf Wegen (`petTiles`, `petNext`) | `worldview.js` |

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
