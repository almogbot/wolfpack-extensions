import { verticalStackLayout, type ExtensionRegistrationHost } from "./api.ts";
import { styles } from "./styles.ts";

function setText(element: HTMLElement, value: string): void { if (element.textContent !== value) element.textContent = value; }

export default function register(host: ExtensionRegistrationHost): void {
  host.registerContextView({
    id: "notes",
    title: "Notes",
    mount(container, context) {
      const root = document.createElement("section"); root.className = "wolfpack-notes";
      // Snapshot tokens go through the CSSOM, never into stylesheet text.
      for (const [key, value] of Object.entries(context.theme)) if (key.startsWith("--")) root.style.setProperty(key, value);
      const style = document.createElement("style"); style.textContent = styles;
      const label = document.createElement("label"); label.textContent = "Local notes for this exact extension scope";
      const editor = document.createElement("textarea"); editor.rows = 10;
      const status = document.createElement("p"); status.className = "wn-status"; status.setAttribute("role", "status");
      // Storage can throw (disabled, private mode, quota); the editor keeps working and says so.
      try { editor.value = context.storage.get("notes") ?? ""; }
      catch { setText(status, "Saved notes could not be loaded."); }
      editor.addEventListener("input", () => {
        try { context.storage.set("notes", editor.value); setText(status, ""); }
        catch { setText(status, "Could not save. Your latest edits are only in this editor."); }
      });
      label.append(editor); root.append(style, label, status); container.replaceChildren(root);
      return { setVisible(visible) { root.hidden = !visible; }, dispose() { root.remove(); } };
    },
  });
  host.registerTerminalLayout({ id: "vertical-stack", title: "Vertical stack", arrange: verticalStackLayout });
}
