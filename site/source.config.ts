import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema } from 'fumadocs-core/source/schema';
import path from 'node:path';
import { z } from 'zod';

/**
 * Three content collections feeding a single /docs/ URL namespace.
 * See site-planning/content-taxonomy.md for the source-of-truth schema.
 *
 * Schemas are currently LENIENT: only `title` is derived automatically
 * (from the first H1 or the file basename). Type-specific fields
 * (category, time, difficulty, prerequisites, etc.) are optional because
 * most existing files (as of 2026-04-04) lack frontmatter.
 * See site-planning/frontmatter-gaps.md for the migration checklist.
 */

const referenceCategory = z.enum([
  'core',
  'agents',
  'integrations',
  'security',
  'ci-cd',
  'surfaces',
  'workflows',
  'foundational',
]);

const guideCategory = z.enum([
  'setup',
  'workflow-recipes',
  'integrations',
  'team-workflows',
]);

const difficulty = z.enum(['beginner', 'intermediate', 'advanced']);

// All collections ignore README.md (they're contributor notes).
const contentFiles = ['**/*.md', '**/*.mdx', '!**/README.md'];

// Derive a fallback title from the first `#` H1 line in the source, or from
// the filename. This keeps the schema's `title` field as a required `string`
// (satisfying Fumadocs' PageData contract) even when frontmatter is missing.
function deriveTitle(source: string, filePath: string): string {
  const h1 = source.match(/^#\s+(.+?)\s*$/m);
  if (h1) return h1[1].trim();
  const base = path.basename(filePath, path.extname(filePath));
  return base
    .split(/[-_]/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

// Note: the `type` discriminator is injected by fumadocs-core's `multiple()`
// based on the collection key name — so we export these as `reference`,
// `guide`, `caseStudy` (matching content-taxonomy.md values, minus the dash)
// and omit `type` from the Zod schemas themselves.

export const reference = defineDocs({
  dir: '../features',
  docs: {
    schema: (ctx) =>
      z.object({
        title: z.string().default(deriveTitle(ctx.source, ctx.path)),
        description: z.string().default(''),
        category: referenceCategory.optional(),
        icon: z.string().optional(),
        full: z.boolean().optional(),
      }),
    files: contentFiles,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const guide = defineDocs({
  dir: '../guides',
  docs: {
    schema: (ctx) =>
      z.object({
        title: z.string().default(deriveTitle(ctx.source, ctx.path)),
        description: z.string().default(''),
        category: guideCategory.optional(),
        time: z.string().optional(),
        difficulty: difficulty.optional(),
        prerequisites: z.array(z.string()).optional(),
        outcome: z.string().optional(),
        author: z.string().optional(),
        nextSteps: z
          .array(
            z.union([
              z.string(),
              z.object({ title: z.string(), href: z.string() }),
            ]),
          )
          .optional(),
        icon: z.string().optional(),
        full: z.boolean().optional(),
      }),
    files: contentFiles,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const caseStudy = defineDocs({
  dir: '../case-studies',
  docs: {
    schema: (ctx) =>
      z.object({
        title: z.string().default(deriveTitle(ctx.source, ctx.path)),
        description: z.string().default(''),
        project: z.string().optional(),
        date: z.string().optional(),
        duration: z.string().optional(),
        author: z.string().optional(),
        themes: z.array(z.string()).optional(),
        stack: z.array(z.string()).optional(),
        outcome: z.string().optional(),
        related: z
          .array(
            z.union([
              z.string(),
              z.object({ title: z.string(), href: z.string() }),
            ]),
          )
          .optional(),
        icon: z.string().optional(),
        full: z.boolean().optional(),
      }),
    files: contentFiles,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

// Rewrite image src paths that point into the repo-root `resources/images/`
// folder so the deployed site can serve them from `/images/*` (scripts/copy-images.mjs
// copies them there at prebuild time). Matches any number of leading `../`
// segments because markdown files live at different depths (features/,
// guides/, etc.).
//
// Contributors keep writing `![alt](../resources/images/foo.png)` (which
// renders correctly on GitHub); this plugin handles the site-side rewrite.
//
// MDX node types: `image` from remark-mdx for ![]() syntax, `mdxJsxFlowElement`
// / `mdxJsxTextElement` for JSX <img src="..."> — we handle the first
// (plain markdown images) since that's what the content uses.
interface MdastNode {
  type: string;
  url?: string;
  children?: MdastNode[];
}

function remarkRewriteImagePaths() {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (node.type === 'image' && typeof node.url === 'string') {
        // Match `../<...>resources/images/<rest>`
        const match = node.url.match(/^(?:\.\.\/)+resources\/images\/(.+)$/);
        if (match) {
          node.url = `/images/${match[1]}`;
        }
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) visit(child);
      }
    };
    visit(tree);
  };
}

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkRewriteImagePaths],
  },
});
