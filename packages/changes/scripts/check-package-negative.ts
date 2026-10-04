#!/usr/bin/env bun
import { strict as assert } from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSelfContained } from "./bundle-policy.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";

const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-changes-package-negative-"));
try {
  const copy = join(stage, "project"); mkdirSync(copy);
  for (const name of ["package.json", "README.md", "LICENSE", "src", "dist", "scripts"]) cpSync(join(root, name), join(copy, name), { recursive: true });
  // Reuse pinned development tools read-only; all mutations stay in this owned copy.
  symlinkSync(join(root, "node_modules"), join(copy, "node_modules"), "dir");
  const original = readFileSync(join(copy, "src", "ui.ts"), "utf8");
  const drifted = original.replace('title: "Changes"', 'title: "Stale source counterfactual"');
  assert.notEqual(drifted, original, "source-drift fixture must actually change the source");
  writeFileSync(join(copy, "src", "ui.ts"), drifted);
  const env = isolatedPackageManagerEnv(stage);
  function mustReject(command: string[], controls: Record<string, string> = {}): void {
    const result = Bun.spawnSync(command, { cwd: copy, env: { ...env, ...controls }, stdout: "pipe", stderr: "pipe" });
    const output = result.stdout.toString() + result.stderr.toString();
    assert.notEqual(result.exitCode, 0, `stale-source command unexpectedly succeeded: ${command.join(" ")}`);
    assert.match(output, /SOURCE_ONLY_DRIFT/, output);
    assert.equal(readdirSync(copy).some(name => name.endsWith(".tgz")), false, "failed gate must not emit an archive");
  }
  mustReject([process.execPath, join(copy, "scripts", "check-package.ts")]);
  // These obsolete test variables must neither short-circuit nor redirect either release entrypoint.
  const probes: Record<string, string>[] = [
    { WOLFPACK_CHANGES_PROBE_DYNAMIC_IMPORT: "1" },
    { WOLFPACK_CHANGES_ROOT: root },
    { WOLFPACK_CHANGES_PROBE_DYNAMIC_IMPORT: "1", WOLFPACK_CHANGES_ROOT: root },
  ];
  for (const controls of probes) {
    mustReject([process.execPath, join(copy, "scripts", "check-package.ts")], controls);
    mustReject([process.execPath, "run", "pack"], controls);
  }
  for (const module of ["if (false) import('dormant-dependency');", "import 'side-effect';", "export { value } from 'dependency';", "function dormant() { return require('dependency'); }"]) {
    assert.throws(() => assertSelfContained(Buffer.from(module)), /external dependency syntax/);
  }
  assertSelfContained(Buffer.from('export default () => "import is harmless in a string";'));
  process.stdout.write("stale source, ambient pack/gate bypasses, and external module syntax rejected\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
