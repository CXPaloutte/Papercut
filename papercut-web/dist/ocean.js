(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const hero = $('.hero'), intro = $('#intro-control'), motion = $('#motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:650px)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  let introTimer, running = false, paused = false, frame = 0;

  function finishIntro() {
    clearTimeout(introTimer);running = false;
    hero.classList.remove('opening');hero.classList.add('settled');
    intro.textContent = reduced.matches ? '静态纸景' : '重看鱼跃 ↻';
    intro.setAttribute('aria-label', reduced.matches ? '已按减少动画偏好显示静态场景' : '重播开场动画');
    intro.disabled = reduced.matches;
    dispatchEvent(new CustomEvent('paper-intro-finished'));
  }
  function playIntro() {
    if (reduced.matches) {finishIntro();return;}
    clearTimeout(introTimer);hero.classList.remove('opening','settled');
    void hero.offsetWidth;
    hero.classList.add('opening');running = true;
    intro.disabled = false;intro.textContent = '跳过开场 ↠';intro.setAttribute('aria-label','跳过开场动画');
    introTimer = setTimeout(()=>{if(!paused)finishIntro();},3550);
    dispatchEvent(new CustomEvent('paper-intro-started'));
  }
  addEventListener('paper-replay-hero',playIntro);
  $('.fish-jump-right').addEventListener('animationend',event=>{
    if(running&&event.target===$('.fish-jump-right'))finishIntro();
  });
  intro.addEventListener('click',()=> running ? finishIntro() : playIntro());
  motion.addEventListener('click',()=>{
    paused = !paused;hero.classList.toggle('motion-paused',paused);
    motion.textContent = paused ? '恢复动画' : '暂停动画';motion.setAttribute('aria-pressed',String(paused));
    document.documentElement.classList.toggle('paper-paused',paused);
    dispatchEvent(new CustomEvent('paper-motion-change',{detail:{paused}}));
    if(paused){hero.style.setProperty('--px','0px');hero.style.setProperty('--py','0px');}
  });
  reduced.addEventListener('change',()=>{
    finishIntro();motion.hidden = reduced.matches;
    hero.style.setProperty('--px','0px');hero.style.setProperty('--py','0px');
  });
  // Layout transforms live on separate parents, so entrance and breathing
  // animations cannot replace the portrait arrangement.
  const layoutTargets = {};
  ['.fish-placement-left','.fish-placement-right','.wave-back','.wave-mid','.wave-front','.wave-engraving','.splash-left','.splash-right'].forEach(selector=>{
    const node=$(selector), wrapper=document.createElementNS('http://www.w3.org/2000/svg','g');
    node.parentNode.insertBefore(wrapper,node);wrapper.append(node);layoutTargets[selector]=wrapper;
  });
  function layoutScene() {
    const mobile=narrow.matches;
    const box=$('.scene').getBoundingClientRect(), sceneWidth=Math.max(1600,1000*box.width/Math.max(1,box.height));
    $('.ocean-stage').setAttribute('viewBox',mobile?'0 150 1000 1250':((1600-sceneWidth)/2)+' 0 '+sceneWidth+' 1000');
    const placements = mobile ? [
      ['.fish-placement-left','translate(-10 115) scale(.86)'],
      ['.fish-placement-right','translate(-260 300) scale(.8)'],
      ['.far-pattern','translate(-180 200) scale(.85)'],
      ['.wave-back','translate(-80 330) scale(.8 1)'],
      ['.wave-mid','translate(-80 330) scale(.8 1)'],
      ['.wave-front','translate(-65 350) scale(.72 1)'],
      ['.wave-engraving','translate(-65 350) scale(.72 1)'],
      ['.splash-left','translate(-65 90) scale(.8)'],
      ['.splash-right','translate(-180 350) scale(.8)']
    ] : [];
    ['.fish-placement-left','.fish-placement-right','.far-pattern','.wave-back','.wave-mid','.wave-front','.wave-engraving','.splash-left','.splash-right'].forEach(s=>(layoutTargets[s]||$(s)).removeAttribute('transform'));
    placements.forEach(([s,t])=>(layoutTargets[s]||$(s)).setAttribute('transform',t));
  }
  layoutScene();narrow.addEventListener('change',layoutScene);
  hero.addEventListener('pointermove',e=>{
    if(!fine.matches||narrow.matches||reduced.matches||paused||frame)return;
    frame=requestAnimationFrame(()=>{
      const box=hero.getBoundingClientRect();
      hero.style.setProperty('--px',((e.clientX/box.width-.5)*9).toFixed(2)+'px');
      hero.style.setProperty('--py',((e.clientY/box.height-.5)*5).toFixed(2)+'px');frame=0;
    });
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--px','0px');hero.style.setProperty('--py','0px');});
  new IntersectionObserver(entries=>hero.classList.toggle('offscreen',!entries[0].isIntersecting),{threshold:.05}).observe(hero);
  document.addEventListener('visibilitychange',()=>hero.classList.toggle('offscreen',document.hidden));
  motion.hidden=reduced.matches;
  // Decode both source-derived layers before starting; no blank fish on slower devices.
  Promise.all(['fish-whole-left','fish-whole-right'].map(name=>{
    const img=new Image();img.src='assets/scene/'+name+'.webp';return img.decode().catch(()=>{});
  })).then(playIntro);

  const works = {
    fish:{title:'双鱼与花卉',category:'完整原作 · 首页动态场景的来源',src:'assets/works/fish.jpg',w:5653,h:4507,note:'项目提供《鱼》原图，画面观察名“双鱼与花卉”。作者与地域待核。首页为基于原作的再设计。'},
    dragon:{title:'龙飞大有年',category:'彩色作品 · 细纹赏析',src:'assets/works/dragon.webp',w:1800,h:2400,note:'项目提供图像。同名作品资料：林邦栋／浙江乐清细纹刻纸；图片使用条件待核。'},
    mu:{title:'穆桂英',category:'人物故事 · 参考截图',src:'assets/works/mu-guiying.png',w:1159,h:966,note:'项目提供参考截图，保留“纹藏”标识及视频字幕。作者、地域与使用条件待核。'},
    flourishing:{title:'中华盛世',category:'完整长卷 · 纵向细观',src:'assets/works/flourishing.jpg',w:790,h:1600,note:'项目提供素材，题名据画面，作者与地域待核。图像保留原始比例。'}
  };
  const details = {
    scales:{title:'一弯月牙，万片龙鳞',text:'重复的弧形剪口沿龙身展开，纸与空隙交替，疏密之间自有节奏。',pos:'35% 65%',x:.3,y:.63,zoom:3.2},
    border:{title:'细如织锦，密而不乱',text:'角部的短线反复穿插，让纸面像织物般细密。细线之间的连接，托住整幅图景。',pos:'12% 7%',x:.21,y:.16,zoom:3.6},
    color:{title:'五色相衬，丰年入画',text:'金色龙身、红色边饰与深色枝叶相互映衬。退后一步，再看整体色彩的疏密与呼应。',pos:'52% 47%',x:.5,y:.45,zoom:2}
  };
  let activeDetail='scales';
  $$('[data-detail]').forEach(b=>b.addEventListener('click',()=>{
    activeDetail=b.dataset.detail;const d=details[activeDetail];
    $$('[data-detail]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    $('#detail-title').textContent=d.title;$('#detail-text').textContent=d.text;
    $('#detail-crop').style.backgroundPosition=d.pos;$('#detail-crop').setAttribute('aria-label',d.title+'局部细节');
  }));

  const viewer=$('#artwork-viewer'), surface=$('#viewer-surface'), viewerImage=$('#viewer-image');
  const sources=$('#sources-dialog');
  let current=works.fish, zoom=1, offsetX=0, offsetY=0, fitW=1, fitH=1, returnFocus=null, pinchDistance=0;
  const pointers=new Map();
  function applyZoom() {
    const maxX=Math.max(0,(fitW*zoom-surface.clientWidth)/2+20),maxY=Math.max(0,(fitH*zoom-surface.clientHeight)/2+20);
    offsetX=Math.max(-maxX,Math.min(maxX,offsetX));offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
    viewerImage.style.transform='translate(-50%,-50%) translate('+offsetX+'px,'+offsetY+'px) scale('+zoom+')';
    $('#zoom-value').value=Math.round(zoom*100)+'%';$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=8;
    surface.style.cursor=zoom>1?'grab':'zoom-in';
  }
  function fitViewer() {
    fitW=Math.max(1,Math.min(surface.clientWidth-24,(surface.clientHeight-24)*current.w/current.h));fitH=fitW*current.h/current.w;
    viewerImage.style.width=fitW+'px';viewerImage.style.height=fitH+'px';applyZoom();
  }
  function changeZoom(value) {const old=zoom;zoom=Math.max(1,Math.min(8,value));offsetX*=zoom/old;offsetY*=zoom/old;applyZoom();}
  function openWork(key,point) {
    if(sources.open)sources.close();
    returnFocus=document.activeElement;current=works[key];zoom=1;offsetX=offsetY=0;
    $('#viewer-title').textContent=current.title;$('#viewer-category').textContent=current.category;$('#viewer-note').textContent=current.note;
    viewerImage.src=current.src;viewerImage.alt=current.title+'完整原始图像';$('#viewer-original').href=current.src;
    viewer.showModal();document.body.style.overflow='hidden';fitViewer();
    if(point){zoom=point.zoom;offsetX=(.5-point.x)*fitW*zoom;offsetY=(.5-point.y)*fitH*zoom;applyZoom();}
  }
  $$('[data-open-work]').forEach(b=>b.addEventListener('click',()=>openWork(b.dataset.openWork)));
  $('#open-detail').addEventListener('click',()=>openWork('dragon',details[activeDetail]));
  $('#close-viewer').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>{document.body.style.overflow='';pointers.clear();returnFocus?.focus({preventScroll:true});});
  $('#zoom-in').addEventListener('click',()=>changeZoom(zoom+.5));$('#zoom-out').addEventListener('click',()=>changeZoom(zoom-.5));
  $('#zoom-reset').addEventListener('click',()=>{zoom=1;offsetX=offsetY=0;applyZoom();});
  surface.addEventListener('wheel',e=>{e.preventDefault();changeZoom(zoom*Math.exp(-e.deltaY*.0015));},{passive:false});
  surface.addEventListener('dblclick',()=>changeZoom(zoom>1?1:2));
  surface.addEventListener('keydown',e=>{
    if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
    if(e.key==='+'||e.key==='=')changeZoom(zoom+.5);if(e.key==='-')changeZoom(zoom-.5);
    if(e.key==='0'){zoom=1;offsetX=offsetY=0;}
    if(e.key==='ArrowLeft')offsetX+=45;if(e.key==='ArrowRight')offsetX-=45;if(e.key==='ArrowUp')offsetY+=45;if(e.key==='ArrowDown')offsetY-=45;applyZoom();
  });
  surface.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    surface.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const [a,b]=Array.from(pointers.values());pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
  });
  surface.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const [a,b]=Array.from(pointers.values()),d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)changeZoom(zoom*d/pinchDistance);pinchDistance=d;}
    else{offsetX+=e.clientX-old.x;offsetY+=e.clientY-old.y;applyZoom();}
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>surface.addEventListener(t,e=>{pointers.delete(e.pointerId);pinchDistance=0;}));
  $('#sources-open').addEventListener('click',()=>{returnFocus=document.activeElement;sources.showModal();document.body.style.overflow='hidden';});
  $('#close-sources').addEventListener('click',()=>sources.close());
  sources.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus({preventScroll:true});});
  [viewer,sources].forEach(d=>d.addEventListener('click',e=>{
    if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();
  }));
  addEventListener('resize',()=>{layoutScene();if(viewer.open)fitViewer();});

  const G=PapercutGeometry;
  const patterns={bloom:{name:'团花 · 初见',folds:8,color:'#b5382d'},spring:{name:'春信 · 花开',folds:6,color:'#ad7f35'},star:{name:'四时 · 平安',folds:4,color:'#94413c'}};
  function patternState(id){return {...patterns[id],cuts:G.pattern(id,patterns[id].folds)};}
  function selectPattern(id){
    const state=patternState(id);$('#pattern-art').innerHTML=G.artworkSVG(state,'home-pattern');
    $('#pattern-name').textContent=state.name;$('#pattern-fold').textContent=({4:'四瓣',6:'六瓣',8:'八瓣'})[state.folds]+'对称';
    $$('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pattern===id)));
  }
  $$('[data-pattern]').forEach(b=>b.addEventListener('click',()=>selectPattern(b.dataset.pattern)));selectPattern('bloom');
  function renderCollection(){
    let saved=[],unavailable=false;
    try{const data=JSON.parse(localStorage.getItem('paper-blooms-collection-v1')||'[]');if(Array.isArray(data))saved=data.filter(x=>x&&typeof x.id==='string'&&G.validState(x.state)).slice(0,40);}catch{unavailable=true;}
    $('.saved-count').textContent=saved.length;$('.saved-count').hidden=!saved.length;
    const grid=$('#home-collection');grid.replaceChildren();
    const items=saved.length?saved.slice(0,3):Object.keys(patterns).map(id=>({state:patternState(id)}));
    items.forEach((item,i)=>{
      const a=document.createElement('a');a.className='collection-card';a.href='workshop.html?view='+(saved.length?'collection':'patterns');
      const paper=document.createElement('div');paper.className='collection-paper';paper.innerHTML=G.artworkSVG(item.state,'home-saved-'+i);
      if(!saved.length){const label=document.createElement('span');label.className='sample-label';label.textContent='原创练习示例';paper.append(label);}
      const title=document.createElement('h3');title.textContent=item.state.name;
      const note=document.createElement('p');note.textContent=saved.length?'我的收藏 · 继续创作 ↗':'从这枚纹样开始，剪出你的版本 ↗';
      a.append(paper,title,note);grid.append(a);
    });
    $('.storage-note').textContent=unavailable?'当前浏览器无法读取收藏，示例仅供练习；创作后请及时导出作品。':'作品保存在当前浏览器；喜欢的作品，记得导出留存。';
  }
  renderCollection();addEventListener('storage',renderCollection);addEventListener('pageshow',renderCollection);
})();
