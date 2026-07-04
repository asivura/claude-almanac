---
title: Claude Design Sync
description: Push a local React design system to claude.ai/design with /design-sync, authorize it with /design-login, and manage Design project access with /design.
type: reference
category: integrations
---

# Claude Design Sync

Claude Code ships a family of `/design*` slash commands that bridge your terminal to [Claude Design](https://claude.com/product/design) (`claude.ai/design`), Anthropic's visual design surface. They push a real, code-backed design system up to the canvas, keep it in sync as the code changes, and control which of your Design projects the Claude Code agent may read and write.

## Overview

Claude Design is a beta product (web at `claude.ai/design`, plus a panel in the Claude desktop app) where you describe designs, prototypes, and decks in chat and Claude renders them on a canvas. Its differentiator is **design systems**: import your real components and Claude builds with them, checks its own output against them, and self-corrects before you see the result. The buttons on the canvas are your buttons, with the same names, colors, and behaviors.

The `/design*` commands are how Claude Code participates in that loop. `/design-sync` uploads (and re-syncs) your local component library, `/design-login` authorizes the connection, and `/design` manages the agent's access to your projects.

## Availability

| Requirement   | Details                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan          | Claude Pro, Max, Team, or Enterprise (included, no add-on). Enterprise admins must first enable Claude Design in Organization settings     |
| Claude Design | Beta, at `claude.ai/design` or the Claude desktop sidebar                                                                                  |
| Login         | A `claude.ai` login on the Claude Code session. The design-system OAuth scope is granted separately (see [`/design-login`](#design-login)) |
| Source        | A React design system on disk, ideally with Storybook or a component package the converter can bundle                                      |

Claude Design's design-system import and its two-way sync with Claude Code shipped in a June 17, 2026 overhaul.

## The `/design*` command family

| Command         | What it does                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/design`       | Grant or revoke Claude agent access to your Design projects. Also the entry point for creating, editing, and syncing Design projects from the terminal    |
| `/design-sync`  | Push a React design system to `claude.ai/design`. Runs a converter that bundles the real component code (from Storybook or a bare package) and uploads it |
| `/design-login` | Authorize design-system access for `/design-sync` with your `claude.ai` account                                                                           |

### `/design-login`

`/design-sync` reads and writes your Design projects through your existing `claude.ai` login, the same one Claude Code already uses. Design-system access is a **separate OAuth scope**, so the first sync prompts you to add it. `/design-login` performs that authorization explicitly.

Run it when:

- You want to grant design-system access up front, before the first `/design-sync`.
- The session has no `claude.ai` login to piggyback on (an API-key, headless, or CI session), so there is nothing to attach the scope to.
- You connected Claude Design as an MCP server (see [Connect as an MCP server](#connect-as-an-mcp-server)) and need to authenticate it.

Once `/design-login` succeeds, the read steps (listing projects and files) run without further prompts. Creating a project and the plan-boundary step (`finalize_plan`) still prompt for approval.

### `/design-sync`

`/design-sync` converts a local React design system into preview and spec files and pushes them to a design-system project on `claude.ai/design`, incrementally, one component at a time, never as a wholesale replace. It leans entirely on your `claude.ai` login and finds the design-system projects you have write permission on, so there is no separate API key or config to manage.

Running it serves two roles over the life of a project:

- **Initial import**: your component library goes up to Claude Design, so every screen the canvas generates uses your real components (same names, colors, and behaviors).
- **Incremental re-sync**: after you change components in code, run it again to push the current state back up, keeping the canvas aligned with what you actually built.

The reverse direction, handing a finished design from Claude Design back to Claude Code, is covered in [Handoff to Claude Code](#handoff-to-claude-code). See [How `/design-sync` works](#how-design-sync-works) for the pipeline.

### `/design`

`/design` is the entry point for working with Claude Design projects from the terminal: create, edit, and sync design projects without leaving your workflow. It also controls consent: use it to **grant or revoke the Claude Code agent's access** to your Design projects, so the agent can only read and write the projects you have explicitly allowed.

## How `/design-sync` works

Under the hood, `/design-sync` drives the `DesignSync` tool through a fixed sequence:

1. **Discover**: `list_projects` returns the design-system projects you can write to (name, owner, id, last-updated). If none exist, `create_project` makes one, or you target an existing project by its project ID. `get_project` verifies the target is actually a design-system project (`type: PROJECT_TYPE_DESIGN_SYSTEM`, which is immutable at creation) before anything is pushed.
1. **Diff**: `list_files` builds a structural diff of local paths versus remote paths. `get_file` (capped at 256 KiB) reads a specific remote component only when its content needs comparing.
1. **Plan**: `finalize_plan` locks the exact set of paths that will be written and deleted, plus the source directory (`localDir`, defaulting to the current working directory), and returns a `planId`. You review and approve this plan. The structured path list and source directory are shown to you independent of Claude's narration.
1. **Upload**: `write_files` and `delete_files` apply the approved plan, one component at a time. Files are read from disk by path (`localPath`), so their contents never enter Claude's context, and each call moves up to 256 files.

Cards in the Design System pane come from a `<!-- @dsCard group="…" -->` marker on the first line of each preview HTML, compiled into a `_ds_manifest.json` by the app's self-check. Explicit `register_assets` is legacy now that cards are built from those markers; it remains only for hand-authored projects that lack them. A render self-check writes a `.render-check.json`, and `report_validate` reports its aggregate counts (the total, how many render badly, thinly, or with identical variants, and the iteration count) without leaking component names or paths.

## Handoff to Claude Code

The bridge runs the other way too. When a design is ready to become software, hand it off from Claude Design to Claude Code, which continues from your existing work instead of starting over from a screenshot. Whatever you then produce or change in Claude Code syncs back to Claude Design and stays editable on the canvas, as if it had never left the visual tool.

## Connect as an MCP server

As an alternative to the built-in commands, you can connect Claude Design as an MCP server from the terminal:

```bash
claude mcp add --scope user --transport http claude-design https://api.anthropic.com/v1/design/mcp
```

Then run `/design-login` to authenticate. This exposes the same capabilities: importing designs into codebases, exporting code as live prototypes, or building end to end without leaving the terminal.

## The DesignSync tool

`/design-sync` is a skill; the engine beneath it is the `DesignSync` tool, which reads and updates your `claude.ai/design` projects. Its methods dispatch on a `method` field and fall into four groups:

| Group         | Methods                                                                                                    | Notes                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Read          | `list_projects`, `get_project`, `list_files`, `get_file`                                                   | No prompt once design scopes are granted; the first call may prompt to add design-system access |
| Project setup | `create_project`                                                                                           | Creates a new design-system project you own                                                     |
| Plan boundary | `finalize_plan`                                                                                            | Locks the writes, deletes, and source directory; returns a `planId`                             |
| Write         | `write_files`, `delete_files`, `register_assets` (legacy), `unregister_assets` (legacy), `report_validate` | Require a valid `planId`; every path must be inside the finalized plan                          |

The required ordering is **read, then finalize_plan, then write or delete**. Calling a write, delete, or register method without a valid `planId`, or with paths outside the plan, is rejected. This plan boundary is what lets you review the exact blast radius of a sync before any file moves.

## Security

- `get_file` returns content written by other members of your organization. Claude treats it as data, not instructions; if a fetched file reads like instructions, Claude ignores it and flags that something looks odd in that path.
- The finalized plan is a hard gate. Writes and deletes outside the approved path set, or without a valid `planId`, are refused.
- Files uploaded via `localPath` are read, encoded, and uploaded directly, so their contents never pass through the model's context.

## Best Practices

- Sync incrementally, component by component. Avoid wholesale replaces.
- Keep a `@dsCard` marker on the first line of each preview HTML so cards index into the Design System pane automatically.
- Verify the target project's type before pushing. Pushing to a regular project never turns it into a design system, because the type is fixed at creation.
- In fresh, headless, or CI sessions with no `claude.ai` login attached, run `/design-login` once up front.

## Current Limitations

- **Beta**: not available on Free plans, and Enterprise requires admin enablement.
- **React converter**: the `/design-sync` bundler targets React design systems (Storybook or a bare package). Other stacks import into Claude Design through a GitHub repo, design files, or raw uploads on the web side instead.
- **Size caps**: `get_file` is capped at 256 KiB, and `write_files` and `delete_files` move at most 256 paths per call (split larger bundles across calls under the same `planId`).
- **Immutable project type**: a project's design-system type is set at creation and cannot be changed later.

## Sources

- [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- [Set up your design system in Claude Design](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- [Claude Design now stays on brand for daily work](https://claude.com/blog/claude-design-stays-on-brand-for-daily-work)
- [Turn ideas into designs with Claude (product page)](https://claude.com/product/design)
- Claude Code in-app command help and the `DesignSync` tool schema
