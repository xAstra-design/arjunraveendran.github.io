(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArchiveMotion=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>t*t*(3-2*t);
  // Shoulder XYZ, elbow X, wrist X/Z, torso yaw. All rotations are in radians.
  const rest=[-.28,0,-.14,-.32,1.25,.05,0];
  const strikes=[
    [[-.85,1.2,-.65,-.7,2.5,-.2,.4],[-1.25,-1.15,.25,-.12,2.8,.1,-.65]],
    [[-1.3,-1.2,.2,-.55,2.8,.2,-.5],[-.95,1.3,-.65,-.1,2.5,-.15,.6]],
    [[-2.65,.05,-.22,-.75,2.95,0,.12],[-.65,-.2,-.2,-.05,3.1,0,-.12]]
  ];
  function strike(combo,progress){const p=clamp(progress,0,1),[wind,finish]=strikes[combo%3];let a,b,t;if(p<.27){a=rest;b=wind;t=smooth(p/.27);}else if(p<.61){a=wind;b=finish;t=smooth((p-.27)/.34);}else{a=finish;b=rest;t=smooth((p-.61)/.39);}return a.map((v,i)=>v+(b[i]-v)*t);}
  const weaponRest=[0,1.4,.42,.62,0,0];
  const weaponStrikes=[
    [[.1,1.7,.32,.35,.8,-1.05],[-.08,1.43,.43,1.9,-.85,.72]],
    [[-.1,1.7,.32,.65,-.85,.95],[.08,1.43,.43,1.85,.9,-.7]],
    [[0,2.02,.28,-.7,0,0],[0,1.35,.43,2.35,0,0]]
  ];
  function weapon(combo,progress){const p=clamp(progress,0,1),[wind,finish]=weaponStrikes[combo%3];let a,b,t;if(p<.27){a=weaponRest;b=wind;t=smooth(p/.27);}else if(p<.61){a=wind;b=finish;t=smooth((p-.27)/.34);}else{a=finish;b=weaponRest;t=smooth((p-.61)/.39);}return a.map((v,i)=>v+(b[i]-v)*t);}
  return {rest,strike,weaponRest,weapon};
});
