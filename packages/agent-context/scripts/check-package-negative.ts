#!/usr/bin/env bun
import { strict as assert } from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSelfContained } from "./bundle-policy.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";
const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-agent-context-negative-"));
try {
  const copy = join(stage, "project"); mkdirSync(copy);
  for (const name of ["package.json", "README.md", "LICENSE", "src", "dist", "scripts", "schemas", "skills"]) cpSync(join(root, name), join(copy, name), { recursive: true });
  const env = isolatedPackageManagerEnv(stage);
  const reject = (label: string, mutate: () => void, expected: RegExp) => {
    const fixture = join(stage, label); cpSync(copy, fixture, { recursive: true }); symlinkSync(join(root, "..", "..", "node_modules"), join(fixture, "node_modules"), "dir"); mutateFixture(fixture, mutate);
    for (const command of [[process.execPath, join(fixture, "scripts", "check-package.ts")], [process.execPath, "run", "pack"]]) {
      const result = Bun.spawnSync(command, { cwd: fixture, env, stdout: "pipe", stderr: "pipe" }), output = result.stdout.toString() + result.stderr.toString();
      assert.notEqual(result.exitCode, 0, `${label}: ${command.join(" ")} unexpectedly succeeded`); assert.match(output, expected, `${label}: ${output}`); assert.equal(readdirSync(fixture).some(name => name.endsWith(".tgz")), false, `${label}: failed gate emitted archive`);
    }
  };
  let current = copy;
  const mutateFixture = (fixture: string, mutate: () => void) => { current = fixture; mutate(); };
  const manifest = (change: (value: any) => void) => () => { const path = join(current, "package.json"), value = JSON.parse(readFileSync(path, "utf8")); change(value); writeFileSync(path, JSON.stringify(value, null, 2) + "\n"); };
  reject("stale-source", () => { const path = join(current, "src", "ui.ts"), source = readFileSync(path, "utf8"), stale = source.replace('title: "Agent Context"', 'title: "Stale source counterfactual"'); assert.notEqual(stale, source); writeFileSync(path, stale); }, /SOURCE_ONLY_DRIFT/);
  reject("missing-document", manifest(value => { value.wolfpack.documents = []; }), /exact APIv1 document/);
  reject("wrong-manifest-version", manifest(value => { value.wolfpack.manifestVersion = 2; }), /exact APIv1 document/);
  reject("wrong-schema-version", manifest(value => { value.wolfpack.documents[0].schemaVersion = 2; }), /exact APIv1 document/);
  reject("wrong-schema-path", manifest(value => { value.wolfpack.documents[0].schema = "schemas/other.json"; }), /exact APIv1 document/);
  reject("altered-schema", () => writeFileSync(join(current, "schemas", "context.schema.json"), "{}\n"), /FROZEN_SCHEMA_DRIFT/);
  reject("missing-skill", () => unlinkSync(join(current, "skills", "wolfpack-agent-context", "SKILL.md")), /unexpected packed files|ENOENT/);
  reject("missing-reference", () => unlinkSync(join(current, "skills", "wolfpack-agent-context", "references", "context-format.md")), /unexpected packed files|ENOENT/);
  for (const value of ["if (false) import('dormant-dependency');", "import 'side-effect';", "function dormant() { return require('dependency'); }"]) assert.throws(() => assertSelfContained(Buffer.from(value)), /external dependency syntax/);
  process.stdout.write("actual checker/pack reject stale source, exact manifest/schema and required assets\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
