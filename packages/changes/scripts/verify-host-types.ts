#!/usr/bin/env bun
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = process.env.WOLFPACK_EXTENSION_HOST_ROOT;
if (!host) throw new Error("set WOLFPACK_EXTENSION_HOST_ROOT to the APIv1 host checkout");
const root = join(import.meta.dirname, ".."), tsc = join(root, "node_modules", ".bin", "tsc");
if (!existsSync(tsc)) throw new Error("install this package's pinned dev dependencies before verify:host-types");
const stage = mkdtempSync(join(tmpdir(), "wolfpack-changes-api-compat-"));
try {
  const local = join(root, "src", "api.ts"), sdk = join(host, "src", "extensions", "public-sdk.ts");
  writeFileSync(join(stage, "compat.ts"), `import type { ExtensionRegistrationHost as Local, ExtensionViewContext as LocalContext, ProjectGitStatus as LocalStatus } from ${JSON.stringify(local)};
import type { ExtensionRegistrationHost as Host, ExtensionViewContext as HostContext, ProjectGitStatus as HostStatus } from ${JSON.stringify(sdk)};
type Assert<T extends true> = T; type Assignable<A, B> = [A] extends [B] ? true : false;
type LocalContribution = Parameters<Local["registerContextView"]>[0]; type HostContribution = Parameters<Host["registerContextView"]>[0];
type LocalContributionAcceptedByHost = Assert<Assignable<LocalContribution, HostContribution>>;
type HostContextCanServeLocal = Assert<Assignable<HostContext, LocalContext>>; type HostStatusCanServeLocal = Assert<Assignable<HostStatus, LocalStatus>>;
type SyntheticNarrowHostContribution = HostContribution & { futureRequiredField: string };
declare const locallyAuthoredContribution: LocalContribution;
// @ts-expect-error A host-required contribution field must reject current local contributions.
const mustRejectNarrowHost: SyntheticNarrowHostContribution = locallyAuthoredContribution;
void mustRejectNarrowHost;
`);
  const result = Bun.spawnSync([tsc, "--noEmit", "--ignoreConfig", "--strict", "--module", "preserve", "--moduleResolution", "bundler", "--allowImportingTsExtensions", "--target", "ESNext", "--lib", "ESNext,DOM", "--skipLibCheck", join(stage, "compat.ts")], { cwd: stage, env: { PATH: process.env.PATH ?? "" }, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString() || result.stdout.toString());
  process.stdout.write("pinned strict APIv1 host contribution/context/status compatibility passed\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
