(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const works = [
    {id:'fish',title:'双鱼与花卉',short:'双鱼花卉',subtitle:'相向成趣，繁而有序',src:'assets/works/fish.jpg',width:5653,height:4507,
      summary:'两条鱼相向而游，花朵、枝叶与卷曲水纹连成一幅完整画面。近看鳞片与细齿，远看左右呼应的构图。',
      attribution:'用户提供素材 · 画面观察名，作者及地域待核',
      source:'原文件：鱼.jpg。页面按可见内容暂称“双鱼与花卉”，不将它归入未经核实的地域或传承人名下。',
      points:[{name:'鱼鳞月牙',x:.30,y:.51,zoom:3.4,text:'鱼身上重复排列的弧形镂空，形成层层鱼鳞。轮廓之间保留红纸，让细节仍与大块鱼身相连。'},{name:'花瓣细齿',x:.50,y:.34,zoom:3.1,text:'中央花瓣的边缘布满短而密的尖细剪口。它们与饱满的红色花瓣并置，形成粗细、疏密的对照。'},{name:'双鱼呼应',x:.50,y:.51,zoom:1.6,text:'两条鱼围绕中央花朵相向排列。可以比较眼睛、鱼尾和两侧枝叶的呼应，观察整体秩序中的局部变化。'}]},
    {id:'dragon',title:'龙飞大有年',short:'龙飞大有年',subtitle:'一身细纹，满纸丰年',src:'assets/works/dragon.webp',width:1800,height:2400,
      summary:'飞龙穿行于作物与云纹之间，外框布置密集细纹。用大图比较龙鳞、须发与边框，感受不同线条的疏密节奏。',
      attribution:'用户提供素材 · 同名作品资料：林邦栋／乐清细纹刻纸',
      source:'原文件：龙飞大有年.webp。《非常遗产·中国元素.民间美术.上》的“乐清细纹刻纸”条目收录林邦栋《龙飞大有年》及作品说明。此处为所提供图片与该资料的对照展示，不归入山东剪纸。',
      link:'https://www.yuncunzhai.com/book/161476.jhtml',linkText:'查看《龙飞大有年》出版资料',
      points:[{name:'龙鳞细纹',x:.30,y:.63,zoom:3.2,text:'沿着盘曲的龙身看，细小弧线连续排列成鳞片。鳞片密集的区域与四周留白形成清楚的节奏。'},{name:'须发线条',x:.50,y:.69,zoom:3.0,text:'龙首周围的须发以细长、弯曲的线条展开。放大比较这些线条与鱼鳞状装饰的差别。'},{name:'边框织纹',x:.21,y:.16,zoom:4.0,text:'角部装饰由短线反复穿插，像织物一样细密。边框与主画面的图形密度不同，近看和远看会有不同感受。'}]},
    {id:'mu',title:'穆桂英',short:'戏曲人物',subtitle:'以花饰冠，以线写神',src:'assets/works/mu-guiying.png',width:1159,height:966,
      summary:'戏曲人物的冠饰、面部与衣饰形成鲜明层次。面部留白简洁，冠饰与衣纹细密，值得对照观察。',
      attribution:'用户提供截图 · 保留原图标记，作者与地域待核',
      source:'原文件：穆桂英.png。图片带有“纹藏”标记、题签及视频字幕；本页保留截图完整画面，不据此推断创作者或具体流派。',
      points:[{name:'冠饰连珠',x:.40,y:.15,zoom:2.8,text:'冠饰中可以看到圆孔、花瓣与珠状装饰。重复的圆形将多种细节组织在一起，形成华丽而有序的层次。'},{name:'面部留白',x:.39,y:.51,zoom:2.6,text:'眼、鼻、口用少量红线勾勒，大面积留白使神情从繁密冠饰中凸显出来。'},{name:'衣纹细齿',x:.39,y:.78,zoom:2.5,text:'衣饰中的花瓣、细齿与长线交替出现。把放大图缩回全图，观察局部装饰如何衬托人物。'}]},
    {id:'flourishing',title:'中华盛世',short:'中华盛世',subtitle:'长卷藏万象，细处见精神',src:'assets/works/flourishing.jpg',width:790,height:1600,
      summary:'盘龙、飞鸟、花卉与建筑在纵向画幅中交错。沿龙身从上向下看，可以发现不同题材如何组成一幅长卷。',
      attribution:'用户提供素材 · 题名据画面，作者与地域待核',
      source:'原文件：中华盛世.jpg。画面有题名与印章，但尚不能据此可靠确认作者。同名网络作品不作为本图归属的依据。',
      points:[{name:'龙首须发',x:.35,y:.39,zoom:3.0,text:'龙首周围的须发使用成束的弧线，红纸块面与细长留白交织。可以沿着线条寻找面部的朝向。'},{name:'鳞片与花卉',x:.59,y:.59,zoom:2.8,text:'连续鳞片与穿插其间的花朵打破了长条龙身的单调。局部密集，整体仍有可辨认的行进方向。'},{name:'建筑线条',x:.35,y:.84,zoom:3.0,text:'城墙与楼阁使用横直线和反复排列的小纹理，与龙身和云气的曲线形成对照。'}]}
  ];
  let selected=0, detail=0, showHotspots=true;
  let zoom=1, offsetX=0, offsetY=0, fitWidth=1, fitHeight=1, lastFocus=null;
  const pointers=new Map(); let pinchDistance=0, panX=0, panY=0;
  const artwork=$('#hero-artwork'), viewer=$('#artwork-viewer'), viewerImage=$('#viewer-image');

  function fitHero() {
    const work=works[selected], mount=$('.work-mount');
    const ratio=work.width/work.height, width=Math.min(mount.clientWidth-28,(mount.clientHeight-26)*ratio);
    $('#image-wrap').style.width=width+'px';$('#image-wrap').style.height=width/ratio+'px';
  }
  function setDetail(index) {
    detail=index;const point=works[selected].points[index];
    $('#detail-number').textContent=String(index+1).padStart(2,'0');
    $('#detail-title').textContent=point.name;$('#detail-description').textContent=point.text;
    $$('[data-detail]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.detail===index)));
  }
  function selectWork(index) {
    selected=(index+works.length)%works.length;const work=works[selected];
    artwork.src=work.src;artwork.alt=work.title+'剪纸完整画面';artwork.width=work.width;artwork.height=work.height;
    $('#open-artwork').setAttribute('aria-label','放大查看'+work.title);
    $('#artwork-title').textContent=work.title;$('#artwork-subtitle').textContent=work.subtitle;
    $('#artwork-summary').textContent=work.summary;$('#work-attribution').textContent=work.attribution;
    $('#work-counter').textContent=String(selected+1).padStart(2,'0')+' / 04';
    $$('[data-work]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.work===selected)));
    $('#art-hotspots').replaceChildren();$('#detail-choices').replaceChildren();
    work.points.forEach((point,i)=>{
      const hotspot=document.createElement('button');hotspot.className='art-hotspot';hotspot.dataset.detail=i;
      hotspot.style.left=point.x*100+'%';hotspot.style.top=point.y*100+'%';hotspot.textContent=String(i+1).padStart(2,'0');
      hotspot.setAttribute('aria-label',point.name+'：查看讲解');hotspot.addEventListener('click',()=>setDetail(i));$('#art-hotspots').append(hotspot);
      const choice=document.createElement('button');choice.dataset.detail=i;choice.textContent=point.name;choice.addEventListener('click',()=>setDetail(i));$('#detail-choices').append(choice);
    });
    setDetail(0);fitHero();
  }
  works.forEach((work,i)=>{
    const button=document.createElement('button');button.dataset.work=i;button.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>'+work.short;
    button.addEventListener('click',()=>selectWork(i));$('#work-selector').append(button);
  });
  $('#next-artwork').addEventListener('click',()=>selectWork(selected+1));
  $('#hotspot-toggle').addEventListener('click',()=>{
    showHotspots=!showHotspots;$('#art-hotspots').hidden=!showHotspots;
    $('#hotspot-toggle').setAttribute('aria-pressed',String(showHotspots));$('#hotspot-toggle').textContent='纹样标记：'+(showHotspots?'显示':'隐藏');
  });

  function fitViewer() {
    const work=works[selected],surface=$('#viewer-surface');
    const ratio=work.width/work.height;fitWidth=Math.min(surface.clientWidth-32,(surface.clientHeight-32)*ratio);fitHeight=fitWidth/ratio;
    viewerImage.style.width=fitWidth+'px';viewerImage.style.height=fitHeight+'px';applyZoom();
  }
  function applyZoom() {
    const surface=$('#viewer-surface');
    const maxX=Math.max(0,(fitWidth*zoom-surface.clientWidth)/2+24),maxY=Math.max(0,(fitHeight*zoom-surface.clientHeight)/2+24);
    offsetX=Math.max(-maxX,Math.min(maxX,offsetX));offsetY=Math.max(-maxY,Math.min(maxY,offsetY));
    viewerImage.style.transform='translate(-50%,-50%) translate('+offsetX+'px,'+offsetY+'px) scale('+zoom+')';
    $('#zoom-value').value=Math.round(zoom*100)+'%';$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=6;
    surface.style.cursor=zoom>1?'grab':'zoom-in';
  }
  function changeZoom(value) {const old=zoom;zoom=Math.max(1,Math.min(6,value));offsetX*=zoom/old;offsetY*=zoom/old;applyZoom();}
  function openViewer(point=null) {
    lastFocus=document.activeElement;const work=works[selected];viewerImage.src=work.src;viewerImage.alt=work.title+'原始图像';$('#viewer-title').textContent=work.title;
    zoom=1;offsetX=offsetY=0;viewer.showModal();document.body.style.overflow='hidden';fitViewer();
    if(point){zoom=point.zoom;offsetX=(.5-point.x)*fitWidth*zoom;offsetY=(.5-point.y)*fitHeight*zoom;applyZoom();}
  }
  $('#open-artwork').addEventListener('click',()=>openViewer());$('#detail-magnify').addEventListener('click',()=>openViewer(works[selected].points[detail]));
  $('#close-viewer').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>{document.body.style.overflow='';pointers.clear();lastFocus?.focus({preventScroll:true});});
  $('#zoom-in').addEventListener('click',()=>changeZoom(zoom+.5));$('#zoom-out').addEventListener('click',()=>changeZoom(zoom-.5));
  $('#zoom-reset').addEventListener('click',()=>{zoom=1;offsetX=offsetY=0;applyZoom();});
  const surface=$('#viewer-surface');
  surface.addEventListener('wheel',event=>{event.preventDefault();changeZoom(zoom*Math.exp(-event.deltaY*.0015));},{passive:false});
  surface.addEventListener('dblclick',()=>changeZoom(zoom>1?1:2));
  surface.addEventListener('keydown',event=>{
    if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))event.preventDefault();
    if(event.key==='+'||event.key==='=')changeZoom(zoom+.5);if(event.key==='-')changeZoom(zoom-.5);if(event.key==='0'){zoom=1;offsetX=offsetY=0;applyZoom();}
    if(event.key==='ArrowLeft')offsetX+=45;if(event.key==='ArrowRight')offsetX-=45;if(event.key==='ArrowUp')offsetY+=45;if(event.key==='ArrowDown')offsetY-=45;applyZoom();
  });
  surface.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    surface.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});panX=event.clientX;panY=event.clientY;
    if(pointers.size===2){const [a,b]=Array.from(pointers.values());pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
  });
  surface.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){const [a,b]=Array.from(pointers.values()),distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0)changeZoom(zoom*distance/pinchDistance);pinchDistance=distance;}
    else {offsetX+=event.clientX-panX;offsetY+=event.clientY-panY;panX=event.clientX;panY=event.clientY;applyZoom();}
  });
  function endPointer(event){pointers.delete(event.pointerId);pinchDistance=0;const remaining=pointers.values().next().value;if(remaining){panX=remaining.x;panY=remaining.y;}}
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>surface.addEventListener(type,endPointer));

  $('#artwork-sources').addEventListener('click',()=>{
    const work=works[selected],content=$('#source-content');content.replaceChildren();
    const title=document.createElement('h3');title.textContent=work.title;const note=document.createElement('p');note.textContent=work.source;content.append(title,note);
    const original=document.createElement('a');original.href=work.src;original.target='_blank';original.rel='noopener';original.textContent='查看完整素材原图 ↗';content.append(original);
    if(work.link){const link=document.createElement('a');link.href=work.link;link.target='_blank';link.rel='noopener noreferrer';link.textContent=work.linkText+' ↗';content.append(link);}
    $('#sources-dialog').showModal();document.body.style.overflow='hidden';
  });
  $('#close-sources').addEventListener('click',()=>$('#sources-dialog').close());$('#sources-dialog').addEventListener('close',()=>document.body.style.overflow='');
  [viewer,$('#sources-dialog')].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));

  // Fine serrations and crescent apertures decorate the frame; the source artwork is never altered.
  function carveSerratedPlume(ctx, radius, count) {
    for(let i=0;i<count;i++){
      const y=-radius+i*radius*.72/count,w=radius*(.21-.12*i/count);
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*2,y+5);ctx.quadraticCurveTo(side*w,y-4,side*(w+3),y-9);ctx.quadraticCurveTo(side*w*.5,y+1,side*2,y+7);ctx.fill();}
    }
  }
  function carveFiligreePetalCluster(ctx) {
    for(let n=0;n<8;n++){ctx.save();ctx.rotate(n*Math.PI/4);ctx.beginPath();ctx.moveTo(0,-19);ctx.bezierCurveTo(-12,-29,-12,-44,0,-52);ctx.bezierCurveTo(12,-44,12,-29,0,-19);ctx.fill();
      carveSerratedPlume(ctx,81,9);for(let k=0;k<3;k++){ctx.beginPath();ctx.arc((k-1)*9,-87,2.0,0,Math.PI*2);ctx.fill();}ctx.restore();}
  }
  function renderIntricateDioramaPlane(ctx,x,y,radius,palette,opacity) {
    const tile=document.createElement('canvas');tile.width=tile.height=220;const c=tile.getContext('2d');c.translate(110,110);
    const gradient=c.createRadialGradient(-12,-17,5,0,0,103);gradient.addColorStop(0,palette[1]);gradient.addColorStop(.58,palette[0]);gradient.addColorStop(1,palette[2]);c.fillStyle=gradient;c.beginPath();
    for(let i=0;i<=480;i++){const a=i/480*Math.PI*2,r=100*(.93+.055*Math.cos(8*a)+.015*Math.cos(32*a));i?c.lineTo(r*Math.cos(a),r*Math.sin(a)):c.moveTo(r*Math.cos(a),r*Math.sin(a));}c.closePath();c.fill();
    c.globalCompositeOperation='destination-out';carveFiligreePetalCluster(c);c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();
    c.globalCompositeOperation='source-atop';c.strokeStyle='#E1C9A4';c.lineWidth=1;c.beginPath();c.arc(0,0,58,0,Math.PI*2);c.stroke();
    ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(tile,x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  function renderFrame() {
    const canvas=$('#exhibit-frame'),ctx=canvas.getContext('2d'),css=getComputedStyle(document.documentElement),red=css.getPropertyValue('--c1').trim(),soft=css.getPropertyValue('--c5').trim(),dark=css.getPropertyValue('--c4').trim();
    ctx.clearRect(0,0,canvas.width,canvas.height);const warmth=+$('#paper-warmth').value/100;
    const glow=ctx.createRadialGradient(700,480,120,700,520,760);glow.addColorStop(0,'rgba(226,181,132,'+(.08+warmth*.17)+')');glow.addColorStop(.65,'rgba(226,181,132,.04)');glow.addColorStop(1,'rgba(226,181,132,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1400,1100);
    for(const [x,y] of [[110,110],[1290,110],[110,990],[1290,990]])renderIntricateDioramaPlane(ctx,x,y,87,[red,soft,dark],.19+warmth*.12);
    ctx.strokeStyle=soft;ctx.globalAlpha=.3;ctx.lineWidth=1;ctx.strokeRect(106,106,1188,888);ctx.globalAlpha=1;
  }
  $('#paper-warmth').addEventListener('input',()=>{$('#warmth-output').value=$('#paper-warmth').value+'%';$('#exhibit-stage').style.setProperty('--warmth',+$('#paper-warmth').value/100);renderFrame();});
  document.addEventListener('paperpalettechange',renderFrame);
  new ResizeObserver(()=>{fitHero();if(viewer.open)fitViewer();}).observe($('.work-mount'));
  window.addEventListener('resize',()=>{if(viewer.open)fitViewer();});
  artwork.addEventListener('load',fitHero);artwork.addEventListener('error',()=>{$('#work-attribution').textContent='图片暂未载入，请检查本地 assets/works 文件。';});
  selectWork(0);renderFrame();
})();
