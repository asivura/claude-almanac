# Fumadocs feature request — draft

- **Status**: Submitted → https://github.com/fuma-nama/fumadocs/issues/3186
- **PR for `description` + `sections`**: https://github.com/fuma-nama/fumadocs/pull/3187
- **PR for `transform`**: https://github.com/fuma-nama/fumadocs/pull/3188
- **Target repo**: https://github.com/fuma-nama/fumadocs/issues
- **Date submitted**: 2026-04-05
- **Relates to**: `site/scripts/patch-llms-txt.mjs`, `content-negotiation-decision.md`

This is a DRAFT of a feature request to submit upstream. It proposes
extending Fumadocs' `LLMsConfig` so users can add a description
blockquote and custom sections to the auto-generated `llms.txt`,
eliminating the need for post-build patching.

______________________________________________________________________

## Proposed title

`feat(core): allow custom description and sections in llms.txt output`

## Proposed body

### Summary

`llms(source, config).index()` produces the auto-generated page tree,
but there's no way to include additional prose — description blockquote,
custom sections, or footer. Users end up post-processing the output at
build time.

The [llms.txt spec](https://llmstxt.org/) actually calls for a
`> description` blockquote after the title, which Fumadocs currently
omits.

### Use cases

1. **Description blockquote** (per llmstxt.org spec — missing today)
1. **Access patterns** — advertising `Accept: text/markdown`, URL
   suffixes, `.md` endpoints
1. **Security / disclosure** pointers
1. **License / attribution** notes
1. **Canonical URL** or mirror information

### Current workaround

Post-processing the generated file at build time. Example:
[site/scripts/patch-llms-txt.mjs](https://github.com/asivura/claude-almanac/blob/main/site/scripts/patch-llms-txt.mjs)

Works but is brittle to Fumadocs output-format changes and duplicates
work across the ecosystem.

### Proposed API

Expand `LLMsConfig` with two new optional fields:

```ts
interface LLMsConfig {
  TAB?: string;
  renderName?: (item: Node | Root, ctx: Context) => string;
  renderDescription?: (item: Item | Folder, ctx: Context) => string;

  // NEW
  description?: string;           // Blockquote after H1 title (per llmstxt.org spec)
  sections?: LLMsSection[];       // Custom sections
}

interface LLMsSection {
  heading: string;                // renders as ## {heading}
  content: string;                // raw markdown body
  position?: 'before-index' | 'after-index';  // default 'before-index'
}
```

Output structure becomes:

```
# {title}

> {description}    ← if description set

## {section.heading}    ← before-index sections
{section.content}

- [Page 1](...)    ← page tree
- [Page 2](...)

## {section.heading}    ← after-index sections
{section.content}
```

### Alternative: transform function

Simpler API that gives full control:

```ts
interface LLMsConfig {
  transform?: (defaultOutput: string, ctx: Context) => string;
}
```

Less ergonomic for the common case but maximally flexible.

### Ecosystem fit

Similar to how `getLLMText` in `/llms-full.txt` lets users customize
per-page content — this would let them customize `llms.txt` document
structure.

Happy to submit a PR if the design is accepted.

______________________________________________________________________

## Submission checklist

- [ ] User reviews + approves draft
- [ ] Search for duplicate / overlapping issues one more time before filing
- [ ] Decide: submit `description` + `sections` only, OR include `transform`,
  OR all three
- [ ] Decide: offer to submit PR or wait for maintainer feedback first
- [ ] Adjust tone / length per Fumadocs' issue template conventions
- [ ] Submit via `gh issue create --repo fuma-nama/fumadocs ...`
- [ ] Link the filed issue back here (update Status line above)

## Open questions for user

1. Propose both `description` + `sections`, or just one?
1. Include `transform` as an alternative, or drop it for simplicity?
1. Offer to submit PR?
1. Any additional use cases to add beyond the five above?
