(function(){
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const hero=$('.hero'),dragon=$('[data-paper-scene="dragon"]'),mu=$('[data-paper-scene="mu"]');
 const originals=JSON.parse($('#dragon-rig-data').textContent).points;
 const jobs=new Map();let frame=0,last=0,paused=false,scrollFrame=0,openingFlower=false;
 let mobile=innerWidth<=650,base=originals.map(p=>p.slice()),currentDragon=1,currentLotus=1,currentFlag=1;
 const active=new Set([hero]);
 const svgNS='http://www.w3.org/2000/svg';
 const tailMaps=$$('.fish-art').map((image,index)=>{
   const filter=document.createElementNS(svgNS,'filter');filter.id='continuous-tail-'+index;
   filter.setAttribute('x','-8%');filter.setAttribute('y','-8%');filter.setAttribute('width','116%');filter.setAttribute('height','116%');filter.setAttribute('color-interpolation-filters','sRGB');
   const map=document.createElementNS(svgNS,'feImage');
   const gradient='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="256"><defs><linearGradient id="m" x2="0" y2="1"><stop offset="0" stop-color="rgb(128,128,128)"/><stop offset=".54" stop-color="rgb(128,128,128)"/><stop offset=".76" stop-color="rgb(153,128,128)"/><stop offset="1" stop-color="rgb(230,128,128)"/></linearGradient></defs><path fill="url(#m)" d="M0 0h32v256H0z"/></svg>';
   map.setAttribute('href','data:image/svg+xml,'+encodeURIComponent(gradient));map.setAttribute('preserveAspectRatio','none');map.setAttribute('width','100%');map.setAttribute('height','100%');map.setAttribute('result','bend');
   const displacement=document.createElementNS(svgNS,'feDisplacementMap');displacement.setAttribute('in','SourceGraphic');displacement.setAttribute('in2','bend');displacement.setAttribute('xChannelSelector','R');displacement.setAttribute('yChannelSelector','G');displacement.setAttribute('scale','0');
   filter.append(map,displacement);$('.ocean-stage defs').append(filter);image.setAttribute('filter','url(#'+filter.id+')');return displacement;
 });
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 function announce(s){$('#paper-interaction-status').textContent=s;}
 function key(node,fn){node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});}
 function wake(){if(!frame&&!paused&&!document.hidden&&jobs.size){last=performance.now();frame=requestAnimationFrame(tick);}}
 function tick(now){
   frame=0;const dt=Math.min(50,now-last);last=now;let eligible=false;
   for(const [name,job] of jobs){
     if(!active.has(job.scene))continue;eligible=true;
     job.elapsed=Math.min(job.duration,job.elapsed+dt);const p=job.elapsed/job.duration;job.update(p);job.scene.dataset[name+'Progress']=p.toFixed(3);
     if(p>=1){jobs.delete(name);job.end?.();}
   }
   if(eligible&&jobs.size&&!paused&&!document.hidden)frame=requestAnimationFrame(tick);
 }
 function animate(name,scene,duration,update,end){
   jobs.delete(name);if(reduced.matches){update(1);end?.();return;}
   update(0);jobs.set(name,{scene,duration,elapsed:0,update,end});wake();
 }
 function resume(){if(paused)$('#motion-toggle').click();}

 // Rooted flower geometry: the stem tip, calyx and every petal share the
 // exact same root point. Petal curves open; no image sectors fly apart.
 const lotus=$$('.lotus-motion').map(n=>({node:n,stem:n.querySelector('.growing-stem'),tip:n.querySelector('.lotus-tip'),petals:[...n.querySelectorAll('.grown-petal')]}));
 function drawLotus(p){
   currentLotus=p;const grow=ease((p-.025)/.49),open=ease((p-.51)/.45);
   lotus.forEach((f,index)=>{
     const len=f.stem.getTotalLength(),g=ease(Math.max(0,grow-index*.035));const point=f.stem.getPointAtLength(len*g);
     f.stem.style.strokeDasharray=String(len);f.stem.style.strokeDashoffset=String(len*(1-g));
     f.tip.setAttribute('transform',`translate(${point.x} ${point.y})`);
     f.petals.forEach(petal=>{
       const angle=+petal.dataset.angle*open,h=61+101*open,w=18+39*open;
       petal.setAttribute('transform',`rotate(${angle})`);
       const d=`M0 0C${-w*.25} ${-h*.28} ${-w} ${-h*.6} 0 ${-h}C${w} ${-h*.6} ${w*.25} ${-h*.28} 0 0Z M-4 ${-h*.16}Q${-w*.45} ${-h*.46} -4 ${-h*.73}Q${-w*.12} ${-h*.44} -4 ${-h*.16}Z M8 ${-h*.18}Q${w*.48} ${-h*.44} 10 ${-h*.69}Q${w*.26} ${-h*.42} 8 ${-h*.18}Z`;
       petal.querySelector('path').setAttribute('d',d);
     });
     f.node.dataset.phase=p<.51?'stem-and-bud':p<.96?'petals-opening':'blooming';
   });
 }
 function bloom(user=true){if(user)resume();openingFlower=!user;animate('lotus',hero,user?3900:3100,drawLotus);if(user)announce('花茎从水面长起，花苞随茎升高，花瓣围绕共同花托绽放。');}
 function layout(){
   mobile=innerWidth<=650;
   const positions=mobile?{
    '.lotus-placement-left':'translate(100 1260) scale(.72)', '.lotus-placement-right':'translate(905 1290) scale(.68)',
    '.source-water-left':'translate(-110 1120) scale(.84)', '.source-water-right':'translate(565 1190) scale(.8)'
   }:{'.lotus-placement-left':'translate(130 925) scale(.82)', '.lotus-placement-right':'translate(1465 935) scale(.8)', '.source-water-left':'translate(-60 855)', '.source-water-right':'translate(1120 870)'};
   Object.entries(positions).forEach(([s,t])=>$(s).setAttribute('transform',t));
   base=originals.map(([x,y])=>mobile?[x*.78,y*1.45+90]:[x,y]);
   $('.restored-dragon').setAttribute('viewBox',mobile?'0 0 1250 1600':'0 0 1600 1100');
   drawDragon(currentDragon);drawLotus(currentLotus);drawFlags(currentFlag);
 }
 // The body is one continuous contour, regenerated from a smoothly changing
 // centreline. Scales, fins, limbs and neck all follow that same centreline.
 function bodyShape(points){
   const sides=[[],[]];
   for(let i=0;i<points.length;i++){
     const [x,y]=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
     const nx=-(b[1]-a[1])/l,ny=(b[0]-a[0])/l,t=Math.min(1,i/32),w=(44*t*t*(3-2*t)+9*i/(points.length-1))*(mobile?.8:1);
     sides[0].push(`${(x+nx*w).toFixed(2)} ${(y+ny*w).toFixed(2)}`);sides[1].push(`${(x-nx*w).toFixed(2)} ${(y-ny*w).toFixed(2)}`);
   }
   return 'M'+sides[0].concat(sides[1].reverse()).join('L')+'Z';
 }
 const stations=$$('.dragon-scale,.dragon-fin,.dragon-limb');
 function drawDragon(p){
   currentDragon=p;const pts=base.map(([x,y],i)=>{
     const s=i/(base.length-1),lag=(1-s)*.24,q=Math.max(0,Math.min(1,(p-lag)/(1-lag)));
     const envelope=Math.sin(Math.PI*q)**2;
     return [x+Math.sin(q*Math.PI*2)*19*(.35+s*.65),y-envelope*(mobile?57:66)*(.6+.4*s)];
   });
   $('.dragon-silhouette').setAttribute('d',bodyShape(pts));
   stations.forEach(node=>{
     const i=+node.dataset.index,[x,y]=pts[i],a=pts[i-1],b=pts[i+1],angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
     node.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})${mobile?' scale(.8)':''}`);
   });
   const head=pts[pts.length-1],a=pts[pts.length-2],angle=Math.atan2(head[1]-a[1],head[0]-a[0])*180/Math.PI+35;
   $('.dragon-head-whole').setAttribute('transform',`translate(${head[0]} ${head[1]}) rotate(${angle})${mobile?' scale(.86)':''}`);
   const height=+$('#dragon-height').value;
   $('.dragon-rig').setAttribute('transform',`translate(0 ${-(height-35)*(mobile?.5:.85)})`);
 }
 function fly(user=true){if(user)resume();dragon.dataset.entered='true';dragon.dataset.playing='true';animate('dragon',dragon,3900,drawDragon,()=>dragon.dataset.playing='false');if(user)announce('龙首先起，连续龙身沿曲线跟随，尾部稍后回应。');}
 $('#dragon-height').addEventListener('input',e=>{$('#dragon-height-value').value=e.target.value+'%';drawDragon(currentDragon);});

 // Four triangular back flags have fixed waist anchors. Each cloth has a
 // fixed hoist edge; bending grows towards the free edge and lags at the tip.
 const flags=$$('.command-flag');
 function drawFlags(p){
   currentFlag=p;const amount=+$('#flag-height').value/100;
   flags.forEach((node,index)=>{
     const sign=+node.dataset.sign,outer=node.dataset.outer==='true',delay=index*.065;
     const q=Math.max(0,Math.min(1,(p-delay)/(1-delay)));
     let lift=q<.12?ease(q/.12)*.12:q<.65?.12+.94*ease((q-.12)/.53):q<.82?1.06:1.06-.06*ease((q-.82)/.18);
     const angle=sign*((outer?36:19)-lift*amount*(outer?10:9));node.setAttribute('transform',`rotate(${angle})`);
     const weight=Math.sin(Math.PI*q)**2,bend=Math.sin(q*Math.PI*2-index*.4)*8*weight;
     const tipLag=Math.sin((q-.065)*Math.PI*2-index*.4)*5*weight;
     node.querySelector('.flag-cloth').setAttribute('d',`M0-680Q145 ${-656+bend*.45} 280 ${-565+bend}Q164 ${-469+bend*.45} 0-382Z`);
     node.querySelector('.flag-border').setAttribute('d',`M12-659Q144 ${-635+bend*.43} 250 ${-565+bend*.9}Q142 ${-485+bend*.43} 12-402Z`);
     node.querySelector('.flag-pattern').setAttribute('transform',`translate(0 ${bend*.2})`);
     node.querySelector('.flag-tail').setAttribute('d',`M253 ${-573+bend*.9}Q286 ${-557+tipLag} 304 ${-582+tipLag}M248 ${-554+bend*.9}Q280 ${-535+tipLag} 297 ${-557+tipLag}`);
   });
 }
 function muster(user=true){if(user)resume();mu.dataset.entered='true';mu.dataset.playing='true';animate('flags',mu,4300,drawFlags,()=>mu.dataset.playing='false');blink(false);if(user)announce('靠旗固定在背后腰位，错时抬升，短暂停顿后轻缓回落。');}
 $('#flag-height').addEventListener('input',e=>{$('#flag-height-value').value=e.target.value+'%';jobs.delete('flags');drawFlags(1);});
 function blink(user=true){if(user)resume();if(reduced.matches)return;mu.classList.remove('blinking');void mu.offsetWidth;mu.classList.add('blinking');mu.dataset.blinking='true';}
 mu.addEventListener('animationend',e=>{if(e.target.classList.contains('eye-right')){mu.classList.remove('blinking');mu.dataset.blinking='false';}});
 $('#mu-blink').addEventListener('click',()=>blink());
 $$('[data-scene-play]').forEach(b=>b.addEventListener('click',()=>b.dataset.scenePlay==='dragon'?fly():muster()));
 $$('[data-hero-play]').forEach(node=>{const fn=()=>{
   if(node.dataset.heroPlay==='lotus'){bloom();return;}resume();dispatchEvent(new CustomEvent('paper-replay-hero'));announce('双鱼头部引导跃起，身体跟随，尾部轻摆后缓冲回落。');
 };node.addEventListener('click',fn);if(node.tagName.toLowerCase()==='g')key(node,fn);});
 addEventListener('paper-intro-started',()=>{
   bloom(false);animate('fishFlex',hero,3300,p=>tailMaps.forEach((n,i)=>{const q=Math.max(0,Math.min(1,(p-.16-i*.07)/(.84-i*.07)));n.setAttribute('scale',String(Math.sin(q*Math.PI*2)*Math.sin(q*Math.PI)*16*(i?-1:1)));}));
 });
 addEventListener('paper-intro-finished',()=>{
   if(openingFlower){jobs.delete('lotus');drawLotus(1);openingFlower=false;}
   jobs.delete('fishFlex');tailMaps.forEach(n=>n.setAttribute('scale','0'));
 });

 const scroll=$('.scroll-art');let manualScroll=false;
 function setScroll(value){value=Math.max(15,Math.min(100,+value));$('#scroll-unroll').value=value;$('#scroll-unroll-value').value=Math.round(value)+'%';scroll.style.setProperty('--unroll',value+'%');}
 $('#scroll-unroll').addEventListener('input',e=>{manualScroll=true;jobs.delete('unroll');setScroll(e.target.value);});
 $('#scroll-replay').addEventListener('click',()=>{resume();manualScroll=true;animate('unroll',$('#scroll-scene'),3400,p=>setScroll(15+85*ease(p)));});
 function progress(){
   scrollFrame=0;const h=innerHeight;
   $$('.world-scene').forEach(scene=>{const r=scene.getBoundingClientRect();if(r.bottom>0&&r.top<h){const p=Math.max(0,Math.min(1,(h-r.top)/(h+r.height)));scene.style.setProperty('--cloud-y',((p-.5)*28)+'px');}});
   if(!manualScroll&&!reduced.matches&&!paused){const r=$('#scroll-scene').getBoundingClientRect();if(r.top<h&&r.bottom>0)setScroll(15+85*ease((h-r.top)/(h*.85)));}
 }
 addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(progress);},{passive:true});
 const observe=new IntersectionObserver(entries=>entries.forEach(e=>{
   if(e.isIntersecting){active.add(e.target);e.target.classList.add('is-in-view');if(e.target===dragon&&!dragon.dataset.entered)fly(false);if(e.target===mu&&!mu.dataset.entered)muster(false);wake();}
   else{active.delete(e.target);e.target.classList.remove('is-in-view');}
   if(e.isIntersecting){$$('.scene-index a').forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+e.target.id)));}
 }),{threshold:.22});[hero,dragon,mu,$('#scroll-scene')].forEach(n=>observe.observe(n));
 function pulse(node,name){if(reduced.matches)return;resume();node.classList.remove(name);void node.offsetWidth;node.classList.add(name);}
 const pattern=$('#pattern-art'),scissors=$('.scissors-art');
 pattern.addEventListener('click',()=>pulse(pattern,'is-unfolding'));key(pattern,()=>pulse(pattern,'is-unfolding'));
 $$('[data-pattern]').forEach(b=>b.addEventListener('click',()=>pulse(pattern,'is-unfolding')));
 scissors.addEventListener('click',()=>pulse(scissors,'is-cutting'));key(scissors,()=>pulse(scissors,'is-cutting'));
 [pattern,scissors].forEach(n=>n.addEventListener('animationend',()=>n.classList.remove('is-unfolding','is-cutting')));
 addEventListener('paper-motion-change',e=>{paused=e.detail.paused;if(paused){cancelAnimationFrame(frame);frame=0;}else wake();});
 document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('paper-background',document.hidden);if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
 reduced.addEventListener('change',()=>{if(reduced.matches){jobs.clear();drawDragon(1);drawLotus(1);drawFlags(1);setScroll(100);mu.classList.remove('blinking');}});
 layout();addEventListener('resize',layout);drawLotus(1);setScroll(100);
 // A deterministic seek is also used by the visual audit to inspect every
 // phase, including replay and a fixed-root / continuous-contour check.
 window.PaperWorld={seek(name,p){p=Math.max(0,Math.min(1,p));jobs.delete(name);({dragon:drawDragon,lotus:drawLotus,flags:drawFlags})[name]?.(p);},replay(name){({dragon:fly,lotus:bloom,flags:muster})[name]?.();},get paused(){return paused;}};
})();
