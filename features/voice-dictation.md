---
title: Voice Dictation
description: Push-to-talk voice dictation that transcribes speech live into the prompt input.
category: surfaces
---

# Claude Code Voice Dictation

Use push-to-talk voice dictation to speak prompts instead of typing them. Speech is transcribed live into the prompt input, and you can mix voice and typing in the same message.

> Requires Claude Code v2.1.69 or later.

## Requirements

- **Authentication**: Claude.ai account only. Not available with API key, Bedrock, Vertex, or Foundry.
- **Local microphone**: Does not work in remote environments (Claude Code on the web, SSH). WSL requires WSLg (WSL2 on Windows 11).
- **Audio recording**: Built-in native module on macOS, Linux, and Windows. On Linux, falls back to `arecord` (ALSA) or `rec` (SoX) if the native module can't load.
- **Transcription**: Audio is streamed to Anthropic's servers. Not processed locally.

## Enabling Voice Dictation

```text
/voice
Voice mode enabled. Hold Space to record. Dictation language: en (/config to change).
```

Persists across sessions. Run `/voice` again to disable, or set in settings:

```json
{
  "voiceEnabled": true
}
```

First-time use triggers a microphone check. On macOS, this prompts for terminal microphone permission.

## Recording

Hold `Space` to start recording:

1. **Warmup**: Footer shows `keep holding...` while detecting held key via key-repeat
1. **Recording**: Live waveform displays, speech appears dimmed in prompt
1. **Release**: Transcript finalizes and inserts at cursor position

Single `Space` tap still types a space normally. Mix typing and dictation freely:

```text
> refactor the auth middleware to [hold Space, speak] use the new token validation helper
```

Transcription is tuned for coding vocabulary: `regex`, `OAuth`, `JSON`, `localhost`, etc. Your project name and git branch are added as recognition hints automatically.

## Push-to-Talk Key

Default is `Space`. Rebind in `~/.claude/keybindings.json`:

```json
{
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "meta+k": "voice:pushToTalk",
        "space": null
      }
    }
  ]
}
```

Modifier combinations (e.g., `meta+k`) start recording on the first keypress with no warmup. Avoid bare letter keys since they type during warmup.

## Dictation Language

Uses the `language` setting (same as Claude's response language). Defaults to English if unset.

```json
{
  "language": "japanese"
}
```

Supports BCP 47 codes or language names. If the language isn't supported, dictation falls back to English with a warning.

### Supported Languages

| Language   | Code | Language   | Code |
| ---------- | ---- | ---------- | ---- |
| Czech      | `cs` | Korean     | `ko` |
| Danish     | `da` | Norwegian  | `no` |
| Dutch      | `nl` | Polish     | `pl` |
| English    | `en` | Portuguese | `pt` |
| French     | `fr` | Russian    | `ru` |
| German     | `de` | Spanish    | `es` |
| Greek      | `el` | Swedish    | `sv` |
| Hindi      | `hi` | Turkish    | `tr` |
| Indonesian | `id` | Ukrainian  | `uk` |
| Italian    | `it` | Japanese   | `ja` |

## Troubleshooting

| Issue                                     | Fix                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| "Voice mode requires a Claude.ai account" | Run `/login` to sign in with Claude.ai (not API key or third-party provider) |
| "Microphone access is denied"             | Grant microphone permission in system settings, then run `/voice` again      |
| "No audio recording tool found" (Linux)   | Install SoX: `sudo apt-get install sox`                                      |
| Nothing happens when holding Space        | Ensure voice is enabled (`/voice`). Check terminal sends key-repeat events   |
| Transcription garbled or wrong language   | Set correct language in `/config`                                            |

## Sources

- [Voice Dictation](https://code.claude.com/docs/en/voice-dictation)
- [Keyboard Shortcuts](https://code.claude.com/docs/en/keybindings)
- [Settings](https://code.claude.com/docs/en/settings)
