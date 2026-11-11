# Backend stories (reference)

This folder holds a filtered view of the project backlog: the eight stories whose `Repo` is `Backend`. Cross-repo stories (`Both`) are not in this file because their work spans both repos; they live in the sibling repo's authoritative seeder:

- `germanflow-app/tools/seed/stories.json` — all 32 stories across both repos (129 points total)
- `germanflow-app/tools/seed/seed-github.mjs` — creates the GitHub Project and seeds issues into both repos

**Do not run a separate seeder from here.** The app-side script already creates backend-repo issues via its `--repo germanflow-backend` path. Running a second seeder would try to create a duplicate `GermanFlow` project.

## Stories that touch this repo but aren't listed here

Four `Both` stories involve backend work and are tracked in the app repo's seeder:

- **S1.1** — Protect repos and install agent kit (both repos' CI, hooks and CODEOWNERS)
- **S1.5** — Contract hand-off from version tag (backend publishes the contract; app consumes it)
- **S4.3** — Compound bulk-add (backend returns the composite block; app renders it)
- **S6.1** — Security pass (checklist run across both repos)

If you need to see the full cross-repo picture, open the app repo's `stories.json` or the GitHub Project.

## Totals (backend-only stories)

8 stories, 47 points. Breakdown by milestone:

| Milestone | Stories | Points |
| --- | --- | --- |
| M0 Data spike | 2 | 8 |
| M1 Foundations | 1 | 5 |
| M2 Add from dictionary | 3 | 24 |
| M4 Remaining content | 1 | 5 |
| M6 Release hardening | 1 | 5 |

M3 (Review loop) and M5 (Personal tools, backup, reminder) are app-only and excluded.

## Keeping it in sync

When the app-side `stories.json` changes, update this file by re-filtering: keep only entries where `repo` is `Backend`, and prune milestones that have zero backend stories left. Add the pruned `Both` IDs to the list above.

**Known drift (needs app-side update):** S1.4's acceptance criteria were tightened here to name the specific workflow files and jobs (`.github/workflows/ci-backend.yml`, `.github/workflows/security.yml`; `mvn verify` + OpenAPI diff; gitleaks + dependency review + actionlint). The authoritative copy in `germanflow-app/tools/seed/stories.json` still carries the shorter "Workflows ci-backend and security are green" phrasing; update it before re-seeding so the GitHub issue matches.
