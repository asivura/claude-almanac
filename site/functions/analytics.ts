// Cloudflare Pages Function — Content Negotiation Analytics Dashboard.
//
// Server-side rendered HTML page that queries the Cloudflare Analytics Engine
// SQL API for the `content_negotiation` dataset and displays per-path and
// aggregate request data.
//
// Protected by Cloudflare Access — only authenticated users can reach this
// endpoint. See internals/cloudflare-setup.md for the Access policy config.

interface Env {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

type PagesFunction = (context: {
  request: Request;
  env: Env;
}) => Promise<Response>;

// Generic AE SQL query row.
type Row = Record<string, unknown>;

type AEQueryResult =
  | { kind: 'ok'; rows: Row[] }
  | { kind: 'error'; message: string };

async function aeQuery(
  apiToken: string,
  accountId: string,
  sql: string,
): Promise<AEQueryResult> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: sql,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      kind: 'error',
      message: `HTTP ${response.status}: ${text.slice(0, 500)}`,
    };
  }

  const body = (await response.json()) as { data?: Row[] };
  return { kind: 'ok', rows: body.data ?? [] };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface PathStats {
  markdown: number;
  html: number;
  total: number;
}

interface UniqueCountsRow {
  total_events: number;
  unique_ips: number;
  unique_devices: number;
  avg_response_time_ms: number;
}

interface CountryRow {
  country: string;
  cnt: number;
}

interface TopPathRow {
  path: string;
  cnt: number;
}

interface CategoryRow {
  category: string;
  cnt: number;
}

interface EventLogRow {
  timestamp: string;
  path: string;
  format: string;
  country: string;
  ua_agent_name: string;
  device_id: string;
}

// Hardcoded deploy date after which v2-schema rows exist.
const V2_CUTOFF = '2026-04-11';

function buildPage(
  range: string,
  totalMarkdown: number,
  totalHtml: number,
  pathData: Map<string, PathStats>,
  uniqueCounts: UniqueCountsRow | null,
  topCountries: CountryRow[],
  topPaths: TopPathRow[],
  uaCategories: CategoryRow[],
  eventLog: EventLogRow[],
  error?: string,
): string {
  const total = totalMarkdown + totalHtml;
  const mdPercent =
    total > 0 ? ((totalMarkdown / total) * 100).toFixed(1) : '0.0';

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

  const newSchemaCaption = `<p class="caption">(populated as of ${V2_CUTOFF})</p>`;

  // Stat grid — unique counts from new-schema rows only.
  const statGridSection = `
  <h2>Aggregate Stats</h2>
  ${newSchemaCaption}
  <div class="stat-grid">
    <div class="card">
      <div class="label">Total events</div>
      <div class="value">${uniqueCounts ? uniqueCounts.total_events.toLocaleString() : '—'}</div>
    </div>
    <div class="card">
      <div class="label">Unique IPs</div>
      <div class="value">${uniqueCounts ? uniqueCounts.unique_ips.toLocaleString() : '—'}</div>
    </div>
    <div class="card">
      <div class="label">Unique devices</div>
      <div class="value">${uniqueCounts ? uniqueCounts.unique_devices.toLocaleString() : '—'}</div>
    </div>
    <div class="card">
      <div class="label">Avg response time</div>
      <div class="value">${uniqueCounts ? Math.round(uniqueCounts.avg_response_time_ms) + 'ms' : '—'}</div>
    </div>
  </div>`;

  // UA category bar chart (CSS-only).
  const categoryColors: Record<string, string> = {
    ai_agent: '#c96442',
    browser: '#4a90d9',
    bot: '#7a7462',
    cli: '#5b8a72',
    unknown: '#b0a99f',
  };
  const uaCategorySection =
    uaCategories.length > 0
      ? (() => {
          const maxCount = Math.max(...uaCategories.map((c) => c.cnt));
          const bars = uaCategories
            .map((c) => {
              const pct =
                maxCount > 0
                  ? ((c.cnt / maxCount) * 100).toFixed(1)
                  : '0';
              const color =
                categoryColors[c.category] ?? categoryColors.unknown;
              return `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(c.category)}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%;background:${color};"></div>
            </div>
            <span class="bar-count">${c.cnt.toLocaleString()}</span>
          </div>`;
            })
            .join('');
          return `
    <div class="list-section">
      <h3>User Agent Categories</h3>
      ${newSchemaCaption}
      <div class="bar-chart">${bars}</div>
    </div>`;
        })()
      : `<div class="list-section"><h3>User Agent Categories</h3>${newSchemaCaption}<p class="empty-inline">No data yet.</p></div>`;

  // Top countries table.
  const topCountriesSection =
    topCountries.length > 0
      ? `<div class="list-section">
      <h3>Top Countries</h3>
      ${newSchemaCaption}
      <table>
        <thead><tr><th>Country</th><th class="num">Count</th></tr></thead>
        <tbody>${topCountries.map((c) => `
          <tr><td>${escapeHtml(c.country)}</td><td class="num">${c.cnt.toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`
      : `<div class="list-section"><h3>Top Countries</h3>${newSchemaCaption}<p class="empty-inline">No data yet.</p></div>`;

  // Top paths table.
  const topPathsSection =
    topPaths.length > 0
      ? `<div class="list-section">
      <h3>Top Paths</h3>
      ${newSchemaCaption}
      <table>
        <thead><tr><th>Path</th><th class="num">Count</th></tr></thead>
        <tbody>${topPaths.map((p) => `
          <tr><td><code>${escapeHtml(p.path)}</code></td><td class="num">${p.cnt.toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`
      : `<div class="list-section"><h3>Top Paths</h3>${newSchemaCaption}<p class="empty-inline">No data yet.</p></div>`;

  // Event log table.
  const eventLogSection =
    eventLog.length > 0
      ? `<h2>Event Log (recent 100)</h2>
  ${newSchemaCaption}
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Path</th>
        <th>Format</th>
        <th>Country</th>
        <th>Agent</th>
        <th>Device ID</th>
      </tr>
    </thead>
    <tbody>${eventLog.map((e) => `
      <tr>
        <td>${escapeHtml(e.timestamp)}</td>
        <td><code>${escapeHtml(e.path)}</code></td>
        <td>${escapeHtml(e.format)}</td>
        <td>${escapeHtml(e.country)}</td>
        <td>${escapeHtml(e.ua_agent_name)}</td>
        <td><code>${escapeHtml(e.device_id.slice(0, 8))}</code></td>
      </tr>`).join('')}
    </tbody>
  </table>`
      : `<h2>Event Log (recent 100)</h2>${newSchemaCaption}<div class="empty">No events yet.</div>`;

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
    .empty-inline {
      color: #7a7462;
      font-size: 0.875rem;
      padding: 0.5rem 0;
    }
    .caption {
      font-size: 0.75rem;
      color: #7a7462;
      margin-bottom: 0.75rem;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0ddd4;
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
    .bar-chart { display: flex; flex-direction: column; gap: 0.5rem; }
    .bar-row {
      display: grid;
      grid-template-columns: 80px 1fr 60px;
      align-items: center;
      gap: 0.5rem;
    }
    .bar-label {
      font-size: 0.8125rem;
      text-align: right;
      color: #7a7462;
    }
    .bar-track {
      height: 1.25rem;
      background: #f0ede6;
      border-radius: 0.25rem;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 0.25rem;
      transition: width 0.3s;
    }
    .bar-count {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #3d3929;
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

  ${statGridSection}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
    ${uaCategorySection}
    ${topCountriesSection}
  </div>

  ${topPathsSection}

  ${eventLogSection}
</body>
</html>`;
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    const html = buildPage(
      '24h',
      0,
      0,
      new Map(),
      null,
      [],
      [],
      [],
      [],
      'Analytics not configured. CF_API_TOKEN and CF_ACCOUNT_ID must be set as Pages Secrets.',
    );
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';
  const range = ['24h', '7d', '30d'].includes(rangeParam)
    ? rangeParam
    : '24h';
  const days = range === '30d' ? 30 : range === '7d' ? 7 : 1;

  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;

  const sql1 = `SELECT blob1 AS path, blob2 AS format, sum(_sample_interval) AS cnt
FROM content_negotiation
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
GROUP BY path, format
ORDER BY cnt DESC
FORMAT JSON`;

  const sql2 = `SELECT
  sum(_sample_interval) AS total_events,
  count(DISTINCT blob6) AS unique_ips,
  count(DISTINCT blob7) AS unique_devices,
  avg(double1) AS avg_response_time_ms
FROM content_negotiation
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
  AND blob8 = 'v2'
FORMAT JSON`;

  const sql3 = `SELECT blob3 AS country, sum(_sample_interval) AS cnt
FROM content_negotiation
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
  AND blob8 = 'v2' AND blob3 != ''
GROUP BY country
ORDER BY cnt DESC
LIMIT 10
FORMAT JSON`;

  const sql4 = `SELECT blob1 AS path, sum(_sample_interval) AS cnt
FROM content_negotiation
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
GROUP BY path
ORDER BY cnt DESC
LIMIT 10
FORMAT JSON`;

  const sql5 = `SELECT blob4 AS category, sum(_sample_interval) AS cnt
FROM content_negotiation
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
  AND blob8 = 'v2' AND blob4 != ''
GROUP BY category
ORDER BY cnt DESC
FORMAT JSON`;

  const sql6 = `SELECT timestamp, blob1 AS path, blob2 AS format, blob3 AS country,
       blob5 AS ua_agent_name, blob7 AS device_id
FROM content_negotiation
WHERE blob8 = 'v2'
ORDER BY timestamp DESC
LIMIT 100
FORMAT JSON`;

  let results: AEQueryResult[];
  try {
    results = await Promise.all([
      aeQuery(token, accountId, sql1),
      aeQuery(token, accountId, sql2),
      aeQuery(token, accountId, sql3),
      aeQuery(token, accountId, sql4),
      aeQuery(token, accountId, sql5),
      aeQuery(token, accountId, sql6),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const html = buildPage(
      range,
      0,
      0,
      new Map(),
      null,
      [],
      [],
      [],
      [],
      `Failed to query Analytics Engine: ${message}`,
    );
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const [q1, q2, q3, q4, q5, q6] = results;

  // Surface first error in banner; continue with empty data for failed queries.
  const firstError = results.find((r) => r.kind === 'error');
  const errorMessage =
    firstError?.kind === 'error'
      ? `Analytics Engine query failed: ${firstError.message}`
      : undefined;

  // Query 1 — per-path breakdown (cards + per-path table).
  let totalMarkdown = 0;
  let totalHtml = 0;
  const pathData = new Map<string, PathStats>();
  if (q1.kind === 'ok') {
    for (const row of q1.rows) {
      const path = String(row.path ?? '');
      const format = String(row.format ?? '');
      const count = Math.round(Number(row.cnt) || 0);
      if (format === 'markdown') totalMarkdown += count;
      else totalHtml += count;
      const existing = pathData.get(path) ?? {
        markdown: 0,
        html: 0,
        total: 0,
      };
      if (format === 'markdown') existing.markdown += count;
      else existing.html += count;
      existing.total += count;
      pathData.set(path, existing);
    }
  }

  // Query 2 — unique counts + avg response time (v2 rows only).
  let uniqueCounts: UniqueCountsRow | null = null;
  if (q2.kind === 'ok' && q2.rows.length > 0) {
    const r = q2.rows[0];
    uniqueCounts = {
      total_events: Math.round(Number(r.total_events) || 0),
      unique_ips: Math.round(Number(r.unique_ips) || 0),
      unique_devices: Math.round(Number(r.unique_devices) || 0),
      avg_response_time_ms: Number(r.avg_response_time_ms) || 0,
    };
  }

  // Query 3 — top countries.
  const topCountries: CountryRow[] =
    q3.kind === 'ok'
      ? q3.rows.map((r) => ({
          country: String(r.country ?? ''),
          cnt: Math.round(Number(r.cnt) || 0),
        }))
      : [];

  // Query 4 — top paths (all rows).
  const topPaths: TopPathRow[] =
    q4.kind === 'ok'
      ? q4.rows.map((r) => ({
          path: String(r.path ?? ''),
          cnt: Math.round(Number(r.cnt) || 0),
        }))
      : [];

  // Query 5 — UA categories.
  const uaCategories: CategoryRow[] =
    q5.kind === 'ok'
      ? q5.rows.map((r) => ({
          category: String(r.category ?? ''),
          cnt: Math.round(Number(r.cnt) || 0),
        }))
      : [];

  // Query 6 — event log (v2 rows only).
  const eventLog: EventLogRow[] =
    q6.kind === 'ok'
      ? q6.rows.map((r) => ({
          timestamp: String(r.timestamp ?? ''),
          path: String(r.path ?? ''),
          format: String(r.format ?? ''),
          country: String(r.country ?? ''),
          ua_agent_name: String(r.ua_agent_name ?? ''),
          device_id: String(r.device_id ?? ''),
        }))
      : [];

  const html = buildPage(
    range,
    totalMarkdown,
    totalHtml,
    pathData,
    uniqueCounts,
    topCountries,
    topPaths,
    uaCategories,
    eventLog,
    errorMessage,
  );
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
