---
title: Remote Control
description: Control a terminal Claude Code session from your phone, tablet, or any browser via claude.ai.
category: surfaces
---

# Claude Code Remote Control

Control a terminal Claude Code session from your phone, tablet, or any browser. Claude keeps running entirely on your machine while you interact from anywhere.

## Overview

Remote Control bridges your local Claude Code session to [claude.ai/code](https://claude.ai/code) and the Claude mobile app (iOS/Android). All traffic travels through TLS to Anthropic's servers, so no port forwarding or VPN is needed.

Key properties:

- Code execution stays local (nothing moves to the cloud)
- Conversation syncs across all connected devices
- Works alongside local terminal input (interactive mode)

## Requirements

- Claude Code v2.1.51 or later
- Pro, Max, Team, or Enterprise plan via claude.ai
- Authenticated with claude.ai (`/login` if needed)
- Workspace trust accepted (run `claude` in your project once)

**Not supported**: API keys, Vertex AI, Bedrock, or Foundry authentication. Remote Control requires claude.ai OAuth. If you have `CLAUDE_CODE_USE_VERTEX` or `CLAUDE_CODE_USE_BEDROCK` set, Remote Control will not activate.

## Starting a Session

### Server Mode (recommended for multiple sessions)

```bash
claude remote-control
```

Press spacebar to display a QR code in the terminal.

### Interactive Mode

```bash
claude --remote-control "My Project Name"
```

You can type locally and remotely at the same time.

### From an Existing Session

```
/remote-control My Project Name
```

## Connecting from Another Device

Once Remote Control is running:

| Method      | How                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| QR code     | Scan the terminal QR code with your phone camera                                                                  |
| Session URL | Open the URL shown in your terminal in any browser                                                                |
| Claude app  | Open [claude.ai/code](https://claude.ai/code) or the mobile app and find the session by name (green dot = online) |

## Team and Enterprise

Remote Control is **off by default** for Team and Enterprise plans. An organization admin must enable it at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code).

## Limitations

| Limitation              | Detail                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Terminal must stay open | Closing the terminal ends the session                                                                         |
| Network timeout         | Sessions time out after roughly 10 minutes of network unavailability                                          |
| One remote per process  | In interactive mode each instance supports one remote connection. Use server mode with `--spawn` for multiple |

## Sources

- [Remote Control Docs](https://code.claude.com/docs/en/remote-control)
