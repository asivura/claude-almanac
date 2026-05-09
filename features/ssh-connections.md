---
title: SSH Connections
description: Run Claude Code on a remote machine over SSH while using the Claude Desktop app as the client interface.
type: reference
category: surfaces
---

# SSH Connections

SSH connections let you run Claude Code on a remote Linux or macOS machine while using the Claude Desktop app as the client. Claude executes on the remote host, with full access to its files and tools, and the desktop app renders the chat, diffs, files, and panes locally. Use this when your codebase lives on a cloud VM, a powerful workstation, or a dev container instead of your laptop.

## Overview

SSH is one of three environments you can pick when starting a session in the desktop app's **Code** tab, alongside **Local** and **Remote**:

| Environment | Where Claude runs               | Where files live         |
| ----------- | ------------------------------- | ------------------------ |
| Local       | Your machine                    | Your machine             |
| Remote      | Anthropic-managed cloud VM      | Cloned into the cloud VM |
| SSH         | A remote machine you connect to | The remote machine       |

When you select an SSH connection, the desktop app opens an SSH session to the host, installs Claude Code on the remote machine the first time you connect, and starts a session that runs entirely on that host. Your prompts, diffs, and approvals flow through the SSH connection back to the desktop UI.

Sessions in the SSH environment behave like local sessions in most ways. They support permission modes, connectors, plugins, MCP servers, side chats, slash commands, the file pane, and `@mention` files. The integrated terminal and the **Continue in → Claude Code on the Web** option are local-only.

## Requirements

| Side                | Requirement                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client OS           | Claude Desktop on macOS or Windows. The desktop app is not available on Linux.                                                                                                                                                              |
| Plan                | Pro, Max, Team, or Enterprise subscription. The Code tab is gated by a paid plan.                                                                                                                                                           |
| Remote OS           | Linux or macOS. Windows hosts are not supported as SSH targets.                                                                                                                                                                             |
| Remote access       | A working SSH login: a host you can reach with `ssh user@host`, optionally pre-configured in `~/.ssh/config`.                                                                                                                               |
| Remote tools        | None up front. The desktop app installs Claude Code on the remote machine automatically the first time you connect.                                                                                                                         |
| Client network      | Outbound SSH (port 22 or your configured port) to the remote host. The desktop app's claude.ai sign-in needs reachability to Anthropic's API endpoints.                                                                                     |
| Remote host network | Outbound HTTPS to Anthropic's API endpoints from the remote machine, since the remote `claude` process makes the model API calls. Whether the desktop app honors `HTTPS_PROXY` and `NO_PROXY` on either leg is not documented by Anthropic. |

The remote machine does not need a pre-installed Claude Code, a claude.ai login, or its own subscription. Claude authenticates to Anthropic's API through the desktop app's existing claude.ai sign-in; no separate authentication is required on the remote host.

## Adding a connection

In the **Code** tab, open the environment dropdown next to the prompt area before starting a session and select **+ Add SSH connection**. The dialog asks for four fields:

| Field                           | Accepts                                                                                    | Default                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **Name**                        | A friendly label for this connection (for example, `dev-vm`, `My Server`).                 | None. Required.                                  |
| **SSH Host**                    | `user@hostname` (e.g. `alice@dev.example.com`) or a host alias defined in `~/.ssh/config`. | None. Required.                                  |
| **SSH Port**                    | A TCP port number.                                                                         | Empty uses port 22, or the port from SSH config. |
| **Identity File (Private Key)** | A filesystem path to your private key, such as `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`.     | Empty uses the default key or your SSH config.   |

Because empty `Port` and `Identity File` fall back to `~/.ssh/config`, a host already configured in your SSH config can usually be added with just a Name and the config alias as the SSH Host:

```text
SSH Host: dev-vm
```

Once added, the connection appears in the environment dropdown alongside **Local** and **Remote**. Select it to start a session on that machine.

User-added connections are saved to `~/.claude/settings.json` under the `sshConfigs` key (see [Pre-configuring connections](#pre-configuring-connections-for-a-team) for the schema). To rename or remove a saved connection, edit that file directly; the desktop app does not currently expose UI affordances for editing existing entries.

## Connecting and running a session

After picking an SSH connection from the environment dropdown, choose a project folder on the remote machine, pick a model, choose a permission mode, and send your first prompt. The session shows up in the sidebar like any other session. The desktop app handles SSH transport in the background.

You can have multiple SSH sessions to the same or different hosts open concurrently; each appears as its own entry in the sidebar. Whether the desktop app honors `ControlMaster` / `ControlPath` for SSH connection multiplexing is not documented.

On the first connection to a new host, the desktop app installs Claude Code on the remote machine. Subsequent sessions to the same host reuse that installation. Anthropic does not currently document the install path, disk footprint, runtime dependencies, or update behavior of the auto-installed remote binary, nor an uninstall command. Until this is published, treat first-connect to a host as installing an unspecified Anthropic-distributed binary under the SSH user's account.

Within an SSH session you can:

- Approve and reject diffs from the desktop app's diff view
- `@mention` remote files with autocomplete
- Open files in the file pane and edit them in place
- Add MCP servers and connectors via the **+** button
- Install and manage plugins
- Open a side chat with `Cmd+;` (macOS) or `Ctrl+;` (Windows)

Behavior when the SSH transport drops mid-session, when the laptop sleeps, when networks switch, or when the desktop app's claude.ai sign-in expires is not currently documented by Anthropic. In-flight tool calls, partially-applied diffs, and remote `claude` process lifecycle on reconnect are similarly unspecified.

The integrated terminal pane is available in local sessions only; for shell access on the remote host, use a separate terminal with `ssh`. The **Continue in → Claude Code on the Web** option is also unavailable for SSH sessions.

## Authentication and security

The desktop app uses your operating system's SSH client semantics. Hostnames, port mappings, identity files, `ProxyCommand`, and `ProxyJump` entries from `~/.ssh/config` all apply, and `Host` aliases work as the **SSH Host** value. Allowlist matching uses `ssh -G` to resolve the configured host through `~/.ssh/config` before pattern checks. Anthropic does not document whether the underlying SSH transport is the system `ssh` binary or a bundled implementation, so behavior of less-common SSH config directives may differ from your terminal.

User-added SSH connection metadata (name, host, port, identity file path) is persisted in `~/.claude/settings.json`. Claude itself authenticates to Anthropic's API through the desktop app's existing claude.ai sign-in; no separate authentication is required on the remote host.

Anthropic does not currently document where the session credential lives on the remote host during an SSH session, its lifetime, or its cleanup behavior on disconnect. Treat the remote host as having full ability to use your Claude session for the duration of the session, and avoid SSH connections to multi-tenant or untrusted hosts until this behavior is documented.

For organizations with stricter requirements, see the managed settings options below.

## Pre-configuring connections for a team

Administrators can ship a list of SSH connections to every user by adding `sshConfigs` to a [managed settings](https://code.claude.com/docs/en/settings#settings-precedence) file. Connections defined this way appear in each user's environment dropdown automatically and are flagged as managed, so users can select them but cannot edit or delete them in the app.

```json
{
  "sshConfigs": [
    {
      "id": "shared-dev-vm",
      "name": "Shared Dev VM",
      "sshHost": "user@dev.example.com",
      "sshPort": 22,
      "sshIdentityFile": "~/.ssh/id_ed25519",
      "startDirectory": "~/projects"
    }
  ]
}
```

| Field             | Required | Notes                                                                |
| ----------------- | -------- | -------------------------------------------------------------------- |
| `id`              | Yes      | Stable identifier for this entry.                                    |
| `name`            | Yes      | Label shown in the environment dropdown.                             |
| `sshHost`         | Yes      | `user@host` or an alias from `~/.ssh/config`.                        |
| `sshPort`         | No       | Defaults to 22 or the SSH config value.                              |
| `sshIdentityFile` | No       | Path to a private key. Defaults to the user's default key or config. |
| `startDirectory`  | No       | Working directory on the remote host when sessions open.             |

Users can also add a `sshConfigs` block to their own `~/.claude/settings.json`. The dialog writes connections there.

## Restricting which hosts users can reach

To limit Desktop's SSH sessions to a vetted set of machines, administrators can add an `sshHostAllowlist` to a managed settings file:

```json
{
  "sshHostAllowlist": ["*.devboxes.example.com", "bastion.example.com"]
}
```

Pattern semantics:

- Patterns are case-insensitive.
- `*` matches any host.
- `*.example.com` matches `example.com` and any subdomain.
- Anything else is an exact match.

The check runs against the hostname **after** `~/.ssh/config` resolution via `ssh -G`. That means `Host` aliases and `ProxyCommand` or `ProxyJump` entries are allowed as long as the resolved `HostName` matches a pattern. Setting the value to an empty array (`[]`) disables SSH sessions in the desktop app entirely.

Important constraints:

- `sshHostAllowlist` is read from managed settings only. Values placed in user or project settings are ignored.
- Only the Claude Desktop app honors this setting. The Claude Code CLI, IDE extensions, and any `ssh` invocations from the Bash tool are not restricted by it.
- It governs which hosts the desktop app initiates SSH sessions to, not network egress. Pair it with your organization's network or zero-trust controls if you need a hard boundary.

`sshHostAllowlist` does not restrict `ProxyCommand` execution. A user who controls their own `~/.ssh/config` can route a connection to an allowlisted `HostName` through an arbitrary `ProxyCommand`. Treat `sshHostAllowlist` as a UI guardrail for the desktop app, not a network containment boundary. Enforcement also assumes the managed settings file is owned by an administrator and not writable by the user; distribute it via MDM (or equivalent) and verify file permissions on each managed machine.

## Comparison with Remote Control

SSH connections and [Remote Control](./remote-control.md) both involve "running Claude on one machine and using it from another", but they solve different problems and run in opposite directions.

| Dimension                      | SSH connections                                                | Remote Control                                                               |
| ------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Where Claude executes          | Remote host (Linux or macOS)                                   | Your local terminal session                                                  |
| Client surface                 | Claude Desktop app on macOS or Windows                         | claude.ai/code in any browser, or the Claude mobile app                      |
| Client OS support              | macOS or Windows only (no Linux desktop app)                   | Any browser, including Linux; mobile app on iOS and Android                  |
| Transport                      | Direct SSH from your client to the host                        | TLS bridge through Anthropic's servers                                       |
| Concurrency / session lifetime | Many parallel sessions per host, each in its own sidebar entry | One remote per process; use server mode with `--spawn` for multiple sessions |
| Primary use                    | Develop on cloud VMs, dev boxes, dev containers                | Drive a local terminal session from your phone, tablet, or any browser       |
| Auth                           | OS SSH client and your keys                                    | claude.ai OAuth (no API keys, Vertex, Bedrock, or Foundry)                   |
| Required admin action          | None for personal use; managed settings for IT                 | Off by default for Team and Enterprise; admin must enable                    |

If you need to drive a long-running terminal session from a phone, use Remote Control. If your code, build tools, and data live on a remote host and you want to develop against them with a graphical client, use an SSH connection.

## Comparison with dev containers

[Dev Containers](https://code.claude.com/docs/en/devcontainer) install Claude Code inside a Docker container that an editor (VS Code, Codespaces, JetBrains) connects to. SSH sessions, by contrast, are a desktop-app feature that connects to any reachable host over SSH, with the desktop app installing Claude Code on the remote on first use. The two can overlap when an SSH host happens to also be a dev container host, but they are configured and used independently.

## Limitations and known issues

- **Windows targets are not supported.** The remote machine must run Linux or macOS.
- **Linux clients cannot use this feature**, since the desktop app is not available on Linux. CLI users on Linux can still `ssh` to a remote host and run `claude` there.
- **No integrated terminal pane in SSH sessions.** Use a separate terminal with `ssh` for shell access on the remote host.
- **No "Continue in → Claude Code on the Web"** for SSH sessions. That handoff is available for local sessions only and requires a clean working tree.
- **`@mention` and the file pane** are available in local and SSH sessions, but not in Remote sessions.
- **`sshHostAllowlist` only applies to the desktop app.** It does not restrict the CLI, IDE extensions, or `ssh` calls from Claude's Bash tool.

## Sources

- [Use Claude Code Desktop: SSH sessions](https://code.claude.com/docs/en/desktop#ssh-sessions)
- [Use Claude Code Desktop: Pre-configure SSH connections for your team](https://code.claude.com/docs/en/desktop#pre-configure-ssh-connections-for-your-team)
- [Use Claude Code Desktop: Restrict which SSH hosts users can connect to](https://code.claude.com/docs/en/desktop#restrict-which-ssh-hosts-users-can-connect-to)
- [Use Claude Code Desktop: Environment configuration](https://code.claude.com/docs/en/desktop#environment-configuration)
- [Get started with the desktop app](https://code.claude.com/docs/en/desktop-quickstart)
- [Settings precedence](https://code.claude.com/docs/en/settings#settings-precedence)
- [Development containers](https://code.claude.com/docs/en/devcontainer)
- [Remote Control](https://code.claude.com/docs/en/remote-control)
