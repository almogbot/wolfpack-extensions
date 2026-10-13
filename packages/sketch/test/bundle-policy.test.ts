import { expect, test } from "bun:test";
import register from "../src/ui.ts";
import { type ExtensionRegistrationHost } from "../src/api.ts";
import { assertSelfContained } from "../scripts/bundle-policy.ts";
const check = (source: string) => assertSelfContained(Buffer.from(source));
test("registers only the sketch context view", () => {
 const views:string[]=[];
 const host:ExtensionRegistrationHost={registerContextView(view){views.push(view.id)}};
 register(host);expect(views).toEqual(['sketch']);
});
test("Sketch bundle permits exactly one default export", () => {
 for (const source of ["export default function register() {}", "function register() {} export { register as default };"]) expect(() => check(source)).not.toThrow();
 for (const source of ["export function arrange() {} export default function register() {}", "function arrange() {} function register() {} export { arrange, register as default };", "export const extra=1; export default 1;", "export { default } from 'external';", "export * from 'external';", "const internal=1;"]) expect(() => check(source)).toThrow(/export|dependency/i);
});
test("Sketch bundle rejects dormant module dependencies", () => {
 for (const source of ["import 'external'; export default 1;", "if(false) import('external'); export default 1;", "function dormant(){require('external')} export default 1;"]) expect(() => check(source)).toThrow(/external dependency syntax/);
});
