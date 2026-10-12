export interface Cart { schemaVersion: 1; profile: "w4"; title: string; build: number; blobDigest: string; size: number; note?: string; controls?: string }
export function parseCart(value: unknown): Cart {
 if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid cart document");
 const c = value as Record<string, unknown>;
 const text = (key: string, max: number, optional = false) => optional && c[key] === undefined || typeof c[key] === "string" && [...c[key] as string].length <= max;
 if (Object.keys(c).some(k => !["schemaVersion","profile","title","build","blobDigest","size","note","controls"].includes(k)) || c.schemaVersion !== 1 || c.profile !== "w4" || !text("title",128) || !text("note",4000,true) || !text("controls",1000,true) || !Number.isSafeInteger(c.build) || (c.build as number)<1 || !Number.isInteger(c.size) || (c.size as number)<1 || (c.size as number)>65536 || typeof c.blobDigest!=="string" || !/^[a-f0-9]{64}$/.test(c.blobDigest)) throw Error("Invalid cart document");
 return c as unknown as Cart;
}
export function needsReload(digest: string | null, cart: Cart): boolean { return digest !== cart.blobDigest; }
export async function verifyCart(input: Uint8Array, cart: Cart): Promise<Uint8Array<ArrayBuffer>> {
 if(input.length>65536 || input.length!==cart.size) throw Error("Cart size mismatch or oversize");
 // One owned, contiguous snapshot is hashed, validated, and passed to the runtime.
 // Host views may have byteOffset != 0 or be mutated after this async boundary.
 const bytes=new Uint8Array(input);
 const hash=await crypto.subtle.digest("SHA-256",bytes);
 const digest=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
 if(digest!==cart.blobDigest) throw Error("Cart digest mismatch");
 // The upstream global-export transformer assumes structurally valid WASM.
 // Native validation must precede it: malformed signed section lengths can loop.
 if(!WebAssembly.validate(bytes)) throw Error("Invalid WASM cartridge");
 return bytes;
}
