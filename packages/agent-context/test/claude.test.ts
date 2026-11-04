import { expect, test } from "bun:test";
import { CLAUDE_FOCUS_TOOL, CLAUDE_GUIDANCE, CLAUDE_LIFECYCLE_TOOL, CLAUDE_TOOLS, ClaudeFocusController, TOOL_USE_META, callTool, parseLifecycle, startupGuidance } from "../src/claude.ts";
import { FocusPublisher, PublicationError, type PublicationTransport } from "../src/publisher.ts";
import type { FocusDocument } from "../src/focus.ts";
import { claudeFocusDocument, focusSnapshot } from "./focus-fixture.ts";

const SESSION = "33333333-3333-4333-8333-333333333333", OTHER = "55555555-5555-4555-8555-555555555555";
const PROMPT = "44444444-4444-4444-8444-444444444444";
let clock = 0;
const now = () => new Date(Date.UTC(2026, 0, 1, 0, 0, clock++)).toISOString();
function fixture(initial: FocusDocument | null = null, projectDir: string | null = "/project") {
  let document = initial; let revision = initial ? 1 : 0; const writes: FocusDocument[] = []; const resolved: string[] = [];
  const transport: PublicationTransport = {
    resolve: async dir => { resolved.push(dir); return { sessionId: "11111111-1111-4111-8111-111111111111", projectDir: dir }; },
    read: async () => ({ document, revision }),
    publish: async (_scope, value) => { document = value; writes.push(value); return { revision: ++revision }; },
  };
  const errors: string[] = [];
  const controller = new ClaudeFocusController(new FocusPublisher(transport, now), projectDir ?? undefined, message => errors.push(message));
  const hook = async (args: Record<string, string>) => {
    const result = await callTool(controller, CLAUDE_LIFECYCLE_TOOL, args, undefined); await controller.settled(); return result;
  };
  const prompt = (sessionId = SESSION, promptId = PROMPT) => hook({ event: "prompt", session_id: sessionId, prompt_id: promptId });
  const done = (toolUseId: string, failed = false, sessionId = SESSION, agentId = "") => hook({ event: "tool_done", session_id: sessionId, tool_use_id: toolUseId, agent_id: agentId, failed: String(failed) });
  const stop = (sessionId = SESSION) => hook({ event: "stop", session_id: sessionId });
  /** Native PostToolBatch: every call in the batch resolved, before the next model request. */
  const batch = (sessionId = SESSION, agentId = "") => hook({ event: "tool_batch", session_id: sessionId, agent_id: agentId });
  /** Native order: PreToolUse hook, model tools/call with toolUseId metadata, then PostToolUse/Failure hook. */
  const focus = async (toolUseId: string, args: unknown = { snapshot: focusSnapshot }, options: { sessionId?: string; agentId?: string; postHook?: boolean } = {}) => {
    await hook({ event: "pre_focus", session_id: options.sessionId ?? SESSION, tool_use_id: toolUseId, agent_id: options.agentId ?? "" });
    const result = await callTool(controller, CLAUDE_FOCUS_TOOL, args, { [TOOL_USE_META]: toolUseId });
    if (options.postHook !== false) await done(toolUseId, result.isError === true, options.sessionId ?? SESSION, options.agentId ?? "");
    return result;
  };
  return { controller, transport, writes, errors, resolved, hook, prompt, done, stop, batch, focus, get document() { return document; }, set document(value) { document = value; revision++; } };
}
const hookText = (output: unknown) => (output as { content: Array<{ text: string }> }).content[0]!.text;

test("first request binds the exact Claude session/project; structured update carries native prompt boundary", async () => {
  const f = fixture(); await f.prompt();
  expect(f.resolved).toEqual(["/project"]);
  const result = await f.focus("toolu_a");
  expect(result.isError).toBeUndefined();
  expect(f.document?.source).toEqual({ harness: "claude", sessionId: SESSION, promptId: PROMPT, coveredToolUseId: null });
  expect(f.document).toMatchObject({ schemaVersion: 3, freshness: "reviewed", activity: { state: "working" }, needsYou: focusSnapshot.needsYou });
  expect(hookText(await f.stop())).toBe(""); // own successful maintenance is not a new boundary
  expect(f.document?.activity.state).toBe("idle"); expect(f.document?.freshness).toBe("reviewed");
});

test("hook/model provenance is exact: no metadata, impersonated hooks, missing/foreign/subagent PreToolUse or reuse fail closed", async () => {
  const f = fixture(); await f.prompt();
  expect((await callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, undefined)).isError).toBe(true);
  expect((await callTool(f.controller, CLAUDE_LIFECYCLE_TOOL, { event: "stop", session_id: SESSION }, { [TOOL_USE_META]: "toolu_model" })).isError).toBe(true);
  expect((await callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_unpinned" })).isError).toBe(true);
  expect((await f.focus("toolu_sub", undefined, { agentId: "agent-1" })).isError).toBe(true);
  expect((await f.focus("toolu_foreign", undefined, { sessionId: OTHER, postHook: false })).isError).toBe(true);
  expect((await callTool(f.controller, "unknown_tool", {}, { [TOOL_USE_META]: "toolu_x" })).isError).toBe(true);
  expect(f.writes.filter(write => write.freshness === "reviewed")).toHaveLength(0);
  expect((await f.focus("toolu_ok")).isError).toBeUndefined();
  expect((await callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_ok" })).isError).toBe(true); // replay of a consumed call id
});

test("routine work and new prompts retain snapshots; Stop never requests a refresh", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_a");
  const original = structuredClone(f.document!);
  await f.done("toolu_bash"); await f.batch();
  expect(f.document?.freshness).toBe("reviewed");
  expect(hookText(await f.stop())).toBe(""); expect(f.document?.activity.state).toBe("idle");
  await f.prompt(SESSION, "66666666-6666-4666-8666-666666666666"); await f.done("toolu_more"); await f.batch();
  await f.focus("toolu_same");
  expect(f.document).toMatchObject({ freshness: "reviewed", updatedAt: original.updatedAt, source: original.source });
  expect(hookText(await f.stop())).toBe("");
  await f.focus("toolu_changed", { snapshot: { ...focusSnapshot, goal: "New goal" } });
  expect(f.document).toMatchObject({ goal: "New goal", source: { promptId: "66666666-6666-4666-8666-666666666666", coveredToolUseId: "toolu_more" } });
});

test("failed self-maintenance after an earlier success invalidates coverage even without its failure hook", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_a", { snapshot: { ...focusSnapshot, needsYou: [] } });
  const semanticTime = f.document!.updatedAt;
  const invalid = await f.focus("toolu_bad", { snapshot: { ...focusSnapshot, nextSteps: [{ id: "x", text: "No owner" }] } }, { postHook: false });
  expect(invalid.isError).toBe(true);
  const publish = f.transport.publish; f.transport.publish = async () => { throw new PublicationError("unavailable", "fixture offline"); };
  expect((await f.focus("toolu_offline", { snapshot: focusSnapshot })).isError).toBe(true);
  f.transport.publish = publish;
  await f.done("toolu_bad", true); // a late duplicate failure hook is harmless
  await f.batch(); // native: the failed results are delivered before the next model request
  expect(f.document).toMatchObject({ needsYou: [], updatedAt: semanticTime });
  expect(hookText(await f.stop())).toBe(""); expect(f.document?.freshness).toBe("unreviewed");
  expect((await f.focus("toolu_cover", { snapshot: focusSnapshot })).isError).toBeUndefined();
  expect(f.document?.source).toEqual({ harness: "claude", sessionId: SESSION, promptId: PROMPT, coveredToolUseId: "toolu_offline" });
  expect(hookText(await f.stop())).toBe("");
  expect(f.document).toMatchObject({ freshness: "reviewed", activity: { state: "idle" }, needsYou: focusSnapshot.needsYou });
});

test("malformed, oversized, unknown or raw-content lifecycle fields are rejected without state changes", async () => {
  for (const input of [
    null, [], "prompt", { event: "prompt", session_id: SESSION, prompt_id: PROMPT, prompt: "user text" },
    { event: "tool_done", session_id: SESSION, tool_use_id: "t", agent_id: "", failed: "yes" },
    { event: "tool_done", session_id: SESSION, tool_use_id: "t", agent_id: "", failed: true },
    { event: "prompt", session_id: "x".repeat(129), prompt_id: "" }, { event: "prompt", session_id: "", prompt_id: "" },
    { event: "prompt", session_id: "a b", prompt_id: "" }, { event: "unknown", session_id: SESSION },
    { event: "session_start", session_id: SESSION, source: "guess" }, { event: "stop", session_id: SESSION, transcript_path: "/tmp/t.jsonl" },
    { event: "pre_focus", session_id: SESSION, tool_use_id: "", agent_id: "" },
    { event: "tool_batch", session_id: SESSION, agent_id: "", tool_calls: "[{\"tool_response\":\"secret\"}]" },
  ]) expect(() => parseLifecycle(input)).toThrow(PublicationError);
  expect(parseLifecycle({ event: "tool_batch", session_id: SESSION, agent_id: "" })).toEqual({ event: "tool_batch", sessionId: SESSION, agentId: null });
  const f = fixture(); await f.prompt(); const before = f.writes.length;
  expect((await f.hook({ event: "prompt", session_id: OTHER, prompt_id: PROMPT, prompt: "secret" })).isError).toBe(true);
  expect(f.writes.length).toBe(before); expect(f.resolved).toHaveLength(1);
  expect(parseLifecycle({ event: "tool_done", session_id: SESSION, tool_use_id: "toolu_1", agent_id: "", failed: "true" })).toEqual({ event: "tool_done", sessionId: SESSION, toolUseId: "toolu_1", agentId: null, failed: true });
  expect(parseLifecycle({ event: "prompt", session_id: SESSION, prompt_id: "" })).toEqual({ event: "prompt", sessionId: SESSION, promptId: null });
});

test("subagent work and delayed callbacks from a replaced Claude session cannot change the active binding", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_a");
  await f.done("toolu_sub_internal", false, SESSION, "agent-1");
  expect(f.document?.freshness).toBe("reviewed"); // the parent's Agent tool result is the boundary
  await f.prompt(OTHER, "77777777-7777-4777-8777-777777777777"); // /clear, /resume or fork: new native session id
  expect(f.controller.snapshot).toBeNull(); // another conversation's semantics are not restored
  const writes = f.writes.length;
  await f.done("toolu_old", false, SESSION); expect(hookText(await f.stop(SESSION))).toBe("");
  expect(f.writes.length).toBe(writes);
  expect((await f.focus("toolu_stale", undefined, { sessionId: SESSION })).isError).toBe(true);
  expect((await f.focus("toolu_new", undefined, { sessionId: OTHER })).isError).toBeUndefined();
  expect(f.document?.source).toMatchObject({ harness: "claude", sessionId: OTHER });
});

test("an in-flight update is fenced when the native session changes", async () => {
  const f = fixture(); await f.prompt();
  const publish = f.transport.publish; let release!: () => void; let began!: () => void; const started = new Promise<void>(resolve => { began = resolve; });
  f.transport.publish = async (...args) => { if (args[1].freshness === "reviewed") { began(); await new Promise<void>(resolve => { release = resolve; }); } return publish(...args); };
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_slow", agent_id: "" });
  const pending = callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_slow" }); await started;
  await f.hook({ event: "session_start", session_id: OTHER, source: "clear" }); release();
  expect((await pending).isError).toBe(true);
  expect(f.controller.snapshot).toBeNull();
});

test("process restart restores only the same native session's remote semantics, marked unreviewed", async () => {
  const same = fixture(claudeFocusDocument); await same.prompt();
  expect(same.controller.snapshot).toMatchObject({ goal: claudeFocusDocument.goal, freshness: "unreviewed" });
  expect(same.document?.freshness).toBe("unreviewed"); expect(same.document?.updatedAt).toBe(claudeFocusDocument.updatedAt);
  const other = fixture({ ...claudeFocusDocument, source: { ...claudeFocusDocument.source, sessionId: OTHER } }); await other.prompt();
  expect(other.controller.snapshot).toBeNull();
  expect(other.document).toMatchObject({ freshness: "unreviewed", goal: claudeFocusDocument.goal, source: { sessionId: OTHER } }); // runtime writes never adopt it
});

test("compaction keeps the binding; API failures change only activity", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_a");
  await f.hook({ event: "session_start", session_id: SESSION, source: "compact" });
  expect(f.resolved).toHaveLength(1); expect(f.controller.snapshot?.freshness).toBe("reviewed");
  await f.done("toolu_b");
  await f.hook({ event: "stop_failure", session_id: SESSION });
  expect(f.document).toMatchObject({ freshness: "reviewed", activity: { state: "interrupted" } });
});

test("parallel tool results during an update retain honest pinned provenance without invalidating semantics", async () => {
  const f = fixture(); await f.prompt();
  const publish = f.transport.publish; let release!: () => void; let began!: () => void; const started = new Promise<void>(resolve => { began = resolve; });
  f.transport.publish = async (...args) => { if (args[1].freshness === "reviewed") { began(); await new Promise<void>(resolve => { release = resolve; }); } return publish(...args); };
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_focus", agent_id: "" });
  const pending = callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_focus" }); await started;
  const sibling = f.controller.lifecycle({ event: "tool_done", sessionId: SESSION, toolUseId: "toolu_sibling", agentId: null, failed: false }); release();
  expect((await pending).isError).toBeUndefined(); await sibling; await f.done("toolu_focus");
  f.transport.publish = publish; // Only the semantic write is held; Stop's independent activity write must run normally.
  expect(hookText(await f.stop())).toBe(""); expect(f.document).toMatchObject({ freshness: "reviewed", source: { coveredToolUseId: null } });
});

test("binding and publication failures are visible, never synced, without forced continuations", async () => {
  const missing = fixture(null, null); await missing.prompt();
  const unavailable = await missing.focus("toolu_a");
  expect(unavailable.isError).toBe(true); expect(unavailable.content[0]!.text).toContain("CLAUDE_PROJECT_DIR");
  expect(missing.errors.length).toBeGreaterThan(0);
  const f = fixture(); f.transport.publish = async () => { throw new PublicationError("unavailable", "Wolfpack CLI rejected publication/identity (STORE_UNAVAILABLE)"); };
  await f.prompt();
  expect((await f.focus("toolu_a")).isError).toBe(true);
  const context = (await f.prompt(SESSION, "88888888-8888-4888-8888-888888888888")).content[0]!.text;
  expect(context).toContain("STORE_UNAVAILABLE");
  expect(hookText(await f.stop())).toBe(""); expect(hookText(await f.stop())).toBe("");
  expect(f.document).toBeNull();
});

test("missing prompt ids do not churn freshness; activity publication failures remain visible", async () => {
  const f = fixture(); await f.prompt(SESSION, ""); await f.focus("toolu_a");
  const original = structuredClone(f.document!);
  f.transport.publish = async () => { throw new PublicationError("unavailable", "fixture offline"); };
  await f.prompt(SESSION, "");
  expect(hookText(await f.stop())).toBe("");
  expect(f.document).toEqual(original); expect(f.errors).toContain("fixture offline");
  expect((await f.prompt(SESSION, "")).content[0]!.text).toContain("not synced");
});


// --- review corrections D-01..D-04 ---
const failing = (transport: PublicationTransport, error: PublicationError) => { transport.resolve = async () => { throw error; }; };
test("D-01: an unverified or mismatched scope stays inert: no guidance, refresh, missed write or not-synced nag; tool errors stay honest", async () => {
  for (const error of [new PublicationError("unavailable", "Wolfpack CLI rejected publication/identity (CURRENT_CONTEXT_UNAVAILABLE)"), new PublicationError("invalid", "Expected exact verified claude Wolfpack session and project; no name/environment fallback")]) {
    const f = fixture(); failing(f.transport, error);
    for (const promptId of [PROMPT, "66666666-6666-4666-8666-666666666666"]) {
      expect((await f.prompt(SESSION, promptId)).content[0]!.text).toBe("");
      await f.done("toolu_work"); await f.batch();
      expect(hookText(await f.stop())).toBe("");
    }
    const attempt = await f.focus("toolu_attempt");
    expect(attempt.isError).toBe(true); expect(attempt.content[0]!.text).toContain(error.message);
    expect(f.writes).toHaveLength(0); expect(f.errors.length).toBeGreaterThan(0);
    expect(await startupGuidance(f.transport, "/project")).toBe("");
  }
  const verified = fixture();
  expect(await startupGuidance(verified.transport, "/project")).toBe(CLAUDE_GUIDANCE);
  expect(await startupGuidance(verified.transport, undefined)).toBe("");
});

test("D-02: a transient first-bind failure recovers on the next request, once per request, without bind storms", async () => {
  const f = fixture(); const resolve = f.transport.resolve; let attempts = 0;
  f.transport.resolve = async (dir, signal) => { if (attempts++ === 0) throw new PublicationError("unavailable", "Wolfpack CLI rejected publication/identity (STORE_UNAVAILABLE)"); return resolve(dir, signal); };
  await f.prompt(); await f.done("toolu_work"); await f.batch();
  expect(hookText(await f.stop())).toBe(""); expect(hookText(await f.stop())).toBe("");
  expect(attempts).toBe(1); // hooks other than a request start never retry
  const recovered = await f.prompt(SESSION, "66666666-6666-4666-8666-666666666666");
  expect(attempts).toBe(2);
  expect(recovered.content[0]!.text).toContain(CLAUDE_GUIDANCE); // the model now learns the panel is active
  expect((await f.focus("toolu_recovered")).isError).toBeUndefined();
  expect(f.document).toMatchObject({ freshness: "reviewed", source: { harness: "claude", sessionId: SESSION } });
  await f.prompt(SESSION, "77777777-7777-4777-8777-777777777777");
  expect(attempts).toBe(2); // a healthy binding is not re-resolved
  const fence = fixture(); let calls = 0; fence.transport.resolve = async () => { calls++; throw new PublicationError("unavailable", "down"); };
  for (let i = 0; i < 3; i++) { await fence.prompt(SESSION, `8888888${i}-8888-4888-8888-888888888888`); await fence.stop(); await fence.done(`toolu_${i}`); }
  expect(calls).toBe(3);
});

test("delivered-boundary provenance stays exact without routine same-batch freshness churn", async () => {
  const f = fixture(); await f.prompt(); await f.done("toolu_bash", true);
  await f.focus("toolu_u");
  expect(f.document).toMatchObject({ freshness: "reviewed", source: { promptId: PROMPT, coveredToolUseId: null } });
  const original = structuredClone(f.document!);
  await f.batch(); await f.focus("toolu_same");
  expect(f.document).toEqual(original); // identical content does not falsely adopt the delivered sibling
  await f.focus("toolu_changed", { snapshot: { ...focusSnapshot, goal: "Consequential discovery" } });
  expect(f.document).toMatchObject({ freshness: "reviewed", source: { coveredToolUseId: "toolu_bash" } });
  expect(hookText(await f.stop())).toBe("");
});

test("D-04: denied or unexecuted main-conversation maintenance invalidates the reported snapshot without continuations; subagent pins and own success do not", async () => {
  const f = fixture(); await f.prompt();
  await f.focus("toolu_a", { snapshot: { ...focusSnapshot, needsYou: [] } }); await f.batch();
  expect(f.document?.freshness).toBe("reviewed");
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_sub", agent_id: "agent-1" }); await f.batch(SESSION, "agent-1");
  expect(f.document?.freshness).toBe("reviewed"); // a subagent's attempt is not main-conversation maintenance
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_denied", agent_id: "" }); // permission denied: never executes, no failure hook
  await f.batch();
  expect(f.document).toMatchObject({ freshness: "unreviewed", needsYou: [] });
  expect(hookText(await f.stop())).toBe("");
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_denied_again", agent_id: "" }); await f.batch();
  expect(hookText(await f.stop())).toBe(""); // repeated Stop is also notification-only
  expect(f.document).toMatchObject({ freshness: "unreviewed", activity: { state: "idle" }, needsYou: [] });
  // Stop without a PostToolBatch (turn ended by the denial) still treats the pinned attempt as failed maintenance.
  const g = fixture(); await g.prompt(); await g.focus("toolu_a"); await g.batch();
  await g.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_denied", agent_id: "" });
  expect(hookText(await g.stop())).toBe("");
  expect(g.document?.freshness).toBe("unreviewed");
});

test("unrecognized subagent metadata fails closed: no provenance pin, no delivered boundary, coverage unchanged", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_a"); await f.batch();
  expect((await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_odd", agent_id: "agent with spaces" })).isError).toBe(true);
  expect((await callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_odd" })).isError).toBe(true);
  expect((await f.hook({ event: "tool_batch", session_id: SESSION, agent_id: "agent/../x" })).isError).toBe(true);
  expect(f.document?.freshness).toBe("reviewed"); // the rejected call never ran and was not a main-conversation pin
});

test("D-02: guidance withheld at a failed start is delivered once after a slow recovery, at the next batch end", async () => {
  const f = fixture(); const resolve = f.transport.resolve; let attempts = 0; let release!: () => void;
  f.transport.resolve = async (dir, signal) => {
    if (attempts++ === 0) throw new PublicationError("unavailable", "down");
    await new Promise<void>(done => { release = done; }); return resolve(dir, signal);
  };
  await f.prompt();
  // Direct dispatch: the fixture's hook helper would also wait for background work blocked on the bind.
  const prompting = callTool(f.controller, CLAUDE_LIFECYCLE_TOOL, { event: "prompt", session_id: SESSION, prompt_id: "66666666-6666-4666-8666-666666666666" }, undefined);
  expect((await prompting).content[0]!.text).toBe(""); // bounded wait elapsed while the bind is still in flight
  release(); await f.controller.settled();
  expect(JSON.parse((await f.batch()).content[0]!.text)).toEqual({ hookSpecificOutput: { hookEventName: "PostToolBatch", additionalContext: CLAUDE_GUIDANCE } });
  expect((await f.batch()).content[0]!.text).toBe("");
  expect((await f.prompt(SESSION, "77777777-7777-4777-8777-777777777777")).content[0]!.text).toBe("");
  expect(attempts).toBe(2);
}, 10_000);

test("D-02: a slow first bind still in flight at the next request announces the panel once it verifies", async () => {
  const f = fixture(); const resolve = f.transport.resolve; let release!: () => void;
  f.transport.resolve = async (dir, signal) => { await new Promise<void>(done => { release = done; }); return resolve(dir, signal); };
  const first = callTool(f.controller, CLAUDE_LIFECYCLE_TOOL, { event: "prompt", session_id: SESSION, prompt_id: PROMPT }, undefined);
  expect((await first).content[0]!.text).toBe(""); // a normal first request does not wait
  const second = callTool(f.controller, CLAUDE_LIFECYCLE_TOOL, { event: "prompt", session_id: SESSION, prompt_id: "66666666-6666-4666-8666-666666666666" }, undefined);
  release();
  expect((await second).content[0]!.text).toBe(CLAUDE_GUIDANCE);
  await f.controller.settled(); expect((await f.batch()).content[0]!.text).toBe("");
});


test("RR-01: a pin abandoned by an earlier request cannot execute or stale the next request's coverage", async () => {
  const f = fixture(); await f.prompt();
  await f.hook({ event: "pre_focus", session_id: SESSION, tool_use_id: "toolu_abandoned", agent_id: "" }); // denied; turn ended without batch end or Stop
  await f.prompt(SESSION, "66666666-6666-4666-8666-666666666666");
  expect((await f.focus("toolu_ok")).isError).toBeUndefined(); await f.batch();
  expect(f.document).toMatchObject({ freshness: "reviewed", source: { promptId: "66666666-6666-4666-8666-666666666666", coveredToolUseId: null } });
  expect(hookText(await f.stop())).toBe("");
  expect((await callTool(f.controller, CLAUDE_FOCUS_TOOL, { snapshot: focusSnapshot }, { [TOOL_USE_META]: "toolu_abandoned" })).isError).toBe(true);
  await f.done("toolu_abandoned", true); await f.batch(); // a late native failure event for it is not new work either
  expect(f.document?.freshness).toBe("reviewed");
});

test("D-01: a replacement session can publish while old lifecycle transport is still held", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_initial");
  const publish = f.transport.publish;
  let release!: () => void; let began!: () => void; let holdIdle = true;
  const started = new Promise<void>(resolve => { began = resolve; });
  f.transport.publish = async (...args) => {
    if (holdIdle && args[1].activity.state === "idle") {
      holdIdle = false; began(); await new Promise<void>(resolve => { release = resolve; });
    }
    return publish(...args);
  };
  try {
    await f.controller.lifecycle({ event: "stop", sessionId: SESSION }); await started;
    await f.controller.lifecycle({ event: "pre_focus", sessionId: SESSION, toolUseId: "toolu_old_waiter", agentId: null });
    const oldUpdate = f.controller.update({ snapshot: { ...focusSnapshot, goal: "Discard old request" } }, "toolu_old_waiter");
    const discarded = oldUpdate.catch(error => error);
    await f.controller.lifecycle({ event: "prompt", sessionId: OTHER, promptId: "replacement" });
    await f.controller.lifecycle({ event: "pre_focus", sessionId: OTHER, toolUseId: "toolu_new", agentId: null });
    const accepted = await f.controller.update({ snapshot: focusSnapshot }, "toolu_new");
    expect(accepted.source).toMatchObject({ sessionId: OTHER, promptId: "replacement" });
    release(); expect(await discarded).toMatchObject({ code: "superseded" }); await f.controller.settled();
    expect(f.controller.snapshot?.source).toMatchObject({ sessionId: OTHER });
  } finally { release?.(); f.transport.publish = publish; await f.controller.settled(); }
});

test("D-01: cancellation fences a model update waiting behind lifecycle publication", async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_initial");
  const original = structuredClone(f.document!);
  const publish = f.transport.publish;
  let release!: () => void; let began!: () => void; let holdIdle = true;
  const started = new Promise<void>(resolve => { began = resolve; });
  f.transport.publish = async (...args) => {
    if (holdIdle && args[1].activity.state === "idle") {
      holdIdle = false; began(); await new Promise<void>(resolve => { release = resolve; });
    }
    return publish(...args);
  };
  try {
    await f.controller.lifecycle({ event: "stop", sessionId: SESSION }); await started;
    await f.controller.lifecycle({ event: "pre_focus", sessionId: SESSION, toolUseId: "toolu_cancelled", agentId: null });
    const abort = new AbortController();
    const update = f.controller.update({ snapshot: { ...focusSnapshot, goal: "Do not publish this" } }, "toolu_cancelled", abort.signal);
    abort.abort(); release();
    await expect(update).rejects.toMatchObject({ code: "superseded" }); await f.controller.settled();
    expect(f.document?.goal).toBe(original.goal); expect(f.document?.updatedAt).toBe(original.updatedAt);
    expect(f.document?.source).toEqual(original.source);
  } finally { release?.(); f.transport.publish = publish; await f.controller.settled(); }
});

for (const failure of ["invalid", "denied"] as const) test(`D-01: recovery follows queued ${failure} maintenance invalidation behind slow lifecycle publication`, async () => {
  const f = fixture(); await f.prompt(); await f.focus("toolu_initial");
  const original = structuredClone(f.document!);
  const publish = f.transport.publish;
  let release!: () => void; let began!: () => void; let holdIdle = true;
  const started = new Promise<void>(resolve => { began = resolve; });
  f.transport.publish = async (...args) => {
    if (holdIdle && args[1].activity.state === "idle") {
      holdIdle = false; began(); await new Promise<void>(resolve => { release = resolve; });
    }
    return publish(...args);
  };
  // Unlike the ordinary fixture helper, native hooks return without awaiting controller.settled().
  const hook = (args: Record<string, string>) => callTool(f.controller, CLAUDE_LIFECYCLE_TOOL, { session_id: SESSION, ...args }, undefined);
  try {
    expect(hookText(await hook({ event: "stop" }))).toBe(""); await started;
    const promptId = "66666666-6666-4666-8666-666666666666";
    await hook({ event: "prompt", prompt_id: promptId });
    await hook({ event: "pre_focus", tool_use_id: "toolu_failed", agent_id: "" });
    if (failure === "invalid") {
      await expect(f.controller.update({ snapshot: null }, "toolu_failed")).rejects.toMatchObject({ code: "invalid" });
      await hook({ event: "tool_done", tool_use_id: "toolu_failed", agent_id: "", failed: "true" });
    } // Denial leaves a native pin without execution or a failure hook.
    await hook({ event: "tool_batch", agent_id: "" });
    await hook({ event: "pre_focus", tool_use_id: "toolu_recovery", agent_id: "" });
    const recovery = f.controller.update({ snapshot: focusSnapshot }, "toolu_recovery");
    release();
    const accepted = await recovery;
    expect(accepted.source).toEqual({ harness: "claude", sessionId: SESSION, promptId, coveredToolUseId: "toolu_failed" });
    expect(accepted.updatedAt).not.toBe(original.updatedAt);
    expect(accepted.freshness).toBe("reviewed");
    await f.controller.settled();
    expect(f.document).toEqual(accepted);
    // Once recovered, ordinary unchanged content still no-ops without claiming a later prompt.
    await hook({ event: "prompt", prompt_id: "77777777-7777-4777-8777-777777777777" });
    await hook({ event: "pre_focus", tool_use_id: "toolu_same", agent_id: "" });
    const unchanged = await f.controller.update({ snapshot: focusSnapshot }, "toolu_same");
    expect(unchanged.updatedAt).toBe(accepted.updatedAt); expect(unchanged.source).toEqual(accepted.source);
  } finally { release?.(); f.transport.publish = publish; await f.controller.settled(); }
});

test("RR-02: the always-loaded tool description is conditional on a verified Wolfpack session", () => {
  const description = CLAUDE_TOOLS.find(tool => tool.name === CLAUDE_FOCUS_TOOL)!.description;
  expect(description).toStartWith("Only for a verified Wolfpack session");
  expect(description).toContain("Do not call it otherwise");
  expect(description).not.toMatch(/^Maintain/);
});
