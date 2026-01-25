# Claude Code Headless Mode and Agent SDK

Headless mode (now called SDK mode) allows you to run Claude Code non-interactively from the command line or within application code.

## Overview

Two approaches available:

- **CLI with `-p` flag**: For scripts, CI/CD, and automation
- **Agent SDK packages**: For full programmatic control with Python or TypeScript

## CLI SDK Mode

### Basic Usage

```bash
# Simple non-interactive query
claude -p "Find and fix the bug in auth.py"

# With allowed tools (auto-approve operations)
claude -p "Find and fix the bug" --allowedTools "Read,Edit,Bash"

# With structured output
claude -p "Summarize this project" --output-format json
```

### Key CLI Flags

| Flag                     | Purpose                    | Example                                   |
| ------------------------ | -------------------------- | ----------------------------------------- |
| `-p, --print`            | Non-interactive mode       | `claude -p "your prompt"`                 |
| `--allowedTools`         | Auto-approve tools         | `--allowedTools "Read,Edit,Bash"`         |
| `--output-format`        | Output format              | `--output-format json`                    |
| `--json-schema`          | Validate output            | `--json-schema '{...}'`                   |
| `--continue, -c`         | Resume most recent session | `claude -c -p "continue"`                 |
| `--resume, -r`           | Resume specific session    | `claude -r "session-name"`                |
| `--max-turns`            | Limit agentic turns        | `--max-turns 5`                           |
| `--max-budget-usd`       | Spend limit                | `--max-budget-usd 5.00`                   |
| `--model`                | Specify model              | `--model opus`                            |
| `--append-system-prompt` | Add instructions           | `--append-system-prompt "Use TypeScript"` |
| `--system-prompt`        | Replace system prompt      | `--system-prompt "Custom prompt"`         |
| `--permission-mode`      | Permission level           | `--permission-mode acceptEdits`           |
| `--tools`                | Restrict available tools   | `--tools "Read,Bash"`                     |

### Output Formats

**Text (default):**

```bash
claude -p "Explain this project"
```

**JSON:**

```bash
claude -p "Summarize" --output-format json
# Returns: {"result": "...", "session_id": "...", "usage": {...}}
```

**Streaming JSON:**

```bash
claude -p "Analyze logs" --output-format stream-json
# Returns newline-delimited JSON
```

### Advanced CLI Examples

```bash
# Structured output with schema validation
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}}}'

# Create commit with auto-approved git commands
claude -p "Look at staged changes and create an appropriate commit" \
  --allowedTools "Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git commit:*)"

# Continue conversation across prompts
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue that review" --resume "$session_id"
```

## Agent SDK

The Agent SDK gives you the same tools, agent loop, and context management that power Claude Code, but programmable.

### CLI vs SDK Comparison

| Aspect             | CLI (`-p`)              | Agent SDK                      |
| ------------------ | ----------------------- | ------------------------------ |
| **Use Case**       | Scripts, CI/CD, one-off | Production agents, custom apps |
| **Output**         | Text, JSON, streaming   | Native message objects         |
| **Control**        | Basic flags             | Advanced hooks, callbacks      |
| **Authentication** | Claude Code config      | API key or cloud auth          |

### What the SDK Provides

- **Built-in tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
- **Hooks**: PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, UserPromptSubmit
- **Subagents**: Spawn specialized agents for focused subtasks
- **MCP integration**: Connect to databases, browsers, APIs
- **Permissions**: Fine-grained control over what agents can do
- **Sessions**: Maintain context across multiple exchanges
- **Structured outputs**: Validate responses against JSON schemas

### Python Example: Simple Agent

> **Note**: Verify current package name at [pypi.org](https://pypi.org/search/?q=claude+agent+sdk) or the [official SDK docs](https://platform.claude.com/docs/en/agent-sdk).

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Review utils.py for bugs that would cause crashes.",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],
            permission_mode="acceptEdits"
        )
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text)

asyncio.run(main())
```

### TypeScript Example: Simple Agent

> **Note**: Verify current package name at [npmjs.com](https://www.npmjs.com/search?q=claude%20agent%20sdk) or the [official SDK docs](https://platform.claude.com/docs/en/agent-sdk).

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review utils.py for bugs.",
  options: {
    allowedTools: ["Read", "Edit", "Glob"],
    permissionMode: "acceptEdits"
  }
})) {
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text);
    }
  }
}
```

### Python: Agent with Subagents

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="Use the code-reviewer agent to review this codebase",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Glob", "Grep", "Task"],
            agents={
                "code-reviewer": AgentDefinition(
                    description="Expert code reviewer.",
                    prompt="Analyze code quality and suggest improvements.",
                    tools=["Read", "Glob", "Grep"]
                )
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)
```

### Python: Agent with Hooks

```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher
from datetime import datetime

async def log_file_change(input_data, tool_use_id, context):
    file_path = input_data.get('tool_input', {}).get('file_path', 'unknown')
    with open('./audit.log', 'a') as f:
        f.write(f"{datetime.now()}: modified {file_path}\n")
    return {}

async def main():
    async for message in query(
        prompt="Refactor utils.py",
        options=ClaudeAgentOptions(
            permission_mode="acceptEdits",
            hooks={
                "PostToolUse": [HookMatcher(matcher="Edit|Write", hooks=[log_file_change])]
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)
```

### Python: Sessions and Context Persistence

```python
async def main():
    session_id = None

    # First query
    async for message in query(
        prompt="Read the authentication module",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Glob"])
    ):
        if hasattr(message, 'subtype') and message.subtype == 'init':
            session_id = message.session_id

    # Resume with full context
    async for message in query(
        prompt="Now find all places that call it",
        options=ClaudeAgentOptions(resume=session_id)
    ):
        if hasattr(message, "result"):
            print(message.result)
```

## CI/CD Integration

### GitHub Actions

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "Review this PR for security issues"
    claude_args: "--max-turns 10 --model claude-opus-4-5-20251101"
```

### GitLab CI/CD

```yaml
claude-review:
  script:
    - claude -p "Review this MR for code quality" \
        --allowedTools "Read,Grep,Glob" \
        --output-format json > review.json
  artifacts:
    paths:
      - review.json
```

### Local Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

claude -p "Check staged changes for obvious bugs" \
  --allowedTools "Bash(git diff:*),Read" \
  --max-turns 3 \
  --output-format json > /tmp/claude-check.json

if grep -q "error" /tmp/claude-check.json; then
  echo "Pre-commit check failed"
  exit 1
fi
```

## Automation Use Cases

### Automated Code Review

```bash
claude -p "Review code changes for:
  - Security vulnerabilities
  - Performance issues
  - Code style violations" \
  --allowedTools "Read,Grep,Glob" \
  --append-system-prompt "You are a senior code reviewer." \
  --output-format json
```

### Bug Finding and Fixing

```bash
claude -p "Find all bugs in src/ that would cause runtime errors and fix them." \
  --allowedTools "Read,Edit,Bash,Glob,Grep" \
  --permission-mode "acceptEdits" \
  --max-turns 10
```

### Documentation Generation

```bash
claude -p "Generate comprehensive API documentation from src/api. Save to docs/API.md" \
  --allowedTools "Read,Write,Glob,Grep" \
  --append-system-prompt "Generate clear, concise documentation with examples."
```

### Multi-Turn Conversation

```bash
#!/bin/bash

# Start session
session_id=$(claude -p "Understand the auth system in src/auth/" \
  --allowedTools "Read,Glob" \
  --output-format json | jq -r '.session_id')

# Continue with follow-ups
claude -p "Check if it handles token refresh correctly" \
  --resume "$session_id" \
  --allowedTools "Read,Bash" \
  --output-format json

claude -p "Generate a security audit report" \
  --resume "$session_id" \
  --output-format json
```

## Best Practices

### CLI Usage

1. **Use `--allowedTools` for safe operations**
1. **Use `--max-turns` to prevent runaway agents**
1. **Parse structured output with `jq`**
1. **Use sessions for multi-step tasks**

### Agent SDK Usage

1. **Use `permissionMode: "acceptEdits"` for development**
1. **Use `"bypassPermissions"` for CI**
1. **Stream messages for real-time feedback**
1. **Use hooks for audit logging**
1. **Maintain sessions for complex workflows**

## Quick Reference

| Task                | CLI                          | SDK                             |
| ------------------- | ---------------------------- | ------------------------------- |
| Quick analysis      | `claude -p "analyze"`        | `query(prompt="analyze")`       |
| Auto-approval       | `--allowedTools "Read,Edit"` | `permission_mode="acceptEdits"` |
| Structured output   | `--output-format json`       | `structured_outputs`            |
| Context persistence | `--resume session_id`        | `resume=session_id`             |
| Custom validation   | Post-process JSON            | `hooks={"PostToolUse": [...]}`  |

## References

- [Claude Code Headless Docs](https://code.claude.com/docs/en/headless.md)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference.md)
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Agent SDK Quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [GitHub Actions Integration](https://code.claude.com/docs/en/github-actions.md)
