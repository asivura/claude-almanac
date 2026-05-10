import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

// Required for `output: 'export'`: generate sitemap.xml at build time so
// it ships as a static file in out/.
export const dynamic = 'force-static';
export const revalidate = false;

const SITE_URL = 'https://claude-almanac.sivura.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/docs`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/graph`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const docEntries: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...docEntries];
}
