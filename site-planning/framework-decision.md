# Framework Decision: Fumadocs

- **Date**: 2026-04-04
- **Status**: Accepted
- **Author**: Alexander Sivura

## Context

We are building a public documentation website for claude-almanac, hosted at
`almanac.sivura.com`. The site will expose 30+ markdown feature docs from this repo
to a broader audience than GitHub's markdown viewer reaches.

Requirements:

1. Static site, deployable to Cloudflare Pages
1. Matches shadcn/ui + Tailwind v4 aesthetic (consistency with bridge-docs)
1. React-based stack (ecosystem, component reuse)
1. 2026-native (React 19, Next.js 15 or Astro equivalent)
1. Built-in: sidebar nav, client-side search, dark mode, ToC, syntax highlighting
1. MDX support for interactive content when needed
1. Strong TypeScript
1. LLM-friendly (llms.txt generation out of the box)

## Decision

**Use [Fumadocs](https://fumadocs.dev/) (Next.js 15 + Tailwind v4 + MDX).**

## Options Considered

| Framework             | Stars | shadcn fit             | Status    |
| --------------------- | ----- | ---------------------- | --------- |
| **Fumadocs**          | 11.4k | 5/5 — designed for it  | ✅ Chosen |
| Astro Starlight       | 8.2k  | 2/5 — awkward          | Runner-up |
| Nextra v4             | 13.7k | 3/5 — workable         | Rejected  |
| Docusaurus 3          | 63.1k | 2/5 — poor fit         | Rejected  |
| Custom Astro + shadcn | N/A   | 5/5 — but DIY          | Rejected  |
| Vocs (Vite + React)   | ~1k   | 3/5 — DIY              | Rejected  |
| MkDocs Material       | ~20k  | 0/5 — Python, no React | Rejected  |
| VitePress             | ~13k  | 0/5 — Vue, no React    | Rejected  |

## Rationale

### Primary reason: shadcn/ui compatibility

**shadcn/ui's own documentation site runs on Fumadocs.** Other shadcn-ecosystem
projects using Fumadocs include:

- Better Auth
- Prisma (recently migrated from Nextra)
- Zod
- Hero UI
- Arktype
- Drizzle ORM
- CopilotKit
- Nativewind

When the reference implementation of shadcn uses Fumadocs for its own docs,
copying that stack is the fastest path to a pixel-perfect shadcn aesthetic.

### Secondary reasons

- **2026-native stack**: React 19 + Next.js 15 App Router + Tailwind v4
- **Purpose-built for docs**: Built-in sidebar, client-side search (Orama),
  ToC, dark mode, MDX components
- **LLM-friendly out of the box**: `fumadocs-core` includes `llms.txt` and
  `llms-full.txt` generation via [their LLMs integration](https://fumadocs.dev/docs/integrations/llms)
- **Active development**: Weekly releases through 2025-2026
- **TypeScript-first**: Type-safe frontmatter, routes, content queries
- **Customizable**: Can override any UI component without fighting the framework

## Rejected Alternatives

### Astro Starlight (runner-up)

**Pros:**

- Astro already in our stack (bridge-docs, astro-whoami)
- Best-in-class performance (~12kB JS vs Fumadocs' ~85kB)
- Fastest to launch (most opinionated)
- Used by Cloudflare, Netlify, Biome, SST, freeCodeCamp

**Rejected because:**

- shadcn integration requires React islands and `.not-content` escape hatches
- Astro's island model is awkward for heavy component customization
- "Fighting the theme" becomes a tax on every customization

### Custom Astro + shadcn

**Pros:**

- Matches bridge-docs exactly (same framework)
- Full control over every component

**Rejected because:**

- Requires building sidebar, search, ToC, dark mode from scratch
- Fumadocs already solves the same problem with equivalent flexibility
- Maintenance burden on custom components outweighs the benefit

### Nextra v4

**Pros:**

- Bigger mindshare (Vercel, tRPC, SWR)
- Mature, well-documented

**Rejected because:**

- More opinionated theme, harder to match shadcn deeply
- Fumadocs trajectory is stronger (3× YoY growth vs flat Nextra)
- Nextra v4 is a complete rewrite for App Router; migration path from v3 is non-trivial

### Docusaurus 3

**Pros:**

- Highest star count (63k)
- Used by React itself, Redux, Jest

**Rejected because:**

- Feels legacy in 2026 (slow release cadence)
- Classic theme actively fights shadcn/Tailwind customization
- Poor React 19 story

## Consequences

### Accepted tradeoffs

1. **Bus factor**: Fumadocs is primarily maintained by one developer (fuma-nama).
   *Mitigation*: Blue-chip adoption (shadcn, Prisma, Zod) means the community
   would fork if the project stopped.

1. **Bundle size**: ~85kB JS vs Starlight's ~12kB.
   *Mitigation*: On Cloudflare Pages CDN for 30+ mostly-static pages, this is
   imperceptible to users.

1. **More DIY than Starlight**: "Compose primitives" philosophy means slightly
   more setup.
   *Mitigation*: The flexibility is the feature — we gain customization ceiling.

1. **Different framework from bridge-docs**: No shared components between
   bridge-docs (Astro) and almanac (Next.js).
   *Mitigation*: We share CSS tokens via tweakcn-exported theme variables.
   Component sharing rarely happens in practice across sites with different
   audiences anyway.

### Benefits we gain

- Pixel-perfect shadcn aesthetic with zero impedance
- Future-proof React 19 / Next.js 15 / Tailwind v4 stack
- Growing ecosystem with strong trajectory
- Purpose-built docs features without custom code

## When to revisit this decision

Re-evaluate the framework if:

- Fumadocs maintenance stalls (no releases for >6 months)
- We need to share substantial components with bridge-docs
- Bundle size becomes a concern from real-world performance metrics
- A new entrant emerges with equivalent shadcn integration and materially better tradeoffs

## References

- [Fumadocs documentation](https://fumadocs.dev/)
- [Fumadocs showcase](https://www.fumadocs.dev/showcase)
- [Fumadocs comparisons](https://www.fumadocs.dev/docs/comparisons)
- [shadcn/ui documentation](https://ui.shadcn.com) (runs on Fumadocs)
- [Fumadocs LLMs integration](https://fumadocs.dev/docs/integrations/llms)
- [Fumadocs v15 blog (Tailwind v4)](https://www.fumadocs.dev/blog/v15)
