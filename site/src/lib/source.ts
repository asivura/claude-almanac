import {
  caseStudy as caseStudyCollection,
  guide as guideCollection,
  reference as referenceCollection,
} from 'collections/server';
import {
  type InferPageType,
  loader,
  multiple,
} from 'fumadocs-core/source';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// Combine three collections (reference, guide, case-study) into a single
// /docs/<slug> namespace. Slugs must be unique across all three directories.
// The `multiple` helper unifies them and injects a `type` discriminator on
// each page's data based on the collection key ("reference" | "guide" |
// "caseStudy"). A slug collision would surface as a duplicate-route error
// from Next.js during build.
//
// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: multiple({
    reference: referenceCollection.toFumadocsSource(),
    guide: guideCollection.toFumadocsSource(),
    caseStudy: caseStudyCollection.toFumadocsSource(),
  }),
  plugins: [],
});

// Explicit slug-collision check across the three collections.
// Runs at module load (server start / build time). Throws with a clear
// message listing the colliding slugs so the failure is actionable.
(function assertNoSlugCollisions() {
  const seen = new Map<string, string>();
  const collisions: Array<{ slug: string; existing: string; duplicate: string }> = [];

  for (const page of source.getPages()) {
    const slug = page.url;
    const where = page.absolutePath ?? page.path;
    const prior = seen.get(slug);
    if (prior !== undefined && prior !== where) {
      collisions.push({ slug, existing: prior, duplicate: where });
    } else {
      seen.set(slug, where);
    }
  }

  if (collisions.length > 0) {
    const lines = collisions.map(
      (c) => `  ${c.slug}\n    existing: ${c.existing}\n    duplicate: ${c.duplicate}`,
    );
    throw new Error(
      `Slug collision across content collections (features/, guides/, case-studies/).\n` +
        `Each slug must be unique within /docs/:\n` +
        lines.join('\n'),
    );
  }
})();

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
