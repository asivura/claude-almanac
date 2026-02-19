# Claude Code Settings and Configuration

Claude Code uses a multi-level configuration system for settings, permissions, and customization.

## Settings File Hierarchy

| Scope       | Location                      | Precedence  | Affects              |
| ----------- | ----------------------------- | ----------- | -------------------- |
| **Managed** | System-level (IT-deployed)    | 1 (Highest) | All users            |
| **Local**   | `.claude/settings.local.json` | 2           | Current project only |
| **Project** | `.claude/settings.json`       | 3           | Team members         |
| **User**    | `~/.claude/settings.json`     | 4 (Lowest)  | All projects         |

### System-Level Managed Locations

- **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
- **Linux/WSL**: `/etc/claude-code/managed-settings.json`
- **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

## Core Settings

```json
{
  "autoUpdatesChannel": "stable",
  "autoUpdates": true,
  "theme": "light",
  "model": "sonnet",
  "outputStyle": "Explanatory",
  "language": "english",
  "forceLoginMethod": "claudeai",
  "spinnerTipsEnabled": true,
  "showTurnDuration": true
}
```

## Advanced Settings

| Setting                 | Type    | Purpose                                                         |
| ----------------------- | ------- | --------------------------------------------------------------- |
| `apiKeyHelper`          | string  | Script path for dynamic API key generation                      |
| `otelHeadersHelper`     | string  | Script for OpenTelemetry headers                                |
| `cleanupPeriodDays`     | number  | Delete inactive sessions (0=immediate)                          |
| `attribution.commit`    | string  | Commit message attribution                                      |
| `attribution.pr`        | string  | PR description attribution                                      |
| `statusLine`            | object  | Custom status line configuration                                |
| `respectGitignore`      | boolean | Exclude `.gitignore` files                                      |
| `plansDirectory`        | string  | Custom plan file storage location                               |
| `skipWebFetchPreflight` | boolean | Skip WebFetch domain safety check (for enterprise environments) |

## Environment Variables

### Authentication

| Variable                    | Purpose                     |
| --------------------------- | --------------------------- |
| `ANTHROPIC_API_KEY`         | Claude API authentication   |
| `ANTHROPIC_AUTH_TOKEN`      | Custom Authorization header |
| `ANTHROPIC_CUSTOM_HEADERS`  | Additional HTTP headers     |
| `ANTHROPIC_FOUNDRY_API_KEY` | Microsoft Foundry API key   |
| `AWS_BEARER_TOKEN_BEDROCK`  | AWS Bedrock API key         |

### Model Selection

| Variable                         | Purpose                               |
| -------------------------------- | ------------------------------------- |
| `ANTHROPIC_MODEL`                | Override default model                |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | Opus-class model                      |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet-class model                    |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | Haiku-class model                     |
| `CLAUDE_CODE_SUBAGENT_MODEL`     | Subagent model                        |
| `MAX_THINKING_TOKENS`            | Extended thinking budget (8000-32000) |

### Output and Context

| Variable                          | Purpose                     | Default          |
| --------------------------------- | --------------------------- | ---------------- |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS`   | Max output tokens           | 32000            |
| `BASH_MAX_OUTPUT_LENGTH`          | Bash output character limit | System-dependent |
| `BASH_DEFAULT_TIMEOUT_MS`         | Default bash timeout        | 120000           |
| `BASH_MAX_TIMEOUT_MS`             | Maximum bash timeout        | 600000           |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Auto-compaction trigger     | 90%              |

### MCP Configuration

| Variable                | Purpose                    |
| ----------------------- | -------------------------- |
| `MCP_TIMEOUT`           | MCP server startup timeout |
| `MCP_TOOL_TIMEOUT`      | MCP tool execution timeout |
| `MAX_MCP_OUTPUT_TOKENS` | Max MCP output tokens      |
| `ENABLE_TOOL_SEARCH`    | MCP tool search mode       |

### Feature Flags

| Variable                               | Purpose                           |
| -------------------------------------- | --------------------------------- |
| `CLAUDE_CODE_ENABLE_TELEMETRY`         | Enable OpenTelemetry              |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable background operations     |
| `DISABLE_AUTOUPDATER`                  | Disable auto-updates              |
| `DISABLE_TELEMETRY`                    | Opt out of telemetry              |
| `DISABLE_ERROR_REPORTING`              | Opt out of Sentry errors          |
| `CLAUDE_CODE_SKIP_WEBFETCH_PREFLIGHT`  | Skip WebFetch domain safety check |

## WebFetch Preflight Check

By default, Claude Code performs a domain safety verification before every `WebFetch` request by calling `https://api.anthropic.com/api/web/domain_info?domain=<hostname>`. This preflight check determines whether the domain is allowed, blocked, or if the check itself fails.

In corporate/enterprise environments, this check often fails because:

- Corporate firewalls or proxies (e.g., ZScaler) block access to `api.anthropic.com`
- Users on AWS Bedrock or Google Vertex AI may not have connectivity to `api.anthropic.com`
- The check leaks domain names to Anthropic's API, which may violate privacy policies

When the preflight check fails, WebFetch refuses to fetch any URL with the error:
`"Unable to verify if domain <domain> is safe to fetch."`

### Disabling the Preflight Check

Set `skipWebFetchPreflight` to `true` in settings or via environment variable:

**Settings JSON (any level):**

```json
{
  "skipWebFetchPreflight": true
}
```

**Environment variable:**

```bash
export CLAUDE_CODE_SKIP_WEBFETCH_PREFLIGHT=true
```

### Security Considerations

| Risk                                       | Benefit                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| Bypasses Anthropic's domain blocklist      | Fixes WebFetch in restrictive corporate networks      |
| Removes a prompt injection defense layer   | Eliminates domain name leakage to `api.anthropic.com` |
| All-or-nothing (no per-domain granularity) | Required for Bedrock/Vertex environments              |
|                                            | Reduces latency (removes extra network round-trip)    |

Note: The `WebFetch(domain:...)` permission pattern provides a separate layer of domain filtering that remains active regardless of this setting.

### References

- [GitHub #6166](https://github.com/anthropics/claude-code/issues/6166) -- Privacy concern: domains sent to `api.anthropic.com`
- [GitHub #6188](https://github.com/anthropics/claude-code/issues/6188) -- WebFetch broken in corporate environments
- [GitHub #6388](https://github.com/anthropics/claude-code/issues/6388) -- "Unable to verify domain" errors

## Permission System

### Permission Modes

| Mode                | Description                                |
| ------------------- | ------------------------------------------ |
| `default`           | Prompts for permission on first use        |
| `acceptEdits`       | Auto-accepts file edit permissions         |
| `plan`              | Plan Mode - analyze only, no modifications |
| `dontAsk`           | Auto-denies unless pre-approved            |
| `bypassPermissions` | Skips all prompts                          |

### Permission Structure

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(git * main)",
      "Read(~/.zshrc)",
      "Edit(./src/**)",
      "WebFetch(domain:github.com)"
    ],
    "ask": [
      "Bash(git push:*)"
    ],
    "deny": [
      "Bash(curl:*)",
      "Bash(rm -rf:*)",
      "Read(./.env)",
      "Task(Explore)"
    ],
    "additionalDirectories": ["../docs/", "/shared/resources"]
  }
}
```

### Rule Patterns

**Bash Tool:**

```json
{
  "allow": [
    "Bash",                     // All bash commands
    "Bash(npm run build)",      // Exact match
    "Bash(npm run:*)",          // Prefix match (word boundary)
    "Bash(npm *)",              // Anywhere match (no boundary)
    "Bash(git * main)"          // Complex pattern
  ]
}
```

Key difference:

- `Bash(ls:*)` matches `ls -la` but NOT `lsof` (word boundary)
- `Bash(ls*)` matches both `ls -la` and `lsof` (no boundary)

**Read/Edit/Write Tool (gitignore patterns):**

```json
{
  "allow": [
    "Read",                     // All files
    "Read(./.env)",             // Current dir file
    "Read(~/Documents/*.pdf)",  // Home directory pattern
    "Read(//Users/alice/**)",   // Absolute path
    "Edit(/src/**/*.ts)"        // Relative to settings file
  ]
}
```

**Path Resolution:**

- `//path` = Absolute filesystem path
- `~/path` = Home directory
- `/path` = Relative to settings file location
- `path` or `./path` = Relative to current working directory

## MCP Server Configuration

```json
{
  "mcpServers": {
    "server_name": {
      "type": "stdio|http|sse",
      "command": "command to run",
      "args": ["arg1", "arg2"],
      "env": {
        "VAR": "value"
      }
    }
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["memory"],
  "disabledMcpjsonServers": ["fs"]
}
```

## API Configuration

### Claude API (Anthropic)

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-xxxxx"
  }
}
```

### AWS Bedrock

```json
{
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "AWS_REGION": "us-east-1"
  }
}
```

### Google Vertex AI

```json
{
  "env": {
    "CLAUDE_CODE_USE_VERTEX": "1",
    "VERTEX_REGION": "us-central1"
  }
}
```

### Dynamic API Key Helper

```json
{
  "apiKeyHelper": "/path/to/generate_api_key.sh",
  "env": {
    "CLAUDE_CODE_API_KEY_HELPER_TTL_MS": "300000"
  }
}
```

## Model Selection

### Available Aliases

| Alias        | Behavior                |
| ------------ | ----------------------- |
| `default`    | Account-optimized model |
| `sonnet`     | Latest Sonnet (4.5)     |
| `opus`       | Opus 4.5                |
| `haiku`      | Fast Haiku model        |
| `sonnet[1m]` | Sonnet with 1M context  |
| `opusplan`   | Opus→Sonnet hybrid      |

### Switching Models

```bash
# Start with specific model
claude --model opus

# Switch during session
/model sonnet

# Check current model
/status
```

## Sandbox Configuration

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker"],
    "allowUnsandboxedCommands": true,
    "network": {
      "allowUnixSockets": ["~/.ssh/agent-socket"],
      "allowLocalBinding": true,
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

## Plugin Configuration

```json
{
  "enabledPlugins": {
    "formatter@team-tools": true,
    "deployer@team-tools": false
  },
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins",
        "ref": "main"
      }
    }
  }
}
```

## References

- [Settings Documentation](https://code.claude.com/docs/en/settings.md)
- [IAM & Permissions](https://code.claude.com/docs/en/iam.md)
- [Model Configuration](https://code.claude.com/docs/en/model-config.md)
