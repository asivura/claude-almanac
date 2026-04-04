# Claude Code Features Reference

Comprehensive documentation of Claude Code's extensibility features and capabilities for optimizing workflows and enhancing user experience.

## Website

Rendered version: **[claude-almanac.sivura.com](https://claude-almanac.sivura.com)**

The markdown files in this repo are the source of truth. They're rendered by a Fumadocs site in `site/` which auto-deploys to Cloudflare Pages on every push to `main`. To preview locally: `cd site && npm install && npm run dev`. See [CONTRIBUTING.md](./CONTRIBUTING.md) for more.

## Quick Navigation

| Feature                                                      | Description            | Use When                                                    |
| ------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------- |
| [How Claude Code Works](./features/how-claude-code-works.md) | Core architecture      | Understand the agentic loop, sessions, and what Claude sees |
| [`.claude` Directory](./features/claude-directory.md)        | Config file reference  | Learn what lives in `.claude/` and `~/.claude/`             |
| [Tools](./features/tools.md)                                 | Built-in tools         | Understand Read, Write, Edit, Bash, Grep, and more          |
| [Hooks](./features/hooks.md)                                 | Lifecycle automation   | Validate, format, protect files automatically               |
| [MCP Servers](./features/mcp-servers.md)                     | External integrations  | Connect to databases, APIs, third-party tools               |
| [Agents](./features/agents.md)                               | Specialized subagents  | Delegate complex tasks, isolate context                     |
| [Agent Teams](./features/agent-teams.md)                     | Multi-agent sessions   | Coordinate parallel work across independent instances       |
| [Skills](./features/skills.md)                               | Custom slash commands  | Create reusable commands and workflows                      |
| [Settings](./features/settings.md)                           | Configuration options  | Customize behavior, permissions, API                        |
| [IDE Integrations](./features/ide-integrations.md)           | Editor support         | VSCode, JetBrains, Vim/Neovim, Chrome                       |
| [Memory & Context](./features/memory-context.md)             | CLAUDE.md and context  | Persistent instructions, context management                 |
| [Auto Memory](./features/auto-memory.md)                     | MEMORY.md (automatic)  | Claude's self-maintained notes and learnings per project    |
| [Rules](./features/rules.md)                                 | Modular memory files   | Path-conditional guidelines, organized by topic             |
| [GitHub Actions](./features/github-actions.md)               | CI/CD integration      | PR review, issue-to-PR, automated workflows                 |
| [Remote Control](./features/remote-control.md)               | Mobile/web access      | Control terminal sessions from phone, tablet, or browser    |
| [Headless/SDK](./features/headless-sdk.md)                   | Programmatic usage     | CLI automation, custom agents, scripting                    |
| [Plugins](./features/plugins.md)                             | Shareable packages     | Distribute tools, LSP servers, team standardization         |
| [Auto Mode](./features/auto-mode.md)                         | Permission automation  | Reduce permission prompts with AI-powered safety checks     |
| [Security & Sandbox](./features/security-sandbox.md)         | Isolation and controls | Secure execution, network isolation, enterprise policies    |
| [Testing](./features/testing.md)                             | Config validation      | Validate settings, skills, schemas in CI/CD                 |
| [Plans & Pricing](./features/pricing.md)                     | Plan comparison        | Pricing, Claude Code access, feature matrix by plan         |
| [Scheduled Tasks](./features/scheduled-tasks.md)             | Recurring automation   | Cloud cron jobs, desktop tasks, CLI loops                   |
| [Checkpointing](./features/checkpointing.md)                 | Session recovery       | Undo changes, rewind to previous states, explore safely     |
| [Code Review](./features/code-review.md)                     | Automated PR review    | Multi-agent analysis for bugs, security, regressions        |
| [Channels](./features/channels.md)                           | Persistent AI threads  | Long-running projects, recurring workflows, team context    |
| [Slack Integration](./features/slack-integration.md)         | Slack-based control    | Chat with Claude in Slack, trigger tasks from channels      |
| [GitLab CI/CD](./features/gitlab-cicd.md)                    | GitLab pipelines       | MR automation, @claude mentions, Bedrock/Vertex auth        |
| [Voice Dictation](./features/voice-dictation.md)             | Speech input           | Speak prompts instead of typing, coding vocabulary          |
| [Computer Use](./features/computer-use.md)                   | GUI automation         | Native app testing, visual debugging, simulator control     |
| [Ultraplan](./features/ultraplan.md)                         | Cloud planning         | Draft plans on the web, review in browser, execute anywhere |
| [Additional Features](./features/additional-features.md)     | Advanced capabilities  | Git worktrees, images, sessions, plan mode                  |

______________________________________________________________________

## Feature Summaries

### How Claude Code Works

**Purpose**: Understand the core architecture before diving into individual features.

**Key Concepts**:

- The agentic loop: prompt → gather context → take action → verify → repeat
- Tools as the primitives that turn a language model into an agent
- Sessions, context windows, and checkpoints
- Resume vs fork for session continuity

[Full Documentation →](./features/how-claude-code-works.md)

______________________________________________________________________

### The `.claude` Directory

**Purpose**: Reference for every file Claude Code reads from your project and home directory.

**Key Concepts**:

- Project scope (`.claude/`) vs user scope (`~/.claude/`) vs managed scope
- Settings precedence order (managed > CLI flags > local > project > user)
- Subdirectories: `rules/`, `skills/`, `commands/`, `agents/`, `agent-memory/`, `output-styles/`
- How to inspect what actually loaded: `/context`, `/memory`, `/hooks`, `/doctor`

[Full Documentation →](./features/claude-directory.md)

______________________________________________________________________

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

### Agent Teams

**Purpose**: Coordinate multiple independent Claude Code instances working together on shared tasks.

**Key Capabilities**:

- Team lead orchestrates work while teammates execute independently
- Direct inter-agent communication via mailbox system
- Shared task list with self-coordination
- Display modes: in-process, tmux split panes, auto
- Quality gate hooks: TeammateIdle, TaskCreated, TaskCompleted

**Quick Start**:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
```

[Full Documentation →](./features/agent-teams.md)

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

### Auto Memory

**Purpose**: Claude automatically saves learnings, patterns, and insights about your project.

**Key Capabilities**:

- Automatic memory recording by Claude as it works
- Per-project storage in `~/.claude/projects/<project>/memory/`
- `MEMORY.md` entrypoint (first 200 lines loaded at startup)
- Topic files like `debugging.md`, `patterns.md` loaded on demand
- Manage with `/memory` command or ask Claude to remember/forget

**Quick Start**:

```markdown
# Tell Claude to remember
"Remember that we use pnpm, not npm"
"Save to memory that API tests require local Redis"

# Tell Claude to forget
"Forget that we use yarn"
"Stop remembering the old API endpoint"
```

**Released**: Claude Code v2.1.59 (Feb 26, 2026)

[Full Documentation →](./features/auto-memory.md)

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

### GitHub Actions and CI/CD

**Purpose**: Run Claude Code in GitHub Actions for automated code review, implementation, and CI/CD tasks.

**Key Capabilities**:

- Multiple auth methods: API key, Max/Pro subscription (OAuth), Vertex AI, Bedrock
- Interactive mode (`@claude` mentions) and automation mode (prompt-driven)
- Issue-to-PR automation, CI failure fixes, scheduled reviews
- Use subscription quota instead of per-token API charges

**Quick Start**:

```yaml
# With API key
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

# With Max/Pro subscription (no per-token charges)
- uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

[Full Documentation →](./features/github-actions.md)

______________________________________________________________________

### Remote Control

**Purpose**: Control a terminal Claude Code session from your phone, tablet, or any browser.

**Key Capabilities**:

- Session stays local, control from anywhere via claude.ai or mobile app
- QR code, URL, or app-based connection
- Syncs conversation across all connected devices
- Server mode for multiple concurrent sessions

**Quick Start**:

```bash
# Start remote control
claude remote-control

# Or from an existing session
/remote-control My Project
```

**Requirements**: Claude Code v2.1.51+, Pro/Max/Team/Enterprise plan.

[Full Documentation →](./features/remote-control.md)

______________________________________________________________________

### Headless Mode and Agent SDK

**Purpose**: Run Claude Code programmatically for scripting, custom agents, and automation.

**Key Capabilities**:

- CLI `-p` flag for non-interactive execution
- JSON and streaming output formats
- Python and TypeScript Agent SDKs
- Session management and multi-turn conversations

**Quick Start**:

```bash
# CLI automation
claude -p "Review code for bugs" \
  --allowedTools "Read,Edit" \
  --output-format json
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

### Auto Mode (Permission Automation)

**Purpose**: Eliminate permission prompts with AI-powered safety classification.

**Key Capabilities**:

- Two-stage classifier (Sonnet 4.6) evaluates actions before execution
- Prompt-injection probe scans tool outputs server-side
- Configurable trust boundaries for infrastructure
- Subagent action monitoring at spawn, runtime, and return
- Automatic fallback to manual prompts after repeated blocks

**Quick Start**:

```bash
# Enable auto mode
claude --enable-auto-mode

# Start directly in auto mode
claude --permission-mode auto

# View default classifier rules
claude auto-mode defaults
```

[Full Documentation →](./features/auto-mode.md)

______________________________________________________________________

### Testing Configuration

**Purpose**: Validate Claude Code configurations with automated testing.

**Key Capabilities**:

- JSON schema validation for settings.json, cd-context.json
- Skill frontmatter validation (name, description, format)
- CI/CD integration with GitLab/GitHub Actions
- Pre-commit hooks for local validation

**Quick Start**:

```bash
# Create test structure
mkdir -p .claude/tests/{src/claude_workspace_tests/{schemas,validators},tests}

# Install and run tests
cd .claude/tests
uv sync
uv run pytest -v
```

[Full Documentation →](./features/testing.md)

______________________________________________________________________

### Scheduled Tasks

**Purpose**: Run Claude Code tasks on a schedule, unattended.

**Key Capabilities**:

- Cloud tasks (cron) via claude.ai for Team/Enterprise
- Desktop tasks via the macOS/Windows app
- CLI `/loop` command for repeating local tasks
- CronCreate/CronList/CronDelete tools for programmatic scheduling
- Standard cron expressions with human-readable aliases

**Quick Start**:

```bash
# CLI loop
/loop every 30 minutes: run the test suite and report failures

# Programmatic (in a skill or agent)
CronCreate: schedule "daily at 9am" prompt "Check for dependency updates"
```

[Full Documentation →](./features/scheduled-tasks.md)

______________________________________________________________________

### Checkpointing

**Purpose**: Track file edits and rewind to previous states during sessions.

**Key Capabilities**:

- Automatic checkpoint on every user prompt
- Rewind menu via `Esc` + `Esc` or `/rewind`
- Five actions: restore code and conversation, restore conversation only, restore code only, summarize, cancel
- VS Code integration with hover-based fork and rewind
- Persists across resumed sessions (30-day retention)

**Quick Start**:

Press `Esc` twice to open the rewind menu. Select a point in the session and choose an action.

[Full Documentation →](./features/checkpointing.md)

______________________________________________________________________

### Code Review

**Purpose**: Automated PR review that catches bugs, security issues, and regressions.

**Key Capabilities**:

- Multi-agent analysis of diffs and surrounding code
- Severity levels: Important (bugs), Nit (minor), Pre-existing
- Trigger on PR creation, every push, or manual `@claude review`
- Customizable via CLAUDE.md and REVIEW.md
- Check run output with machine-readable severity JSON
- Averages $15-25 per review (billed separately)

**Quick Start**:

Enable in [admin settings](https://claude.ai/admin-settings/claude-code), install the Claude GitHub App, and configure triggers per repository. Or comment `@claude review` on any PR.

[Full Documentation →](./features/code-review.md)

______________________________________________________________________

### Channels

**Purpose**: Persistent, long-running AI threads for projects and workflows.

**Key Capabilities**:

- Named threads that persist across sessions
- Connect to GitHub repos for context-aware responses
- Team collaboration with shared channel access
- Recurring tasks and automated workflows within channels

[Full Documentation →](./features/channels.md)

______________________________________________________________________

### Slack Integration

**Purpose**: Interact with Claude Code directly from Slack.

**Key Capabilities**:

- Chat with Claude in Slack channels and DMs
- Trigger Claude Code tasks from Slack messages
- Receive notifications and updates in Slack
- Team-wide access to Claude capabilities

[Full Documentation →](./features/slack-integration.md)

______________________________________________________________________

### GitLab CI/CD

**Purpose**: Integrate Claude Code into GitLab pipelines for automated code changes.

**Key Capabilities**:

- Event-driven: `@claude` mentions in issues, MRs, and review threads
- Provider abstraction: Claude API, AWS Bedrock (OIDC), Google Vertex AI (WIF)
- Sandboxed execution in isolated containers
- Create MRs from issues, fix bugs, respond to review comments

**Quick Start**:

```yaml
claude:
  stage: ai
  image: node:24-alpine3.21
  script:
    - claude -p "${AI_FLOW_INPUT}" --permission-mode acceptEdits
```

[Full Documentation →](./features/gitlab-cicd.md)

______________________________________________________________________

### Voice Dictation

**Purpose**: Speak prompts instead of typing with push-to-talk voice input.

**Key Capabilities**:

- Hold `Space` to record, release to transcribe
- Mix voice and typing in the same message
- Coding vocabulary tuned (regex, OAuth, JSON, localhost)
- 20 supported languages
- Customizable push-to-talk key

**Quick Start**:

```text
/voice
Voice mode enabled. Hold Space to record.
```

[Full Documentation →](./features/voice-dictation.md)

______________________________________________________________________

### Computer Use

**Purpose**: Let Claude control your screen to test native apps and debug visual issues.

**Key Capabilities**:

- Open apps, click, type, scroll, and screenshot on macOS
- Per-app approval with sentinel warnings for sensitive apps
- Machine-wide lock ensures single-session control
- Global `Esc` to stop at any time
- Terminal excluded from screenshots for safety

**Quick Start**:

```text
/mcp
# Enable the computer-use server
```

Requires Pro or Max plan, macOS, Claude Code v2.1.85+.

[Full Documentation →](./features/computer-use.md)

______________________________________________________________________

### Ultraplan

**Purpose**: Draft plans in the cloud, review in your browser, execute anywhere.

**Key Capabilities**:

- Launch from CLI with `/ultraplan` or the keyword in any prompt
- Plan drafts on Claude Code on the web while your terminal stays free
- Inline comments, emoji reactions, and outline sidebar for review
- Execute on the web (auto-PR) or teleport plan back to terminal

**Quick Start**:

```text
/ultraplan migrate the auth service from sessions to JWTs
```

Requires Claude Code on the web account and a GitHub repository.

[Full Documentation →](./features/ultraplan.md)

______________________________________________________________________

### Additional Features

**Purpose**: Advanced capabilities for power users.

**Key Capabilities**:

- Git worktrees for parallel sessions
- Image/screenshot handling (paste with `Ctrl+V`)
- Jupyter notebook support
- Plan mode for safe analysis
- Session management and resumption
- Cost tracking and OpenTelemetry metrics
- Extended thinking mode

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
| Code Review               | https://code.claude.com/docs/en/code-review                               |
| GitLab CI/CD              | https://code.claude.com/docs/en/gitlab-ci-cd                              |
| Computer Use              | https://code.claude.com/docs/en/computer-use                              |
| Ultraplan                 | https://code.claude.com/docs/en/ultraplan                                 |
| Claude Code on the Web    | https://code.claude.com/docs/en/claude-code-on-the-web                    |

______________________________________________________________________

## Feature Comparison Matrix

| Feature             | Extends Capabilities | Improves UX | Optimizes Workflows | Requires Setup |
| ------------------- | -------------------- | ----------- | ------------------- | -------------- |
| Hooks               | Moderate             | High        | High                | Medium         |
| MCP Servers         | High                 | Moderate    | High                | Medium         |
| Agents              | High                 | Moderate    | High                | Low            |
| Agent Teams         | High                 | Moderate    | High                | Medium         |
| Skills              | Moderate             | High        | High                | Low            |
| Settings            | Low                  | High        | Moderate            | Low            |
| IDE Integrations    | Moderate             | High        | High                | Low            |
| Memory/Context      | Low                  | High        | High                | Low            |
| Auto Memory         | Low                  | High        | High                | None           |
| Rules               | Low                  | High        | High                | Low            |
| GitHub Actions      | High                 | Moderate    | High                | Low            |
| Remote Control      | Moderate             | High        | High                | Low            |
| Headless/SDK        | High                 | Low         | High                | Medium         |
| Plugins             | High                 | Moderate    | High                | Medium         |
| Auto Mode           | Low                  | High        | High                | Medium         |
| Security/Sandbox    | Low                  | Moderate    | Low                 | Low            |
| Testing             | Low                  | Moderate    | High                | Medium         |
| Scheduled Tasks     | Moderate             | High        | High                | Low            |
| Checkpointing       | Low                  | High        | Moderate            | None           |
| Code Review         | High                 | High        | High                | Medium         |
| Channels            | Moderate             | High        | High                | Low            |
| Slack Integration   | Moderate             | High        | Moderate            | Medium         |
| GitLab CI/CD        | High                 | Moderate    | High                | Medium         |
| Voice Dictation     | Low                  | High        | Moderate            | Low            |
| Computer Use        | High                 | High        | High                | Medium         |
| Ultraplan           | Moderate             | High        | High                | Low            |
| Additional Features | Moderate             | High        | High                | Varies         |

______________________________________________________________________

## Quick Reference

| Feature         | Config Location           | Key Command                                   |
| --------------- | ------------------------- | --------------------------------------------- |
| Hooks           | `.claude/settings.json`   | -                                             |
| MCP Servers     | `.claude/settings.json`   | `claude mcp add`                              |
| Agents          | `.claude/agents/`         | `/agents`                                     |
| Agent Teams     | `~/.claude/teams/`        | env: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| Skills          | `.claude/skills/`         | `/skill-name`                                 |
| Settings        | `.claude/settings.json`   | `/config`                                     |
| IDE             | Extension settings        | `Cmd+Esc`                                     |
| Memory          | `CLAUDE.md`               | `/memory`                                     |
| Auto Memory     | Auto-maintained           | `/memory` (toggle on/off)                     |
| Rules           | `.claude/rules/`          | `/memory`                                     |
| GitHub Actions  | `.github/workflows/`      | `anthropics/claude-code-action@v1`            |
| Remote Control  | CLI flag                  | `claude remote-control`                       |
| Headless        | CLI flags                 | `claude -p`                                   |
| Plugins         | `.claude/settings.json`   | `/plugin`                                     |
| Auto Mode       | `~/.claude/settings.json` | `claude --enable-auto-mode`                   |
| Sandbox         | `.claude/settings.json`   | `/sandbox`                                    |
| Testing         | `.claude/tests/`          | `uv run pytest`                               |
| Scheduled Tasks | claude.ai / Desktop app   | `/loop`, CronCreate                           |
| Checkpointing   | Automatic                 | `Esc` + `Esc`, `/rewind`                      |
| Code Review     | claude.ai admin settings  | `@claude review`                              |
| Channels        | claude.ai                 | -                                             |
| Slack           | Slack workspace           | `@claude` in Slack                            |
| GitLab CI/CD    | `.gitlab-ci.yml`          | `@claude` in GitLab                           |
| Voice           | `~/.claude/settings.json` | `/voice`                                      |
| Computer Use    | `/mcp`                    | Enable `computer-use` server                  |
| Ultraplan       | CLI                       | `/ultraplan`                                  |
| Plan Mode       | CLI flag                  | `--permission-mode plan`                      |
| Sessions        | -                         | `/resume`                                     |

______________________________________________________________________

## Where to Start

1. **New to Claude Code?** → Start with [Memory & Context](./features/memory-context.md) - create a CLAUDE.md file
1. **Large project?** → Organize instructions with [Rules](./features/rules.md) for modular memory
1. **Want automation?** → Check out [Hooks](./features/hooks.md) for automatic actions
1. **Need external tools?** → Set up [MCP Servers](./features/mcp-servers.md)
1. **Building workflows?** → Create [Skills](./features/skills.md) for reusable commands
1. **On the go?** → Set up [Remote Control](./features/remote-control.md) for phone/tablet access
1. **Running in CI/CD?** → Use [GitHub Actions](./features/github-actions.md) or [Headless Mode](./features/headless-sdk.md)
1. **Validating configs?** → Set up [Testing](./features/testing.md) for automated validation
1. **Parallel collaboration?** → Set up [Agent Teams](./features/agent-teams.md) for multi-instance work
1. **Sharing with team?** → Create [Plugins](./features/plugins.md) for distribution
1. **Reducing prompts?** → Enable [Auto Mode](./features/auto-mode.md) for AI-powered safety checks
1. **Need security?** → Configure [Sandbox](./features/security-sandbox.md) for isolation
1. **Reviewing PRs?** → Enable [Code Review](./features/code-review.md) for automated multi-agent analysis
1. **Using GitLab?** → Set up [GitLab CI/CD](./features/gitlab-cicd.md) for MR automation
1. **Prefer voice?** → Enable [Voice Dictation](./features/voice-dictation.md) for speech input
1. **Testing native apps?** → Use [Computer Use](./features/computer-use.md) for GUI automation
1. **Complex planning?** → Try [Ultraplan](./features/ultraplan.md) for cloud-based plan drafting
1. **Advanced features?** → Explore [Additional Features](./features/additional-features.md)

______________________________________________________________________

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development setup, pre-commit hooks, commit conventions, and the PR workflow.
