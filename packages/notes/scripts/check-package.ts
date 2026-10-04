#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assertSelfContained } from "./bundle-policy.ts";
import { buildBundle } from "./build-bundle.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";
const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-notes-pack-"));
function fail(message: string): never { throw new Error(`PACKAGE_GATE: ${message}`); }
try {
  const fresh = join(stage, "fresh-dist"); await buildBundle(root, fresh);
  const source = readFileSync(join(root, "dist", "ui.js")), rebuilt = readFileSync(join(fresh, "ui.js"));
  if (!source.equals(rebuilt)) fail("SOURCE_ONLY_DRIFT: fresh src/ui.ts build differs from checked-in dist/ui.js"); assertSelfContained(source);
  const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts", "--json", "--pack-destination", stage], { cwd: root, env: isolatedPackageManagerEnv(stage), stdout: "pipe", stderr: "pipe" });
  if (packed.exitCode !== 0) fail(packed.stderr.toString()); const info = JSON.parse(packed.stdout.toString())[0] as { filename: string; files: Array<{ path: string }> };
  const paths = info.files.map(file => file.path).sort(), expected = ["LICENSE", "README.md", "dist/ui.js", "package.json"];
  if (paths.join("|") !== expected.join("|")) fail(`unexpected packed files: ${paths.join(", ")}`); const archive = join(stage, info.filename);
  if (!existsSync(archive) || Bun.spawnSync(["tar", "-xzf", archive, "-C", stage]).exitCode !== 0) fail("could not unpack npm artifact");
  const manifest = JSON.parse(readFileSync(join(stage, "package", "package.json"), "utf8"));
  if (manifest.private === true || manifest.name !== "wolfpack-extension-notes" || manifest.version !== "0.1.0" || manifest.dependencies || manifest.optionalDependencies || manifest.peerDependencies || manifest.wolfpack?.manifestVersion !== 1 || manifest.wolfpack?.apiVersion !== 1 || manifest.wolfpack?.id !== "notes" || manifest.wolfpack?.ui !== "dist/ui.js" || JSON.stringify(manifest.wolfpack?.skills) !== "[]" || JSON.stringify(manifest.wolfpack?.documents) !== "[]") fail("packed manifest is not the dependency-free Notes APIv1 release manifest");
  if (Object.keys(manifest.scripts ?? {}).some(key => /^(pre|post)?install$/.test(key))) fail("packed manifest must not declare lifecycle installation scripts");
  const bundle = readFileSync(join(stage, "package", "dist", "ui.js")); if (!bundle.equals(source) || bundle.byteLength > 1024 * 1024) fail("packed bundle is stale, altered, or exceeds 1 MiB"); assertSelfContained(bundle);
  const module = await import(pathToFileURL(join(stage, "package", "dist", "ui.js")).href), views: string[] = [], layouts: string[] = [];
  module.default({ registerContextView: (view: { id: string }) => views.push(view.id), registerTerminalLayout: (layout: { id: string }) => layouts.push(layout.id) });
  if (views.join("|") !== "notes" || layouts.join("|") !== "vertical-stack") fail("packed bundle does not provide Notes APIv1 contributions");
  process.stdout.write(`${archive}\nsha512-${createHash("sha512").update(readFileSync(archive)).digest("base64")}\n`);
} finally { rmSync(stage, { recursive: true, force: true }); }
