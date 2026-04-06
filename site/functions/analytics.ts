// Cloudflare Pages Function — Content Negotiation Analytics Dashboard.
//
// Server-side rendered HTML page that queries the Cloudflare Analytics Engine
// GraphQL API for the `content_negotiation` dataset and displays markdown vs
// HTML request counts per path.
//
// Protected by Cloudflare Access — only authenticated users can reach this
// endpoint. See internals/cloudflare-setup.md for the Access policy config.

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<{ results?: unknown[] }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  DB?: D1Database;
  STATS_CACHE?: KVNamespace;
}

type PagesFunction = (context: {
  request: Request;
  env: Env;
}) => Promise<Response>;

interface AEGroup {
  sum: { double1: number };
  dimensions: { blob1: string; blob2: string };
}

interface AEResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        content_negotiationAdaptiveGroups?: AEGroup[];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function rangeToDate(range: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let ms: number;
  switch (range) {
    case '30d':
      ms = 30 * 24 * 60 * 60 * 1000;
      break;
    case '7d':
      ms = 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      ms = 24 * 60 * 60 * 1000;
  }
  const start = new Date(now.getTime() - ms).toISOString();
  return { start, end };
}

async function queryAnalyticsEngine(
  apiToken: string,
  accountId: string,
  range: string,
): Promise<AEResponse> {
  const { start, end } = rangeToDate(range);
  const query = `query {
  viewer {
    accounts(filter: { accountTag: "${accountId}" }) {
      content_negotiationAdaptiveGroups(
        limit: 100
        filter: {
          datetime_geq: "${start}"
          datetime_leq: "${end}"
        }
        orderBy: [sum_double1_DESC]
      ) {
        sum { double1 }
        dimensions {
          blob1
          blob2
        }
      }
    }
  }
}`;

  const response = await fetch(
    'https://api.cloudflare.com/client/v4/graphql',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  );

  return response.json() as Promise<AEResponse>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- D1 event log types and helpers ---

interface EventRow {
  timestamp: string;
  pathname: string;
  format: string;
  country: string | null;
  user_agent: string | null;
  device_id: string | null;
}

interface AggregateStats {
  total_events: number;
  unique_ips: number;
  unique_devices: number;
  markdown_pct: string;
  top_paths: Array<{ pathname: string; count: number }>;
  top_countries: Array<{ country: string; count: number }>;
  last_updated: string;
}

async function fetchRecentEvents(db: D1Database): Promise<EventRow[]> {
  const result = await db
    .prepare(
      `SELECT timestamp, pathname, format, country, user_agent, device_id
       FROM events ORDER BY timestamp DESC LIMIT 100`,
    )
    .all<EventRow>();
  return result.results;
}

async function computeAggregates(
  db: D1Database,
  range: string,
): Promise<AggregateStats> {
  const hours =
    range === '30d' ? 30 * 24 : range === '7d' ? 7 * 24 : 24;
  const since = new Date(
    Date.now() - hours * 60 * 60 * 1000,
  ).toISOString();

  const totalRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM events WHERE timestamp >= ?`)
    .bind(since)
    .first<{ cnt: number }>();
  const totalEvents = totalRow?.cnt ?? 0;

  const uniqueIpRow = await db
    .prepare(
      `SELECT COUNT(DISTINCT ip_hash) as cnt FROM events WHERE timestamp >= ?`,
    )
    .bind(since)
    .first<{ cnt: number }>();
  const uniqueIps = uniqueIpRow?.cnt ?? 0;

  const uniqueDeviceRow = await db
    .prepare(
      `SELECT COUNT(DISTINCT device_id) as cnt FROM events WHERE timestamp >= ? AND device_id IS NOT NULL`,
    )
    .bind(since)
    .first<{ cnt: number }>();
  const uniqueDevices = uniqueDeviceRow?.cnt ?? 0;

  const mdRow = await db
    .prepare(
      `SELECT COUNT(*) as cnt FROM events WHERE timestamp >= ? AND format = 'markdown'`,
    )
    .bind(since)
    .first<{ cnt: number }>();
  const mdCount = mdRow?.cnt ?? 0;
  const mdPct =
    totalEvents > 0
      ? ((mdCount / totalEvents) * 100).toFixed(1)
      : '0.0';

  const topPathRows = await db
    .prepare(
      `SELECT pathname, COUNT(*) as cnt FROM events WHERE timestamp >= ? GROUP BY pathname ORDER BY cnt DESC LIMIT 10`,
    )
    .bind(since)
    .all<{ pathname: string; cnt: number }>();
  const topPaths = topPathRows.results.map((r) => ({
    pathname: r.pathname,
    count: r.cnt,
  }));

  const topCountryRows = await db
    .prepare(
      `SELECT country, COUNT(*) as cnt FROM events WHERE timestamp >= ? AND country IS NOT NULL GROUP BY country ORDER BY cnt DESC LIMIT 10`,
    )
    .bind(since)
    .all<{ country: string; cnt: number }>();
  const topCountries = topCountryRows.results.map((r) => ({
    country: r.country,
    count: r.cnt,
  }));

  return {
    total_events: totalEvents,
    unique_ips: uniqueIps,
    unique_devices: uniqueDevices,
    markdown_pct: mdPct,
    top_paths: topPaths,
    top_countries: topCountries,
    last_updated: new Date().toISOString(),
  };
}

async function getAggregates(
  env: Env,
  range: string,
): Promise<AggregateStats | null> {
  if (!env.DB) return null;

  const cacheKey = `stats:${range}`;

  // Try KV cache first.
  if (env.STATS_CACHE) {
    try {
      const cached = await env.STATS_CACHE.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as AggregateStats;
        const age =
          Date.now() - new Date(parsed.last_updated).getTime();
        if (age < 60 * 60 * 1000) return parsed; // fresh within 1 hour
      }
    } catch {
      // Cache miss or parse error — recompute.
    }
  }

  try {
    const stats = await computeAggregates(env.DB, range);

    // Write back to KV cache.
    if (env.STATS_CACHE) {
      try {
        await env.STATS_CACHE.put(cacheKey, JSON.stringify(stats));
      } catch {
        // Best-effort cache write.
      }
    }

    return stats;
  } catch {
    return null;
  }
}

// --- AE types ---

interface PathStats {
  markdown: number;
  html: number;
  total: number;
}

function buildPage(
  range: string,
  totalMarkdown: number,
  totalHtml: number,
  pathData: Map<string, PathStats>,
  error?: string,
  events?: EventRow[],
  aggregates?: AggregateStats | null,
): string {
  const total = totalMarkdown + totalHtml;
  const mdPercent = total > 0 ? ((totalMarkdown / total) * 100).toFixed(1) : '0.0';

  const sortedPaths = [...pathData.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  );

  const rangeLabels: Record<string, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
  };

  const rows = sortedPaths
    .map(
      ([path, stats]) => `
        <tr>
          <td><code>${escapeHtml(path)}</code></td>
          <td class="num">${stats.markdown.toLocaleString()}</td>
          <td class="num">${stats.html.toLocaleString()}</td>
          <td class="num">${stats.total.toLocaleString()}</td>
        </tr>`,
    )
    .join('');

  const errorBanner = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Claude Almanac — Content Negotiation Analytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #faf9f5;
      color: #3d3929;
      line-height: 1.6;
      padding: 2rem;
      max-width: 960px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: #7a7462;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .range-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .range-selector a {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid #e0ddd4;
      color: #3d3929;
      background: #fff;
      transition: background 0.15s, border-color 0.15s;
    }
    .range-selector a:hover { border-color: #c96442; }
    .range-selector a.active {
      background: #c96442;
      color: #fff;
      border-color: #c96442;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #fff;
      border: 1px solid #e0ddd4;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .card .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #7a7462;
      margin-bottom: 0.25rem;
    }
    .card .value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #c96442;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #e0ddd4;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #7a7462;
      background: #f5f3ee;
      border-bottom: 1px solid #e0ddd4;
    }
    th.num, td.num { text-align: right; }
    td {
      padding: 0.625rem 1rem;
      border-bottom: 1px solid #f0ede6;
      font-size: 0.875rem;
    }
    tr:last-child td { border-bottom: none; }
    code {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 0.8125rem;
    }
    .error {
      background: #fef2f2;
      border: 1px solid #e8c4c4;
      border-radius: 0.5rem;
      padding: 1rem;
      color: #9b4444;
      margin-bottom: 1.5rem;
    }
    .empty {
      text-align: center;
      padding: 3rem 1rem;
      color: #7a7462;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0ddd4;
    }
    .ua {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .stat-grid .card { padding: 1rem; }
    .stat-grid .card .value { font-size: 1.5rem; }
    .list-section { margin-bottom: 1.5rem; }
    .list-section h3 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>Content Negotiation Analytics</h1>
  <p class="subtitle">claude-almanac.sivura.com — ${escapeHtml(rangeLabels[range] ?? rangeLabels['24h'])}</p>

  <div class="range-selector">
    <a href="/analytics?range=24h" class="${range === '24h' ? 'active' : ''}">24h</a>
    <a href="/analytics?range=7d" class="${range === '7d' ? 'active' : ''}">7 days</a>
    <a href="/analytics?range=30d" class="${range === '30d' ? 'active' : ''}">30 days</a>
  </div>

  ${errorBanner}

  <div class="cards">
    <div class="card">
      <div class="label">Markdown requests</div>
      <div class="value">${totalMarkdown.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">HTML requests</div>
      <div class="value">${totalHtml.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Markdown share</div>
      <div class="value">${mdPercent}%</div>
    </div>
  </div>

  ${
    sortedPaths.length > 0
      ? `<table>
    <thead>
      <tr>
        <th>Path</th>
        <th class="num">Markdown</th>
        <th class="num">HTML</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>`
      : `<div class="empty">No data for this time range yet.</div>`
  }

  ${aggregates ? `
  <h2>D1 Aggregate Stats</h2>
  <div class="stat-grid">
    <div class="card">
      <div class="label">Total events</div>
      <div class="value">${aggregates.total_events.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Unique IPs</div>
      <div class="value">${aggregates.unique_ips.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Unique devices</div>
      <div class="value">${aggregates.unique_devices.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Markdown share</div>
      <div class="value">${aggregates.markdown_pct}%</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
    <div class="list-section">
      <h3>Top Paths</h3>
      <table>
        <thead><tr><th>Path</th><th class="num">Count</th></tr></thead>
        <tbody>${aggregates.top_paths.map((p) => `
          <tr><td><code>${escapeHtml(p.pathname)}</code></td><td class="num">${p.count.toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="list-section">
      <h3>Top Countries</h3>
      <table>
        <thead><tr><th>Country</th><th class="num">Count</th></tr></thead>
        <tbody>${aggregates.top_countries.map((c) => `
          <tr><td>${escapeHtml(c.country)}</td><td class="num">${c.count.toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  ${events && events.length > 0 ? `
  <h2>Event Log (recent 100)</h2>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Path</th>
        <th>Format</th>
        <th>Country</th>
        <th>User Agent</th>
        <th>Device ID</th>
      </tr>
    </thead>
    <tbody>${events.map((e) => `
      <tr>
        <td>${escapeHtml(e.timestamp)}</td>
        <td><code>${escapeHtml(e.pathname)}</code></td>
        <td>${escapeHtml(e.format)}</td>
        <td>${e.country ? escapeHtml(e.country) : ''}</td>
        <td class="ua" title="${e.user_agent ? escapeHtml(e.user_agent) : ''}">${e.user_agent ? escapeHtml(e.user_agent.slice(0, 60)) : ''}</td>
        <td><code>${e.device_id ? escapeHtml(e.device_id.slice(0, 8)) : ''}</code></td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}
</body>
</html>`;
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    const html = buildPage('24h', 0, 0, new Map(), 'Analytics not configured. CF_API_TOKEN and CF_ACCOUNT_ID must be set as Pages Secrets.');
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';
  const range = ['24h', '7d', '30d'].includes(rangeParam) ? rangeParam : '24h';

  let result: AEResponse;
  try {
    result = await queryAnalyticsEngine(env.CF_API_TOKEN, env.CF_ACCOUNT_ID, range);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const html = buildPage(range, 0, 0, new Map(), `Failed to query Analytics Engine: ${message}`);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (result.errors?.length) {
    const msg = result.errors.map((e) => e.message).join('; ');
    const html = buildPage(range, 0, 0, new Map(), `GraphQL error: ${msg}`);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const groups =
    result.data?.viewer?.accounts?.[0]?.content_negotiationAdaptiveGroups ?? [];

  let totalMarkdown = 0;
  let totalHtml = 0;
  const pathData = new Map<string, PathStats>();

  for (const group of groups) {
    const path = group.dimensions.blob1;
    const format = group.dimensions.blob2;
    const count = group.sum.double1;

    if (format === 'markdown') totalMarkdown += count;
    else totalHtml += count;

    const existing = pathData.get(path) ?? { markdown: 0, html: 0, total: 0 };
    if (format === 'markdown') existing.markdown += count;
    else existing.html += count;
    existing.total += count;
    pathData.set(path, existing);
  }

  // Fetch D1 event log and aggregates (parallel, best-effort).
  let events: EventRow[] = [];
  let aggregates: AggregateStats | null = null;
  if (env.DB) {
    try {
      [events, aggregates] = await Promise.all([
        fetchRecentEvents(env.DB),
        getAggregates(env, range),
      ]);
    } catch {
      // D1/KV read failed — show AE data only.
    }
  }

  const html = buildPage(
    range,
    totalMarkdown,
    totalHtml,
    pathData,
    undefined,
    events,
    aggregates,
  );
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
