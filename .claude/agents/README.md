# Project Agents

Specialist agents for the claude-almanac repository. Spawn these via the `Agent` tool with `subagent_type: "<name>"` when starting agent teams.

## Available agents

| Agent                                                 | Role                            | When to use                                                 |
| ----------------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| [doc-updater](./doc-updater.md)                       | Update existing feature docs    | Fixing outdated content, verifying against official sources |
| [doc-creator](./doc-creator.md)                       | Create new feature docs         | Documenting features not yet covered                        |
| [pr-reviewer](./pr-reviewer.md)                       | Review and merge PRs            | After a round of doc work                                   |
| [blog-researcher](./blog-researcher.md)               | Research Anthropic sources      | Before starting doc updates                                 |
| [cloudflare-browser-ops](./cloudflare-browser-ops.md) | Cloudflare dashboard operations | Inspecting CF Pages, DNS, Workers via browser (read-only)   |

## Design notes

- Agents are **read at spawn time** — updating the file affects future spawns, not running ones
- **Skills and MCP servers are NOT inherited** by teammates using these agent types (documented agent-teams limitation)
- Tool restrictions are the primary safety mechanism — prefer tight tool lists over trusting prompts
