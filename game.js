const C=document.getElementById('gc'),X=C.getContext('2d');
const VW=800,VH=600,CTRL_H=300,CTRL_W=200;
let SC=1,TS=1,OX=0,OY=0,GOX=0,GOY=0,isLandscape=false;
let isMobile=!!window.isMobile;
let hasRealGP=false;
let hasKeyboard=false;
function useMobileLayout(){return isMobile&&!hasRealGP&&!hasKeyboard}
function resize(){
  C.width=innerWidth;C.height=innerHeight;
  if(!useMobileLayout()){SC=Math.min(C.width/VW,C.height/VH);OX=(C.width-VW*SC)/2;OY=(C.height-VH*SC)/2;GOX=OX;GOY=OY;isLandscape=false}
  else{
    isLandscape=C.width>C.height;
    if(isLandscape){
      const tw=CTRL_W+VW+CTRL_W;SC=Math.min(C.width/tw,C.height/VH);
      OX=(C.width-tw*SC)/2;OY=(C.height-VH*SC)/2;GOX=OX+CTRL_W*SC;GOY=OY;
    }else{
      SC=Math.min(C.width/VW,C.height/VH);
      OX=(C.width-VW*SC)/2;OY=(C.height-VH*SC)/2;GOX=OX;GOY=OY;
    }
  }
  const fsBtn=document.getElementById('fsBtn');
  fsBtn.style.display='block';
  fsBtn.style.color=document.fullscreenElement?'#fff':'#ffcc00';
  // Text scale: boost text size on small screens (SC<0.6 → text up to 1.6x)
  TS=SC<0.5?1.8:SC<0.7?1.4:SC<0.9?1.15:1;
}
function toggleFullscreen(){
  if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(()=>{})}
  else{document.exitFullscreen()}
}
document.addEventListener('fullscreenchange',()=>{
  const fsBtn=document.getElementById('fsBtn');
  fsBtn.style.display='block';
  fsBtn.style.color=document.fullscreenElement?'#fff':'#ffcc00';
  resize();
});
addEventListener('resize',resize);resize();
window.addEventListener('load',()=>{resize()});
document.addEventListener('DOMContentLoaded',()=>{resize()});

// ═══ GAMEPAD EVENTS ═══
window.addEventListener('gamepadconnected',()=>{hasRealGP=true;isController=true;ea()});
window.addEventListener('gamepaddisconnected',()=>{hasRealGP=false;if(!isVGPActive)isController=false});

// ═══ SHARED HELPERS ═══
function inRect(vx,vy,rx,ry,rw,rh){return vx>=rx&&vx<=rx+rw&&vy>=ry&&vy<=ry+rh}
function inCircle(vx,vy,cx,cy,r){return Math.hypot(vx-cx,vy-cy)<=r}

// ═══ GAMEPAD STATE ═══
const GP={axes:[0,0,0,0],btns:{},prev:{},lt:0,rt:0};
let isController=false;
let isVGPActive=false;
let yTapTime=0,bTapTime=0,bLastTap=0;
const DEADZONE=0.15;
function gpAxis(n){const v=GP.axes[n]||0;return Math.abs(v)<DEADZONE?0:v}
function gpJust(c){return GP.btns[c]&&!GP.prev[c]}
function gpHeld(c){return!!GP.btns[c]}
function pollGamepad(){
  try{
  const gps=navigator.getGamepads?navigator.getGamepads():null;
  if(!gps)return;
  const gp=gps[0]||gps[1]||gps[2]||gps[3];
  if(gp){
    hasRealGP=true;isController=true;
    GP.axes[0]=gp.axes[0]||0;GP.axes[1]=gp.axes[1]||0;
    GP.axes[2]=gp.axes[2]||0;GP.axes[3]=gp.axes[3]||0;
    GP.lt=gp.buttons[6]?gp.buttons[6].value:0;
    GP.rt=gp.buttons[7]?gp.buttons[7].value:0;
    for(let i=0;i<gp.buttons.length;i++){
      const pressed=gp.buttons[i].pressed||(gp.buttons[i].value>0.5);
      GP.btns[i]=pressed;
    }
    if(gp.vibrationActuator)GP._vib=gp.vibrationActuator;
  }
  }catch(e){}
}
function gpVibrate(dur,force){
  if(!GP._vib)return;
  try{GP._vib.playEffect('dual-rumble',{duration:dur,startDelay:0,strongMagnitude:force,weakMagnitude:force*.6})}catch(e){}
}
function gpEndFrame(){GP.prev={...GP.btns}}

// ═══ VIRTUAL GAMEPAD ═══
const VGP={
  ljx:0,ljy:0,rjx:0,rjy:0,
  lt:0,rt:0,
  lb:false,rb:false,
  a:false,b:false,x:false,y:false,
  du:false,dd:false,dl:false,dr:false,
  start:false,back:false,
  ljTouch:-1,rjTouch:-1,
  touchMap:{}
};
const CTL={
  trigs:[{id:'LT',x:0,y:0,w:200,h:65},{id:'LB',x:200,y:0,w:200,h:65},{id:'RB',x:400,y:0,w:200,h:65},{id:'RT',x:600,y:0,w:200,h:65}],
  lj:{cx:200,cy:125,r:50},rj:{cx:600,cy:125,r:50},
  mid:[{id:'start',cx:365,cy:125,r:14},{id:'back',cx:435,cy:125,r:14}],
  btns:[{id:'X',cx:100,cy:215,r:28},{id:'Y',cx:300,cy:215,r:28},{id:'A',cx:500,cy:215,r:28},{id:'B',cx:700,cy:215,r:28}],
  dpad:[
    {id:'dl',x:10,y:258,w:185,h:38},
    {id:'dd',x:205,y:258,w:185,h:38},
    {id:'du',x:400,y:258,w:185,h:38},
    {id:'dr',x:595,y:258,w:185,h:38}
  ],
  // Landscape split
  lTrigs:[{id:'LT',x:0,y:5,w:CTRL_W/2,h:100}],
  lBtns:[{id:'LB',x:CTRL_W/2,y:5,w:CTRL_W/2,h:100}],
  lJoy:{cx:CTRL_W/2,cy:180,r:55},
  lDpad:[{cx:CTRL_W/2,cy:370,arm:82,thick:22}],
  lMid:[{id:'start',cx:CTRL_W/2,cy:530,r:16}],
  rTrigs:[{id:'RT',x:CTRL_W/2,y:5,w:CTRL_W/2,h:100}],
  rBtns:[{id:'RB',x:0,y:5,w:CTRL_W/2,h:100}],
  rJoy:{cx:CTRL_W/2,cy:180,r:55},
  rFace:[{id:'Y',cx:CTRL_W/2,cy:308,r:28},{id:'X',cx:CTRL_W/2-58,cy:365,r:28},{id:'B',cx:CTRL_W/2+58,cy:365,r:28},{id:'A',cx:CTRL_W/2,cy:422,r:28}],
  rMid:[{id:'back',cx:CTRL_W/2,cy:530,r:18}]
};
function syncVGP(){
  if(!useMobileLayout())return;
  const hasJoy=VGP.ljTouch>=0||VGP.rjTouch>=0;
  const hasBtn=VGP.lt||VGP.rt||VGP.lb||VGP.rb||VGP.a||VGP.b||VGP.x||VGP.y||VGP.du||VGP.dd||VGP.dl||VGP.dr||VGP.start||VGP.back;
  isVGPActive=hasJoy||hasBtn;
  isController=isVGPActive;
  GP.axes[0]=VGP.ljx;GP.axes[1]=VGP.ljy;
  GP.axes[2]=VGP.rjx;GP.axes[3]=VGP.rjy;
  GP.lt=VGP.lt;GP.rt=VGP.rt;
  GP.btns[0]=VGP.a;GP.btns[1]=VGP.b;GP.btns[2]=VGP.x;GP.btns[3]=VGP.y;
  GP.btns[4]=VGP.lb;GP.btns[5]=VGP.rb;
  GP.btns[12]=VGP.du;GP.btns[13]=VGP.dd;GP.btns[14]=VGP.dl;GP.btns[15]=VGP.dr;
  GP.btns[8]=VGP.back;GP.btns[9]=VGP.start;
}

// ═══ AUDIO ═══
const AC=window.AudioContext||window.webkitAudioContext;
let ac=null,musicMuted=false;
function ea(){if(!ac)ac=new AC();if(ac.state==='suspended')ac.resume()}
function tone(f,d,t,v,dl){if(!ac)return;const tt=ac.currentTime+(dl||0);const o=ac.createOscillator(),g=ac.createGain();o.type=t||'square';o.frequency.setValueAtTime(f,tt);g.gain.setValueAtTime(Math.min(v||.07,.12),tt);g.gain.exponentialRampToValueAtTime(.001,tt+d);o.connect(g);g.connect(ac.destination);o.start(tt);o.stop(tt+d+.05)}
function nz(d,v,dl){if(!ac)return;const tt=ac.currentTime+(dl||0);const n=Math.floor(ac.sampleRate*d),b=ac.createBuffer(1,n,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=ac.createBufferSource();s.buffer=b;const g=ac.createGain();g.gain.setValueAtTime(Math.min(v||.05,.12),tt);g.gain.exponentialRampToValueAtTime(.001,tt+d);s.connect(g);g.connect(ac.destination);s.start(tt)}

const SFX={
  mg(){tone(600,.04,'square',.05);nz(.03,.03)},
  pistol(){tone(400,.06,'square',.06);tone(300,.04,'square',.03,.02)},
  rocket(){tone(200,.3,'sawtooth',.07);tone(100,.4,'square',.05,.1);nz(.2,.05)},
  grenade(){tone(300,.08,'square',.04);tone(200,.05,'square',.03,.05)},
  explodeS(){nz(.15,.08);tone(80,.2,'sine',.06)},
  explodeL(){nz(.4,.1);tone(60,.5,'sine',.08);tone(40,.6,'sine',.06,.1)},
  hit(){tone(200,.05,'square',.07);tone(150,.08,'square',.05,.03)},
  hitE(){tone(500,.03,'square',.03);nz(.02,.02)},
  kill(){tone(600,.04,'square',.04);tone(400,.06,'square',.03,.04)},
  pickup(){tone(523,.05,'square',.05);tone(659,.05,'square',.05,.05);tone(784,.08,'square',.05,.1)},
  heal(){tone(440,.08,'triangle',.05);tone(554,.08,'triangle',.05,.08);tone(659,.12,'triangle',.05,.16)},
  strat(){tone(523,.1,'square',.06);tone(659,.1,'square',.06,.1);tone(784,.15,'square',.06,.2)},
  ms(){tone(440,.05,'square',.04)},
  mc(){tone(523,.06,'square',.05);tone(784,.1,'square',.05,.06)},
  drop(){tone(150,.5,'sawtooth',.07);nz(.3,.05,.3)},
  nest(){tone(200,.2,'square',.07);tone(300,.2,'square',.07,.15);tone(400,.3,'square',.07,.3);nz(.5,.08,.2)},
  reload(){tone(800,.03,'square',.03);tone(600,.03,'square',.03,.04)},
  laser(){tone(1200,.1,'sawtooth',.04);tone(800,.15,'square',.03,.05)},
  scream(){tone(800,.15,'sawtooth',.08);tone(600,.2,'sawtooth',.06,.1);tone(400,.3,'sawtooth',.04,.2)},
  noAmmo(){tone(200,.05,'square',.04);tone(150,.05,'square',.03,.05)},
};

// ═══ MUSIC ENGINE — Web Audio API (works on HTTP after user gesture) ═══
let musicGain=null,musicSrc=null,musicBuf=null,mOn=false,mVol=.6,mLoading=false;
function loadMusic(){
  if(musicBuf||mLoading||!ac)return;
  mLoading=true;
  console.log('[MUSIC] URL base:', location.href);
  console.log('[MUSIC] Fetching music.ogg desde:', new URL('music.ogg', location.href).href);
  fetch('music.ogg').then(r=>{console.log('[MUSIC] OGG status:',r.status,'ok:',r.ok);if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(d=>{console.log('[MUSIC] OGG bytes:',d.byteLength);return ac.decodeAudioData(d)}).then(b=>{
    console.log('[MUSIC] ✓ OGG decoded OK');musicBuf=b;mLoading=false;if(mOn)_startMusicSrc();
  }).catch(e=>{
    console.log('[MUSIC] ✗ OGG failed:',e);
    fetch('music.mp3').then(r=>{console.log('[MUSIC] MP3 status:',r.status,'ok:',r.ok);if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(d=>{console.log('[MUSIC] MP3 bytes:',d.byteLength);return ac.decodeAudioData(d)}).then(b=>{
      console.log('[MUSIC] ✓ MP3 decoded OK');musicBuf=b;mLoading=false;if(mOn)_startMusicSrc();
    }).catch(e2=>{console.log('[MUSIC] ✗ MP3 also failed:',e2);mLoading=false});
  });
}
function _startMusicSrc(){
  if(!musicBuf||musicSrc)return;
  musicSrc=ac.createBufferSource();musicSrc.buffer=musicBuf;musicSrc.loop=true;
  musicSrc.connect(musicGain);musicSrc.start();
}
function playMusic(vol){
  if(!ac)return;ea();
  if(!musicGain){musicGain=ac.createGain();musicGain.connect(ac.destination)}
  mVol=vol||.6;musicGain.gain.value=mVol;
  if(mOn)return;mOn=true;
  loadMusic();
  if(musicBuf)_startMusicSrc();
}
function stopMusic(){if(musicSrc){try{musicSrc.stop()}catch(e){}musicSrc=null}mOn=false}
function resetMusic(){stopMusic()}
function setMusicVol(v){mVol=v;if(musicGain)musicGain.gain.value=v}
function updateMusicInt(){}

// ═══ DATA ═══
const DIFF=[
  {nm:'TIRADO',hm:.7,sr:200,me:8,tp:['warrior'],nr:240,nh:80,ds:'Pocos enemigos debiles',sm:1},
  {nm:'FACIL',hm:.85,sr:160,me:12,tp:['warrior','hunter'],nr:200,nh:90,ds:'Enemigos moderados',sm:1.1},
  {nm:'NORMAL',hm:1,sr:120,me:18,tp:['warrior','hunter','spewer'],nr:160,nh:100,ds:'Combate equilibrado',sm:1.2},
  {nm:'DIFICIL',hm:1.05,sr:90,me:22,tp:['warrior','hunter','spewer','charger'],nr:200,nh:120,ds:'Enemigos numerosos',sm:1.35},
  {nm:'EXTREMO',hm:1.10,sr:70,me:28,tp:['warrior','hunter','spewer','charger'],nr:160,nh:140,ds:'Amenaza seria',sm:1.5},
  {nm:'SUICIDA',hm:1.15,sr:50,me:32,tp:['warrior','hunter','spewer','charger','titan'],nr:120,nh:160,ds:'Solo para valientes',sm:1.65},
  {nm:'HELLDIVER',hm:1.20,sr:35,me:40,tp:['warrior','hunter','spewer','charger','titan'],nr:80,nh:200,ds:'POR LA LIBERTAD!',sm:1.8}
];
const BIOM=[
  {nm:'LUNAR',ds:'Superficie gris y crateres',b:'#2a2a30',b2:'#222228',b3:'#333338',rc:['#3a3a42','#333340','#404048'],deco:'none',pc:'#1e1e26',pc2:'#aaa'},
  {nm:'DESERTICO',ds:'Arena, cactus y dunas',b:'#c4a44a',b2:'#b89840',b3:'#d4b45a',rc:['#a08838','#8a7230','#b89848'],deco:'cactus',pc:'#9a8030',pc2:'#daa'},
  {nm:'BOSCOSO',ds:'Vegetacion, arboles y lagos',b:'#2a3a20',b2:'#223018',b3:'#334428',rc:['#3a4a30','#334028','#445538'],deco:'tree',pc:'#1a2810',pc2:'#8bf'},
  {nm:'VOLCANICO',ds:'Volcanes y lagos de lava',b:'#1a0a0a',b2:'#2a1010',b3:'#3a1818',rc:['#4a2020','#3a1515','#553030'],deco:'volcano',pc:'#1a0505',pc2:'#f80'},
];
const EDEF={
  warrior:{hp:30,sp:.8,dm:8,sc:10,sz:12,c1:'#446600',c2:'#335500',ar:14,at:40,ag:90},
  hunter:{hp:20,sp:1.5,dm:12,sc:15,sz:10,c1:'#557700',c2:'#446600',ar:16,at:50,ag:100},
  spewer:{hp:60,sp:.5,dm:15,sc:25,sz:18,c1:'#664400',c2:'#553300',ar:140,at:100,ag:110,ranged:1},
  charger:{hp:150,sp:1.2,dm:30,sc:100,sz:26,c1:'#553322',c2:'#442211',ar:20,at:70,ag:120},
  titan:{hp:400,sp:.4,dm:50,sc:300,sz:40,c1:'#334422',c2:'#223311',ar:25,at:100,ag:130},
};
const SDEF={
  dog:{nm:'Perro Guardian',sq:['down','up','left','up','right','right'],cl:'#00ffff',cd:0,mc:600,target:1,pod:1},
  laser:{nm:'Laser Orbital',sq:['right','down','up','right','down'],cl:'#ff0000',cd:0,mc:900,target:1},
  eagle:{nm:'Aguila Cluster',sq:['up','right','down','down','right'],cl:'#ffaa00',cd:0,mc:720,target:1},
  jump:{nm:'Mochila Salto',sq:['down','up','up','down','up'],cl:'#00ff88',cd:0,mc:300,bp:1},
  cmd:{nm:'Lanz Cohetes',sq:['down','left','right','right','left'],cl:'#88ff00',cd:0,mc:480,target:1,pod:1},
  sup:{nm:'Suministros',sq:['down','left','down','up','up','down'],cl:'#ffff00',cd:0,mc:360,target:1,pod:1},
};
const VL={
  shoot:["DEMOCRACIA!","FREEDOM!","Para la Super Tierra!","Toma!","Recibe libertad!","Muere bicho!"],
  grenade:["Granada!","Toma pastilla!","Come te esta!","Insecto!","Fuego libre!"],
  hit:["Me dieron!","Auch!","Malditos!","Tocaron mi armadura!"],
  kill:["Abatido!","Uno menos!","Libertad entregada","Eso es democracia"],
  strat:["Estratagema solicitado!","Cayendo apoyo!","Super Tierra provee!"],
  stim:["Me siento como nuevo!","Stim activado!","Curado!"],
  nest:["Nido destruido!","Hogar eliminado!","Limpieza completada!"],
  drop:["EN LA CARA!","Por la libertad!","Super Tierra ha llegado!"],
  low:["Necesito apoyo!","Me estan matando!"],
};
let vLine='',vTimer=0;
function say(c){const l=VL[c];if(!l)return;vLine=l[Math.floor(Math.random()*l.length)];vTimer=120}

// ═══ IMAGES ═══
const imgLogo=new Image();imgLogo.src='logo.png';
const imgPersonajes=new Image();imgPersonajes.src='personajes.png';

// ═══ STATE ═══
let gs='title',ds=0,ps=0,menuS=0;
let clScroll=0;
let cam={x:0,y:0},MW=3200,MH=2400,fc=0,shake=0;
let score=0,kills=0,nestD=0,totalN=0,mTimer=0;
let obstacles=[];
let PODS=[];
let EAGLES=[];
let DROPS=[];
let extractReady=false,extracting=false,extractCode=[],extractInput=[];
let PELICAN=null,exitPhase=0,exitTmr=0;
let collectedAmmo=0,collectedGrenades=0,collectedStims=0,collectedItems=0;
let victoryMenu=0;
let debugMenu=false,debugSel=0;

// ═══ INPUT ═══
const K={};const M={x:VW/2,y:VH/2,down:false,click:false};
let JP={};
function cj(){JP={}}

// ═══ DRAW ═══
function dp(x,y,w,h,c){X.fillStyle=c;X.fillRect(x|0,y|0,w,h)}
function dArrow(cx,cy,dir,sz,c){
  X.save();X.fillStyle=c;X.strokeStyle=c;X.lineWidth=2;
  const hs=sz*.45;
  if(dir==='up'){
    X.beginPath();X.moveTo(cx,cy-sz);X.lineTo(cx-hs,cy-hs*.2);X.lineTo(cx+hs,cy-hs*.2);X.closePath();X.fill();
    X.beginPath();X.moveTo(cx,cy-hs*.2);X.lineTo(cx,cy+sz*.6);X.stroke();
  }else if(dir==='down'){
    X.beginPath();X.moveTo(cx,cy+sz);X.lineTo(cx-hs,cy+hs*.2);X.lineTo(cx+hs,cy+hs*.2);X.closePath();X.fill();
    X.beginPath();X.moveTo(cx,cy+hs*.2);X.lineTo(cx,cy-sz*.6);X.stroke();
  }else if(dir==='left'){
    X.beginPath();X.moveTo(cx-sz,cy);X.lineTo(cx-hs*.2,cy-hs);X.lineTo(cx-hs*.2,cy+hs);X.closePath();X.fill();
    X.beginPath();X.moveTo(cx-hs*.2,cy);X.lineTo(cx+sz*.6,cy);X.stroke();
  }else{
    X.beginPath();X.moveTo(cx+sz,cy);X.lineTo(cx+hs*.2,cy-hs);X.lineTo(cx+hs*.2,cy+hs);X.closePath();X.fill();
    X.beginPath();X.moveTo(cx+hs*.2,cy);X.lineTo(cx-sz*.6,cy);X.stroke();
  }
  X.restore();
}
function dPanel(x,y,w,h,c){
  // Draw a dark semi-transparent panel with border
  X.save();X.fillStyle='rgba(0,0,0,.75)';X.fillRect(x,y,w,h);
  X.strokeStyle=c||'#555';X.lineWidth=1;X.strokeRect(x,y,w,h);X.restore();
}
function dtOutline(t,x,y,s,c,ac){
  // Text with dark outline for readability
  const fs=Math.round(s*TS);X.font=`bold ${fs}px 'Courier New',monospace`;
  X.textAlign=ac||'left';X.textBaseline='middle';
  X.strokeStyle='#000';X.lineWidth=3;X.lineJoin='round';X.strokeText(t,x,y);
  X.fillStyle=c;X.fillText(t,x,y);X.textAlign='left';X.textBaseline='alphabetic';
}
function dt(t,x,y,s,c,a){const ss=Math.round(s*TS);X.fillStyle=c;X.font=`bold ${ss}px 'Courier New',monospace`;X.textAlign=a||'left';X.fillText(t,x,y);X.textAlign='left'}

// ═══ COLLISION ═══
function canGo(x,y,r){
  if(x-r<0||x+r>MW||y-r<0||y+r>MH)return false;
  for(const o of obstacles)if(x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)return false;
  return true;
}
function moveEnt(e,dx,dy){
  const r=(e.sz||10)/2;
  const nx=e.x+dx,ny=e.y+dy;
  if(canGo(nx,e.y,r))e.x=nx;
  if(canGo(e.x,ny,r))e.y=ny;
}
function nearestObstacleDist(x,y){
  let mn=Infinity;
  for(const o of obstacles){
    const cx=Math.max(o.x,Math.min(x,o.x+o.w));
    const cy=Math.max(o.y,Math.min(y,o.y+o.h));
    const d=Math.hypot(x-cx,y-cy);
    if(d<mn)mn=d;
  }
  return mn;
}
function expelEntity(e){
  const r=(e.sz||10)/2+2;
  if(canGo(e.x,e.y,r))return;
  for(let d=0;d<20;d++){
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      if(canGo(e.x+dx*d,e.y+dy*d,r)){e.x+=dx*d;e.y+=dy*d;return}
    }
  }
  e.x+=5;e.y+=5;
}
function expelFromHazards(e){
  const r=(e.sz||10)/2;
  for(const h of [...waterLakes,...lavaLakes,...abyssPits,...sandPits]){
    for(const p of h.parts){
      const px=h.cx+p.dx,py=h.cy+p.dy;
      if(Math.hypot(e.x-px,e.y-py)<p.r+r){
        const a=Math.atan2(e.y-py,e.x-px);
        e.x=px+Math.cos(a)*(p.r+r+4);e.y=py+Math.sin(a)*(p.r+r+4);
      }
    }
  }
}

// ═══ TERRAIN ═══
let terrB=[],rocks=[],craters=[],decs=[],lavaLakes=[],waterLakes=[],abyssPits=[],sandPits=[];
function genIrregular(cx,cy,baseR,numParts){
  const parts=[];
  const angle=Math.random()*6.28;
  const spread=baseR*1.5;
  const r=baseR*0.45;
  for(let i=0;i<numParts;i++){
    const t=(i/(numParts-1))-0.5;
    const ox=Math.cos(angle)*t*spread+(Math.random()-.5)*baseR*0.4;
    const oy=Math.sin(angle)*t*spread+(Math.random()-.5)*baseR*0.4;
    parts.push({dx:ox,dy:oy,r:r*(0.7+Math.random()*0.6)});
  }
  return{cx,cy,parts};
}
function genLShape(cx,cy,baseR){
  const parts=[];
  const angle=Math.random()*6.28;
  const armLen=baseR*2;
  const r=baseR*0.4;
  // Main arm
  for(let i=0;i<5;i++){
    const t=(i/4)-0.5;
    parts.push({dx:Math.cos(angle)*t*armLen,dy:Math.sin(angle)*t*armLen,r:r*(0.8+Math.random()*0.4)});
  }
  // Perpendicular arm at end
  const perpA=angle+Math.PI/2;
  const ex=Math.cos(angle)*armLen*0.5;
  const ey=Math.sin(angle)*armLen*0.5;
  for(let i=0;i<4;i++){
    const t=(i/3)-0.5;
    parts.push({dx:ex+Math.cos(perpA)*t*armLen*0.6,dy:ey+Math.sin(perpA)*t*armLen*0.6,r:r*(0.7+Math.random()*0.5)});
  }
  return{cx,cy,parts};
}
function inHazardGroup(x,y,group){
  for(const p of group.parts)if(Math.hypot(x-(group.cx+p.dx),y-(group.cy+p.dy))<p.r)return true;
  return false;
}
function distToHazardEdge(x,y,group){
  let minD=Infinity;
  for(const p of group.parts){
    const d=Math.hypot(x-(group.cx+p.dx),y-(group.cy+p.dy));
    const edge=p.r-d;
    if(edge>0&&edge<minD)minD=edge;
  }
  return minD;
}
function genTerrain(){
  const b=BIOM[ps];terrB=[];rocks=[];craters=[];decs=[];obstacles=[];mountains=[];lavaLakes=[];waterLakes=[];abyssPits=[];sandPits=[];
  for(let i=0;i<30;i++)craters.push({x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200),r:25+Math.random()*45});
  for(let i=0;i<50;i++){const ci=Math.floor(Math.random()*b.rc.length);rocks.push({x:50+Math.random()*(MW-100),y:50+Math.random()*(MH-100),w:10+Math.random()*16,h:10+Math.random()*16,c:b.rc[ci]})}
  for(let i=0;i<40;i++)terrB.push({x:Math.random()*MW,y:Math.random()*MH,r:50+Math.random()*80,sh:Math.random()>.5?4:-4});
  // Mountains — large blocking terrain with topographic effect
  const mCount=8+Math.floor(Math.random()*5);
  for(let i=0;i<mCount;i++){
    const mx=200+Math.random()*(MW-400),my=200+Math.random()*(MH-400);
    const mw=80+Math.random()*120,mh=70+Math.random()*100;
    mountains.push({x:mx,y:my,w:mw,h:mh,c1:'#555',c2:'#777',c3:'#999'});
    obstacles.push({x:mx-mw/2,y:my-mh/2,w:mw,h:mh,tp:'mountain'});
  }
  // Obstacles per planet
  if(ps===0){for(let i=0;i<35;i++){const w=35+Math.random()*70,h=30+Math.random()*55;obstacles.push({x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200),w,h,tp:'boulder'})}for(let i=0;i<13;i++){const cx=100+Math.random()*(MW-200),cy=100+Math.random()*(MH-200);for(let j=0;j<3;j++)obstacles.push({x:cx+(Math.random()-.5)*50,y:cy+(Math.random()-.5)*50,w:18+Math.random()*25,h:18+Math.random()*25,tp:'boulder'})}}
  else if(ps===1){for(let i=0;i<25;i++){const hor=Math.random()>.5;obstacles.push({x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200),w:hor?70+Math.random()*100:15+Math.random()*25,h:hor?12+Math.random()*20:50+Math.random()*80,tp:'rock'})}for(let i=0;i<20;i++)obstacles.push({x:80+Math.random()*(MW-160),y:80+Math.random()*(MH-160),w:20+Math.random()*30,h:30+Math.random()*50,tp:'cactus'})}
  else if(ps===2){for(let i=0;i<20;i++){const cx=100+Math.random()*(MW-200),cy=100+Math.random()*(MH-200);for(let j=0;j<4;j++)obstacles.push({x:cx+(Math.random()-.5)*70,y:cy+(Math.random()-.5)*70,w:22+Math.random()*30,h:22+Math.random()*30,tp:'tree'})}for(let i=0;i<14;i++)obstacles.push({x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200),w:50+Math.random()*80,h:10+Math.random()*12,tp:'log'})}
  else if(ps===3){for(let i=0;i<28;i++){const w=30+Math.random()*60,h=25+Math.random()*50;obstacles.push({x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200),w,h,tp:'volcanic_rock'})}for(let i=0;i<10;i++){const cx=150+Math.random()*(MW-300),cy=150+Math.random()*(MH-300);obstacles.push({x:cx-20,y:cy-20,w:40,h:40,tp:'volcano'})}}
  if(b.deco==='cactus')for(let i=0;i<20;i++)decs.push({x:80+Math.random()*(MW-160),y:80+Math.random()*(MH-160),tp:'cactus'});
  else if(b.deco==='tree')for(let i=0;i<30;i++)decs.push({x:80+Math.random()*(MW-160),y:80+Math.random()*(MH-160),tp:'tree'});
  else if(b.deco==='volcano')for(let i=0;i<15;i++)decs.push({x:80+Math.random()*(MW-160),y:80+Math.random()*(MH-160),tp:'smoke'});
  // Water lakes (forest planet) — large elongated + L-shapes
  if(ps===2){for(let i=0;i<5;i++){const wx=200+Math.random()*(MW-400),wy=200+Math.random()*(MH-400),wr=70+Math.random()*60;waterLakes.push(genIrregular(wx,wy,wr,7+Math.floor(Math.random()*4)))}for(let i=0;i<2;i++){const wx=200+Math.random()*(MW-400),wy=200+Math.random()*(MH-400);waterLakes.push(genLShape(wx,wy,55+Math.random()*40))}}
  // Lava lakes (volcanic planet) — large elongated + L-shapes
  if(ps===3){for(let i=0;i<5;i++){const lx=200+Math.random()*(MW-400),ly=200+Math.random()*(MH-400),lr=65+Math.random()*60;lavaLakes.push(genIrregular(lx,ly,lr,7+Math.floor(Math.random()*4)))}for(let i=0;i<2;i++){const lx=200+Math.random()*(MW-400),ly=200+Math.random()*(MH-400);lavaLakes.push(genLShape(lx,ly,50+Math.random()*40))}}
  // Abyss pits (lunar planet) — large elongated + L-shapes
  if(ps===0){for(let i=0;i<5;i++){const ax=200+Math.random()*(MW-400),ay=200+Math.random()*(MH-400),ar=55+Math.random()*55;abyssPits.push(genIrregular(ax,ay,ar,6+Math.floor(Math.random()*4)))}for(let i=0;i<2;i++){const ax=200+Math.random()*(MW-400),ay=200+Math.random()*(MH-400);abyssPits.push(genLShape(ax,ay,45+Math.random()*35))}}
  // Quicksand (desert planet) — large elongated + L-shapes
  if(ps===1){for(let i=0;i<5;i++){const sx=200+Math.random()*(MW-400),sy=200+Math.random()*(MH-400),sr=60+Math.random()*55;sandPits.push(genIrregular(sx,sy,sr,6+Math.floor(Math.random()*4)))}for(let i=0;i<2;i++){const sx=200+Math.random()*(MW-400),sy=200+Math.random()*(MH-400);sandPits.push(genLShape(sx,sy,50+Math.random()*35))}}
  // Remove near spawn
  obstacles=obstacles.filter(o=>Math.hypot(o.x+o.w/2-MW/2,o.y+o.h/2-MH/2)>120);
  mountains=mountains.filter(m=>Math.hypot(m.x-MW/2,m.y-MH/2)>200);
  waterLakes=waterLakes.filter(w=>Math.hypot(w.cx-MW/2,w.cy-MH/2)>150);
  lavaLakes=lavaLakes.filter(l=>Math.hypot(l.cx-MW/2,l.cy-MH/2)>150);
  abyssPits=abyssPits.filter(a=>Math.hypot(a.cx-MW/2,a.cy-MH/2)>150);
  sandPits=sandPits.filter(s=>Math.hypot(s.cx-MW/2,s.cy-MH/2)>150);
}
let stars=[];
let mountains=[];
function genStars(){stars=[];for(let i=0;i<80;i++)stars.push({x:Math.random()*VW,y:Math.random()*VH,s:Math.random()>.9?2:1,t:Math.random()*6.28})}
function drawMap(){
  const b=BIOM[ps];
  X.fillStyle=b.b;X.fillRect(0,0,VW,VH);
  for(const t of terrB){const sx=t.x-cam.x,sy=t.y-cam.y;if(sx+t.r<0||sx-t.r>VW||sy+t.r<0||sy-t.r>VH)continue;X.globalAlpha=.25;X.fillStyle=t.sh>0?b.b3:b.b2;X.beginPath();X.arc(sx,sy,t.r,0,6.28);X.fill();X.globalAlpha=1}
  for(const c of craters){const sx=c.x-cam.x,sy=c.y-cam.y;if(sx+c.r<-50||sx-c.r>VW+50||sy+c.r<-50||sy-c.r>VH+50)continue;X.fillStyle=b.pc;X.beginPath();X.arc(sx,sy,c.r,0,6.28);X.fill();X.strokeStyle=b.b3;X.lineWidth=2;X.beginPath();X.arc(sx,sy,c.r,0,6.28);X.stroke()}
  for(const r of rocks){const sx=r.x-cam.x,sy=r.y-cam.y;if(sx+r.w<-20||sx>VW+20||sy+r.h<-20||sy>VH+20)continue;dp(sx,sy,r.w,r.h,r.c)}
  // Draw water lakes (forest) — irregular
  for(const w of waterLakes){
    for(const p of w.parts){
      const sx=w.cx+p.dx-cam.x,sy=w.cy+p.dy-cam.y;
      if(sx+p.r<-20||sx-p.r>VW+20||sy+p.r<-20||sy-p.r>VH+20)continue;
      X.globalAlpha=.6;X.fillStyle='#2244aa';X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.fill();
      X.globalAlpha=.3;X.fillStyle='#4488cc';X.beginPath();X.arc(sx-p.r*.2,sy-p.r*.2,p.r*.5,0,6.28);X.fill();
      X.globalAlpha=.2;X.fillStyle='#66aaee';const ww=Math.sin(fc*.03+p.dx)*p.r*.3;X.beginPath();X.arc(sx+ww,sy,p.r*.3,0,6.28);X.fill();
      X.globalAlpha=1;
    }
  }
  // Draw lava lakes (volcanic) — irregular
  for(const l of lavaLakes){
    // Glow layer (drawn first, behind all parts)
    for(const p of l.parts){
      const sx=l.cx+p.dx-cam.x,sy=l.cy+p.dy-cam.y;
      if(sx+p.r*1.3<-20||sx-p.r*1.3>VW+20||sy+p.r*1.3<-20||sy-p.r*1.3>VH+20)continue;
      X.globalAlpha=.15;X.fillStyle='#ff4400';X.beginPath();X.arc(sx,sy,p.r*1.3,0,6.28);X.fill();X.globalAlpha=1;
    }
    for(const p of l.parts){
      const sx=l.cx+p.dx-cam.x,sy=l.cy+p.dy-cam.y;
      if(sx+p.r<-20||sx-p.r>VW+20||sy+p.r<-20||sy-p.r>VH+20)continue;
      X.globalAlpha=.8;X.fillStyle='#cc2200';X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.fill();
      X.globalAlpha=.5;X.fillStyle='#ff6600';X.beginPath();X.arc(sx,sy,p.r*.7,0,6.28);X.fill();
      const pulse=Math.sin(fc*.08+p.dx)*.2+.4;X.globalAlpha=pulse;X.fillStyle='#ffaa00';X.beginPath();X.arc(sx,sy,p.r*.35,0,6.28);X.fill();
      X.globalAlpha=1;
    }
  }
  // Draw abyss pits (lunar) — irregular
  for(const a of abyssPits){
    for(const p of a.parts){
      const sx=a.cx+p.dx-cam.x,sy=a.cy+p.dy-cam.y;
      if(sx+p.r<-20||sx-p.r>VW+20||sy+p.r<-20||sy-p.r>VH+20)continue;
      X.globalAlpha=1;X.fillStyle='#0a0a0a';X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.fill();
      X.strokeStyle=`rgba(255,0,0,${.3+Math.sin(fc*.1+p.dx)*.2})`;X.lineWidth=2;
      X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.stroke();
      // Falling dust particles
      if(fc%4===0)PA.push({x:a.cx+p.dx+(Math.random()-.5)*p.r,y:a.cy+p.dy,vx:0,vy:.5,l:20,c:'#ff0000'});
    }
  }
  // Draw sand pits (desert) — irregular
  for(const s of sandPits){
    for(const p of s.parts){
      const sx=s.cx+p.dx-cam.x,sy=s.cy+p.dy-cam.y;
      if(sx+p.r<-20||sx-p.r>VW+20||sy+p.r<-20||sy-p.r>VH+20)continue;
      X.globalAlpha=.5;X.fillStyle='#b49650';X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.fill();
      const wave=Math.sin(fc*.05+p.dx)*3;X.globalAlpha=.3;X.fillStyle='#c8aa5a';
      X.beginPath();X.arc(sx+wave,sy,p.r*.6,0,6.28);X.fill();
      X.strokeStyle='rgba(120,100,50,.5)';X.lineWidth=1;
      X.beginPath();X.arc(sx,sy,p.r,0,6.28);X.stroke();X.globalAlpha=1;
    }
  }
  // Draw mountains — solid dark shapes with simple shading
  for(const m of mountains){
    const sx=m.x-cam.x,sy=m.y-cam.y;
    if(sx+m.w<-60||sx-m.w>VW+60||sy+m.h<-60||sy-m.h>VH+60)continue;
    const cx=sx,cy=sy;
    // Base shadow
    X.globalAlpha=.3;X.fillStyle='#000';
    X.beginPath();X.ellipse(cx+3,cy+3,m.w/2,m.h/2,0,0,6.28);X.fill();
    // Mountain body
    X.globalAlpha=1;X.fillStyle='#4a4a50';
    X.beginPath();X.ellipse(cx,cy,m.w/2,m.h/2,0,0,6.28);X.fill();
    // Lighter top-left highlight
    X.globalAlpha=.4;X.fillStyle='#6a6a72';
    X.beginPath();X.ellipse(cx-m.w*.1,cy-m.h*.1,m.w*.35,m.h*.35,0,0,6.28);X.fill();
    // Peak highlight
    X.globalAlpha=.6;X.fillStyle='#8a8a92';
    X.beginPath();X.ellipse(cx-m.w*.05,cy-m.h*.05,m.w*.12,m.h*.12,0,0,6.28);X.fill();
    X.globalAlpha=1;
  }
  // Draw obstacles (skip mountains — already drawn above)
  for(const o of obstacles){const sx=o.x-cam.x,sy=o.y-cam.y;if(sx+o.w<-30||sx>VW+30||sy+o.h<-30||sy>VH+30)continue;
    if(o.tp==='mountain')continue;
    else if(o.tp==='boulder'){dp(sx,sy,o.w,o.h,'#3a3a42');dp(sx+2,sy+2,o.w-4,3,'#4a4a52');dp(sx+o.w/2-4,sy+o.h/2-4,8,8,'#2a2a32')}
    else if(o.tp==='rock'){dp(sx,sy,o.w,o.h,'#8a7230');dp(sx+2,sy+2,o.w-4,3,'#9a8240')}
    else if(o.tp==='cactus'){dp(sx+o.w/2-3,sy+3,6,o.h-3,'#448822');dp(sx,sy+o.h*.3,o.w*.4,4,'#448822');dp(sx+o.w*.6,sy+o.h*.5,o.w*.4,4,'#448822');dp(sx+o.w/2-1,sy,2,4,'#55aa33')}
    else if(o.tp==='tree'){dp(sx+o.w/2-4,sy+o.h-14,8,14,'#553322');dp(sx,sy,o.w,o.h-10,'#225522');dp(sx+3,sy+3,o.w-6,o.h-16,'#227722');dp(sx+5,sy+5,o.w-10,o.h-20,'#228822')}
    else if(o.tp==='log'){dp(sx,sy,o.w,o.h,'#553322');dp(sx+2,sy+2,o.w-4,3,'#664433');dp(sx,sy+o.h/2-2,o.w,4,'#443322')}
    else if(o.tp==='volcanic_rock'){dp(sx,sy,o.w,o.h,'#3a1515');dp(sx+2,sy+2,o.w-4,3,'#4a2020');dp(sx+o.w/2-3,sy+o.h/2-3,6,6,'#551010')}
    else if(o.tp==='volcano'){
      // Volcano: cone shape with crater and smoke
      dp(sx-5,sy-8,o.w+10,o.h+8,'#3a1515');dp(sx,sy-4,o.w,o.h,'#4a2020');dp(sx+4,sy,o.w-8,o.h-8,'#553030');
      // Crater
      dp(sx+o.w/2-6,sy+2,12,8,'#220808');dp(sx+o.w/2-4,sy+3,8,5,'#331010');
      // Lava glow in crater
      X.globalAlpha=.5+Math.sin(fc*.1)*.2;dp(sx+o.w/2-3,sy+4,6,3,'#ff4400');X.globalAlpha=1;
      // Smoke particles
      if(fc%6===0)PA.push({x:o.x+o.w/2+(Math.random()-.5)*10-cam.x,y:o.y-cam.y,vx:(Math.random()-.5)*.3,vy:-.8-Math.random()*.5,l:30,c:'#555'});
    }
  }
  // Decorations (non-blocking)
  for(const d of decs){const sx=d.x-cam.x,sy=d.y-cam.y;if(sx<-20||sx>VW+20||sy<-20||sy>VH+20)continue;
    if(d.tp==='cactus'){dp(sx-2,sy-10,4,12,'#448822');dp(sx-7,sy-7,5,4,'#448822');dp(sx+2,sy-5,5,4,'#448822')}
    else if(d.tp==='tree'){dp(sx-2,sy-2,4,8,'#553322');dp(sx-6,sy-10,12,8,'#225522');dp(sx-4,sy-14,8,6,'#227722')}
  }
  X.strokeStyle='#ff000033';X.lineWidth=4;X.strokeRect(-cam.x,-cam.y,MW,MH);
}
function drawStars(){for(const s of stars){s.t+=.02;X.globalAlpha=.3+Math.sin(s.t)*.3;dp(s.x,s.y,s.s,s.s,'#fff')}X.globalAlpha=1}

// ═══ VIRTUAL CONTROLLER DRAW ═══
function drawTriggers(xOff,yOff,trigs,labels,pressedFn){
  for(let i=0;i<trigs.length;i++){
    const tr=trigs[i],pressed=pressedFn(tr.id);
    const rx=xOff+tr.x+1,ry=yOff+tr.y+1;
    X.globalAlpha=pressed?.7:.45;X.fillStyle=pressed?'#557':'#334';X.fillRect(rx,ry,tr.w-2,tr.h-2);
    X.globalAlpha=pressed?.9:.65;X.strokeStyle='#fff';X.lineWidth=1;X.strokeRect(rx,ry,tr.w-2,tr.h-2);
    X.globalAlpha=pressed?1:.8;dt(labels[i],rx+tr.w/2-1,ry+tr.h/2+5,14,'#fff','center');X.globalAlpha=1;
  }
}
function drawJoyStick(cx,cy,r,touchId,vx,vy,label){
  X.globalAlpha=.15;X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(cx,cy,r,0,6.28);X.stroke();
  X.globalAlpha=.06;X.fillStyle='#fff';X.beginPath();X.arc(cx,cy,r,0,6.28);X.fill();
  const tx=touchId>=0?cx+vx*r:cx,ty=touchId>=0?cy+vy*r:cy;
  X.globalAlpha=touchId>=0?.5:.25;X.fillStyle='#fff';X.beginPath();X.arc(tx,ty,16,0,6.28);X.fill();
  X.globalAlpha=touchId>=0?.7:.4;X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(tx,ty,16,0,6.28);X.stroke();
  X.globalAlpha=1;dt(label,cx,cy+r+14,9,'#666','center');
  if(label==='L'&&touchId>=0&&Math.hypot(vx,vy)>.8){X.globalAlpha=.5;dt('SPRINT',cx,cy+r+26,7,'#4488ff','center');X.globalAlpha=1}
}
function drawBtnCircle(cx,cy,r,label,col,pressed){
  X.globalAlpha=pressed?.55:.2;X.fillStyle=col;X.beginPath();X.arc(cx,cy,r,0,6.28);X.fill();
  X.globalAlpha=pressed?.75:.35;X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(cx,cy,r,0,6.28);X.stroke();
  X.globalAlpha=pressed?.9:.5;dt(label,cx,cy+4,12,'#fff','center');X.globalAlpha=1;
}
function drawDpadCross(d,ox,oy){
  const cx=ox+d.cx,cy=oy+d.cy,a=d.arm,t=d.thick;
  const du=VGP.du,dd=VGP.dd,dl=VGP.dl,dr=VGP.dr;
  // Background circle
  X.globalAlpha=.15;X.fillStyle='#666';X.beginPath();X.arc(cx,cy,a+8,0,6.28);X.fill();X.globalAlpha=1;
  // Cross shape — dark base
  X.globalAlpha=.25;X.fillStyle='#333';
  X.fillRect(cx-t,cy-a,t*2,a*2+t); // vertical bar
  X.fillRect(cx-a,cy-t,a*2+t,t*2); // horizontal bar
  X.globalAlpha=1;
  // Up arm
  X.globalAlpha=du?.55:.3;X.fillStyle=du?'#aaa':'#555';
  X.fillRect(cx-t,cy-a,t*2,a);
  X.globalAlpha=du?.7:.4;X.strokeStyle='#fff';X.lineWidth=1;X.strokeRect(cx-t,cy-a,t*2,a);
  X.globalAlpha=du?1:.5;dt('\u25b2',cx,cy-a/2+4,14,'#fff','center');
  // Down arm
  X.globalAlpha=dd?.55:.3;X.fillStyle=dd?'#aaa':'#555';
  X.fillRect(cx-t,cy,t*2,a);
  X.globalAlpha=dd?.7:.4;X.strokeStyle='#fff';X.lineWidth=1;X.strokeRect(cx-t,cy,t*2,a);
  X.globalAlpha=dd?1:.5;dt('\u25bc',cx,cy+a/2+4,14,'#fff','center');
  // Left arm
  X.globalAlpha=dl?.55:.3;X.fillStyle=dl?'#aaa':'#555';
  X.fillRect(cx-a,cy-t,a,t*2);
  X.globalAlpha=dl?.7:.4;X.strokeStyle='#fff';X.lineWidth=1;X.strokeRect(cx-a,cy-t,a,t*2);
  X.globalAlpha=dl?1:.5;dt('\u25c0',cx-a/2,cy+5,14,'#fff','center');
  // Right arm
  X.globalAlpha=dr?.55:.3;X.fillStyle=dr?'#aaa':'#555';
  X.fillRect(cx,cy-t,a,t*2);
  X.globalAlpha=dr?.7:.4;X.strokeStyle='#fff';X.lineWidth=1;X.strokeRect(cx,cy-t,a,t*2);
  X.globalAlpha=dr?1:.5;dt('\u25b6',cx+a/2,cy+5,14,'#fff','center');
  // Center cap
  X.globalAlpha=.3;X.fillStyle='#777';X.beginPath();X.arc(cx,cy,t*.6,0,6.28);X.fill();X.globalAlpha=1;
}
function drawMidBtn(cx,cy,r,label,pressed){
  X.globalAlpha=pressed?.5:.2;X.fillStyle='#888';X.beginPath();X.arc(cx,cy,r,0,6.28);X.fill();
  X.globalAlpha=pressed?.7:.35;X.strokeStyle='#fff';X.lineWidth=1;X.beginPath();X.arc(cx,cy,r,0,6.28);X.stroke();
  X.globalAlpha=pressed?.9:.45;dt(label,cx,cy+4,10,'#fff','center');X.globalAlpha=1;
}

function drawVirtualController(){
  if(!useMobileLayout())return;
  if(isLandscape){
    // Left controller
    dp(0,0,CTRL_W,VH,'#1a1a22');dp(CTRL_W-1,0,2,VH,'#333');
    drawTriggers(0,0,CTL.lTrigs,['LT'],id=>VGP.lt);
    drawTriggers(0,0,CTL.lBtns,['LB'],id=>VGP.lb);
    drawJoyStick(CTL.lJoy.cx,CTL.lJoy.cy,CTL.lJoy.r,VGP.ljTouch,VGP.ljx,VGP.ljy,'L');
    drawDpadCross(CTL.lDpad[0],0,0);
    drawMidBtn(CTL.lMid[0].cx,CTL.lMid[0].cy,CTL.lMid[0].r,'▶',VGP.start);
    // Right controller
    const rx=CTRL_W+VW;
    dp(rx,0,CTRL_W,VH,'#1a1a22');dp(rx,0,2,VH,'#333');
    drawTriggers(rx,0,CTL.rTrigs,['RT'],id=>VGP.rt);
    drawTriggers(rx,0,CTL.rBtns,['RB'],id=>VGP.rb);
    drawJoyStick(rx+CTL.rJoy.cx,CTL.rJoy.cy,CTL.rJoy.r,VGP.rjTouch,VGP.rjx,VGP.rjy,'R');
    const bcol={X:'#4466cc',Y:'#cccc44',A:'#44cc44',B:'#cc4444'};
    for(const bt of CTL.rFace){drawBtnCircle(rx+bt.cx,bt.cy,bt.r,bt.id,bcol[bt.id],bt.id==='X'?VGP.x:bt.id==='Y'?VGP.y:bt.id==='A'?VGP.a:VGP.b)}
    drawMidBtn(rx+CTL.rMid[0].cx,CTL.rMid[0].cy,CTL.rMid[0].r,'◀',VGP.back);
  }else{
    // Portrait: show rotate message below game area
    const gameBottom=OY+VH*SC;
    const availH=C.height-gameBottom;
    if(availH>20){
      const cx=C.width/2,cy=gameBottom+availH/2;
      const msgS=Math.min(32*TS,availH*0.25);
      const subS=Math.min(16*TS,availH*0.13);
      dt('GIRA EL MÓVIL',cx,cy-subS,msgS,'#ffcc00','center');
      dt('Para jugar en modo horizontal',cx,cy+msgS*0.6,subS,'#aaa','center');
      X.strokeStyle='#ffcc00';X.lineWidth=3;X.globalAlpha=0.7;
      const iconR=Math.min(25*TS,availH*0.15);
      X.beginPath();X.arc(cx,cy-msgS*1.6,iconR,0,Math.PI*1.7);X.stroke();
      X.beginPath();X.moveTo(cx+iconR*0.88,cy-msgS*1.6-iconR);X.lineTo(cx+iconR,cy-msgS*1.6-iconR*0.48);X.lineTo(cx+iconR*0.52,cy-msgS*1.6-iconR*0.68);X.fill();
      X.globalAlpha=1;
    }
  }
}

// ═══ PLAYER ═══
const PL={};
function resetPL(){Object.assign(PL,{x:MW/2,y:MH/2,vx:0,vy:0,hp:100,maxHp:100,stamina:100,maxSt:100,
  speed:2,sprintSpd:3.5,stRegen:.35,angle:0,wpn:1,alive:true,inv:0,
  stims:4,grenades:6,reloading:false,relT:0,fireT:0,sprinting:false,
  hasCmd:false,activeSG:null,sgMode:false,sgPhase:'input',sgInput:'',sgTarget:null,matchedSG:null,targeting:null,
  dropAnim:1200,dropPhase:0,inWater:false,drownT:0,firstDrop:true,
  dying:false,deathT:0,deathCause:'',burning:false,burnT:0,sinkT:0,lives:5,meleeT:0,meleeAnim:0,hazardType:null,
  weapons:{1:{nm:'Ametralladora',am:30,ma:30,rv:150,fr:8,dm:8,sp:.12,rl:90},  2:{nm:'Pistola',am:6,ma:6,rv:42,fr:30,dm:18,sp:.02,rl:45},3:{nm:'Comando',am:4,ma:4,rv:0,fr:28,dm:67,sp:.02,rl:0,rocket:1,splash:25,splashR:55},4:{nm:'Granada',am:6,ma:6,rv:0,fr:0,dm:100,sp:0}}
})}

function drawPL(){
  if(!PL.alive&&!PL.dying)return;
  const sx=PL.x-cam.x,sy=PL.y-cam.y;
  if(PL.inv>0&&(fc/3|0)%2)return;
  X.save();X.translate(sx,sy);
  const breathe=Math.sin(fc*.08)*0.8;
  // Burning: fire overlay
  if(PL.burning){
    X.globalAlpha=.4+Math.sin(fc*.3)*.2;
    for(let i=0;i<4;i++){const fx=(Math.random()-.5)*16,fy=(Math.random()-.5)*16-10;
      dp(fx,fy,4+Math.random()*4,6+Math.random()*6,'#ff4400');dp(fx+1,fy+3,2+Math.random()*3,4+Math.random()*4,'#ffcc00')}
    X.globalAlpha=1;
    X.globalAlpha=.5;dp(-8,-8,16,16,'#ff2200');X.globalAlpha=1;
  }
  // Shadow
  X.globalAlpha=.35;dp(-10,8,20,8,'#000');dp(-8,10,16,4,'#000');X.globalAlpha=1;
  // Cape (layered with shadow)
  const cw=Math.sin(fc*.1)*3;
  dp(-7,1+cw*.2,14,12,'#0c0c0c');
  dp(-6,2+cw*.3,12,10,'#1a1a1a');
  dp(-5,3+cw*.4,10,8,'#222');
  // Cape highlight
  dp(-5,3+cw*.4,4,6,'#2a2a2a');
  // Legs with boots
  if(!PL.burning){
    const ls=Math.sin(fc*.15)*3;
    // Left leg
    dp(-5,9,5,7+ls,'#1a1a1a');dp(-6,9+ls,6,3,'#111');dp(-6,14+ls,7,2,'#333');
    // Right leg
    dp(0,9,5,7-ls,'#1a1a1a');dp(-1,9-ls,6,3,'#111');dp(-1,14-ls,7,2,'#333');
  }else{
    dp(-5,9,5,7,'#111');dp(0,9,5,7,'#111');
  }
  // Body — armor layers
  dp(-9,-8+breathe,18,17,'#1a1a1a');  // dark undersuit
  dp(-8,-7+breathe,16,15,'#cc9900');  // main armor
  dp(-7,-6+breathe,14,13,'#ddaa00');  // armor highlight
  // Chest plate detail
  dp(-5,-5+breathe,10,4,'#bb8800');
  dp(-4,-4+breathe,8,2,'#eebb11');    // chest highlight
  // Belt
  dp(-8,4,16,3,'#444');dp(-7,4,14,2,'#555');
  dp(-2,4,4,3,'#ffcc00');             // belt buckle
  // Arms with joints
  dp(-10,-3+breathe,4,10,'#cc9900');dp(-10,-2+breathe,3,3,'#ddaa00');
  dp(7,-3+breathe,4,10,'#cc9900');dp(8,-2+breathe,3,3,'#ddaa00');
  // Gloves
  dp(-10,5+breathe,4,3,'#444');dp(7,5+breathe,4,3,'#444');
  // Helmet — detailed
  dp(-8,-14+breathe,16,7,'#2a2a2a');  // helmet shell
  dp(-7,-13+breathe,14,5,'#3a3a3a');  // helmet mid
  dp(-6,-12+breathe,12,3,'#444');     // helmet highlight
  // Visor with glow
  dp(-5,-12+breathe,10,4,'#003300');
  dp(-4,-11+breathe,8,3,'#00ff44');
  // Visor reflection
  dp(-3,-11+breathe,3,1,'#88ffaa');
  // Visor glow
  X.globalAlpha=.25+Math.sin(fc*.05)*.1;
  dp(-6,-13+breathe,12,6,'#00ff4433');
  X.globalAlpha=1;
  // Antenna
  dp(6,-16+breathe,2,4,'#555');dp(5,-17+breathe,4,2,'#666');
  // Weapon — rotates around center based on aim angle
  if(!PL.burning){
    X.save();X.rotate(PL.angle);
    if(PL.wpn===1){
      dp(4,-3,18,5,'#3a3a3a');dp(5,-2,16,3,'#555');
      dp(4,-3,18,1,'#666'); // highlight
      dp(20,-2,6,3,'#444');dp(22,-1,4,1,'#888'); // barrel
      dp(22,-3,2,2,'#ff4400'); // muzzle
    }else if(PL.wpn===2){
      dp(5,-2,12,3,'#333');dp(6,-1,10,2,'#555');
      dp(15,-1,5,2,'#666');dp(17,0,3,1,'#888');
    }else if(PL.wpn===3&&PL.hasCmd){
      dp(3,-4,20,7,'#2a4a2a');dp(4,-3,18,5,'#3a6a3a');
      dp(3,-4,20,1,'#4a8a4a');
      dp(19,-3,7,5,'#444');dp(22,-2,4,3,'#666');
      dp(24,-2,2,2,'#ff2200');
    }else if(PL.wpn===4){
      dp(5,-2,12,5,'#555');dp(6,-1,10,3,'#777');
      dp(15,-2,5,4,'#888');
    }
    X.restore();
  }
  // Hazard animations — struggling effects
  if(PL.hazardType==='sand'&&PL.sinkT>0){
    // Quicksand: sand rising on legs, player sinking
    const prog=PL.sinkT/300;
    X.globalAlpha=.6;X.fillStyle='#b49650';
    dp(-8,-2+prog*6,16,8+prog*10,'#b49650');
    dp(-6,-4+prog*4,12,6+prog*8,'#c8aa5a');
    // Arms waving above sand
    const armY=-8+prog*4;
    X.strokeStyle='#ddaa00';X.lineWidth=2;
    X.beginPath();X.moveTo(-4,armY);X.lineTo(-8,armY-6+Math.sin(fc*.2)*3);X.stroke();
    X.beginPath();X.moveTo(4,armY);X.lineTo(8,armY-6+Math.sin(fc*.2+1)*3);X.stroke();
    X.globalAlpha=1;
  }
  if(PL.hazardType==='water'&&PL.drownT>0){
    // Water: head bobbing, arms treading
    const prog=PL.drownT/300;
    X.globalAlpha=.4;X.fillStyle='#2244aa';
    dp(-10,-4+prog*8,20,10+prog*6,'#2244aa');
    // Ripples
    for(let i=0;i<2;i++){
      const rr=8+i*4+Math.sin(fc*.1+i)*2;
      X.strokeStyle='rgba(100,180,255,.3)';X.lineWidth=1;
      X.beginPath();X.ellipse(0,2+prog*4,rr,rr*.3,0,0,6.28);X.stroke();
    }
    X.globalAlpha=1;
  }
  if(PL.burning&&(PL.hazardType==='lava_outer'||PL.hazardType==='lava_inner')){
    // Lava: intense fire overlay
    X.globalAlpha=.5+Math.sin(fc*.2)*.2;
    for(let i=0;i<5;i++){
      const fx=(Math.random()-.5)*16,fy=(Math.random()-.5)*14-6;
      dp(fx,fy,3+Math.random()*4,5+Math.random()*5,'#ff4400');
      dp(fx+1,fy+2,2+Math.random()*3,3+Math.random()*3,'#ffcc00');
    }
    X.globalAlpha=1;
  }
  // Melee swing animation
  if(PL.meleeAnim>0){
    const mProg=1-PL.meleeAnim/15;
    const mAngle=PL.angle+(.5-mProg)*2;
    const mLen=20+mProg*10;
    X.save();X.rotate(mAngle);
    X.strokeStyle=`rgba(255,204,0,${.8-mProg*.6})`;X.lineWidth=3;
    X.beginPath();X.moveTo(12,-2);X.lineTo(12+mLen,-2);X.stroke();
    X.strokeStyle=`rgba(255,255,255,${.5-mProg*.4})`;X.lineWidth=1;
    X.beginPath();X.moveTo(12,-3);X.lineTo(12+mLen,-3);X.stroke();
    X.restore();
    PL.meleeAnim--;
  }
  // Outline — subtle dark border for definition
  X.strokeStyle='rgba(0,0,0,0.15)';X.lineWidth=1;
  X.strokeRect(-9,-14+breathe,18,30);
  X.restore();
  // Guardian dog
  if(PL.activeSG==='dog'){
    const da=fc*.035,dd=38,dwx=PL.x+Math.cos(da)*dd,dwy=PL.y+Math.sin(da)*dd;
    const ddx=dwx-cam.x,ddy=dwy-cam.y;
    // Dog body — more detailed
    dp(ddx-7,ddy-3,14,7,'#555');dp(ddx-6,ddy-2,12,5,'#777');
    dp(ddx-5,ddy-1,10,3,'#888'); // highlight
    dp(ddx+6,ddy-2,5,4,'#666'); // head
    dp(ddx+9,ddy-1,3,2,'#ff0000'); // eye
    dp(ddx+10,ddy,2,1,'#ff4444'); // eye glow
    // Legs
    const dla=Math.sin(fc*.15)*2;
    dp(ddx-5,ddy+3,3,4+dla,'#444');dp(ddx+3,ddy+3,3,4-dla,'#444');
    // Tail
    dp(ddx-8,ddy-4+Math.sin(fc*.1)*2,3,4,'#666');
    if(fc%120===0){const ne=nearE(PL.x,PL.y,220);if(ne){const ba=Math.atan2(ne.y-dwy,ne.x-dwx);BL.push(mkBul(dwx,dwy,ba,7,18,1,'#00ffff'));SFX.pistol()}}
  }
}

// ═══ BULLETS & EFFECTS ═══
let BL=[],EX=[],PA=[],FP=[],LASER=null;
function mkBul(x,y,a,sp,dm,fr,c){return{x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dm,fr,c,life:100,sz:3,rk:0,gr:0}}
function mkRkt(x,y,a){return{x,y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,dm:67,fr:1,c:'#ff8800',life:70,sz:5,rk:1,splash:25,splashR:55,tr:[],gr:0}}
function mkGrn(x,y,a,maxD){const md=maxD||180;return{x,y,vx:Math.cos(a)*4.5,vy:Math.sin(a)*4.5,dm:100,fr:1,life:70,sz:5,rk:0,gr:1,c:'#666',maxD:md,dist:0,ox:x,oy:y,arcH:40,arc:0}}

function updateBL(){
  for(let i=BL.length-1;i>=0;i--){
    const b=BL[i];
    const pvx=b.vx,pvy=b.vy;
    b.x+=b.vx;b.y+=b.vy;b.life--;
    if(b.gr){b.dist+=Math.hypot(b.vx,b.vy);const t=Math.min(b.dist/b.maxD,1);b.arc=b.arcH*4*t*(1-t);if(b.dist>b.maxD){b.life=0}}
    if(b.rk&&b.tr){b.tr.push({x:b.x,y:b.y,l:12});if(fc%2===0)PA.push({x:b.x,y:b.y,vx:(Math.random()-.5),vy:(Math.random()-.5),l:8,c:'#ff6600'})}
    // Obstacle collision for all projectiles (bullets, rockets, grenades)
    for(const o of obstacles){if(b.x>o.x&&b.x<o.x+o.w&&b.y>o.y&&b.y<o.y+o.h){
      if(b.rk){rocketExplode(b,i);break}
      else if(b.gr){b.life=0;break} // grenade: will explode below
      else{b.life=0;break} // bullet: just die
    }}
    if(b.life<=0&&b.gr){
      // Grenade explosion (from obstacle or max distance)
      SFX.explodeL();EX.push({x:b.x,y:b.y,r:15,mr:45,l:25});
      FP.push({x:b.x,y:b.y,r:35,l:200,dm:3});shake=15;if(isController)gpVibrate(300,0.8);
      for(const e of EN)if(e.alive&&Math.hypot(b.x-e.x,b.y-e.y)<55){e.hp-=100;if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10}}
      for(let p=0;p<20;p++)PA.push({x:b.x,y:b.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:25,c:Math.random()>.5?'#ff4400':'#ffaa00'});
      for(let j=NS.length-1;j>=0;j--){const n=NS[j];if(n.destroyed)continue;if(Math.hypot(b.x-n.x,b.y-n.y)<55){
        n.hp-=100;SFX.explodeL();shake=20;
        for(let p=0;p<25;p++)PA.push({x:n.x,y:n.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:30,c:Math.random()>.5?'#ff4400':'#ffaa00'});
        EX.push({x:n.x,y:n.y,r:20,mr:60,l:30});
        if(n.hp<=0){nestD++;score+=500;say('nest');SFX.nest();for(let p=0;p<40;p++)PA.push({x:n.x,y:n.y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,l:40,c:Math.random()>.5?'#ff2200':'#ffcc00'});EX.push({x:n.x,y:n.y,r:30,mr:80,l:40});shake=30;n.destroyed=true}
      }}
      BL.splice(i,1);continue;
    }
    if(!BL[i])continue;
    // Enemy hit
    if(b.fr&&!b.gr){
      for(const e of EN){if(!e.alive)continue;if(Math.hypot(b.x-e.x,b.y-e.y)<e.sz+b.sz){
        if(b.rk){
          // Rocket: explode on impact with direct + splash
          rocketExplode(b,i,e);
          break;
        }
        // Normal bullets
        e.hp-=b.dm;SFX.hitE();
        for(let p=0;p<4;p++)PA.push({x:e.x,y:e.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:15,c:'#44ff00'});
        if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10;say('kill');SFX.kill();EX.push({x:e.x,y:e.y,r:8,mr:18,l:12})}
        else{e.hs=8;e.vx+=pvx*.2;e.vy+=pvy*.2}
        b.life=0;break;
      }}
    }
    // Enemy projectile hits player
    if(!b.fr&&b.life>0&&Math.hypot(b.x-PL.x,b.y-PL.y)<12+PL.sz/2&&PL.inv<=0){
      PL.hp-=b.dm;PL.inv=25;PL.stamina=Math.max(0,PL.stamina-15);shake=8;SFX.hit();say('hit');if(isController)gpVibrate(200,0.5);
      for(let p=0;p<6;p++)PA.push({x:PL.x,y:PL.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:15,c:'#88ff00'});
      b.life=0;
    }
    // Rocket timed explode (if no hit, explodes at end of life)
    if(b.rk&&b.life<=0){rocketExplode(b,i)}
    if(!BL[i])continue;
    if(b.life<=0||b.x<cam.x-100||b.x>cam.x+VW+100||b.y<cam.y-100||b.y>cam.y+VH+100)BL.splice(i,1);
  }
  for(const b of BL)if(b.tr)for(let t=b.tr.length-1;t>=0;t--){b.tr[t].l--;if(b.tr[t].l<=0)b.tr.splice(t,1)}
}

function rocketExplode(b,idx,target){
  const rx=b.x,ry=b.y,sr=b.splashR||55,sd=b.splash||25;
  SFX.explodeL();shake=12;
  EX.push({x:rx,y:ry,r:10,mr:40,l:22});
  for(let p=0;p<16;p++)PA.push({x:rx,y:ry,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:20,c:Math.random()>.5?'#ff4400':'#ffaa00'});
  // Direct hit: full damage
  if(target&&target.alive){
    target.hp-=b.dm;SFX.hitE();
    for(let p=0;p<6;p++)PA.push({x:target.x,y:target.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:15,c:'#ffcc00'});
    target.hs=10;target.vx+=b.vx*.4;target.vy+=b.vy*.4;
    if(target.hp<=0){target.alive=false;kills++;score+=target.sv||10;say('kill');SFX.kill();EX.push({x:target.x,y:target.y,r:8,mr:18,l:12})}
  }
  // Splash: reduced damage to nearby
  for(const e of EN){if(!e.alive)continue;if(e===target)continue;
    const d=Math.hypot(rx-e.x,ry-e.y);
    if(d<sr){const falloff=1-d/sr;const splashDmg=Math.floor(sd*falloff);e.hp-=splashDmg;e.hs=6;
      for(let p=0;p<3;p++)PA.push({x:e.x,y:e.y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:10,c:'#ff8800'});
      if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10}
    }
  }
  // Splash nests
  for(let j=NS.length-1;j>=0;j--){const n=NS[j];if(n.destroyed)continue;if(Math.hypot(rx-n.x,ry-n.y)<sr){
    n.hp-=sd;SFX.explodeL();shake=Math.max(shake,15);
    for(let p=0;p<12;p++)PA.push({x:n.x,y:n.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,l:25,c:Math.random()>.5?'#ff4400':'#ffaa00'});
    EX.push({x:n.x,y:n.y,r:15,mr:45,l:25});
    if(n.hp<=0){nestD++;score+=500;say('nest');SFX.nest();for(let p=0;p<30;p++)PA.push({x:n.x,y:n.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:35,c:Math.random()>.5?'#ff2200':'#ffcc00'});EX.push({x:n.x,y:n.y,r:25,mr:70,l:35});shake=25;n.destroyed=true}
  }}
  BL.splice(idx,1);
}

function updateLaser(){
  if(!LASER)return;
  LASER.timer--;
  if(LASER.timer<=0){LASER=null;return}
  // Chase nearest enemy, prioritizing bigger ones
  let best=null,bestScore=-1;
  for(const e of EN){if(!e.alive)continue;const d=Math.hypot(e.x-LASER.x,e.y-LASER.y);if(d<250){const sc=e.sz*10-d*.1;if(sc>bestScore){bestScore=sc;best=e}}}
  if(best){
    const a=Math.atan2(best.y-LASER.y,best.x-LASER.x);
    LASER.x+=Math.cos(a)*3;LASER.y+=Math.sin(a)*3;
  }else{
    // Drift slowly if no targets
    LASER.x+=Math.cos(LASER.dir)*1.5;LASER.y+=Math.sin(LASER.dir)*1.5;
    LASER.dir+=(Math.random()-.5)*.3;
  }
  if(fc%3===0){
    for(const e of EN)if(e.alive&&Math.hypot(LASER.x-e.x,LASER.y-e.y)<35){e.hp-=25;if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10}}
    FP.push({x:LASER.x+(Math.random()-.5)*20,y:LASER.y+(Math.random()-.5)*20,r:25,l:80,dm:3});
    PA.push({x:LASER.x+(Math.random()-.5)*10,y:LASER.y,vx:(Math.random()-.5)*2,vy:-2,l:15,c:'#ff0000'});
    PA.push({x:LASER.x+(Math.random()-.5)*10,y:LASER.y,vx:(Math.random()-.5)*2,vy:-2,l:15,c:'#ff4400'});
    if(fc%6===0)SFX.laser();
  }
}

function drawBL(){
  for(const b of BL){const sx=b.x-cam.x,sy=b.y-cam.y;if(sx<-30||sx>VW+30||sy<-30||sy>VH+30)continue;
    if(b.gr){
      // Grenade: arc upward (toward top of screen) based on trajectory progress
      const arcOff=b.arc||0;
      dp(sx-3,sy-3-arcOff,6,6,'#555');dp(sx-2,sy-2-arcOff,4,4,'#777');
      // Shadow on ground
      X.globalAlpha=.25;dp(sx-3,sy-3,6,6,'#000');X.globalAlpha=1;
      continue;
    }
    if(b.tr)for(const t of b.tr){X.globalAlpha=t.l/12;dp(t.x-cam.x-1,t.y-cam.y-1,3,3,'#ff6600');X.globalAlpha=1}
    dp(sx-b.sz/2,sy-b.sz/2,b.sz,b.sz,b.c);if(b.rk)dp(sx-2,sy-2,b.sz+4,b.sz+4,'#ff4400')
  }
}
function updateEX(){for(let i=EX.length-1;i>=0;i--){const e=EX[i];e.r+=(e.mr-e.r)*.25;e.l--;if(e.l<=0)EX.splice(i,1)}}
function updatePA(){const maxP=isMobile?80:999;while(PA.length>maxP)PA.shift();for(let i=PA.length-1;i>=0;i--){const p=PA[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.04;p.l--;if(p.l<=0)PA.splice(i,1)}}
function updateFP(){for(let i=FP.length-1;i>=0;i--){const f=FP[i];f.l--;if(fc%12===0)for(const e of EN)if(e.alive&&Math.hypot(f.x-e.x,f.y-e.y)<f.r){e.hp-=f.dm;if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10}}if(fc%4===0&&f.l>30)PA.push({x:f.x+(Math.random()-.5)*f.r,y:f.y+(Math.random()-.5)*f.r,vx:(Math.random()-.5)*.5,vy:-Math.random()*1.5,l:12,c:Math.random()>.5?'#ff4400':'#ffaa00'});if(f.l<=0)FP.splice(i,1)}}
function drawFX(){
  for(const f of FP){const sx=f.x-cam.x,sy=f.y-cam.y;X.globalAlpha=Math.min(1,f.l/60)*.4;X.fillStyle='#ff4400';X.beginPath();X.arc(sx,sy,f.r,0,6.28);X.fill();X.fillStyle='#ff8800';X.beginPath();X.arc(sx,sy,f.r*.6,0,6.28);X.fill();X.globalAlpha=1}
  for(const e of EX){const sx=e.x-cam.x,sy=e.y-cam.y;X.globalAlpha=Math.min(1,e.l/20);X.fillStyle='#ff6600';X.beginPath();X.arc(sx,sy,e.r,0,6.28);X.fill();X.fillStyle='#ffcc00';X.beginPath();X.arc(sx,sy,e.r*.5,0,6.28);X.fill();X.fillStyle='#fff';X.beginPath();X.arc(sx,sy,e.r*.2,0,6.28);X.fill();X.globalAlpha=1}
  for(const p of PA){const sx=p.x-cam.x,sy=p.y-cam.y;X.globalAlpha=Math.min(1,p.l/15);dp(sx,sy,2,2,p.c);X.globalAlpha=1}
  // Laser beam
  if(LASER){const sx=LASER.x-cam.x,sy=LASER.y-cam.y;X.globalAlpha=.6+Math.sin(fc*.2)*.2;X.strokeStyle='#ff0000';X.lineWidth=6;X.beginPath();X.moveTo(sx,sy-300);X.lineTo(sx,sy);X.stroke();X.strokeStyle='#ffaa00';X.lineWidth=2;X.beginPath();X.moveTo(sx,sy-300);X.lineTo(sx,sy);X.stroke();X.globalAlpha=1;dp(sx-8,sy-8,16,16,'#ff000044');dp(sx-4,sy-4,8,8,'#ff0000')}
}

// ═══ ENEMIES ═══
let EN=[],spTmr=0;
function spawnE(tp,x,y,fresh){
  const d=DIFF[ds],t=EDEF[tp];
  EN.push({x:x||PL.x+(Math.random()-.5)*700,y:y||PL.y+(Math.random()-.5)*700,vx:0,vy:0,
    hp:t.hp*d.hm,mhp:t.hp*d.hm,sp:t.sp*d.sm,dm:t.dm,sv:t.sc,sz:t.sz,c1:t.c1,c2:t.c2,ar:t.ar,at:t.at,ag:t.ag,
    tp,alive:1,hs:0,angle:0,pcx:x||0,pcy:y||0,pa:Math.random()*6.28,pt:60+Math.random()*120,
    st:'patrol',atm:t.at,ranged:t.ranged||0,charging:0,ctm:0,
    canCall:fresh&&tp!=='titan'&&tp!=='charger',hasCalled:0,calling:0,callT:0});
  const e=EN[EN.length-1];const r=e.sz/2;
  if(!canGo(e.x,e.y,r)||inAnyHazard(e.x,e.y,r)){
    let placed=false;
    for(let d2=20;d2<120&&!placed;d2+=20){for(let a=0;a<6.28&&!placed;a+=1.05){
      const tx=e.x+Math.cos(a)*d2,ty=e.y+Math.sin(a)*d2;
      if(canGo(tx,ty,r)&&!inAnyHazard(tx,ty,r)){e.x=tx;e.y=ty;placed=true}}}
    if(!placed)EN.pop();
  }
}
function spawnG(tp,x,y){const c=2+(Math.random()*3|0);for(let i=0;i<c;i++){const gx=x+(Math.random()-.5)*50,gy=y+(Math.random()-.5)*50;spawnE(tp,gx,gy,1);const e=EN[EN.length-1];e.pcx=x;e.pcy=y}}
function nearE(x,y,r){let b=null,bd=r;for(const e of EN){if(!e.alive)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;b=e}}return b}

function updateEN(){
  const d=DIFF[ds];spTmr++;
  const maxE=isMobile?Math.min(d.me,25):d.me;
  if(spTmr>=d.sr&&EN.length<maxE){spTmr=0;const sd=Math.random()*4|0;let sx,sy;
    if(sd===0){sx=cam.x-60;sy=cam.y+Math.random()*VH}else if(sd===1){sx=cam.x+VW+60;sy=cam.y+Math.random()*VH}else if(sd===2){sx=cam.x+Math.random()*VW;sy=cam.y-60}else{sx=cam.x+Math.random()*VW;sy=cam.y+VH+60}
    const tp=d.tp[Math.random()*d.tp.length|0];spawnG(tp,sx,sy)}
  for(const n of NS){if(n.destroyed)continue;if(n.stm<=0&&EN.length<d.me){n.stm=n.sr;const tp=Math.random()>.7?'hunter':'warrior';spawnE(tp,n.x+(Math.random()-.5)*40,n.y+(Math.random()-.5)*40,1);
    // Expel newly spawned enemy from obstacles/hazards
    if(EN.length>0){const ne=EN[EN.length-1];expelEntity(ne);expelFromHazards(ne)}
    // Visual emerge effect
    for(let p=0;p<8;p++)PA.push({x:n.x+(Math.random()-.5)*30,y:n.y+(Math.random()-.5)*20,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:20,c:'#88ff44'});
    n.emerge=15; // flash timer for visual feedback
  }n.stm--;
  if(n.emerge>0)n.emerge--}
  for(const e of EN){if(!e.alive)continue;
    const dp2=Math.hypot(e.x-PL.x,e.y-PL.y);e.angle=Math.atan2(PL.y-e.y,PL.x-e.x);
    if(e.hs>0){e.hs--;e.x+=e.vx;e.y+=e.vy;e.vx*=.7;e.vy*=.7;continue}
    e.vx*=.85;e.vy*=.85;
    // Reinforcement calling
    if(e.calling){
      e.callT++;
      // Yellow smoke particles
      if(fc%4===0)PA.push({x:e.x+(Math.random()-.5)*8,y:e.y-e.sz/2-5,vx:(Math.random()-.5)*.6,vy:-1.2-Math.random()*.5,l:30,c:'#ccaa00'});
      if(fc%6===0)PA.push({x:e.x+(Math.random()-.5)*12,y:e.y-e.sz/2-8,vx:(Math.random()-.5)*.4,vy:-.8,l:25,c:'#ffdd44'});
      if(fc%3===0)PA.push({x:e.x+(Math.random()-.5)*6,y:e.y-e.sz/2-3,vx:(Math.random()-.5)*.8,vy:-1.5,l:20,c:'#88aa00'});
      // After 5 seconds (300 frames): spawn reinforcements
      if(e.callT>=300){
        e.calling=0;e.hasCalled=1;
        // Spawn reinforcement group near the caller
        const rTypes=['warrior','warrior','hunter','hunter','spewer'];
        const rCount=3+(Math.random()*3|0);
        for(let r=0;r<rCount;r++){
          const rx=e.x+(Math.random()-.5)*120,ry=e.y+(Math.random()-.5)*120;
          const rtp=rTypes[Math.random()*rTypes.length|0];
          spawnE(rtp,rx,ry,1);
          if(EN.length>0){const ne=EN[EN.length-1];expelEntity(ne);expelFromHazards(ne)}
        }
        SFX.explodeS();shake=8;
        for(let p=0;p<10;p++)PA.push({x:e.x,y:e.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:15,c:'#ccaa00'});
        say('low');
      }
      // Cancel if player gets too far (>300px)
      if(dp2>300){e.calling=0;e.hasCalled=1;e.callT=0}
      continue; // Don't move while calling
    }
    if(e.st==='patrol'){
      if(dp2<e.ag){
        e.st='alert';
        // Chain alert nearby patrol enemies
        for(const o of EN)if(o!==e&&o.alive&&o.st==='patrol'&&Math.hypot(o.x-e.x,o.y-e.y)<130)o.st='alert';
        // Small enemies may start calling reinforcements
        if(e.canCall&&!e.hasCalled&&(e.tp==='warrior'||e.tp==='hunter')&&dp2<e.ag){
          if(Math.random()<.35){e.calling=1;e.callT=0;e.st='chase'}
        }
      }
      else{e.pt--;if(e.pt<=0){e.pa+=(Math.random()-.5)*2;e.pt=60+Math.random()*120}const tx=e.pcx+Math.cos(e.pa)*50,ty=e.pcy+Math.sin(e.pa)*50;const ta=Math.atan2(ty-e.y,tx-e.x);moveEnt(e,Math.cos(ta)*e.sp*.3,Math.sin(ta)*e.sp*.3)}
    }
    if(e.st==='alert'){if(dp2<e.ag*.7)e.st='chase';else if(dp2>e.ag*2)e.st='patrol';else moveEnt(e,Math.cos(e.angle)*e.sp*.6,Math.sin(e.angle)*e.sp*.6)}
    if(e.st==='chase'){if(dp2>e.ag*2.5)e.st='patrol';else moveEnt(e,Math.cos(e.angle)*e.sp,Math.sin(e.angle)*e.sp)}
    if(e.tp==='charger'&&e.st==='chase'){
      if(!e.charging&&dp2<180){e.ctm++;if(e.ctm>50){e.charging=1;e.ctm=0}}
      if(e.charging){moveEnt(e,Math.cos(e.angle)*5,Math.sin(e.angle)*5);e.ctm++;if(e.ctm>35){e.charging=0;e.ctm=0}      if(dp2<22&&PL.inv<=0){PL.hp-=e.dm;PL.inv=30;shake=12;SFX.hit();say('hit');if(isController)gpVibrate(200,0.5)}continue}
    }
    if(e.st==='chase'||e.st==='alert'){e.atm--;if(e.atm<=0){
      if(e.ranged&&dp2<e.ar){BL.push({x:e.x,y:e.y,vx:Math.cos(e.angle)*3,vy:Math.sin(e.angle)*3,dm:e.dm,fr:0,c:'#88ff00',life:60,sz:4,rk:0,gr:0});e.atm=e.at}
      else if(dp2<e.ar){if(PL.inv<=0){PL.hp-=e.dm;PL.inv=25;shake=8;SFX.hit();say('hit');if(isController)gpVibrate(200,0.5)}e.atm=e.at}
    }}
    if(!canGo(e.x,e.y,e.sz/2)){e.vx*=-.5;e.vy*=-.5}
    // Push enemy away if overlapping player
    const overlapDist=(e.sz/2+10);
    if(dp2<overlapDist&&dp2>0){
      const pushA=Math.atan2(e.y-PL.y,e.x-PL.x);
      const pushF=(overlapDist-dp2)*.5;
      e.x+=Math.cos(pushA)*pushF;e.y+=Math.sin(pushA)*pushF;
    }
    // Push enemy away from other enemies
    for(const o of EN){
      if(o===e||!o.alive)continue;
      const ed=Math.hypot(e.x-o.x,e.y-o.y);
      const minD=(e.sz+o.sz)/2;
      if(ed<minD&&ed>0){
        const pa=Math.atan2(e.y-o.y,e.x-o.x);
        const pf=(minD-ed)*.3;
        e.x+=Math.cos(pa)*pf;e.y+=Math.sin(pa)*pf;
      }
    }
    // Expel from obstacles and hazards if stuck
    expelEntity(e);
    expelFromHazards(e);
  }
  EN=EN.filter(e=>e.alive);
}

function drawEN(){
  for(const e of EN){const sx=e.x-cam.x,sy=e.y-cam.y;if(sx<-50||sx>VW+50||sy<-50||sy>VH+50)continue;
  X.save();X.translate(sx,sy);
    if(e.tp==='titan'){
      const s=e.sz;const la=Math.sin(fc*.06)*2;
      // Legs (6)
      for(let i=0;i<6;i++){const lo=(fc*.08+i*1.2)%6.28;const lx=-s/2+4+i*(s/5.5);
        dp(lx,s/2-2,5,10+Math.sin(lo)*3,'#3a4422');dp(lx+1,s/2,3,8+Math.sin(lo)*2,'#4a5a2a');
        dp(lx+2,s/2+7+Math.sin(lo)*3,3,3,'#2a3010'); // foot
      }
      // Shadow under body
      dp(-s/2+2,s/2-4,s-4,6,'#1a2010');
      // Body — layered
      dp(-s/2,-s/2,s,s,e.c1);
      dp(-s/2+4,-s/2+4,s-8,s-8,e.c2);
      dp(-s/2+6,-s/2+6,s-12,s-12,'#3a4a22');
      // Armor plates
      dp(-s/2+2,-s/2+2,s/2-2,s/3,'#4a5a30');
      dp(s/4,-s/2+2,s/2-2,s/3,'#4a5a30');
      // Head/mandibles
      dp(-s/2-8,-8,16,8,'#4a5a2a');dp(-s/2-6,-7,12,6,'#5a6a3a');
      dp(-s/2-12,-6,8,3,'#6a7a4a');dp(-s/2-12,2,8,3,'#6a7a4a'); // mandibles
      // Eyes — large red glowing
      dp(-s/2+6,-s/2+4,8,6,'#550000');dp(-s/2+7,-s/2+5,6,4,'#ff0000');
      dp(s/2-14,-s/2+4,8,6,'#550000');dp(s/2-13,-s/2+5,6,4,'#ff0000');
      // Eye glow
      X.globalAlpha=.3+Math.sin(fc*.1)*.15;
      dp(-s/2+5,-s/2+3,10,8,'#ff000044');dp(s/2-15,-s/2+3,10,8,'#ff000044');
      X.globalAlpha=1;
      // Spine ridges
      for(let i=0;i<4;i++){dp(-s/2+6+i*8,-s/2-2-la,5,4,'#5a6a3a');dp(-s/2+7+i*8,-s/2-1-la,3,2,'#6a7a4a')}
      // Outline
      X.strokeStyle='rgba(0,0,0,0.1)';X.lineWidth=1.5;X.strokeRect(-s/2-1,-s/2-1,s+2,s+2);
    }else if(e.tp==='charger'){
      const s=e.sz;
      // Legs with animation
      for(let i=0;i<3;i++){const la=Math.sin(fc*.1+i)*2;
        dp(-s/2+i*(s/2.5),s/2-2,5,8+la,'#6a5a2a');dp(-s/2+i*(s/2.5)+1,s/2+4+la,4,3,'#4a3a1a');
      }
      // Shadow
      dp(-s/2,s/2-4,s,5,'#3a2a10');
      // Body — armored
      dp(-s/2,-s/2,s,s,e.c1);
      dp(-s/2+3,-s/2+3,s-6,s*.6,e.c2);
      // Armor plates
      dp(-s/2+2,-s/2+2,s-4,s/3,'#7a6a3a');
      dp(-s/2+4,-s/2+4,s-8,s/4,'#8a7a4a');
      // Horn
      dp(-4,-s/2-10,8,12,'#886633');dp(-3,-s/2-8,6,8,'#aa8844');
      dp(-2,-s/2-12,4,6,'#ccaa55');
      // Eyes
      dp(-s/2+4,-4,5,4,'#662200');dp(-s/2+5,-3,3,2,'#ff4400');
      dp(s/2-9,-4,5,4,'#662200');dp(s/2-8,-3,3,2,'#ff4400');
      // Charge glow
      if(e.charging){X.globalAlpha=.4+Math.sin(fc*.3)*.2;
        dp(-s/2-4,-s/2-4,s+8,s+8,'#ff440044');
        dp(-s/2-2,-s/2-2,s+4,s+4,'#ff660022');
        X.globalAlpha=1;
      }
      // Outline
      X.strokeStyle='rgba(0,0,0,0.1)';X.lineWidth=1.5;X.strokeRect(-s/2-1,-s/2-12,s+2,s+14);
    }else if(e.tp==='spewer'){
      const s=e.sz;const la=Math.sin(fc*.08);
      // Legs
      dp(-s/2-3,2,5,6+la,e.c2);dp(s/2-2,2,5,6-la,e.c2);
      dp(-s/2-1,4,4,5+la,'#4a3a0a');dp(s/2-3,4,4,5-la,'#4a3a0a');
      // Shadow
      dp(-s/2,s/2-3,s,4,'#3a3a0a');
      // Body — bloated organic
      dp(-s/2,-s/3,s,s*.66,e.c1);
      dp(-s/2+2,-s/3+2,s-4,s*.66-4,e.c2);
      dp(-s/2+4,-s/3+4,s-8,s*.66-6,'#886622');
      // Belly detail
      dp(-s/2-2,-s/4,s+4,s*.5,'#775500');
      dp(-s/2+1,-s/4+3,s-2,s*.3,'#886611');
      // Head
      dp(-s/3,-s/2,s*.66,s/3,e.c1);
      dp(-s/3+2,-s/2+2,s*.66-4,s/3-2,e.c2);
      // Eyes
      dp(-s/3+1,-s/2+2,4,4,'#884400');dp(-s/3+2,-s/2+3,2,2,'#ffaa00');
      dp(s/3-5,-s/2+2,4,4,'#884400');dp(s/3-4,-s/2+3,2,2,'#ffaa00');
      // Spitting animation
      if(fc%30<15){dp(-2,-s/3-3,5,5,'#66ff00');dp(-1,-s/3-5,3,3,'#88ff22');
        X.globalAlpha=.4;dp(-3,-s/3-6,7,4,'#44ff0066');X.globalAlpha=1}
      // Outline
      X.strokeStyle='rgba(0,0,0,0.1)';X.lineWidth=1;X.strokeRect(-s/2-1,-s/2-1,s+2,s*.66+2);
    }else if(e.tp==='hunter'){
      const s=e.sz;const la=Math.sin(fc*.18);
      // 4 legs — long, fast
      dp(-s/2-2,2,3,8+la,e.c2);dp(s/2-1,2,3,8-la,e.c2);
      dp(-s/2-1,-2,2,6+la,e.c2);dp(s/2-1,-2,2,6-la,e.c2);
      dp(-s/2+2,3,3,7-la,e.c2);dp(s/2-5,3,3,7+la,e.c2);
      // Shadow
      dp(-s/2,s/2-2,s,3,'#2a2a0a');
      // Body — sleek, fast
      dp(-s/2,-s/3,s,s*.66,e.c1);
      dp(-s/2+2,-s/3+2,s-4,s*.66-4,e.c2);
      dp(-s/2+3,-s/3+3,s-6,s*.66-6,'#5a5a1a');
      // Head
      dp(-s/3,-s/2,s*.66,s/3,e.c1);
      dp(-s/3+2,-s/2+2,s*.66-4,s/3-2,e.c2);
      // Eyes — large, yellow, menacing
      dp(-s/3+1,-s/2+2,3,3,'#886600');dp(-s/3+2,-s/2+3,2,2,'#ffff00');
      dp(s/3-4,-s/2+2,3,3,'#886600');dp(s/3-3,-s/2+3,2,2,'#ffff00');
      // Mandibles
      dp(-s/3-1,-s/2+4,3,2,'#776600');dp(s/3-2,-s/2+4,3,2,'#776600');
      // Outline
      X.strokeStyle='rgba(0,0,0,0.1)';X.lineWidth=1;X.strokeRect(-s/2-1,-s/2-1,s+2,s*.66+2);
    }else{
      // Warrior — default
      const s=e.sz;const la=Math.sin(fc*.12);
      // Legs
      dp(-s/2-3,0,4,6+la,e.c2);dp(s/2-1,0,4,6-la,e.c2);
      dp(-s/2-2,-s/4,3,5+la,e.c2);dp(s/2-1,-s/4,3,5-la,e.c2);
      // Shadow
      dp(-s/2,s/2-2,s,3,'#2a2a0a');
      // Body
      dp(-s/2,-s/3,s,s*.66,e.c1);
      dp(-s/2+2,-s/3+2,s-4,s*.66-4,e.c2);
      dp(-s/2+3,-s/3+3,s-6,s*.66-6,'#7a6a2a');
      // Head
      dp(-s/3,-s/2,s*.66,s/3,e.c1);
      dp(-s/3+2,-s/2+2,s*.66-4,s/3-2,e.c2);
      // Eyes
      dp(-s/3+1,-s/2+2,3,3,'#666600');dp(-s/3+2,-s/2+3,2,2,'#ffff00');
      dp(s/3-4,-s/2+2,3,3,'#666600');dp(s/3-3,-s/2+3,2,2,'#ffff00');
      // Mandibles/arms
      dp(-s/3-2,-s/6,4,3,'#667700');dp(s/3-2,-s/6,4,3,'#667700');
      dp(-s/3-3,-s/8,3,2,'#778811');dp(s/3-1,-s/8,3,2,'#778811');
      // Outline
      X.strokeStyle='rgba(0,0,0,0.1)';X.lineWidth=1;X.strokeRect(-s/2-1,-s/2-1,s+2,s*.66+2);
    }
    // State indicator
    if(e.calling){
      const pulse=Math.sin(fc*.15)*.4+.6;X.globalAlpha=pulse;
      dp(-4,-e.sz/2-16,8,8,'#ccaa00');dp(-3,-e.sz/2-15,6,6,'#ffdd44');
      dp(-1,-e.sz/2-18,2,4,'#ffcc00');dp(-2,-e.sz/2-20,4,2,'#ffee66');
      X.globalAlpha=1;
      const pct=e.callT/300;X.strokeStyle='#ffaa00';X.lineWidth=2;X.globalAlpha=.7;
      X.beginPath();X.arc(0,0,e.sz/2+6,-.5*Math.PI,-.5*Math.PI+pct*6.28);X.stroke();X.globalAlpha=1;
    }
    else if(e.st==='alert'){X.globalAlpha=.5+Math.sin(fc*.2)*.3;dp(-2,-e.sz/2-10,4,5,'#ffff00');X.globalAlpha=1}
    else if(e.st==='chase'){dp(-3,-e.sz/2-12,6,5,'#ff0000')}
    // HP bar
    if(e.hp<e.mhp&&(e.tp==='charger'||e.tp==='titan')){dp(-e.sz/2,-e.sz/2-14,e.sz,3,'#222');dp(-e.sz/2,-e.sz/2-14,e.sz*(e.hp/e.mhp),3,'#ff0000');dp(-e.sz/2,-e.sz/2-14,e.sz*(e.hp/e.mhp),1,'#ff6666')}
    X.restore();
  }
}

// ═══ NESTS ═══
let NS=[];
function inAnyHazard(x,y,r){for(const h of [...waterLakes,...lavaLakes,...abyssPits,...sandPits])for(const p of h.parts)if(Math.hypot(x-(h.cx+p.dx),y-(h.cy+p.dy))<p.r+r)return true;return false}
function spawnNS(){const d=DIFF[ds],c=8+(Math.random()*5|0);for(let i=0;i<c;i++){const x=250+Math.random()*(MW-500),y=250+Math.random()*(MH-500);if(Math.hypot(x-PL.x,y-PL.y)<350)continue;if(!canGo(x,y,25)||inAnyHazard(x,y,25))continue;NS.push({x,y,hp:d.nh,stm:0,sr:d.nr,ph:Math.random()*6.28})}totalN=NS.length}
function drawNS(){for(const n of NS){const sx=n.x-cam.x,sy=n.y-cam.y;if(sx<-70||sx>VW+70||sy<-70||sy>VH+70)continue;
  if(n.destroyed){
    // Destroyed nest — collapsed, smoldering crater
    dp(sx-22,sy-10,44,20,'#2a1a0a');dp(sx-18,sy-8,36,16,'#3a2a1a');dp(sx-14,sy-6,28,12,'#4a3a2a');
    dp(sx-10,sy-4,20,8,'#554030');dp(sx-6,sy-2,12,4,'#2a1a0a');
    // Scorch marks
    dp(sx-26,sy-4,6,3,'#1a1008');dp(sx+20,sy-2,5,4,'#1a1008');dp(sx-8,sy+6,4,3,'#1a1008');
    // Smoke wisps
    if(fc%12<6){PA.push({x:n.x+(Math.random()-.5)*16,y:n.y-8,vx:(Math.random()-.5)*.3,vy:-.4,l:40,c:'#555'})}
    // Red X marker
    X.strokeStyle='#aa2200';X.lineWidth=2;X.globalAlpha=.5+Math.sin(fc*.05)*.2;
    X.beginPath();X.moveTo(sx-10,sy-10);X.lineTo(sx+10,sy+10);X.stroke();
    X.beginPath();X.moveTo(sx+10,sy-10);X.lineTo(sx-10,sy+10);X.stroke();
    X.globalAlpha=1;
    continue;
  }
  const p=Math.sin(fc*.04+n.ph)*3;
  // Nest — layered organic mound
  dp(sx-24-p,sy-16,48+p*2,32,'#332211');
  dp(sx-20-p,sy-12,40+p*2,24,'#443322');
  dp(sx-16-p,sy-8,32+p*2,16,'#553333');
  dp(sx-12,sy-6,24,10,'#664444');
  dp(sx-8,sy-4,16,6,'#663333');
  // Hole opening
  dp(sx-6,sy-3,12,4,'#221111');dp(sx-4,sy-2,8,2,'#330000');
  // Organic detail — veins
  X.strokeStyle='#554433';X.lineWidth=1.5;X.globalAlpha=.6;
  X.beginPath();X.moveTo(sx-18,sy-4);X.quadraticCurveTo(sx-10,sy-14,sx-2,sy-4);X.stroke();
  X.beginPath();X.moveTo(sx+2,sy-4);X.quadraticCurveTo(sx+10,sy-12,sx+18,sy-4);X.stroke();
  X.globalAlpha=1;
  // Pulsing glow from hole
  const glow=.2+Math.sin(fc*.06+n.ph)*.15;X.globalAlpha=glow;
  dp(sx-8,sy-8,16,8,'#66ff4466');
  X.globalAlpha=1;
  // Particles
  if(fc%8===0)PA.push({x:n.x+(Math.random()-.5)*20,y:n.y-14,vx:(Math.random()-.5)*.4,vy:-.5,l:30,c:'#66ff44'});
  // HP bar
  if(n.hp<DIFF[ds].nh){dp(sx-22,sy-24,44,4,'#222');dp(sx-22,sy-24,44*(n.hp/DIFF[ds].nh),4,'#ff4400');dp(sx-22,sy-24,44*(n.hp/DIFF[ds].nh),1,'#ff8866')}
  // Emerge flash
  if(n.emerge>0){X.globalAlpha=n.emerge/15*.5;X.fillStyle='#88ff44';X.beginPath();X.arc(sx,sy,25,0,6.28);X.fill();X.globalAlpha=1}
}}

// ═══ COLLECTIBLES ═══
let CL=[];
const CT={ammo:{c:'#ffcc00',f:'ammo',v:30,nm:'MUNICIONES'},grenade:{c:'#888',f:'grenade',v:2,nm:'GRANADAS'},stim:{c:'#00ff00',f:'stim',v:2,nm:'STIMS'},medal:{c:'#ffaa00',f:'score',v:100,nm:'MEDALLA'},credit:{c:'#44aaff',f:'score',v:50,nm:'CREDITOS'},sample:{c:'#ff44ff',f:'score',v:200,nm:'MUESTRA'},rare:{c:'#ff8800',f:'score',v:500,nm:'MUESTRA RARA'},super:{c:'#ffffff',f:'score',v:1000,nm:'SUPER MUESTRA'},rocket:{c:'#ff4444',f:'rocket',v:2,nm:'COHETES'}};
function dropLoot(x,y){const pool=['ammo','ammo','ammo','grenade','stim','medal','credit'];if(Math.random()<.1)pool.push('sample');if(Math.random()<.06)pool.push('rare');if(Math.random()<.02)pool.push('super');if(Math.random()<.1)pool.push('rocket');const tp=pool[Math.random()*pool.length|0],ct=CT[tp];CL.push({x:x+(Math.random()-.5)*20,y:y+(Math.random()-.5)*20,tp,c:ct.c,f:ct.f,v:ct.v,life:600,bob:Math.random()*6.28})}
function spawnLoot(){for(let i=0;i<8;i++){const x=100+Math.random()*(MW-200),y=100+Math.random()*(MH-200);if(!canGo(x,y,10)||inAnyHazard(x,y,10))continue;const pool=['ammo','ammo','credit','credit','grenade','medal','stim','sample'];const tp=pool[Math.random()*pool.length|0],ct=CT[tp];CL.push({x,y,tp,c:ct.c,f:ct.f,v:ct.v,life:99999,bob:Math.random()*6.28})}}
function updateCL(){for(let i=CL.length-1;i>=0;i--){const c=CL[i];c.life--;c.bob+=.05;if(c.life<=0){CL.splice(i,1);continue}const d=Math.hypot(c.x-PL.x,c.y-PL.y);if(d<30&&(JP.KeyE||(isController&&gpJust(0)))){const nm=CT[c.tp].nm;collectedItems++;switch(c.f){case'ammo':PL.weapons[1].rv=Math.min(600,PL.weapons[1].rv+c.v);collectedAmmo+=c.v;floatingText(c.x,c.y-10,'+'+c.v+' '+nm,'#ffcc00');break;case'grenade':PL.grenades=Math.min(6,PL.grenades+c.v);collectedGrenades+=c.v;floatingText(c.x,c.y-10,'+'+c.v+' '+nm,'#888');break;case'stim':PL.stims=Math.min(4,PL.stims+c.v);collectedStims+=c.v;floatingText(c.x,c.y-10,'+'+c.v+' '+nm,'#00ff00');break;case'score':score+=c.v;floatingText(c.x,c.y-10,'+'+c.v+' '+nm,'#ffcc00');break;case'rocket':PL.weapons[3].am=Math.min(4,PL.weapons[3].am+c.v);floatingText(c.x,c.y-10,'+'+c.v+' '+nm,'#ff4444');break}SFX.pickup();for(let p=0;p<5;p++)PA.push({x:c.x,y:c.y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:12,c:c.c});CL.splice(i,1)}}}
// Near pickup indicator (drawn in HUD)
function drawPickupHint(){for(const c of CL){const d=Math.hypot(c.x-PL.x,c.y-PL.y);if(d<60){const sx=c.x-cam.x,sy=c.y-cam.y-18;X.globalAlpha=Math.max(0,1-d/60);dt(isController?'[A] Recoger':'[E] Recoger',sx,sy,8,'#ffcc00','center');X.globalAlpha=1}}}
// Floating text system
let FT=[];
function floatingText(wx,wy,txt,col){FT.push({x:wx,y:wy,txt,col,life:150,vy:-1.2})}
function updateFT(){for(let i=FT.length-1;i>=0;i--){const f=FT[i];f.y+=f.vy;f.life--;if(f.life<=0)FT.splice(i,1)}}
function drawFT(){for(const f of FT){const sx=f.x-cam.x,sy=f.y-cam.y;X.globalAlpha=Math.min(1,f.life/30);dt(f.txt,sx,sy,10,f.col,'center');X.globalAlpha=1}}

function drawCLIcons(){
  for(const c of CL){const sx=c.x-cam.x,sy=c.y-cam.y+Math.sin(c.bob)*3;
    if(sx<-20||sx>VW+20||sy<-20||sy>VH+20)continue;
    const pulse=Math.sin(fc*.08)*.15;
    // Glow ring
    X.globalAlpha=.15+pulse;X.strokeStyle=c.c;X.lineWidth=1;X.beginPath();X.arc(sx,sy,12,0,6.28);X.stroke();X.globalAlpha=1;
    if(c.tp==='ammo'){
      // Ammo box: brown box with yellow bullets sticking up
      dp(sx-7,sy-2,14,10,'#8B6914');dp(sx-6,sy-1,12,8,'#A0792B');dp(sx-5,sy,10,6,'#8B6914');
      dp(sx-5,sy-3,3,5,'#DAA520');dp(sx-2,sy-4,3,6,'#DAA520');dp(sx+1,sy-3,3,5,'#DAA520');
      dp(sx-4,sy-5,2,2,'#FFE44D');dp(sx-1,sy-6,2,2,'#FFE44D');dp(sx+2,sy-5,2,2,'#FFE44D');
      dp(sx-6,sy+5,12,2,'#6B4F10');
    }else if(c.tp==='grenade'){
      // Grenade: round body with pin
      dp(sx-5,sy-3,10,10,'#555');dp(sx-4,sy-2,8,8,'#6B6B6B');dp(sx-3,sy-1,6,6,'#7C7C7C');
      dp(sx-1,sy,4,4,'#8C8C8C');dp(sx,sy+1,2,2,'#9C9C9C');
      dp(sx-2,sy-6,4,4,'#444');dp(sx+1,sy-8,2,4,'#555');dp(sx+2,sy-9,3,2,'#666');
      dp(sx-3,sy+5,6,2,'#444');dp(sx-4,sy+7,8,1,'#333');
    }else if(c.tp==='stim'){
      // Syringe: glass tube with green liquid and needle
      dp(sx-1,sy-8,2,6,'#AAA');dp(sx-2,sy-9,4,2,'#888');dp(sx,sy-11,1,3,'#CCC');
      dp(sx-2,sy-2,4,10,'#00FF00');dp(sx-1,sy-1,2,8,'#33FF33');dp(sx,sy,1,6,'#66FF66');
      dp(sx-2,sy-3,4,1,'#AAA');dp(sx-2,sy+7,4,1,'#888');
      dp(sx-3,sy+1,1,2,'#00CC00');dp(sx+2,sy+1,1,2,'#00CC00');
      dp(sx-1,sy+9,2,3,'#CCC');dp(sx,sy+11,1,2,'#EEE');
    }else if(c.tp==='medal'){
      // Medal: gold star on red ribbon
      dp(sx-4,sy-1,3,7,'#CC0000');dp(sx+1,sy-1,3,7,'#CC0000');
      dp(sx-5,sy+3,3,2,'#CC0000');dp(sx+2,sy+3,3,2,'#CC0000');
      dp(sx-6,sy-4,12,12,'#DAA520');dp(sx-5,sy-3,10,10,'#FFD700');
      dp(sx-4,sy-2,8,8,'#DAA520');dp(sx-3,sy-1,6,6,'#FFD700');
      dp(sx-1,sy-3,2,2,'#FFFACD');dp(sx,sy-2,1,1,'#FFFACD');
      dp(sx-5,sy-5,2,2,'#DAA520');dp(sx+3,sy-5,2,2,'#DAA520');
      dp(sx-5,sy+3,2,2,'#DAA520');dp(sx+3,sy+3,2,2,'#DAA520');
    }else if(c.tp==='credit'){
      // Coin: blue circle with $
      dp(sx-6,sy-6,12,12,'#1E5B8E');dp(sx-5,sy-5,10,10,'#2874A6');
      dp(sx-4,sy-4,8,8,'#2E86C1');dp(sx-3,sy-3,6,6,'#3498DB');
      dp(sx-2,sy-2,4,4,'#5DADE2');
      dt('$',sx,sy+4,12,'#FFF','center');
      dp(sx-5,sy-6,2,2,'#85C1E9');dp(sx+3,sy-6,2,2,'#85C1E9');
    }else if(c.tp==='sample'){
      // Purple vial: glass with purple liquid
      dp(sx-2,sy-6,4,12,'#AA44CC');dp(sx-1,sy-5,2,10,'#CC66EE');
      dp(sx,sy-4,1,8,'#DD88FF');
      dp(sx-3,sy-7,6,2,'#666');dp(sx-2,sy-8,4,2,'#888');dp(sx-1,sy-9,2,2,'#AAA');
      dp(sx-3,sy+3,6,2,'#666');dp(sx-2,sy+5,4,1,'#555');
      dp(sx-1,sy-2,1,1,'#FFAAFF');
    }else if(c.tp==='rare'){
      // Orange vial with star
      dp(sx-2,sy-6,4,12,'#CC6600');dp(sx-1,sy-5,2,10,'#FF8800');
      dp(sx,sy-4,1,8,'#FFAA33');
      dp(sx-3,sy-7,6,2,'#666');dp(sx-2,sy-8,4,2,'#888');dp(sx-1,sy-9,2,2,'#AAA');
      dp(sx-3,sy+3,6,2,'#666');dp(sx-2,sy+5,4,1,'#555');
      // Star mark
      dp(sx,sy-10,2,2,'#FFD700');dp(sx-1,sy-11,1,1,'#FFD700');dp(sx+1,sy-11,1,1,'#FFD700');
    }else if(c.tp==='super'){
      // White diamond with glow
      X.globalAlpha=.3+Math.sin(fc*.1)*.2;X.fillStyle='#FFF';X.beginPath();X.arc(sx,sy,10,0,6.28);X.fill();X.globalAlpha=1;
      dp(sx-1,sy-8,2,16,'#FFFFFF');dp(sx-3,sy-6,6,1,'#FFFFFF');dp(sx-4,sy-4,8,1,'#FFFFFF');
      dp(sx-4,sy-2,8,1,'#FFFFFF');dp(sx-3,sy,6,1,'#FFFFFF');dp(sx-1,sy+2,2,2,'#FFFFFF');
      dp(sx-2,sy-6,4,1,'#EEE');dp(sx-3,sy-4,6,1,'#DDD');dp(sx-3,sy-2,6,1,'#EEE');
      dp(sx,sy-5,1,1,'#FFFFFF');
    }else if(c.tp==='rocket'){
      // Rocket: body with fins and flame
      dp(sx-2,sy-8,4,14,'#CC3333');dp(sx-1,sy-7,2,12,'#EE4444');dp(sx,sy-6,1,10,'#FF6666');
      dp(sx-3,sy-2,2,5,'#888');dp(sx+1,sy-2,2,5,'#888');
      dp(sx-1,sy-9,2,3,'#DDD');dp(sx,sy-10,1,2,'#FFF');
      dp(sx-3,sy+5,2,4,'#FF8800');dp(sx+1,sy+5,2,4,'#FF8800');
      dp(sx-1,sy+5,2,6,'#FFCC00');dp(sx,sy+6,1,5,'#FFEE44');
      dp(sx-2,sy+9,4,2,'#FF4400');dp(sx-1,sy+10,2,2,'#FF6600');
    }
    // Flash when about to expire
    if(c.life<120&&(fc/4|0)%2){X.globalAlpha=.3;dp(sx-8,sy-8,16,16,'#ff0000');X.globalAlpha=1}
  }
}

// ═══ STRATAGEMS ═══
function activateSG(key){
  const sd=SDEF[key];if(!sd||sd.cd>0)return;
  if(sd.bp){if(key==='dog'&&PL.activeSG==='jump')return;if(key==='jump'&&PL.activeSG==='dog')return}
  sd.cd=sd.mc;SFX.strat();say('strat');
  const tx=PL.sgTarget?PL.sgTarget.x:PL.x,ty=PL.sgTarget?PL.sgTarget.y:PL.y;
  if(key==='dog'){PL.activeSG='dog'}
  else if(key==='jump'){PL.activeSG='jump'}
  else if(key==='cmd'){PL.hasCmd=1;PL.weapons[3].am=PL.weapons[3].ma;PL.wpn=3}
  else if(key==='sup'){PL.weapons[1].rv=600;PL.weapons[2].rv=42;PL.weapons[3].am=4;PL.grenades=6;PL.stims=4;PL.hp=Math.min(PL.maxHp,PL.hp+30)}
  else if(key==='laser'){LASER={x:tx,y:ty,timer:600,dir:Math.random()*6.28};SFX.laser()}
  else if(key==='eagle'){
    // Eagle flyover: plane flies across, drops bombs, leaves
    const eagleAngle=Math.random()*Math.PI*2;
    const eagleSpeed=8;
    const eagleStartX=tx-Math.cos(eagleAngle)*400;
    const eagleStartY=ty-Math.sin(eagleAngle)*400;
    EAGLES.push({x:eagleStartX,y:eagleStartY,angle:eagleAngle,speed:eagleSpeed,targetX:tx,targetY:ty,phase:'approach',timer:0,bombsDropped:false});
  }
}
function updateSG(){for(const k in SDEF)if(SDEF[k].cd>0)SDEF[k].cd--;
  if(PL.sgMode){
    if(JP.KeyW)PL.sgInput+='up,';if(JP.KeyS)PL.sgInput+='down,';if(JP.KeyA)PL.sgInput+='left,';if(JP.KeyD)PL.sgInput+='right,';
    // Controller D-pad for stratagem input
    if(isController){
      if(gpJust(12))PL.sgInput+='up,';if(gpJust(13))PL.sgInput+='down,';if(gpJust(14))PL.sgInput+='left,';if(gpJust(15))PL.sgInput+='right,';
      // B button to cancel stratagem
      if(gpJust(1)){PL.sgMode=false;PL.sgPhase='input';PL.sgInput='';PL.matchedSG=null;SFX.ms()}
    }
    for(const k in SDEF){if(PL.sgInput===SDEF[k].sq.join(',')+','){
      const sd=SDEF[k];
      if(sd.target){PL.sgMode=false;PL.sgPhase='input';PL.sgInput='';PL.targeting=k;PL.matchedSG=k;break}
      activateSG(k);PL.sgMode=false;PL.sgPhase='input';PL.sgInput='';break}}
    if(PL.sgInput.length>30)PL.sgMode=false,PL.sgPhase='input',PL.sgInput='';
  }
}
function drawSGUI(){
  if(PL.sgMode){
    // Full-width dark panel behind stratagem overlay
    dPanel(0,0,VW,VH-50,'#000');
    dtOutline('>> ESTRATAGEMA <<',VW/2,30,16,'#ffcc00','center');
    // Arrow display for current input — draw vectorially
    const parts=PL.sgInput.split(',').filter(s=>s);
    const arrowY=55;const arrSpacing=24;const totalW=parts.length*arrSpacing;
    const startX=VW/2-totalW/2+arrSpacing/2;
    dtOutline('Secuencia:',startX-70,arrowY,10,'#fff','left');
    for(let i=0;i<parts.length;i++){
      dArrow(startX+i*arrSpacing,arrowY,parts[i],8,'#ffffff');
    }
    let y=85;
    for(const k in SDEF){
      const sd=SDEF[k],ready=sd.cd<=0,cl=ready?'#00ff00':'#555';
      const cdTx=ready?'LISTO':Math.ceil(sd.cd/60)+'s';
      // Panel per stratagem row
      const rowW=380,rowH=26,rowX=VW/2-rowW/2;
      dPanel(rowX,y-rowH/2,rowW,rowH,ready?'rgba(0,80,0,.4)':'rgba(50,50,50,.4)');
      // Name
      dtOutline(sd.nm,rowX+8,y+1,11,cl,'left');
      // Draw sequence arrows — centered in the right portion of the row
      const sqLen=sd.sq.length;
      const sqStartX=rowX+rowW-sqLen*14-50;
      for(let i=0;i<sqLen;i++){dArrow(sqStartX+i*14,y+1, sd.sq[i],7,cl)}
      // Cooldown text
      dtOutline(cdTx,rowX+rowW-20,y+1,10,ready?'#00ff00':'#ff6644','center');
      y+=30;
    }
  }
}

// ═══ TARGETING MODE (live map) ═══
function drawTargetingCrosshair(){
  if(!PL.targeting)return;
  const sd=SDEF[PL.targeting];if(!sd)return;
  let tx,ty;
  if(isController){tx=PL.x+Math.cos(PL.angle)*200;ty=PL.y+Math.sin(PL.angle)*200}
  else{tx=M.x+cam.x;ty=M.y+cam.y}
  const rsx=tx-cam.x,rsy=ty-cam.y;
  X.strokeStyle=sd.cl||'#ff0000';X.lineWidth=2;
  X.beginPath();X.arc(rsx,rsy,20,0,6.28);X.stroke();
  X.beginPath();X.moveTo(rsx-25,rsy);X.lineTo(rsx+25,rsy);X.moveTo(rsx,rsy-25);X.lineTo(rsx,rsy+25);X.stroke();
  X.strokeStyle='#ffcc00';
  X.beginPath();X.moveTo(rsx-20,rsy-20);X.lineTo(rsx-10,rsy-20);X.moveTo(rsx-20,rsy-20);X.lineTo(rsx-20,rsy-10);X.stroke();
  X.beginPath();X.moveTo(rsx+20,rsy-20);X.lineTo(rsx+10,rsy-20);X.moveTo(rsx+20,rsy-20);X.lineTo(rsx+20,rsy-10);X.stroke();
  X.beginPath();X.moveTo(rsx-20,rsy+20);X.lineTo(rsx-10,rsy+20);X.moveTo(rsx-20,rsy+20);X.lineTo(rsx-20,rsy+10);X.stroke();
  X.beginPath();X.moveTo(rsx+20,rsy+20);X.lineTo(rsx+10,rsy+20);X.moveTo(rsx+20,rsy+20);X.lineTo(rsx+20,rsy+10);X.stroke();
  dtOutline(sd.nm,VW/2,VH-70,12,sd.cl,'center');
  dtOutline(isController?'A para confirmar destino':'Click para confirmar destino',VW/2,VH-50,11,'#ffcc00','center');
  const psx=PL.x-cam.x,psy=PL.y-cam.y;
  X.globalAlpha=.3;X.strokeStyle=sd.cl||'#ff0000';X.lineWidth=1;X.setLineDash([5,5]);X.beginPath();X.moveTo(psx,psy);X.lineTo(rsx,rsy);X.stroke();X.setLineDash([]);X.globalAlpha=1;
}
function updateTargeting(){
  if(!PL.targeting)return;
  // Launch stratagem with fire action (click / RT trigger)
  if(M.click||(isController&&GP.rt>0.5)){
    const sd=SDEF[PL.targeting];if(!sd)return;
    const maxDist=180;
    let tx,ty;
    if(isController){tx=PL.x+Math.cos(PL.angle)*maxDist;ty=PL.y+Math.sin(PL.angle)*maxDist}
    else{
      const rawDx=M.x+cam.x-PL.x,rawDy=M.y+cam.y-PL.y;
      const rawDist=Math.hypot(rawDx,rawDy);
      if(rawDist>maxDist){tx=PL.x+(rawDx/rawDist)*maxDist;ty=PL.y+(rawDy/rawDist)*maxDist}
      else{tx=M.x+cam.x;ty=M.y+cam.y}
    }
    PL.sgTarget={x:tx,y:ty};
    if(sd.pod){
      PODS.push({x:tx,y:-80+cam.y,targetY:ty,vy:0,type:PL.targeting,phase:'falling',timer:0,sx:tx});
    }else{
      activateSG(PL.targeting);
    }
    PL.targeting=null;PL.matchedSG=null;PL.sgTarget=null;PL.stratUsed=1;
  }
}

// ═══ HELLPODS ═══
function updatePODS(){
  for(let i=PODS.length-1;i>=0;i--){
    const p=PODS[i];
    if(p.phase==='falling'){
      p.vy+=0.4;
      p.y+=p.vy;
      if(p.y>=p.targetY){
        p.phase='ready';p.vy=0;
        shake=12;
        for(let j=0;j<20;j++)PA.push({x:p.x,y:p.targetY,vx:(Math.random()-.5)*5,vy:-1-Math.random()*4,l:30,c:'#888'});
        for(let j=0;j<10;j++)PA.push({x:p.x,y:p.targetY,vx:(Math.random()-.5)*3,vy:-Math.random()*3,l:20,c:'#ffcc00'});
        SFX.explodeL();
        // Kill highest-level enemy directly under hellpod
        let bestE=null,bestSV=-1;
        for(const e of EN){if(!e.alive)continue;
          if(Math.hypot(e.x-p.x,e.y-p.targetY)<e.sz/2+15){
            if(e.sv>bestSV){bestSV=e.sv;bestE=e}
          }
        }
        if(bestE){bestE.alive=false;kills++;score+=bestE.sv||10;SFX.kill();
          for(let j=0;j<8;j++)PA.push({x:bestE.x,y:bestE.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,l:15,c:'#ff4400'});
        }
      }
    }else if(p.phase==='ready'){
      // Check if player is nearby and presses E or A to pick up
      const dist=Math.hypot(PL.x-p.x,PL.y-p.targetY);
      if(dist<50&&(JP.KeyE||(isController&&gpJust(0)))){
        if(p.type==='dog'){PL.activeSG='dog'}
        else if(p.type==='cmd'){PL.hasCmd=1;PL.weapons[3].am=PL.weapons[3].ma;PL.wpn=3}
        else if(p.type==='sup'){PL.weapons[1].rv=600;PL.weapons[2].rv=42;PL.weapons[3].am=4;PL.grenades=6;PL.stims=4;PL.hp=Math.min(PL.maxHp,PL.hp+30)}
        SFX.pickup();say('strat');
        PODS.splice(i,1);continue;
      }
    }
  }
}
function drawPODS(){
  for(const p of PODS){
    const sx=p.x-cam.x,sy=p.y-cam.y;
    if(sy<-60||sy>VH+60)continue;
    X.save();X.translate(sx,sy);
    if(p.phase==='falling'){
      const hi=Math.min(1,Math.abs(p.vy)/10);
      X.globalAlpha=hi*.5;
      for(let i=0;i<4;i++){
        const ty=8+Math.random()*12;
        X.fillStyle=['#ff4400','#ff8800'][i%2];
        X.fillRect((Math.random()-.5)*6,ty,2,8+Math.random()*12);
      }
      X.globalAlpha=1;
    }
    dp(-8,-18,16,36,'#555');dp(-6,-16,12,32,'#777');
    dp(-8,-4,16,1,'#444');dp(-8,6,16,1,'#444');
    dp(-3,-14,6,6,'#222');dp(-2,-13,4,4,'#00ff44');
    X.fillStyle='#666';X.beginPath();X.moveTo(-8,18);X.lineTo(8,18);X.lineTo(0,24);X.closePath();X.fill();
    if(p.phase==='ready'){
      // Pulsing glow
      X.globalAlpha=.3+Math.sin(fc*.1)*.2;
      X.fillStyle='#ffcc00';X.beginPath();X.arc(0,0,20+Math.sin(fc*.08)*5,0,6.28);X.fill();
      X.globalAlpha=1;
    }
    X.restore();
    if(p.phase==='ready'){
      const sd=SDEF[p.type];
      dtOutline(sd?sd.nm:'???',sx,sy-35,10,sd?sd.cl:'#fff','center');
      const pickKey=isController?'A':'E';
      dtOutline('['+pickKey+'] Recoger',sx,sy+35,9,'#ffcc00','center');
    }
  }
}

// ═══ DROPPED ITEMS ═══
function updateDROPS(){
  for(let i=DROPS.length-1;i>=0;i--){
    const d=DROPS[i];
    const dist=Math.hypot(PL.x-d.x,PL.y-d.y);
    if(dist<40&&(JP.KeyE||(isController&&gpJust(0)))){
      if(d.tp==='dog'){PL.activeSG='dog'}
      else if(d.tp==='cmd'){PL.hasCmd=true;PL.weapons[3].am=PL.weapons[3].ma;PL.wpn=3}
      else if(d.tp==='jump'){PL.activeSG='jump'}
      SFX.pickup();say('strat');
      DROPS.splice(i,1);
    }
  }
}
function drawDROPS(){
  for(const d of DROPS){
    const sx=d.x-cam.x,sy=d.y-cam.y;
    if(sx<-40||sx>VW+40||sy<-40||sy>VH+40)continue;
    // Pulsing glow
    X.globalAlpha=.3+Math.sin(fc*.1)*.2;
    X.fillStyle=d.tp==='dog'?'#00ffff':d.tp==='jump'?'#00ff88':'#88ff00';
    X.beginPath();X.arc(sx,sy,15+Math.sin(fc*.08)*3,0,6.28);X.fill();
    X.globalAlpha=1;
    if(d.tp==='dog'){dp(sx-5,sy-3,10,5,'#777');dp(sx-4,sy-2,8,3,'#999');dp(sx+4,sy-2,4,3,'#888');dp(sx+6,sy-1,2,1,'#f00')}
    else if(d.tp==='cmd'){dp(sx-3,sy-6,6,12,'#cc3333');dp(sx-2,sy-5,4,10,'#ee4444');dp(sx-1,sy-4,2,8,'#ff6666');dp(sx-2,sy+5,4,3,'#ff8800');dp(sx+1,sy+5,4,3,'#ff8800')}
    else{dp(sx-4,sy-3,8,6,'#333');dp(sx-3,sy-2,6,4,'#555');dp(sx-1,sy-1,2,2,'#4488ff')}
    dtOutline(d.tp==='dog'?'PERRO':d.tp==='cmd'?'COHETES':'SALTO',sx,sy+20,8,'#fff','center');
  }
}

// ═══ EAGLE FLYOVER ═══
function updateEAGLES(){
  for(let i=EAGLES.length-1;i>=0;i--){
    const e=EAGLES[i];
    e.x+=Math.cos(e.angle)*e.speed;
    e.y+=Math.sin(e.angle)*e.speed;
    const distToTarget=Math.hypot(e.x-e.targetX,e.y-e.targetY);
    if(e.phase==='approach'&&distToTarget<40){
      e.phase='drop';
    }
    if(e.phase==='drop'&&!e.bombsDropped){
      e.bombsDropped=true;
      // Drop 5 cluster bombs with staggered timing
      for(let b=0;b<5;b++){
        setTimeout(()=>{if(gs!=='playing')return;
          const bx=e.targetX+(Math.random()-.5)*180,by=e.targetY+(Math.random()-.5)*180;
          EX.push({x:bx,y:by,r:20,mr:55,l:30});
          FP.push({x:bx,y:by,r:45,l:240,dm:5});
          for(let p=0;p<15;p++)PA.push({x:bx,y:by,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:30,c:'#ff4400'});
          for(const en of EN)if(en.alive&&Math.hypot(bx-en.x,by-en.y)<65){en.hp-=50;if(en.hp<=0){en.alive=false;kills++;score+=en.sv||10}}
          SFX.explodeL();shake=15;
        },b*250);
      }
    }
    // Remove when far enough away
    const distFromStart=Math.hypot(e.x-(e.targetX-Math.cos(e.angle)*400),e.y-(e.targetY-Math.sin(e.angle)*400));
    if(distFromStart>1000){EAGLES.splice(i,1)}
  }
}
function drawEAGLES(){
  for(const e of EAGLES){
    const sx=e.x-cam.x,sy=e.y-cam.y;
    if(sx<-100||sx>VW+100||sy<-100||sy>VH+100)continue;
    X.save();X.translate(sx,sy);X.rotate(e.angle);
    // Futuristic fighter jet silhouette
    dp(-20,-3,40,6,'#556');dp(-16,-2,32,4,'#778');
    dp(-8,-6,16,3,'#667');dp(16,-4,8,2,'#889');dp(16,2,8,2,'#889');
    dp(-22,-1,4,2,'#9aa');dp(18,0,6,2,'#445');
    // Engine glow
    X.globalAlpha=.5+Math.sin(fc*.3)*.3;
    X.fillStyle='#ff6600';X.beginPath();X.arc(-22,0,3+Math.random()*2,0,6.28);X.fill();
    X.globalAlpha=1;
    X.restore();
  }
}

// ═══ HUD ═══
function drawHUD(){
  dp(10,10,108,16,'#333');dp(12,12,104,12,'#111');
  const hc=PL.hp>60?'#00ff00':PL.hp>30?'#ffcc00':'#ff0000';
  dp(12,12,Math.max(0,PL.hp*1.04),12,hc);dt(`${PL.hp}`,64,23,10,'#fff','center');
  // Stamina
  dp(10,30,108,8,'#333');dp(12,31,104,6,'#111');
  dp(12,31,PL.stamina,6,PL.stamina>20?'#4488ff':'#ff4444');
  if(PL.stamina<=0){dt('AGOTADO',70,38,7,'#ff4444','center')}
  // Weapon box (desktop only)
  if(!useMobileLayout()){
    const w=PL.weapons[PL.wpn];
    dp(VW/2-80,VH-62,160,48,'#111');dp(VW/2-79,VH-61,158,46,'#000');
    X.strokeStyle=PL.wpn===3?'#ff4444':'#ffcc00';X.lineWidth=1;X.strokeRect(VW/2-80,VH-62,160,48);
    dt(w.nm,VW/2,VH-44,12,'#fff','center');
    if(PL.wpn===2)dt('\u221E',VW/2,VH-26,18,'#00ff00','center');
    else if(PL.wpn===4)dt('x'+PL.grenades,VW/2,VH-26,18,'#888','center');
    else if(PL.wpn===3&&!PL.hasCmd)dt('???',VW/2,VH-26,18,'#555','center');
    else dt(`${w.am}/${w.rv}`,VW/2,VH-26,14,'#ffcc00','center');
    // Slots
    if(isController){
      dt('Y:1/2  Y-held:3',VW/2,VH-78,8,'#666','center');
    }else{
      for(let i=1;i<=4;i++){const sl=VW/2-85+(i-1)*44;dp(sl,VH-78,40,14,PL.wpn===i?'#ffcc00':'#222');dt(`${i}`,sl+20,VH-68,10,PL.wpn===i?'#000':'#666','center')}
    }
  }else{
    // Mobile: compact weapon info at bottom-center
    const w=PL.weapons[PL.wpn];
    dp(VW/2-60,VH-20,120,16,'#111');dp(VW/2-59,VH-19,118,14,'#000');
    dt(w.nm+' ',VW/2-10,VH-8,9,'#fff','left');
    if(PL.wpn===2)dt('∞',VW/2+50,VH-8,12,'#00ff00','center');
    else if(PL.wpn===4)dt('x'+PL.grenades,VW/2+50,VH-8,12,'#888','center');
    else if(PL.wpn===3&&!PL.hasCmd)dt('???',VW/2+50,VH-8,12,'#555','center');
    else dt(`${w.am}/${w.rv}`,VW/2+50,VH-8,10,'#ffcc00','center');
  }
  dt(`STIMS: ${PL.stims}`,12,50,11,'#00ff00');
  dt(`VIDAS: ${PL.lives}`,12,64,11,'#00ccff');
  dt(`SCORE: ${score}`,VW-12,22,14,'#ffcc00','right');
  dt(`KILLS: ${kills}`,VW-12,40,11,'#ff8800','right');
  dt(`NESTS: ${nestD}/${totalN}`,VW-12,56,11,'#ff4444','right');
  const mn=mTimer/3600|0,sc=(mTimer%3600)/60|0;
  dt(`TIEMPO: ${mn}:${sc.toString().padStart(2,'0')}`,VW-12,72,11,'#fff','right');
  if(extractReady){const pulse=(fc/15|0)%2;dt('¡IR A LA EXTRACCION! Centro del mapa',VW/2,18,14,pulse?'#00ff44':'#00aa22','center')}
  else dt(`Objetivo: Destruir nidos (${nestD}/${totalN})`,VW/2,18,12,'#ffcc00','center');
  dt(`Nivel ${ds+1}: ${DIFF[ds].nm}`,12,78,11,'#ff4444');
  dt(`Planeta: ${BIOM[ps].nm}`,12,92,10,'#aaa');
  if(PL.activeSG){dt(PL.activeSG==='dog'?'PERRO GUARDIAN':'MOCHILA SALTO',12,104,11,'#00ffff')}
  if(vTimer>0){vTimer--;X.globalAlpha=Math.min(1,vTimer/30);dt(`"${vLine}"`,VW/2,120,14,'#fff','center');X.globalAlpha=1}
  if(PL.reloading){const w2=PL.weapons[PL.wpn],pct=1-PL.relT/w2.rl;dt('RECARGANDO...',VW/2,VH/2+40,14,'#ffcc00','center');dp(VW/2-55,VH/2+50,110,8,'#333');dp(VW/2-55,VH/2+50,110*pct,8,'#ffcc00')}
  if(PL.hp<=30&&(fc/12|0)%2){X.globalAlpha=.15;X.fillStyle='#ff0000';X.fillRect(0,0,VW,VH);X.globalAlpha=1}
  // Drowning warning
  if(PL.inWater&&PL.drownT>120){const pulse=(PL.drownT/15|0)%2;dt('AHOGANDO!',VW/2,VH/2-30,18,pulse?'#ff4444':'#ff8844','center');dp(VW/2-60,VH/2-18,120,6,'#333');dp(VW/2-60,VH/2-18,120*(1-PL.drownT/300),6,'#4488ff')}
  if(PL.hazardType==='sand'&&PL.sinkT>60){const pulse=(PL.sinkT/15|0)%2;dt('HUNDIENDO!',VW/2,VH/2-30,18,pulse?'#ff4444':'#b49650','center');dp(VW/2-60,VH/2-18,120,6,'#333');dp(VW/2-60,VH/2-18,120*(1-PL.sinkT/300),6,'#b49650')}
  if(PL.hazardType==='lava_outer'){const pulse=(fc/4|0)%2;dt('¡ARDIENDO! BUSCA LA ORILLA',VW/2,VH/2-30,16,pulse?'#ff4400':'#ffcc00','center')}
  // Death message
  if(PL.dying){
    X.globalAlpha=.7;X.fillStyle='#000';X.fillRect(0,0,VW,VH);X.globalAlpha=1;
    const pulse=(fc/6|0)%2;
    dt('¡HELLDIVER CAÍDO!',VW/2,VH/2-20,32,pulse?'#ff4444':'#ff8844','center');
    if(PL.deathCause==='lava')dt('Consumido por el fuego...',VW/2,VH/2+15,14,'#ff8800','center');
    else if(PL.deathCause==='water')dt('Se ahogó en las profundidades...',VW/2,VH/2+15,14,'#4488ff','center');
    else if(PL.deathCause==='abyss')dt('Cayó al abismo sin fin...',VW/2,VH/2+15,14,'#ff0000','center');
    else if(PL.deathCause==='sand')dt('Devorado por las arenas...',VW/2,VH/2+15,14,'#b49650','center');
    else dt('Cayó luchando por la libertad...',VW/2,VH/2+15,14,'#aaa','center');
    dt(`Reanimaciones restantes: ${PL.lives-1}`,VW/2,VH/2+40,13,PL.lives>1?'#00ff00':'#ff4444','center');
  }
  // Minimap
  const mW=90,mH=70,mX=VW-mW-10,mY=10,sx=mW/MW,sy2=mH/MH;
  X.globalAlpha=.7;dp(mX-2,mY-2,mW+4,mH+4,'#000');dp(mX,mY,mW,mH,'#1a1a20');
  for(const n of NS)dp(mX+n.x*sx-1,mY+n.y*sy2-1,3,3,'#ff4444');
  for(const e of EN)if(e.alive)dp(mX+e.x*sx,mY+e.y*sy2,2,2,'#ffaa00');
  X.globalAlpha=.3;for(const o of obstacles)dp(mX+o.x*sx,mY+o.y*sy2,Math.max(1,o.w*sx),Math.max(1,o.h*sy2),'#666');
  X.globalAlpha=.7;
  dp(mX+PL.x*sx-2,mY+PL.y*sy2-2,4,4,'#00ff00');
  X.strokeStyle='#ffffff33';X.lineWidth=1;X.strokeRect(mX+cam.x*sx,mY+cam.y*sy2,VW*sx,VH*sy2);
  X.globalAlpha=1;
}

// ═══ DROP POD ═══
function drawPod(){
  if(PL.dropAnim<=0)return false;
  const isFirst=PL.firstDrop;

  // ═══ FIRST DROP: 3-phase atmospheric entry ═══
  if(isFirst){
    // ── PHASE 0: Atmospheric entry (1200 frames) — space view ──
    if(PL.dropPhase===0){
      const total=1200;
      const p=1-PL.dropAnim/total;

      // Sky: black → deep blue
      const skyB=Math.min(1,p*2.5)*180;
      const skyG=Math.min(1,p*2)*40;
      X.fillStyle=`rgb(${Math.min(8,p*20)|0},${skyG|0},${skyB|0})`;
      X.fillRect(0,0,VW,VH);

      // Stars: scroll UPWARD (capsule falls down), SLOWLY (distant = slow parallax)
      if(p<.65){
        X.globalAlpha=Math.max(0,1-p*2.2);
        const spd=.3+p*.3; // 0.3→0.6 px/frame — very slow
        for(let i=0;i<60;i++){
          const sx=(i*73)%VW;
          const sy=((i*41-fc*spd)%VH+VH)%VH;
          const sz=(i%3===0)?2:1;
          X.fillStyle=i%7===0?'#aaccff':'#ffffff';
          X.fillRect(sx,sy,sz,sz);
        }
        X.globalAlpha=1;
      }

      // Atmosphere haze
      if(p>.3){
        X.globalAlpha=Math.min(.4,(p-.3)*1.5);
        X.fillStyle='#3355aa';
        X.fillRect(0,0,VW,VH);
        X.globalAlpha=1;
      }

      // Clouds: scroll UPWARD, FAST (close = fast parallax)
      if(p>.3&&p<.9){
        const cAlpha=Math.min(1,(p-.3)*3)*Math.min(1,(.9-p)*5);
        X.globalAlpha=cAlpha*.7;
        const cSpd=4+(p-.3)*12; // 4→11 px/frame — much faster than stars
        X.fillStyle='#445566';
        for(let i=0;i<10;i++){
          const cy=((i*75-fc*cSpd)%(VH+80)+VH+80)%(VH+80)-40;
          const cx=(i*113+Math.sin(i*1.7)*50)%VW;
          X.beginPath();X.ellipse(cx,cy,70+i*12,18+i*4,0,0,6.28);X.fill();
        }
        X.fillStyle='#667788';
        for(let i=0;i<6;i++){
          const cy=((i*100-fc*cSpd*.7)%(VH+80)+VH+80)%(VH+80)-40;
          const cx=(i*167+30)%VW;
          X.beginPath();X.ellipse(cx,cy,55+i*8,10+i*3,0,0,6.28);X.fill();
        }
        X.globalAlpha=1;
      }

      // Ground approaching at end
      if(p>.75){
        const gp=Math.min(1,(p-.75)*4);
        const groundY=VH-gp*VH*.35;
        X.fillStyle='#1a2a1a';X.fillRect(0,groundY,VW,VH-groundY);
        X.fillStyle='#223322';
        for(let i=0;i<20;i++){const gx=(i*57)%VW,gh=5+Math.sin(i*1.3)*8;X.fillRect(gx,groundY-gh,8,gh)}
        X.fillStyle='#2a3a2a';
        for(let i=0;i<15;i++){const gx=(i*89+20)%VW;X.fillRect(gx,groundY+5+i*3,12,3)}
        if(gp>.5){shake=3+gp*5}
      }

      // Capsule: fixed center, tilted "\", nose pointing down-right
      const tilt=.35;
      const cx=VW*.5;
      const cy=VH*.42;
      const vib=Math.sin(fc*.8)*1.5+(p>.3?Math.sin(fc*2.5)*2:0)+(p>.7?Math.sin(fc*4)*2.5:0);

      X.save();
      X.translate(cx+Math.sin(tilt)*vib, cy+Math.cos(tilt)*vib);
      X.rotate(tilt);

      // Heat trail (friction particles going UPWARD from nose)
      if(p>.25){
        const hi=Math.min(1,(p-.25)*2.5);
        X.globalAlpha=hi*.6;
        for(let i=0;i<6;i++){
          const trailLen=15+hi*30+Math.random()*15;
          const tx=(Math.random()-.5)*10;
          const ty=26+Math.random()*8;
          const colors=['#ff4400','#ff6600','#ffaa00','#ffcc00'];
          X.fillStyle=colors[Math.random()*4|0];
          X.fillRect(tx,ty,2+Math.random()*2,trailLen);
        }
        X.globalAlpha=1;
      }

      // Nose cone (bottom) — heat shield
      X.fillStyle='#666';
      X.beginPath();X.moveTo(-8,22);X.lineTo(8,22);X.lineTo(0,34);X.closePath();X.fill();
      X.fillStyle='#777';
      X.beginPath();X.moveTo(-6,22);X.lineTo(6,22);X.lineTo(0,30);X.closePath();X.fill();

      // Heat glow on nose
      if(p>.25){
        const hi=Math.min(1,(p-.25)*2.5);
        X.globalAlpha=hi*.7;
        X.fillStyle=`rgb(255,${140-hi*80|0},0)`;
        X.beginPath();X.ellipse(0,28,10+hi*6,8+hi*5,0,0,6.28);X.fill();
        X.globalAlpha=hi*.9;
        X.fillStyle=`rgb(255,${200-hi*80|0},${50+hi*30|0})`;
        X.beginPath();X.ellipse(0,27,6+hi*3,5+hi*3,0,0,6.28);X.fill();
        if(p>.5){
          X.globalAlpha=(p-.5)*2;
          X.fillStyle='#fff';
          X.beginPath();X.ellipse(0,27,3,2,0,0,6.28);X.fill();
        }
        X.globalAlpha=1;
      }

      // Capsule body
      dp(-10,-24,20,46,'#555');dp(-8,-22,16,42,'#777');
      dp(-10,-20,1,38,'#444');dp(9,-20,1,38,'#444');
      dp(-10,-5,20,1,'#444');dp(-10,8,20,1,'#444');
      // Viewport
      dp(-5,-18,10,8,'#222');dp(-4,-17,8,6,'#00ff44');
      X.globalAlpha=.3+Math.sin(fc*.05)*.1;
      dp(-5,-18,10,8,'#00ff4422');X.globalAlpha=1;
      // Rear
      dp(-8,-24,16,4,'#444');dp(-6,-26,12,3,'#555');

      X.restore();

      // Text
      if(p>.1&&p<.85){
        X.globalAlpha=Math.min(1,(p-.1)*3)*Math.min(1,(.85-p)*4);
        dt('POR LA LIBERTAD!',VW/2,VH*.2,20,'#ffcc00','center');
        X.globalAlpha=1;
      }

      // Impact flash
      if(p>.9){X.globalAlpha=Math.min(1,(p-.9)*10);X.fillStyle='#fff';X.fillRect(0,0,VW,VH);X.globalAlpha=1}

      // Transition to phase 1
      PL.dropAnim--;
      if(PL.dropAnim<=0){PL.dropPhase=1;PL.dropAnim=90}
      return true;
    }

    // ── PHASE 1: Map drop (90 frames) — capsule falls onto map ──
    if(PL.dropPhase===1){
      const total=90;
      const p=1-PL.dropAnim/total;
      const dropStartY=-80;
      const dropEndY=MH/2;
      const py=dropStartY+(dropEndY-dropStartY)*p;
      const capsuleX=MW/2;

      cam.x=MW/2-VW/2;cam.y=MH/2-VH/2;
      drawMap();drawStars();
      const sx=capsuleX-cam.x,sy=py-cam.y;

      // Heat glow fading
      const hi=Math.max(0,1-p*1.5);

      X.save();X.translate(sx,sy);
      // Slight tilt oscillation while falling
      X.rotate(Math.sin(fc*.3)*.05);

      // Heat trail (fading as capsule slows)
      if(hi>0){
        X.globalAlpha=hi*.5;
        for(let i=0;i<4;i++){
          const ty=28+Math.random()*12;
          X.fillStyle=['#ff4400','#ff8800'][i%2];
          X.fillRect((Math.random()-.5)*8,ty,2,10+Math.random()*15);
        }
        X.globalAlpha=1;
      }

      // Capsule body (nose pointing down)
      dp(-12,22,24,4,'#444');dp(-10,24,20,3,'#555');
      dp(-10,-24,20,46,'#555');dp(-8,-22,16,42,'#777');
      dp(-10,-20,1,38,'#444');dp(9,-20,1,38,'#444');
      dp(-10,-5,20,1,'#444');dp(-10,8,20,1,'#444');
      dp(-5,-18,10,8,'#222');dp(-4,-17,8,6,'#00ff44');
      // Nose cone
      dp(-8,22,16,2,'#666');
      X.fillStyle='#666';X.beginPath();X.moveTo(-8,24);X.lineTo(8,24);X.lineTo(0,32);X.closePath();X.fill();
      if(hi>0){
        X.globalAlpha=hi*.6;
        X.fillStyle='#ff6600';X.beginPath();X.ellipse(0,28,8+hi*4,6+hi*3,0,0,6.28);X.fill();
        X.globalAlpha=1;
      }

      X.restore();

      // Shake increases near impact
      if(p>.7)shake=4+p*6;

      PL.dropAnim--;
      if(PL.dropAnim<=0){PL.dropPhase=2;PL.dropAnim=90}
      return true;
    }

    // ── PHASE 2: Landing impact (90 frames) — manhole cover + player emerges ──
    if(PL.dropPhase===2){
      const total=90;
      const p=1-PL.dropAnim/total;

      cam.x=MW/2-VW/2;cam.y=MH/2-VH/2;
      drawMap();drawStars();

      // Capsule on ground = manhole cover
      const mcx=MW/2-cam.x;
      const mcy=MH/2-cam.y;

      // Dust ring on impact (frames 0-30)
      if(p<.35){
        const da=Math.max(0,1-p*3);
        X.globalAlpha=da*.4;
        const dr=20+p*200;
        X.strokeStyle='#887766';
        X.lineWidth=2+da*3;
        X.beginPath();X.ellipse(mcx,mcy+2,dr,dr*.3,0,0,6.28);X.stroke();
        // Debris particles
        for(let i=0;i<6;i++){
          const a=i*1.05;
          const r=30+p*180;
          const px2=mcx+Math.cos(a)*r;
          const py2=mcy+Math.sin(a)*r*.4+2;
          dp(px2-2,py2-2,3+Math.random()*3,3+Math.random()*3,'#665544');
        }
        X.globalAlpha=1;
        shake=Math.max(shake,6-p*15);
      }

      // Manhole cover (circular, metallic)
      X.fillStyle='#555';
      X.beginPath();X.ellipse(mcx,mcy+3,18,6,0,0,6.28);X.fill();
      X.fillStyle='#777';
      X.beginPath();X.ellipse(mcx,mcy+2,16,5,0,0,6.28);X.fill();
      X.fillStyle='#888';
      X.beginPath();X.ellipse(mcx,mcy+1,14,4,0,0,6.28);X.fill();
      // Rivet details
      for(let i=0;i<6;i++){
        const a=i*1.05;
        const rx=mcx+Math.cos(a)*10;
        const ry=mcy+1+Math.sin(a)*3;
        dp(rx-1,ry-1,2,2,'#aaa');
      }
      // Cross pattern on manhole
      X.strokeStyle='#666';X.lineWidth=1;
      X.beginPath();X.moveTo(mcx-10,mcy+1);X.lineTo(mcx+10,mcy+1);X.stroke();
      X.beginPath();X.moveTo(mcx,mcy-3);X.lineTo(mcx,mcy+5);X.stroke();

      // Player emerging (starts at p=.3, rises fully by p=.8)
      if(p>.25){
        const ep=Math.min(1,(p-.25)*2.5); // 0→1 over p=.25 to .65
        const playerY=mcy-ep*20; // rise from ground
        const playerAlpha=Math.min(1,ep*3);
        const cw=Math.sin(fc*.1)*2;

        X.globalAlpha=playerAlpha;
        X.save();X.translate(mcx,playerY);

        // Shadow
        X.globalAlpha=.3*playerAlpha;dp(-8,5,16,8,'#000');X.globalAlpha=playerAlpha;
        // Cape (dark, matching drawPL)
        dp(-6,2,12,10,'#111');dp(-5,3+cw*.3,10,8,'#1a1a1a');
        // Body (gold/yellow matching drawPL)
        dp(-8,-8,16,16,'#222');dp(-7,-7,14,14,'#ddaa00');dp(-6,-6,12,6,'#eebb11');
        // Helmet (dark matching drawPL)
        dp(-7,-12,14,6,'#333');dp(-6,-11,12,4,'#444');
        // Visor
        dp(-4,-10,8,3,'#00ff44');
        // Arms (gold matching drawPL)
        dp(-9,-2,4,8,'#cc9900');dp(5,-2,4,8,'#cc9900');
        // Legs (dark matching drawPL)
        const la=Math.sin(fc*.15)*2;
        if(ep>.6){dp(-5,8,5,6+la,'#222');dp(0,8,5,6-la,'#222')}

        X.restore();
        X.globalAlpha=1;
      }

      // "LIBERTAD" text when player fully emerged
      if(p>.7&&p<.9){
        X.globalAlpha=Math.min(1,(p-.7)*5)*Math.min(1,(.9-p)*5);
        dt('¡POR LA LIBERTAD!',VW/2,VH/2+60,14,'#ffcc00','center');
        X.globalAlpha=1;
      }

      PL.dropAnim--;
      if(PL.dropAnim<=0){
        // Position player at the manhole location
        PL.x=MW/2;PL.y=MH/2;PL.vx=0;PL.vy=0;
        PL.alive=true;PL.inv=120;
        SFX.drop();say('drop');
        setMusicVol(.3);
        return false;
      }
      return true;
    }
  }

  // ═══ REVIVE: Simple drop (120 frames) ═══
  const total=120;
  const p=1-PL.dropAnim/total;
  const py=-60+p*(VH/2+120),px=VW/2;
  const vib=Math.sin(fc*.8)*2;

  drawMap();drawStars();

  X.save();X.translate(px+vib,py);X.rotate(Math.sin(fc*.3)*.05);
  dp(-12,-24,24,48,'#555');dp(-10,-22,20,44,'#777');
  dp(-6,-16,12,12,'#ffcc00');dp(-4,-14,8,8,'#00ff44');
  const hi=Math.min(1,p*2);
  X.globalAlpha=hi*.6;X.fillStyle='#ff6600';X.beginPath();X.ellipse(0,-26,8+hi*6,4+hi*3,0,0,6.28);X.fill();X.globalAlpha=1;
  if(p<.7){for(let i=0;i<2;i++){
    const tx=(Math.random()-.5)*10,ty=24+Math.random()*8;
    dp(px+tx-vib,py+ty,2+Math.random()*2,3+Math.random()*3,'#ff8844');
  }}
  X.restore();

  if(p>.3)dt('¡REANIMACIÓN EN CAMINO!',VW/2,py-30,16,'#ffcc00','center');
  if(p>.7&&p<.85)shake=8;

  PL.dropAnim--;if(PL.dropAnim<=0){SFX.drop();say('drop');setMusicVol(.3)}return true;
}

// ═══ MENUS ═══
function drawTitle(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.fillStyle='#0a0a14';X.fillRect(0,0,VW,VH);drawStars();
  // Logo
  if(imgLogo.width){
    X.drawImage(imgLogo,VW/2-imgLogo.width/2,10,imgLogo.width,imgLogo.height);
  }
  // Characters
  if(imgPersonajes.width){
    X.drawImage(imgPersonajes,VW/2-imgPersonajes.width/2,120,imgPersonajes.width,imgPersonajes.height);
  }
  // Version (clickable)
  const vTxt='v1.9.117 — 2026.07.15';
  const vHover=isMobile?(M.down&&inRect(M.x,M.y,VW/2-80,430,160,14)):(M.x>VW/2-80&&M.x<VW/2+80&&M.y>430&&M.y<444);
  dt(vTxt,VW/2,435,9,vHover?'#888':'#444','center');
  if(vHover){X.strokeStyle='#555';X.lineWidth=1;X.strokeRect(VW/2-82,427,164,14)}
  const cHover=isMobile?(M.down&&inRect(M.x,M.y,VW/2-60,448,120,14)):(M.x>VW/2-60&&M.x<VW/2+60&&M.y>448&&M.y<462);
  dt('Créditos',VW/2,458,9,cHover?'#888':'#444','center');
  if(cHover){X.strokeStyle='#555';X.lineWidth=1;X.strokeRect(VW/2-62,450,124,14)}
  dt(isController?'[ A ] Empezar':isMobile?'[ Toca para empezar ]':'[ ENTER o Click ]',VW/2,480,13,(fc/30|0)%2?'#ffcc00':'#886600','center');
  dt('CONTROLES:',VW/2,505,9,'#888','center');
  if(isController){
    dt('Stick izq: Mover  Stick der: Apuntar  RT: Disparar',VW/2,520,7,'#666','center');
    dt('Y: Armas  X: Recargar  A: Recoger  Bx2: Salto',VW/2,532,7,'#666','center');
    dt('RB: Sprint  LB: Estratagema  D-Pad: ↑Granada →Granada',VW/2,544,7,'#666','center');
    dt('Start: Pausa  Back: Musica',VW/2,556,7,'#666','center');
  }else if(isMobile){
    dt('Stick izq: Mover  Stick der: Apuntar  RT: Disparar',VW/2,520,7,'#666','center');
    dt('X/Y/A/B: Acciones  LT/LB/RB: Estratagema/Sprint',VW/2,532,7,'#666','center');
    dt('D-Pad: Armas/Stim  A: Recoger/Confirmar',VW/2,544,7,'#666','center');
  }else{
    dt('[1-4] Armas  [G] Granada  [V] Stim  [SHIFT] Correr',VW/2,520,7,'#666','center');
    dt('[R] Recargar  [E] Recoger  CTRL+WASD Estratagemas',VW/2,532,7,'#666','center');
    dt('[WASD] Mover  [Mouse] Apuntar  [ESC] Pausa  [M] Musica',VW/2,544,7,'#666','center');
  }
  dt('Parodia no oficial de HELLDIVERS 2. Sin ánimo de lucro.', VW/2, 570, 9, '#666', 'center');
  dt('Todos los derechos de la obra original pertenecen a Arrowhead/Sony.', VW/2, 585, 9, '#666', 'center');
  X.restore();
}

// ═══ CHANGELOG ═══
const CLG=[
  {v:'v1.0.0 — 2026.07.12',c:[
    'Juego creado desde cero en un solo HTML',
    'Jugador con movimiento, stamina y colisiones con obstaculos',
    '4 armas: Ametralladora, Pistola, Comando, Granadas',
    '7 niveles de dificultad y 3 planetas (Lunar, Desértico, Boscoso)',
    '5 tipos de Terminids: Warrior, Hunter, Spewer, Charger, Titan',
    'Sistema de estratagemas con secuencias WASD',
    'Estratagemas ofensivos (Laser Orbital, Águila Cluster) y de equipo',
    'Perro Guardian y Mochila Salto',
    'Sistema de nidos que generan enemigos',
    'Recogibles: munición, granadas, stims, medallas, créditos, muestras',
    'Audio 8-bit con musica dinámica por intensidad de combate',
    'Animación de caida en Drop Pod',
    'HUD con vida, stamina, arma, minimap y objetivo',
    'Menus: titulo, selección de dificultad/planeta, pausa, game over, victoria'
  ]},
  {v:'v1.1.0 — 2026.07.12',c:[
    'Controles táctiles para móvil/tablet',
    'Joystick virtual para movimiento con sprint al borde',
    'Toque/drag derecho para apuntar y disparar',
    'Botones de acción: R, G, V, 1-4, STRAT, Pause',
    'D-pad táctil para estratagemas',
    'Auto-detección de móvil con persistencia en localStorage',
    'Toggle manual entre modo PC y Móvil',
    'Performance optimizada para móvil (max 25 enemigos, 80 partículas)',
    'Menús táctiles: tocar para seleccionar opciones',
    'Prevenido zoom/scroll del navegador en móvil'
  ]},
  {v:'v1.2.0 — 2026.07.12',c:[
    'Perro Guardian: 1 disparo/segundo a enemigos cercanos, daño = pistola',
    'Corregido bug: balas del Perro dañaban enemigos correctamente',
    'Recogibles: pixel art mejorado con mas detalle por tipo',
    'Recogibles: texto flotante al recoger (+30 MUNICIONES, +2 STIMS, etc)',
    'Recogibles: indicador [E] Recoger sobre items cercanos',
    'Recoger requiere pulsar E (ya no al pasar por encima)',
    'Botón E en controles táctiles para recoger'
  ]},
  {v:'v1.3.0 — 2026.07.12 16:27',c:[
    'Comando: cohetes explotan al primer impacto (enemigo u obstaculo)',
    'Comando: daño directo 67, splash 25 con decaimiento por distancia',
    'Comando: 6 disparos matan al Titan (400 HP), balanceado por tipo',
    'Comando: los cohetes ya no atraviesan enemigos',
    'Eliminado área persistente de fuego de los cohetes',
    'Enemigos muertos ya no dropean items',
    'Recogibles en mapa reducidos de 50 a 8 (mucho mas escasos)',
    'Sistema de refuerzos: enemigos pequeños llaman aliados',
    'Animación de humo amarillo durante la llamada (5 segundos)',
    'Si no se mata al emisario, aparecen 3-5 refuerzos cerca',
    'Solo enemigos nacidos de nidos pueden llamar (no la oleada inicial)',
    'Cada enemigo solo puede llamar una vez',
    'Titanes y Chargers no pueden llamar refuerzos'
  ]},
  {v:'v1.4.0 — 2026.07.12 17:03',c:[
    'Velocidad de enemigos escala con dificultad (x1.0 Tirado → x1.8 Helldiver)',
    'Arma 4 (Granada): click lanza granada hacia el punto clicado',
    'Si el click esta dentro del rango (180px), la granada cae ahi',
    'Si el click esta fuera de rango, la granada cae al limite maximo',
    'Tecla G: lanza granada a distancia maxima en la direccion que apunta el jugador',
    'La tecla G funciona con cualquier arma seleccionada'
  ]},
  {v:'v1.4.1 — 2026.07.12 18:19',c:[
    'Reduce escala de vida de enemigos por dificultad',
    'Antes: hm iba de 0.5 (Tirado) a 2.2 (Helldiver)',
    'Ahora: hm va de 0.7 (Tirado) a 1.20 (Helldiver), ~5% por nivel',
    'Titan en Helldiver: 480 HP (antes 880), 8 cohetes Comando para matar',
    'Charger en Helldiver: 180 HP, 3 cohetes para matar',
    'La dificultad ahora depende mas de velocidad y cantidad que de vida'
  ]},
  {v:'v1.5.0 — 2026.07.12 18:44',c:[
    'Soporte mando Xbox completo con mapeo personalizado',
    'Stick izquierdo: movimiento analogico',
    'Stick derecho: apuntar con aim assist (~17°) y deadzone',
    'RT: disparar (analogico), LT: granada hacia punto apuntado',
    'A: recoger objeto, X: recargar, RB: sprint',
    'Y tap: alternar arma 1/2, Y mantenida: arma 3 (Comando)',
    'A x2 (double-tap): mochila salto',
    'LB: modo estratagema, D-Pad: flechas de estratagema',
    'Start: pausa, Back: musica on/off',
    'Rumble/vibracion en disparos, explosiones y dano',
    'Crosshair con mando en direccion del stick derecho',
    'Button prompts segun plataforma ([A] en vez de [E])',
    'Navegacion de menus con mando (D-pad/stick + A/B)',
    'Barra de cooldowns stratagemas solo visible en modo strat',
    'Controles tactiles ocultos cuando mando detectado',
    'Documento SPECS.md creado con todas las especificaciones'
  ]},
  {v:'v1.5.1 — 2026.07.12',c:[
    'D-Pad Up: usar stim (curarse) con mando',
    'D-Pad Right: cambiar a modo granada (arma 4)',
    'Laser sight permanente: linea roja desde arma hasta primer impacto',
    'La linea muestra obstaculos y enemigos como puntos de impacto'
  ]},
  {v:'v1.9.9 — 2026.07.13',c:[
    'Selector de planetas redondo con efecto de rotacion',
    'Planeta Volcanico: volcanes activos con humo + lagos de lava (muerte instantanea)',
    'Planeta Boscoso: lagos de agua (ralentizan + ahogan en 3s)',
    'Sprite de natacion cuando el jugador esta en el agua',
    'No se puede disparar ni lanzar granadas en el agua',
    'Hover en menus funciona solo con pasar el cursor'
  ]},
  {v:'v1.5.2 — 2026.07.12 19:08',c:[
    'Eliminado LT para lanzar granadas con mando',
    'Granadas solo se lanzan cambiando a arma 4 (D-Pad right) y usando RT',
    'Eliminada tecla Q del modo estratagema (solo CTRL)',
    'Clipping de canvas para evitar aberraciones en bordes',
    'Script de deploy para publicacion SFTP'
  ]},
  {v:'v1.6.0 — 2026.07.12 19:32',c:[
    'Mando virtual completo para movil',
    'Joystick izquierdo (mover) y derecho (apuntar con assist)',
    'Triggers LT/LB/RB/RT, botones X/Y/A/B, D-Pad, Start/Back',
    'Canvas extendido en movil: juego arriba, mando abajo',
    'Todos los botones mapean al mismo GP que mando real',
    'Eliminados controles touch antiguos (joystick, botones, strat overlay)'
  ]},
  {v:'v1.7.1 — 2026.07.12',c:[
    'Layout responsive: portrait (juego+mando abajo) y landscape (mando izq|juego|mando der)',
    'Mando virtual oculto cuando mando real o teclado detectado',
    'API Fullscreen con boton siempre visible',
    'Menus clickables con raton Y touch en pantalla tactil',
    'D-Pad rediseñado: 4 botones rectangulares (izq, abajo, arriba, der)',
    'Bug fix: click cascade en menus corregido',
    'Pull-to-refresh habilitado en movil'
  ]},
  {v:'v1.9.5 — 2026.07.13',c:[
    'Ventana de estratagemas rediseñada con paneles y flechas vectoriales',
    'Codigos de estratagema originales de Helldivers 2',
    'Personaje siempre朝上: cabeza arriba, solo arma gira',
    'Montañas en mapa con sombreado solido',
    'Colision de proyectiles con terreno',
    'Fisica de granada: arco visual fijo hacia arriba',
    'Nidos generan enemigos periodicamente con efecto visual',
    'Laser origina en punta del arma'
  ]}
];
let clPage=0;
function drawChangelog(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.fillStyle='#0a0a14';X.fillRect(0,0,VW,VH);
  dt('REGISTRO DE CAMBIOS',VW/2,35,20,'#ffcc00','center');
  dt(`Pagina ${clPage+1}/${CLG.length}`,VW/2,55,10,'#666','center');
  const ch=CLG[clPage];
  dt(ch.v,VW/2,78,14,'#ffaa00','center');
  let y=100-clScroll;
  for(const line of ch.c){
    if(y>70&&y<VH-10){dt('• '+line,VW/2,y,9,y<90?'#ffcc00':'#aaa','center')}
    y+=16;
  }
  // Scroll indicators
  if(clScroll>0){dt('▲ Mas arriba',VW/2,70,9,'#555','center')}
  const maxScroll=Math.max(0,(ch.c.length*16)-(VH-140));
  if(clScroll<maxScroll){dt('▼ Mas abajo',VW/2,VH-20,9,'#555','center')}
  // Nav
  dt(isController?'LB/RB pagina  A/Volver':'← → cambiar pagina  ESC volver',VW/2,VH-5,9,'#444','center');
  X.restore();
}

function drawAbout(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.fillStyle='#0a0a14';X.fillRect(0,0,VW,VH);drawStars();
  dt('HELLSNORKELS 2',VW/2,40,22,'#ffcc00','center');
  dt('v1.9.96',VW/2,62,10,'#555','center');
  let y=100;
  dt('Parodia no oficial y sin animo de lucro de HELLDRIVERS 2.',VW/2,y,10,'#aaa','center');y+=20;
  dt('Si has llegado aqui, seguramente ya conozcas el juego original.',VW/2,y,10,'#aaa','center');y+=20;
  dt('Si no es asi, te lo recomendamos. Nosotros estamos enganchados.',VW/2,y,10,'#aaa','center');y+=35;
  dt('─ DESARROLLO ─',VW/2,y,12,'#ffcc00','center');y+=22;
  dt('Desarrollado integramente con OpenCode,',VW/2,y,10,'#aaa','center');y+=16;
  dt('el agente de codigo abierto para terminal y IDE.',VW/2,y,10,'#aaa','center');y+=16;
  dt('opencode.ai',VW/2,y,10,'#4488ff','center');y+=30;
  dt('─ CODIGO FUENTE ─',VW/2,y,12,'#ffcc00','center');y+=22;
  dt('github.com/MiquelOlavarria/HELLSNORKELS2',VW/2,y,10,'#4488ff','center');y+=16;
  dt('Si encuentas algun bug, puedes abrir un issue.',VW/2,y,10,'#aaa','center');y+=30;
  dt('─ EQUIPO ─',VW/2,y,12,'#ffcc00','center');y+=22;
  dt('Miquel Olavarria — Codigo, diseno y test',VW/2,y,10,'#aaa','center');y+=16;
  dt('OpenCode (big-pickle) — Asistente de desarrollo',VW/2,y,10,'#aaa','center');y+=30;
  dt('─ DERECHOS ─',VW/2,y,12,'#ffcc00','center');y+=22;
  dt('HELLDIVERS 2 es marca de Arrowhead / Sony.',VW/2,y,9,'#666','center');y+=14;
  dt('Este juego no tiene animo de lucro y no pretende reemplazar la obra original.',VW/2,y,9,'#666','center');y+=30;
  dt(isController?'[ A ] Volver':'[ ESC o Click ] Volver',VW/2,VH-15,10,'#444','center');
  X.restore();
}

function drawDiffSelect(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.fillStyle='#0a0a14';X.fillRect(0,0,VW,VH);drawStars();
  // Logo
  if(imgLogo.width){
    const lw=Math.min(240,imgLogo.width),lh=lw*(imgLogo.height/imgLogo.width);
    X.drawImage(imgLogo,VW/2-lw/2,5,lw,lh);
  }
  dt('SELECCIONA DIFICULTAD',VW/2,100,18,'#ffcc00','center');
  // Hover tracking
  let hoverIdx=-1;
  for(let i=0;i<DIFF.length;i++){const d=DIFF[i],y=130+i*55,sel=i===menuS;
    const hovered=inRect(M.x,M.y,VW/2-200,y-12,400,42);
    if(hovered)hoverIdx=i;
    const show=hoverIdx>=0?hovered:sel;
    dp(VW/2-200,y-12,400,42,show?'#ffcc00':'#222');dp(VW/2-198,y-10,396,38,show?'#1a1500':'#111');
    dt(`${i+1}. ${d.nm}`,VW/2-180,y+10,show?18:16,show?'#ffcc00':'#888');
    dt(d.ds,VW/2+180,y+10,11,show?'#ffaa00':'#555','right');
    if(sel&&!hovered)dt('\u25c4',VW/2-218,y+10,14,'#ffcc00')}
  dt(isController?'/ \\ seleccionar  A confirmar  B volver':'Haz click en una o usa \u2191\u2193 + ENTER',VW/2,VH-30,11,'#555','center');
  X.restore();
  return hoverIdx;
}

function drawPlanetSelect(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.fillStyle='#0a0a14';X.fillRect(0,0,VW,VH);drawStars();
  // Logo
  if(imgLogo.width){
    const lw=Math.min(240,imgLogo.width),lh=lw*(imgLogo.height/imgLogo.width);
    X.drawImage(imgLogo,VW/2-lw/2,5,lw,lh);
  }
  dt('SELECCIONA PLANETA',VW/2,100,18,'#ffcc00','center');
  let hoverIdx=-1;
  const spacing=Math.min(200,Math.floor((VW-100)/BIOM.length));
  const startX=VW/2-(BIOM.length-1)*spacing/2;
  for(let i=0;i<BIOM.length;i++){const b=BIOM[i],cx_=startX+i*spacing,cy_=200,sel=i===menuS;
    const hovered=Math.hypot(M.x-cx_,M.y-cy_)<52;
    if(hovered)hoverIdx=i;
    const show=hoverIdx>=0?hovered:sel;
    const R=44;
    // Selection glow
    if(show){X.globalAlpha=.4;X.fillStyle='#ffcc00';X.beginPath();X.arc(cx_,cy_,R+8,0,6.28);X.fill();X.globalAlpha=1}
    // Planet body — round with rotation effect
    X.save();X.beginPath();X.arc(cx_,cy_,R,0,6.28);X.clip();
    X.fillStyle=b.b;X.fillRect(cx_-R,cy_-R,R*2,R*2);
    // Rotating surface features
    const rot=fc*.008+i*2;
    for(let s=0;s<6;s++){
      const sa=rot+s*1.05;
      const sx_=cx_+Math.cos(sa)*R*.5,sy_=cy_+Math.sin(sa)*R*.3;
      X.globalAlpha=.3;X.fillStyle=b.b2;X.beginPath();X.ellipse(sx_,sy_,12+Math.sin(sa)*5,8,sa,0,6.28);X.fill();
    }
    // Surface detail
    X.globalAlpha=.2;X.fillStyle=b.b3;
    X.beginPath();X.ellipse(cx_-10,cy_-8,15,10,rot*.5,0,6.28);X.fill();
    X.beginPath();X.ellipse(cx_+12,cy_+10,10,7,rot*.3,0,6.28);X.fill();
    X.globalAlpha=1;
    // Atmosphere edge
    X.strokeStyle=b.pc2||'#fff';X.lineWidth=2;X.globalAlpha=.3;
    X.beginPath();X.arc(cx_,cy_,R,0,6.28);X.stroke();
    X.globalAlpha=1;
    X.restore();
    // Border
    X.strokeStyle=show?'#ffcc00':'#444';X.lineWidth=show?2:1;
    X.beginPath();X.arc(cx_,cy_,R,0,6.28);X.stroke();
    // Label
    dt(b.nm,cx_,cy_+R+20,show?16:13,show?'#ffcc00':'#666','center');
    dt(b.ds,cx_,cy_+R+38,9,show?'#ffaa00':'#444','center');
  }
  dt(isController?'/ \\ seleccionar  A confirmar  B volver':'Haz click en un planeta o usa \u2190\u2192 + ENTER',VW/2,VH-30,11,'#555','center');
  X.restore();
  return hoverIdx;
}

function drawPause(){
  X.globalAlpha=.7;X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);X.globalAlpha=1;
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  dt('PAUSA',VW/2,VH/2-80,32,'#ffcc00','center');
  const items=['Continuar','Reiniciar','Menu Principal'];
  let hoverIdx=-1;
  for(let i=0;i<3;i++){const y=VH/2-30+i*36,sel=i===menuS;
    const hovered=inRect(M.x,M.y,VW/2-100,y-10,200,28);
    if(hovered)hoverIdx=i;
    const show=hoverIdx>=0?hovered:sel;
    dp(VW/2-100,y-10,200,28,show?'#ffcc00':'#222');dt(items[i],VW/2,y+8,show?16:14,show?'#ffcc00':'#888','center')}
  dt(isController?'/ \\ elegir  A confirmar':'Haz click o usa \u2191\u2193 + ENTER',VW/2,VH/2+130,11,'#555','center');
  X.restore();
  return hoverIdx;
}

function drawGO(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  if(PL.lives<=0){
    dt('MISIÓN FALLIDA',VW/2,VH/2-100,32,'#ff4444','center');
    dt('CONDUCTA DESHONROSA',VW/2,VH/2-60,22,'#ff8800','center');
    dt('El Helldiver ha agotado todas sus reanimaciones.',VW/2,VH/2-20,14,'#aaa','center');
    dt('La Super Tierra condena tu fracaso.',VW/2,VH/2+5,14,'#888','center');
  }else{
    dt('MISSION FAILED',VW/2,VH/2-80,32,'#ff4444','center');
    dt('La Super Tierra llora tu sacrificio...',VW/2,VH/2-40,14,'#aaa','center');
  }
  dt(`Kills: ${kills}  Score: ${score}  Nests: ${nestD}/${totalN}  ${DIFF[ds].nm}`,VW/2,VH/2+40,12,'#fff','center');
  dt('[ ENTER para volver al menú ]',VW/2,VH/2+80,14,(fc/25|0)%2?'#ffcc00':'#886600','center');
  X.restore();
}

// ═══ EXTRACTION SYSTEM ═══
const EXTRACT_CODE_LEN=8;
const ARROWS=['up','down','left','right'];
const ARROW_KB={up:'W',down:'S',left:'A',right:'D'};
const ARROW_GP={up:'↑',down:'↓',left:'←',right:'→'};
const ARROW_SVG={up:'▲',down:'▼',left:'◀',right:'▶'};

function genExtractCode(){extractCode=[];for(let i=0;i<EXTRACT_CODE_LEN;i++)extractCode.push(ARROWS[Math.random()*4|0]);extractInput=[]}

function drawExtractPlatform(){
  const px=MW/2-cam.x,py=MH/2-cam.y;
  if(px<-200||px>VW+200||py<-200||py>VH+200)return;
  X.save();X.translate(px,py);
  // Hexagonal platform — yellow/black helldivers style
  const hr=70;
  X.fillStyle='#333';X.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047-0.523;X.lineTo(Math.cos(a)*hr,Math.sin(a)*hr)}
  X.closePath();X.fill();
  X.fillStyle='#444';X.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047-0.523;X.lineTo(Math.cos(a)*(hr-4),Math.sin(a)*(hr-4))}
  X.closePath();X.fill();
  // Yellow border stripes
  X.strokeStyle='#ccaa00';X.lineWidth=3;X.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047-0.523;X.lineTo(Math.cos(a)*hr,Math.sin(a)*hr)}
  X.closePath();X.stroke();
  // Inner hex
  X.strokeStyle='#886600';X.lineWidth=1.5;X.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047-0.523;X.lineTo(Math.cos(a)*(hr-12),Math.sin(a)*(hr-12))}
  X.closePath();X.stroke();
  // Landing zone markings — circle + cross
  X.strokeStyle='#ccaa0066';X.lineWidth=1.5;
  X.beginPath();X.arc(0,0,30,0,6.28);X.stroke();
  X.beginPath();X.moveTo(-20,0);X.lineTo(20,0);X.moveTo(0,-20);X.lineTo(0,20);X.stroke();
  // Corner warning stripes
  for(let i=0;i<6;i++){
    const a=i*1.047-0.523;
    const sx=Math.cos(a)*(hr-2),sy=Math.sin(a)*(hr-2);
    dp(sx-2,sy-2,4,4,(i%2===0)?'#ccaa00':'#333');
  }
  // Antenna structure — base
  dp(-6,-50,12,20,'#555');dp(-4,-48,8,16,'#777');
  // Antenna pole
  dp(-1.5,-70,3,22,'#888');dp(-1,-68,2,18,'#aaa');
  // Antenna dish
  dp(-8,-72,16,4,'#666');dp(-6,-73,12,3,'#888');
  dp(-4,-74,8,2,'#aaa');
  // Blinking light on top
  const blink=Math.sin(fc*.15)>.3;
  if(blink){X.globalAlpha=.8;X.fillStyle='#ff0000';X.beginPath();X.arc(0,-74,3,0,6.28);X.fill();X.globalAlpha=.3;X.beginPath();X.arc(0,-74,6,0,6.28);X.fill();X.globalAlpha=1}
  // E/A prompt when player near
  const pd=Math.hypot(PL.x-MW/2,PL.y-MH/2);
  if(pd<60&&extractReady&&!extracting){
    const blink2=(fc/20|0)%2;
    dt('[E]',0,-85,12,blink2?'#ffff00':'#886600','center');
  }
  X.restore();
}

function drawTerminal(){
  // Terminal border
  // Terminal border
  X.strokeStyle='#00ff44';X.lineWidth=2;X.strokeRect(20,15,VW-40,VH-30);
  X.strokeStyle='#00aa22';X.lineWidth=1;X.strokeRect(24,19,VW-48,VH-38);
  // Scanlines
  X.globalAlpha=.03;
  for(let y=0;y<VH;y+=3){X.fillStyle='#00ff44';X.fillRect(20,y,VW-40,1)}
  X.globalAlpha=1;
  // Title
  dt('>> SOLICITUD DE EXTRACCION <<',VW/2,50,20,'#00ff44','center');
  dt('Terminal de comunicaciones',VW/2,72,11,'#00aa22','center');
  // Divider line
  X.strokeStyle='#00ff44';X.lineWidth=1;X.beginPath();X.moveTo(60,88);X.lineTo(VW-60,88);X.stroke();
  // Instructions
  dt('Introduce la secuencia de flechas:',VW/2,110,13,'#aaffaa','center');
  // Show target sequence
  const seqStart=VW/2-(EXTRACT_CODE_LEN*36)/2;
  for(let i=0;i<EXTRACT_CODE_LEN;i++){
    const ax=seqStart+i*36+18,ay=145;
    // Background box
    X.fillStyle=i<extractInput.length?'#004400':'#1a1a2a';
    X.fillRect(ax-14,ay-14,28,28);
    X.strokeStyle=i<extractInput.length?'#00ff44':'#334';
    X.lineWidth=1;X.strokeRect(ax-14,ay-14,28,28);
    // Arrow
    const ac=i<extractInput.length?(extractInput[i]===extractCode[i]?'#00ff44':'#ff4444'):'#555';
    dt(ARROW_SVG[extractCode[i]],ax,ay+5,16,ac,'center');
  }
  // Progress bar
  const correctCount=extractInput.filter((v,i)=>v===extractCode[i]).length;
  const progW=VW-120;
  X.fillStyle='#1a1a2a';X.fillRect(60,180,progW,6);
  X.fillStyle='#00ff44';X.fillRect(60,180,progW*(correctCount/EXTRACT_CODE_LEN),6);
  dt(`${correctCount}/${EXTRACT_CODE_LEN}`,VW/2,200,10,'#00aa22','center');
  // Keyboard hints
  dt('Teclado: W/A/S/D  |  Mando: D-Pad',VW/2,VH-80,11,'#556655','center');
  // Cancel hint
  dt('[ESC / B para cancelar]',VW/2,VH-55,11,(fc/25|0)%2?'#ff6644':'#883322','center');
}

function updateExtractTerminal(){
  const keys=extractCode.join(',');
  let changed=false;
  if(JP.KeyW||JP.ArrowUp||(isController&&gpJust(12))){extractInput.push('up');changed=true}
  if(JP.KeyS||JP.ArrowDown||(isController&&gpJust(14))){extractInput.push('down');changed=true}
  if(JP.KeyA||JP.ArrowLeft||(isController&&gpJust(15))){extractInput.push('left');changed=true}
  if(JP.KeyD||JP.ArrowRight||(isController&&gpJust(13))){extractInput.push('right');changed=true}
  // Cancel
  if(JP.Escape||(isController&&gpJust(1))){extracting=false;extractInput=[];return}
  // Check match
  if(extractInput.length>=EXTRACT_CODE_LEN){
    const inputStr=extractInput.join(',');
    if(inputStr===keys){
      // Extraction called! Start Pelican
      extracting=false;extractInput=[];
      PELICAN={x:PL.x,y:PL.y-400,phase:'flyin',targetY:PL.y-30,grabbed:false,timer:0,wingA:0,wingDir:1};
      exitPhase=0;exitTmr=0;
      gs='exiting';
      SFX.strat();
    }else{
      // Wrong — flash red and reset input
      extractInput=[];
      shake=5;
    }
  }
}

// ═══ PELICAN ═══
function updatePelican(){
  if(!PELICAN)return;
  const p=PELICAN;
  p.wingA+=p.wingDir*.15;
  if(p.wingA>.5||p.wingA<-.5)p.wingDir*=-1;
  if(exitPhase===0){
    // Fly in from top
    p.y+=3;
    if(p.y>=p.targetY){p.y=p.targetY;exitPhase=1;exitTmr=0}
  }else if(exitPhase===1){
    // Hover, descend to grab
    exitTmr++;
    p.y+=.5;
    if(exitTmr>40){
      // Grab player
      p.grabbed=true;
      PL.alive=false;PL.dying=false;
      exitPhase=2;exitTmr=0;
      SFX.drop();
    }
  }else if(exitPhase===2){
    // Ascend with player
    p.y-=3;
    exitTmr++;
    if(exitTmr>60){exitPhase=3;exitTmr=0}
  }else if(exitPhase===3){
    // Fly off screen to right
    p.x+=5;p.y-=1;
    if(p.x>MW+200){
      // Done — show victory
      gs='victory';PELICAN=null;
      SFX.strat();
    }
  }
}

function drawPelican(){
  if(!PELICAN)return;
  const p=PELICAN;
  X.save();X.translate(p.x,p.y);
  const f=p.grabbed?1:-1;
  const wy=p.wingA*20;
  // Body — fat pelican shape
  dp(-30,-10+f*2,60,18,'#e8e8e8');dp(-25,-8+f*2,50,14,'#f5f5f5');dp(-20,-6+f*2,40,10,'#fff');
  // Head
  dp(25,-14+f*2,18,14,'#e8e8e8');dp(28,-12+f*2,14,10,'#f5f5f5');
  // Beak — large, open
  dp(38,-10+f*2,20,6,'#ff8800');dp(38,-4+f*2,18,4,'#ffaa33');
  // Eye
  dp(32,-12+f*2,4,4,'#222');dp(33,-11+f*2,2,2,'#fff');
  // Wings
  const wingY=f*wy;
  dp(-20,-22+f*2+wingY,40,8,'#ccc');dp(-15,-20+f*2+wingY,30,6,'#ddd');
  dp(-20,8+f*2-wingY,40,8,'#ccc');dp(-15,6+f*2-wingY,30,6,'#ddd');
  // Legs (hanging when grabbing)
  if(p.grabbed){
    dp(-5,8+f*2,3,12,'#ff8800');dp(5,8+f*2,3,12,'#ff8800');
    // Grabbed player
    const pBy=20+f*2;
    dp(-8,pBy,16,14,'#cc9900');dp(-7,pBy+1,14,12,'#ddaa00');
    dp(-6,pBy-6,12,7,'#2a2a2a');dp(-5,pBy-5,10,5,'#3a3a3a');
    dp(-4,pBy-4,8,3,'#00ff44');
  }
  // Tail feathers
  dp(-32,-8+f*2,8,12,'#ddd');dp(-34,-6+f*2,6,8,'#ccc');
  X.restore();
}

// ═══ EXITING CINEMATIC ═══
function updateExit(){
  updatePelican();
  updatePA();updateFP();
}

function drawExit(){
  drawMap();drawFX();drawNS();drawExtractPlatform();drawEN();
  drawPL();drawPA();drawFP();drawPelican();
  // Overlay text
  if(exitPhase===0||exitPhase===1){
    dt('EXTRACCION EN CURSO...',VW/2,30,16,'#ffcc00','center');
    dt('El Pelicano se acerca...',VW/2,50,12,'#aaa','center');
  }else if(exitPhase===2||exitPhase===3){
    dt('¡EXTRACCION EXITOSA!',VW/2,30,18,'#00ff00','center');
  }
}

// ═══ DEBUG MENU ═══
const DBG_OPTS=[
  {nm:'Menu principal',act:'menu'},
  {nm:'Inicio cinematica descenso',act:'dropStart'},
  {nm:'Fin cinematica descenso',act:'dropEnd'},
  {nm:'Matar todos los enemigos',act:'killAll'},
  {nm:'Recoger todas las municiones',act:'getAmmo'},
  {nm:'Recoger todas las granadas',act:'getGrenades'},
  {nm:'Recoger todos los stims',act:'getStims'},
  {nm:'Recoger todos los puntos/cubits',act:'getScore'},
  {nm:'Destruir todos los nidos',act:'destroyNests'},
];
function drawDebugMenu(){
  X.fillStyle='#000';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  dt('>> MENU DEBUG <<',VW/2,40,20,'#ff00ff','center');
  dt('Ctrl+Shift+H para cerrar',VW/2,62,10,'#888','center');
  X.strokeStyle='#ff00ff';X.lineWidth=1;X.beginPath();X.moveTo(60,75);X.lineTo(VW-60,75);X.stroke();
  for(let i=0;i<DBG_OPTS.length;i++){
    const oy=95+i*28;
    const sel=debugSel===i;
    if(sel){X.fillStyle='#ff00ff15';X.fillRect(VW/2-160,oy-12,320,24)}
    dt((sel?'> ':' ')+DBG_OPTS[i].nm,VW/2,oy+5,13,sel?'#ff00ff':'#aaa','center');
  }
  dt('↑↓ Seleccionar  |  ENTER/A Ejecutar  |  ESC/Ctrl+Shift+H Cerrar',VW/2,VH-30,10,'#555','center');
  X.restore();
}
function execDebugAction(act){
  debugMenu=false;
  if(act==='menu'){goMenu()}
  else if(act==='dropStart'){PL.dropAnim=1200;PL.dropPhase=0;PL.firstDrop=true}
  else if(act==='dropEnd'){PL.dropAnim=0;PL.dropPhase=0;PL.firstDrop=false}
  else if(act==='killAll'){for(const e of EN){e.alive=false;kills++;score+=e.sv||10}EN=EN.filter(e=>e.alive)}
  else if(act==='getAmmo'){for(const c of CL){if(c.f==='ammo'){PL.weapons[1].rv=Math.min(600,PL.weapons[1].rv+c.v);collectedAmmo+=c.v;collectedItems++}}CL=CL.filter(c=>c.f!=='ammo')}
  else if(act==='getGrenades'){for(const c of CL){if(c.f==='grenade'){PL.grenades=Math.min(6,PL.grenades+c.v);collectedGrenades+=c.v;collectedItems++}}CL=CL.filter(c=>c.f!=='grenade')}
  else if(act==='getStims'){for(const c of CL){if(c.f==='stim'){PL.stims=Math.min(4,PL.stims+c.v);collectedStims+=c.v;collectedItems++}}CL=CL.filter(c=>c.f!=='stim')}
  else if(act==='getScore'){for(const c of CL){if(c.f==='score'){score+=c.v;collectedItems++}}CL=CL.filter(c=>c.f!=='score')}
  else if(act==='destroyNests'){for(const n of NS){if(!n.destroyed){n.hp=0;n.destroyed=true;nestD++;score+=500}}
    PL.dropAnim=0;PL.dropPhase=0;PL.firstDrop=false;
    extractReady=true;genExtractCode();SFX.strat()}
}

// ═══ ENHANCED VICTORY SCREEN ═══
function drawVictory(){
  X.fillStyle='#0a0a12';X.fillRect(0,0,C.width,C.height);
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  // Header
  dt('MISION COMPLETADA',VW/2,40,28,'#00ff00','center');
  dt('Extraccion exitosa. Bienvenido a casa, Helldiver.',VW/2,68,11,'#88cc88','center');
  // Divider
  X.strokeStyle='#00ff44';X.lineWidth=1;X.beginPath();X.moveTo(50,82);X.lineTo(VW-50,82);X.stroke();
  // Stats
  const col=VW/2;
  const mn=mTimer/3600|0,sc=(mTimer%3600)/60|0;
  dt(`Tiempo: ${mn}:${sc.toString().padStart(2,'0')}`,col,105,14,'#fff','center');
  dt(`Dificultad: ${DIFF[ds].nm}`,col,125,14,'#ffcc00','center');
  dt(`Planeta: ${['Lunar','Desertico','Boscoso','Volcanico'][ps]}`,col,145,14,'#88aaff','center');
  // Divider
  X.strokeStyle='#334';X.beginPath();X.moveTo(80,160);X.lineTo(VW-80,160);X.stroke();
  // Combat stats
  dt(`Enemigos eliminados: ${kills}`,col,180,13,'#ff8844','left');
  dt(`Nidos destruidos: ${nestD}/${totalN}`,col,200,13,'#ff4444','left');
  dt(`Objetos recogidos: ${collectedItems}`,col,220,13,'#ffcc00','left');
  dt(`Municiones: ${collectedAmmo}  Granadas: ${collectedGrenades}  Stims: ${collectedStims}`,col,240,11,'#aaa','left');
  // Divider
  X.strokeStyle='#334';X.beginPath();X.moveTo(80,255);X.lineTo(VW-80,255);X.stroke();
  // Score breakdown
  dt(`Puntuacion: ${score}`,col,275,16,'#ffff00','center');
  // Menu options
  const opts=['Repetir mision','Menu principal'];
  for(let i=0;i<opts.length;i++){
    const oy=310+i*28;
    const sel=victoryMenu===i;
    if(sel){X.fillStyle='#ffffff15';X.fillRect(col-120,oy-12,240,24)}
    dt(opts[i],col,oy+5,14,sel?'#00ff44':'#556655','center');
  }
  dt('↑↓ Seleccionar  |  ENTER/A Confirmar',col,VH-40,10,'#445544','center');
  X.restore();
}

// ═══ LASER SIGHT ═══
function drawLaserSight(){
  if(!PL.alive)return;
  const ox=PL.x+Math.cos(PL.angle)*24,oy=PL.y+Math.sin(PL.angle)*24;
  const dx=Math.cos(PL.angle),dy=Math.sin(PL.angle);
  let minD=500;
  // Check obstacles
  for(const o of obstacles){
    const steps=Math.ceil(minD);
    for(let i=1;i<=steps;i+=3){
      const px=ox+dx*i,py=oy+dy*i;
      if(px>o.x&&px<o.x+o.w&&py>o.y&&py<o.y+o.h){minD=Math.min(minD,i);break}
    }
  }
  // Check enemies
  for(const e of EN){
    if(!e.alive)continue;
    const ex=e.x-ox,ey=e.y-oy;
    const dot=ex*dx+ey*dy;
    if(dot<0||dot>minD)continue;
    const px=ox+dx*dot,py=oy+dy*dot;
    if(Math.hypot(px-e.x,py-e.y)<e.sz+3){minD=Math.min(minD,dot)}
  }
  const ex2=ox+dx*minD,ey2=oy+dy*minD;
  const sx=ex2-cam.x,sy=ey2-cam.y;
  const psx=ox-cam.x,psy=oy-cam.y;
  X.strokeStyle='#ff0000';X.lineWidth=1;X.globalAlpha=.5;
  X.beginPath();X.moveTo(psx,psy);X.lineTo(sx,sy);X.stroke();
  X.globalAlpha=.8;X.fillStyle='#ff0000';X.fillRect(sx-1,sy-1,3,3);
  X.globalAlpha=1;
}

// ═══ GRENADE TRAJECTORY ═══
function drawGrenadeTraj(){
  if(!PL.alive||PL.wpn!==4||PL.grenades<=0)return;
  const spd=4.5,maxD=180,arcH=40;
  const dx=Math.cos(PL.angle),dy=Math.sin(PL.angle);
  // Build trajectory: linear in aim direction + upward arc peaking at midpoint
  const pts=[];
  const steps=30;
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const d=maxD*t;
    let gx=PL.x+dx*d;
    let gy=PL.y+dy*d;
    const arc=arcH*4*t*(1-t); // parabola: 0 at start, peaks at t=0.5, 0 at end
    // Check obstacle collision at ground level
    let hit=false;
    for(const o of obstacles){if(gx>o.x&&gx<o.x+o.w&&gy>o.y&&gy<o.y+o.h){hit=true;break}}
    pts.push({x:gx,y:gy,arc});
    if(hit)break;
  }
  if(pts.length<2)return;
  // Draw dashed arc path (with visual offset upward)
  X.save();X.setLineDash([6,6]);X.lineDashOffset=-fc*.5;
  X.strokeStyle='#ffaa00';X.lineWidth=2;X.globalAlpha=.6;
  X.beginPath();
  X.moveTo(pts[0].x-cam.x,pts[0].y-cam.y-pts[0].arc);
  for(let i=1;i<pts.length;i++)X.lineTo(pts[i].x-cam.x,pts[i].y-cam.y-pts[i].arc);
  X.stroke();
  X.setLineDash([]);
  // Ground shadow line (no arc offset, shows where it lands)
  X.globalAlpha=.25;X.strokeStyle='#ffaa00';X.lineWidth=1;
  X.beginPath();
  X.moveTo(pts[0].x-cam.x,pts[0].y-cam.y);
  for(let i=1;i<pts.length;i++)X.lineTo(pts[i].x-cam.x,pts[i].y-cam.y);
  X.stroke();
  X.globalAlpha=1;
  // Landing marker
  const lp=pts[pts.length-1];
  const lsx=lp.x-cam.x,lsy=lp.y-cam.y;
  X.globalAlpha=.4+Math.sin(fc*.15)*.2;X.strokeStyle='#ff4400';X.lineWidth=2;
  X.beginPath();X.arc(lsx,lsy,12,0,6.28);X.stroke();
  X.beginPath();X.moveTo(lsx-8,lsy);X.lineTo(lsx+8,lsy);X.moveTo(lsx,lsy-8);X.lineTo(lsx,lsy+8);X.stroke();
  X.globalAlpha=1;X.restore();
  // Distance label
  const dPx=Math.round(maxD);
  X.globalAlpha=.6;dt(`${dPx}px`,lsx,lsy-18,10,'#ffaa00','center');X.globalAlpha=1;
}

// ═══ GAME CONTROL ═══
function startPlay(){gs='playing';MW=3200;MH=2400;resetPL();EN=[];BL=[];EX=[];PA=[];FP=[];CL=[];NS=[];LASER=null;shake=0;score=0;kills=0;nestD=0;totalN=0;mTimer=0;spTmr=0;ds=ds;for(const k in SDEF)SDEF[k].cd=0;genStars();genTerrain();spawnNS();spawnLoot();playMusic(.6);PODS=[];EAGLES=[];DROPS=[];extractReady=false;extracting=false;PELICAN=null;exitPhase=0;exitTmr=0;collectedAmmo=0;collectedGrenades=0;collectedStims=0;collectedItems=0;victoryMenu=0}
function goMenu(){gs='title';menuS=0;resetMusic();playMusic(.6)}

// ═══ MAIN LOOP ═══
let mouseWDown=false;
function loop(){
  requestAnimationFrame(loop);fc++;X.imageSmoothingEnabled=false;
  pollGamepad();syncVGP();

  // Debug menu toggle: Ctrl+Shift+H
  if((K.ControlLeft||K.ControlRight)&&(K.ShiftLeft||K.ShiftRight)&&K.KeyH){
    if(!debugMenu&&gs!=='title'&&gs!=='changelog'&&gs!=='about'&&gs!=='diff'&&gs!=='planet'){debugMenu=true;debugSel=0}
    else if(debugMenu)debugMenu=false;
    K.KeyH=false;
  }
  if(debugMenu){
    if(JP.ArrowUp||(isController&&gpJust(12)))debugSel=Math.max(0,debugSel-1);
    if(JP.ArrowDown||(isController&&gpJust(14)))debugSel=Math.min(DBG_OPTS.length-1,debugSel+1);
    if(JP.Enter||JP.NumpadEnter||(isController&&gpJust(0)))execDebugAction(DBG_OPTS[debugSel].act);
    if(JP.Escape)debugMenu=false;
    drawDebugMenu();cj();gpEndFrame();M.click=false;return;
  }

  // Track mouse click edge for pistol (cleared at end of frame)

  if(gs==='title'){
    drawTitle();
    if(ac&&!mOn&&!musicMuted)playMusic(.6);
    // Version click → changelog
    if(M.click&&inRect(M.x,M.y,VW/2-80,233,160,14)){gs='changelog';clScroll=0;clPage=CLG.length-1;M.click=false;SFX.mc()}
    // Credits click → about
    else if(M.click&&inRect(M.x,M.y,VW/2-60,448,120,14)){gs='about';M.click=false;SFX.mc()}
    else if(JP.Enter||JP.NumpadEnter||(M.click&&fc>10)||(isController&&gpJust(0)&&fc>10)){ea();gs='diff';menuS=-1;SFX.mc();M.down=false;M.click=false}
    if(JP.KeyM||isController&&gpJust(8)){musicMuted=!musicMuted;if(musicMuted)stopMusic();else playMusic(.6)}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='changelog'){
    drawChangelog();
    if(JP.Escape||M.click||(isController&&gpJust(1))){gs='title';SFX.ms();M.click=false}
    if(JP.ArrowLeft||JP.KeyA||(isController&&gpJust(14))){clPage=Math.max(0,clPage-1);clScroll=0;SFX.ms()}
    if(JP.ArrowRight||JP.KeyD||(isController&&gpJust(15))){clPage=Math.min(CLG.length-1,clPage+1);clScroll=0;SFX.ms()}
    if(JP.ArrowUp||JP.KeyW||(isController&&gpJust(12)))clScroll=Math.max(0,clScroll-20);
    if(JP.ArrowDown||JP.KeyS||(isController&&gpJust(13))){const maxS=Math.max(0,(ch.c.length*16)-(VH-140));clScroll=Math.min(maxS,clScroll+20)}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='about'){
    drawAbout();
    if(JP.Escape||M.click||(isController&&gpJust(0))){gs='title';SFX.ms();M.click=false}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='diff'){
    const hovDiff=drawDiffSelect();
    if(JP.ArrowUp||JP.KeyW||(isController&&gpJust(12))){menuS=menuS<=0?0:menuS-1;SFX.ms()}
    if(JP.ArrowDown||JP.KeyS||(isController&&gpJust(13))){menuS=menuS<0?0:Math.min(DIFF.length-1,menuS+1);SFX.ms()}
    if(M.click&&hovDiff>=0){menuS=hovDiff;ds=menuS;gs='planet';menuS=-1;SFX.mc();M.click=false}
    else if((JP.Enter||JP.NumpadEnter||(isController&&gpJust(0)))&&menuS>=0){ds=menuS;gs='planet';menuS=-1;SFX.mc()}
    if(JP.Escape||(isController&&gpJust(1))){gs='title';SFX.ms();M.click=false}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='planet'){
    const hovPlan=drawPlanetSelect();
    if(JP.ArrowLeft||JP.KeyA||(isController&&gpJust(14))){menuS=menuS<=0?0:menuS-1;SFX.ms()}
    if(JP.ArrowRight||JP.KeyD||(isController&&gpJust(15))){menuS=menuS<0?0:Math.min(BIOM.length-1,menuS+1);SFX.ms()}
    if(M.click&&hovPlan>=0){menuS=hovPlan;ps=menuS;SFX.mc();startPlay();M.click=false}
    else if((JP.Enter||JP.NumpadEnter||(isController&&gpJust(0)))&&menuS>=0){ps=menuS;SFX.mc();startPlay()}
    if(JP.Escape||(isController&&gpJust(1))){gs='diff';menuS=-1;SFX.ms();M.click=false}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='paused'){
    const hovPause=drawPause();
    if(JP.ArrowUp||JP.KeyW||(isController&&gpJust(12))){menuS=menuS<=0?0:menuS-1;SFX.ms()}
    if(JP.ArrowDown||JP.KeyS||(isController&&gpJust(13))){menuS=menuS<0?0:Math.min(2,menuS+1);SFX.ms()}
    if(M.click&&hovPause>=0){
      menuS=hovPause;SFX.mc();M.click=false;
      if(menuS===0)gs='playing';
      else if(menuS===1)startPlay();
      else if(menuS===2)goMenu();
    }
    else if((JP.Enter||JP.NumpadEnter||(isController&&gpJust(0)))&&menuS>=0){
      SFX.mc();M.click=false;
      if(menuS===0)gs='playing';
      else if(menuS===1)startPlay();
      else if(menuS===2)goMenu();
    }
    if(JP.Escape||(isController&&gpJust(1))){gs='playing';SFX.ms()}
    cj();gpEndFrame();M.click=false;return;
  }
  if(gs==='gameover'){drawGO();if(JP.Enter||JP.NumpadEnter||M.click||(isController&&gpJust(0))){goMenu();M.click=false}cj();gpEndFrame();M.click=false;return}
  if(gs==='exiting'){updateExit();X.save();X.translate(GOX,GOY);X.scale(SC,SC);X.beginPath();X.rect(0,0,VW,VH);X.clip();drawExit();X.restore();cj();gpEndFrame();M.click=false;return}
  if(gs==='victory'){
    drawVictory();
    if(JP.ArrowUp||(isController&&gpJust(12)))victoryMenu=Math.max(0,victoryMenu-1);
    if(JP.ArrowDown||(isController&&gpJust(14)))victoryMenu=Math.min(1,victoryMenu+1);
    if(JP.Enter||JP.NumpadEnter||(isController&&gpJust(0))){
      if(victoryMenu===0){startPlay();extractReady=false;extracting=false;PELICAN=null}
      else goMenu();
      M.click=false;
    }
    if(JP.Escape||(isController&&gpJust(1)))goMenu();
    cj();gpEndFrame();M.click=false;return
  }

  // ─── PLAYING ───
  if(JP.Escape||(isController&&gpJust(9))){gs='paused';menuS=-1;SFX.ms();cj();gpEndFrame();return}
  if(JP.KeyM||(isController&&gpJust(8))){musicMuted=!musicMuted;if(musicMuted)stopMusic();else playMusic(.3)}

  // Stratagem mode (pauses gameplay)
  if(PL.sgMode){
    // Cancel on Ctrl/Q again or LB button
    if(JP.ControlLeft||JP.ControlRight||(isController&&gpJust(4))){PL.sgMode=false;PL.sgPhase='input';PL.sgInput='';PL.matchedSG=null;SFX.ms()}
    // Target phase: click or A button to confirm
    if(PL.sgPhase==='target'&&(M.click||(isController&&gpJust(0)))){
      if(isController){PL.sgTarget={x:PL.x+Math.cos(PL.angle)*200,y:PL.y+Math.sin(PL.angle)*200}}
      else{PL.sgTarget={x:M.x+cam.x,y:M.y+cam.y}}
      activateSG(PL.matchedSG);
      PL.sgMode=false;PL.sgPhase='input';PL.sgInput='';PL.matchedSG=null;
    }
    updateSG();updateMusicInt();
    // Draw frozen scene
    X.save();X.translate(GOX,GOY);X.scale(SC,SC);
    X.beginPath();X.rect(0,0,VW,VH);X.clip();
    drawMap();drawFX();drawNS();drawCLIcons();drawEN();drawBL();drawPL();drawLaserSight();drawFT();drawPickupHint();drawHUD();
    drawSGUI()
    X.globalAlpha=.3;X.fillStyle='#000';X.fillRect(0,0,VW,VH);X.globalAlpha=1;
    dtOutline('PAUSA ESTRATAGEMA',VW/2,38,14,'#ffcc00','center');
    X.restore();
    if(useMobileLayout()){X.save();X.translate(OX,OY);X.scale(SC,SC);drawVirtualController();X.restore()}
    cj();gpEndFrame();return;
  }

  // Drop pod
  if(PL.dropAnim>0){X.save();X.translate(GOX,GOY);X.scale(SC,SC);X.beginPath();X.rect(0,0,VW,VH);X.clip();if(PL.dropPhase>0||!PL.firstDrop){drawMap();drawStars()}drawPod();drawHUD();X.restore();if(useMobileLayout()){X.save();X.translate(OX,OY);X.scale(SC,SC);drawVirtualController();X.restore()}cj();gpEndFrame();return}

  // Normal update
  mTimer++;updateMusicInt();updatePL();updateEN();updateBL();updateEX();updatePA();updateFP();updateCL();updateFT();updateSG();updateLaser();updateTargeting();updatePODS();updateEAGLES();updateDROPS();
  if(totalN>0&&nestD>=totalN&&!extractReady){extractReady=true;genExtractCode();SFX.strat();say('nest')}
  // Terminal interaction — near antenna
  if(extractReady&&!extracting&&Math.hypot(PL.x-MW/2,PL.y-MH/2)<60&&(JP.KeyE||(isController&&gpJust(0)))){
    extracting=true;extractInput=[];genExtractCode();
  }
  // Terminal update
  if(extracting){updateExtractTerminal();updateMusicInt();
    X.fillStyle='#0a0a12';X.fillRect(0,0,C.width,C.height);
    X.save();X.translate(GOX,GOY);X.scale(SC,SC);drawTerminal();X.restore();
    cj();gpEndFrame();M.click=false;return;
  }

  // Render
  X.save();X.translate(GOX,GOY);X.scale(SC,SC);
  X.beginPath();X.rect(0,0,VW,VH);X.clip();
  if(shake>0){X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.88;if(shake<.4)shake=0}
  drawMap();drawFX();drawNS();if(extractReady)drawExtractPlatform();drawCLIcons();drawEN();drawBL();drawPL();drawLaserSight();drawGrenadeTraj();drawFT();drawPickupHint();drawHUD();drawSGUI();drawPODS();drawEAGLES();drawDROPS();drawTargetingCrosshair();
  X.restore();
  // Draw virtual controller outside game clip
  if(useMobileLayout()){X.save();X.translate(OX,OY);X.scale(SC,SC);drawVirtualController();X.restore()}
  cj();gpEndFrame();M.click=false;
}

// ═══ PLAYER UPDATE ═══
function updatePL(){
  PL.stratUsed=0;
  // Death processing (runs even when dead)
  if(PL.dying){
    PL.deathT++;cam.x=PL.x-VW/2;cam.y=PL.y-VH/2;cam.x=Math.max(0,Math.min(MW-VW,cam.x));cam.y=Math.max(0,Math.min(MH-VH,cam.y));
    if(PL.deathT>120){
      if(PL.lives>1){
        PL.lives--;PL.dying=false;PL.alive=true;PL.hp=PL.maxHp;PL.inv=120;PL.dropAnim=120;PL.dropPhase=0;PL.burning=false;PL.burnT=0;PL.drownT=0;PL.inWater=false;PL.vx=0;PL.vy=0;PL.reloading=false;PL.relT=0;PL.fireT=30;PL.firstDrop=false;PL.activeSG=null;PL.hasCmd=false;PL.wpn=1;
        // Full ammo on revive
        for(const k in PL.weapons){const w=PL.weapons[k];w.am=w.ma;w.rv=k==='1'?150:k==='2'?42:0}
        // Find safe spawn: spiral search outward from death position
        const ox=PL.x,oy=PL.y;let found=false;
        for(let r=150;r<500;r+=30){if(found)break;
          for(let a=0;a<6.28;a+=.5){if(found)break;
            const tx=ox+Math.cos(a)*r,ty=oy+Math.sin(a)*r;
            if(tx<100||tx>MW-100||ty<100||ty>MH-100)continue;
            let safe=true;
            if(safe)for(const h of [...waterLakes,...lavaLakes,...abyssPits,...sandPits])if(inHazardGroup(tx,ty,h)){safe=false;break}
            if(safe)for(const o of obstacles)if(tx>o.x-20&&tx<o.x+o.w+20&&ty>o.y-20&&ty<o.y+o.h+20){safe=false;break}
            if(safe){PL.x=tx;PL.y=ty;found=true}
          }
        }
      }
      else{PL.lives=0;gs='gameover'}
    }
    return}
  if(PL.burning){shake=3;if(PL.burnT%3===0)for(let p=0;p<3;p++)PA.push({x:PL.x+(Math.random()-.5)*12,y:PL.y+(Math.random()-.5)*12,vx:(Math.random()-.5)*1.5,vy:-1-Math.random()*2,l:20,c:['#ff4400','#ffcc00','#ff8800'][Math.random()*3|0]});
    cam.x=PL.x-VW/2;cam.y=PL.y-VH/2;cam.x=Math.max(0,Math.min(MW-VW,cam.x));cam.y=Math.max(0,Math.min(MH-VH,cam.y))}
  if(!PL.alive)return;
  // Aim: controller right stick > touch > mouse
  if(isController){
    const rx=gpAxis(2),ry=gpAxis(3);
    if(Math.hypot(rx,ry)>0.15){
      let aimAngle=Math.atan2(ry,rx);
      let bestDiff=0.3;
      for(const e of EN){if(!e.alive)continue;const eA=Math.atan2(e.y-PL.y,e.x-PL.x);let d=aimAngle-eA;while(d>Math.PI)d-=6.28;while(d<-Math.PI)d+=6.28;if(Math.abs(d)<bestDiff){bestDiff=Math.abs(d);aimAngle=eA}}
      PL.angle=aimAngle;
    }
  }else{PL.angle=Math.atan2(M.y-VH/2,M.x-VW/2)}
  let dx=0,dy=0;
  // Movement: controller left stick > keyboard
  if(isController){dx=gpAxis(0);dy=gpAxis(1)}
  else{if(K.KeyW)dy=-1;if(K.KeyS)dy=1;if(K.KeyA)dx=-1;if(K.KeyD)dx=1}
  const moving=Math.hypot(dx,dy)>.1;
  // Sprint: controller RB or keyboard shift
  const gpSprint=isController&&gpHeld(5);
  PL.sprinting=(K.ShiftLeft||gpSprint)&&moving&&PL.stamina>0;
  let spd=PL.speed;
  if(PL.sprinting)spd=PL.sprintSpd;
  else if(PL.stamina<=0)spd=PL.speed*.5; // Exhausted: slower than walking
  if(moving){const l=Math.hypot(dx,dy);PL.vx=(dx/l)*spd;PL.vy=(dy/l)*spd}else{PL.vx*=.75;PL.vy*=.75}
  if(PL.sprinting){PL.stamina-=.5;if(PL.stamina<=0){PL.stamina=0;PL.sprinting=false}}
  else{PL.stamina=Math.min(PL.maxSt,PL.stamina+PL.stRegen)}
  // Water/Lava/Abyss/Sand detection — irregular hazards
  PL.inWater=false;PL.hazardType=null;
  // Check abyss pits (lunar) — instant death
  for(const a of abyssPits){if(inHazardGroup(PL.x,PL.y,a)){
    PL.hazardType='abyss';PL.hp=0;PL.alive=false;PL.dying=true;PL.deathT=0;PL.deathCause='abyss';SFX.scream();break;
  }}
  // Check sand pits (desert) — escapeable, slow movement
  if(!PL.hazardType)for(const s of sandPits){if(inHazardGroup(PL.x,PL.y,s)){
    PL.hazardType='sand';PL.vx*=.08;PL.vy*=.08;PL.sprinting=false;PL.sinkT++;
    if(PL.sinkT>=300){PL.hp=0;PL.alive=false;PL.dying=true;PL.deathT=0;PL.deathCause='sand';SFX.scream()}
    break;
  }}
  if(!PL.hazardType&&PL.hazardType!=='sand'&&PL.sinkT>0)PL.sinkT=Math.max(0,PL.sinkT-3);
  // Check water lakes (forest) — escapeable, very slow movement
  for(const w of waterLakes){if(inHazardGroup(PL.x,PL.y,w)){
    PL.hazardType='water';PL.inWater=true;PL.vx*=.06;PL.vy*=.06;PL.sprinting=false;PL.drownT++;
    if(PL.drownT>120&&(fc%40===0))SFX.hit();
    if(PL.drownT>=300){PL.hp=0;PL.alive=false;PL.dying=true;PL.deathT=0;PL.deathCause='water';SFX.scream()}
    break;
  }}
  if(!PL.inWater&&PL.drownT>0)PL.drownT=Math.max(0,PL.drownT-3);
  // Check lava lakes (volcanic) — zones
  for(const l of lavaLakes){if(inHazardGroup(PL.x,PL.y,l)){
    const edgeDist=distToHazardEdge(PL.x,PL.y,l);
    const maxR=Math.max(...l.parts.map(p=>p.r));
    if(edgeDist>maxR*0.4){
      // Inner zone — death inevitable
      if(!PL.burning){PL.burning=true;PL.burnT=120;PL.hazardType='lava_inner';PL.hp=0;PL.alive=false;shake=20;SFX.scream();
        for(let p=0;p<20;p++)PA.push({x:PL.x,y:PL.y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,l:25,c:'#ff4400'});
      }
    }else{
      // Outer zone — damage over time, can escape
      PL.burning=true;PL.hazardType='lava_outer';PL.vx*=.05;PL.vy*=.05;PL.sprinting=false;PL.burnT++;
      if(PL.burnT%20===0){PL.hp-=5;shake=3;SFX.hit()}
    }
    break;
  }}
  if(!PL.hazardType||(!PL.hazardType.startsWith('lava'))){if(PL.burning&&PL.burnT>0){PL.burnT=Math.max(0,PL.burnT-3);if(PL.burnT<=0)PL.burning=false}}
  // Jump pack: Space key OR A button double-tap on controller
  let jumpTrigger=JP.Space;
  if(isController&&gpJust(0)){
    const now=Date.now();
    if(now-bLastTap<300)jumpTrigger=true;
    bLastTap=now;
  }
  if(PL.activeSG==='jump'&&jumpTrigger){PL.vx=Math.cos(PL.angle)*9;PL.vy=Math.sin(PL.angle)*9;PL.inv=15;for(let p=0;p<10;p++)PA.push({x:PL.x,y:PL.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:15,c:'#4488ff'})}
  moveEnt(PL,PL.vx,PL.vy);
  if(PL.inv>0)PL.inv--;
  // Weapon select: keyboard 1-4 OR controller Y button OR D-Pad Right
  if(JP.Digit1)PL.wpn=1;if(JP.Digit2)PL.wpn=2;if(JP.Digit3&&PL.hasCmd)PL.wpn=3;if(JP.Digit4)PL.wpn=4;
  if(isController&&gpJust(3)){yTapTime=Date.now()}
  if(isController&&!gpHeld(3)&&yTapTime>0){const held=Date.now()-yTapTime;yTapTime=0;if(held>=1000&&PL.hasCmd){PL.wpn=3}else{PL.wpn=PL.wpn===1?2:1}}
  if(isController&&gpJust(15))PL.wpn=4; // D-Pad Right = weapon 4
  // Cancel targeting: Escape or Ctrl/LB again
  if(PL.targeting&&(JP.Escape||(isController&&gpJust(1))||JP.ControlLeft||JP.ControlRight||(isController&&gpJust(4)))){
    PL.targeting=null;PL.matchedSG=null;PL.sgTarget=null;SFX.ms();
  }
  // Stratagem toggle: Ctrl/Q key OR LB button (not while targeting)
  if(!PL.targeting&&(JP.ControlLeft||JP.ControlRight||(isController&&gpJust(4)))){PL.sgMode=true;PL.sgPhase='input';PL.sgInput='';PL.matchedSG=null}
  // Shooting - pistol only on click edge
  PL.fireT--;
  if(!PL.sgMode&&!PL.targeting&&!PL.stratUsed&&PL.wpn!==4&&PL.fireT<=0&&!PL.reloading&&!PL.inWater){
    const w=PL.weapons[PL.wpn];
    let shouldFire=false;
    if(PL.wpn===2){if(M.click||(isController&&gpJust(7)))shouldFire=true}
    else if(PL.wpn!==4){if(M.down||(isController&&GP.rt>0.5))shouldFire=true}
    if(shouldFire&&(w.am>0||PL.wpn===2)){
      const spr=(Math.random()-.5)*w.sp,ang=PL.angle+spr;
      if(PL.wpn===3&&PL.hasCmd){BL.push(mkRkt(PL.x+Math.cos(ang)*16,PL.y+Math.sin(ang)*16,ang));shake=8;SFX.rocket();if(isController)gpVibrate(100,0.3)}
      else{BL.push(mkBul(PL.x+Math.cos(ang)*13,PL.y+Math.sin(ang)*13,ang,7,w.dm,1,PL.wpn===1?'#ffcc00':'#00ff00'));shake=PL.wpn===1?2:0;PL.wpn===1?SFX.mg():SFX.pistol();if(isController)gpVibrate(50,0.15)}
      if(PL.wpn!==2)w.am--;
      PL.fireT=w.fr;
      PA.push({x:PL.x+Math.cos(ang)*15,y:PL.y+Math.sin(ang)*15,vx:Math.cos(ang)*2,vy:Math.sin(ang)*2,l:4,c:'#ffcc00'});
      if(fc%10===0)say('shoot');
      // NO auto-reload
    }
  }
  // Manual reload: R key OR X button
  if((JP.KeyR||(isController&&gpJust(2)))&&!PL.reloading){
    const w=PL.weapons[PL.wpn];
    if(PL.wpn===2||PL.wpn===4){/* no reload for pistol/grenades */}
    else if(w.am>=w.ma){vTimer=90;vLine='MUNICIÓN LLENA'}
    else if(w.rv<=0){vTimer=90;vLine='¡SIN MUNICIÓN!'}
    else if(w.rl<=0){/* weapon doesn't reload */}
    else{PL.reloading=true;PL.relT=w.rl}
  }
  if(PL.reloading){PL.relT--;if(PL.relT<=0){PL.reloading=false;SFX.reload();const w=PL.weapons[PL.wpn],n=w.ma-w.am,a=Math.min(n,w.rv);w.am+=a;w.rv-=a}}
  // Weapon 4: click OR controller RT to throw grenade toward aim point
  if(!PL.targeting&&PL.wpn===4&&PL.grenades>0&&!PL.inWater&&PL.fireT<=0&&(M.click||(isController&&GP.rt>0.5))){
    let ang,maxD;
    if(isController){ang=PL.angle;maxD=180}
    else{ang=Math.atan2(M.y-VH/2,M.x-VW/2);const clickDist=Math.hypot(M.x-VW/2,M.y-VH/2);maxD=Math.min(clickDist,180)}
    PL.grenades--;
    BL.push(mkGrn(PL.x+Math.cos(ang)*12,PL.y+Math.sin(ang)*12,ang,maxD));
    SFX.grenade();say('grenade');M.click=false;PL.fireT=30;
  }
  // G key: throw at max distance in facing direction (keyboard)
  if(!PL.targeting&&JP.KeyG&&PL.grenades>0){
    const ang=PL.angle;
    PL.grenades--;
    BL.push(mkGrn(PL.x+Math.cos(ang)*12,PL.y+Math.sin(ang)*12,ang,180));
    SFX.grenade();say('grenade');
  }
  // Melee buttstock: F key OR RB button
  if(PL.meleeT>0)PL.meleeT--;
  if(!PL.targeting&&PL.meleeT<=0&&(JP.KeyF||(isController&&gpJust(5)))){
    PL.meleeT=60;PL.meleeAnim=15;
    const meleeDm=50,meleeRange=30;
    for(const e of EN){
      if(!e.alive)continue;
      if(Math.hypot(e.x-PL.x,e.y-PL.y)<meleeRange+e.sz/2){
        e.hp-=meleeDm;e.hs=6;e.vx=Math.cos(e.angle)*-3;e.vy=Math.sin(e.angle)*-3;
        SFX.hit();shake=4;
        for(let p=0;p<4;p++)PA.push({x:(PL.x+e.x)/2,y:(PL.y+e.y)/2,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:10,c:'#ffcc00'});
        if(e.hp<=0){e.alive=false;kills++;score+=e.sv||10;SFX.kill();say('kill')}
      }
    }
    if(isController)gpVibrate(80,0.3);
  }
  // Stim: V key OR D-Pad Up on controller
  if((JP.KeyV||(isController&&gpJust(12)))&&PL.stims>0&&PL.hp<PL.maxHp){PL.stims--;PL.hp=Math.min(PL.maxHp,PL.hp+50);PL.inv=25;SFX.heal();say('stim');if(isController)gpVibrate(100,0.2);for(let p=0;p<8;p++)PA.push({x:PL.x,y:PL.y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,l:18,c:'#00ff00'})}
  if(PL.hp<=30&&fc%100===0)say('low');
  if(PL.hp<=0&&!PL.dying){PL.alive=false;PL.dying=true;PL.deathT=0;PL.deathCause='enemy';SFX.scream();PL.targeting=null;PL.matchedSG=null;
    // Scatter equipped items on death
    const dropTypes=[];
    if(PL.activeSG==='dog')dropTypes.push('dog');
    if(PL.activeSG==='jump')dropTypes.push('jump');
    if(PL.hasCmd)dropTypes.push('cmd');
    for(let i=0;i<dropTypes.length;i++){
      const a=(i/dropTypes.length)*6.28+Math.random()*0.5;
      DROPS.push({x:PL.x+Math.cos(a)*35,y:PL.y+Math.sin(a)*35,tp:dropTypes[i]});
    }
    PL.activeSG=null;PL.hasCmd=false;
  }
  cam.x=PL.x-VW/2;cam.y=PL.y-VH/2;cam.x=Math.max(0,Math.min(MW-VW,cam.x));cam.y=Math.max(0,Math.min(MH-VH,cam.y));
}

// Start
genStars();loop();
