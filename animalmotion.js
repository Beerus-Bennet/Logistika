"use strict";
/* v446: Kleine, gemeinsam gecachte Gelenkmodelle. Pro Bild nur vorhandene
   Knoten bewegen; weder neue Netze noch Texturen oder zusätzliche Tiere. */
const ANIMAL_MOTION=(()=>{
  const caches=new WeakMap(),TAU=Math.PI*2;
  const CONFIG={deer:{stride:.56},boar:{stride:.30},fox:{stride:.25},hare:{stride:.20,bound:true},squirrel:{stride:.13,bound:true},hedgehog:{stride:.055},heron:{stride:.40},dog:{stride:.28},cat:{stride:.16},goat:{stride:.34},chicken:{stride:.13},cow:{stride:.38},pig:{stride:.23},sheep:{stride:.25},beef:{stride:.38},marmot:{stride:.17}};
  const LOOKS={
    deer:[['normal','Rotbraun',70],['dark','Dunkelbraun',18],['gold','Sommergold',8],['piebald','Weiß gescheckt',4]],
    squirrel:[['normal','Kupferrot',65],['dark','Schokoladenbraun',20],['black','Schwarzbraun',13],['albino','Albino',2]],
    boar:[['normal','Dunkelbraun',73],['rust','Rostbraun',19],['piebald','Gescheckt',8]],
    hare:[['normal','Feldbraun',72],['dark','Dunkelbraun',18],['pale','Sandfarben',8],['albino','Albino',2]],
    fox:[['normal','Rotfuchs',75],['cross','Kreuzfuchs',15],['pale','Heller Fuchs',10]],
    hedgehog:[['normal','Braun',78],['dark','Dunkelbraun',18],['pale','Helle Stacheln',4]],
    heron:[['normal','Graublau',75],['pale','Silbergrau',25]]
  };
  const FUR={deer:[0xa86a3c,0x825034,0xc5a07b,0xd5b6a0],squirrel:[0xb65c2d,0xe5bd88,0x76391f,0xc66e35,0xd88a4b],boar:[0x4a3c34,0x514036,0x91725d,0x302a25],hare:[0x9a7a5a,0x806247,0xdbc0a2,0xf0dfc8],fox:[0xd77733,0x452c23,0xf0d9b3,0xf2d8b4,0x52352b,0xf5e6ca],hedgehog:[0x6a5848,0x5a4a3a,0x4a3c30,0xb99c7b,0xc8aa84],heron:[0x9aa2ac,0x6a707a,0x3a3c44,0xeceef0]};
  const rgb=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
  const palettes=Object.fromEntries(Object.entries(FUR).map(([k,v])=>[k,v.map(rgb)]));
  function choose(k,u=Math.random()){
    const list=LOOKS[k]||[['normal','Normal',100]];let n=Math.max(0,Math.min(.999999,u))*100;
    for(const v of list){n-=v[2];if(n<0)return v[0];}return list[0][0];
  }
  function paint(mesh,k,look,p=[0,0,0]){
    if(look==='normal'||!palettes[k])return mesh;
    const m=new FM.MB();m.v=mesh.v.slice();const V=m.v;
    for(let i=0;i<V.length;i+=27){
      const color=V.slice(i+6,i+9),match=palettes[k].some(c=>c.every((v,j)=>Math.abs(v-color[j])<.012)),
        eye=color.every((v,j)=>Math.abs(v-rgb(0x171b1e)[j])<.008),nose=k==='squirrel'&&color.every((v,j)=>Math.abs(v-rgb(0x35251d)[j])<.008);
      if(!match&&!(look==='albino'&&(eye||nose)))continue;
      const x=(V[i]+V[i+9]+V[i+18])/3+p[0],y=(V[i+1]+V[i+10]+V[i+19])/3+p[1],z=(V[i+2]+V[i+11]+V[i+20])/3+p[2],l=(color[0]+color[1]+color[2])/3;
      let target;
      if(look==='albino')target=eye?0x9b4552:nose?0xe9a3a5:0xf5efe2;
      else if(look==='piebald'){
        // Große unregelmäßige Weißflächen statt zusätzlicher Flecken-Geometrie.
        const patch=Math.sin(z*17+x*11)+.65*Math.cos(y*18-z*7)+.35*Math.sin(x*31+y*9);
        target=patch>.25?0xf5ebd7:k==='boar'?0x514139:0x965932;
      }else if(look==='cross')target=(y>.35&&Math.abs(x)<.12)||Math.abs(z)<.07?0x4b3932:0xb16a38;
      else target=look==='black'?0x302c2b:look==='dark'?0x604333:look==='gold'?0xc18b4e:look==='rust'?0x9b6343:k==='heron'?0xbec5c7:0xcab38b;
      const c=rgb(target),shade=look==='albino'&&(eye||nose)?1:.82+Math.min(.18,l*.3);
      for(let j=0;j<3;j++)for(let a=0;a<3;a++)V[i+j*9+6+a]=c[a]*shade;
    }
    return m;
  }
  function mount(R,root,key,kind,build,look='normal'){
    let cache=caches.get(R);if(!cache){cache=new Map();caches.set(R,cache);}
    const id=kind+':'+key+':'+look;let data=cache.get(id);
    if(!data){const parts=[],body=build(parts);data={body:R.mesh(paint(body,kind,look)),parts:parts.map(q=>({p:q.p,mesh:R.mesh(paint(q.mesh,kind,look,q.p))}))};cache.set(id,data);}
    if(root._gait)for(const leg of root._gait.legs){const i=root.children.indexOf(leg.node);if(i>=0)root.children.splice(i,1);}
    root.mesh=data.body;
    const legs=data.parts.map(q=>({p:q.p,node:R.addChild(root,R.node(q.mesh,{x:q.p[0],y:q.p[1],z:q.p[2]}))}));
    return root._gait={root,legs,kind,look,phase:0,amount:0,cfg:CONFIG[kind]||{stride:.2}};
  }
  function step(g,distance,dt){
    if(!g||dt<=0)return;
    const moving=distance>1e-6&&distance<4,scale=g.root.sx||1;
    /* v446: Bei Flucht längere Schritte/Trab statt immer schnellerem Trippeln.
       Beim Anhalten erst ausblenden, dann in die neutrale Beinstellung gehen. */
    if(moving)g.running=distance/(dt*g.cfg.stride*scale)>3.2;
    else if(!g.amount)g.running=false;
    if(moving)g.phase=(g.phase+Math.min(distance/(g.cfg.stride*scale*(g.running?2.2:1))*TAU,dt*TAU*6))%TAU;
    g.amount+=(Number(moving)-g.amount)*Math.min(1,dt*16);
    if(!moving&&g.amount<.001)g.amount=0;
    for(const leg of g.legs){
      const p=leg.p,L=Math.max(.035,p[1]),front=p[2]>0,side=p[0]>0,
        offset=g.cfg.bound?(front?0:.5):g.legs.length===2?(side?0:.5):g.running?(side===front?0:.5):((side?.5:0)+(front?.25:0)),
        u=(g.phase/TAU+offset)%1,duty=g.cfg.bound?.48:g.running?.5:.64,
        v=u<duty?1-2*u/duty:-1+2*(u-duty)/(1-duty),
        reach=L*(g.cfg.bound?.44:g.running?.5:.30)*g.amount,z=reach*v,
        angle=-Math.asin(Math.max(-.8,Math.min(.8,z/L))),
        lift=u<duty?0:Math.sin((u-duty)/(1-duty)*Math.PI)*L*(g.running?.22:.14)*g.amount;
      leg.node.rx=angle;leg.node.y=p[1]-L*(1-Math.cos(angle))+lift;
    }
  }
  function wild(R,root,k,look){return mount(R,root,k,k,parts=>FWM[k](false,parts),look);}
  function farm(R,root,k,variant,shorn){
    const kind={huhn:'chicken',kuh:'cow',rind:'beef',schwein:'pig',schaf:'sheep'}[k];
    if(!kind)return null;
    return mount(R,root,variant+':'+!!shorn,kind,parts=>kind==='sheep'?FM.sheep(variant,shorn,parts):FM[kind](variant,parts));
  }
  return {mount,step,wild,farm,choose,LOOKS,paint,CONFIG};
})();
