# STATUS

Read this first in every session. Update it before the session ends.

## Now
- Phase: M0 Data spike. S0.1 fixtures landed.
- Branch: `feat/s0.1-fetch-german-data-fixtures` (to be merged via PR into `main`).
- Active story: **S0.2** — mapping report + go/no-go ADR (next).
- Backlog lives in `TASKS.txt` at the repo root (no GitHub Project).

## Next
1. Merge the S0.1 PR.
2. **S0.2** — mapping report and go/no-go ADR; update the brief's content model from findings (5 pts).
3. **S1.4** — Maven skeleton, first CI workflows, non-root Dockerfile (5 pts).

## Done this phase
- Repo made **public** so the free plan can offer branch protection and secret scanning.
- `main` protected: PR required (0 approvals — solo repo), no force pushes, no deletions, conversation resolution required. CODEOWNERS file kept for notifications; review not enforced.
- Secret scanning + push protection **enabled**.
- CODEOWNERS header comment cleaned (file already pointed at `@fern78`).
- `guard-paths` hook verified: out-of-scope file edit → exit 2, blocked.
- GitHub Project + issue seeding **dropped** (half-run deleted). Tracking moved to `TASKS.txt` until the overhead is justified.
- **S0.1 fixtures landed** in `fixtures/kaikki/` (15 JSON files, ~400 KB). Dump: kaikki.org German extract, 295.8 MB gzipped, no checksum. See `fixtures/kaikki/README.md` for schema + two findings that feed S0.2.

## Blocked
- **CI workflows do not yet exist.** `.github/workflows/` is absent. The brief and `CLAUDE.md` reference `ci-backend`, `security`, `ingest` and `deploy-backend`, but none run today. Branch protection currently requires no status checks — this is deliberate for the pre-M1 window. Tracked by: **S1.4** (`ci-backend` + `security`), **S6.3** (`deploy-backend`), and M0/M2 work that first needs `ingest`.

## Recently merged (last 10)
- (none merged to `main` yet)

## Pending decisions
- Open items live in the Decision log of `docs/brief.md`.
