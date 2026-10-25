/*
 * Checks the first download of the app after `npm run build` (CI runs it):
 * - the sentences (sentences.js and what it imports, most of the app's data)
 *   are not in it: the menu loads them with import() when a sentence or
 *   grammar practice, or the sentences tab of Learning Progress, is opened
 * - it stays under BUDGET_KB, gzipped
 * A static import of sentences.js (or bunpou.js, dictionary.js, materi.js)
 * from the menu, the navbar or Learning Progress puts them back in it.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const BUDGET_KB = 190;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = path.join(root, 'build');
const html = fs.readFileSync(path.join(build, 'index.html'), 'utf8');
const entry = html.match(/<script type="module"[^>]*src="\.?\/?([^"]+\.js)"/);
if (!entry) {
  console.error('check-bundle: no module script in build/index.html, run npm run build first');
  process.exit(1);
}
const code = fs.readFileSync(path.join(build, entry[1]), 'utf8');
const problems = [];

// A few sentences of the generated data: none may be in the first download
const generated = fs.readFileSync(path.join(root, 'src/generatedSentences.js'), 'utf8');
const markers = [...generated.matchAll(/"jp_character":\s*"([^"]+)"/g)].slice(0, 5).map(match => match[1]);
if (markers.length === 0) problems.push('no sentence found in src/generatedSentences.js to look for');
const found = markers.filter(marker => code.includes(marker));
if (found.length > 0) {
  problems.push(`the sentences are in the first download (${entry[1]} contains ${found.join(', ')}): ` +
    'load sentences.js with import() where the menu, the navbar or Learning Progress needs it');
}

const gzipKb = zlib.gzipSync(code).length / 1024;
if (gzipKb > BUDGET_KB) {
  problems.push(`${entry[1]} is ${gzipKb.toFixed(1)} kB gzipped, over the ${BUDGET_KB} kB budget`);
}

if (problems.length > 0) {
  problems.forEach(problem => console.error(`check-bundle: ${problem}`));
  process.exit(1);
}
console.log(`check-bundle: ${entry[1]} is ${gzipKb.toFixed(1)} kB gzipped (budget ${BUDGET_KB} kB), without the sentences`);
