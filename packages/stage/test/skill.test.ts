import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
test('skill pins scope, real builds and CAS publication',()=>{const s=readFileSync(new URL('../skills/wolfpack-stage/SKILL.md',import.meta.url),'utf8');for(const token of ['name: wolfpack-stage','description:','current-context','put-blob','--if-revision','--request-id','cargo build --release --target wasm32-unknown-unknown','zig build -Doptimize=ReleaseSmall'])expect(s).toContain(token);});
