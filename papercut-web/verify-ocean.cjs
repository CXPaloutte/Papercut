const assert=require('node:assert/strict');
const path=require('node:path');const fs=require('node:fs');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.argv[2]||'C:/Users/27308/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const home=pathToFileURL(path.join(__dirname,'dist/index.html')).href;
const out=path.join(__dirname,'qa-output');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage();const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(home);await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('settled'));
 assert.equal(await page.locator('#intro-control').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.querySelector('.hero').getAnimations({subtree:true}).length),0);
 assert.equal(await page.locator('#home-collection .collection-card').count(),3);
 assert.equal(await page.locator('.sample-label').count(),3);
 for(const size of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:900},{width:1920,height:1080},{width:2560,height:1080},{width:3840,height:1080}]){
   await page.setViewportSize(size);
   await page.waitForFunction(mobile=>(document.querySelector('.ocean-stage').getAttribute('viewBox')==='0 150 1000 1250')===mobile,size.width<=650);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+size.width);
   const rects=await page.evaluate(()=>({hero:document.querySelector('.hero').getBoundingClientRect().toJSON(),title:document.querySelector('.hero-heading').getBoundingClientRect().toJSON(),fish:[...document.querySelectorAll('.fish-art')].map(n=>n.getBoundingClientRect().toJSON())}));
   assert.ok(Math.round(rects.hero.height)>=size.height,'full viewport scene '+size.width);
   for(const f of rects.fish){assert.ok(f.left>=-8&&f.right<=size.width+8,'fish selection within viewport '+size.width);assert.ok(f.top>120,'fish head is visible '+size.width);}
   if(size.width<=650){
     assert.equal(await page.locator('.fish-placement-right').evaluate(n=>n.parentElement.getAttribute('transform')),'translate(-260 300) scale(.8)');
     const head=await page.locator('.fish-art').nth(1).evaluate(n=>{const p=new DOMPoint(1000,500).matrixTransform(n.getScreenCTM());return {x:p.x,y:p.y};});
     assert.ok(head.x>40&&head.x<size.width-30&&head.y>300&&head.y<rects.hero.height-50,'portrait right fish head visible');
   }
   if(size.width===390||size.width===1440||size.width===2560)await page.screenshot({path:path.join(out,'ocean-'+size.width+'.png')});
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const id of ['fish','dragon','mu','flourishing']){
   await page.locator('[data-open-work="'+id+'"]').first().click();
   await page.locator('#viewer-image').evaluate(i=>i.decode());
   assert.equal(await page.locator('#artwork-viewer').evaluate(d=>d.open),true);
   await page.locator('#zoom-in').click();assert.equal(await page.locator('#zoom-value').textContent(),'150%');
   await page.locator('#viewer-surface').focus();await page.keyboard.press('+');assert.equal(await page.locator('#zoom-value').textContent(),'200%');
   await page.locator('#zoom-reset').click();assert.equal(await page.locator('#zoom-value').textContent(),'100%');
   if(id==='fish')await page.screenshot({path:path.join(out,'ocean-original-viewer.png')});
   await page.keyboard.press('Escape');assert.equal(await page.locator('#artwork-viewer').evaluate(d=>d.open),false);
 }
 for(const id of ['scales','border','color']){
   await page.locator('[data-detail="'+id+'"]').click();await page.locator('#open-detail').click();
   assert.ok(parseInt(await page.locator('#zoom-value').textContent())>100);await page.keyboard.press('Escape');
 }
 await page.locator('#sources-open').click();assert.ok(await page.locator('#sources-dialog').evaluate(d=>d.open));
 await page.locator('#sources-dialog [data-open-work="fish"]').click();assert.ok(await page.locator('#artwork-viewer').evaluate(d=>d.open));await page.keyboard.press('Escape');
 for(const id of ['spring','star','bloom']){await page.locator('[data-pattern="'+id+'"]').click();assert.equal(await page.locator('[data-pattern="'+id+'"]').getAttribute('aria-pressed'),'true');}
 // Existing storage and all editor behavior retain the original keys and format.
 await page.locator('.hero-actions a[href="workshop.html"]').click();await page.waitForSelector('#keyboard-cut');
 await page.waitForFunction(()=>document.querySelector('#structure-title').textContent!=='正在检查连接…');
 const initial=await page.locator('#cut-count').textContent();await page.locator('#keyboard-cut').click();
 assert.notEqual(await page.locator('#cut-count').textContent(),initial);
 await page.locator('#undo').click();assert.equal(await page.locator('#cut-count').textContent(),initial);
 await page.locator('#redo').click();await page.locator('#save').click();assert.equal(await page.locator('#collection-count').textContent(),'1');
 await page.locator('a[href="index.html"]').click();await page.waitForSelector('.hero');
 assert.equal(await page.locator('.saved-count').textContent(),'1');assert.equal(await page.locator('.sample-label').count(),0);
 assert.equal(await page.locator('#home-collection .collection-card').count(),1);
 await page.locator('.collection-link').click();assert.equal(await page.locator('#collection-view').isVisible(),true);
 assert.equal(await page.locator('#collection-grid .pattern-card').count(),1);
 await page.locator('[data-view="workshop"]').first().click();await page.locator('#unfold').click();
 const download=page.waitForEvent('download');await page.locator('#result-export').click();await(await download).saveAs(path.join(out,'ocean-export.png'));
 assert.ok(fs.statSync(path.join(out,'ocean-export.png')).size>10000);await page.keyboard.press('Escape');
 await page.goto(home);await page.evaluate(()=>localStorage.removeItem('paper-blooms-collection-v1'));await page.reload();
 // Load every lazy original before the full-page artifact.
 await page.locator('#collection').scrollIntoViewIfNeeded();await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'ocean-full.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('.ocean-stage').getAttribute('viewBox')==='0 150 1000 1250');await page.locator('#collection').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'ocean-mobile-full.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('opening'));
 await page.locator('#intro-control').click();assert.ok(await page.locator('.hero').evaluate(n=>n.classList.contains('settled')));
 await page.locator('#intro-control').click();assert.ok(await page.locator('.hero').evaluate(n=>n.classList.contains('opening')));
 await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('settled'));
 assert.equal(await page.locator('.wave-front').evaluate(n=>n.parentElement.getAttribute('transform')),'translate(-65 350) scale(.72 1)');
 await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>document.querySelector('.hero').getAnimations({subtree:true}).length),0);
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();
 await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('opening'));await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(out,'ocean-opening.png')});await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('settled'));
 await page.locator('#motion-toggle').click();await page.screenshot({path:path.join(out,'ocean-desktop.png')});
 assert.deepEqual(errors,[],'browser exceptions');assert.deepEqual(failed,[],'missing local assets');
 console.log('PASS: 7 responsive sizes, fullscreen / no overflow, four original viewers, zoom and details, sources, 3 patterns, stored collection round-trip, cut / undo / redo / save / PNG export, skip / replay / settle / pause, reduced motion, mobile layout persistence, zero browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
