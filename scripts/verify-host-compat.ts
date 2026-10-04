#!/usr/bin/env bun
/** Optional strict APIv1 proof. Normal package development never imports a host. */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = process.env.WOLFPACK_EXTENSION_HOST_ROOT;
if (!host) throw new Error("set WOLFPACK_EXTENSION_HOST_ROOT to an explicitly selected APIv1 host checkout");
const sdk = join(host, "src", "extensions", "public-sdk.ts");
const tsc = join(import.meta.dirname, "..", "node_modules", ".bin", "tsc");
if (!existsSync(sdk) || !existsSync(tsc)) throw new Error("selected host must export public-sdk.ts and this repository must have pinned TypeScript installed");
const root = join(import.meta.dirname, ".."), stage = mkdtempSync(join(tmpdir(), "wolfpack-extensions-api-compat-"));
try {
  const changes = join(root, "packages", "changes", "src", "api.ts"), agent = join(root, "packages", "agent-context", "src", "api.ts"), notes = join(root, "packages", "notes", "src", "api.ts");
  writeFileSync(join(stage, "compat.ts"), `import type { ExtensionRegistrationHost as Host, ExtensionViewContext as HostContext, ContextViewContribution as HostView, ProjectGitStatus as HostStatus } from ${JSON.stringify(sdk)};
import type { ExtensionRegistrationHost as ChangesHost, ExtensionViewContext as ChangesContext, ProjectGitStatus as ChangesStatus } from ${JSON.stringify(changes)};
import type { ExtensionRegistrationHost as AgentHost, ExtensionViewContext as AgentContext, ContextViewContribution as AgentView } from ${JSON.stringify(agent)};
import type { ExtensionRegistrationHost as NotesHost, ExtensionViewContext as NotesContext } from ${JSON.stringify(notes)};
type Assert<T extends true> = T; type Assignable<A, B> = [A] extends [B] ? true : false;
type ChangesView = Parameters<ChangesHost["registerContextView"]>[0];
type NotesView = Parameters<NotesHost["registerContextView"]>[0]; type NotesLayout = Parameters<NotesHost["registerTerminalLayout"]>[0];
type HostLayout = Parameters<Host["registerTerminalLayout"]>[0];
type ChangesContributionAccepted = Assert<Assignable<ChangesView, HostView>>;
type AgentContributionAccepted = Assert<Assignable<AgentView, HostView>>;
type NotesContributionAccepted = Assert<Assignable<NotesView, HostView>>;
type NotesLayoutAccepted = Assert<Assignable<NotesLayout, HostLayout>>;
type HostContextServesChanges = Assert<Assignable<HostContext, ChangesContext>>;
type HostContextServesAgent = Assert<Assignable<HostContext, AgentContext>>;
type HostContextServesNotes = Assert<Assignable<HostContext, NotesContext>>;
type HostStatusServesChanges = Assert<Assignable<HostStatus, ChangesStatus>>;
declare const changesView: ChangesView;
type IncompatibleMount = Omit<HostView, "mount"> & { mount(container: HTMLElement, context: { readonly signal: string }): { dispose(): void } };
// @ts-expect-error A changed signal contract must reject the real Changes contribution.
const mustRejectIncompatibleMount: IncompatibleMount = changesView;
type FutureRequiredView = HostView & { readonly futureRequiredField: string };
// @ts-expect-error A future host-required contribution field must reject all current local contributions.
const mustRejectFutureField: FutureRequiredView = changesView;
void mustRejectIncompatibleMount; void mustRejectFutureField;
`);
  const result = Bun.spawnSync([tsc, "--noEmit", "--ignoreConfig", "--strict", "--module", "preserve", "--moduleResolution", "bundler", "--allowImportingTsExtensions", "--target", "ESNext", "--lib", "ESNext,DOM", "--skipLibCheck", join(stage, "compat.ts")], { cwd: stage, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString() || result.stdout.toString());
  process.stdout.write("strict APIv1 structural compatibility passed for Changes, Agent Context and Notes; incompatible seams rejected\n");
} finally { rmSync(stage, { recursive: true, force: true }); }
