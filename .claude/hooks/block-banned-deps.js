// Blocks edits to pom.xml that add banned Maven coordinates.
// Fires on PreToolUse for Edit, MultiEdit, Write and NotebookEdit.
// Guardrail only: hand-editing via `git` or `cat >` bypasses it; the
// owner-approval permission on `pom.xml` edits remains the primary gate.
//
// Narrow list: AI/LLM SDKs only. CLAUDE.md bans AI/LLM calls explicitly but
// does not forbid server-side telemetry (Sentry, OTel, etc.), so those are
// not here. The owner can extend if needed.
const BANNED = [
  "com.anthropic",
  "com.openai",
  "com.aallam.openai",
  "dev.langchain4j",
  "com.theokanning.openai-gpt3-java",
];

let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(data); } catch { process.exit(0); }
  const ti = input.tool_input || {};
  const target = (ti.file_path || ti.notebook_path || "").replace(/\\/g, "/");
  if (!/(^|\/)pom(-[^/]+)?\.xml$/.test(target)) process.exit(0);

  // Collect every new-content string the tool is about to write.
  const chunks = [];
  if (typeof ti.content === "string") chunks.push(ti.content);
  if (typeof ti.new_string === "string") chunks.push(ti.new_string);
  if (Array.isArray(ti.edits)) {
    for (const e of ti.edits) {
      if (e && typeof e.new_string === "string") chunks.push(e.new_string);
    }
  }
  const haystack = chunks.join("\n");
  if (!haystack) process.exit(0);

  const hits = BANNED.filter((g) => haystack.includes(g));
  if (hits.length > 0) {
    console.error(
      "Blocked: " + hits.join(", ") +
      " is on the dependency banlist for " + target + ". " +
      "Project rule: no AI/LLM calls, and no API keys, anywhere in the product. " +
      "If this is a mistake, ask the owner."
    );
    process.exit(2);
  }
  process.exit(0);
});
