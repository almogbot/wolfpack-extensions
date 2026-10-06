import { expect, test } from "bun:test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = join(import.meta.dirname, "..");

/** Generic test-only canvas: it supplies only neutral page sizing and host theme tokens,
 * not Wolfpack layout/framework CSS. The extension owns all tested widget styles. */
async function component({ launch = () => chromium.launch({ headless: true, ...(process.env.WOLFPACK_WIDGET_BRAVE ? { executablePath: process.env.WOLFPACK_WIDGET_BRAVE } : {}) }) }: { launch?: () => Promise<Browser> } = {}) {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
    return new URL(request.url).pathname === "/ui.js"
      ? new Response(Bun.file(join(root, "dist", "ui.js")), { headers: { "content-type": "text/javascript" } })
      : new Response('<meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--text-primary:#dce5df;--text-muted:#a4b2a9;--bg-hover:#1b231e;--border:#28312b;--accent:#45ed7e;--bg-inset:#0d100e;--bg-elevated:#1c211e}body{margin:0;background:#101511;color:#dce5df}main{height:700px;width:100%}</style><main></main>', { headers: { "content-type": "text/html" } });
  } });
  let browser: Browser | undefined;
  try {
    browser = await launch(); const page = await (await browser.newContext()).newPage(); await page.goto(server.url.toString());
    await page.evaluate(async () => {
      const asset = "/ui.js"; const module = await import(asset); let contribution: any; let abort = new AbortController();
      module.default({ registerContextView(value: any) { contribution = value; }, registerTerminalLayout() {} });
      const git = { calls: 0, value: { state: "not-repository" } as any, fail: false, pending: false, signals: [] as AbortSignal[], releases: [] as Array<(value: any) => void> };
      (globalThis as any).__git = git;
      const mount = () => contribution.mount(document.querySelector("main"), { signal: abort.signal, scope: { installationId: "installation", sessionId: "11111111-1111-4111-8111-111111111111" }, selection: { selectedSessionId: null }, theme: {}, storage: { get: () => null, set() {}, remove() {} }, documents: { read: async () => null, subscribe() { return () => {}; } }, project: { gitStatus: async (signal: AbortSignal) => { git.calls++; git.signals.push(signal); if (git.fail) throw Error("unavailable"); return git.pending ? new Promise(resolve => git.releases.push(resolve)) : git.value; } } });
      let controller = mount();
      (globalThis as any).__sample = { get abort() { return abort; }, get controller() { return controller; } };
    });
    return { page, async close() { await browser!.close(); server.stop(true); } };
  } catch (error) { await browser?.close(); server.stop(true); throw error; }
}

test("Changes component retains stale data honestly, pauses hidden reads and ignores late responses after disposal", async () => {
  const fixture = await component();
  try {
    const { page } = fixture;
    await page.clock.install();
    await page.evaluate(() => (globalThis as any).__sample.controller.setVisible(true));
    await page.waitForFunction(() => document.querySelector('.wolfpack-changes [role="status"]')?.textContent === "Not a Git repository.");
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => (globalThis as any).__git.calls === 2);
    const ready = { state: "ready", branch: null, detached: true, staged: [], unstaged: [], untracked: [], truncated: false };
    await page.evaluate(value => { (globalThis as any).__git.value = value; }, ready);
    await page.getByRole("button", { name: "Refresh Git status" }).click();
    await page.waitForFunction(() => document.querySelector(".wolfpack-changes .branch")?.textContent === "Detached HEAD");
    expect(await page.getByRole("status").textContent()).toBe("Working tree clean.");
    await page.evaluate(value => { (globalThis as any).__git.value = { ...value, truncated: true, untracked: [{ path: "<img src=x>", status: "untracked" }] }; }, ready);
    await page.getByRole("button", { name: "Refresh Git status" }).click();
    await page.waitForFunction(() => document.querySelector('.wolfpack-changes [role="status"]')?.textContent?.includes("More changes"));
    expect(await page.locator(".wolfpack-changes img").count()).toBe(0);
    await page.locator(".wolfpack-changes .path").evaluate(node => { (globalThis as any).__retainedGitPath = node; });
    const lastSuccess = await page.locator(".wolfpack-changes .updated").getAttribute("datetime");
    await page.clock.fastForward(1000);
    await page.evaluate(() => { (globalThis as any).__git.fail = true; });
    await page.getByRole("button", { name: "Refresh Git status" }).click();
    await page.waitForFunction(() => document.querySelector('.wolfpack-changes [role="status"]')?.textContent?.includes("previous result"));
    expect(await page.locator(".wolfpack-changes .path").textContent()).toBe("<img src=x>");
    expect(await page.locator(".wolfpack-changes .path").evaluate(node => node === (globalThis as any).__retainedGitPath)).toBe(true);
    expect(await page.locator(".wolfpack-changes .updated").getAttribute("datetime")).toBe(lastSuccess);
    expect(await page.locator(".wolfpack-changes").getAttribute("data-stale")).toBe("true");
    const accessibility = await new AxeBuilder({ page }).include(".wolfpack-changes").withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(accessibility.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    await page.evaluate(() => { const git = (globalThis as any).__git; git.fail = false; git.pending = true; });
    await page.getByRole("button", { name: "Refresh Git status" }).click();
    await page.waitForFunction(() => (globalThis as any).__git.releases.length === 1);
    const calls = await page.evaluate(() => (globalThis as any).__git.calls);
    await page.clock.fastForward(15000); expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(calls);
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    expect(await page.evaluate(() => (globalThis as any).__git.signals.at(-1).aborted)).toBe(true);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.clock.fastForward(20000); expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(calls);
    await page.evaluate(value => {
      const git = (globalThis as any).__git; git.pending = false; git.value = { ...value, branch: "current", detached: false };
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" }); document.dispatchEvent(new Event("visibilitychange"));
    }, ready);
    await page.waitForFunction(() => document.querySelector(".wolfpack-changes .branch")?.textContent === "current");
    await page.evaluate(value => (globalThis as any).__git.releases[0]({ ...value, branch: "obsolete", detached: false }), ready);
    expect(await page.locator(".wolfpack-changes .branch").textContent()).toBe("current");
    const beforeDispose = await page.evaluate(() => { (globalThis as any).__sample.abort.abort(); return (globalThis as any).__git.calls; });
    await page.clock.fastForward(20000);
    expect(await page.locator(".wolfpack-changes").count()).toBe(0);
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(beforeDispose);
  } finally { await fixture.close(); }
}, 20_000);

test("Changes refreshes on browser focus, coalesces reads and ignores focus while hidden or disposed", async () => {
  const fixture = await component();
  try {
    const { page } = fixture; await page.clock.install();
    await page.evaluate(() => (globalThis as any).__sample.controller.setVisible(true));
    await page.waitForFunction(() => document.querySelector('.wolfpack-changes [role="status"]')?.textContent === "Not a Git repository.");
    await page.evaluate(() => {
      (globalThis as any).__git.value = { state: "ready", branch: "automatic", detached: false, staged: [], unstaged: [], untracked: [], truncated: false };
      window.dispatchEvent(new Event("focus"));
    });
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(2);
    await page.waitForFunction(() => document.querySelector(".wolfpack-changes .branch")?.textContent === "automatic");
    await page.evaluate(() => {
      (globalThis as any).__git.pending = true;
      window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("focus")); document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await page.getByRole("button", { name: "Refresh Git status" }).getAttribute("aria-busy")).toBe("true");
    await page.clock.fastForward(15000);
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(3);
    await page.evaluate(() => { (globalThis as any).__sample.controller.setVisible(false); window.dispatchEvent(new Event("focus")); });
    expect(await page.evaluate(() => (globalThis as any).__git.signals.at(-1).aborted)).toBe(true);
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(3);
    await page.evaluate(() => { (globalThis as any).__git.pending = false; (globalThis as any).__sample.controller.setVisible(true); });
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(4);
    await page.evaluate(() => { (globalThis as any).__sample.abort.abort(); window.dispatchEvent(new Event("focus")); });
    await page.clock.fastForward(15000);
    expect(await page.evaluate(() => (globalThis as any).__git.calls)).toBe(4);
  } finally { await fixture.close(); }
}, 20_000);

test("Changes uses unique counts, literal filename hierarchy and stable keyboard disclosures across automatic refresh", async () => {
  const fixture = await component();
  try {
    const { page } = fixture; await page.clock.install();
    await page.evaluate(() => {
      (globalThis as any).__git.value = { state: "ready", branch: "feature/changes-refinement-with-a-long-branch-name", detached: false, truncated: false,
        staged: [{ path: "src/widgets/changes.ts", status: "modified" }, { path: "src/components/new.ts", previousPath: "src/old.ts", status: "renamed" }],
        unstaged: [{ path: "src/widgets/changes.ts", status: "modified" }, { path: "src/obsolete.ts", status: "deleted" }, { path: "conflict.ts", status: "unmerged" }],
        untracked: [{ path: "new/<img src=x>.ts", status: "untracked" }, { path: `some/very/long/directory/${"x".repeat(200)}.ts`, status: "untracked" }, { path: "generated/", status: "untracked" }],
      };
      (globalThis as any).__sample.controller.setVisible(true);
    });
    await page.waitForFunction(() => document.querySelector(".wolfpack-changes .branch")?.textContent?.startsWith("feature/"));
    expect(await page.locator(".wolfpack-changes .change-count").count()).toBe(1);
    expect(await page.locator(".wolfpack-changes .change-count").textContent()).toBe("7 changed files");
    expect(await page.getByRole("list", { name: "Staged files", exact: true }).locator(".file-name").first().textContent()).toBe("changes.ts");
    expect(await page.getByRole("list", { name: "Staged files", exact: true }).locator(".directory").first().textContent()).toBe("src/widgets");
    expect(await page.locator('.kind[aria-label="Modified"]').first().textContent()).toBe("M");
    expect(await page.locator('.kind[aria-label="Unmerged"]').textContent()).toBe("!");
    expect(await page.locator('.path[title="src/widgets/changes.ts"]').count()).toBe(2);
    expect(await page.locator('.previous-path').textContent()).toBe("from src/old.ts");
    expect(await page.locator(".wolfpack-changes img").count()).toBe(0);
    const summary = page.locator('[data-group="staged"] > summary');
    await summary.focus(); await summary.press("Space");
    expect(await page.locator('[data-group="staged"]').evaluate((node: HTMLDetailsElement) => node.open)).toBe(false);
    await summary.evaluate(node => { (globalThis as any).__gitSummary = node; });
    await page.evaluate(() => { (globalThis as any).__git.value.untracked.push({ path: "auto.ts", status: "untracked" }); });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => document.querySelector(".wolfpack-changes .change-count")?.textContent === "8 changed files");
    expect(await summary.evaluate(node => node === (globalThis as any).__gitSummary && node === document.activeElement)).toBe(true);
    expect(await page.locator('[data-group="staged"]').evaluate((node: HTMLDetailsElement) => node.open)).toBe(false);
    await summary.press("Enter");
    expect(await page.locator('[data-group="staged"]').evaluate((node: HTMLDetailsElement) => node.open)).toBe(true);
    for (const width of [320, 900]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.locator(".wolfpack-changes").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      const refresh = await page.getByRole("button", { name: "Refresh Git status" }).boundingBox();
      expect(refresh!.height).toBeGreaterThanOrEqual(width === 320 ? 44 : 32);
      const accessibility = await new AxeBuilder({ page }).include(".wolfpack-changes").withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(accessibility.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
      if (process.env.WOLFPACK_WIDGET_ARTIFACTS) {
        mkdirSync(process.env.WOLFPACK_WIDGET_ARTIFACTS, { recursive: true });
        await page.screenshot({ path: join(process.env.WOLFPACK_WIDGET_ARTIFACTS, `changes-${width}.png`), fullPage: true, animations: "disabled" });
      }
    }
    // If the focused group becomes empty, keep keyboard focus on an available widget control.
    await summary.focus();
    await page.evaluate(() => { (globalThis as any).__git.value.staged = []; window.dispatchEvent(new Event("focus")); });
    await page.waitForFunction(() => (document.querySelector('[data-group="staged"]') as HTMLElement).hidden);
    expect(await page.getByRole("button", { name: "Refresh Git status" }).evaluate(node => node === document.activeElement)).toBe(true);
  } finally { await fixture.close(); }
}, 20_000);


test("Changes nests native directory disclosures, isolates collapse and preserves changed-poll focus with removal fallback", async () => {
  const fixture = await component();
  try {
    const { page } = fixture; await page.clock.install();
    await page.evaluate(() => {
      (globalThis as any).__git.value = { state: "ready", branch: "directories", detached: false, truncated: false,
        staged: [{ path: "tests/unit/a.ts", status: "modified" }, { path: "tests/integration/b.ts", previousPath: "old/b.ts", status: "renamed" }, { path: "root.ts", status: "added" }],
        unstaged: [{ path: "tests/unit/a.ts", status: "modified" }],
        untracked: [{ path: "tests/generated/", status: "untracked" }, { path: "<img src=x>/literal.ts", status: "untracked" }],
      };
      (globalThis as any).__sample.controller.setVisible(true);
    });
    await page.waitForFunction(() => document.querySelector(".branch")?.textContent === "directories");
    const staged = page.locator('[data-group="staged"]');
    const directory = (path: string) => staged.locator(`details[data-directory="${path}"]`);
    const tests = directory("tests"), unit = directory("tests/unit");
    // Root and nested directory paths are native, expanded disclosures, not synthetic tree controls.
    expect(await tests.count()).toBe(1);
    expect(await unit.evaluate((node: HTMLDetailsElement) => node.open)).toBe(true);
    expect(await tests.evaluate((node: HTMLDetailsElement) => node.open)).toBe(true);
    expect(await page.locator(".change-count").textContent()).toBe("5 changed files");
    expect(await staged.locator(":scope > summary .group-count").textContent()).toBe("3");
    expect(await page.locator(".previous-path").textContent()).toBe("from old/b.ts");
    expect(await page.locator('details[data-directory="tests/generated"]').count()).toBe(0);
    expect(await page.locator('.path[title="tests/generated/"] .file-name').textContent()).toBe("generated/");
    expect(await page.locator(".wolfpack-changes img").count()).toBe(0);
    expect(await page.locator('[data-group="untracked"] .directory-label').filter({ hasText: "<img src=x>/" }).textContent()).toBe("<img src=x>/");
    expect(await unit.locator(":scope > summary").textContent()).toBe("tests/unit/");
    for (const width of [320, 900]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.locator(".wolfpack-changes").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      const box = await tests.locator(":scope > summary").boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(width === 320 ? 44 : 32);
      const accessibility = await new AxeBuilder({ page }).include(".wolfpack-changes").withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(accessibility.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
    }
    const testsHeading = tests.locator(":scope > summary"), unitHeading = unit.locator(":scope > summary");
    await testsHeading.focus(); await testsHeading.press("Space");
    expect(await staged.locator('.path[title="tests/unit/a.ts"]').isVisible()).toBe(false);
    expect(await staged.locator('.path[title="tests/integration/b.ts"]').isVisible()).toBe(false);
    expect(await staged.locator('.path[title="root.ts"]').isVisible()).toBe(true);
    expect(await page.locator('[data-group="unstaged"] .path').isVisible()).toBe(true);
    await page.evaluate(() => { (globalThis as any).__git.value.staged.push({ path: "tests/unit/new.ts", status: "added" }); });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => document.querySelector('[data-group="staged"] > summary .group-count')?.textContent === "4");
    expect(await tests.evaluate((node: HTMLDetailsElement) => node.open)).toBe(false);
    expect(await testsHeading.evaluate(node => node === document.activeElement)).toBe(true);
    await testsHeading.press("Enter");
    await unitHeading.focus(); await unitHeading.press("Enter");
    await unitHeading.evaluate(node => { (globalThis as any).__directoryHeading = node; });
    await page.evaluate(() => { (globalThis as any).__git.value.staged.push({ path: "tests/unit/another.ts", status: "added" }); });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => document.querySelector('[data-group="staged"] > summary .group-count')?.textContent === "5");
    expect(await unitHeading.evaluate(node => node === document.activeElement && node === (globalThis as any).__directoryHeading)).toBe(true);
    expect(await unit.evaluate((node: HTMLDetailsElement) => node.open)).toBe(false);
    await testsHeading.focus(); await testsHeading.press("Space"); await testsHeading.press("Space");
    expect(await unit.evaluate((node: HTMLDetailsElement) => node.open)).toBe(false);
    await unitHeading.focus();
    await page.evaluate(() => { const git = (globalThis as any).__git; git.value.staged = git.value.staged.filter((file: any) => !file.path.startsWith("tests/unit/")); });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => document.querySelector('[data-group="staged"] > summary .group-count')?.textContent === "2");
    expect(await testsHeading.evaluate(node => node === document.activeElement)).toBe(true);
    await page.evaluate(() => { (globalThis as any).__git.value.staged = [{ path: "root.ts", status: "added" }]; });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => document.querySelector('[data-group="staged"] > summary .group-count')?.textContent === "1");
    expect(await staged.locator(":scope > summary").evaluate(node => node === document.activeElement)).toBe(true);
    await page.evaluate(() => { (globalThis as any).__git.value.staged = []; });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => (document.querySelector('[data-group="staged"]') as HTMLElement).hidden);
    expect(await page.getByRole("button", { name: "Refresh Git status" }).evaluate(node => node === document.activeElement)).toBe(true);
  } finally { await fixture.close(); }
}, 20_000);

test("Changes manifest and default registration declare only the context view", async () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  expect(manifest.wolfpack).toMatchObject({ manifestVersion: 1, apiVersion: 1, id: "changes", ui: "dist/ui.js", skills: [], documents: [] });
  const asset = "../dist/ui.js"; const register = (await import(asset)).default as (host: any) => void; const views: string[] = []; const layouts: string[] = [];
  register({ registerContextView: (view: { id: string }) => views.push(view.id), registerTerminalLayout: (layout: { title: string }) => layouts.push(layout.title) });
  expect(views).toEqual(["changes"]); expect(layouts).toEqual([]);
});
