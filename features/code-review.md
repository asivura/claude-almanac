---
title: Code Review
description: Automated PR review using multi-agent analysis to catch logic errors, security issues, and regressions.
category: ci-cd
---

# Claude Code Review

> **Status**: Research preview. Available for Team and Enterprise subscriptions. Not available with Zero Data Retention enabled.

Automated PR review that catches logic errors, security vulnerabilities, and regressions using multi-agent analysis of your full codebase.

## How Reviews Work

When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure. Each agent looks for a different class of issue, then a verification step checks candidates against actual code behavior to filter out false positives. Results are deduplicated, ranked by severity, and posted as inline comments on specific lines.

Reviews complete in 20 minutes on average, scaling with PR size and complexity.

### What Code Review Checks

By default, Code Review focuses on **correctness**: bugs that would break production, not formatting preferences or missing test coverage. You can expand scope with CLAUDE.md and REVIEW.md guidance files.

### Severity Levels

| Marker | Severity     | Meaning                                                             |
| ------ | ------------ | ------------------------------------------------------------------- |
| 🔴     | Important    | A bug that should be fixed before merging                           |
| 🟡     | Nit          | A minor issue, worth fixing but not blocking                        |
| 🟣     | Pre-existing | A bug that exists in the codebase but was not introduced by this PR |

Findings include a collapsible extended reasoning section explaining why Claude flagged the issue and how it verified the problem.

### Check Run Output

Each review populates a **Claude Code Review** check run alongside your CI checks:

- Summary table of all findings sorted by severity
- Annotations in the **Files changed** tab on relevant diff lines
- Machine-readable severity JSON in the last line of Details text (parseable with `gh` and `jq`)
- Always completes with **neutral** conclusion (never blocks merging)

```bash
# Parse severity counts programmatically
gh api repos/OWNER/REPO/check-runs/CHECK_RUN_ID \
  --jq '.output.text | split("bughunter-severity: ")[1] | split(" -->")[0] | fromjson'
# Returns: {"normal": 2, "nit": 1, "pre_existing": 0}
```

## Setup

An admin enables Code Review once for the organization.

1. Go to [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code), find Code Review section
1. Click **Setup** to begin GitHub App installation
1. Install the Claude GitHub App (requires Contents, Issues, Pull Requests permissions)
1. Select repositories to enable
1. Set review triggers per repository

### Review Triggers

| Trigger                    | Behavior                                                      |
| -------------------------- | ------------------------------------------------------------- |
| **Once after PR creation** | Review runs once when PR is opened or marked ready for review |
| **After every push**       | Review runs on every push, auto-resolves fixed issues         |
| **Manual**                 | Reviews only when someone comments `@claude review` on the PR |

## Manual Triggers

Two comment commands start reviews on demand, regardless of configured trigger:

| Command               | Effect                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `@claude review`      | Starts review and subscribes PR to push-triggered reviews going forward |
| `@claude review once` | Starts a single review without subscribing to future pushes             |

Requirements:

- Post as a top-level PR comment (not inline on a diff line)
- Command at the start of the comment
- You must have owner, member, or collaborator access
- PR must be open

Manual triggers work on draft PRs. If a review is already running, the request is queued.

## Customizing Reviews

Code Review reads two files from your repository:

### CLAUDE.md

Shared project instructions used across all Claude Code tasks. Newly-introduced violations are flagged as nit-level findings. Works bidirectionally: if a PR makes CLAUDE.md statements outdated, Claude flags that the docs need updating too. Reads CLAUDE.md at every directory level (subdirectory rules apply only to files under that path).

### REVIEW.md

Review-only guidance at the repository root. Use for:

- Team style guidelines ("prefer early returns over nested conditionals")
- Language/framework conventions not covered by linters
- Things to always flag ("new API routes must have integration tests")
- Things to skip ("don't comment on generated code under `/gen/`")

```markdown
# Code Review Guidelines

## Always check
- New API endpoints have corresponding integration tests
- Database migrations are backward-compatible
- Error messages don't leak internal details to users

## Style
- Prefer `match` statements over chained `isinstance` checks
- Use structured logging, not f-string interpolation in log calls

## Skip
- Generated files under `src/gen/`
- Formatting-only changes in `*.lock` files
```

## Pricing

- Billed based on token usage, averaging **$15-25 per review**
- Scales with PR size, codebase complexity, and verification depth
- Billed separately through extra usage (not against plan's included usage)
- Costs apply regardless of Bedrock/Vertex usage for other features
- Set monthly spend cap at [claude.ai/admin-settings/usage](https://claude.ai/admin-settings/usage)

Cost by trigger:

- **Once after PR creation**: One review per PR
- **After every push**: Multiplied by number of pushes
- **Manual**: No cost until `@claude review` is posted

### Usage Analytics

View activity at [claude.ai/analytics/code-review](https://claude.ai/analytics/code-review):

- PRs reviewed (daily count)
- Cost weekly
- Feedback (auto-resolved comments)
- Repository breakdown

## Troubleshooting

### Retrigger a Failed Review

When a review hits an internal error or timeout, the check run title shows "Code review encountered an error" or "Code review timed out." Comment `@claude review once` to start a fresh review. The GitHub **Re-run** button does not retrigger Code Review.

### Missing Inline Comments

If the check run reports findings but no inline comments appear:

- **Check run Details**: Lists every finding regardless of inline comment status
- **Files changed annotations**: Findings render as annotations on diff lines
- **Review body**: Findings for lines that moved appear under "Additional findings" in the review body

## Sources

- [Code Review](https://code.claude.com/docs/en/code-review)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)
- [Plugins](https://code.claude.com/docs/en/discover-plugins) (includes `code-review` plugin for local pre-push reviews)
