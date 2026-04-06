# Security Audit: claude-almanac

- **Date**: 2026-04-04
- **Auditor**: security-auditor teammate
- **Scope**: repo + site config + CI + Pages Function
- **Out of scope**: Cloudflare dashboard settings (separate teammate)

## Summary

0 critical, 0 high, 3 medium, 6 low/informational findings.
**Overall: clean — safe to deploy.** No secrets were found in the repo or git
history, no known vulnerabilities in `site/` dependencies, and the Pages
Function has no exploitable input-validation issues on a public static site.
The medium findings are hardening gaps (missing response headers, SHA-pinning
third-party actions, no Dependabot) worth closing but not blockers.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

#### M-1: Missing security response headers

No `site/public/_headers` (or `_headers` at site root) file exists, so the
deployed site will emit no `Content-Security-Policy`, `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, or `Strict-Transport-Security` headers
beyond Cloudflare's defaults.

Impact: modest for a static docs site with no user input, but leaves
defense-in-depth protections (clickjacking, MIME sniffing, referrer leakage,
forced-HTTPS) unset.

Fix: add `site/public/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

CSP may need tuning (`'unsafe-inline'` for Next.js static export hydration) —
test on a preview deploy before enforcing.

#### M-2: Third-party GitHub Actions pinned by tag, not SHA

`.github/workflows/links.yml` references `lycheeverse/lychee-action@v2` and
`.github/workflows/pr-title.yml` references
`amannn/action-semantic-pull-request@v5`. Both are pinned by major version tag.
If either maintainer is compromised or force-pushes the tag, the action can
run arbitrary code with the workflow's `GITHUB_TOKEN`.

Permissions are already scoped (`issues: write`, `pull-requests: read`) so
blast radius is bounded, but SHA pinning is the industry-standard hardening.
`actions/checkout@v4` and `astral-sh/setup-uv@v5` are from first-party/trusted
orgs (GitHub, Astral) — lower risk but the same recommendation applies for
consistency.

Fix: pin to commit SHAs (use Dependabot to keep them current):

```yaml
- uses: lycheeverse/lychee-action@<commit-sha>  # v2.x.y
```

#### M-3: No Dependabot config

No `.github/dependabot.yml` — npm dependencies in `site/` and GitHub Actions
versions are not tracked for security updates. `site/` pulls in 752 total
dependencies (271 prod, 420 dev) via fumadocs + Next.js 16 + React 19.

Fix: add `.github/dependabot.yml` with weekly updates for `npm` (ecosystem
for `/site`) and `github-actions` (ecosystem for `/`).

### LOW / INFORMATIONAL

#### L-1: Pages Function path traversal, no real-world impact

`site/functions/_middleware.ts` lines 37-44: slug is extracted from
`url.pathname`, concatenated into a template path, then passed to
`new URL(mdPath, url.origin)` which normalizes `..` segments. A request like
`GET /docs/../../foo` with `Accept: text/markdown` resolves to a fetch of
`https://<origin>/foo/content.md` and, if the file exists, serves its body
as `text/markdown; charset=utf-8`.

Impact on this site: essentially nil. The fetch is same-origin, and the
deployed `out/` directory contains only files that are already publicly
readable. The worst outcome is that a public HTML or JSON file can be
re-served with a `text/markdown` Content-Type, which is a correctness bug,
not a secret disclosure.

Recommendation (non-blocking): reject slugs that contain `..` or add an
explicit regex `/^[a-z0-9\-\/]+$/i` guard before building `mdPath`.

#### L-2: Loose `Accept` header matching

The middleware uses `accept.includes('text/markdown')` rather than parsing
per RFC 9110. A header like `Accept: application/text/markdown-evil` matches.
Harmless here (only flips the response format), but worth tightening if the
middleware ever gates anything more sensitive.

#### L-3: Branch protection: 0 required approvals, no signed commits

`enforce_admins: true`, `allow_force_pushes: false`, `allow_deletions: false`,
`required_linear_history: true`, and three required status checks are all in
place. `required_approving_review_count: 0` and
`required_signatures.enabled: false` are appropriate for a solo-maintained
public docs repo, but are listed here for the record. If additional
maintainers are added, raise the review count to 1 and consider requiring
signed commits.

#### L-4: Root `.gitignore` does not include `.env*`

`site/.gitignore` covers `.env*.local` and `*.pem`, but the repo-root
`.gitignore` does not. If a contributor ever adds a `.env` file at repo root
(out of muscle memory), it would not be ignored. Defense-in-depth fix: add
`.env*` and `*.pem` to the root `.gitignore`.

#### L-5: No CODEOWNERS, CodeQL, or SECURITY.md

Public repo has no `CODEOWNERS` file (no mandatory reviewer routing), no
CodeQL workflow (free for public repos, catches JS/TS issues), and no
`SECURITY.md` / security contact. All nice-to-have hardening for a public
repository.

#### L-6: `postinstall` script runs on `npm install`

`site/package.json` declares `"postinstall": "fumadocs-mdx"`. This is normal
for Fumadocs but is a reminder that any transitive dep with a `postinstall`
script runs with local privileges. `npm audit` is clean (0 advisories across
752 deps) so this is informational.

## What was checked

- **Secret scan**: grep across the whole repo (excluding `node_modules/`) for
  AWS/GCP/Azure/GitHub/OpenAI/Anthropic/Slack/Stripe token prefixes,
  `BEGIN ... PRIVATE KEY`, connection strings (`postgres://` etc.), inline
  `password=`/`secret=`/`api_key=` assignments with 16+ char values, and
  email addresses. Also scanned git history with `git log -p -S'<prefix>'`
  for each secret pattern (132 commits, nothing found). All hits were
  documentation placeholders (`sk-ant-xxxxx`, `ghp_xxxxxxxxxxxx`,
  `${{ secrets.ANTHROPIC_API_KEY }}`).
- **Filename sweep**: searched for `.env`, `.env.*`, `*.pem`, `id_rsa*`,
  `credentials.json`, `*.key`, `.npmrc`, `.secrets` across the tree. None
  committed.
- **npm audit** on `site/`: 0 vulnerabilities (info/low/moderate/high/critical
  all zero) across 752 total deps. Fumadocs packages verified as author
  "Fuma Nama" / repo `github:fuma-nama/fumadocs` — matches expected
  upstream.
- **CI workflows** at `.github/workflows/*.yml`: all 5 files reviewed.
  Checked action pins, `permissions:` blocks, trigger types
  (`pull_request` vs `pull_request_target`), secret usage, and echo/log
  leakage. No `pull_request_target` anywhere. No secrets echoed. Permissions
  scoped to minimum in every file.
- **Pages Function** at `site/functions/_middleware.ts`: 71 lines reviewed
  for SSRF (none — fetch is scoped to `url.origin`), path traversal (see
  L-1), input validation (see L-2), error disclosure (none — falls through
  to `next()` on errors), and response header correctness.
- **Branch protection**: live-fetched via `gh api repos/asivura/claude-almanac/branches/main/protection`. Verified required
  status checks, `enforce_admins: true`, `allow_force_pushes: false`,
  `allow_deletions: false`, `required_linear_history: true`. See L-3.
- **Next.js config** at `site/next.config.mjs`: confirmed `output: 'export'`
  (no SSR runtime), `images: { unoptimized: true }` (no remote image
  backdoor), `reactStrictMode: true`. No custom headers block and no Next.js
  rewrites (consistent with static export).
- **App routes**: all `route.ts`/`route.tsx`/`page.tsx` under `site/src/app`
  either use `generateStaticParams` or are static handlers (`export const revalidate = false`). No runtime input handling at request time.
- **XSS sinks** in `site/src`: grepped for `dangerouslySetInnerHTML`, `eval(`,
  `new Function(`, `document.write`, `innerHTML`, `javascript:` hrefs. No
  matches.
- **.gitignore coverage**: verified that `site/node_modules/`, `site/.next/`,
  `site/out/`, `site/.source/`, `site/public/images/` are all ignored. Repo
  has 0 untracked files (33k+ build-file issue mitigated).
- **PII scan**: grepped for emails, phone patterns, internal/corp hostnames,
  RFC1918 IPs. All hits were in docs as examples (`user@example.com`,
  `*.corp.example.com`, `mcp.internal.com`) or false positives.
- **Supply-chain check**: fumadocs-core@16.7.10, fumadocs-ui@16.7.10,
  fumadocs-mdx@14.2.11 — all author "Fuma Nama", repo
  `github:fuma-nama/fumadocs`, MIT license.

## What was NOT checked (out of scope)

- Cloudflare dashboard security settings (project-level build env vars,
  access policies, WAF rules, rate limiting) — handled by cf-pages-setup
  teammate.
- SSL/TLS configuration on `claude-almanac.sivura.com` (site not deployed
  yet at time of audit).
- CDN cache poisoning and edge-side vulnerabilities.
- Runtime Pages Function behavior in the live Workers runtime (only static
  review performed).
- DNS / domain registrar security for `sivura.com`.
- Third-party services linked from docs (GitHub, Anthropic, Cloudflare
  docs) — trust-by-reputation.

## Recommendations (non-findings)

Hardening suggestions that are not strict issues:

- Add `.github/dependabot.yml` (covers M-2 and M-3).
- Add `site/public/_headers` with CSP + security headers (covers M-1).
- Add a `SECURITY.md` with a contact address (e.g.
  `alexander@amberflows.com`) and disclosure policy.
- Add a minimal CodeQL workflow for JS/TS — free on public repos.
- Tighten middleware slug validation with a regex allowlist (covers L-1).
- Add `.env*` and `*.pem` to root `.gitignore` (covers L-4).
- Consider adding a `robots.txt` at `site/public/robots.txt` to explicitly
  allow crawling and point to `llms.txt` / `llms-full.txt` for LLM agents.
