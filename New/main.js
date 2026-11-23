import * as THREE from "three";
const RAD=Math.PI/180,LAT=20.1822,LON=85.615,rev=x=>((x%360)+360)%360,$=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search),T0=Q.get("time")?Date.parse(Q.get("time")):0,SPD=+Q.get("speed")||1,W0=Date.now();
const nowMs=()=>(T0||W0)+(Date.now()-W0)*SPD;
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// ---------- astronomy ----------
function sunPos(d){const w=282.9404+4.70935e-5*d,e=.016709-1.151e-9*d,M=rev(356.047+.9856002585*d),Mr=M*RAD;
 const E=M+e/RAD*Math.sin(Mr)*(1+e*Math.cos(Mr)),xv=Math.cos(E*RAD)-e,yv=Math.sqrt(1-e*e)*Math.sin(E*RAD);
 return{lon:rev(Math.atan2(yv,xv)/RAD+w),M,L:rev(w+M)}}
const eclEq=(lon,lat,ecl)=>{const l=lon*RAD,b=lat*RAD,x=Math.cos(b)*Math.cos(l),y=Math.cos(b)*Math.sin(l),z=Math.sin(b),c=Math.cos(ecl*RAD),s=Math.sin(ecl*RAD);return new THREE.Vector3(x,y*c-z*s,y*s+z*c)};
function moonPos(d,sun,ecl){const N=rev(125.1228-.0529538083*d),i=5.1454*RAD,w=rev(318.0634+.1643573223*d),a=60.2666,e=.0549,M=rev(115.3654+13.0649929509*d);
 let E=M+e/RAD*Math.sin(M*RAD)*(1+e*Math.cos(M*RAD));for(let k=0;k<5;k++)E-=(E-e/RAD*Math.sin(E*RAD)-M)/(1-e*Math.cos(E*RAD));
 const xv=a*(Math.cos(E*RAD)-e),yv=a*Math.sqrt(1-e*e)*Math.sin(E*RAD),v=Math.atan2(yv,xv)/RAD,r=Math.hypot(xv,yv),vw=(v+w)*RAD,Nr=N*RAD;
 const xh=r*(Math.cos(Nr)*Math.cos(vw)-Math.sin(Nr)*Math.sin(vw)*Math.cos(i)),yh=r*(Math.sin(Nr)*Math.cos(vw)+Math.cos(Nr)*Math.sin(vw)*Math.cos(i)),zh=r*Math.sin(vw)*Math.sin(i);
 let lon=Math.atan2(yh,xh)/RAD,lat=Math.atan2(zh,Math.hypot(xh,yh))/RAD,dist=r;
 const Lm=N+w+M,D=Lm-sun.L,F=Lm-N,Ms=sun.M,s=x=>Math.sin(x*RAD);
 lon+=-1.274*s(M-2*D)+.658*s(2*D)-.186*s(Ms)-.059*s(2*M-2*D)-.057*s(M-2*D+Ms)+.053*s(M+2*D)+.046*s(2*D-Ms)+.041*s(M-Ms)-.035*s(D)-.031*s(M+Ms)-.015*s(2*F-2*D)+.011*s(M-4*D);
 lat+=-.173*s(F-2*D)-.055*s(M-F-2*D)-.046*s(M+F-2*D)+.033*s(F+2*D)+.017*s(2*M+F);
 dist+=-.58*Math.cos((M-2*D)*RAD)-.46*Math.cos(2*D*RAD);
 return{dir:eclEq(lon,lat,ecl),dist,lit:(1-Math.cos(D*RAD))/2}}
function skyState(ms){const d=ms/864e5-10956,jd=ms/864e5+2440587.5,t=(jd-2451545)/36525,ecl=23.4393-3.563e-7*d;
 const gmst=rev(280.46061837+360.98564736629*(jd-2451545)),L=rev(gmst+LON),ph=RAD*LAT;
 const Wm=new THREE.Matrix4().set(0,1,0,0, Math.cos(ph),0,Math.sin(ph),0, Math.sin(ph),0,-Math.cos(ph),0, 0,0,0,1);
 const Td=Wm.clone().multiply(new THREE.Matrix4().makeRotationZ(-L*RAD));
 const zt=(2306.2181*t+.30188*t*t)/3600*RAD,zz=(2306.2181*t+1.09468*t*t)/3600*RAD,th=(2004.3109*t-.42665*t*t)/3600*RAD;
 const Pm=new THREE.Matrix4().makeRotationZ(zz).multiply(new THREE.Matrix4().makeRotationY(-th)).multiply(new THREE.Matrix4().makeRotationZ(zt));
 const sp=sunPos(d),sdir=eclEq(sp.lon,0,ecl).applyMatrix4(Td).normalize(),mp=moonPos(d,sp,ecl);
 const mw=mp.dir.clone().applyMatrix4(Td).multiplyScalar(mp.dist).sub(new THREE.Vector3(0,1,0)).normalize();
 return{sun:sdir,moon:mw,lit:mp.lit,T:new THREE.Matrix3().setFromMatrix4(Td.clone().multiply(Pm))}}
// ---------- renderer ----------
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.2,6000);cam.rotation.order="YXZ";
const R=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
sc.fog=new THREE.FogExp2(0x1a2350,.0007);
const hemi=new THREE.HemisphereLight(0x8fa0ff,0x1a2440,.5),sunL=new THREE.DirectionalLight(0xffffff,1);
sunL.castShadow=true;sunL.shadow.mapSize.set(2048,2048);const sh=sunL.shadow.camera;sh.left=sh.bottom=-90;sh.right=sh.top=90;sh.near=10;sh.far=700;sunL.shadow.bias=-.0004;sc.add(hemi,sunL,sunL.target);
// ---------- terrain ----------
const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s)};
const vn=(x,z)=>{const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);return hash(xi,zi)*(1-u)*(1-v)+hash(xi+1,zi)*u*(1-v)+hash(xi,zi+1)*(1-u)*v+hash(xi+1,zi+1)*u*v};
const fbm=(x,z)=>{let a=.5,s=0;for(let i=0;i<5;i++){s+=a*vn(x,z);x*=2.02;z*=2.02;a*=.5}return s};
const RIV=[[[0,-262],[-40,-215],[-110,-170],[-190,-120],[-250,-70],[-330,-20],[-420,10]],[[0,-262],[45,-215],[120,-165],[200,-120],[260,-70],[330,-35],[420,-10]]];
const dseg=(px,pz,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(px-a[0]-t*dx,pz-a[1]-t*dz)};
const riverD=(x,z)=>{let m=1e9;for(const r of RIV)for(let i=0;i<r.length-1;i++)m=Math.min(m,dseg(x,z,r[i],r[i+1]));return m};
function H(x,z){const dx=Math.max(Math.abs(x-5)-350,0),dz=Math.max(Math.abs(z-180)-390,0);
 let h=smooth(0,160,Math.hypot(dx,dz))*(10*fbm(x*.004,z*.004)+4*fbm(x*.02,z*.02));
 h+=smooth(-250,-460,z)*(40+190*Math.pow(fbm(x*.0035+9,z*.0035),1.6));
 return h+(-2.6-h)*(1-smooth(11,28,riverD(x,z)))}
const CITY=[[-239,140],[-239,260],[-308,275],[-303,525],[317,455],[317,185],[242,180],[152,140]];
const inPoly=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!=(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;return c};
{const g=new THREE.PlaneGeometry(1600,1600,240,240);g.rotateX(-Math.PI/2);const p=g.attributes.position,col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=H(x,z);p.setY(i,h);const n=.8+.4*fbm(x*.05,z*.05);let c=[.23*n,.4*n,.15*n];
  if(((x-3)/150)**2+((z+45)/130)**2<1&&z<145)c=[.28*n,.5*n,.2*n];
  if(inPoly(x,z,CITY))c=[.4*n,.37*n,.33*n];
  if(Math.abs(x-5)<5&&z>140&&z<495)c=[.36,.3,.22];
  if(h<-1.5)c=[.35,.3,.2];c=mix(c,[.42,.4,.38],smooth(35,80,h));c=mix(c,[.92,.94,.98],smooth(115,160,h));col.set(c,i*3)}
 g.setAttribute("color",new THREE.BufferAttribute(col,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.receiveShadow=true;sc.add(m);
 for(const r of RIV){const pts=[];for(let k=0;k<r.length-1;k++)for(let s=0;s<8;s++){const t=s/8;pts.push([r[k][0]+(r[k+1][0]-r[k][0])*t,r[k][1]+(r[k+1][1]-r[k][1])*t])}pts.push(r[r.length-1]);
  const v=[],ix=[];pts.forEach((q,i)=>{const a=pts[Math.max(i-1,0)],b=pts[Math.min(i+1,pts.length-1)],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=-dz/L*13,nz=dx/L*13;v.push(q[0]+nx,-1.2,q[1]+nz,q[0]-nx,-1.2,q[1]-nz);if(i<pts.length-1)ix.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2)});
  const wg=new THREE.BufferGeometry();wg.setAttribute("position",new THREE.Float32BufferAttribute(v,3));wg.setIndex(ix);wg.computeVertexNormals();
  sc.add(new THREE.Mesh(wg,new THREE.MeshStandardMaterial({color:0x1d4f7a,roughness:.1,transparent:true,opacity:.85,side:THREE.DoubleSide})))}}
// ---------- buildings ----------
const cols=[],Mt=(c,r=.85)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const put=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;sc.add(m);return m};
function box(cx,cz,w,d,h,c,rot=0,solid=true){const b=put(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),Mt(c)),cx,H(cx,cz)+h/2,cz);b.rotation.y=rot;if(solid)cols.push({t:"b",x:cx,z:cz,hw:w/2,hd:d/2,r:rot});return b}
function cone(cx,cz,r,h,y,c,seg=28){put(new THREE.Mesh(new THREE.ConeGeometry(r,h,seg),Mt(c)),cx,y+h/2,cz)}
function cyl(cx,cz,r,h,c,roof){const y=H(cx,cz);put(new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.04,h,28),Mt(c)),cx,y+h/2,cz);if(roof)cone(cx,cz,r*1.2,r*.9,y+h,roof);cols.push({t:"c",x:cx,z:cz,r})}
function wall(a,b,h=9,th=2,c=0xb9ad98){const dx=b[0]-a[0],dz=b[1]-a[1];box((a[0]+b[0])/2,(a[1]+b[1])/2,Math.hypot(dx,dz)+.5,th,h,c,-Math.atan2(dz,dx))}
function house(cx,cz,w,d,h,c,rc){box(cx,cz,w,d,h,c);const y=H(cx,cz)+h;const r=put(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w,d)/2*1.08,h*.55,4),Mt(rc)),cx,y+h*.275,cz);r.rotation.y=Math.PI/4}
{ // castle
 box(0,0,82,65,24,0xcfc6b0);[[-41,-32.5],[41,-32.5],[-41,32.5],[41,32.5]].forEach(([x,z])=>cyl(x,z,5.5,36,0xd9cfba,0xb5413f));
 cyl(6,-125,22,36,0xe4dccb,0xb5413f);put(new THREE.Mesh(new THREE.CylinderGeometry(24,24,.8,32),Mt(0xcfc6b0)),6,H(6,-125)+28,-125);
 cyl(-23,-80,17,26,0xdcd2bd,0xb5413f);cyl(34,-80,17,26,0xdcd2bd,0xb5413f);
 box(-90,34,35,127,18,0xd8cdb6);box(91,42,30,107,18,0xd8cdb6);wall([-81,-97],[56,-97],4,1,0xa89f8c);
 const wp=[[-143,142],[-143,-60]];for(let a=180;a<=360;a+=7.5)wp.push([3+146*Math.cos(a*RAD),-60+110*Math.sin(a*RAD)]);wp.push([149,-60],[149,142]);
 for(let i=0;i<wp.length-1;i++)wall(wp[i],wp[i+1],8);wall([149,142],[18,142],8);wall([-6,142],[-143,142],8);
 // Piyush's houses, museum, market, towers, city wall
 house(-78,195,40,30,12,0xe3d3b5,0x8a4b3a);house(91,197,45,32,12,0xe3d3b5,0x8a4b3a);
 box(4,310,40,40,26,0xe8e2d0);put(new THREE.Mesh(new THREE.ConeGeometry(34,12,4),Mt(0x6b7fa8)),4,H(4,310)+32,310).rotation.y=Math.PI/4;
 const zb=x=>525-(x+303)*70/620;wall([-239,140],[-143,142],10);wall([149,142],[152,140],10);
 [[-239,140],[-239,260],[-308,275],[-303,525]].forEach((p,i,a)=>{if(i)wall(a[i-1],p,10)});wall([-303,525],[-8,zb(-8)],10);wall([16,zb(16)],[317,455],10);
 [[317,455],[317,185],[242,180],[152,140]].forEach((p,i,a)=>{if(i)wall(a[i-1],p,10)});
 cyl(-8,zb(-8),5,32,0xcfc6b0,0x6b7fa8);cyl(16,zb(16),5,32,0xcfc6b0,0x6b7fa8);
 const tc=[0xc0553a,0x3a7bc0,0xd9a441,0x4a9a5c];for(let i=0;i<14;i++){const a=i/14*6.283,r=i%2?30:22;box(26+Math.cos(a)*r,385+Math.sin(a)*r,5,4,3,tc[i%4],a,true)}
 let n=0,tries=0;const hc=[0xe3d3b5,0xd9c4a0,0xc9b08a,0xe8dcc4];
 while(n<55&&tries++<2000){const x=-300+Math.random()*620,z=150+Math.random()*340,w=10+Math.random()*6,d=10+Math.random()*6;
  if(!inPoly(x,z,CITY)||Math.abs(x-4)<(w/2+16)||Math.hypot(x-4,z-310)<48||Math.hypot(x-26,z-385)<46||Math.hypot(x-4,z-195)<0)continue;
  if(![[-12,-12],[12,-12],[-12,12],[12,12]].every(([a,b])=>inPoly(x+a*w/10,z+b*d/10,CITY)&&Math.abs(x+a*w/10-4)>8))continue;
  if(cols.some(c=>Math.hypot(c.x-x,c.z-z)<(c.hw?Math.max(c.hw,c.hd):c.r)+14))continue;house(x,z,w,d,8+Math.random()*5,hc[n%4],[0x8a4b3a,0x6b5a4a,0x7a3b32][n%3]);n++}
}
// trees with wind sway
const WU={uTime:{value:0},uWind:{value:new THREE.Vector3(1,0,.3)}};
const sway=(m,a)=>{m.onBeforeCompile=s=>{s.uniforms.uTime=WU.uTime;s.uniforms.uWind=WU.uWind;s.vertexShader="uniform float uTime;uniform vec3 uWind;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvec4 wp=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);float ph=uTime*1.7+wp.x*.15+wp.z*.11;transformed.x+=uWind.x*uWind.z*"+a+"*sin(ph);transformed.z+=uWind.y*uWind.z*"+a+"*sin(ph);")}};
{const pts=[];let tr=0;while(pts.length<520&&tr++<9000){const x=-780+Math.random()*1560,z=-250+Math.random()*1030,h=H(x,z);
  if(h<-.5||h>45||inPoly(x,z,CITY)||riverD(x,z)<22||(Math.abs(x-5)<10&&z>140&&z<500))continue;
  const inC=((x-3)/150)**2+((z+45)/130)**2<1&&z<145;if(inC&&Math.random()<.6)continue;
  if(cols.some(c=>Math.hypot(c.x-x,c.z-z)<(c.hw?Math.max(c.hw,c.hd):c.r)+8))continue;pts.push([x,h,z])}
 const cm=new THREE.MeshStandardMaterial({color:0x2f6b32,roughness:.9});sway(cm,.9);
 const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4,1),cm,pts.length),trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.35,.5,5,6),Mt(0x5b3f28),pts.length),m4=new THREE.Matrix4();
 pts.forEach((p,i)=>{const s=.8+Math.random()*.9;m4.makeScale(s,s,s).setPosition(p[0],p[1]+2.5*s,p[2]);trunk.setMatrixAt(i,m4);m4.makeScale(s,s*1.1,s).setPosition(p[0],p[1]+6.2*s,p[2]);crown.setMatrixAt(i,m4)});
 crown.castShadow=trunk.castShadow=true;sc.add(crown,trunk)}
// ---------- sky ----------
const SU={uSun:{value:new THREE.Vector3()},uMoon:{value:new THREE.Vector3()},uMoonLit:{value:0},uTime:{value:0},uCover:{value:.3},uWindV:{value:new THREE.Vector2()},uT:{value:new THREE.Matrix3()},uLim:{value:6.8},uPx:{value:Math.min(devicePixelRatio,2)}};
const dome=new THREE.Mesh(new THREE.SphereGeometry(4500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:SU,
 vertexShader:"varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:`varying vec3 v;uniform vec3 uSun,uMoon;uniform float uMoonLit,uTime,uCover;uniform vec2 uWindV;
 float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
 float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(v);float h=clamp(d.y,0.,1.),sa=uSun.y;float day=smoothstep(-.08,.15,sa);float tw=smoothstep(-.3,-.02,sa)*(1.-smoothstep(-.02,.2,sa));
 vec3 zen=mix(vec3(.001,.003,.012),vec3(.12,.30,.75),day),hor=mix(vec3(.01,.015,.035),vec3(.55,.72,.95),day);vec3 c=mix(hor,zen,pow(h,.5));
 float sd=max(dot(d,uSun),0.);vec3 warm=vec3(1.,.45,.18);c+=warm*tw*pow(sd,6.)*.9*(1.-h*.6)+warm*tw*.15*(1.-h);c+=vec3(1.,.9,.7)*pow(sd,500.)*3.*step(-.02,sa);
 float md=max(dot(d,uMoon),0.);c+=vec3(.5,.6,.8)*pow(md,60.)*.05*uMoonLit*(1.-day);
 vec2 cp=d.xz/(d.y+.18)*.9+uWindV*uTime*.004;float cl=smoothstep(1.-uCover,1.-uCover+.28,fb(cp))*smoothstep(0.,.12,d.y)*.92;
 vec3 cc=mix(vec3(.02,.025,.04),vec3(.92,.94,.98),day)+warm*tw*.5+vec3(.5,.6,.8)*uMoonLit*.05*(1.-day);c=mix(c,cc,cl);
 c*=mix(1.,.3,smoothstep(0.,-.2,d.y));gl_FragColor=vec4(c,1.);}`}));dome.frustumCulled=false;dome.renderOrder=-2;sc.add(dome);
const starsG=new THREE.BufferGeometry(),stars=new THREE.Points(starsG,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:SU,
 vertexShader:`attribute float aMag;attribute vec3 aCol;uniform mat3 uT;uniform float uLim,uPx;varying vec3 vC;varying float vA;
 void main(){vec3 d=uT*position;if(d.y<-.01){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;return;}
 float f=clamp(pow(10.,-.4*(aMag-uLim)),0.,1.);vA=f*smoothstep(-.01,.12,d.y);vC=aCol;
 gl_PointSize=clamp(1.3+(6.5-aMag)*.55,1.3,8.)*uPx*(.6+.4*f);gl_Position=projectionMatrix*modelViewMatrix*vec4(d*4000.,1.);}`,
 fragmentShader:"varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r)*vA;if(a<.002)discard;gl_FragColor=vec4(vC,a);}"}));
stars.frustumCulled=false;stars.renderOrder=-1;sc.add(stars);
const moonM=new THREE.Mesh(new THREE.SphereGeometry(22,32,16),new THREE.ShaderMaterial({fog:false,uniforms:SU,
 vertexShader:"varying vec3 n;varying vec3 p;void main(){n=normalize(mat3(modelMatrix)*normal);p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"varying vec3 n;varying vec3 p;uniform vec3 uSun;void main(){float l=max(dot(normalize(n),uSun),0.);float m=.62+.3*sin(p.x*.5+sin(p.y*.4))*sin(p.y*.3+p.z*.2);gl_FragColor=vec4(vec3(.93,.92,.86)*m*(l+.02),1.);}"}));
moonM.frustumCulled=false;sc.add(moonM);
(async()=>{const buf=await (await fetch("stars.bin")).arrayBuffer(),n=new Uint32Array(buf,0,1)[0],p16=new Int16Array(buf,4,n*3),mg=new Uint8Array(buf,4+n*6,n),ci=new Uint8Array(buf,4+n*7,n);
 const lut=[];for(let i=0;i<256;i++){const bv=i/100-.5,T=4600*(1/(.92*bv+1.7)+1/(.92*bv+.62))/100;let r,g,b;if(T<=66){r=255;g=99.47*Math.log(T)-161.12;b=T<=19?0:138.52*Math.log(T-10)-305.04}else{r=329.7*Math.pow(T-60,-.1332);g=288.12*Math.pow(T-60,-.0755);b=255}lut.push([r,g,b].map(v=>Math.min(255,Math.max(0,v))/255))}
 const pos=new Float32Array(n*3),mag=new Float32Array(n),col=new Float32Array(n*3);for(let i=0;i<n*3;i++)pos[i]=p16[i]/32767;for(let i=0;i<n;i++){mag[i]=mg[i]/10-2;col.set(lut[ci[i]],i*3)}
 starsG.setAttribute("position",new THREE.BufferAttribute(pos,3));starsG.setAttribute("aMag",new THREE.BufferAttribute(mag,1));starsG.setAttribute("aCol",new THREE.BufferAttribute(col,3));
 $("msg").textContent=n.toLocaleString()+" stars loaded";$("go").disabled=false})().catch(()=>{$("msg").textContent="Couldn’t load the star data.";$("go").disabled=false});
// ---------- weather ----------
const WX={cloud:.3,speed:2,dir:200,rain:0,note:"default"};
async function wx(){if(Q.get("weather")=="rain"){Object.assign(WX,{cloud:.95,speed:8,rain:1,note:"test rain"});return}
 try{const j=await (await fetch("/api/weather")).json();if(j.cloud_cover!=null){WX.cloud=j.cloud_cover/100;WX.speed=j.wind_speed_10m??2;WX.dir=j.wind_direction_10m??200;
  const c=j.weather_code||0;WX.rain=(j.precipitation>.1||(c>=51&&c<=67)||(c>=80&&c<=82)||c>=95)?Math.min(1,(j.precipitation||.5)/3+.3):0;WX.note="live, "+Math.round(j.temperature_2m)+"°C"}}catch(e){}}
wx();setInterval(wx,6e5);
const rainG=new THREE.BufferGeometry(),rp=new Float32Array(2400*6);for(let i=0;i<2400;i++){const x=(Math.random()-.5)*50,y=Math.random()*30,z=(Math.random()-.5)*50;rp.set([x,y,z,x,y-.7,z],i*6)}
rainG.setAttribute("position",new THREE.BufferAttribute(rp,3));const rain=new THREE.LineSegments(rainG,new THREE.LineBasicMaterial({color:0xaabbcc,transparent:true,opacity:.35}));rain.frustumCulled=false;rain.visible=false;sc.add(rain);
// ---------- controls ----------
const P=new THREE.Vector3(-40,0,-118);let yaw=Math.PI*.9,pitch=0,bob=0,lock=false;const keys={};let jx=0,jz=0;
addEventListener("keydown",e=>keys[e.code]=1);addEventListener("keyup",e=>keys[e.code]=0);
$("go").onclick=()=>{$("start").style.display="none";if(!matchMedia("(pointer:coarse)").matches)R.domElement.requestPointerLock?.()};
R.domElement.addEventListener("click",()=>{if(!matchMedia("(pointer:coarse)").matches&&!document.pointerLockElement)R.domElement.requestPointerLock?.()});
addEventListener("mousemove",e=>{if(document.pointerLockElement){yaw-=e.movementX*.0022;pitch=Math.max(-1.3,Math.min(1.3,pitch-e.movementY*.0022))}});
const pad=$("pad"),kn=$("knob");let sp=null,dr=null;
pad.addEventListener("pointerdown",e=>{sp=e.pointerId;pad.setPointerCapture(e.pointerId);mv(e)});pad.addEventListener("pointermove",e=>{if(sp===e.pointerId)mv(e)});
const rel=()=>{sp=null;jx=jz=0;kn.style.left=kn.style.top="35px"};pad.addEventListener("pointerup",rel);pad.addEventListener("pointercancel",rel);
function mv(e){const b=pad.getBoundingClientRect(),dx=e.clientX-b.left-60,dy=e.clientY-b.top-60,l=Math.min(1,Math.hypot(dx,dy)/45),a=Math.atan2(dy,dx);jx=Math.cos(a)*l;jz=-Math.sin(a)*l;kn.style.left=35+Math.cos(a)*l*40+"px";kn.style.top=35+Math.sin(a)*l*40+"px"}
R.domElement.addEventListener("pointerdown",e=>{if(e.pointerType!="mouse"&&e.clientX>innerWidth*.4)dr={x:e.clientX,y:e.clientY}});
R.domElement.addEventListener("pointermove",e=>{if(dr&&e.pointerType!="mouse"){yaw-=(e.clientX-dr.x)*.005;pitch=Math.max(-1.3,Math.min(1.3,pitch-(e.clientY-dr.y)*.005));dr={x:e.clientX,y:e.clientY}}});
addEventListener("pointerup",()=>dr=null);
function resolve(p){for(let k=0;k<3;k++)for(const c of cols){if(c.t=="c"){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),r=c.r+.5;if(d<r&&d>1e-6){p.x=c.x+dx/d*r;p.z=c.z+dz/d*r}}
 else{const cs=Math.cos(c.r),sn=Math.sin(c.r),wx=p.x-c.x,wz=p.z-c.z,lx=wx*cs-wz*sn,lz=wx*sn+wz*cs,hw=c.hw+.5,hd=c.hd+.5;
  if(Math.abs(lx)<hw&&Math.abs(lz)<hd){let nx=lx,nz=lz;if(hw-Math.abs(lx)<hd-Math.abs(lz))nx=Math.sign(lx||1)*hw;else nz=Math.sign(lz||1)*hd;p.x=c.x+nx*cs+nz*sn;p.z=c.z-nx*sn+nz*cs}}}}
// ---------- loop ----------
const clk=new THREE.Clock(),hud=$("hud");let hc=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime,ms=nowMs(),S=skyState(ms);
 // move
 let f=jz+(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),r=jx+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);const l=Math.hypot(f,r);
 if(l>0&&$("start").style.display=="none"){if(l>1){f/=l;r/=l}const v=(keys.ShiftLeft||keys.ShiftRight?9:4.8)*dt,nx=P.x+(-Math.sin(yaw)*f+Math.cos(yaw)*r)*v,nz=P.z+(-Math.cos(yaw)*f-Math.sin(yaw)*r)*v;
  if(riverD(nx,nz)>13&&Math.abs(nx)<770&&Math.abs(nz)<770&&(H(nx,nz)-H(P.x,P.z))/Math.max(v,1e-3)<.95){P.x=nx;P.z=nz}resolve(P);bob+=dt*(keys.ShiftLeft?11:8)*Math.min(l,1)}
 P.y=H(P.x,P.z);cam.position.set(P.x,P.y+1.7+Math.sin(bob)*.05,P.z);cam.rotation.set(pitch,yaw,0);
 // sky
 const sa=S.sun.y,saDeg=Math.asin(sa)/RAD,day=smooth(-.08,.15,sa),ma=Math.max(S.moon.y,0);
 SU.uSun.value.copy(S.sun);SU.uMoon.value.copy(S.moon);SU.uMoonLit.value=S.lit*(S.moon.y>-.05?1:0);SU.uTime.value=t;SU.uT.value.copy(S.T);
 SU.uCover.value=WX.cloud*.85+.05;const wd=WX.dir*RAD,wv=[-Math.sin(wd),Math.cos(wd)],ws=Math.min(1.5,WX.speed/6);SU.uWindV.value.set(wv[0]*WX.speed,wv[1]*WX.speed);WU.uTime.value=t;WU.uWind.value.set(wv[0],wv[1],ws);
 const k=Math.pow(Math.max(0,(saDeg+18)/18),1.5);SU.uLim.value=saDeg>0?-6:6.8-12.8*Math.min(1,k)-S.lit*ma*1.2;
 stars.position.copy(cam.position);dome.position.copy(cam.position);moonM.position.copy(cam.position).addScaledVector(S.moon,3000);moonM.visible=S.moon.y>-.05;
 // light
 const useSun=sa>-.08,L=useSun?S.sun:S.moon,cl=1-.6*WX.cloud;
 sunL.position.copy(cam.position).addScaledVector(L,300);sunL.target.position.copy(cam.position);sunL.castShadow=(useSun?sa:S.moon.y)>.05;
 sunL.intensity=useSun?smooth(-.08,.2,sa)*3.2*cl:ma*S.lit*.35;sunL.color.setRGB(1,.75+.25*smooth(0,.4,sa),.55+.45*smooth(0,.5,sa)).lerp(new THREE.Color(.7,.8,1),useSun?0:1);
 hemi.intensity=.14+.8*day;hemi.color.setRGB(.15+.45*day,.2+.55*day,.45+.5*day);hemi.groundColor.setRGB(.03+.25*day,.03+.23*day,.03+.18*day);
 R.toneMappingExposure=2.2-1.3*day;const fc=mix([.02,.03,.07],[.6,.72,.9],day);sc.fog.color.setRGB(fc[0],fc[1],fc[2]);sc.fog.density=.0007+.0012*WX.cloud*.5+.002*WX.rain;
 // rain
 rain.visible=WX.rain>0;if(rain.visible){rain.position.set(cam.position.x,cam.position.y-10,cam.position.z);const a=rainG.attributes.position.array;for(let i=0;i<2400;i++){const o=i*6,dy=(12+WX.rain*6)*dt;a[o+1]-=dy;a[o+4]-=dy;a[o]+=wv[0]*WX.speed*dt*.3;a[o+3]+=wv[0]*WX.speed*dt*.3;if(a[o+1]<-1){a[o+1]=30;a[o+4]=29.3}}rainG.attributes.position.needsUpdate=true;rain.material.opacity=.15+.3*WX.rain}
 if(++hc%15==0){const d=new Date(ms+19800000);hud.textContent=d.toISOString().slice(11,16)+" IST  Khurda\nsun "+saDeg.toFixed(1)+"°  moon "+Math.round(S.lit*100)+"% lit, "+(Math.asin(S.moon.y)/RAD).toFixed(0)+"°\nwind "+WX.speed.toFixed(1)+" m/s  cloud "+Math.round(WX.cloud*100)+"%  ("+WX.note+")"}
 R.render(sc,cam)}
addEventListener("resize",()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight)});
frame();
