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
