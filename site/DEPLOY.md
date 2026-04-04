# Deploy & Smoke Test

How to verify a production deploy of claude-almanac on Cloudflare Pages.

**Production URL**: <https://claude-almanac.sivura.com>

## 1. Check CF Pages dashboard

After pushing to `main` (or opening a PR for a preview deploy), go to the
Cloudflare Pages dashboard:

- Project: **claude-almanac**
- Dashboard: <https://dash.cloudflare.com/> → Workers & Pages → claude-almanac
- Confirm the latest deployment shows **Success** (green check)
- Note the preview URL for PR deploys (e.g.
  `https://<hash>.claude-almanac.pages.dev`) — CF auto-comments it on the PR

If the build fails, open the deploy log and check:

- `npm install` succeeded
- `npm run prebuild` copied images (`[copy-images] copied N entries …`)
- `npm run build` produced `out/` with 100+ static pages
- No TypeScript errors

## 2. Expected build artifacts in `out/`

After `npm run build` the export should contain:

```
out/
├── index.html                           # landing page
├── 404.html
├── _next/
│   ├── static/chunks/*                  # per-page JS bundles
│   └── static/media/*.{png,svg,woff2}   # hashed assets
├── docs/
│   ├── <slug>.html                      # one per /docs/<slug> route
│   └── ...
├── images/                              # from prebuild copy-images.mjs
│   ├── subagents-vs-agent-teams.png
│   └── ...
├── llms.mdx/docs/<slug>/content.md      # per-page markdown siblings
├── llms.txt                             # compact index for LLM agents
├── llms-full.txt                        # concatenated full content
├── og/docs/<slug>/image.png             # OpenGraph images (one per page)
└── api/search/route.json                # Orama search index
```

Plus `functions/_middleware.ts` (not bundled into `out/` — Cloudflare Pages
picks it up directly from the repo).

## 3. Smoke-test curls against production

Run after deploy completes. Replace `$HOST` with either the production URL
or a preview URL.

```bash
HOST=https://claude-almanac.sivura.com
```

### HTML (browser path)

```bash
curl -sSL -H "Accept: text/html" "$HOST/docs/hooks" | head -5
```

Expect `<!DOCTYPE html>` and a `<title>Claude Code Hooks …</title>` tag.

### Markdown via Accept header (middleware path)

```bash
curl -sSL -H "Accept: text/markdown" "$HOST/docs/hooks" -D - -o /tmp/hooks.md
head -10 /tmp/hooks.md
```

Expect response headers:

```
HTTP/2 200
content-type: text/markdown; charset=utf-8
x-markdown-tokens: <int>
vary: Accept
cache-control: public, max-age=300, s-maxage=3600
```

Body starts with `# Claude Code Hooks (/docs/hooks)`.

### Markdown via URL suffix (Fumadocs path)

```bash
curl -sSL "$HOST/llms.mdx/docs/hooks/content.md" | head -10
```

Same body as above, served as a static file (no middleware involved).

### LLM index endpoints

```bash
curl -sSL "$HOST/llms.txt" | head -5
curl -sSL "$HOST/llms-full.txt" | head -5
```

`llms.txt` is a compact bullet list of every doc. `llms-full.txt` is the
concatenation of all page content.

### Images

```bash
curl -sSI "$HOST/images/subagents-vs-agent-teams.png" | grep -E "HTTP|content-type|content-length"
```

Expect `HTTP/2 200` and `content-type: image/png`.

## 4. Lighthouse audit

Targets (from `site-planning/site-architecture.md`):

| Metric                     | Target                 |
| -------------------------- | ---------------------- |
| Time to First Byte (TTFB)  | under 100ms (CDN edge) |
| First Contentful Paint     | under 800ms            |
| JS bundle size per page    | under 100kB            |
| Lighthouse score (desktop) | 95+                    |

Run the audit:

```bash
npx lighthouse https://claude-almanac.sivura.com/docs/hooks \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop \
  --output=html --output-path=/tmp/lighthouse.html
open /tmp/lighthouse.html
```

For CLI-only:

```bash
npx lighthouse https://claude-almanac.sivura.com/docs/hooks \
  --preset=desktop --output=json --quiet | \
  jq '.categories | {performance: .performance.score, accessibility: .accessibility.score, bestPractices: ."best-practices".score, seo: .seo.score}'
```

A Lighthouse score of **0.95+** in each category is the target.

### Bundle size check

Per-page JS bundle should stay under 100kB. Inspect from the build output:

```bash
npm run build 2>&1 | grep -A 1 "First Load JS"
```

Or use `next-bundle-analyzer` if a page drifts above the budget.

## 5. When things go wrong

| Symptom                          | Check                                            |
| -------------------------------- | ------------------------------------------------ |
| 404 on `/docs/<slug>`            | Rebuild ran; slug collision in source.ts at load |
| Images broken (404)              | Prebuild `copy-images.mjs` ran; see deploy log   |
| Accept: markdown returns HTML    | `functions/_middleware.ts` deployed?             |
| Middleware returns 500           | CF Pages → Functions logs tab                    |
| Search box returns nothing       | `/api/search/route.json` exists in `out/`        |
| Theme looks wrong                | `site/src/styles/theme.css` imported in global.css |

## Related

- [functions/README.md](./functions/README.md) — content-negotiation middleware details
- [site-planning/site-architecture.md](../site-planning/site-architecture.md) — full pipeline
- [site-planning/content-negotiation-decision.md](../site-planning/content-negotiation-decision.md) — why DIY middleware
