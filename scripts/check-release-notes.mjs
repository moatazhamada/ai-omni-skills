import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const notes = readFileSync(new URL('../RELEASE_NOTES.md', import.meta.url), 'utf8');

if (!notes.includes('v' + pkg.version)) {
  console.error('RELEASE_NOTES.md does not mention v' + pkg.version + ' — update it before releasing.');
  process.exit(1);
}

console.log('RELEASE_NOTES.md is current for v' + pkg.version);
