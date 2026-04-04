# Agent Teams: Environment Setup

Tools, configuration, and IDE integration for running multiple Claude Code sessions in parallel. Install these once and you're ready to use the [coordination patterns](agent-teams.md).

## Tools Overview

| Tool                                 | Purpose                                       | Install                       |
| ------------------------------------ | --------------------------------------------- | ----------------------------- |
| [Ghostty](https://ghostty.org)       | GPU-accelerated terminal emulator             | `brew install --cask ghostty` |
| [tmux](https://github.com/tmux/tmux) | Terminal multiplexer with persistent sessions | `brew install tmux`           |
| [Starship](https://starship.rs)      | Minimal prompt showing project and git info   | `brew install starship`       |

## Ghostty

A fast, GPU-accelerated terminal emulator -- ideal as the host terminal for tmux-based agent team sessions.

**Why Ghostty over Terminal.app or iTerm2:**

- **GPU rendering** -- noticeably smoother scrolling through long Claude Code output compared to Terminal.app
- **Low resource usage** -- lighter than iTerm2, which matters when running 3-4 Claude Code sessions simultaneously
- **Zero config** -- works well out of the box with sensible defaults, unlike iTerm2's complex preferences

### Install

```bash
brew install --cask ghostty
```

### Configure

Ghostty reads its config from `~/.config/ghostty/config`:

```ini
# Theme -- run `ghostty +list-themes` to browse options
theme = Monokai Pro Light Sun
```

For font, keybindings, and other settings, see the [Ghostty documentation](https://ghostty.org/docs).

**Note:** since we use tmux for pane management (persistent sessions, scriptable layouts), use tmux's split commands (`Ctrl+B %`, `Ctrl+B "`) rather than Ghostty's native splits.

## tmux

Terminal multiplexer that keeps sessions alive even if you close the terminal window. Use it inside Ghostty for persistent, scriptable agent sessions.

### Install

```bash
brew install tmux
```

### Configure

Add to `~/.tmux.conf`:

```bash
# Mouse support -- enables trackpad/mouse scrolling in tmux panes
set -g mouse on

# Fix terminal colors and mouse inside tmux (for Ghostty)
set -g default-terminal "tmux-256color"
set -ag terminal-features ",xterm-ghostty:RGB:mouse:usstyle:clipboard:title"
```

Without `mouse on`, you can't scroll with the trackpad -- you'd have to enter copy mode manually every time. The `terminal-features` line tells tmux that Ghostty supports RGB colors, mouse reporting, styled underlines, clipboard, and title -- ensuring colors render correctly and mouse events are properly forwarded to TUI apps like Claude Code.

**Important:** tmux only reads its config when the server first starts. If you add these settings to an already-running tmux, reload with `tmux source-file ~/.tmux.conf`.

### Pasting images into Claude Code

In VS Code's integrated terminal, use **Cmd+V** to paste images. In Ghostty (or any external terminal), use **Ctrl+V** instead -- Cmd+V won't work for image paste in terminal Claude Code sessions.

## Starship

A minimal, fast prompt that shows the current project and git branch at a glance -- useful when you have multiple splits and need to quickly identify which agent is where.

### Install

```bash
brew install starship
```

### Configure

Add to `~/.zshrc` (or `~/.bashrc`) -- along with the agent teams env variable (see [Claude Code Settings](#enable-agent-teams)):

```bash
# Claude Code agent teams
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Starship prompt
eval "$(starship init zsh)"
```

Create `~/.config/starship.toml`:

```toml
# Minimal prompt for agent team workflows
add_newline = false
command_timeout = 500

format = """$directory$git_branch$git_status$character"""

[directory]
truncation_length = 1
truncate_to_repo = true
style = "bold cyan"

[git_branch]
format = " on [$branch]($style) "
style = "bold purple"

[git_status]
format = "[$all_status$ahead_behind]($style)"
style = "bold red"

[character]
success_symbol = "[>](bold green)"
error_symbol = "[>](bold red)"
```

This gives you a prompt like: `my-project on main >` -- enough to identify the project and branch without clutter.

## VS Code Integration

Launch Ghostty with tmux and Claude Code directly from VS Code, scoped to whatever project file you have open.

### Launch Script

Create a script that opens Ghostty with a tmux session running Claude Code:

```bash
#!/usr/bin/env bash
# ghostty-claude.sh -- launch Ghostty+tmux+Claude Code for a project
# Usage: ghostty-claude.sh [project-path]

set -euo pipefail

INPUT_DIR="${1:-$(pwd)}"

# Walk up to find the git root (project root)
PROJECT_DIR="$(cd "$INPUT_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "$INPUT_DIR")"
SESSION_NAME="$(basename "$PROJECT_DIR")"

# Sanitize session name (tmux doesn't allow dots or colons)
SESSION_NAME="${SESSION_NAME//./-}"
SESSION_NAME="${SESSION_NAME//:/-}"

open -na Ghostty.app --args \
  --working-directory="$PROJECT_DIR" \
  --title="$SESSION_NAME" \
  -e tmux new-session -A -s "$SESSION_NAME" claude
```

**Important macOS note:** you must use `open -na Ghostty.app --args ...` to launch Ghostty from the CLI. The `ghostty` binary does not support launching the terminal emulator directly on macOS.

### VS Code Task

Add to your `.code-workspace` file (or `.vscode/tasks.json`):

```json
{
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Claude Code in Ghostty",
        "type": "shell",
        "command": "/path/to/ghostty-claude.sh",
        "args": ["${fileDirname}"],
        "presentation": {
          "reveal": "never"
        },
        "problemMatcher": []
      }
    ]
  }
}
```

The `${fileDirname}` variable resolves to the directory of the currently open file, and the script walks up to find the git root -- so it always opens the correct project regardless of which file you're editing.

### Keyboard Shortcut

Add to VS Code `keybindings.json`:

```json
{
  "key": "ctrl+shift+t",
  "command": "workbench.action.tasks.runTask",
  "args": "Claude Code in Ghostty"
}
```

Now press **Ctrl+Shift+T** with any file open to launch a Claude Code agent for that project.

## Claude Code Settings

### Enable Agent Teams

Agent teams are experimental and disabled by default. Requires Claude Code **v2.1.32 or later** (`claude --version` to check).

Set the feature flag in **both** places to ensure it's always available:

**1. Shell environment** -- add to `~/.zshrc` (or `~/.bashrc`):

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**2. Claude Code settings** -- add to `settings.json` (global or project):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

This enables Claude Code's native agent team support, where a lead agent can spawn teammates in tmux panes.

### Teammate Display Mode

Control how teammates appear with `teammateMode` in `settings.json` or `--teammate-mode` CLI flag:

| Mode             | Behavior                                              | Requirements   |
| ---------------- | ----------------------------------------------------- | -------------- |
| `auto` (default) | tmux panes if in tmux, otherwise in-process           | None           |
| `in-process`     | All teammates in main terminal, cycle with Shift+Down | None           |
| `tmux`           | Each teammate gets own pane                           | tmux or iTerm2 |

In `settings.json`:

```json
{
  "teammateMode": "auto"
}
```

Or per-session via CLI:

```bash
claude --teammate-mode tmux
```

### Stay in Control

A key advantage of agent teams over autonomous approaches is that you stay in the loop. Each teammate runs in its own tmux pane where you can see what it's doing and approve or reject actions. Avoid using `--dangerously-skip-permissions` -- the visibility and control you get from the tmux setup is what makes running multiple agents safe and manageable.

## Configuring CLAUDE.md for Agent Teams

The environment setup above ensures agent teams *work*. This section ensures Claude *uses them correctly* -- specifically, choosing agent teams (via `TeamCreate`) over bare subagents (via `Agent` alone) for parallel work.

### The Problem

Claude Code has two delegation mechanisms that are easy to confuse:

| Mechanism                   | Tools to use                                            | When                                |
| --------------------------- | ------------------------------------------------------- | ----------------------------------- |
| **Agent Teams (teammates)** | `TeamCreate` first, then `Agent` with `team_name` param | Default for 2+ parallel workstreams |
| **Subagents**               | `Agent` tool alone (no `team_name`)                     | Single focused task, result-only    |

Without explicit guidance in CLAUDE.md, Claude tends to use bare `Agent` calls (subagents) for everything -- including parallel coordination work where it should be creating a team. Subagents bypass the shared task list, inter-agent messaging, and tmux visibility that make agent teams useful.

### Recommended CLAUDE.md Section

Add this to your project's `CLAUDE.md` (or your global `~/.claude/CLAUDE.md` if you want it across all projects):

```markdown
## Agent Teams vs Subagents

There are **two different ways** to delegate work. Always pick the right one:

| Mechanism | Tools to use | When |
|-----------|-------------|------|
| **Agent Teams (teammates)** | `TeamCreate` first, then `Agent` with `team_name` param | Default for 2+ parallel workstreams |
| **Subagents** | `Agent` tool alone (no `team_name`) | Single focused task, result-only |

### Agent Teams -- the default for parallel work

When a task has 2+ independent workstreams (research, review, implementation, etc.),
**always create a team first with `TeamCreate`**, then spawn teammates via the `Agent`
tool with the `team_name` parameter. Never use bare `Agent` calls (subagents) for
parallel coordination -- that bypasses the team task list and coordination model.

**The lead agent must:**

- Create a team with `TeamCreate` before spawning any workers
- Break tasks into independent pieces and spawn a teammate for each
- Keep the lead session strictly for planning, coordination, and reviewing results
- Never do implementation, file editing, or research directly in the lead session
- Only perform trivially short actions in the lead session (e.g., a single quick git
  command, reading one file to answer a question)
- Wait for teammates to finish before proceeding with dependent work

### When the lead can act directly (exceptions)

- Answering a quick question by reading a single file
- Running a single git command (status, log, push)
- Creating/updating a task list
- Reviewing a teammate's output and providing feedback

### Subagents -- for single focused tasks only

Use the `Agent` tool **without** `team_name` only when:

- There is a single focused task where only the result matters and no human review is needed
- High-volume operations (isolate verbose output from the lead context)
- Sequential work with tight dependencies
- Same-file edits where coordination is trivial
```

### Why This Works

The key elements that make this effective:

1. **Names the tools explicitly** -- `TeamCreate` and `team_name` are the specific API surface. Saying "spawn teammates" is ambiguous; saying "use `TeamCreate` first" is not.

1. **Comparison table** -- the side-by-side format makes the distinction concise and easy to reference. Two rows is faster to scan than four paragraphs of prose.

1. **"Default for" language** -- telling Claude that teams are the *default* for parallel work shifts the burden of proof. Without this, Claude defaults to the simpler subagent path.

1. **Lead agent responsibilities** -- explicitly stating that the lead should not do implementation work prevents the common failure mode where the lead spawns one teammate and does the rest itself.

### Common Coordination Patterns

Include these in your CLAUDE.md if you want Claude to recognize when teams are appropriate:

```markdown
**Common coordination patterns:**

- **Research + Implement**: One teammate researches, another implements based on findings
- **Implement + Review**: One teammate codes, another reviews for security/quality
- **Independent Workstreams**: Multiple teammates on different repos/modules in parallel
- **Worktree Parallel**: Multiple features in same repo using git worktrees
- **Multiple Perspectives**: Teammates explore same problem from different angles

**When to use agent teams:**

- Any task involving file edits, code changes, or research
- Multi-repo changes
- Large refactors across multiple files or services
- Documentation updates across multiple files
- Tasks that take more than a few seconds to complete
```

### Common Mistake: Bare Agent Calls for Parallel Work

The most frequent misconfiguration is omitting the `TeamCreate` guidance entirely. When CLAUDE.md says "spawn teammates" or "use agent teams" without mentioning `TeamCreate` by name, Claude often interprets this as "use the `Agent` tool" -- which creates subagents, not teammates. The result:

- No shared task list (teammates can't see each other's work)
- No inter-agent messaging (teammates can't coordinate)
- No tmux pane visibility (you can't monitor progress)
- Work runs inside the lead's context window instead of independently

The fix is always the same: explicitly mention `TeamCreate` and `team_name` in your CLAUDE.md, as shown in the recommended section above.

## Next Steps

Your environment is ready. Head to [Agent Teams](agent-teams.md) for architecture details, display modes, hooks, and the full tool reference.

## Sources

- [Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Ghostty Terminal](https://ghostty.org/)
- [tmux](https://github.com/tmux/tmux/wiki)
- [Starship Prompt](https://starship.rs/)
- [Agent Teams](agent-teams.md) - Architecture, display modes, hooks, and tool reference
