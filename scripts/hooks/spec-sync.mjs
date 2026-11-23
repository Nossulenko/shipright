#!/usr/bin/env node
/**
 * Stop hook — reminds the agent ONCE per set of changed app files (apps/**) to keep
 * specs, docs and PROGRESS.md in sync, and to give the junior a teaching recap.
 *
 * Uncommitted work is normal on a feature branch, so a reminder gated on a
 * dirty tree alone would fire forever. Instead we hash the set of changed
 * source paths and only remind when that set is new.
 *
 * Usage: node scripts/hooks/spec-sync.mjs <claude|codex|copilot>
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const runtime = process.argv[2] || "claude";
const git = (cmd) => execSync(`git ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] }).toString();

let changed;
let gitDir;
try {
  gitDir = git("rev-parse --absolute-git-dir").trim();
  changed = git("status --porcelain --untracked-files=all")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3).replace(/^.* -> /, "").replace(/^"|"$/g, ""))
    // only product code under apps/ triggers it; editing specs, docs and notes is the
    // *response* to this reminder, and harness files are not product code
    .filter((p) => p.startsWith("apps/") && !p.endsWith(".md"))
    .sort();
} catch {
  process.exit(0); // not a git repo: nothing to do
}

if (!changed.length) process.exit(0);

const marker = join(gitDir, "shipright-spec-sync");
const hash = createHash("sha1").update(changed.join("\n")).digest("hex");
if (existsSync(marker) && readFileSync(marker, "utf8") === hash) process.exit(0);
writeFileSync(marker, hash);

const reason = [
  "SHIPRIGHT SPEC SYNC — before you stop:",
  "1. Does the code still match the PRD and the .feature files in specs/? If it diverged, say so and propose a spec update — do not silently diverge.",
  "2. Append progress, decisions and open questions to PROGRESS.md.",
  "3. If a new pattern, endpoint, data flow or dependency was introduced, update docs/architecture/ (and add an ADR if it was a real decision).",
  "4. If Teaching mode is on in AGENTS.md, finish with a short 'What I did / Why / What to check' recap and the next command.",
].join("\n");

if (runtime === "copilot") {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}
process.stderr.write(`${reason}\n`);
process.exit(2);
