#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assertSelfContained } from "./bundle-policy.ts";
import { buildBundle } from "./build-bundle.ts";
import { isolatedPackageManagerEnv } from "./package-env.ts";

const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-agent-context-pack-"));
const schemaPath = "schemas/context.schema.json", skillPath = "skills/wolfpack-agent-context/SKILL.md", referencePath = "skills/wolfpack-agent-context/references/context-format.md";
const requiredFiles = ["LICENSE", "README.md", "dist/ui.js", "package.json", schemaPath, skillPath, referencePath].sort();
const FROZEN_SCHEMA_SHA256 = "1e1e51e94c628b104fd927995995ed484385c3ebc87741787a8cd67694c485e3";
function fail(message: string): never { throw new Error(`PACKAGE_GATE: ${message}`); }
function exactManifest(manifest: any): void {
  const documents = [{ id: "context", schemaVersion: 1, schema: schemaPath }];
  if (manifest.private === true || manifest.name !== "wolfpack-extension-agent-context" || manifest.version !== "0.1.0" || manifest.dependencies || manifest.optionalDependencies || manifest.peerDependencies || manifest.wolfpack?.manifestVersion !== 1 || manifest.wolfpack?.apiVersion !== 1 || manifest.wolfpack?.id !== "agent-context" || manifest.wolfpack?.ui !== "dist/ui.js" || JSON.stringify(manifest.wolfpack?.skills) !== '["skills/wolfpack-agent-context"]' || JSON.stringify(manifest.wolfpack?.documents) !== JSON.stringify(documents)) fail("Agent Context manifest must declare the exact APIv1 document/schema/skill contract");
  if (Object.keys(manifest.scripts ?? {}).some(key => /^(pre|post)?install$/.test(key))) fail("packed manifest must not declare lifecycle installation scripts");
}
try {
  const fresh = join(stage, "fresh-dist"); await buildBundle(root, fresh);
  const sourceBundle = readFileSync(join(root, "dist", "ui.js")), rebuilt = readFileSync(join(fresh, "ui.js"));
  if (!sourceBundle.equals(rebuilt)) fail("SOURCE_ONLY_DRIFT: fresh src/ui.ts build differs from checked-in dist/ui.js"); assertSelfContained(sourceBundle);
  const sourceSchema = readFileSync(join(root, schemaPath));
  if (createHash("sha256").update(sourceSchema).digest("hex") !== FROZEN_SCHEMA_SHA256) fail("FROZEN_SCHEMA_DRIFT: Agent Context schema bytes changed");
  exactManifest(JSON.parse(readFileSync(join(root, "package.json"), "utf8")));
  const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts", "--json", "--pack-destination", stage], { cwd: root, env: isolatedPackageManagerEnv(stage), stdout: "pipe", stderr: "pipe" });
  if (packed.exitCode !== 0) fail(packed.stderr.toString()); const info = JSON.parse(packed.stdout.toString())[0] as { filename: string; files: Array<{ path: string }> };
  const paths = info.files.map(file => file.path).sort(); if (paths.join("|") !== requiredFiles.join("|")) fail(`unexpected packed files: ${paths.join(", ")}`);
  const archive = join(stage, info.filename); if (!existsSync(archive) || Bun.spawnSync(["tar", "-xzf", archive, "-C", stage]).exitCode !== 0) fail("could not unpack npm artifact");
  const shipped = join(stage, "package"); exactManifest(JSON.parse(readFileSync(join(shipped, "package.json"), "utf8")));
  for (const path of [schemaPath, skillPath, referencePath]) if (!readFileSync(join(shipped, path)).equals(readFileSync(join(root, path)))) fail(`PACKED_ASSET_DRIFT: ${path} differs from reviewed source`);
  const bundle = readFileSync(join(shipped, "dist", "ui.js")); if (!bundle.equals(sourceBundle) || bundle.byteLength > 1024 * 1024) fail("packed bundle is stale, altered, or exceeds 1 MiB"); assertSelfContained(bundle);
  const module = await import(pathToFileURL(join(shipped, "dist", "ui.js")).href), views: string[] = [], layouts: string[] = [];
  module.default({ registerContextView: (view: { id: string }) => views.push(view.id), registerTerminalLayout: (layout: { id: string }) => layouts.push(layout.id) });
  if (views.join("|") !== "context" || layouts.length) fail("packed bundle does not provide only the Agent Context view");
  process.stdout.write(`${archive}\nsha512-${createHash("sha512").update(readFileSync(archive)).digest("base64")}\n`);
} finally { rmSync(stage, { recursive: true, force: true }); }
