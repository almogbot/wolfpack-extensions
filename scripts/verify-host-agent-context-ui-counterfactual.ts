#!/usr/bin/env bun
/** Causal guard: the reused selected-host component suite must reject document overflow. */
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const host = process.env.WOLFPACK_EXTENSION_HOST_ROOT;
if (!host) throw new Error("set WOLFPACK_EXTENSION_HOST_ROOT to a selected APIv1 host");
const stage = mkdtempSync(join(tmpdir(), "wolfpack-agent-context-css-counterfactual-"));
try {
  const css = join(stage, "styles.css"); copyFileSync(join(host, "public", "styles.css"), css); writeFileSync(css, `${await Bun.file(css).text()}\nhtml{min-width:5000px}body{overflow:visible}`);
  const result = Bun.spawnSync(["bun", "test", "packages/agent-context/test/component.test.ts"], { cwd: join(import.meta.dirname, ".."), env: { ...process.env, WOLFPACK_EXTENSION_HOST_ROOT: host, WOLFPACK_EXTENSION_HOST_CSS_PATH: css }, stdout: "pipe", stderr: "pipe" });
  const output = result.stdout.toString() + result.stderr.toString();
  if (result.exitCode === 0 || !output.includes("document.documentElement.scrollWidth")) throw new Error(`overflow counterfactual did not causally fail document assertion:\n${output}`);
  process.stdout.write("reused selected-host component suite causally rejected document overflow counterfactual\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
