(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.ArchiveWorld=factory;})(typeof globalThis!=='undefined'?globalThis:this,function(THREE,Core){
  'use strict';
  const TAU=Math.PI*2;
  const color=n=>new THREE.Color(n).convertSRGBToLinear();
  function build(scene,low=false){
    const architecture=new THREE.Group();scene.add(architecture);
    const animateables=[],shrines=[],clouds=[],colliders=[];let seed=1729;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    function material(hex,roughness=.6,metalness=0,emissive=0,intensity=0){return new THREE.MeshStandardMaterial({color:color(hex),roughness,metalness,emissive:color(emissive),emissiveIntensity:intensity});}
    const M={stone:material(0xc6d6d3,.7),edge:material(0x758c91,.58,.15),dark:material(0x264551,.5,.35),rock:material(0x344d5a,.96),gold:material(0xd7bd86,.32,.7),ivory:material(0xeee4cf,.42,.25),moss:material(0x557e70,.9),black:material(0x122b3b,.43,.4),cloth:material(0x24576c,.92),glow:material(0x96eee4,.3,.15,0x58dcca,2.6),amber:material(0xf7d399,.3,.25,0xffc66e,1.7)};
    M.cloth.side=THREE.DoubleSide;
    // A subtle stone grain is a material texture, not a page illustration.
    const pixels=new Uint8Array(128*128*4);
    for(let i=0;i<128*128;i++){const n=185+random()*60;pixels[i*4]=pixels[i*4+1]=pixels[i*4+2]=n;pixels[i*4+3]=255;}
    const grain=new THREE.DataTexture(pixels,128,128,THREE.RGBAFormat);grain.needsUpdate=true;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(5,5);
    M.stone.roughnessMap=grain;M.rock.roughnessMap=grain;
    function add(geometry,mat,parent=architecture,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    const box=(w,h,d,mat,parent,x=0,y=0,z=0)=>add(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
    const cylinder=(r1,r2,h,mat,parent,x=0,y=0,z=0,segments=32)=>add(new THREE.CylinderGeometry(r1,r2,h,segments),mat,parent,x,y,z);
    const ring=(r,t,mat,parent,x=0,y=0,z=0)=>add(new THREE.TorusGeometry(r,t,8,low?48:80),mat,parent,x,y,z);
    function rod(a,b,r,mat,parent){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=cylinder(r,r,delta.length(),mat,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
    function disk(r,mat,parent,y,thickness=.2){return cylinder(r,r,thickness,mat,parent,0,y,0,64);}
    function island(x,z,r,index){
      const g=new THREE.Group();g.position.set(x,0,z);architecture.add(g);
      const geo=new THREE.CylinderGeometry(r*.98,r*.27,11,48,5);const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){const y=pos.getY(i),f=(5.5-y)/11;pos.setX(i,pos.getX(i)*(1+(random()-.5)*.2*f));pos.setZ(i,pos.getZ(i)*(1+(random()-.5)*.2*f));if(y<5)pos.setY(i,y+(random()-.5)*1.8*f);}
      geo.computeVertexNormals();add(geo,M.rock,g,0,-5.9,0);
      disk(r+.05,M.dark,g,-.4,.75);disk(r,M.stone,g,-.12,.25);disk(r-.55,M.edge,g,-.02,.03);disk(r-.8,M.stone,g,0,.03);
      for(const radius of [r-.35,r-.7,r*.62]){const rr=ring(radius,.045,M.gold,g,0,.035,0);rr.rotation.x=Math.PI/2;}
      const count=32;for(let k=0;k<count;k++){
        const a=k/count*TAU,rr=r-.12;const b=box(.085,.04,.46,k%4===0?M.gold:M.dark,g,Math.cos(a)*rr,.04,Math.sin(a)*rr);b.rotation.y=-a;
        if(k%2===0){const support=box(.55,.62,.75,M.edge,g,Math.cos(a)*(r-.13),-.5,Math.sin(a)*(r-.13));support.rotation.y=-a;}
      }
      for(let k=0;k<12;k++){const a=k/12*TAU;const shard=add(new THREE.DodecahedronGeometry(.5+random()*.75,0),M.rock,g,Math.cos(a)*(r+.5+random()),-2-random()*6,Math.sin(a)*(r+.5));shard.scale.y=1+random()*2;}
      // Carved radial joints give floors a deliberate masonry layout.
      for(let k=0;k<16;k++){const a=k/16*TAU;const b=box(.025,.017,r*.29,M.edge,g,Math.sin(a)*r*.81,.035,Math.cos(a)*r*.81);b.rotation.y=a;}
      return g;
    }
    island(0,0,14.7,0);
    function bridge(i){
      const distance=Math.hypot(i.x,i.z),start=13.8,end=distance-i.r+.7,length=end-start;
      const g=new THREE.Group();g.position.set(i.x/distance*(start+length/2),-.03,i.z/distance*(start+length/2));g.rotation.y=Math.atan2(i.x,i.z);architecture.add(g);
      box(4.7,.55,length,M.dark,g,0,-.37,0);box(4.45,.16,length,M.stone,g,0,-.05,0);
      const planks=Math.ceil(length/1.4);
      for(let k=0;k<=planks;k++)box(4.43,.025,.045,M.edge,g,0,.05,-length/2+k/planks*length);
      for(const side of [-1,1]){
        box(.075,.08,length,M.gold,g,side*2.18,.09,0);
        box(.09,.1,length,M.gold,g,side*2.2,1.1,0);
        for(let k=0;k<=Math.ceil(length/3);k++){const z=-length/2+k/Math.ceil(length/3)*length;cylinder(.07,.1,1.15,M.dark,g,side*2.2,.5,z,8);add(new THREE.OctahedronGeometry(.14),M.amber,g,side*2.2,1.16,z);}
      }
      for(let k=0;k<planks;k++){const b=box(.18,.018,.35,M.glow,g,0,.056,-length/2+(k+.5)/planks*length);b.rotation.y=Math.PI/4;}
    }
    function column(g,x,z,h=6){
      g.updateWorldMatrix(true,false);const point=g.localToWorld(new THREE.Vector3(x,0,z));if(Math.abs(point.y)<.1)colliders.push({x:point.x,z:point.z,r:1.05});
      cylinder(.9,1.08,.3,M.edge,g,x,.15,z,12);cylinder(.62,.7,.3,M.ivory,g,x,.43,z,12);cylinder(.43,.56,h,M.stone,g,x,h/2+.5,z,16);
      for(const y of [.75,h-.2])cylinder(.58,.58,.15,M.gold,g,x,y,z,16);
      cylinder(.75,.62,.3,M.ivory,g,x,h+.6,z,12);add(new THREE.OctahedronGeometry(.38,0),M.amber,g,x,h+1,z);
      for(let k=0;k<6;k++){const a=k/6*TAU;rod([x+Math.sin(a)*.46,1,z+Math.cos(a)*.46],[x+Math.sin(a)*.43,h+.1,z+Math.cos(a)*.43],.025,M.gold,g);}
    }
    // The sanctuary's immense celestial arch is visible from every approach.
    const arch=new THREE.Group();arch.position.set(0,0,-6);architecture.add(arch);
    for(const x of [-9,9])column(arch,x,0,10);
    const vault=add(new THREE.TorusGeometry(9,.64,12,72,Math.PI),M.stone,arch,0,10.5,0);
    const trim=add(new THREE.TorusGeometry(9,.055,8,72,Math.PI),M.gold,arch,0,10.5,.68);
    for(let k=0;k<25;k++){const a=k/24*Math.PI;const b=box(.64,1.2,1.45,M.edge,arch,Math.cos(a)*9,10.5+Math.sin(a)*9,0);b.rotation.z=a-Math.PI/2;}
    const celestial=new THREE.Group();celestial.position.set(0,11,-6);scene.add(celestial);
    const r1=ring(5.5,.045,M.gold,celestial),r2=ring(4.9,.035,M.glow,celestial);r2.rotation.y=.6;
    for(let k=0;k<32;k++){const a=k/32*TAU;const b=box(.06,k%4===0?.45:.2,.06,M.amber,celestial,Math.sin(a)*5.5,Math.cos(a)*5.5,0);b.rotation.z=-a;}
    const sun=add(new THREE.IcosahedronGeometry(1.1,1),M.amber,celestial);const cage=add(new THREE.IcosahedronGeometry(1.55,0),new THREE.MeshBasicMaterial({color:0xd8c493,wireframe:true,transparent:true,opacity:.35}),celestial);
    animateables.push({g:celestial,type:'celestial',r2,sun,cage});
    // Concentric courtyard, seating, and an entrance threshold.
    const center=ring(4,.1,M.gold,architecture,0,.07,0);center.rotation.x=Math.PI/2;
    for(let k=0;k<8;k++){const a=k/8*TAU;const b=box(.07,.018,1.7,M.gold,architecture,Math.sin(a)*5.3,.04,Math.cos(a)*5.3);b.rotation.y=a;}
    for(const x of [-10,10]){box(1.2,.8,3.2,M.dark,architecture,x,.4,4);box(1.4,.15,3.5,M.ivory,architecture,x,.88,4);}
    for(const i of Core.ISLANDS){
      const g=island(i.x,i.z,i.r);bridge(i);
      const localGlow=material(i.color,.25,.2,i.color,2.0);const ornamental=new THREE.Group();ornamental.position.set(i.x,0,i.z);scene.add(ornamental);
      const platform=ring(3.15,.065,M.gold,g,0,.07,0);platform.rotation.x=Math.PI/2;
      for(const radius of [2.7,3]){const rr=ring(radius,.025,localGlow,ornamental,0,.06,0);rr.rotation.x=Math.PI/2;}
      cylinder(1.5,1.9,.5,M.dark,g,0,.25,0,16);cylinder(1.3,1.5,.15,M.gold,g,0,.57,0,16);
      for(let k=0;k<5;k++){const a=k/5*TAU;const b=box(.1,.05,.35,M.gold,g,Math.sin(a)*3.6,.06,Math.cos(a)*3.6);b.rotation.y=a;}
      const node={...i,g:ornamental,mat:localGlow,active:false,parts:[],label:null};
      if(i.id==='origin'){
        const crystal=add(new THREE.OctahedronGeometry(1.2,0),localGlow,ornamental,0,3.8,0);crystal.scale.y=2;node.core=crystal;
        for(let k=0;k<5;k++){const a=k/5*TAU;const cr=add(new THREE.OctahedronGeometry(.3),M.ivory,ornamental,Math.sin(a)*2,2+Math.cos(a)*.5,Math.cos(a)*2);cr.scale.y=2;node.parts.push(cr);rod([0,.7,0],[Math.sin(a)*1.8,2,Math.cos(a)*1.8],.05,M.gold,g);}
      }else if(i.id==='armory'){
        const sword=new THREE.Group();sword.position.y=3.5;sword.rotation.z=.35;ornamental.add(sword);blade(sword,2.8);node.core=sword;
        for(const tilt of [-.65,.65]){const r=ring(2.8,.06,M.gold,ornamental,0,3.6,0);r.rotation.set(Math.PI/2,tilt,0);node.parts.push(r);}
      }else if(i.id==='campaign'){
        const core=add(new THREE.IcosahedronGeometry(1.05,0),localGlow,ornamental,0,3.5,0);node.core=core;
        for(let k=0;k<3;k++){const rr=ring(2.6+k*.12,.055,M.gold,ornamental,0,3.5,0);rr.rotation.set(k*.7,k*1.1,.4);node.parts.push(rr);}
        for(let k=0;k<6;k++){const a=k/6*TAU;add(new THREE.OctahedronGeometry(.22),localGlow,ornamental,Math.sin(a)*2.7,3.5,Math.cos(a)*2.7);}
      }else if(i.id==='quests'){
        const globe=add(new THREE.IcosahedronGeometry(1.7,2),new THREE.MeshBasicMaterial({color:i.color,wireframe:true,transparent:true,opacity:.45}),ornamental,0,3.7,0);node.core=globe;
        const rr=ring(2.5,.09,M.gold,ornamental,0,3.7,0);rr.rotation.z=.6;node.parts.push(rr);const rr2=ring(2.5,.045,localGlow,ornamental,0,3.7,0);rr2.rotation.x=Math.PI/2;node.parts.push(rr2);
      }else{
        const portal=new THREE.Group();portal.position.set(0,6,-3);ornamental.add(portal);node.core=portal;
        ring(5.5,.45,M.stone,portal);ring(5.05,.08,M.gold,portal);ring(5.75,.075,localGlow,portal);
        for(let k=0;k<20;k++){const a=k/20*TAU;const b=box(.35,.85,.65,M.gold,portal,Math.sin(a)*5.5,Math.cos(a)*5.5,.4);b.rotation.z=-a;}
        const portalMat=new THREE.ShaderMaterial({uniforms:{time:{value:0},tint:{value:color(i.color)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float wave=sin(r*34.-time*1.8+sin(a*5.+time)*.8);float rim=pow(r,4.)*.8;float star=pow(max(0.,1.-r),12.);vec3 c=mix(vec3(.018,.055,.075),tint*.45,rim)+tint*(wave*.025+star*.3);gl_FragColor=vec4(c,(1.-smoothstep(.93,1.,r))*.94);}',transparent:true,side:THREE.DoubleSide,depthWrite:false});
        add(new THREE.CircleGeometry(4.98,64),portalMat,portal,0,0,.05);node.portalMat=portalMat;
        for(const x of [-6.5,6.5])column(g,x,-3,7);
      }
      if(i.id!=='gate'){
        const facing=Math.atan2(-i.x,-i.z);
        for(const offset of [-1.1,1.1]){const a=facing+Math.PI+offset;column(g,Math.sin(a)*(i.r-2),Math.cos(a)*(i.r-2),5.5);}
        // A planted crescent softens the hard-surface architecture.
        for(let k=0;k<14;k++){const a=facing+Math.PI+(random()-.5)*1.7,r=i.r-1.2;const rock=add(new THREE.DodecahedronGeometry(.25+random()*.35,0),M.moss,g,Math.sin(a)*r,.12,Math.cos(a)*r);rock.scale.y=.4;}
      }
      const halo=ring(2.2,.026,localGlow,ornamental,0,4,0);halo.rotation.x=.7;node.halo=halo;
      const light=new THREE.PointLight(i.color,.65,11,2);light.position.set(i.x,4,i.z);scene.add(light);node.light=light;
      shrines.push(node);
    }
    function blade(parent,scale=1){
      const shape=new THREE.Shape();shape.moveTo(-.1,0);shape.lineTo(-.14,1.55);shape.lineTo(0,1.95);shape.lineTo(.14,1.55);shape.lineTo(.1,0);shape.closePath();
      const g=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,steps:1});
      const b=add(g,M.ivory,parent,0,.12,0);b.scale.setScalar(scale);
      const edge=box(.032,1.65,.075,M.glow,parent,0,.96*scale,.055);edge.scale.set(scale,scale,scale);
      box(.7*scale,.1*scale,.17*scale,M.gold,parent,0,.08,0);cylinder(.055*scale,.06*scale,.4*scale,M.black,parent,0,-.2*scale,0,8);add(new THREE.OctahedronGeometry(.11*scale),M.gold,parent,0,-.47*scale,0);
    }
    function traveler(){
      const g=new THREE.Group(),body=new THREE.Group();g.add(body);scene.add(g);
      const torsoProfile=[[.24,0],[.37,.1],[.4,.25],[.46,.5],[.39,.74],[.26,.87]].map(([x,y])=>new THREE.Vector2(x,y));
      add(new THREE.LatheGeometry(torsoProfile,20),M.dark,body,0,1.03,0);
      const breast=add(new THREE.SphereGeometry(.43,20,14),M.ivory,body,0,1.51,.13);breast.scale.set(1,1.1,.64);
      const plate=add(new THREE.OctahedronGeometry(.22),M.gold,body,0,1.58,.41);plate.scale.set(.8,1,.3);
      add(new THREE.OctahedronGeometry(.075),M.glow,body,0,1.62,.49);
      for(const x of [-.24,.24])rod([x,1.25,.3],[x*.6,1.81,.33],.025,M.gold,body);
      cylinder(.38,.4,.12,M.gold,body,0,1.05,0,16);
      const head=new THREE.Group();head.position.y=2.02;body.add(head);
      const helmet=add(new THREE.SphereGeometry(.29,24,18),M.ivory,head);helmet.scale.set(1,1.15,1);
      const visor=add(new THREE.SphereGeometry(.295,20,8,0,Math.PI,Math.PI*.38,Math.PI*.24),M.black,head);visor.rotation.y=-Math.PI/2;
      box(.31,.035,.038,M.glow,head,0,.04,.286);
      const crest=add(new THREE.ConeGeometry(.095,.5,4),M.gold,head,0,.39,-.06);crest.rotation.x=-.2;
      for(const x of [-.29,.29]){const guard=add(new THREE.OctahedronGeometry(.16),M.gold,head,x,-.07,0);guard.scale.set(.4,1.2,.7);}
      const arms=[],legs=[],elbows=[],knees=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();arm.position.set(side*.51,1.75,0);body.add(arm);
        const shoulder=add(new THREE.SphereGeometry(.29,16,10,0,TAU,0,Math.PI*.62),M.ivory,arm,side*.02,.03,0);shoulder.rotation.z=-side*.18;
        const rim=ring(.255,.025,M.gold,arm,0,-.03,0);rim.rotation.x=Math.PI/2;
        cylinder(.1,.12,.45,M.black,arm,0,-.29,0,12);
        const elbow=new THREE.Group();elbow.position.set(0,-.48,0);arm.add(elbow);elbows.push(elbow);
        add(new THREE.CylinderGeometry(.14,.11,.43,12),M.ivory,elbow,0,-.16,.015);
        cylinder(.15,.15,.08,M.gold,elbow,0,-.03,.015,12);add(new THREE.SphereGeometry(.12,12,8),M.black,elbow,0,-.42,.025);arms.push(arm);
        const leg=new THREE.Group();leg.position.set(side*.21,1.03,0);body.add(leg);
        cylinder(.145,.17,.51,M.dark,leg,0,-.25,0,12);
        const thigh=box(.25,.4,.1,M.ivory,leg,0,-.26,.135);thigh.rotation.x=-.08;
        add(new THREE.OctahedronGeometry(.16),M.gold,leg,0,-.5,.11);
        const knee=new THREE.Group();knee.position.y=-.5;leg.add(knee);knees.push(knee);
        cylinder(.12,.15,.43,M.ivory,knee,0,-.23,.015,12);box(.26,.17,.42,M.black,knee,0,-.44,.07);box(.27,.05,.38,M.gold,knee,0,-.5,.05);legs.push(leg);
      }
      // The grip pivot sits in the palm; the blade stays attached through every pose.
      const sword=new THREE.Group();sword.position.set(0,1.4,.42);body.add(sword);sword.rotation.set(.62,0,0);
      const heldBlade=new THREE.Group();heldBlade.position.y=.2;sword.add(heldBlade);blade(heldBlade,.95);cylinder(.065,.065,.62,M.black,sword,0,-.13,0,12);cylinder(.09,.09,.045,M.gold,sword,0,-.39,0,12);
      const clothGeo=new THREE.PlaneGeometry(.94,1.55,8,14);clothGeo.translate(0,-.775,0);
      const cape=add(clothGeo,M.cloth,body,0,1.87,-.31);const clothBase=clothGeo.attributes.position.array.slice();
      for(const x of [-.34,.34])add(new THREE.SphereGeometry(.07,10,8),M.gold,body,x,1.88,-.26);
      const companion=new THREE.Group();scene.add(companion);const orb=add(new THREE.IcosahedronGeometry(.18,1),M.glow,companion);const cr=ring(.36,.028,M.gold,companion);cr.rotation.x=1;
      const shadow=add(new THREE.CircleGeometry(.68,32),new THREE.MeshBasicMaterial({color:0x081c27,transparent:true,opacity:.26,depthWrite:false}),scene);shadow.rotation.x=-Math.PI/2;
      // Suit colors are private to the traveler; the sanctuary materials never change.
      const suitMaterials=[];
      for(const [original,target]of [[M.ivory,0xb82b29],[M.dark,0x6e1720],[M.gold,0xe5b75d]]){const mat=original.clone();suitMaterials.push({mat,base:mat.color.clone(),flight:color(target)});g.traverse(o=>{if(o.isMesh&&o.material===original)o.material=mat;});}
      helmet.material=helmet.material.clone();suitMaterials.push({mat:helmet.material,base:helmet.material.color.clone(),flight:color(0xe1b971)});
      const pack=new THREE.Group();pack.position.set(0,1.43,-.53);body.add(pack);
      box(.6,.88,.3,M.dark,pack);box(.4,.55,.035,M.gold,pack,0,.08,-.17);
      const jetMat=new THREE.MeshBasicMaterial({color:color(0x8ce9ff),transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false});
      const jets=[],pods=[];
      function thruster(parent,x,y,z,size=1){const mount=new THREE.Group();mount.position.set(x,y,z);parent.add(mount);cylinder(.14*size,.18*size,.18*size,M.gold,mount,0,.03,0,16);cylinder(.1*size,.13*size,.035,M.black,mount,0,-.07,0,16);const flame=add(new THREE.ConeGeometry(.15*size,1.6*size,16,1,true),jetMat,mount,0,-.84*size,0);flame.rotation.z=Math.PI;flame.castShadow=false;flame.receiveShadow=false;const inner=add(new THREE.ConeGeometry(.07*size,1.05*size,12,1,true),jetMat,mount,0,-.55*size,0);inner.rotation.z=Math.PI;inner.castShadow=false;inner.receiveShadow=false;jets.push({mount,flame,inner,size});}
      for(const side of [-1,1]){const pod=new THREE.Group();pod.position.set(side*.39,0,-.06);pack.add(pod);pods.push(pod);cylinder(.2,.24,.9,M.ivory,pod,0,0,0,16);cylinder(.215,.215,.1,M.gold,pod,0,.27,0,16);box(.09,.46,.045,M.glow,pod,0,.05,-.21);thruster(pod,0,-.54,0);thruster(knees[side<0?0:1],0,-.55,0,.55);}
      const reactorMaterial=material(0x98e9fa,.2,.3,0x6de2ff,1.3);
      const reactor=add(new THREE.CircleGeometry(.12,32),reactorMaterial,body,0,1.57,.465);ring(.15,.024,M.gold,body,0,1.57,.46);
      const palms=[];for(let i=0;i<2;i++){const palm=new THREE.Group();palm.position.set(0,-.42,.055);elbows[i].add(palm);const disk=add(new THREE.CircleGeometry(.07,16),reactorMaterial,palm);disk.rotation.x=-Math.PI/2;palms.push(palm);}
      function aimFlight(target,firing){
        sword.visible=false;arms[0].rotation.set(.18,0,.16);elbows[0].rotation.set(-.1,0,0);arms[1].rotation.set(.18,0,-.16);elbows[1].rotation.set(-.1,0,0);
        if(firing){body.updateWorldMatrix(true,false);const local=body.worldToLocal(target.clone()).sub(arms[1].position).normalize();arms[1].quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),local);elbows[1].rotation.set(0,0,0);}
      }
      const down=new THREE.Vector3(0,-1,0),forearmAxis=new THREE.Vector3(0,-.42,.025).normalize();
      function holdSword(pose){
        sword.position.set(pose[0],pose[1],pose[2]);sword.rotation.set(pose[3],pose[4],pose[5]);sword.updateMatrix();
        for(let i=0;i<2;i++){
          const target=new THREE.Vector3(0,i===1?0:-.24,0).applyMatrix4(sword.matrix),shoulder=arms[i].position.clone(),delta=target.clone().sub(shoulder),distance=Math.max(.061,Math.min(.899,delta.length())),dir=delta.normalize(),upper=.48,lower=Math.hypot(.42,.025);
          const along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));
          const bend=new THREE.Vector3(i===0?-1:1,-.65,-.1);bend.addScaledVector(dir,-bend.dot(dir)).normalize();
          const joint=shoulder.clone().addScaledVector(dir,along).addScaledVector(bend,height);
          arms[i].quaternion.setFromUnitVectors(down,joint.clone().sub(shoulder).normalize());
          const lowerQ=new THREE.Quaternion().setFromUnitVectors(forearmAxis,target.clone().sub(joint).normalize());
          elbows[i].quaternion.copy(arms[i].quaternion).invert().multiply(lowerQ);
        }
      }
      function flightSuit(blend,t){for(const m of suitMaterials)m.mat.color.copy(m.base).lerp(m.flight,blend);cape.scale.y=1-blend*.84;reactorMaterial.emissiveIntensity=1.3+blend*1.2;pods.forEach((pod,i)=>pod.rotation.z=(i?1:-1)*blend*.18);for(const j of jets){j.flame.visible=j.inner.visible=blend>.02;const flicker=.92+Math.sin(t*47+j.size)*.08;j.flame.scale.set(1,blend*flicker,1);j.flame.position.y=-.04*j.size-.8*j.size*blend*flicker;j.inner.scale.set(1,blend*(1.05-flicker*.15),1);j.inner.position.y=-.025*j.size-.525*j.size*blend*(1.05-flicker*.15);}}
      holdSword([0,1.4,.42,.62,0,0]);flightSuit(0,0);
      return {g,body,head,arms,legs,elbows,knees,sword,cape,clothBase,companion,shadow,holdSword,flightSuit,aimFlight,palms,jets,pack,suitMaterials};

    }
    function sentinel(boss=false){
      const size=boss?1.85:1,g=new THREE.Group(),body=new THREE.Group();g.scale.setScalar(size);g.add(body);scene.add(g);
      const iron=material(0x29303a,.46,.7),edge=material(0x727b81,.4,.7),brass=material(0x987045,.48,.6),cloth=material(0x531d28,.92),coreMat=material(0xff6942,.4,.3,0xff3519,1.6);
      const armor=[],arms=[],legs=[],knees=[];
      // Heavy boots, jointed legs, a plated torso, and a face give enemies a readable silhouette.
      for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.28,1.15,0);body.add(leg);legs.push(leg);cylinder(.19,.22,.56,iron,leg,0,-.27,0,12);const shin=new THREE.Group();shin.position.y=-.55;leg.add(shin);knees.push(shin);const plate=box(.32,.45,.2,edge,shin,0,-.22,.07);armor.push(plate);box(.4,.2,.55,iron,shin,0,-.48,.12);add(new THREE.OctahedronGeometry(.19),brass,leg,0,-.53,.19);}
      const torso=add(new THREE.LatheGeometry([[.3,0],[.46,.15],[.57,.68],[.43,.96],[.27,1.06]].map(([x,y])=>new THREE.Vector2(x,y)),12),iron,body,0,1.08,0);armor.push(torso);
      const breast=box(.72,.54,.2,edge,body,0,1.77,.37);breast.rotation.x=-.12;const core=add(new THREE.OctahedronGeometry(.16),coreMat,body,0,1.83,.51);core.scale.set(.7,1,.35);
      cylinder(.43,.45,.16,brass,body,0,1.15,0,12);const skirt=add(new THREE.CylinderGeometry(.43,.59,.45,8,1,true),cloth,body,0,1.02,0);armor.push(skirt);
      const head=new THREE.Group();head.position.y=2.4;body.add(head);const helmet=add(new THREE.SphereGeometry(.33,12,10),iron,head);helmet.scale.set(1,1.2,1);
      box(.49,.11,.09,M.black,head,0,.025,.29);for(const x of [-.13,.13])box(.11,.035,.035,coreMat,head,x,.035,.347);
      const nose=box(.055,.31,.09,edge,head,0,-.04,.34);const jaw=add(new THREE.ConeGeometry(.22,.27,4),brass,head,0,-.26,.12);jaw.rotation.z=Math.PI;
      for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.66,2.03,0);body.add(arm);arms.push(arm);const shoulder=add(new THREE.DodecahedronGeometry(.35,0),edge,arm,side*.03,0,0);shoulder.scale.set(1.1,.8,1.1);armor.push(shoulder);for(let n=0;n<(boss?3:1);n++){const spike=add(new THREE.ConeGeometry(.085,.4+n*.08,5),brass,arm,side*(.08+n*.1),.35,0);spike.rotation.z=-side*.4;}cylinder(.15,.18,.48,iron,arm,0,-.34,0,10);cylinder(.21,.17,.43,edge,arm,0,-.7,.04,10);add(new THREE.SphereGeometry(.15,10,8),M.black,arm,0,-.93,.07);}
      const weapon=new THREE.Group();weapon.position.set(0,-.93,.07);weapon.rotation.x=.2;arms[1].add(weapon);cylinder(.06,.06,boss?2.8:2.1,brass,weapon,0,.45,0,10);const axe=add(new THREE.CylinderGeometry(.54,.54,.13,5,1,false,0,Math.PI),edge,weapon,0,boss?1.65:1.28,0,10);axe.rotation.x=Math.PI/2;axe.rotation.z=-Math.PI/2;box(.055,.75,.17,coreMat,weapon,.12,boss?1.62:1.25,.1);
      const shield=new THREE.Group();shield.position.set(0,-.65,.27);arms[0].add(shield);const shieldFace=add(new THREE.CylinderGeometry(.51,.45,.14,6),iron,shield);shieldFace.rotation.x=Math.PI/2;const rim=ring(.45,.045,brass,shield);rim.scale.y=1.2;add(new THREE.OctahedronGeometry(.18),coreMat,shield,0,0,.13);shield.scale.y=1.3;
      const cape=add(new THREE.PlaneGeometry(.98,1.65,4,6),cloth,body,0,1.22,-.4);cape.material.side=THREE.DoubleSide;cape.rotation.x=-.12;
      if(boss){for(const side of [-1,1]){const horn=add(new THREE.ConeGeometry(.14,.85,6),brass,head,side*.28,.53,0);horn.rotation.z=-side*.4;}const crown=ring(.38,.055,brass,head,0,.33,0);crown.rotation.x=Math.PI/2;for(let n=0;n<5;n++)add(new THREE.ConeGeometry(.055,.32,4),brass,head,(n-2)*.13,.48,.13);}
      const warning=add(new THREE.RingGeometry(.93,1,64),new THREE.MeshBasicMaterial({color:0xff896a,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),scene);warning.rotation.x=-Math.PI/2;
      return {g,body,head,core,coreMat,armor,arms,legs,knees,weapon,shield,cape,warning,baseY:0,targetY:1.83*size,size};
    }
    // Layered islands in the distance create scale without runtime physics.
    for(let k=0;k<(low?14:24);k++){
      const a=k/24*TAU,r=110+random()*170,x=Math.sin(a)*r,z=Math.cos(a)*r,y=-16+random()*65;
      const mass=add(new THREE.ConeGeometry(5+random()*13,15+random()*22,7,1),M.rock,architecture,x,y,z);mass.rotation.z=Math.PI;mass.rotation.y=random()*TAU;
      cylinder(4,5,.8,M.edge,architecture,x,y+8,z,12);
      if(k%3===0){const ruin=new THREE.Group();ruin.position.y=y+8.4;architecture.add(ruin);column(ruin,x,z,8);}
    }
    const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec3 vWorld;void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec3 vWorld;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec3 d=normalize(vWorld);float h=max(d.y,0.);vec3 c=mix(vec3(.27,.43,.49),vec3(.023,.067,.12),pow(h,.45));vec3 sunDir=normalize(vec3(-.55,.24,-.7));float sun=max(dot(d,sunDir),0.);c+=vec3(.8,.57,.27)*pow(sun,45.)*.55+c*pow(sun,5.)*.2;vec2 p=d.xz/(abs(d.y)+.2)*1.3+vec2(time*.004,0.);float n=noise(p)*.55+noise(p*2.1)*.3+noise(p*4.3)*.15;c=mix(c,vec3(.57,.65,.65),smoothstep(.47,.8,n)*(1.-smoothstep(.0,.5,d.y))*.55);float star=step(.9988,hash(floor(d.xz/(abs(d.y)+.5)*800.)))*smoothstep(.15,.5,d.y);c+=vec3(star*.5);gl_FragColor=vec4(c,1.);}`});
    const sky=add(new THREE.SphereGeometry(450,32,16),skyMat,scene);sky.castShadow=false;sky.receiveShadow=false;sky.renderOrder=-10;
    const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float time;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}void main(){vec2 p=vUv*20.+time*.004;float v=n(p)*.5+n(p*2.3)*.3+n(p*5.)*.2;float a=smoothstep(.22,.72,v)*.6;gl_FragColor=vec4(mix(vec3(.18,.35,.41),vec3(.53,.65,.66),v),a);}`});
    for(let k=0;k<3;k++){const c=add(new THREE.PlaneGeometry(700,700),cloudMat,scene,0,-16-k*5,0);c.rotation.x=-Math.PI/2;c.rotation.z=k*.7;c.castShadow=false;c.receiveShadow=false;clouds.push(c);}
    // Merge static architecture by material to keep draw calls bounded.
    if(THREE.BufferGeometryUtils){
      architecture.updateMatrixWorld(true);const batches=new Map();
      architecture.traverse(obj=>{if(!obj.isMesh)return;const key=obj.material.uuid;if(!batches.has(key))batches.set(key,{material:obj.material,geometries:[]});let geo=obj.geometry.clone();if(geo.index)geo=geo.toNonIndexed();geo.applyMatrix4(obj.matrixWorld);batches.get(key).geometries.push(geo);});
      for(const batch of batches.values()){const geo=THREE.BufferGeometryUtils.mergeBufferGeometries(batch.geometries);if(geo){const merged=new THREE.Mesh(geo,batch.material);merged.castShadow=true;merged.receiveShadow=true;scene.add(merged);}for(const g of batch.geometries)g.dispose();}
      scene.remove(architecture);
    }
    function animate(t,camera){
      sky.position.copy(camera.position);skyMat.uniforms.time.value=t;cloudMat.uniforms.time.value=t;
      celestial.rotation.z=t*.028;r2.rotation.y=.6+Math.sin(t*.15)*.3;sun.rotation.set(t*.14,t*.2,0);cage.rotation.set(-t*.12,t*.1,0);
      for(const node of shrines){
        if(node.id!=='gate'){node.core.rotation.y=t*.25;node.core.position.y=(node.id==='quests'?3.7:node.id==='origin'?3.8:3.5)+Math.sin(t*1.3+node.x)*.18;}
        node.halo.rotation.y=t*.15;node.halo.rotation.z=t*.12;
        node.parts.forEach((part,k)=>{if(part.geometry.type==='TorusGeometry'){if(!part.userData.rest)part.userData.rest=part.rotation.clone();part.rotation.x=part.userData.rest.x+t*.12;part.rotation.y=part.userData.rest.y+t*.06;}else part.rotation.y=t*.3+k;});
        if(node.portalMat)node.portalMat.uniforms.time.value=t;
        node.mat.emissiveIntensity=node.active?2.8:1.7+Math.sin(t*1.5+node.x)*.2;
      }
    }
    return {M,shrines,traveler,sentinel,animate,architecture,sky,clouds,colliders};
  }
  return {build};
});
