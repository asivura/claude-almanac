---
title: Multi-Project Workspace with VS Code
description: Set up a VS Code multi-root workspace with Claude Code cross-project access
type: guide
category: setup
time: 10 min
difficulty: intermediate
prerequisites:
  - VS Code
  - Claude Code extension or CLI
  - Multiple projects in a common parent directory
outcome: A VS Code workspace where Claude Code can read and edit across all your projects from any session
author: Alexander Sivura
---

# Multi-Project Workspace with VS Code

Configure VS Code and Claude Code to work across multiple projects simultaneously. This setup gives Claude Code visibility into all your repos while VS Code provides a unified IDE experience.

## The Problem

By default, Claude Code can only read and write files in the project where it was launched. If you work across multiple repositories, you lose context when switching between them. You end up repeating yourself ("this project uses the same pattern as the other one") and Claude can't reference code across repos.

## How It Works

Two separate mechanisms work together:

| Mechanism                   | Tool        | Purpose                                            |
| --------------------------- | ----------- | -------------------------------------------------- |
| **Multi-root workspace**    | VS Code     | Single IDE window with all projects in the sidebar |
| **`additionalDirectories`** | Claude Code | Cross-project file access from any session         |

The VS Code workspace determines what you see in the sidebar. The `additionalDirectories` setting determines what Claude Code can access. You want both.

## Step 1: Organize Your Projects

Put all projects under a common parent directory:

```
~/Developer/repos/
  project-a/
  project-b/
  project-c/
  dotfiles/
```

This isn't strictly required, but it simplifies relative paths in the workspace file.

## Step 2: Create a VS Code Workspace File

Create a `.code-workspace` file in one of your repos (a dotfiles or config repo works well):

```json
{
  "folders": [
    {
      "path": "."
    },
    {
      "path": "../project-a"
    },
    {
      "path": "../project-b"
    },
    {
      "path": "../project-c"
    }
  ],
  "settings": {},
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Claude Code in Ghostty",
        "type": "shell",
        "command": "${workspaceFolder:dotfiles}/scripts/ghostty-claude.sh",
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

The task at the bottom launches a Ghostty terminal with Claude Code for whatever project you're currently editing. See [Agent Teams Setup](agent-teams-setup.md) for the launcher script. Bind it to a keyboard shortcut:

```json
{
  "key": "ctrl+shift+t",
  "command": "workbench.action.tasks.runTask",
  "args": "Claude Code in Ghostty"
}
```

Open the workspace with **File > Open Workspace from File** or `code your-workspace.code-workspace`.

## Step 3: Configure `additionalDirectories`

Add all your projects to Claude Code's `additionalDirectories` in `~/.claude/settings.json`:

```json
{
  "permissions": {
    "additionalDirectories": [
      "~/Developer/repos/project-a",
      "~/Developer/repos/project-b",
      "~/Developer/repos/project-c"
    ]
  }
}
```

This setting is global -- it applies to every Claude Code session regardless of which project you launched from. Claude Code can now read and edit files in any of these directories.

**Keep the list alphabetically sorted** for easy maintenance as it grows.

## Step 4: Verify

Open a Claude Code session in any project and ask it to read a file from another project:

```
Read the CLAUDE.md from project-b
```

Claude should be able to access it without errors. You can also verify with `/context` which shows the active additional directories.

## Recommended VS Code Settings

These settings work well for multi-project Claude Code workflows:

```json
{
  "claudeCode.useTerminal": true,
  "claudeCode.preferredLocation": "panel"
}
```

- `useTerminal: true` -- runs Claude Code in the VS Code terminal instead of a webview, which is more stable for long sessions
- `preferredLocation: "panel"` -- places Claude Code in the bottom panel, leaving the sidebar free for file navigation across all your workspace projects

## How the Pieces Fit Together

```
VS Code workspace file (.code-workspace)
  -> Sidebar shows all projects
  -> Tasks can launch Ghostty for any project
  -> ${fileDirname} resolves to the active project

Claude Code settings.json (additionalDirectories)
  -> Any Claude session can read/write across all projects
  -> Works in terminal, VS Code extension, and Ghostty sessions

Ghostty launcher (ghostty-claude.sh)
  -> Ctrl+Shift+T opens Claude for the current project
  -> Each session gets its own tmux pane + worktree
  -> Remote control enabled for mobile access
```

## Tips

- **One workspace, many sessions**: you can press Ctrl+Shift+T multiple times to launch separate Claude sessions for different projects. Each gets its own Ghostty window and tmux session.
- **Project-specific CLAUDE.md**: each project can have its own `CLAUDE.md` with specific conventions. Claude reads the one from the working directory it was launched in.
- **Global rules via `~/.claude/rules/`**: rules that apply across all projects (commit conventions, personal preferences) go in your global rules directory.
- **Adding projects**: when you add a new project, update both the `.code-workspace` file and `additionalDirectories` in `settings.json`.

## Next Steps

- [Agent Teams Setup](agent-teams-setup.md) -- configure Ghostty + tmux for the launcher task
- [Settings](../features/settings.md) -- full reference for `additionalDirectories` and other Claude Code settings
- [Memory & Context](../features/memory-context.md) -- how CLAUDE.md files work across projects
- [Rules](../features/rules.md) -- modular rules for project-specific and global conventions

## Sources

- [Claude Code Settings](https://code.claude.com/docs/en/settings.md)
- [VS Code Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces)
