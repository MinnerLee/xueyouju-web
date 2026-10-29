import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { root, build } from './build.mjs';

await build();
await mkdir(path.join(root, 'release'), { recursive: true });
try {
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' });
  if (dirty.trim()) throw new Error('Commit changes before packaging to ensure the archive matches HEAD.');
  execFileSync('git', ['archive', '--format=zip', '--prefix=xueyouju-web/', '-o', path.join(root, 'release', 'xueyouju-web-source.zip'), 'HEAD'], { cwd: root, stdio: 'inherit' });
  console.log('Source package: release/xueyouju-web-source.zip');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
