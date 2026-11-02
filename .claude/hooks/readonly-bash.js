// Lets read-only agents run only harmless inspection commands.
// Blocks anything else, including pipes, redirects and command chaining.
let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(data); } catch { process.exit(0); }
  const cmd = ((input.tool_input && input.tool_input.command) || "").trim();
  const allowed = /^(git\s+(diff|log|show|status|blame|ls-files)|ls|cat|head|tail|wc|grep|rg)(\s|$)/;
  const chained = /[;&|><`]|\$\(/;
  if (allowed.test(cmd) && !chained.test(cmd)) process.exit(0);
  console.error("Blocked: read-only agents may only run inspection commands (git diff/log/show/status, ls, cat, grep, rg). Command was: " + cmd);
  process.exit(2);
});
