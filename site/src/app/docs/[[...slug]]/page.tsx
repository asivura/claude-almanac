import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
import { GuidePrelude } from '@/components/page-layouts/guide-prelude';
import { CaseStudyHeader } from '@/components/page-layouts/case-study-header';
import {
  FooterLinks,
  type FooterLink,
} from '@/components/page-layouts/footer-links';

// Three layout variants keyed off `page.data.type`:
//   reference  → default DocsPage (title, description, body, right ToC)
//   guide      → DocsPage + prelude banner above body + "Next steps" footer
//   caseStudy  → DocsPage + narrative header above body + "Related" footer
//
// The discriminator comes from fumadocs-core's `multiple()` helper in
// source.ts, which injects `type: "reference" | "guide" | "caseStudy"`
// from the collection key names.

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const data = page.data as {
    type?: string;
    time?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    author?: string;
    prerequisites?: string[];
    outcome?: string;
    nextSteps?: FooterLink[];
    date?: string;
    duration?: string;
    themes?: string[];
    stack?: string[];
    related?: FooterLink[];
  };
  const type = data.type;

  // Map the collection type to the source directory at the repo root.
  // Content lives at repo root in three directories (not in site/content/docs/)
  // so the GitHub URL must reflect the actual source path.
  const contentDirByType: Record<string, string> = {
    reference: 'features',
    guide: 'guides',
    caseStudy: 'case-studies',
  };
  const contentDir = contentDirByType[type ?? 'reference'] ?? 'features';

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${contentDir}/${page.path}`}
        />
      </div>

      {type === 'guide' ? (
        <GuidePrelude
          time={data.time}
          difficulty={data.difficulty}
          author={data.author}
          prerequisites={data.prerequisites}
          outcome={data.outcome}
        />
      ) : null}

      {type === 'caseStudy' ? (
        <CaseStudyHeader
          date={data.date}
          duration={data.duration}
          author={data.author}
          themes={data.themes}
          stack={data.stack}
        />
      ) : null}

      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>

      {type === 'guide' ? (
        <FooterLinks title="Next steps" items={data.nextSteps} />
      ) : null}

      {type === 'caseStudy' ? (
        <FooterLinks title="Related" items={data.related} />
      ) : null}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
