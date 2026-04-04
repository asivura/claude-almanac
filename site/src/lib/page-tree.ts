import type { Root, Folder, Item, Separator } from 'fumadocs-core/page-tree';
import type { source } from './source';

/**
 * Build the claude-almanac sidebar: three top-level sections
 * (REFERENCE, GUIDES, CASE STUDIES) with category sub-groups per
 * site-planning/content-taxonomy.md.
 *
 * This replaces the auto-generated page tree with a curated structure:
 *   - REFERENCE grouped by `category` frontmatter (Core, Agents, ...)
 *   - GUIDES grouped by `category` frontmatter (Setup, Workflow Recipes, ...)
 *   - CASE STUDIES flat, sorted by `date` frontmatter descending
 *
 * Pages without a `category` field fall into an "Uncategorized" group, so
 * the site still renders cleanly while frontmatter is backfilled
 * (see site-planning/frontmatter-gaps.md).
 */

type AnyPage = ReturnType<typeof source.getPages>[number];

const referenceCategoryOrder = [
  'core',
  'agents',
  'integrations',
  'security',
  'ci-cd',
  'surfaces',
  'workflows',
  'foundational',
] as const;

const referenceCategoryLabels: Record<string, string> = {
  core: 'Core',
  agents: 'Agents',
  integrations: 'Integrations',
  security: 'Security',
  'ci-cd': 'CI/CD',
  surfaces: 'Surfaces',
  workflows: 'Workflows',
  foundational: 'Foundational',
  uncategorized: 'Uncategorized',
};

const guideCategoryOrder = [
  'setup',
  'workflow-recipes',
  'integrations',
  'team-workflows',
] as const;

const guideCategoryLabels: Record<string, string> = {
  setup: 'Setup',
  'workflow-recipes': 'Workflow Recipes',
  integrations: 'Integrations',
  'team-workflows': 'Team Workflows',
  uncategorized: 'Uncategorized',
};

function pageItem(page: AnyPage): Item {
  return {
    $id: page.url,
    type: 'page',
    name: page.data.title,
    url: page.url,
  };
}

function byTitle(a: AnyPage, b: AnyPage): number {
  return a.data.title.localeCompare(b.data.title);
}

function groupByCategory(
  pages: AnyPage[],
  order: readonly string[],
  labels: Record<string, string>,
): Folder[] {
  const byCategory = new Map<string, AnyPage[]>();
  for (const page of pages) {
    // `category` isn't in every collection's schema; read defensively.
    const raw = (page.data as { category?: string }).category;
    const key = raw ?? 'uncategorized';
    const bucket = byCategory.get(key) ?? [];
    bucket.push(page);
    byCategory.set(key, bucket);
  }

  const knownKeys = [...order, 'uncategorized'];
  const folders: Folder[] = [];
  for (const key of knownKeys) {
    const bucket = byCategory.get(key);
    if (!bucket || bucket.length === 0) continue;
    bucket.sort(byTitle);
    folders.push({
      $id: `folder:${key}`,
      type: 'folder',
      name: labels[key] ?? key,
      defaultOpen: true,
      children: bucket.map(pageItem),
    });
    byCategory.delete(key);
  }

  // Anything left is an unknown category value — surface it rather than drop.
  for (const [key, bucket] of byCategory) {
    bucket.sort(byTitle);
    folders.push({
      $id: `folder:${key}`,
      type: 'folder',
      name: key,
      defaultOpen: true,
      children: bucket.map(pageItem),
    });
  }

  return folders;
}

function sortByDateDesc(a: AnyPage, b: AnyPage): number {
  const ad = (a.data as { date?: string }).date ?? '';
  const bd = (b.data as { date?: string }).date ?? '';
  if (ad === bd) return a.data.title.localeCompare(b.data.title);
  return bd.localeCompare(ad);
}

export function buildPageTree(pages: AnyPage[]): Root {
  const reference: AnyPage[] = [];
  const guides: AnyPage[] = [];
  const caseStudies: AnyPage[] = [];

  for (const page of pages) {
    // `type` is injected by fumadocs-core's `multiple()` from the collection key.
    const discriminator = (page.data as { type?: string }).type;
    if (discriminator === 'guide') guides.push(page);
    else if (discriminator === 'caseStudy') caseStudies.push(page);
    else reference.push(page);
  }

  const children: Array<Separator | Folder | Item> = [];

  if (reference.length > 0) {
    children.push({
      $id: 'sep:reference',
      type: 'separator',
      name: 'Reference',
    });
    for (const folder of groupByCategory(
      reference,
      referenceCategoryOrder,
      referenceCategoryLabels,
    )) {
      children.push(folder);
    }
  }

  if (guides.length > 0) {
    children.push({
      $id: 'sep:guides',
      type: 'separator',
      name: 'Guides',
    });
    for (const folder of groupByCategory(
      guides,
      guideCategoryOrder,
      guideCategoryLabels,
    )) {
      children.push(folder);
    }
  }

  if (caseStudies.length > 0) {
    children.push({
      $id: 'sep:case-studies',
      type: 'separator',
      name: 'Case Studies',
    });
    caseStudies.sort(sortByDateDesc);
    for (const page of caseStudies) {
      children.push(pageItem(page));
    }
  }

  return {
    $id: 'root',
    name: 'claude-almanac',
    children,
  };
}
