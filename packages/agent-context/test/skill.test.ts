import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
test("bundled Agent Context skill pins verified scope discovery and scoped CAS publication", () => {
  const skill = readFileSync(join(root, "skills", "wolfpack-agent-context", "SKILL.md"), "utf8");
  expect(skill).toContain("wolfpack session current-context --json");
  expect(skill).toContain("verified: true");
  expect(skill).toContain("wolfpack extension-data read agent-context/context --session <exact-uuid> --json");
  expect(skill).toContain("--if-revision <revision> --request-id <fresh-uuid>");
  expect(skill).toContain("Never guess a scope");
  expect(skill).not.toContain("WOLFPACK_HOME");
});
