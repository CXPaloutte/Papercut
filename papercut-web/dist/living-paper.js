(function () {
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const hero=$('.hero'), dragon=$('[data-paper-scene="dragon"]'), mu=$('[data-paper-scene="mu"]');
  const SVG='http://www.w3.org/2000/svg';
  let globallyPaused=document.documentElement.classList.contains('paper-paused');

  function announce(message){$('#paper-interaction-status').textContent=message;}
  function keyActivate(node,action){node.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();action();}
  });}
  function restartClass(node,name){node.classList.remove(name);void node.getBoundingClientRect();node.classList.add(name);}

  // Three exact source selections meet at rest and hinge like cut-paper petals.
  $$('.lotus-motion').forEach((node,index)=>{
    const original=node.querySelector('image'),defs=document.createElementNS(SVG,'defs');
    const pieces=[['left','0,0 110,105 105,230 0,230'],['right','110,105 205,0 205,230 105,230'],['top','0,0 205,0 110,105']];
    pieces.forEach(([side,points])=>{
      const clip=document.createElementNS(SVG,'clipPath');clip.id='lotus-'+index+'-'+side;clip.setAttribute('clipPathUnits','userSpaceOnUse');
      const polygon=document.createElementNS(SVG,'polygon');polygon.setAttribute('points',points);clip.append(polygon);defs.append(clip);
      const hinge=document.createElementNS(SVG,'g');hinge.setAttribute('class','lotus-petal lotus-petal-'+side);
      const selection=document.createElementNS(SVG,'g');selection.setAttribute('clip-path','url(#'+clip.id+')');selection.append(original.cloneNode());hinge.append(selection);node.append(hinge);
    });
    node.prepend(defs);original.remove();
  });
  function layoutDetails(){
    const mobile=innerWidth<=650;
    const placements=mobile?{
      '.lotus-placement-left':'translate(18 780) scale(.83)',
      '.lotus-placement-right':'translate(805 930) scale(.76)',
      '.source-water-left':'translate(-110 1020) scale(.9)',
      '.source-water-right':'translate(565 1145) scale(.82)'
    }:{
      '.lotus-placement-left':'translate(50 590) rotate(-12 100 260) scale(1.08)',
      '.lotus-placement-right':'translate(1320 640) rotate(12 100 260)',
      '.source-water-left':'translate(-45 770) rotate(-11 250 200)',
      '.source-water-right':'translate(1100 800) rotate(10 250 200)'
    };
    Object.entries(placements).forEach(([selector,transform])=>$(selector).setAttribute('transform',transform));
  }
  layoutDetails();addEventListener('resize',layoutDetails);

  function bloom(shouldAnnounce=true){
    if(shouldAnnounce)announce(reduced.matches?'已选中原作荷花，保持静态细观。':'荷花舒展，左右花瓣沿纸片接点轻轻打开。');
    if(reduced.matches)return;
    if(globallyPaused)resumeMotion();
    restartClass(hero,'blooming');
  }
  hero.addEventListener('animationend',event=>{
    if(event.animationName==='petal-right'){hero.classList.remove('blooming');}
  });
  $$('[data-hero-play]').forEach(node=>{
    const action=()=>{
      if(node.dataset.heroPlay==='lotus'){bloom();return;}
      if(reduced.matches){announce('减少动画模式：双鱼保持静态，可点击查看原作细节。');return;}
      if(globallyPaused)resumeMotion();
      dispatchEvent(new CustomEvent('paper-replay-hero'));bloom(false);
      announce('双鱼再次跃起，原作卷纹向两侧展开。');
    };
    node.addEventListener('click',action);if(node.tagName.toLowerCase()==='g')keyActivate(node,action);
  });
  addEventListener('paper-intro-started',()=>bloom(false));

  function setDragonHeight(value){
    value=Math.max(0,Math.min(100,+value));$('#dragon-height').value=value;
    $('#dragon-height-value').value=Math.round(value)+'%';
    dragon.style.setProperty('--dragon-altitude',(-value*2.6)+'px');
    dragon.dataset.height=String(Math.round(value));
  }
  function setFlagHeight(value){
    value=Math.max(0,Math.min(100,+value));$('#flag-height').value=value;
    $('#flag-height-value').value=Math.round(value)+'%';
    mu.style.setProperty('--flag-left',(-21+value*.145)+'deg');mu.style.setProperty('--flag-right',(21-value*.145)+'deg');
    mu.style.setProperty('--flag-y',(-value*.6)+'px');mu.dataset.height=String(Math.round(value));
  }
  setDragonHeight($('#dragon-height').value);setFlagHeight($('#flag-height').value);
  $('#dragon-height').addEventListener('input',event=>{
    dragon.classList.remove('is-playing');dragon.dataset.playing='false';setDragonHeight(event.target.value);
  });
  $('#flag-height').addEventListener('input',event=>{
    mu.classList.remove('is-playing');mu.dataset.playing='false';setFlagHeight(event.target.value);
  });

  function blink(shouldAnnounce=true){
    if(shouldAnnounce)announce(reduced.matches?'减少动画模式：保留穆桂英原作的眉眼形态。':'穆桂英向你眨了眨眼。');
    if(reduced.matches)return;
    if(globallyPaused)resumeMotion();
    restartClass(mu,'blinking');mu.dataset.blinking='true';
  }
  function playScene(name,userInitiated=true){
    const node=name==='dragon'?dragon:mu;
    if(userInitiated&&globallyPaused)resumeMotion();
    if(name==='dragon')setDragonHeight(55);else setFlagHeight(100);
    node.dataset.entered='true';
    if(reduced.matches){
      node.classList.remove('is-playing');node.dataset.playing='false';
      if(userInitiated)announce('减少动画模式：已切换至'+(name==='dragon'?'腾龙':'令旗升起')+'的静态构图。');
      return;
    }
    restartClass(node,'is-playing');node.dataset.playing='true';
    if(name==='mu')blink(false);
    if(userInitiated)announce(name==='dragon'?'纸龙沿弧线腾起。可拖动腾飞高度，再次改变构图。':'四面剪纸令旗前后错落，缓缓抬升。');
  }
  $$('[data-scene-play]').forEach(button=>button.addEventListener('click',()=>playScene(button.dataset.scenePlay)));
  $('#mu-blink').addEventListener('click',()=>blink());
  dragon.addEventListener('animationend',event=>{
    if(event.animationName==='dragon-takeoff'){dragon.classList.remove('is-playing');dragon.dataset.playing='false';}
  });
  mu.addEventListener('animationend',event=>{
    if(event.animationName==='flag-rise-right'&&event.target.classList.contains('flag-inner')){mu.classList.remove('is-playing');mu.dataset.playing='false';}
    if(event.animationName==='paper-blink'&&event.target.classList.contains('eye-right')){mu.classList.remove('blinking');mu.dataset.blinking='false';}
  });

  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    entry.target.classList.toggle('is-in-view',entry.isIntersecting);
    if(entry.isIntersecting&&!entry.target.dataset.entered&&!reduced.matches&&!globallyPaused)playScene(entry.target.dataset.paperScene,false);
  }),{threshold:.24});
  [dragon,mu].forEach(node=>observer.observe(node));

  const pattern=$('#pattern-art');
  function unfoldPattern(){
    if(reduced.matches){announce('当前纹样已完整展开。');return;}
    if(globallyPaused)resumeMotion();
    restartClass(pattern,'is-unfolding');announce('从一折到一朵，纹样在纸上展开。');
  }
  pattern.addEventListener('click',unfoldPattern);keyActivate(pattern,unfoldPattern);
  pattern.addEventListener('animationend',event=>{if(event.animationName==='pattern-unfold'){pattern.classList.remove('is-unfolding');}});
  $$('[data-pattern]').forEach(button=>button.addEventListener('click',unfoldPattern));

  const scroll=$('.scroll-art');
  function setScroll(value){
    value=Math.max(15,Math.min(100,+value));$('#scroll-unroll').value=value;$('#scroll-unroll-value').value=Math.round(value)+'%';
    scroll.style.setProperty('--unroll',value+'%');scroll.querySelector('.bottom-rod').style.bottom=(100-value)+'%';
  }
  $('#scroll-unroll').addEventListener('input',event=>{scroll.classList.remove('unrolling');setScroll(event.target.value);});
  $('#scroll-replay').addEventListener('click',()=>{
    setScroll(100);if(reduced.matches)return;if(globallyPaused)resumeMotion();restartClass(scroll,'unrolling');announce('中华盛世长卷徐徐展开，仍可点击查看完整原作。');
  });
  scroll.addEventListener('animationend',event=>{if(event.animationName==='scroll-unroll')scroll.classList.remove('unrolling');});

  const scissors=$('.scissors-art');
  function cutPaper(){
    if(reduced.matches){announce('纸花已展开，可进入工坊亲手试剪。');return;}
    if(globallyPaused)resumeMotion();restartClass(scissors,'is-cutting');announce('试剪纸花，再进工坊留下自己的第一剪。');
  }
  scissors.addEventListener('click',cutPaper);keyActivate(scissors,cutPaper);
  scissors.addEventListener('animationend',event=>{if(event.animationName==='scissors-cut'){scissors.classList.remove('is-cutting');}});

  function resumeMotion(){if(globallyPaused)$('#motion-toggle').click();}
  addEventListener('paper-motion-change',event=>{globallyPaused=event.detail.paused;});
  document.addEventListener('visibilitychange',()=>{
    document.documentElement.classList.toggle('paper-background',document.hidden);
  });
  reduced.addEventListener('change',()=>{
    if(!reduced.matches)return;
    [dragon,mu].forEach(node=>{node.classList.remove('is-playing','blinking');node.dataset.playing='false';node.dataset.blinking='false';});
    hero.classList.remove('blooming');scroll.classList.remove('unrolling');pattern.classList.remove('is-unfolding');scissors.classList.remove('is-cutting');
  });
})();
