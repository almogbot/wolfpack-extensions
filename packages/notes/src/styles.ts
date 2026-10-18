/** Packaged with the extension, scoped to its own root; host theme tokens override the fallbacks. */
export const styles = `
.wolfpack-notes {
  --wn-text: var(--text-primary, #edf3ef);
  --wn-muted: var(--text-muted, #a4b2a9);
  --wn-border: var(--border, #28312b);
  --wn-inset: var(--bg-inset, #0d100e);
  --wn-accent: var(--accent, #45ed7e);
  --wn-warning: var(--warning, #ebca78);
  display: block; min-width: 0; color: var(--wn-text);
  font: 13px/1.55 var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}
.wolfpack-notes *, .wolfpack-notes *::before, .wolfpack-notes *::after { box-sizing: border-box; }
.wolfpack-notes[hidden] { display: none !important; }
.wolfpack-notes label { display: grid; gap: 6px; min-width: 0; color: var(--wn-muted); font-size: 11px; font-weight: 600; }
.wolfpack-notes textarea { display: block; width: 100%; min-width: 0; min-height: 160px; resize: vertical; padding: 10px; border: 1px solid var(--wn-border); border-radius: var(--radius-md, 7px); background: var(--wn-inset); color: var(--wn-text); font: inherit; font-size: 13px; font-weight: 400; line-height: 1.6; }
.wolfpack-notes textarea:focus-visible { outline: 2px solid var(--wn-accent); outline-offset: 1px; }
.wolfpack-notes .wn-status { margin: 0; color: var(--wn-warning); font-size: 11px; }
.wolfpack-notes .wn-status:not(:empty) { margin-top: 6px; }
@media (max-width: 768px) { .wolfpack-notes textarea { font-size: 16px; } }
`;
