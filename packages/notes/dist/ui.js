// src/api.ts
function verticalStackLayout(context) {
  const count = Math.max(1, context.panes.length);
  return { version: 1, rows: Array.from({ length: count }, () => ({ size: 1 / count })), columns: [{ size: 1 }], placements: context.panes.map((pane, row) => ({ paneId: pane.id, row, column: 0 })) };
}

// src/ui.ts
function register(host) {
  host.registerContextView({
    id: "notes",
    title: "Notes",
    mount(container, context) {
      const root = document.createElement("section");
      const label = document.createElement("label");
      label.textContent = "Local notes for this exact extension scope";
      const editor = document.createElement("textarea");
      editor.value = context.storage.get("notes") ?? "";
      editor.addEventListener("input", () => context.storage.set("notes", editor.value));
      label.append(editor);
      root.append(label);
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
