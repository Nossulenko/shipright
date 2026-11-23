#!/usr/bin/env node
/**
 * `npm run setup` — one-time local setup. Safe to re-run.
 *   • points git at the versioned hooks in .githooks/
 *   • makes the hook scripts executable
 *   • checks the tools Shipright expects and says how to install what is missing
 */
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ok = (m) => console.log(`  ✓ ${m}`);
const miss = (m) => console.log(`  ✗ ${m}`);

console.log("\nShipright setup\n");

const hooks = spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: ROOT });
if (hooks.status === 0) ok("git hooks enabled (.githooks/pre-commit, .githooks/pre-push)");
else miss("could not set git hooks — is this a git repository? Run `git init` first.");

if (process.platform !== "win32") {
  for (const f of readdirSync(join(ROOT, ".githooks"))) chmodSync(join(ROOT, ".githooks", f), 0o755);
}

const version = (cmd, args = ["--version"]) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32" });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split("\n")[0] : null;
};

console.log("\nTools");
const major = Number(process.versions.node.split(".")[0]);
major >= 20 ? ok(`node ${process.versions.node}`) : miss(`node ${process.versions.node} — Shipright needs Node 20 or newer (https://nodejs.org)`);

const tools = [
  ["git", ["--version"], "https://git-scm.com/downloads", true],
  ["gh", ["--version"], "https://cli.github.com — then run `gh auth login`", true],
  ["docker", ["--version"], "https://docs.docker.com/get-docker/ (needed to test containers before deploying)", false],
  ["gcloud", ["--version"], "https://cloud.google.com/sdk/docs/install (only if you deploy to Google Cloud)", false],
  ["az", ["--version"], "https://learn.microsoft.com/cli/azure/install-azure-cli (only if you deploy to Azure)", false],
  ["aws", ["--version"], "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html (only if you deploy to AWS)", false],
];
for (const [cmd, args, hint, required] of tools) {
  const v = version(cmd, args);
  if (v) ok(`${cmd} — ${v}`);
  else if (required) miss(`${cmd} not found → ${hint}`);
  else console.log(`  · ${cmd} not found (optional) → ${hint}`);
}

const skills = join(ROOT, ".claude/skills");
if (!existsSync(join(skills, "start", "SKILL.md"))) {
  console.log("\n  ! .claude/skills is not a working symlink. On Windows enable symlinks: `git config --global core.symlinks true`, then re-clone. See README › Troubleshooting.");
}

console.log("\nNext: open your coding agent in this folder and run /start (Codex: $start).\n");
