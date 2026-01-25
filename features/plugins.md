# Claude Code Plugins

Plugins are packages of reusable functionality that extend Claude Code with custom commands, agents, hooks, MCP servers, and language server integrations.

## Overview

**Purpose**: Plugins enable you to:

- Share functionality across multiple projects and teams
- Distribute versioned, maintained extensions
- Create community-driven extensibility
- Package complex configurations for easy deployment

**When to Use**:

- **Standalone** (`.claude/` directory): Personal workflows, project-specific customizations
- **Plugins**: Sharing with teammates, distributing to community, versioned releases

## Installation

### From Official Marketplace

```bash
/plugin install plugin-name@claude-plugins-official
```

### From Custom Marketplaces

```bash
# Add marketplace first
/plugin marketplace add owner/repo          # GitHub
/plugin marketplace add https://url.git     # Git URL
/plugin marketplace add ./path/to/marketplace # Local

# Then install
/plugin install plugin-name@marketplace-name --scope user
```

### Installation Scopes

| Scope       | Location                      | Who It Affects                     |
| ----------- | ----------------------------- | ---------------------------------- |
| **User**    | `~/.claude/settings.json`     | You, across all projects           |
| **Project** | `.claude/settings.json`       | All collaborators (via git)        |
| **Local**   | `.claude/settings.local.json` | You, in this repository only       |
| **Managed** | `managed-settings.json`       | All users on machine (IT deployed) |

## Plugin Management Commands

```bash
# List installed plugins
/plugin marketplace list

# View plugin details
/plugin

# Install with specific scope
claude plugin install formatter@marketplace --scope project

# Disable without uninstalling
/plugin disable plugin-name@marketplace-name

# Re-enable
/plugin enable plugin-name@marketplace-name

# Update plugin
/plugin update plugin-name@marketplace-name

# Uninstall completely
/plugin uninstall plugin-name@marketplace-name

# Refresh marketplace listings
/plugin marketplace update marketplace-name

# Remove marketplace
/plugin marketplace remove marketplace-name
```

## Plugin Structure

### Directory Layout

```
my-plugin/
├── .claude-plugin/           # Metadata (only location for plugin.json)
│   └── plugin.json          # Required: manifest
├── commands/                 # Default command location
│   └── status.md
├── agents/                   # Custom agent definitions
│   └── security-reviewer.md
├── skills/                   # Agent Skills
│   └── code-reviewer/
│       └── SKILL.md
├── hooks/                    # Event handlers
│   └── hooks.json
├── .mcp.json                 # MCP server configurations
├── .lsp.json                 # LSP server configurations
├── scripts/                  # Hook and utility scripts
│   └── format.sh
└── README.md
```

**⚠️ CRITICAL**: Component directories (`commands/`, `agents/`, `skills/`, `hooks/`) must be at the plugin root level, NOT inside `.claude-plugin/`. This is the most common mistake when creating plugins.

### Plugin Manifest (plugin.json)

**Minimal**:

```json
{
  "name": "my-plugin"
}
```

**Full Example**:

```json
{
  "name": "enterprise-tools",
  "version": "2.1.0",
  "description": "Enterprise workflow automation",
  "author": {
    "name": "Team Name",
    "email": "team@example.com"
  },
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/team/plugin",
  "license": "MIT",
  "keywords": ["enterprise", "automation"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "lspServers": "./.lsp.json"
}
```

## Creating a Plugin

### Quick Start

**Step 1: Create Structure**

```bash
mkdir -p my-plugin/.claude-plugin
mkdir -p my-plugin/skills/hello
```

**Step 2: Create Manifest**

```json
// my-plugin/.claude-plugin/plugin.json
{
  "name": "my-plugin",
  "description": "A greeting plugin",
  "version": "1.0.0"
}
```

**Step 3: Add a Skill**

```markdown
<!-- my-plugin/skills/hello/SKILL.md -->
---
description: Greet the user with a friendly message
disable-model-invocation: true
---

Greet the user named "$ARGUMENTS" warmly.
```

**Step 4: Test**

```bash
claude --plugin-dir ./my-plugin
```

Then use:

```
/my-plugin:hello
/my-plugin:hello Alex
```

### Adding Components

**Agents**:

```markdown
<!-- my-plugin/agents/security-reviewer.md -->
---
description: Reviews code for security vulnerabilities
---

You are a senior security engineer. Review code for:
- Injection vulnerabilities
- Authentication flaws
- Secrets in code
```

**Hooks**:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
      }]
    }]
  }
}
```

**MCP Servers**:

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  }
}
```

**LSP Servers**:

```json
{
  "python": {
    "command": "pyright-langserver",
    "args": ["--stdio"],
    "extensionToLanguage": {
      ".py": "python"
    }
  }
}
```

## Official Marketplace Plugins

The `claude-plugins-official` marketplace includes:

**Code Intelligence (LSP)**:

- `typescript-lsp`, `pyright-lsp`, `rust-analyzer-lsp`
- `gopls-lsp`, `jdtls-lsp`, `clangd-lsp`
- PHP, Lua, Kotlin, Swift, C# and more

**Integrations**:

- `github`, `gitlab` - Source control
- `atlassian`, `asana`, `linear`, `notion` - Project management
- `figma` - Design
- `vercel`, `firebase`, `supabase` - Infrastructure
- `slack` - Communication
- `sentry` - Monitoring

**Development Workflows**:

- `commit-commands` - Git workflows
- `pr-review-toolkit` - PR reviewing
- `agent-sdk-dev` - Agent SDK tools
- `plugin-dev` - Plugin creation toolkit

## Creating Marketplaces

### Marketplace File

```json
// .claude-plugin/marketplace.json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting",
      "version": "2.1.0"
    },
    {
      "name": "github-integration",
      "source": {
        "source": "github",
        "repo": "company/github-plugin",
        "ref": "v2.0.0"
      }
    }
  ]
}
```

### Plugin Sources

**Relative paths**:

```json
{ "source": "./plugins/my-plugin" }
```

**GitHub**:

```json
{
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0"
  }
}
```

**NPM**:

```json
{
  "source": {
    "source": "npm",
    "package": "@company/claude-plugins"
  }
}
```

### Hosting Options

- **GitHub** (recommended): `/plugin marketplace add owner/repo`
- **Git URL**: `/plugin marketplace add https://gitlab.com/company/plugins.git`
- **Local**: `/plugin marketplace add ./my-marketplace`
- **Remote URL**: `/plugin marketplace add https://example.com/marketplace.json`

### Private Repositories

Set environment variables:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export GITLAB_TOKEN=glpat-xxxxxxxxxxxx
```

## Enterprise Configuration

### Managed Marketplace Restrictions

```json
// managed-settings.json
{
  "strictKnownMarketplaces": [
    {
      "source": "github",
      "repo": "acme-corp/approved-plugins"
    }
  ]
}
```

| Value               | Behavior              |
| ------------------- | --------------------- |
| **undefined**       | No restrictions       |
| **Empty array**     | Complete lockdown     |
| **List of sources** | Allowlist enforcement |

### Team Configuration

Add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "code-formatter@company-tools": true
  }
}
```

## Best Practices

### Plugin Design

1. **Namespace carefully** - Skills use `/plugin-name:skill-name`
1. **Version plugins** - Use semantic versioning
1. **Document everything** - Include README.md with usage
1. **Test locally first** - Use `claude --plugin-dir ./my-plugin`

### Environment Variables

Always use `${CLAUDE_PLUGIN_ROOT}` for paths:

```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
}
```

### Common Pitfalls

**Wrong directory structure**:

```
❌ .claude-plugin/commands/    (wrong)
✅ commands/                   (correct - at root)
```

**Absolute paths**:

```
❌ "/home/user/plugin/scripts/format.sh"
✅ "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
```

**External file references**:

```
❌ "../shared/utils.js"        (won't work after installation)
✅ Use symlinks or restructure
```

### Debugging

```bash
# View plugin loading details
claude --debug --plugin-dir ./my-plugin

# Validate plugin
/plugin validate .

# Check for errors
/plugin  # See "Errors" tab
```

## References

- [Plugins Documentation](https://code.claude.com/docs/en/plugins.md)
- [Creating Plugins](https://code.claude.com/docs/en/creating-plugins.md)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)
