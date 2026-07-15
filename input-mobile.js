// ═══ MOBILE INPUT — Touch VGP (Landscape-only) ═══
// Requires game.js loaded first (defines VGP, CTL, useMobileLayout, isLandscape, gs, ea, M, inRect, inCircle, C, CTRL_W, VW, VH)

// ═══ TOUCH COORDINATE HELPERS ═══
function tToV(tx,ty){return{x:(tx-OX)/SC,y:(ty-OY)/SC}}

// ═══ VGP HIT DETECTION — Landscape ═══
function hitLandscapeLeft(identifier,cx,cy){
  for(const tr of CTL.lTrigs){if(inRect(cx,cy,tr.x,tr.y,tr.w,tr.h)){VGP.lt=1;VGP.touchMap[identifier]={type:'trig',id:'LT'};return true}}
  for(const bt of CTL.lBtns){if(inRect(cx,cy,bt.x,bt.y,bt.w,bt.h)){VGP.lb=true;VGP.touchMap[identifier]={type:'trig',id:'LB'};return true}}
  if(inCircle(cx,cy,CTL.lJoy.cx,CTL.lJoy.cy,CTL.lJoy.r+25)){VGP.ljTouch=identifier;VGP.ljx=0;VGP.ljy=0;return true}
  // D-pad cross hit detection
  const d=CTL.lDpad[0],dcx=d.cx,dcy=d.cy,a=d.arm,t=d.thick;
  if(Math.abs(cx-dcx)<a+t&&Math.abs(cy-dcy)<a+t){
    let dir=null;
    if(Math.abs(cy-dcy)>Math.abs(cx-dcx)){dir=cy<dcy?'du':'dd'}
    else{dir=cx<dcx?'dl':'dr'}
    if(dir){VGP[dir]=true;VGP.touchMap[identifier]={type:'dpad',id:dir};return true}
  }
  for(const mb of CTL.lMid){if(inCircle(cx,cy,mb.cx,mb.cy,mb.r+8)){VGP.start=true;VGP.touchMap[identifier]={type:'mid',id:'start'};return true}}
  return false;
}
function hitLandscapeRight(identifier,cx,cy){
  for(const tr of CTL.rTrigs){if(inRect(cx,cy,tr.x,tr.y,tr.w,tr.h)){VGP.rt=1;VGP.touchMap[identifier]={type:'trig',id:'RT'};return true}}
  for(const bt of CTL.rBtns){if(inRect(cx,cy,bt.x,bt.y,bt.w,bt.h)){VGP.rb=true;VGP.touchMap[identifier]={type:'trig',id:'RB'};return true}}
  if(inCircle(cx,cy,CTL.rJoy.cx,CTL.rJoy.cy,CTL.rJoy.r+25)){VGP.rjTouch=identifier;VGP.rjx=0;VGP.rjy=0;return true}
  for(const bt of CTL.rFace){if(inCircle(cx,cy,bt.cx,bt.cy,bt.r+10)){if(bt.id==='X')VGP.x=true;else if(bt.id==='Y')VGP.y=true;else if(bt.id==='A')VGP.a=true;else if(bt.id==='B')VGP.b=true;VGP.touchMap[identifier]={type:'btn',id:bt.id};return true}}
  for(const mb of CTL.rMid){if(inCircle(cx,cy,mb.cx,mb.cy,mb.r+8)){VGP.back=true;VGP.touchMap[identifier]={type:'mid',id:'back'};return true}}
  return false;
}

// ═══ JOYSTICK MOVE ═══
function onVGPMove(identifier,vx,vy){
  if(VGP.ljTouch===identifier){
    const dx=vx-CTL.lJoy.cx,dy=vy-CTL.lJoy.cy;
    const d=Math.hypot(dx,dy),mr=CTL.lJoy.r;
    VGP.ljx=Math.max(-1,Math.min(1,d<=mr?dx/mr:dx/d));
    VGP.ljy=Math.max(-1,Math.min(1,d<=mr?dy/mr:dy/d));return true;
  }
  if(VGP.rjTouch===identifier){
    const dx=vx-CTL.rJoy.cx,dy=vy-CTL.rJoy.cy;
    const d=Math.hypot(dx,dy),mr=CTL.rJoy.r;
    VGP.rjx=Math.max(-1,Math.min(1,d<=mr?dx/mr:dx/d));
    VGP.rjy=Math.max(-1,Math.min(1,d<=mr?dy/mr:dy/d));return true;
  }
  return false;
}
function onVGPEnd(identifier){
  const m=VGP.touchMap[identifier];
  if(m){
    if(m.type==='trig'){if(m.id==='LT')VGP.lt=0;else if(m.id==='LB')VGP.lb=false;else if(m.id==='RB')VGP.rb=false;else if(m.id==='RT')VGP.rt=0}
    else if(m.type==='btn'){if(m.id==='X')VGP.x=false;else if(m.id==='Y')VGP.y=false;else if(m.id==='A')VGP.a=false;else if(m.id==='B')VGP.b=false}
    else if(m.type==='mid'){if(m.id==='start')VGP.start=false;else VGP.back=false}
    else if(m.type==='dpad')VGP[m.id]=false;
    delete VGP.touchMap[identifier];
  }
  if(VGP.ljTouch===identifier){VGP.ljTouch=-1;VGP.ljx=0;VGP.ljy=0}
  if(VGP.rjTouch===identifier){VGP.rjTouch=-1;VGP.rjx=0;VGP.rjy=0}
}

// ═══ TOUCH EVENT HANDLERS ═══
function onTouchStart(e){
  try{ea();}catch(ex){}
  if(!isLandscape){
    // Portrait: only allow menu touches on game area
    for(const t of e.changedTouches){
      const v=tToV(t.clientX,t.clientY);
      if(v.x>=0&&v.x<VW&&v.y>=0&&v.y<VH&&(gs==='title'||gs==='changelog'||gs==='diff'||gs==='planet'||gs==='paused'||gs==='gameover'||gs==='victory')){
        M.x=v.x;M.y=v.y;M.click=true;M.down=true;
      }
    }
    return;
  }
  for(const t of e.changedTouches){
    const v=tToV(t.clientX,t.clientY);
    // Route touch to left or right controller area
    if(v.x>=0&&v.x<CTRL_W)hitLandscapeLeft(t.identifier,v.x,v.y);
    else if(v.x>=CTRL_W+VW)hitLandscapeRight(t.identifier,v.x-CTRL_W-VW,v.y);
    // Menu touch: tapping game area acts as mouse click
    if(v.x>=CTRL_W&&v.x<CTRL_W+VW&&v.y>=0&&v.y<VH&&(gs==='title'||gs==='changelog'||gs==='diff'||gs==='planet'||gs==='paused'||gs==='gameover'||gs==='victory')){
      M.x=v.x-CTRL_W;M.y=v.y;M.click=true;M.down=true;
    }
  }
}
function onTouchMove(e){
  if(!isLandscape)return;
  for(const t of e.changedTouches){
    const v=tToV(t.clientX,t.clientY);
    if(VGP.ljTouch===t.identifier){
      const dx=v.x-CTL.lJoy.cx,dy=v.y-CTL.lJoy.cy;
      const d=Math.hypot(dx,dy),mr=CTL.lJoy.r;
      VGP.ljx=Math.max(-1,Math.min(1,d<=mr?dx/mr:dx/d));
      VGP.ljy=Math.max(-1,Math.min(1,d<=mr?dy/mr:dy/d));
    }
    if(VGP.rjTouch===t.identifier){
      const vx2=v.x-(CTRL_W+VW),vy2=v.y;
      const dx2=vx2-CTL.rJoy.cx,dy2=vy2-CTL.rJoy.cy;
      const d=Math.hypot(dx2,dy2),mr=CTL.rJoy.r;
      VGP.rjx=Math.max(-1,Math.min(1,d<=mr?dx2/mr:dx2/d));
      VGP.rjy=Math.max(-1,Math.min(1,d<=mr?dy2/mr:dy2/d));
    }
  }
}
function onTouchEnd(e){
  if(!isLandscape){if(e.touches.length===0)M.down=false;return;}
  for(const t of e.changedTouches){onVGPEnd(t.identifier)}
  if(e.touches.length===0){M.down=false}
}

// ═══ REGISTER TOUCH LISTENERS ═══
C.addEventListener('touchstart',onTouchStart,{passive:true});
C.addEventListener('touchmove',onTouchMove,{passive:true});
C.addEventListener('touchend',onTouchEnd,{passive:true});
C.addEventListener('touchcancel',onTouchEnd,{passive:true});
