const test = require('node:test');
const assert = require('node:assert/strict');
const {validatePlan, normalizeBrief} = require('./design.cjs');
const {createServer} = require('./server.cjs');

const sample = {
  title:'团圆窗花', explanation:'用柳叶与圆孔的节奏表达团聚的心意。', folds:8, color:'#b5382d',
  motifs:[
    {shape:'leaf',radius:125,fraction:.5,size:40},
    {shape:'circle',radius:200,fraction:.4,size:18},
    {shape:'triangle',radius:165,fraction:0,size:24},
    {shape:'leaf',radius:70,fraction:.8,size:21}
  ]
};

test('only editable motifs and bounded values are accepted', () => {
  assert.deepEqual(validatePlan(sample), sample);
  assert.throws(()=>validatePlan({...sample,motifs:[{...sample.motifs[0],shape:'script'},...sample.motifs.slice(1)]}));
  assert.throws(()=>validatePlan({...sample,motifs:[{...sample.motifs[0],radius:999},...sample.motifs.slice(1)]}));
  assert.equal(normalizeBrief('  给朋友一幅团圆窗花  '),'给朋友一幅团圆窗花');
  assert.throws(()=>normalizeBrief('短'));
});

async function withServer(options, action) {
  const server = createServer(options);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try { await action(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve=>server.close(resolve)); }
}

test('same-origin endpoint validates input and returns a usable AI plan', async () => {
  let upstreamRequest;
  await withServer({key:'test-key',model:'qwen-plus',fetchImpl:async (_url, options)=>{
    upstreamRequest=options;
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(sample)}}]})};
  }},async base=>{
    const status=await (await fetch(base+'/api/status')).json();
    assert.equal(status.available,true);
    const response=await fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:'给朋友一幅团圆窗花'})});
    assert.equal(response.status,200);
    const result=await response.json();
    assert.deepEqual(result.plan,sample);
    assert.equal(result.model,'qwen-plus');
    const sent=JSON.parse(upstreamRequest.body);
    assert.equal(sent.response_format.type,'json_object');
    assert.match(sent.messages[1].content,/给朋友一幅团圆窗花/);
    assert.equal(upstreamRequest.headers.Authorization,'Bearer test-key');
    const bad=await fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:'短'})});
    assert.equal(bad.status,422);
    const crossOrigin=await fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://example.org'},body:JSON.stringify({brief:'给朋友设计窗花'})});
    assert.equal(crossOrigin.status,403);
    const html=await (await fetch(base+'/')).text();
    assert.match(html,/id="ai-generate"/);
    assert.doesNotMatch(html,/test-key/);
  });
});

test('missing key and invalid model output fail visibly',async()=>{
  await withServer({key:''},async base=>{
    const response=await fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(response.status,503);
  });
  await withServer({key:'test',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({...sample,folds:7})}}]})})},async base=>{
    const response=await fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:'给朋友设计窗花'})});
    assert.equal(response.status,422);
    assert.match((await response.json()).error,/折法/);
  });
});
