# Claude Code Rules

Modular, topic-specific instruction files for organizing project guidelines.

## Overview

Rules are markdown files in `.claude/rules/` that extend the CLAUDE.md memory system. Instead of one large file, you can organize instructions into focused, maintainable modules.

### Rules vs CLAUDE.md

| Aspect      | CLAUDE.md                          | Rules                         |
| ----------- | ---------------------------------- | ----------------------------- |
| Structure   | Single monolithic file             | Multiple focused files        |
| Use case    | Project overview, main conventions | Topic-specific guidelines     |
| Scalability | Gets unwieldy in large projects    | Better for team collaboration |
| Loading     | Always loaded                      | Can be path-conditional       |

**Key principle**: Rules complement CLAUDE.md, they don't replace it.

______________________________________________________________________

## File Locations

### Project Rules (Team-Shared)

```
your-project/
└── .claude/
    └── rules/
        ├── code-style.md
        ├── testing.md
        └── frontend/
            └── react.md
```

- **Location**: `./.claude/rules/*.md`
- **Scope**: Current project only
- **Sharing**: Via git (commit to source control)
- **Discovery**: Recursive - all `.md` files in subdirectories

### User Rules (Personal)

```
~/.claude/
└── rules/
    ├── preferences.md
    └── workflows.md
```

- **Location**: `~/.claude/rules/*.md`
- **Scope**: All your projects
- **Sharing**: Personal only
- **Use case**: Personal coding preferences

______________________________________________________________________

## Precedence Hierarchy

From highest to lowest priority:

| Priority | Source                           | Notes                   |
| -------- | -------------------------------- | ----------------------- |
| 1        | Managed policy CLAUDE.md         | Organization-controlled |
| 2        | Project rules (`.claude/rules/`) | Team standards          |
| 3        | Project CLAUDE.md                | Shared instructions     |
| 4        | User rules (`~/.claude/rules/`)  | Personal fallback       |
| 5        | User CLAUDE.md                   | Personal global         |

Project rules override user rules, allowing teams to enforce standards.

______________________________________________________________________

## File Format

### Basic Structure

```markdown
# Rule Title

Your markdown instructions here...
```

### With Path Conditions

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

Instructions that only apply to API files...
```

### Frontmatter Options

| Field   | Type  | Required | Purpose                               |
| ------- | ----- | -------- | ------------------------------------- |
| `paths` | Array | No       | Glob patterns for conditional loading |

Rules without `paths` are loaded unconditionally for all files.

______________________________________________________________________

## Path-Conditional Rules

Scope rules to specific file types using glob patterns.

### Basic Example

```markdown
---
paths:
  - "src/components/**/*.tsx"
---

# React Component Guidelines

- Use functional components with hooks
- Keep components under 300 lines
```

This rule only loads when working on `.tsx` files in `src/components/`.

### Glob Pattern Reference

| Pattern             | Matches                          |
| ------------------- | -------------------------------- |
| `**/*.ts`           | All `.ts` files in any directory |
| `src/**/*`          | All files under `src/`           |
| `*.md`              | Markdown files in root only      |
| `src/**/*.{ts,tsx}` | Both `.ts` and `.tsx` files      |
| `{src,lib}/**/*.ts` | Files in either `src/` or `lib/` |

### Multiple Patterns

```markdown
---
paths:
  - "src/**/*.ts"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---

# TypeScript Guidelines
```

Rule loads if current file matches **any** pattern.

______________________________________________________________________

## How Rules Are Loaded

1. **Session start**: Claude discovers all `.md` files in `.claude/rules/` recursively
1. **Path evaluation**: Rules with `paths` are checked against current file
1. **Context merge**: All applicable rules combined with CLAUDE.md
1. **Injection**: Combined instructions provided to Claude

### View Loaded Rules

```bash
/memory    # Shows all loaded memory files including rules
```

______________________________________________________________________

## Directory Organization

### Recommended Structure

```
.claude/
├── CLAUDE.md                    # Main project overview
└── rules/
    ├── code-style.md            # Coding style and formatting
    ├── testing.md               # Testing conventions
    ├── security.md              # Security requirements
    ├── frontend/
    │   ├── react.md             # React-specific rules
    │   ├── styling.md           # CSS conventions
    │   └── accessibility.md     # A11y requirements
    └── backend/
        ├── api.md               # API design standards
        ├── database.md          # Database conventions
        └── authentication.md    # Auth rules
```

### Naming Conventions

- **Descriptive names**: `react-hooks.md` not `frontend.md`
- **One topic per file**: Keep rules focused
- **Lowercase with hyphens**: `api-design.md`
- **Numbered prefixes** (optional): `00-base.md`, `10-api.md` if order matters

______________________________________________________________________

## Rule Examples

### Frontend Rules

**`.claude/rules/frontend/react.md`**

```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
---

# React Component Guidelines

## Structure
- Use functional components with hooks
- Colocate styles using CSS modules
- Keep components under 300 lines

## Hooks
- Never call hooks conditionally
- Extract custom hooks for reusable logic
- Use useCallback for functions passed to children

## Props
- Use TypeScript interfaces for props
- Destructure props in function signature
```

### Backend/API Rules

**`.claude/rules/backend/api.md`**

````markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/routes/**/*.ts"
---

# API Design Standards

## Endpoints
- Use RESTful naming: `/api/v1/{resource}/{id}`
- Version all endpoints

## Error Format
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {}
}
````

## Validation

- Validate all inputs with zod/joi
- Return 400 with validation errors

````

### Testing Rules

**`.claude/rules/testing.md`**

```markdown
# Testing Conventions

## Unit Tests
- Minimum 80% code coverage
- File naming: `[feature].test.ts`
- Structure: Arrange-Act-Assert

## Integration Tests
- Location: `tests/integration/`
- Clean up database after each test

## Test Data
- Use fixtures in `tests/fixtures/`
- Use factories for test objects
````

### Security Rules

**`.claude/rules/security.md`**

```markdown
# Security Requirements

## Authentication
- Require auth for all protected endpoints
- Use JWT with 24-hour expiration
- Implement refresh token rotation

## Data Protection
- Never log passwords, tokens, PII
- Encrypt data at rest and in transit
- Use parameterized queries (prevent SQL injection)

## Dependencies
- Run `npm audit` before deployment
- Pin dependency versions
```

### Language-Specific Rules

**`.claude/rules/languages/python.md`**

```markdown
---
paths:
  - "scripts/**/*.py"
  - "tools/**/*.py"
---

# Python Guidelines

## Style
- Follow PEP 8
- Use type hints for all functions
- Line length: 88 characters (Black)

## Structure
- Use dataclasses for simple data
- Use pathlib.Path instead of os.path
- Use f-strings for formatting
```

______________________________________________________________________

## Commands

| Command   | Purpose                                    |
| --------- | ------------------------------------------ |
| `/memory` | View all loaded memory (CLAUDE.md + rules) |
| `/init`   | Create initial CLAUDE.md                   |

There are no dedicated `/rules` commands. Rules are managed by creating/editing files directly.

### Creating Rules

```bash
# Create rules directory
mkdir -p .claude/rules

# Create a rule file
touch .claude/rules/testing.md

# Create organized subdirectories
mkdir -p .claude/rules/backend
touch .claude/rules/backend/database.md
```

______________________________________________________________________

## Sharing Rules Across Projects

### Using Symlinks

```bash
# Symlink a shared rules directory
ln -s ~/shared-claude-rules .claude/rules/shared

# Symlink individual files
ln -s ~/company-standards/security.md .claude/rules/security.md
```

Symlinks are resolved and contents loaded normally.

______________________________________________________________________

## Best Practices

### Do

- **One topic per file**: Keep rules focused and maintainable
- **Use descriptive filenames**: Clearly indicate what the rule covers
- **Organize with subdirectories**: Group by domain (`frontend/`, `backend/`)
- **Use path conditions sparingly**: Only when rules truly apply to specific files
- **Commit to git**: Share project rules with team

### Don't

- **Don't duplicate CLAUDE.md**: Rules complement, not replace
- **Don't create huge rule files**: Keep them focused
- **Don't use unsupported frontmatter**: Only `paths` is documented
- **Don't create thousands of files**: Discovery has overhead

______________________________________________________________________

## Limitations

| Limitation             | Details                                              |
| ---------------------- | ---------------------------------------------------- |
| No explicit ordering   | Files load in filesystem order (likely alphabetical) |
| Glob patterns only     | No regex support for `paths`                         |
| No conflict resolution | Contradicting rules both load; Claude reconciles     |
| Context usage          | Each rule consumes tokens; monitor with `/context`   |
| Import depth           | Max 5 hops for nested imports from CLAUDE.md         |

______________________________________________________________________

## Rules vs Related Features

| Feature        | Rules                    | Skills             | Hooks                   |
| -------------- | ------------------------ | ------------------ | ----------------------- |
| **Purpose**    | Guidelines/memory        | Runnable workflows | Automated actions       |
| **Invocation** | Automatic                | `/skill-name`      | On events               |
| **Location**   | `.claude/rules/`         | `.claude/skills/`  | `.claude/settings.json` |
| **Loading**    | Always (or path-matched) | On invocation      | On trigger              |

______________________________________________________________________

## Quick Start

1. **Create rules directory**:

   ```bash
   mkdir -p .claude/rules
   ```

1. **Add your first rule**:

   ```bash
   cat > .claude/rules/testing.md << 'EOF'
   # Testing Conventions

   - Use Jest for unit tests
   - Minimum 80% coverage
   - Colocate tests with source files
   EOF
   ```

1. **Add a path-conditional rule**:

   ```bash
   cat > .claude/rules/api.md << 'EOF'
   ---
   paths:
     - "src/api/**/*.ts"
   ---

   # API Standards

   - Use RESTful conventions
   - Validate all inputs
   - Return consistent error format
   EOF
   ```

1. **Verify rules are loaded**:

   ```bash
   /memory
   ```

## References

- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory.md)
- [Memory & Context Guide](./memory-context.md)
