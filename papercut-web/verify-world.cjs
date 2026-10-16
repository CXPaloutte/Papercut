const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.argv[2]||'C:/Users/27308/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const home=pathToFileURL(path.join(__dirname,'dist/index.html')).href,out=path.join(__dirname,'qa-output/world-audit');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(home);await page.waitForFunction(()=>window.PaperWorld&&document.querySelector('.hero.settled'));
 assert.equal(await page.locator('.dragon-head-whole image').count(),0,'head is not a photograph pasted onto a different body');
 assert.ok(await page.locator('.dragon-scale').count()>600,'fine source-inspired scales');
 assert.equal(await page.locator('.grown-petal').count(),14);
 assert.equal(await page.locator('.lotus-petal').count(),0,'old triangular image sectors removed');
 const report=[];
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  await page.setViewportSize(viewport);await page.waitForTimeout(250);
  for(const [id,name] of [['home','fish'],['heritage','dragon'],['mu-scene','mu'],['scroll-scene','scroll']]){
   await page.locator('#'+id).evaluate(n=>scrollTo(0,n.offsetTop));
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));});
   if(name==='scroll')await page.locator('#scroll-unroll').fill('100');
   await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+device+' '+name);
   const box=await page.locator('#'+id).boundingBox();assert.ok(box.height>=viewport.height,'full viewport scene '+name);
   await page.locator('#'+id).screenshot({path:path.join(out,device+'-'+name+'-complete.png')});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#motion-toggle').evaluate(n=>{if(n.getAttribute('aria-pressed')!=='true')n.click()});
  for(const [id,kind] of [['home','lotus'],['heritage','dragon'],['mu-scene','flags']]){
   await page.locator('#'+id).evaluate(n=>scrollTo(0,n.offsetTop));
   let stableFace=null,stableAnchors=null;
   for(const [label,p] of [['start',0],['middle',.5],['end',1]]){
    await page.evaluate(([name,p])=>PaperWorld.seek(name,p),[kind,p]);
    if(kind==='lotus'){
      const roots=await page.evaluate(()=>[...document.querySelectorAll('.lotus-motion')].map(n=>{
       const path=n.querySelector('.growing-stem'),len=path.getTotalLength(),offset=parseFloat(path.style.strokeDashoffset),tip=path.getPointAtLength(len-offset);
       const transform=n.querySelector('.lotus-tip').transform.baseVal.consolidate().matrix;
       return {distance:Math.hypot(tip.x-transform.e,tip.y-transform.f),petals:[...n.querySelectorAll('.grown-petal')].map(p=>({d:p.querySelector('path').getAttribute('d'),matrix:{e:p.transform.baseVal.consolidate().matrix.e,f:p.transform.baseVal.consolidate().matrix.f}})),phase:n.dataset.phase};
      }));
      roots.forEach(r=>{assert.ok(r.distance<.002,'flower root follows the stem tip');r.petals.forEach(p=>{assert.ok(p.d.startsWith('M0 0'),'petal begins at common receptacle');assert.equal(p.matrix.e,0);assert.equal(p.matrix.f,0);});});
      if(label==='start')assert.ok(roots.every(r=>r.phase==='stem-and-bud'));
    }
    if(kind==='dragon'){
      const connected=await page.evaluate(()=>{const path=document.querySelector('.dragon-silhouette').getAttribute('d'),m=document.querySelector('.dragon-head-whole').transform.baseVal.consolidate().matrix;return {closed:path.endsWith('Z'),moves:(path.match(/M/g)||[]).length,head:[m.e,m.f],contour:path};});
      assert.ok(connected.closed&&connected.moves===1,'one closed continuous body contour');
      const coords=connected.contour.match(/-?\d+(?:\.\d+)?/g).map(Number),n=JSON.parse(await page.locator('#dragon-rig-data').textContent()).points.length;assert.ok(Math.hypot((coords[(n-1)*2]+coords[n*2])/2-connected.head[0],(coords[(n-1)*2+1]+coords[n*2+1])/2-connected.head[1])<.02,'head remains exactly at neck centreline endpoint');
    }
    if(kind==='flags'){
      const state=await page.evaluate(()=>({anchors:[...document.querySelectorAll('.flag-anchor')].map(n=>n.getAttribute('transform')),face:document.querySelector('.mu-portrait').getAttribute('transform'),hoists:[...document.querySelectorAll('.flag-cloth')].map(n=>n.getAttribute('d')),bodies:[...document.querySelectorAll('.command-flag')].map(n=>{const m=n.transform.baseVal.consolidate().matrix;return [m.e,m.f]})}));
      if(!stableAnchors){stableAnchors=state.anchors;stableFace=state.face;}
      assert.deepEqual(state.anchors,stableAnchors,'waist anchors do not float');assert.equal(state.face,stableFace,'portrait stays stable');
      state.bodies.forEach(p=>assert.deepEqual(p,[0,0],'pole rotates from its fixed waist root'));
      state.hoists.forEach(d=>{assert.ok(d.startsWith('M0-680'));assert.ok(d.endsWith('0-382Z'))});
    }
    await page.locator('#'+id).screenshot({path:path.join(out,device+'-'+kind+'-'+label+'.png')});
    report.push({device,scene:kind,phase:label,progress:p});
   }
  }
  // CSS fish guidance is sampled separately from the mathematical actors.
  await page.locator('#home').evaluate(n=>scrollTo(0,n.offsetTop));await page.evaluate(()=>dispatchEvent(new CustomEvent('paper-replay-hero')));
  for(const [phase,fraction] of [['start',0],['middle',.5],['end',1]]){
   await page.evaluate(f=>{document.querySelectorAll('.fish-jump').forEach(n=>n.getAnimations().forEach(a=>{a.pause();const t=a.effect.getTiming();a.currentTime=+t.delay+(+t.duration)*f;}));},fraction);
   for(const rect of await page.locator('.fish-art').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()))){assert.ok(rect.left>-1&&rect.right<viewport.width+1,'whole fish width visible');assert.ok(rect.top>120,'fish head remains visible');}
   await page.locator('#home').screenshot({path:path.join(out,device+'-fish-'+phase+'.png')});
  }
  // Replay starts the complete causal sequence again, even after seeking its end.
  await page.locator('#motion-toggle').evaluate(n=>{if(n.getAttribute('aria-pressed')==='true')n.click()});
  await page.locator('.hero-play-controls [data-hero-play="lotus"]').click();
  await page.waitForTimeout(150);assert.equal(await page.locator('.lotus-motion').first().getAttribute('data-phase'),'stem-and-bud');
  await page.locator('#motion-toggle').click();const before=await page.locator('.lotus-tip').first().getAttribute('transform');await page.waitForTimeout(200);assert.equal(await page.locator('.lotus-tip').first().getAttribute('transform'),before,'pause freezes growth');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 }
 // Genuine time-driven movement and its delayed deformation, not just seeks.
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#heritage').evaluate(n=>scrollTo(0,n.offsetTop));await page.locator('.world-controls [data-scene-play="dragon"]').click();
 const d0=await page.locator('.dragon-silhouette').getAttribute('d');await page.waitForTimeout(850);assert.notEqual(await page.locator('.dragon-silhouette').getAttribute('d'),d0);
 await page.waitForFunction(()=>document.querySelector('[data-paper-scene="dragon"]').dataset.playing==='false');
 await page.locator('#mu-scene').evaluate(n=>scrollTo(0,n.offsetTop));await page.locator('.world-controls [data-scene-play="mu"]').click();await page.waitForTimeout(1300);
 const angles=await page.locator('.command-flag').evaluateAll(ns=>ns.map(n=>n.getAttribute('transform')));assert.equal(new Set(angles).size,4,'flags have staggered pose');
 await page.waitForFunction(()=>document.querySelector('[data-paper-scene="mu"]').dataset.playing==='false');
 await page.locator('#mu-blink').click();await page.waitForTimeout(360);assert.ok(await page.locator('.eye-left').evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).d)<.6);
 for(const width of [320,390,768,1440,1920,2560]){await page.setViewportSize({width,height:900});await page.waitForTimeout(180);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'responsive '+width);}
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({passed:true,checks:report,errors,failed},null,2));
 console.log('PASS: four open viewport scenes; desktop/mobile start-middle-end images; intact fish bounds; rooted stem/bud/petals; a single deforming dragon contour; fixed hoists/waist anchors; stable face; staggered flags; real playback/replay/pause/reduced motion; six responsive widths; no browser errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
