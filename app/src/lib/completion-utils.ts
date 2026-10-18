import * as monacoDefault from "monaco-editor";

export interface CompletionItemDef {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  snippet?: string;
  detail?: string;
  documentation?: string;
}

/**
 * Deduplicates completion items keyed by label, kind, insertText, and detail.
 * Preserves legitimate overloads while removing identical duplicate items.
 */
export function deduplicateSuggestions(
  items: monacoDefault.languages.CompletionItem[],
): monacoDefault.languages.CompletionItem[] {
  const seen = new Set<string>();
  const unique: monacoDefault.languages.CompletionItem[] = [];
  for (const item of items) {
    const insertKey =
      typeof item.insertText === "string" ? item.insertText : JSON.stringify(item.insertText);
    const key = `${item.label}|${item.kind ?? ""}|${insertKey}|${item.detail ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
}

/**
 * Converts item definitions to Monaco completion items. Items without a kind
 * get `defaultKind` (Method unless the caller says otherwise).
 */
export function toCompletionItems(
  items: CompletionItemDef[],
  range: monacoDefault.IRange,
  defaultKind: monacoDefault.languages.CompletionItemKind = monacoDefault.languages
    .CompletionItemKind.Method,
): monacoDefault.languages.CompletionItem[] {
  return items.map((m) => ({
    label: m.label,
    kind: m.kind ?? defaultKind,
    insertText: m.snippet ?? m.label,
    insertTextRules: m.snippet
      ? monacoDefault.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    detail: m.detail,
    documentation: m.documentation,
    range,
  }));
}
