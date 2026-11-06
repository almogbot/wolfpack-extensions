---
name: wolfpack-agent-context
description: Maintain this Wolfpack session's structured focus panel with the update_focus tool from the Pi companion or Claude Code plugin; diagnose or explicitly retry verified scoped schema-v3 CLI publication without inventing provenance.
---

# Wolfpack Agent Context

When the Pi companion or the Claude Code plugin is loaded, maintain the panel proactively with `update_focus` (in Claude Code: `mcp__plugin_wolfpack-agent-context_focus__update_focus`): publish an initial snapshot for substantive work, then update only when meaningfully changed — new task/goal, phase transition, consequential discovery, needed/resolved user decision, blocker or completion. Routine reads/tool calls, unchanged progress, simple follow-up questions and final replies alone do not need updates. No separate “update the panel” request is needed. Use stable IDs and concise structured fields from [the format reference](references/context-format.md). Clear resolved user actions explicitly. Do not infer completion from idle or a publication receipt. Never guess a scope from names, terminal text, raw environment variables, or a list with only one session.

The integration owns exact harness/session identity, timestamps, native conversation boundaries, runtime activity, CAS and retry handling. Ordinary prompts/results do not invalidate the last meaningful snapshot, and finishing never forces a refresh. Identical content in the same valid producer session/branch preserves its original timestamp and provenance, without claiming later conversation coverage; runtime activity remains independent. Restored or failed publications still need honest review. On a conflict, inspect the returned current document, reconcile your semantic snapshot, then supply its revision as `reconcileRevision`. Never blindly resubmit with a guessed revision. Report publication errors; do not claim synced. A receipt confirms storage, not rendering or completed work.

## Public CLI recovery contract

Use only for explicit publication/recovery with a complete, truthful v3 document and known operation inputs. Prefer the integration's tool; if it is unavailable, explain that the Pi companion or Claude Code plugin must be installed/activated separately. A skill alone does not provide automatic updates. Do not manufacture session, branch or request IDs, covered boundaries or reviewed timestamps; never put one harness's fields under another harness.

1. Resolve and pin this exact session with `wolfpack session current-context --json`. Require exit 0, `ok: true`, `verified: true`, a canonical UUID `sessionId`, the `harness` you are actually running (`pi` or `claude`), and the exact expected `projectDir`. Broker identity is verified against the live local backend. If verification fails, stop; no fallback to session names, lists, environment hints, process scanning or remote scope.
2. Read the pinned revision:
   ```sh
   wolfpack extension-data read agent-context/context --session <exact-uuid> --json
   ```
   Require identical scope/document identity and schema v3 when nonempty. v1 is read-only legacy; do not reinterpret older documents. Schema v3 requires the deployment owner's approved clean reinstall, never an implicit migration/purge.
3. Validate the complete document against the packaged schema and reference, keep all strings inert, and use a private file. Never publish secrets, raw transcripts, executable content, hidden reasoning or fabricated evidence.
4. Publish using the read revision and a fresh canonical UUID request ID:
   ```sh
   wolfpack extension-data publish agent-context/context --session <exact-uuid> \
     --file context.json --if-revision <revision> --request-id <fresh-uuid> --json
   ```
5. Check the receipt against the exact operation, then re-read. On a CAS conflict, re-read and reconcile; never blindly overwrite. On a possibly lost response, retry the **identical file, revision and request ID**, not a new operation. Keep the verified UUID pinned throughout. A failed/ambiguous response is not a receipt.

Publication does not authorize extension edits, installs, purges, store-file writes, reloading agents, or executing proposed next steps. The optional skill is installed only through explicit Wolfpack `--skills pi` consent; its ownership/collision/modified status belongs to that installer. `pi install` explicitly loads the companion resource separately, with skill discovery disabled to avoid duplicate ownership. The Claude Code plugin ships this same skill text with its server and hooks. A new session (or a user-requested idle reload) activates changed resources; never inject reload commands into an active session.
