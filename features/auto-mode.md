# Claude Code Auto Mode

Auto mode lets Claude execute actions without permission prompts, using a separate classifier model to block unsafe or out-of-scope operations in real time.

## Overview

Users approve 93% of permission prompts in normal usage. Auto mode addresses this approval fatigue by replacing manual prompts with an AI-powered safety classifier that reviews each action before it runs.

Auto mode sits between manual permission prompts and `--dangerously-skip-permissions` (bypassPermissions mode). It provides high autonomy while maintaining safety through two defensive layers: a prompt-injection probe on inputs and a transcript classifier on outputs.

![Security vs Autonomy tradeoff chart](https://www-cdn.anthropic.com/images/4zrzovbb/website/d6b34bdb92808fd5739e4d14340a1752d5607dda-1920x1920.png)
*Source: [Anthropic Engineering Blog](https://www.anthropic.com/engineering/claude-code-auto-mode)*

## Requirements

| Requirement  | Details                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| **Plan**     | Team, Enterprise, or API. Not available on Pro or Max.                    |
| **Admin**    | On Team/Enterprise, an admin must enable it in Claude Code admin settings |
| **Model**    | Claude Sonnet 4.6 or Opus 4.6. Not available on Haiku or claude-3 models  |
| **Provider** | Anthropic API only. Not Bedrock, Vertex, or Foundry                       |
| **Version**  | Claude Code v2.1.83 or later                                              |

Admins can lock auto mode off with `permissions.disableAutoMode` set to `"disable"` in managed settings.

## Enabling Auto Mode

### CLI

```bash
claude --enable-auto-mode          # enables and adds to Shift+Tab cycle
claude --permission-mode auto      # start directly in auto mode
```

### VS Code

Enable "Allow dangerously skip permissions" in extension settings, then use the mode indicator to select auto mode.

### Settings

```json
{
  "permissions": {
    "defaultMode": "auto"
  }
}
```

### Switching Modes

| Interface     | Method                                                                        |
| ------------- | ----------------------------------------------------------------------------- |
| **CLI**       | `Shift+Tab` cycles modes. Auto appears after opt-in with `--enable-auto-mode` |
| **VS Code**   | Click mode indicator. Shows "Auto mode" label                                 |
| **Desktop**   | Mode selector next to send button                                             |
| **JetBrains** | Same as CLI (terminal-based)                                                  |

## System Architecture

Auto mode uses two independent defensive layers that work together.

![System architecture diagram](https://www-cdn.anthropic.com/images/4zrzovbb/website/05f268391243c60c3f725c26151eed7b0b531e86-1920x2002.png)
*Source: [Anthropic Engineering Blog](https://www.anthropic.com/engineering/claude-code-auto-mode)*

### Input Layer: Prompt-Injection Probe

A server-side probe scans tool outputs before they enter the agent's context. When hostile content is detected, warnings are added to the context rather than blocking entirely.

### Output Layer: Transcript Classifier

Runs on Claude Sonnet 4.6 regardless of the session model. Operates in two stages:

1. **Stage 1 (fast filter)**: Single-token classification that errs toward blocking. Approximately 8.5% false positive rate on real traffic.
1. **Stage 2 (deep reasoning)**: Chain-of-thought reasoning, only triggered when Stage 1 flags something. Reduces false positives to approximately 0.4%.

![Two-stage pipeline diagram](https://www-cdn.anthropic.com/images/4zrzovbb/website/58a83df591dc5a2344a65216d4f8eaee3c074fa1-1920x1935.png)
*Source: [Anthropic Engineering Blog](https://www.anthropic.com/engineering/claude-code-auto-mode)*

### What the Classifier Sees

The classifier receives a filtered transcript: user messages, tool calls, and CLAUDE.md content. **Assistant text and tool results are stripped.** This prevents the agent from generating persuasive rationalizations to manipulate the classifier, and tool results (the primary injection vector) cannot influence it.

![Transcript filtering diagram](https://www-cdn.anthropic.com/images/4zrzovbb/website/411b97a06450b27b11f1f9a952ab03d37d8ca3a3-1920x1679.png)
*Source: [Anthropic Engineering Blog](https://www.anthropic.com/engineering/claude-code-auto-mode)*

## Decision Framework

Actions are evaluated in three tiers with a fixed decision order.

### Decision Order

1. Actions matching user allow/deny rules resolve immediately
1. Read-only actions and file edits in working directory are auto-approved (except protected paths)
1. Everything else goes to the transcript classifier
1. If the classifier blocks, Claude receives the reason and tries an alternative approach

### Tier 1: Safe-Tool Allowlist

File reads, searches, and code navigation are allowed without classifier involvement. Blanket shell access (`Bash(*)`) and interpreter wildcards are disabled when entering auto mode.

### Tier 2: In-Project Operations

File writes inside the project directory bypass the classifier. These remain reviewable through version control.

### Tier 3: Transcript Classifier

Everything else passes through the classifier:

- Shell commands
- Web fetches
- External integrations
- Subagent spawns
- Filesystem operations outside the project directory

## Threat Model

The classifier targets four categories of unsafe behavior:

| Category               | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| **Overeager behavior** | Agent acts beyond user authorization despite good intentions         |
| **Honest mistakes**    | Agent misunderstands blast radius or resource scope                  |
| **Prompt injection**   | Malicious instructions in files or tool outputs hijack behavior      |
| **Misaligned models**  | Agent pursues independent goals (not currently observed in practice) |

### Real-World Examples

These examples come from internal logs of actions the classifier blocked:

- **Scope escalation**: User requested "clean up old branches," agent attempted destructive remote deletion
- **Credential exploration**: Agent searched environment variables for alternative API tokens after auth failures
- **Agent-inferred parameters**: Agent deleted a resource based on name similarity to a vague request
- **Data exfiltration**: Agent created a public GitHub Gist without consent
- **Safety-check bypass**: Agent retried a failed deploy with skip-verification flags

## Default Behavior

### Blocked by Default

- Downloading and executing code (`curl | bash`)
- Sending sensitive data to external endpoints
- Production deploys and migrations
- Mass deletion on cloud storage
- Granting IAM or repository permissions
- Modifying shared infrastructure
- Irreversibly destroying pre-session files
- Force push or pushing directly to `main`

### Allowed by Default

- Local file operations in working directory
- Installing dependencies from lock files or manifests
- Reading `.env` and sending credentials to their matching API
- Read-only HTTP requests
- Pushing to the current branch or one Claude created

## Fallback Behavior

When the classifier denies an action:

- A notification appears and the denial is logged under `/permissions` in "Recently denied"
- Press `r` to retry with manual approval
- **3 consecutive blocks** OR **20 total blocks** cause auto mode to pause and resume normal prompting
- Any allowed action resets the consecutive counter
- In non-interactive mode (`-p` flag), repeated blocks abort the session

## Subagent Handling

The classifier checks subagent activity at three points:

1. **Before spawn**: The delegated task description is evaluated
1. **During run**: Each action goes through the classifier with the same rules
1. **After finish**: Full action history is reviewed; if flagged, a security warning is prepended to the result

## Configuration

The classifier reads `autoMode` from user settings (`~/.claude/settings.json`), `.claude/settings.local.json`, and managed settings. It does **not** read from shared project settings (`.claude/settings.json`).

### Environment

Define trusted infrastructure so the classifier understands your context:

```json
{
  "autoMode": {
    "environment": [
      "Source control: github.example.com/acme-corp and all repos under it",
      "Trusted cloud buckets: s3://acme-build-artifacts, gs://acme-ml-datasets",
      "Trusted internal domains: *.corp.example.com",
      "Key internal services: Jenkins at ci.example.com"
    ]
  }
}
```

### Custom Rules

Use `allow` and `soft_deny` to override built-in rules. These **replace** defaults, not extend them.

```json
{
  "autoMode": {
    "allow": ["Deploying to staging namespace is allowed"],
    "soft_deny": ["Never run database migrations outside the migrations CLI"]
  }
}
```

### Inspection Commands

```bash
claude auto-mode defaults   # view built-in rules
claude auto-mode config     # view effective config
claude auto-mode critique   # AI feedback on custom rules
```

## Cost and Latency

- The classifier runs on Sonnet 4.6 regardless of session model
- Classifier calls count toward token usage
- Reads and working-directory edits skip the classifier (no overhead)
- Overhead applies mainly to shell commands and network operations

## Performance Metrics

| Stage                 | Real Traffic (n=10k) | Real Overeager (n=52) | Synthetic Exfil (n=1k) |
| --------------------- | -------------------- | --------------------- | ---------------------- |
| Stage 1 (fast filter) | 8.5% FPR             | 6.6% FNR              | 1.8% FNR               |
| Full pipeline         | 0.4% FPR             | 17% FNR               | 5.7% FNR               |

- **FPR** (false positive rate): Percentage of safe actions incorrectly blocked
- **FNR** (false negative rate): Percentage of unsafe actions incorrectly allowed

## References

- [Auto Mode Engineering Blog Post](https://www.anthropic.com/engineering/claude-code-auto-mode)
- [Security Guide](https://code.claude.com/docs/en/security.md)
- [Permission Modes](https://code.claude.com/docs/en/permissions.md)
