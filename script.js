'use strict';
// ── TIME ──────────────────────────────────────────────────────
const getIST=()=>{const n=new Date();return new Date(n.getTime()+n.getTimezoneOffset()*60000+19800000)};
const isBday=t=>t.getMonth()===5&&t.getDate()===12;
const tWin=t=>{const h=t.getHours();return h<4?'mid':h<10?'morn':'day'};
const pad2=n=>String(n).padStart(2,'0');
const cdData=()=>{const t=getIST();let b=new Date(t.getFullYear(),5,12);if(t>=b)b=new Date(t.getFullYear()+1,5,12);const d=b-t;return{days:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)}};

// ── THREE.JS ──────────────────────────────────────────────────
const canvas=document.getElementById('c');
let W=innerWidth,H=innerHeight;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(W,H);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=0.9;
window.addEventListener('resize',()=>{W=innerWidth;H=innerHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H)});

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x0a0604,12,42);
const camera=new THREE.PerspectiveCamera(72,W/H,0.05,300);
camera.rotation.order='YXZ';

// ── HELPERS ───────────────────────────────────────────────────
const DS=THREE.DoubleSide;
const ml=(c)=>new THREE.MeshLambertMaterial({color:c,side:DS});
const ms=(c,r=.85,m=0,e=0,ei=0)=>{const mat=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,side:DS});if(e){mat.emissive=new THREE.Color(e);mat.emissiveIntensity=ei}return mat};
const bx=(w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m};
const cy=(rt,rb,h,s,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s),mat);m.castShadow=true;m.receiveShadow=true;return m};
const sp=(r,s,mat)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,s,s),mat);m.castShadow=true;return m};
const put=(m,x,y,z,ry=0)=>{m.position.set(x,y,z);if(ry)m.rotation.y=ry;scene.add(m);return m};

// ── SOUND MANAGER ─────────────────────────────────────────────
const sounds = {
  bgm: new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=enchanted-forest-music-10143.mp3'),
  night: new Audio('https://cdn.pixabay.com/download/audio/2021/09/06/audio_40dcbc2f75.mp3?filename=crickets-and-insects-in-the-night-9032.mp3'),
  step: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_78bd14e4b3.mp3?filename=footstep-stone-1-8106.mp3'),
  interact: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=magical-sparkle-1-8107.mp3'),
  gate: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=stone-door-opening-8108.mp3'),
  click: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_51bb312f27.mp3?filename=button-pressed-38129.mp3'),
  win: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=success-1-6297.mp3'),
  lose: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3?filename=negative-beeps-6008.mp3')
};

sounds.bgm.loop = true; sounds.bgm.volume = 0.3;
sounds.night.loop = true; sounds.night.volume = 0.0;
sounds.step.volume = 0.15;
sounds.interact.volume = 0.5;
sounds.gate.volume = 0.8;
sounds.click.volume = 0.4;
sounds.win.volume = 0.4;
sounds.lose.volume = 0.3;

let audioEnabled = false;
let lastStepTime = 0;

const audioBtn = document.getElementById('audio-btn');
if(audioBtn) {
  audioBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioBtn.textContent = audioEnabled ? '🔊' : '🔇';
    if (audioEnabled) {
      if (outMode) {
        sounds.night.volume = 0.4;
        sounds.night.play().catch(() => {});
      } else {
        sounds.bgm.volume = 0.3;
        sounds.bgm.play().catch(() => {});
      }
    } else {
      sounds.bgm.pause();
      sounds.night.pause();
    }
  });
}

function playSound(name) {
  if (!audioEnabled || !sounds[name]) return;
  const s = sounds[name].cloneNode(); 
  s.volume = sounds[name].volume;
  s.play().catch(() => {});
}

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' && e.target.id !== 'audio-btn') playSound('click');
});

// ── COLLISION ─────────────────────────────────────────────────
const COLLS=[];
const addCol=(xmn,xmx,zmn,zmx)=>COLLS.push({xmn,xmx,zmn,zmx});
const canMove=(nx,nz)=>{const r=.3;for(const c of COLLS)if(nx+r>c.xmn&&nx-r<c.xmx&&nz+r>c.zmn&&nz-r<c.zmx)return false;return true};
function wall(x,y,z,w,h,d,mat,col=true){const m=bx(w,h,d,mat);m.position.set(x,y,z);scene.add(m);if(col)addCol(x-w/2,x+w/2,z-d/2,z+d/2);return m}
const WH=5,DW=3.4,DH=3.8;
function wallDoor(ax,ay,az,tw,wallD,mat,gx,gz){
  const hw=(tw-DW)/2;
  const p1=gx!==null?gx-DW/2-hw/2:gz-DW/2-hw/2;
  const p2=gx!==null?gx+DW/2+hw/2:gz+DW/2+hw/2;
  if(gx!==null){
    wall(p1,ay,az,hw,WH,wallD,mat);wall(p2,ay,az,hw,WH,wallD,mat);
    const hdr=bx(DW,WH-DH,wallD,mat);hdr.position.set(gx,DH+(WH-DH)/2,az);scene.add(hdr);
  } else {
    wall(ax,ay,p1,wallD,WH,hw,mat);wall(ax,ay,p2,wallD,WH,hw,mat);
    const hdr=bx(wallD,WH-DH,DW,mat);hdr.position.set(ax,DH+(WH-DH)/2,gz);scene.add(hdr);
  }
}

// ── TORCHES ───────────────────────────────────────────────────
const TORCHES=[];
function torch(x,y,z){
  put(cy(.04,.04,.5,6,ms(0x5a3010,.9)),x,y-.1,z);
  put(cy(.12,.07,.15,8,ms(0x8b4513,.8)),x,y+.12,z);
  const fl=cy(.09,0,.22,8,ms(0xff8800,.2,0,0xff6600,4));put(fl,x,y+.28,z);
  const li=new THREE.PointLight(0xff9944,2.4,8);li.position.set(x,y+.4,z);scene.add(li);
  TORCHES.push({li,fl,base:2.4,t:Math.random()*20});
}

// ── INTERACTABLES ─────────────────────────────────────────────
const IACTS=[];
let nearI=null,gameActive=false;

// ═══════════════ ROOM 1: MAIN HALL ═══════════════════════════
function buildMain(){
  const smW=ml(0x4a3a2a),smD=ml(0x2e2318),flM=ml(0x3a2e22),ceM=ml(0x1a1008),wdM=ms(0x5a3010,.9),dwM=ms(0x3a1a08,.95),goM=ms(0xc8922a,.3,.85);
  put(bx(16,.15,16,flM),0,0,0); put(bx(16,.15,16,ceM),0,WH,0);
  [-3,0,3].forEach(z=>put(bx(16,.28,.38,dwM),0,WH-.18,z));
  [-3,0,3].forEach(x=>put(bx(.38,.28,16,dwM),x,WH-.18,0));
  
  {const hw=(16-DW)/2,p1=0-DW/2-hw/2,p2=0+DW/2+hw/2;
   wall(p1,WH/2,-8,hw,WH,.3,smW);wall(p2,WH/2,-8,hw,WH,.3,smW);
   const hd=bx(DW,WH-DH,.3,smW);hd.position.set(0,DH+(WH-DH)/2,-8);scene.add(hd);}
  {const hw=(16-DW)/2,p1=0-DW/2-hw/2,p2=0+DW/2+hw/2;
   wall(p1,WH/2,8,hw,WH,.3,smW);wall(p2,WH/2,8,hw,WH,.3,smW);
   const hd=bx(DW,WH-DH,.3,smW);hd.position.set(0,DH+(WH-DH)/2,8);scene.add(hd);}
  {const hw=(16-DW)/2,p1=0-DW/2-hw/2,p2=0+DW/2+hw/2;
   wall(-8,WH/2,p1,.3,WH,hw,smW);wall(-8,WH/2,p2,.3,WH,hw,smW);
   const hd=bx(.3,WH-DH,DW,smW);hd.position.set(-8,DH+(WH-DH)/2,0);scene.add(hd);}
  {const hw=(16-DW)/2,p1=0-DW/2-hw/2,p2=0+DW/2+hw/2;
   wall(8,WH/2,p1,.3,WH,hw,smW);wall(8,WH/2,p2,.3,WH,hw,smW);
   const hd=bx(.3,WH-DH,DW,smW);hd.position.set(8,DH+(WH-DH)/2,0);scene.add(hd);}
  
  for(let y=.4;y<WH;y+=.55){put(bx(15.8,.05,.03,smD),0,y,-8.01);put(bx(15.8,.05,.03,smD),0,y,8.01)}
  put(bx(4.5,3.2,.5,smD),0,1.6,-7.85);put(bx(.8,4.2,1.1,smW),-2.6,2.1,-7.85);put(bx(.8,4.2,1.1,smW),2.6,2.1,-7.85);
  put(bx(5.6,.5,1.2,wdM),0,3.65,-7.85);
  const f1=cy(.5,0,.7,10,ms(0xff6600,.2,0,0xff4400,5));put(f1,0,.35,-7.4);
  const f2=cy(.3,0,.45,8,ms(0xffcc00,.2,0,0xffaa00,5));put(f2,0,.5,-7.4);
  const fpL=new THREE.PointLight(0xff6600,4.5,12);fpL.position.set(0,2,-7);scene.add(fpL);
  TORCHES.push({li:fpL,fl:f1,base:4.5,t:0});TORCHES.push({li:null,fl:f2,base:0,t:5});
  
  [-1.5,0,1.5].forEach(cx=>{const cb=cy(.05,.05,.28,6,ms(0xf5e6c8,.9));put(cb,cx,3.88,-7.85);const cf=cy(.06,0,.14,6,ms(0xff8800,.2,0,0xff6600,3));put(cf,cx,4.05,-7.85);const cl=new THREE.PointLight(0xffaa44,.85,3);cl.position.set(cx,4.08,-7.85);scene.add(cl);TORCHES.push({li:cl,fl:cf,base:.85,t:Math.random()*10})});
  
  put(bx(6.4,.04,8.4,ms(0xc8922a,.5)),0,.02,0);put(bx(6,.04,8,ms(0x8b2020,.9)),0,.03,0);
  put(bx(3.5,.1,1.6,wdM),0,.94,1);
  [[-1.5,-.65],[1.5,-.65],[-1.5,.65],[1.5,.65]].forEach(([lx,lz])=>put(cy(.08,.08,.94,6,dwM),lx,.47,1+lz));
  [-1.1,0,1.1].forEach(cx=>{put(cy(.05,.05,.26,6,ms(0xf5e6c8,.9)),cx,1.08,1);const cf=cy(.06,0,.13,6,ms(0xff8800,.2,0,0xff6600,3));put(cf,cx,1.22,1);const cl=new THREE.PointLight(0xffaa44,.9,3);cl.position.set(cx,1.24,1);scene.add(cl);TORCHES.push({li:cl,fl:cf,base:.9,t:Math.random()*8})});
  
  put(bx(.06,2.8,.04,ms(0xc0c0c0,.1,.9)),6,3.5,-7.85);put(bx(.6,.1,.08,goM),6,2.1,-7.85);put(bx(.08,.75,.08,dwM),6,1.55,-7.85);
  put(bx(.08,1.6,1.3,ms(0x8b1a1a,.7)),4,3,-7.85);put(bx(.1,1.65,1.35,goM.clone()),3.96,3,-7.85);
  put(bx(2,.04,2.5,ms(0x8b1a1a,.8)),0,4.2,-7.95,.3);
  
  [[-7.7,3.2,-5],[-7.7,3.2,5],[7.7,3.2,-5],[7.7,3.2,5],[-7.7,3.2,0],[7.7,3.2,0]].forEach(([x,y,z])=>torch(x,y,z));
  scene.add(new THREE.AmbientLight(0x2a1808,.65));
}

// ═══════════════ ROOM 2: LIBRARY (WEST x:-22..-8) ════════════
function buildLibrary(){
  const CX=-15,CZ=0,lm=ml(0x2a1e12),wdM=ms(0x5a3010,.9),dwM=ms(0x3a1a08,.95);
  put(bx(14,.15,16,ml(0x1e1610)),CX,0,CZ);put(bx(14,.15,16,ml(0x0e0c08)),CX,WH,CZ);
  [-4,0,4].forEach(z=>put(bx(14,.25,.35,dwM),CX,WH-.15,z));
  wall(CX-7,WH/2,CZ,.3,WH,16,lm);wall(CX,WH/2,CZ-8,14,WH,.3,lm);wall(CX,WH/2,CZ+8,14,WH,.3,lm);
  
  const BC=[0x8b1a1a,0x1a4a8b,0x2a6a2a,0x6a4a1a,0x4a1a6a,0x6a2a2a,0x2a5a5a,0x8b6a1a,0x5a1a5a,0x1a6a5a];
  function shelf(sx,sz,horiz){
    const bkW=horiz?0.1:3.8,bkD=horiz?3.8:0.1;
    put(bx(bkW,WH*.88,bkD,dwM),sx,WH*.44,sz);
    const cnt=horiz?6:6;
    for(let i=0;i<5;i++){
      const sy=i*.85+.35;
      put(bx(bkW+.02,.08,bkD+.02,wdM),sx,sy,sz);
      let cur=horiz?(sz-bkD/2):(sx-bkW/2);
      for(let b=0;b<cnt;b++){
        const bw=.18+Math.random()*.12,bh=.55+Math.random()*.28;
        const bk=bx(horiz?.38:bw,bh,horiz?bw:.38,ms(BC[(b+i*3)%BC.length],.9));
        if(horiz)bk.position.set(sx,sy+bh/2+.05,cur+bw/2);
        else bk.position.set(cur+bw/2,sy+bh/2+.05,sz);
        scene.add(bk);cur+=bw+.02;
      }
    }
  }
  shelf(CX-6.7,-5,false);shelf(CX-6.7,0,false);shelf(CX-6.7,5,false);
  shelf(CX,-7.6,true);shelf(CX+4,-7.6,true);
  
  put(bx(1.3,.2,1.1,ms(0x5a2040,.85)),CX+4,1,3);put(bx(1.3,1.6,.15,ms(0x5a2040,.85)),CX+4,1.9,2.52);
  put(bx(.14,.5,1.1,ms(0x5a2040,.85)),CX+3.27,1.3,3);put(bx(.14,.5,1.1,ms(0x5a2040,.85)),CX+4.73,1.3,3);
  put(bx(.85,.08,.85,wdM),CX+3,1.1,4.5);put(cy(.08,.08,.94,6,dwM),CX+3,.47,4.5);
  put(bx(.65,.04,.85,ms(0xf5e6c8,.9)),CX+3,1.15,4.5);
  put(sp(.3,14,ms(0x2a6a7a,.3,.1)),CX+2.5,1.62,-5);put(cy(.32,.32,.12,8,wdM),CX+2.5,1.2,-5);put(cy(.08,.08,.9,8,dwM),CX+2.5,.45,-5);
  
  const lan=sp(.22,8,ms(0xc8922a,.3,.8));put(lan,CX,3.65,0);
  const ll=new THREE.PointLight(0xffcc66,2.2,9);ll.position.set(CX,3.65,0);scene.add(ll);TORCHES.push({li:ll,fl:lan,base:2.2,t:Math.random()*10});
  [[-6.5,3.2,-6],[-6.5,3.2,0],[-6.5,3.2,6]].map(([x,y,z])=>torch(CX+x,y,z));
  
  IACTS.push({x:CX+4,z:3,r:1.8,label:'[E] Riddle Scroll',game:'riddle'});
  IACTS.push({x:CX-3,z:-2,r:2,label:'[E] Memory Game',game:'memory'});
}

// ═══════════════ ROOM 3: ALCHEMY LAB (EAST x:8..22) ══════════
function buildAlchemy(){
  const CX=15,CZ=0,am=ml(0x0e1e1e),wdM=ms(0x5a3010,.9),dwM=ms(0x3a1a08,.95);
  put(bx(14,.15,16,ml(0x0a1818)),CX,0,CZ);put(bx(14,.15,16,ml(0x060c0c)),CX,WH,CZ);
  [-4,0,4].forEach(z=>put(bx(14,.25,.35,dwM),CX,WH-.15,z));
  wall(CX+7,WH/2,CZ,.3,WH,16,am);wall(CX,WH/2,CZ-8,14,WH,.3,am);wall(CX,WH/2,CZ+8,14,WH,.3,am);
  
  [[CX,CZ-5.5],[CX-2,CZ+4],[CX+2,CZ+4]].forEach(([bx2,bz])=>{put(bx(3.5,.1,1.1,ms(0x4a3a2a,.85)),bx2,1.05,bz);put(bx(3.5,.8,1.1,ms(0x3a2a1a,.9)),bx2,.5,bz)});
  
  const PC=[[0xcc44ee,0x660099],[0x22ee88,0x006633],[0xeeee22,0x666600],[0xff4444,0x880000],[0x4488ff,0x002288],[0x88ffdd,0x006644]];
  [[CX-1,CZ-5],[CX+.5,CZ-5],[CX+2,CZ-5],[CX-1,CZ+3.8],[CX+.5,CZ+3.8],[CX+2,CZ+3.8]].forEach(([px,pz],i)=>{
    const [g,d]=PC[i%PC.length];const pm=new THREE.MeshStandardMaterial({color:d,roughness:.1,transparent:true,opacity:.75,emissive:new THREE.Color(g),emissiveIntensity:.45,side:DS});
    put(cy(.07,.1,.38,8,pm),px,1.24,pz);const pl=new THREE.PointLight(g,.65,2.5);pl.position.set(px,1.48,pz);scene.add(pl);TORCHES.push({li:pl,fl:null,base:.65,t:Math.random()*10});
  });
  
  put(cy(.65,.5,.55,14,ms(0x222222,.4,.85)),CX,1.34,CZ);
  const brewM=new THREE.MeshStandardMaterial({color:0x22aa55,roughness:.1,emissive:new THREE.Color(0x00ff88),emissiveIntensity:2,side:DS});
  const brewD=new THREE.Mesh(new THREE.CircleGeometry(.58,16),brewM);brewD.rotation.x=-Math.PI/2;brewD.position.set(CX,1.63,CZ);scene.add(brewD);
  const cL=new THREE.PointLight(0x00ff88,2.8,7);cL.position.set(CX,2.5,CZ);scene.add(cL);TORCHES.push({li:cL,fl:brewD,base:2.8,t:0});
  
  const orbM=new THREE.MeshStandardMaterial({color:0x8888ff,roughness:.05,metalness:.2,transparent:true,opacity:.82,emissive:new THREE.Color(0x4444ff),emissiveIntensity:1.2,side:DS});
  put(sp(.26,16,orbM),CX+3,1.6,CZ+3);put(cy(.35,.35,.14,10,ms(0xc8922a,.3,.85)),CX+3,1.22,CZ+3);put(cy(.08,.08,.82,8,dwM),CX+3,.42,CZ+3);
  const oL=new THREE.PointLight(0x6666ff,2.5,6);oL.position.set(CX+3,1.8,CZ+3);scene.add(oL);TORCHES.push({li:oL,fl:null,base:2.5,t:3});
  put(sp(.18,12,ms(0xe8e0d0,.9)),CX-3,1.65,CZ-2);
  [[6.5,3.2,-6],[6.5,3.2,0],[6.5,3.2,6],[0,3.2,-7.5],[0,3.2,7.5]].forEach(([x,y,z])=>torch(CX+x,y,z));
  
  IACTS.push({x:CX,z:CZ,r:2,label:'[E] Brew a Potion',game:'potion'});
  IACTS.push({x:CX+3,z:CZ+3,r:1.5,label:'[E] Consult the Orb',game:'fortune'});
}

// ═══════════════ ROOM 4: THRONE ROOM (NORTH z:-22..-8) ════════
function buildThrone(){
  const CX=0,CZ=-15,pm=ml(0x1e1228),goM=ms(0xc8922a,.3,.85),wdM=ms(0x5a3010,.9),dwM=ms(0x3a1a08,.95);
  put(bx(16,.15,14,ml(0x150e1e)),CX,0,CZ);put(bx(16,.15,14,ml(0x0c0810)),CX,WH+.3,CZ);
  [-4,0,4].forEach(x=>put(bx(.35,.28,14,dwM),x,WH-.15,CZ));
  wall(CX,WH/2,CZ-7,16,WH,.3,pm);wall(-8,WH/2,CZ,.3,WH,14,pm);wall(8,WH/2,CZ,.3,WH,14,pm);
  
  put(bx(3.4,.04,12.4,goM.clone()),CX,.03,CZ);put(bx(3,.04,12,ms(0x6b0000,.85)),CX,.04,CZ);
  
  [[-5,CZ-4],[-5,CZ+2],[5,CZ-4],[5,CZ+2]].forEach(([cx2,cz2])=>{
    put(cy(.28,.28,WH,12,ms(0x9a8a7a,.65)),cx2,WH/2,cz2);
    put(cy(.4,.28,.28,12,goM.clone()),cx2,WH-.15,cz2);put(cy(.38,.42,.2,12,goM.clone()),cx2,.1,cz2);
  });
  
  put(bx(2.2,.65,1.6,ms(0x4a1e6e,.7,.2)),CX,.32,CZ-5.5);put(bx(2.2,2.6,.2,ms(0x5a2880,.7,.2)),CX,2.05,CZ-6.1);
  put(bx(.22,.55,1.5,ms(0x5a2880,.7,.2)),-1.2,.9,CZ-5.5);put(bx(.22,.55,1.5,ms(0x5a2880,.7,.2)),1.2,.9,CZ-5.5);
  const trc=new THREE.Mesh(new THREE.TorusGeometry(.85,.13,8,18),goM.clone());trc.position.set(CX,3.55,CZ-6.1);scene.add(trc);
  put(bx(1.8,.22,1.3,ms(0x8b0000,.8)),CX,.75,CZ-5.5);
  
  put(cy(.3,.3,.15,12,goM.clone()),CX,1.7,CZ-5.5);
  [0,1,2,3,4].forEach(i=>{const a=i/5*Math.PI*2;put(cy(.04,0,.35,4,goM.clone()),CX+Math.cos(a)*.22,1.88+.01,CZ-5.5+Math.sin(a)*.22)});
  
  const rL=new THREE.PointLight(0xaa88ff,3.2,16);rL.position.set(CX,4.5,CZ-3);scene.add(rL);TORCHES.push({li:rL,fl:null,base:3.2,t:8});
  [[0xffa0a0,-5],[0xa0a0ff,0],[0xa0ffa0,5]].forEach(([c,x])=>{const sl=new THREE.PointLight(c,.55,8);sl.position.set(x,3,CZ-6.5);scene.add(sl)});
  
  [-5,5].forEach(x=>{put(bx(.1,3,2.2,ms(0x8b1a1a,.9)),x,2.5,CZ-6.88,Math.PI/2);put(bx(.12,3.1,2.4,goM.clone()),x-.06,2.5,CZ-6.88,Math.PI/2)});
  [[-7.7,3.2,-4],[-7.7,3.2,0],[7.7,3.2,-4],[7.7,3.2,0],[0,3.2,-6.5]].forEach(([x,y,z])=>torch(x,y,CZ+(z+CZ===CZ?z:0)));
  torch(-7.7,3.2,CZ-4);torch(-7.7,3.2,CZ);torch(-7.7,3.2,CZ+4);torch(7.7,3.2,CZ-4);torch(7.7,3.2,CZ);torch(7.7,3.2,CZ+4);
  
  IACTS.push({x:CX,z:CZ-4.5,r:2.2,label:'[E] Royal Quiz',game:'quiz'});
}

// ═══════════════ ROOM 5: GAME ROOM (SOUTH z:8..22) ════════════
const GATE_Z=22;
function buildGameRoom(){
  const CX=0,CZ=15,gm2=ml(0x0e180e),wdM=ms(0x5a3010,.9),dwM=ms(0x3a1a08,.95),goM=ms(0xc8922a,.3,.85);
  put(bx(16,.15,14,ml(0x0a1408)),CX,0,CZ);put(bx(16,.15,14,ml(0x060a04)),CX,WH,CZ);
  [-4,0,4].forEach(z=>put(bx(16,.25,.35,dwM),0,WH-.15,8+z));
  wall(-8,WH/2,CZ,.3,WH,14,gm2);wall(8,WH/2,CZ,.3,WH,14,gm2);
  
  wall(-5.5,WH/2,GATE_Z,5,WH,.3,gm2);wall(5.5,WH/2,GATE_Z,5,WH,.3,gm2);
  const ghd=bx(DW+.5,WH-DH,.3,gm2);ghd.position.set(0,DH+(WH-DH)/2,GATE_Z);scene.add(ghd);
  
  put(bx(10.4,.04,8.4,ms(0x2a5a2a,.5)),CX,.02,CZ);put(bx(10,.04,8,ms(0x3a4a2a,.9)),CX,.03,CZ);
  
  const dw=new THREE.Mesh(new THREE.CircleGeometry(.58,18),ms(0xf5deb3,.8));dw.rotation.y=-Math.PI/2;dw.position.set(-7.82,2.8,CZ-3);scene.add(dw);
  const dwr=new THREE.Mesh(new THREE.TorusGeometry(.58,.06,8,16),ms(0x2a1a0a,.5,.3));dwr.rotation.y=-Math.PI/2;dwr.position.set(-7.82,2.8,CZ-3);scene.add(dwr);
  [.42,.3,.2,.1].forEach((r,i)=>{const rng=new THREE.Mesh(new THREE.TorusGeometry(r,.04,6,14),ms([0xc80000,0x1a2a1a,0xc80000,0xf0f0f0][i],.7));rng.rotation.y=-Math.PI/2;rng.position.set(-7.82,2.8,CZ-3);scene.add(rng)});
  
  put(bx(1.6,.1,1.6,ms(0x3a2808,.8)),CX+3,1.03,CZ+3);put(cy(.12,.12,1.03,8,dwM),CX+3,.515,CZ+3);
  for(let r=0;r<4;r++)for(let col=0;col<4;col++){put(bx(.36,.02,.36,ms((r+col)%2===0?0xf5f5dc:0x3a2010,.9)),CX+3-.54+col*.36+.18,.11,CZ+3-.54+r*.36+.18)};
  
  put(bx(1.3,.72,.9,wdM),CX-4,.36,CZ+4);put(bx(1.3,.32,.9,ms(0x6a3a10,.8)),CX-4,.9,CZ+4,-.28);put(bx(.22,.22,.1,goM.clone()),CX-4,.7,CZ+3.57);
  put(cy(.28,0,.45,8,ms(0xff4444,.6)),4,1.06,CZ-4);
  
  put(bx(1.2,2.2,.5,ms(0x1a1a6a,.8)),-6,1.1,CZ-5);put(bx(1,.06,.42,ms(0xc8922a,.3,.85)),-6,2.26,CZ-5);
  const ch_screen=bx(.85,1.1,.04,ms(0x0a1a3a,.2,0,0x4466ff,1.2));put(ch_screen,-6,1.3,CZ-4.74);
  put(bx(.9,.08,.08,ms(0xc8922a,.3,.85)),-6,2.2,CZ-4.74);put(bx(.08,.08,.42,ms(0xc8922a,.3,.85)),-6.48,1.1,CZ-4.74);put(bx(.08,.08,.42,ms(0xc8922a,.3,.85)),-5.52,1.1,CZ-4.74);
  const chL=new THREE.PointLight(0x4466ff,1.2,3);chL.position.set(-6,1.8,CZ-4.5);scene.add(chL);TORCHES.push({li:chL,fl:null,base:1.2,t:1});
  
  put(bx(1.2,2.2,.5,ms(0x6a1a1a,.8)),6,1.1,CZ-5);put(bx(1,.06,.42,ms(0xc8922a,.3,.85)),6,2.26,CZ-5);
  const g2048_screen=bx(.85,1.1,.04,ms(0x1a0a08,.2,0,0xff8844,1.2));put(g2048_screen,6,1.3,CZ-4.74);
  put(bx(.9,.08,.08,ms(0xc8922a,.3,.85)),6,2.2,CZ-4.74);put(bx(.08,.08,.42,ms(0xc8922a,.3,.85)),5.52,1.1,CZ-4.74);put(bx(.08,.08,.42,ms(0xc8922a,.3,.85)),6.48,1.1,CZ-4.74);
  const g2L=new THREE.PointLight(0xff8844,1.2,3);g2L.position.set(6,1.8,CZ-4.5);scene.add(g2L);TORCHES.push({li:g2L,fl:null,base:1.2,t:2});
  
  put(bx(1.4,2.4,.5,ms(0x1a3a1a,.8)),0,1.2,CZ+6.5);put(bx(1.2,.06,.45,ms(0xc8922a,.3,.85)),0,2.46,CZ+6.5);
  const fw_screen=bx(1,.15,.04,ms(0x080a08,.2,0,0x44ffaa,.9));put(fw_screen,0,1.5,CZ+6.22);
  const fwL=new THREE.PointLight(0x44ffaa,.9,3);fwL.position.set(0,1.8,CZ+6);scene.add(fwL);TORCHES.push({li:fwL,fl:null,base:.9,t:3});
  
  put(bx(.9,.04,.28,ms(0xc8922a,.3,.85)),-6,2.38,CZ-4.74);put(bx(.9,.04,.28,ms(0xc8922a,.3,.85)),6,2.38,CZ-4.74);put(bx(1.05,.04,.32,ms(0xc8922a,.3,.85)),0,2.58,CZ+6.22);
  torch(-7.7,3.2,CZ-4);torch(-7.7,3.2,CZ+4);torch(7.7,3.2,CZ-4);torch(7.7,3.2,CZ+4);
  
  IACTS.push({x:0,z:CZ-3.5,r:2,label:'[E] Play Darts',game:'darts'});
  IACTS.push({x:CX-4,z:CZ+4,r:1.8,label:'[E] Open Treasure Chest',game:'catch'});
  IACTS.push({x:CX+3,z:CZ+3,r:1.8,label:'[E] Chess Memory',game:'memory'});
  IACTS.push({x:-6,z:CZ-5,r:1.8,label:'[E] Play Clicker Heroes',game:'clicker'});
  IACTS.push({x:6,z:CZ-5,r:1.8,label:'[E] Play 2048',game:'g2048'});
  IACTS.push({x:0,z:CZ+6.5,r:1.8,label:'[E] Play Fireboy & Watergirl',game:'fbwg'});
}

// ═══════════════ GATE + TIMER CANVAS TEXTURE ══════════════════
const timerCv=document.createElement('canvas');
timerCv.width=512;timerCv.height=512;
const TCT=timerCv.getContext('2d');
const timerTex=new THREE.CanvasTexture(timerCv);
timerTex.minFilter=THREE.LinearFilter;timerTex.magFilter=THREE.LinearFilter;

function drawTimer(){
  const CW=512,CH=512;TCT.clearRect(0,0,CW,CH);
  const bg=TCT.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#1c0e06');bg.addColorStop(.5,'#130a04');bg.addColorStop(1,'#0d0703');
  TCT.fillStyle=bg;TCT.fillRect(0,0,CW,CH);
  
  TCT.strokeStyle='#c8922a';TCT.lineWidth=10;TCT.strokeRect(6,6,CW-12,CH-12);
  TCT.strokeStyle='#e8c060';TCT.lineWidth=2.5;TCT.strokeRect(18,18,CW-36,CH-36);
  
  [[26,26],[CW-26,26],[26,CH-26],[CW-26,CH-26]].forEach(([ox,oy])=>{
    TCT.fillStyle='#c8922a';TCT.beginPath();TCT.arc(ox,oy,7,0,Math.PI*2);TCT.fill();
    TCT.strokeStyle='rgba(232,192,96,.4)';TCT.lineWidth=1;TCT.beginPath();TCT.arc(ox,oy,14,0,Math.PI*2);TCT.stroke();
  });
  
  TCT.font='58px serif';TCT.textAlign='center';TCT.fillText('\uD83D\uDC51',CW/2,78);
  TCT.fillStyle='rgba(200,168,80,.72)';TCT.font='italic 17px Georgia,serif';TCT.fillText('\u2736  THE KINGDOM AWAITS  \u2736',CW/2,108);
  TCT.fillStyle='rgba(200,168,80,.72)';TCT.font='italic 13px Georgia,serif';TCT.fillText('\u2736  THERE IS A PRETTY PRINCESS TRYING TO PEEP, BUT ALAS! THE SERVER DOES NOT UNDERSTAND BEAUTY  \u2736',CW/2,130);
  TCT.strokeStyle='rgba(200,146,42,.3)';TCT.lineWidth=1;TCT.beginPath();TCT.moveTo(44,145);TCT.lineTo(CW-44,145);TCT.stroke();
  
  if(!isBday(getIST())){
    const cd=cdData();
    TCT.shadowColor='rgba(232,192,96,.55)';TCT.shadowBlur=26;
    TCT.fillStyle='#e8c060';TCT.font='bold 128px Georgia,serif';TCT.fillText(String(cd.days),CW/2,272);
    TCT.shadowBlur=0;
    TCT.fillStyle='#c8a850';TCT.font='bold 21px Georgia,serif';TCT.fillText('D  A  Y  S',CW/2,308);
    TCT.strokeStyle='rgba(200,146,42,.28)';TCT.lineWidth=1;TCT.beginPath();TCT.moveTo(80,326);TCT.lineTo(CW-80,326);TCT.stroke();
    TCT.fillStyle='#f0d878';TCT.font='bold 60px Georgia,serif';
    TCT.fillText(pad2(cd.h)+' : '+pad2(cd.m)+' : '+pad2(cd.s),CW/2,394);
    TCT.fillStyle='rgba(180,158,98,.58)';TCT.font='15px Georgia,serif';
    [['HRS',138],['MIN',256],['SEC',372]].forEach(([l,x])=>TCT.fillText(l,x,418));
  } else {
    TCT.fillStyle='#e8c060';TCT.font='bold 40px Georgia,serif';TCT.fillText('Happy Birthday',CW/2,240);
    TCT.font='52px serif';TCT.fillText('\uD83D\uDC51',CW/2,308);
  }
  
  TCT.strokeStyle='rgba(200,146,42,.28)';TCT.lineWidth=1;TCT.beginPath();TCT.moveTo(44,440);TCT.lineTo(CW-44,440);TCT.stroke();
  TCT.fillStyle='rgba(200,168,98,.58)';TCT.font='italic 17px Georgia,serif';TCT.fillText('for princess tanya',CW/2,465);
  TCT.fillStyle='rgba(232,192,96,.45)';TCT.font='18px serif';TCT.fillText('\u2736',78,465);TCT.fillText('\u2736',CW-78,465);
  timerTex.needsUpdate=true;
}

// Gate doors (pivot groups)
let doorPL,doorPR;
function buildGate(){
  const GZ=GATE_Z,aM=ms(0x5a4030,.88);
  put(bx(.55,WH,.5,aM),-2.35,WH/2,GZ);put(bx(.55,WH,.5,aM),2.35,WH/2,GZ);
  put(bx(5.5,.55,.5,aM),0,WH+.22,GZ);
  for(let a=0;a<=Math.PI;a+=Math.PI/8){const seg=bx(.5,.5,.5,aM);seg.position.set(Math.cos(a)*2.35,WH+.26+Math.sin(a)*1.52,GZ);scene.add(seg)}
  const dM=ms(0x4a2808,.9);
  
  doorPL=new THREE.Group();doorPL.position.set(-2,DH/2,GZ);
  const dL=bx(2,DH,.14,dM);dL.position.set(1,0,0);
  for(let y=-DH/2+.4;y<DH/2;y+=.72){const pk=bx(1.88,.08,.02,ms(0x3a1808,.95));pk.position.set(1,y,.08);dL.add(pk)}
  const rlL=new THREE.Mesh(new THREE.TorusGeometry(.14,.034,8,14),ms(0xc89030,.3,.9));rlL.position.set(.62,0,.1);dL.add(rlL);
  doorPL.add(dL);scene.add(doorPL);
  
  doorPR=new THREE.Group();doorPR.position.set(2,DH/2,GZ);
  const dR=bx(2,DH,.14,dM);dR.position.set(-1,0,0);
  for(let y=-DH/2+.4;y<DH/2;y+=.72){const pk=bx(1.88,.08,.02,ms(0x3a1808,.95));pk.position.set(-1,y,.08);dR.add(pk)}
  const rlR=new THREE.Mesh(new THREE.TorusGeometry(.14,.034,8,14),ms(0xc89030,.3,.9));rlR.position.set(-.62,0,.1);dR.add(rlR);
  doorPR.add(dR);scene.add(doorPR);
  
  put(bx(16,WH,.06,ms(0x030108,.99)),0,WH/2,GZ+.22);
  
  const timerMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.9,3.9),new THREE.MeshBasicMaterial({map:timerTex,transparent:true,side:THREE.DoubleSide}));
  timerMesh.position.set(0,DH/2,GZ-.1);
  timerMesh.rotation.y=Math.PI; 
  scene.add(timerMesh);
  
  const gL=new THREE.PointLight(0xffdd88,.9,7);gL.position.set(0,2,GZ-1.5);scene.add(gL);
  TORCHES.push({li:gL,fl:null,base:.9,t:2});
  addCol(-2.35,2.35,GZ-.2,GZ+.2);
  drawTimer();setInterval(drawTimer,1000);
}

// ═══════════════ PLAYER + CONTROLS ════════════════════════════
const player={x:0,y:1.65,z:0,yaw:0,pitch:0};
const keys={};
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')tryInteract()});
document.addEventListener('keyup',e=>delete keys[e.code]);
// Mouse look
let dlook=false,dlx=0,dly=0;
canvas.addEventListener('mousedown',e=>{dlook=true;dlx=e.clientX;dly=e.clientY});
document.addEventListener('mouseup',()=>dlook=false);
document.addEventListener('mousemove',e=>{if(!dlook||gameActive)return;player.yaw-=(e.clientX-dlx)*.003;player.pitch-=(e.clientY-dly)*.002;player.pitch=Math.max(-.65,Math.min(.6,player.pitch));dlx=e.clientX;dly=e.clientY});
canvas.addEventListener('touchstart',e=>{dlook=true;dlx=e.touches[0].clientX;dly=e.touches[0].clientY},{passive:true});
canvas.addEventListener('touchmove',e=>{if(!dlook||gameActive)return;player.yaw-=(e.touches[0].clientX-dlx)*.004;player.pitch-=(e.touches[0].clientY-dly)*.003;player.pitch=Math.max(-.65,Math.min(.6,player.pitch));dlx=e.touches[0].clientX;dly=e.touches[0].clientY},{passive:true});
canvas.addEventListener('touchend',()=>dlook=false);

// Joysticks
const joy={l:{dx:0,dy:0},r:{dx:0,dy:0}};
function setupJoy(eId,kId,side){
  const el=document.getElementById(eId),kn=document.getElementById(kId),R=44;
  let active=false,tid=-1;
  const gc=()=>{const r=el.getBoundingClientRect();return{cx:r.left+r.width/2,cy:r.top+r.height/2}};
  const onS=e=>{e.preventDefault();active=true;const t=e.touches?e.touches[0]:e;tid=t.identifier??-1};
  const onM=e=>{if(!active)return;e.preventDefault();const t=e.touches?Array.from(e.touches).find(x=>x.identifier===tid)||e.touches[0]:e;const{cx,cy}=gc();let dx=t.clientX-cx,dy=t.clientY-cy;const d=Math.sqrt(dx*dx+dy*dy);if(d>R){dx=dx/d*R;dy=dy/d*R}kn.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;joy[side].dx=dx/R;joy[side].dy=dy/R};
  const onE=e=>{e.preventDefault();active=false;kn.style.transform='translate(-50%,-50%)';joy[side].dx=0;joy[side].dy=0};
  el.addEventListener('touchstart',onS,{passive:false});el.addEventListener('touchmove',onM,{passive:false});el.addEventListener('touchend',onE,{passive:false});
  el.addEventListener('mousedown',e=>{active=true;onS(e);const mm=ev=>{onM(ev)};const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);onE(e)};document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu)});
}
setupJoy('jl','jlk','l');setupJoy('jr','jrk','r');
function movePlayer(){
  if(gameActive)return;
  const sp=.07;
  if(Math.abs(joy.r.dx)>.04)player.yaw-=joy.r.dx*.044;
  if(Math.abs(joy.r.dy)>.04){player.pitch-=joy.r.dy*.03;player.pitch=Math.max(-.65,Math.min(.6,player.pitch))}
  if(keys['ArrowLeft']||keys['KeyA'])player.yaw+=.038;
  if(keys['ArrowRight']||keys['KeyD'])player.yaw-=.038;
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();
  const right=new THREE.Vector3(-dir.z,0,dir.x);
  let mx=0,mz=0,moved=false;
  if(Math.abs(joy.l.dy)>.04){mx+=dir.x*(-joy.l.dy)*sp*1.7;mz+=dir.z*(-joy.l.dy)*sp*1.7}
  if(Math.abs(joy.l.dx)>.04){mx+=right.x*joy.l.dx*sp*1.7;mz+=right.z*joy.l.dx*sp*1.7}
  if(keys['KeyW']||keys['ArrowUp']){mx+=dir.x*sp;mz+=dir.z*sp}
  if(keys['KeyS']){mx-=dir.x*sp;mz-=dir.z*sp}
  if(mx||mz){
    if(canMove(player.x+mx,player.z)){player.x+=mx;moved=true;}
    if(canMove(player.x,player.z+mz)){player.z+=mz;moved=true;}
    if(moved && performance.now() - lastStepTime > 400){playSound('step');lastStepTime=performance.now();}
  }
}

// ── INTERACT ──────────────────────────────────────────────────
function checkInteracts(){
  nearI=null;let best=Infinity;
  IACTS.forEach(o=>{const d=Math.hypot(player.x-o.x,player.z-o.z);if(d<o.r&&d<best){best=d;nearI=o}});
  const ip=document.getElementById('ip');
  if(nearI&&!gameActive){ip.style.display='block';ip.textContent=nearI.label}else ip.style.display='none';
}
function tryInteract(){
  if(nearI&&!gameActive){
    playSound('interact');
    launchGame(nearI.game);
  }
}
canvas.addEventListener('click',tryInteract);

// ── MINIMAP ───────────────────────────────────────────────────
const mmCv=document.getElementById('mm');mmCv.width=110;mmCv.height=110;
const mmCtx=mmCv.getContext('2d');
const RMAP=[{x:-15,z:0,w:14,d:16,c:'#1a1208'},{x:15,z:0,w:14,d:16,c:'#0a1414'},{x:0,z:-15,w:16,d:14,c:'#0e0816'},{x:0,z:15,w:16,d:14,c:'#0a1208'},{x:0,z:0,w:16,d:16,c:'#1a1008'}];
function renderMM(){
  mmCtx.clearRect(0,0,110,110);const SC=110/52,OX=26,OZ=26;
  RMAP.forEach(r=>{mmCtx.fillStyle=r.c;mmCtx.fillRect((r.x-r.w/2+OX)*SC,(r.z-r.d/2+OZ)*SC,r.w*SC,r.d*SC);mmCtx.strokeStyle='rgba(232,192,96,.15)';mmCtx.lineWidth=.5;mmCtx.strokeRect((r.x-r.w/2+OX)*SC,(r.z-r.d/2+OZ)*SC,r.w*SC,r.d*SC)});
  IACTS.forEach(o=>{mmCtx.fillStyle='rgba(232,192,96,.48)';mmCtx.beginPath();mmCtx.arc((o.x+OX)*SC,(o.z+OZ)*SC,2.5,0,Math.PI*2);mmCtx.fill()});
  mmCtx.fillStyle='#e8c060';mmCtx.beginPath();mmCtx.arc((player.x+OX)*SC,(player.z+OZ)*SC,3.5,0,Math.PI*2);mmCtx.fill();
  const ax=Math.sin(-player.yaw)*9,az=Math.cos(player.yaw)*9;
  mmCtx.strokeStyle='#e8c060';mmCtx.lineWidth=1.5;mmCtx.beginPath();mmCtx.moveTo((player.x+OX)*SC,(player.z+OZ)*SC);mmCtx.lineTo((player.x+OX)*SC+ax,(player.z+OZ)*SC+az);mmCtx.stroke();
}

// ── ROOM LABEL ────────────────────────────────────────────────
const RZONES=[{n:'✦ Library',xmn:-22,xmx:-8,zmn:-8,zmx:8},{n:'✦ Alchemy Lab',xmn:8,xmx:22,zmn:-8,zmx:8},{n:'✦ Throne Room',xmn:-8,xmx:8,zmn:-22,zmx:-8},{n:'✦ Game Room',xmn:-8,xmx:8,zmn:8,zmx:22},{n:'✦ Main Hall',xmn:-8,xmx:8,zmn:-8,zmx:8}];
let lastRoom='';
function checkRoom(){
  for(const z of RZONES){if(player.x>=z.xmn&&player.x<z.xmx&&player.z>=z.zmn&&player.z<z.zmx){if(z.n!==lastRoom){lastRoom=z.n;const el=document.getElementById('rl');el.style.opacity='0';setTimeout(()=>{el.textContent=z.n;el.style.opacity='1'},280);setTimeout(()=>el.style.opacity='0',3400)}return}}
}

// ═══════════════ MINI-GAMES ════════════════════════════════════
let activeRAF=null;
function openG(title,sub){
  document.getElementById('gt').textContent=title;document.getElementById('gs').textContent=sub;
  document.getElementById('gsc').textContent='';document.getElementById('gm').textContent='';
  document.getElementById('gc').style.display='none';document.getElementById('mg').style.display='none';document.getElementById('qw').style.display='none';
  document.getElementById('go').style.display='flex';
  document.getElementById('jl').style.opacity='0';document.getElementById('jr').style.opacity='0';
  gameActive=true;
}
function closeG(){
  document.getElementById('go').style.display='none';
  document.getElementById('jl').style.opacity='1';document.getElementById('jr').style.opacity='1';
  gameActive=false;if(activeRAF){cancelAnimationFrame(activeRAF);activeRAF=null}
}
document.getElementById('gcl').onclick=closeG;
function launchGame(t){
  if(t==='clicker')return launchExtGame('Clicker Heroes','https://cdn.clickerheroes.com/gamebuild/index.php','clicker');
  if(t==='g2048')return launchExtGame('2048','https://elgoog.im/2048/','g2048');
  if(t==='fbwg')return launchExtGame('Fireboy & Watergirl','https://amhooman.github.io/fireboywatergirl/game.html');
  ({riddle:gameRiddle,memory:gameMemory,potion:gamePotion,fortune:gameFortune,quiz:gameQuiz,darts:gameDarts,catch:gameCatch})[t]?.();
}

function launchExtGame(title, url, type){
  document.getElementById('go').style.display='none';
  gameActive=true;
  document.getElementById('jl').style.opacity='0';
  document.getElementById('jr').style.opacity='0';
  document.getElementById('ip').style.display='none';

  const overlay=document.createElement('div');
  overlay.id='ext-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:800;background:#000;display:flex;flex-direction:column;font-family:Cinzel,serif';

  const bar=document.createElement('div');
  bar.style.cssText='padding:8px 16px;background:#0a0604;border-bottom:1px solid rgba(232,192,96,.2);display:flex;justify-content:space-between;align-items:center;flex-shrink:0';
  bar.innerHTML='<span style="color:#e8c060;font-size:.72rem;letter-spacing:2px">✦ '+title+' ✦</span>';
  const closeBtn=document.createElement('button');
  closeBtn.textContent='✕ Back to Castle';
  closeBtn.style.cssText='background:transparent;border:1px solid rgba(232,192,96,.4);color:#e8c060;padding:5px 16px;border-radius:16px;cursor:pointer;font-family:Cinzel,serif;font-size:.65rem;letter-spacing:1px';
  closeBtn.onclick=()=>{overlay.remove();gameActive=false;document.getElementById('jl').style.opacity='1';document.getElementById('jr').style.opacity='1'};
  bar.appendChild(closeBtn);
  overlay.appendChild(bar);

  const frame=document.createElement('iframe');
  frame.src=url;
  frame.style.cssText='flex:1;border:none;width:100%;background:#111';
  frame.allow='fullscreen autoplay';
  frame.setAttribute('allowfullscreen','');
  overlay.appendChild(frame);

  const notice=document.createElement('div');
  notice.id='iframe-notice';
  notice.style.cssText='position:absolute;inset:0;top:42px;display:none;flex-direction:column;align-items:center;justify-content:center;background:#050208;gap:14px;pointer-events:none';
  notice.innerHTML='<div style="font-size:2rem">🎮</div><div style="color:#e8c060;font-size:.9rem;letter-spacing:2px">'+title+'</div><div style="color:#8a7a5a;font-size:.72rem;max-width:280px;text-align:center;line-height:1.8">This game blocks direct embedding. Tap the button below to open it in a new tab.</div>';
  const openBtn=document.createElement('button');
  openBtn.textContent='✦ Open '+title+' in New Tab';
  openBtn.style.cssText='padding:10px 24px;background:transparent;border:1px solid rgba(232,192,96,.5);color:#e8c060;font-family:Cinzel,serif;font-size:.72rem;letter-spacing:2px;border-radius:20px;cursor:pointer;pointer-events:all';
  openBtn.onclick=()=>window.open(url,'_blank');
  notice.appendChild(openBtn);overlay.appendChild(notice);

  frame.onerror=()=>{notice.style.display='flex'};
  setTimeout(()=>{try{const t2=frame.contentWindow?.location?.href;if(!t2||t2==='about:blank'){notice.style.display='flex'}}catch(e){notice.style.display='flex'}},4000);

  document.body.appendChild(overlay);
}

// RIDDLE
const RIDDLES=[{q:'I dance without feet, glow without sun, born from wood, die in water.',a:'fire',h:'🔥'},{q:'The more you take, the more you leave behind. What am I?',a:'footsteps',h:'👣'},{q:'I have a crown but am not a queen. I have bark but no bite.',a:'tree',h:'🌲'},{q:'I speak without a mouth, hear without ears, and come alive with wind.',a:'echo',h:'🌬️'},{q:'I fly without wings, cry without eyes. Where I go, darkness follows.',a:'cloud',h:'☁️'}];
function gameRiddle(){
  const r=RIDDLES[Math.floor(Math.random()*RIDDLES.length)];openG('✦ The Riddle Scroll','Think carefully, wise princess...');
  const qw=document.getElementById('qw');qw.style.display='flex';qw.innerHTML='';
  const qd=document.createElement('div');qd.className='qt';qd.style.marginBottom='8px';qd.textContent=r.h+'  '+r.q;qw.appendChild(qd);
  const inp=document.createElement('input');inp.style.cssText='background:rgba(255,255,255,.06);border:1px solid rgba(232,192,96,.3);border-radius:20px;padding:8px 18px;color:#e8c060;font-family:Cinzel,serif;font-size:.82rem;text-align:center;outline:none;width:210px;letter-spacing:1px';inp.placeholder='your answer...';qw.appendChild(inp);
  const btn=document.createElement('button');btn.style.cssText='margin-top:7px;padding:8px 22px;background:transparent;border:1px solid rgba(232,192,96,.4);color:#e8c060;font-family:Cinzel,serif;font-size:.68rem;letter-spacing:2px;border-radius:20px;cursor:pointer';btn.textContent='✦ Submit';qw.appendChild(btn);
  const gm=document.getElementById('gm');
  btn.onclick=()=>{const a=inp.value.trim().toLowerCase();if(a===r.a||(r.a.split(' ').includes(a)&&a.length>2)){gm.style.color='#80c880';gm.textContent='✦ Correct! You are wise beyond measure, Princess! ✦';playSound('win');btn.disabled=true}else{gm.style.color='#c08080';gm.textContent='Not quite... try again 🤔';playSound('lose');inp.value='';inp.focus()}};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')btn.click()});
}

// MEMORY
function gameMemory(){
  openG('✦ Memory of the Realm','Find all matching pairs!');
  const mg=document.getElementById('mg');mg.style.cssText='display:grid;grid-template-columns:repeat(4,62px);gap:7px';
  const EM=['🌸','🦋','🌙','⭐','🔮','💎','🌺','👑'];const pairs=[...EM,...EM];
  for(let i=pairs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]]}
  let flipped=[],matched=0,locked=false;
  pairs.forEach((em)=>{
    const c=document.createElement('div');c.className='mc';c.dataset.e=em;
    c.onclick=()=>{if(locked||c.classList.contains('fl')||c.classList.contains('dn'))return;c.textContent=em;c.classList.add('fl');playSound('click');flipped.push(c);
      if(flipped.length===2){locked=true;if(flipped[0].dataset.e===flipped[1].dataset.e){flipped[0].classList.add('dn');flipped[1].classList.add('dn');flipped=[];locked=false;matched+=2;document.getElementById('gsc').textContent='Matched: '+(matched/2)+' / '+EM.length;if(matched===pairs.length){playSound('win');document.getElementById('gm').style.color='#80c880';document.getElementById('gm').textContent='✦ You remembered them all! The realm is yours! ✦'}else{playSound('interact');}}else{playSound('lose');setTimeout(()=>{flipped[0].textContent='';flipped[0].classList.remove('fl');flipped[1].textContent='';flipped[1].classList.remove('fl');flipped=[];locked=false},820)}}};
    mg.appendChild(c);
  });
}

// POTION
function gamePotion(){
  const sz=Math.min(innerWidth*.85,305);const gcv=document.getElementById('gc');gcv.width=sz;gcv.height=sz;gcv.style.display='block';openG('✦ The Potion Mixer','Pick 2 to match the target!');
  const gct=gcv.getContext('2d'),cols=['#cc44ee','#22ee88','#eeee22','#ff4444','#4488ff'];
  const tgts=[[0,1],[0,2],[1,3],[2,4],[3,0],[1,4]];
  const mc=(a,b)=>{const p=c=>{const h=parseInt(c.replace('#',''),16);return[(h>>16)&255,(h>>8)&255,h&255]};const[r1,g1,b1]=p(a),[r2,g2,b2]=p(b);return'rgb('+Math.round((r1+r2)/2)+','+Math.round((g1+g2)/2)+','+Math.round((b1+b2)/2)+')'};
  let tgt=tgts[Math.floor(Math.random()*tgts.length)],picked=[];
  const draw=()=>{gct.fillStyle='#04060f';gct.fillRect(0,0,sz,sz);const cx=sz/2,cy=sz*.38,tr=36;const tMx=mc(cols[tgt[0]],cols[tgt[1]]);const tg=gct.createRadialGradient(cx-7,cy-7,1,cx,cy,tr);tg.addColorStop(0,'rgba(255,255,255,.22)');tg.addColorStop(1,tMx.replace('rgb','rgba').replace(')',',0.9)'));gct.fillStyle=tg;gct.beginPath();gct.arc(cx,cy,tr,0,Math.PI*2);gct.fill();gct.strokeStyle='rgba(255,255,255,.22)';gct.lineWidth=1.5;gct.beginPath();gct.arc(cx,cy,tr,0,Math.PI*2);gct.stroke();gct.fillStyle='rgba(255,255,255,.4)';gct.font='11px Cinzel';gct.textAlign='center';gct.fillText('Target',cx,cy+tr+15);cols.forEach((c,i)=>{const bx2=20+i*(sz-40)/4,by=sz*.74;gct.fillStyle=picked.includes(i)?'rgba(255,255,255,.15)':'rgba(0,0,0,.35)';gct.strokeStyle=picked.includes(i)?'#e8c060':'rgba(255,255,255,.18)';gct.lineWidth=2;gct.beginPath();gct.arc(bx2,by,21,0,Math.PI*2);gct.fill();gct.stroke();const pg=gct.createRadialGradient(bx2-5,by-5,1,bx2,by,18);pg.addColorStop(0,'rgba(255,255,255,.22)');pg.addColorStop(1,c);gct.fillStyle=pg;gct.beginPath();gct.arc(bx2,by,17,0,Math.PI*2);gct.fill()});if(picked.length===2){const mx=mc(cols[picked[0]],cols[picked[1]]);const mg2=gct.createRadialGradient(cx-7,sz*.56-7,1,cx,sz*.56,24);mg2.addColorStop(0,'rgba(255,255,255,.22)');mg2.addColorStop(1,mx.replace('rgb','rgba').replace(')',',0.9)'));gct.fillStyle=mg2;gct.beginPath();gct.arc(cx,sz*.56,24,0,Math.PI*2);gct.fill();gct.fillStyle='rgba(255,255,255,.35)';gct.font='11px Cinzel';gct.fillText('Your Mix',cx,sz*.56+38)}gct.fillStyle='rgba(255,255,255,.25)';gct.font='11px Lato';gct.textAlign='center';gct.fillText('tap 2 potions to mix',cx,sz*.88)};
  draw();gcv.onclick=e=>{if(picked.length>=2)return;const rc=gcv.getBoundingClientRect();const mx=e.clientX-rc.left,my=e.clientY-rc.top;cols.forEach((_,i)=>{const bx2=20+i*(sz-40)/4,by=sz*.74;if(Math.hypot(mx-bx2,my-by)<22&&!picked.includes(i)){picked.push(i);playSound('click');draw()}});if(picked.length===2){setTimeout(()=>{const ok=picked.includes(tgt[0])&&picked.includes(tgt[1]);const gm=document.getElementById('gm');gm.style.color=ok?'#80c880':'#c08080';gm.textContent=ok?'✦ Perfect brew! Alchemy mastered! ✦':'Close, but not quite... try again!';if(ok)playSound('win');else playSound('lose');setTimeout(()=>{picked=[];tgt=tgts[Math.floor(Math.random()*tgts.length)];gm.textContent='';draw()},2000)},400)}};
}

// FORTUNE
const FORTS=['The stars whisper of great adventures awaiting you, Princess Tanya. \u2736','Your kindness is a crown no one can ever take from you. Wear it always. \uD83D\uDC51','A beautiful journey begins the moment you take the first brave step. \uD83C\uDF1F','Those who love you see your light even on your darkest days. \uD83C\uDF19','The universe conspires in your favour \u2014 today and every day. \u2728','Your laughter is the most magical spell in this enchanted realm. \uD83C\uDF38','Great things are coming \u2014 joy, love, and adventure await! \uD83D\uDD2E'];
function gameFortune(){
  const sz=Math.min(innerWidth*.85,292);const gcv=document.getElementById('gc');gcv.width=sz;gcv.height=sz;gcv.style.display='block';openG('\u2736 The Mystic Orb','Gaze into the orb for your fortune...');
  const gct=gcv.getContext('2d');let fort='',op=0,fr=0;
  const draw=()=>{fr++;gct.fillStyle='#020510';gct.fillRect(0,0,sz,sz);const cx=sz/2,cy=sz*.42;const og=gct.createRadialGradient(cx,cy,0,cx,cy,88);og.addColorStop(0,'rgba(100,100,255,'+(0.22+Math.sin(fr*.04)*.07)+')');og.addColorStop(1,'rgba(0,0,0,0)');gct.fillStyle=og;gct.beginPath();gct.arc(cx,cy,88,0,Math.PI*2);gct.fill();const os=gct.createRadialGradient(cx-15,cy-15,3,cx,cy,60);os.addColorStop(0,'rgba(180,180,255,.9)');os.addColorStop(.44,'rgba(80,80,220,.7)');os.addColorStop(1,'rgba(20,20,100,.32)');gct.fillStyle=os;gct.beginPath();gct.arc(cx,cy,60,0,Math.PI*2);gct.fill();gct.save();gct.translate(cx,cy);for(let i=0;i<3;i++){gct.strokeStyle='rgba(155,155,255,'+(0.22+i*.07)+')';gct.lineWidth=1.1;gct.beginPath();gct.ellipse(0,0,40+i*10,16+i*5,fr*.018+i*1.1,0,Math.PI*2);gct.stroke()}gct.restore();if(fort){if(op<1)op+=.014;gct.fillStyle='rgba(230,210,160,'+op+')';gct.font='12px Lato';gct.textAlign='center';const ws=fort.split(' ');let ln='',y=sz*.79;ws.forEach(w=>{const t=ln+w+' ';if(gct.measureText(t).width>sz*.8&&ln){gct.fillText(ln.trim(),cx,y);ln=w+' ';y+=16}else ln=t});if(ln)gct.fillText(ln.trim(),cx,y)}else{gct.fillStyle='rgba(175,155,215,.5)';gct.font='12px Cinzel';gct.textAlign='center';gct.fillText('tap the orb...',cx,sz*.75)}activeRAF=requestAnimationFrame(draw)};
  draw();gcv.onclick=()=>{playSound('interact');fort=FORTS[Math.floor(Math.random()*FORTS.length)];op=0};
}

// QUIZ
const QUIZ=[{q:'What element does gold represent in alchemy?',opts:['Fire','Earth','Wealth','Water'],a:2},{q:"A princess's most powerful weapon is...?",opts:['A sword','Kindness','Magic wand','Gold'],a:1},{q:'Which constellation is called "The Queen"?',opts:['Orion','Cassiopeia','Cygnus','Perseus'],a:1},{q:'In which direction does the sun rise?',opts:['West','North','South','East'],a:3},{q:'A true queen is known by her...?',opts:['Wealth','Crown','Character','Castle'],a:2},{q:'What does "Tanya" mean in Sanskrit?',opts:['Warrior','Fairy Queen','Star','Of the Forest'],a:1}];
function gameQuiz(){
  openG('\u2736 The Royal Quiz','Test your wisdom, Princess!');
  const qw=document.getElementById('qw');qw.style.display='flex';qw.innerHTML='';let qi=0,score=0;
  const showQ=()=>{qw.innerHTML='';if(qi>=QUIZ.length){document.getElementById('gsc').textContent='Score: '+score+'/'+QUIZ.length+' \u2736';const gm=document.getElementById('gm');if(score>=4){gm.style.color='#e8c060';gm.textContent=score===QUIZ.length?'\u2736 Perfect! A truly wise queen! \u2736':'\u2736 Well done, Princess! \u2736';playSound('win');}else{gm.style.color='#c08080';gm.textContent='Keep studying the royal scrolls! \uD83D\uDCDC';playSound('lose');}return}const q=QUIZ[qi];const qd=document.createElement('div');qd.className='qt';qd.textContent=(qi+1)+'. '+q.q;qw.appendChild(qd);q.opts.forEach((opt,i)=>{const btn=document.createElement('button');btn.className='qo';btn.textContent=opt;btn.onclick=()=>{qw.querySelectorAll('.qo').forEach(b=>b.disabled=true);if(i===q.a){score++;btn.style.background='rgba(80,200,80,.18)';btn.style.borderColor='#70c870'}else{btn.style.background='rgba(200,80,80,.18)';btn.style.borderColor='#c08080';qw.querySelectorAll('.qo')[q.a].style.background='rgba(80,200,80,.12)'};document.getElementById('gsc').textContent=(qi+1)+'/'+QUIZ.length;qi++;setTimeout(showQ,900)};qw.appendChild(btn)})};showQ();
}

// DARTS
function gameDarts(){
  const sz=Math.min(innerWidth*.85,308);const gcv=document.getElementById('gc');gcv.width=sz;gcv.height=sz;gcv.style.display='block';openG('\u2736 Royal Darts','Tap to throw \u2014 time your aim!');
  const gct=gcv.getContext('2d');let throws=6,score=0,aim=0,aimD=1,darts=[],fr=0;
  const draw=()=>{fr++;gct.fillStyle='#040810';gct.fillRect(0,0,sz,sz);const cx=sz*.5,cy=sz*.41;[[86,'#1a2a1a'],[66,'#c80000'],[45,'#1a2a1a'],[28,'#c80000'],[13,'#f0f0f0'],[5,'#111']].forEach(([r,c])=>{gct.fillStyle=c;gct.beginPath();gct.arc(cx,cy,r,0,Math.PI*2);gct.fill();gct.strokeStyle='rgba(255,255,255,.1)';gct.lineWidth=.5;gct.beginPath();gct.arc(cx,cy,r,0,Math.PI*2);gct.stroke()});for(let a=0;a<Math.PI*2;a+=Math.PI/10){gct.strokeStyle='rgba(255,255,255,.08)';gct.lineWidth=.5;gct.beginPath();gct.moveTo(cx,cy);gct.lineTo(cx+Math.cos(a)*86,cy+Math.sin(a)*86);gct.stroke()}darts.forEach(d=>{gct.fillStyle='#c8922a';gct.beginPath();gct.arc(d.x,d.y,4,0,Math.PI*2);gct.fill();gct.fillStyle='#fff';gct.beginPath();gct.arc(d.x,d.y,1.5,0,Math.PI*2);gct.fill()});aim+=.044*aimD;if(aim>1.12||aim<-1.12)aimD*=-1;const ax=cx+Math.sin(aim)*sz*.36,ay=sz*.93;gct.setLineDash([4,4]);gct.strokeStyle='rgba(232,192,96,.36)';gct.lineWidth=1.1;gct.beginPath();gct.moveTo(ax,ay);gct.lineTo(cx,cy);gct.stroke();gct.setLineDash([]);gct.fillStyle='rgba(232,192,96,.85)';gct.beginPath();gct.arc(ax,ay,5,0,Math.PI*2);gct.fill();gct.fillStyle='rgba(232,192,96,.68)';gct.font='12px Cinzel';gct.textAlign='center';if(throws>0)gct.fillText(throws+' throws \u00b7 Score: '+score,cx,sz*.91);else gct.fillText('Final: '+score+' \u2014 tap to replay',cx,sz*.91);activeRAF=requestAnimationFrame(draw)};
  draw();const throwDart=e=>{e.preventDefault();if(throws===0){darts=[];throws=6;score=0;document.getElementById('gsc').textContent='';document.getElementById('gm').textContent='';return}const cx=sz*.5,cy=sz*.41;const tx=cx+Math.sin(aim)*sz*.36+(Math.random()-.5)*13,ty=cy+(Math.random()-.5)*13;darts.push({x:tx,y:ty});throws--;const dist=Math.hypot(tx-cx,ty-cy);const pts=dist<5?50:dist<13?22:dist<28?12:dist<45?6:dist<66?2:1;score+=pts;playSound('click');document.getElementById('gsc').textContent='+'+pts+' pts! Total: '+score;if(throws===0){const gm=document.getElementById('gm');gm.style.color='#e8c060';gm.textContent=score>=130?'\u2736 Bullseye Queen! Perfect aim! \u2736':score>=75?'\u2736 Excellent shots, Princess! \u2736':'Practice makes perfect! \uD83C\uDFAF';if(score>=75)playSound('win');else playSound('lose');}};
  gcv.addEventListener('click',throwDart);gcv.addEventListener('touchend',throwDart,{passive:false});
}

// CATCH
function gameCatch(){
  const sz=Math.min(innerWidth*.85,328),gh=Math.round(sz*.8);const gcv=document.getElementById('gc');gcv.width=sz;gcv.height=gh;gcv.style.display='block';openG('\u2736 Catch the Stars','Catch \u2B50 and dodge \uD83D\uDCA3!');
  const gct=gcv.getContext('2d');let basket={x:sz/2,w:72,h:13},items=[],sc=0,lives=3,spd=2.1,sf=58,fr=0;
  const spawn=()=>items.push({x:14+Math.random()*(sz-28),y:-20,type:Math.random()<.72?'star':'bomb',vy:spd+Math.random()*1.4,r:Math.random()*Math.PI*2});
  const draw=()=>{fr++;if(fr%sf===0)spawn();if(fr%280===0&&spd<7){spd+=.22;sf=Math.max(28,sf-3)}gct.fillStyle='#04060f';gct.fillRect(0,0,sz,gh);if(fr%12===0){gct.fillStyle='rgba(255,255,255,'+(0.25+Math.random()*.4)+')';gct.beginPath();gct.arc(Math.random()*sz,Math.random()*gh*.3,Math.random()*1.4,0,Math.PI*2);gct.fill()}gct.strokeStyle='#e8c060';gct.lineWidth=2;gct.fillStyle='rgba(200,150,30,.26)';gct.beginPath();gct.moveTo(basket.x-basket.w/2,gh-basket.h-3);gct.lineTo(basket.x+basket.w/2,gh-basket.h-3);gct.lineTo(basket.x+basket.w/2-7,gh-3);gct.lineTo(basket.x-basket.w/2+7,gh-3);gct.closePath();gct.fill();gct.stroke();let over=false;items=items.filter(it=>{it.y+=it.vy;it.r+=.055;gct.save();gct.translate(it.x,it.y);gct.rotate(it.r);gct.font='19px serif';gct.textAlign='center';gct.textBaseline='middle';gct.fillText(it.type==='star'?'\u2B50':'\uD83D\uDCA3',0,0);gct.restore();if(it.y>gh-basket.h-18&&it.y<gh-2&&Math.abs(it.x-basket.x)<basket.w/2+7){if(it.type==='star'){sc++;playSound('interact');}else{lives--;playSound('lose');if(lives<=0)over=true}return false}if(it.y>gh+22){if(it.type==='star'){lives--;playSound('lose');if(lives<=0)over=true}return false}return true});if(over){document.getElementById('gm').style.color='#c08080';document.getElementById('gm').textContent='Game over! Score: '+sc+' \u2736';cancelAnimationFrame(activeRAF);activeRAF=null;return}gct.fillStyle='#e8c060';gct.font='13px Cinzel';gct.textAlign='left';gct.fillText('\u2B50 '+sc,7,21);gct.textAlign='right';gct.fillText('\u2764\uFE0F'.repeat(Math.max(0,lives)),sz-7,21);document.getElementById('gsc').textContent='Score: '+sc;activeRAF=requestAnimationFrame(draw)};
  draw();gcv.addEventListener('mousemove',e=>{const rc=gcv.getBoundingClientRect();basket.x=e.clientX-rc.left});gcv.addEventListener('touchmove',e=>{e.preventDefault();const rc=gcv.getBoundingClientRect();basket.x=e.touches[0].clientX-rc.left},{passive:false});
}

// ═══════════════ GATE OPENING ═════════════════════════════════
let gateOpen=false,gateAng=0;
function openGate(){
  gateOpen=true;
  document.getElementById('ht').style.opacity='0';
  playSound('gate');
}

// ═══════════════ OUTDOOR SCENE ════════════════════════════════
const outScene=new THREE.Scene();
const outCam=new THREE.PerspectiveCamera(72,W/H,.1,1200);
outCam.position.set(0,1.65,0);outCam.rotation.order='YXZ';outCam.rotation.y=Math.PI;
let outMode=false,outFr=0,outPetals=[],outBreeze=null;

function buildOutdoor(){
  const ist=getIST(),hr=ist.getHours(),isN=hr<6||hr>=18;
  const skyC=isN?0x050a18:hr<10?0x4a90d9:hr<14?0x1a6ab8:hr<18?0x2a5a9a:0x050a18;
  outScene.background=new THREE.Color(skyC);outScene.fog=new THREE.FogExp2(skyC,.005);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600,40,40),new THREE.MeshLambertMaterial({color:0x3a6a18}));ground.rotation.x=-Math.PI/2;ground.position.y=-2;outScene.add(ground);
  function mkM(x,z,h,w,c){const g=new THREE.ConeGeometry(w,h,7+Math.floor(Math.random()*4));const vv=g.attributes.position;for(let i=0;i<vv.count;i++)if(vv.getY(i)<h*.3){vv.setX(i,vv.getX(i)*(1+(Math.random()-.5)*.35));vv.setZ(i,vv.getZ(i)*(1+(Math.random()-.5)*.35))}g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:c}));m.position.set(x,h/2-2,z);outScene.add(m);if(h>40){const sc=new THREE.Mesh(new THREE.ConeGeometry(w*.22,h*.17,6),new THREE.MeshLambertMaterial({color:0xeeeeff}));sc.position.set(x,h-2,z);outScene.add(sc)}}
  [[-200,320,85,58,0x8aaab8],[0,350,98,72,0x6a8a9a],[200,310,72,52,0x8aaab8],[-90,340,62,44,0x9ab0be],[100,360,57,40,0x9ab0be],[-260,330,68,46,0x8aaab8],[260,325,74,50,0x7a9aaa],[-130,250,56,38,0x6a8a7a],[70,230,46,32,0x5a7a8a],[-210,242,52,36,0x607080],[210,262,62,42,0x5a7080],[-85,160,36,26,0x4a6a5a],[25,182,42,30,0x3a5a6a],[155,172,32,22,0x4a5a6a]].forEach(a=>mkM(...a));
  function mkTree(x,z){const tg=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,1.4,7),new THREE.MeshLambertMaterial({color:0x5a3010}));tr.position.y=-.3;tg.add(tr);[[0,2,1.5],[.7,3,1.2],[1.4,3.8,.85]].forEach(([y,h2,r])=>{const c2=new THREE.Mesh(new THREE.ConeGeometry(r,h2,7),new THREE.MeshLambertMaterial({color:0x2a6a1a}));c2.position.y=y;tg.add(c2)});tg.position.set(x,-1,z);outScene.add(tg)}
  [[-30,30],[-28,48],[-42,65],[-35,85],[28,38],[32,58],[44,72],[-52,92],[52,92]].forEach(([x,z])=>mkTree(x,z));
  for(let i=0;i<220;i++){const fc=[0xff6b9d,0xffd700,0xff8c42,0xffffff,0xcc44ff][Math.floor(Math.random()*5)];const bloom=new THREE.Mesh(new THREE.SphereGeometry(.07+Math.random()*.05,6,6),new THREE.MeshLambertMaterial({color:fc}));bloom.position.set((Math.random()-.5)*110,-1.75,Math.random()*85+5);outScene.add(bloom)}
  const path2=new THREE.Mesh(new THREE.PlaneGeometry(3,200),new THREE.MeshLambertMaterial({color:0x8a6a40}));path2.rotation.x=-Math.PI/2;path2.position.set(0,-1.99,80);outScene.add(path2);
  if(isN){const sg=new THREE.BufferGeometry();const sp2=new Float32Array(2000*3);for(let i=0;i<2000;i++){const t=Math.random()*Math.PI*2,p=Math.acos(Math.random()*.9);sp2[i*3]=Math.sin(p)*Math.cos(t)*900;sp2[i*3+1]=Math.cos(p)*900;sp2[i*3+2]=Math.sin(p)*Math.sin(t)*900}sg.setAttribute('position',new THREE.BufferAttribute(sp2,3));outScene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6})))}
  const t2=(isN?(hr>=18?(hr-18)/10:(hr+6)/10):((hr-6)/13));
  const cel=new THREE.Mesh(new THREE.SphereGeometry(isN?14:20,16,16),new THREE.MeshBasicMaterial({color:isN?0xe8e8d0:0xfff5c8}));cel.position.set(-300+t2*600,80+Math.sin(Math.PI*t2)*240,250);outScene.add(cel);
  if(!isN){const glow2=new THREE.Mesh(new THREE.SphereGeometry(34,12,12),new THREE.MeshBasicMaterial({color:0xffee88,transparent:true,opacity:.12}));glow2.position.copy(cel.position);outScene.add(glow2)}
  outScene.add(new THREE.AmbientLight(isN?0x102030:0xfff0d0,isN?.45:1.1));
  const sun2=new THREE.DirectionalLight(isN?0x304060:0xfff0d0,isN?.3:1.1);sun2.position.copy(cel.position);outScene.add(sun2);
  const storm=(hr>=14&&hr<19||hr>=0&&hr<4)&&Math.random()>.5;
  for(let i=0;i<10;i++){const cg=new THREE.SphereGeometry(16+Math.random()*12,8,8);const cloud2=new THREE.Mesh(cg,new THREE.MeshLambertMaterial({color:storm?0x303040:0xffffff,transparent:true,opacity:storm?.75:.88}));cloud2.position.set((Math.random()-.5)*350,70+Math.random()*35,Math.random()*300-50);cloud2.scale.set(1.4+Math.random(),.35+Math.random()*.25,1+Math.random());cloud2.userData.drift=.008+Math.random()*.006;outScene.add(cloud2)}
  if(storm){const rg=new THREE.BufferGeometry();const rp=new Float32Array(3500*3);for(let i=0;i<3500;i++){rp[i*3]=(Math.random()-.5)*180;rp[i*3+1]=Math.random()*90;rp[i*3+2]=(Math.random()-.5)*180}rg.setAttribute('position',new THREE.BufferAttribute(rp,3));const rn=new THREE.Points(rg,new THREE.PointsMaterial({color:0xaabbd0,size:.28,transparent:true,opacity:.62}));rn.userData.isRain=true;outScene.add(rn)}
  const bg2=new THREE.BufferGeometry();const bp=new Float32Array(300*3);for(let i=0;i<300;i++){bp[i*3]=(Math.random()-.5)*90;bp[i*3+1]=-1+Math.random()*10;bp[i*3+2]=Math.random()*65}bg2.setAttribute('position',new THREE.BufferAttribute(bp,3));outBreeze=new THREE.Points(bg2,new THREE.PointsMaterial({color:0xd0e8f8,size:.14,transparent:true,opacity:.38}));outScene.add(outBreeze);
  for(let i=0;i<55;i++){const pm=new THREE.Mesh(new THREE.PlaneGeometry(.12,.08),new THREE.MeshLambertMaterial({color:[0xff9eb5,0xffcce0,0xffd700][i%3],side:THREE.DoubleSide,transparent:true,opacity:.8}));pm.position.set((Math.random()-.5)*65,1+Math.random()*7,Math.random()*42);pm.userData={vx:(Math.random()-.5)*.022,vy:-.006,sr:.04+Math.random()*.05};outPetals.push(pm);outScene.add(pm)}
}
const llght=new THREE.PointLight(0xaabeff,0,500);llght.position.set(0,200,100);outScene.add(llght);
let ltTimer=0;

// ═══════════════ CONSTELLATIONS ════════════════════════════════
const CONSTS=[
  {
    name: 'Scorpius', color: '#ff6b6b', 
    stars: [[50,20],[55,35],[60,50],[58,65],[50,75],[42,80],[35,75],[30,65],[40,55],[35,40]], 
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[2,8],[8,9]], 
    desc: 'The Scorpion blazes in the southern sky. Its heart, Antares, burns 700 times brighter than our own Sun, a beacon of raw, ancient power.', 
    bless: '✦ Like the ancient fire of Antares, your spirit burns bright, fierce, and utterly impossible to ignore. In every room you walk into you carry that same raw, radiant power—the kind that turns heads and warms hearts all at once. Never let anyone dim that flame, Princess. It was made to light the world.'
  },
  {
    name: 'Corona Borealis', color: '#c8f0ff', 
    stars: [[30,50],[40,35],[50,30],[60,35],[70,50],[65,65],[35,65]], 
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]], 
    desc: 'A perfect crown of seven stars—the universe\'s own jeweled tiara arcing gracefully overhead in the quiet of the night.', 
    bless: '✦ The cosmos itself paused and wove seven perfect stars into a crown—not for any ruler of legend, but for you, on this very night. It hangs in the sky right now, visible to all who look up, silently declaring that the universe already knows your worth. You were always the one it was made for. 👑'
  },
  {
    name: 'Virgo', color: '#ffe4b5', 
    stars: [[50,15],[45,30],[55,30],[35,45],[65,45],[40,60],[60,60],[50,75]], 
    lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7]], 
    desc: 'The celestial maiden graces the western heavens, with Spica blazing in brilliant blue-white radiance to guide the lost.', 
    bless: '✦ Virgo is not just grace—she is wisdom wrapped in warmth, a quiet strength that never needs to announce itself. That is you, Tanya. Your kindness is never small or ordinary; it leaves a lasting mark on every person you meet, long after the moment has passed. May this year return to you every ounce of the beauty you so freely give to others.'
  },
  {
    name: 'Boötes', color: '#ffa07a', 
    stars: [[50,10],[40,25],[60,25],[35,45],[65,45],[45,60],[55,60]], 
    lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,6]], 
    desc: 'Arcturus, the fourth brightest star in the night sky, stands as a fiery orange-red guardian at the celestial summit.', 
    bless: '✦ Arcturus has burned for over seven billion years—longer than our Earth has existed—and yet tonight it turns its ancient light directly toward you. The universe has always kept a guardian for those who truly deserve one, and yours has been watching faithfully all this time. May you always feel that steady, patient light at your back. ✦'
  },
  {
    name: 'Libra', color: '#a8d8a8', 
    stars: [[50,30],[35,50],[65,50],[40,70],[60,70]], 
    lines: [[0,1],[0,2],[1,3],[2,4],[3,4]], 
    desc: 'The Scales of Balance shine high above, a celestial promise that justice, harmony, and peace will always reign.', 
    bless: '✦ The Scales seek those rare souls with the gift of true balance—strong enough to hold others up, yet gentle enough to never let them fall. That is a grace you carry so naturally, Tanya. May this year restore your own equilibrium too, and fill every corner of your life with the peace, love, and joy you so quietly deserve.'
  },
  {
    name: 'Leo', color: '#ffd700', 
    stars: [[50,10],[38,20],[62,20],[30,35],[70,35],[45,50],[55,50],[50,65]], 
    lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7]], 
    desc: 'The majestic Lion descends westward, with Regulus blazing fiercely at his royal heart, commanding the night.', 
    bless: '✦ Leo does not ask permission to shine—it simply does, without apology or hesitation. Regulus has blazed at that lion\'s heart since before human eyes could name it, and tonight it blazes in recognition of yours. You were not made to be ordinary, Tanya. You were made to reign—and every star in this sky already knows it.'
  }
];

function showConst(){
  const panel=document.getElementById('cp'),grid=document.getElementById('cgr');grid.innerHTML='';panel.style.display='flex';
  CONSTS.forEach((c,i)=>{const card=document.createElement('div');card.className='cc';const cv2=document.createElement('canvas');cv2.width=116;cv2.height=116;const ct2=cv2.getContext('2d');const s=116;ct2.fillStyle='#030818';ct2.fillRect(0,0,s,s);ct2.strokeStyle=c.color+'50';ct2.lineWidth=.7;c.lines.forEach(([a,b])=>{ct2.beginPath();ct2.moveTo(c.stars[a][0]*s/100,c.stars[a][1]*s/100);ct2.lineTo(c.stars[b][0]*s/100,c.stars[b][1]*s/100);ct2.stroke()});c.stars.forEach(([px,py],si)=>{const sx2=px*s/100,sy2=py*s/100,sr2=si===0?3:1.7;const g=ct2.createRadialGradient(sx2,sy2,0,sx2,sy2,sr2*2.5);g.addColorStop(0,c.color);g.addColorStop(1,'transparent');ct2.beginPath();ct2.arc(sx2,sy2,sr2*2.5,0,Math.PI*2);ct2.fillStyle=g;ct2.fill();ct2.beginPath();ct2.arc(sx2,sy2,sr2*.45,0,Math.PI*2);ct2.fillStyle='#fff';ct2.fill()});card.appendChild(cv2);const nm=document.createElement('div');nm.className='cn';nm.textContent=c.name;card.appendChild(nm);const dc2=document.createElement('div');dc2.className='cd2';dc2.textContent=c.desc;card.appendChild(dc2);const bl=document.createElement('div');bl.className='cb2';bl.textContent=c.bless;card.appendChild(bl);grid.appendChild(card);setTimeout(()=>card.classList.add('s'),i*115)});
  document.getElementById('cclose').onclick=()=>{panel.style.display='none';showAfterConst()};
}

function showAfterConst(){
  const c=document.getElementById('bc');c.querySelector('.bbt')?.remove();let d=0;
[
    ['bdv',''],
    ['bli','On this beautiful day, the stars didn\'t just align—they danced, celebrating the exact moment you came into this world.'],
    ['bli','You carry a warmth that makes every room feel like home, and a spirit so bright it turns ordinary moments into memories worth keeping forever.'],
    ['bli','The world is genuinely so much better because you\'re in it, Tanya. Your kindness isn\'t small—it echoes. 🌟'],
    ['bdv',''],
    ['bhi','Tujhe dekh ke aisa lagta hai ki kuch log duniya mein honestly sirf khushiyan baantne ke liye aate hain—aur tu unme se ek hai.'],
    ['bhi','Meri bas yahi dua hai ki tu hamesha khush rahe, healthy rahe, aur jo bhi sapne hain tere—wo sab poore hon. 🌸'],
    ['bhi','Aur life mein chahe kuch bhi ho—apni wo pyari si smile aur apni "princess" wali vibes kabhi mat chhodna. 👑'],
    ['bdv',''],
    ['bli','You deserve every good thing this universe quietly holds in reserve for people like you—the ones who give more than they ever ask for.'],
    ['bli','May this year be full of laughter that catches you off guard, moments that feel like magic, and people who love you exactly as you are.'],
    ['bti','Happy Birthday, Princess Tanya.'],
    ['bti','May your reign be long, bright, and full of joy. ✨']
  ].forEach(([cls,text])=>{
    if(cls==='bdv'){c.appendChild(Object.assign(document.createElement('div'),{className:'bdv'}));d+=.3;return}
    const el=Object.assign(document.createElement('div'),{className:cls,textContent:text});
    c.appendChild(el);
    setTimeout(()=>el.classList.add('s'),d*1000+50);d+=.7
  })
}

// ═══════════════ BIRTHDAY MESSAGE ═════════════════════════════
function showBday(){
  document.getElementById('bu').style.display='block';
  document.getElementById('jl').style.opacity='0';document.getElementById('jr').style.opacity='0';
  document.getElementById('xh').style.display='none';document.getElementById('ip').style.display='none';
  document.getElementById('rl').style.display='none';document.getElementById('mm').style.display='none';
  setTimeout(()=>{document.getElementById('bb').classList.add('v');buildBdayMsg()},1200);
}

function buildBdayMsg(){
  const ist=getIST(),win=tWin(ist),c=document.getElementById('bc');c.innerHTML='';let d=0;
  const add=(cls,text,delay)=>{if(cls==='bdv'){c.appendChild(Object.assign(document.createElement('div'),{className:'bdv'}));return}if(cls==='bbt'){const btn=Object.assign(document.createElement('button'),{className:'bbt',textContent:'\u2736 Dekh Aasman Mein \u2736'});btn.onclick=showConst;c.appendChild(btn);setTimeout(()=>btn.classList.add('s'),delay*1000+50);return}const el=Object.assign(document.createElement('div'),{className:cls,textContent:text});c.appendChild(el);setTimeout(()=>el.classList.add('s'),delay*1000+50)};
  
  if(win==='mid'){add('bhi','Tu abhi tak soi nahi??🤨',0);add('bhi','Apne tabyat ka to khayal rakh.',1);add('bti','Happy Birthday, Princess Tanya \uD83D\uDC51',2);add('bdv','',2.5);add('bhi','Chal Tereko kuch mast bata ta hu \u2728',3);add('bbt','',3.8);d=4.5}
  else if(win==='morn'){add('bhi','Tu uth gayi??🤨',0);add('bti','Happy Birthday, Princess Tanya \uD83D\uDC51',1);add('bdv','',1.6);d=2.2}
  else{add('bti','Happy Birthday \uD83C\uDF82',0);add('bti','Princess Tanya \uD83D\uDC51',1);add('bdv','',1.6);d=2.2}
  
  if(win!=='mid'){
    [[d,    'bli', 'On this beautiful day, the stars didn\'t just align—they danced, celebrating the exact moment you came into this world.'],
     [d+.9, 'bli', 'You carry a warmth that makes every room feel like home, and a spirit so bright it turns ordinary moments into memories worth keeping forever.'],
     [d+1.8,'bli', 'The world is genuinely so much better because you\'re in it, Tanya. Your kindness isn\'t small—it echoes. 🌟'],
     [d+2.5,'bdv', ''],
     [d+2.8,'bhi', 'Tujhe dekh ke aisa lagta hai ki kuch log duniya mein honestly sirf khushiyan baantne ke liye aate hain—aur tu unme se ek hai.'],
     [d+3.7,'bhi', 'Meri bas yahi dua hai ki tu hamesha khush rahe, healthy rahe, aur jo bhi sapne hain tere—wo sab poore hon. 🌸'],
     [d+4.6,'bhi', 'Aur life mein chahe kuch bhi ho—apni wo pyari si smile aur apni "princess" wali vibes kabhi mat chhodna. 👑'],
     [d+5.3,'bdv', ''],
     [d+5.6,'bli', 'You deserve every good thing this universe quietly holds in reserve for people like you—the ones who give more than they ever ask for.'],
     [d+6.5,'bli', 'May this year be full of laughter that catches you off guard, moments that feel like magic, and people who love you exactly as you are.'],
     [d+7.4,'bti', 'Happy Birthday, Princess Tanya.'],
     [d+8.0,'bti', 'May your reign be long, bright, and full of joy. ✨']
    ].forEach(([dl,cls,t])=>add(cls,t,dl));
  }
}

// ═══════════════ MAIN LOOP ════════════════════════════════════
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);
  if(!outMode){
    if(!gameActive)movePlayer();
    camera.position.set(player.x,player.y,player.z);
    camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
    
    if(gateOpen){gateAng=Math.min(gateAng+.016,Math.PI*.65);doorPL.rotation.y=gateAng;doorPR.rotation.y=-gateAng;
      if(gateAng>=Math.PI*.65&&!outMode){
        document.getElementById('fl').style.background='rgba(255,230,150,.65)';
        setTimeout(()=>{document.getElementById('fl').style.background=''},600);
        setTimeout(startTransition,1400);gateOpen=false;
      }
    }
    
    TORCHES.forEach((t,i)=>{t.t+=dt;const fl=Math.sin(t.t*8+i*2.1)*.18+Math.sin(t.t*13+i)*.1;if(t.li)t.li.intensity=t.base*(0.88+fl);if(t.fl){t.fl.scale.y=.93+Math.sin(t.t*7.5+i)*.1;t.fl.scale.x=.97+Math.sin(t.t*9+i)*.07}});
    checkInteracts();checkRoom();
    renderer.render(scene,camera);renderMM();
  } else {
    outFr++;
    if(Math.abs(joy.r.dx)>.04)outCam.rotation.y-=joy.r.dx*.044;
    if(outBreeze){const pos=outBreeze.geometry.attributes.position;for(let i=0;i<pos.count;i++){let x=pos.getX(i)+.03+Math.sin(outFr*.01+i)*.01;if(x>50)x=-50;pos.setX(i,x)}pos.needsUpdate=true}
    outPetals.forEach(p=>{p.position.x+=p.userData.vx+Math.sin(outFr*.02+p.position.x)*.004;p.position.y+=p.userData.vy;p.rotation.x+=p.userData.sr;p.rotation.y+=p.userData.sr*.7;if(p.position.y<-1.5){p.position.y=8+Math.random()*4;p.position.x=(Math.random()-.5)*65}});
    outScene.traverse(o=>{if(o.userData.drift)o.position.x+=o.userData.drift;if(o.userData.isRain){const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){let y=pos.getY(i)-.38;if(y<-2){y=90;pos.setX(i,(Math.random()-.5)*160);pos.setZ(i,(Math.random()-.5)*160)}pos.setY(i,y)}pos.needsUpdate=true}});
    ltTimer-=dt;if(ltTimer<=0){llght.intensity=22+Math.random()*25;setTimeout(()=>llght.intensity=0,110);ltTimer=2+Math.random()*7}
    renderer.render(outScene,outCam);
  }
}

function startTransition(){
  canvas.style.transition='opacity 1.5s ease';canvas.style.opacity='0';buildOutdoor();
  
  if(audioEnabled) {
    let fadeOut = setInterval(() => {
      if (sounds.bgm.volume > 0.05) sounds.bgm.volume -= 0.05;
      else { sounds.bgm.pause(); clearInterval(fadeOut); }
    }, 200);
    
    sounds.night.volume = 0;
    sounds.night.play().catch(()=>{});
    let fadeIn = setInterval(() => {
      if (sounds.night.volume < 0.35) sounds.night.volume += 0.05;
      else clearInterval(fadeIn);
    }, 200);
  }

  setTimeout(()=>{outMode=true;canvas.style.opacity='1';
    canvas.addEventListener('mousemove',e=>{if(!dlook||gameActive)return;outCam.rotation.y-=(e.clientX-dlx)*.003;dlx=e.clientX});
    canvas.addEventListener('touchmove',e=>{if(!dlook||gameActive)return;outCam.rotation.y-=(e.touches[0].clientX-dlx)*.004;dlx=e.touches[0].clientX},{passive:true});
    setTimeout(showBday,2200);},1500);
}

// ═══════════════ INIT ═════════════════════════════════════════
let pv=0;
const piv=setInterval(()=>{pv=Math.min(100,pv+3);document.getElementById('pf').style.width=pv+'%';if(pv>=100){clearInterval(piv);
  buildMain();buildLibrary();buildAlchemy();buildThrone();buildGameRoom();buildGate();
  setTimeout(()=>{const ld=document.getElementById('loading');ld.style.opacity='0';setTimeout(()=>{ld.style.display='none';animate();
    const ist=getIST();
    if(isBday(ist)){document.getElementById('ht').textContent='your kingdom awaits...';setTimeout(openGate,2000)}
    setTimeout(()=>document.getElementById('ht').style.opacity='0',5500);
  },1500)},350);
}},25);
