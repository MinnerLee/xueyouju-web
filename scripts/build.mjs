import { mkdir, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function build() {
  const output = path.join(root, 'dist');
  await mkdir(output, { recursive: true });
  // Explicit allowlist: local PDFs, credentials and learning records never enter the site.
  for (const entry of ['index.html', 'src', 'shared', 'assets', 'docs', 'LICENSE']) {
    await cp(path.join(root, entry), path.join(output, entry), { recursive: true, force: true });
  }
  const vendor = path.join(output, 'assets/vendor');
  await mkdir(vendor, { recursive: true });
  for (const [from, to] of [
    ['marked/lib/marked.esm.js', 'marked.esm.js'],
    ['dompurify/dist/purify.es.mjs', 'purify.es.mjs'],
    ['katex/dist/katex.mjs', 'katex.mjs'],
    ['katex/dist/katex.min.css', 'katex.min.css'],
    ['katex/dist/fonts', 'fonts'],
    ['marked/LICENSE', 'marked-LICENSE'],
    ['dompurify/LICENSE', 'dompurify-LICENSE'],
    ['dompurify/LICENSE-MPL', 'dompurify-LICENSE-MPL'],
    ['katex/LICENSE', 'katex-LICENSE'],
  ]) await cp(path.join(root, 'node_modules', from), path.join(vendor, to), { recursive: true });
  await writeFile(path.join(output, '.nojekyll'), '');
  console.log('Static site ready: dist/');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
