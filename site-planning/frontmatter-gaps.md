# Frontmatter Gaps

- **Generated**: 2026-04-04 (during task #6 — configure fumadocs content collections)
- **Status**: Action required

## Summary

Per the schema defined in [content-taxonomy.md](./content-taxonomy.md), every
markdown file in `features/`, `guides/`, and `case-studies/` should have
frontmatter declaring `title`, `description`, `type`, and type-specific fields
(`category`, `time`, `difficulty`, `prerequisites`, `outcome`, etc.).

**Current state**: only 1 of 33 content files has complete frontmatter.

| Directory       | Files | With frontmatter | Missing frontmatter |
| --------------- | ----: | ---------------: | ------------------: |
| `features/`     |    31 |                0 |                  31 |
| `guides/`       |     2 |                1 |                   1 |
| `case-studies/` |     1 |                0 |                   1 |

## How this affects the site build

To unblock the site build in task #6, the fumadocs collection schemas in
`site/source.config.ts` are configured **leniently**: `title` and `description`
are optional with sensible defaults (title falls back to the first `<h1>` or
the file slug; description falls back to an empty string). `type` is always
auto-derived from the source directory.

Type-specific required fields per `content-taxonomy.md` (`category`, `time`,
`difficulty`, `prerequisites`, `outcome`, `date`, `duration`, etc.) are
currently all optional in the schema. The site will build but pages will
render with missing banner information until frontmatter is filled in.

Once frontmatter is added across the board, tighten the schemas in
`site/source.config.ts` to make these required and fail the build on missing
values.

## README files in content dirs

`guides/README.md` and `case-studies/README.md` are contributor notes, not
content pages. The fumadocs collections ignore `README.md` via glob filters.

## Checklist — files that need frontmatter

### features/ (reference type)

Each file needs:

```yaml
---
title: <from H1 or manual>
description: <one-sentence summary>
type: reference
category: core | agents | integrations | security | ci-cd | surfaces | workflows | foundational
---
```

- [ ] features/additional-features.md — H1: "Claude Code Additional Features"
- [ ] features/agent-teams.md — H1: "Claude Code Agent Teams"
- [ ] features/agents.md — H1: "Claude Code Agents and Subagents"
- [ ] features/auto-memory.md — H1: "Auto Memory (MEMORY.md)"
- [ ] features/auto-mode.md — H1: "Claude Code Auto Mode"
- [ ] features/channels.md — H1: "Claude Code Channels"
- [ ] features/checkpointing.md — H1: "Claude Code Checkpointing"
- [ ] features/claude-directory.md — H1: "The `.claude` Directory"
- [ ] features/code-review.md — H1: "Claude Code Review"
- [ ] features/computer-use.md — H1: "Claude Code Computer Use"
- [ ] features/github-actions.md — H1: "Claude Code GitHub Actions and CI/CD"
- [ ] features/gitlab-cicd.md — H1: "Claude Code GitLab CI/CD"
- [ ] features/headless-sdk.md — H1: "Claude Code Headless Mode and Agent SDK"
- [ ] features/hooks.md — H1: "Claude Code Hooks"
- [ ] features/how-claude-code-works.md — H1: "How Claude Code Works"
- [ ] features/ide-integrations.md — H1: "Claude Code IDE Integrations"
- [ ] features/mcp-servers.md — H1: "Claude Code MCP (Model Context Protocol) Servers"
- [ ] features/memory-context.md — H1: "Claude Code Memory and Context"
- [ ] features/plugins.md — H1: "Claude Code Plugins"
- [ ] features/pricing.md — H1: "Claude Code Plans and Pricing"
- [ ] features/remote-control.md — H1: "Claude Code Remote Control"
- [ ] features/rules.md — H1: "Claude Code Rules"
- [ ] features/scheduled-tasks.md — H1: "Claude Code Scheduled Tasks"
- [ ] features/security-sandbox.md — H1: "Claude Code Security and Sandbox"
- [ ] features/settings.md — H1: "Claude Code Settings and Configuration"
- [ ] features/skills.md — H1: "Claude Code Slash Commands and Skills"
- [ ] features/slack-integration.md — H1: "Claude Code in Slack"
- [ ] features/testing.md — H1: "Testing Claude Code Configurations"
- [ ] features/tools.md — H1: "Claude Code Built-in Tools Reference"
- [ ] features/ultraplan.md — H1: "Claude Code Ultraplan"
- [ ] features/voice-dictation.md — H1: "Claude Code Voice Dictation"

### guides/ (guide type)

Each file needs (beyond the reference schema):

```yaml
time: <e.g. "15 min">
difficulty: beginner | intermediate | advanced
prerequisites:
  - <list>
outcome: <one-line end state>
author: <name, optional>
```

- [x] guides/agent-teams-setup.md — has frontmatter
- (guides/README.md — ignored as contributor note)

### case-studies/ (case-study type)

Each file needs (beyond the reference schema):

```yaml
project: <project name>
date: YYYY-MM-DD
duration: <e.g. "1 week">
author: <name>
themes:
  - <tag>
stack:
  - <technologies>
outcome: <summary of results>
```

- (case-studies/README.md — ignored as contributor note)
- **No actual case-study content yet.** A stub file
  `case-studies/building-claude-almanac.md` should be added during task #7
  to verify the case-study render path.

## Suggested migration plan

1. **Phase 1** (this PR): land lenient schemas so the site builds.
1. **Phase 2** (follow-up PR): spawn a teammate per category to add
   frontmatter. Group features into related batches (e.g., all CI/CD docs,
   all agents docs) for one teammate each.
1. **Phase 3**: tighten schemas in `site/source.config.ts` — make `category`,
   type-specific fields required. Site build then fails on drift.

## Related

- [content-taxonomy.md](./content-taxonomy.md) — source of truth for schema fields
- `site/source.config.ts` — current (lenient) schemas
