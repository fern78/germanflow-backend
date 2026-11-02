## What and why
<one or two sentences. Link the plan file or ADR>

## Checklist
- [ ] Tests written first for logic-heavy changes, and all pass
- [ ] Typecheck, lint and formatting are clean
- [ ] STATUS.md and CHANGELOG.md updated
- [ ] PR description says `Closes #<issue>`
- [ ] ADR added if the change is hard to reverse or crosses components

## Security checklist (required for every PR)
- [ ] No string-built SQL
- [ ] No new dependency (or a one-line justification is below)
- [ ] No new network destination
- [ ] No new permission
- [ ] No secret or key-like string in the diff
- [ ] Touches a security trigger? If yes, security-reviewer findings are attached

## Justifications
<new dependency, permission or network destination, if any>