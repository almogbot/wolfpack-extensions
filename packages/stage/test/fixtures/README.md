# fixture

Route: hand-encoded WASM fallback. The cached WASM-4 2.7.1 Zig template failed on Zig 0.16 (`Build.ExecutableOptions.root_source_file` removed); original source retained under zig/, diagnostic `.plans/evidence/zig-initial.log`, exit 2. No toolchains were installed.

Reproduce: `python3 packages/stage/test/fixtures/generate.py` from repo root. The source spells out wasm sections/ABI imports; update sets DRAW_COLORS to 2 and draws a 40×40 rectangle at (20,20). Imported env.memory is one page; env.rect uses four i32 args. File: hello.wasm, 89 bytes, SHA-256 `24e58715eafa46af6482f4b26e9fbfcdb483cd9dd3a9da6803ba2948d2fb89bb`.
