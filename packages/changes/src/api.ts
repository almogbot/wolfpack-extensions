/**
 * Minimal structural APIv1 authoring types.
 *
 * The installed bundle uses Wolfpack's default-registration contract; this file
 * intentionally has no runtime import and does not claim compatibility with
 * hosts that do not expose APIv1 project.gitStatus.
 */
export type GitChangeKind = "added" | "modified" | "deleted" | "renamed" | "copied" | "type-changed" | "unmerged" | "untracked";
export interface GitFileChange { readonly path: string; readonly status: GitChangeKind; readonly previousPath?: string; }
export type ProjectGitStatus = { readonly state: "not-repository" } | {
  readonly state: "ready";
  readonly branch: string | null;
  readonly detached: boolean;
  readonly staged: readonly GitFileChange[];
  readonly unstaged: readonly GitFileChange[];
  readonly untracked: readonly GitFileChange[];
  readonly truncated: boolean;
};
export interface ExtensionViewContext {
  readonly signal: AbortSignal;
  readonly project: Readonly<{ gitStatus(signal?: AbortSignal): Promise<ProjectGitStatus> }>;
}
export interface ExtensionRegistrationHost {
  registerContextView(view: { readonly id: string; readonly title: string; mount(container: HTMLElement, context: ExtensionViewContext): { dispose(): void; setVisible?(visible: boolean): void; }; }): void;
}
