# Claude Code IDE Integrations

Claude Code integrates with multiple IDEs and editors to provide AI-assisted development directly in your workflow.

## VSCode Extension

### Installation

- Search "Claude Code" in Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
- Direct link: [Install for VS Code](vscode:extension/anthropic.claude-code)
- Requirements: VS Code 1.98.0+ (check [extension page](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) for current minimum)

### Core Features

- **Native graphical interface**: Dedicated panel in VS Code
- **Inline diff viewing**: Side-by-side comparison before accepting
- **Selection context**: Shares selected text and open files automatically
- **@-mention references**: Tag files/folders with line numbers (`@file.ts#5-10`)
- **Permission modes**: Normal, Plan Mode, Auto-Accept
- **Conversation history**: Browse and resume past conversations
- **Multi-tab support**: Multiple conversations simultaneously

### Keyboard Shortcuts

| Command          | Mac             | Windows/Linux    |
| ---------------- | --------------- | ---------------- |
| Focus Input      | `Cmd+Esc`       | `Ctrl+Esc`       |
| Open in New Tab  | `Cmd+Shift+Esc` | `Ctrl+Shift+Esc` |
| New Conversation | `Cmd+N`         | `Ctrl+N`         |
| Insert @-Mention | `Option+K`      | `Alt+K`          |
| Multiline Input  | `Shift+Enter`   | `Shift+Enter`    |

### VSCode Settings

| Setting                 | Default   | Purpose                     |
| ----------------------- | --------- | --------------------------- |
| `selectedModel`         | `default` | AI model for conversations  |
| `useTerminal`           | `false`   | Launch in terminal mode     |
| `initialPermissionMode` | `default` | Auto-approval behavior      |
| `preferredLocation`     | `panel`   | Docking location            |
| `autosave`              | `true`    | Auto-save before reads      |
| `respectGitIgnore`      | `true`    | Exclude .gitignore patterns |

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

- **Claude command**: Custom path
- **Suppress notifications**: Hide warnings
- **Auto-update**: Check for plugin updates

### ESC Key Fix

If ESC doesn't interrupt Claude:

1. **Settings → Tools → Terminal**
1. Uncheck "Move focus to the editor with Escape"

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

### Prerequisites

- Google Chrome
- Claude in Chrome extension (v1.0.36+)
- Claude Code v2.0.73+
- Paid Claude plan (Pro/Team/Enterprise)

### Setup

```bash
claude --chrome
```

Verify with `/chrome` command.

### Capabilities

- Live debugging
- Form automation
- Data extraction
- Multi-site workflows
- Session recording (GIFs)

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
- Verify Chrome is running and visible
- Run `/chrome` and select "Reconnect extension"

### Keyboard Shortcuts Not Working

- Press `?` to see available shortcuts
- Verify Option/Alt key configuration
- Check for conflicting IDE shortcuts
- Run `/terminal-setup`

## References

- [VSCode Integration](https://code.claude.com/docs/en/vs-code.md)
- [JetBrains Integration](https://code.claude.com/docs/en/jetbrains.md)
- [Interactive Mode & Shortcuts](https://code.claude.com/docs/en/interactive-mode.md)
- [Chrome Integration](https://code.claude.com/docs/en/chrome.md)
- [Terminal Configuration](https://code.claude.com/docs/en/terminal-config.md)
