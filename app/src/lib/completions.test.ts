import assert from "node:assert/strict";
import test from "node:test";
import { registerCSharpCompletions } from "./csharp-completions.ts";
import { registerPythonCompletions } from "./python-completions.ts";

// Helper mock types
interface MockModel {
  lines: string[];
  getLineCount(): number;
  getLineContent(lineNumber: number): string;
  getValue(): string;
  getWordUntilPosition(position: { lineNumber: number; column: number }): {
    word: string;
    startColumn: number;
    endColumn: number;
  };
  getWordAtPosition(position: { lineNumber: number; column: number }): {
    word: string;
    startColumn: number;
    endColumn: number;
  } | null;
  getValueInRange(range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }): string;
}

function createMockModel(content: string): MockModel {
  const lines = content.split("\n");
  return {
    lines,
    getLineCount() {
      return lines.length;
    },
    getLineContent(ln: number) {
      return lines[ln - 1] ?? "";
    },
    getValue() {
      return content;
    },
    getWordUntilPosition(pos: { lineNumber: number; column: number }) {
      const line = lines[pos.lineNumber - 1] ?? "";
      const textBefore = line.slice(0, pos.column - 1);
      const m = textBefore.match(/([a-zA-Z0-9_]+)$/);
      const word = m ? m[1] : "";
      return {
        word,
        startColumn: pos.column - word.length,
        endColumn: pos.column,
      };
    },
    getWordAtPosition(pos: { lineNumber: number; column: number }) {
      const line = lines[pos.lineNumber - 1] ?? "";
      const col = pos.column - 1;
      const wordRegex = /[a-zA-Z0-9_]+/g;
      let m: RegExpExecArray | null;
      while ((m = wordRegex.exec(line)) !== null) {
        if (col >= m.index && col <= m.index + m[0].length) {
          return {
            word: m[0],
            startColumn: m.index + 1,
            endColumn: m.index + m[0].length + 1,
          };
        }
      }
      return null;
    },
    getValueInRange(range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    }) {
      if (range.startLineNumber === range.endLineNumber) {
        const line = lines[range.startLineNumber - 1] ?? "";
        return line.slice(range.startColumn - 1, range.endColumn - 1);
      }
      const parts: string[] = [];
      for (let ln = range.startLineNumber; ln <= range.endLineNumber; ln++) {
        const line = lines[ln - 1] ?? "";
        if (ln === range.startLineNumber) {
          parts.push(line.slice(range.startColumn - 1));
        } else if (ln === range.endLineNumber) {
          parts.push(line.slice(0, range.endColumn - 1));
        } else {
          parts.push(line);
        }
      }
      return parts.join("\n");
    },
  };
}

function setupMockMonaco() {
  const completionProviders: Record<string, any> = {};
  const hoverProviders: Record<string, any> = {};
  const sigHelpProviders: Record<string, any> = {};

  const mockMonaco: any = {
    languages: {
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
      registerCompletionItemProvider(lang: string, provider: any) {
        completionProviders[lang] = provider;
        return { dispose: () => {} };
      },
      registerHoverProvider(lang: string, provider: any) {
        hoverProviders[lang] = provider;
        return { dispose: () => {} };
      },
      registerSignatureHelpProvider(lang: string, provider: any) {
        sigHelpProviders[lang] = provider;
        return { dispose: () => {} };
      },
    },
    Range: class {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      constructor(
        startLineNumber: number,
        startColumn: number,
        endLineNumber: number,
        endColumn: number,
      ) {
        this.startLineNumber = startLineNumber;
        this.startColumn = startColumn;
        this.endLineNumber = endLineNumber;
        this.endColumn = endColumn;
      }
    },
  };

  return { mockMonaco, completionProviders, hoverProviders, sigHelpProviders };
}

// ==========================================
// C# AUTOCOMPLETE & SIGNATURE HELP TESTS
// ==========================================

test("C# Issue 1: using static completion suggests appropriate types, not namespaces", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = completionProviders["csharp"];
  assert.ok(provider, "C# completion provider should be registered");

  // 1a. "using static "
  const model1 = createMockModel("using static ");
  const result1 = provider.provideCompletionItems(model1, { lineNumber: 1, column: 14 });
  assert.ok(result1.suggestions.length > 0);
  const mathItem = result1.suggestions.find((s: any) => s.label === "Math");
  assert.ok(mathItem, "'Math' should be suggested for 'using static '");
  assert.equal(mathItem.kind, mockMonaco.languages.CompletionItemKind.Class);
  // Ensure no namespace-only results (like System.IO) are suggested as Modules
  const ioModule = result1.suggestions.find(
    (s: any) =>
      s.label === "System.IO" && s.kind === mockMonaco.languages.CompletionItemKind.Module,
  );
  assert.equal(ioModule, undefined, "Namespaces should not be suggested for 'using static'");

  // 1b. "using static System.Ma"
  const model2 = createMockModel("using static System.Ma");
  const result2 = provider.provideCompletionItems(model2, { lineNumber: 1, column: 23 });
  const mathInSystem = result2.suggestions.find((s: any) => s.label === "Math");
  assert.ok(mathInSystem, "'Math' must be suggested when typing 'using static System.Ma'");
  assert.equal(mathInSystem.kind, mockMonaco.languages.CompletionItemKind.Class);
});

test("C# Issue 2: Deduplication removes identical duplicate items", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = completionProviders["csharp"];
  const model = createMockModel("using ");
  const result = provider.provideCompletionItems(model, { lineNumber: 1, column: 7 });

  const keys = result.suggestions.map((s: any) => `${s.label}|${s.kind}|${s.detail || ""}`);
  const duplicates = keys.filter((item: string, index: number) => keys.indexOf(item) !== index);
  assert.deepEqual(duplicates, [], "Completion items must not contain identical duplicate items");
});

test("C# Issue 3: using var inside a method is not mistaken for a namespace directive", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = completionProviders["csharp"];

  const code = `class Program
{
    void Run()
    {
        using var reader = new Stream
    }
}`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 5, column: 38 });

  // Must not suggest namespace directives
  const ioDirective = result.suggestions.find((s: any) => s.insertText === "System.IO;");
  assert.equal(ioDirective, undefined, "'using var' must not suggest namespace directives");

  // Normal type suggestions should be available
  assert.ok(result.suggestions.length > 0, "Normal completions should be available");
});

test("C# Issue 4: Identifiers beginning with 'using' are not treated as directives", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = completionProviders["csharp"];

  const code = `class Program
{
    void Run()
    {
        usingCount = 10;
        usingC
    }
}`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 6, column: 15 });

  const hasNamespace = result.suggestions.some(
    (s: any) => s.kind === mockMonaco.languages.CompletionItemKind.Module,
  );
  assert.equal(hasNamespace, false, "usingC must not trigger namespace directive suggestions");
});

test("C# Issue 5: C# signature-help argument parsing handles comparison operators & nested delimiters", () => {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = sigHelpProviders["csharp"];
  assert.ok(provider, "C# signature help provider should be registered");

  // Case A: Comparison operator < inside argument: Console.WriteLine(5 < 10 ? "yes" : "no")
  const model1 = createMockModel('Console.WriteLine(5 < 10 ? "yes" : "no")');
  const sig1 = provider.provideSignatureHelp(model1, { lineNumber: 1, column: 39 });
  assert.ok(sig1, "Signature help should return for Console.WriteLine");
  assert.equal(sig1.value.activeParameter, 0, "Comparison '<' must not corrupt active parameter");

  // Case B: Comparison operator before comma: Console.WriteLine(5 < 10, 20)
  const model2 = createMockModel("Console.WriteLine(5 < 10, 20)");
  const sig2 = provider.provideSignatureHelp(model2, { lineNumber: 1, column: 27 });
  assert.ok(sig2);
  assert.equal(sig2.value.activeParameter, 1, "Active parameter after comma must be 1, not 0");

  // Case B2: SomeMethod(5 < 10, 20)
  const model2b = createMockModel("SomeMethod(5 < 10, 20)");
  const sig2b = provider.provideSignatureHelp(model2b, { lineNumber: 1, column: 20 });
  assert.ok(sig2b);
  assert.equal(
    sig2b.value.activeParameter,
    1,
    "SomeMethod active parameter after comparison must be 1",
  );

  // Case C: Array initializer: Console.WriteLine(new[] { 1, 2 })
  const model3 = createMockModel("Console.WriteLine(new[] { 1, 2 })");
  const sig3 = provider.provideSignatureHelp(model3, { lineNumber: 1, column: 32 });
  assert.ok(sig3);
  assert.equal(
    sig3.value.activeParameter,
    0,
    "Nested commas in array braces must not increment active parameter",
  );

  // Case D: Generic type with dictionary initializer: Math.Max(new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 }, 10)
  const model4 = createMockModel(
    'Math.Max(new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 }, 10)',
  );
  const sig4 = provider.provideSignatureHelp(model4, { lineNumber: 1, column: 66 });
  assert.ok(sig4);
  assert.equal(
    sig4.value.activeParameter,
    1,
    "Generic comma and brace commas must not corrupt argument count",
  );

  // Case D2: SomeMethod(new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 }, 10)
  const model4b = createMockModel(
    'SomeMethod(new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 }, 10)',
  );
  const sig4b = provider.provideSignatureHelp(model4b, { lineNumber: 1, column: 68 });
  assert.ok(sig4b);
  assert.equal(
    sig4b.value.activeParameter,
    1,
    "SomeMethod active parameter with Dictionary must be 1",
  );
});

test("C# Issue 6: Multiline call support in signature help", () => {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = sigHelpProviders["csharp"];

  const code = `Math.Max(
    10,
    20
);`;
  const model = createMockModel(code);
  // Cursor on line 3 after 20
  const sig = provider.provideSignatureHelp(model, { lineNumber: 3, column: 7 });
  assert.ok(sig, "Signature help must find enclosing call across lines");
  assert.equal(sig.value.activeParameter, 1, "Second parameter on multiline call must be active");
});

test("C# Issue 7: Hover matching boundaries prevent false matches against unrelated identifiers", () => {
  const { mockMonaco, hoverProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);

  const provider = hoverProviders["csharp"];
  assert.ok(provider, "Hover provider should be registered");

  // Console.WriteLine
  const m1 = createMockModel('Console.WriteLine("Hello");');
  const h1 = provider.provideHover(m1, { lineNumber: 1, column: 12 });
  assert.ok(h1, "Console.WriteLine hover should match");

  // System.Console.WriteLine
  const m2 = createMockModel('System.Console.WriteLine("Hello");');
  const h2 = provider.provideHover(m2, { lineNumber: 1, column: 19 });
  assert.ok(h2, "System.Console.WriteLine hover should match");

  // System.Math.Abs
  const m3 = createMockModel("System.Math.Abs(-10);");
  const h3 = provider.provideHover(m3, { lineNumber: 1, column: 14 });
  assert.ok(h3, "System.Math.Abs hover should match");

  // System.Convert.ToInt32
  const m4 = createMockModel('System.Convert.ToInt32("123");');
  const h4 = provider.provideHover(m4, { lineNumber: 1, column: 18 });
  assert.ok(h4, "System.Convert.ToInt32 hover should match");

  // MyConsole.WriteLine - must NOT match Console.WriteLine
  const m5 = createMockModel('MyConsole.WriteLine("Hello");');
  const h5 = provider.provideHover(m5, { lineNumber: 1, column: 14 });
  assert.equal(h5, null, "MyConsole.WriteLine must NOT match Console.WriteLine");
});

// ==========================================
// PYTHON AUTOCOMPLETE & SIGNATURE HELP TESTS
// ==========================================

test("Python Issue 8: .split() and .splitlines() infer list, not str", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  // words = "hello world".split()
  // words.
  const code = `words = "hello world".split()
words.`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 2, column: 7 });

  const hasAppend = result.suggestions.some((s: any) => s.label === "append");
  const hasSplit = result.suggestions.some((s: any) => s.label === "split");
  assert.ok(hasAppend, "words. should suggest list methods (e.g. append)");
  assert.equal(hasSplit, false, "words. should not suggest str methods (e.g. split)");

  // words[0].
  const code2 = `words = "hello world".split()
words[0].`;
  const model2 = createMockModel(code2);
  const result2 = provider.provideCompletionItems(model2, { lineNumber: 2, column: 10 });
  const hasLower = result2.suggestions.some((s: any) => s.label === "lower");
  assert.ok(hasLower, "words[0]. should suggest str methods (e.g. lower)");
});

test("Python Issue 9: List element inference does not assume all lists contain strings", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  // String list: words = ["hello", "world"] -> words[0]. -> str
  const code1 = `words = ["hello", "world"]
words[0].`;
  const model1 = createMockModel(code1);
  const res1 = provider.provideCompletionItems(model1, { lineNumber: 2, column: 10 });
  assert.ok(
    res1.suggestions.some((s: any) => s.label === "lower"),
    "String list element should suggest str methods",
  );

  // Number list: numbers = [10, 20, 30] -> numbers[0]. -> NOT str
  const code2 = `numbers = [10, 20, 30]
numbers[0].`;
  const model2 = createMockModel(code2);
  const res2 = provider.provideCompletionItems(model2, { lineNumber: 2, column: 12 });
  assert.equal(
    res2.suggestions.some((s: any) => s.label === "lower"),
    false,
    "Number list element must NOT suggest str methods",
  );
  assert.ok(
    res2.suggestions.some((s: any) => s.label === "__class__"),
    "Number list element should fall back to common instance members",
  );

  // Nested list: matrix = [[1, 2], [3, 4]] -> matrix[0]. -> list
  const code3 = `matrix = [[1, 2], [3, 4]]
matrix[0].`;
  const model3 = createMockModel(code3);
  const res3 = provider.provideCompletionItems(model3, { lineNumber: 2, column: 11 });
  assert.ok(
    res3.suggestions.some((s: any) => s.label === "append"),
    "Nested list element should infer list",
  );
});

test("Python Issue 10: Dictionary value inference supports simple values, nested values, and fallback", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  // student["name"]. -> str
  const code1 = `student = {"name": "Sanvith", "marks": [90, 85], "age": 21}
student["name"].`;
  const model1 = createMockModel(code1);
  const res1 = provider.provideCompletionItems(model1, { lineNumber: 2, column: 17 });
  assert.ok(
    res1.suggestions.some((s: any) => s.label === "lower"),
    "student['name']. should suggest str methods",
  );

  // student["marks"]. -> list
  const code2 = `student = {"name": "Sanvith", "marks": [90, 85], "age": 21}
student["marks"].`;
  const model2 = createMockModel(code2);
  const res2 = provider.provideCompletionItems(model2, { lineNumber: 2, column: 18 });
  assert.ok(
    res2.suggestions.some((s: any) => s.label === "append"),
    "student['marks']. should suggest list methods",
  );

  // student["age"]. -> fallback (number, not str)
  const code3 = `student = {"name": "Sanvith", "marks": [90, 85], "age": 21}
student["age"].`;
  const model3 = createMockModel(code3);
  const res3 = provider.provideCompletionItems(model3, { lineNumber: 2, column: 16 });
  assert.equal(
    res3.suggestions.some((s: any) => s.label === "lower"),
    false,
    "student['age']. must NOT suggest str methods",
  );
  assert.ok(
    res3.suggestions.some((s: any) => s.label === "__class__"),
    "student['age']. should safely fall back to common instance members",
  );
});

test("Python Issue 11: Local variable suggestions do not leak across scopes", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  const code = `def first():
    secret_value = 10

def second():
    sec`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 5, column: 8 });

  const hasSecret = result.suggestions.some((s: any) => s.label === "secret_value");
  assert.equal(hasSecret, false, "secret_value from first() must not be suggested inside second()");

  // Module-level variables should be accessible
  const code2 = `module_var = 123

def second():
    mod`;
  const model2 = createMockModel(code2);
  const result2 = provider.provideCompletionItems(model2, { lineNumber: 4, column: 8 });
  const hasModuleVar = result2.suggestions.some((s: any) => s.label === "module_var");
  assert.ok(hasModuleVar, "module_var should be accessible inside second()");
});

test("Python Issue 12: Symbol extraction is string and comment-aware", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  // Ensure "#" inside a string is not treated as comment:
  const code = `message = "this # is not a comment"
message.`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 2, column: 9 });
  assert.ok(
    result.suggestions.some((s: any) => s.label === "lower"),
    "String containing '#' must be correctly inferred as str",
  );

  // Ensure words inside multiline strings and URLs are not extracted as symbols
  const code2 = `url = "https://example.com"
text = """This is a
multiline string"""
# fake_comment_symbol = 999
`;
  const model2 = createMockModel(code2);
  const result2 = provider.provideCompletionItems(model2, { lineNumber: 5, column: 1 });
  assert.equal(
    result2.suggestions.some((s: any) => s.label === "fake_comment_symbol"),
    false,
    "Comments must not produce variable suggestions",
  );
  assert.equal(
    result2.suggestions.some((s: any) => s.label === "multiline"),
    false,
    "Words in multiline docstrings must not produce variable suggestions",
  );
});

test("Python Issue 13: Signature help correctly counts only top-level arguments with nested commas and multiline", () => {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = sigHelpProviders["python"];
  assert.ok(provider, "Python signature help provider should be registered");

  // print("Hello", "World")
  const m1 = createMockModel('print("Hello", "World")');
  const sig1 = provider.provideSignatureHelp(m1, { lineNumber: 1, column: 17 });
  assert.ok(sig1);
  assert.equal(sig1.value.activeParameter, 0); // *values varargs

  // print([1, 2, 3], {"name": "Sanvith", "marks": 95})
  const m2 = createMockModel('min([1, 2, 3], {"name": "Sanvith", "marks": 95})');
  const sig2 = provider.provideSignatureHelp(m2, { lineNumber: 1, column: 20 });
  assert.ok(sig2);
  assert.equal(
    sig2.value.activeParameter,
    1,
    "Comma inside list [1, 2, 3] must not be counted as top-level arg",
  );

  // print("Hello, World", 123)
  const m3 = createMockModel('min("Hello, World", 123)');
  const sig3 = provider.provideSignatureHelp(m3, { lineNumber: 1, column: 22 });
  assert.ok(sig3);
  assert.equal(
    sig3.value.activeParameter,
    1,
    "Comma inside string quote must not increment argument count",
  );

  // Multiline call
  const m4 = createMockModel(`min(
    1,
    2
)`);
  const sig4 = provider.provideSignatureHelp(m4, { lineNumber: 3, column: 6 });
  assert.ok(sig4);
  assert.equal(sig4.value.activeParameter, 1, "Multiline function arguments must be tracked");
});

test("Python Issue 14: Unknown expressions fall back safely without crashing or returning misleading suggestions", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);

  const provider = completionProviders["python"];

  const code = `foo(bar).`;
  const model = createMockModel(code);
  const result = provider.provideCompletionItems(model, { lineNumber: 1, column: 10 });

  assert.ok(result.suggestions.length > 0, "Unknown expression should return fallback suggestions");
  assert.ok(
    result.suggestions.some((s: any) => s.label === "__class__"),
    "Unknown expression should return common instance members",
  );
  assert.equal(
    result.suggestions.some((s: any) => s.label === "lower"),
    false,
    "Unknown expression should not return string-specific methods",
  );
});
