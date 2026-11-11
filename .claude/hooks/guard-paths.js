// Blocks Edit/Write calls outside an agent's write scope.
// Usage in an agent's hooks: node .claude/hooks/guard-paths.js <prefix> [<prefix>...]
// A prefix ending in "/" matches a folder. A prefix starting with "*" matches a file suffix, for example "*.test.ts".
// Exit code 2 blocks the tool call and shows the message to the agent.
const path = require("path");
let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(data); } catch { process.exit(0); }
  const target = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
  if (!target) process.exit(0);
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = path.relative(root, path.resolve(root, target)).split(path.sep).join("/");
  const allowed = process.argv.slice(2);
  const ok = !rel.startsWith("..") && allowed.some((p) =>
    p.startsWith("*") ? rel.endsWith(p.slice(1)) :
    p.endsWith("/") ? rel.startsWith(p) : rel === p);
  if (ok) process.exit(0);
  console.error("Blocked: " + rel + " is outside this agent's write scope (" + allowed.join(", ") + "). Ask the owner or use the right agent.");
  process.exit(2);
});
