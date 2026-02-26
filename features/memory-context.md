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

Claude Code reads memories by walking up the directory tree:

- Starts in current working directory
- Recurses up to (but not including) root directory
- Reads any `CLAUDE.md` or `CLAUDE.local.md` files found
- Discovers `CLAUDE.md` files in subtrees under current directory
- Nested subtree memories only included when Claude reads files in those subtrees

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

## Auto Memory

Auto memory is a persistent directory where Claude records learnings, patterns, and insights as it works. Unlike CLAUDE.md files that contain instructions you write for Claude, auto memory contains notes Claude writes for itself based on what it discovers during sessions.

Auto memory is enabled by default. Toggle it on or off via `/memory` and selecting the auto-memory toggle.

### What Claude Remembers

As Claude works, it may save things like:

- **Project patterns**: build commands, test conventions, code style preferences
- **Debugging insights**: solutions to tricky problems, common error causes
- **Architecture notes**: key files, module relationships, important abstractions
- **Your preferences**: communication style, workflow habits, tool choices

### Where Auto Memory Is Stored

Each project gets its own memory directory at `~/.claude/projects/<project>/memory/`. The `<project>` path is derived from the git repository root, so all subdirectories within the same repo share one auto memory directory. Git worktrees get separate memory directories. Outside a git repo, the working directory is used instead.

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes on debugging patterns
├── api-conventions.md # API design decisions
└── ...                # Any other topic files Claude creates
```

### How It Works

- The first **200 lines** of `MEMORY.md` are loaded into Claude's system prompt at the start of every session. Content beyond 200 lines is not loaded automatically — Claude is instructed to keep it concise by moving detailed notes into separate topic files.
- Topic files like `debugging.md` or `patterns.md` are **not** loaded at startup. Claude reads them on demand using its standard file tools when it needs the information.
- Claude reads and writes memory files during your session, so you'll see memory updates happen as you work.

### Managing Auto Memory

Auto memory files are plain markdown — you can edit them at any time. Use `/memory` to open the file selector, which includes your auto memory entrypoint alongside your CLAUDE.md files.

**Asking Claude to remember something:**

- "Remember that we use pnpm, not npm"
- "Save to memory that the API tests require a local Redis instance"

**Asking Claude to forget something:**

- "Forget that we use yarn"
- "Stop remembering the old API endpoint"

**Disabling auto memory globally:**

```json
// ~/.claude/settings.json
{ "autoMemoryEnabled": false }
```

**Disabling via environment variable:**

```bash
export CLAUDE_AUTO_MEMORY_ENABLED=false
```

### Auto Memory Best Practices

- **Keep `MEMORY.md` concise** — It acts as an index. Move detailed notes into topic files.
- **Organize semantically** — Group by topic (e.g., `debugging.md`, `patterns.md`), not chronologically.
- **Review periodically** — Remove outdated or incorrect memories.
- **Don't duplicate CLAUDE.md** — Auto memory is for learnings, not instructions.
- **Verify before saving** — Claude should confirm patterns across multiple interactions before writing.

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
