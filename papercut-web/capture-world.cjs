// Faithful full-scene and phase captures. A tall scene is stitched with its
// fixed navigation placed at the scene origin, so it is not duplicated midway.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.argv[2]||'C:/Users/27308/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.join(__dirname,'qa-output/world-audit'),home=pathToFileURL(path.join(__dirname,'dist/index.html')).href;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.goto(home);await page.waitForFunction(()=>window.PaperWorld&&document.querySelector('.hero.settled'));
  await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));await document.fonts.ready;});
  async function shot(id,file){
   await page.evaluate(id=>{document.activeElement?.blur();const n=document.getElementById(id);scrollTo(0,n.offsetTop);document.querySelector('.site-nav').style.cssText='position:absolute;top:'+n.offsetTop+'px;left:0;right:0';},id);
   await page.waitForTimeout(100);await page.locator('#'+id).screenshot({path:path.join(out,file)});
   await page.locator('.site-nav').evaluate(n=>n.removeAttribute('style'));
  }
  for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
   await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
   for(const [id,name] of [['home','fish'],['heritage','dragon'],['mu-scene','mu'],['scroll-scene','scroll']]){
    await page.evaluate(()=>{PaperWorld.seek('lotus',1);PaperWorld.seek('dragon',1);PaperWorld.seek('flags',1);});
    if(name==='scroll')await page.locator('#scroll-unroll').fill('100');
    await shot(id,device+'-'+name+'-complete.png');
   }
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('#motion-toggle').evaluate(n=>{if(n.getAttribute('aria-pressed')!=='true')n.click()});
   for(const [kind,id] of [['lotus','home'],['dragon','heritage'],['flags','mu-scene']]){
    for(const [label,p] of [['start',0],['middle',.5],['end',1]]){
     await page.evaluate(([name,p])=>PaperWorld.seek(name,p),[kind,p]);
     await shot(id,device+'-'+kind+'-'+label+'.png');
    }
    if(kind==='lotus'){
     await page.evaluate(()=>PaperWorld.seek('lotus',.76));await shot(id,device+'-lotus-opening.png');
     await page.evaluate(()=>PaperWorld.seek('lotus',1));
    }
   }
   // Sample waves, copy, fish guidance and rooted growth on the same timeline.
   await page.locator('#home').evaluate(n=>scrollTo(0,n.offsetTop));
   await page.evaluate(()=>dispatchEvent(new CustomEvent('paper-replay-hero')));
   for(const [label,p] of [['start',0],['middle',.5],['end',1]]){
    await page.evaluate(p=>{
     const hero=document.querySelector('.hero');
     hero.getAnimations({subtree:true}).forEach(a=>{
      a.pause();const t=a.effect.getTiming();
      if(t.iterations===Infinity){a.currentTime=0;return;}
      a.currentTime=Math.min(Math.max(0,3220*p-(+t.delay||0)),+t.duration-.001)+(+t.delay||0);
     });
     PaperWorld.seek('lotus',Math.min(1,p*3220/3100));
    },p);
    await shot('home',device+'-fish-'+label+'.png');
   }
   await page.emulateMedia({reducedMotion:'reduce'});
  }
  // The mobile opening now runs to its actual ending, rather than the old
  // 2.2 second fallback resetting the pose midway through the fish movement.
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#home').evaluate(n=>scrollTo(0,n.offsetTop));
  await page.locator('#motion-toggle').evaluate(n=>{if(n.getAttribute('aria-pressed')==='true')n.click()});
  await page.evaluate(()=>dispatchEvent(new CustomEvent('paper-replay-hero')));
  await page.waitForTimeout(2400);assert.ok(await page.locator('.hero').evaluate(n=>n.classList.contains('opening')),'no premature mobile reset');
  await page.waitForFunction(()=>document.querySelector('.hero.settled'));
  assert.equal(await page.locator('.lotus-motion').first().getAttribute('data-phase'),'blooming');
  await page.evaluate(()=>dispatchEvent(new CustomEvent('paper-replay-hero')));
  await page.waitForTimeout(200);await page.locator('#intro-control').click();
  assert.equal(await page.locator('.lotus-motion').first().getAttribute('data-phase'),'blooming','skip settles the entire opening');
  await page.evaluate(()=>dispatchEvent(new CustomEvent('paper-replay-hero')));
  await page.waitForTimeout(200);await page.locator('.hero-play-controls [data-hero-play="lotus"]').click();
  await page.waitForTimeout(3350);
  assert.equal(await page.locator('.lotus-motion').first().getAttribute('data-phase'),'petals-opening','independent flower replay is not cut short when the fish finishes');
  await page.waitForTimeout(700);assert.equal(await page.locator('.lotus-motion').first().getAttribute('data-phase'),'blooming');
  console.log('PASS: complete scene and synchronous phase captures; mobile opening completes, replay regrows and skip settles the entire scene.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
