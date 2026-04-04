# Claude Code Plans and Pricing

Overview of all Claude plans, pricing, and Claude Code feature availability.

> **Last updated**: April 2026. Pricing and features may change. See [claude.com/pricing](https://claude.com/pricing) for current details.

## Individual Plans

|                       | **Free**        | **Pro**                   | **Max 5x**                      | **Max 20x**                     |
| --------------------- | --------------- | ------------------------- | ------------------------------- | ------------------------------- |
| **Price**             | $0/mo           | $20/mo ($17 annual)       | $100/mo                         | $200/mo                         |
| **Claude Code**       | No              | Yes                       | Yes                             | Yes                             |
| **Usage multiplier**  | 1x              | ~5x Free                  | 5x Pro (25x Free)               | 20x Pro (100x Free)             |
| **Models**            | Sonnet 4.5 only | All (Opus, Sonnet, Haiku) | All                             | All                             |
| **Context window**    | 200K            | 200K                      | 200K standard, 1M with Opus 4.6 | 200K standard, 1M with Opus 4.6 |
| **Extended thinking** | Limited         | Full                      | Full                            | Full                            |
| **Extra usage**       | No              | Yes (API rates)           | Yes (API rates)                 | Yes (API rates)                 |

**Notes:**

- All plans share usage limits across claude.ai, Claude Desktop, and Claude Code. There is no separate Claude Code quota.
- Max plans are monthly billing only (no annual option).
- Max 20x is the best per-message value: 10x cost for 20x usage (half the per-message cost vs Pro).

## Organization Plans

### Team Plan

|                      | **Standard Seat** | **Premium Seat**               |
| -------------------- | ----------------- | ------------------------------ |
| **Price (monthly)**  | $25/seat/mo       | $125/seat/mo                   |
| **Price (annual)**   | $20/seat/mo       | $100/seat/mo                   |
| **Claude Code**      | No                | Yes                            |
| **Automode**         | N/A               | Yes (admin must enable)        |
| **Usage multiplier** | 1.25x Pro         | 6.25x Pro                      |
| **Models**           | All               | All                            |
| **Context window**   | 200K              | 1M with Opus 4.6               |
| **Minimum seats**    | 5 (max 150)       | 5 (max 150, mix with Standard) |

**Team features (all seats):** SSO, domain capture, JIT provisioning, role-based permissions, centralized billing, spend controls, Google Drive, Gmail, Google Calendar, GitHub, Microsoft 365, and Slack connectors.

### Enterprise Plan

| Field              | Details                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Pricing**        | Per-seat annual fee + usage billed at API rates. Custom/sales-assisted pricing. Self-serve and AWS Marketplace available. |
| **Claude Code**    | Yes (not covered under HIPAA-ready offering)                                                                              |
| **Automode**       | Yes (admin must enable)                                                                                                   |
| **Models**         | All                                                                                                                       |
| **Context window** | 500K (chat, Sonnet 4.6), 1M (Claude Code, Sonnet 4.6)                                                                     |
| **Minimum seats**  | No minimum (self-serve), ~50-70 (sales-assisted)                                                                          |

**Enterprise features:** Everything in Team plus audit logs, SCIM provisioning, custom data retention, compliance API, analytics API, and native Atlassian (Jira, Confluence) integration.

### API (Pay-per-token)

No subscription fee. Authenticate Claude Code with an API key.

| Model          | Input (per MTok) | Output (per MTok) |
| -------------- | ---------------- | ----------------- |
| **Opus 4.6**   | $5               | $25               |
| **Sonnet 4.6** | $3               | $15               |
| **Haiku 4.5**  | $1               | $5                |

| Discount                         | Details                                  |
| -------------------------------- | ---------------------------------------- |
| **Batch API**                    | 50% off (e.g., Opus 4.6: $2.50 / $12.50) |
| **Prompt caching (read)**        | 90% off input (0.1x base)                |
| **Prompt caching (5-min write)** | 1.25x base input                         |
| **Prompt caching (1-hr write)**  | 2x base input                            |
| **Fast mode (Opus 4.6)**         | 6x standard: $30 / $150 per MTok         |
| **US data residency**            | 1.1x multiplier                          |
| **Web search**                   | $10 per 1,000 searches + token costs     |
| **Code execution**               | 1,550 free hours/mo, then $0.05/hr       |

## Claude Code Feature Matrix

| Feature                 | Free | Pro | Max | Team Std | Team Prem | Enterprise | API |
| ----------------------- | ---- | --- | --- | -------- | --------- | ---------- | --- |
| **Claude Code access**  | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Auto mode**           | --   | No  | No  | --       | Yes       | Yes        | Yes |
| **Agent Teams**         | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **MCP Servers**         | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Hooks**               | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Headless/SDK (`-p`)** | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **GitHub Actions**      | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **1M context window**   | --   | No  | Yes | --       | Yes       | Yes        | Yes |
| **Opus 4.6**            | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Sonnet 4.6**          | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Haiku 4.5**           | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Remote Control**      | --   | Yes | Yes | --       | Yes       | Yes        | No  |
| **`--max-budget-usd`**  | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **VS Code / JetBrains** | --   | Yes | Yes | --       | Yes       | Yes        | Yes |
| **Security Sandbox**    | --   | Yes | Yes | --       | Yes       | Yes        | Yes |

## Automode Requirements

Automode requires all of the following:

| Requirement  | Details                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Plan**     | Team, Enterprise, or API only. Not available on Pro or Max.                                                         |
| **Admin**    | Team/Enterprise admins must enable it in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code) |
| **Model**    | Sonnet 4.6 or Opus 4.6 only (not Haiku or claude-3)                                                                 |
| **Provider** | Anthropic API only (not Bedrock, Vertex, or Foundry)                                                                |

## Which Plan to Choose

| If you need                        | Choose                                       |
| ---------------------------------- | -------------------------------------------- |
| Maximum solo usage, no weekly caps | **Max 20x** ($200/mo)                        |
| Claude Code on a budget            | **Pro** ($20/mo)                             |
| Automode                           | **Team Premium**, **Enterprise**, or **API** |
| Team admin controls, SSO           | **Team** or **Enterprise**                   |
| Pay only for what you use          | **API**                                      |
| Highest context + compliance       | **Enterprise**                               |

## References

- [Claude Pricing](https://claude.com/pricing)
- [Using Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
- [Team Plan overview](https://support.claude.com/en/articles/9266767-what-is-the-team-plan)
- [Purchase and manage Team seats](https://support.claude.com/en/articles/12004354-purchase-and-manage-seats-on-team-plans)
- [Auto mode blog post](https://claude.com/blog/auto-mode)
- [Agent Teams setup guide](https://github.com/asivura/claude-almanac/blob/main/features/agent-teams.md)
