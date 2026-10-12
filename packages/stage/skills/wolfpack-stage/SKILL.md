---
name: wolfpack-stage
description: Build a WASM-4 game and publish the freshly built cartridge to the verified Wolfpack session with blob receipts and compare-and-swap revisions.
---

# Wolfpack Stage

1. Pin the scope: run `wolfpack session current-context --json`. Require exit 0, `ok: true`, `verified: true`, a canonical `sessionId` UUID and the expected `projectDir`. Never guess from names, lists, process scanning, raw environment or unverified older output. For an explicitly supplied UUID, use `wolfpack session status <exact-uuid> --json`, requiring the identical UUID, expected project and live/ready terminal. Stop on failure or unexpected project; keep the resolved UUID fixed.
2. Scaffold in the project, rust first:
   ```sh
   bunx wasm4@2.7.1 new --rust game
   cd game
   cargo build --release --target wasm32-unknown-unknown
   ```
   The rust template names its crate `cart`; output: `target/wasm32-unknown-unknown/release/cart.wasm`. Check the generated Cargo.toml and confirm the artifact name before upload. The target must already be available; missing toolchains/targets require permission to install, not silent installation.
   Zig alternative:
   ```sh
   bunx wasm4@2.7.1 new --zig game
   cd game
   zig build -Doptimize=ReleaseSmall
   ```
   Output: `zig-out/bin/cart.wasm`. The 2.7.1 template targets older Zig build APIs; adapt locally or report incompatibility rather than pretending a build succeeded. `wasm-opt -Oz <built-cart> -o <cart.wasm>` is optional when already available. Use the final optimized artifact consistently.
3. Check the actual final file: `wc -c <cart.wasm>` must be 1..65536; `shasum -a 256 <cart.wasm>`. Never upload or publish anything except the cart just built for this request. Do not substitute a downloaded or stale cartridge.
4. Upload bytes:
   ```sh
   wolfpack extension-data put-blob stage --session <exact-uuid> --file <cart.wasm> --json
   wolfpack extension-data read stage/cart --session <exact-uuid> --json
   ```
   Require successful blob receipt `{ digest, bytes, created }`; compare its digest and byte count to the final artifact. Read the document's current revision and build; increment build (1 if absent). Write cart.json with only `schemaVersion: 1`, `profile: "w4"`, `title` (≤128 characters), `build` (integer ≥1), `blobDigest` (the 64-character lowercase SHA-256), `size` (1..65536), optional `note` (≤4000) and `controls` (≤1000). Explain what changed and what to test; never include secrets or fabricated evidence.
   ```sh
   wolfpack extension-data publish stage/cart --session <exact-uuid> --file cart.json --if-revision <read-revision> --request-id <fresh-uuid> --json
   wolfpack extension-data read stage/cart --session <exact-uuid> --json
   ```
   Re-read and report the accepted revision, build and digest. On conflict re-read/reconcile and use a fresh request ID; for an uncertain lost response retry identical file/revision/request ID only. A receipt proves acceptance/storage for that scope, not that the human played it, the runtime rendered correctly, or the game is safe/fun. Do not claim browser verification without actual evidence.
5. Read the human's feedback from the next prompt; rebuild, upload and increment the build with a new CAS publication. The feedback button composes a build prefix but never sends it.

Use only public CLI operations. Never write extension store files or private APIs. Do not install/update the extension or change another session as part of publication. Skill installation needs explicit `--skills pi` consent; discovery may need a user-controlled reload/new session, never injected into a live terminal.
