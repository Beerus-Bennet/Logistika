/* v343: Ein gemeinsamer Lageplan für Fahrbahn, Gehwege, Grundstücke und Tore.
   Häuser/Adressen bleiben an ihren bisherigen Positionen. */
const VILLAGE_SITE = (() => {
  const half=.9,walk=.78,curb=.045,front=1.95,main=18.5,edge=main+.9,sidewalk=half+curb+walk/2;
  const roads=[-62,-98],radius=1.1;
  function lot(p){const back=p.road===-62&&p.side<0||p.road===-98&&p.side>0?18:17.5;
    const a=p.road+p.side*front,b=p.road+p.side*back;return [Math.min(a,b),p.z-6,Math.max(a,b),p.z+6];}
  function gate(p){const d=VILLAGE.door(p);return [p.road+p.side*front,d[1]];}
  function mailbox(p){const g=gate(p);return [g[0]+p.side*.1,g[1]+1.15];}
  function bikePark(p){const g=gate(p);return [g[0]+p.side*1.6,g[1]+1.35];}
  function path(p){const d=VILLAGE.door(p);return [d,gate(p),[p.road+p.side*sidewalk,d[1]]];}
  function segments(expanded){return expanded?[
    [[-62,edge],[-62,98]],[[-98,edge],[-98,98]],
    [[-98,64],[-62,64]],[[-98,98],[-62,98]]
  ]:[[[-62,edge],[-62,64]]];}
  function mainBreaks(center){return roads.map(x=>({z:x-center,side:-1,half:half+radius}));}
  function fencePlan(plots){const lines=new Map(),gates=[];
    const line=(a,b)=>{if(Math.hypot(a[0]-b[0],a[1]-b[1])<.02)return;const pts=[a,b].sort((p,q)=>p[0]-q[0]||p[1]-q[1]);lines.set(pts.flat().map(n=>n.toFixed(3)).join(','),pts);};
    for(const p of plots){const r=lot(p),g=gate(p),x=g[0],back=p.side<0?r[0]:r[2],gap=.6;
      line([back,r[1]],[back,r[3]]);line([x,r[1]],[back,r[1]]);line([x,r[3]],[back,r[3]]);
      line([x,r[1]],[x,g[1]-gap]);line([x,g[1]+gap],[x,r[3]]);gates.push({p,at:g,width:gap*2});}
    return {lines:[...lines.values()],gates};
  }
  const quad=(b,p,c,y)=>{if((p[1][1]-p[0][1])*(p[2][0]-p[0][0])-(p[1][0]-p[0][0])*(p[2][1]-p[0][1])<0)p=p.slice().reverse();b.quad(...p.map(q=>[q[0],y,q[1]]),c);};
  function roadMesh(expanded){
    const b=new FM.MB(),asphalt=0x7c7f86,paving=0xbeb9ac,stone=0xd2cfc5,y=.033;
    const lines=segments(expanded),joints=[];
    if(expanded)for(const x of roads)for(const z of [64,98])joints.push([x,z]);
    const inRoad=(x,z,pad=0)=>lines.some(([a,c])=>a[0]===c[0]?Math.abs(x-a[0])<half+pad&&z>=a[1]-pad&&z<=c[1]+pad:Math.abs(z-a[1])<half+pad&&x>=a[0]-pad&&x<=c[0]+pad);
    for(const [a,c]of lines){const vertical=a[0]===c[0],lo=vertical?a[1]:a[0],hi=vertical?c[1]:c[0],v=vertical?a[0]:a[1];
      b.plate(vertical?half*2:hi-lo,vertical?hi-lo:half*2,asphalt,{x:vertical?v:(lo+hi)/2,z:vertical?(lo+hi)/2:v,y0:y});
      for(const side of [-1,1]){
        const start=vertical&&lo===edge?edge+radius:lo,cuts=[start,hi];for(const q of joints)if((vertical?q[0]:q[1])===v){const t=vertical?q[1]:q[0];cuts.push(Math.max(start,t-half-walk-curb),Math.min(hi,t+half+walk+curb));}
        const sorted=[...new Set(cuts)].sort((x,z)=>x-z);
        for(let i=1;i<sorted.length;i++){const l=sorted[i-1],h=sorted[i],mid=(l+h)/2,x=vertical?v+side*(half+curb+walk/2):mid,z=vertical?mid:v+side*(half+curb+walk/2);
          if(inRoad(x,z))continue;
          b.plate(vertical?walk:h-l,vertical?h-l:walk,paving,{x,z,y0:.047});
          b.plate(vertical?curb:h-l,vertical?h-l:curb,stone,{x:vertical?v+side*(half+curb/2):mid,z:vertical?mid:v+side*(half+curb/2),y0:.052});
        }
      }
    }
    for(const [x,z]of joints)b.plate(half*2,half*2,asphalt,{x,z,y0:y});
    /* T-Einmündungen: nur bis zum Fahrbahnrand, keine Platte über der Hauptstraße. */
    for(const x of expanded?roads:[roads[0]]){
      for(let i=0;i<12;i++){const z0=edge+i*radius/12,z1=edge+(i+1)*radius/12;
        const w=z=>half+radius-Math.sqrt(Math.max(0,radius*radius-(z-edge-radius)**2));
        quad(b,[[x-w(z0),z0],[x-w(z1),z1],[x+w(z1),z1],[x+w(z0),z0]],asphalt,y+.001);
      }
      for(const s of [-1,1])for(let i=0;i<12;i++){const t0=-Math.PI/2-i*Math.PI/24,t1=-Math.PI/2-(i+1)*Math.PI/24,cx=x+s*(half+radius),cz=edge+radius;
        const pt=(a,r)=>[cx+s*r*Math.cos(a),cz+r*Math.sin(a)];
        quad(b,[pt(t0,radius),pt(t1,radius),pt(t1,radius-curb),pt(t0,radius-curb)],stone,.053);
        quad(b,[pt(t0,radius-curb),pt(t1,radius-curb),pt(t1,radius-curb-walk),pt(t0,radius-curb-walk)],paving,.048);
      }
      for(const xx of [-.57,-.18,.21])b.tri([x+xx,.038,21.35],[x+xx+.22,.038,21.35],[x+xx+.11,.038,21.12],0xeee9de);
    }
    /* Begleitender Gehweg an der Ortsseite der Hauptstraße, mit Einmündungsöffnungen. */
    const left=expanded?-117:-81,right=-43,breaks=(expanded?roads.slice():[roads[0]]).sort((a,c)=>a-c);let at=left;
    for(const x of breaks.concat([right+half+radius])){const stop=Math.min(right,x-half-radius);if(stop>at)b.plate(stop-at,walk,paving,{x:(at+stop)/2,z:edge+curb+walk/2,y0:.047});at=x+half+radius;}
    if(!expanded){
      /* v344: Provisorischer Wendeplatz zwischen letztem Grundstück und künftigem Block. */
      b.disc(3.18,48,paving,{x:-62,z:65.2,y0:.046});b.disc(2.4,48,asphalt,{x:-62,z:65.2,y0:.049});
      /* Den zweiten Anschluss bis zur Erschließung wieder mit Bordkante schließen. */
      b.plate((half+radius)*2,.12,0xb9b3a6,{x:-98,z:main+.96,y0:.032});
    }else{
      /* Gehwege setzen sich um die Blockecken fort; jede Kreuzung bleibt frei. */
      for(const [x,z]of joints)for(const sx of [-1,1])for(const sz of [-1,1]){
        const cx=x+sx*(half+curb+walk/2),cz=z+sz*(half+curb+walk/2);
        if(!inRoad(cx,cz))b.plate(walk,walk,paving,{x:cx,z:cz,y0:.047});
      }
      for(const [x,z]of joints)for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){
        if(inRoad(x+dx*(half+walk+curb+.1),z+dz*(half+walk+curb+.1)))continue;
        b.plate(dx?walk:2*(half+curb),dz?walk:2*(half+curb),paving,{x:x+dx*(half+curb+walk/2),z:z+dz*(half+curb+walk/2),y0:.047});
        b.plate(dx?curb:2*(half+curb),dz?curb:2*(half+curb),stone,{x:x+dx*(half+curb/2),z:z+dz*(half+curb/2),y0:.052});
      }
    }
    return b;
  }
  function garden(p){const b=new FM.MB(),r=lot(p),g=gate(p),d=VILLAGE.door(p),sx=p.road+p.side*sidewalk;
    b.plate(r[2]-r[0],r[3]-r[1],[0x86b85b,0x90ba66,0x80ac58][Number(p.id)%3],{x:(r[0]+r[2])/2-p.x,z:0,y0:.032});
    b.plate(Math.abs(d[0]-sx),.84,0xc7bca6,{x:(d[0]+sx)/2-p.x,z:d[1]-p.z,y0:.057});
    const park=bikePark(p);b.plate(2.8,1.1,0xb7b19f,{x:park[0]-p.x,z:park[1]-p.z,y0:.051});b.plate(.55,1.4,0xb7b19f,{x:park[0]-p.x,z:d[1]-p.z+.65,y0:.052});
    const rnd=erbeRng(Number(p.id)+31);for(let i=0;i<5;i++){const x=p.side*(5+rnd()*.5),z=-3.5+i*.6;b.ico(.15,0x45823a,{x,y:.18,z});b.ico(.07,[0xe4ae5a,0xc86c95,0x8da8ce][i%3],{x,y:.3,z});}
    return b;
  }
  function fenceMesh(plan){const b=new FM.MB(),posts=new Set();for(const [a,c]of plan.lines){const len=Math.hypot(c[0]-a[0],c[1]-a[1]),n=Math.max(1,Math.ceil(len/1.45));
      for(let i=0;i<=n;i++){const x=a[0]+(c[0]-a[0])*i/n,z=a[1]+(c[1]-a[1])*i/n,k=x.toFixed(3)+','+z.toFixed(3);if(posts.has(k))continue;posts.add(k);b.box(.085,.63,.085,0x72523a,{x,z,y:.03});b.box(.11,.045,.11,0x8c6747,{x,z,y:.66});}
      const vert=a[0]===c[0],x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;for(const y of [.23,.47])b.box(vert?.065:len,.075,vert?len:.065,0x9b7954,{x,z,y});
      const pickets=Math.floor(len/.22);for(let i=0;i<pickets;i++){const t=(i+.5)/pickets;b.box(vert?.045:.085,.47,vert?.085:.045,0xab8b66,{x:a[0]+(c[0]-a[0])*t,z:a[1]+(c[1]-a[1])*t,y:.09});}
    }return b;}
  function gateMesh(){const b=new FM.MB();for(const y of [.23,.47])b.box(.065,.075,1.2,0x9b7954,{y,z:.6});for(let i=0;i<6;i++)b.box(.045,.47,.085,0xab8b66,{z:.1+i*.2,y:.09});return b;}
  function mailboxMesh(){const b=new FM.MB();b.box(.07,.87,.07,0x67503c);b.box(.28,.28,.31,0x536b71,{y:.87});b.box(.31,.035,.34,0x71878b,{y:1.15});b.box(.12,.018,.018,0x263b40,{y:1.08,z:.164});return b;}
  function mailFlap(){const b=new FM.MB();b.box(.25,.23,.025,0x617e83,{y:-.23});b.box(.05,.025,.027,0xd2bf88,{y:-.18,z:.025});return b;}
  /* v344: Umrisse gelten für Füße UND Körper, auch bei älteren gespeicherten Wegen. */
  function blocked(x,z,r=.34){
    for(const p of VILLAGE_DATA.plots){const h=VILLAGE.home(p.id);if(!h.resident&&!['ready','building'].includes(h.status))continue;
      const k=VILLAGE_DATA.houses[h.type],dx=x-p.x,dz=z-p.z,lx=dx*Math.cos(p.ry)-dz*Math.sin(p.ry),lz=dx*Math.sin(p.ry)+dz*Math.cos(p.ry);
      const boxes=[[-3,-2.6,3,4.65]];if(h.type==='familie')boxes.push([-5.9,-2.2,-2.2,2.2]);
      if(boxes.some(b=>lx>b[0]*k.scale-r&&lx<b[2]*k.scale+r&&lz>b[1]*k.scale-r&&lz<b[3]*k.scale+r))return true;
      const a=lot(p),g=gate(p),back=p.side<0?a[0]:a[2],pad=r+.045;
      if(z>=a[1]-pad&&z<=a[3]+pad&&Math.abs(x-back)<pad)return true;
      if(x>=a[0]-pad&&x<=a[2]+pad&&(Math.abs(z-a[1])<pad||Math.abs(z-a[3])<pad))return true;
      if(Math.abs(x-g[0])<pad&&z>=a[1]-pad&&z<=a[3]+pad&&Math.abs(z-g[1])>.6-r)return true;
    }
    return S.farm.objs.some(o=>{if(['path','road','field','tree','board'].includes(o.t))return false;const s=farmSize(o),a=o.x-FG/2,b=o.z-FG/2;return x>a-r&&x<a+s[0]+r&&z>b-r&&z<b+s[1]+r;});
  }
  function clearLine(a,b,r=.34){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15));for(let i=0;i<=n;i++)if(blocked(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n,r))return false;return true;}
  function safePath(points,r=.34){const out=[points[0]];if(blocked(...points[0],r))return null;
    for(let i=1;i<points.length;i++){const a=out[out.length-1],b=points[i];if(clearLine(a,b,r)){out.push(b);continue;}
      const step=.5,pad=8,x0=Math.floor(Math.min(a[0],b[0])-pad),z0=Math.floor(Math.min(a[1],b[1])-pad),w=Math.ceil((Math.abs(a[0]-b[0])+2*pad)/step)+1,H=Math.ceil((Math.abs(a[1]-b[1])+2*pad)/step)+1;
      const start=[Math.round((a[0]-x0)/step),Math.round((a[1]-z0)/step)],end=[Math.round((b[0]-x0)/step),Math.round((b[1]-z0)/step)],key=q=>q[1]*w+q[0],world=q=>[x0+q[0]*step,z0+q[1]*step],queue=[start],prev=new Map([[key(start),null]]);let found=null;
      for(let j=0;j<queue.length&&j<30000;j++){const q=queue[j];if(q[0]===end[0]&&q[1]===end[1]&&clearLine(world(q),b,r)){found=q;break;}
        for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const v=[q[0]+dx,q[1]+dz],k=key(v);if(v[0]<0||v[0]>=w||v[1]<0||v[1]>=H||prev.has(k)||!clearLine(j===0?a:world(q),world(v),r))continue;prev.set(k,q);queue.push(v);}}
      if(!found)return null;const path=[];for(let q=found;q;q=prev.get(key(q)))path.push(world(q));path.reverse();out.push(...path,b);
    }return out;
  }
  function homeMesh(type,style){const b=RENT.homeMesh(style);if(type==='familie'){
    b.box(3.6,2.65,4.2,0xd4c5a7,{x:-4.05,z:0});b.roof(3.9,4.5,1.45,0x81594b,{x:-4.05,y:2.65});
    for(const z of [-1.1,1.1]){b.box(.045,1.05,.85,0x536879,{x:-5.87,y:1,z});b.box(.055,.07,.92,0xe9dfcd,{x:-5.9,y:1.5,z});}
    b.box(1.3,1.05,.04,0x536879,{x:-4.05,y:1,z:2.12});
  }return b;}
  function construction(type){const b=new FM.MB(),family=type==='familie',w=family?8.8:5.8,cx=family?-1.5:0;
    b.plate(w,7.4,0xb7b0a4,{x:cx,z:.8,y0:.055});for(const x of family?[-5.7,-2.6,2.6]:[-2.6,2.6])for(const z of [-2.1,2.1,3.9])b.box(.14,2.7,.14,0xc69a66,{x,z});
    for(const y of [1.3,2.6])b.box(w,.12,.12,0xc69a66,{x:cx,y,z:-2.1});if(family)b.box(3.6,.25,4.2,0xc3b9a6,{x:-4.05,z:0,y:.1});return b;}
  return {half,walk,curb,front,main,edge,sidewalk,roads,lot,gate,mailbox,bikePark,path,segments,mainBreaks,fencePlan,roadMesh,garden,fenceMesh,gateMesh,mailboxMesh,mailFlap,blocked,clearLine,safePath,homeMesh,construction};
})();
