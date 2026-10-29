import { mkdir, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function build() {
  const output = path.join(root, 'dist');
  await mkdir(output, { recursive: true });
  // Explicit allowlist: local PDFs, credentials and learning records never enter the site.
  for (const entry of ['index.html', 'src', 'assets', 'docs', 'LICENSE']) {
    await cp(path.join(root, entry), path.join(output, entry), { recursive: true, force: true });
  }
  await writeFile(path.join(output, '.nojekyll'), '');
  console.log('Static site ready: dist/');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
