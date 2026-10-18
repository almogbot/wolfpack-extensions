import { expect, test } from "bun:test";
import { chromium, type Browser, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
async function fixture(launch = () => chromium.launch({ headless: true, ...(process.env.WOLFPACK_WIDGET_BRAVE ? { executablePath: process.env.WOLFPACK_WIDGET_BRAVE } : {}) }), onServer?: (url: string) => void) {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) { return new URL(request.url).pathname === "/ui.js" ? new Response(Bun.file(join(root, "dist", "ui.js")), { headers: { "content-type": "text/javascript" } }) : new Response('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#101511}main{height:600px;width:100%}</style><main></main>', { headers: { "content-type": "text/html" } }); } });
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
    const result = await value.page.evaluate(async () => { const modulePath: string = "/ui.js"; const register = (await import(modulePath)).default; let view: any; let layout: any; register({ registerContextView(value: any) { view = value; }, registerTerminalLayout(value: any) { layout = value; } }); const storage = new Map<string, string>(); const mounted = view.mount(document.querySelector("main"), { signal: new AbortController().signal, theme: {}, storage: { get: (key: string) => storage.get(key) ?? null, set: (key: string, text: string) => storage.set(key, text), remove: (key: string) => storage.delete(key) } }); const editor = document.querySelector("textarea")!; editor.value = "scope-local"; editor.dispatchEvent(new Event("input")); mounted.dispose(); const context=(panes:any[])=>({panes,selectedPaneId:null,viewport:{width:1,height:1}}); return { view:[view.id,view.title], empty:layout.arrange(context([])), one:layout.arrange(context([{id:"one"}])), many:layout.arrange(context([{id:"one"},{id:"two"}])), saved:storage.get("notes"),children:document.querySelector("main")!.children.length }; });
    expect(result.view).toEqual(["notes", "Notes"]); expect(result.empty.rows).toHaveLength(1); expect(result.one.placements).toEqual([{ paneId: "one", row: 0, column: 0 }]); expect(result.many.placements).toEqual([{ paneId: "one", row: 0, column: 0 }, { paneId: "two", row: 1, column: 0 }]); expect(result.saved).toBe("scope-local"); expect(result.children).toBe(0);
  } finally { try { await value.browser.close(); } finally { value.server.stop(true); } }
}, 20_000);

/** Registers the built view with a storage fake shared across remounts, like host localStorage for one scope. */
async function notes(page: Page, theme: Record<string, string> = {}) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.evaluate(async theme => {
    const modulePath: string = "/ui.js"; const register = (await import(modulePath)).default; let view: any;
    register({ registerContextView(value: any) { view = value; }, registerTerminalLayout() {} });
    const store = { values: new Map<string, string>(), failGet: false, failSet: false };
    const storage = {
      get: (key: string) => { if (store.failGet) throw Error("storage get unavailable"); return store.values.get(key) ?? null; },
      set: (key: string, value: string) => { if (store.failSet) throw Error("storage quota exceeded"); store.values.set(key, value); },
      remove: (key: string) => { store.values.delete(key); },
    };
    let abort = new AbortController(), controller: any;
    const mount = () => { controller?.dispose(); abort.abort(); abort = new AbortController(); controller = view.mount(document.querySelector("main"), { signal: abort.signal, theme, storage }); controller.setVisible?.(true); };
    (globalThis as any).__notes = { store, mount };
    mount();
  }, theme);
  return errors;
}

test("Notes restores saved text after remount and reports storage failures without losing editor text", async () => {
  const value = await fixture();
  try {
    const { page } = value; const errors = await notes(page);
    const editor = page.getByRole("textbox", { name: "Local notes for this exact extension scope" });
    const status = page.getByRole("status");
    const stored = () => page.evaluate(() => (globalThis as any).__notes.store.values.get("notes"));
    await editor.fill("first draft");
    await page.evaluate(() => (globalThis as any).__notes.mount());
    expect(await editor.inputValue()).toBe("first draft");
    await page.evaluate(() => { (globalThis as any).__notes.store.failSet = true; });
    await editor.fill("unsaved edit");
    expect(await status.count()).toBe(1);
    expect(await status.textContent()).toContain("Could not save");
    expect(await editor.inputValue()).toBe("unsaved edit");
    expect(await stored()).toBe("first draft");
    await page.evaluate(() => { (globalThis as any).__notes.store.failSet = false; });
    await editor.pressSequentially(" saved");
    expect(await status.textContent()).toBe("");
    expect(await stored()).toBe("unsaved edit saved");
    await page.evaluate(() => { (globalThis as any).__notes.store.failGet = true; (globalThis as any).__notes.mount(); });
    expect(await page.locator("main textarea").count()).toBe(1);
    expect(await editor.inputValue()).toBe("");
    expect(await status.textContent()).toContain("could not be loaded");
    expect(errors).toEqual([]);
  } finally { try { await value.browser.close(); } finally { value.server.stop(true); } }
}, 20_000);

test("Notes applies host theme tokens and fits 320px without horizontal overflow or serious axe violations", async () => {
  const value = await fixture();
  try {
    const { page } = value;
    const errors = await notes(page, { "--text-primary": "rgb(250, 240, 200)", "--bg-inset": "rgb(5, 10, 8)" });
    const editor = page.locator("main textarea");
    const style = await editor.evaluate(node => { const computed = getComputedStyle(node); return { color: computed.color, background: computed.backgroundColor, resize: computed.resize }; });
    expect(style).toEqual({ color: "rgb(250, 240, 200)", background: "rgb(5, 10, 8)", resize: "vertical" });
    await editor.fill("x".repeat(400));
    for (const width of [320, 900]) {
      await page.setViewportSize({ width, height: 700 });
      expect(await page.locator("main").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      const box = (await editor.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.width).toBeGreaterThanOrEqual(width * 0.8);
      expect(box.height).toBeGreaterThanOrEqual(120);
      const accessibility = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(accessibility.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    }
    expect(errors).toEqual([]);
  } finally { try { await value.browser.close(); } finally { value.server.stop(true); } }
}, 20_000);
