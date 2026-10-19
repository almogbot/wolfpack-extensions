# Stage

Build a WASM-4 cart with your agent, play it beside the terminal, and iterate with feedback. Install this APIv1 package from an absolute directory with explicit browser-code trust and optional `--skills pi` consent. Published bridge versions without Extensions APIv1 are unsupported.

Stage requires declared blob reads (65536-byte maximum) and host CSP `script-src` allowing `blob:` modules and `'wasm-unsafe-eval'`. Older hosts show guidance instead of attempting to run. The cart document uses the bundled static schema; bytes are checked for exact size and SHA-256 before instantiation. Changed digests hot-swap; unchanged digests keep the game running.

Click/touch the game to focus it; arrow keys move, X/Z are actions. Pointer down reveals the touch pad. Send feedback only composes `stage build N: ` into the open scoped terminal; it never sends. Disk saves use installation/session/title isolation. Chrome uses host theme snapshots with fallbacks. Runtime resources are disposed on scope abort/removal. Hidden views pause the game and suspend audio; showing resumes previously running or gesture-unlocked audio. The no-auto-unlock branch is verified by inspection only: installed Playwright-launched Brave starts audio contexts running without a gesture.

Development: `bun run build`, `bun run typecheck`, `bun test test`, `bun run check:package`, `bun run check:package-negative`, `bun run pack`. No consumer build/install lifecycle or runtime dependencies. Vendored slim WASM-4 provenance and mechanical diff: `vendor/wasm4/PATCH.md`; license: `THIRD_PARTY_NOTICES.md`. Browser tests use a real 89-byte cart and mocked host blob transport, not a fake renderer. Physical-device Safari remains a separate integration check.
