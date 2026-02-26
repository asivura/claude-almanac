# Auto Memory (MEMORY.md)

Introduced in **Claude Code v2.1.59** (February 26, 2026), auto memory is a persistent directory where Claude Code automatically records learnings, patterns, and insights as it works. Unlike CLAUDE.md files — which are instructions you write for Claude — auto memory contains notes that Claude writes for itself based on what it discovers during sessions.

Auto memory is **enabled by default**. Toggle it on or off via `/memory` and selecting the auto-memory toggle.

## How Auto Memory Differs from CLAUDE.md

| Aspect                | CLAUDE.md                                   | Auto Memory (MEMORY.md)                     |
| --------------------- | ------------------------------------------- | ------------------------------------------- |
| **Who writes it**     | You (the developer)                         | Claude (automatically)                      |
| **Purpose**           | Instructions and rules for Claude to follow | Notes and learnings Claude saves for itself |
| **Shared with team**  | Yes (checked into version control)          | No (local to your machine, per project)     |
| **Loaded at startup** | Entire file                                 | First 200 lines of `MEMORY.md` only         |
| **Location**          | Project root or `.claude/`                  | `~/.claude/projects/<project>/memory/`      |

## What Claude Remembers

As Claude works, it may save things like:

- **Project patterns**: build commands, test conventions, code style preferences
- **Debugging insights**: solutions to tricky problems, common error causes
- **Architecture notes**: key files, module relationships, important abstractions
- **Your preferences**: communication style, workflow habits, tool choices

### What Claude Should NOT Save

- Session-specific context (current task details, in-progress work, temporary state)
- Information that might be incomplete — it should verify against project docs first
- Anything that duplicates or contradicts existing CLAUDE.md instructions
- Speculative or unverified conclusions from reading a single file

## Where Auto Memory Is Stored

Each project gets its own memory directory at `~/.claude/projects/<project>/memory/`.

- The `<project>` path is derived from the **git repository root**, so all subdirectories within the same repo share one auto memory directory.
- **Git worktrees** get separate memory directories.
- **Outside a git repo**, the working directory is used instead.

### Directory Structure

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes on debugging patterns
├── api-conventions.md # API design decisions
└── ...                # Any other topic files Claude creates
```

`MEMORY.md` acts as an **index** of the memory directory. Claude reads and writes files in this directory throughout your session, using `MEMORY.md` to keep track of what's stored where.

## How It Works

1. **Session startup**: The first **200 lines** of `MEMORY.md` are loaded into Claude's system prompt. Content beyond 200 lines is truncated, so Claude is instructed to keep it concise by moving detailed notes into separate topic files.
1. **Topic files on demand**: Files like `debugging.md` or `patterns.md` are **not** loaded at startup. Claude reads them on demand using its standard file tools when it needs the information.
1. **Live updates**: Claude reads and writes memory files during your session, so you'll see memory updates happen as you work.
1. **Semantic organization**: Claude organizes memories by topic, not chronologically. It checks for existing memories before writing new ones to avoid duplication.
1. **Pruning**: Claude updates or removes memories that turn out to be wrong or outdated.

## Where Auto Memory Fits in the Memory Hierarchy

Auto memory is the lowest-priority memory type. More specific instructions always take precedence:

| Priority    | Memory Type     | Location                               | Scope                      |
| ----------- | --------------- | -------------------------------------- | -------------------------- |
| 1 (highest) | Managed policy  | System-level `CLAUDE.md`               | All users in org           |
| 2           | Project memory  | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team via VCS               |
| 3           | Project rules   | `./.claude/rules/*.md`                 | Team via VCS               |
| 4           | User memory     | `~/.claude/CLAUDE.md`                  | Just you (all projects)    |
| 5           | Project local   | `./CLAUDE.local.md`                    | Just you (current project) |
| 6 (lowest)  | **Auto memory** | `~/.claude/projects/<project>/memory/` | Just you (per project)     |

## Managing Auto Memory

Auto memory files are plain markdown — you can edit them at any time.

### Using `/memory`

Run `/memory` to open the file selector, which includes:

- Your auto memory `MEMORY.md` entrypoint
- All CLAUDE.md files currently loaded
- An auto-memory toggle to turn the feature on or off

### Asking Claude to Remember

Tell Claude directly what to save:

- "Remember that we use pnpm, not npm"
- "Save to memory that the API tests require a local Redis instance"
- "Always use bun for this project"

### Asking Claude to Forget

- "Forget that we use yarn"
- "Stop remembering the old API endpoint"

Claude will find and remove the relevant entries from memory files.

### Explicit User Requests

When you ask Claude to remember something across sessions, it saves it immediately — no need to wait for confirmation across multiple interactions.

## Configuration Options

### Disable Auto Memory Globally (All Projects)

Add `autoMemoryEnabled` to your user settings:

```json
// ~/.claude/settings.json
{ "autoMemoryEnabled": false }
```

### Disable Auto Memory for a Single Project

Add `autoMemoryEnabled` to the project settings:

```json
// .claude/settings.json
{ "autoMemoryEnabled": false }
```

### Override via Environment Variable

The `CLAUDE_CODE_DISABLE_AUTO_MEMORY` environment variable takes precedence over both the `/memory` toggle and `settings.json`, making it useful for CI or managed environments:

```bash
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=1  # Force off
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=0  # Force on
```

## Best Practices

- **Keep `MEMORY.md` concise** — It acts as an index. Move detailed notes into separate topic files and link to them from MEMORY.md.
- **Organize semantically** — Group by topic (e.g., `debugging.md`, `patterns.md`), not chronologically.
- **Review periodically** — Remove outdated or incorrect memories as your project evolves.
- **Don't duplicate CLAUDE.md** — Auto memory is for learnings, not instructions. If something belongs in project instructions, put it in CLAUDE.md instead.
- **Verify before saving** — Claude should confirm patterns across multiple interactions before writing stable memories.
- **Be specific** — "Use 2-space indentation" is better than "Format code properly."
- **Use structure** — Format each memory as a bullet point and group under descriptive markdown headings.

## Release Notes

From the [Claude Code v2.1.59 changelog](https://github.com/anthropics/claude-code/releases/tag/v2.1.59) (February 26, 2026):

> Claude automatically saves useful context to auto-memory. Manage with /memory

## References

- [Memory Management (Official Docs)](https://docs.anthropic.com/docs/en/memory)
- [Claude Code Settings](https://docs.anthropic.com/docs/en/settings)
- [Claude Code v2.1.59 Release](https://github.com/anthropics/claude-code/releases/tag/v2.1.59)
