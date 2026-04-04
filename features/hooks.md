# Claude Code Hooks

Hooks are a powerful automation feature that lets you execute custom bash commands or LLM-based prompts at specific points during a Claude Code session. Think of them as lifecycle events you can hook into to control, validate, or enhance Claude's behavior.

## Overview

Hooks allow you to:

- **Validate actions** before they execute (PreToolUse)
- **Process results** after tools complete (PostToolUse)
- **Protect files** from unwanted changes
- **Add context** dynamically to conversations
- **Auto-approve or deny** permissions
- **Modify tool inputs** before execution
- **Send notifications** when events occur
- **Setup environments** during initialization
- **Clean up** when sessions end

## Available Hook Events

Claude Code supports **26 hook events** in the session lifecycle:

| Hook Event           | When It Fires                             | Can Block |
| -------------------- | ----------------------------------------- | --------- |
| `SessionStart`       | Session begins or resumes                 | No        |
| `InstructionsLoaded` | CLAUDE.md or `.claude/rules/*.md` loaded  | No        |
| `UserPromptSubmit`   | User submits a prompt                     | Yes       |
| `PreToolUse`         | Before tool execution                     | Yes       |
| `PermissionRequest`  | Permission dialog appears                 | Yes       |
| `PermissionDenied`   | Auto mode denies a tool call              | No        |
| `PostToolUse`        | After tool succeeds                       | No        |
| `PostToolUseFailure` | After tool fails                          | No        |
| `Notification`       | Claude sends notifications                | No        |
| `SubagentStart`      | Subagent is spawned                       | No        |
| `SubagentStop`       | Subagent finishes                         | Yes       |
| `TaskCreated`        | Task created via TaskCreate               | Yes       |
| `TaskCompleted`      | Task marked completed                     | Yes       |
| `Stop`               | Claude finishes responding                | Yes       |
| `StopFailure`        | Turn ends due to API error                | No        |
| `TeammateIdle`       | Agent team teammate going idle            | Yes       |
| `CwdChanged`         | Working directory changes                 | No        |
| `FileChanged`        | Watched file changes on disk              | No        |
| `WorktreeCreate`     | Worktree created                          | Yes       |
| `WorktreeRemove`     | Worktree removed                          | No        |
| `PreCompact`         | Before context compaction                 | No        |
| `PostCompact`        | After context compaction completes        | No        |
| `Elicitation`        | MCP server requests user input            | Yes       |
| `ElicitationResult`  | User responds to MCP elicitation          | Yes       |
| `ConfigChange`       | Configuration file changes during session | Yes       |
| `SessionEnd`         | Session terminates                        | No        |

## Configuration

### Location

Hooks are configured in settings files:

- `~/.claude/settings.json` - User-level hooks (all projects)
- `.claude/settings.json` - Project-level hooks (this project only)
- `.claude/settings.local.json` - Local project hooks (not committed)
- Plugin configuration files

### Basic Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

### Key Concepts

- **matcher**: Pattern to match specific tools (regex support, case-sensitive)

  - `"Write"` - Exact match for Write tool only
  - `"Edit|Write"` - Match both Edit and Write tools
  - `"Notebook.*"` - Regex pattern for tools starting with "Notebook"
  - `"*"` or empty string - Match all tools
  - Not applicable for events like `UserPromptSubmit`, `Stop`, `SessionStart`

- **hooks**: Array of hook definitions

  - `type`: `"command"` (bash), `"prompt"` (LLM-based), `"agent"` (multi-turn), or `"http"` (POST to URL)
  - `command`: The bash command to execute (for `type: "command"`)
  - `prompt`: LLM prompt text (for `type: "prompt"` or `type: "agent"`)
  - `url`: POST endpoint (for `type: "http"`)
  - `if`: Permission rule syntax filter, e.g., `"Bash(git *)"` (tool events only, v2.1.85+)
  - `timeout`: Optional timeout in seconds (default: 600 for command, 30 for prompt, 60 for agent)
  - `async`: Run in background without blocking (for `type: "command"`)
  - `statusMessage`: Custom spinner text shown during execution

### Project-Specific Hook Scripts

Use the `$CLAUDE_PROJECT_DIR` environment variable to reference scripts in your project:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-style.sh"
          }
        ]
      }
    ]
  }
}
```

## Execution Order

When multiple hooks match the same event:

1. **Settings hierarchy**: Managed → Local → Project → User (higher precedence first)
1. **Parallel execution**: All matching hooks run in parallel; identical commands are deduplicated
1. **Most restrictive wins**: For decisions, `deny` > `defer` > `ask` > `allow`
1. **Exit code 2**: Blocks the action (stderr shown to Claude/user) but does not stop other hooks

**Example with multiple hooks:**

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write", "hooks": [{ "type": "command", "command": "echo 'First'" }] },
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "echo 'Second'" }] }
    ]
  }
}
```

For a `Write` tool, both hooks execute: "First" then "Second".

**Stdout/stderr handling:**

- Exit 0: stdout added to context (or shown in verbose mode)
- Exit 2: stderr shown to Claude and user, blocks action
- Other exit: stderr shown in verbose mode only

## Hook Input/Output Schema

### Hook Input

All hooks receive JSON via stdin with this structure:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default|plan|acceptEdits|dontAsk|bypassPermissions",
  "hook_event_name": "EventName",
  "tool_name": "ToolName",
  "tool_input": { },
  "tool_response": { },
  "agent_id": "agent-abc123",
  "agent_type": "Explore"
}
```

### Hook Output

Hooks communicate using exit codes and JSON output:

**Exit Code Behavior:**

| Exit Code | Behavior                                                               |
| --------- | ---------------------------------------------------------------------- |
| **0**     | Success - stdout added as context or shown in verbose mode             |
| **2**     | Blocking error - blocks the action, stderr shown to Claude/user        |
| **Other** | Non-blocking error - stderr shown in verbose mode, execution continues |

**JSON Response Structure:**

```json
{
  "continue": true,
  "stopReason": "string",
  "suppressOutput": false,
  "systemMessage": "string",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask|defer",
    "permissionDecisionReason": "string",
    "updatedInput": { },
    "additionalContext": "string"
  }
}
```

## Conditional Hooks with `if`

The `if` field (v2.1.85+) uses permission rule syntax to filter hooks by tool name
and arguments, so the hook only spawns when the tool call matches:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-git-policy.sh"
          }
        ]
      }
    ]
  }
}
```

The `if` field only works on tool events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
`PermissionRequest`, and `PermissionDenied`.

## The `defer` Decision (v2.1.89+)

For `PreToolUse` hooks in non-interactive mode (`-p`), a fourth permission decision
is available:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "defer"
  }
}
```

This pauses Claude Code and exits with `stop_reason: "tool_deferred"`. The deferred
tool call is included in the SDK result. Resume with:

```bash
claude -p --resume <session-id>
```

The hook fires again on resume, where you can return `"allow"` with the answer in
`updatedInput`.

## Examples

### Validate Bash Commands

Prevent dangerous commands:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

```python
#!/usr/bin/env python3
import json
import re
import sys

VALIDATION_RULES = [
    (r"\brm\s+-rf\s+/", "Dangerous: rm -rf on root directory"),
    (r">\s*/dev/null\s+2>&1", "Silencing errors is dangerous"),
]

try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(1)

command = input_data.get("tool_input", {}).get("command", "")

issues = []
for pattern, message in VALIDATION_RULES:
    if re.search(pattern, command):
        issues.append(message)

if issues:
    print(f"Validation failed: {', '.join(issues)}", file=sys.stderr)
    sys.exit(2)

sys.exit(0)
```

### Auto-Format Code After Writing

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

if [[ "$file_path" == *.js || "$file_path" == *.ts ]]; then
  npx prettier --write "$file_path" 2>/dev/null
elif [[ "$file_path" == *.py ]]; then
  python -m black "$file_path" 2>/dev/null
fi

exit 0
```

### Protect Sensitive Files

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/protect-sensitive.py"
          }
        ]
      }
    ]
  }
}
```

```python
#!/usr/bin/env python3
import json
import sys

PROTECTED_PATTERNS = [".env", ".secrets", "private_key", ".aws/credentials"]

try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(1)

file_path = input_data.get("tool_input", {}).get("file_path", "")

for pattern in PROTECTED_PATTERNS:
    if pattern in file_path:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Cannot write to protected file: {file_path}"
            }
        }
        print(json.dumps(output))
        sys.exit(0)

sys.exit(0)
```

### Intelligent Stop Hook (LLM-Based)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Analyze whether all tasks are complete. Respond with JSON: {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"explanation\"} to continue.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Best Practices

### Security

1. **Validate all inputs** - Never trust tool input blindly
1. **Quote shell variables** - Use `"$VAR"` not `$VAR`
1. **Avoid sensitive files** - Don't process `.env`, `.git/`, keys
1. **Use absolute paths** - Reference scripts with full paths or `$CLAUDE_PROJECT_DIR`
1. **Keep hooks fast** - Long-running hooks slow down Claude Code
1. **Test hooks locally** - Run hook commands manually before deploying

### Configuration

1. **Version control project hooks** - Store `.claude/settings.json` in git
1. **Keep local overrides separate** - Use `.claude/settings.local.json` for personal overrides
1. **Document hooks** - Add comments explaining what each hook does
1. **Use matchers precisely** - Match only the tools you need to affect
1. **Consider timeout values** - Balance responsiveness with reliability

### Debugging

1. Type `/hooks` to browse all configured hooks grouped by event
1. Run `claude --debug` to see detailed hook execution logs
1. Toggle verbose mode with `Ctrl+O` to see hook output in the transcript
1. Test hook commands manually first
1. Verify JSON syntax in settings files
1. Check that scripts are executable and have correct shebangs

### Matcher Reference by Event

| Event Type                                                                 | Matches On     | Examples                                         |
| -------------------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| `PreToolUse`, `PostToolUse`, `PermissionRequest`, `PermissionDenied`       | tool name      | `Bash`, `Edit\|Write`, `mcp__.*`                 |
| `SessionStart`                                                             | session source | `startup`, `resume`, `clear`, `compact`          |
| `SessionEnd`                                                               | end reason     | `clear`, `resume`, `logout`, `prompt_input_exit` |
| `Notification`                                                             | type           | `permission_prompt`, `idle_prompt`               |
| `SubagentStart`, `SubagentStop`                                            | agent type     | `Bash`, `Explore`, `Plan`, custom names          |
| `PreCompact`, `PostCompact`                                                | trigger        | `manual`, `auto`                                 |
| `ConfigChange`                                                             | source         | `user_settings`, `project_settings`, `skills`    |
| `InstructionsLoaded`                                                       | load reason    | `session_start`, `path_glob_match`, `compact`    |
| `StopFailure`                                                              | error type     | `rate_limit`, `server_error`, `billing_error`    |
| `FileChanged`                                                              | filename       | `.envrc`, `.env`                                 |
| `Elicitation`, `ElicitationResult`                                         | MCP server     | configured server names                          |
| `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCreated`, `TaskCompleted` | no matcher     | always fires                                     |

## Limitations

- **Timeout**: 600-second (10 min) default for command hooks, 30s for prompt, 60s for agent (configurable)
- **Parallelization**: All matching hooks run in parallel; identical commands deduplicated
- **Output limit**: Hook output capped at 10,000 characters (excess saved to file with preview)
- **PostToolUse**: Cannot undo actions since the tool has already executed
- **PermissionRequest**: Does not fire in non-interactive mode (`-p`); use `PreToolUse` instead
- **Stop hooks**: Fire whenever Claude finishes responding, not only at task completion; do not fire on user interrupts; API errors fire `StopFailure` instead
- **PreToolUse precedence**: A `deny` decision blocks even in `bypassPermissions` mode, but `allow` does not bypass deny rules from settings
- **updatedInput conflicts**: When multiple PreToolUse hooks modify the same tool's input, last to finish wins (non-deterministic)
- **Enterprise policy**: Administrators can use `allowManagedHooksOnly` to block user/project hooks
- **File watcher**: Settings file edits are normally picked up automatically; if not, restart the session

## References

- [Official Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Hooks Get Started Guide](https://code.claude.com/docs/en/hooks-guide)
