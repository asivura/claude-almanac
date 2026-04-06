/**
 * Validate frontmatter fields in content files against the content taxonomy.
 *
 * Reads every .md file in features/, guides/, case-studies/ (skipping README.md)
 * and checks for required fields per content type. Logs warnings for missing
 * fields but does not fail the build (many fields are still being backfilled).
 *
 * See internals/content-taxonomy.md for the canonical schema.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

const COLLECTIONS = [
  {
    dir: 'features',
    type: 'reference',
    required: ['title', 'description', 'category'],
  },
  {
    dir: 'guides',
    type: 'guide',
    required: [
      'title',
      'description',
      'category',
      'time',
      'difficulty',
      'prerequisites',
      'outcome',
    ],
  },
  {
    dir: 'case-studies',
    type: 'case-study',
    required: [
      'title',
      'description',
      'project',
      'date',
      'duration',
      'author',
      'themes',
      'stack',
      'outcome',
    ],
  },
];

/**
 * Extract YAML frontmatter keys from raw markdown.
 * Returns a Set of top-level key names (does not parse values).
 */
function extractFrontmatterKeys(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return new Set();

  const keys = new Set();
  for (const line of match[1].split('\n')) {
    const keyMatch = line.match(/^([a-zA-Z_][\w-]*):/);
    if (keyMatch) keys.add(keyMatch[1]);
  }
  return keys;
}

let totalWarnings = 0;
let totalFiles = 0;

for (const collection of COLLECTIONS) {
  const dirPath = path.join(ROOT, collection.dir);
  let files;
  try {
    files = await readdir(dirPath);
  } catch {
    console.warn(`⚠  Directory not found: ${collection.dir}/`);
    continue;
  }

  const mdFiles = files.filter(
    (f) => f.endsWith('.md') && f !== 'README.md',
  );

  for (const file of mdFiles) {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    const content = await readFile(filePath, 'utf-8');
    const keys = extractFrontmatterKeys(content);

    const missing = collection.required.filter((k) => !keys.has(k));
    if (missing.length > 0) {
      totalWarnings++;
      console.warn(
        `⚠  ${collection.dir}/${file}: missing frontmatter: ${missing.join(', ')}`,
      );
    }
  }
}

console.log(
  `\nFrontmatter validation: ${totalFiles} files checked, ${totalWarnings} with warnings.`,
);
