import ts from "typescript";

/** Inspect module syntax without executing the bundle or consulting ambient controls. */
export function assertSelfContained(bundle: Uint8Array): void {
  const source = ts.createSourceFile("ui.js", Buffer.from(bundle).toString("utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const parseDiagnostics = (source as unknown as { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
  if (parseDiagnostics.length) throw new Error(`PACKAGE_GATE: bundle parse error: ${parseDiagnostics[0]?.messageText}`);
  const forbidden: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier || ts.isImportEqualsDeclaration(node)) forbidden.push("static module import/export");
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) forbidden.push("dynamic import/require");
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (forbidden.length) throw new Error(`PACKAGE_GATE: bundle contains external dependency syntax: ${[...new Set(forbidden)].join(", ")}`);
}
