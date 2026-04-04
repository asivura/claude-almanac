# CLAUDE.md

Guidance for Claude working in the claude-almanac repository.

## Repository purpose

Public documentation for Claude Code — ~31 feature reference docs plus guides and case studies. Rendered at **claude-almanac.sivura.com** (Fumadocs site in `site/`, auto-deploys from `main` via Cloudflare Pages native git integration).

## Directory map

| Path                | Contents                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `features/`         | Reference docs (objective, third-person). Each ends with a `## Sources` section. |
| `guides/`           | How-tos (imperative, second-person)                                              |
| `case-studies/`     | Narratives (first-person)                                                        |
| `site-planning/`    | Architecture decisions (ADRs, taxonomy, CF Pages setup)                          |
| `site/`             | Fumadocs Next.js app — auto-deploys to Cloudflare Pages on push to `main`        |
| `resources/images/` | Images referenced by markdown (paths rewritten to `/images/*` at build time)     |
| `.claude/agents/`   | Project-scoped specialist agent templates                                        |

All content in `features/`, `guides/`, and `case-studies/` feeds the single `/docs/<slug>` URL namespace on the website. Slugs must be unique across the three directories.

## Content taxonomy

Per-type frontmatter schemas (reference / guide / case-study) live in `site-planning/content-taxonomy.md`. It is the canonical source for voice, structure, and required fields — treat it as binding when creating or editing content.

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

`main` requires these CI checks to pass before merge: `Validate PR Title`, `Validate Commits`, `Check Markdown Format`. The one-time setup command (`gh api .../protection`) lives in `site-planning/branch-protection.md`.

## Contributor docs

Human-facing setup (pre-commit, linting, commit conventions, PR workflow) lives in [CONTRIBUTING.md](./CONTRIBUTING.md).
