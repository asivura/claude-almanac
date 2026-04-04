# Content Negotiation Decision: DIY Middleware vs Cloudflare Markdown for Agents

- **Date**: 2026-04-04
- **Status**: Accepted
- **Author**: Alexander Sivura

## Context

In February 2026, Cloudflare announced [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/) —
an edge feature that serves HTML routes as markdown when the client sends
`Accept: text/markdown`. The feature automatically converts HTML → Markdown at
the edge and returns `content-type: text/markdown`.

This is increasingly valuable because:

- Claude Code and OpenCode already send `Accept: text/markdown` by default
- LLM agents benefit from markdown over HTML (smaller context, cleaner structure)
- It is a standard HTTP content negotiation pattern (no URL suffix required)

**However**, Cloudflare's feature requires the **Pro plan** ($240/year per zone
minimum) and only works on custom domains attached to Cloudflare zones.

## Options Considered

### Option A: Pay for Cloudflare Pro

- Toggle "Markdown for Agents" in CF dashboard
- Zero code, zero maintenance
- **Cost**: $240/year

### Option B: Use Fumadocs' `.md` URL suffix endpoints only

- Fumadocs automatically generates `/docs/<page>.md` for every route
- Agents that know the pattern can request markdown directly
- **Cost**: Free

### Option C: Build our own Accept header middleware (CHOSEN)

- Add a small Cloudflare Pages Function that intercepts requests
- When `Accept: text/markdown` is present, route to the `.md` endpoint
- Fall through to HTML for regular browser requests
- **Cost**: Free (Workers free tier: 100k requests/day)

## Decision

**Implement our own Accept header content negotiation middleware** as a
Cloudflare Pages Function, complementing Fumadocs' built-in llms.txt and
`.md` endpoints.

## Rationale

### Primary reasons

1. **Free** vs $240/year for an equivalent feature
1. **Higher quality markdown**: We serve the *source markdown* from Fumadocs
   (same content as GitHub rendering). Cloudflare's feature converts *rendered
   HTML* → markdown, which loses some structure
1. **Dual-mode access**: Both `.md` URL suffix AND Accept header negotiation
   work simultaneously, maximizing agent compatibility
1. **Small implementation**: ~40 lines of TypeScript in a Pages Function
1. **No vendor lock-in**: The Pages Function is portable to any Workers-compatible
   platform

### Secondary reasons

- Claude Code and OpenCode send `Accept: text/markdown` by default, so this
  reduces friction for our primary users
- `Vary: Accept` header enables proper HTTP caching semantics
- We can add custom headers (e.g., `X-Markdown-Tokens`) matching Cloudflare's
  format for ecosystem compatibility

## Implementation

Minimal Pages Function at `site/functions/_middleware.ts`:

```typescript
export const onRequest: PagesFunction = async ({ request, next }) => {
  const accept = request.headers.get('Accept') || '';
  const url = new URL(request.url);

  if (accept.includes('text/markdown') && url.pathname.startsWith('/docs/')) {
    const mdUrl = new URL(url);
    mdUrl.pathname = url.pathname.replace(/\/$/, '') + '.md';

    const mdResponse = await fetch(mdUrl.toString());
    if (mdResponse.ok) {
      const text = await mdResponse.text();
      const estimatedTokens = Math.ceil(text.length / 4);

      return new Response(text, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'X-Markdown-Tokens': estimatedTokens.toString(),
          'Vary': 'Accept',
        }
      });
    }
  }

  return next();
};
```

## Consequences

### Accepted tradeoffs

- **Maintenance burden**: ~40 lines of code to maintain
  *Mitigation*: The code is stable — only breaks if Fumadocs changes URL conventions
- **Doesn't cover non-Fumadocs routes**: Only routes under `/docs/` get the
  treatment. Landing page, 404, etc. don't.
  *Mitigation*: Those pages are for humans anyway; agents want docs content.
- **No automatic HTML→MD conversion**: Unlike CF's feature, we can only serve
  pre-generated markdown. If someone hits a route without a `.md` sibling,
  they get HTML.
  *Mitigation*: Fumadocs generates `.md` for every docs route by default.

### Benefits

- $240/year savings
- Higher-quality markdown (source, not conversion)
- Universal compatibility (URL suffix + Accept header both work)
- Full control over headers and caching behavior

## When to revisit this decision

Re-evaluate if:

- We upgrade to Cloudflare Pro for other reasons (e.g., bot management, WAF rules)
- Workers free tier limits become a constraint (>100k req/day on the markdown endpoint)
- Fumadocs changes URL conventions in a way that breaks the middleware
- Cloudflare offers the feature on free tier (unlikely but would simplify)

## References

- [Cloudflare Markdown for Agents blog post](https://blog.cloudflare.com/markdown-for-agents/)
- [Cloudflare Pages Functions docs](https://developers.cloudflare.com/pages/functions/)
- [Fumadocs LLMs integration](https://fumadocs.dev/docs/integrations/llms)
- HTTP Content Negotiation ([RFC 9110 §12](https://www.rfc-editor.org/rfc/rfc9110#name-content-negotiation))
