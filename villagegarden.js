/* v368: Bewohnte Gärten – ein gemeinsamer, deterministischer Plan für
   Ausstattung, Zeichnung und Hindernisse. Maßstab passend zu den Bewohnern.
   Vorbild: Gartenräume/Sichtachsen, Sitzplatz am Haus, Stauraum am Rand. */
const VILLAGE_GARDEN = (() => {
  "use strict";
  const cache=new Map(),palettes=[
    {wood:0x98704c,roof:0x53616a,cloth:0xe9d8ae,flower:0xc17e9e},
    {wood:0xa98259,roof:0x815549,cloth:0x8caa96,flower:0xe1b45e},
    {wood:0x829079,roof:0x4c5960,cloth:0xd5b59a,flower:0xa4a2c5}
  ];
  const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
  function key(p,h){return h&&h.resident&&['resident','rented','sold'].includes(h.status)
    ?[p.id,h.type||'holz',h.resident.id,h.resident.seed||0,h.resident.size||1,h.resident.job||''].join(':'):'';}
  function plan(p,h){
    const signature=key(p,h);if(!signature)return null;
    const old=cache.get(p.id);if(old&&old.key===signature)return old;
    const resident=h.resident,seed=resident.seed||hash(resident.id||resident.n||p.id),size=resident.size||1;
    const profile=size>=3?'familie':/gärtn|florist/i.test(resident.job||'')?'beete':seed%2?'gesellig':'ruhe';
    const side=p.side,colors=palettes[seed%palettes.length],items=[],surfaces=[];
    /* u = Abstand von der Straße nach hinten, v = entlang der Grundstücksfront.
       Der Familienhaus-Anbau liegt auf der Gegenseite der Terrasse. */
    const add=(kind,u,v,w,d,ry=0)=>items.push({kind,u,v,w,d,ry});
    const surface=(u,v,w,d,color)=>surfaces.push({u,v,w,d,color});
    surface(10.7,side*4.35,3.35,2.35,0xbfb6a3);
    const door=VILLAGE.door(p),du=(door[0]-p.road)*side,dv=door[1]-p.z;
    surface(du,(dv+side*4.35)/2,.64,Math.abs(side*4.35-dv)+.64,0xc7bca6);
    surface((du+9.1)/2,side*4.35,Math.abs(9.1-du)+.64,.64,0xc7bca6);
    // Schmaler Seitenweg zum hinteren Garten, nicht quer durch das Sitzensemble.
    surface(13.1,side*4.35,1.45,.64,0xc7bca6);
    surface(13.8,0,.8,9.3,0xc7bca6);
    add(profile==='familie'?'familientisch':'sitzplatz',10.3,side*4.35,2.15,profile==='familie'?1.9:1.45,side*Math.PI/2);
    add('gartenhaus',15.55,-side*4.25,3.0,2.15,-side*Math.PI/2);
    if(profile==='familie'){
      add('grill',12.0,side*4.75,.84,1.1);
      add('schaukel',15.55,0,2.0,3.0,Math.PI/2);
      add('sandkasten',15.2,side*4.25,1.8,1.8);
    }else if(profile==='beete'){
      add('hochbeet',15.55,0,1.65,1.35,Math.PI/2);
      add('hochbeet',15.55,side*2.7,1.65,1.35,Math.PI/2);
      add('vogelbad',7.7,-side*4.6,.6,.6);
      if(h.type!=='familie')add('obstbaum',6.1,-side*2.5,1.8,1.8);
    }else{
      add('feuerstelle',15.55,side*1.55,2.6,2.6);
      if(profile==='gesellig')add('grill',12.0,side*4.75,.84,1.1);
      else {add('blumenbeet',7.2,-side*4.4,2.3,1.0,Math.PI/2);if(h.type!=='familie')add('obstbaum',6.1,-side*2.5,1.8,1.8);}
    }
    add('pflanzkasten',5.4,-side*4.7,.65,1.15,Math.PI/2);
    // Niedrige Randbepflanzung statt einer hohen Wand um den Rasen.
    add('stauden',16.9,side*4.7,.55,1.2,Math.PI/2);
    const result={key:signature,modelKey:[side,h.type||'holz',profile,seed%palettes.length].join(':'),profile,side,colors,items,surfaces,size};cache.set(p.id,result);return result;
  }
  const metal=0x414d50,woodDark=0x6f5039,soil=0x654c34;
  function beam(b,a,c,r,color){const dx=c[0]-a[0],dy=c[1]-a[1],dz=c[2]-a[2],l=Math.hypot(dx,dy,dz);if(l<1e-5)return;
    b.box(r,l,r,color,{x:a[0],y:a[1],z:a[2],rx:Math.acos(dy/l),ry:Math.atan2(dx,dz)});}
  function chair(b,colors){
    b.box(.43,.065,.42,colors.wood,{y:.43});b.box(.37,.04,.35,colors.cloth,{y:.50});
    for(const x of [-.16,.16])for(const z of [-.15,.15])b.box(.045,.43,.045,metal,{x,z});
    for(const x of [-.18,.18])b.box(.045,.44,.045,metal,{x,z:-.17,y:.45});
    for(const y of [.62,.76])b.box(.43,.10,.045,colors.wood,{y,z:-.17});
  }
  function flowers(b,c,far=false){
    b.box(.95,.22,.5,c.wood,{y:.035});b.plate(.86,.4,soil,{y0:.26});
    for(const x of [-.3,0,.3]){b.ico(.17,0x63894a,{x,y:.35,sz:.8});if(!far)for(const z of [-.12,.08])b.ico(.065,c.flower,{x:x+.05,y:.49,z});}
  }
  function model(kind,c,far=false){
    const b=new FM.MB();
    if(kind==='gartenhaus'){
      b.box(1.65,.1,1.85,0xa69c8b,{y:.02});b.box(1.55,1.5,1.65,c.wood,{y:.12});
      b.roof(1.85,1.95,.43,c.roof,{y:1.62,gable:c.wood});
      b.box(.65,1.14,.04,woodDark,{y:.13,z:.846});
      b.box(.08,.08,.035,0xd2bf8d,{x:.22,y:.7,z:.879});
      b.box(.055,.49,.52,0xe4dcc7,{x:.8,y:.83,z:-.12});b.box(.065,.39,.41,0x678997,{x:.809,y:.88,z:-.12});
      if(!far){
        for(let y=.3;y<1.6;y+=.2)b.box(1.57,.018,1.67,woodDark,{y});
        b.box(.075,.42,.035,0xdcd4bb,{x:.849,y:.86,z:-.12});
        b.cyl(.23,.22,.58,10,0x657b68,{x:.43,y:.05,z:1.17});b.cyl(.235,.235,.04,10,0x42594f,{x:.43,y:.63,z:1.17});
        b.box(.18,.045,.08,0xbcc5bd,{x:.43,y:.23,z:1.42});
      }
    }else if(kind==='sitzplatz'||kind==='familientisch'){
      b.cyl(.07,.055,.66,8,metal,{y:.04});b.cyl(.39,.39,.065,far?8:12,c.wood,{y:.7});
      for(const z of [-.65,.65])b.merge(chairMesh(c,far),{z,ry:z<0?0:Math.PI});
      if(kind==='familientisch')b.merge(chairMesh(c,far),{x:.65,ry:-Math.PI/2});
      if(!far){
        b.cyl(.09,.12,.13,8,0xad7859,{y:.78});b.ico(.14,0x648d46,{y:.96});
        for(const x of [-.27,.27])beam(b,[-.2,.06,0],[x,.62,0],.045,metal);
      }
    }else if(kind==='grill'){
      for(const [x,z]of [[-.2,-.13],[.2,-.13],[0,.23]])beam(b,[x,.07,z],[x*.75,.67,z*.75],.045,metal);
      b.cyl(.15,.31,.22,12,0x333b3c,{y:.59});
      b.cyl(.305,.305,.025,12,0x1d2629,{y:.81});
      if(!far){
        for(let x=-.24;x<=.25;x+=.08){const l=Math.sqrt(.28*.28-x*x)*2;b.box(.018,.014,l,0xb7bec0,{x,y:.842});}
        for(const x of [-.21,.21])b.cyl(.10,.10,.045,10,0x20292b,{x,y:.11,z:-.13,rz:Math.PI/2});
        // Geöffneter roter Deckel mit Griff, am hinteren Scharnier abgestützt.
        b.at({y:.84,z:-.29,rx:-1.05},()=>{
          for(let j=0;j<4;j++)for(let i=0;i<12;i++){
            const p=(jj,ii)=>{const t=jj/4*Math.PI/2,a=ii/12*Math.PI*2;return[Math.sin(t)*Math.cos(a)*.30,Math.cos(t)*.17,Math.sin(t)*Math.sin(a)*.30];};
            const a=p(j,i),d=p(j,i+1),e=p(j+1,i+1),f=p(j+1,i);if(j)b.quad(a,d,e,f,0x984f42);else b.tri(a,e,f,0x984f42);
          }b.box(.13,.045,.055,0x273235,{y:.19});
        });
      }
    }else if(kind==='schaukel'){
      for(const x of [-1.08,1.08]){beam(b,[x,.04,-.8],[x,1.85,0],.10,c.wood);beam(b,[x,.04,.8],[x,1.85,0],.10,c.wood);}
      b.box(2.4,.12,.12,c.wood,{y:1.83});
      for(const x of [-.25,.25])beam(b,[x,1.82,0],[x,.45,0],.022,0xb6b3a0);
      b.box(.65,.07,.3,0x63787b,{y:.42});
      if(!far)for(const x of [-1.08,1.08])beam(b,[x,.75,-.47],[x,.75,.47],.07,woodDark);
    }else if(kind==='feuerstelle'){
      b.disc(.72,far?12:20,0xb0a491,{y0:.044});b.disc(.41,12,0x494643,{y0:.06});
      for(let i=0;i<(far?8:12);i++){const a=i/(far?8:12)*Math.PI*2;b.box(.22,.18,.17,0x8c8c80,{x:Math.sin(a)*.46,z:Math.cos(a)*.46,y:.05,ry:a});}
      for(const z of [-1.03,1.03]){b.box(1.15,.09,.32,c.wood,{z,y:.42});for(const x of [-.4,.4])b.box(.09,.38,.24,woodDark,{x,z,y:.04});}
      if(!far){beam(b,[-.28,.12,-.12],[.25,.13,.16],.10,woodDark);beam(b,[-.2,.14,.21],[.16,.15,-.23],.09,0x4d4035);}
    }else if(kind==='hochbeet'){
      b.box(1.10,.48,1.4,c.wood,{y:.04});b.plate(.94,1.24,soil,{y0:.53});
      for(const x of [-.28,.28])for(const z of [-.43,0,.43]){b.ico(.16,0x568148,{x,y:.6,z});if(!far)b.ico(.065,0x85994f,{x:x+.04,y:.72,z});}
      if(!far)for(const y of [.19,.38]){b.box(1.12,.018,1.42,woodDark,{y});}
    }else if(kind==='sandkasten'){
      b.box(1.6,.18,1.6,c.wood,{y:.04});b.plate(1.4,1.4,0xd9c38d,{y0:.23});
      if(!far){b.cyl(.08,.12,.18,8,0x7d9d9e,{x:.3,y:.24,z:.2});b.box(.07,.025,.3,0xb36c4d,{x:-.3,y:.25,z:.25});}
    }else if(kind==='vogelbad'){
      b.cyl(.16,.10,.48,8,0x9c9c8b,{y:.04});b.cyl(.25,.29,.10,10,0xbab8a5,{y:.52});b.disc(.22,10,0x72979d,{y0:.63});
    }else if(kind==='obstbaum'){
      b.cyl(.09,.05,1.5,6,woodDark,{y:.04});
      beam(b,[0,.9,0],[.35,1.55,.12],.07,woodDark);
      b.ico(.64,0x65874d,{y:1.7,sy:1.05});b.ico(.47,0x789852,{x:.35,y:1.65,z:.15});b.ico(.45,0x537647,{x:-.32,y:1.5,z:-.16});
      if(!far)for(const [x,y,z]of [[.3,1.55,.47],[-.32,1.45,.3],[.48,1.7,-.2],[-.15,2.06,-.23]])b.ico(.065,0xab6950,{x,y,z});
    }else if(kind==='pflanzkasten')flowers(b,c,far);
    else if(kind==='blumenbeet'){
      b.plate(.8,2.0,soil,{y0:.045});for(const z of [-.65,0,.65])b.merge(model('stauden',c,far),{z});
    }else if(kind==='stauden'){
      for(const x of [-.23,.23]){b.ico(.22,0x608451,{x,y:.23,sz:.7});if(!far)for(const z of [-.09,.1]){b.box(.018,.25,.018,0x5b8045,{x,y:.2,z});b.ico(.07,c.flower,{x,y:.46,z});}}
    }
    return b;
  }
  const models=new Map();
  function chairMesh(c,far){const b=new FM.MB();if(far){b.box(.43,.06,.42,c.wood,{y:.43});b.box(.43,.35,.06,c.wood,{y:.49,z:-.17});b.box(.12,.43,.18,metal);}else chair(b,c);return b;}
  function itemMesh(kind,c,far){const k=kind+':'+c.wood+':'+far;if(!models.has(k))models.set(k,model(kind,c,far));return models.get(k);}
  function grounds(p,P){const b=new FM.MB();for(const q of P.surfaces)b.plate(q.w,q.d,q.color,{x:p.side*(q.u-11),z:q.v,y0:.061});return b;}
  function mesh(p,P,far=false){const b=new FM.MB();for(const q of P.items)b.merge(itemMesh(q.kind,P.colors,far),{x:p.side*(q.u-11),z:q.v,ry:q.ry,y:.035});return b;}
  function blocked(p,h,x,z,r){const u=(x-p.road)*p.side,v=z-p.z;
    if(u<1.95-r||u>18+r||Math.abs(v)>6+r)return false;
    const P=plan(p,h);if(!P)return false;
    return P.items.some(q=>u>q.u-q.w/2-r&&u<q.u+q.w/2+r&&v>q.v-q.d/2-r&&v<q.v+q.d/2+r);
  }
  return {plan,key,grounds,mesh,blocked,_model:model};
})();
