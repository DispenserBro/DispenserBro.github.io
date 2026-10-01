import { cp, rm, stat } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'dist');
const destination = resolve(root, 'docs');

if (relative(root, destination) !== 'docs') {
  throw new Error('Unexpected GitHub Pages output directory');
}
await stat(resolve(source, 'index.html'));
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log('GitHub Pages output: docs/');
