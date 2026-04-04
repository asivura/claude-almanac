---
title: Scheduled Tasks
description: 'Three ways to schedule recurring Claude Code work: cloud, desktop app, and the /loop CLI command.'
category: ci-cd
---

# Claude Code Scheduled Tasks

Claude Code offers three ways to schedule recurring work, each suited to different needs.

## Scheduling Options Comparison

|                            | Cloud                          | Desktop                     | `/loop` (CLI)         |
| -------------------------- | ------------------------------ | --------------------------- | --------------------- |
| Runs on                    | Anthropic cloud                | Your machine                | Your machine          |
| Requires machine on        | No                             | Yes                         | Yes                   |
| Requires open session      | No                             | No                          | Yes                   |
| Persistent across restarts | Yes                            | Yes                         | No (session-scoped)   |
| Access to local files      | No (fresh clone)               | Yes                         | Yes                   |
| MCP servers                | Connectors configured per task | Config files and connectors | Inherits from session |
| Permission prompts         | No (runs autonomously)         | Configurable per task       | Inherits from session |
| Customizable schedule      | Via `/schedule` in the CLI     | Yes                         | Yes                   |
| Minimum interval           | 1 hour                         | 1 minute                    | 1 minute              |

**When to use which:**

- **Cloud tasks**: Work that should run reliably without your machine (daily PR reviews, overnight CI analysis)
- **Desktop tasks**: Need access to local files and tools (code reviews against your working directory)
- **`/loop`**: Quick polling during a session (watching a deployment, babysitting a PR)

## Cloud Scheduled Tasks

Cloud scheduled tasks run on Anthropic-managed infrastructure. They keep working even when your computer is off.

### Availability

Pro, Max, Team, and Enterprise users.

### Creating Cloud Tasks

Create from three places:

- **Web**: Visit [claude.ai/code/scheduled](https://claude.ai/code/scheduled) and click **New scheduled task**
- **Desktop**: Open the **Schedule** page, click **New task**, choose **New remote task**
- **CLI**: Run `/schedule` in any session. Claude walks through setup conversationally. You can also pass a description: `/schedule daily PR review at 9am`

### Configuration

| Field        | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| Name         | Descriptive identifier for the task                                      |
| Prompt       | Instructions sent to Claude each run (must be self-contained)            |
| Model        | Model used for each run                                                  |
| Repositories | GitHub repositories to clone (starts from default branch each run)       |
| Environment  | Cloud environment (network access, env vars, setup script)               |
| Schedule     | Frequency: Hourly, Daily, Weekdays, or Weekly                            |
| Connectors   | MCP connectors for external services (Slack, Linear, Google Drive, etc.) |

### Branch Permissions

By default, Claude can only push to branches prefixed with `claude/`. Enable **Allow unrestricted branch pushes** per repository to remove this restriction.

### Frequency Options

| Frequency | Description                                      |
| --------- | ------------------------------------------------ |
| Hourly    | Runs every hour                                  |
| Daily     | Once per day at specified time (default 9:00 AM) |
| Weekdays  | Same as Daily but skips Saturday and Sunday      |
| Weekly    | Once per week on specified day and time          |

For custom intervals (every 2 hours, first of each month), pick the closest preset and update from CLI with `/schedule update` to set a specific cron expression. Minimum interval is 1 hour.

Tasks may run a few minutes after their scheduled time. The offset is consistent per task.

### Managing Cloud Tasks

From the task detail page:

- **Run now**: Trigger immediately without waiting for schedule
- **Toggle repeats**: Pause/resume without deleting
- **Edit**: Change prompt, schedule, repositories, environment, or connectors
- **View runs**: Each run creates a session where you can review changes and create PRs
- **Delete**: Remove the task (past sessions remain)

CLI management: `/schedule list`, `/schedule update`, `/schedule run`

## Desktop Scheduled Tasks

Desktop scheduled tasks run on your machine with access to local files and tools. The Desktop app must be open and your computer awake.

### Creating Desktop Tasks

Click **Schedule** in the sidebar, click **New task**, choose **New local task**.

| Field       | Description                                                             |
| ----------- | ----------------------------------------------------------------------- |
| Name        | Identifier (converted to lowercase kebab-case, must be unique)          |
| Description | Short summary shown in task list                                        |
| Prompt      | Instructions with controls for model, permission mode, folder, worktree |
| Frequency   | How often the task runs                                                 |

You can also create tasks conversationally: "set up a daily code review that runs every morning at 9am."

> By default, local tasks run against whatever state your working directory is in, including uncommitted changes. Enable the **worktree toggle** to give each run its own isolated Git worktree.

### Frequency Options

| Frequency | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| Manual    | No schedule, only runs when you click **Run now**                |
| Hourly    | Every hour (fixed offset of up to 10 minutes to stagger traffic) |
| Daily     | Time picker, defaults to 9:00 AM local                           |
| Weekdays  | Same as Daily, skips Saturday and Sunday                         |
| Weekly    | Time picker and day picker                                       |

For intervals the picker doesn't offer, ask Claude in any Desktop session using plain language.

### How Desktop Tasks Run

- Desktop checks the schedule every minute while the app is open
- Each task gets a deterministic delay of up to 10 minutes after scheduled time
- Tasks only run while the Desktop app is running and computer is awake
- Enable **Keep computer awake** in Settings to prevent idle-sleep (closing lid still sleeps)

### Missed Runs

When the app starts or computer wakes, Desktop checks each task for missed runs in the last seven days. If any were missed, it starts exactly one catch-up run for the most recently missed time. A daily task that missed six days runs once on wake.

> Write prompts with timing awareness. A 9am task might run at 11pm if your computer was asleep all day. Add guardrails like "Only review today's commits. If it's after 5pm, skip the review."

### Permissions

Each task has its own permission mode set at creation. Allow rules from `~/.claude/settings.json` also apply. If a task stalls on a permission prompt, the session stays open for you to approve later.

To avoid stalls: click **Run now** after creating a task, approve prompts with "always allow," and future runs auto-approve the same tools. Review and revoke from the task's **Always allowed** panel.

### Task Files on Disk

Task prompts are stored at `~/.claude/scheduled-tasks/<task-name>/SKILL.md` with YAML frontmatter (`name`, `description`) and the prompt as the body. Changes take effect on the next run. Schedule, folder, model, and enabled state must be changed through the Edit form or by asking Claude.

### Managing Desktop Tasks

From the task detail page:

- **Run now**: Trigger immediately
- **Toggle repeats**: Pause/resume
- **Edit**: Change prompt, frequency, folder, or other settings
- **Review history**: See past runs including skipped ones
- **Review permissions**: See and revoke saved tool approvals
- **Delete**: Remove the task and archive all sessions it created

## CLI Session-Scoped Scheduling

### /loop Command

The `/loop` skill is the quickest way to schedule a recurring prompt within a session. Pass an optional interval and a prompt:

```bash
/loop 5m check if the deployment finished and tell me what happened
```

Claude parses the interval, converts to a cron expression, schedules the job, and confirms.

### Interval Syntax

| Form                    | Example                               | Parsed interval     |
| ----------------------- | ------------------------------------- | ------------------- |
| Leading token           | `/loop 30m check the build`           | Every 30 minutes    |
| Trailing `every` clause | `/loop check the build every 2 hours` | Every 2 hours       |
| No interval             | `/loop check the build`               | Default: 10 minutes |

Supported units: `s` (seconds), `m` (minutes), `h` (hours), `d` (days). Seconds round up to the nearest minute (cron granularity). Intervals that don't divide evenly are rounded to the nearest clean interval.

### Loop Over Other Commands

The scheduled prompt can be another command or skill:

```bash
/loop 20m /review-pr 1234
```

### One-Time Reminders

Describe what you want in natural language:

```text
remind me at 3pm to push the release branch
in 45 minutes, check whether the integration tests passed
```

Claude schedules a single-fire task that deletes itself after running.

### Underlying Tools

| Tool         | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `CronCreate` | Schedule a new task (5-field cron expression, prompt, recurrence flag) |
| `CronList`   | List all scheduled tasks with IDs, schedules, and prompts              |
| `CronDelete` | Cancel a task by ID                                                    |

Each task has an 8-character ID. A session can hold up to 50 scheduled tasks.

### How Session Tasks Run

- The scheduler checks every second for due tasks, enqueued at low priority
- Tasks fire between your turns, not while Claude is mid-response
- If Claude is busy, the prompt waits until the current turn ends
- All times are in your local timezone

### Jitter

- **Recurring tasks**: Fire up to 10% of their period late, capped at 15 minutes
- **One-shot tasks**: Scheduled for :00 or :30 fire up to 90 seconds early
- Offset is derived from task ID (deterministic per task)

### Seven-Day Expiry

Recurring tasks automatically expire 7 days after creation. The task fires one final time, then deletes itself. This bounds how long a forgotten loop can run. Cancel and recreate before expiry if needed, or use Cloud/Desktop tasks for durable scheduling.

### Disabling Session Scheduling

Set `CLAUDE_CODE_DISABLE_CRON=1` to disable the scheduler entirely. The cron tools and `/loop` become unavailable.

## Cron Expression Reference

`CronCreate` and cloud tasks accept standard 5-field cron expressions: `minute hour day-of-month month day-of-week`.

| Example        | Meaning                      |
| -------------- | ---------------------------- |
| `*/5 * * * *`  | Every 5 minutes              |
| `0 * * * *`    | Every hour on the hour       |
| `7 * * * *`    | Every hour at 7 minutes past |
| `0 9 * * *`    | Every day at 9am local       |
| `0 9 * * 1-5`  | Weekdays at 9am local        |
| `30 14 15 3 *` | March 15 at 2:30pm local     |

All fields support wildcards (`*`), single values (`5`), steps (`*/15`), ranges (`1-5`), and comma-separated lists (`1,15,30`).

Day-of-week: `0` or `7` for Sunday through `6` for Saturday. Extended syntax (`L`, `W`, `?`, name aliases like `MON`) is not supported. When both day-of-month and day-of-week are constrained, a date matches if either field matches (standard vixie-cron semantics).

## Session-Scoped Limitations

- Tasks only fire while Claude Code is running and idle
- No catch-up for missed fires (fires once when Claude becomes idle)
- No persistence across restarts
- 50 task limit per session
- 7-day automatic expiry for recurring tasks

## Sources

- [Cloud Scheduled Tasks](https://code.claude.com/docs/en/web-scheduled-tasks)
- [Desktop Scheduled Tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks)
- [CLI Scheduled Tasks (/loop)](https://code.claude.com/docs/en/scheduled-tasks)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Channels](https://code.claude.com/docs/en/channels)
