import { expect, test } from "bun:test";
import register from "../src/ui.ts";
import { type ExtensionRegistrationHost, type LayoutContext, type TerminalLayout } from "../src/api.ts";
import { assertSelfContained } from "../scripts/bundle-policy.ts";
const check = (source: string) => assertSelfContained(Buffer.from(source));
test("registered layout preserves selected two-thirds pane and one-pane fallback", () => {
 let arrange: ((context: LayoutContext) => TerminalLayout) | undefined;
 const host: ExtensionRegistrationHost = { registerContextView() {}, registerTerminalLayout(layout) { arrange = layout.arrange; } };
 register(host);
 const input = { panes: [{id:'a'},{id:'b'},{id:'c'}], selectedPaneId:'b', viewport:{width:900,height:500} };
 expect(arrange!(input)).toEqual({version:1, rows:[{size:0.5},{size:0.5}],columns:[{size:2/3},{size:1/3}],placements:[{paneId:'b',row:0,column:0,rowSpan:2},{paneId:'a',row:0,column:1},{paneId:'c',row:1,column:1}]});
 expect(arrange!({...input,panes:[{id:'a'}]})).toEqual({version:1,rows:[{size:1}],columns:[{size:1}],placements:[{paneId:'a',row:0,column:0}]});
});
test("Stage bundle permits exactly one default export", () => {
 for (const source of ["export default function register() {}", "function register() {} export { register as default };"]) expect(() => check(source)).not.toThrow();
 for (const source of ["export function arrange() {} export default function register() {}", "function arrange() {} function register() {} export { arrange, register as default };", "export const extra=1; export default 1;", "export { default } from 'external';", "export * from 'external';", "const internal=1;"]) expect(() => check(source)).toThrow(/export|dependency/i);
});
test("Stage bundle rejects dormant module dependencies", () => {
 for (const source of ["import 'external'; export default 1;", "if(false) import('external'); export default 1;", "function dormant(){require('external')} export default 1;"]) expect(() => check(source)).toThrow(/external dependency syntax/);
});
