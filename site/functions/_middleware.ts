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
type PagesFunction = (context: {
  request: Request;
  next: () => Promise<Response>;
  env: {
    ANALYTICS?: {
      writeDataPoint(event: {
        indexes?: string[];
        blobs?: string[];
        doubles?: number[];
      }): void;
    };
  };
}) => Promise<Response>;

function trackRequest(
  env: {
    ANALYTICS?: {
      writeDataPoint(event: {
        indexes?: string[];
        blobs?: string[];
        doubles?: number[];
      }): void;
    };
  },
  pathname: string,
  format: 'markdown' | 'html',
): void {
  env.ANALYTICS?.writeDataPoint({
    indexes: [format],
    blobs: [pathname, format],
    doubles: [1],
  });
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

export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const accept = request.headers.get('Accept') ?? '';
  const url = new URL(request.url);

  // Skip non-markdown-accepting clients (browsers, API calls, etc).
  if (!accept.includes('text/markdown')) {
    trackRequest(env, url.pathname, 'html');
    return next();
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
    return fetchAssetAsMarkdown(url.origin, '/home.md', '/');
  }

  // LLM index endpoints — already markdown content but served as text/plain.
  // Re-wrap with the correct Content-Type when the client asks for markdown.
  if (path === '/llms.txt' || path === '/llms-full.txt') {
    trackRequest(env, path, 'markdown');
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
      return markdownNotFound(path);
    }

    const mdPath = slug
      ? `/llms.mdx/docs/${slug}/content.md`
      : '/llms.txt';

    trackRequest(env, path, 'markdown');
    return fetchAssetAsMarkdown(url.origin, mdPath, path);
  }

  // Any other path: return a markdown 404 so content negotiation stays
  // consistent end-to-end for markdown-accepting clients.
  trackRequest(env, path, 'markdown');
  return markdownNotFound(path);
};
