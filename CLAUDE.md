# CLAUDE.md

Guidance for Claude working in the claude-almanac repository.

## Repository purpose

Public documentation for Claude Code — ~31 feature reference docs plus guides and case studies. Rendered at **claude-almanac.sivura.com** (Fumadocs site in `site/`, deploys from `main` via GitHub Actions + `wrangler pages deploy`).

## Directory map

| Path                | Contents                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `features/`         | Reference docs (objective, third-person). Each ends with a `## Sources` section. |
| `guides/`           | How-tos (imperative, second-person)                                              |
| `case-studies/`     | Narratives (first-person)                                                        |
| `internals/`        | Architecture decisions (ADRs, taxonomy, CF Pages setup)                          |
| `site/`             | Fumadocs Next.js app — auto-deploys to Cloudflare Pages on push to `main`        |
| `resources/images/` | Images referenced by markdown (paths rewritten to `/images/*` at build time)     |
| `.claude/agents/`   | Project-scoped specialist agent templates                                        |

All content in `features/`, `guides/`, and `case-studies/` feeds the single `/docs/<slug>` URL namespace on the website. Slugs must be unique across the three directories.

## Content taxonomy

Per-type frontmatter schemas (reference / guide / case-study) live in `internals/content-taxonomy.md`. It is the canonical source for voice, structure, and required fields — treat it as binding when creating or editing content.

## Source attribution convention

Every feature doc ends with a `## Sources` section linking to the official Anthropic docs it was derived from (`code.claude.com/docs`, `anthropic.com/engineering`). Prefer `.md` suffix URLs where available — they serve raw markdown for LLM-friendly fetching.

## Post-write rule for markdown

After editing any `.md` file, run mdformat on it:

```bash
uvx --with mdformat-gfm --with mdformat-tables --with mdformat-frontmatter mdformat <path>
```

Pre-commit hooks will catch anything missed, but running manually avoids the pre-commit rejection loop.

## Agent templates

Prefer the project-scoped specialists in `.claude/agents/` over generic subagents — they know this repo's conventions. See `.claude/agents/README.md` for the catalog (doc-updater, doc-creator, blog-researcher, pr-reviewer, cloudflare-browser-ops).

## Website development

Local preview of the Fumadocs site:

```bash
cd site
npm install   # first time only
npm run dev   # → http://localhost:3000
```

Production build (static export to `site/out/`):

```bash
cd site && npm run build
```

The build reads content from `../features/`, `../guides/`, `../case-studies/` at the repo root, and copies images from `../resources/images/` into `site/public/images/` via a prebuild script (`scripts/copy-images.mjs`). No content lives inside `site/` — the site is just the rendering layer.

Deploy: GitHub Actions builds and deploys via `wrangler pages deploy` on every push to `main` (see `.github/workflows/site-build.yml`). No preview deployments — test locally. See `internals/cloudflare-setup.md` for the project setup and `site/DEPLOY.md` for post-deploy verification.

## Deployment rules

- **NEVER** deploy directly via `wrangler pages deploy` or `wrangler pages deployment create` from a local machine. All deployments MUST go through the CI/CD pipeline (GitHub Actions).
- Direct deploys bypass CI checks and risk deploying stale or incorrect builds.
- If a redeploy is needed without code changes (e.g., to pick up new CF Pages bindings/secrets), use `gh run rerun <run-id>` to re-trigger the last successful workflow.

## Design system (website)

The website uses **Fumadocs** (Next.js 15 + Tailwind CSS v4 + shadcn/ui). The visual theme is the **"claude-almanac"** preset on [tweakcn.com](https://tweakcn.com/editor/theme) — warm terracotta primary on cream background, matching Anthropic's Claude brand palette.

### Theme source of truth

**tweakcn is the authoring tool; the exported CSS at `site/src/styles/theme.css` is the source of truth.**

Workflow for theme changes:

1. Open [tweakcn.com](https://tweakcn.com/editor/theme), load the "claude-almanac" theme
1. Make visual edits (colors, radius, typography) with live preview
1. Save in tweakcn
1. Click **Code** → copy the generated CSS (Tailwind v4 + OKLCH format)
1. Paste into `site/src/styles/theme.css`
1. Open a PR — review via the Cloudflare Pages preview deployment
1. Merge when the preview looks right

Never edit theme variables directly in `theme.css` except to paste from tweakcn export.

### Current theme values

| Token      | Value                                |
| ---------- | ------------------------------------ |
| Primary    | `#c96442` (terracotta)               |
| Background | `#faf9f5` (warm cream)               |
| Foreground | `#3d3929` (warm olive-brown)         |
| Radius     | `0.5rem`                             |
| Fonts      | Inter (body) + JetBrains Mono (code) |

## Branch protection

`main` requires these CI checks to pass before merge: `Validate PR Title`, `Validate Commits`, `Check Markdown Format`. The one-time setup command (`gh api .../protection`) lives in `internals/branch-protection.md`.

## Contributor docs

Human-facing setup (pre-commit, linting, commit conventions, PR workflow) lives in [CONTRIBUTING.md](./CONTRIBUTING.md).
