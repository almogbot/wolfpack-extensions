/** Local structural Extensions APIv1 types; no Wolfpack runtime is imported. */
export interface ExtensionViewContext {
  readonly signal: AbortSignal;
  readonly scope: Readonly<{ installationId: string; sessionId: string }>;
  readonly selection: Readonly<{ selectedSessionId: string | null }>;
  readonly theme: Readonly<Record<string, string>>;
  readonly storage: Readonly<{ get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }>;
  readonly project: Readonly<{ gitStatus(signal?: AbortSignal): Promise<unknown> }>;
  readonly documents: Readonly<{ read(id: string): Promise<unknown | null>; subscribe(id: string, listener: (value: unknown | null, revision: number) => void): () => void }>;
}
export interface LayoutContext { readonly panes: readonly { id: string }[]; readonly selectedPaneId: string | null; readonly viewport: Readonly<{ width: number; height: number }>; }
export interface TerminalLayout { readonly version: 1; readonly rows: readonly { size: number }[]; readonly columns: readonly { size: number }[]; readonly placements: readonly { paneId: string; row: number; column: number; rowSpan?: number; columnSpan?: number }[]; }
export interface ExtensionRegistrationHost {
  registerContextView(view: { readonly id: string; readonly title: string; mount(container: HTMLElement, context: ExtensionViewContext): { dispose(): void; setVisible?(visible: boolean): void } }): void;
  registerTerminalLayout(layout: { readonly id: string; readonly title: string; arrange(context: LayoutContext): TerminalLayout }): void;
}
/** APIv1-compatible local layout helper, bundled into this extension. */
export function verticalStackLayout(context: LayoutContext): TerminalLayout {
  const count = Math.max(1, context.panes.length);
  return { version: 1, rows: Array.from({ length: count }, () => ({ size: 1 / count })), columns: [{ size: 1 }], placements: context.panes.map((pane, row) => ({ paneId: pane.id, row, column: 0 })) };
}
