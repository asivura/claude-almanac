// Cloudflare Pages Function — Content Negotiation Analytics Dashboard.
//
// Server-side rendered HTML page that queries the Cloudflare Analytics Engine
// GraphQL API for the `content_negotiation` dataset and displays markdown vs
// HTML request counts per path.
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

  const html = buildPage(range, totalMarkdown, totalHtml, pathData);
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
