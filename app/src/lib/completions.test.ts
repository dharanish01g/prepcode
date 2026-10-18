import assert from "node:assert/strict";
import test from "node:test";
import { registerCSharpCompletions } from "./csharp-completions.ts";
import { registerPythonCompletions } from "./python-completions.ts";
import { registerSqlCompletions } from "./sql-completions.ts";

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
  getPositionAt(offset: number): { lineNumber: number; column: number };
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
    getPositionAt(offset: number) {
      let cur = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1;
        if (cur + lineLen > offset) {
          return { lineNumber: i + 1, column: offset - cur + 1 };
        }
        cur += lineLen;
      }
      return { lineNumber: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
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

  // Case B: Comparison operator before comma: Math.Pow(5 < 10, 20)
  const model2 = createMockModel("Math.Pow(5 < 10, 20)");
  const sig2 = provider.provideSignatureHelp(model2, { lineNumber: 1, column: 18 });
  assert.ok(sig2);
  assert.equal(sig2.value.activeParameter, 1, "Active parameter after comma must be 1, not 0");

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
  // Can't tell what foo returns, so every str, list, dict and set method is offered.
  const labels = result.suggestions.map((s: any) => s.label);
  assert.ok(
    labels.includes("lower") && labels.includes("append"),
    "Unknown expression offers all methods",
  );
  assert.ok(!labels.includes("__class__"), "Unknown expression should not offer only dunders");
});

// ==========================================
// REGRESSION TESTS FOR PR #18 / #22 REVIEW FINDINGS
// ==========================================

function endOf(src: string) {
  const l = src.split("\n");
  return { lineNumber: l.length, column: l[l.length - 1].length + 1 };
}

function pyLabels(src: string): string[] {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);
  const r = completionProviders["python"].provideCompletionItems(createMockModel(src), endOf(src));
  return r.suggestions.map((s: any) => s.label);
}

function pySig(src: string): number | null {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerPythonCompletions(mockMonaco);
  const r = sigHelpProviders["python"].provideSignatureHelp(createMockModel(src), endOf(src));
  return r ? r.value.activeParameter : null;
}

function csSig(src: string): number | null {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);
  const r = sigHelpProviders["csharp"].provideSignatureHelp(createMockModel(src), endOf(src));
  return r ? r.value.activeParameter : null;
}

test("Python Issue 15: variables assigned inside a module-level block stay visible after the block", () => {
  assert.ok(
    pyLabels("for i in range(3):\n    running_total = i\nprint(running_t").includes(
      "running_total",
    ),
  );
  assert.ok(pyLabels("if True:\n    flag_value = 1\nprint(flag_v").includes("flag_value"));
  assert.ok(
    pyLabels('if __name__ == "__main__":\n    result_value = 1\n    result_v').includes(
      "result_value",
    ),
  );
});

test("Python Issue 16: another function's locals and annotations do not leak", () => {
  // Function-local variable must not show up in a different function or at module level
  assert.ok(!pyLabels("def a():\n    only_in_a = 1\n\ndef b():\n    only_").includes("only_in_a"));
  // A blank line after a function is module level, not still inside the function
  assert.ok(!pyLabels("def f():\n    local_only = 1\n\nx = 1\n").includes("local_only"));
  // `items: list` in function a must not make unannotated `items` in function b a list:
  // b's `items` is unknown, so str methods are offered too
  assert.ok(
    pyLabels("def a(items: list):\n    pass\n\ndef b(items):\n    items.").includes("lower"),
  );
  // ...but the enclosing function's own annotation still works
  assert.ok(pyLabels("def a(items: list):\n    items.").includes("append"));
  // Locals of the current function are still suggested
  assert.ok(pyLabels("def f(a):\n    total = 1\n    tot").includes("total"));
});

test("Python Issue 17: for-loop variable over range(len(x.split())) is not a string", () => {
  assert.ok(!pyLabels("for i in range(len(text.split())):\n    i.").includes("upper"));
  assert.ok(pyLabels("for part in line.split(','):\n    part.").includes("upper"));
  assert.ok(pyLabels('for ch in "abc":\n    ch.').includes("upper"));
});

test("Python Issue 18: earlier review fixes keep working", () => {
  // Exact dict key match
  assert.ok(!pyLabels('d = {"username": "x", "name": 5}\nd["name"].').includes("upper"));
  assert.ok(pyLabels('d = {"username": "x", "name": "y"}\nd["username"].').includes("upper"));
  // Malformed key must not throw
  assert.doesNotThrow(() => pyLabels('d = {"a": 1}\nd[x)].'));
  // len(text.strip()) is not a str
  assert.ok(!pyLabels("n = len(text.strip())\nn.").includes("upper"));
  // *args / **kwargs and generic annotations
  const params = pyLabels("def f(*args, **kwargs):\n    ar");
  assert.ok(params.includes("args") && !params.some((l) => l.includes("*")));
  assert.ok(!pyLabels("def g(a: Dict[str, int], b):\n    a").some((l) => l.includes("]")));
  // Apostrophe or paren in an earlier comment must not break signature help
  assert.equal(pySig("# don't forget\nx = range(1, "), 1);
  assert.equal(pySig("# see foo(\nx = range(1, "), 1);
});

test("C# Issue 8: signature help depth is tracked per call", () => {
  assert.equal(csSig("Math.Max(1, "), 1);
  assert.equal(csSig("Math.Max(a < b ? a : b, "), 1);
  assert.equal(csSig("Console.WriteLine(a < b); Math.Max(1, "), 1);
  assert.equal(csSig("Foo(arr[Math.Max(1, "), 1);
  assert.equal(csSig('Math.Max(@"C:\\dir\\", '), 1);
  assert.equal(csSig('Math.Max(@"a""b,c", '), 1);
  assert.equal(csSig("Math.Max(new Foo { A = 1, B = 2 }, "), 1);
});

test("Python Issue 19: a method's typed parameters in a class (the Practice starter)", () => {
  const starter = (param: string) =>
    `class Solution:\n    def solve(self, ${param}) -> int:\n        # Write your code here\n        `;
  const s = pyLabels(starter("s: str") + "s.");
  assert.ok(s.includes("lower") && !s.includes("append"), "s: str gives str methods");
  const nums = pyLabels(starter("nums: list[int]") + "nums.");
  assert.ok(
    nums.includes("append") && !nums.includes("lower"),
    "nums: list[int] gives list methods",
  );
  const n = pyLabels(starter("n: int") + "n.");
  assert.ok(n.includes("__class__") && !n.includes("lower"), "n: int gives no str/list methods");
});

test("Python Issue 20: unknown values offer every method, known numbers don't", () => {
  assert.ok(pyLabels("x = input().").includes("split"), "input() result offers str methods");
  assert.ok(pyLabels("r = solve(1)\nr.").includes("append"), "a function's result offers all");
  const n = pyLabels("count = len(items)\ncount.");
  assert.ok(!n.includes("lower") && !n.includes("append"), "len() result is a number");
  const i = pyLabels("for i in range(10):\n    i.");
  assert.ok(!i.includes("lower"), "a range() loop variable is a number");
});

test("C# Issue 9: no made-up signature for keywords or unknown methods", () => {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerCSharpCompletions(mockMonaco);
  const provider = sigHelpProviders["csharp"];
  for (const line of ["    if (", "    while (x < ", "    for (int i = 0; ", "    Add(1, "]) {
    const src = `class A {\n  void M() {\n${line}`;
    assert.equal(provider.provideSignatureHelp(createMockModel(src), endOf(src)), null, line);
  }
  const wl = provider.provideSignatureHelp(
    createMockModel("Console.WriteLine("),
    endOf("Console.WriteLine("),
  );
  assert.equal(
    wl.value.signatures[0].parameters.length,
    1,
    "WriteLine(object? value) has one parameter",
  );
});

// ==========================================
// SQL AUTOCOMPLETE, HOVER & SIGNATURE HELP TESTS
// ==========================================

function sqlLabels(src: string, lang = "sql"): string[] {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerSqlCompletions(mockMonaco);
  const provider = completionProviders[lang];
  const r = provider.provideCompletionItems(createMockModel(src), endOf(src));
  return r.suggestions.map((s: any) => s.label);
}

function sqlSig(src: string, lang = "sql"): number | null {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerSqlCompletions(mockMonaco);
  const provider = sigHelpProviders[lang];
  const r = provider.provideSignatureHelp(createMockModel(src), endOf(src));
  return r ? r.value.activeParameter : null;
}

function sqlHover(
  src: string,
  pos?: { lineNumber: number; column: number },
  lang = "sql",
): string[] | null {
  const { mockMonaco, hoverProviders } = setupMockMonaco();
  registerSqlCompletions(mockMonaco);
  const provider = hoverProviders[lang];
  const r = provider.provideHover(createMockModel(src), pos ?? endOf(src));
  return r ? r.contents.map((c: any) => c.value) : null;
}

function posOf(src: string, needle: string): { lineNumber: number; column: number } {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(needle);
    if (idx !== -1) {
      return { lineNumber: i + 1, column: idx + 1 + Math.floor(needle.length / 2) };
    }
  }
  return endOf(src);
}

test("SQL Issue 1: dialect registration for sql, mysql, and pgsql", () => {
  const { mockMonaco, completionProviders, hoverProviders, sigHelpProviders } = setupMockMonaco();
  registerSqlCompletions(mockMonaco);

  for (const dialect of ["sql", "mysql", "pgsql"]) {
    assert.ok(completionProviders[dialect], `${dialect} completion provider registered`);
    assert.ok(hoverProviders[dialect], `${dialect} hover provider registered`);
    assert.ok(sigHelpProviders[dialect], `${dialect} signature help provider registered`);
  }
});

test("SQL Issue 2: standard keywords, types, functions, and snippets offered", () => {
  const labels = sqlLabels("SEL");

  // Keywords
  assert.ok(labels.includes("SELECT"), "SELECT keyword suggested");
  assert.ok(labels.includes("WHERE"), "WHERE keyword suggested");
  assert.ok(labels.includes("GROUP BY"), "GROUP BY keyword suggested");
  assert.ok(labels.includes("JOIN"), "JOIN keyword suggested");

  // Types
  assert.ok(labels.includes("INT"), "INT data type suggested");
  assert.ok(labels.includes("VARCHAR"), "VARCHAR data type suggested");
  assert.ok(labels.includes("TIMESTAMP"), "TIMESTAMP data type suggested");

  // Functions
  assert.ok(labels.includes("COUNT"), "COUNT function suggested");
  assert.ok(labels.includes("ROUND"), "ROUND function suggested");
  assert.ok(labels.includes("SUBSTRING"), "SUBSTRING function suggested");
  assert.ok(labels.includes("COALESCE"), "COALESCE function suggested");
  assert.ok(labels.includes("ROW_NUMBER"), "ROW_NUMBER window function suggested");

  // Snippets
  assert.ok(labels.includes("select"), "select snippet suggested");
  assert.ok(labels.includes("join"), "join snippet suggested");
  assert.ok(labels.includes("cte"), "cte snippet suggested");
});

test("SQL Issue 3: table context suggests declared document tables", () => {
  const src = `CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);
SELECT * FROM `;
  const labels = sqlLabels(src);
  assert.ok(labels.includes("employees"), "Declared table suggested after FROM");
  assert.ok(!labels.includes("SELECT"), "Keywords not suggested in table context");
});

test("SQL Issue 4: dot triggers column completions on declared tables", () => {
  const src = `CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(100),
    created_at TIMESTAMP
);
SELECT users.`;
  const labels = sqlLabels(src);
  assert.ok(labels.includes("id"), "id column suggested for users.");
  assert.ok(labels.includes("email"), "email column suggested for users.");
  assert.ok(labels.includes("created_at"), "created_at column suggested for users.");
  assert.ok(!labels.includes("SELECT"), "Global keywords not suggested after dot");
});

test("SQL Issue 5: table-level PRIMARY KEY constraint marks primary key column", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerSqlCompletions(mockMonaco);
  const src = `CREATE TABLE items (
    item_id INT,
    title TEXT,
    PRIMARY KEY (item_id)
);
SELECT items.`;
  const res = completionProviders["sql"].provideCompletionItems(createMockModel(src), endOf(src));
  const idItem = res.suggestions.find((s: any) => s.label === "item_id");
  assert.ok(idItem, "item_id suggested");
  assert.equal(idItem.documentation, "PRIMARY KEY column");
});

test("SQL Issue 6: scoped alias resolution for FROM, JOIN, and comma joins", () => {
  const doc = `CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);
CREATE TABLE marks (
    student_id INT,
    score INT
);
`;

  // Student alias s.
  const sLabels = sqlLabels(
    `${doc}SELECT * FROM students s JOIN marks m ON s.id = m.student_id WHERE s.`,
  );
  assert.ok(sLabels.includes("name"), "s. suggests students.name");
  assert.ok(!sLabels.includes("score"), "s. must not suggest marks.score");

  // Marks alias m.
  const mLabels = sqlLabels(
    `${doc}SELECT * FROM students s JOIN marks m ON s.id = m.student_id WHERE m.`,
  );
  assert.ok(mLabels.includes("score"), "m. suggests marks.score");
  assert.ok(!mLabels.includes("name"), "m. must not suggest students.name");

  // Comma join alias
  const commaLabels = sqlLabels(`${doc}SELECT * FROM students s, marks m WHERE s.`);
  assert.ok(commaLabels.includes("id"), "s. in comma join suggests students.id");
  assert.ok(!commaLabels.includes("score"), "s. in comma join must not suggest marks.score");
});

test("SQL Issue 7: clause keywords are never treated as aliases", () => {
  const doc = `CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);
SELECT * FROM students GROUP BY age;
GROUP.`;
  const labels = sqlLabels(doc);
  assert.equal(labels.length, 0, "GROUP must not be treated as a table alias");

  const orderLabels = sqlLabels(`SELECT * FROM students ORDER BY name;\nORDER.`);
  assert.equal(orderLabels.length, 0, "ORDER must not be treated as a table alias");
});

test("SQL Issue 8: numeric literals and unknown dot targets return no column suggestions", () => {
  assert.deepEqual(sqlLabels("SELECT 10."), [], "Numeric literal 10. must not suggest columns");
  assert.deepEqual(sqlLabels("SELECT 10.5."), [], "Numeric literal 10.5. must not suggest columns");
  assert.deepEqual(
    sqlLabels("SELECT 10 ."),
    [],
    "Numeric literal with space 10 . must not suggest columns",
  );
  assert.deepEqual(
    sqlLabels("SELECT nonexistent."),
    [],
    "Unknown table must return empty suggestions",
  );
});

test("SQL Issue 9: comment and string shielding in autocomplete and hover", () => {
  assert.deepEqual(sqlLabels("-- SELECT "), [], "Single-line comment must return no completions");
  assert.deepEqual(sqlLabels("# SELECT "), [], "MySQL comment must return no completions");
  assert.deepEqual(
    sqlLabels("/* SELECT "),
    [],
    "Unclosed block comment must return no completions",
  );
  assert.deepEqual(sqlLabels("/* \n SELECT "), [], "Multi-line comment must return no completions");
  assert.deepEqual(
    sqlLabels("SELECT 'hello world"),
    [],
    "Unclosed string literal must return no completions",
  );

  // Hover in comment returns null
  assert.equal(sqlHover("-- SELECT COUNT(*)"), null, "Hover inside comment returns null");
  assert.equal(sqlHover("SELECT 'COUNT'"), null, "Hover inside string returns null");
});

test("SQL Issue 10: non-function keywords produce no fake signature help", () => {
  for (const line of [
    "INSERT INTO users VALUES (",
    "SELECT * FROM users WHERE id IN (",
    "SELECT * FROM users WHERE EXISTS (",
    "CREATE TABLE users (",
    "PRIMARY KEY (",
    "CHECK (",
    "SELECT (",
    "WITH cte AS (",
    "-- SUBSTRING('hello', 1, ",
  ]) {
    assert.equal(
      sqlSig(line),
      null,
      `Keyword or comment '${line}' must not produce signature help`,
    );
  }
});

test("SQL Issue 11: signature help argument counting with nested commas, strings, and escaped quotes", () => {
  // First argument
  assert.equal(sqlSig("SUBSTRING('hello', "), 1, "Active parameter after first comma is 1");
  // Second argument
  assert.equal(sqlSig("SUBSTRING('hello', 1, "), 2, "Active parameter after second comma is 2");

  // String with doubled single quote
  assert.equal(
    sqlSig("SUBSTRING('don''t fail', "),
    1,
    "Doubled quotes in string must not corrupt argument count",
  );

  // String with backslash quote
  assert.equal(
    sqlSig("SUBSTRING('don\\'t fail', "),
    1,
    "Backslash-escaped quote must not corrupt argument count",
  );

  // Prior comment with paren and apostrophe
  const complex = `-- Don't forget (foo
/* block comment with parens ( ) and commas , */
SELECT SUBSTRING('abc', `;
  assert.equal(sqlSig(complex), 1, "Prior comments must not corrupt argument count");

  // Nested function call
  assert.equal(sqlSig("ROUND(ABS(-5), "), 1, "Nested function call must pop when closed");
});

test("SQL Issue 12: hover tooltips for tables, functions, types, keywords, and columns", () => {
  const doc = `CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);
SELECT s.name FROM students s;`;

  // Function hover
  const fnH = sqlHover("SELECT COUNT(*)", posOf("SELECT COUNT(*)", "COUNT"));
  assert.ok(fnH && fnH[0].includes("COUNT"), "COUNT function hover contains detail");

  // Type hover
  const typeH = sqlHover("INT", posOf("INT", "INT"));
  assert.ok(typeH && typeH[0].includes("type INT"), "INT hover contains type detail");

  // Keyword hover
  const kwH = sqlHover("SELECT 1", posOf("SELECT 1", "SELECT"));
  assert.ok(kwH && kwH[0].includes("keyword SELECT"), "SELECT hover contains keyword detail");

  // Table hover
  const tblH = sqlHover(doc, posOf(doc, "students s"));
  assert.ok(tblH && tblH[0].includes("CREATE TABLE students"), "students table hover shows schema");

  // Dotted column hover: s.name
  const colH = sqlHover(doc, posOf(doc, "s.name"));
  assert.ok(
    colH && colH[0].includes("students.name: VARCHAR(50)"),
    "s.name hover shows column type",
  );

  // Unknown dotted column hover returns null
  const unkH = sqlHover(doc, posOf("SELECT s.unknown", "unknown"));
  assert.equal(unkH, null, "Unknown column hover returns null");
});

test("SQL Issue 13: multi-dialect parity across mysql and pgsql", () => {
  const doc = `CREATE TABLE users ( id INT, name VARCHAR(50) );\nSELECT u. FROM users u;`;

  const mysqlLabels = sqlLabels(doc, "mysql");
  const pgsqlLabels = sqlLabels(doc, "pgsql");

  assert.ok(mysqlLabels.includes("id") && mysqlLabels.includes("name"), "MySQL suggests columns");
  assert.ok(
    pgsqlLabels.includes("id") && pgsqlLabels.includes("name"),
    "PostgreSQL suggests columns",
  );

  assert.equal(sqlSig("SUBSTRING('hello', ", "mysql"), 1, "MySQL signature help works");
  assert.equal(sqlSig("SUBSTRING('hello', ", "pgsql"), 1, "PostgreSQL signature help works");
});

test("SQL Issue 14: advanced robustness for strings with comment markers, outer joins, and default strings with commas", () => {
  const doc = `CREATE TABLE logs (
    id INT PRIMARY KEY,
    msg VARCHAR(100) DEFAULT 'warning, error -- not a comment',
    created_at TIMESTAMP
);
CREATE TABLE audit (
    audit_id INT,
    action TEXT
);
SELECT * FROM logs l LEFT OUTER JOIN audit a ON l.id = a.audit_id WHERE l.`;

  const labels = sqlLabels(doc);
  assert.ok(labels.includes("id"), "id column suggested");
  assert.ok(labels.includes("msg"), "msg column with comma in default suggested as single column");
  assert.ok(labels.includes("created_at"), "created_at suggested");
  assert.ok(!labels.includes("action"), "LEFT OUTER JOIN alias l. does not leak audit.action");

  // Audit alias
  const auditLabels = sqlLabels(doc.replace("WHERE l.", "WHERE a."));
  assert.ok(auditLabels.includes("action"), "a. suggests audit.action");
  assert.ok(!auditLabels.includes("msg"), "a. does not suggest logs.msg");
});

test("SQL Issue 15: tables and aliases ending with digits are not mistaken for numeric literals", () => {
  const doc = `CREATE TABLE t0 (col0 INT PRIMARY KEY);
CREATE TABLE table1 (val1 VARCHAR(50));
SELECT t0.`;
  const labels0 = sqlLabels(doc);
  assert.ok(labels0.includes("col0"), "t0. suggests col0 despite ending with digit");

  const labels1 = sqlLabels(`${doc}\nSELECT table1.`);
  assert.ok(labels1.includes("val1"), "table1. suggests val1 despite ending with digit");

  // Pure numeric literals still return empty
  assert.deepEqual(sqlLabels("SELECT 10."), [], "Numeric literal 10. returns empty");
  assert.deepEqual(sqlLabels("SELECT 10.5."), [], "Numeric literal 10.5. returns empty");
});

test("SQL Issue 16: double-quoted and backtick-quoted table and column identifiers", () => {
  const doc = `CREATE TABLE "settings" (
    "key" VARCHAR(50) PRIMARY KEY,
    "value" TEXT
);
CREATE TABLE \`devices\` (
    \`dev_id\` INT PRIMARY KEY,
    \`model\` TEXT
);
SELECT settings.`;
  const labels = sqlLabels(doc);
  assert.ok(labels.includes("key"), "Double-quoted column suggested");
  assert.ok(labels.includes("value"), "Double-quoted column suggested");

  const devLabels = sqlLabels(`${doc}\nSELECT \`devices\`.`);
  assert.ok(devLabels.includes("dev_id"), "Backtick-quoted table dot suggests columns");
  assert.ok(devLabels.includes("model"), "Backtick-quoted table dot suggests model");
});

