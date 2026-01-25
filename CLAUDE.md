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
│   ├── plugins.md
│   ├── memory-context.md
│   ├── ide-integrations.md
│   ├── security-sandbox.md
│   ├── headless-sdk.md
│   └── additional-features.md
└── github-workflows.md      # CI/CD workflow examples
```

## Development

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

## Contributing

When adding new feature documentation:

1. Create a new file in `features/` or update existing ones
1. Update `FEATURES-OVERVIEW.md` if adding new features
1. Follow the existing documentation style
1. Run linting before committing
