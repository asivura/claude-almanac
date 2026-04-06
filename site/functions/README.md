# Cloudflare Pages Functions

This directory holds edge functions that augment the static site export.
Cloudflare Pages picks them up automatically — no extra build config.

## `_middleware.ts`

HTTP content negotiation for LLM agents. When a client sends
`Accept: text/markdown` against `/docs/*`, the middleware returns the
Fumadocs-generated markdown sibling instead of the HTML page.

See [`internals/content-negotiation-decision.md`](../../internals/content-negotiation-decision.md)
for the rationale behind this vs Cloudflare's paid "Markdown for Agents" feature.

## Verifying locally

The middleware runs only on the deployed site (Pages Functions need the
Cloudflare Workers runtime). After deploying a preview build, these two
access patterns should both return markdown:

**URL suffix path** — works against any Pages deploy, no middleware needed:

```bash
curl -sSL https://<preview-url>/llms.mdx/docs/hooks/content.md | head -20
```

**Accept header path** — exercises the middleware:

```bash
curl -sSL -H "Accept: text/markdown" https://<preview-url>/docs/hooks \
  -D - -o /tmp/hooks.md
head -20 /tmp/hooks.md
```

Expected response headers when the middleware hits:

```
HTTP/2 200
content-type: text/markdown; charset=utf-8
x-markdown-tokens: <estimated-count>
vary: Accept
cache-control: public, max-age=300, s-maxage=3600
```

**Browser request path** — falls through to the static HTML export:

```bash
curl -sSL -H "Accept: text/html" https://<preview-url>/docs/hooks | head -5
```

Should return `<!DOCTYPE html>...` as usual.

## URL mapping

| Request                                 | Served from                       |
| --------------------------------------- | --------------------------------- |
| `/docs/hooks` + `Accept: text/html`     | `/out/docs/hooks.html` (static)   |
| `/docs/hooks` + `Accept: text/markdown` | `/llms.mdx/docs/hooks/content.md` |
| `/llms.mdx/docs/hooks/content.md`       | direct static file                |
| `/llms.txt`                             | direct static file                |
| `/llms-full.txt`                        | direct static file                |

## Local testing with Wrangler (optional)

For full-fidelity local testing, use Wrangler:

```bash
npm run build
npx wrangler pages dev out --compatibility-date=2026-04-01
# then hit http://localhost:8788
```

The prebuilt `out/` directory plus the `functions/` dir give a faithful
simulation of the deployed environment.
