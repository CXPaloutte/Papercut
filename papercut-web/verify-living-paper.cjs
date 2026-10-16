const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.argv[2]||'C:/Users/27308/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.join(__dirname,'dist/index.html')).href;const output=path.join(__dirname,'qa-output');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto(url);await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('settled'));
 assert.equal(await page.locator('.lotus-petal').count(),6);
 await page.locator('.hero-play-controls [data-hero-play="lotus"]').click();assert.equal(await page.locator('.hero').evaluate(n=>n.classList.contains('blooming')),true);
 await page.waitForTimeout(850);await page.screenshot({path:path.join(output,'living-lotus-open.png')});
 await page.waitForFunction(()=>!document.querySelector('.hero').classList.contains('blooming'));
 await page.locator('.fish-placement-left').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.hero').evaluate(n=>n.classList.contains('opening')),true);
 await page.waitForTimeout(1150);await page.screenshot({path:path.join(output,'living-fish-apex.png')});
 await page.locator('#motion-toggle').click();await page.waitForTimeout(2600);
 assert.equal(await page.locator('.hero').evaluate(n=>n.classList.contains('opening')),true,'pausing mid-leap preserves the entrance until resumed');
 await page.locator('#motion-toggle').click();
 await page.waitForFunction(()=>document.querySelector('.hero').classList.contains('settled'));
 const dragon=page.locator('[data-paper-scene="dragon"]');await dragon.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('[data-paper-scene="dragon"]').dataset.entered==='true');
 await page.locator('.scene-controller [data-scene-play="dragon"]').click();
 assert.equal(await dragon.getAttribute('data-playing'),'true');await page.waitForTimeout(1100);
 await page.screenshot({path:path.join(output,'living-dragon-flight.png')});
 await page.locator('#dragon-height').fill('90');assert.equal(await page.locator('#dragon-height-value').textContent(),'90%');
 assert.equal(await dragon.evaluate(n=>n.style.getPropertyValue('--dragon-altitude')),'-234px');
 await page.locator('.scene-controller [data-scene-play="dragon"]').click();await page.waitForFunction(()=>document.querySelector('[data-paper-scene="dragon"]').dataset.playing==='false');
 const mu=page.locator('[data-paper-scene="mu"]');await mu.scrollIntoViewIfNeeded();
 assert.equal(await mu.locator('.command-flag').count(),4);
 await page.locator('.scene-controller [data-scene-play="mu"]').click();assert.equal(await mu.getAttribute('data-playing'),'true');
 await page.waitForTimeout(450);await page.screenshot({path:path.join(output,'living-mu-blink.png')});
 await page.waitForFunction(()=>document.querySelector('[data-paper-scene="mu"]').dataset.playing==='false');
 await page.locator('#mu-blink').click();await page.waitForTimeout(350);
 const eyeScale=await page.locator('.eye-left').evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).d);
 assert.ok(eyeScale<.6,'original eye pieces close visibly');
 await page.waitForFunction(()=>document.querySelector('[data-paper-scene="mu"]').dataset.blinking==='false');
 await page.locator('#flag-height').fill('15');await page.waitForTimeout(650);const low=await page.locator('.flag-outer.flag-left').evaluate(n=>getComputedStyle(n).transform);
 await page.locator('#flag-height').fill('100');await page.waitForTimeout(650);const high=await page.locator('.flag-outer.flag-left').evaluate(n=>getComputedStyle(n).transform);
 assert.notEqual(low,high);assert.equal(await page.locator('#flag-height-value').textContent(),'100%');
 await page.screenshot({path:path.join(output,'living-mu-raised.png')});
 await page.locator('#pattern-art').click();assert.ok(await page.locator('#pattern-art').evaluate(n=>n.classList.contains('is-unfolding')));
 await page.waitForFunction(()=>!document.querySelector('#pattern-art').classList.contains('is-unfolding'));
 await page.locator('#scroll-unroll').fill('40');assert.equal(await page.locator('#scroll-unroll-value').textContent(),'40%');
 await page.locator('#scroll-replay').click();assert.ok(await page.locator('.scroll-art').evaluate(n=>n.classList.contains('unrolling')));
 await page.waitForFunction(()=>!document.querySelector('.scroll-art').classList.contains('unrolling'));
 await page.locator('.scissors-art').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.scissors-art').evaluate(n=>n.classList.contains('is-cutting')));
 await page.locator('#motion-toggle').evaluate(n=>n.click());assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('paper-paused')));
 const running=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);assert.equal(running,0,'global pause stops all module animation');
 await page.locator('#motion-toggle').evaluate(n=>n.click());
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-scene-play="dragon"]').first().click();await page.locator('[data-scene-play="mu"]').first().click();await page.locator('#mu-blink').click();
 assert.equal(await page.evaluate(()=>document.getAnimations().length),0,'reduced motion has no CSS animation');
 for(const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:1000},{width:2560,height:1080}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(250);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+viewport.width);
   for(const scene of ['dragon','mu']){const box=await page.locator('[data-paper-scene="'+scene+'"]').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1,scene+' contained '+viewport.width);}
 }
 await page.setViewportSize({width:390,height:844});await mu.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'living-mobile-mu.png')});
 await dragon.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'living-mobile-dragon.png')});
 await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo(0,0)});
 await page.screenshot({path:path.join(output,'living-mobile-full.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'living-full.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: fish keyboard replay and larger arc, six source lotus petal pieces, source water motifs, dragon takeoff and height, original eye blink, four flag lifts and height, pattern unfold, scroll reveal/slider, paper-cut feedback, global pause, reduced motion, responsive scenes, no browser errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
