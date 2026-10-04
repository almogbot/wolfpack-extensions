import { expect, test } from "bun:test";
import { chromium, type Browser } from "@playwright/test";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
async function fixture(launch = () => chromium.launch({ headless: true, ...(process.env.WOLFPACK_WIDGET_BRAVE ? { executablePath: process.env.WOLFPACK_WIDGET_BRAVE } : {}) }), onServer?: (url: string) => void) {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) { return new URL(request.url).pathname === "/ui.js" ? new Response(Bun.file(join(root, "dist", "ui.js")), { headers: { "content-type": "text/javascript" } }) : new Response("<main></main>", { headers: { "content-type": "text/html" } }); } });
  onServer?.(server.url.toString()); let browser: Browser | undefined; let failed = false;
  try { browser = await launch(); const page = await (await browser.newContext()).newPage(); await page.goto(server.url.toString()); return { page, server, browser }; }
  catch (error) { failed = true; throw error; }
  finally { if (failed) { try { await browser?.close(); } catch {} server.stop(true); } }
}
test("Notes fixture closes its server for Error and falsy startup failures without masking the primary failure", async () => {
  for (const failure of [Error("notes launch failure"), undefined, null, false]) { let url = ""; await expect(fixture(async () => { throw failure; }, value => { url = value; })).rejects.toBe(failure); await expect(fetch(url)).rejects.toThrow(); }
  let url = ""; const browser = { close: async () => { throw Error("close failed"); }, newContext: async () => { throw Error("primary startup failure"); } } as unknown as Browser;
  await expect(fixture(async () => browser, value => { url = value; })).rejects.toThrow("primary startup failure"); await expect(fetch(url)).rejects.toThrow();
}, 20_000);
test("Notes registers scoped storage and valid empty/one/multiple vertical layouts", async () => {
  const value = await fixture();
  try {
    const result = await value.page.evaluate(async () => { const modulePath: string = "/ui.js"; const register = (await import(modulePath)).default; let view: any; let layout: any; register({ registerContextView(value: any) { view = value; }, registerTerminalLayout(value: any) { layout = value; } }); const storage = new Map<string, string>(); const mounted = view.mount(document.querySelector("main"), { storage: { get: (key: string) => storage.get(key) ?? null, set: (key: string, text: string) => storage.set(key, text) } }); const editor = document.querySelector("textarea")!; editor.value = "scope-local"; editor.dispatchEvent(new Event("input")); mounted.dispose(); const context=(panes:any[])=>({panes,selectedPaneId:null,viewport:{width:1,height:1}}); return { view:[view.id,view.title], empty:layout.arrange(context([])), one:layout.arrange(context([{id:"one"}])), many:layout.arrange(context([{id:"one"},{id:"two"}])), saved:storage.get("notes"),children:document.querySelector("main")!.children.length }; });
    expect(result.view).toEqual(["notes", "Notes"]); expect(result.empty.rows).toHaveLength(1); expect(result.one.placements).toEqual([{ paneId: "one", row: 0, column: 0 }]); expect(result.many.placements).toEqual([{ paneId: "one", row: 0, column: 0 }, { paneId: "two", row: 1, column: 0 }]); expect(result.saved).toBe("scope-local"); expect(result.children).toBe(0);
  } finally { try { await value.browser.close(); } finally { value.server.stop(true); } }
}, 20_000);
