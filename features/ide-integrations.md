---
title: IDE Integrations
description: Claude Code integrations with VS Code, JetBrains, desktop, web, Chrome, and the terminal.
category: surfaces
---

# Claude Code IDE Integrations

Claude Code integrates with multiple IDEs, editors, and surfaces to provide AI-assisted development directly in your workflow.

| Surface                                           | Type              | Status           |
| ------------------------------------------------- | ----------------- | ---------------- |
| [VS Code Extension](#vscode-extension)            | IDE extension     | Stable           |
| [JetBrains Plugin](#jetbrains-ide-integration)    | IDE plugin        | Beta             |
| [Desktop App](#desktop-app)                       | Native app        | Stable           |
| [Claude Code on the Web](#claude-code-on-the-web) | Cloud             | Research preview |
| [Chrome Integration](#chromebrowser-integration)  | Browser extension | Beta             |
| [CLI](#terminal-keyboard-shortcuts)               | Terminal          | Stable           |

## VSCode Extension

### Installation

- Search "Claude Code" in Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
- Direct links: [Install for VS Code](vscode:extension/anthropic.claude-code), [Install for Cursor](cursor:extension/anthropic.claude-code)
- Requirements: VS Code 1.98.0+ (check [extension page](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) for current minimum)

### Core Features

- **Native graphical interface**: Dedicated panel in VS Code, draggable to sidebar, panel, or editor area
- **Inline diff viewing**: Side-by-side comparison before accepting
- **Selection context**: Shares selected text and open files automatically
- **@-mention references**: Tag files/folders with line numbers (`@file.ts#5-10`), supports fuzzy matching
- **Permission modes**: Normal, Plan Mode, Auto-Accept, Auto, Bypass Permissions
- **Conversation history**: Browse and resume past conversations (including remote sessions from claude.ai)
- **Multi-tab support**: Multiple conversations simultaneously in tabs or separate windows
- **Checkpoints**: Rewind file changes to any point in the conversation (fork, rewind code, or both)
- **Plugin management**: Install/manage plugins via `/plugins` in the prompt box
- **Terminal output references**: Reference terminal output with `@terminal:name`
- **URI handler**: Open Claude Code tabs from external tools via `vscode://anthropic.claude-code/open`

### Keyboard Shortcuts

| Command          | Mac             | Windows/Linux    |
| ---------------- | --------------- | ---------------- |
| Focus Input      | `Cmd+Esc`       | `Ctrl+Esc`       |
| Open in New Tab  | `Cmd+Shift+Esc` | `Ctrl+Shift+Esc` |
| New Conversation | `Cmd+N`         | `Ctrl+N`         |
| Insert @-Mention | `Option+K`      | `Alt+K`          |
| Multiline Input  | `Shift+Enter`   | `Shift+Enter`    |

### VSCode Settings

| Setting                           | Default   | Purpose                                                |
| --------------------------------- | --------- | ------------------------------------------------------ |
| `selectedModel`                   | `default` | AI model for conversations                             |
| `useTerminal`                     | `false`   | Launch in terminal mode                                |
| `initialPermissionMode`           | `default` | Auto-approval behavior (does not accept `auto`)        |
| `preferredLocation`               | `panel`   | Docking location (`sidebar` or `panel`)                |
| `autosave`                        | `true`    | Auto-save before reads                                 |
| `respectGitIgnore`                | `true`    | Exclude .gitignore patterns                            |
| `useCtrlEnterToSend`              | `false`   | Use Ctrl/Cmd+Enter instead of Enter to send            |
| `allowDangerouslySkipPermissions` | `false`   | Adds Auto mode and Bypass permissions to mode selector |
| `disableLoginPrompt`              | `false`   | Skip auth prompts (for third-party provider setups)    |
| `claudeProcessWrapper`            | -         | Executable path used to launch the Claude process      |

### Built-in IDE MCP Server

When the extension is active, it runs a local MCP server that the CLI connects to automatically. This enables diff viewing in VS Code's native diff viewer, reading current selection for @-mentions, and executing Jupyter notebook cells.

Two tools are visible to the model:

| Tool                       | Purpose                                          | Writes? |
| -------------------------- | ------------------------------------------------ | ------- |
| `mcp__ide__getDiagnostics` | Returns language-server diagnostics from VS Code | No      |
| `mcp__ide__executeCode`    | Runs Python code in active Jupyter notebook      | Yes     |

The server binds to `127.0.0.1` on a random port with a fresh auth token per activation. Only the user running VS Code can connect.

## JetBrains IDE Integration

### Supported IDEs

- IntelliJ IDEA
- PyCharm
- Android Studio
- WebStorm
- PhpStorm
- GoLand

### Installation

1. Install from JetBrains Plugin Marketplace
1. Search for "Claude Code"
1. Restart IDE after installation

### Core Features

- **Quick launch**: `Cmd+Esc` (Mac) / `Ctrl+Esc` (Windows/Linux)
- **Diff viewing**: IDE's built-in diff viewer
- **Selection sharing**: Current selection automatically visible
- **Diagnostic integration**: IDE errors/warnings sent to Claude
- **File references**: `Cmd+Option+K` / `Alt+Ctrl+K`

### Configuration

Navigate to **Settings → Tools → Claude Code [Beta]**:

- **Claude command**: Custom path (e.g., `claude`, `/usr/local/bin/claude`, or `npx @anthropic/claude`)
- **Suppress notifications**: Hide warnings
- **Auto-update**: Check for plugin updates
- **Enable Option+Enter for multi-line** (macOS): Option+Enter inserts new lines in prompts

> **Remote Development**: Install the plugin on the remote host via **Settings → Plugin (Host)**, not on your local client.

> **WSL**: Set `wsl -d Ubuntu -- bash -lic "claude"` as your Claude command. See [WSL troubleshooting guide](https://code.claude.com/docs/en/troubleshooting#jetbrains-ide-not-detected-on-wsl2) for networking configuration.

### ESC Key Fix

If ESC doesn't interrupt Claude:

1. **Settings → Tools → Terminal**
1. Uncheck "Move focus to the editor with Escape", or click "Configure terminal keybindings" and delete the "Switch focus to Editor" shortcut

## Vim/Neovim Integration

### Enabling Vim Mode

- Command: `/vim` to toggle
- Persistent: Configure via `/config`

### Vim Mode Shortcuts

**Mode Switching:**

| Command | Action                         |
| ------- | ------------------------------ |
| `Esc`   | Enter NORMAL mode              |
| `i`/`I` | Insert before/at start of line |
| `a`/`A` | Insert after/at end of line    |
| `o`/`O` | Open line below/above          |

**Navigation (NORMAL mode):**

- Movement: `h`/`j`/`k`/`l`
- Words: `w` (next), `e` (end), `b` (previous)
- Line: `0` (start), `$` (end), `^` (first non-blank)
- Document: `gg` (top), `G` (bottom)
- Jump: `f{char}`, `F{char}`, `t{char}`, `T{char}`

**Editing (NORMAL mode):**

- Delete: `x`, `dd`, `dw`/`de`/`db`
- Change: `cc`, `cw`/`ce`/`cb`
- Yank: `yy`/`Y`, `yw`/`ye`/`yb`
- Paste: `p` (after), `P` (before)
- Indent: `>>`/`<<`
- Repeat: `.`

**Text Objects:**

- `iw`/`aw` - Inner/around word
- `i"`/`a"` - Inner/around quotes
- `i(`/`a(` - Inner/around parentheses
- `i{`/`a{` - Inner/around braces

## Chrome/Browser Integration

> **Status**: Beta. Works with Google Chrome and Microsoft Edge. Not yet supported on Brave, Arc, or other Chromium-based browsers. WSL is not supported.

### Prerequisites

- Google Chrome or Microsoft Edge
- [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) (v1.0.36+)
- Claude Code v2.0.73+
- Direct Anthropic plan (Pro, Max, Team, or Enterprise). Not available via Bedrock, Vertex, or Foundry.

### Setup

```bash
claude --chrome
```

Verify with `/chrome` command. To enable by default without `--chrome` flag, run `/chrome` and select "Enabled by default".

In VS Code, Chrome is available whenever the extension is installed. Use `@browser` in the prompt box:

```text
@browser go to localhost:3000 and check the console for errors
```

### Capabilities

- **Live debugging**: Read console errors and DOM state, then fix the code that caused them
- **Design verification**: Build UI from a Figma mock, then verify in browser
- **Web app testing**: Form validation, visual regressions, user flows
- **Authenticated web apps**: Interact with Google Docs, Gmail, Notion (shares browser login state)
- **Data extraction**: Pull structured info from web pages into local files
- **Task automation**: Multi-site workflows, form filling, data entry
- **Session recording**: Record browser interactions as GIFs

## Desktop App

The Claude Desktop app provides Claude Code through a native graphical interface with capabilities beyond the CLI and VS Code extension.

### Installation

Download from [claude.com/download](https://claude.com/download). Available on macOS and Windows.

### Key Features

- **Visual diff review**: Inline comments on diffs with multi-round feedback before committing
- **Live app preview**: Embedded browser for dev servers with auto-verification of changes
- **Computer use**: Control native apps and your screen (macOS/Windows, Pro/Max plans, research preview)
- **GitHub PR monitoring**: CI status tracking with auto-fix and auto-merge toggles
- **Parallel sessions**: Automatic Git worktree isolation for concurrent work
- **Dispatch integration**: Send tasks from your phone, get a session on Desktop
- **Scheduled tasks**: Run Claude on a recurring schedule
- **Connectors**: GitHub, Slack, Linear, and more
- **Multiple environments**: Local, SSH, and cloud (remote)

### Permission Modes

| Mode                   | Behavior                                                        |
| ---------------------- | --------------------------------------------------------------- |
| **Ask permissions**    | Asks before editing files or running commands                   |
| **Auto accept edits**  | Auto-accepts edits, still asks before terminal commands         |
| **Plan mode**          | Read-only analysis, creates plan without modifying files        |
| **Auto**               | Background safety checks (Team/Enterprise/API, Sonnet/Opus 4.6) |
| **Bypass permissions** | No prompts, for sandboxed environments only                     |

The `dontAsk` mode is CLI-only and not available in Desktop.

### Computer Use

Computer use lets Claude open apps, control your screen, and interact with GUIs. It is the broadest but slowest tool, used only when connectors, Bash, and Chrome can't handle the task.

**App permission tiers** (fixed by category):

| Tier         | Capabilities                          | Applies to                  |
| ------------ | ------------------------------------- | --------------------------- |
| View only    | See the app in screenshots            | Browsers, trading platforms |
| Click only   | Click and scroll, no typing           | Terminals, IDEs             |
| Full control | Click, type, drag, keyboard shortcuts | Everything else             |

### CLI Comparison

| Feature           | Desktop                   | CLI                     |
| ----------------- | ------------------------- | ----------------------- |
| Computer use      | Yes                       | No                      |
| App preview       | Built-in embedded browser | Manual                  |
| PR monitoring     | Auto-fix + auto-merge     | Manual with `gh`        |
| Parallel sessions | Auto worktree isolation   | Manual worktrees        |
| Dispatch          | Yes                       | No                      |
| Connectors        | GitHub, Slack, Linear     | MCP servers             |
| SSH sessions      | Yes                       | Yes (separate terminal) |
| Scheduled tasks   | Yes                       | Via cron/external tools |

## Claude Code on the Web

> **Status**: Research preview.

Claude Code on the web lets developers run Claude Code tasks asynchronously on secure Anthropic-managed cloud infrastructure, accessible from [claude.ai/code](https://claude.ai/code) and the Claude mobile app (iOS/Android).

### Availability

- Pro, Max, Team, and Enterprise users
- Enterprise users need premium seats or Chat + Claude Code seats

### Key Features

- **Asynchronous execution**: Start tasks and close your laptop; work continues in the cloud
- **Diff view**: Review changes file by file with inline commenting before creating PRs
- **Auto-fix PRs**: Claude watches PRs, automatically fixes CI failures and review comments
- **Terminal-to-web**: Start cloud sessions from CLI with `claude --remote "task description"`
- **Web-to-terminal**: Pull web sessions to local with `/teleport` or `claude --teleport`
- **Parallel tasks**: Run multiple `--remote` sessions simultaneously
- **Scheduled tasks**: Recurring automation (daily PR reviews, dependency audits, CI failure analysis)
- **Session sharing**: Share sessions with team members (Team/Enterprise) or publicly (Pro/Max)
- **Mobile access**: Kick off tasks and monitor progress from iOS/Android

### Cloud Environment

Sessions run in isolated Anthropic-managed VMs with:

- Pre-installed languages: Python, Node.js, Ruby, PHP, Java, Go, Rust, C++
- Databases: PostgreSQL 16, Redis 7.0
- Package managers: pip, poetry, npm, yarn, pnpm, bun, gem, bundler, cargo, Maven, Gradle
- Configurable network access: Limited (default allowlist), Disabled, or Full
- Setup scripts for custom dependency installation
- GitHub proxy for secure git operations with scoped credentials

### Network Access

Three levels:

- **Limited** (default): Allowlisted domains only (package registries, cloud platforms, git hosts)
- **Disabled**: No internet (Anthropic API still accessible)
- **Full**: Complete internet access

### Workflow Patterns

**Plan locally, execute remotely:**

```bash
# Plan in local terminal
claude --permission-mode plan

# Execute in cloud
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

**Teleport sessions:**

```bash
# Interactive picker
claude --teleport

# Specific session
claude --teleport <session-id>

# From within Claude Code
/teleport
```

### Limitations

- GitHub-hosted repositories only (including GitHub Enterprise Server for Team/Enterprise)
- GitLab and other non-GitHub repositories not supported
- Session handoff is one-way (web-to-terminal only, not terminal-to-web for existing sessions)
- Shares rate limits with all other Claude usage on your account

## Terminal Keyboard Shortcuts

### General Controls

| Shortcut              | Purpose                    |
| --------------------- | -------------------------- |
| `Ctrl+C`              | Cancel current operation   |
| `Ctrl+D`              | Exit Claude Code           |
| `Ctrl+G`              | Open prompt in text editor |
| `Ctrl+L`              | Clear screen               |
| `Ctrl+R`              | Reverse search history     |
| `Ctrl+O`              | Toggle verbose output      |
| `Ctrl+B`              | Background running tasks   |
| `Esc+Esc`             | Rewind code/conversation   |
| `Shift+Tab` / `Alt+M` | Toggle permission modes    |
| `Option+P` / `Alt+P`  | Switch model               |
| `Option+T` / `Alt+T`  | Toggle extended thinking   |

### Text Editing

| Shortcut          | Purpose                |
| ----------------- | ---------------------- |
| `Ctrl+K`          | Delete to end of line  |
| `Ctrl+U`          | Delete entire line     |
| `Ctrl+Y`          | Paste deleted text     |
| `Alt+B` / `Alt+F` | Move word back/forward |

### Multiline Input

- `Shift+Enter` (iTerm2, WezTerm, Ghostty, Kitty)
- `Option+Enter` (macOS Terminal with Option as Meta)
- `\` + `Enter` (works everywhere)
- `Ctrl+J` (line feed alternative)

### Bash Mode

Prefix with `!` to run bash directly: `! npm test`

## Best Practices

### Context Efficiency

- Use specific @-mentions rather than entire folders
- Enable `.gitignore` respect
- Leverage MCP servers for external tools

### File Organization

- Create CLAUDE.md with project guidelines (see `/init`)
- Use git worktrees for parallel sessions
- Reference specific line ranges: `@file.ts#5-10`

### Permission and Safety

- Use Plan Mode (`Shift+Tab`) to review changes
- Enable manual approval for sensitive operations
- Configure hooks for validation

### Terminal Setup

Configure **Shift+Enter** for multiline input:

**iTerm2:**
Settings → Profiles → Keys → Set Option key to "Esc+"

**Terminal.app:**
Settings → Profiles → Keyboard → Check "Use Option as Meta Key"

### Session Management

- Name sessions: `/rename <name>`
- Resume conversations: `/resume`
- Switch between extension/CLI: `--resume`

## Troubleshooting

### VSCode Spark Icon Not Visible

- Ensure VS Code meets minimum version requirements
- Open a file (folder alone won't show icon)
- Restart with "Developer: Reload Window"

### JetBrains Plugin Not Working

- Completely restart IDE
- Verify plugin installed correctly
- For WSL: Check networking configuration

### Chrome Integration Issues

- Update Claude Code: `claude update`
- Verify Chrome or Edge is running and visible
- Run `/chrome` and select "Reconnect extension"
- First-time setup requires Chrome restart to pick up native messaging host config
- If service worker goes idle during long sessions, run `/chrome` and reconnect

### Keyboard Shortcuts Not Working

- Press `?` to see available shortcuts
- Verify Option/Alt key configuration
- Check for conflicting IDE shortcuts
- Run `/terminal-setup`

## Sources

- [VS Code Integration](https://code.claude.com/docs/en/vs-code)
- [JetBrains Integration](https://code.claude.com/docs/en/jetbrains)
- [Desktop App](https://code.claude.com/docs/en/desktop)
- [Desktop Quickstart](https://code.claude.com/docs/en/desktop-quickstart)
- [Claude Code on the Web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Chrome Integration](https://code.claude.com/docs/en/chrome)
- [Interactive Mode & Shortcuts](https://code.claude.com/docs/en/interactive-mode)
- [Terminal Configuration](https://code.claude.com/docs/en/terminal-config)
- [Permission Modes](https://code.claude.com/docs/en/permission-modes)
