// Cloudflare Pages Function middleware — HTTP content negotiation for LLMs.
//
// Universal Accept: text/markdown coverage. When a markdown-accepting client
// hits any user-facing page, they get markdown back:
//
//   /                 →  /home.md (generated at build time)
//   /docs/<slug>      →  /llms.mdx/docs/<slug>/content.md
//   /docs/            →  /llms.txt (top-level index)
//   /llms.txt         →  same file, served with Content-Type: text/markdown
//   /llms-full.txt    →  same file, served with Content-Type: text/markdown
//   anything else     →  markdown 404 body
//
// Browsers (Accept: text/html or */*) and requests for static assets (any
// path ending in a file extension) fall through to next() unchanged.
//
// See internals/content-negotiation-decision.md for full rationale.

// Minimal Cloudflare Pages Function signature. We avoid depending on
// @cloudflare/workers-types to keep the site/node_modules lean — Pages
// Functions run in a Workers runtime that has `fetch`, `Request`, `Response`,
// `URL`, `Headers` natively (all covered by lib.dom).

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface PagesEnv {
  ANALYTICS?: {
    writeDataPoint(event: {
      indexes?: string[];
      blobs?: string[];
      doubles?: number[];
    }): void;
  };
  DB?: D1Database;
  STATS_CACHE?: KVNamespace;
}

type PagesFunction = (context: {
  request: Request;
  next: () => Promise<Response>;
  env: PagesEnv;
  waitUntil: (promise: Promise<unknown>) => void;
}) => Promise<Response>;

function trackRequest(
  env: PagesEnv,
  pathname: string,
  format: 'markdown' | 'html',
): void {
  env.ANALYTICS?.writeDataPoint({
    indexes: [format],
    blobs: [pathname, format],
    doubles: [1],
  });
}

async function logEvent(
  env: PagesEnv,
  request: Request,
  pathname: string,
  format: 'markdown' | 'html',
): Promise<void> {
  if (!env.DB) return;
  try {
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(ip),
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const userAgent = request.headers.get('User-Agent') ?? null;
    const referer = request.headers.get('Referer') ?? null;

    // Extract Cloudflare-specific properties from request.cf
    const cf = (request as unknown as { cf?: Record<string, unknown> }).cf;
    const country = (cf?.country as string) ?? null;
    const city = (cf?.city as string) ?? null;
    const asn = (cf?.asn as number) ?? null;
    const tlsVersion = (cf?.tlsVersion as string) ?? null;
    const httpProtocol = (cf?.httpProtocol as string) ?? null;

    // Read device_id from cookie
    const cookieHeader = request.headers.get('Cookie') ?? '';
    const deviceMatch = cookieHeader.match(/(?:^|;\s*)device_id=([^;]+)/);
    const deviceId = deviceMatch ? deviceMatch[1] : null;

    await env.DB.prepare(
      `INSERT INTO events (pathname, format, user_agent, referer, ip, ip_hash, country, city, asn, tls_version, http_protocol, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        pathname,
        format,
        userAgent,
        referer,
        ip,
        ipHash,
        country,
        city,
        asn,
        tlsVersion,
        httpProtocol,
        deviceId,
      )
      .run();
  } catch {
    // Never crash the middleware — D1 logging is best-effort.
  }
}

function getDeviceIdCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)device_id=([^;]+)/);
  return match ? match[1] : null;
}

function markdownResponse(
  text: string,
  status = 200,
  extraCache = false,
): Response {
  const estimatedTokens = Math.ceil(text.length / 4);
  const headers: Record<string, string> = {
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Markdown-Tokens': estimatedTokens.toString(),
    Vary: 'Accept',
  };
  if (extraCache) {
    // Only cache successful content — errors should stay fresh.
    headers['Cache-Control'] = 'public, max-age=300, s-maxage=3600';
  }
  return new Response(text, { status, headers });
}

function markdownNotFound(pathname: string): Response {
  // Sanitize pathname for safe embedding in the markdown body: strip
  // backticks and backslashes so a crafted URL can't break out of the
  // code span, and cap the length.
  const displayPath = pathname.replace(/[`\\]/g, '').slice(0, 200);
  const body = `# 404 Not Found

The page \`${displayPath}\` does not exist on claude-almanac.sivura.com.

## Find what you're looking for

- **Full index**: [/llms.txt](/llms.txt)
- **All content**: [/llms-full.txt](/llms-full.txt)
- **Documentation**: [/docs](/docs)
- **Home**: [/](/)

If you expected this page to exist, open an issue at
https://github.com/asivura/claude-almanac/issues.
`;
  return markdownResponse(body, 404);
}

async function fetchAssetAsMarkdown(
  origin: string,
  assetPath: string,
  fallbackPath: string,
): Promise<Response> {
  const assetUrl = new URL(assetPath, origin);
  const response = await fetch(assetUrl.toString(), {
    headers: { 'User-Agent': 'content-negotiation-middleware' },
  });
  if (!response.ok) return markdownNotFound(fallbackPath);
  const text = await response.text();
  return markdownResponse(text, 200, true);
}

export const onRequest: PagesFunction = async ({
  request,
  next,
  env,
  waitUntil,
}) => {
  const accept = request.headers.get('Accept') ?? '';
  const url = new URL(request.url);

  // Skip non-markdown-accepting clients (browsers, API calls, etc).
  if (!accept.includes('text/markdown')) {
    trackRequest(env, url.pathname, 'html');
    waitUntil(logEvent(env, request, url.pathname, 'html'));

    const response = await next();

    // Set device_id cookie on HTML responses if not already present.
    if (!getDeviceIdCookie(request)) {
      const id = crypto.randomUUID();
      const cloned = new Response(response.body, response);
      cloned.headers.append(
        'Set-Cookie',
        `device_id=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      );
      return cloned;
    }

    return response;
  }

  // Skip static asset paths (anything ending in a file extension).
  // home.md / llms.txt etc. are explicit routes handled below.
  // No tracking — these are CSS/JS/fonts, not content requests.
  if (/\.[a-z0-9]+$/i.test(url.pathname) &&
      url.pathname !== '/llms.txt' &&
      url.pathname !== '/llms-full.txt') {
    return next();
  }

  const path = url.pathname;

  // Root landing page → generated markdown representation.
  if (path === '/' || path === '') {
    trackRequest(env, path, 'markdown');
    waitUntil(logEvent(env, request, path, 'markdown'));
    return fetchAssetAsMarkdown(url.origin, '/home.md', '/');
  }

  // LLM index endpoints — already markdown content but served as text/plain.
  // Re-wrap with the correct Content-Type when the client asks for markdown.
  if (path === '/llms.txt' || path === '/llms-full.txt') {
    trackRequest(env, path, 'markdown');
    waitUntil(logEvent(env, request, path, 'markdown'));
    return fetchAssetAsMarkdown(url.origin, path, path);
  }

  // /docs/<slug> → /llms.mdx/docs/<slug>/content.md (Fumadocs internal path).
  // /docs/ (bare) → /llms.txt (top-level index).
  if (path.startsWith('/docs/') || path === '/docs') {
    const slug = path.replace(/^\/docs\/?/, '').replace(/\/$/, '');

    // Guard: slugs must match our known content pattern. Anything else is a
    // typo or path-traversal attempt — return markdown 404.
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      trackRequest(env, path, 'markdown');
      waitUntil(logEvent(env, request, path, 'markdown'));
      return markdownNotFound(path);
    }

    const mdPath = slug
      ? `/llms.mdx/docs/${slug}/content.md`
      : '/llms.txt';

    trackRequest(env, path, 'markdown');
    waitUntil(logEvent(env, request, path, 'markdown'));
    return fetchAssetAsMarkdown(url.origin, mdPath, path);
  }

  // Any other path: return a markdown 404 so content negotiation stays
  // consistent end-to-end for markdown-accepting clients.
  trackRequest(env, path, 'markdown');
  waitUntil(logEvent(env, request, path, 'markdown'));
  return markdownNotFound(path);
};
