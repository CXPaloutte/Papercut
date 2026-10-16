const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
require('./dist/geometry.js');
const G = globalThis.PapercutGeometry;
for (const folds of [4, 6, 8]) {
  const expected = G.polar(150, G.TAU / folds * .3);
  for (let i=0;i<folds;i++) {
    const p=G.rotate([expected[0],expected[1]*(i%2?-1:1)],(-90+(i+i%2)*360/folds)*Math.PI/180);
    const actual=G.canonicalPoint(...p,folds);
    assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-8,'Mirrored sectors must map to the same cut');
  }
}
const connected=G.components(Uint8Array.from([1,1,0,0,0,0,0,0,1]),3,3);
assert.deepEqual(connected.sizes,[0,2,1]);
assert.equal(connected.largest,1);
assert.deepEqual(G.components(new Uint8Array(9),3,3).sizes,[0]);
assert.equal(G.validState({folds:8,color:'#b5382d',name:'test',cuts:G.pattern('bloom',8)}),true);
assert.equal(G.validState({folds:8,color:'url(evil)',name:'test',cuts:[]}),false);
console.log('Geometry checks passed');
if (!process.argv[2]) process.exit(0);
const { chromium } = require(process.argv[2]);
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const output=path.join(__dirname,'qa-output');fs.mkdirSync(output,{recursive:true});
  const context=await browser.newContext({viewport:{width:1440,height:1080},deviceScaleFactor:1,acceptDownloads:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.join(__dirname,'dist/workshop.html')).href);
    await page.waitForFunction(()=>document.querySelector('#structure-title').textContent!=='正在检查连接…');
    await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
    console.log('Initial structure:',await page.locator('#structure-title').textContent());
    const renderMismatch=await page.evaluate(async()=>{
      const G=PapercutGeometry;
      const test={folds:8,color:'#b5382d',name:'overlap',cuts:[G.shape('leaf',130,50,65),G.shape('circle',150,60,55)]};
      const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=a.height=b.width=b.height=360;
      G.renderMask(a.getContext('2d'),test,360);
      const image=new Image();const url=URL.createObjectURL(new Blob([G.artworkSVG(test,'qa-mask')],{type:'image/svg+xml'}));image.src=url;await image.decode();b.getContext('2d').drawImage(image,0,0,360,360);URL.revokeObjectURL(url);
      const aa=a.getContext('2d').getImageData(0,0,360,360).data,bb=b.getContext('2d').getImageData(0,0,360,360).data;
      let mismatch=0,solidMismatch=0;for(let i=3;i<aa.length;i+=4){if((aa[i]>127)!==(bb[i]>127))mismatch++;if(Math.abs(aa[i]-bb[i])>240)solidMismatch++;}
      return {mismatch,solidMismatch};
    });
    console.log('Raster/SVG edge agreement:',renderMismatch);
    assert.ok(renderMismatch.solidMismatch<20,'Visual cut union must agree with structure analysis');
    const initial=await page.locator('#cut-count').textContent();
    await page.locator('#keyboard-cut').click();
    await page.waitForTimeout(200);
    assert.notEqual(await page.locator('#cut-count').textContent(),initial);
    await page.locator('#undo').click();assert.equal(await page.locator('#cut-count').textContent(),initial);
    await page.locator('#redo').click();assert.notEqual(await page.locator('#cut-count').textContent(),initial);
    await page.locator('#save').click();assert.equal(await page.locator('#collection-count').textContent(),'1');
    await page.locator('#unfold').click();assert.equal(await page.locator('#result-dialog').evaluate(el=>el.open),true);
    await page.locator('#work-name').fill('测试窗花');await page.locator('#result-save').click();
    assert.equal(await page.locator('#collection-count').textContent(),'2');
    const pngPromise=page.waitForEvent('download');await page.locator('#result-export').click();const png=await pngPromise;await png.saveAs(path.join(output,'export.png'));
    assert.ok(fs.statSync(path.join(output,'export.png')).size>10000);
    const svgPromise=page.waitForEvent('download');await page.locator('#export-svg').click();const svg=await svgPromise;await svg.saveAs(path.join(output,'export.svg'));
    assert.ok(fs.readFileSync(path.join(output,'export.svg'),'utf8').includes('<mask'));
    await page.waitForTimeout(1050);await page.screenshot({path:path.join(output,'result.png')});
    await page.locator('#result-dialog [data-close]').click();
    await page.locator('[data-view="collection"]').first().click();assert.equal(await page.locator('#collection-grid .pattern-card').count(),2);
    await page.reload();assert.equal(await page.locator('#collection-count').textContent(),'2');assert.equal(await page.locator('#art-title').textContent(),'测试窗花');
    await page.locator('#reset').click();await page.locator('#confirm-ok').click();assert.equal(await page.locator('#cut-count').textContent(),'0 组剪口');
    await page.locator('[data-fold="4"]').click();await page.locator('#confirm-ok').click();assert.equal(await page.locator('[data-fold="4"]').getAttribute('aria-pressed'),'true');
    await page.locator('#reset').click();await page.locator('#confirm-ok').click();
    await page.locator('[data-tool="free"]').click();
    const box=await page.locator('#editor').boundingBox();
    const clickSvg=async(x,y)=>page.mouse.click(box.x+x/600*box.width,box.y+y/600*box.height);
    // A strip from one folded edge to the other detaches the outer paper.
    await clickSvg(300,185);await clickSvg(415,300);await clickSvg(440,300);await clickSvg(300,160);
    await page.locator('#finish-cut').click();await page.waitForTimeout(300);
    assert.match(await page.locator('#structure-title').textContent(),/已分离/);
    assert.equal(await page.locator('#editor image').count(),1);
    await page.screenshot({path:path.join(output,'detached.png'),fullPage:true});
    await page.locator('#undo').click();await page.waitForTimeout(200);assert.equal(await page.locator('#structure-title').textContent(),'纸张连接完整');
    await page.locator('#see-patterns').click();assert.equal(await page.locator('#patterns-view').isVisible(),true);
    await page.locator('#pattern-grid [data-template="0"]').click();await page.locator('#confirm-ok').click();
    await page.locator('[data-tool="leaf"]').click();
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(3000);await page.screenshot({path:path.join(output,'mobile.png'),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Mobile should not overflow');
    await page.locator('#help').evaluate(button=>button.click());assert.equal(await page.locator('#help-dialog').evaluate(el=>el.open),true);
    assert.deepEqual(errors,[],'No browser exceptions');console.log('Browser checks passed: cuts, undo/redo, collection, reload, PNG/SVG, separation, templates, mobile');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
