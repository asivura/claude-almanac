import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Prelude banner for guide pages. Rendered above the DocsBody.
//
// Layout (per site-planning/content-taxonomy.md):
//   ⏱ {time} · 📊 {difficulty} · 👤 {author}
//   Prerequisites: {prerequisites}
//   Outcome: {outcome}
//
// Every field is optional — the banner degrades gracefully when frontmatter
// is missing. If nothing meaningful is set, renders nothing.

export interface GuidePreludeProps {
  time?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  prerequisites?: string[];
  outcome?: string;
}

export function GuidePrelude({
  time,
  difficulty,
  author,
  prerequisites,
  outcome,
}: GuidePreludeProps) {
  const hasMeta = Boolean(time || difficulty || author);
  const hasPrereqs = prerequisites && prerequisites.length > 0;
  const hasOutcome = Boolean(outcome);

  if (!hasMeta && !hasPrereqs && !hasOutcome) return null;

  return (
    <Card className="mb-6 mt-4 not-prose">
      <CardContent className="pt-4 flex flex-col gap-2 text-sm">
        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            {time ? <span>⏱ {time}</span> : null}
            {difficulty ? (
              <>
                {time ? <span aria-hidden="true">·</span> : null}
                <span>📊 {difficulty}</span>
              </>
            ) : null}
            {author ? (
              <>
                {time || difficulty ? <span aria-hidden="true">·</span> : null}
                <span>👤 {author}</span>
              </>
            ) : null}
          </div>
        ) : null}
        {hasPrereqs ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Prerequisites:</span>
            {prerequisites!.map((p) => (
              <Badge key={p} variant="outline">
                {p}
              </Badge>
            ))}
          </div>
        ) : null}
        {hasOutcome ? (
          <div>
            <span className="font-medium">Outcome:</span> {outcome}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
