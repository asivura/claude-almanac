// Post-build patch for site/out/llms.txt.
//
// Fumadocs' llms.txt generator creates an index of pages but has no hook
// for adding custom sections or overriding the heading. Until Fumadocs
// exposes a configuration API for custom content, this script patches the
// output at build time.
//
// Patches applied (all idempotent):
//   1. Replace `# Docs` with `# Claude Almanac`
//   2. Insert blockquote summary after the H1
//   3. Insert an "Agent access" section before the page list
//
// Runs as the `postbuild` script in site/package.json — after `next build`
// writes the static export to site/out/.

import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(scriptDir, '..');
const llmsTxtPath = resolve(siteDir, 'out/llms.txt');

const SITE_TITLE = '# Claude Almanac';
const BLOCKQUOTE =
  '> Claude Code feature reference, how-to guides, and case studies — community documentation for Anthropic\'s official AI coding CLI.';
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

  let content = await readFile(llmsTxtPath, 'utf8');
  let changed = false;

  // 1. Replace the default H1 with the site title.
  if (content.includes('# Docs') && !content.includes(SITE_TITLE)) {
    content = content.replace('# Docs', SITE_TITLE);
    changed = true;
    console.log(`[patch-llms-txt] replaced H1 with "${SITE_TITLE}"`);
  }

  // 2. Insert blockquote summary after the H1 (if not already present).
  if (!content.includes(BLOCKQUOTE)) {
    content = content.replace(
      SITE_TITLE + '\n',
      SITE_TITLE + '\n\n' + BLOCKQUOTE + '\n',
    );
    changed = true;
    console.log(`[patch-llms-txt] inserted blockquote summary`);
  }

  // 3. Insert "Agent access" section (if not already present).
  if (content.includes(SECTION_HEADING)) {
    if (!changed) {
      console.log(`[patch-llms-txt] all patches already applied; no change`);
    } else {
      await writeFile(llmsTxtPath, content, 'utf8');
    }
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
  console.log(`[patch-llms-txt] inserted "${SECTION_HEADING}" section`);
}

main().catch((err) => {
  console.error('[patch-llms-txt] failed:', err);
  process.exit(1);
});
