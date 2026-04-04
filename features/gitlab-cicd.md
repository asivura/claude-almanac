---
title: GitLab CI/CD
description: Integrate Claude Code into GitLab pipelines to automate code changes, MRs, and review comments.
category: ci-cd
---

# Claude Code GitLab CI/CD

> **Status**: Beta. Maintained by GitLab. Built on the Claude Code CLI and Agent SDK.

Integrate Claude Code into GitLab CI/CD pipelines to automate code changes, create MRs from issues, and respond to review comments.

## Capabilities

- Create and update MRs from issue descriptions or comments
- Implement features in a branch and open MRs
- Fix bugs identified by tests or comments
- Analyze performance regressions and propose optimizations
- Respond to follow-up comments to iterate on changes

## How It Works

1. **Event-driven**: GitLab listens for triggers (e.g., `@claude` mentions in issues, MRs, or review threads). The job collects context and runs Claude Code.
1. **Provider abstraction**: Choose Claude API (SaaS), AWS Bedrock (OIDC), or Google Vertex AI (Workload Identity Federation).
1. **Sandboxed execution**: Each interaction runs in an isolated container. Changes flow through MRs so reviewers see diffs and approvals still apply.

## Quick Setup

### 1. Add API Key

**Settings > CI/CD > Variables**: Add `ANTHROPIC_API_KEY` (masked, protected as needed).

### 2. Add CI Job

```yaml
stages:
  - ai

claude:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    - /bin/gitlab-mcp-server || true
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Review this MR and implement the requested changes'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
```

### 3. Test

Run manually from **CI/CD > Pipelines**, or trigger from an MR.

## Enterprise Providers

### AWS Bedrock

Prerequisites:

- AWS account with Bedrock access to Claude models
- GitLab configured as OIDC identity provider in AWS IAM
- IAM role with Bedrock permissions, trust policy restricted to your project/refs

Required CI/CD variables:

- `AWS_ROLE_TO_ASSUME` (role ARN)
- `AWS_REGION` (Bedrock region)

The job exchanges the GitLab OIDC token for temporary AWS credentials at runtime (no static keys).

### Google Vertex AI

Prerequisites:

- GCP project with Vertex AI API enabled
- Workload Identity Federation configured to trust GitLab OIDC
- Dedicated service account with Vertex AI roles

Required CI/CD variables:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` (full resource name)
- `GCP_SERVICE_ACCOUNT` (service account email)
- `CLOUD_ML_REGION` (e.g., `us-east5`)

Authenticates via WIF without storing service account keys.

## Trigger Patterns

| Trigger            | How                                                          |
| ------------------ | ------------------------------------------------------------ |
| Manual             | Run from CI/CD > Pipelines                                   |
| MR events          | `$CI_PIPELINE_SOURCE == "merge_request_event"`               |
| `@claude` mentions | Webhook on "Comments (notes)" calls pipeline trigger API     |
| Web/API triggers   | Use `AI_FLOW_INPUT`, `AI_FLOW_CONTEXT`, `AI_FLOW_EVENT` vars |

## Example Use Cases

**Turn issues into MRs:**

```text
@claude implement this feature based on the issue description
```

**Get implementation help:**

```text
@claude suggest a concrete approach to cache the results of this API call
```

**Fix bugs:**

```text
@claude fix the TypeError in the user dashboard component
```

## Configuration

### CLAUDE.md

Create a `CLAUDE.md` at repository root to define coding standards and conventions. Claude reads this during runs.

### Common Parameters

| Parameter         | Purpose                             |
| ----------------- | ----------------------------------- |
| `-p` / `prompt`   | Inline instructions                 |
| `prompt_file`     | Instructions from a file            |
| `max_turns`       | Limit back-and-forth iterations     |
| `timeout_minutes` | Limit total execution time          |
| `--allowedTools`  | Restrict which tools Claude can use |

## Security

- Each job runs in an isolated container with restricted network access
- Changes flow through MRs (reviewers see every diff)
- Branch protection and approval rules apply to AI-generated code
- Workspace-scoped permissions constrain writes
- Use OIDC/WIF where possible (no long-lived keys)
- Never commit API keys or credentials to your repository

## Cost Considerations

- **GitLab Runner time**: Consumes compute minutes on your runners
- **API tokens**: Usage varies by task complexity and codebase size
- Use specific `@claude` commands to reduce unnecessary turns
- Set appropriate `max_turns` and job timeout values
- Limit concurrency to control parallel runs

## Troubleshooting

### Claude Not Responding to @claude

- Verify pipeline is being triggered
- Ensure CI/CD variables are present and unmasked
- Check comment contains `@claude` (not `/claude`)

### Job Can't Write Comments or Open MRs

- Ensure `CI_JOB_TOKEN` has sufficient permissions, or use a Project Access Token with `api` scope
- Check `mcp__gitlab` tool is enabled in `--allowedTools`

### Authentication Errors

- **Claude API**: Confirm `ANTHROPIC_API_KEY` is valid
- **Bedrock**: Verify OIDC config, role impersonation, region, and model availability
- **Vertex**: Verify WIF configuration and service account permissions

## Sources

- [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [GitLab Support Issue](https://gitlab.com/gitlab-org/gitlab/-/issues/573776)
