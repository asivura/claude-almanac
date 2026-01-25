# Claude Code Slash Commands and Skills

Slash commands (starting with `/`) are custom actions you can invoke directly in Claude Code conversations. Since Claude Code unified the `.claude/commands/` system with the broader **Skills** framework, all slash commands are now implemented as skills.

## Overview

**Key Features:**

- Invoke with `/skill-name`
- Claude can invoke automatically when relevant (unless disabled)
- Include supporting files, dynamic context, and complex logic
- Work across interactive mode, print mode, and subagents

## Built-in Slash Commands

| Command                   | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `/clear`                  | Clear conversation history                |
| `/compact [instructions]` | Compact conversation with optional focus  |
| `/config`                 | Open Settings interface                   |
| `/context`                | Visualize current context usage           |
| `/cost`                   | Show token usage statistics               |
| `/doctor`                 | Check Claude Code installation health     |
| `/exit`                   | Exit the REPL                             |
| `/export [filename]`      | Export conversation to file/clipboard     |
| `/help`                   | Get usage help                            |
| `/init`                   | Initialize project with CLAUDE.md guide   |
| `/mcp`                    | Manage MCP server connections             |
| `/memory`                 | Edit CLAUDE.md memory files               |
| `/model`                  | Select or change AI model                 |
| `/permissions`            | View or update permissions                |
| `/plan`                   | Enter plan mode directly                  |
| `/rename <name>`          | Rename current session                    |
| `/resume [session]`       | Resume a conversation                     |
| `/rewind`                 | Rewind conversation and/or code           |
| `/stats`                  | Visualize usage and session history       |
| `/status`                 | Show version, model, account info         |
| `/statusline`             | Set up Claude Code's status line UI       |
| `/tasks`                  | List and manage background tasks          |
| `/teleport`               | Resume a remote session                   |
| `/theme`                  | Change color theme                        |
| `/todos`                  | List current TODO items                   |
| `/usage`                  | Show plan usage limits                    |
| `/vim`                    | Enable vim-style editing                  |
| `/terminal-setup`         | Configure terminal for extended shortcuts |

**MCP Prompts:** MCP servers expose prompts as `/mcp__<server>__<prompt>`

## Creating Custom Skills

### Directory Structure

```bash
# Project-specific skills (version controlled)
mkdir -p .claude/skills/my-skill

# Personal skills (all projects)
mkdir -p ~/.claude/skills/my-skill
```

### Basic SKILL.md

```yaml
---
name: my-skill
description: What this skill does and when to use it
---

Your instructions here...
```

Invoke with `/my-skill`.

### Full Skill Structure

```
my-skill/
├── SKILL.md           # Required: Main instructions
├── reference.md       # Optional: Detailed docs
├── examples.md        # Optional: Usage examples
├── template.txt       # Optional: Template for Claude
└── scripts/
    └── helper.py      # Optional: Executable scripts
```

## SKILL.md Frontmatter

```yaml
---
name: my-skill
description: Detailed description of what this skill does
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Bash
model: sonnet
context: fork
agent: Explore
argument-hint: [argument1] [argument2]
hooks:
  PreToolUse: ./pre-tool-hook.sh
---
```

### Field Reference

| Field                      | Required    | Description                                     |
| -------------------------- | ----------- | ----------------------------------------------- |
| `name`                     | No          | Display name (lowercase, hyphens, max 64 chars) |
| `description`              | Recommended | What it does and when to use it                 |
| `disable-model-invocation` | No          | Prevent auto-loading (manual only)              |
| `user-invocable`           | No          | Hide from `/` menu (Claude only)                |
| `allowed-tools`            | No          | Tools without permission prompts                |
| `model`                    | No          | Model when skill is active                      |
| `context`                  | No          | Set to `fork` for isolated subagent             |
| `agent`                    | No          | Subagent type with `context: fork`              |
| `argument-hint`            | No          | Autocomplete hint                               |
| `hooks`                    | No          | Skill lifecycle hooks                           |

## Skill Parameters

### Passing Arguments

```yaml
---
name: fix-issue
description: Fix a GitHub issue
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Invoke: `/fix-issue 123`

### Available Variables

| Variable               | Description                       |
| ---------------------- | --------------------------------- |
| `$ARGUMENTS`           | All arguments passed to the skill |
| `${CLAUDE_SESSION_ID}` | Current session ID                |

### Dynamic Context

Use `` !`command` `` syntax for dynamic data:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`

Summarize this pull request...
```

## Invocation Control

| Frontmatter                      | You Invoke | Claude Invokes | Use Case                      |
| -------------------------------- | ---------- | -------------- | ----------------------------- |
| (default)                        | Yes        | Yes            | General knowledge/tasks       |
| `disable-model-invocation: true` | Yes        | No             | Side-effects (deploy, commit) |
| `user-invocable: false`          | No         | Yes            | Background knowledge          |

## Tool Restrictions

```yaml
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

Available: `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Skill`

## Integration with Other Features

### With Subagents

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly...
```

### With Hooks

```yaml
---
name: my-skill
hooks:
  PreToolUse: ./validate-before-running.sh
---
```

### With Extended Thinking

Include "ultrathink" in skill content:

```yaml
---
name: complex-analyzer
description: Deep analysis with extended thinking
---

Perform ultrathink analysis of...
```

## Skill Scope Hierarchy

| Location   | Path                                | Applies to      | Priority      |
| ---------- | ----------------------------------- | --------------- | ------------- |
| Enterprise | Managed settings                    | Organization    | 1 (highest)   |
| Personal   | `~/.claude/skills/<skill>/SKILL.md` | All projects    | 2             |
| Project    | `.claude/skills/<skill>/SKILL.md`   | This project    | 3             |
| Plugin     | `<plugin>/skills/<skill>/SKILL.md`  | Where installed | Via namespace |

## Best Practices

### Good Descriptions

```yaml
# Good: Specific and action-oriented
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching a codebase, or answering "how does this work?"

# Poor: Too vague
description: Code explanation skill
```

### Skill Content Types

**Reference Content** (knowledge, no action):

```yaml
---
name: api-conventions
description: API design patterns for this codebase
disable-model-invocation: false
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
```

**Task Content** (step-by-step instructions):

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

1. Run the test suite
2. Build the application
3. Push to deployment
```

### Keep SKILL.md Focused

Max 500 lines. Reference supporting files:

```markdown
## Additional resources

- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

### Restrict Availability

```json
{
  "permissions": {
    "deny": [
      "Skill(deploy:*)"
    ]
  }
}
```

## Advanced Patterns

### Dynamic Context with Git

```yaml
---
name: commit-helper
description: Help write better commits
allowed-tools: Bash(git:*)
---

## Repository state
- Current branch: !`git rev-parse --abbrev-ref HEAD`
- Changed files: !`git diff --name-only`
- Current status: !`git status --short`

Help me write a conventional commit message...
```

### Chaining Skills and Subagents

```yaml
---
name: research-and-report
description: Research and generate report
context: fork
agent: Explore
---

1. Research $ARGUMENTS thoroughly
2. Find relevant code and documentation
3. Generate findings report
```

## References

- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Interactive Mode Reference](https://code.claude.com/docs/en/interactive-mode.md)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference.md)
