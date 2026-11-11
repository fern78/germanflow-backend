# STATUS

Read this first in every session. Update it before the session ends.

## Now
- Phase: pre-M1 (agent kit, docs and project ritual files only; no code yet)
- Branch: `chore/agent-kit-and-parity`
- No active story

## Next
1. Start **M0 Data spike** — S0.1: fetch real German data and write fixtures.
2. S0.2: mapping report and go/no-go ADR; update the brief's content model from findings.
3. **M1 Foundations** — S1.1 (protect both repos, seed the GitHub Project, install agent kit) and S1.4 (backend Maven skeleton, first CI workflows, non-root Dockerfile).

## Blocked
- **CI workflows do not yet exist.** `.github/workflows/` is absent from the repo. The brief and `CLAUDE.md` reference `ci-backend`, `security`, `ingest` and `deploy-backend`, but none run today. That means branch protection has no status checks to require, and the brief's "security baseline" story (gitleaks, GitHub dependency review, actionlint, OpenAPI contract diff, Docker image scan) is **aspirational until those workflow files land**. This is normal for pre-M1 — no code has been written yet — and is tracked by: **S1.4** for `ci-backend` + `security`, **S6.3** for `deploy-backend`, and the M0/M2 work that first needs `ingest`.

## Recently merged (last 10)
- (none merged to `main` yet)

## Pending decisions
- none. Open items live in the Decision log of the brief.
