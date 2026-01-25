# Claude Code Built-in Tools Reference

Complete reference for all default tools available in Claude Code CLI.

______________________________________________________________________

## Overview

Claude Code provides **18 built-in tools** organized into six categories:

| Category               | Tools                                      |
| ---------------------- | ------------------------------------------ |
| File Operations        | Read, Write, Edit, MultiEdit, NotebookEdit |
| Search & Discovery     | Glob, Grep, LS                             |
| Execution              | Bash, KillShell                            |
| Web & Network          | WebFetch, WebSearch                        |
| Task Management        | Task, TodoWrite                            |
| Planning & Interaction | ExitPlanMode, AskUserQuestion, Skill       |

______________________________________________________________________

## File Operations

### Read

**Purpose:** Read file contents from the filesystem.

**Parameters:**

| Parameter   | Type   | Required | Description                       |
| ----------- | ------ | -------- | --------------------------------- |
| `file_path` | string | Yes      | Absolute path to the file         |
| `offset`    | number | No       | Line number to start reading from |
| `limit`     | number | No       | Number of lines to read           |

**Behavior:**

- Reads up to 2000 lines by default
- Returns content with line numbers (`cat -n` format)
- Truncates lines longer than 2000 characters
- Can read images (PNG, JPG) and display them visually
- Can read PDFs with text and visual content extraction
- Can read Jupyter notebooks (.ipynb) with all cells and outputs

**Best Practices:**

- Always use absolute paths, not relative paths
- Use `offset` and `limit` for files larger than 2000 lines
- Read files before using Edit or Write tools
- Combine with Grep for targeted reading

**Example:**

```
Read /Users/project/src/main.js
Read /Users/project/data.json offset=100 limit=50
```

______________________________________________________________________

### Write

**Purpose:** Create new files or completely overwrite existing files.

**Parameters:**

| Parameter   | Type   | Required | Description                |
| ----------- | ------ | -------- | -------------------------- |
| `file_path` | string | Yes      | Absolute path for the file |
| `content`   | string | Yes      | Complete content to write  |

**Behavior:**

- Overwrites entire file content (not append)
- Creates parent directories if needed
- Creates a checkpoint before writing (allows revert)
- Requires permission (ask/allow in settings)

**Best Practices:**

- Use for creating new files from scratch
- Use Edit tool instead for modifying existing files
- Must Read existing files before overwriting
- Never use bash echo/cat for file writing

**Permission Required:** Yes

______________________________________________________________________

### Edit

**Purpose:** Make targeted replacements in files without overwriting the entire file.

**Parameters:**

| Parameter     | Type    | Required | Description                              |
| ------------- | ------- | -------- | ---------------------------------------- |
| `file_path`   | string  | Yes      | Absolute path to the file                |
| `old_string`  | string  | Yes      | Exact text to find and replace           |
| `new_string`  | string  | Yes      | Replacement text                         |
| `replace_all` | boolean | No       | Replace all occurrences (default: false) |

**Behavior:**

- Performs exact text matching (case-sensitive, whitespace-sensitive)
- Fails if `old_string` is not unique (unless `replace_all` is true)
- Creates checkpoint before editing
- Shows context around changes

**Best Practices:**

- Must Read the file first before editing
- Preserve exact indentation from the file
- Include surrounding context to make `old_string` unique
- Use `replace_all` for renaming variables across the file

**Permission Required:** Yes

**Example:**

```
Edit /path/to/file.js
  old_string: "function oldName()"
  new_string: "function newName()"
```

______________________________________________________________________

### MultiEdit

**Purpose:** Make multiple sequential find-and-replace operations in a single file atomically.

**Parameters:**

| Parameter   | Type   | Required | Description               |
| ----------- | ------ | -------- | ------------------------- |
| `file_path` | string | Yes      | Absolute path to the file |
| `edits`     | array  | Yes      | Array of edit operations  |

Each edit in the array contains:

- `old_string`: Text to find
- `new_string`: Replacement text

**Behavior:**

- Applies all edits sequentially in order
- Atomic operation (all succeed or all fail)
- Single checkpoint for all edits

**Best Practices:**

- Use for multiple related changes in one file
- More efficient than multiple Edit calls
- Order matters - edits apply sequentially

**Permission Required:** Yes

______________________________________________________________________

### NotebookEdit

**Purpose:** Modify Jupyter notebook cells (.ipynb files).

**Parameters:**

| Parameter       | Type   | Required | Description                            |
| --------------- | ------ | -------- | -------------------------------------- |
| `notebook_path` | string | Yes      | Absolute path to .ipynb file           |
| `new_source`    | string | Yes      | New content for the cell               |
| `cell_id`       | string | No       | ID of the cell to edit                 |
| `cell_type`     | string | No       | Type: `code` or `markdown`             |
| `edit_mode`     | string | No       | Mode: `replace`, `insert`, or `delete` |

**Behavior:**

- `replace`: Replace cell content (default)
- `insert`: Add new cell after specified cell_id
- `delete`: Remove the specified cell
- Preserves notebook structure and metadata

**Best Practices:**

- Use for Jupyter notebook modifications
- Maintain logical flow between cells
- Test notebook with kernel after modifications

**Permission Required:** Yes

______________________________________________________________________

## Search & Discovery

### Glob

**Purpose:** Find files matching glob patterns without searching file contents.

**Parameters:**

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| `pattern` | string | Yes      | Glob pattern (e.g., `**/*.js`)        |
| `path`    | string | No       | Directory to search in (default: cwd) |

**Supported Patterns:**

| Pattern | Matches                                  |
| ------- | ---------------------------------------- |
| `*`     | Any characters except `/`                |
| `**`    | Any characters including `/` (recursive) |
| `?`     | Single character                         |
| `[abc]` | Character class                          |
| `{a,b}` | Alternatives                             |

**Behavior:**

- Returns file paths sorted by modification time
- Works with any codebase size
- Fast file discovery

**Best Practices:**

- Use before Read for efficient file discovery
- Perform multiple searches in parallel when useful
- Use `**/*` for recursive search

**Permission Required:** No

**Examples:**

```
Glob pattern="**/*.js"                    # All JavaScript files
Glob pattern="src/**/*.ts"                # TypeScript in src/
Glob pattern="**/test/**/*.spec.js"       # Test spec files
Glob pattern="*.{js,ts,jsx,tsx}"          # Multiple extensions
```

______________________________________________________________________

### Grep

**Purpose:** Search file contents using regex patterns (powered by ripgrep).

**Parameters:**

| Parameter     | Type    | Required | Description                                           |
| ------------- | ------- | -------- | ----------------------------------------------------- |
| `pattern`     | string  | Yes      | Regex pattern to search for                           |
| `path`        | string  | No       | File or directory to search                           |
| `output_mode` | string  | No       | `files_with_matches` (default), `content`, or `count` |
| `type`        | string  | No       | File type filter (js, py, rust, go, etc.)             |
| `glob`        | string  | No       | Glob pattern filter (e.g., `*.tsx`)                   |
| `-i`          | boolean | No       | Case-insensitive search                               |
| `-n`          | boolean | No       | Show line numbers (default: true in content mode)     |
| `-A`          | number  | No       | Lines to show after match                             |
| `-B`          | number  | No       | Lines to show before match                            |
| `-C`          | number  | No       | Lines to show before and after match                  |
| `multiline`   | boolean | No       | Enable multiline matching                             |
| `head_limit`  | number  | No       | Limit output to first N entries                       |
| `offset`      | number  | No       | Skip first N entries                                  |

**Output Modes:**

| Mode                 | Returns                     |
| -------------------- | --------------------------- |
| `files_with_matches` | File paths only (default)   |
| `content`            | Matching lines with context |
| `count`              | Match count per file        |

**Behavior:**

- Uses ripgrep (highly optimized)
- Full regex syntax support
- NEVER use bash `grep` or `rg` - always use this tool

**Best Practices:**

- Use `files_with_matches` for initial discovery
- Use `content` mode with `-C` for context
- Combine with `type` or `glob` to narrow scope
- Use `head_limit` to avoid overwhelming output

**Permission Required:** No

**Examples:**

```
Grep pattern="function.*auth" type="js"           # Auth functions in JS
Grep pattern="TODO|FIXME" output_mode="content"   # Find TODOs with context
Grep pattern="import.*React" glob="**/*.jsx"      # React imports
Grep pattern="class.*Error" -C=3                  # Error classes with context
```

______________________________________________________________________

### LS

**Purpose:** List directory contents.

**Parameters:**

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `path`    | string | Yes      | Absolute path to directory |
| `ignore`  | array  | No       | Glob patterns to ignore    |

**Behavior:**

- Lists files and directories at the specified path
- Can filter out patterns with ignore parameter

**Best Practices:**

- Use for exploring directory structure
- Use Glob instead for pattern-based file finding
- Never use bash `ls` command

**Permission Required:** No

______________________________________________________________________

## Execution

### Bash

**Purpose:** Execute shell commands in a persistent bash session.

**Parameters:**

| Parameter           | Type    | Required | Description                          |
| ------------------- | ------- | -------- | ------------------------------------ |
| `command`           | string  | Yes      | Shell command(s) to execute          |
| `description`       | string  | No       | Description of what the command does |
| `timeout`           | number  | No       | Timeout in ms (max 600000 / 10 min)  |
| `run_in_background` | boolean | No       | Run command in background            |

**Behavior:**

- Working directory persists across commands
- Environment variables do NOT persist between commands
- Default timeout: 120000ms (2 minutes)
- Output truncated if exceeds 30000 characters
- Supports pipes, redirects, and complex shell syntax

**Best Practices:**

- Use `&&` to chain dependent commands
- Use absolute paths in scripts
- Quote file paths with spaces: `cd "/path with spaces"`
- Use for: git, npm, docker, pytest, build tools
- NEVER use for: find, grep, cat, head, tail, sed, awk, echo

**Prohibited Commands:**
Use dedicated tools instead:

| Instead of            | Use   |
| --------------------- | ----- |
| `find`                | Glob  |
| `grep`, `rg`          | Grep  |
| `cat`, `head`, `tail` | Read  |
| `sed`, `awk`          | Edit  |
| `echo >`, `cat <<EOF` | Write |

**Permission Required:** Yes (configurable with patterns)

**Examples:**

```bash
Bash command="npm test"
Bash command="git status"
Bash command="cd /project && npm install && npm run build"
Bash command="python script.py" timeout=300000
Bash command="npm run dev" run_in_background=true
```

______________________________________________________________________

### KillShell

**Purpose:** Stop a running background bash shell.

**Parameters:**

| Parameter  | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| `shell_id` | string | Yes      | ID of the background shell |

**Behavior:**

- Stops background bash execution
- Cleans up task tracking
- Shell IDs visible with `/tasks` command

**Permission Required:** Yes

______________________________________________________________________

## Web & Network

### WebFetch

**Purpose:** Fetch and analyze content from URLs.

**Parameters:**

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `url`     | string | Yes      | Fully-formed valid URL            |
| `prompt`  | string | Yes      | Question/prompt about the content |

**Behavior:**

- Automatically upgrades HTTP to HTTPS
- Converts HTML to markdown
- Processes content with small, fast AI model
- 15-minute cache for repeated access
- Handles redirects (provides new URL to fetch)

**Best Practices:**

- Provide clear, specific prompts
- Use for documentation and reference material
- If redirected to different host, make new request with redirect URL

**Permission Required:** Yes

**Example:**

```
WebFetch url="https://docs.example.com/api" prompt="List available endpoints"
WebFetch url="https://github.com/user/repo" prompt="What is the project purpose?"
```

______________________________________________________________________

### WebSearch

**Purpose:** Search the web for current information.

**Parameters:**

| Parameter         | Type   | Required | Description                             |
| ----------------- | ------ | -------- | --------------------------------------- |
| `query`           | string | Yes      | Search query (min 2 characters)         |
| `allowed_domains` | array  | No       | Only include results from these domains |
| `blocked_domains` | array  | No       | Exclude results from these domains      |

**Behavior:**

- Returns search results with markdown hyperlinks
- Provides up-to-date information beyond knowledge cutoff
- Only available in the US

**Best Practices:**

- Include year in queries for recent information
- Use domain filtering for specific sources
- Always cite sources in responses

**Permission Required:** Yes

**Example:**

```
WebSearch query="React 2026 best practices"
WebSearch query="Claude API updates" allowed_domains=["anthropic.com"]
```

______________________________________________________________________

## Task Management

### Task

**Purpose:** Launch specialized sub-agents for complex, multi-step tasks.

**Parameters:**

| Parameter           | Type    | Required | Description                         |
| ------------------- | ------- | -------- | ----------------------------------- |
| `prompt`            | string  | Yes      | Task description for the agent      |
| `description`       | string  | Yes      | Short summary (3-5 words)           |
| `subagent_type`     | string  | Yes      | Type of agent to use                |
| `model`             | string  | No       | Model: `sonnet`, `opus`, or `haiku` |
| `run_in_background` | boolean | No       | Run agent in background             |
| `resume`            | string  | No       | Agent ID to resume from             |

**Available Agent Types:**

| Type                | Purpose                 | Tools                                 |
| ------------------- | ----------------------- | ------------------------------------- |
| `Bash`              | Command execution       | Bash                                  |
| `Explore`           | Codebase exploration    | All except Edit, Write, Task          |
| `Plan`              | Implementation planning | All except Edit, Write, Task          |
| `general-purpose`   | Multi-step research     | All tools                             |
| `claude-code-guide` | Claude Code questions   | Glob, Grep, Read, WebFetch, WebSearch |

**Behavior:**

- Spawns agent with fresh, isolated context
- Agent context doesn't bloat main conversation
- Returns summarized results when complete
- Can be resumed with agent ID

**Best Practices:**

- Use for complex tasks requiring multiple steps
- Launch multiple agents in parallel when possible
- Use `Explore` agent for codebase searches
- Use `haiku` model for quick, simple tasks

**Permission Required:** No

**Example:**

```
Task subagent_type="Explore" description="Find auth handlers"
  prompt="Find all files that handle user authentication"

Task subagent_type="Plan" description="Plan refactoring"
  prompt="Create a plan to refactor the database module"
```

______________________________________________________________________

### TodoWrite

**Purpose:** Create and manage structured task lists for tracking progress.

**Parameters:**

| Parameter | Type  | Required | Description         |
| --------- | ----- | -------- | ------------------- |
| `todos`   | array | Yes      | Array of todo items |

Each todo item contains:

| Field        | Type   | Required | Description                              |
| ------------ | ------ | -------- | ---------------------------------------- |
| `content`    | string | Yes      | Task description (imperative form)       |
| `activeForm` | string | Yes      | Present continuous form                  |
| `status`     | string | Yes      | `pending`, `in_progress`, or `completed` |

**Behavior:**

- Exactly ONE task should be `in_progress` at a time
- Mark tasks complete immediately after finishing
- Task list visible in UI

**When to Use:**

- Complex multi-step tasks (3+ steps)
- User provides multiple tasks
- Non-trivial implementations
- After receiving new instructions

**When NOT to Use:**

- Single, straightforward tasks
- Trivial operations (< 3 steps)
- Purely conversational requests

**Permission Required:** No

**Example:**

```json
{
  "todos": [
    {"content": "Run tests", "activeForm": "Running tests", "status": "completed"},
    {"content": "Fix type errors", "activeForm": "Fixing type errors", "status": "in_progress"},
    {"content": "Update documentation", "activeForm": "Updating documentation", "status": "pending"}
  ]
}
```

______________________________________________________________________

## Planning & Interaction

### ExitPlanMode

**Purpose:** Signal completion of planning phase and request user approval.

**Parameters:**

| Parameter        | Type  | Required | Description                          |
| ---------------- | ----- | -------- | ------------------------------------ |
| `allowedPrompts` | array | No       | Bash permissions needed for the plan |

**Behavior:**

- Reads plan from the plan file (already written)
- Signals readiness for user review
- Can request semantic permissions for bash commands

**Best Practices:**

- Write plan to plan file before calling
- Use for implementation tasks requiring approval
- Request specific, scoped permissions

**Permission Required:** Yes (user approval)

______________________________________________________________________

### AskUserQuestion

**Purpose:** Ask users questions to gather requirements or clarify ambiguity.

**Parameters:**

| Parameter   | Type  | Required | Description              |
| ----------- | ----- | -------- | ------------------------ |
| `questions` | array | Yes      | Array of questions (1-4) |

Each question contains:

| Field         | Type    | Required | Description                |
| ------------- | ------- | -------- | -------------------------- |
| `question`    | string  | Yes      | The question to ask        |
| `header`      | string  | Yes      | Short label (max 12 chars) |
| `options`     | array   | Yes      | 2-4 answer options         |
| `multiSelect` | boolean | Yes      | Allow multiple selections  |

Each option contains:

| Field         | Type   | Required | Description               |
| ------------- | ------ | -------- | ------------------------- |
| `label`       | string | Yes      | Display text (1-5 words)  |
| `description` | string | Yes      | Explanation of the option |

**Behavior:**

- Users can always select "Other" for custom input
- Use `multiSelect: true` for non-mutually-exclusive choices
- Put recommended option first with "(Recommended)" suffix

**Best Practices:**

- Use sparingly to avoid interrupting workflow
- Provide clear, specific questions
- Offer reasonable default choices

**Permission Required:** No

______________________________________________________________________

### Skill

**Purpose:** Execute a custom skill (slash command) within the conversation.

**Parameters:**

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `skill`   | string | Yes      | Skill name (e.g., `commit`, `review-pr`) |
| `args`    | string | No       | Arguments for the skill                  |

**Behavior:**

- Invokes skill immediately as first action
- Only uses skills listed in available skills
- Does not invoke already-running skills

**Permission Required:** Varies by skill

______________________________________________________________________

## Permission Configuration

### Permission Modes

Toggle with `Shift+Tab`:

| Mode        | Behavior                                          |
| ----------- | ------------------------------------------------- |
| Default     | Ask before file edits and shell commands          |
| Auto-Accept | Edit files without asking, still ask for commands |
| Plan        | Read-only tools only, creates plan for approval   |

### Configuring Permissions

In `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(git:*)",
      "Write(src/**)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Read(.env*)"
    ]
  }
}
```

### Permission Patterns

| Pattern         | Matches                       |
| --------------- | ----------------------------- |
| `Tool`          | All uses of the tool          |
| `Tool(pattern)` | Specific command/path pattern |
| `Tool(*:*)`     | All uses with any arguments   |
| `Bash(git:*)`   | Git subcommands only          |
| `Write(src/**)` | Write to src/ directory only  |

______________________________________________________________________

## Quick Reference

| Tool            | Category    | Permission | Best For                    |
| --------------- | ----------- | ---------- | --------------------------- |
| Read            | Files       | No         | Reading files, images, PDFs |
| Write           | Files       | Yes        | Creating new files          |
| Edit            | Files       | Yes        | Targeted file modifications |
| MultiEdit       | Files       | Yes        | Multiple edits in one file  |
| NotebookEdit    | Files       | Yes        | Jupyter notebook changes    |
| Glob            | Search      | No         | Finding files by pattern    |
| Grep            | Search      | No         | Searching file contents     |
| LS              | Search      | No         | Listing directories         |
| Bash            | Execution   | Yes        | Running commands            |
| KillShell       | Execution   | Yes        | Stopping background tasks   |
| WebFetch        | Web         | Yes        | Fetching URL content        |
| WebSearch       | Web         | Yes        | Searching the internet      |
| Task            | Task Mgmt   | No         | Running sub-agents          |
| TodoWrite       | Task Mgmt   | No         | Tracking progress           |
| ExitPlanMode    | Planning    | Yes        | Completing plans            |
| AskUserQuestion | Interaction | No         | Gathering user input        |
| Skill           | Interaction | Varies     | Running custom commands     |

______________________________________________________________________

## Sources

**Official:**

- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)

**Community references** (unofficial, may be outdated):

- [Claude Code Built-in Tools Reference](https://www.vtrivedy.com/posts/claudecode-tools-reference)
- [Claude Code Tools and System Prompt](https://gist.github.com/wong2/e0f34aac66caf890a332f7b6f9e2ba8f)
