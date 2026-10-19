export function ensureRuntime(): void;
/** Element-scoped runtime lifecycle used by the Stage view controller. */
export interface Wasm4AppElement extends HTMLElement {
 startCart(bytes: Uint8Array, diskPrefix: string): Promise<void>;
 setVisible(visible: boolean): void;
 dispose(): void;
}
