# Claude Code MCP (Model Context Protocol) Servers

MCP is an open-source standard for connecting AI applications to external systems. Think of MCP like a USB-C port for AI applications - it provides a standardized way to integrate Claude Code with external tools, databases, APIs, and data sources.

## Overview

MCP enables Claude Code to:

- Access databases and query data
- Integrate with third-party APIs and services
- Implement features from issue trackers
- Analyze monitoring data
- Automate workflows
- Access your tools and integrations seamlessly

## Configuration Methods

Claude Code supports three transport types for MCP servers:

### Remote HTTP Servers (Recommended)

HTTP servers are ideal for cloud-based services:

```bash
# Basic syntax
claude mcp add --transport http <name> <url>

# Example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With authentication
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### Remote SSE Servers (Deprecated)

Server-Sent Events transport for legacy servers:

```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

### Local Stdio Servers

Stdio servers run as local processes:

```bash
# Basic syntax
claude mcp add [options] <name> -- <command> [args...]

# Example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# Windows: Use cmd /c wrapper
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

## Configuration Scopes

| Scope               | Storage          | Use Case            | Visibility           |
| ------------------- | ---------------- | ------------------- | -------------------- |
| **local** (default) | `~/.claude.json` | Personal servers    | Current project only |
| **project**         | `.mcp.json`      | Team-shared servers | Version controlled   |
| **user**            | `~/.claude.json` | Personal utilities  | All projects         |

## Configuration Parameters

```bash
# Transport type
--transport [http|sse|stdio]

# Server scope
--scope [local|project|user]

# Environment variables
--env KEY=value

# Authentication headers (HTTP/SSE)
--header "Authorization: Bearer token"

# Timeout configuration
MCP_TIMEOUT=10000 claude  # 10-second timeout
```

### Environment Variable Expansion in `.mcp.json`

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

## Popular MCP Servers

- **GitHub**: Code reviews, PR management, issue tracking
- **Sentry**: Error monitoring and debugging
- **Notion**: Database access and content management
- **PostgreSQL**: Database queries and operations
- **Google Workspace**: Gmail, Docs, Sheets, Calendar
- **Slack**: Team communication integration
- **Figma**: Design system and file integration
- **Stripe**: Payment processing and financial data
- **Asana/JIRA**: Project management

## Examples

### Monitor Errors with Sentry

```bash
# Add the server
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Authenticate
> /mcp

# Use natural language
> "What are the most common errors in the last 24 hours?"
```

### Query PostgreSQL Database

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"

# Then ask
> "What's our total revenue this month?"
```

## Creating Custom MCP Servers

### Python Example (FastMCP)

```python
from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("my-server")

@mcp.tool()
async def my_tool(param: str) -> str:
    """Tool description for Claude.

    Args:
        param: Parameter description
    """
    return f"Result for {param}"

def main():
    mcp.run(transport="stdio")

if __name__ == "__main__":
    main()
```

### TypeScript Example

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

server.registerTool(
  "my_tool",
  { description: "Tool description" },
  async ({ param }) => {
    return {
      content: [{ type: "text", text: `Result: ${param}` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP Server Capabilities

1. **Resources**: File-like data that can be read (API responses, documentation)
1. **Tools**: Functions callable by Claude (with user approval)
1. **Prompts**: Pre-written templates for specific tasks

## Authentication

### OAuth 2.0 Flow

```bash
# Add server requiring auth
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Authenticate in Claude Code
> /mcp
# Follow browser-based OAuth flow

# Use the authenticated server
> "Review PR #456 and suggest improvements"
```

### Reset Authentication

```bash
> /mcp
# Select "Clear authentication"
```

## Security Considerations

1. **Trust MCP servers you use** - Third-party servers not verified by Anthropic
1. **Content-fetching servers** - Risk of prompt injection attacks
1. **Credential management**:
   - Use environment variables for sensitive data
   - Never commit API keys to `.mcp.json`
   - Tokens stored securely and refreshed automatically
1. **Project-scope servers require approval** - Claude prompts before using
1. **Use HTTPS for remote servers**

## Best Practices

### Scope Selection

- **Local**: Personal/experimental servers
- **Project**: Team-shared servers (version controlled)
- **User**: Tools across multiple projects

### Tool Management

- Tool Search auto-activates when tools exceed 10% of context
- Configure: `ENABLE_TOOL_SEARCH=auto:5` (5% threshold)
- Output limits: `MAX_MCP_OUTPUT_TOKENS=50000`

### Logging in STDIO Servers

- Never use `print()` or `console.log()` (corrupts JSON-RPC)
- Use logging libraries that write to stderr

## Managing MCP Servers

```bash
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get github

# Remove a server
claude mcp remove github

# Check server status
> /mcp

# Add from Claude Desktop config
claude mcp add-from-claude-desktop
```

## Enterprise Managed MCP

Organizations can control MCP servers:

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

## References

- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp.md)
- [Model Context Protocol Official Site](https://modelcontextprotocol.io/)
- [MCP Server Development Guide](https://modelcontextprotocol.io/docs/develop/build-server)
