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

Claude Code supports **11 hook events** in the session lifecycle:

| Hook Event           | When It Fires                                         | Use Case                                 |
| -------------------- | ----------------------------------------------------- | ---------------------------------------- |
| `SessionStart`       | Session begins or resumes                             | Load context, set environment variables  |
| `UserPromptSubmit`   | User submits a prompt                                 | Validate prompts, add context            |
| `PreToolUse`         | Before tool execution                                 | Validate/approve/deny commands           |
| `PermissionRequest`  | Permission dialog appears                             | Auto-allow/deny permissions              |
| `PostToolUse`        | After tool succeeds                                   | Verify results, format code              |
| `PostToolUseFailure` | After tool fails                                      | Handle errors                            |
| `SubagentStart`      | Subagent is spawned                                   | Monitor subagent creation                |
| `SubagentStop`       | Subagent finishes                                     | Evaluate subagent completion             |
| `Stop`               | Claude finishes responding                            | Decide if Claude should continue         |
| `PreCompact`         | Before context compaction                             | Logging/monitoring                       |
| `SessionEnd`         | Session terminates                                    | Cleanup tasks, logging                   |
| `Notification`       | Claude sends notifications                            | Custom notification handling             |
| `Setup`              | Init with `--init`, `--init-only`, or `--maintenance` | One-time setup, dependencies, migrations |

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

  - `type`: Either `"command"` (bash) or `"prompt"` (LLM-based)
  - `command`: The bash command to execute (for `type: "command"`)
  - `prompt`: LLM prompt text (for `type: "prompt"`)
  - `timeout`: Optional timeout in seconds (default: 60)

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
1. **Within same file**: Hooks execute in array order (first to last)
1. **Multiple matchers**: All matching hook groups execute sequentially
1. **Early termination**: Exit code 2 stops subsequent hooks

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
  "tool_response": { }
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
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "string",
    "updatedInput": { },
    "additionalContext": "string"
  }
}
```

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

1. Run `claude --debug` to see detailed hook execution logs
1. Test hook commands manually first
1. Verify JSON syntax in settings files
1. Check that scripts are executable and have correct shebangs

## Limitations

- **Timeout**: 60-second default per hook (configurable)
- **Parallelization**: All matching hooks run in parallel
- **Deduplication**: Identical hook commands run only once
- **Snapshot behavior**: Hooks are captured at session startup; changes require new session
- **Enterprise policy**: Administrators can use `allowManagedHooksOnly` to block user/project hooks
- **Skills/agents**: Only `PreToolUse`, `PostToolUse`, and `Stop` events supported
- **Prompt-based hooks**: Only certain events supported

## References

- [Official Hooks Documentation](https://code.claude.com/docs/en/hooks.md)
- [Hooks Get Started Guide](https://code.claude.com/docs/en/hooks-guide.md)
