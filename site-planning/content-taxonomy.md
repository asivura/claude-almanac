# Content Taxonomy

- **Date**: 2026-04-04
- **Status**: Accepted

## Purpose

claude-almanac contains multiple types of content with different purposes, voices, and structures. This doc defines the taxonomy so contributors know what belongs where, and the Fumadocs site can render each type with the right layout.

## Three content types

Based on the [Diataxis framework](https://diataxis.fr/) adapted for this project.

### 1. Reference

Objective descriptions of Claude Code features.

- **Purpose**: Describe features accurately and completely
- **Voice**: Neutral, third-person, authoritative
- **Audience**: Users looking up specific capabilities
- **Structure**: Feature overview → details → examples → limitations → sources
- **Length**: 300–800 lines typical
- **Source directory**: `features/`
- **Examples**: hooks, skills, mcp, sub-agents

### 2. Guide

Problem-oriented walkthroughs and how-tos.

- **Purpose**: Help the reader accomplish a specific task
- **Voice**: Second-person, instructional ("You'll configure...")
- **Audience**: Users with a concrete goal
- **Structure**: Outcome → prerequisites → steps → verification → next steps
- **Length**: 150–400 lines typical
- **Source directory**: `guides/`
- **Examples**: agent-teams-setup, monorepo-setup, custom-mcp-server-python

### 3. Case Study

Narrative accounts of real projects using Claude Code.

- **Purpose**: Share experience, context, and lessons learned
- **Voice**: First-person ("I tried...", "we decided...")
- **Audience**: Readers seeking inspiration or understanding
- **Structure**: Context → approach → what worked → what didn't → lessons → related
- **Length**: 300–600 lines typical
- **Source directory**: `case-studies/`
- **Examples**: building-claude-almanac, refactoring-with-agents

## URL namespace

All three content types share the `/docs/<slug>` namespace. Slugs must be unique across all three source directories.

Example mapping:

| Source file                               | URL                             |
| ----------------------------------------- | ------------------------------- |
| `features/hooks.md`                       | `/docs/hooks`                   |
| `guides/agent-teams-setup.md`             | `/docs/agent-teams-setup`       |
| `case-studies/building-claude-almanac.md` | `/docs/building-claude-almanac` |

Source directory is a contributor-facing concept; URL is the reader-facing concept. Content can move between directories (re-classifying a guide as a case study, for example) without changing the URL.

## Frontmatter schemas

### Reference

```yaml
---
title: <Noun or noun phrase>
description: <One-sentence summary>
type: reference
category: core | agents | integrations | security | ci-cd | surfaces | workflows | foundational
---
```

### Guide

```yaml
---
title: <Outcome or action>
description: <What the reader will do>
type: guide
category: setup | workflow-recipes | integrations | team-workflows
time: <estimate, e.g. "15 min">
difficulty: beginner | intermediate | advanced
prerequisites:
  - <list of required knowledge/tools>
outcome: <one sentence describing the end state>
author: <name, optional>
---
```

### Case Study

```yaml
---
title: <Descriptive>
description: <TL;DR of the story>
type: case-study
project: <project name>
date: YYYY-MM-DD
duration: <e.g. "1 week">
author: <name>
themes:
  - <tag>
  - <tag>
stack:
  - <technologies used>
outcome: <one-line summary of results>
---
```

## Sidebar structure

The Fumadocs site renders three top-level sidebar sections:

```
REFERENCE
├─ Core
├─ Agents
├─ Integrations
├─ Security
├─ CI/CD
├─ Surfaces
├─ Workflows
└─ Foundational

GUIDES
├─ Setup
├─ Workflow Recipes
├─ Integrations
└─ Team Workflows

CASE STUDIES
└─ (chronological)
```

Sidebar grouping comes from `type` + `category` frontmatter fields. Reorganizing sidebar requires no URL changes.

## Page layouts

Fumadocs renders each type with a different layout:

### Reference layout

Standard Fumadocs: title, description, body, ToC on right, "Sources" section at bottom.

### Guide layout

Adds a prelude banner displaying time, difficulty, prerequisites, outcome:

```
┌────────────────────────────────────────────────┐
│ ⏱ 15 min · 📊 intermediate · 👤 Alexander      │
│ Prerequisites: macOS · Homebrew · terminal     │
│ Outcome: Ghostty + tmux ready for agent teams  │
└────────────────────────────────────────────────┘
```

Footer includes "Next steps" linking related guides.

### Case study layout

Adds a narrative header with project, date, duration, author, themes, stack:

```
┌────────────────────────────────────────────────┐
│ 📅 2026-04-04 · ⏳ 1 week · 👤 Alexander       │
│ Tags: agent-teams · documentation · fumadocs   │
│ Stack: claude-code · nextjs · cloudflare-pages │
└────────────────────────────────────────────────┘
```

Footer includes "Related case studies" and "Reference docs mentioned".

## Voice guidelines

| Type       | Tense              | Person                                | Tone                   |
| ---------- | ------------------ | ------------------------------------- | ---------------------- |
| Reference  | Present            | Third-person + imperative ("you can") | Neutral, authoritative |
| Guide      | Present/imperative | Second-person                         | Instructional, clear   |
| Case Study | Past               | First-person ("I", "we")              | Personal, reflective   |

## Slug conventions

| Type       | Pattern                                  | Example                                                |
| ---------- | ---------------------------------------- | ------------------------------------------------------ |
| Reference  | `<concept-noun>`                         | `/docs/hooks`                                          |
| Guide      | `<action>-<subject>` or `<outcome>`      | `/docs/agent-teams-setup`, `/docs/parallel-pr-reviews` |
| Case Study | `<verb>-<thing>` or `<action>-<project>` | `/docs/building-claude-almanac`                        |

## Case study structure template

```markdown
## Context
What was the problem or opportunity? What state existed before?

## Approach
How did I use Claude Code? What was the workflow?

### Phase 1: <name>
### Phase 2: <name>

## What worked
Specific wins — workflows, commands, patterns that paid off.

## What didn't work
Challenges, dead-ends, things to change next time.

## Lessons learned
Generalizable takeaways.

## Related
- Reference docs used
- Guides followed
```

## Guide structure template

```markdown
## What you'll build / accomplish
<Brief description of the end state>

## Prerequisites
- <list>

## Steps

### Step 1: <Action>
<Instructions + expected output>

### Step 2: <Action>

## Verification
<How to confirm it worked>

## Troubleshooting
<common issues and fixes>

## Next steps
<Links to related guides or reference>
```

## Contributor templates

Template files will live in `.claude/templates/` when the site is scaffolded:

- `reference-template.md`
- `guide-template.md`
- `case-study-template.md`

Contributors copy the template and fill in the frontmatter + sections.

## Cross-linking conventions

- Reference pages link to related guides in a "## See also" section
- Guides link to the reference docs for features they use
- Case studies link to reference docs and guides they used, in the "## Related" section

## Reserved slugs

The following slugs must not be used as content slugs (they are reserved for site chrome):

- `about`, `blog`, `changelog`, `search`, `tags`
- `api`, `rss`, `sitemap`, `robots`, `feed`
- `llms.txt`, `llms-full.txt`

## When to create a new content type

Don't. Three types cover all planned content. If a genuine new type emerges (e.g., "tutorials" that are distinct from guides), propose it in a new decision doc first.
