#!/usr/bin/env bun
/** Explicit release-only contract check against the selected host validator. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const host = process.env.WOLFPACK_EXTENSION_HOST_ROOT;
if (!host) throw new Error("set WOLFPACK_EXTENSION_HOST_ROOT to the selected APIv1 host");
const schema = readFileSync(join(import.meta.dirname, "..", "packages", "agent-context", "schemas", "context.schema.json"));
if (createHash("sha256").update(schema).digest("hex") !== "1e1e51e94c628b104fd927995995ed484385c3ebc87741787a8cd67694c485e3") throw new Error("frozen Agent Context schema bytes changed");
const { compileStaticDocumentSchema, validateDocumentPayload } = await import(join(host, "src", "extensions", "document-contract.ts"));
const validator = compileStaticDocumentSchema(JSON.parse(schema.toString()));
const legacy = { schemaVersion: 1, goal: "Existing goal", planItems: [{ id: "plan", text: "Existing plan", status: "pending" }], decisions: ["Existing decision"], blockers: [], nextSteps: ["Existing next step"] };
const rich = { ...legacy, planItems: [{ ...legacy.planItems[0], text: "Existing plan\n\nSupporting explanation" }], decisions: ["A concise headline\n\nFull rationale"], blockers: ["Input needed\n\nWaiting"], nextSteps: ["Review\n\nInspect"] };
for (const value of [legacy, rich]) validateDocumentPayload(value, validator);
for (const value of [{ ...rich, decisions: [{ id: "choice", text: "Missing" }] }, { ...rich, decisions: [{ id: "choice", text: "Headline", details: 42 }] }, { ...rich, decisions: [{ id: "choice", text: "Headline", details: "" }] }, { ...rich, decisions: [{ id: "choice", text: "x".repeat(241), details: "Details" }] }, { ...rich, blockers: ["x".repeat(16001)] }, { ...rich, nextSteps: [{ id: "choice", text: "Headline", details: "Details", executable: true }] }, { ...rich, planItems: [{ ...rich.planItems[0], details: false }] }]) { let rejected = false; try { validateDocumentPayload(value, validator); } catch { rejected = true; } if (!rejected) throw new Error("selected host accepted invalid Agent Context payload"); }
process.stdout.write("selected host accepts legacy/rich Agent Context schema and rejects seven incompatible payloads\n");
