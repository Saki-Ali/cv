import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(projectRoot, 'index.html');
const requiredFiles = [
  'index.html',
  'styles.css',
  'script.js',
  'Ali-Saki-CV.pdf',
  'assets/profile.jpeg',
  'assets/favicon.svg'
];

const failures = [];

for (const relativePath of requiredFiles) {
  const fullPath = resolve(projectRoot, relativePath);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, 'utf8');
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const references = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);

  for (const reference of references) {
    if (reference.startsWith('#')) {
      const id = decodeURIComponent(reference.slice(1));
      if (id && !ids.has(id)) failures.push(`Missing page anchor: ${reference}`);
      continue;
    }

    if (/^(?:https?:|mailto:|tel:|data:)/i.test(reference)) continue;

    const localPath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const resolvedPath = resolve(projectRoot, localPath);
    if (!resolvedPath.startsWith(projectRoot) || !existsSync(resolvedPath)) {
      failures.push(`Missing local asset: ${reference}`);
    }
  }
}

const pdfPath = resolve(projectRoot, 'Ali-Saki-CV.pdf');
if (existsSync(pdfPath)) {
  const signature = readFileSync(pdfPath).subarray(0, 5).toString('ascii');
  if (signature !== '%PDF-') failures.push('Ali-Saki-CV.pdf is not a valid PDF file');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Required files, local links, page anchors, and CV PDF are valid.');
