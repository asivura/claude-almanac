# Branch protection setup

One-time setup commands for `main` branch protection on `asivura/claude-almanac`.

## Required checks

- `Validate PR Title`
- `Validate Commits`
- `Check Markdown Format`

A `Build Site` check will be added once the Fumadocs site in `site/` has a build workflow merged. Update the `contexts[]` list in the command below when that happens.

## Apply protection

```bash
gh api repos/asivura/claude-almanac/branches/main/protection -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=Validate PR Title" \
  -f "required_status_checks[contexts][]=Validate Commits" \
  -f "required_status_checks[contexts][]=Check Markdown Format" \
  -f "enforce_admins=true" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=false" \
  -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
  -f "required_pull_request_reviews[required_approving_review_count]=0" \
  -f "restrictions=null"
```

## Verify

```bash
gh api repos/asivura/claude-almanac/branches/main/protection \
  | jq '.required_status_checks.contexts'
```

Expected output:

```json
[
  "Validate PR Title",
  "Validate Commits",
  "Check Markdown Format"
]
```
