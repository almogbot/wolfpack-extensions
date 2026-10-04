#!/usr/bin/env bun
import { strict as assert } from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSelfContained } from "./bundle-policy.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";
const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-notes-negative-"));
try {
  const copy = join(stage, "project"); mkdirSync(copy);
  for (const name of ["package.json", "README.md", "LICENSE", "src", "dist", "scripts"]) cpSync(join(root, name), join(copy, name), { recursive: true });
  symlinkSync(join(root, "node_modules"), join(copy, "node_modules"), "dir");
  const source = readFileSync(join(copy, "src", "ui.ts"), "utf8"), stale = source.replace('title: "Notes"', 'title: "Stale source counterfactual"'); assert.notEqual(stale, source); writeFileSync(join(copy, "src", "ui.ts"), stale);
  const reject = (command: string[]) => { const result = Bun.spawnSync(command, { cwd: copy, env: isolatedPackageManagerEnv(stage), stdout: "pipe", stderr: "pipe" }), output = result.stdout.toString() + result.stderr.toString(); assert.notEqual(result.exitCode, 0); assert.match(output, /SOURCE_ONLY_DRIFT/); assert.equal(readdirSync(copy).some(name => name.endsWith(".tgz")), false); };
  reject([process.execPath, join(copy, "scripts", "check-package.ts")]); reject([process.execPath, "run", "pack"]);
  for (const value of ["if (false) import('dormant-dependency');", "import 'side-effect';", "function dormant() { return require('dependency'); }"]) assert.throws(() => assertSelfContained(Buffer.from(value)), /external dependency syntax/);
  process.stdout.write("stale source and external module syntax rejected\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
