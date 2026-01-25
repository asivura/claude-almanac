# GitHub Workflows Guide

This document explains how GitHub Actions workflows work in this repository and how to troubleshoot failures.

## Overview

GitHub Actions automates tasks when events occur in the repository. Our workflows validate that commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Workflows in This Repository

### 1. PR Title Check (`.github/workflows/pr-title.yml`)

**Trigger:** When a PR is opened, edited, or synchronized

**Purpose:** Validates that the PR title follows conventional commit format

**Action Used:** [amannn/action-semantic-pull-request](https://github.com/amannn/action-semantic-pull-request)

```yaml
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
```

### 2. Commit Messages Check (`.github/workflows/commits.yml`)

**Trigger:** When a PR targets the `main` branch

**Purpose:** Validates all commits in the PR follow conventional commit format

**Tools Used:**

- [astral-sh/setup-uv](https://github.com/astral-sh/setup-uv) - Installs uv package manager
- [Commitizen](https://commitizen-tools.github.io/commitizen/) - Validates commit messages

```yaml
on:
  pull_request:
    branches: [main]
```

### 3. Markdown Check (`.github/workflows/markdown.yml`)

**Trigger:** When a PR contains changes to `.md` files

**Purpose:** Validates markdown files are properly formatted

**Tools Used:**

- [mdformat](https://github.com/executablebooks/mdformat) - Markdown formatter

```yaml
on:
  pull_request:
    paths:
      - "**.md"
```

## How Workflows Execute

### Workflow Lifecycle

```
1. Event triggers workflow (e.g., PR opened)
           ↓
2. GitHub allocates a runner (ubuntu-slim)
           ↓
3. Runner clones repository
           ↓
4. Steps execute sequentially
           ↓
5. Job succeeds (exit 0) or fails (exit non-zero)
           ↓
6. Status reported back to PR
```

### Runner Types

| Runner          | Resources         | Use Case          |
| --------------- | ----------------- | ----------------- |
| `ubuntu-latest` | 4 vCPU, 16 GB RAM | Heavy builds      |
| `ubuntu-slim`   | 1 vCPU, 5 GB RAM  | Lightweight tasks |

We use `ubuntu-slim` for validation tasks to minimize resource usage.

## Viewing Workflow Results

### In Pull Requests

1. Open the PR on GitHub
1. Scroll to the **Checks** section at the bottom
1. Each workflow shows:
   - ✅ Green checkmark = passed
   - ❌ Red X = failed
   - 🟡 Yellow dot = running

### In Actions Tab

1. Go to repository → **Actions** tab
1. See all workflow runs with status
1. Click a run to see details

### Via GitHub CLI

```bash
# List recent workflow runs
gh run list

# View specific run details
gh run view <run-id>

# Watch a running workflow
gh run watch <run-id>
```

## Understanding Failures

### PR Title Check Failures

**Symptom:** `Validate PR Title` check fails

**Common Causes:**

1. **Wrong type**

   ```
   ❌ Update readme
   ✅ docs: update readme
   ```

1. **Missing colon**

   ```
   ❌ feat add new feature
   ✅ feat: add new feature
   ```

1. **Capitalized subject**

   ```
   ❌ feat: Add new feature
   ✅ feat: add new feature
   ```

1. **Invalid type**

   ```
   ❌ feature: add something
   ✅ feat: add something
   ```

**How to Fix:**

1. Click on the failed check
1. Read the error message
1. Edit the PR title to fix the format
1. The check will automatically re-run

### Commit Messages Check Failures

**Symptom:** `Validate Commits` check fails

**Common Causes:**

1. **One or more commits don't follow format**

   ```
   ❌ fixed the bug
   ✅ fix: resolve login issue
   ```

1. **Subject too short (< 10 chars)**

   ```
   ❌ fix: typo
   ✅ fix: correct typo in README
   ```

1. **Subject too long (> 72 chars)**

   ```
   ❌ feat: this is a very long commit message that exceeds the maximum allowed length
   ✅ feat: add user authentication
   ```

**How to Fix:**

Option 1: **Amend the last commit** (if it's the only bad one)

```bash
git commit --amend -m "fix: correct commit message"
git push --force-with-lease
```

Option 2: **Interactive rebase** (for multiple commits)

```bash
# Rebase last N commits
git rebase -i HEAD~N

# Change 'pick' to 'reword' for commits to fix
# Save and edit each commit message

git push --force-with-lease
```

Option 3: **Squash into new commit**

```bash
git reset --soft origin/main
git commit -m "feat: combined changes with proper message"
git push --force-with-lease
```

## Viewing Detailed Logs

### Via GitHub UI

1. Click on failed check
1. Click on the failed job
1. Expand each step to see logs
1. Look for error messages in red

### Via GitHub CLI

```bash
# View logs for a failed run
gh run view <run-id> --log-failed

# View all logs
gh run view <run-id> --log
```

## Workflow Syntax Reference

### Basic Structure

```yaml
name: Workflow Name          # Display name

on:                          # Triggers
  pull_request:
    branches: [main]

permissions:                 # Required permissions
  contents: read

jobs:                        # Jobs to run
  job-name:
    runs-on: ubuntu-slim     # Runner type
    steps:
      - uses: action@version # Use an action
      - run: command         # Run a shell command
```

### Common Triggers

| Trigger             | When                  |
| ------------------- | --------------------- |
| `push`              | Code pushed to branch |
| `pull_request`      | PR opened/updated     |
| `schedule`          | Cron schedule         |
| `workflow_dispatch` | Manual trigger        |

### Useful Expressions

```yaml
# Access PR info
${{ github.base_ref }}      # Target branch (e.g., main)
${{ github.head_ref }}      # Source branch
${{ github.event.number }}  # PR number

# Conditionals
if: github.event_name == 'pull_request'
if: failure()               # Run only if previous step failed
if: always()                # Always run
```

## Notifications

### Email Notifications

GitHub sends emails for:

- Failed workflows you triggered
- Failed workflows on watched repos

Configure at: **Settings → Notifications → Actions**

### GitHub Mobile

The GitHub mobile app sends push notifications for workflow failures.

### Slack/Discord Integration

Use [actions-status-discord](https://github.com/sarisia/actions-status-discord) or similar to post to chat.

## Debugging Tips

### 1. Enable Debug Logging

Add repository secret `ACTIONS_STEP_DEBUG` = `true` for verbose logs.

### 2. SSH into Runner (for complex debugging)

Use [action-tmate](https://github.com/mxschmitt/action-tmate):

```yaml
- uses: mxschmitt/action-tmate@v3
  if: failure()
```

### 3. Check Action Versions

Ensure actions are up to date:

```yaml
- uses: actions/checkout@v4      # Latest v4
- uses: astral-sh/setup-uv@v5    # Latest v5
```

### 4. Test Locally

Use [act](https://github.com/nektos/act) to run workflows locally:

```bash
brew install act
act pull_request
```

## Best Practices

1. **Use specific action versions** - Pin to major version (`@v4`) not `@latest`
1. **Minimize permissions** - Request only what's needed
1. **Use lightweight runners** - `ubuntu-slim` for simple tasks
1. **Cache dependencies** - Speed up repeated runs
1. **Fail fast** - Don't waste resources on doomed runs

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Commitizen Documentation](https://commitizen-tools.github.io/commitizen/)
