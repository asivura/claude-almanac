#!/usr/bin/env node
// Generate site/src/data/recent-updates.json from the most recent commits that
// touched features/, guides/, or case-studies/. Runs as a prebuild/predev step
// alongside copy-images.mjs, so the landing page can render a "Recent updates"
// list without shelling out at request time (the site is a static export).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const outFile = path.join(siteRoot, 'src', 'data', 'recent-updates.json');

const COUNT = 5;

function readLog() {
  try {
    const stdout = execFileSync(
      'git',
      [
        'log',
        `-${COUNT}`,
        '--format=%h|%ad|%s',
        '--date=short',
        '--',
        'features/',
        'guides/',
        'case-studies/',
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    return stdout.trim();
  } catch (err) {
    console.warn('[recent-updates] git log failed:', err.message);
    return '';
  }
}

function parseLog(stdout) {
  if (!stdout) return [];
  return stdout
    .split('\n')
    .map((line) => {
      const [hash, date, ...rest] = line.split('|');
      if (!hash || !date) return null;
      return { hash, date, subject: rest.join('|') };
    })
    .filter((entry) => entry !== null);
}

async function main() {
  const entries = parseLog(readLog());
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  console.log(
    `[recent-updates] wrote ${entries.length} entries → ${path.relative(siteRoot, outFile)}`,
  );
}

main().catch((err) => {
  console.error('[recent-updates] failed:', err);
  process.exit(1);
});
