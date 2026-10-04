/** Local structural Extensions APIv1 types. They are erased at build time. */
export interface ExtensionViewContext {
  readonly signal: AbortSignal;
  readonly scope: Readonly<{ installationId: string; sessionId: string }>;
  readonly storage: Readonly<{ get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }>;
  readonly documents: Readonly<{ read(id: string, signal?: AbortSignal): Promise<unknown>; subscribe(id: string, listener: (document: unknown, revision: number) => void): () => void }>;
}
export interface ContextViewContribution {
  readonly id: string;
  readonly title: string;
  mount(container: HTMLElement, context: ExtensionViewContext): { dispose(): void; setVisible?(visible: boolean): void };
}
export interface ExtensionRegistrationHost { registerContextView(view: ContextViewContribution): void; }
