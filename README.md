# Claude Code Features Reference

Comprehensive documentation of Claude Code's extensibility features and capabilities for optimizing workflows and enhancing user experience.

## Quick Navigation

| Feature                                                  | Description            | Use When                                                 |
| -------------------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| [Hooks](./features/hooks.md)                             | Lifecycle automation   | Validate, format, protect files automatically            |
| [MCP Servers](./features/mcp-servers.md)                 | External integrations  | Connect to databases, APIs, third-party tools            |
| [Agents](./features/agents.md)                           | Specialized subagents  | Delegate complex tasks, isolate context                  |
| [Skills](./features/skills.md)                           | Custom slash commands  | Create reusable commands and workflows                   |
| [Settings](./features/settings.md)                       | Configuration options  | Customize behavior, permissions, API                     |
| [IDE Integrations](./features/ide-integrations.md)       | Editor support         | VSCode, JetBrains, Vim/Neovim, Chrome                    |
| [Memory & Context](./features/memory-context.md)         | CLAUDE.md and context  | Persistent instructions, context management              |
| [Rules](./features/rules.md)                             | Modular memory files   | Path-conditional guidelines, organized by topic          |
| [Headless/SDK](./features/headless-sdk.md)               | Programmatic usage     | CI/CD, automation, custom agents                         |
| [Plugins](./features/plugins.md)                         | Shareable packages     | Distribute tools, LSP servers, team standardization      |
| [Security & Sandbox](./features/security-sandbox.md)     | Isolation and controls | Secure execution, network isolation, enterprise policies |
| [Additional Features](./features/additional-features.md) | Advanced capabilities  | GitHub Actions, git worktrees, images, sessions          |

______________________________________________________________________

## Feature Summaries

### Hooks

**Purpose**: Automate actions at specific points during Claude Code sessions.

**Key Capabilities**:

- PreToolUse/PostToolUse hooks for validation and formatting
- SessionStart/SessionEnd for environment setup and cleanup
- PermissionRequest for auto-approve/deny decisions
- Stop hooks for intelligent continuation decisions

**Quick Start**:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "prettier --write $FILE" }]
    }]
  }
}
```

[Full Documentation →](./features/hooks.md)

______________________________________________________________________

### MCP Servers (Model Context Protocol)

**Purpose**: Connect Claude Code to external tools, databases, and APIs.

**Key Capabilities**:

- HTTP, SSE, and stdio transport types
- Pre-built servers for GitHub, Notion, PostgreSQL, Sentry, etc.
- Custom server development with Python/TypeScript SDKs
- OAuth 2.0 authentication support

**Quick Start**:

```bash
# Add an HTTP server
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Add a stdio server
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "..."
```

[Full Documentation →](./features/mcp-servers.md)

______________________________________________________________________

### Agents and Subagents

**Purpose**: Delegate tasks to specialized AI assistants with isolated contexts.

**Key Capabilities**:

- Built-in agents: Explore, Plan, General-Purpose
- Custom agent creation with tool restrictions
- Background execution for non-blocking operations
- Session persistence and resumption

**Quick Start**:

```markdown
---
name: code-reviewer
description: Expert code review specialist
tools: Read, Grep, Glob
model: sonnet
---

Review code for quality, security, and maintainability.
```

[Full Documentation →](./features/agents.md)

______________________________________________________________________

### Skills (Slash Commands)

**Purpose**: Create reusable commands and workflows invokable with `/command`.

**Key Capabilities**:

- Custom slash commands with dynamic context
- Tool restrictions and permission control
- Supporting files and templates
- Integration with subagents and hooks

**Quick Start**:

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
allowed-tools: Bash
---

1. Run tests: npm test
2. Build: npm run build
3. Deploy: npm run deploy
```

[Full Documentation →](./features/skills.md)

______________________________________________________________________

### Settings and Configuration

**Purpose**: Customize Claude Code behavior, permissions, and integrations.

**Key Capabilities**:

- Multi-level configuration hierarchy (managed, local, project, user)
- Permission system with allow/ask/deny rules
- Environment variables for API configuration
- Sandbox and security settings

**Quick Start**:

```json
{
  "permissions": {
    "allow": ["Bash(npm run:*)", "Read(./src/**)"],
    "deny": ["Bash(rm -rf:*)"]
  },
  "model": "sonnet"
}
```

[Full Documentation →](./features/settings.md)

______________________________________________________________________

### IDE Integrations

**Purpose**: Use Claude Code directly within your development environment.

**Key Capabilities**:

- VSCode extension with native GUI
- JetBrains IDE plugin support
- Vim/Neovim mode with full keybindings
- Chrome browser automation (beta)

**Key Shortcuts**:

| Action       | Mac             | Windows/Linux    |
| ------------ | --------------- | ---------------- |
| Focus Claude | `Cmd+Esc`       | `Ctrl+Esc`       |
| New Tab      | `Cmd+Shift+Esc` | `Ctrl+Shift+Esc` |
| @-Mention    | `Option+K`      | `Alt+K`          |

[Full Documentation →](./features/ide-integrations.md)

______________________________________________________________________

### Memory and Context Management

**Purpose**: Maintain persistent instructions and manage context window effectively.

**Key Capabilities**:

- CLAUDE.md files for project/user instructions
- Modular rules in `.claude/rules/`
- Memory imports with `@path/to/file`
- Auto-compaction and manual `/compact` command

**Quick Start**:

```markdown
# CLAUDE.md

## Quick Start
- Build: `npm run build`
- Test: `npm test`

## Code Style
- Use 2-space indentation
- Prefer functional components
```

[Full Documentation →](./features/memory-context.md)

______________________________________________________________________

### Rules (Modular Memory)

**Purpose**: Organize instructions into topic-specific, path-conditional files.

**Key Capabilities**:

- Split CLAUDE.md into focused topic files
- Path-conditional rules (only load for matching files)
- Subdirectory organization by domain
- Project and user-level rule scopes

**Quick Start**:

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Standards

- Use RESTful naming conventions
- Validate all inputs with zod
- Return consistent error format
```

[Full Documentation →](./features/rules.md)

______________________________________________________________________

### Headless Mode and Agent SDK

**Purpose**: Run Claude Code programmatically for automation and CI/CD.

**Key Capabilities**:

- CLI `-p` flag for non-interactive execution
- JSON and streaming output formats
- Python and TypeScript SDKs
- GitHub Actions integration

**Quick Start**:

```bash
# CLI automation
claude -p "Review code for bugs" \
  --allowedTools "Read,Edit" \
  --output-format json

# GitHub Actions
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR"
```

[Full Documentation →](./features/headless-sdk.md)

______________________________________________________________________

### Plugins

**Purpose**: Package and distribute reusable Claude Code functionality.

**Key Capabilities**:

- Bundle commands, agents, skills, hooks, MCP servers
- Install from official marketplace or custom sources
- LSP server integrations for code intelligence
- Team and enterprise distribution

**Quick Start**:

```bash
# Install from official marketplace
/plugin install typescript-lsp@claude-plugins-official

# Create custom plugin
mkdir -p my-plugin/.claude-plugin
echo '{"name": "my-plugin"}' > my-plugin/.claude-plugin/plugin.json
```

[Full Documentation →](./features/plugins.md)

______________________________________________________________________

### Security and Sandbox

**Purpose**: Secure code execution with filesystem and network isolation.

**Key Capabilities**:

- Native sandboxing (macOS Seatbelt, Linux bubblewrap)
- Network isolation with domain allowlists
- File system restrictions (write to cwd only)
- Enterprise managed policies and audit logging

**Quick Start**:

```bash
# Enable sandbox mode
/sandbox

# View permissions
/permissions

# Plan mode for safe analysis
claude --permission-mode plan
```

[Full Documentation →](./features/security-sandbox.md)

______________________________________________________________________

### Additional Features

**Purpose**: Advanced capabilities for power users.

**Key Capabilities**:

- GitHub Actions integration for CI/CD
- Git worktrees for parallel sessions
- Image/screenshot handling (paste with `Ctrl+V`)
- Jupyter notebook support
- Plan mode for safe analysis
- Session management and resumption
- Cost tracking and OpenTelemetry metrics
- Extended thinking mode
- Chrome browser automation
- Slack integration

[Full Documentation →](./features/additional-features.md)

______________________________________________________________________

## Official References

| Resource                  | URL                                                                       |
| ------------------------- | ------------------------------------------------------------------------- |
| Claude Code Documentation | https://code.claude.com/docs                                              |
| Model Context Protocol    | https://modelcontextprotocol.io                                           |
| Claude Agent SDK          | https://platform.claude.com/docs/en/agent-sdk                             |
| GitHub Actions            | https://github.com/anthropics/claude-code-action                          |
| VS Code Extension         | https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code |

______________________________________________________________________

## Feature Comparison Matrix

| Feature             | Extends Capabilities | Improves UX | Optimizes Workflows | Requires Setup |
| ------------------- | -------------------- | ----------- | ------------------- | -------------- |
| Hooks               | Moderate             | High        | High                | Medium         |
| MCP Servers         | High                 | Moderate    | High                | Medium         |
| Agents              | High                 | Moderate    | High                | Low            |
| Skills              | Moderate             | High        | High                | Low            |
| Settings            | Low                  | High        | Moderate            | Low            |
| IDE Integrations    | Moderate             | High        | High                | Low            |
| Memory/Context      | Low                  | High        | High                | Low            |
| Rules               | Low                  | High        | High                | Low            |
| Headless/SDK        | High                 | Low         | High                | Medium         |
| Plugins             | High                 | Moderate    | High                | Medium         |
| Security/Sandbox    | Low                  | Moderate    | Low                 | Low            |
| Additional Features | Moderate             | High        | High                | Varies         |

______________________________________________________________________

## Quick Reference

| Feature     | Config Location         | Key Command              |
| ----------- | ----------------------- | ------------------------ |
| Hooks       | `.claude/settings.json` | -                        |
| MCP Servers | `.claude/settings.json` | `claude mcp add`         |
| Agents      | `.claude/agents/`       | `/agents`                |
| Skills      | `.claude/skills/`       | `/skill-name`            |
| Settings    | `.claude/settings.json` | `/config`                |
| IDE         | Extension settings      | `Cmd+Esc`                |
| Memory      | `CLAUDE.md`             | `/memory`                |
| Rules       | `.claude/rules/`        | `/memory`                |
| Headless    | CLI flags               | `claude -p`              |
| Plugins     | `.claude/settings.json` | `/plugin`                |
| Sandbox     | `.claude/settings.json` | `/sandbox`               |
| Plan Mode   | CLI flag                | `--permission-mode plan` |
| Sessions    | -                       | `/resume`                |

______________________________________________________________________

## Where to Start

1. **New to Claude Code?** → Start with [Memory & Context](./features/memory-context.md) - create a CLAUDE.md file
1. **Large project?** → Organize instructions with [Rules](./features/rules.md) for modular memory
1. **Want automation?** → Check out [Hooks](./features/hooks.md) for automatic actions
1. **Need external tools?** → Set up [MCP Servers](./features/mcp-servers.md)
1. **Building workflows?** → Create [Skills](./features/skills.md) for reusable commands
1. **Running in CI/CD?** → Use [Headless Mode](./features/headless-sdk.md)
1. **Sharing with team?** → Create [Plugins](./features/plugins.md) for distribution
1. **Need security?** → Configure [Sandbox](./features/security-sandbox.md) for isolation
1. **Advanced features?** → Explore [Additional Features](./features/additional-features.md)
