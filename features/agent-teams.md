# Claude Code Agent Teams

Agent teams coordinate multiple independent Claude Code instances working together on a shared task. One session acts as the **team lead**, orchestrating work, while **teammates** work independently in their own context windows and communicate directly with each other.

> **Status**: Experimental. Requires Claude Code v2.1.32+.

For environment setup (Ghostty, tmux, Starship, VS Code integration), see [Agent Teams: Environment Setup](agent-teams-setup.md).

## Overview

Agent teams differ fundamentally from subagents. Subagents run within a single session and can only report results back to the parent. Agent team teammates share a task list, claim work, and message each other directly.

**Key Benefits:**

- True parallel execution across independent context windows
- Direct inter-agent communication (not just report-back)
- Shared task list with self-coordination
- Cross-layer work ownership (frontend, backend, tests)
- Competing hypothesis testing in parallel

## Agent Teams vs. Subagents

| Aspect            | Subagents                                   | Agent Teams                                     |
| ----------------- | ------------------------------------------- | ----------------------------------------------- |
| **Context**       | Own window; results return to caller        | Own window; fully independent                   |
| **Communication** | Report back to main agent only              | Teammates message each other directly           |
| **Coordination**  | Main agent manages all work                 | Shared task list with self-coordination         |
| **Best for**      | Focused tasks where only the result matters | Complex work requiring discussion/collaboration |
| **Token cost**    | Lower (results summarized)                  | Higher (each teammate is a separate instance)   |
| **Nesting**       | Cannot spawn other subagents                | Cannot spawn their own teams                    |

## Enabling Agent Teams

Agent teams are disabled by default. Enable via environment variable:

**In settings.json:**

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**In shell:**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Architecture

An agent team consists of four components:

| Component     | Role                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| **Team lead** | Main Claude Code session that creates the team, spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances that work on assigned tasks                         |
| **Task list** | Shared list of work items that teammates claim and complete                        |
| **Mailbox**   | Messaging system for direct communication between agents                           |

**Storage locations:**

| Path                                               | Contents           |
| -------------------------------------------------- | ------------------ |
| `~/.claude/teams/{team-name}/config.json`          | Team configuration |
| `~/.claude/tasks/{team-name}/`                     | Shared task list   |
| `~/.claude/teams/{team-name}/inboxes/{agent}.json` | Agent mailboxes    |

## Core Tools

### TeammateTool Operations

The TeammateTool provides 13 operations:

| Operation         | Description                           |
| ----------------- | ------------------------------------- |
| `spawnTeam`       | Initialize team directory and config  |
| `discoverTeams`   | Find existing teams                   |
| `requestJoin`     | Request to join an existing team      |
| `approveJoin`     | Approve a join request                |
| `rejectJoin`      | Reject a join request                 |
| `write`           | Send a message to a specific teammate |
| `broadcast`       | Send a message to all teammates       |
| `requestShutdown` | Request team shutdown                 |
| `approveShutdown` | Approve shutdown request              |
| `rejectShutdown`  | Reject shutdown request               |
| `approvePlan`     | Approve a teammate's plan             |
| `rejectPlan`      | Reject a teammate's plan              |
| `cleanup`         | Remove team files after shutdown      |

### Task Management

Task tools work with the shared task list:

| Tool          | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `TaskCreate`  | Define work units as JSON files                                |
| `TaskUpdate`  | Change task status (`pending` -> `in_progress` -> `completed`) |
| `TaskList`    | Return all tasks and ownership status                          |
| `SendMessage` | Direct communication between teammates                         |

## Display Modes

Configure how teammates render in the terminal via `teammateMode` in `~/.claude.json`:

| Mode               | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `"auto"` (default) | Split panes inside tmux, in-process otherwise             |
| `"in-process"`     | All teammates in main terminal, use `Shift+Down` to cycle |
| `"tmux"`           | Each teammate gets its own pane (requires tmux or iTerm2) |

**Override per session:**

```bash
claude --teammate-mode in-process
```

## Hooks

Three hook events provide quality gates for agent teams:

### TeammateIdle

Fires when a teammate is about to go idle. Exit code 2 sends feedback and keeps the teammate working.

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check-teammate-progress.sh"
          }
        ]
      }
    ]
  }
}
```

**Input:** `teammate_name`, `team_name`

### TaskCreated

Fires when a task is being created via TaskCreate. Exit code 2 prevents creation.

```json
{
  "hooks": {
    "TaskCreated": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-task.sh"
          }
        ]
      }
    ]
  }
}
```

**Input:** `task_id`, `task_subject`, `task_description`

### TaskCompleted

Fires when a task is being marked complete. Exit code 2 prevents completion.

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/verify-task-complete.sh"
          }
        ]
      }
    ]
  }
}
```

**Input:** `task_id`, `task_subject`, `task_description`

**Example:** Require tests to pass before a task can close:

```bash
#!/bin/bash
# scripts/verify-task-complete.sh
npm test || exit 2
```

## Environment Variables

These environment variables are automatically provided to teammates:

| Variable                         | Description                       |
| -------------------------------- | --------------------------------- |
| `CLAUDE_CODE_TEAM_NAME`          | Name of the current team          |
| `CLAUDE_CODE_AGENT_ID`           | Unique ID of this agent           |
| `CLAUDE_CODE_AGENT_NAME`         | Display name of this agent        |
| `CLAUDE_CODE_AGENT_TYPE`         | Agent type (lead or teammate)     |
| `CLAUDE_CODE_AGENT_COLOR`        | Terminal color for this agent     |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Whether plan approval is required |
| `CLAUDE_CODE_PARENT_SESSION_ID`  | Session ID of the team lead       |

## Use Cases

### Parallel Code Review

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
```

### Multi-module Feature Work

```
Create a team with 4 teammates to implement the new auth system:
- Teammate 1: Database migrations and models
- Teammate 2: API endpoints
- Teammate 3: Frontend components
- Teammate 4: Integration tests
```

### Requiring Plan Approval

```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

### Debugging with Competing Hypotheses

```
Create a team to debug the memory leak. Spawn three investigators:
- One checking connection pool management
- One profiling object lifecycle
- One analyzing recent deployments for regressions
```

### Specifying Teammate Models

```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

## Best Practices

### Right-size Your Team

- **3-5 teammates** for most workflows
- **5-6 tasks per teammate** for good utilization
- Token usage scales linearly: a 3-person team uses roughly 4x a solo session

### Use Teams for Cross-cutting Work

Teams shine when work items are independent but need occasional coordination. If tasks are purely sequential, subagents are simpler and cheaper.

### Leverage Hooks for Quality Gates

Use `TaskCompleted` hooks to enforce standards (tests pass, lint clean) before tasks can close. This prevents teammates from marking work done prematurely.

### Prefer In-process Mode for Simple Workflows

If you don't need to visually monitor each teammate, `in-process` mode avoids tmux/iTerm2 dependencies.

### Keep Tasks Well-scoped

Vague tasks lead to overlapping work or missed requirements. Define clear inputs, outputs, and acceptance criteria for each task.

## Cost Considerations

Token usage scales linearly with teammates:

| Configuration | Approximate tokens |
| ------------- | ------------------ |
| Solo session  | ~200k              |
| 3 subagents   | ~440k              |
| 3-person team | ~800k              |

Use `--max-budget-usd` to cap spending:

```bash
claude -p "Review the codebase" --max-budget-usd 10.00
```

## Known Limitations

- No session resumption for in-process teammates (`/resume` and `/rewind` don't restore them)
- Task status can lag (teammates sometimes fail to mark tasks completed)
- One team per session, no nested teams
- Lead is fixed (cannot transfer leadership)
- All teammates start with the lead's permission mode
- Split panes require tmux or iTerm2 (not supported in VS Code terminal, Windows Terminal, or Ghostty)
- Shutdown can be slow (teammates finish current tool call first)

## References

- [Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
