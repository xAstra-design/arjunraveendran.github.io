import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),C=require('./game-core.js'),THREE=require('./vendor/three.min.js');
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const advance=(p,seconds,input={x:0,z:0})=>{for(let t=0;t<seconds;t+=.01)C.stepPlayer(p,input,.01);};

test('Guards and guardian each require exactly three hits from any attack mix',()=>{
  for(const boss of [false,true])for(const hits of [[1,1,1],[2,2,2],[4,4,4],[5,5,5],[1,2,5]]){
    const e=C.createEnemy(0,0,boss);
    assert.equal(e.maxHp,3);
    assert.equal(C.damageEnemy(e,0),false);assert.equal(e.hp,3);
    hits.forEach((strength,index)=>{
      assert.equal(C.damageEnemy(e,strength),index===2);
      assert.equal(e.hp,2-index);
      assert.equal(e.dead,index===2);
    });
    assert.equal(C.damageEnemy(e,1),false);assert.equal(e.hp,0);
  }
});
test('All five bridges remain traversable from the courtyard to each archive',()=>{for(const i of C.ISLANDS)for(let n=0;n<=100;n++)assert.ok(C.onGround(i.x*n/100,i.z*n/100));assert.equal(C.onGround(70,70),false);});
test('Movement is normalized, bounded in long frames, and independent of frame rate',()=>{const a=C.createPlayer(),b=C.createPlayer();advance(a,.8,{x:1,z:0});advance(b,.8,{x:1,z:1});assert.ok(Math.abs(Math.hypot(a.x,a.z-8)-Math.hypot(b.x,b.z-8))<.001);const c=C.createPlayer();C.stepPlayer(c,{x:1,z:0},60);assert.ok(c.x<.3);const d=C.createPlayer();for(let n=0;n<40;n++)C.stepPlayer(d,{x:1,z:0},.02);assert.ok(Math.abs(d.x-a.x)<.05);});
test('Dash blocks damage during evade and respects cooldown without stamina',()=>{const p=C.createPlayer();assert.ok(C.startDash(p,1,0));assert.equal("energy" in p,false);assert.equal(C.hurt(p,24),false);assert.equal(C.startDash(p,1,0),false);advance(p,.5);assert.ok(C.hurt(p,24));assert.equal(p.hp,76);advance(p,.7);assert.ok(C.startDash(p,-1,0));});
test('Jump lands and walking off the sanctuary triggers a recoverable fall',()=>{const p=C.createPlayer();assert.ok(C.startJump(p));advance(p,1);assert.equal(p.grounded,true);assert.equal(p.y,0);p.x=80;p.z=80;advance(p,1.2);assert.ok(p.y< -12);p.hp=0;C.respawn(p);assert.equal(p.hp,100);assert.ok(C.onGround(p.x,p.z));assert.equal(p.y,0);});
test('Sword combos can continue indefinitely without stamina, and reset after a pause',()=>{const p=C.createPlayer();for(let n=0;n<60;n++){const hit=C.startAttack(p);assert.ok(hit,'Strike '+n+' must remain available');assert.equal(hit.heavy,n%3===2);assert.equal(hit.damage,n%3===2?2:1);advance(p,p.attackDuration+.02);}advance(p,1.4);assert.equal(C.startAttack(p).heavy,false);});
test('Sword hit detection excludes enemies behind the player and beyond reach',()=>{const p=C.createPlayer();p.angle=0;assert.ok(C.hitInArc(p,{x:0,z:11},4.3,1.3));assert.equal(C.hitInArc(p,{x:0,z:5},4.3,1.3),false);assert.equal(C.hitInArc(p,{x:0,z:20},4.3,1.3),false);});
test('Pulse needs a full charge and regenerates for another cast',()=>{const p=C.createPlayer();assert.ok(C.startPulse(p));assert.equal(C.startPulse(p),false);advance(p,12.6);assert.ok(C.startPulse(p));});
test('Sentinel telegraphs a fixed target before striking; death stops AI',()=>{const e=C.createEnemy(0,0),p=C.createPlayer();p.z=2;let warning;for(let n=0;n<60;n++){const v=C.stepEnemy(e,p,.01);if(v){warning=v;break;}}assert.equal(warning.kind,'warning');p.x=5;let hit;for(let n=0;n<90;n++){const v=C.stepEnemy(e,p,.01);if(v){hit=v;break;}}assert.equal(hit.kind,'strike');assert.equal(hit.targetX,0);assert.equal(hit.targetZ,2);C.damageEnemy(e,1);C.damageEnemy(e,1);assert.ok(C.damageEnemy(e,1));assert.equal(C.stepEnemy(e,p,1),null);});
test('Guardian alternates shockwaves and lances, accelerating below half health',()=>{const e=C.createEnemy(0,0,true),p=C.createPlayer(),attacks=[];for(let n=0;n<1100;n++){const v=C.stepEnemy(e,p,.01);if(v&&v.kind!=='warning')attacks.push(v.kind);}assert.deepEqual(attacks.slice(0,2),['wave','lance']);e.hp=1;e.phase='idle';e.cooldown=0;assert.equal(C.stepEnemy(e,p,.01).kind,'warning');assert.equal(e.windupDuration,.7);});
test('Save parser rejects corrupt/versioned data and unknown archive IDs',()=>{assert.deepEqual(C.parseSave('broken'),{discovered:[],guardian:false});assert.deepEqual(C.parseSave('{"version":2,"discovered":["gate"]}'),{discovered:[],guardian:false});assert.deepEqual(C.parseSave(JSON.stringify({version:1,discovered:['origin','origin','fake'],guardian:'true'})),{discovered:['origin'],guardian:false});});
const html=fs.readFileSync('play.html','utf8'),source=fs.readFileSync('game.js','utf8'),ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
test('Every game control exists and all scripts parse',()=>{for(const [,id]of source.matchAll(/\$\('#([\w-]+)'\)/g))assert.ok(ids.has(id),'Missing control '+id);for(const file of ['game.js','game-core.js','game-world.js','game-motion.js','game-fx.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});});
globalThis.THREE=THREE;require('./vendor/BufferGeometryUtils.js');
const scene=new THREE.Scene(),world=require('./game-world.js')(THREE,C).build(scene,true),avatar=world.traveler(),enemy=world.sentinel(),boss=world.sentinel(true);
test('World, animated traveler, and guardian build with finite merged geometry',()=>{assert.equal(world.shrines.length,5);assert.equal(avatar.legs.length,2);assert.equal(avatar.arms.length,2);assert.equal(boss.armor.length,6);let meshes=0,vertices=0;scene.updateMatrixWorld(true);scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position;assert.ok(p.array.every(Number.isFinite),'Invalid '+o.geometry.type);vertices+=p.count;});assert.ok(meshes<400,'Static geometry should be batched');assert.ok(vertices>100000,'Detailed world geometry expected');console.log(`  ${meshes} meshes, ${vertices.toLocaleString()} vertices`);});
test('World animation freezes at a fixed time and retains finite transforms',()=>{const camera=new THREE.PerspectiveCamera();world.animate(2,camera);const before=world.shrines[1].parts[0].rotation.toArray();world.animate(2,camera);assert.deepEqual(world.shrines[1].parts[0].rotation.toArray(),before);world.animate(4,camera);scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));});
test('All résumé chapters map to actual portfolio content',()=>{const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('content.js','utf8'),sandbox);const available=sandbox.window.PORTFOLIO.nodes.map(n=>n.id);for(const island of C.ISLANDS)for(const id of island.nodes)assert.ok(available.includes(id));assert.equal(C.ISLANDS.flatMap(i=>i.nodes).length,available.length);});
test('Both hands stay on the sword throughout every strike and recovery',()=>{
  const motion=require('./game-motion.js');assert.equal(avatar.sword.parent,avatar.body);
  for(let combo=0;combo<3;combo++){const points=[];for(let n=0;n<=100;n++){const pose=motion.weapon(combo,n/100);assert.ok(pose.every(Number.isFinite));avatar.holdSword(pose);avatar.g.updateMatrixWorld(true);for(let handIndex=0;handIndex<2;handIndex++){const hand=avatar.elbows[handIndex].localToWorld(new THREE.Vector3(0,-.42,.025)),grip=avatar.sword.localToWorld(new THREE.Vector3(0,handIndex===1?0:-.24,0));assert.ok(hand.distanceTo(grip)<.005,`Combo ${combo} frame ${n} hand ${handIndex}: ${hand.distanceTo(grip)}`);}points.push(avatar.sword.localToWorld(new THREE.Vector3(0,2.05,0)));}assert.ok(points[27].distanceTo(points[61])>2,'Blade must sweep visibly');assert.deepEqual(motion.weapon(combo,0),motion.weaponRest);motion.weapon(combo,1).forEach((v,i)=>assert.ok(Math.abs(v-motion.weaponRest[i])<1e-10));}
});
test('Surge accelerates and decelerates, facing its direction without instant velocity reversal',()=>{assert.ok(C.dashSpeed(.3)>C.dashSpeed(0)*2);assert.ok(C.dashSpeed(.9)<C.dashSpeed(.3));const p=C.createPlayer();C.startDash(p,1,0);assert.equal(p.angle,Math.PI/2);C.stepPlayer(p,{x:-1,z:0},.02);assert.ok(p.vx>0);assert.equal(p.angle,Math.PI/2);});
test('Fire, blade trails, and afterimages are finite, freeze when paused, and expire',()=>{
  const fx=require('./game-fx.js')(THREE,scene,avatar,true),camera=new THREE.PerspectiveCamera(),p=C.createPlayer();fx.explode(0,0,0);C.startDash(p,1,0);fx.update(.016,0,camera,p,null,true);assert.ok(fx.ghosts.some(g=>g.group.visible));assert.ok(fx.flames.every(f=>f.mesh.visible));const before=fx.flames[0].mesh.position.clone();fx.update(0,0,camera,p,null,true);assert.ok(fx.flames[0].mesh.position.equals(before));p.dashTime=0;
  for(let n=0;n<180;n++)fx.update(.016,n*.016,camera,p,null,true);assert.ok(fx.flames.every(f=>!f.mesh.visible));assert.ok(fx.ghosts.every(g=>!g.group.visible));scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));fx.explode(0,0,0);fx.clear();assert.ok(fx.flames.every(f=>!f.mesh.visible));assert.equal(fx.ribbon.geometry.drawRange.count,0);
});
test('Second jump launches sustained flight, supports steering/boost, then lands and resets',()=>{
 const p=C.createPlayer();assert.ok(C.startJump(p));advance(p,.12);assert.ok(C.startJump(p));assert.ok(p.flying);advance(p,3);assert.ok(p.y>5.5&&p.y<7);assert.ok(!p.grounded);const before=p.x;advance(p,.25,{x:1,z:0});assert.ok(p.x>before+1);assert.ok(C.startDash(p,1,0));advance(p,.35,{x:1,z:0});assert.ok(p.flying);assert.ok(C.startJump(p));assert.ok(!p.flying);assert.equal(C.startJump(p),false);p.x=0;p.z=8;p.vx=p.vz=0;advance(p,2);assert.ok(p.grounded);assert.equal(p.jumps,0);assert.ok(C.startJump(p));C.startJump(p);C.respawn(p);assert.ok(!p.flying);assert.equal(p.jumps,0);
});
test('Jetpack deployment changes only private suit materials and retains finite geometry',()=>{
 const stone=world.M.stone.color.clone(),ivory=world.M.ivory.color.clone();assert.equal(avatar.jets.length,4);avatar.flightSuit(1,2);assert.ok(avatar.jets.every(j=>j.flame.visible));assert.ok(avatar.cape.scale.y<.2);assert.ok(world.M.stone.color.equals(stone));assert.ok(world.M.ivory.color.equals(ivory));avatar.flightSuit(0,3);assert.ok(avatar.jets.every(j=>!j.flame.visible));assert.equal(avatar.cape.scale.y,1);
});
test('Aerial attacks use ranged repulsors and measure altitude in targeting range',()=>{const p=C.createPlayer();C.startJump(p);advance(p,.1);C.startJump(p);advance(p,2);C.startDash(p,1,0);const shot=C.startAttack(p);assert.ok(shot.air);assert.ok(C.canHitAir(p,{x:p.x,y:0,z:p.z+10},shot.range));assert.ok(!C.canHitAir(p,{x:p.x,y:50,z:p.z},shot.range));assert.ok(!C.canHitAir(p,{x:p.x+40,y:p.y,z:p.z},shot.range));});
test('Enemies have grounded humanoid rigs, weapons, shields, and a larger guardian silhouette',()=>{for(const model of [enemy,boss]){assert.equal(model.arms.length,2);assert.equal(model.legs.length,2);assert.equal(model.knees.length,2);assert.ok(model.head&&model.weapon&&model.shield);assert.equal(model.baseY,0);}assert.ok(boss.size>enemy.size*1.5);});
console.log(`\n${checks} game checks passed. No browser or GPU visual testing performed.`);
