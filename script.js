(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const data = window.PORTFOLIO;
  // Résumé details preserved from the original portfolio.
  $('#skills-list').innerHTML = data.skills.map(skill => `<div class="skill-group"><h3>${escape(skill.h)}</h3><p>${skill.tags.map(escape).join(' · ')}</p></div>`).join('');
  const clock = () => { $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Vancouver', hour: '2-digit', minute: '2-digit' }).format(new Date()); };
  clock(); setInterval(clock, 60000);
  $('#year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('js-motion');
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => reveals.observe(element));
  }
  let scrollPending = false;
  function updateProgress() {
    $('.scroll-progress').style.transform = `scaleX(${window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
    scrollPending = false;
  }
  window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();

  const dialog = $('#project-dialog');
  let trigger = null;
  const renderTags = tags => `<div class="tags">${tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>`;
  const renderBullets = bullets => `<ul>${bullets.map(bullet => `<li>${escape(bullet)}</li>`).join('')}</ul>`;
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = data.nodes.find(node => node.id === button.dataset.project);
    if (!project) return;
    const panel = project.panel;
    let html = `<h2 id="dialog-title">${escape(panel.title)}</h2><p class="dialog-sub">${escape(panel.sub)}</p>`;
    if (panel.stats) html += `<div class="dialog-stats">${panel.stats.map(([value,label]) => `<div><strong>${escape(value)}</strong><small>${escape(label)}</small></div>`).join('')}</div>`;
    if (panel.bullets) html += renderBullets(panel.bullets);
    if (Array.isArray(panel.sections)) panel.sections.forEach(section => {
      if (section.h) html += `<h4>${escape(section.h)}</h4>`;
      if (section.ss) html += `<p class="dialog-sub">${escape(section.ss)}</p>`;
      if (section.p) html += `<p>${escape(section.p.replace('— the same genre you are playing right now.', 'with combo combat and enemy AI.'))}</p>`;
      if (section.bullets) html += renderBullets(section.bullets);
      if (section.tags) html += renderTags(section.tags);
    });
    if (panel.tags) html += renderTags(panel.tags);
    $('#dialog-body').innerHTML = html;
    trigger = button; dialog.showModal(); document.body.classList.add('modal-open');
    dialog.scrollTop = 0; $('#close-dialog').focus();
  }));
  $('#close-dialog').addEventListener('click', () => dialog.close());
  $('#dialog-done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); trigger?.focus(); });
  $('#copy-email').addEventListener('click', async () => {
    const button = $('#copy-email');
    try {
      await navigator.clipboard.writeText(data.email);
      button.innerHTML = 'Copied <span aria-hidden="true">✓</span>';
      $('#announcement').textContent = 'Email address copied.';
      setTimeout(() => { button.innerHTML = 'Copy email <span aria-hidden="true">⧉</span>'; }, 2500);
    } catch {
      button.textContent = 'Select the email to copy';
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents($('.contact-bottom > a'));
      selection.removeAllRanges(); selection.addRange(range);
      $('#announcement').textContent = 'Email selected. Use your device’s copy command.';
    }
  });

  // The first viewport is now the game world. Atmospheric motion is isolated
  // from content and stops offscreen, in background tabs, and on user request.
  const hero = $('.world-hero'), art = $('.world-art'), canvas = $('#world-motes');
  const ctx = canvas.getContext('2d');
  let paused = reducedMotion.matches, visible = true, frame = 0, last = 0, w = 0, h = 0;
  let pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
  const motes = Array.from({length:42}, (_,i) => ({ x:(i*0.618)%1, y:(i*0.382)%1, r:.4+(i%5)*.3, speed:.002+(i%4)*.001, phase:i*1.7 }));
  function request() { if(!frame && visible && !document.hidden && ctx) frame=requestAnimationFrame(draw); }
  function draw(t) {
    frame=0; const dt=last?Math.min((t-last)/1000,.05):0; last=t;
    ctx.clearRect(0,0,w,h);
    if(!paused) { driftX+=(pointerX-driftX)*.025; driftY+=(pointerY-driftY)*.025; art.style.transform=`scale(1.04) translate(${driftX}px, ${driftY}px)`; }
    for(const m of motes) {
      if(!paused) {m.y-=dt*m.speed; if(m.y<0)m.y=1;}
      const opacity=.12+(Math.sin(t*.0005+m.phase)+1)*.18;
      ctx.fillStyle=`rgba(236,205,144,${opacity})`;
      ctx.beginPath();ctx.arc(m.x*w+Math.sin(t*.0001+m.phase)*14,m.y*h,m.r,0,Math.PI*2);ctx.fill();
    }
    if(!paused)request();
  }
  function motionLabel() { $('#ambient-toggle').innerHTML=`<span aria-hidden="true">${paused?'▷':'Ⅱ'}</span> MOTION ${paused?'OFF':'ON'}`; $('#ambient-toggle').setAttribute('aria-pressed',String(paused)); $('#ambient-toggle').setAttribute('aria-label',paused?'Play atmospheric animation':'Pause atmospheric animation'); }
  $('#ambient-toggle').addEventListener('click',()=>{paused=!paused;motionLabel();request();});
  hero.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=hero.getBoundingClientRect();pointerX=-(e.clientX-r.left-r.width/2)*.012;pointerY=-(e.clientY-r.top-r.height/2)*.01;});
  hero.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  if(ctx){new ResizeObserver(()=>{const r=hero.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);request();}).observe(hero);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request();}else{cancelAnimationFrame(frame);frame=0;}}).observe(hero);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;request();}});
  reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;motionLabel();request();});
  motionLabel();
})();
