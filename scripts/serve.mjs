import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const project = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = process.argv[2] === 'dist' ? path.join(project, 'dist') : project;
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const allowed = new Set(['index.html', 'src', 'assets', 'docs', 'LICENSE']);
export function safePath(url) {
  const name = decodeURIComponent(new URL(url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const parts = name.split(/[\\/]/);
  if (!allowed.has(parts[0]) || parts.some(p => p.startsWith('.') || p === '..')) return null;
  const file = path.resolve(root, name);
  return file.startsWith(root + path.sep) ? file : null;
}
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const file = safePath(req.url);
    if (!file || !(await stat(file)).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
