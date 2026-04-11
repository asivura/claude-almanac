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

## `analytics.ts`

Server-side rendered analytics dashboard for content negotiation metrics.
Queries the Cloudflare Analytics Engine GraphQL API and displays markdown
vs HTML request counts per path.

- **URL**: `/analytics` (protected by Cloudflare Access)
- **Data source**: `content_negotiation` Analytics Engine dataset
- **Required secrets**: `CF_API_TOKEN`, `CF_ACCOUNT_ID` (Pages Secrets)
- **Time ranges**: `?range=24h` (default), `?range=7d`, `?range=30d`
- **No client-side JS** — fully server-rendered on each request

If secrets are missing, the page renders a friendly configuration error
instead of failing.

## Analytics Engine tracking in `_middleware.ts`

The middleware writes a data point to Analytics Engine on every content
request (not static assets like CSS/JS/fonts). All request metadata is
stored in a single `content_negotiation` dataset — no D1 or KV bindings
are used.

| Field   | Value                                                     |
| ------- | --------------------------------------------------------- |
| indexes | `[format]` — `"markdown"` or `"html"`                     |
| blobs   | `[pathname, format, country, ua_category, ua_agent_name,` |
|         | `ip_hash, device_id, "v2"]`                               |
| doubles | `[response_time_ms, response_status, token_count]`        |

The schema version marker `blob8 = 'v2'` distinguishes new rows (written
after 2026-04-11) from historical rows that only populated `blob1`,
`blob2`, and `double1`. Queries that aggregate response time or unique
counts filter `WHERE blob8 = 'v2'` to exclude old rows.

IP addresses are never stored. `blob6` holds the first 16 hex characters
of SHA-256(`CF-Connecting-IP`) — enough for cardinality counting but
not reversible to the original IP.

The `ANALYTICS` binding is optional. When absent (local dev), tracking
is a silent no-op. Writes use `waitUntil` so they never block the response.

### Device ID cookie

On first HTML response (non-markdown clients), the middleware sets a
`device_id` cookie (UUID, HttpOnly, 1 year TTL) to correlate repeat
visits without relying on IP addresses. The first 12 characters are
stored as `blob7`.

## Local testing with Wrangler (optional)

For full-fidelity local testing, use Wrangler:

```bash
npm run build
npx wrangler pages dev out --compatibility-date=2026-04-01
# then hit http://localhost:8788
```

The prebuilt `out/` directory plus the `functions/` dir give a faithful
simulation of the deployed environment.
