---
name: learning-note
description: Write the Learning note required by the project at the end of every iteration. Four fixed bullets (What I did / Why it helps / Concepts to know / Try it yourself), under 150 words, appended to docs/learning-log.md under today's dated heading. Trigger whenever an agent is wrapping up a plan subtask, a fix or a PR; the owner is learning and reads these entries.
---

The owner is learning. Every iteration ends with a Learning note so they can see what moved and understand the concepts behind it. This is not optional.

## Steps

1. Get today's date deterministically: `date +%F`. Do not use the date from memory or from an earlier message — a session may span midnight.
2. Draft the note. Four bullets, in order, at most 150 words total, plain English:
   - **What I did**: what changed, in everyday words, and which files.
   - **Why it helps**: the problem it solves and how it moves the product forward.
   - **Concepts to know**: one to three terms, each explained in one sentence, with a file path where the owner can see it.
   - **Try it yourself**: one command or small experiment the owner can run in under a minute to see the result.
3. Append the note to `docs/learning-log.md` under a new heading `## YYYY-MM-DD <plan-id and subtask, or short fix name>`. Newest entry at the bottom; the file is append-only — never rewrite earlier entries.
4. Include the same note in your final report to the owner.

See `references/template.md` for a blank skeleton to copy and `references/example.md` for a worked entry.

## Style

- Plain English. Avoid jargon unless you explain it in the same sentence.
- One concept = one sentence + a file path. The path is the point: the owner opens the file.
- "Try it yourself" is one command, or a one-line experiment. If it needs setup you have not already done, pick a different one.
- Never invent a file path. If no good example path exists yet, cut the bullet.

## Role-specific additions

- **Planner**: every plan file includes a one-line **What you will learn** section (one or two concepts the plan teaches the owner).
- **Reviewer** and **security-reviewer**: every finding carries one plain sentence on why it matters.
