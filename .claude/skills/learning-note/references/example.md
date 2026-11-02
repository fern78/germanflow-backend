# Worked example

A real Learning note from this repo (2026-11-02, after slimming CLAUDE.md and introducing the first two skills). Use it as a model for shape and tone, not content.

```
## 2026-11-02 Slim CLAUDE.md, add learning-note and change-ritual skills

- What I did: Rewrote `CLAUDE.md` to only hold always-true conventions (down from ~95 to ~50 lines). Moved the Learning-note format and the Ritual-by-size table into two new skills under `.claude/skills/`. Added permission guards in `.claude/settings.json` for `pom.xml`, `.env`, `docs/brief.md`, and `gh pr merge`. Fixed a bug in all five agent files where the `MultiEdit` tool silently bypassed the path guard.
- Why it helps: `CLAUDE.md` loads on every request, so procedural content there taxes every turn. Procedures in skills load only when their trigger fires. Prose rules promoted to `deny`/`ask` cannot be forgotten by the model.
- Concepts to know:
  - Skills: packaged instructions loaded on trigger, kept at `.claude/skills/<name>/SKILL.md`. See `.claude/skills/learning-note/SKILL.md`.
  - Permission rules: `deny` blocks, `ask` interrupts, `allow` pre-approves. See `.claude/settings.json`.
  - Hook matchers: `Edit` and `MultiEdit` are distinct tool names — a matcher must list both. See the `PreToolUse` block in `.claude/agents/backend-dev.md`.
- Try it yourself: In a fresh session, try to edit `docs/brief.md` — you should see an ask prompt. Then try `gh pr merge 1` — it should be denied outright.
```

Notes on why this works:

- "What I did" names every file touched and summarises the behaviour of each change in one sentence. No marketing phrases.
- "Why it helps" ties the change back to a specific property of the system (what loads when), so the owner can see which rule got stronger.
- Each concept has a one-sentence definition and a concrete file path. The point is for the owner to open the file.
- "Try it yourself" is a quick experiment the owner can run in a fresh session in a few seconds.
