# Contributing to claude-almanac

Thanks for your interest in contributing to the Claude Code features almanac. This guide covers local development setup and conventions for submitting changes.

## Repository purpose

This is a public reference for Claude Code features. See the [README](./README.md) for the feature catalog.

## Development

### Pre-commit hooks

Install pre-commit hooks to catch formatting issues before committing:

```bash
# Install pre-commit (one time)
uv tool install pre-commit
# or: pipx install pre-commit

# Install the hooks for this repo
pre-commit install

# Run against all files (first time)
pre-commit run --all-files
```

Hooks will run automatically on `git commit`.

### Markdown formatting

This repo uses `mdformat` with GFM, tables, and frontmatter extensions:

```bash
# Check formatting
uvx --with mdformat-gfm --with mdformat-tables --with mdformat-frontmatter mdformat --check .

# Fix formatting
uvx --with mdformat-gfm --with mdformat-tables --with mdformat-frontmatter mdformat .
```

### Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>[optional scope]: <description>`

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

### Pull request workflow

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

Required CI checks: `Validate PR Title`, `Validate Commits`, `Check Markdown Format`.
