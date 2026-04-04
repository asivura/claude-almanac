# Claude Code Checkpointing

Claude Code automatically tracks file edits as you work, allowing you to quickly undo changes and rewind to previous states.

## How Checkpoints Work

As you work with Claude, checkpointing captures the state of your code before each edit. This safety net lets you pursue ambitious, wide-scale tasks knowing you can always return to a prior code state.

### Automatic Tracking

- Every user prompt creates a new checkpoint
- Checkpoints persist across sessions (accessible in resumed conversations)
- Automatically cleaned up along with sessions after 30 days (configurable)
- Only tracks changes made by Claude's file editing tools (not bash commands)

### Opening the Rewind Menu

Press `Esc` twice (`Esc` + `Esc`) or use the `/rewind` command. A scrollable list shows each of your prompts from the session.

### Rewind Actions

Select a point in the session, then choose an action:

| Action                            | Code reverted | Conversation reverted | Notes                                       |
| --------------------------------- | ------------- | --------------------- | ------------------------------------------- |
| **Restore code and conversation** | Yes           | Yes                   | Full rewind to that point                   |
| **Restore conversation**          | No            | Yes                   | Keeps current code, rewinds chat            |
| **Restore code**                  | Yes           | No                    | Reverts files, keeps conversation           |
| **Summarize from here**           | No            | Compressed            | Replaces messages with AI-generated summary |
| **Never mind**                    | No            | No                    | Returns to message list                     |

After restoring conversation or summarizing, the original prompt from the selected message is restored into the input field so you can re-send or edit it.

### Restore vs. Summarize

The three restore options revert state. **Summarize from here** works differently:

- Messages before the selected point stay intact
- The selected message and all subsequent messages are replaced with a compact AI-generated summary
- No files on disk are changed
- Original messages are preserved in the session transcript (Claude can still reference them)
- You can type optional instructions to guide what the summary focuses on

This is similar to `/compact`, but targeted: you keep early context in full detail and only compress the parts using up space.

> To branch off and try a different approach while preserving the original session intact, use fork instead (`claude --continue --fork-session`).

## VS Code Integration

The VS Code extension supports checkpoints with hover-based rewind. Hover over any message to reveal the rewind button, then choose:

- **Fork conversation from here**: Start a new conversation branch from this message while keeping all code changes
- **Rewind code to here**: Revert file changes back to this point while keeping the full conversation history
- **Fork conversation and rewind code**: Start a new branch and revert file changes to this point

## Common Use Cases

- **Exploring alternatives**: Try different implementations without losing your starting point
- **Recovering from mistakes**: Quickly undo changes that introduced bugs or broke functionality
- **Iterating on features**: Experiment with variations knowing you can revert to working states
- **Freeing context space**: Summarize a verbose debugging session from the midpoint forward, keeping initial instructions intact

## Limitations

### Bash Command Changes Not Tracked

Checkpointing does not track files modified by bash commands:

```bash
rm file.txt
mv old.txt new.txt
cp source.txt dest.txt
```

These file modifications cannot be undone through rewind. Only direct file edits made through Claude's file editing tools are tracked.

### External Changes Not Tracked

Only files edited within the current session are tracked. Manual changes you make outside of Claude Code and edits from other concurrent sessions are normally not captured, unless they modify the same files as the current session.

### Not a Replacement for Version Control

Checkpoints are designed for quick, session-level recovery:

- Continue using Git for commits, branches, and long-term history
- Think of checkpoints as "local undo" and Git as "permanent history"
- Checkpoints complement but don't replace proper version control

## References

- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)
- [Built-in Commands](https://code.claude.com/docs/en/commands)
