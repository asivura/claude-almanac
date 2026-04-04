# Claude Code GitHub Actions and CI/CD

Run Claude Code in GitHub Actions workflows for automated code review, implementation, and CI/CD tasks.

## Overview

Three authentication methods, two integration approaches:

| Auth Method                  | Setup                         | Cost          | Best For                   |
| ---------------------------- | ----------------------------- | ------------- | -------------------------- |
| API key                      | `ANTHROPIC_API_KEY` secret    | Pay-per-token | Teams using Claude API     |
| Max/Pro subscription (OAuth) | `claude setup-token` + secret | Fixed monthly | Individual Max subscribers |
| Google Vertex AI             | Workload Identity Federation  | GCP billing   | GCP-native organizations   |
| AWS Bedrock                  | OIDC role assumption          | AWS billing   | AWS-native organizations   |

| Integration            | How                                  | When                             |
| ---------------------- | ------------------------------------ | -------------------------------- |
| Official GitHub Action | `anthropics/claude-code-action@v1`   | Most use cases                   |
| CLI `-p` mode          | Install Claude Code, run `claude -p` | Custom scripts, pre-commit hooks |

## Quick Start

### Option A: Setup via CLI (Fastest)

```bash
claude /install-github-app
```

This guides you through installing the Claude GitHub App, adding secrets, and copying workflow files.

### Option B: Manual Setup

1. Install the Claude GitHub App: https://github.com/apps/claude
1. Add authentication secret (see [Authentication](#authentication) below)
1. Copy a workflow file to `.github/workflows/claude.yml`

______________________________________________________________________

## Authentication

### API Key

Create a key at [console.anthropic.com](https://console.anthropic.com). Store as `ANTHROPIC_API_KEY` in GitHub Secrets.

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Max/Pro Subscription (OAuth Token)

Use your existing Max or Pro subscription instead of paying per-token. Generate a long-lived OAuth token with `setup-token`.

**Step 1: Generate token (on a machine with a browser)**

```bash
claude setup-token
# Returns: sk-ant-oat01-xxxxxxxxxxxxx (valid ~1 year)
```

**Step 2: Store as GitHub Secret**

Repository Settings > Secrets and variables > Actions > New repository secret:

- Name: `CLAUDE_CODE_OAUTH_TOKEN`
- Value: the token from step 1

**Step 3: Use in workflow**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

**Notes:**

- Token is valid for approximately 1 year, then must be regenerated
- Available in Claude Code v1.0.44+
- Uses your subscription quota (subject to rate limits of your plan tier)
- No per-token charges

### Google Vertex AI

Use GCP service account credentials via Workload Identity Federation. Billed through GCP.

**Prerequisites:**

```bash
gcloud services enable aiplatform.googleapis.com
```

Configure Workload Identity Federation for GitHub Actions (see [GCP docs](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)).

**Workflow:**

```yaml
jobs:
  claude:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write  # Required for OIDC

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - uses: anthropics/claude-code-action@v1
        with:
          use_vertex: "true"
```

**Environment variables (alternative to action inputs):**

```bash
CLAUDE_CODE_USE_VERTEX=1
ANTHROPIC_VERTEX_PROJECT_ID=your-project-id
CLOUD_ML_REGION=us-east5  # or global
```

### AWS Bedrock

Use AWS credentials via OIDC role assumption. Billed through AWS.

**Workflow:**

```yaml
jobs:
  claude:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write  # Required for OIDC

    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: us-east-1

      - uses: anthropics/claude-code-action@v1
        with:
          use_bedrock: "true"
```

______________________________________________________________________

## Workflow Examples

### Interactive: Respond to @claude Mentions

The most common pattern. Claude responds when mentioned in PR comments, issue comments, or reviews.

```yaml
name: Claude
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Usage in PRs/issues:**

```
@claude implement this feature based on the issue description
@claude review this PR for security vulnerabilities
@claude fix the failing tests
@claude how should I implement user authentication?
```

### Automated: PR Code Review

Automatically review every PR when opened or updated.

```yaml
name: Claude PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR for:
            - Security vulnerabilities
            - Performance issues
            - Code style and best practices
            - Potential bugs
          claude_args: "--model claude-sonnet-4-6 --max-turns 5"
```

### Automated: Review Critical Paths Only

Trigger review only when specific files change.

```yaml
name: Claude Security Review
on:
  pull_request:
    paths:
      - "src/auth/**"
      - "src/api/**"
      - "*.config.*"

jobs:
  security-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review changes to authentication and API code for security issues"
          claude_args: "--max-turns 5"
```

### Automated: Fix Failing CI

Trigger Claude when tests fail to diagnose and fix issues.

```yaml
name: Claude Fix CI
on:
  workflow_run:
    workflows: ["Tests"]
    types: [completed]

jobs:
  fix:
    if: github.event.workflow_run.conclusion == 'failure'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "The CI tests failed. Diagnose the failures and create a fix."
          claude_args: "--max-turns 10"
```

### Automated: Issue to PR

Convert labeled issues into pull requests.

```yaml
name: Claude Implement Issue
on:
  issues:
    types: [labeled]

jobs:
  implement:
    if: github.event.label.name == 'claude'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Read the issue description and implement the requested feature. Create a PR when done."
          claude_args: "--max-turns 15"
```

### CLI: Direct `claude -p` in Steps

For custom scripting beyond what the action provides.

```yaml
- name: Install Claude Code
  run: npm install -g @anthropic-ai/claude-code

- name: Run analysis
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    gh pr diff "${{ github.event.number }}" | \
      claude -p "Review for security vulnerabilities" \
        --output-format json \
        --max-turns 3 \
        --allowedTools "Read,Grep,Glob" > review.json
    cat review.json | jq '.result'
```

______________________________________________________________________

## Action Parameters

| Parameter                 | Description                      | Required                 |
| ------------------------- | -------------------------------- | ------------------------ |
| `anthropic_api_key`       | API key for Claude               | One auth method required |
| `claude_code_oauth_token` | OAuth token from `setup-token`   | One auth method required |
| `use_vertex`              | Use Google Vertex AI (`"true"`)  | One auth method required |
| `use_bedrock`             | Use AWS Bedrock (`"true"`)       | One auth method required |
| `prompt`                  | Instructions for automation mode | No                       |
| `claude_args`             | CLI arguments                    | No                       |
| `trigger_phrase`          | Custom mention trigger           | No (default: `@claude`)  |
| `claude_env`              | Environment variables (YAML)     | No                       |

### claude_args Examples

```yaml
# Model selection
claude_args: "--model claude-sonnet-4-6"

# Limit turns to control cost
claude_args: "--max-turns 5"

# Combine flags
claude_args: "--model claude-sonnet-4-6 --max-turns 5 --allowedTools Read,Grep,Glob"
```

### claude_env Example

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_env: |
      ENVIRONMENT: staging
      API_BASE_URL: https://api.staging.example.com
      DEBUG: "true"
```

______________________________________________________________________

## Cost Management

### API Key Users

| Model             | Input (per 1M tokens) | Output (per 1M tokens) |
| ----------------- | --------------------- | ---------------------- |
| Claude Sonnet 4.6 | $3.00                 | $15.00                 |
| Claude Opus 4.6   | $5.00                 | $25.00                 |

Typical PR review: $0.10-0.50 in API tokens.

### Subscription Users

Max 5x ($100/month) or Max 20x ($200/month). No per-token charges, but subject to rate limits.

### Cost Reduction Tips

- Use `--model claude-sonnet-4-6` (cheaper than Opus, sufficient for most reviews)
- Set `--max-turns 5` to cap iterations
- Use path filters to only review critical files
- Configure workflow `timeout-minutes` to prevent runaway jobs
- Keep `CLAUDE.md` concise to reduce context token usage

### Faster, Cheaper Runners

[Depot](https://depot.dev/blog/claude-code-in-github-actions) offers optimized runners:

```yaml
runs-on: depot-ubuntu-latest  # Instead of ubuntu-latest
```

Approximately half the cost of GitHub-hosted runners.

______________________________________________________________________

## CLAUDE.md for CI/CD

Claude respects your `CLAUDE.md` file in CI/CD, just like interactive sessions. Use it to define:

```markdown
# CLAUDE.md

## Code Standards
- Use TypeScript strict mode
- All functions must have JSDoc comments
- No `any` types

## Testing
- Run `npm test` before committing
- Minimum 80% code coverage

## Review Guidelines
- Flag any use of `eval()` or `Function()`
- Ensure all API endpoints validate input
- Check for proper error handling
```

______________________________________________________________________

## Security Best Practices

1. **Store credentials in GitHub Secrets** (never hardcode)
1. **Use least-privilege permissions** in workflow `permissions` blocks
1. **Pin the action to a commit SHA** for supply chain security:

```yaml
- uses: anthropics/claude-code-action@abc123def  # Pin to SHA
```

4. **Set `--max-turns`** to prevent excessive iterations
1. **Use path filters** to limit which files trigger reviews
1. **Require human review** on Claude-generated PRs via branch protection

______________________________________________________________________

## Troubleshooting

| Issue                                 | Solution                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| Claude doesn't respond to mentions    | Check `if` condition includes your event type             |
| Authentication error with OAuth token | Regenerate with `claude setup-token`, update secret       |
| Rate limited (subscription)           | Reduce `--max-turns`, use path filters, stagger workflows |
| Action takes too long                 | Set `timeout-minutes` on job, reduce `--max-turns`        |
| Claude makes unwanted changes         | Add constraints to `prompt` or `CLAUDE.md`                |

______________________________________________________________________

## Feature Compatibility in CI/CD

Not all Claude Code features work in GitHub Actions. Runners are headless Linux VMs with no display.

| Feature                           | Works in CI/CD? | Notes                                                  |
| --------------------------------- | --------------- | ------------------------------------------------------ |
| CLAUDE.md                         | Yes             | Auto-loaded from repo root                             |
| Skills (`.claude/skills/`)        | Yes             | Invokable via `prompt: "/skill-name"`                  |
| Custom agents (`.claude/agents/`) | Yes             | Available as subagents                                 |
| Rules (`.claude/rules/`)          | Yes             | Auto-loaded based on path conditions                   |
| MCP Servers (stdio)               | Yes             | Configure via `claude_args: "--mcp-config '...'"`      |
| Bash commands                     | Yes             | Must be allowed via `--allowedTools`                   |
| Image analysis                    | Yes             | Attach screenshots to issues, Claude can analyze them  |
| Web search/fetch                  | Yes             | Available as tools                                     |
| Plugins                           | Yes             | Install via `plugins` and `plugin_marketplaces` inputs |
| Structured JSON output            | Yes             | Via `--json-schema` flag                               |
| Chrome/browser automation         | No              | Requires local Chrome with extension                   |
| MCP Servers (browser-based)       | No              | No display available on runners                        |
| Interactive prompts               | No              | Runs must complete unattended                          |
| Desktop app features              | No              | CLI only                                               |

### Using Skills in CI/CD

Skills from `.claude/skills/` are available automatically. Invoke them in the `prompt` input:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "/your-skill-name"
```

Or install marketplace plugins:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
    plugins: "code-review@claude-code-plugins"
    prompt: "/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
```

### Using MCP Servers in CI/CD

Only stdio-based servers work (no browser or GUI servers):

```yaml
claude_args: |
  --mcp-config '{"mcpServers":{"db":{"command":"npx","args":["-y","@bytebase/dbhub","--dsn","postgres://..."]}}}'
```

______________________________________________________________________

## GitLab CI/CD

Claude Code also works in GitLab pipelines via the CLI:

```yaml
claude-review:
  image: node:20
  script:
    - npm install -g @anthropic-ai/claude-code
    - claude -p "Review this MR for code quality" \
        --allowedTools "Read,Grep,Glob" \
        --output-format json > review.json
  artifacts:
    paths:
      - review.json
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

## Sources

- [Official Docs: GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Official Docs: Headless Mode](https://code.claude.com/docs/en/headless)
- [Action Repository](https://github.com/anthropics/claude-code-action)
- [Action Marketplace](https://github.com/marketplace/actions/claude-code-action-official)
- [Action Usage Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md)
- [Action Setup Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md)
- [Official Docs: Authentication](https://code.claude.com/docs/en/authentication)
- [Official Docs: Google Vertex AI](https://code.claude.com/docs/en/google-vertex-ai)
