// Post-build patch: insert an "Agent access" section into site/out/llms.txt.
//
// Fumadocs' llms.txt generator creates an index of pages but has no hook
// for adding custom sections. Until Fumadocs exposes a configuration API
// for custom content, this script patches the output at build time.
//
// Runs as the `postbuild` script in site/package.json — after `next build`
// writes the static export to site/out/.
//
// Idempotent: skips insertion if the section already exists.

import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(scriptDir, '..');
const llmsTxtPath = resolve(siteDir, 'out/llms.txt');

const SECTION_HEADING = '## Agent access';
const SECTION = `${SECTION_HEADING}

- Any URL on this site responds to \`Accept: text/markdown\` with markdown
- Raw markdown per page at \`/llms.mdx/docs/<slug>/content.md\`
- Full content concatenated: [/llms-full.txt](/llms-full.txt)
- 404 responses also honor \`Accept: text/markdown\`
`;

async function main() {
  try {
    await access(llmsTxtPath);
  } catch {
    console.warn(
      `[patch-llms-txt] ${llmsTxtPath} not found; skipping (did next build run?)`,
    );
    return;
  }

  const content = await readFile(llmsTxtPath, 'utf8');
  if (content.includes(SECTION_HEADING)) {
    console.log(`[patch-llms-txt] section already present; no change`);
    return;
  }

  const lines = content.split('\n');

  // Insert after the H1 / description but before the first content entry
  // (either a `## ` section or a `- ` list item). Fumadocs generates a
  // flat list with no ## sections, so the list-item heuristic is primary.
  // If neither exists, append at the end.
  let insertAt = lines.findIndex(
    (line) => /^##\s/.test(line) || /^-\s/.test(line),
  );
  if (insertAt === -1) insertAt = lines.length;

  const sectionLines = SECTION.split('\n');
  // Ensure blank lines bracketing the inserted section.
  const prefix =
    insertAt > 0 && lines[insertAt - 1] !== '' ? [''] : [];
  const suffix = [''];

  lines.splice(insertAt, 0, ...prefix, ...sectionLines, ...suffix);

  await writeFile(llmsTxtPath, lines.join('\n'), 'utf8');
  console.log(
    `[patch-llms-txt] inserted "${SECTION_HEADING}" section into out/llms.txt`,
  );
}

main().catch((err) => {
  console.error('[patch-llms-txt] failed:', err);
  process.exit(1);
});
