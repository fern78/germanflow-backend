---
name: change-ritual
description: Use before starting any change (edit, fix, feature, PR) to pick the right process for its size and check whether it hits a security trigger. Trigger phrases include "I'm about to change", "before I edit", "what process", "small fix", "feature across files", "security review needed".
---

# Change ritual

Pick a process by change size, then check the security triggers. Do this before any edit, not after.

## Process by size

| Change | Process |
| --- | --- |
| Trivial (typo, copy, one-line config) | Edit directly. CI is the gate. |
| Small (one file, no contract or security impact) | `backend-dev` agent, then CI. |
| Normal (feature across files) | Plan, tests first, `backend-dev`, `reviewer`, owner PR review. |
| Sensitive (any security trigger below) | Normal, plus `security-reviewer` and explicit owner review. |

## Pre-flight checks (every change)

1. Read `STATUS.md` first. Update it before you finish.
2. If the change touches more than one file and there is no plan in `docs/plans/`, ask the owner for one.
3. For logic-heavy changes, write tests first.
4. Keep changes small: one logical change per commit, one per PR.
5. Open questions live in the decision log in `docs/brief.md`. Do not pick a default for an Open item — ask the owner.
6. One plan implements one story. A PR ends with `Closes #<issue>`.

## Security triggers

Any of these promotes the change to **Sensitive** and requires `security-reviewer`:

- The ingestion importer or kaikki mapper.
- Input validation.
- Rate limiting.
- API controllers.
- Anything that builds SQL.
- `Dockerfile`.
- `.github/**`.
- Android manifest and `app.json` permissions.
- Dependency manifests and lockfiles (`pom.xml`, `package.json`, etc.).
- `.claude/**`.
