const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeBrief, validatePlan } = require('./design.cjs');

const DIST = path.join(__dirname, 'dist');
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/geometry.js': ['geometry.js', 'text/javascript; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8']
};
const DEFAULT_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const SYSTEM_PROMPT = `你是剪纸工坊的创意方案设计助手。只输出 JSON，不使用 Markdown。
输出对象：title（24字以内）、explanation（160字以内的当代创意说明）、folds（4、6、8）、color（#b5382d、#94413c、#ad7f35、#426d68 之一）、motifs（4到10个对象）。
每个 motifs 对象包含 shape（leaf、circle、triangle 之一）、radius（35到235）、fraction（0到1）、size（10到50）。
每个 motif 是折叠扇区中的一处镂空剪口，fraction=0 或 1 表示扇区边界，0.5 表示中间。让图案疏密有序，留下较宽的连接区域，避免剪空。作品可以表达用户的心意，但目前只有几何剪口；不得声称生成了鱼、莲花、葫芦等具体传统纹样，也不要编造文化出处或非遗寓意。`;

function sendJson(res, status, body) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4096) throw Object.assign(new Error('请求过长'), { status: 413 });
  }
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error('请求不是有效 JSON'), { status: 400 }); }
}

function createServer({key = process.env.DASHSCOPE_API_KEY, endpoint = process.env.QWEN_API_URL || DEFAULT_ENDPOINT,
    model = process.env.QWEN_MODEL || 'qwen-plus', fetchImpl = fetch} = {}) {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && pathname === '/api/status') {
      return sendJson(res, 200, { available: !!key, model: key ? model : null });
    }
    if (pathname === '/api/design') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: '请使用 POST 请求' });
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        return sendJson(res, 415, { error: '请发送 JSON 请求' });
      }
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) {
        return sendJson(res, 403, { error: '仅接受同站请求' });
      }
      if (!key) return sendJson(res, 503, { error: '尚未配置千问 API 密钥，请联系项目维护者' });
      try {
        const { brief } = await readJson(req);
        const cleanBrief = normalizeBrief(brief);
        const response = await fetchImpl(endpoint, {
          method: 'POST', signal: AbortSignal.timeout(30000),
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, response_format: { type: 'json_object' }, temperature: 0.8,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `创作需求：${cleanBrief}` }] })
        });
        if (!response.ok) throw Object.assign(new Error(`模型服务暂不可用（HTTP ${response.status}）`), { status: 502 });
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') throw new Error('模型未返回设计方案');
        const plan = validatePlan(JSON.parse(content));
        return sendJson(res, 200, { plan, brief: cleanBrief, model });
      } catch (error) {
        const status = error.status || (error instanceof SyntaxError ? 502 : 422);
        const message = error.name === 'TimeoutError' ? '模型响应超时，请重试' :
          error instanceof SyntaxError ? '模型方案格式无效，请重试' : error.message;
        return sendJson(res, status, { error: message });
      }
    }
    if (req.method === 'GET' && STATIC[pathname]) {
      const [filename, mime] = STATIC[pathname];
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
      return fs.createReadStream(path.join(DIST, filename)).pipe(res);
    }
    sendJson(res, 404, { error: '页面不存在' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '127.0.0.1';
  createServer().listen(port, host, () => console.log(`纸上生花运行于 http://${host}:${port}`));
}

module.exports = { createServer };
