#!/usr/bin/env node
// Generate site/src/data/last-updated.json mapping each content slug to its
// last-modified ISO date (from git log). Runs as a prebuild step so pages can
// display "Updated YYYY-MM-DD" without shelling out at request time.

import { execFileSync } from 'node:child_process';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const outFile = path.join(siteRoot, 'src', 'data', 'last-updated.json');

const CONTENT_DIRS = ['features', 'guides', 'case-studies'];

function getLastUpdated(filePath) {
  try {
    const stdout = execFileSync(
      'git',
      ['log', '-1', '--format=%aI', '--follow', '--', filePath],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function listMarkdown(dir) {
  try {
    const entries = await readdir(dir);
    return entries.filter(
      (name) => name.endsWith('.md') && name !== 'README.md',
    );
  } catch {
    return [];
  }
}

async function main() {
  const result = {};

  for (const dir of CONTENT_DIRS) {
    const absDir = path.join(repoRoot, dir);
    const files = await listMarkdown(absDir);
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const relPath = path.join(dir, file);
      const date = getLastUpdated(relPath);
      if (date) {
        result[slug] = date;
      }
    }
  }

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(
    `[last-updated] wrote ${Object.keys(result).length} entries → ${path.relative(siteRoot, outFile)}`,
  );
}

main().catch((err) => {
  console.error('[last-updated] failed:', err);
  process.exit(1);
});
