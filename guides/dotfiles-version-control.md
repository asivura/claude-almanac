---
title: Version-Controlled Claude Code Configuration
description: Keep Claude Code and VS Code configuration in a git repo with symlinks for backup and portability
type: guide
category: setup
time: 10 min
difficulty: beginner
prerequisites:
  - git
  - Claude Code installed
outcome: A git repository managing your Claude Code and VS Code config files via symlinks
author: Alexander Sivura
---

# Version-Controlled Claude Code Configuration

Keep your Claude Code configuration under version control so it's backed up, portable across machines, and auditable through git history.

## The Problem

Claude Code stores configuration in `~/.claude/` -- settings, global instructions, rules, skills, and hooks. These files accumulate over time and represent significant investment. But they're scattered across your home directory with no backup, no history, and no way to sync across machines.

The same applies to VS Code settings and keybindings that support your Claude Code workflow.

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
  setup.sh            (creates the symlinks)
```

Arrows show symlink direction: the files in `~/.claude/` are symlinks pointing to the repo.

## Step 1: Create the Repo

```bash
mkdir -p ~/Developer/repos/dotfiles-claude/{claude-home,vscode}
cd ~/Developer/repos/dotfiles-claude
git init
```

## Step 2: Move Existing Config into the Repo

Copy your current Claude Code config files into the repo:

```bash
# Claude Code files
cp ~/.claude/settings.json claude-home/
cp ~/.claude/CLAUDE.md claude-home/ 2>/dev/null
cp -r ~/.claude/rules claude-home/ 2>/dev/null
cp -r ~/.claude/skills claude-home/ 2>/dev/null
cp -r ~/.claude/hooks claude-home/ 2>/dev/null

# VS Code files (macOS path)
cp ~/Library/Application\ Support/Code/User/settings.json vscode/
cp ~/Library/Application\ Support/Code/User/keybindings.json vscode/
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

echo ""
echo "Done. Verify with:"
echo "  ls -la ~/.claude/settings.json ~/.claude/CLAUDE.md ~/.claude/rules"
```

Make it executable and run it:

```bash
chmod +x setup.sh
./setup.sh
```

The script is safe to re-run. It backs up any existing non-symlink files with a timestamp before replacing them.

## Step 4: Set Up .gitignore

Keep secrets and local-only files out of the repo:

```gitignore
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

- [Settings](settings.md) -- full reference for `settings.json` options
- [Memory & Context](memory-context.md) -- how CLAUDE.md and rules work
- [Multi-Project Workspace](multi-project-workspace.md) -- add a VS Code workspace and `additionalDirectories` to the repo
- [Agent Teams Setup](agent-teams-setup.md) -- add Ghostty/tmux scripts to the repo

## Sources

- [Claude Code Settings](https://code.claude.com/docs/en/settings.md)
- [Claude Code Configuration](https://code.claude.com/docs/en/configuration.md)
