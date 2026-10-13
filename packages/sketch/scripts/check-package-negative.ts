#!/usr/bin/env bun
import { strict as assert } from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSelfContained } from "./bundle-policy.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";
const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-sketch-negative-"));
try {
  const copy = join(stage, "project"); mkdirSync(copy);
  for (const name of ["package.json", "README.md", "LICENSE", "src", "dist", "scripts", "schemas", "skills"]) cpSync(join(root, name), join(copy, name), { recursive: true });
  symlinkSync(join(root, "..", "..", "node_modules"), join(copy, "node_modules"), "dir");
  const source = readFileSync(join(copy, "src", "ui.ts"), "utf8"), stale = source.replace("title:'Sketch'",  'title: "Stale source counterfactual"'); assert.notEqual(stale, source); writeFileSync(join(copy, "src", "ui.ts"), stale);
  const reject = (command: string[]) => { const result = Bun.spawnSync(command, { cwd: copy, env: isolatedPackageManagerEnv(stage), stdout: "pipe", stderr: "pipe" }), output = result.stdout.toString() + result.stderr.toString(); assert.notEqual(result.exitCode, 0); assert.match(output, /SOURCE_ONLY_DRIFT/); assert.equal(readdirSync(copy).some(name => name.endsWith(".tgz")), false); };
  reject([process.execPath, join(copy, "scripts", "check-package.ts")]); reject([process.execPath, "run", "pack"]);
  for (const value of ["if (false) import('dormant-dependency');", "import 'side-effect';", "function dormant() { return require('dependency'); }"]) assert.throws(() => assertSelfContained(Buffer.from(value)), /external dependency syntax/);
  for (const value of ["export const extra = 1; export default 1;", "function register() {} function extra() {} export { register as default, extra };", "const missing = 1;"]) assert.throws(() => assertSelfContained(Buffer.from(value)), /exactly one default export/);
  process.stdout.write("stale source, external module syntax, and additional/missing exports rejected\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
