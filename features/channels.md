# Claude Code Channels

Channels push events from external systems into a running Claude Code session so Claude can react to things happening outside the terminal. They are MCP servers that deliver messages, alerts, and webhooks while the session is open.

## Overview

A channel is an MCP server that pushes events into your running Claude Code session. Channels can be one-way (alerts, webhooks) or two-way (chat bridges where Claude replies back through the same channel). Events only arrive while the session is open; for always-on use, run Claude in a background process or persistent terminal.

**Requirements:**

- Claude Code v2.1.80 or later
- claude.ai login (Console and API key auth not supported)
- [Bun](https://bun.sh) runtime (for pre-built plugins)
- Team/Enterprise: admin must enable channels

**Status:** Research preview. The `--channels` flag syntax and protocol may change.

## Supported Channels

| Channel      | Type    | Setup                               | Token Required |
| ------------ | ------- | ----------------------------------- | -------------- |
| **Telegram** | Two-way | Create bot via BotFather            | Yes            |
| **Discord**  | Two-way | Create bot in Developer Portal      | Yes            |
| **iMessage** | Two-way | macOS only, reads Messages directly | No             |
| **Fakechat** | Two-way | Localhost demo UI on port 8787      | No             |

### Installing a Channel Plugin

All channels are installed as plugins from the official marketplace:

```bash
# Install the plugin
/plugin install telegram@claude-plugins-official

# If not found, refresh marketplace first
/plugin marketplace update claude-plugins-official

# Activate after install
/reload-plugins
```

### Configuring Credentials

Telegram and Discord require bot tokens:

```bash
# Telegram
/telegram:configure <token>

# Discord
/discord:configure <token>
```

Tokens are saved to `~/.claude/channels/<platform>/.env`. You can also set `TELEGRAM_BOT_TOKEN` or `DISCORD_BOT_TOKEN` in your shell environment.

### Starting with Channels Enabled

Exit Claude Code and restart with the `--channels` flag:

```bash
# Single channel
claude --channels plugin:telegram@claude-plugins-official

# Multiple channels (space-separated)
claude --channels plugin:telegram@claude-plugins-official plugin:discord@claude-plugins-official
```

### Pairing (Telegram and Discord)

1. Send any message to your bot on the platform
1. The bot replies with a pairing code
1. In Claude Code, approve the code:

```bash
/telegram:access pair <code>
/discord:access pair <code>
```

4. Lock down access to your account only:

```bash
/telegram:access policy allowlist
/discord:access policy allowlist
```

### iMessage Setup

iMessage requires macOS and reads your Messages database directly:

1. Grant Full Disk Access to your terminal (System Settings > Privacy & Security > Full Disk Access)
1. Install: `/plugin install imessage@claude-plugins-official`
1. Start: `claude --channels plugin:imessage@claude-plugins-official`
1. Text yourself to test (self-chat bypasses access control)
1. Allow other senders: `/imessage:access allow +15551234567`

## Quickstart: Fakechat Demo

Fakechat runs a chat UI on localhost with no authentication required:

```bash
# Install
/plugin install fakechat@claude-plugins-official

# Start (exit and restart)
claude --channels plugin:fakechat@claude-plugins-official

# Open http://localhost:8787 and type a message
```

Messages arrive in your session as `<channel source="fakechat">` events. Claude reads them, does the work, and replies through the chat UI.

## Security

### Sender Allowlists

Every channel plugin maintains a sender allowlist. Only IDs you have added can push messages; everyone else is silently dropped.

- **Telegram/Discord**: Bootstrap via pairing flow
- **iMessage**: Self-chat is automatic; add others by handle

### Access Controls

- Being in `.mcp.json` alone is not enough to push messages; a server must also be named in `--channels`
- The allowlist also gates permission relay (anyone who can reply can approve/deny tool use)
- Only allowlist senders you trust

## Permission Relay

Two-way channels can relay permission prompts to your phone or another device. When Claude needs tool approval, the prompt appears both in your terminal and through the channel. The first answer (from either location) is applied.

**Requirements:** Claude Code v2.1.81+, channel must declare `claude/channel/permission` capability.

Permission relay covers tool-use approvals (`Bash`, `Write`, `Edit`). Project trust and MCP server consent dialogs only appear in the local terminal.

## Building Custom Channels

A custom channel needs to:

1. Declare the `claude/channel` capability
1. Emit `notifications/claude/channel` events
1. Connect over stdio transport

### Minimal Webhook Receiver (TypeScript/Bun)

```typescript
#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const mcp = new Server(
  { name: "webhook", version: "0.0.1" },
  {
    capabilities: { experimental: { "claude/channel": {} } },
    instructions:
      'Events from the webhook channel arrive as <channel source="webhook">. Read and act, no reply expected.',
  }
);

await mcp.connect(new StdioServerTransport());

Bun.serve({
  port: 8788,
  hostname: "127.0.0.1",
  async fetch(req) {
    const body = await req.text();
    await mcp.notification({
      method: "notifications/claude/channel",
      params: {
        content: body,
        meta: { path: new URL(req.url).pathname, method: req.method },
      },
    });
    return new Response("ok");
  },
});
```

Register in `.mcp.json`:

```json
{
  "mcpServers": {
    "webhook": { "command": "bun", "args": ["./webhook.ts"] }
  }
}
```

Test with the development flag:

```bash
claude --dangerously-load-development-channels server:webhook

# In another terminal:
curl -X POST localhost:8788 -d "build failed on main"
```

### Notification Format

| Field     | Type                     | Description                                                         |
| --------- | ------------------------ | ------------------------------------------------------------------- |
| `content` | `string`                 | Event body (becomes `<channel>` tag body)                           |
| `meta`    | `Record<string, string>` | Attributes on the `<channel>` tag (letters/digits/underscores only) |

### Adding a Reply Tool

For two-way channels, add `tools: {}` to capabilities and register tool handlers:

```typescript
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "reply",
      description: "Send a message back over this channel",
      inputSchema: {
        type: "object",
        properties: {
          chat_id: { type: "string" },
          text: { type: "string" },
        },
        required: ["chat_id", "text"],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "reply") {
    const { chat_id, text } = req.params.arguments as {
      chat_id: string;
      text: string;
    };
    // Send to your platform here
    return { content: [{ type: "text", text: "sent" }] };
  }
  throw new Error(`unknown tool: ${req.params.name}`);
});
```

### Server Options

| Field                                                    | Type     | Required | Description                                                         |
| -------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------- |
| `capabilities.experimental['claude/channel']`            | `object` | Yes      | Always `{}`. Registers notification listener                        |
| `capabilities.experimental['claude/channel/permission']` | `object` | No       | Always `{}`. Opts in to permission relay                            |
| `capabilities.tools`                                     | `object` | No       | Two-way only. Enables tool discovery                                |
| `instructions`                                           | `string` | No       | Added to Claude's system prompt. Describe events and reply behavior |

### Testing During Research Preview

Custom channels are not on the approved allowlist. Use the development flag:

```bash
# Plugin you're developing
claude --dangerously-load-development-channels plugin:yourplugin@yourmarketplace

# Bare .mcp.json server
claude --dangerously-load-development-channels server:webhook
```

The bypass is per-entry. The `channelsEnabled` org policy still applies.

## Enterprise Controls

| Setting                 | Purpose                                                   | Default                        |
| ----------------------- | --------------------------------------------------------- | ------------------------------ |
| `channelsEnabled`       | Master switch. Must be `true` for any channel to deliver  | Channels blocked               |
| `allowedChannelPlugins` | Which plugins can register (replaces Anthropic allowlist) | Anthropic default list applies |

Pro and Max users without an organization skip these checks.

### Enable for Your Organization

Enable from [claude.ai > Admin settings > Claude Code > Channels](https://claude.ai/admin-settings/claude-code), or set `channelsEnabled: true` in managed settings.

### Restrict Allowed Plugins

```json
{
  "channelsEnabled": true,
  "allowedChannelPlugins": [
    { "marketplace": "claude-plugins-official", "plugin": "telegram" },
    { "marketplace": "claude-plugins-official", "plugin": "discord" },
    { "marketplace": "acme-corp-plugins", "plugin": "internal-alerts" }
  ]
}
```

When set, this replaces the Anthropic allowlist entirely. An empty array blocks all allowlisted plugins but `--dangerously-load-development-channels` can still bypass it.

## How Channels Compare

| Feature                | What It Does                                           | Good For                                          |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| **Claude Code on web** | Fresh cloud sandbox cloned from GitHub                 | Delegating self-contained async work              |
| **Claude in Slack**    | Spawns web session from `@Claude` mention              | Starting tasks from team conversation context     |
| **Standard MCP**       | Claude queries on demand; nothing pushed               | Giving Claude read/query access to a system       |
| **Remote Control**     | Drive local session from claude.ai or mobile app       | Steering in-progress session while away from desk |
| **Channels**           | Push events from external systems into running session | Chat bridges, CI webhooks, monitoring alerts      |

## References

- [Channels Documentation](https://code.claude.com/docs/en/channels)
- [Channels Reference (Building Custom)](https://code.claude.com/docs/en/channels-reference)
- [Official Channel Plugins](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins)
