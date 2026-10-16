(function () {
  'use strict';
  const G = PapercutGeometry;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const STORAGE = 'paper-blooms-collection-v1', DRAFT = 'paper-blooms-draft-v1';
  const templates = [
    { id: 'bloom', name: '团花 · 初见', folds: 8, color: '#b5382d', caption: '以圆为始，把团圆剪进窗花', tag: '八瓣对称 · 适合初次尝试', description: '用柳叶与圆孔组成一朵团花，尝试改变剪口大小，观察虚实之间的变化。' },
    { id: 'spring', name: '春信 · 花开', folds: 6, color: '#ad7f35', caption: '留一缕春意，等一树花开', tag: '六瓣对称 · 练习连接', description: '长短交错的花瓣构成春日的想象。留意花瓣间细小的连接，给纸张留一些余地。' },
    { id: 'star', name: '四时 · 平安', folds: 4, color: '#426d68', caption: '四方相映，装点日常好时光', tag: '四瓣对称 · 自由变化', description: '从四向对称开始，用三角和柳叶剪口组织节奏，让几何图形有自己的性格。' }
  ];
  const foldNames = {4:'四瓣',6:'六瓣',8:'八瓣'};
  const colorNames = {'#b5382d':'朱砂红','#94413c':'胭脂红','#ad7f35':'秋香金','#426d68':'松石绿'};
  function templateState(template) { return {folds:template.folds,color:template.color,cuts:G.pattern(template.id,template.folds),name:template.name}; }
  let state = templateState(templates[0]);
  let history = [], future = [], tool = 'leaf', pending = [], collection = [], dirty = false;
  let toastTimer, analysisTimer, draftTimer, confirmAction, islandOverlay = '', analysisCanvas;
  let savedDraftWorks = true;
  const clone = data => JSON.parse(JSON.stringify(data));
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800); }
  function escapeText(text) { return String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }
  function loadStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || '[]');
      collection = Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && G.validState(item.state)).slice(0, 40) : [];
      const draft = JSON.parse(localStorage.getItem(DRAFT) || 'null');
      if (G.validState(draft)) { state = draft; dirty = true; }
    } catch { savedDraftWorks = false; $('#save-note').textContent = '浏览器存储不可用，请及时导出'; }
  }
  function persistDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { if (savedDraftWorks) toast('草稿未能保存，请及时导出作品'); savedDraftWorks = false; $('#save-note').textContent = '本地存储已满或不可用，请导出'; } }, 300);
  }
  function commit(change) {
    history.push(clone(state)); if (history.length > 70) history.shift(); future = [];
    change(); dirty = true; pending = []; islandOverlay = ''; render(); persistDraft();
  }
  function askReplace(action, message = '当前作品会被替换。你可以先取消并收藏，或在替换后点击撤销找回。') {
    if (!dirty) { action(); return; }
    confirmAction = action; $('#confirm-message').textContent = message; $('#confirm-dialog').showModal();
  }
  function changeView(view) {
    for (const key of ['workshop','patterns','collection']) $('#' + key + '-view').classList.toggle('hidden', key !== view);
    $$('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    const titles = { workshop:'把心意，<em>剪成花。</em>', patterns:'寻一枚纹样，<em>生一份灵感。</em>', collection:'每一剪，<em>都值得珍藏。</em>' };
    const descriptions = {workshop:'从一张红纸开始，在折叠与展开之间，遇见自己的第一幅窗花。', patterns:'从几何的秩序里，发现剪纸的温柔。选择一幅，继续你的创作。', collection:'留住指尖的巧思，也留住这一刻的心意。作品保存在当前浏览器中。'};
    $('#page-title').innerHTML = titles[view]; $('#page-description').textContent = descriptions[view];
    if (view === 'collection') renderCollection();
  }
  function guideMarkup() {
    if (!$('#show-guides').checked) return '';
    let lines = '';
    for (let i = 0; i < state.folds; i++) {
      const p = G.polar(267, -Math.PI / 2 + i * G.TAU / state.folds);
      lines += '<path d="M300 300L' + (300 + p[0]) + ' ' + (300 + p[1]) + '"/>';
    }
    return '<g fill="none" stroke="#ead5b0" stroke-width="1" stroke-dasharray="4 6" opacity=".8">' + lines + '</g><circle cx="300" cy="300" r="3" fill="#e6cc9f"/>';
  }
  function pendingMarkup() {
    if (!pending.length) return '';
    const path = pending.map((p, i) => (i?'L':'M') + p[0] + ',' + p[1]).join(' ');
    let markup = '';
    for (let i=0;i<state.folds;i++) markup += '<g transform="translate(300 300) rotate(' + (-90+(i+i%2)*360/state.folds) + ') scale(1 '+(i%2?-1:1)+')"><path d="'+path+'" fill="#fff8d538" stroke="#ffe7a7" stroke-width="2" stroke-dasharray="5 4"/>'+pending.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="#ffe7a7"/>').join('')+'</g>';
    return markup;
  }
  function renderEditor() {
    $('#editor').innerHTML = G.artworkInner(state,'editor-mask') + (islandOverlay ? '<image href="'+islandOverlay+'" x="0" y="0" width="600" height="600" opacity=".88"/>' : '') + guideMarkup() + pendingMarkup();
    $('#finish-cut').classList.toggle('hidden', tool !== 'free');
    $('#finish-cut').disabled = pending.length < 3;
    $('#canvas-hint').textContent = pending.length ? '已选 '+pending.length+' 点 · Enter 完成 · Esc 取消' : '点击试剪 · Ctrl + Z 撤销';
  }
  function render() {
    renderEditor();
    $('#preview-art').innerHTML = G.artworkSVG(state,'preview-mask');
    $('#art-title').textContent = state.name;
    $('#art-subtitle').textContent = foldNames[state.folds] + '对称 / ' + (colorNames[state.color] || '自选纸色');
    $('#cut-count').textContent = state.cuts.length + ' 组剪口';
    $('#undo').disabled = !history.length; $('#redo').disabled = !future.length;
    $$('[data-fold]').forEach(button => { const selected = +button.dataset.fold === state.folds; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed',selected); });
    $$('[data-color]').forEach(button => { const selected = button.dataset.color === state.color; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed',selected); });
    scheduleAnalysis();
  }
  function scheduleAnalysis() {
    clearTimeout(analysisTimer);
    $('#structure-title').textContent = '正在检查连接…';
    analysisTimer = setTimeout(analyze, 100);
  }
  function analyze() {
    const size = 360;
    analysisCanvas ||= document.createElement('canvas'); analysisCanvas.width = analysisCanvas.height = size;
    const ctx = analysisCanvas.getContext('2d', {willReadFrequently:true});
    G.renderMask(ctx,state,size);
    const pixels = ctx.getImageData(0,0,size,size);
    const alpha = new Uint8Array(size * size);
    for (let i=0;i<alpha.length;i++) alpha[i] = pixels.data[i*4+3] > 127 ? 1 : 0;
    const result = G.components(alpha,size,size);
    const islands = result.sizes.map((count,label)=>({count,label})).filter(part => part.label !== result.largest && part.label > 0 && part.count >= 6);
    $('#structure-card').classList.toggle('warning', !!islands.length || result.largest === 0);
    if (!result.largest) {
      $('#structure-title').textContent = '纸张已经剪空了'; $('#structure-description').textContent = '撤销几步，留下一些纸张再试试。'; islandOverlay='';
    } else if (islands.length) {
      $('#structure-title').textContent = islands.length + ' 处区域已分离';
      $('#structure-description').textContent = '金色部分未与最大主体相连；若想保留它们，请撤销调整。';
      const marked = new Set(islands.map(part=>part.label));
      for (let i=0;i<alpha.length;i++) { pixels.data[i*4]=221; pixels.data[i*4+1]=166; pixels.data[i*4+2]=58; pixels.data[i*4+3]=marked.has(result.labels[i])?255:0; }
      ctx.putImageData(pixels,0,0); islandOverlay=analysisCanvas.toDataURL();
    } else {
      $('#structure-title').textContent = '纸张连接完整'; $('#structure-description').textContent = '暂未发现明显分离区域，继续你的巧思吧。'; islandOverlay='';
    }
    renderEditor();
  }
  function addCut(points) {
    if(state.cuts.length >= 250) { toast('本幅已达到 250 组剪口，请先导出或换一张纸'); return; }
    commit(()=>state.cuts.push(points));
  }
  function cutAt(point) {
    if (tool === 'free') {
      if(pending.length >= 100) { toast('自由路径最多 100 个点，请完成这一剪'); return; }
      pending.push(point); renderEditor(); return;
    }
    addCut(G.shape(tool,point[0],point[1],+$('#cut-size').value));
  }
  function finishCut() {
    if(pending.length<3) { toast('至少选择三个点，才能围出剪切区域'); return; }
    const points = clone(pending);
    const area = Math.abs(points.reduce((sum,p,i)=>{ const q=points[(i+1)%points.length]; return sum+p[0]*q[1]-q[0]*p[1]; },0))/2;
    if (area < 3) { toast('这些点几乎连成一条线，请围出一个有面积的区域'); return; }
    addCut(points);
  }
  function selectTool(value) {
    tool=value; pending=[];
    $$('[data-tool]').forEach(button=>{const selected=button.dataset.tool===tool;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected);});
    $('#tool-note').textContent = {leaf:'在纸面点击，剪出一枚柳叶',circle:'在纸面点击，镂出一枚圆孔',triangle:'在纸面点击，剪出三角形缺口',free:'依次点选路径，完成后剪去内部'}[tool];
    $('#cut-size').disabled = tool === 'free'; renderEditor();
  }
  function undo() {
    if (pending.length) { pending.pop(); renderEditor(); return; }
    if(!history.length)return;
    future.push(clone(state));state=history.pop();dirty=true;islandOverlay='';render();persistDraft();
  }
  function redo() { if(!future.length)return; history.push(clone(state));state=future.pop();pending=[];dirty=true;islandOverlay='';render();persistDraft(); }
  function saveWork() {
    if ($('#result-dialog').open) state.name = $('#work-name').value.trim() || '我的第一幅窗花';
    const signature = JSON.stringify(state);
    if(collection.some(item=>JSON.stringify(item.state)===signature)) { toast('这幅作品已经收藏过了'); return; }
    if(collection.length>=40){toast('最多收藏 40 幅，请先导出并删除部分旧作品');return;}
    const item = {id: typeof crypto.randomUUID==='function'?crypto.randomUUID():String(Date.now()),state:clone(state),date:new Date().toISOString()};
    const next=[item,...collection];
    try {localStorage.setItem(STORAGE,JSON.stringify(next));collection=next;dirty=false;renderCollection();render();persistDraft();toast('已收藏，去「我的作品」随时继续创作');}
    catch{toast('收藏失败：本地存储不可用或已满，请导出作品');}
  }
  function download(blob, name) {
    const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function exportName() { return (state.name || '纸上生花').replace(/[\\/:*?"<>|]/g,'_'); }
  function exportSVG() {
    if($('#result-dialog').open){state.name=$('#work-name').value.trim()||'我的第一幅窗花';render();persistDraft();}
    download(new Blob([G.artworkSVG(state,'export-mask')],{type:'image/svg+xml;charset=utf-8'}),exportName()+'.svg');toast('已导出 SVG，可用于放大和打印');
  }
  async function exportPNG() {
    if($('#result-dialog').open){state.name=$('#work-name').value.trim()||'我的第一幅窗花';render();persistDraft();}
    const blob=new Blob([G.artworkSVG(state,'export-mask')],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);
    try {
      const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1800;canvas.getContext('2d').drawImage(image,0,0,1800,1800);
      const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw new Error('export');download(png,exportName()+'.png');toast('已导出 1800 × 1800 透明背景 PNG');
    }catch{toast('图片导出失败，请尝试导出 SVG');}finally{URL.revokeObjectURL(url);}
  }
  function unfold() {
    if(pending.length){toast('请先完成当前路径，或按 Esc 取消');return;}
    $('#work-name').value=state.name;
    let clips='',pieces='';
    for(let i=0;i<state.folds;i++){
      const start=G.polar(300,-Math.PI/2+i*G.TAU/state.folds),end=G.polar(300,-Math.PI/2+(i+1)*G.TAU/state.folds);
      clips+='<clipPath id="unfold-clip-'+i+'"><path d="M300 300L'+(300+start[0])+' '+(300+start[1])+'A300 300 0 0 1 '+(300+end[0])+' '+(300+end[1])+'Z"/></clipPath>';
      pieces+='<g class="unfold-piece" style="--fold-angle:'+(-i*360/state.folds)+'deg;animation-delay:'+(i*.075)+'s"><g clip-path="url(#unfold-clip-'+i+')"><use href="#unfold-pattern"/></g></g>';
    }
    $('#result-art').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><g id="unfold-pattern">'+G.artworkInner(state,'result-mask')+'</g>'+clips+'</defs>'+pieces+'</svg>';
    $('#result-dialog').showModal();
  }
  function loadTemplate(index) { askReplace(()=>{commit(()=>state=templateState(templates[index]));changeView('workshop');toast('已铺好新纸，试着加上自己的几剪');}); }
  function renderTemplates() {
    $('#template-grid').innerHTML=templates.map((t,i)=>'<button class="template-card" data-template="'+i+'"><div class="template-art">'+G.artworkSVG(templateState(t),'mini-'+i)+'</div><div><h3>'+t.name+'</h3><p>'+t.caption+'</p><small>'+t.tag+'</small></div><svg class="arrow"><use href="#i-arrow"/></svg></button>').join('');
    $('#pattern-grid').innerHTML=templates.map((t,i)=>'<article class="pattern-card"><div class="large-art">'+G.artworkSVG(templateState(t),'gallery-'+i)+'</div><h3>'+t.name+'</h3><p>'+t.description+'</p><small class="small-tag">'+t.tag+'</small><button class="primary-button" data-template="'+i+'">从这幅开始 <svg><use href="#i-arrow"/></svg></button></article>').join('');
    $$('[data-template]').forEach(button=>button.addEventListener('click',()=>loadTemplate(+button.dataset.template)));
  }
  function renderCollection() {
    $('#collection-count').textContent=collection.length;$('#empty-collection').classList.toggle('hidden',!!collection.length);
    $('#collection-grid').innerHTML=collection.map((item,i)=>'<article class="pattern-card"><div class="large-art">'+G.artworkSVG(item.state,'saved-'+i)+'</div><h3>'+escapeText(item.state.name)+'</h3><p>'+foldNames[item.state.folds]+'对称 · '+item.state.cuts.length+' 组剪口</p><div class="card-actions"><button data-load="'+i+'">继续创作 →</button><button data-delete="'+i+'">删除</button></div></article>').join('');
    $$('[data-load]').forEach(button=>button.addEventListener('click',()=>{const saved=clone(collection[+button.dataset.load].state);askReplace(()=>{commit(()=>state=saved);changeView('workshop');toast('已恢复作品，可以继续裁剪');});}));
    $$('[data-delete]').forEach(button=>button.addEventListener('click',()=>{
      const id=collection[+button.dataset.delete].id;
      confirmAction=()=>{const next=collection.filter(item=>item.id!==id);try{localStorage.setItem(STORAGE,JSON.stringify(next));collection=next;renderCollection();toast('作品已从收藏移除');}catch{toast('删除失败，本地存储不可用');}};
      $('#confirm-message').textContent='删除这幅收藏后无法恢复。你可以先继续创作并导出图片。';$('#confirm-title').textContent='删除这幅收藏？';$('#confirm-dialog').showModal();
    }));
  }
  loadStorage();renderTemplates();renderCollection();render();selectTool('leaf');
  const entryView = new URLSearchParams(location.search).get('view');
  if (entryView === 'patterns' || entryView === 'collection') changeView(entryView);
  $$('[data-view]').forEach(button=>button.addEventListener('click',()=>changeView(button.dataset.view)));
  $('.brand').addEventListener('click',event=>{event.preventDefault();changeView('workshop');});
  $('#see-patterns').addEventListener('click',()=>changeView('patterns'));
  $$('[data-tool]').forEach(button=>button.addEventListener('click',()=>selectTool(button.dataset.tool)));
  $$('[data-fold]').forEach(button=>button.addEventListener('click',()=>{const folds=+button.dataset.fold;if(folds===state.folds)return;askReplace(()=>{commit(()=>{state.folds=folds;state.cuts=G.pattern('bloom',folds);state.name='团花 · 初见';});toast('已更换折法，并铺好对应的练习纹样');});}));
  $$('[data-color]').forEach(button=>button.addEventListener('click',()=>{if(state.color!==button.dataset.color)commit(()=>state.color=button.dataset.color);}));
  $('#cut-size').addEventListener('input',()=>$('#size-value').textContent=$('#cut-size').value);
  $('#show-guides').addEventListener('change',renderEditor);
  $('#editor').addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const matrix=$('#editor').getScreenCTM();if(!matrix)return;
    const position=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    const x=position.x-300,y=position.y-300;
    if(Math.hypot(x,y)>G.RADIUS+4){toast('请在圆形纸张范围内落剪');return;}
    cutAt(G.canonicalPoint(x,y,state.folds));
  });
  $('#keyboard-cut').addEventListener('click',()=>{if(tool==='free'){toast('自由剪请在画布点选；键盘试剪可选柳叶、圆孔或月牙角');return;}cutAt(G.polar(195,G.TAU/state.folds*.32));});
  $('#finish-cut').addEventListener('click',finishCut);$('#undo').addEventListener('click',undo);$('#redo').addEventListener('click',redo);
  $('#reset').addEventListener('click',()=>askReplace(()=>{commit(()=>{state.cuts=[];state.name='我的第一幅窗花';});toast('新纸已铺好，开始你的第一剪');}));
  $('#help').addEventListener('click',()=>$('#help-dialog').showModal());
  $$('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  $('#confirm-ok').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;$('#confirm-dialog').close();action?.();});
  $('#confirm-cancel').addEventListener('click',()=>$('#confirm-dialog').close());
  $('#confirm-dialog').addEventListener('close',()=>{$('#confirm-title').textContent='换一张新纸？';confirmAction=null;});
  $('#unfold').addEventListener('click',unfold);$('#save').addEventListener('click',saveWork);$('#export').addEventListener('click',exportPNG);$('#result-save').addEventListener('click',saveWork);$('#result-export').addEventListener('click',exportPNG);$('#export-svg').addEventListener('click',exportSVG);
  document.addEventListener('keydown',event=>{
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||$$('dialog').some(dialog=>dialog.open))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
    if(event.key==='Enter'&&tool==='free'&&pending.length){event.preventDefault();finishCut();}
    if(event.key==='Escape'&&pending.length){pending=[];renderEditor();toast('已取消当前路径');}
  });
})();
