# Claude Code Ultraplan

> **Status**: Research preview. Requires a Claude Code on the web account and a GitHub repository.

Start a plan from your local CLI, draft and review it on Claude Code on the web in plan mode, then execute it in the cloud or send it back to your terminal.

## Why Ultraplan

Ultraplan is useful when the terminal isn't enough for plan review:

- **Targeted feedback**: comment on individual sections of the plan instead of replying to the whole thing
- **Hands-off drafting**: the plan generates remotely while your terminal stays free for other work
- **Flexible execution**: approve the plan to run on the web and open a PR, or send it back to your terminal

## Requirements

- Claude Code on the web account
- GitHub repository
- The cloud session runs in your account's default cloud environment

## Launch Ultraplan

Three ways to start from your local CLI session:

| Method          | How                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Command         | Run `/ultraplan` followed by your prompt                                                          |
| Keyword         | Include the word `ultraplan` anywhere in a normal prompt                                          |
| From local plan | When Claude finishes a local plan, choose **No, refine with Ultraplan on Claude Code on the web** |

Example:

```text
/ultraplan migrate the auth service from sessions to JWTs
```

The command and keyword paths show a confirmation dialog before launching. The local plan path skips this since the selection already serves as confirmation.

If Remote Control is active, it disconnects when ultraplan starts (both features use the claude.ai/code interface and only one can be connected at a time).

## Status Indicators

After launch, your CLI prompt shows a status indicator while the remote session works:

| Status                       | Meaning                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `ultraplan`                  | Claude is researching your codebase and drafting the plan          |
| `ultraplan needs your input` | Claude has a clarifying question; open the session link to respond |
| `ultraplan ready`            | The plan is ready to review in your browser                        |

Run `/tasks` and select the ultraplan entry to open a detail view with the session link, agent activity, and a **Stop ultraplan** action. Stopping archives the cloud session and clears the indicator.

## Review and Revise

When the status changes to ready, open the session link to view the plan on claude.ai:

- **Inline comments**: highlight any passage and leave a comment for Claude to address
- **Emoji reactions**: react to a section to signal approval or concern without a full comment
- **Outline sidebar**: jump between sections of the plan

Ask Claude to address your comments and it revises the plan. Iterate as many times as needed before choosing where to execute.

## Choose Where to Execute

When the plan looks right, choose from the browser:

### Execute on the Web

Select **Approve Claude's plan and start coding** in your browser. Claude implements the plan in the same cloud session. Your terminal shows a confirmation, the status indicator clears, and work continues in the cloud. When finished, review the diff and create a PR from the web interface.

### Send Back to Terminal

Select **Approve plan and teleport back to terminal**. This option appears when the session was launched from your CLI and the terminal is still polling. The web session is archived so it doesn't continue in parallel.

Your terminal shows the plan in a dialog titled **Ultraplan approved** with three options:

| Option                | Behavior                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| **Implement here**    | Inject the plan into your current conversation and continue              |
| **Start new session** | Clear current conversation and begin fresh with only the plan as context |
| **Cancel**            | Save the plan to a file without executing; Claude prints the file path   |

If you start a new session, Claude prints a `claude --resume` command so you can return to your previous conversation later.

## References

- [Ultraplan](https://code.claude.com/docs/en/ultraplan)
- [Claude Code on the Web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Plan Mode](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)
- [Remote Control](https://code.claude.com/docs/en/remote-control)
