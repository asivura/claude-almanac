---
title: The .claude Directory
description: Where Claude Code reads instructions, settings, skills, subagents, and memory.
category: foundational
---

# The `.claude` Directory

Claude Code reads instructions, settings, skills, subagents, and memory from two locations:

- **`.claude/`** inside your project (shared with your team via git)
- **`~/.claude/`** in your home directory (personal configuration, applies across all projects)

Most users only edit `CLAUDE.md` and `settings.json`. Everything else is optional: add skills, rules, or subagents as you need them.

## Scopes

Claude Code has three configuration scopes, with a clear precedence order:

| Scope             | Location                                                                                       | Commit to Git?   | Purpose                                               |
| ----------------- | ---------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------- |
| **Managed**       | System-level, varies by OS (`managed-settings.json`)                                           | N/A              | Enterprise-enforced policies that override everything |
| **Project**       | `.claude/` in your repo, plus `CLAUDE.md`, `.mcp.json`, `.worktreeinclude` at the project root | Yes (most files) | Team-shared configuration, rules, and extensions      |
| **User (Global)** | `~/.claude/`                                                                                   | No               | Your personal configuration across all projects       |

**Precedence (highest first):**

1. Managed settings from your organization
1. CLI flags (`--permission-mode`, `--settings`)
1. `.claude/settings.local.json` (your personal project overrides)
1. `.claude/settings.json` (team-shared project settings)
1. `~/.claude/settings.json` (your global defaults)

Array settings like `permissions.allow` **combine** across all scopes. Scalar settings like `model` use the most specific value.

## Project-Scope Files

These live in your repository and should be committed so your team shares them.

### Project Root

| File               | Committed         | Purpose                                        |
| ------------------ | ----------------- | ---------------------------------------------- |
| `CLAUDE.md`        | Yes               | Project instructions loaded into every session |
| `CLAUDE.local.md`  | No (gitignore it) | Your private preferences for this project      |
| `.mcp.json`        | Yes               | Team-shared MCP servers                        |
| `.worktreeinclude` | Yes               | Gitignored files to copy into new worktrees    |

### `.claude/` Subdirectory

| File / Folder                | Committed            | Purpose                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------- |
| `settings.json`              | Yes                  | Permissions, hooks, statusline, model, env vars, output style |
| `settings.local.json`        | No (auto-gitignored) | Your personal overrides for this project                      |
| `rules/*.md`                 | Yes                  | Topic-scoped instructions, optionally path-gated              |
| `skills/<name>/SKILL.md`     | Yes                  | Reusable prompts invoked with `/name`                         |
| `commands/*.md`              | Yes                  | Single-file prompts (same mechanism as skills)                |
| `output-styles/*.md`         | Yes                  | Custom system-prompt sections (if your team shares any)       |
| `agents/*.md`                | Yes                  | Subagent definitions with their own prompt and tools          |
| `agent-memory/<name>/`       | Yes                  | Persistent memory for subagents with `memory: project`        |
| `agent-memory-local/<name>/` | No                   | Subagent memory with `memory: local` (gitignored)             |

## User-Scope Files (`~/.claude/`)

These are your personal configuration. Never committed to any repository.

| File / Folder                          | Purpose                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `~/.claude.json`                       | App state: OAuth session, UI toggles, personal MCP servers, per-project trust decisions |
| `~/.claude/CLAUDE.md`                  | Personal preferences loaded alongside every project's `CLAUDE.md`                       |
| `~/.claude/settings.json`              | Your default settings for all projects                                                  |
| `~/.claude/keybindings.json`           | Custom keyboard shortcuts                                                               |
| `~/.claude/projects/<project>/memory/` | [Auto memory](./auto-memory.md): Claude's notes to itself per project                   |
| `~/.claude/rules/`                     | User-level rules that apply to every project                                            |
| `~/.claude/skills/`                    | Personal skills available in every project                                              |
| `~/.claude/commands/`                  | Personal single-file commands                                                           |
| `~/.claude/output-styles/`             | Custom system-prompt styles                                                             |
| `~/.claude/agents/`                    | Personal subagents available everywhere                                                 |
| `~/.claude/agent-memory/<name>/`       | Subagent memory with `memory: user` (cross-project)                                     |

## What Each Directory Does

### `CLAUDE.md`

Project-specific instructions that shape how Claude works in this repository. Loaded into context at the **start of every session**. Put your conventions, common commands, and architectural context here.

Target under 200 lines. Longer files still load but may reduce adherence. Also works at `.claude/CLAUDE.md` if you prefer to keep the project root clean.

See [Memory & Context](./memory-context.md).

### `settings.json`

Settings Claude Code applies directly: [permissions](./settings.md) that control which commands and tools Claude can use, [hooks](./hooks.md) that run your scripts at specific points, statusline, default model, env vars, and output style.

Unlike `CLAUDE.md` (guidance Claude reads), settings are **enforced** whether Claude follows them or not.

See [Settings](./settings.md).

### `rules/`

Project instructions split into topic files that can load conditionally based on file paths.

- A rule **without** `paths:` frontmatter loads at session start (like `CLAUDE.md`)
- A rule **with** `paths:` frontmatter loads only when Claude reads a matching file

Example `.claude/rules/testing.md`:

```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

- Use descriptive test names: "should [expected] when [condition]"
- Mock external dependencies, not internal modules
- Clean up side effects in afterEach
```

See [Rules](./rules.md).

### `skills/`

Reusable prompts you or Claude invoke with `/skill-name`. Each skill is a folder with a `SKILL.md` file plus any supporting files it needs.

Example `.claude/skills/security-review/SKILL.md`:

```markdown
---
description: Reviews code changes for security vulnerabilities
disable-model-invocation: true
argument-hint: <branch-or-path>
---

## Diff to review

!`git diff $ARGUMENTS`

Audit the changes above for injection risks and auth gaps.
Use checklist.md in this skill directory for the full checklist.
```

Skills can bundle reference docs, templates, scripts. See [Skills](./skills.md).

### `commands/`

Single-file prompts invoked with `/name`. A file at `commands/deploy.md` creates `/deploy` the same way a skill at `skills/deploy/SKILL.md` does.

**Commands and skills are the same mechanism.** For new workflows, prefer `skills/` since it lets you bundle supporting files. Commands remain supported.

### `agents/`

Specialized [subagents](./agents.md) with their own system prompt, tool access, and optionally their own model. Each subagent runs in a **fresh context window**, keeping the main conversation clean.

Example `.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Reviews code for correctness, security, and maintainability
tools: Read, Grep, Glob
---

You are a senior code reviewer. Review for:

1. Correctness: logic errors, edge cases, null handling
2. Security: injection, auth bypass, data exposure
3. Maintainability: naming, complexity, duplication
```

### `agent-memory/`

Persistent memory for subagents. Created only for subagents with `memory: project` (or `memory: local`, `memory: user`) in their frontmatter. Each subagent has its own `MEMORY.md` it reads and writes itself.

This is **distinct** from your main-session auto memory at `~/.claude/projects/`.

### `output-styles/`

Custom system-prompt sections that adjust how Claude works. Each markdown file defines a style. Select one via `/config` or the `outputStyle` setting. Most live globally in `~/.claude/output-styles/` since they're personal.

### `~/.claude/projects/<project>/memory/` (Auto Memory)

Claude's [auto memory](./auto-memory.md): learnings Claude saves automatically as you work. You don't write these files, Claude does.

- `MEMORY.md` is the index loaded at session start (first 200 lines or 25 KB)
- Topic files like `debugging.md` or `architecture.md` are read on demand

See [Auto Memory](./auto-memory.md).

## Example Project Structure

A realistic `.claude/` for a TypeScript project:

```
your-project/
├── CLAUDE.md                       # Team conventions, build/test commands
├── .mcp.json                       # Shared MCP servers (e.g., GitHub)
├── .worktreeinclude                # Copy .env into worktrees
└── .claude/
    ├── settings.json               # Permissions, hooks
    ├── settings.local.json         # Your personal overrides (gitignored)
    ├── rules/
    │   ├── testing.md              # Scoped to **/*.test.ts
    │   └── api-design.md           # Scoped to src/api/**/*.ts
    ├── skills/
    │   └── security-review/
    │       ├── SKILL.md
    │       └── checklist.md
    ├── commands/
    │   └── fix-issue.md            # /fix-issue <number>
    ├── agents/
    │   └── code-reviewer.md
    └── agent-memory/
        └── code-reviewer/
            └── MEMORY.md           # Subagent writes this
```

## Example Global Structure

Your `~/.claude/` might look like:

```
~/
├── .claude.json                    # App state, OAuth, UI prefs
└── .claude/
    ├── CLAUDE.md                   # Personal preferences
    ├── settings.json               # Your defaults
    ├── keybindings.json            # Custom shortcuts
    ├── skills/
    │   └── my-tool/SKILL.md        # Personal skills
    ├── output-styles/
    │   └── teaching.md             # Custom teaching mode
    ├── agents/
    │   └── reviewer.md             # Personal subagents
    └── projects/
        └── my-project/
            └── memory/
                ├── MEMORY.md       # Claude's auto memory
                └── debugging.md
```

## Inspect What Loaded

The explorer shows what files **can** exist. To see what **actually loaded** in your current session:

| Command        | Shows                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| `/context`     | Token usage by category: system prompt, memory, skills, MCP tools, messages |
| `/memory`      | Which `CLAUDE.md` and rules files loaded, plus auto-memory entries          |
| `/agents`      | Configured subagents and their settings                                     |
| `/hooks`       | Active hook configurations                                                  |
| `/mcp`         | Connected MCP servers and their status                                      |
| `/skills`      | Available skills from project, user, and plugin sources                     |
| `/permissions` | Current allow and deny rules                                                |
| `/doctor`      | Installation and configuration diagnostics                                  |

Run `/context` first for the overview, then the specific command for the area you want to investigate.

## Sources

- [Explore the .claude Directory (Official Docs)](https://code.claude.com/docs/en/claude-directory)
- [Memory](https://code.claude.com/docs/en/memory)
- [Settings](https://code.claude.com/docs/en/settings)
- [Settings Precedence](https://code.claude.com/docs/en/settings#settings-precedence)
- [Server-Managed Settings](https://code.claude.com/docs/en/server-managed-settings)
