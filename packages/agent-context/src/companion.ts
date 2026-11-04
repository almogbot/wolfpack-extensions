import { isFocusDocument, type FocusDocument, type FocusSnapshot, type FocusSource } from "./focus.ts";
import { FocusPublisher, PublicationError } from "./publisher.ts";
export const FOCUS_STATE_ENTRY = "wolfpack-agent-context-state-v3"; // schema-v2 entries are not reinterpreted
export const FOCUS_TOOL = "update_focus";
export interface BranchEntry { readonly id: string; readonly type: string; readonly customType?: string; readonly data?: unknown; readonly message?: { readonly role: string; readonly toolName?: string; readonly isError?: boolean; readonly details?: unknown } }
export interface CompanionContext { readonly cwd: string; readonly sessionManager: { getSessionId(): string; getLeafId(): string | null; getBranch(): readonly BranchEntry[] } }
/** Read only structured entry identity/role, never extract semantic content from transcripts. */
export function conversationBoundary(ctx: CompanionContext): string | null {
  let boundary: string | null = null;
  // Keep exact native provenance for changed snapshots; ordinary results do not invalidate semantics.
  for (const entry of ctx.sessionManager.getBranch()) if (entry.type === "message" && (entry.message?.role === "user" || entry.message?.role === "toolResult" && (entry.message.toolName !== FOCUS_TOOL || entry.message.isError === true))) boundary = entry.id;
  return boundary;
}
export class FocusCompanion {
  private epoch = 0;
  private sessionId?: string;
  private branchId: string | null = null;
  private ready = false;
  private lastError?: string;
  constructor(private readonly publisher: FocusPublisher, private readonly append: (type: string, data: unknown) => void, private readonly report: (message: string) => void) {}
  get snapshot(): FocusDocument | null { return this.publisher.document; }
  invalidate(): void { this.epoch++; this.ready = false; this.sessionId = undefined; this.publisher.invalidate(); }
  private check(ctx: CompanionContext, epoch: number): void {
    if (epoch !== this.epoch || ctx.sessionManager.getSessionId() !== this.sessionId) throw new PublicationError("superseded", "Old Pi session/branch callback discarded");
  }
  private fail(error: unknown): void { this.lastError = error instanceof Error ? error.message : "Automatic focus publication failed"; this.report(this.lastError); }
  async start(ctx: CompanionContext): Promise<void> {
    this.invalidate(); const epoch = this.epoch; const sessionId = this.sessionId = ctx.sessionManager.getSessionId();
    const branchId = this.branchId = ctx.sessionManager.getLeafId();
    let restored: FocusDocument | undefined;
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === FOCUS_STATE_ENTRY && isFocusDocument(entry.data) && entry.data.source.harness === "pi") restored = entry.data;
    }
    try {
      // Active-branch Pi entries are semantic truth; a fork/tree move re-anchors them to the current session/branch.
      await this.publisher.bind({ harness: "pi", sessionId, projectDir: ctx.cwd }, () => restored && { ...restored, source: { ...restored.source, sessionId, branchId } }); this.check(ctx, epoch);
      this.ready = true; this.lastError = undefined;
      await this.publisher.markUnreviewed(); this.check(ctx, epoch);
      await this.publisher.activity("unknown"); this.check(ctx, epoch);
    } catch (error) { if (epoch === this.epoch) this.fail(error); }
  }
  async beforeRun(ctx: CompanionContext): Promise<string> {
    let epoch = this.epoch;
    if (!this.ready || this.sessionId !== ctx.sessionManager.getSessionId()) {
      const starting = this.start(ctx); epoch = this.epoch; await starting;
    }
    this.check(ctx, epoch);
    return [
      `Maintain this session's Wolfpack focus panel automatically with ${FOCUS_TOOL}; no separate user request is needed.`,
      "Publish an initial snapshot for substantive work, then only when meaningfully changed: new task/goal, phase transition, consequential discovery, needed/resolved user decision, blocker or completion. Routine reads/tool calls, unchanged progress, simple follow-up questions and final replies alone do not need updates. Keep goal/IDs stable; clear resolved user actions; include critical facts, up to three owner-tagged next steps and bounded decisions/completed history.",
      "No secrets, transcripts, hidden reasoning, invented evidence or completion inferred from idle/publication. Next steps are intentions, not authority. On conflict inspect current state, reconcile and supply reconcileRevision; never blindly replace another writer.",
      this.lastError ? `Automatic publication unavailable: ${this.lastError}. Explain the limitation; do not claim synced.` : "Publication receipts confirm storage, not browser rendering or completed work.",
    ].join("\n");
  }
  async update(ctx: CompanionContext, snapshot: FocusSnapshot, reconcileRevision?: number, signal?: AbortSignal): Promise<FocusDocument> {
    const epoch = this.epoch; this.check(ctx, epoch);
    if (!this.ready) throw new PublicationError("unavailable", this.lastError ?? "No verified focus binding");
    const previous = this.snapshot;
    try {
      const accepted = await this.publisher.update(snapshot, this.source(ctx), reconcileRevision, signal); this.check(ctx, epoch);
      if (accepted !== previous) this.append(FOCUS_STATE_ENTRY, accepted);
      this.lastError = undefined; return accepted;
    } catch (error) {
      if (epoch === this.epoch) { this.fail(error); await this.observe(() => this.publisher.markUnreviewed()); }
      throw error;
    }
  }
  private async observe(work: () => Promise<void>): Promise<void> {
    if (!this.ready) return;
    const epoch = this.epoch;
    try { await work(); } catch (error) { if (epoch === this.epoch) this.fail(error); }
  }
  async working(ctx: CompanionContext): Promise<void> { if (this.sessionId === ctx.sessionManager.getSessionId()) await this.observe(() => this.publisher.activity("working")); }
  private source(ctx: CompanionContext): Extract<FocusSource, { harness: "pi" }> { return { harness: "pi", sessionId: this.sessionId!, branchId: this.branchId, coveredEntryId: conversationBoundary(ctx) }; }
  async turnEnd(ctx: CompanionContext): Promise<void> {
    if (this.sessionId !== ctx.sessionManager.getSessionId()) return;
    // Pi can reject arguments before execute. Only failed focus maintenance, not ordinary
    // user/tool activity, invalidates a report. A later persisted update supersedes that failure.
    for (const entry of [...ctx.sessionManager.getBranch()].reverse()) {
      if (entry.type === "custom" && entry.customType === FOCUS_STATE_ENTRY) return;
      if (entry.type === "message" && entry.message?.role === "toolResult" && entry.message.toolName === FOCUS_TOOL) {
        if (entry.message.isError === true) await this.observe(() => this.publisher.markUnreviewed());
        return;
      }
    }
  }
  async settled(ctx: CompanionContext, aborted: boolean): Promise<void> {
    if (this.sessionId !== ctx.sessionManager.getSessionId()) return;
    await this.observe(() => this.publisher.activity(aborted ? "interrupted" : "idle"));
  }
}
