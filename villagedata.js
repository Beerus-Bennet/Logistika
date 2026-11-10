/* v340: Seeblick – feste Grundstücke und Nachbarn. Weltmaßstab: eine Kachel
   entspricht etwa zwei Metern; die Hauptstraße liegt auf z=18,5. */
const VILLAGE_DATA = (() => {
  const plots = [], rows = [31, 43, 55, 75, 87];
  [-62, -98].forEach((road, col) => rows.forEach((z, row) => [-1, 1].forEach((side, s) => {
    const starter = col === 0 && row < 3;
    plots.push({ id: String(col) + row + s, x: road + side * 11, z, road, side, ry: side < 0 ? Math.PI / 2 : -Math.PI / 2,
      street: col ? "Seegarten" : "Lindenweg", number: row * 2 + s + 1, starter, resident: starter ? row * 2 + s : null });
  })));
  const looks = [
    { shirt:0x70a99a,pants:0x344d68,hair:0x633d28,hs:"pferd",skin:0xefbd9a,boots:0xeeeeea },
    { shirt:0xb96940,pants:0x303b4f,hair:0x483327,hs:"kurz",skin:0xf1c5a5,boots:0x594b42 },
    { shirt:0x9775b8,pants:0x404754,dress:0x82629d,fem:true,hair:0x858078,hs:"dutt",skin:0xeac4aa,boots:0x3e383a },
    { shirt:0x586775,pants:0x355575,hair:0x292321,hs:"kurz",skin:0xc8926d,boots:0xe2dfd7 },
    { shirt:0xd2a14e,pants:0x3e4758,hair:0x915a31,hs:"lang",skin:0xf0c4a2,boots:0xeee9df },
    { shirt:0x638d82,pants:0x7a715e,hair:0xb4afa5,beard:0xb4afa5,hs:"scheitel",garb:"plaid",gc:0x718f89,skin:0xe3b58f,boots:0x514438 }
  ];
  const names = ["Anna Köhler","Markus Berg","Sabine Richter","Cem Yılmaz","Lena Hoffmann","Thomas Neumann"];
  const jobs = ["Floristin","Elektriker","Bibliothekarin im Ruhestand","Mediengestalter","Erzieherin","Gärtner im Ruhestand"];
  const neighbors = names.map((n,i)=>({id:"neighbor"+i,n,job:jobs[i],size:[2,3,1,2,3,2][i],seed:110+i,look:{...looks[i],seed:110+i}}));
  const friends = [
    {n:"Julia Fischer",job:"Kollegin von Anna",town:"w-glindow"}, {n:"Paul Hartmann",job:"Bekannter von Markus",town:"w-werder"},
    {n:"Ingrid Schulz",job:"Freundin von Sabine",town:"w-glindow"}, {n:"Ben Schneider",job:"Kollege von Cem",town:"w-werder"},
    {n:"Nora Schulze",job:"Freundin von Lena",town:"w-glindow"}, {n:"Peter Albrecht",job:"Bekannter von Thomas",town:"w-werder"}
  ];
  const houses = {
    holz:{n:"Holzhaus mit Veranda",cost:175000,turnkey:215000,days:2,rent:1450,sale:285000,scale:.8,need:{bauholz:8,balken:6,bretter:8,dielen:4,tueren:2}},
    familie:{n:"Großes Familienhaus",cost:260000,turnkey:315000,days:3,rent:2150,sale:415000,scale:.92,need:{bauholz:12,balken:10,bretter:12,dielen:6,tueren:3}}
  };
  return {plots,neighbors,friends,looks,houses,land:35000,extension:48000,ad:750,rect:[-118,17,-43,100]};
})();
/* Eigener naher Lieferort im vorhandenen Straßen-/Radnetz. Keine Fernverkehrsaufträge. */
NODES.push(["w-seeblick","Seeblick",52.35930,12.91098,"EUR",1,"br","city","Seeblick","hof"]);
