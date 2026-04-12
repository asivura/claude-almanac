---
title: Agent Teams Setup with Ghostty + tmux
description: Configure your terminal environment for Claude Code agent teams
type: guide
category: setup
time: 15 min
difficulty: intermediate
prerequisites:
  - macOS (other platforms have partial support)
  - Homebrew
  - Familiarity with terminal emulators and shell config
outcome: A Ghostty terminal running tmux, configured for Claude Code agent teams
author: Alexander Sivura
---

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

# Keep sessions alive when terminal is closed
set -g destroy-unattached off
```

Without `mouse on`, you can't scroll with the trackpad -- you'd have to enter copy mode manually every time. The `terminal-features` line tells tmux that Ghostty supports RGB colors, mouse reporting, styled underlines, clipboard, and title -- ensuring colors render correctly and mouse events are properly forwarded to TUI apps like Claude Code.

The `destroy-unattached off` setting is critical for worktree sessions -- without it, tmux kills the session when you close the Ghostty window, losing your Claude Code session. With it enabled, sessions survive terminal closure and can be resumed later (see [Session Resume](#session-resume)).

**Important:** tmux only reads its config when the server first starts. If you add these settings to an already-running tmux, reload with `tmux source-file ~/.tmux.conf`.

### Agent Teams Focus Protection

When Claude Code spawns a teammate in a new tmux pane, keystrokes you're typing can leak into the new pane during the split, corrupting the startup command. Add these hooks to prevent that:

```bash
# --- Agent Teams focus protection ---
# Problem: when Claude Code spawns a teammate pane, leaked keystrokes
# corrupt the startup command. Four-layer fix:
#   1. C-u clears any keystrokes that leaked during split-window
#   2. select-pane -l returns focus to the lead pane immediately
#   3. Guard catches Claude Code's subsequent select-pane commands
#   4. Retry script (after 3s) detects and re-executes failed spawns
set-hook -g after-split-window "send-keys C-u; select-pane -l; set-option -g @split_guard 1; run-shell -b 'sleep 3 && $HOME/path/to/tmux-retry-teammate.sh; /opt/homebrew/bin/tmux set-option -g -u @split_guard 2>/dev/null'"
set-hook -g after-select-pane "if-shell -F '#{==:#{@split_guard},1}' 'set-option -g -u @split_guard; select-pane -l'"
```

The retry script (`tmux-retry-teammate.sh`) detects panes where the startup command was corrupted and re-executes it:

```bash
#!/bin/bash
# Detects and retries failed Claude Code teammate spawns.
TMUX_BIN=/opt/homebrew/bin/tmux

for pane in $($TMUX_BIN list-panes -F '#{pane_id}' 2>/dev/null); do
    content=$($TMUX_BIN capture-pane -t "$pane" -p -J 2>/dev/null) || continue

    # Match panes with both a shell error AND a Claude agent startup pattern
    if echo "$content" | grep -q "command not found" \
        && echo "$content" | grep -q "CLAUDE_CODE_EXPERIMENTAL"; then

        # Extract the intended command
        cmd=$(echo "$content" \
            | grep "CLAUDE_CODE_EXPERIMENTAL" \
            | grep -o 'cd /[^ ]* && env CLAUDE_CODE.*' \
            | head -1)

        if [ -n "$cmd" ]; then
            $TMUX_BIN send-keys -t "$pane" C-c C-u
            sleep 0.2
            $TMUX_BIN send-keys -t "$pane" "$cmd" Enter
        fi
    fi
done
```

Without these hooks, teammate spawns fail intermittently (especially when you're actively typing in the lead pane). The four layers work together: `C-u` clears leaked input, `select-pane -l` returns focus to the lead, the guard flag prevents Claude's own `select-pane` from stealing focus back, and the retry script catches any spawns that still failed.

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

Create a script that opens Ghostty with a tmux session running Claude Code. Each invocation creates a unique, timestamped session with remote control and worktree isolation:

```bash
#!/usr/bin/env bash
# ghostty-claude.sh -- launch Ghostty+tmux+Claude Code with remote control
# Usage: ghostty-claude.sh [project-path]

set -euo pipefail

INPUT_DIR="${1:-$(pwd)}"

# Walk up to find the git root (project root)
PROJECT_DIR="$(cd "$INPUT_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "$INPUT_DIR")"
SESSION_NAME="$(basename "$PROJECT_DIR")"

# Sanitize session name (tmux doesn't allow dots or colons)
SESSION_NAME="${SESSION_NAME//./-}"
SESSION_NAME="${SESSION_NAME//:/-}"

# Build display name with timestamp
DISPLAY_NAME="${SESSION_NAME}-$(date +%Y%m%d-%H%M)"

# Find a unique tmux session name
TMUX_SESSION="$DISPLAY_NAME"
i=0
while tmux has-session -t "$TMUX_SESSION" 2>/dev/null; do
  i=$((i + 1))
  TMUX_SESSION="${DISPLAY_NAME}-${i}"
done

open -na Ghostty.app --args \
  --working-directory="$PROJECT_DIR" \
  --title="$TMUX_SESSION" \
  -e tmux new-session -s "$TMUX_SESSION" \
    "claude --remote-control --worktree '$TMUX_SESSION' --name '$TMUX_SESSION'"
```

**What the flags do:**

| Flag               | Purpose                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `--remote-control` | Enables control from phone, tablet, or browser via [claude.ai/code](https://claude.ai/code)   |
| `--worktree`       | Creates an isolated git worktree named after the session, so parallel sessions don't conflict |
| `--name`           | Sets the session name (visible in `/resume` and remote control)                               |

Each launch gets a unique timestamped name like `grace-20260408-2315`, so you can run multiple sessions for the same project without collision. The Ghostty window title, tmux session name, and Claude worktree all share the same identifier.

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

## Session Resume

When you run multiple worktree sessions, you need a way to get back to them -- whether you closed the Ghostty window, your terminal crashed, or you just switched away. This resume script handles all three cases: live sessions, detached sessions, and orphaned worktrees (where the tmux session was killed but the worktree is still on disk).

### Resume Script

Create a companion script to the launcher:

```bash
#!/usr/bin/env bash
# ghostty-claude-resume.sh -- resume a worktree Claude Code session
# Usage: ghostty-claude-resume.sh [--in-place | --switch] [path]
#
# Modes:
#   (default)    Open a new Ghostty window attached to the session
#   --in-place   Attach in the current terminal
#   --switch     Switch current tmux client to the session (for tmux keybind)
#
# If a path inside a worktree is given, the session is detected automatically.
# Otherwise, an interactive picker is shown.

set -euo pipefail

MODE="ghostty"
PATH_ARG=""
for arg in "$@"; do
  case "$arg" in
    --in-place) MODE="in-place" ;;
    --switch)   MODE="switch" ;;
    *)          PATH_ARG="$arg" ;;
  esac
done

SELECTED=""
WORKTREE_DIR=""
CREATE_SESSION=false

# If a path is given, try to detect the session from the worktree root
if [[ -n "$PATH_ARG" ]]; then
  WORKTREE_ROOT=$(git -C "$PATH_ARG" rev-parse --show-toplevel 2>/dev/null || true)
  if [[ -n "$WORKTREE_ROOT" ]]; then
    CANDIDATE=$(basename "$WORKTREE_ROOT")
    if [[ "$CANDIDATE" =~ ^.+-[0-9]{8}-[0-9]{4} ]]; then
      SELECTED="$CANDIDATE"
      WORKTREE_DIR="$WORKTREE_ROOT"
      if ! tmux has-session -t "$CANDIDATE" 2>/dev/null; then
        CREATE_SESSION=true
      fi
    fi
  fi
fi

# If not resolved from path, show interactive picker
if [[ -z "$SELECTED" ]]; then
  # Collect live tmux sessions matching worktree naming pattern
  LIVE_SESSIONS=$(tmux list-sessions -F '#{session_name}' 2>/dev/null \
    | grep -E '^.+-[0-9]{8}-[0-9]{4}' || true)

  # Collect orphaned worktrees (on disk but no tmux session)
  ORPHANED=""
  for repo_dir in ~/Developer/repos/*/; do
    wt_base="${repo_dir}.claude/worktrees"
    [[ -d "$wt_base" ]] || continue
    for wt_dir in "$wt_base"/*/; do
      [[ -d "$wt_dir" ]] || continue
      wt_name=$(basename "$wt_dir")
      [[ "$wt_name" =~ ^.+-[0-9]{8}-[0-9]{4} ]] || continue
      if ! tmux has-session -t "$wt_name" 2>/dev/null; then
        ORPHANED="${ORPHANED}${wt_name} (no session - ${wt_dir})\n"
      fi
    done
  done

  # Build combined list with status indicators
  ENTRIES=""
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    attached=$(tmux list-sessions -F '#{session_name} #{session_attached}' 2>/dev/null \
      | grep "^${name} " | awk '{print $2}')
    if [[ "$attached" -gt 0 ]]; then
      ENTRIES="${ENTRIES}${name} (attached)\n"
    else
      ENTRIES="${ENTRIES}${name} (detached)\n"
    fi
  done <<< "$LIVE_SESSIONS"

  if [[ -n "$ORPHANED" ]]; then
    ENTRIES="${ENTRIES}${ORPHANED}"
  fi

  # In --switch mode, exclude the current session
  if [[ "$MODE" == "switch" ]]; then
    CURRENT=$(tmux display-message -p '#{session_name}' 2>/dev/null || true)
    if [[ -n "$CURRENT" ]]; then
      ENTRIES=$(echo -e "$ENTRIES" | grep -v "^${CURRENT} " || true)
    fi
  fi

  ENTRIES=$(echo -e "$ENTRIES" | sed '/^$/d')

  if [[ -z "$ENTRIES" ]]; then
    echo "No worktree sessions found."
    exit 0
  fi

  # Use fzf if available, otherwise numbered menu
  ENTRY_COUNT=$(echo "$ENTRIES" | wc -l | tr -d ' ')
  if [[ "$ENTRY_COUNT" -eq 1 ]]; then
    CHOSEN="$ENTRIES"
  elif command -v fzf &>/dev/null; then
    CHOSEN=$(echo "$ENTRIES" | fzf --prompt="Resume session: " --height=~20 --reverse) || true
  else
    echo "Worktree sessions:"
    i=1
    while IFS= read -r line; do
      echo "  $i) $line"
      i=$((i + 1))
    done <<< "$ENTRIES"
    read -rp "Select [1-${ENTRY_COUNT}]: " choice
    CHOSEN=$(echo "$ENTRIES" | sed -n "${choice}p")
  fi

  SELECTED=$(echo "$CHOSEN" | awk '{print $1}')

  if echo "$CHOSEN" | grep -q "(no session"; then
    CREATE_SESSION=true
    WORKTREE_DIR=$(echo "$CHOSEN" | grep -o '/[^ )]*')
  fi
fi

# Attach to existing session or recreate for orphaned worktree
if $CREATE_SESSION; then
  # Recreate tmux session in the orphaned worktree with claude
  case "$MODE" in
    ghostty)
      open -na Ghostty.app --args \
        --working-directory="$WORKTREE_DIR" \
        --title="$SELECTED" \
        -e tmux new-session -s "$SELECTED" "claude"
      ;;
    in-place)
      cd "$WORKTREE_DIR"
      exec tmux new-session -s "$SELECTED" "claude"
      ;;
    switch)
      tmux new-session -d -s "$SELECTED" -c "$WORKTREE_DIR" "claude"
      tmux switch-client -t "$SELECTED"
      ;;
  esac
else
  case "$MODE" in
    ghostty)
      open -na Ghostty.app --args \
        --title="$SELECTED" \
        -e tmux attach-session -t "$SELECTED"
      ;;
    in-place)
      exec tmux attach-session -t "$SELECTED"
      ;;
    switch)
      tmux switch-client -t "$SELECTED"
      ;;
  esac
fi
```

### How the Picker Works

The picker shows all worktree sessions across your projects with status indicators:

```
Resume session:
  webclass-service-20260408-1430 (attached)
  pandb-aurora-20260408-1512 (detached)
  workspace-20260407-0930 (no session - /path/to/worktree)
```

| Status         | Meaning                                 | Action                          |
| -------------- | --------------------------------------- | ------------------------------- |
| `(attached)`   | tmux session exists, has active clients | Attaches a second client        |
| `(detached)`   | tmux session exists, no clients         | Reattaches                      |
| `(no session)` | Worktree on disk, tmux session gone     | Recreates session with `claude` |

The third case -- **orphaned worktree recovery** -- is especially useful when tmux crashes or you reboot. Your work is preserved in the worktree; the script recreates the tmux session and launches Claude Code in it.

### tmux Keybinding

Add to `~/.tmux.conf` for quick session switching:

```bash
# Keep sessions alive when terminal is closed (worktree sessions survive)
set -g destroy-unattached off

# Resume worktree session picker (prefix + R)
bind R display-popup -E -w 70 -h 15 \
  "~/path/to/ghostty-claude-resume.sh --switch"
```

Press **prefix + R** (default: `Ctrl+B R`) to open a popup picker. Select a session to switch to it immediately. The `--switch` mode excludes the current session from the list.

### VS Code Resume Integration

Add a second task and keybinding for resuming sessions -- complementing the launch shortcut:

**Task** (`.code-workspace` or `.vscode/tasks.json`):

```json
{
  "label": "Resume Claude Worktree Session",
  "type": "shell",
  "command": "/path/to/ghostty-claude-resume.sh",
  "args": ["${fileDirname}"],
  "presentation": {
    "reveal": "never"
  },
  "problemMatcher": []
}
```

**Keybinding** (`keybindings.json`):

```json
{
  "key": "ctrl+shift+r",
  "command": "workbench.action.tasks.runTask",
  "args": "Resume Claude Worktree Session"
}
```

This gives you two VS Code shortcuts:

| Shortcut         | Action                      |
| ---------------- | --------------------------- |
| **Ctrl+Shift+T** | Launch new worktree session |
| **Ctrl+Shift+R** | Resume existing session     |

The resume shortcut uses `${fileDirname}` to detect which worktree you're editing in. If you're viewing a file inside a worktree, it auto-selects that session. If you're in the main project, it shows the picker.

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
