# Claude Code Security and Sandbox

Claude Code features comprehensive security controls including native sandboxing, permission boundaries, and enterprise-grade policy management.

## Sandbox Mode

### Overview

Native sandboxing provides filesystem and network isolation while reducing permission prompts.

### Sandbox Modes

- **Auto-allow mode**: Bash commands execute within sandbox boundaries without permission prompts
- **Regular permissions mode**: All bash commands require explicit approval

### Enabling Sandboxing

```bash
/sandbox  # Interactive menu
```

Or configure in `settings.json`:

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true
  }
}
```

### Platform Support

| Platform | Support           | Notes                                                               |
| -------- | ----------------- | ------------------------------------------------------------------- |
| macOS    | ✅ Native         | Uses Seatbelt framework                                             |
| Linux    | ✅ Supported      | Requires `bubblewrap` and `socat`                                   |
| WSL2     | ✅ Supported      | Uses bubblewrap                                                     |
| WSL1     | ❌ Not supported  | Missing kernel features                                             |
| Windows  | 🔄 In development | Check [docs](https://code.claude.com/docs/en/sandbox.md) for status |

> **Note**: Platform support evolves. Check the [official sandbox documentation](https://code.claude.com/docs/en/sandbox.md) for the latest status.

## Network Isolation

### Cloud Environment

Three access levels:

- **Limited** (default): Only allowlisted domains
- **Disabled**: No internet access
- **Full**: Complete internet access

### Default Allowlist

Includes:

- Anthropic services (api.anthropic.com, claude.ai)
- Version control (GitHub, GitLab, Bitbucket)
- Container registries (Docker, GCR, ECR)
- Package managers (npm, PyPI, RubyGems, etc.)
- Cloud platforms (AWS, Azure, GCP)

### Configuration

```json
{
  "sandbox": {
    "network": {
      "allowedDomains": ["example.com"],
      "blockedDomains": ["untrusted.com"],
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

## File System Restrictions

### Default Behavior

- **Write access**: Current working directory and subdirectories only
- **Read access**: Entire computer except denied directories
- **Boundary**: Cannot modify parent directories without permission

### Extending Access

```bash
# During session
/add-dir /path/to/directory

# CLI flag
claude --add-dir /path/to/directory
```

### Persistent Configuration

```json
{
  "permissions": {
    "additionalDirectories": ["../docs/", "/shared/resources"]
  }
}
```

### Blocked Directories

Cannot modify by default:

- `/bin/`, system binaries
- `.bashrc`, `.zshrc`
- Critical system files

## Permission System

### Permission Modes

| Mode                | Description                     |
| ------------------- | ------------------------------- |
| `default`           | Prompts on first use            |
| `acceptEdits`       | Auto-accepts file edits         |
| `plan`              | Read-only analysis only         |
| `dontAsk`           | Auto-denies unless pre-approved |
| `bypassPermissions` | Skips all prompts               |

### Permission Rules

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Read(./src/**)",
      "WebFetch(domain:github.com)"
    ],
    "ask": [
      "Bash(git push:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Read(.env)",
      "Read(./secrets/**)"
    ]
  }
}
```

### Rule Evaluation

Order: **deny → ask → allow** (first match wins)

### Tool-Specific Patterns

**Bash** (prefix matching):

```json
"Bash(npm run test:*)"  // Word boundary
"Bash(npm *)"           // Anywhere match
```

**Read/Edit** (gitignore patterns):

```json
"Read(//Users/alice/**)"  // Absolute path
"Read(~/Documents/*.pdf)" // Home directory
"Edit(/src/**/*.ts)"      // Relative to settings
```

**WebFetch** (domain-based):

```json
"WebFetch(domain:example.com)"
```

**MCP** (server and tool):

```json
"mcp__github__*"
"mcp__memory__create_entities"
```

## Enterprise Security Controls

### Managed Settings

System-level policy in `managed-settings.json`:

**Locations**:

- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux: `/etc/claude-code/managed-settings.json`
- Windows: `C:\Program Files\ClaudeCode\managed-settings.json`

### MCP Security Policies

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "untrusted-server" }
  ]
}
```

### Settings Precedence

1. Managed settings (highest)
1. Command-line arguments
1. Local project settings
1. Shared project settings
1. User settings (lowest)

## Audit Logging

### OpenTelemetry Metrics

Enable with:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
```

**Available Metrics**:

- Session counter
- Lines of code counter
- Pull request counter
- Commit counter
- Cost counter
- Token counter
- Active time counter

**Available Events**:

- User prompt events
- Tool result events
- API request events
- API error events

### Custom Attributes

```bash
export OTEL_RESOURCE_ATTRIBUTES="team=frontend,department=engineering"
```

## Safe Mode Operations

### Built-In Protections

1. **Sandboxed bash**: OS-level filesystem and network isolation
1. **Write restriction**: Only current directory by default
1. **Accept Edits mode**: Batch accept edits while maintaining command safety
1. **Command blocklist**: curl, wget blocked by default

### Prompt Injection Protections

- Permission system requiring explicit approval
- Context-aware analysis detecting harmful instructions
- Input sanitization preventing command injection
- Command injection detection with warnings
- Fail-closed matching (unmatched defaults to manual approval)

## Development Containers

### Security Benefits

- Isolated virtual machines per session
- Custom firewall restricting network
- Enhanced isolation for `--dangerously-skip-permissions`
- Default-deny network policy

### Limitations

- Does not prevent exfiltration of accessible data
- Only use with trusted repositories
- Requires monitoring of Claude activities

## Quick Reference

### Enable Sandboxing

```bash
/sandbox
```

### View Permissions

```bash
/permissions
```

### Add Directory Access

```bash
/add-dir /path/to/directory
```

### Plan Mode (Safe Analysis)

```bash
claude --permission-mode plan
```

### Check Sandbox Status

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true
  }
}
```

## References

- [Security Guide](https://code.claude.com/docs/en/security.md)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing.md)
- [Identity & Access Management](https://code.claude.com/docs/en/iam.md)
- [Development Containers](https://code.claude.com/docs/en/devcontainer.md)
