#!/usr/bin/env bun
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isolatedPackageManagerEnv } from "./package-env.ts";

const source = join(import.meta.dirname, "..");
const target = mkdtempSync(join(tmpdir(), "wolfpack-changes-portable-"));
try {
  for (const path of ["package.json", "bun.lock", "tsconfig.json", ".gitignore", "LICENSE", "README.md", "RELEASE.md", "src", "scripts", "test", "dist"]) cpSync(join(source, path), join(target, path), { recursive: true });
  for (const command of [["bun", "install", "--frozen-lockfile"], ["bun", "run", "typecheck"], ["bun", "run", "build"], ["bun", "run", "check:package"]]) {
    const result = Bun.spawnSync(command, { cwd: target, env: isolatedPackageManagerEnv(join(target, ".package-manager")), stdout: "pipe", stderr: "pipe" });
    if (result.exitCode !== 0) throw new Error(`${command.join(" ")} failed outside the source checkout: ${result.stderr.toString()}`);
  }
  process.stdout.write(`${target}\n`);
} finally { rmSync(target, { recursive: true, force: true }); }
