import ts from "typescript";

/** Inspect module syntax without executing the bundle or consulting ambient controls. */
export function assertSelfContained(bundle: Uint8Array): void {
  const source = ts.createSourceFile("ui.js", Buffer.from(bundle).toString("utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const parseDiagnostics = (source as unknown as { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
  if (parseDiagnostics.length) throw new Error(`PACKAGE_GATE: bundle parse error: ${parseDiagnostics[0]?.messageText}`);
  const forbidden: string[] = [];
  let defaultExports = 0;
  let extraExport = false;
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier || ts.isImportEqualsDeclaration(node)) forbidden.push("static module import/export");
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) forbidden.push("dynamic import/require");
    if (ts.isExportAssignment(node)) {
      if (node.isExportEquals) extraExport = true; else defaultExports++;
    } else if (ts.isExportDeclaration(node) && !node.moduleSpecifier) {
      if (!node.exportClause || !ts.isNamedExports(node.exportClause)) extraExport = true;
      else for (const element of node.exportClause.elements) {
        if (element.name.text === "default") defaultExports++; else extraExport = true;
      }
    } else if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
        if (modifiers.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) defaultExports++; else extraExport = true;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (forbidden.length) throw new Error(`PACKAGE_GATE: bundle contains external dependency syntax: ${[...new Set(forbidden)].join(", ")}`);
  if (extraExport || defaultExports !== 1) throw new Error("PACKAGE_GATE: bundle must have exactly one default export and no additional exports");
}
