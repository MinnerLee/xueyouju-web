import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable } from 'node:stream';
import { apiResponse } from '../server/api.js';
try { process.loadEnvFile(path.resolve(fileURLToPath(new URL('../.env', import.meta.url)))); } catch (error) { if (error.code !== 'ENOENT') throw error; }

const project = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = process.argv[2] === 'dist' ? path.join(project, 'dist') : project;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const localOnly = ['127.0.0.1', 'localhost', '::1'].includes(host);
if (!localOnly && (!process.env.APP_ACCESS_TOKEN || process.env.APP_ACCESS_TOKEN.length < 24)) throw new Error('Non-local hosting requires APP_ACCESS_TOKEN with at least 24 characters.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.md': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const allowed = new Set(['index.html', 'src', 'shared', 'assets', 'docs', 'LICENSE']);
export function safePath(url) {
  const name = decodeURIComponent(new URL(url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const parts = name.split(/[\\/]/);
  if (!allowed.has(parts[0]) || parts.some(p => p.startsWith('.') || p === '..')) return null;
  const file = path.resolve(root, name);
  return file.startsWith(root + path.sep) ? file : null;
}
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    const abort = new AbortController();
    res.on('close', () => abort.abort());
    try {
      const request = new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers: req.headers, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: Readable.toWeb(req), duplex: 'half' } : {}), signal: abort.signal });
      const response = await apiResponse(request, { ...process.env, LOCAL_ONLY: String(localOnly), SITE_PRIVATE_MODE: 'false' });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).on('error', () => res.destroy()).pipe(res); else res.end();
    } catch { if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: '服务暂时不可用。' })); }
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const file = safePath(req.url);
    if (!file || !(await stat(file)).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, host, () => console.log(`Local: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
