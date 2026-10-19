import { test, expect } from "bun:test";
import { chromium, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");

async function fixture() {
 const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/ui.js") return new Response(Bun.file(join(root, "dist/ui.js")));
  if (path === "/hello.wasm") return new Response(Bun.file(join(root, "test/fixtures/hello.wasm")));
  return new Response('<html lang="en"><title>Stage test</title><meta name="viewport" content="width=device-width"><main><h1>Stage fixture</h1><label>Terminal<input id="terminal"></label><div id="stage"></div></main></html>', { headers: { "content-type": "text/html", "content-security-policy": "script-src 'self' blob: 'wasm-unsafe-eval'" } });
 } });
 let browser;
 try { browser = await chromium.launch({ ...(process.env.WOLFPACK_WIDGET_BRAVE ? { executablePath: process.env.WOLFPACK_WIDGET_BRAVE } : {}) }); }
 catch (error) { server.stop(true); throw error; }
 const errors: string[] = [];
 try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") console.error("browser:", message.text()); });
  await page.goto(server.url.toString());
  await page.evaluate(async () => {
   // Instrument browser boundaries, never replace the cartridge/runtime implementation.
   const frames = new Set<number>(); const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
   window.requestAnimationFrame = callback => { let id: number; id = request(time => { frames.delete(id); callback(time); }); frames.add(id); return id; };
   window.cancelAnimationFrame = id => { frames.delete(id); cancel(id); };
   const audio: AudioContext[] = []; const audioCloses: Promise<void>[] = []; const NativeAudioContext = window.AudioContext;
   window.AudioContext = class extends NativeAudioContext { constructor(options?: AudioContextOptions) { super(options); audio.push(this); } close() { const closed = super.close(); audioCloses.push(closed); return closed; } };
   const inputListeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
   const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
   const isInput = (target: EventTarget, name: string) => (target instanceof HTMLElement && target.tagName.startsWith("WASM4-")) && /^(pointer|key|blur)/.test(name);
   EventTarget.prototype.addEventListener = function(name, fn, options) { if (fn && isInput(this, name)) { const events = inputListeners.get(this) ?? new Map(); const set = events.get(name) ?? new Set(); set.add(fn); events.set(name, set); inputListeners.set(this, events); } return add.call(this, name, fn, options); };
   EventTarget.prototype.removeEventListener = function(name, fn, options) { if (fn && isInput(this, name)) inputListeners.get(this)?.get(name)?.delete(fn); return remove.call(this, name, fn, options); };
   const source = await (await fetch("/ui.js")).text(); const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
   const module = await import(url); URL.revokeObjectURL(url);
   let view: any, layout: any; module.default({ registerContextView(v: any) { view = v; }, registerTerminalLayout(v: any) { layout = v; } });
   const bytes = new Uint8Array(await (await fetch("/hello.wasm")).arrayBuffer());
   const hash = async (b: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(b))), x => x.toString(16).padStart(2, "0")).join("");
   const documentFor = async (b: Uint8Array, build = 1) => ({ schemaVersion: 1, profile: "w4", title: "Hello", build, blobDigest: await hash(b), size: b.length });
   const cart = await documentFor(bytes), second = new Uint8Array([...bytes, 0, 2, 1, 120]), secondCart = await documentFor(second, 2);
   const invalid = Uint8Array.from([0,97,115,109,1,0,0,0,0,128,128,128,128,8]), invalidCart = await documentFor(invalid);
   const unlinkable = new Uint8Array(bytes); const offset = bytes.findIndex((b, i) => b === 101 && bytes[i + 1] === 110 && bytes[i + 2] === 118); unlinkable[offset] = 120; const unlinkCart = await documentFor(unlinkable);
   const bank = new Map([[cart.blobDigest, bytes], [secondCart.blobDigest, second], [invalidCart.blobDigest, invalid], [unlinkCart.blobDigest, unlinkable]]);
   let publish: any, controller: any, abort: AbortController, subscriptions = 0, composed = "";
   const viewContext: any = { scope: { installationId: "install", sessionId: "session" }, theme: {}, documents: { subscribe(_id: string, listener: any) { publish = listener; subscriptions++; let released = false; return () => { if (!released) { released = true; subscriptions--; } }; } }, blobs: { read: async (digest: string) => bank.get(digest) ?? bytes }, terminal: { compose(text: string) { composed = text; } } };
   const mount = () => { controller?.dispose(); abort?.abort(); abort = new AbortController(); viewContext.signal = abort.signal; controller = view.mount(document.querySelector("#stage"), viewContext); };
   mount();
   const App = customElements.get("wasm4-app") as any; const startCart = App.prototype.startCart; let runtimeCompletion: Promise<void> = Promise.resolve(), updates = 0;
   App.prototype.startCart = function(...args: any[]) { runtimeCompletion = startCart.apply(this, args); const update = this.runtime.update.bind(this.runtime); this.runtime.update = () => { updates++; return update(); }; return runtimeCompletion; };
   const sample = { get runtimeCompletion() { return runtimeCompletion; }, get publish() { return publish; }, get abort() { return abort; }, context: viewContext, cart, secondCart, invalidCart, unlinkCart, bytes, bank, mount, dispose: () => controller.dispose(), setVisible(visible: boolean) { document.querySelector<HTMLElement>('#stage')!.hidden = !visible; controller.setVisible?.(visible); }, get composed() { return composed; }, moduleKeys: Object.keys(module), layout,
    resources: () => ({ frames: frames.size, updates, subscriptions, inputListeners: [...inputListeners.entries()].filter(([target]) => target !== window).map(([,events]) => events).reduce((n, events) => n + [...events.values()].reduce((count, set) => count + set.size, 0), 0), audioStates: audio.map(a => a.state) }),
    async drained() { await Promise.all(audioCloses); await new Promise<void>(resolve => queueMicrotask(resolve)); },
   };
   (globalThis as any).sample = sample;
  });
  return { page, errors, async close() { await browser.close(); server.stop(true); } };
 } catch (error) { await browser.close(); server.stop(true); throw error; }
}
async function running(page: Page) { await page.getByText("Running", { exact: true }).waitFor(); }
async function pixels(page: Page) {
 await page.waitForFunction(() => {
  const app = document.querySelector("wasm4-app") as any; const canvas = app?.shadowRoot?.querySelector("canvas"); if (!canvas) return false;
  app.runtime.composite(); const gl = canvas.getContext("webgl"); if (!gl) return false;
  const p = new Uint8Array(160 * 160 * 4); gl.readPixels(0, 0, 160, 160, gl.RGBA, gl.UNSIGNED_BYTE, p);
  return p.some((v, i) => i % 4 !== 3 && v !== p[i % 4]);
 });
}

test("real blob cart runs under CSP, swaps, verifies and disposes", async () => {
 const f = await fixture(); const { page } = f;
 try {
  expect(await page.evaluate(() => (globalThis as any).sample.moduleKeys)).toEqual(["default"]);
  await page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 1); }); await running(page); await pixels(page);
  await page.locator("wasm4-app").dispatchEvent("pointerdown", { pointerType: "mouse" });
  expect(await page.locator("wasm4-virtual-gamepad").isVisible()).toBe(true);
  await page.locator("wasm4-app").focus(); await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() => new Uint8Array((document.querySelector("wasm4-app") as any).runtime.memory.buffer)[22]! & 32); await page.keyboard.up("ArrowRight");
  await page.waitForFunction(() => new Uint8Array((document.querySelector("wasm4-app") as any).runtime.memory.buffer)[22] === 0);
  await page.locator("#terminal").focus(); await page.keyboard.down("ArrowRight");
  expect(await page.evaluate(() => (document.querySelector("wasm4-app") as any).inputState.gamepad[0])).toBe(0); await page.keyboard.up("ArrowRight");
  // Real touch delivery and implicit pointer capture, not a synthetic count-only probe.
  const action = await page.locator("wasm4-virtual-gamepad .action1").boundingBox(); expect(action).not.toBeNull();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: action!.x + action!.width / 2, y: action!.y + action!.height / 2 }] });
  await page.waitForFunction(() => new Uint8Array((document.querySelector("wasm4-app") as any).runtime.memory.buffer)[22]! & 1);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForFunction(() => new Uint8Array((document.querySelector("wasm4-app") as any).runtime.memory.buffer)[22] === 0); await cdp.detach();
  await page.getByRole("button", { name: "Send feedback" }).click(); expect(await page.evaluate(() => (globalThis as any).sample.composed)).toBe("stage build 1: ");
  await page.evaluate(() => { (globalThis as any).old = document.querySelector("wasm4-app"); const s = (globalThis as any).sample; s.publish({ ...s.cart, build: 2 }, 2); }); await running(page);
  expect(await page.evaluate(() => document.querySelector("wasm4-app") === (globalThis as any).old)).toBe(true);
  await page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.secondCart, 3); }); await running(page);
  expect(await page.evaluate(() => document.querySelector("wasm4-app") !== (globalThis as any).old)).toBe(true);
  expect(await page.evaluate(() => (globalThis as any).old.runtime.apu.audioCtx.state)).toBe("closed");
  await page.evaluate(() => {
   const s = (globalThis as any).sample, read = s.context.blobs.read; let reject: any;
   const pending = new Promise((_resolve, r) => reject = r);
   s.context.blobs.read = (digest: string) => digest === "1".repeat(64) ? pending : read(digest);
   s.publish({ ...s.cart, blobDigest: "1".repeat(64) }, 4); s.publish(s.cart, 5);
   (globalThis as any).lateReject = async () => { reject(Error("stale failure")); await pending.catch(() => {}); await new Promise<void>(resolve => queueMicrotask(resolve)); };
  }); await running(page); await page.evaluate(() => (globalThis as any).lateReject());
  expect(await page.getByText("Running", { exact: true }).count()).toBe(1);
  await page.evaluate(() => { const s = (globalThis as any).sample; s.publish({ ...s.cart, blobDigest: "0".repeat(64) }, 6); }); await page.getByText(/digest mismatch/i).waitFor();
  await page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 7); }); await running(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => { const s = (globalThis as any).sample; s.context.blobs.read = async () => new Uint8Array(65537); s.publish(s.secondCart, 8); }); await page.getByText(/size mismatch or oversize/i).waitFor();
  await page.evaluate(() => { const s = (globalThis as any).sample; s.context.blobs.read = async () => s.bank.get(s.invalidCart.blobDigest); s.publish(s.invalidCart, 9); }); await page.getByText(/Invalid WASM cartridge/).waitFor();
  await page.evaluate(() => { const s = (globalThis as any).sample; s.context.blobs.read = async () => s.bank.get(s.unlinkCart.blobDigest); s.publish(s.unlinkCart, 10); }); await page.getByText(/Stage error:/).waitFor(); expect(await page.locator("wasm4-app").count()).toBe(0);
  await page.evaluate(() => { const s = (globalThis as any).sample; delete s.context.terminal; s.mount(); }); expect(await page.getByRole("button", { name: "Send feedback" }).count()).toBe(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => { const s = (globalThis as any).sample; delete s.context.blobs; s.publish(s.cart, 1); }); await page.getByText(/host is too old/i).waitFor();
  const pendingAbort = await page.evaluate(async () => {
   const s = (globalThis as any).sample; let resolve: any, readSignal: AbortSignal | undefined, reads = 0;
   const pending = new Promise(r => resolve = r);
   s.context.blobs = { read: (_digest: string, signal: AbortSignal) => { reads++; readSignal = signal; return pending; } };
   s.publish(s.secondCart, 2); s.abort.abort(); resolve(s.bank.get(s.secondCart.blobDigest)); await pending; await new Promise<void>(r => queueMicrotask(r));
   return { reads, aborted: readSignal?.aborted ?? false };
  }); expect(pendingAbort).toEqual({ reads: 1, aborted: true }); expect(await page.locator("wasm4-app").count()).toBe(0);
  await page.evaluate(() => (globalThis as any).sample.drained());
  const resources = await page.evaluate(() => (globalThis as any).sample.resources());
  expect(resources.subscriptions).toBe(0); expect(resources.frames).toBe(0); expect(resources.inputListeners).toBe(0); expect(resources.audioStates.every((state: string) => state === 'closed')).toBe(true);
  expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 30000);

test("blob subarray bytes are snapshotted into the same validated runtime input", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => {
   const s = (globalThis as any).sample; const padded = new Uint8Array(s.bytes.length + 16); padded.set(s.bytes, 8);
   s.context.blobs.read = async () => padded.subarray(8, 8 + s.bytes.length); s.publish(s.cart, 1);
  }); await f.page.getByRole("status").filter({ hasText: /Running|Stage error:/ }).waitFor();
  expect(await f.page.getByRole("status").textContent()).toBe("Running"); await pixels(f.page); expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("same digest during deferred blob read retains one request and latest metadata", async () => {
 const f = await fixture(); try {
  const before = await f.page.evaluate(() => {
   const s = (globalThis as any).sample; let resolve: any, reads = 0; const signals: AbortSignal[] = [];
   const pending = new Promise(r => resolve = r); s.context.blobs.read = (_digest: string, signal: AbortSignal) => { reads++; signals.push(signal); return pending; };
   s.publish(s.cart, 1); s.publish({ ...s.cart, title: "Latest title", build: 2, note: "Latest note" }, 2);
   (globalThis as any).finishRead = async () => { resolve(s.bytes); await pending; await new Promise<void>(r => queueMicrotask(r)); };
   return { reads, aborted: signals.some(signal => signal.aborted) };
  }); expect(before).toEqual({ reads: 1, aborted: false });
  await f.page.evaluate(() => (globalThis as any).finishRead()); await running(f.page);
  expect(await f.page.getByRole("heading", { name: "Latest title" }).count()).toBe(1);
  await f.page.getByRole("button", { name: "Send feedback" }).click(); expect(await f.page.evaluate(() => (globalThis as any).sample.composed)).toBe("stage build 2: ");
  expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

for (const boundary of ["audio init", "WASM load"] as const) {
 test(`abort during delayed ${boundary} releases runtime resources without late work`, async () => {
  const f = await fixture(); try {
   await f.page.evaluate(boundary => {
    const s = (globalThis as any).sample; let enter: any, release: any;
    const entered = new Promise<void>(resolve => enter = resolve), gate = new Promise<void>(resolve => release = resolve);
    if (boundary === "audio init") {
     const original = AudioWorklet.prototype.addModule;
     AudioWorklet.prototype.addModule = async function(...args) { enter(); await gate; return original.apply(this, args); };
    } else {
     const original = WebAssembly.instantiate;
     (WebAssembly as any).instantiate = async (...args: any[]) => { enter(); await gate; return (original as any)(...args); };
    }
    (globalThis as any).delayed = { entered, release };
    s.publish(s.cart, 1);
   }, boundary);
   await f.page.evaluate(() => (globalThis as any).delayed.entered);
   expect(await f.page.locator("wasm4-app").count()).toBe(1);
   await f.page.evaluate(async () => {
    const s = (globalThis as any).sample; s.abort.abort(); (globalThis as any).delayed.release();
    await s.runtimeCompletion; await s.drained();
   });
   expect(await f.page.locator("#stage").textContent()).toBe("");
   const resources = await f.page.evaluate(() => (globalThis as any).sample.resources());
   expect(resources.frames).toBe(0); expect(resources.subscriptions).toBe(0); expect(resources.inputListeners).toBe(0);
   expect(resources.audioStates).toEqual(["closed"]);
   // A later frame/task does not resurrect a disposed loop or subscription.
   await f.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
   expect(await f.page.evaluate(() => (globalThis as any).sample.resources().frames)).toBe(0);
   expect(f.errors).toEqual([]);
  } finally { await f.close(); }
 }, 15000);
}

test("failed digest is attempted once across identical polls and metadata revisions", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => {
   const s = (globalThis as any).sample; let reads = 0; const signals: AbortSignal[] = [];
   s.context.blobs.read = async (_digest: string, signal: AbortSignal) => { reads++; signals.push(signal); return s.bytes; };
   const bad = { ...s.cart, blobDigest: '0'.repeat(64) }; s.publish(bad, 1);
   (globalThis as any).pollFailure = async () => {
    await new Promise<void>(resolve => { let polls = 0; const timer = setInterval(() => { s.publish(bad, 1); if (++polls === 3) { clearInterval(timer); resolve(); } }, 250); });
    s.publish({ ...bad, title: 'Updated failed title', build: 2 }, 2);
    await new Promise<void>(resolve => queueMicrotask(resolve)); return { reads, aborted: signals.some(signal => signal.aborted) };
   };
  }); await f.page.getByText(/digest mismatch/i).waitFor();
  expect((await f.page.evaluate(() => (globalThis as any).pollFailure())).reads).toBe(1);
  expect(await f.page.getByText(/digest mismatch/i).count()).toBe(1);
  expect(await f.page.getByRole('heading', { name: 'Updated failed title' }).count()).toBe(1);
  // Only a changed digest permits a new attempt; the same invalid digest never retries.
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 3); }); await running(f.page); await pixels(f.page);
  expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("host-style 250ms same-revision polls share one 600ms blob read through Running", async () => {
 const f = await fixture(); try {
  const outcome = await f.page.evaluate(async () => {
   const s = (globalThis as any).sample; let reads = 0, polls = 0; const signals: AbortSignal[] = [];
   s.context.blobs.read = async (_digest: string, signal: AbortSignal) => { reads++; signals.push(signal); await new Promise(resolve => setTimeout(resolve, 600)); return s.bytes; };
   s.publish(s.cart, 1);
   await new Promise<void>(resolve => { const timer = setInterval(() => { s.publish(s.cart, 1); if (++polls === 4) { clearInterval(timer); resolve(); } }, 250); });
   return { reads, polls, aborted: signals.some(signal => signal.aborted), state: document.querySelector('[role=status]')?.textContent };
  }); expect(outcome).toEqual({ reads: 1, polls: 4, aborted: false, state: 'Running' }); await pixels(f.page);
  expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("host visibility pauses game RAF and audio then resumes the same instance", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 1); }); await running(f.page);
  await f.page.locator('wasm4-app').click();
  await f.page.waitForFunction(() => (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.state === 'running');
  const hidden = await f.page.evaluate(async () => {
   const s = (globalThis as any).sample, app = document.querySelector('wasm4-app') as any; let updates = 0; const update = app.runtime.update.bind(app.runtime);
   app.runtime.update = () => { updates++; update(); }; (globalThis as any).retained = app; s.setVisible(false);
   await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
   return { frames: s.resources().frames, updates, audio: app.runtime.apu.audioCtx.state };
  }); expect(hidden).toEqual({ frames: 0, updates: 0, audio: 'suspended' });
  await f.page.evaluate(() => (globalThis as any).sample.setVisible(true));
  await f.page.waitForFunction(() => (globalThis as any).retained.runtime.apu.audioCtx.state === 'running'); await pixels(f.page);
  expect(await f.page.evaluate(() => document.querySelector('wasm4-app') === (globalThis as any).retained)).toBe(true);
  await f.page.evaluate(async () => { const s = (globalThis as any).sample; for (let i = 0; i < 3; i++) { s.setVisible(false); s.setVisible(true); } s.setVisible(false); await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
  expect(await f.page.evaluate(() => ({ frames: (globalThis as any).sample.resources().frames, audio: (globalThis as any).retained.runtime.apu.audioCtx.state }))).toEqual({ frames: 0, audio: 'suspended' });
  await f.page.evaluate(async () => { const s = (globalThis as any).sample; s.setVisible(true); s.dispose(); s.setVisible(true); await s.drained(); });
  expect(await f.page.evaluate(() => (globalThis as any).sample.resources().frames)).toBe(0); expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

for (const boundary of ["before init", "during audio init", "during WASM load"] as const) {
 test(`hidden ${boundary} never starts a game loop until shown`, async () => {
  const f = await fixture(); try {
   await f.page.evaluate(boundary => {
    const s = (globalThis as any).sample; let enter: any, release: any;
    const entered = new Promise<void>(resolve => enter = resolve), gate = new Promise<void>(resolve => release = resolve);
    if (boundary === "during audio init") {
     const original = AudioWorklet.prototype.addModule;
     AudioWorklet.prototype.addModule = async function(...args) { enter(); await gate; return original.apply(this, args); };
    } else if (boundary === "during WASM load") {
     const original = WebAssembly.instantiate;
     (WebAssembly as any).instantiate = async (...args: any[]) => { enter(); await gate; return (original as any)(...args); };
    } else { s.setVisible(false); enter(); }
    (globalThis as any).hiddenGate = { entered, release };
    s.publish(s.cart, 1);
   }, boundary);
   await f.page.evaluate(() => (globalThis as any).hiddenGate.entered);
   await f.page.evaluate(boundary => { const s = (globalThis as any).sample; if (boundary !== 'before init') { s.setVisible(false); s.setVisible(true); s.setVisible(false); } (globalThis as any).hiddenGate.release(); }, boundary);
   await f.page.waitForFunction(() => document.querySelector('[role=status]')?.textContent === 'Running');
   const state = await f.page.evaluate(async () => {
    const s = (globalThis as any).sample; await s.runtimeCompletion;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const app = document.querySelector('wasm4-app') as any; (globalThis as any).initialHidden = app;
    return { frames: s.resources().frames, updates: s.resources().updates, audio: app.runtime.apu.audioCtx.state, drew: new Uint8Array(app.runtime.memory.buffer, 160, 6400).some(v => v !== 0) };
   }); expect(state).toEqual({ frames: 0, updates: 0, audio: 'suspended', drew: false });
   await f.page.evaluate(() => (globalThis as any).sample.setVisible(true)); await running(f.page); await pixels(f.page);
   expect(await f.page.evaluate(() => document.querySelector('wasm4-app') === (globalThis as any).initialHidden)).toBe(true);
   expect(f.errors).toEqual([]);
  } finally { await f.close(); }
 }, 15000);
}

test("dispose during a pending visibility audio resume cannot revive the hidden runtime", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 1); }); await running(f.page);
  await f.page.locator('wasm4-app').click(); await f.page.waitForFunction(() => (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.state === 'running');
  await f.page.evaluate(() => (globalThis as any).sample.setVisible(false));
  await f.page.waitForFunction(() => (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.state === 'suspended');
  await f.page.evaluate(() => {
   const s = (globalThis as any).sample; let enter: any, release: any; const entered = new Promise<void>(r => enter = r), gate = new Promise<void>(r => release = r);
   const resume = AudioContext.prototype.resume;
   AudioContext.prototype.resume = async function() { enter(); await gate; return resume.call(this); };
   (globalThis as any).resumeGate = { entered, release, app: document.querySelector('wasm4-app') };
   s.setVisible(true);
  }); await f.page.evaluate(() => (globalThis as any).resumeGate.entered);
  await f.page.evaluate(async () => { const s = (globalThis as any).sample, g = (globalThis as any).resumeGate; s.setVisible(false); s.dispose(); g.release(); await g.app.audioTask; await s.drained(); s.setVisible(true); });
  expect(await f.page.evaluate(() => ({ frames: (globalThis as any).sample.resources().frames, audio: (globalThis as any).resumeGate.app.runtime.apu.audioCtx.state }))).toEqual({ frames: 0, audio: 'closed' });
  expect(await f.page.locator('wasm4-app').count()).toBe(0); expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("visibility restores audio that was already running under browser activation", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 1); }); await running(f.page);
  // The browser/host may have allowed audio independently of a gamepad gesture.
  await f.page.locator('#terminal').click();
  await f.page.evaluate(async () => { await (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.resume(); });
  await f.page.evaluate(() => (globalThis as any).sample.setVisible(false));
  await f.page.waitForFunction(() => (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.state === 'suspended');
  await f.page.evaluate(() => (globalThis as any).sample.setVisible(true));
  await f.page.waitForFunction(() => (document.querySelector('wasm4-app') as any).runtime.apu.audioCtx.state === 'running');
  expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("valid cart recovers after an invalid uppercase-digest document with exactly two reads", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => {
   const s = (globalThis as any).sample; let reads = 0; const read = s.context.blobs.read;
   s.context.blobs.read = (...args: any[]) => { reads++; return read(...args); };
   (globalThis as any).readCount = () => reads; s.publish(s.cart, 1);
  }); await running(f.page); await pixels(f.page);
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish({ ...s.cart, blobDigest: s.cart.blobDigest.toUpperCase() }, 2); });
  await f.page.getByText('Stage error: Invalid cart document', { exact: true }).waitFor();
  expect(await f.page.locator('wasm4-app').count()).toBe(0); expect(await f.page.evaluate(() => (globalThis as any).readCount())).toBe(1);
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 3); });
  // The listener reaches its first read synchronously; do not mistake a stale error for success.
  expect(await f.page.evaluate(() => (globalThis as any).readCount())).toBe(2);
  await running(f.page); await pixels(f.page); expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);

test("null cart stops runtime but retains its document subscription for a later cart", async () => {
 const f = await fixture(); try {
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 1); }); await running(f.page); await pixels(f.page);
  await f.page.evaluate(async () => { const s = (globalThis as any).sample; s.publish(null, 2); await s.drained(); });
  expect(await f.page.locator('wasm4-app').count()).toBe(0); expect(await f.page.getByRole('heading', { name: 'No cart yet' }).count()).toBe(1);
  expect(await f.page.getByRole('status').textContent()).toBe('ask the agent: "build me a WASM-4 game"');
  expect(await f.page.evaluate(() => ({ frames: (globalThis as any).sample.resources().frames, subscriptions: (globalThis as any).sample.resources().subscriptions }))).toEqual({ frames: 0, subscriptions: 1 });
  await f.page.evaluate(() => { const s = (globalThis as any).sample; s.publish(s.cart, 3); }); await running(f.page); await pixels(f.page);
  await f.page.evaluate(() => (globalThis as any).sample.dispose());
  expect(await f.page.evaluate(() => (globalThis as any).sample.resources().subscriptions)).toBe(0); expect(f.errors).toEqual([]);
 } finally { await f.close(); }
}, 15000);
