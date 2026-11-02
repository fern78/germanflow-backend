// Blocks `git commit` when HEAD is on main or master.
// Fires on PreToolUse for Bash. Exit 2 blocks the tool call.
// Complements settings.json which already denies `git push *origin main*`
// but does not catch a local commit landing on main.
const { execSync } = require("child_process");

let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(data); } catch { process.exit(0); }
  const cmd = ((input.tool_input && input.tool_input.command) || "").trim();
  // Match `git [flags|-C path]* commit` only when `git` sits at command position:
  // start of the command, or just after a shell separator (;, &&, ||, |).
  // This avoids false positives on quoted text like `echo '... git commit ...'`.
  // False negatives (e.g. subshells, unusual chaining) are acceptable; the push
  // deny-list and owner-approval on `git commit*` still cover the gap.
  if (!/(?:^|[;&|])\s*git\b(?:\s+-[A-Za-z]\S*|\s+--\S+|\s+-C\s+\S+)*\s+commit\b/.test(cmd)) {
    process.exit(0);
  }
  let branch = "";
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // Not a git repo, or git unavailable: do not block.
    process.exit(0);
  }
  if (branch === "main" || branch === "master") {
    console.error(
      "Blocked: on branch " + branch +
      ". Create a feature branch first: `git checkout -b <slug>`. " +
      "(Project rule: never commit to main.)"
    );
    process.exit(2);
  }
  process.exit(0);
});
