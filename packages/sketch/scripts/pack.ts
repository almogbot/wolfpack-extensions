#!/usr/bin/env bun
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isolatedPackageManagerEnv } from "./package-env.ts";

const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-product-pack-command-"));
try {
  const env = isolatedPackageManagerEnv(stage);
  const gate = Bun.spawnSync([process.execPath, join(root, "scripts", "check-package.ts")], { cwd: root, env, stdout: "pipe", stderr: "pipe" });
  if (gate.exitCode !== 0) throw new Error(gate.stderr.toString() || gate.stdout.toString());
  const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts"], { cwd: root, env, stdout: "inherit", stderr: "inherit" });
  if (packed.exitCode !== 0) throw new Error("npm pack failed after package gate");
} finally { rmSync(stage, { recursive: true, force: true }); }
