// src/api.ts
function verticalStackLayout(context) {
  const count = Math.max(1, context.panes.length);
  return { version: 1, rows: Array.from({ length: count }, () => ({ size: 1 / count })), columns: [{ size: 1 }], placements: context.panes.map((pane, row) => ({ paneId: pane.id, row, column: 0 })) };
}

// src/styles.ts
var styles = `
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

// src/ui.ts
function setText(element, value) {
  if (element.textContent !== value)
    element.textContent = value;
}
function register(host) {
  host.registerContextView({
    id: "notes",
    title: "Notes",
    mount(container, context) {
      const root = document.createElement("section");
      root.className = "wolfpack-notes";
      for (const [key, value] of Object.entries(context.theme))
        if (key.startsWith("--"))
          root.style.setProperty(key, value);
      const style = document.createElement("style");
      style.textContent = styles;
      const label = document.createElement("label");
      label.textContent = "Local notes for this exact extension scope";
      const editor = document.createElement("textarea");
      editor.rows = 10;
      const status = document.createElement("p");
      status.className = "wn-status";
      status.setAttribute("role", "status");
      try {
        editor.value = context.storage.get("notes") ?? "";
      } catch {
        setText(status, "Saved notes could not be loaded.");
      }
      editor.addEventListener("input", () => {
        try {
          context.storage.set("notes", editor.value);
          setText(status, "");
        } catch {
          setText(status, "Could not save. Your latest edits are only in this editor.");
        }
      });
      label.append(editor);
      root.append(style, label, status);
      container.replaceChildren(root);
      return { setVisible(visible) {
        root.hidden = !visible;
      }, dispose() {
        root.remove();
      } };
    }
  });
  host.registerTerminalLayout({ id: "vertical-stack", title: "Vertical stack", arrange: verticalStackLayout });
}
export {
  register as default
};
