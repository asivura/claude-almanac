# Claude Code Additional Features

Lesser-known but powerful features for advanced workflows.

## GitHub Actions Integration

Official Claude Code Action for CI/CD automation.

### Basic Setup

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "Review this PR for security issues"
    claude_args: "--max-turns 10 --model opus"
```

### Capabilities

- Responds to `@claude` mentions in PRs and issues
- Interactive mode (responds to mentions) and automation mode
- Implements features, fixes bugs, creates PRs
- Supports scheduled workflows via cron
- Works with AWS Bedrock, Google Vertex AI, Microsoft Foundry

[Documentation](https://code.claude.com/docs/en/github-actions.md)

______________________________________________________________________

## Git Worktrees

Run parallel Claude Code sessions on different branches.

### Setup

```bash
git worktree add ../project-feature-a -b feature-a
cd ../project-feature-a
claude
```

### Benefits

- Each worktree has isolated file state
- Sessions grouped by git branch in `/resume`
- Perfect for long-running tasks

[Documentation](https://code.claude.com/docs/en/common-workflows.md#run-parallel-claude-code-sessions-with-git-worktrees)

______________________________________________________________________

## Image and Screenshot Handling

Claude Code has multimodal capabilities.

### Methods

- **Paste**: `Ctrl+V` (note: not `Cmd+V`)
- **macOS screenshot**: `Cmd+Ctrl+Shift+4` to clipboard, then `Ctrl+V`
- **Drag and drop**: Directly into terminal
- **File reference**: "Analyze this image: /path/to/image.png"

### Use Cases

- Analyze UI designs → generate CSS/HTML
- Debug from error screenshots
- Extract data from diagrams
- Interpret visual documentation

[Documentation](https://code.claude.com/docs/en/common-workflows.md#work-with-images)

______________________________________________________________________

## Jupyter Notebook Support

Native `.ipynb` file support.

### Capabilities

- Read and write notebooks directly
- Interpret cell outputs (text, images, charts)
- Convert exploratory code to production scripts
- Examine intermediate results

### Recommended Workflow

Open VS Code side-by-side with Claude Code and Jupyter notebook.

______________________________________________________________________

## Plan Mode

Safety-first analysis without code changes.

### What It Does

- Read-only operations only
- Creates comprehensive plan before changes
- Presents proposed changes for approval

### Activation

```bash
# During session
Shift+Tab  # Press twice

# New session
claude --permission-mode plan

# Headless
claude --permission-mode plan -p "Your prompt"
```

### Best For

- Multi-file implementations
- Sensitive projects
- Learning new codebases

[Documentation](https://code.claude.com/docs/en/common-workflows.md#use-plan-mode-for-safe-code-analysis)

______________________________________________________________________

## Session Management

Sophisticated conversation persistence.

### Commands

```bash
claude --resume auth-refactor     # Resume by name
claude --continue                 # Resume most recent
/resume                          # Session picker
/rename my-session               # Name current session
```

### Session Picker Shortcuts

| Key | Action                             |
| --- | ---------------------------------- |
| `P` | Preview session content            |
| `R` | Rename session                     |
| `B` | Filter to current branch           |
| `A` | Toggle current dir vs all projects |
| `/` | Search/filter sessions             |

[Documentation](https://code.claude.com/docs/en/common-workflows.md#resume-previous-conversations)

______________________________________________________________________

## Cost Tracking

Comprehensive usage monitoring.

### Commands

```bash
/cost   # Token usage statistics (API users)
/stats  # Usage patterns and streaks
```

### OpenTelemetry Integration

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
```

Tracks: sessions, tokens, commits, PRs, cost per model.

### Cost Reduction Tips

- `/clear` between unrelated tasks
- Use Sonnet over Opus for most tasks
- Reduce MCP server overhead
- Move CLAUDE.md details to skills

[Documentation](https://code.claude.com/docs/en/costs.md)

______________________________________________________________________

## Task Lists

Visual task tracking during sessions.

### Usage

- `Ctrl+T` toggles task view (up to 10 tasks)
- Tasks persist across context compaction
- Share across sessions: `CLAUDE_CODE_TASK_LIST_ID=my-project claude`
- `/todos` lists TODO items

______________________________________________________________________

## Background Commands

Async execution while continuing conversation.

### Usage

```bash
! npm test     # Bash mode
Ctrl+B         # Background it (Tmux: press twice)
/tasks         # View background tasks
```

### Disable

```bash
export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1
```

______________________________________________________________________

## Extended Thinking

Deep reasoning for complex problems.

### Toggle

- `Option+T` (macOS) / `Alt+T` (Windows/Linux)
- Configure globally via `/config`
- Limit budget: `MAX_THINKING_TOKENS=10000`

### View

- Press `Ctrl+O` for verbose mode
- Thinking appears as gray italic text

### Best For

- Complex architectural decisions
- Challenging bugs
- Multi-step planning
- Evaluating tradeoffs

______________________________________________________________________

## Chrome Browser Integration

Control local web applications.

### Setup

Install Chrome extension, then:

```bash
claude --chrome
```

### Capabilities

- Debug with console logs
- Automate form filling
- Draft content in Google Docs
- Extract data from web pages
- Test local web applications
- Record demo GIFs

[Documentation](https://code.claude.com/docs/en/chrome.md)

______________________________________________________________________

## Slack Integration

Mention `@Claude` in Slack threads.

### Capabilities

- Automatic repository detection
- Creates Claude Code sessions on web
- Returns pull requests in thread
- Bug report → PR workflow

[Documentation](https://code.claude.com/docs/en/slack.md)

______________________________________________________________________

## Desktop Preview

Native desktop app with GUI.

### Features

- Multiple isolated coding sessions
- Built-in Git worktree support
- Launch local or cloud sessions
- Browser control integration

[Documentation](https://code.claude.com/docs/en/desktop.md)

______________________________________________________________________

## Remote Development

### DevContainers

```bash
# Provides isolated environment
# Multi-layered security
# Network isolation with whitelisted domains
```

### Web Sessions

```bash
claude --remote "Fix the login bug"  # Create web session
claude --teleport                    # Resume web session locally
```

[Documentation](https://code.claude.com/docs/en/devcontainer.md)

______________________________________________________________________

## Output Format Control

### Formats

```bash
--output-format text        # Plain text (default)
--output-format json        # Full JSON with metadata
--output-format stream-json # Real-time JSON streaming
```

### Example

```bash
cat data.txt | claude -p 'summarize' --output-format json > analysis.json
```

______________________________________________________________________

## Context Visualization

### Commands

```bash
/context  # Shows what's consuming context as colored grid
/compact  # Manually trigger compaction
/compact focus on API changes  # Compaction with focus
```

______________________________________________________________________

## Reverse History Search

`Ctrl+R` for interactive search:

1. Type query (highlighted in results)
1. `Ctrl+R` again to cycle matches
1. `Tab` to continue editing
1. `Enter` to execute

______________________________________________________________________

## Vim Mode

Enable with `/vim` or configure via `/config`.

### Supported Features

- Mode switching: `Esc`, `i/I/a/A/o/O`
- Navigation: `h/j/k/l`, `w/e/b`, `0/$`, `gg/G`
- Editing: `x`, `dd`, `dw`, `cc`, `cw`, `.`
- Text objects: `iw/aw`, `i"/a"`, `i(/a(`
- Yank/paste: `yy`, `yw`, `p/P`

## References

- [Common Workflows](https://code.claude.com/docs/en/common-workflows.md)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode.md)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions.md)
- [Chrome Integration](https://code.claude.com/docs/en/chrome.md)
- [Desktop Preview](https://code.claude.com/docs/en/desktop.md)
