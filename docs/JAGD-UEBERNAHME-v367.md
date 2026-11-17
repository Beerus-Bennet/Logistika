# v367 – Tierfall, Jagdaufträge, Wolken, Trefferbild und Kaufbeleg

Vor dem Push abgeglichen: PR #84 wurde inzwischen auf main gemergt (`bb76a87`). Dieses aktuelle main ist ebenfalls vollständig und konfliktfrei integriert.

Stand: 17. November 2026. Basis main `d4a1664` (v365), zusätzlich PR #84 bis `b7da342` integriert. Dieser parallele Inselstand führt v366; gemeinsame Lieferung daher v367. Keine Veröffentlichung auf main/Pages.

## Fallbewegung

Bisher steuerten die Läufe eine zusätzliche stark angewinkelte Zwischenpose an. Jetzt lösen sie sich stetig aus der wirklichen Gangstellung und entspannen verzögert in die vorhandene Liegepose. Bei ruhendem Schalenwild werden die stützenden Hufe anfangs durch Gelenkberechnung am Boden gehalten; die Unterstützung endet, sobald die Körperneigung dies erfordert. Bewegtes Wild behält etwas abklingenden Impuls. Der Rumpf dreht um den Körperschwerpunkt statt um den Modellursprung. Bodenschutz und gespeicherte Endlage bleiben erhalten. Fasan und Fluchtabläufe sind weiter artspezifisch.

Prüfung: 16 Fälle (Hirsch/Keiler, beide Seiten, ruhend/bewegt, Größe 0,85/1,15), Schritte bei 60 Hz. Größter Gelenkschritt 0,149 rad, größte Wurzelbewegung 0,073 Spieleinheiten pro Frame, frühzeitiges Driften eines gestützten Hufs höchstens 0,035. Haut fällt nicht unter die geprüfte Bodenebene; kein Sprung zur Endpose. Das ist eine gesteuerte Animation mit Gelenkgrenzen, keine physikalische Ragdoll-Simulation.

[Hirsch – Animation](assets/v367/fall-hirsch.webm) · [Keiler – Animation](assets/v367/fall-keiler.webm) · [Bildfolge](assets/v367/fall-sheet.png) · [Messwerte](assets/v367/fall-metrics.json)

## Jagdaufträge und Himmel

Das Fragezeichen am Hochsitz entfällt. Die Tiergüte-Erklärung bleibt im Jagdbuch. Unter dem Revierkopf stehen alle laufenden Jagdaufträge in einem zunächst geschlossenen Dropdown. Auftragsfortschritt aktualisiert die Zeilen, ohne die Ansicht wieder zu schließen. Fingerwischen in der Liste bewegt die Kamera nicht; beide globalen Touch-Wachen berücksichtigen die Liste. Ein ResizeObserver hält sie auch unter einem umgebrochenen Kopf.

Das hochgeladene Video (5,82 Sekunden, 1180 × 2556) wurde in mehreren Einzelbildern geprüft: Die Wolkenmittelpunkte waren bereits projiziert, ihre breiten Bilder blieben jedoch parallel zum Bildschirm. Jetzt sind auch Ausdehnung und Ausrichtung durch feste Himmelsflächen bestimmt; deren Eckpunkte werden vollständig projiziert. Kein zusätzliches zeitabhängiges Mitwandern. Die Texturen werden auf ein wiederverwendetes Hilfscanvas gezeichnet, damit Dreieckskanten keine sichtbaren Nähte erzeugen. Sterne, Mond und Wetter bleiben erhalten.

[Dropdown](assets/v367/jobs-open.png) · [Himmel A](assets/v367/sky-a.png) · [gedrehter/geneigter Himmel B](assets/v367/sky-b.png)

## Organformen und richtige Trefferangaben

Ursache des falschen Magen-Treffers: `shotOrgans` prüfte weiterhin Ellipsoide, obwohl `organMesh` andere Oberflächen zeichnete. Zusätzlich wurden Herz/Lunge teils ohne Schnittkontakt nachträglich eingefügt. Jetzt verwenden Organbericht, sichtbares Gewebe und Zeiger dieselben zwischengespeicherten Dreiecksnetze. Links/rechts werden getrennt protokolliert und nach der tatsächlichen Durchschussreihenfolge aufgelistet. Das gilt für alle 25 weichen Organdatensätze der drei Arten.

Der Schweinemagen ist nun ein geschlossener asymmetrischer Sack mit Fundus, Kurvatur und Pförtner. Die Lungenlappen haben weniger übertriebene Einschnitte. Grundordnung: Herz tief vorn, Lunge darüber, Leber am Zwerchfell, Magen/Pansen dahinter, Gescheide weiter hinten, Nieren unter der Lende. Das Orientierungsskelett tritt zurück; das betroffene Gewebe bleibt farbig. Die Namen stehen in zwei entzerrten Randspalten. Ihre Zeiger und der Trefferring enden auf einer tatsächlichen Schnittstelle mit der Organoberfläche. Der dargestellte Kanal verwendet für Rumpftreffer die echte Körperoberfläche als Ein-/Austritt.

Bei neuen Schüssen sind die bisherigen großzügigen Herz-/Lungenzonen nur noch eine Vorprüfung: Ein Herz-/Lungenschuss erfordert zusätzlich Schnittkontakt mit dem dargestellten Organ. Dadurch entfallen unsichtbare tödliche Treffer in leeren Zwischenräumen. Bestehende Streifschussgrenzen und Medaillenschwellen werden nicht neu eingestellt.

Bei alten Aufzeichnungen mit vorhandenem Strahl wird nur eine Ansichtskopie korrigiert. Fehlende Organberührungen werden nicht aus der alten Wertung erfunden. Eine entsprechende Erläuterung und „Damals“ an der Wirkungsanzeige kennzeichnen berichtigte Altaufnahmen. Gespeicherte Schüsse, frühere Wirkung, Medaille und Erlöse werden nicht rückwirkend verändert. Die Anatomie ist ein vereinfachtes artspezifisches Spielmodell, keine veterinärmedizinische Simulation. Knochen benutzen weiterhin ihre bisherigen Näherungsvolumen.

[Schräger Keilertreffer: Niere/Lunge, kein Magen](assets/v367/keiler-diagonal.png) · [tatsächlicher Magen-Treffer](assets/v367/keiler-magen.png)

## Kaufbeleg und entfernte Hai-Animation

Die native `details`-Hülle der überlagerten Bestandsansicht begrenzte ihren inneren Inhaltskasten nicht zuverlässig. Der Bestand hat jetzt eine eigene Flex-Ansicht mit messbar begrenztem, nativ scrollbarem Inhalt. Zurück und Unternehmensübersicht liegen außerhalb der Liste. Fokus bleibt im Dialog, auch die Liste ist per Tastatur erreichbar. Unterkategorien bleiben unabhängig ausklappbar.

Nach einem erfolgreichen Kauf öffnet sich unmittelbar der gespeicherte Beleg. Hai-Skript und Offline-Shell-Eintrag, Audio-Vorbereitung und Aufruf im Kaufablauf wurden entfernt. Der historische unbenutzte Quelltext bleibt im Repository, wird aber nicht geladen. Besitzübernahme, Zahlung und Quittung bleiben atomar und wiederholsicher.

[Bestandsliste bis zum letzten Fahrzeug](assets/v367/receipt-scroll-390x664.png)

## Prüfungen

- `node jagd-v366.test.js`: vier Prüfgruppen zu Gelenkverläufen und ortsfesten Wolkenflächen.
- `node jagd-v366.browser.js`: echtes WebGL, 16 Fallkombinationen, native Touch-Bedienung der Jagdaufträge, Kopf-Umbruch bei 320 px, mehrere Himmelsrichtungen. Reiner 2D-Himmel durchschnittlich 2,15 ms in diesem Test; keine Aussage über komplette Bildrate oder ein iPhone.
- `node anatomie-v367.test.js`: sieben Prüfgruppen, darunter Fehlalarm im alten Magenellipsoid, echte Magenberührung, alle 25 Organmodelle beidseitig, paarige Nieren, leerer Bereich der alten Herzzone, skalierte/gedrehte Tiere, unveränderte Altdaten und tatsächliche Zeigerpunkte.
- `node anatomie-v367.browser.js`: vier WebGL-Aufnahmen (drei Arten), schräger Nieren-/Lungentreffer, echter Magen-Treffer, Namensschilder ohne Überlappung bei 320/390 px und mehreren Drehwinkeln; Touch-Scroll bis Berichtsende ohne Kamerabewegung.
- `node company-ui-v367.browser.js`: echter Kauf, kein geladenes Hai-Skript, direkt zum Beleg; Finger-Scroll bis Fahrzeug 17 bei 390 × 664, 320 × 568 und 844 × 390; Zurück/Fokus und unveränderte Kaufdaten.
- `node company-acquisition-v355.browser.js`: zwei echte Käufe (auch Premiumkonzern), fünf Ansichten ohne Scrollbedarf der Zusammenfassung, Wiederöffnung/Laden ohne zweite Zahlung, doppelte Schriftgröße, lange Namen und reduzierte Bewegung.
- Bestehende Regressionen: 23 Jagdtests (in Unterordner kopieren, benötigen jetzt auch `gl3d.js`), 18 atomare Übernahmeszenarien, neun v359-, acht PDF-v365- und vier Trefferbild-v357-Prüfgruppen. Releaseprüfung kontrolliert Cache/Assetversionen und das entfallene Hai-Skript.

Chromium mit Software-WebGL. Kein echtes iPhone/Safari getestet; insbesondere GPU-Leistung und Safari-Touch-Verhalten bleiben dort nachzuprüfen.
