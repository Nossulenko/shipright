#!/usr/bin/env node
/**
 * PostToolUse hook — formats every file the agent writes, so diffs carry no
 * style noise. Uses only formatters that are already installed; never
 * downloads anything and never fails the agent's turn.
 *
 *   .ts .tsx .js .jsx .mjs .json .css .md .yml .html  → prettier (from the nearest node_modules)
 *   .py                                               → ruff format
 *   .go                                               → gofmt -w
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function which(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  return spawnSync(probe, [cmd], { stdio: "ignore", shell: process.platform === "win32" }).status === 0;
}

function localBin(file, name) {
  let dir = dirname(resolve(file));
  while (true) {
    const candidate = join(dir, "node_modules", ".bin", name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function paths(payload) {
  let input = payload.tool_input ?? payload.toolInput ?? payload.toolArgs ?? {};
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      input = { patch: input };
    }
  }
  const out = [];
  const direct = input.file_path ?? input.filePath ?? input.path;
  if (direct) out.push(direct);
  const patch = input.patch ?? input.command ?? "";
  if (typeof patch === "string") {
    for (const m of patch.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$|^\*\*\* Move to: (.+)$/gm)) out.push((m[1] ?? m[2]).trim());
  }
  return out;
}

function format(file) {
  if (!existsSync(file)) return;
  const quiet = { stdio: "ignore" };
  if (/\.(?:[cm]?[jt]sx?|json|css|scss|md|ya?ml|html)$/.test(file)) {
    const prettier = localBin(file, "prettier");
    if (prettier) spawnSync(prettier, ["--write", "--log-level", "silent", file], quiet);
  } else if (file.endsWith(".py") && which("ruff")) {
    spawnSync("ruff", ["format", "--quiet", file], quiet);
  } else if (file.endsWith(".go") && which("gofmt")) {
    spawnSync("gofmt", ["-w", file], quiet);
  }
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    for (const file of paths(JSON.parse(raw))) format(file);
  } catch {
    /* formatting is best-effort */
  }
  process.exit(0);
});
