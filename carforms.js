"use strict";
/* v472: Sichtvergleich mit den 127 Modellfotos aus CAR_PHOTOS (Abrufprotokoll im Bericht).
   Bauform, Leuchten, Grill, Flügel und besondere Formmerkmale ausdrücklich je Modell.
   Keine Änderung an CAR, Fahrdaten oder gespeicherten Garagenobjekten. */
const CAR_FORMS=(()=>{
 const rows=`
p356 round oval slit none softtop|Runde Bugkotflügel, schmale Chromstoßstange und gewölbte Kabine
p550 spyder oval slit none lowglass|Offener niedriger Zweisitzer, gewölbte Kotflügel, runde eingelassene Leuchten
p930 rear oval slit whale fuchs|Elfer-Dachbogen, breite hintere Radläufe und flacher Walflossen-Spoiler
p959 rear oval triple integrated side|Glatter Elfer-Bug, integrierter umlaufender Heckspoiler und hintere Einlässe
pcgt mid oval triple active side,engine|Lange Tropfenleuchten, niedrige Kabine und große Seiteneinlässe
p918 mid oval triple active side,engine|Gewölbte Bughaube und flache, nach hinten verjüngte Kabine
pgt3 rear oval triple swan side|Aufrechte ovale Kotflügelleuchten, runde Dachlinie und Schwanenhalsflügel
pgt2 rear oval triple raised side,vents|Breite Elfer-Schultern, Haubenöffnungen und großer gerader Heckflügel
p924 wedge pop slit none narrow|Schmaler Transaxle-Keil mit geschlossenen Klappscheinwerfern
p944 wedge pop slit none wide|Breitere ausgestellte Kotflügel als beim 924, lange schräge Heckscheibe
p928 fastback round slit none narrow|Runde flachliegende Leuchten und glatter langer Fastback
p986 spyder oval triple none side|Kurze runde Mittelmotor-Nase, ovale Leuchten und niedriger offener Innenraum
ptay sedan slit triple none curve|Flache Limousine mit nach unten gezogenem Leuchtenrand und Runddach
pcay suv slit triple none curve|Hohe runde SUV-Schultern, hinteres Leuchtenband und lange Kabine
prs rear oval slit duck fuchs|Schmale frühe Elfer-Kabine und kurzer lackierter Entenbürzel
p911r rear oval triple none fuchs|Elfer-Kontur ohne hohen Heckflügel
p917 prototype oval triple duck engine|Sehr niedrige mittige Glaskanzel und getrennt betonte Vorderradkuppen
aurq box rect slit none narrow|Gerade Coupé-Gürtellinie, rechteckige Doppelleuchten und lange Heckscheibe
asq box rect slit lip vents,wide|Verkürzter Radstand, steilere Heckscheibe und breite eckige Radläufe
ars2 wagon rect slit none rails|Langer gerader Kombiaufbau und schmale alte Frontleuchten
ar8a mid rect triple active blade,engine|Breites Heckgitter mit paarigen Rückleuchten, seitliche Kontrastblades
ar8 mid slit hex active blade,engine|Flache kantige Leuchten, großes Sechseckgitter und kürzere Sideblades
ars6 wagon slit hex none rails,wide|Lange Kombikabine, große zentrale Sechsecköffnung und breite Schultern
aetr sedan slit hex none curve|Niedrige Viertürer-Kabine, flache Lichtbänder und großer gerahmter Grill
ars4 wagon slit hex none rails|Kombi-Heck, Sechseckgrill und kantig eingefasste Frontleuchten
m300 classic oval merc none vents|Lange Motorhaube, runde Dachkuppel, Seitenkiemen und tiefe Sitzkabine
m113 frspyder vertical merc none chrome|Aufrechte schmale Leuchten und langer niedriger Pagoden-Bug
m129 frspyder rect merc none chrome|Breite rechteckige Leuchten und geradliniger langer Roadster-Bug
mclk prototype twin merc raised scoop,engine|Sehr flache Front, doppelte Rundlinsen, kleine Dachkanzel und breiter Flügel
mslr gt twin merc active vents|Langer zugespitzter Bug, doppelte ovale Leuchten und seitliche Kiemen
msls gt vertical merc active vents|Sehr lange Haube, nach hinten versetzte Kabine und kurze Heckpartie
mamg gt swept merc active vents|Runde lange Bugschultern, geschwungene Leuchten und tiefer großer Grill
mone hyper swept triple active scoop,fin,vents,engine,side|Kleine gewölbte Kabine, Dachansaugung/Finne und drei tiefe Bugöffnungen
mg63 boxsuv round merc none spare|Aufrechte Kastenkabine, runde Leuchten, flache Haube und Heckreserverad
m540 vintage round tall none chrome|Schmale hohe Motorhaube, offene Kabine und freistehende geschwungene Kotflügel
b507 frspyder round kidney none vents,chrome|Lange runde Haube, breite flache Nieren und kleine offene Kabine
be9 box quad kidney none chrome|Schlankes Zweitürerdach mit vier Rundscheinwerfern und kleinen Nieren
bm1 wedge pop kidney none engine|Flacher breiter Keil und schwarze Klappscheinwerferdeckel
bm3 box quad kidney lip wide|Doppelte Rundscheinwerfer, kleine Nieren und eckig ausgestellte Radläufe
bm5 sedan quad kidney none chrome|Langer Viertürer, Doppelrundlinsen in gemeinsamen Gehäusen
bz3 frspyder twin kidney none vents|Lange Haube, kurze offene Kabine und seitliche Kiemen
bz8 frspyder oval kidney none vents|Flache breite Nieren, ovale Leuchten und runde Roadster-Schultern
bi8 mid slit kidney none side,curve|Schmale Nieren, flache Lichtbänder und fließender Kontrast-Seitenschweller
bm2 coupe swept kidney lip wide|Breite rechteckige Nieren und kurze breite Zweitürerkabine
b02t box round kidney none chrome|Ein Rundscheinwerfer je Seite, schmale hohe Nieren und aufrechte Kabine
f250 classic oval oval lip vents|Lange runde Rennhaube, kleine Dachkuppel und drei seitliche Kiemen
f308 wedge pop slit none engine|Klappscheinwerfer, flache Keilnase und kurze kantige Mittelmotor-Kabine
f288 wedge pop slit lip side,engine|Ausgestellte hintere Radläufe und seitliche vertikale Einlassschlitze
ftr wedge pop slit none strakes,engine|Sehr breite hintere Schultern und durchgehende horizontale Seitenlamellen
ff40 wedge rect triple integrated side,vents,engine|Extremer Keil, transparente Leuchtenabdeckungen und integrierter hoher Flügel
ff50 mid oval oval integrated side,engine|Runde Vorderradkuppen und hoher bogenförmig integrierter Heckflügel
fenz hyper vertical twin active side,engine|Zugespitzte mittige Nase und vertikale Leuchtengruppen
flaf hyper swept oval active side,engine|Stark gewölbte Kotflügel, schmale Glaskanzel und tiefe seitliche Kanäle
f458 mid swept oval active side,engine|Nach hinten hochgezogene schlanke Leuchten und runder flacher Bug
f812 gt swept oval active vents|Lange runde Frontmotorhaube mit großer tiefer Grillöffnung
fsf90 mid slit triple active side,engine|Breite flache Front und horizontale dunkle Leuchtenbänder
f296 mid swept oval active side,engine|Runde Schultern und hohe seitliche Lufteinlässe hinter der Tür
fsp3 hyper slit oval lip strakes,engine|Breite vordere Kotflügel, schmale horizontale Leuchten und hohe hintere Schultern
fpur suv slit triple none curve|Hohe Sportcrossover-Schultern und flache geteilte Frontleuchten
fdyt fastback pop slit none narrow|Lange breite Keilhaube und nach hinten versetzte niedrige Kabine
froma gt slit oval active curve|Glatte lange Bughaube, schmales Leuchtenband und strukturierter Ovalgrill
bt57 vintage round tall none chrome,roof|Schmaler stehender Kühler, separate dunkle Kotflügel und kurze runde Dachkabine
beb110 wedge rect horse active side,engine|Kleine Hufeisenöffnung, eckige Leuchtengehäuse und niedrige Dachlinie
bvey mid rect horse active side,engine|Runde Kuppelkabine, hoher kleiner Hufeisengrill und große hintere Schultern
bchi mid cluster horse active ccurve,engine|Vier kleine LED-Linsen je Seite und große C-förmige seitliche Einfassung
bdiv hyper slit horse raised side,fin,engine|Breite Bugkanäle, schmale Lichtkanten und großer Heckflügel
bnoi hyper vertical horse active ccurve,engine|Lange schwarze Kuppelform, sechs schlanke Front-Lichtstriche und gewölbte Schultern
b110 wedge slit horse raised side,engine|Sehr schmale Leuchten, kleine hohe Grillöffnung und fünf seitliche Lufteinlasspunkte
bbol prototype slit horse raised scoop,fin,engine|Flache Rennkanzel, große Carbonkanäle und weit gespannter Heckflügel
bmis spyder vertical horse none ccurve|Offener Innenraum und hohe übereinander angeordnete Leuchtenmodule
btou mid slit horse active ccurve,engine|Lange glatte Bugschultern und besonders breites hohes Hufeisen
lmiu classic round slit none lashes,engine|Flache runde Nase mit Leuchtenwimpern und langer runder Mittelmotor-Kabine
lcou wedge pop triple raised scoops,engine,wide|Sehr flacher kantiger Keil, kurzer Dachkeil und aufgesetzte hintere Ansaugkästen
llm2 boxsuv round oval none hood,spare|Hoher eckiger Geländewagen mit ausgeprägtem Motorhaubenbuckel
ldia wedge pop triple raised side,engine|Breite niedrige Klappscheinwerfernase und weit hinten sitzende Kabine
lmur wedge rect triple active side,engine|Lange flache Leuchten und breite glatte Keilfront
lgal wedge vertical triple none side,engine|Frühes Gallardo-Coupé; detailliertes Netz aus v470 beibehalten
lven hyper swept twin raised fin,side,engine|Extrem herausgearbeitete Carbonkanten und schmale hochgezogene Leuchten
lave wedge swept twin active side,engine|Scharfe Keilform, seitliche große Einlässe und sechseckige Heckauslässe
lhur wedge swept twin active side,engine|Kurzer Dachkeil und flache nach außen spitz auslaufende Leuchten
lcen hyper swept twin integrated side,engine|Breiter Carbonbug, gerundete Dachhaube und integrierte Heckkante
lsian wedge swept twin active side,engine|Lange zugespitzte Lichtkanten und weit auslaufende hintere Schultern
luru suv swept twin none wide|Hohe keilförmige Front und niedrige SUV-Coupé-Dachlinie
lrev wedge swept twin active side,engine|Mehrstufige Y-Lichtkanten und offene schwarze Bugkanäle
lesa fastback quad slit none narrow|Lange flache Frontmotor-Karosserie, vier Rundscheinwerfer und langes Kombicoupé-Dach
ltem wedge slit twin active side,engine|Sehr schmale obere Lichtstreifen und tief sitzende äußere Sechseckmodule
adb5 classic oval oval none chrome,hood|Aufrechte Rundscheinwerfer, lange gewölbte Haube und niedrige Rundkabine
adbz classic oval oval none chrome|Sehr runde kleine Dachkuppel und glatte bauchige hintere Kotflügel
avan gt swept oval active curve|Runde hintere Schultern und breite paarige Heckleuchten
 aone gt oval oval active vents|Sehr lange Haube, große runde Grillöffnung und eingeschnittene Frontleuchten
avnt gt slit oval active vents|Schmale obere Lichtbänder und sehr breite untere Frontöffnung
adva prototype oval twin raised scoop,fin,engine|Winzige tropfenförmige Glaskanzel und seitlich getrennte tiefe Luftkanäle
mf1 mid rect triple active side,scoop,engine|Kompakte mittige Kabine, rechteckige Leuchtenabdeckungen und zentrale Dachansaugung
mp1 hyper swept twin raised side,engine|Schmale Tropfenkabine und geschwungene sichelförmige Frontleuchten
msen hyper swept twin raised side,scoop,engine|Großer hoch sitzender Flügel und offene kantige Bugkanäle
mspe hyper slit oval active longtail,engine|Sehr lange tropfenförmige Heckpartie und kleine glatte Kabine
m765 mid swept twin raised side,engine|Große dunkle sichelförmige Leuchtenkammern und verlängerter flacher Bug
mart mid slit twin active side,engine|Schmale Frontleuchten und hoher seitlicher Einlass hinter den Türen
rssh sedan quad tall none chrome|Gerade hohe Luxuslimousine, vier Rundscheinwerfer und schmaler hoher Kühler
rpha sedan rect tall none chrome|Lange hohe Motorhaube, großer senkrechter Kühler und aufrechte Kabine
rcul boxsuv rect tall none chrome|Hoch aufragende SUV-Kabine und breiter hoher Kühlerrahmen
rspe fastback slit tall none chrome|Lange Zweitürer-Schräghecklinie und flache geteilte Frontleuchten
bblo vintage round tall none chrome|Offener Vorkriegswagen mit freistehenden Leuchten und schmalen freiliegenden Rädern
bcon box quad tall none chrome|Geradliniges langes Luxuscoupé mit vier Rundscheinwerfern
bcgt coupe twin tall none chrome|Runde Zweitürerkabine, doppelte Rundlinsen und kleiner hoher Gittergrill
bcsp coupe oval tall none chrome|Runde Kuppeldachlinie, breite hintere Schultern und ovale Leuchtengehäuse
mbor wedge pop slit none engine|Flache runde Keilnase, kleine Dachkabine und lange Heckscheibe
mmc12 prototype oval oval raised scoop,side,engine|Langer flacher Bug, sehr schmale Dachkuppel und weit auslaufendes Heck
mmc20 mid vertical oval active side,engine|Schmale hohe Leuchtenabdeckungen und niedrige glatte Mittelmotor-Kabine
jxk frspyder round tall none chrome|Lange schmale Motorhaube, aufrechte Rundscheinwerfer und tiefe offene Kabine
jetp frspyder oval oval none chrome,hood|Sehr lange runde Haube, kleine offene Kabine und ovaler niedriger Kühler
jxkss spyder oval oval none chrome|Niedrige Glaskante, lange runde Kotflügel und kurze offene Rennkabine
jxj fastback pop oval active longtail|Lange flache Karosserie mit geschlossenen Scheinwerferdeckeln und weit hinten sitzender Kabine
pzon mid stack triple raised side,engine|Zwei übereinander sitzende Rundlinsen je Seite, Kuppeldach und mittige Vierrohrgruppe
phuy mid stack oval active side,engine|Gebogene Stielspiegel, schmale Rundlinsengehäuse und gewölbte Mittelkanzel
putop mid twin oval active side,engine|Große Doppelrundlinsen unter dunklen Abdeckungen und gerundete Glaskanzel
kccr mid oval oval raised side,engine|Kurze runde Dachhaube, große Seiteneinlässe und große Scheinwerfergehäuse
kreg mid swept oval active side,engine|Rundes Wraparound-Glas und lange glatte hintere Schultern
kagr mid swept twin raised side,engine|Breite Vorderradkuppen und großer hoch sitzender Heckflügel
lesp wedge pop slit none engine|Geradliniger Keil mit flachen geschlossenen Klappscheinwerferdeckeln
lels spyder oval oval none lowglass|Sehr kurze offene Kabine und runde betonte Vorderradkuppen
lemi mid vertical twin active side,engine|Hohe spitz auslaufende Leuchtengläser und weiche Schultern
leva hyper vertical twin active side,engine|Große tief ausgeschnittene hintere Luftkanäle und schmale hohe Frontleuchten
fgt40 prototype oval oval lip side,engine|Sehr niedrige Kanzel und hochgewölbte getrennte vordere Kotflügel
fsh muscle round slit lip hood|Lange flache Haube, aufrechte Rundscheinwerfer und zurückversetzte Fastback-Kabine
fgt05 mid oval triple lip side,engine|Breite Frontleuchten und kurze mittige Kabine zwischen hohen Radkuppen
fgt17 hyper oval twin active side,engine|Kleine Tropfenkabine, große offene seitliche Lufttunnel und hohe hintere Schultern
`;
 const result={};for(const row of rows.trim().split('\n')){const [spec,note]=row.trim().split('|'),[id,shape,head,grille,wing,features]=spec.split(/\s+/);result[id]=Object.freeze({shape,head,grille,wing,features:Object.freeze((features||'').split(',')),note});}return Object.freeze(result);
})();
