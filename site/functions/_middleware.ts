// Cloudflare Pages Function middleware — HTTP content negotiation for LLMs.
//
// When a client requests /docs/<slug> with `Accept: text/markdown`, we serve
// the Fumadocs-generated markdown sibling instead of HTML. Browsers (Accept:
// text/html, */*) fall through to the static HTML export.
//
// Error handling: markdown-accepting clients also get a markdown 404 body
// when the page doesn't exist (instead of falling through to the HTML 404
// page) — keeps content negotiation consistent end-to-end.
//
// See site-planning/content-negotiation-decision.md for full rationale.
//
// URL mapping:
//   /docs/<slug>                 →  /llms.mdx/docs/<slug>/content.md
//   /docs/<slug>/ (trailing /)   →  /llms.mdx/docs/<slug>/content.md
//   /docs/                       →  /llms.txt (top-level index)

// Minimal Cloudflare Pages Function signature. We avoid depending on
// @cloudflare/workers-types to keep the site/node_modules lean — Pages
// Functions run in a Workers runtime that has `fetch`, `Request`, `Response`,
// `URL`, `Headers` natively (all covered by lib.dom).
type PagesFunction = (context: {
  request: Request;
  next: () => Promise<Response>;
}) => Promise<Response>;

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

If you expected this page to exist, open an issue at
https://github.com/asivura/claude-almanac/issues.
`;
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Markdown-Tokens': Math.ceil(body.length / 4).toString(),
      Vary: 'Accept',
    },
  });
}

export const onRequest: PagesFunction = async ({ request, next }) => {
  const accept = request.headers.get('Accept') ?? '';
  const url = new URL(request.url);

  // Only intercept markdown-accepting clients hitting /docs/*. Skip paths
  // that already end in a file extension (they already address a raw asset).
  if (
    !accept.includes('text/markdown') ||
    !url.pathname.startsWith('/docs/') ||
    /\.[a-z0-9]+$/i.test(url.pathname)
  ) {
    return next();
  }

  // Map /docs/<slug> (any trailing slash) → /llms.mdx/docs/<slug>/content.md.
  // /docs/ (bare) → /llms.txt.
  const slug = url.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');

  // Guard: slugs must match our known content pattern (lowercase, digits,
  // hyphens only). Anything else is either a typo or an attempt at path
  // traversal / URL injection — return a markdown 404 so markdown-accepting
  // clients get a consistent response type.
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return markdownNotFound(url.pathname);
  }

  const mdPath = slug
    ? `/llms.mdx/docs/${slug}/content.md`
    : '/llms.txt';

  const mdUrl = new URL(mdPath, url.origin);
  const mdResponse = await fetch(mdUrl.toString(), {
    // Preserve cache-control / conditional headers where useful.
    headers: { 'User-Agent': 'content-negotiation-middleware' },
  });

  if (!mdResponse.ok) {
    // Sibling markdown missing (or other non-2xx) — return a markdown 404
    // so content negotiation stays consistent for markdown-accepting
    // clients. Browsers still hit next() via the early return above.
    return markdownNotFound(url.pathname);
  }

  const text = await mdResponse.text();
  // Heuristic: 1 token ≈ 4 characters for English text. Matches the format
  // Cloudflare's "Markdown for Agents" feature emits so tooling works with
  // either source.
  const estimatedTokens = Math.ceil(text.length / 4);

  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Markdown-Tokens': estimatedTokens.toString(),
      Vary: 'Accept',
      // Let the CDN and clients cache briefly.
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
