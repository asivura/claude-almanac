#!/usr/bin/env node
// Copy repo-root resources/images/ into site/public/images/ so Next.js can
// serve them from /images/* at runtime. Runs as a prebuild step.
//
// Also runs in dev via a separate script because Next.js dev server does not
// trigger prebuild hooks.
//
// Mirrors the repo layout so contributors keep writing `../resources/images/foo.png`
// in markdown (which works for GitHub preview), and the remark plugin in
// source.config.ts rewrites that to `/images/foo.png` at MDX compile time.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(siteRoot, '..');
const srcDir = path.join(repoRoot, 'resources', 'images');
const destDir = path.join(siteRoot, 'public', 'images');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(srcDir))) {
    console.log(`[copy-images] skipped: ${srcDir} does not exist`);
    return;
  }

  // Wipe destination so deleted upstream images don't linger.
  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });

  // fs.cp is available in Node 16.7+; recursive copy.
  await fs.cp(srcDir, destDir, { recursive: true });

  const entries = await fs.readdir(destDir, { recursive: true });
  const fileCount = entries.filter((e) => !e.includes(path.sep) || true).length;
  console.log(`[copy-images] copied ${fileCount} entries → ${path.relative(siteRoot, destDir)}`);
}

main().catch((err) => {
  console.error('[copy-images] failed:', err);
  process.exit(1);
});
