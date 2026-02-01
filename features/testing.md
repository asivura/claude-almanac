# Testing Claude Code Configurations

Validate Claude Code workspace configurations, skills, commands, and settings with automated testing.

## Why Test Claude Configurations?

| Benefit | Description |
|---------|-------------|
| **Catch errors early** | Validate JSON syntax, YAML frontmatter, and schema compliance |
| **Enforce standards** | Ensure skills and commands follow naming conventions |
| **CI/CD integration** | Run validation in pipelines before deployment |
| **Team consistency** | Shared validation rules across team members |

## Test Framework Architecture

```
.claude/tests/
├── pyproject.toml              # Project configuration
├── src/
│   └── claude_workspace_tests/
│       ├── schemas/            # JSON schemas for validation
│       │   └── __init__.py
│       └── validators/         # Validation logic
│           ├── config_validator.py
│           ├── skill_validator.py
│           └── workspace_validator.py
└── tests/
    ├── conftest.py             # Pytest fixtures
    ├── test_config_validation.py
    ├── test_skill_validation.py
    └── test_workspace_integration.py
```

## Quick Start

### 1. Create Project Structure

```bash
mkdir -p .claude/tests/src/claude_workspace_tests/{schemas,validators}
mkdir -p .claude/tests/tests
cd .claude/tests
```

### 2. Create pyproject.toml

```toml
[project]
name = "claude-workspace-tests"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "pytest>=9.0.0",
    "pytest-cov>=7.0.0",
    "jsonschema>=4.21.0",
    "pyyaml>=6.0.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.2.0",
    "mypy>=1.8.0",
    "types-PyYAML>=6.0.0",
    "types-jsonschema>=4.21.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "schema: JSON schema validation tests",
    "skills: Skill and command validation tests",
    "integration: Full workspace integration tests",
]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM", "S"]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101"]  # Allow assert in tests
```

### 3. Run Tests

```bash
uv sync
uv run pytest -v
```

______________________________________________________________________

## JSON Schemas

### settings.json Schema

```python
# .claude/tests/src/claude_workspace_tests/schemas/__init__.py

SETTINGS_SCHEMA: dict[str, object] = {
    "type": "object",
    "properties": {
        "alwaysThinkingEnabled": {"type": "boolean"},
        "permissions": {
            "type": "object",
            "properties": {
                "allow": {"type": "array", "items": {"type": "string"}},
                "deny": {"type": "array", "items": {"type": "string"}},
                "additionalDirectories": {"type": "array", "items": {"type": "string"}},
            },
        },
        "enableAllProjectMcpServers": {"type": "boolean"},
        "mcpServers": {"type": "object"},
        "hooks": {"type": "object"},
        "statusLine": {"type": "object"},
    },
}
```

### cd-context.json Schema (Multi-Repo Workspaces)

```python
CD_CONTEXT_SCHEMA: dict[str, object] = {
    "type": "object",
    "required": ["default_files"],
    "properties": {
        "default_files": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
        },
        "repos": {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "required": ["files", "summary"],
                "properties": {
                    "files": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                    "summary": {"type": "string", "minLength": 5},
                },
            },
        },
    },
}
```

### Skill Frontmatter Schema

```python
SKILL_FRONTMATTER_SCHEMA: dict[str, object] = {
    "type": "object",
    "required": ["name", "description"],
    "properties": {
        "name": {
            "type": "string",
            "pattern": "^[a-z][a-z0-9-]*$",  # lowercase, hyphens only
        },
        "description": {
            "type": "string",
            "minLength": 20,
        },
    },
}
```

______________________________________________________________________

## Config Validator

```python
# .claude/tests/src/claude_workspace_tests/validators/config_validator.py

import json
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from jsonschema import Draft7Validator, ValidationError

from ..schemas import CD_CONTEXT_SCHEMA, SETTINGS_SCHEMA


@dataclass
class ValidationResult:
    """Result of a validation check."""

    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class ConfigValidator:
    """Validates Claude Code configuration files."""

    def __init__(self, claude_dir: Path) -> None:
        self.claude_dir = claude_dir

    def validate_settings(self) -> ValidationResult:
        """Validate settings.json against schema."""
        settings_path = self.claude_dir / "settings.json"
        return self._validate_json_file(settings_path, SETTINGS_SCHEMA)

    def validate_cd_context(self) -> ValidationResult:
        """Validate cd-context.json against schema."""
        cd_context_path = self.claude_dir / "cd-context.json"
        return self._validate_json_file(cd_context_path, CD_CONTEXT_SCHEMA)

    def _validate_json_file(
        self, file_path: Path, schema: Mapping[str, Any]
    ) -> ValidationResult:
        """Validate a JSON file against a schema."""
        if not file_path.exists():
            return ValidationResult(valid=False, errors=[f"File not found: {file_path.name}"])

        try:
            with open(file_path) as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return ValidationResult(valid=False, errors=[f"Invalid JSON: {e}"])

        validator = Draft7Validator(dict(schema))
        errors = [
            f"{'.'.join(str(p) for p in e.path)}: {e.message}" if e.path else e.message
            for e in validator.iter_errors(data)
        ]

        return ValidationResult(valid=len(errors) == 0, errors=errors)
```

______________________________________________________________________

## Skill Validator

```python
# .claude/tests/src/claude_workspace_tests/validators/skill_validator.py

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft7Validator

from ..schemas import SKILL_FRONTMATTER_SCHEMA


@dataclass
class SkillValidationResult:
    """Result of skill validation."""

    valid: bool
    skill_name: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class SkillValidator:
    """Validates Claude Code skills and commands."""

    def __init__(self, claude_dir: Path) -> None:
        self.claude_dir = claude_dir
        self.skills_dir = claude_dir / "skills"
        self.commands_dir = claude_dir / "commands"

    def validate_skill(self, skill_dir: Path) -> SkillValidationResult:
        """Validate a single skill directory."""
        skill_md = skill_dir / "SKILL.md"
        skill_name = skill_dir.name

        if not skill_md.exists():
            return SkillValidationResult(
                valid=False,
                skill_name=skill_name,
                errors=["SKILL.md not found"],
            )

        content = skill_md.read_text()
        frontmatter = self._extract_frontmatter(content)

        if frontmatter is None:
            return SkillValidationResult(
                valid=False,
                skill_name=skill_name,
                errors=["Missing YAML frontmatter"],
            )

        # Validate frontmatter against schema
        errors, warnings = self._validate_frontmatter(frontmatter, skill_name)

        # Check content has meaningful instructions
        body = self._extract_body(content)
        if len(body) < 50:
            warnings.append("Content is very short (< 50 chars)")

        return SkillValidationResult(
            valid=len(errors) == 0,
            skill_name=skill_name,
            errors=errors,
            warnings=warnings,
        )

    def validate_all_skills(self) -> list[SkillValidationResult]:
        """Validate all skills in the skills directory."""
        results = []
        if self.skills_dir.exists():
            for skill_dir in self.skills_dir.iterdir():
                if skill_dir.is_dir():
                    results.append(self.validate_skill(skill_dir))
        return results

    def _extract_frontmatter(self, content: str) -> dict[str, Any] | None:
        """Extract YAML frontmatter from markdown content."""
        match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if not match:
            return None
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None

    def _extract_body(self, content: str) -> str:
        """Extract body content after frontmatter."""
        match = re.match(r"^---\n.*?\n---\n?(.*)", content, re.DOTALL)
        return match.group(1).strip() if match else content.strip()

    def _validate_frontmatter(
        self, frontmatter: dict[str, Any], skill_name: str
    ) -> tuple[list[str], list[str]]:
        """Validate frontmatter against schema."""
        errors: list[str] = []
        warnings: list[str] = []

        validator = Draft7Validator(dict(SKILL_FRONTMATTER_SCHEMA))
        for error in validator.iter_errors(frontmatter):
            errors.append(error.message)

        # Check name matches directory
        if "name" in frontmatter and frontmatter["name"] != skill_name:
            warnings.append(f"Name '{frontmatter['name']}' doesn't match directory '{skill_name}'")

        return errors, warnings
```

______________________________________________________________________

## Test Examples

### Config Validation Tests

```python
# .claude/tests/tests/test_config_validation.py

import json
from pathlib import Path

import pytest

from claude_workspace_tests.validators import ConfigValidator


@pytest.fixture
def temp_claude_dir(tmp_path: Path) -> Path:
    """Create a temporary .claude directory."""
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir()
    return claude_dir


class TestConfigValidator:
    """Tests for ConfigValidator."""

    @pytest.mark.schema
    def test_validate_valid_settings(self, temp_claude_dir: Path) -> None:
        """Test validation of valid settings.json."""
        settings = {"alwaysThinkingEnabled": True}
        (temp_claude_dir / "settings.json").write_text(json.dumps(settings))

        validator = ConfigValidator(temp_claude_dir)
        result = validator.validate_settings()

        assert result.valid is True
        assert len(result.errors) == 0

    @pytest.mark.schema
    def test_validate_invalid_settings_type(self, temp_claude_dir: Path) -> None:
        """Test validation catches type errors."""
        settings = {"alwaysThinkingEnabled": "not a boolean"}
        (temp_claude_dir / "settings.json").write_text(json.dumps(settings))

        validator = ConfigValidator(temp_claude_dir)
        result = validator.validate_settings()

        assert result.valid is False
        assert len(result.errors) > 0

    @pytest.mark.schema
    def test_validate_missing_settings(self, temp_claude_dir: Path) -> None:
        """Test validation handles missing file."""
        validator = ConfigValidator(temp_claude_dir)
        result = validator.validate_settings()

        assert result.valid is False
        assert "not found" in result.errors[0].lower()

    @pytest.mark.schema
    def test_validate_invalid_json_syntax(self, temp_claude_dir: Path) -> None:
        """Test validation catches JSON syntax errors."""
        (temp_claude_dir / "settings.json").write_text("{invalid json}")

        validator = ConfigValidator(temp_claude_dir)
        result = validator.validate_settings()

        assert result.valid is False
        assert "invalid json" in result.errors[0].lower()
```

### Skill Validation Tests

```python
# .claude/tests/tests/test_skill_validation.py

from pathlib import Path

import pytest

from claude_workspace_tests.validators import SkillValidator


@pytest.fixture
def temp_skills_dir(tmp_path: Path) -> Path:
    """Create a temporary skills directory."""
    claude_dir = tmp_path / ".claude"
    skills_dir = claude_dir / "skills"
    skills_dir.mkdir(parents=True)
    return skills_dir


class TestSkillValidator:
    """Tests for SkillValidator."""

    @pytest.mark.skills
    def test_validate_valid_skill(self, temp_skills_dir: Path) -> None:
        """Test validation of valid skill."""
        skill_dir = temp_skills_dir / "my-skill"
        skill_dir.mkdir()

        skill_content = """---
name: my-skill
description: A skill that does something useful for the user
---

# My Skill

Instructions for using this skill go here.
"""
        (skill_dir / "SKILL.md").write_text(skill_content)

        validator = SkillValidator(temp_skills_dir.parent)
        result = validator.validate_skill(skill_dir)

        assert result.valid is True
        assert len(result.errors) == 0

    @pytest.mark.skills
    def test_validate_skill_missing_frontmatter(self, temp_skills_dir: Path) -> None:
        """Test validation catches missing frontmatter."""
        skill_dir = temp_skills_dir / "bad-skill"
        skill_dir.mkdir()
        (skill_dir / "SKILL.md").write_text("# No Frontmatter\n\nJust content.")

        validator = SkillValidator(temp_skills_dir.parent)
        result = validator.validate_skill(skill_dir)

        assert result.valid is False
        assert "frontmatter" in result.errors[0].lower()

    @pytest.mark.skills
    def test_validate_skill_missing_required_fields(self, temp_skills_dir: Path) -> None:
        """Test validation catches missing required fields."""
        skill_dir = temp_skills_dir / "incomplete-skill"
        skill_dir.mkdir()

        skill_content = """---
name: incomplete-skill
---

# Missing Description

This skill has no description field.
"""
        (skill_dir / "SKILL.md").write_text(skill_content)

        validator = SkillValidator(temp_skills_dir.parent)
        result = validator.validate_skill(skill_dir)

        assert result.valid is False
        assert any("description" in e.lower() for e in result.errors)
```

### Integration Tests

```python
# .claude/tests/tests/test_workspace_integration.py

import os
from pathlib import Path

import pytest

from claude_workspace_tests.validators import WorkspaceValidator


def is_ci_environment() -> bool:
    """Check if running in CI environment."""
    return os.environ.get("CI", "").lower() == "true" or "GITLAB_CI" in os.environ


@pytest.fixture
def workspace_root() -> Path:
    """Get the actual workspace root directory."""
    # Adjust path traversal based on your test file location
    return Path(__file__).parent.parent.parent.parent


class TestWorkspaceIntegration:
    """Integration tests for the complete workspace."""

    @pytest.mark.integration
    def test_workspace_has_settings(self, workspace_root: Path) -> None:
        """Test that workspace has a settings.json file."""
        settings_path = workspace_root / ".claude" / "settings.json"
        assert settings_path.exists(), "settings.json not found"

    @pytest.mark.integration
    def test_workspace_has_skills(self, workspace_root: Path) -> None:
        """Test that workspace has at least one skill."""
        skills_dir = workspace_root / ".claude" / "skills"
        if not skills_dir.exists():
            pytest.skip("Skills directory not found")

        skills = list(skills_dir.iterdir())
        assert len(skills) > 0, "No skills found in workspace"

    @pytest.mark.integration
    def test_external_repos_exist(self, workspace_root: Path) -> None:
        """Test external repos exist (skip in CI)."""
        if is_ci_environment():
            pytest.skip("Skipped in CI - external repos not available")

        # Add your external repo validation here
        pass
```

______________________________________________________________________

## CI/CD Integration

### GitLab CI Configuration

```yaml
# .gitlab-ci.yml

variables:
  PYENV_VERSION: "3.12.1"
  UV_INDEX_URL: "https://pypi.org/simple"
  UV_CACHE_DIR: ".uv-cache"

default:
  image: python:3.12-slim
  cache:
    key: uv-${CI_COMMIT_REF_SLUG}
    paths:
      - .uv-cache
      - .claude/tests/.venv
  before_script:
    - pip install --no-cache-dir uv

stages:
  - quality
  - test

# Validate JSON configuration files
validate-json:
  stage: quality
  script:
    - cd .claude/tests
    - uv sync --quiet
    - |
      uv run python -c "
      import json
      from pathlib import Path
      configs = ['../../.claude/settings.json', '../../.mcp.json']
      for c in configs:
          p = Path(c)
          if p.exists():
              json.load(open(p))
              print(f'OK {p.name}')
      "

# Validate skill frontmatter
validate-skills:
  stage: quality
  script:
    - pip install --no-cache-dir pyyaml
    - |
      python3 << 'EOF'
      import re
      import yaml
      from pathlib import Path

      skills_dir = Path('.claude/skills')
      errors = []

      for skill_dir in skills_dir.iterdir():
          if skill_dir.is_dir():
              skill_md = skill_dir / 'SKILL.md'
              if skill_md.exists():
                  content = skill_md.read_text()
                  match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
                  if not match:
                      errors.append(f'{skill_dir.name}: Missing frontmatter')
                      continue
                  try:
                      fm = yaml.safe_load(match.group(1))
                      if 'name' not in fm:
                          errors.append(f'{skill_dir.name}: Missing name')
                      if 'description' not in fm:
                          errors.append(f'{skill_dir.name}: Missing description')
                      else:
                          print(f'OK {skill_dir.name}')
                  except yaml.YAMLError as e:
                      errors.append(f'{skill_dir.name}: Invalid YAML: {e}')

      if errors:
          for e in errors:
              print(f'ERROR: {e}')
          exit(1)
      EOF

# Python linting
ruff:lint:
  stage: quality
  script:
    - cd .claude/tests
    - uv sync --quiet --extra dev
    - uv run ruff check src/ tests/

# Type checking
mypy:
  stage: quality
  script:
    - cd .claude/tests
    - uv sync --quiet --extra dev
    - uv run mypy src/

# Run test suite
pytest:
  stage: test
  script:
    - cd .claude/tests
    - uv sync --quiet
    - uv run pytest --junitxml=../../report.xml --cov -v
  artifacts:
    when: always
    reports:
      junit: report.xml
```

### GitHub Actions Configuration

```yaml
# .github/workflows/validate.yml

name: Validate Claude Config

on:
  push:
    paths:
      - '.claude/**'
  pull_request:
    paths:
      - '.claude/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: |
          cd .claude/tests
          uv sync

      - name: Validate JSON configs
        run: |
          cd .claude/tests
          uv run python -c "
          import json
          from pathlib import Path
          for f in ['settings.json', 'cd-context.json']:
              p = Path('../' + f)
              if p.exists():
                  json.load(open(p))
                  print(f'OK {f}')
          "

      - name: Run tests
        run: |
          cd .claude/tests
          uv run pytest -v
```

______________________________________________________________________

## Pre-commit Hooks

```yaml
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: check-json
      - id: check-yaml

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.4
    hooks:
      - id: ruff
        args: [--fix]
        files: ^\.claude/tests/
      - id: ruff-format
        files: ^\.claude/tests/
```

______________________________________________________________________

## Running Tests

```bash
# Navigate to test directory
cd .claude/tests

# Install dependencies
uv sync

# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test categories
uv run pytest -m schema       # Schema validation tests
uv run pytest -m skills       # Skill/command tests
uv run pytest -m integration  # Full workspace tests

# Run with coverage
uv run pytest --cov=claude_workspace_tests --cov-report=html
```

______________________________________________________________________

## Best Practices

### Test Organization

| Category | Marker | Tests |
|----------|--------|-------|
| Schema validation | `schema` | JSON schema compliance |
| Skill validation | `skills` | Frontmatter, naming, content |
| Integration | `integration` | Full workspace checks |

### CI Environment Detection

Skip tests that require external resources in CI:

```python
import os

def is_ci_environment() -> bool:
    return os.environ.get("CI", "").lower() == "true" or "GITLAB_CI" in os.environ

@pytest.mark.integration
def test_external_repos(self, workspace_root: Path) -> None:
    if is_ci_environment():
        pytest.skip("Skipped in CI")
    # Test external repo access
```

### Schema Evolution

When updating configuration formats:

1. Update the schema in `schemas/__init__.py`
2. Add tests for new fields
3. Run validation locally before committing
4. Update CI pipeline if needed

______________________________________________________________________

## See Also

- [Settings](./settings.md) - Configuration options being validated
- [Skills](./skills.md) - Skill format and frontmatter
- [Memory & Context](./memory-context.md) - CLAUDE.md structure
- [Headless/SDK](./headless-sdk.md) - CI/CD automation
