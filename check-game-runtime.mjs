// Node orchestration smoke test. Uses actual scene geometry, with DOM/GPU adapters.
// This checks the game loop and controls; it is not browser or visual validation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),THREE=require('./vendor/three.min.js');
globalThis.THREE=THREE;require('./vendor/BufferGeometryUtils.js');
const elements=new Map(),listeners=new Map(),raf=new Map();let nextFrame=1,errors=[];
const context2d=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(id){if(elements.has(id))return elements.get(id);const set=new Set(),events=new Map(),e={id,hidden:false,open:false,textContent:'',innerHTML:'',dataset:{},style:{setProperty(){}},classList:{add:s=>set.add(s),remove:s=>set.delete(s),toggle(s,b){b?set.add(s):set.delete(s);},contains:s=>set.has(s)},addEventListener(k,fn){events.set(k,fn);},dispatch(k,event={}){events.get(k)?.(event);},append(){},focus(){},closest(){return null;},getContext(){return context2d;},setPointerCapture(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:110,height:110};},showModal(){this.open=true;},close(){this.open=false;this.dispatch('close');}};elements.set(id,e);return e;}
const html=fs.readFileSync('play.html','utf8');for(const [,id]of html.matchAll(/id="([^"]+)"/g))element(id);
const dialogs=['pause-dialog','journal-dialog','archive-dialog'].map(element);
const document={hidden:false,body:element('body'),querySelector:s=>element(s.slice(1)),querySelectorAll:s=>s==='dialog'?dialogs:[],createElement:()=>element('created-'+elements.size),addEventListener(k,fn){listeners.set(k,fn);}};
class Renderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}}
class Composer{constructor(){this.passes=[];}addPass(p){this.passes.push(p);}setPixelRatio(){}setSize(){}render(){}}
class ShaderPass{constructor(s){this.uniforms=s.uniforms;}}
const API={...THREE,WebGLRenderer:Renderer,EffectComposer:Composer,RenderPass:class{},UnrealBloomPass:class{},ShaderPass,FXAAShader:{uniforms:{resolution:{value:new THREE.Vector2()}}}};
const sandbox={window:null,document,console:{...console,error:(...s)=>errors.push(s)},THREE:API,ArchiveCore:require('./game-core.js'),ArchiveWorld:require('./game-world.js'),ArchiveMotion:require('./game-motion.js'),ArchiveFX:require('./game-fx.js'),matchMedia:()=>({matches:false}),innerWidth:1440,innerHeight:900,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:fn=>{const id=nextFrame++;raf.set(id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id),setTimeout:fn=>fn(),addEventListener:(k,fn)=>listeners.set(k,fn)};
sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('content.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('game.js','utf8'),sandbox);
let now=0;function step(n=1){for(let i=0;i<n;i++){now+=16;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(now));}}
function key(code){listeners.get('keydown')({code,repeat:false,target:element('world'),preventDefault(){}});listeners.get('keyup')({code});}
step(5);assert.deepEqual(errors,[],'Game initialization must succeed');assert.ok(element('loading').hidden);element('begin').onclick();step(20);assert.ok(element('title-screen').hidden);assert.equal(element('hud').hidden,false);
for(const action of ['KeyJ','ShiftLeft','Space','KeyQ']){key(action);step(80);}
key('KeyR');assert.ok(element('journal-dialog').open);step(10);element('journal-dialog').close();key('Escape');assert.ok(element('pause-dialog').open);element('setting-quality').onclick();element('setting-effects').onclick();step(10);element('pause-dialog').close();step(100);
// Travel controls are generated HTML; invoke the same click handler's target to exercise every arena.
const source=fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(()=>setTimeout(init,40));','window.__game={teleport,doAttack,doPulse,discover,openArchive,player,enemies,get avatar(){return avatar;}};requestAnimationFrame(()=>setTimeout(init,40));');
raf.clear();vm.runInContext(source,sandbox);step(5);element('begin').onclick();
key('Space');step(8);key('Space');step(100);assert.ok(sandbox.__game.player.flying);assert.ok(sandbox.__game.avatar.jets.every(j=>j.flame.visible));assert.ok(sandbox.__game.player.y>5);key('Space');step(140);assert.ok(sandbox.__game.player.grounded);assert.ok(!sandbox.__game.player.flying);
sandbox.__game.teleport(0);step(70);key('Space');step(8);key('Space');step(100);
assert.equal(sandbox.__game.avatar.sword.visible,false,'Sword must stay hidden in flight');
const guard=sandbox.__game.enemies.find(e=>!e.boss&&!e.dead),hp=guard.hp;sandbox.__game.doAttack();step(24);assert.ok(guard.hp<hp,'Aerial repulsor must damage a ground enemy');assert.equal(sandbox.__game.avatar.sword.visible,false);
key('ShiftLeft');key('KeyJ');step(24);assert.ok(guard.hp<hp-1,'Repulsor can fire while boosting');
key('Space');step(160);assert.ok(sandbox.__game.player.grounded);assert.equal(sandbox.__game.avatar.sword.visible,true,'Sword returns after landing');
for(let i=0;i<5;i++){sandbox.__game.teleport(i);step(70);sandbox.__game.discover();step(5);sandbox.__game.openArchive(i);assert.ok(element('archive-dialog').open);assert.ok(element('archive-content').innerHTML.length>100);element('archive-dialog').close();for(let k=0;k<5;k++){sandbox.__game.doAttack();step(35);}sandbox.__game.doPulse();step(150);}
assert.deepEqual(errors,[]);assert.ok(sandbox.__game.enemies.find(e=>e.boss).sequence>0,'Guardian should attack when approached');
console.log('PASS Game orchestration: initialization, first frames, all abilities, pause/settings, five archive pages, travel, discovery, and guardian attacks. GPU rendering was stubbed.');
