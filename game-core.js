(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArchiveCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ISLANDS=[
    {id:'origin',name:'The Origin',subtitle:'A curious mind',x:-30,z:-20,r:10,color:0x9fe2c1,chapter:'I',nodes:['origin']},
    {id:'armory',name:'The Armory',subtitle:'Tools of the craft',x:-31,z:22,r:10,color:0x8acbe7,chapter:'II',nodes:['armory']},
    {id:'campaign',name:'The Campaign',subtitle:'Ideas made real',x:30,z:-20,r:11,color:0xedc78f,chapter:'III',nodes:['corelift','x1','cxowork','early']},
    {id:'quests',name:'The Observatory',subtitle:'Beyond the ordinary',x:31,z:22,r:10,color:0xc7b0e9,chapter:'IV',nodes:['fraud','hack','colossus']},
    {id:'gate',name:'The Astral Gate',subtitle:'What comes next',x:0,z:-45,r:13,color:0xf0c998,chapter:'V',nodes:['gate']}
  ];
  const segmentDistance=(x,z,ax,az,bx,bz)=>{
    const vx=bx-ax,vz=bz-az,t=clamp(((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz||1),0,1);
    return Math.hypot(x-ax-t*vx,z-az-t*vz);
  };
  function onGround(x,z){
    return Math.hypot(x,z)<=14.7 || ISLANDS.some(i=>Math.hypot(x-i.x,z-i.z)<=i.r || segmentDistance(x,z,0,0,i.x,i.z)<=2.35);
  }
  function createPlayer(){return {x:0,z:8,y:0,vy:0,vx:0,vz:0,angle:Math.PI,hp:100,resonance:100,dashTime:0,dashDuration:.34,dashCooldown:0,dashX:0,dashZ:-1,invulnerable:0,attackTime:0,attackDuration:0,combo:0,comboWindow:0,pulseCooldown:0,grounded:true,jumps:0,flying:false,flightHeight:6,checkpoint:{x:0,z:8},kills:0};}
  function dashSpeed(progress){return 12+24*Math.sin(Math.PI*Math.pow(clamp(progress,0,1),.65));}
  function startDash(p,dx,dz){
    if(p.dashCooldown>0||(!p.grounded&&!p.flying)||p.hp<=0)return false;
    const length=Math.hypot(dx,dz);
    p.dashX=length>.05?dx/length:Math.sin(p.angle);p.dashZ=length>.05?dz/length:Math.cos(p.angle);
    p.dashTime=p.dashDuration;p.dashCooldown=.85;p.invulnerable=.4;p.angle=Math.atan2(p.dashX,p.dashZ);p.attackTime=0;return true;
  }
  function startJump(p){
    if(p.hp<=0)return false;
    if(p.flying){p.flying=false;p.jumps=2;p.vy=Math.min(p.vy,0);return true;}
    if(p.grounded){p.vy=9.4;p.grounded=false;p.jumps=1;return true;}
    if(p.jumps===1){p.flying=true;p.jumps=2;p.flightHeight=Math.max(6,p.y+2.5);p.vy=6;p.attackTime=0;return true;}
    return false;
  }
  function canHitAir(p,target,range=28){return Math.hypot(target.x-p.x,(target.y||0)-(p.y+1.4),target.z-p.z)<=range;}
  function startAttack(p){
    if(p.hp>0&&p.attackTime<=0&&(p.flying||(!p.grounded&&p.jumps===2))){p.attackDuration=.32;p.attackTime=.32;return {air:true,damage:1,range:28,delay:.1,heavy:false};}
    const nextCombo=p.comboWindow>0?(p.combo+1)%3:0;
    if(p.attackTime>0||p.dashTime>0||p.hp<=0)return null;
    p.combo=nextCombo;
    p.attackDuration=p.combo===2?.78:p.combo===1?.62:.58;p.attackTime=p.attackDuration;p.comboWindow=1.3;
    return {damage:p.combo===2?2:1,range:p.combo===2?5:4.3,halfAngle:p.combo===2?1.5:1.3,delay:p.combo===2?.34:p.combo===1?.27:.25,heavy:p.combo===2};
  }
  function startPulse(p){if(p.resonance<100||p.hp<=0)return false;p.resonance=0;p.pulseCooldown=1;p.invulnerable=Math.max(p.invulnerable,.45);return true;}
  function hitInArc(p,target,range,halfAngle){
    const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
    if(d>range+(target.radius||0))return false;
    return d<.01||(dx*Math.sin(p.angle)+dz*Math.cos(p.angle))/d>=Math.cos(halfAngle);
  }
  function hurt(p,amount){if(p.invulnerable>0||p.hp<=0)return false;p.hp=Math.max(0,p.hp-amount);p.invulnerable=.8;return true;}
  function respawn(p){p.x=p.checkpoint.x;p.z=p.checkpoint.z;p.y=0;p.vy=0;p.vx=p.vz=0;p.hp=100;p.invulnerable=2;p.grounded=true;p.jumps=0;p.flying=false;p.flightHeight=6;p.attackTime=0;p.dashTime=0;}
  function stepPlayer(p,input,dt){
    dt=clamp(dt,0,.04);
    for(const key of ['dashCooldown','invulnerable','attackTime','comboWindow','pulseCooldown'])p[key]=Math.max(0,p[key]-dt);
    p.resonance=Math.min(100,p.resonance+dt*8);
    let dx=input.x||0,dz=input.z||0;const length=Math.hypot(dx,dz);if(length>1){dx/=length;dz/=length;}
    if(p.hp<=0){dx=dz=0;}
    const speed=p.flying?18:input.sprint?17:12;
    if(p.dashTime>0){p.dashTime=Math.max(0,p.dashTime-dt);const progress=1-p.dashTime/p.dashDuration,burst=dashSpeed(progress);p.vx=p.dashX*burst;p.vz=p.dashZ*burst;p.x+=p.vx*dt;p.z+=p.vz*dt;}
    else{const rate=13,k=1-Math.exp(-dt*rate),factor=p.attackTime>0&&!p.flying?.45:1,tx=dx*speed*factor,tz=dz*speed*factor;
      // Integrate the damped velocity analytically so faster movement stays consistent across frame rates.
      p.x+=tx*dt+(p.vx-tx)*k/rate;p.z+=tz*dt+(p.vz-tz)*k/rate;p.vx+=(tx-p.vx)*k;p.vz+=(tz-p.vz)*k;
    }
    if(length>.05&&p.attackTime<=0&&p.dashTime<=0){const target=Math.atan2(dx,dz);let delta=(target-p.angle+Math.PI*3)%TAU-Math.PI;p.angle+=delta*(1-Math.exp(-dt*17));}
    const supported=onGround(p.x,p.z);
    if(!supported)p.grounded=false;
    if(p.flying&&p.hp>0){p.grounded=false;p.vy+=((p.flightHeight-p.y)*3-p.vy)*(1-Math.exp(-dt*5));p.y+=p.vy*dt;}
    else if(!p.grounded){p.flying=false;p.vy-=dt*26;p.y+=p.vy*dt;if(supported&&p.y<=0&&p.vy<=0&&p.y>-.8){p.y=0;p.vy=0;p.grounded=true;p.jumps=0;}}
    return {fell:p.y < -12,moving:Math.hypot(p.vx,p.vz),supported};
  }
  function createEnemy(x,z,boss=false){return {x,z,homeX:x,homeZ:z,hp:3,maxHp:3,boss,radius:boss?2.3:1,phase:'idle',timer:0,cooldown:boss?1.2:.5,stun:0,sequence:0,targetX:x,targetZ:z,hitFlash:0,dead:false};}
  function stepEnemy(e,p,dt){
    if(e.dead||p.hp<=0)return null;
    e.hitFlash=Math.max(0,e.hitFlash-dt);e.stun=Math.max(0,e.stun-dt);
    if(e.stun>0&&!e.boss)return null;
    const distance=Math.hypot(p.x-e.x,p.z-e.z);
    if(e.phase==='windup'){
      e.timer-=dt;
      if(e.timer<=0){e.phase='recover';e.timer=e.boss?.8:.65;e.sequence++;return {kind:e.boss?(e.sequence%2?'wave':'lance'):'strike',x:e.x,z:e.z,targetX:e.targetX,targetZ:e.targetZ,damage:e.boss?24:14,enraged:e.hp/e.maxHp<.5};}
      return null;
    }
    if(e.phase==='recover'){e.timer-=dt;if(e.timer<=0){e.phase='idle';e.cooldown=e.boss?(e.hp/e.maxHp<.5?.7:1.3):.6;}return null;}
    e.cooldown-=dt;
    if(distance>(e.boss?19:12)){e.phase='idle';return null;}
    if(!e.boss&&distance>3.1){
      e.phase='pursue';const speed=3.4,dx=(p.x-e.x)/distance,dz=(p.z-e.z)/distance;
      const nx=e.x+dx*dt*speed,nz=e.z+dz*dt*speed;
      if(Math.hypot(nx-e.homeX,nz-e.homeZ)<7.5&&onGround(nx,nz)){e.x=nx;e.z=nz;}
    }else if(e.cooldown<=0){e.phase='windup';e.timer=e.boss?(e.hp/e.maxHp<.5?.7:1.05):.8;e.windupDuration=e.timer;e.targetX=p.x;e.targetZ=p.z;return {kind:'warning'};}
    return null;
  }
  // Every successful attack removes one hit point, including finishers and firebursts.
  function damageEnemy(e,n){if(e.dead||!(n>0))return false;e.hp=Math.max(0,e.hp-1);e.hitFlash=.18;e.stun=.25;if(e.hp===0){e.dead=true;e.phase='dead';return true;}return false;}
  function parseSave(raw){try{const s=JSON.parse(raw);if(!s||s.version!==1||!Array.isArray(s.discovered))return {discovered:[],guardian:false};return {discovered:[...new Set(s.discovered.filter(id=>ISLANDS.some(i=>i.id===id)))],guardian:s.guardian===true};}catch{return {discovered:[],guardian:false};}}
  return {ISLANDS,clamp,segmentDistance,onGround,createPlayer,dashSpeed,startDash,startJump,startAttack,startPulse,canHitAir,hitInArc,hurt,respawn,stepPlayer,createEnemy,stepEnemy,damageEnemy,parseSave};
});
