# Site Architecture

- **Date**: 2026-04-04
- **Status**: Design spec (pre-scaffolding)
- **Future location**: moves to `site/ARCHITECTURE.md` after the Fumadocs site is scaffolded

This document explains how the claude-almanac website is built and served — from markdown source to rendered HTML and content-negotiated markdown responses. It is the canonical reference for contributors understanding the full pipeline.

## Overview

claude-almanac is a **static documentation site** with a thin dynamic edge layer:

- **Source of truth**: markdown files in the repo (`features/`, `guides/`, `case-studies/`)
- **Build tool**: [Fumadocs](https://fumadocs.dev/) (Next.js 15 + Tailwind v4 + MDX)
- **Design system**: shadcn/ui with the `claude-almanac` theme from [tweakcn.com](https://tweakcn.com)
- **Hosting**: Cloudflare Pages at `claude-almanac.sivura.com`
- **Dynamic layer**: one Cloudflare Pages Function for `Accept: text/markdown` content negotiation

## High-level architecture

```mermaid
flowchart LR
    subgraph Source["Source (git)"]
        F[features/*.md<br/>reference]
        G[guides/*.md<br/>guides]
        C[case-studies/*.md<br/>case studies]
        I[resources/images/]
        T[site/src/styles/theme.css<br/>from tweakcn]
    end

    subgraph Build["Build (Fumadocs + Next.js)"]
        B1[Read MDX]
        B2[Validate<br/>frontmatter]
        B3[Compile to<br/>React]
        B4[Static HTML<br/>+ JS + assets]
    end

    subgraph Deploy["Cloudflare Pages"]
        CDN[Global CDN]
        PF[Pages Function<br/>Accept: text/markdown]
    end

    subgraph Audience["Audience"]
        H[Human in browser]
        A[LLM agent]
    end

    F --> B1
    G --> B1
    C --> B1
    I --> B3
    T --> B3
    B1 --> B2 --> B3 --> B4
    B4 --> CDN
    CDN --> H
    CDN --> PF
    PF --> A
```

## Source content

Content lives in three directories, each with a distinct content type:

| Directory       | Content type | Frontmatter schema                         | Examples                |
| --------------- | ------------ | ------------------------------------------ | ----------------------- |
| `features/`     | Reference    | title, description, type, category         | hooks, skills, mcp      |
| `guides/`       | Guide        | + time, difficulty, prerequisites, outcome | agent-teams-setup       |
| `case-studies/` | Case study   | + project, date, duration, themes, stack   | building-claude-almanac |

All three feed the **same `/docs/` URL namespace** (slugs must be unique across directories). Source directory is a contributor concept; URL is a reader concept.

See [content-taxonomy.md](./content-taxonomy.md) for the full spec on content types, voices, and schemas.

### Source-to-URL mapping

```mermaid
flowchart LR
    subgraph Sources["Source files"]
        A[features/hooks.md]
        B[guides/agent-teams-setup.md]
        C[case-studies/building-almanac.md]
    end

    subgraph Namespace["/docs/ namespace"]
        U1["/docs/hooks"]
        U2["/docs/agent-teams-setup"]
        U3["/docs/building-almanac"]
    end

    A --> U1
    B --> U2
    C --> U3
```

## Build pipeline

When `npm run build` runs in `site/`:

```mermaid
sequenceDiagram
    participant Dev as Developer / CI
    participant NPM as npm run build
    participant MDX as fumadocs-mdx
    participant Zod as Zod schemas
    participant Shiki as Shiki
    participant Next as Next.js

    Dev->>NPM: npm run build
    NPM->>MDX: scan features/, guides/, case-studies/
    MDX->>MDX: parse frontmatter
    MDX->>Zod: validate per-type schema
    Zod-->>MDX: pass / fail build
    MDX->>Shiki: syntax highlight code blocks
    MDX->>MDX: compile MDX to React components
    MDX->>Next: emit content collections
    Next->>Next: generate sidebar (from type + category)
    Next->>Next: render static HTML per route
    Next->>Next: copy resources/images to public/images
    Next->>Next: generate llms.txt + llms-full.txt
    Next->>Next: build Orama search index
    Next-->>Dev: site/out/ ready
```

**Build output**: `site/out/` contains static HTML, JS bundles, images, search index, and LLM endpoints.

**Schema validation is strict**: a guide missing the `time` field fails the build. This catches frontmatter drift before deploy.

## Deployment flow

```mermaid
flowchart LR
    Dev[Developer] -->|git push| GH[GitHub main]
    GH -->|webhook| CF[Cloudflare Pages]
    CF -->|npm install<br/>npm run build| Build[Build container]
    Build -->|site/out/| CDN[Global CDN]
    CDN --> Users[claude-almanac.sivura.com]

    Dev -.->|open PR| PR[Pull Request]
    PR -.->|webhook| CFPreview[Preview deploy]
    CFPreview -.-> PreviewURL["<pr-branch>.claude-almanac.pages.dev"]
```

- Push to `main` → auto-deploy to production
- Open PR → preview deployment with unique URL
- Both builds run identical pipelines

## Request flow — HTML (human reader)

```mermaid
sequenceDiagram
    participant U as User browser
    participant DNS as Cloudflare DNS
    participant Edge as CF Edge
    participant Pages as CF Pages asset store

    U->>DNS: resolve claude-almanac.sivura.com
    DNS-->>U: IP
    U->>Edge: GET /docs/hooks<br/>Accept: text/html
    Edge->>Pages: fetch /docs/hooks (HTML)
    Pages-->>Edge: static HTML
    Edge-->>U: HTML (CDN cached)
```

## Request flow — Markdown (LLM agent)

When an agent sends `Accept: text/markdown` (Claude Code and OpenCode do this by default):

```mermaid
sequenceDiagram
    participant A as LLM agent<br/>(Claude Code, OpenCode)
    participant Edge as CF Edge
    participant MW as Pages Function<br/>(_middleware.ts)
    participant Pages as CF Pages asset store

    A->>Edge: GET /docs/hooks<br/>Accept: text/markdown
    Edge->>MW: invoke middleware
    MW->>MW: check Accept header
    MW->>Pages: fetch /docs/hooks.md
    Pages-->>MW: raw markdown
    MW->>MW: add Content-Type<br/>+ X-Markdown-Tokens<br/>+ Vary: Accept
    MW-->>A: text/markdown response
```

This gives us parity with Cloudflare's paid "Markdown for Agents" feature on the free tier. See [content-negotiation-decision.md](./content-negotiation-decision.md).

## Per-type page rendering

Each content type renders with a distinct layout:

```mermaid
flowchart TD
    MD[frontmatter.type] -->|reference| R[Reference layout]
    MD -->|guide| G[Guide layout]
    MD -->|case-study| C[Case study layout]

    R --> R1[Title + description]
    R --> R2[Body + ToC right]
    R --> R3[Sources at bottom]

    G --> G1[Title + description]
    G --> G2[Prelude banner:<br/>time · difficulty ·<br/>prerequisites · outcome]
    G --> G3[Numbered steps]
    G --> G4[Next steps footer]

    C --> C1[Title + description]
    C --> C2[Narrative header:<br/>date · duration · author ·<br/>themes · stack]
    C --> C3[Context / approach /<br/>lessons body]
    C --> C4[Related docs footer]
```

### Reference layout

Standard Fumadocs layout. Content is the focus. ToC auto-generates from headings on the right. "Sources" section at the bottom lists official Anthropic doc links.

### Guide layout

Adds a prelude banner above the content:

```
----------------------------------------------------
  15 min  ·  intermediate  ·  by Alexander
  Prerequisites: macOS · Homebrew · terminal basics
  Outcome: Ghostty + tmux ready for agent teams
----------------------------------------------------
```

Steps are numbered sections. Footer includes "Next steps" linking related guides.

### Case study layout

Adds a narrative header:

```
----------------------------------------------------
  2026-04-04  ·  1 week  ·  by Alexander
  Tags: agent-teams · documentation · fumadocs
  Stack: claude-code · nextjs · cloudflare-pages
----------------------------------------------------
```

Body uses first-person voice. Footer includes "Related case studies" and "Reference docs mentioned".

## Image handling

Images live in `resources/images/` at the repo root (alongside the content). At build time:

```mermaid
flowchart LR
    Src[resources/images/<br/>at repo root] -->|copy| Pub[site/public/images/<br/>at build time]
    Pub -->|serve| CDN[Cloudflare CDN]
    MD[.md files reference<br/>../resources/images/foo.png] -.->|rewrite to<br/>/images/foo.png| CDN
```

A small build step copies images and rewrites paths so both GitHub rendering and the deployed site work correctly.

## Contributor workflow

```mermaid
flowchart TD
    Start[Want to add content] --> Pick{Which type?}
    Pick -->|Reference| T1[Copy .claude/templates/reference.md<br/>to features/new-slug.md]
    Pick -->|Guide| T2[Copy .claude/templates/guide.md<br/>to guides/new-slug.md]
    Pick -->|Case study| T3[Copy .claude/templates/case-study.md<br/>to case-studies/new-slug.md]

    T1 --> FM[Fill frontmatter]
    T2 --> FM
    T3 --> FM

    FM --> Write[Write content]
    Write --> Dev[cd site/ && npm run dev<br/>localhost:3000]
    Dev --> Check{Looks right?}
    Check -->|no| Write
    Check -->|yes| Lint[npm run lint<br/>mdformat --check]
    Lint --> Commit[git commit, push]
    Commit --> PR[Open PR]
    PR --> Preview[CF Pages preview URL]
    Preview --> Review{Review OK?}
    Review -->|no| Write
    Review -->|yes| Merge[Merge to main]
    Merge --> Live[Auto-deploy to<br/>claude-almanac.sivura.com]
```

## Theme application

Theme CSS variables flow from tweakcn to every component:

```mermaid
flowchart LR
    subgraph Editor["tweakcn.com"]
        Theme[claude-almanac<br/>saved theme]
    end

    subgraph Git["Git repo"]
        CSS[site/src/styles/theme.css<br/>Tailwind v4 + OKLCH]
    end

    subgraph Runtime["Build time"]
        TW[Tailwind v4<br/>@theme directive]
        Fum[Fumadocs UI<br/>+ shadcn components]
    end

    subgraph Pages["Every rendered page"]
        P[Consistent styling<br/>light + dark mode]
    end

    Theme -.->|export CSS<br/>manual paste| CSS
    CSS --> TW
    TW --> Fum
    Fum --> P
```

**Source of truth**: tweakcn is the editor; `theme.css` in git is authoritative. Theme changes follow: tweakcn edit → export → paste → commit → PR → deploy.

## Content negotiation: the two access patterns

Readers and agents access the same content through two paths:

```mermaid
flowchart TD
    Start[GET /docs/hooks] --> Accept{Accept header}
    Accept -->|text/html<br/>or missing| HTML[Serve static HTML]
    Accept -->|text/markdown| MW[Pages Function middleware]

    MW --> Fetch[Fetch /docs/hooks.md from asset store]
    Fetch --> Wrap[Wrap with Content-Type,<br/>X-Markdown-Tokens, Vary]
    Wrap --> MD[Serve markdown]

    HTML --> Browser[Browser renders]
    MD --> Agent[Agent consumes]
```

This gives us:

- **URL suffix access**: `/docs/hooks.md` directly serves markdown (static file under the `/docs/` namespace)
- **Accept header negotiation**: `/docs/hooks` with `Accept: text/markdown` serves markdown via Pages Function

Both work simultaneously, no client-side configuration needed.

## LLM endpoints

Generated automatically at build time:

| Endpoint         | Content                                                   |
| ---------------- | --------------------------------------------------------- |
| `/llms.txt`      | Index of all content with links                           |
| `/llms-full.txt` | Full text of all content concatenated                     |
| `/docs/hooks.md` | Per-page markdown endpoint (under the `/docs/` namespace) |

## Performance characteristics

| Metric                     | Target                 |
| -------------------------- | ---------------------- |
| Time to First Byte (TTFB)  | under 100ms (CDN edge) |
| First Contentful Paint     | under 800ms            |
| JS bundle size per page    | under 100kB            |
| Build time                 | under 3 minutes        |
| Lighthouse score (desktop) | 95+                    |

## Related docs

- [framework-decision.md](./framework-decision.md) — why we chose Fumadocs
- [content-negotiation-decision.md](./content-negotiation-decision.md) — why we built our own Accept header middleware
- [content-taxonomy.md](./content-taxonomy.md) — reference vs guide vs case study
- [theme-claude-almanac.css](./theme-claude-almanac.css) — the exported theme

## Open questions

- Should we add a `/changelog` feed tracking content additions?
- Should case studies have their own RSS feed separate from the main feed?
- Do we need search analytics to understand what readers look for?

These can be decided during or after Phase 1 implementation.
