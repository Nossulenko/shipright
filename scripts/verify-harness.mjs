#!/usr/bin/env node
/**
 * Checks that the harness itself is consistent. Deterministic, no network, no deps.
 *
 *   skills      frontmatter valid, name = folder, user-invoked-only skills guarded for every runtime
 *   roles       frontmatter valid, read-only roles really read-only, adapters in sync
 *   contract    every skill and role is listed in AGENTS.md, and nothing listed is missing
 *   links       relative Markdown links and README images resolve
 *   gherkin     every scenario has a unique scenario tag (@KEY-nn) and a requirement tag (@FR-n / @NFR-n)
 *
 * Usage: node scripts/verify-harness.mjs [--quiet]
 */
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./lib/frontmatter.mjs";
import { buildAll, diffAgainstDisk, loadRoles, validateRole } from "./sync-agents.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUIET = process.argv.includes("--quiet");
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", "out", ".venv", "bin", "obj", "coverage", ".turbo", "playwright-report", "test-results"]);

const errors = [];
const warnings = [];
const passed = [];
const fail = (area, msg) => errors.push(`${area}: ${msg}`);
const warn = (area, msg) => warnings.push(`${area}: ${msg}`);
const read = (p) => readFileSync(join(ROOT, p), "utf8");

function walk(dir, pred, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walk(rel, pred, out);
    else if (pred(rel)) out.push(rel);
  }
  return out;
}

// ── skills ────────────────────────────────────────────────────────────────
function checkSkills() {
  const link = join(ROOT, ".claude/skills");
  if (!existsSync(link) && !lstatSync(link, { throwIfNoEntry: false })) {
    fail("skills", ".claude/skills is missing — it must be a symlink to ../.agents/skills");
  } else if (lstatSync(link).isSymbolicLink()) {
    if (readlinkSync(link) !== "../.agents/skills") fail("skills", ".claude/skills must point to ../.agents/skills");
  } else if (statSync(link).isFile() && read(".claude/skills").trim() === "../.agents/skills") {
    warn("skills", ".claude/skills was checked out as a plain file (git core.symlinks=false). Claude Code will not see the skills — see README › Troubleshooting.");
  } else {
    fail("skills", ".claude/skills must be a symlink to ../.agents/skills, not a real folder");
  }

  const dir = join(ROOT, ".agents/skills");
  const names = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
  for (const name of names) {
    const base = `.agents/skills/${name}`;
    if (!existsSync(join(ROOT, base, "SKILL.md"))) {
      fail("skills", `${base} has no SKILL.md`);
      continue;
    }
    const { data, body } = parseFrontmatter(read(`${base}/SKILL.md`));
    if (!data) {
      fail("skills", `${base}/SKILL.md has no frontmatter`);
      continue;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) fail("skills", `${name}: folder name must be kebab-case, ≤ 64 chars`);
    if (data.name !== name) fail("skills", `${base}: frontmatter name "${data.name}" must equal folder name`);
    const desc = String(data.description ?? "");
    if (desc.length < 20) fail("skills", `${base}: description missing or too short`);
    if (desc.length > 1024) fail("skills", `${base}: description is ${desc.length} chars (max 1024)`);
    if (!new RegExp(`^# /${name}\\b`, "m").test(body)) fail("skills", `${base}: first heading must be "# /${name} — …" (see CONTRIBUTING.md)`);

    const openaiYaml = `${base}/agents/openai.yaml`;
    const hasYaml = existsSync(join(ROOT, openaiYaml));
    const yamlBlocksImplicit = hasYaml && /allow_implicit_invocation:\s*false/.test(read(openaiYaml));
    if (data["disable-model-invocation"] === true) {
      if (!desc.startsWith("User-invoked only.")) fail("skills", `${base}: user-invoked-only skill description must start with "User-invoked only."`);
      if (!yamlBlocksImplicit) fail("skills", `${base}: user-invoked-only skill needs ${openaiYaml} with allow_implicit_invocation: false (Codex)`);
    } else if (yamlBlocksImplicit) {
      fail("skills", `${base}: Codex blocks implicit use but disable-model-invocation is not true — make both runtimes agree`);
    }

    for (const m of body.matchAll(/\]\((references\/[^)#\s]+)/g)) {
      if (!existsSync(join(ROOT, base, m[1]))) fail("skills", `${base}/SKILL.md links missing ${m[1]}`);
    }
  }
  passed.push(`skills: ${names.length} checked`);
  return names;
}

// ── roles ─────────────────────────────────────────────────────────────────
function checkRoles() {
  const roles = loadRoles();
  for (const role of roles) for (const e of validateRole(role)) fail("roles", `${role.source}: ${e}`);
  const { outOfDate, stale } = diffAgainstDisk(buildAll(roles));
  for (const f of outOfDate) fail("roles", `adapter out of date: ${f} — run \`npm run sync:agents\``);
  for (const f of stale) fail("roles", `stale adapter (role removed): ${f} — run \`npm run sync:agents\``);
  passed.push(`roles: ${roles.length} checked, adapters ${outOfDate.length + stale.length ? "OUT OF SYNC" : "in sync"}`);
  return roles.map((r) => r.data.name);
}

// ── contract ──────────────────────────────────────────────────────────────
function checkContract(skills, roles) {
  const agents = read("AGENTS.md");
  if (!/## Project Profile/.test(agents)) fail("contract", "AGENTS.md lost its `## Project Profile` section — /start depends on it");
  const listed = (section) => {
    const block = agents.split(/^## /m).find((s) => s.startsWith(section)) ?? "";
    return new Set([...block.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1]));
  };
  const listedSkills = listed("Skills");
  const listedRoles = listed("Your AI Team");
  for (const s of skills) if (!listedSkills.has(s)) fail("contract", `skill "${s}" is not listed in AGENTS.md › Skills`);
  for (const s of listedSkills) if (!skills.includes(s)) fail("contract", `AGENTS.md lists skill "${s}" but .agents/skills/${s} does not exist`);
  for (const r of roles) if (!listedRoles.has(r)) fail("contract", `role "${r}" is not listed in AGENTS.md › Your AI Team`);
  for (const r of listedRoles) if (!roles.includes(r)) fail("contract", `AGENTS.md lists role "${r}" but .agents/roles/${r}.md does not exist`);

  const claude = existsSync(join(ROOT, "CLAUDE.md")) ? read("CLAUDE.md") : "";
  if (!/^@AGENTS\.md/m.test(claude)) fail("contract", "CLAUDE.md must import the contract with `@AGENTS.md`");
  passed.push("contract: AGENTS.md matches skills and roles");
}

// ── links ─────────────────────────────────────────────────────────────────
function stripCode(markdown) {
  const kept = [];
  let fence = null;
  for (const line of markdown.split(/\r?\n/)) {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && !line.trim().slice(m[1].length).trim()) fence = null;
      continue;
    }
    if (m) {
      fence = m[1];
      continue;
    }
    kept.push(line.replace(/(`+)[\s\S]*?\1/g, ""));
  }
  return kept.join("\n");
}

function checkLinks() {
  const files = walk("", (p) => p.endsWith(".md"));
  let count = 0;
  for (const file of files) {
    // ignore fenced code blocks (any fence length, so ```` can wrap ```) and inline code —
    // they hold examples and templates, not links
    const text = stripCode(read(file));
    const targets = [
      ...[...text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]),
      ...[...text.matchAll(/\b(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]),
    ];
    for (const raw of targets) {
      if (/^(https?:|mailto:|#|data:)/.test(raw) || raw.includes("<") || raw.includes("{")) continue;
      const clean = decodeURIComponent(raw.split("#")[0].split("?")[0]);
      if (!clean) continue;
      count++;
      const target = clean.startsWith("/") ? join(ROOT, clean) : resolve(join(ROOT, dirname(file)), clean);
      if (!target.startsWith(ROOT)) fail("links", `${file} → ${raw} points outside the repo`);
      else if (!existsSync(target)) fail("links", `${file} → ${raw} (not found)`);
    }
  }
  passed.push(`links: ${count} relative links in ${files.length} Markdown files`);
}

// ── gherkin ───────────────────────────────────────────────────────────────
const REQUIREMENT_TAG = /^@(?:N?FR-\d+|US-\d+(?:\.\d+)?)$/;

// 02-stories.md next to the scenarios: which story owns which pre-assigned scenario tag
const storiesCache = new Map();
function storiesFor(featureFile) {
  const spec = featureFile.split("/").slice(0, -2).join("/"); // <spec>/02-scenarios/x.feature → <spec>
  if (storiesCache.has(spec)) return storiesCache.get(spec);
  const file = `${spec}/02-stories.md`;
  let result = null;
  if (existsSync(join(ROOT, file))) {
    const ids = new Set();
    const tagOwner = new Map();
    let current = null;
    for (const line of read(file).split(/\r?\n/)) {
      const h = /^### (US-\d+(?:\.\d+)?)\b/.exec(line);
      if (h) {
        current = h[1];
        if (ids.has(current)) fail("stories", `${file}: ${current} has two cards`);
        ids.add(current);
        continue;
      }
      if (/^## /.test(line)) current = null;
      if (!current) continue;
      for (const m of line.matchAll(/^\s*- `@([A-Z]{2,6}-\d{2,})`/g)) {
        if (tagOwner.has(m[1])) fail("stories", `${file}: @${m[1]} appears under both ${tagOwner.get(m[1])} and ${current}`);
        tagOwner.set(m[1], current);
      }
    }
    result = { file, ids, tagOwner };
  }
  storiesCache.set(spec, result);
  return result;
}

function checkGherkin() {
  const features = [...walk("specs", (p) => p.endsWith(".feature")), ...walk("examples", (p) => p.endsWith(".feature"))];
  const tagsBySpec = new Map();
  for (const file of features) {
    const lines = read(file).split(/\r?\n/);
    if (!lines.some((l) => /^\s*Feature:/.test(l))) fail("gherkin", `${file}: no "Feature:" line`);
    // Tags inherit in Gherkin: Feature → Rule → Scenario. The scenario tag must sit on
    // the scenario itself; the requirement tag may be inherited.
    let pending = [];
    let featureTags = [];
    let ruleTags = [];
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith("@")) {
        pending.push(...t.split(/\s+/).filter((x) => x.startsWith("@")));
        return;
      }
      if (/^Feature:/.test(t)) featureTags = pending;
      if (/^Rule:/.test(t)) ruleTags = pending;
      if (/^(Scenario|Scenario Outline|Scenario Template|Example):/.test(t)) {
        const where = `${file}:${i + 1}`;
        const inherited = [...featureTags, ...ruleTags, ...pending];
        const scenarioTag = pending.find((x) => /^@[A-Z]{2,6}-\d{2,}$/.test(x) && !/^@(?:N?FR|US)-/.test(x));
        if (!scenarioTag) fail("gherkin", `${where}: scenario needs its own scenario tag like @LUNCH-03`);
        if (!inherited.some((x) => REQUIREMENT_TAG.test(x))) fail("gherkin", `${where}: scenario needs a requirement tag like @FR-2 (or @US-3 in quick mode)`);
        const stories = storiesFor(file);
        if (stories && scenarioTag) {
          const owner = stories.tagOwner.get(scenarioTag.slice(1));
          const usTag = inherited.find((x) => /^@US-\d+(?:\.\d+)?$/.test(x));
          if (!owner) fail("stories", `${where}: ${scenarioTag} is not in any story's acceptance criteria — add it to ${stories.file}`);
          else if (usTag && usTag.slice(1) !== owner) fail("stories", `${where}: tagged ${usTag} but ${stories.file} puts ${scenarioTag} under ${owner}`);
          if (usTag && !stories.ids.has(usTag.slice(1))) fail("stories", `${where}: ${usTag} has no card in ${stories.file}`);
        }
        if (scenarioTag) {
          const spec = file.split("/").slice(0, 2).join("/");
          const seen = tagsBySpec.get(spec) ?? new Map();
          if (seen.has(scenarioTag)) fail("gherkin", `${where}: ${scenarioTag} already used at ${seen.get(scenarioTag)}`);
          seen.set(scenarioTag, where);
          tagsBySpec.set(spec, seen);
        }
      }
      if (t && !t.startsWith("#")) pending = [];
    });
  }
  passed.push(`gherkin: ${features.length} feature files`);
}

// ── tracking ──────────────────────────────────────────────────────────────
// A harness file that .gitignore swallows works locally and vanishes in CI and for
// everyone who clones. (A generic `build/` pattern once hid the /build skill.)
function checkTracked() {
  const dirs = [".agents", ".claude", ".codex", ".github", ".githooks", "scripts", "docs", "specs", "examples"];
  const r = spawnSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", ...dirs], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return; // not a git checkout (e.g. a downloaded zip): nothing to check
  const ignored = r.stdout.split("\n").filter(Boolean);
  for (const f of ignored) fail("tracking", `${f} is git-ignored — add a "!${f}" exception to .gitignore`);
  if (!ignored.length) passed.push("tracking: no harness files ignored by git");
}

const skills = checkSkills();
checkTracked();
const roles = checkRoles();
checkContract(skills, roles);
checkLinks();
checkGherkin();

if (!QUIET || errors.length) {
  for (const p of passed) console.log(`✓ ${p}`);
  for (const w of warnings) console.log(`! ${w}`);
  for (const e of errors) console.log(`✗ ${e}`);
}
if (errors.length) {
  console.log(`\nHarness check failed: ${errors.length} problem${errors.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
if (!QUIET) console.log("\nHarness check passed.");
