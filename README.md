# germanflow-backend

Stateless read-only dictionary API for GermanFlow, plus the ingestion job that builds `dictionary.sqlite` from the kaikki.org Wiktionary dump. Java 21, Spring Boot 3.x, Maven.

The companion mobile app lives in a separate repo, `germanflow-app`.

## Status

Pre-M1. The repo currently holds the brief, the agent kit and the project ritual files; the Maven modules (`dictionary-core`, `ingest`, `api`) land in milestone M1. See `STATUS.md` for the current task and phase, and `docs/brief.md` § Roadmap for the full build order.

## Prerequisites

- JDK 21.
- Git.
- No system Maven needed — the Maven wrapper (`./mvnw`) is committed with the project in M1.
- No AI or LLM API keys are needed anywhere in this project.

## Quick start (available after M1 lands)

```bash
# build, unit tests, golden mapper tests, style checks
./mvnw -q verify

# run the API against the fixture dictionary (localhost:8080)
./mvnw -pl api spring-boot:run

# run ingestion on a kaikki dump
./mvnw -pl ingest exec:java -Dexec.args="<dump-path>"
```

Local development uses a small fixture dictionary built from committed fixtures. The real Wiktionary dump is only needed by the monthly `ingest` workflow, never for day-to-day development.

## Where to read next

| If you are… | Read |
| --- | --- |
| New to the project | `docs/brief.md` — the design blueprint (product, data, API, security, roadmap, risks) |
| An AI coding agent | `CLAUDE.md` — modules, non-negotiables, conventions and allowed commands |
| Looking for current work | `STATUS.md` — active task, next steps, blockers |
| Planning a change | `docs/plans/` — one plan file per change |
| Looking at past decisions | `docs/decisions/` — ADRs; `docs/brief.md` § Decision log for the full list |
| Tracking releases | `CHANGELOG.md` |

## Contributing

- Every change goes through a PR; `main` is branch-protected.
- `docs/brief.md` § Match the ritual to the change tells you whether a plan file, a reviewer agent and/or a security review are needed.
- End each PR body with `Closes #<issue>`.

## License

Private repository; no license file until the owner publishes.
