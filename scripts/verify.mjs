#!/usr/bin/env node
/**
 * `npm run verify` — the one command that must pass before you push.
 *
 * 1. Checks the harness itself (scripts/verify-harness.mjs).
 * 2. Finds every app under apps/ and runs its quality gates, whatever the stack:
 *
 *    package.json      <pm> run lint | typecheck | test | test:bdd | build   (only the scripts that exist)
 *    pyproject.toml    ruff check · pytest                        (through uv when available)
 *    go.mod            go vet · go test · go build
 *    *.sln / *.csproj  dotnet build · dotnet test
 *
 * Usage: node scripts/verify.mjs [--harness-only] [--apps-only]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const results = [];

function has(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  return spawnSync(probe, [cmd], { stdio: "ignore", shell: process.platform === "win32" }).status === 0;
}

function run(label, cmd, cwd = ROOT) {
  console.log(`\n▶ ${label}\n  $ ${cmd}`);
  const started = Date.now();
  const { status } = spawnSync(cmd, { cwd, stdio: "inherit", shell: true, env: { ...process.env, CI: process.env.CI ?? "true" } });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  results.push({ label, ok: status === 0, secs });
  return status === 0;
}

function packageManager(dir) {
  for (const d of [dir, ROOT]) {
    if (existsSync(join(d, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(d, "yarn.lock"))) return "yarn";
    if (existsSync(join(d, "bun.lock")) || existsSync(join(d, "bun.lockb"))) return "bun";
  }
  return "npm";
}

function gatesFor(app, dir) {
  const gates = [];
  const files = readdirSync(dir);

  if (files.includes("package.json")) {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const pm = packageManager(dir);
    for (const script of ["format:check", "lint", "typecheck", "test", "test:bdd", "build"]) {
      if (pkg.scripts?.[script]) gates.push([`${app} · ${script}`, `${pm} run ${script}`]);
    }
  }

  if (files.includes("pyproject.toml")) {
    const uv = existsSync(join(dir, "uv.lock")) || has("uv") ? "uv run " : "";
    gates.push([`${app} · ruff`, `${uv}ruff check .`]);
    gates.push([`${app} · pytest`, `${uv}pytest`]);
  }

  if (files.includes("go.mod")) {
    gates.push([`${app} · go vet`, "go vet ./..."]);
    gates.push([`${app} · go test`, "go test ./..."]);
    gates.push([`${app} · go build`, "go build ./..."]);
  }

  if (files.some((f) => f.endsWith(".sln") || f.endsWith(".slnx") || f.endsWith(".csproj"))) {
    gates.push([`${app} · dotnet build`, "dotnet build --nologo"]);
    gates.push([`${app} · dotnet test`, "dotnet test --nologo --no-build"]);
  }

  return gates;
}

if (!args.has("--apps-only")) {
  run("harness", `node "${join(ROOT, "scripts/verify-harness.mjs")}"`);
}

if (!args.has("--harness-only")) {
  const appsDir = join(ROOT, "apps");
  const apps = existsSync(appsDir)
    ? readdirSync(appsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];
  if (!apps.length) {
    console.log("\nNo apps under apps/ yet — run /scaffold to create one. Only the harness was checked.");
  }
  for (const app of apps) {
    const dir = join(appsDir, app);
    const gates = gatesFor(app, dir);
    if (!gates.length) {
      console.log(`\n! apps/${app}: no recognised stack (package.json, pyproject.toml, go.mod, *.csproj) — skipped`);
      continue;
    }
    for (const [label, cmd] of gates) run(label, cmd, dir);
  }
}

console.log("\n──────── verify summary ────────");
for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.label.padEnd(32)} ${r.secs}s`);
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.log(`\n✗ ${failed.length} gate${failed.length === 1 ? "" : "s"} failed. Fix them before you push — or ask the agent: "explain why ${failed[0].label} failed".`);
  process.exit(1);
}
console.log("\n✓ All gates green. Safe to push.");
