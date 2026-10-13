/** Local structural Extensions APIv1 types; no Wolfpack runtime is imported. */
export interface ExtensionViewContext {
  readonly signal: AbortSignal;
  readonly terminal?: Readonly<{ compose(text: string): void }>;
  readonly theme: Readonly<Record<string, string>>;
  readonly storage: Readonly<{ get(key: string): string | null; set(key: string, value: string): void }>;
  readonly documents: Readonly<{ subscribe(id: string, listener: (value: unknown | null, revision: number) => void): () => void }>;
}
export interface ExtensionRegistrationHost {
 registerContextView(view: {id:string;title:string;mount(container:HTMLElement,context:ExtensionViewContext):{dispose():void;setVisible?(visible:boolean):void}}):void;
}
