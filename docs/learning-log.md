# Learning log

One entry per iteration, newest last. Written by the agents, read by the owner. Format: see the `learning-note` skill in `.claude/skills/learning-note/`.

## 2026-11-02 Slim CLAUDE.md, add learning-note and change-ritual skills

- **What I did**: Rewrote `CLAUDE.md` to only hold always-true conventions (down from ~95 to ~50 lines). Moved the Learning-note format and the Ritual-by-size table into two new skills under `.claude/skills/`. Added permission guards in `.claude/settings.json` for `pom.xml`, `.env`, `docs/brief.md`, and `gh pr merge`. Fixed a bug in all five agent files where the `MultiEdit` tool silently bypassed the path guard.
- **Why it helps**: `CLAUDE.md` loads on every request, so procedural content there taxes every turn. Procedures in skills load only when their trigger fires. Prose rules promoted to `deny`/`ask` cannot be forgotten by the model.
- **Concepts to know**:
  - Skills: packaged instructions loaded on trigger, kept at `.claude/skills/<name>/SKILL.md`. See `.claude/skills/learning-note/SKILL.md`.
  - Permission rules: `deny` blocks, `ask` interrupts, `allow` pre-approves. See `.claude/settings.json`.
  - Hook matchers: `Edit` and `MultiEdit` are distinct tool names — a matcher must list both. See the `PreToolUse` block in `.claude/agents/backend-dev.md`.
- **Try it yourself**: In a fresh session, try to edit `docs/brief.md` — you should see an ask prompt. Then try `gh pr merge 1` — it should be denied outright.

## 2026-11-02 Parity port from germanflow-app: brief, backend stories, hooks, finish-iteration

- **What I did**: Synced `docs/brief.md` from the sibling app repo. Added `tools/seed/stories.json` + README with the 12 backend-relevant stories. Ported three hooks (`session-start-status`, `block-commit-to-main`, Maven-flavoured `block-banned-deps`), a `finish-iteration` skill, and `references/` side files for `learning-note`. Wired the hooks via a new `hooks` block in `.claude/settings.json`.
- **Why it helps**: SessionStart injects STATUS.md without needing a trigger phrase. The commit-to-main hook catches what the push-deny misses. `finish-iteration` makes end-of-change one named step.
- **Concepts to know**:
  - SessionStart hook: stdout `additionalContext` prepends to the model's context. See `.claude/hooks/session-start-status.js`.
  - Skill side files: `references/*` keep `SKILL.md` lean. See `.claude/skills/learning-note/references/example.md`.
- **Try it yourself**: `echo '{"tool_input":{"file_path":"pom.xml","content":"com.anthropic"}}' | node .claude/hooks/block-banned-deps.js; echo "exit=$?"` prints the block with `exit=2`.

## 2026-11-11 S0.1 kaikki.org German-extract fixtures

- **What I did**: Downloaded the 295.8 MB gzipped German slice of kaikki.org's Wiktionary extract into the session scratchpad, streamed it with a one-shot Python extractor, and committed 15 small JSON fixtures covering every POS plus the brief's special cases (compound, homograph, separable, reflexive, *singulare tantum*) under `fixtures/kaikki/`. README documents schema, source URL and two surprises for S0.2: reflexivity is **per-sense** (`senses[*].tags: ["reflexive"]`) not per-lemma, and Band has 5 entries, not 3.
- **Why it helps**: unblocks S0.2 (mapping report + go/no-go) and S2.1 (noun mapper golden tests) with real data the ingest job will see, without checking in 2.9 GB of untrusted content.
- **Concepts to know**:
  - *Singulare tantum*: a noun with no plural form (Milch, Obst). The record model's `plural` must allow `null`.
  - Reflexive verbs in kaikki: stored under the plain lemma (`freuen`), reflexivity flagged on individual senses — the same entry can mix transitive and reflexive senses.
  - Untrusted downloads: keep them in their own directory, run readers with `python -I` so a planted `json.py` can't hijack imports.
- **Try it yourself**: `py -3 fixtures/kaikki/extract_fixtures.py <path-to-de-extract.jsonl.gz> ./out` — or just open `fixtures/kaikki/haustuerschluessel.json` to see the compound-noun shape.

## 2026-11-11 S0.2 mapping report, go decision, and ADR 001

- **What I did**: inspected every fixture field-by-field against the brief's content model, then wrote `docs/decisions/001-m0-data-spike-go-no-go.md` — an ADR with a mapping table for every POS (kaikki source + derivation rule + null fallback), the reflexive-verb storage rule, the inflected-form table design, and the ingestion gates G1–G9 (acceptable share of entries missing each required field). Decision: **go**. Updated `docs/brief.md`'s content model: added `VERB.reflexivePattern`, marked `NOUN.composite` best-effort, called out that `NOUN.plural` is null for *singulare tantum*.
- **Why it helps**: S1.4 (Maven skeleton) and S2.1 (noun mapper) can start without re-deriving these calls from raw fixtures. Golden tests in S2.1 can assert G1–G9 as code, not prose.
- **Concepts to know**:
  - **ADR (Architecture Decision Record)**: a short Markdown file under `docs/decisions/` that captures *why* a reversible-but-expensive decision was made. Future-us re-reading it should understand the trade-off without re-running the spike.
  - **Golden fixture + derivation rule**: the fixture is the known input; the derivation rule is the exact kaikki field + tag pattern the mapper reads. Both are needed before a golden test can be written.
  - **Deterministic reflexive rule**: a reflexive verb's infinitive form in kaikki already carries `sich` (e.g. `sich freuen`). Deriving `reflexive: boolean` from that single string is deterministic and matches a learner's mental model — better than a majority-of-senses rule that would mislabel `laufen`.
- **Try it yourself**: open `docs/decisions/001-m0-data-spike-go-no-go.md` and find a word in `fixtures/kaikki/` (say `haus.json`), then trace: `tags: ["neuter"]` → `gender: n` → `article: das`, and `forms[nominative,plural][0].form` → `plural: "Häuser"`. Those two chains are the shape every S2.1 golden test will assert.
