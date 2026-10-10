export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return {
      format: "module",
      shortCircuit: true,
      source: "export default {};",
    };
  }
  if (url.includes("monaco-editor")) {
    return {
      format: "module",
      shortCircuit: true,
      source: `
        export const languages = {
          CompletionItemKind: {
            Method: 0,
            Function: 1,
            Constructor: 2,
            Field: 3,
            Variable: 4,
            Class: 5,
            Interface: 6,
            Module: 7,
            Property: 8,
            Keyword: 13,
            Snippet: 14,
          },
          CompletionItemInsertTextRule: {
            InsertAsSnippet: 4,
          },
          registerCompletionItemProvider: () => ({ dispose: () => {} }),
          registerHoverProvider: () => ({ dispose: () => {} }),
          registerSignatureHelpProvider: () => ({ dispose: () => {} }),
        };
        export class Range {
          constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
          }
        }
      `,
    };
  }
  return nextLoad(url, context);
}
