# Claude Code in Slack

Delegate coding tasks directly from your Slack workspace. When you mention `@Claude` with a coding task, Claude detects the intent and creates a Claude Code session on the web.

## Overview

Claude Code in Slack is built on the Claude for Slack app but adds intelligent routing to Claude Code on the web for coding-related requests. Instead of responding as a chat assistant, Claude creates a full coding session that can read files, run commands, and create pull requests.

**Prerequisites:**

| Requirement            | Details                                                      |
| ---------------------- | ------------------------------------------------------------ |
| Claude Plan            | Pro, Max, Team, or Enterprise with Claude Code access        |
| Claude Code on the web | Must be enabled for your account                             |
| GitHub Account         | Connected to Claude Code on the web with authenticated repos |
| Slack Authentication   | Slack account linked to Claude account via the Claude app    |

## Setup

### 1. Install the Claude App

A workspace administrator installs the Claude app from the [Slack App Marketplace](https://slack.com/marketplace/A08SF47R6P4).

### 2. Connect Your Claude Account

1. Open the Claude app in Slack (Apps section)
1. Navigate to the App Home tab
1. Click "Connect" to link accounts
1. Complete authentication in your browser

### 3. Configure Claude Code on the Web

- Visit [claude.ai/code](https://claude.ai/code)
- Connect your GitHub account
- Authenticate at least one repository

### 4. Choose Routing Mode

Configure in the Claude App Home in Slack:

| Mode            | Behavior                                                               |
| --------------- | ---------------------------------------------------------------------- |
| **Code only**   | All @mentions route to Claude Code sessions                            |
| **Code + Chat** | Claude analyzes each message and routes to Code or Chat as appropriate |

In Code + Chat mode, you can click "Retry as Code" if Claude routes to Chat incorrectly (and vice versa).

### 5. Add Claude to Channels

Claude is not automatically added to any channels. Invite it with:

```
/invite @Claude
```

Claude only responds to @mentions in channels where it has been added. It works in both public and private channels but does not work in direct messages (DMs).

## How It Works

### Session Flow

1. **Initiation**: @mention Claude with a coding request
1. **Detection**: Claude analyzes intent and detects coding task
1. **Session creation**: New Claude Code session created on claude.ai/code
1. **Progress updates**: Status updates posted to your Slack thread
1. **Completion**: Claude @mentions you with a summary and action buttons
1. **Review**: Click "View Session" for the full transcript or "Create PR" for a pull request

### Context Gathering

- **In threads**: Claude gathers context from all messages in the thread
- **In channels**: Claude looks at recent channel messages for context

Claude may follow directions from other messages in the context. Only use Claude in trusted Slack conversations.

### Message Actions

| Action            | Description                                         |
| ----------------- | --------------------------------------------------- |
| **View Session**  | Opens full session in browser                       |
| **Create PR**     | Creates pull request from session changes           |
| **Retry as Code** | Re-routes a Chat response as a Claude Code task     |
| **Change Repo**   | Select a different repository if Claude chose wrong |

### Repository Selection

Claude automatically selects a repository based on conversation context. If multiple repositories could apply, a dropdown lets you choose.

## Access and Permissions

### User-Level

| Access Type       | Details                                              |
| ----------------- | ---------------------------------------------------- |
| Sessions          | Run under your own Claude account                    |
| Rate Limits       | Count against your individual plan limits            |
| Repository Access | Only repos you have personally connected             |
| Session History   | Appear in your Claude Code history on claude.ai/code |

### Workspace-Level

| Control          | Description                                               |
| ---------------- | --------------------------------------------------------- |
| App installation | Workspace admins decide whether to install                |
| Enterprise Grid  | Organization admins control which workspaces have access  |
| App removal      | Removes access for all users in the workspace immediately |

### Channel-Based Access Control

- Claude must be explicitly invited to each channel
- Admins can control usage by managing which channels Claude is invited to
- Private channels provide additional visibility control

## Best Practices

### Writing Effective Requests

- **Be specific**: Include file names, function names, or error messages
- **Provide context**: Mention the repository if not obvious from conversation
- **Define success**: Specify if Claude should write tests, update docs, or create a PR
- **Use threads**: Reply in threads so Claude gathers the full discussion context

### When to Use Slack vs Web

| Use Slack when                               | Use the web when                                  |
| -------------------------------------------- | ------------------------------------------------- |
| Context already exists in a Slack discussion | You need to upload files                          |
| Kicking off a task asynchronously            | You want real-time interaction during development |
| Teammates need visibility into the task      | Working on longer, more complex tasks             |

## Troubleshooting

| Problem                   | Solution                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| Sessions not starting     | Verify account connection in App Home, check web access, ensure repos connected |
| Repository not showing    | Connect repo at claude.ai/code, verify GitHub permissions                       |
| Wrong repository selected | Click "Change Repo" or include repo name in your request                        |
| Authentication errors     | Disconnect and reconnect in App Home, verify correct account                    |

## Current Limitations

- **GitHub only**: No support for GitLab, Bitbucket, or other providers
- **One PR at a time**: Each session creates one pull request
- **Rate limits apply**: Sessions use your individual plan limits
- **Web access required**: Users without Claude Code on the web get standard chat responses
- **Channels only**: Does not work in direct messages (DMs)

## Sources

- [Claude Code in Slack Documentation](https://code.claude.com/docs/en/slack)
- [Claude Code on the Web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Slack App Marketplace](https://slack.com/marketplace/A08SF47R6P4)
