# STATUS

Read this first in every session. Update it before the session ends.

## Now
- Phase: M0 Data spike **done**. Entering M1.
- Branch: `feat/s0.2-mapping-report-and-adr` (to be merged via PR into `main`).
- Active story: **S1.4** — Maven skeleton + CI + Dockerfile (next).
- Backlog lives in `TASKS.txt` at the repo root (no GitHub Project).

## Next
1. Merge the S0.2 PR.
2. **S1.4** — Maven skeleton (`dictionary-core`, `ingest`, `api` modules), first CI workflows, non-root Dockerfile (5 pts). Gates G1–G9 and the Appendix-A mapping tables land as tests here or in S2.1.
3. **S2.1** — noun mapper + ingest job that builds `dictionary.sqlite` with the FTS5 index; golden-file tests for Haus, Band, Milch, Haustürschlüssel (8 pts).

## Done this phase
- Repo made **public** so the free plan can offer branch protection and secret scanning.
- `main` protected: PR required (0 approvals — solo repo), no force pushes, no deletions, conversation resolution required. CODEOWNERS file kept for notifications; review not enforced.
- Secret scanning + push protection **enabled**.
- CODEOWNERS header comment cleaned (file already pointed at `@fern78`).
- `guard-paths` hook verified: out-of-scope file edit → exit 2, blocked.
- GitHub Project + issue seeding **dropped** (half-run deleted). Tracking moved to `TASKS.txt` until the overhead is justified.
- **S0.1 fixtures landed** in `fixtures/kaikki/` (15 JSON files, ~400 KB). Dump: kaikki.org German extract, 295.8 MB gzipped, no checksum. See `fixtures/kaikki/README.md`.
- **S0.2 go/no-go**: GO. `docs/decisions/001-m0-data-spike-go-no-go.md` records the mapping report (every POS, kaikki → record field, derivation rules), the reflexive-verb decision (lemma-level boolean + `reflexivePattern`), ingestion-gate thresholds G1–G9, and pre-gate filtering rules. Brief updated: `VERB.reflexivePattern` added; `NOUN.composite` marked best-effort; `NOUN.plural` nullable for *singulare tantum*.

## Blocked
- **CI workflows do not yet exist.** `.github/workflows/` is absent. The brief and `CLAUDE.md` reference `ci-backend`, `security`, `ingest` and `deploy-backend`, but none run today. Branch protection currently requires no status checks — this is deliberate for the pre-M1 window. Tracked by: **S1.4** (`ci-backend` + `security`), **S6.3** (`deploy-backend`), and M0/M2 work that first needs `ingest`.

## Recently merged (last 10)
- (none merged to `main` yet)

## Pending decisions
- Open items live in the Decision log of `docs/brief.md`.
