#!/usr/bin/env node
/**
 * PreToolUse guard — deterministic pattern matching, no LLM judgement.
 *
 * deny  → the call never runs; the agent sees the reason and must change course.
 * ask   → the human gets a confirmation prompt (Claude Code, Copilot). Codex hooks
 *         cannot pause, so on Codex "ask" becomes "deny" with a note to run it by hand.
 *
 * Reads the runtime's hook JSON on stdin. Usage: node scripts/hooks/guard.mjs <claude|codex|copilot>
 */
import { execSync } from "node:child_process";

const runtime = process.argv[2] || "claude";

// ── shell commands ────────────────────────────────────────────────────────
const SHELL_RULES = [
  // destructive local operations
  [/\brm\s+-[a-zA-Z]*(?:rf|fr)[a-zA-Z]*\s+(?:--\s+)?(?:\/\*?|~\/?|\$HOME\/?|\.{1,2}\/?|\*)(?:\s|$)/, "deny", "Recursive delete of a root, home or whole-project path. Delete specific files instead."],
  [/\bsudo\s+(?:npm|npx|pnpm|yarn|pip)\b/, "deny", "Never install packages with sudo — fix the permissions or use a version manager (nvm, uv)."],
  [/\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/, "ask", "Piping a script from the internet straight into a shell. Read the script first."],

  // git safety
  [/\bgit\s+push\b.*(?:--force\b|--force-with-lease\b|\s-f\b).*\b(?:main|master|production|release)\b(?![\w/-])/, "deny", "Force-push to a protected branch would rewrite shared history."],
  [/\bgit\s+push\b.*(?:--force\b|--force-with-lease\b|\s-f\b)/, "ask", "Force-push rewrites the branch on the remote. Confirm nobody else uses this branch."],
  [/\bgit\s+push\b(?:\s+-u)?\s+\S+\s+(?:HEAD:)?(?:main|master)(?![\w/-])/, "deny", "Pushing straight to main skips review. Use /ship to open a pull request."],
  [/--no-verify\b/, "ask", "--no-verify skips the git hooks (secret scan, tests). Only with explicit approval."],
  [/\bgit\s+reset\s+--hard\b/, "ask", "git reset --hard throws away uncommitted work permanently."],
  [/\bgit\s+clean\s+-[a-zA-Z]*f/, "ask", "git clean -f permanently deletes untracked files."],
  [/\bgit\s+branch\s+-D\b/, "ask", "Force-deleting a branch can lose unmerged commits."],

  // databases
  [/\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b/i, "deny", "DROP is irreversible. Write a migration with a down step instead."],
  [/\bTRUNCATE\s+(?:TABLE\s+)?\w/i, "ask", "TRUNCATE deletes every row in the table."],
  [/\b(?:prisma\s+db\s+push|drizzle-kit\s+push|db:push)\b/, "ask", "Schema push skips migration files. Prefer generating a migration (db:generate / migrate dev)."],

  // cloud: destroying things
  [/\b(?:terraform|tofu|pulumi|cdk)\s+destroy\b/, "ask", "This destroys cloud infrastructure. Confirm the target account/project and that nothing else depends on it."],
  [/\bgcloud\b.*\s(?:delete|remove)\b/, "ask", "Deleting Google Cloud resources. Confirm the project and resource names first."],
  [/\baz\b.*\s(?:delete|purge)\b/, "ask", "Deleting Azure resources. Confirm the subscription and resource group first."],
  [/\baws\b.*\s(?:delete-|terminate-|deregister-|rb\b|rm\b.*--recursive)/, "ask", "Deleting AWS resources. Confirm the account and region first."],
  [/\bkubectl\s+delete\b/, "ask", "Deleting Kubernetes resources."],

  // cloud: spending money
  [/\b(?:terraform|tofu)\s+apply\b|\bpulumi\s+up\b|\bcdk\s+deploy\b/, "ask", "This creates or changes cloud infrastructure and may cost money."],
  [/\bgcloud\b.*\s(?:deploy|create|enable)\b/, "ask", "This creates Google Cloud resources and may cost money. Confirm the project, region and that a budget alert exists."],
  [/\baz\b.*\s(?:create|up|deploy)\b/, "ask", "This creates Azure resources and may cost money. Confirm the subscription, region and that a budget alert exists."],
  [/\baws\b.*\s(?:create-|run-instances|put-|deploy\b|update-express-gateway-service)/, "ask", "This creates or changes AWS resources and may cost money. Confirm the account, region and that a budget alert exists."],
  [/\b(?:firebase|amplify|vercel|netlify|fly)\s+(?:deploy|publish)\b|\bvercel\s+--prod\b/, "ask", "Deploying to a hosting provider."],
];

// ── file writes ───────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, "an AWS access key"],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/, "a private key"],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, "a GitHub token"],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/, "a Slack token"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "a Google API key"],
  [/\bsk_live_[0-9a-zA-Z]{24,}/, "a Stripe live key"],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, "an Anthropic API key"],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/, "an OpenAI-style API key"],
  [/AccountKey=[A-Za-z0-9+/=]{40,}/, "an Azure storage key"],
  [/"private_key":\s*"-----BEGIN/, "a Google service-account key"],
];

function checkShell(command) {
  for (const [pattern, decision, reason] of SHELL_RULES) {
    if (pattern.test(command)) return { decision, reason };
  }
  if (/\bgit\s+commit\b/.test(command)) {
    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      if (branch === "main" || branch === "master") {
        return { decision: "ask", reason: `You are on ${branch}. Create a branch first (feat/NNN-slug) — the pre-commit hook will refuse this commit anyway.` };
      }
    } catch {
      /* not a git repo — nothing to protect */
    }
  }
  return null;
}

function checkWrite(filePath, content) {
  const base = filePath.split(/[\\/]/).pop() ?? "";
  const isEnvFile = /^\.env(?:\..+)?$/.test(base) && !/\.(?:example|sample|template)$/.test(base);

  if (!isEnvFile && content) {
    for (const [pattern, what] of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        return { decision: "deny", reason: `This edit to ${filePath} contains what looks like ${what}. Secrets go in .env locally and the cloud secret manager in production — never in code.` };
      }
    }
  }
  if (isEnvFile) {
    return { decision: "ask", reason: `Writing ${filePath}. It is git-ignored, but confirm you want the agent to handle these values.` };
  }
  if (/(^|[\\/])\.github[\\/]workflows[\\/].+\.ya?ml$/.test(filePath)) {
    return { decision: "ask", reason: `Changing CI/CD pipeline ${filePath}. Pipelines can deploy and hold credentials — confirm the change.` };
  }
  if (/(^|[\\/])(?:\.githooks[\\/]|scripts[\\/]hooks[\\/]|\.claude[\\/]settings(?:\.local)?\.json$|\.codex[\\/]hooks\.json$|\.github[\\/]hooks[\\/])/.test(filePath)) {
    return { decision: "ask", reason: `Changing the guardrails themselves (${filePath}). Confirm this is intended — weakening a guard should be a human decision.` };
  }
  return null;
}

function patchFiles(patch) {
  // apply_patch format: "*** Add File: path" / "*** Update File: path", then "+" lines
  const out = [];
  let current = null;
  for (const line of patch.split(/\r?\n/)) {
    const header = /^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/.exec(line);
    if (header) {
      current = { path: (header[1] ?? header[2]).trim(), content: "" };
      out.push(current);
    } else if (current && line.startsWith("+")) {
      current.content += `${line.slice(1)}\n`;
    }
  }
  return out;
}

function decide(payload) {
  const tool = String(payload.tool_name ?? payload.toolName ?? "").toLowerCase();
  let input = payload.tool_input ?? payload.toolInput ?? payload.toolArgs ?? {};
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      input = { patch: input };
    }
  }

  const shellTools = ["bash", "shell", "execute", "exec", "exec_command", "local_shell", "shell_command", "container.exec", "run_in_terminal", "powershell"];
  if (shellTools.includes(tool)) {
    const cmd = input.command ?? input.cmd ?? input.input ?? input.script ?? "";
    return checkShell(typeof cmd === "string" ? cmd : JSON.stringify(cmd));
  }
  if (["write", "edit", "multiedit", "create", "str_replace", "str_replace_editor", "insert"].includes(tool)) {
    const path = input.file_path ?? input.filePath ?? input.path ?? "";
    const edits = Array.isArray(input.edits) ? input.edits.map((e) => e.new_string ?? "").join("\n") : "";
    const content = [input.content, input.new_string, input.file_text, input.new_str, edits].filter(Boolean).join("\n");
    return checkWrite(path, content);
  }
  if (tool === "apply_patch") {
    for (const f of patchFiles(input.patch ?? input.command ?? input.input ?? "")) {
      const result = checkWrite(f.path, f.content);
      if (result) return result;
    }
  }
  return null;
}

function format(result) {
  let { decision, reason } = result;
  if (runtime === "codex" && decision === "ask") {
    decision = "deny";
    reason = `${reason} (Codex hooks cannot pause for confirmation: review the command and run it yourself if you agree.)`;
  }
  if (runtime === "copilot") return { permissionDecision: decision, permissionDecisionReason: reason };
  return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: `ShipRight guard: ${reason}` } };
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // unreadable input: stay out of the way
  }
  const result = decide(payload);
  if (result) process.stdout.write(JSON.stringify(format(result)));
  // no output = no opinion; the runtime's normal permission flow applies
});
