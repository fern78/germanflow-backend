---
name: finish-iteration
description: Wrap up a change before handing back to the owner — run the project's checks, update STATUS.md and CHANGELOG.md, and write a Learning note. Trigger when an agent has finished a plan subtask, a fix, or a PR and is about to end its turn. Do not run mid-task, and do not run twice in the same turn.
---

Run this skill when you're about to end a working session or hand back to the owner.

## Steps

1. **Run the project's checks** — only if the Maven modules exist. Pre-M1 they do not: skip the step and note that in your report. From M1 onward, run and paste the result of:

   ```
   ./mvnw -q verify
   ```

   This covers build, unit tests, golden mapper tests and style checks (see CLAUDE.md Commands). If it fails, fix it before continuing. Do not update STATUS/CHANGELOG with a broken build.

2. **Update `STATUS.md`** at the repo root. Keep the template's sections and fill them for the current state:
   - **Now**: current story (`#<issue>`), owner agent, branch, phase (`planned | in-progress | review`).
   - **Next**: ordered list of the next concrete steps.
   - **Blocked**: anything stuck, with the reason. If nothing is blocked, write `- <none>`.
   - Leave "Recently merged" and "Pending decisions" alone unless something there actually changed.

3. **Append to `CHANGELOG.md`** one line under `## [Unreleased]`, in the format `- YYYY-MM-DD <short description>`. Use `date +%F` for the date.

4. **Invoke the `learning-note` skill** to write and append the required Learning note to `docs/learning-log.md`.

5. **Stop**. Do not `git commit`, do not open a PR, do not push. Those are the owner's calls — the `block-commit-to-main` hook will reject a commit on `main` anyway, and `git commit*` is on the ask-list.

## When NOT to run this

- You are not finishing an iteration — you are mid-task and only pausing.
- The owner is driving a chat or debugging session with no concrete deliverable.
- You already ran it in this turn.
