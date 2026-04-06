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
request (not static assets like CSS/JS/fonts):

| Field   | Value                                 |
| ------- | ------------------------------------- |
| indexes | `[format]` — `"markdown"` or `"html"` |
| blobs   | `[pathname, format]`                  |
| doubles | `[1]` — counter for aggregation       |

The `ANALYTICS` binding is optional. When absent (local dev), tracking
is a silent no-op.

## D1 event logging in `_middleware.ts`

In addition to Analytics Engine data points, the middleware logs every
content request to a D1 database for detailed per-event analysis.

Each event records:

| Column          | Source                                       |
| --------------- | -------------------------------------------- |
| `pathname`      | Request URL path                             |
| `format`        | `"markdown"` or `"html"`                     |
| `ip_hash`       | SHA-256 of `CF-Connecting-IP`                |
| `user_agent`    | `User-Agent` header                          |
| `referer`       | `Referer` header                             |
| `country`       | `request.cf.country`                         |
| `city`          | `request.cf.city`                            |
| `asn`           | `request.cf.asn`                             |
| `tls_version`   | `request.cf.tlsVersion`                      |
| `http_protocol` | `request.cf.httpProtocol`                    |
| `device_id`     | `device_id` cookie (set on first HTML visit) |

The `DB` binding (D1) is optional. When absent, event logging is a
silent no-op. Writes use `waitUntil` so they never block the response.

### D1 schema

The migration at `site/migrations/0001_create_events.sql` creates the
`events` table with indexes on `timestamp`, `format`, and `pathname`.

### Device ID cookie

On first HTML response (non-markdown clients), the middleware sets a
`device_id` cookie (UUID, HttpOnly, 1 year TTL) to correlate repeat
visits without relying on IP addresses.

## KV-cached aggregate stats in `analytics.ts`

The analytics dashboard computes aggregate stats from D1 and caches
them in a KV namespace (`STATS_CACHE` binding) for up to 1 hour.

Cache keys follow the pattern `stats:{range}` (e.g. `stats:24h`).
When a cache entry is missing or older than 1 hour, the dashboard
runs aggregate queries against D1 and writes the result back to KV.

Aggregates include: total events, unique IPs, unique devices, markdown
percentage, top 10 paths, and top 10 countries.

Both the `DB` and `STATS_CACHE` bindings are optional. When `DB` is
absent, the D1 sections simply do not render. When `STATS_CACHE` is
absent, aggregates are computed directly from D1 on each request.

## Local testing with Wrangler (optional)

For full-fidelity local testing, use Wrangler:

```bash
npm run build
npx wrangler pages dev out --compatibility-date=2026-04-01
# then hit http://localhost:8788
```

The prebuilt `out/` directory plus the `functions/` dir give a faithful
simulation of the deployed environment.
