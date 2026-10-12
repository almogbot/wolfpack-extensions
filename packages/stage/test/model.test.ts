import { expect, test } from "bun:test";
import { parseCart, verifyCart, needsReload } from "../src/model.ts";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const bytes = readFileSync(new URL("fixtures/hello.wasm", import.meta.url));
const digest = createHash("sha256").update(bytes).digest("hex");
const cart = { schemaVersion: 1, profile: "w4", title: "Hello", build: 1, blobDigest: digest, size: bytes.length } as const;
test('static schema pins the host-approved bounded contract',()=>{
 const bytes=readFileSync(new URL('../schemas/cart.schema.json',import.meta.url));
 expect(createHash('sha256').update(bytes).digest('hex')).toBe('8c90b45f0f7c9042151893efad737f1ffad2031b64eda66bf81b71cc0e9f84ca');
 const schema=JSON.parse(bytes.toString());expect(schema.additionalProperties).toBe(false);expect(schema.required).toEqual(['schemaVersion','profile','title','build','blobDigest','size']);expect(schema.properties.size).toEqual({type:'integer',minimum:1,maximum:65536});
 const forbidden=['$ref','$id','$anchor','pattern','format','patternProperties'];const walk=(v:any)=>{if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){expect(forbidden).not.toContain(k);walk(x)}};walk(schema);
});
test("bounded cart model rejects invalid and extra fields", () => {
 expect(parseCart(cart)).toEqual(cart);
 for(const value of [{...cart,size:65537},{...cart,build:0},{...cart,title:"x".repeat(129)},{...cart,blobDigest:"g".repeat(64)},{...cart,extra:true}]) expect(()=>parseCart(value)).toThrow();
 expect(needsReload(digest,cart)).toBe(false); expect(needsReload(null,cart)).toBe(true);
});
test('validated snapshot owns exactly the subarray bytes across async mutation', async()=>{
 const padded=new Uint8Array(bytes.length+16);padded.set(bytes,8);const view=padded.subarray(8,8+bytes.length);
 const pending=verifyCart(view,cart);view.fill(0);const owned=await pending;
 expect(owned.byteOffset).toBe(0);expect(owned.buffer.byteLength).toBe(bytes.length);expect(Array.from(owned)).toEqual(Array.from(bytes));
});
test("cart bytes require exact declared size and sha256", async()=>{
 await verifyCart(bytes,cart);
 const malformed=Uint8Array.from([0,97,115,109,1,0,0,0,0,128,128,128,128,8]);
 const bad={...cart,size:malformed.length,blobDigest:createHash('sha256').update(malformed).digest('hex')};
 await expect(verifyCart(malformed,bad)).rejects.toThrow(/invalid wasm/i);
 await expect(verifyCart(bytes,{...cart,blobDigest:"0".repeat(64)})).rejects.toThrow(/digest/i);
 await expect(verifyCart(bytes,{...cart,size:bytes.length+1})).rejects.toThrow(/size/i);
 await expect(verifyCart(new Uint8Array(65537),cart)).rejects.toThrow(/size/i);
});
