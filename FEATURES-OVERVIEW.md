# Claude Code Features Overview

A brief guide to Claude Code's extensibility features with links to detailed documentation.

______________________________________________________________________

## Hooks

**What it is**: Automated actions that execute at specific points during Claude Code sessions.

**Use for**: Auto-formatting code after edits, validating commands before execution, protecting sensitive files, adding context on session start, custom notifications.

**Example**: Automatically run Prettier after every file write.

📖 [Full Documentation](./features/hooks.md)

______________________________________________________________________

## MCP Servers (Model Context Protocol)

**What it is**: A standard protocol for connecting Claude Code to external tools, databases, and APIs.

**Use for**: Querying databases, integrating with GitHub/Notion/Sentry, accessing third-party APIs, building custom tool integrations.

**Example**: Query your PostgreSQL database with natural language.

📖 [Full Documentation](./features/mcp-servers.md)

______________________________________________________________________

## Agents (Subagents)

**What it is**: Specialized AI assistants that handle tasks in isolated context windows with specific tool access.

**Use for**: Delegating research tasks, code review, running tests in separate context, parallel investigations, specialized workflows.

**Example**: Create a `code-reviewer` agent that only has read access and reviews code for quality issues.

📖 [Full Documentation](./features/agents.md)

______________________________________________________________________

## Skills (Slash Commands)

**What it is**: Custom commands invokable with `/command` that provide reusable instructions and workflows.

**Use for**: Creating project-specific workflows, automating repetitive tasks, sharing team conventions, building command libraries.

**Example**: `/deploy` command that runs tests, builds, and deploys your application.

📖 [Full Documentation](./features/skills.md)

______________________________________________________________________

## Settings & Configuration

**What it is**: Multi-level configuration system for customizing Claude Code behavior, permissions, and integrations.

**Use for**: Setting up permissions (allow/deny rules), configuring API keys, customizing models, managing MCP servers, sandbox settings.

**Example**: Auto-approve all `npm run` commands while blocking `rm -rf`.

📖 [Full Documentation](./features/settings.md)

______________________________________________________________________

## IDE Integrations

**What it is**: Native integrations with popular development environments.

**Supported**: VSCode (extension), JetBrains IDEs (plugin), Vim/Neovim (mode), Chrome (browser automation).

**Use for**: Using Claude directly in your editor, inline diff viewing, selection context sharing, keyboard shortcuts.

**Example**: Press `Cmd+Esc` in VSCode to focus Claude and discuss selected code.

📖 [Full Documentation](./features/ide-integrations.md)

______________________________________________________________________

## Memory & Context (CLAUDE.md)

**What it is**: Persistent instruction files that Claude reads at the start of every session.

**Use for**: Project guidelines, coding conventions, common commands, architectural decisions, workflow documentation.

**Example**: Document your commit message format so Claude always follows it.

📖 [Full Documentation](./features/memory-context.md)

______________________________________________________________________

## Rules (Modular Memory)

**What it is**: Topic-specific instruction files in `.claude/rules/` that extend CLAUDE.md.

**Use for**: Organizing large instruction sets, path-conditional guidelines, team-shared standards by domain (frontend, backend, testing, security).

**Example**: Create `api.md` rule that only loads when editing files in `src/api/`.

📖 [Full Documentation](./features/rules.md)

______________________________________________________________________

## Headless Mode & Agent SDK

**What it is**: Programmatic interface for running Claude Code non-interactively.

**Use for**: CI/CD pipelines, automated code review, batch processing, building custom AI applications, GitHub Actions.

**Example**: `claude -p "Review this PR for security issues" --output-format json`

📖 [Full Documentation](./features/headless-sdk.md)

______________________________________________________________________

## Plugins

**What it is**: Packages of reusable functionality including commands, agents, hooks, MCP servers, and LSP integrations.

**Use for**: Sharing tools across projects, distributing versioned extensions, team standardization, community ecosystem.

**Example**: Install TypeScript LSP plugin for enhanced code intelligence.

📖 [Full Documentation](./features/plugins.md)

______________________________________________________________________

## Security & Sandbox

**What it is**: Native sandboxing with filesystem and network isolation, plus enterprise-grade permission controls.

**Use for**: Secure code execution, network isolation, file system restrictions, enterprise policy enforcement, audit logging.

**Example**: Enable sandbox mode to auto-approve bash commands within safe boundaries.

📖 [Full Documentation](./features/security-sandbox.md)

______________________________________________________________________

## Additional Features

**What it is**: Collection of powerful but lesser-known capabilities.

**Includes**: GitHub Actions, git worktrees, image handling, Jupyter notebooks, plan mode, session management, cost tracking, task lists, extended thinking, Chrome automation, Slack integration, desktop app.

**Example**: Use `Ctrl+V` to paste screenshots for visual debugging.

📖 [Full Documentation](./features/additional-features.md)

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

______________________________________________________________________

*Full feature documentation available in the [docs/features/](./features/) directory.*
