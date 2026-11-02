// Injects STATUS.md into the session as additional context on SessionStart.
// Satisfies the project rule "Read STATUS.md first" deterministically — the
// slim CLAUDE.md keeps this one-liner in its Repo rules section and the
// change-ritual skill lists it as a pre-flight check.
// If STATUS.md is missing, tells Claude to ask the owner before proceeding.
const fs = require("fs");
const path = require("path");

let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const statusPath = path.join(root, "STATUS.md");
  let additionalContext;
  try {
    const contents = fs.readFileSync(statusPath, "utf8");
    additionalContext = "Current STATUS.md (injected by SessionStart hook):\n\n" + contents;
  } catch {
    additionalContext =
      "STATUS.md was not found at the repo root. The project rule requires reading it before starting — ask the owner before proceeding with any change.";
  }
  const out = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
});
