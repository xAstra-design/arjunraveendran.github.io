/* Native scroll drives the opening; navigation and reduced-motion stay immediate. */
(()=>{'use strict';
  const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],sequence=$('.opening-sequence'),hero=$('.world-hero'),curtain=$('.chapter-reveal');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width:900px) and (min-height:720px)');let frame=0,motionOn=!reduced.matches;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=t=>t*t*(3-2*t);
  function update(){frame=0;const cinematic=motionOn&&desktop.matches;document.documentElement.classList.toggle('scroll-cinema',cinematic);const rect=sequence.getBoundingClientRect(),span=Math.max(1,sequence.offsetHeight-hero.offsetHeight),p=cinematic?clamp(-rect.top/span):clamp(-rect.top/Math.max(1,hero.offsetHeight));
    hero.style.setProperty('--world-zoom',motionOn?1+p*.32:1);hero.style.setProperty('--opening-copy',cinematic?1-ease(clamp(p/.48)):1);hero.style.setProperty('--copy-shift',cinematic?-p*90+'px':'0px');hero.style.setProperty('--orbit-turn',p*32+'deg');
    for(const region of all('.hero-copy,.hero-bottom,.portal-invitation,.hero-edition'))region.inert=cinematic&&p>.55;
    curtain.style.clipPath=cinematic?`circle(${ease(clamp((p-.27)/.69))*130}% at 70% 54%)`:'circle(0% at 70% 54%)';
    for(const visual of all('.work .project-visual')){const r=visual.getBoundingClientRect();const drift=motionOn&&desktop.matches?clamp((r.top-innerHeight*.5)/innerHeight,-1,1)*18:0;visual.style.setProperty('--visual-drift',drift+'px');}
    let current='work';for(const id of ['work','about','playground','contact'])if($('#'+id).getBoundingClientRect().top<innerHeight*.4)current=id;
    for(const a of all('.reading-nav>div>a')){if(a.hash==='#'+current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',()=>{motionOn=!reduced.matches;schedule();});desktop.addEventListener('change',schedule);
  $('#ambient-toggle').addEventListener('click',()=>{motionOn=$('#ambient-toggle').getAttribute('aria-pressed')!=='true';schedule();});
  // Use short, interruptible entrance animation; the native dialog handles focus and Escape.
  all('[data-project]').forEach(button=>button.addEventListener('click',()=>{const dialog=$('#project-dialog');if(!reduced.matches&&dialog.open&&dialog.animate)dialog.animate([{opacity:0,transform:'translateY(32px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});}));
  schedule();
})();
