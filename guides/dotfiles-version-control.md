---
title: Version-Controlled Claude Code Configuration
description: Keep Claude Code, VS Code, tmux, Ghostty, and Starship configuration in a git repo with symlinks
type: guide
category: setup
time: 10 min
difficulty: beginner
prerequisites:
  - git
  - Claude Code installed
outcome: A git repository managing your full Claude Code environment (settings, tmux, Ghostty, VS Code) via symlinks
author: Alexander Sivura
---

# Version-Controlled Claude Code Configuration

Keep your Claude Code configuration under version control so it's backed up, portable across machines, and auditable through git history.

## The Problem

Claude Code stores configuration in `~/.claude/` -- settings, global instructions, rules, skills, and hooks. These files accumulate over time and represent significant investment. But they're scattered across your home directory with no backup, no history, and no way to sync across machines.

The same applies to the rest of your Claude Code environment: VS Code settings, tmux configuration (including agent teams focus protection hooks), Ghostty terminal config, and Starship prompt. These tools work together, and losing any piece means re-discovering settings you already dialed in.

## The Pattern

Store everything in a git repo. Symlink from the expected locations back to the repo. Edit in one place, commit changes, push to sync.

```
~/Developer/repos/dotfiles-claude/     (git repo, source of truth)
  claude-home/
    settings.json     ← ~/.claude/settings.json
    CLAUDE.md         ← ~/.claude/CLAUDE.md
    rules/            ← ~/.claude/rules/
    skills/           ← ~/.claude/skills/
    hooks/            ← ~/.claude/hooks/
  vscode/
    settings.json     ← ~/Library/Application Support/Code/User/settings.json
    keybindings.json  ← ~/Library/Application Support/Code/User/keybindings.json
  tmux/
    .tmux.conf        ← ~/.tmux.conf
  ghostty/
    config            ← ~/.config/ghostty/config
  starship/
    starship.toml     ← ~/.config/starship.toml
  scripts/
    ghostty-claude.sh   (launcher, referenced by VS Code task)
    tmux-retry-teammate.sh (teammate spawn retry, referenced by tmux hooks)
  setup.sh            (creates all symlinks)
```

Arrows show symlink direction: the files in `~/.claude/`, `~/.config/`, etc. are symlinks pointing to the repo.

The `scripts/` directory isn't symlinked anywhere -- scripts are referenced by absolute path from VS Code tasks and tmux hooks.

## Step 1: Create the Repo

```bash
mkdir -p ~/Developer/repos/dotfiles-claude/{claude-home,vscode,tmux,ghostty,starship,scripts}
cd ~/Developer/repos/dotfiles-claude
git init
```

## Step 2: Move Existing Config into the Repo

Copy your current config files into the repo:

```bash
# Claude Code
cp ~/.claude/settings.json claude-home/
cp ~/.claude/CLAUDE.md claude-home/ 2>/dev/null
cp -r ~/.claude/rules claude-home/ 2>/dev/null
cp -r ~/.claude/skills claude-home/ 2>/dev/null
cp -r ~/.claude/hooks claude-home/ 2>/dev/null

# VS Code (macOS path)
cp ~/Library/Application\ Support/Code/User/settings.json vscode/
cp ~/Library/Application\ Support/Code/User/keybindings.json vscode/

# Terminal tools
cp ~/.tmux.conf tmux/.tmux.conf 2>/dev/null
cp ~/.config/ghostty/config ghostty/config 2>/dev/null
cp ~/.config/starship.toml starship/starship.toml 2>/dev/null
```

## Step 3: Create a Setup Script

Create `setup.sh` that replaces the originals with symlinks:

```bash
#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

link_item() {
  local source="$1"
  local target="$2"

  if [ ! -e "$source" ]; then
    echo "SKIP: $source does not exist"
    return
  fi

  # If target exists and is not a symlink, back it up
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    backup="$target.backup.$(date +%Y%m%d%H%M%S)"
    echo "BACKUP: $target -> $backup"
    mv "$target" "$backup"
  fi

  # If target is an existing symlink, remove it
  if [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$source" "$target"
  echo "LINKED: $target -> $source"
}

# --- Claude Code ---
CLAUDE_HOME="$REPO_DIR/claude-home"
CLAUDE_TARGET="$HOME/.claude"

echo "Setting up Claude Code dotfiles..."

for item in settings.json CLAUDE.md rules skills hooks; do
  link_item "$CLAUDE_HOME/$item" "$CLAUDE_TARGET/$item"
done

# --- VS Code (macOS) ---
VSCODE_SOURCE="$REPO_DIR/vscode"
VSCODE_TARGET="$HOME/Library/Application Support/Code/User"

echo "Setting up VS Code dotfiles..."

for item in settings.json keybindings.json; do
  link_item "$VSCODE_SOURCE/$item" "$VSCODE_TARGET/$item"
done

# --- tmux ---
link_item "$REPO_DIR/tmux/.tmux.conf" "$HOME/.tmux.conf"

# --- Ghostty ---
mkdir -p "$HOME/.config/ghostty"
link_item "$REPO_DIR/ghostty/config" "$HOME/.config/ghostty/config"

# --- Starship ---
mkdir -p "$HOME/.config"
link_item "$REPO_DIR/starship/starship.toml" "$HOME/.config/starship.toml"

echo ""
echo "Done. Verify with:"
echo "  ls -la ~/.claude/settings.json ~/.claude/CLAUDE.md ~/.claude/rules"
echo "  ls -la ~/.tmux.conf ~/.config/ghostty/config ~/.config/starship.toml"
```

Make it executable and run it:

```bash
chmod +x setup.sh
./setup.sh
```

The script is safe to re-run. It backs up any existing non-symlink files with a timestamp before replacing them.

## Step 4: Set Up .gitignore

Keep secrets and local-only files out of the repo:

```ini
# Claude Code local files (per-session, not portable)
.claude/settings.local.json
.claude/todos.local.json

# Secrets
.env
*.pem
*.key
credentials.json

# macOS
.DS_Store
```

Note that `.claude/settings.local.json` is where Claude Code stores per-session permission grants. This file is machine-specific and should not be versioned.

## What to Version Control

**Claude Code:**

| File                  | Purpose                                   | Version control?      |
| --------------------- | ----------------------------------------- | --------------------- |
| `settings.json`       | Permissions, MCP servers, hooks, env vars | Yes                   |
| `CLAUDE.md`           | Global instructions for all projects      | Yes                   |
| `rules/`              | Modular global rules                      | Yes                   |
| `skills/`             | Custom slash commands                     | Yes                   |
| `hooks/`              | Hook scripts (e.g., context reload)       | Yes                   |
| `settings.local.json` | Per-session permission grants             | No                    |
| `todos.local.json`    | Session-local task state                  | No                    |
| `projects/`           | Auto-memory per project                   | No (machine-specific) |

**Terminal tools:**

| File             | Purpose                                | Version control? |
| ---------------- | -------------------------------------- | ---------------- |
| `.tmux.conf`     | tmux settings, agent teams focus hooks | Yes              |
| `ghostty/config` | Ghostty theme and font                 | Yes              |
| `starship.toml`  | Minimal prompt for agent team panes    | Yes              |
| `scripts/`       | Launcher and retry scripts             | Yes              |

**VS Code:**

| File               | Purpose                        | Version control? |
| ------------------ | ------------------------------ | ---------------- |
| `settings.json`    | Editor, extension, theme prefs | Yes              |
| `keybindings.json` | Custom keyboard shortcuts      | Yes              |

The terminal tools matter for Claude Code because tmux focus protection prevents corrupted teammate spawns, Ghostty is the host terminal, and Starship keeps prompts minimal in agent team panes. See [Agent Teams Setup](agent-teams-setup.md) for details on each.

## Verification

After running `setup.sh`, verify the symlinks:

```bash
ls -la ~/.claude/settings.json
# lrwxr-xr-x  .../settings.json -> /path/to/dotfiles-claude/claude-home/settings.json
```

Edit a file in the repo and confirm Claude Code picks up the change immediately (symlinks mean there's no copy step).

## Syncing Across Machines

Once the repo is on GitHub (or any remote):

```bash
# On a new machine
git clone git@github.com:you/dotfiles-claude.git
cd dotfiles-claude
./setup.sh
```

The setup script handles everything: backs up existing config, creates symlinks, and you're running with the same configuration.

## Next Steps

- [Settings](../features/settings.md) -- full reference for `settings.json` options
- [Memory & Context](../features/memory-context.md) -- how CLAUDE.md and rules work
- [Multi-Project Workspace](multi-project-workspace.md) -- add a VS Code workspace and `additionalDirectories` to the repo
- [Agent Teams Setup](agent-teams-setup.md) -- add Ghostty/tmux scripts to the repo

## Sources

- [Claude Code Settings](https://code.claude.com/docs/en/settings.md)
