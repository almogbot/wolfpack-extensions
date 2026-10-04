import { mkdirSync } from "node:fs";
import { join } from "node:path";

/** Explicit paths shared by normal builds and temporary release validation. */
export async function buildBundle(root: string, output: string): Promise<void> {
  mkdirSync(output, { recursive: true });
  const result = await Bun.build({
    root, entrypoints: [join(root, "src", "ui.ts")], outdir: output, naming: "ui.js",
    format: "esm", target: "browser", minify: false, sourcemap: "none",
  });
  if (!result.success) throw new Error(`Changes bundle failed: ${result.logs.map(log => log.message).join("; ")}`);
}
