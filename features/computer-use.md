# Claude Code Computer Use

> **Status**: Research preview. Requires Pro or Max plan. macOS only (CLI). Claude Code v2.1.85 or later. Not available on Team or Enterprise plans, non-interactive mode (`-p`), or third-party providers (Bedrock, Vertex, Foundry).

Let Claude open apps, control your screen, click, type, and take screenshots on macOS directly from the CLI. Build and validate native apps, debug visual issues, test GUI flows, and drive tools that have no CLI or API.

## What You Can Do

- **Build and validate native apps**: Claude writes Swift, compiles it, launches the app, clicks through every control, and verifies it works
- **End-to-end UI testing**: Point Claude at a local Electron app and say "test the onboarding flow." Claude opens it, clicks through signup, screenshots each step. No Playwright or test harness needed
- **Debug visual and layout issues**: Claude resizes windows, reproduces bugs, screenshots the broken state, patches CSS, and verifies the fix
- **Drive GUI-only tools**: Interact with design tools, hardware control panels, the iOS Simulator, or proprietary apps without a CLI or API

## When Computer Use Applies

Claude tries the most precise tool first and falls back to computer use only when nothing else can reach the task:

1. **MCP server** for the service (if configured)
1. **Bash** for shell commands
1. **Claude in Chrome** for browser work (if configured)
1. **Computer use** for native apps, simulators, and tools without an API

## Enabling Computer Use

Computer use is a built-in MCP server called `computer-use`, disabled by default.

1. Run `/mcp` in an interactive session
1. Find `computer-use` in the server list and select **Enable**
1. The setting persists per project

On first use, macOS prompts for two permissions:

- **Accessibility**: lets Claude click, type, and scroll
- **Screen Recording**: lets Claude see what's on your screen

Grant both in System Settings. macOS may require restarting Claude Code after granting Screen Recording.

## App Approval Per Session

Enabling the server does not grant access to every app. The first time Claude needs a specific app in a session, a prompt shows:

- Which apps Claude wants to control
- Any extra permissions requested (e.g., clipboard access)
- How many other apps will be hidden while Claude works

Choose **Allow for this session** or **Deny**. Approvals last for the current session only.

### App Warnings

Apps with broad reach show extra warnings:

| Warning                    | Applies to                                     |
| -------------------------- | ---------------------------------------------- |
| Equivalent to shell access | Terminal, iTerm, VS Code, Warp, and other IDEs |
| Can read or write any file | Finder                                         |
| Can change system settings | System Settings                                |

Claude's level of control also varies by app category: browsers and trading platforms are view-only, terminals and IDEs are click-only, and everything else gets full control.

## How Claude Works on Your Screen

### One Session at a Time

Computer use holds a machine-wide lock. If another session is already using your computer, new attempts fail with a message identifying which session holds the lock.

### Apps Are Hidden While Claude Works

When Claude starts controlling your screen, other visible apps are hidden so Claude interacts only with approved apps. Your terminal stays visible and is excluded from screenshots, so you can watch and Claude never sees its own output. Hidden apps restore automatically when the turn finishes.

### Stop at Any Time

A macOS notification appears: "Claude is using your computer - press Esc to stop." Press `Esc` anywhere to abort immediately, or press `Ctrl+C` in the terminal. Claude releases the lock, unhides apps, and returns control.

## Safety

Unlike the sandboxed Bash tool, computer use runs on your actual desktop with access to the apps you approve. Built-in guardrails:

- **Per-app approval**: Claude can only control apps you've approved in the current session
- **Sentinel warnings**: apps granting shell, filesystem, or system settings access are flagged
- **Terminal excluded from screenshots**: Claude never sees your terminal window
- **Global escape**: `Esc` aborts computer use from anywhere (key press is consumed, so prompt injection can't use it to dismiss dialogs)
- **Lock file**: only one session can control your machine at a time

## Example Workflows

### Validate a Native Build

```text
Build the MenuBarStats target, launch it, open the preferences window,
and verify the interval slider updates the label. Screenshot the
preferences window when you're done.
```

Claude runs `xcodebuild`, launches the app, interacts with the UI, and reports findings.

### Reproduce a Layout Bug

```text
The settings modal clips its footer on narrow windows. Resize the app
window down until you can reproduce it, screenshot the clipped state,
then check the CSS for the modal container.
```

### Test a Simulator Flow

```text
Open the iOS Simulator, launch the app, tap through the onboarding
screens, and tell me if any screen takes more than a second to load.
```

## CLI vs Desktop App

| Feature            | Desktop                                        | CLI                             |
| ------------------ | ---------------------------------------------- | ------------------------------- |
| Platforms          | macOS and Windows                              | macOS only                      |
| Enable             | Toggle in Settings > General (Desktop app)     | Enable `computer-use` in `/mcp` |
| Denied apps list   | Configurable in Settings                       | Not yet available               |
| Auto-unhide toggle | Optional                                       | Always on                       |
| Dispatch           | Dispatch-spawned sessions can use computer use | Not applicable                  |

## Troubleshooting

| Issue                                              | Fix                                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Computer use is in use by another Claude session" | Finish or exit the other session. If it crashed, the lock releases automatically when Claude detects the process is gone                                  |
| macOS permissions prompt keeps reappearing         | Quit Claude Code completely and restart. Confirm your terminal app is listed in System Settings > Privacy & Security > Screen Recording                   |
| `computer-use` doesn't appear in `/mcp`            | Requires macOS, Claude Code v2.1.85+, Pro or Max plan, claude.ai auth (not Bedrock/Vertex/Foundry), and an interactive session (not `-p` non-interactive) |

## References

- [Computer Use (CLI)](https://code.claude.com/docs/en/computer-use)
- [Computer Use (Desktop)](https://code.claude.com/docs/en/desktop#let-claude-use-your-computer)
- [Claude in Chrome](https://code.claude.com/docs/en/chrome)
- [MCP Servers](https://code.claude.com/docs/en/mcp)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing)
- [Computer Use Safety Guide](https://support.claude.com/en/articles/14128542)
