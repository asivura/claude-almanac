# Claude Code Memory and Context

Claude Code uses a hierarchical memory system to maintain context across sessions and manage the context window effectively.

## CLAUDE.md Files

CLAUDE.md is a special file that Claude reads at the start of every session. It serves as persistent memory that bridges the gap between what Claude can infer from code alone and what it needs to know from your team's conventions, workflows, and preferences.

### Key Characteristics

- Automatically loaded into context every session
- Not ephemeral like conversation history
- Shared with team members when checked into version control
- Can import additional files using `@path/to/file` syntax
- Survives context compaction during long sessions

## Memory File Hierarchy

| Memory Type        | Location                               | Purpose                        | Scope        |
| ------------------ | -------------------------------------- | ------------------------------ | ------------ |
| **Managed policy** | System-level                           | Organization-wide instructions | All users    |
| **User memory**    | `~/.claude/CLAUDE.md`                  | Personal preferences           | All projects |
| **User rules**     | `~/.claude/rules/`                     | Personal topic-specific        | All projects |
| **Project memory** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared instructions       | Team via VCS |
| **Project rules**  | `./.claude/rules/*.md`                 | Topic-specific instructions    | Team via VCS |
| **Project local**  | `./CLAUDE.local.md`                    | Personal project overrides     | Local only   |

### Priority Order (Higher = Loads First)

1. Managed policy (organization-wide)
1. User memory (`~/.claude/CLAUDE.md`)
1. User-level rules (`~/.claude/rules/`)
1. Project memory (`./.claude/CLAUDE.md` or `./CLAUDE.md`)
1. Project rules (`./.claude/rules/`)
1. Parent directory memories (for monorepos)
1. Child directory memories (loaded on-demand)

## Context Discovery

### Recursive Memory Discovery

Claude Code discovers CLAUDE.md files using both **upward** and **downward** traversal:

**Upward Discovery (Loaded at Startup):**

- Starts in current working directory
- Walks up the directory tree to repository root
- Loads all `CLAUDE.md` and `CLAUDE.local.md` files found along the path
- Enables monorepo support by loading parent-level context

**Downward Discovery (Loaded On-Demand):**

- Discovers `CLAUDE.md` files in subdirectories below current working directory
- Loads them only when you read files in those subdirectories
- Prevents context bloat in large monorepos with many packages
- Ensures you get relevant context without overwhelming the context window

### Memory Imports

CLAUDE.md files can import other files:

```markdown
# Project Guidelines

See our API conventions: @docs/api-conventions.md

Personal preferences: @~/.claude/my-preferences.md
```

- Relative paths allowed
- Absolute paths allowed
- Home directory imports: `@~/.claude/file.md`
- Maximum import depth: 5 hops
- Imports NOT evaluated inside code spans/blocks

### View Loaded Memory

Run `/memory` to see all memory files currently loaded.

## Monorepo and Large Codebase Support

Claude Code's hierarchical memory system is designed for large codebases and monorepos with multiple packages, services, or components. It automatically discovers and loads CLAUDE.md files from parent and child directories based on where you're working.

### How Hierarchical Discovery Works

**Upward Traversal (Parent Directories)**

When you start Claude Code, it walks **up** the directory tree from your current working directory to discover context:

```
/workspace/                      # Root CLAUDE.md (loaded)
├── CLAUDE.md
└── packages/
    ├── CLAUDE.md                # Package-level CLAUDE.md (loaded)
    └── web/
        ├── CLAUDE.md            # Component CLAUDE.md (loaded)
        └── src/                 # ← You run `claude` here
```

All CLAUDE.md files from your current directory up to the repository root are loaded **at startup**.

**Downward Traversal (Child Directories)**

Claude Code also discovers CLAUDE.md files in **subdirectories**, but loads them **on-demand** to prevent context bloat:

```
/workspace/packages/web/         # ← You run `claude` here
├── CLAUDE.md                    # Loaded at startup
├── src/
│   ├── frontend/
│   │   └── CLAUDE.md            # Loaded when you read files in frontend/
│   └── backend/
│       └── CLAUDE.md            # Loaded when you read files in backend/
```

**Why On-Demand Loading?**

In a monorepo with 50 packages, loading all 50 CLAUDE.md files at startup would bloat your context. Instead, Claude loads subdirectory memories only when you actually work with files in those directories.

### Example: Multi-Package Monorepo

```
monorepo/
├── CLAUDE.md                    # System overview, modernization strategy
├── packages/
│   ├── CLAUDE.md                # Component architecture, technical debt
│   ├── ui/
│   │   └── CLAUDE.md            # UI patterns, component library
│   ├── api-client/
│   │   └── CLAUDE.md            # API design, data modules
│   └── test-cases/
│       └── CLAUDE.md            # Test coverage, test patterns
```

**When you run `claude` from `packages/ui/`:**

- ✅ Loaded at startup: `monorepo/CLAUDE.md`, `packages/CLAUDE.md`, `packages/ui/CLAUDE.md`
- ⏳ Loaded on-demand: `api-client/CLAUDE.md` (when you read files in `api-client/`)
- ⏳ Loaded on-demand: `test-cases/CLAUDE.md` (when you read files in `test-cases/`)

### Controlling Discovery with `claudeMdExcludes`

In large monorepos, you may want to exclude certain CLAUDE.md files (e.g., from other teams' packages). Use the `claudeMdExcludes` setting:

**In `.claude/settings.json`:**

```json
{
  "claudeMdExcludes": [
    "**/node_modules/**",
    "packages/legacy-*/**",
    "team-b/**"
  ]
}
```

This prevents Claude from loading CLAUDE.md files matching these patterns, even when discovering them upward or on-demand.

### Best Practices for Monorepos

1. **Root-level CLAUDE.md**: System overview, shared conventions, team structure
1. **Package/service-level CLAUDE.md**: Component-specific architecture, dependencies
1. **Feature-level CLAUDE.md**: Highly specific context for complex subdirectories
1. **Use `claudeMdExcludes`**: Filter out unrelated packages/teams
1. **Keep each file focused**: Avoid duplicating information between levels

### Working from Different Directories

The memory that gets loaded depends on where you start Claude:

```bash
# From root - loads only root CLAUDE.md
cd /workspace && claude

# From packages/web - loads root + packages + web
cd /workspace/packages/web && claude

# From packages/api - loads root + packages + api
cd /workspace/packages/api && claude
```

Each location gives you the right level of context for the code you're working on.

## Context Window Management

### What Fills Context

- Conversation history
- File contents you've read
- Command outputs
- CLAUDE.md and skills
- System instructions
- MCP tool definitions

### Automatic Compaction

When approaching context limit (~95% by default), Claude automatically compacts:

**What gets preserved:**

- CLAUDE.md and rules (always kept in full)
- Recent conversation history
- Your most recent requests
- Key code snippets from recent context
- Current task state

**What may be summarized or removed:**

- Older tool outputs (file contents, command results)
- Earlier conversation turns
- Verbose search results
- Intermediate debugging output

**What triggers compaction:**

- Default: 95% of context window used
- Override: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` (triggers at 50%)

### Manual Compaction

- `/compact` - Trigger with default behavior
- `/compact <focus>` - Preserve specific context (e.g., `/compact focus on API changes`)
- Add "Compact Instructions" to CLAUDE.md to control what's preserved

### Check Context Usage

- `/context` - Visualize what's consuming space
- `/mcp` - Check per-server costs for MCP tools

## Best Practices

### Managing Context

1. **Use `/clear` between unrelated tasks** - Reset context entirely
1. **Keep CLAUDE.md concise** - Prune improves adherence
1. **Use subagents for investigation** - They run in separate context
1. **Use skills for domain knowledge** - Load on-demand
1. **Use hooks for deterministic actions** - Don't consume context
1. **Reduce MCP server overhead** - Only enable servers you need

### What to Include in CLAUDE.md

**Include:**

- Bash commands Claude can't guess
- Code style rules that differ from defaults
- Testing instructions and preferred test runners
- Repository etiquette (branch naming, PR conventions)
- Architectural decisions specific to your project
- Developer environment quirks
- Common gotchas or non-obvious behaviors

**Exclude:**

- Anything Claude can figure out from code
- Standard language conventions
- Detailed API documentation (link instead)
- Information that changes frequently
- Long explanations or tutorials
- File-by-file descriptions
- Self-evident practices

### Quality Test

For each line in CLAUDE.md, ask: "Would removing this cause Claude to make mistakes?" If not, cut it.

## Structuring CLAUDE.md

### Recommended Format

```markdown
# [Project Name]

[Brief purpose statement]

## Quick Start
- Common commands (build, test, deploy)
- Essential setup steps

## Code Style
- Language-specific conventions that differ from defaults
- Import/export preferences
- Naming conventions

## Workflow
- Branch naming conventions
- Commit message format
- PR review expectations
- Testing requirements

## Architecture
- Key architectural patterns
- How major components connect
- Directory structure explanation

## Environment
- Required environment variables
- Local development setup quirks
- Dependency installation

## Gotchas & Non-Obvious Behaviors
- Common mistakes and how to avoid them
- Performance considerations
- Known limitations
```

### Modular Rules

For larger projects, organize into `.claude/rules/`:

```
.claude/
├── CLAUDE.md                 # Main instructions
└── rules/
    ├── code-style.md         # Language-specific guidelines
    ├── testing.md            # Testing conventions
    ├── api-design.md         # API standards
    └── security.md           # Security requirements
```

### Path-Specific Rules

Each rule file can have optional YAML frontmatter:

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules
- All endpoints must include input validation
- Use standard error response format
- Include OpenAPI documentation comments
```

## Providing Context Techniques

1. **Reference files with `@`** - Use `@path/to/file` instead of describing
1. **Paste images directly** - Copy/paste or drag/drop for visual reference
1. **Provide URLs** - Paste documentation links
1. **Pipe in data** - Use `cat error.log | claude`
1. **Let Claude fetch** - Ask Claude to pull context using Bash or MCP tools

## Token Reduction Strategies

- Choose the right model (Sonnet for most, Opus for complex)
- Adjust extended thinking budget
- Offload verbose operations to subagents
- Move instructions from CLAUDE.md to skills
- Write specific prompts (details reduce back-and-forth)
- Manage context proactively with `/clear` and `/compact`

## References

- [Memory Management](https://code.claude.com/docs/en/memory.md)
- [Best Practices](https://code.claude.com/docs/en/best-practices.md)
- [Context Management](https://code.claude.com/docs/en/interactive-mode.md)
