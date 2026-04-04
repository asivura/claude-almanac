# CLAUDE.md

Guidance for the claude-almanac repository.

## Repository Purpose

Public documentation for Claude Code features. A comprehensive reference for Claude Code capabilities, configuration, and best practices.

## Structure

```
claude-almanac/
├── README.md                # Project overview
├── FEATURES-OVERVIEW.md     # Quick reference of all features
├── features/                # Detailed feature documentation
│   ├── settings.md
│   ├── rules.md
│   ├── hooks.md
│   ├── skills.md
│   ├── mcp-servers.md
│   ├── agents.md
│   ├── agent-teams.md
│   ├── agent-teams-setup.md
│   ├── plugins.md
│   ├── memory-context.md
│   ├── ide-integrations.md
│   ├── auto-mode.md
│   ├── security-sandbox.md
│   ├── remote-control.md
│   ├── headless-sdk.md
│   ├── github-actions.md
│   ├── pricing.md
│   ├── scheduled-tasks.md
│   ├── checkpointing.md
│   ├── code-review.md
│   ├── channels.md
│   ├── slack-integration.md
│   ├── gitlab-cicd.md
│   ├── voice-dictation.md
│   ├── computer-use.md
│   ├── ultraplan.md
│   └── additional-features.md
```

## Development

### Pre-commit Hooks

This repo uses [pre-commit](https://pre-commit.com/) to enforce formatting before commits:

```bash
# Install hooks (one time)
uv tool install pre-commit
pre-commit install

# Run against all files
pre-commit run --all-files
```

The config (`.pre-commit-config.yaml`) runs standard hygiene hooks plus `mdformat` with the same plugins as CI.

### Linting

Markdown files are checked with `mdformat`:

```bash
# Check formatting
uvx --with mdformat-gfm --with mdformat-tables --with mdformat-frontmatter \
  mdformat --check .

# Fix formatting
uvx --with mdformat-gfm --with mdformat-tables --with mdformat-frontmatter \
  mdformat .
```

Python files (if any) are checked with `ruff`:

```bash
uvx ruff check .
uvx ruff format --check .
```

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>[optional scope]: <description>
```

| Type       | Purpose                           |
| ---------- | --------------------------------- |
| `feat`     | New feature/documentation         |
| `fix`      | Bug fix or correction             |
| `docs`     | Documentation improvements        |
| `style`    | Formatting, no content change     |
| `refactor` | Restructuring without new content |
| `chore`    | Maintenance tasks                 |

Rules:

- Use imperative mood: "add" not "added"
- Don't capitalize first letter after type
- No period at the end
- Subject line: max 72 characters

## Design System (website)

The claude-almanac website uses **Fumadocs** (Next.js 15 + Tailwind CSS v4 + shadcn/ui).
The visual theme is based on the **"claude"** preset from tweakcn.com - warm terracotta
primary on cream background, matching Anthropic's Claude brand palette.

### Theme editor

Visual theme edits happen at [tweakcn.com](https://tweakcn.com/editor/theme) in the saved
**"claude-almanac"** theme (on the project owner's account).

**tweakcn is the authoring tool; the exported CSS in this repo is the source of truth.**

### Workflow for theme changes

1. Open [tweakcn.com](https://tweakcn.com/editor/theme) and load the "claude-almanac" theme
1. Make visual edits (colors, radius, typography) with live preview
1. Save in tweakcn
1. Click **Code** -> copy the generated CSS (Tailwind v4 + OKLCH format)
1. Paste into `site/src/styles/theme.css`
1. Open a PR - review via Cloudflare Pages preview deployment
1. Merge when the preview looks right

### Current theme values

| Token      | Value                                |
| ---------- | ------------------------------------ |
| Primary    | `#c96442` (terracotta)               |
| Background | `#faf9f5` (warm cream)               |
| Foreground | `#3d3929` (warm olive-brown)         |
| Radius     | `0.5rem`                             |
| Fonts      | Inter (body) + JetBrains Mono (code) |

Never edit theme variables directly in `theme.css` except to paste from tweakcn export.

## Pull Request Workflow

Direct pushes to `main` are blocked. All changes require PRs.

```bash
# Create branch
git checkout -b <type>/<short-description>

# Push and create PR
git push -u origin HEAD
gh pr create --fill

# After merge
git checkout main && git pull
```

## Branch Protection

The `main` branch has the following protections:

- Require pull request before merging
- Require status checks to pass:
  - `Validate PR Title`
  - `Validate Commits`
  - `Check Markdown Format`
- Do not allow bypassing the above settings

To configure branch protection via GitHub CLI:

```bash
gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=Validate PR Title" \
  -f "required_status_checks[contexts][]=Validate Commits" \
  -f "required_status_checks[contexts][]=Check Markdown Format" \
  -f "enforce_admins=true" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=false" \
  -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
  -f "required_pull_request_reviews[required_approving_review_count]=0" \
  -f "restrictions=null"
```

## Teammate Lifecycle (Agent Teams)

When working as the lead of an agent team, manage teammate lifecycle deliberately. Idle teammates accumulate quickly and make it hard to track what's active.

### Shutting down teammates

Shut down a teammate as soon as their work is complete - do NOT let idle teammates accumulate.

**Protocol shutdown** (the normal path):

```
SendMessage({
  to: "<teammate-name>",
  message: {"type": "shutdown_request"}
})
```

The teammate should respond with `{"type": "shutdown_approved", ...}` and exit. You will receive a `teammate_terminated` system message shortly after.

### When to shut down

- Immediately after their PR is created (do not wait for it to be merged)
- When their assigned task is completed
- When you realize they are no longer needed for the current work

### Dealing with stuck teammates

Sometimes teammates become unresponsive to shutdown requests. Signs:

- Idle notifications keep arriving after shutdown requests
- Multiple shutdown requests fail to terminate the teammate
- Agent reports they have completed work but will not exit

**Recovery steps:**

1. Send the shutdown request again (sometimes messages queue up)
1. Ask the user to manually kill the tmux pane (`tmux kill-pane -t <pane_id>`)
1. Do NOT try to force kill from the lead session

### Best practices

- Keep active teammate count low (3-5 maximum at any time)
- Shut down before spawning more when possible
- Track active teammates mentally - know who is alive and why
- Do not spawn teammates for trivial work - use the lead session for short tasks
- Batch related tasks for one teammate rather than spawning a new one per task

### Team cleanup at end of work

When all work is complete:

1. Ensure every teammate has been shut down (check with `TeamDelete` - it will list any active members)
1. Call `TeamDelete` to remove the team directory and task list

`TeamDelete` fails if any teammates are still active.

### Anti-patterns to avoid

- Spawning a new teammate for every small task
- Letting teammates sit idle "in case they are needed later"
- Forgetting to send shutdown requests after teammates complete their work
- Running 6+ teammates in parallel on a single project

## Contributing

When adding new feature documentation:

1. Create a new file in `features/` or update existing ones
1. Update `FEATURES-OVERVIEW.md` if adding new features
1. Follow the existing documentation style
1. Run linting before committing
