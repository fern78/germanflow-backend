# STATUS

Read this first in every session. Update it before the session ends.

## Now
- Phase: M0 Data spike (starting). No code yet.
- Branch: `chore/s1.1-protect-and-seed` (to be merged via PR into `main`).
- Active story: **S0.1** — fetch German data and write fixtures.
- Backlog lives in `TASKS.txt` at the repo root (no GitHub Project).

## Next
1. Merge the current branch (protect + TASKS.txt + CODEOWNERS cleanup).
2. **S0.1** — fetch German data and write fixtures (3 pts).
3. **S0.2** — mapping report and go/no-go ADR; update the brief's content model from findings (5 pts).
4. **S1.4** — Maven skeleton, first CI workflows, non-root Dockerfile (5 pts).

## Done this phase
- Repo made **public** so the free plan can offer branch protection and secret scanning.
- `main` protected: PR required, 1 approving review, CODEOWNERS review required, dismiss stale reviews, no force pushes, no deletions, conversation resolution required. Admin override on (owner can merge their own PRs).
- Secret scanning + push protection **enabled**.
- CODEOWNERS header comment cleaned (file already pointed at `@fern78`).
- `guard-paths` hook verified: out-of-scope file edit → exit 2, blocked.
- GitHub Project + issue seeding **dropped** (half-run deleted). Tracking moved to `TASKS.txt` until the overhead is justified.

## Blocked
- **CI workflows do not yet exist.** `.github/workflows/` is absent. The brief and `CLAUDE.md` reference `ci-backend`, `security`, `ingest` and `deploy-backend`, but none run today. Branch protection currently requires no status checks — this is deliberate for the pre-M1 window. Tracked by: **S1.4** (`ci-backend` + `security`), **S6.3** (`deploy-backend`), and M0/M2 work that first needs `ingest`.

## Recently merged (last 10)
- (none merged to `main` yet)

## Pending decisions
- **CODEOWNERS self-review friction on solo PRs.** `require_code_owner_reviews` is on. Owner can bypass via admin "Merge without approval" each time. Consider relaxing once a team of one is confirmed long-term. Open in the Decision log of the brief if it bites.
- Open items live in the Decision log of `docs/brief.md`.
