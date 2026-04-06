import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Narrative header for case-study pages. Rendered above the DocsBody.
//
// Layout (per internals/content-taxonomy.md):
//   📅 {date} · ⏳ {duration} · 👤 {author}
//   Tags: {themes}
//   Stack: {stack}
//
// Every field is optional. Renders nothing when no fields are present.

export interface CaseStudyHeaderProps {
  date?: string;
  duration?: string;
  author?: string;
  themes?: string[];
  stack?: string[];
}

export function CaseStudyHeader({
  date,
  duration,
  author,
  themes,
  stack,
}: CaseStudyHeaderProps) {
  const hasMeta = Boolean(date || duration || author);
  const hasThemes = themes && themes.length > 0;
  const hasStack = stack && stack.length > 0;

  if (!hasMeta && !hasThemes && !hasStack) return null;

  return (
    <Card className="mb-6 mt-4 not-prose">
      <CardContent className="pt-4 flex flex-col gap-2 text-sm">
        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            {date ? <span>📅 {date}</span> : null}
            {duration ? (
              <>
                {date ? <span aria-hidden="true">·</span> : null}
                <span>⏳ {duration}</span>
              </>
            ) : null}
            {author ? (
              <>
                {date || duration ? <span aria-hidden="true">·</span> : null}
                <span>👤 {author}</span>
              </>
            ) : null}
          </div>
        ) : null}
        {hasThemes ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Tags:</span>
            {themes!.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        {hasStack ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Stack:</span>
            {stack!.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
