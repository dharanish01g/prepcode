import assert from "node:assert/strict";
import test from "node:test";
import { registerCCompletions } from "./c-completions.ts";
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

// ==========================================
// C AUTOCOMPLETE, HOVER & SIGNATURE HELP TESTS
// ==========================================

function cLabels(src: string, col?: number, line?: number): string[] {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCCompletions(mockMonaco);
  const pos =
    line !== undefined && col !== undefined ? { lineNumber: line, column: col } : endOf(src);
  const r = completionProviders["c"].provideCompletionItems(createMockModel(src), pos);
  return r.suggestions.map((s: any) => s.label);
}

function cSig(src: string, col?: number, line?: number): any {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerCCompletions(mockMonaco);
  const pos =
    line !== undefined && col !== undefined ? { lineNumber: line, column: col } : endOf(src);
  return sigHelpProviders["c"].provideSignatureHelp(createMockModel(src), pos);
}

function cHover(src: string, col: number, line = 1): any {
  const { mockMonaco, hoverProviders } = setupMockMonaco();
  registerCCompletions(mockMonaco);
  return hoverProviders["c"].provideHover(createMockModel(src), { lineNumber: line, column: col });
}

test("C: Standard C library functions, constants, types, and keywords are suggested", () => {
  const labels = cLabels("");

  // Functions from <stdio.h>, <stdlib.h>, <string.h>, <math.h>, <ctype.h>
  assert.ok(labels.includes("printf"), "printf is suggested");
  assert.ok(labels.includes("scanf"), "scanf is suggested");
  assert.ok(labels.includes("malloc"), "malloc is suggested");
  assert.ok(labels.includes("free"), "free is suggested");
  assert.ok(labels.includes("strlen"), "strlen is suggested");
  assert.ok(labels.includes("strcmp"), "strcmp is suggested");
  assert.ok(labels.includes("memset"), "memset is suggested");
  assert.ok(labels.includes("memcpy"), "memcpy is suggested");
  assert.ok(labels.includes("qsort"), "qsort is suggested");
  assert.ok(labels.includes("bsearch"), "bsearch is suggested");
  assert.ok(labels.includes("sqrt"), "sqrt is suggested");
  assert.ok(labels.includes("pow"), "pow is suggested");
  assert.ok(labels.includes("isalpha"), "isalpha is suggested");

  // Constants & Macros
  assert.ok(labels.includes("NULL"), "NULL is suggested");
  assert.ok(labels.includes("EOF"), "EOF is suggested");
  assert.ok(labels.includes("INT_MAX"), "INT_MAX is suggested");
  assert.ok(labels.includes("INT_MIN"), "INT_MIN is suggested");
  assert.ok(labels.includes("true"), "true is suggested");
  assert.ok(labels.includes("false"), "false is suggested");

  // Standard Types
  assert.ok(labels.includes("int"), "int is suggested");
  assert.ok(labels.includes("char"), "char is suggested");
  assert.ok(labels.includes("size_t"), "size_t is suggested");
  assert.ok(labels.includes("int32_t"), "int32_t is suggested");
  assert.ok(labels.includes("uint64_t"), "uint64_t is suggested");
  assert.ok(labels.includes("FILE"), "FILE is suggested");

  // Keywords
  assert.ok(labels.includes("struct"), "struct keyword is suggested");
  assert.ok(labels.includes("typedef"), "typedef keyword is suggested");
  assert.ok(labels.includes("return"), "return keyword is suggested");
  assert.ok(labels.includes("while"), "while keyword is suggested");
});

test("C: Preprocessor directive completions for # and #include <...>", () => {
  // Typing # suggests preprocessor directives
  const hashLabels = cLabels("#");
  assert.ok(hashLabels.includes("#include <...>"), "#include <...> is suggested for #");
  assert.ok(hashLabels.includes("#define"), "#define is suggested for #");
  assert.ok(hashLabels.includes("#ifdef"), "#ifdef is suggested for #");
  assert.ok(hashLabels.includes("#ifndef"), "#ifndef is suggested for #");
  assert.ok(hashLabels.includes("#pragma once"), "#pragma once is suggested for #");

  // Typing #include < suggests standard C headers
  const incLabels = cLabels("#include <");
  assert.ok(incLabels.includes("stdio.h"), "stdio.h is suggested inside #include <");
  assert.ok(incLabels.includes("stdlib.h"), "stdlib.h is suggested inside #include <");
  assert.ok(incLabels.includes("string.h"), "string.h is suggested inside #include <");
  assert.ok(incLabels.includes("math.h"), "math.h is suggested inside #include <");
  assert.ok(incLabels.includes("stdbool.h"), "stdbool.h is suggested inside #include <");
  assert.ok(incLabels.includes("stdint.h"), "stdint.h is suggested inside #include <");
  assert.ok(incLabels.includes("limits.h"), "limits.h is suggested inside #include <");
});

test("C: Context-aware snippets avoid duplicate 'int main' and provide loop/struct skeletons", () => {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCCompletions(mockMonaco);
  const provider = completionProviders["c"];

  // 1. Fresh line typing 'main'
  const model1 = createMockModel("main");
  const res1 = provider.provideCompletionItems(model1, { lineNumber: 1, column: 5 });
  const mainSnip1 = res1.suggestions.find((s: any) => s.label === "main");
  assert.ok(mainSnip1, "main snippet found");
  assert.ok(
    mainSnip1.insertText.startsWith("int main("),
    "Fresh main snippet starts with int main",
  );

  // 2. Typing 'int main' -> does NOT duplicate 'int'
  const model2 = createMockModel("int main");
  const res2 = provider.provideCompletionItems(model2, { lineNumber: 1, column: 9 });
  const mainSnip2 = res2.suggestions.find((s: any) => s.label === "main");
  assert.ok(mainSnip2, "main snippet found when preceded by int");
  assert.ok(
    mainSnip2.insertText.startsWith("(int argc,"),
    "Does not duplicate int when typing int main",
  );

  // Snippets
  const labels = cLabels("");
  assert.ok(labels.includes("for"), "for loop snippet is suggested");
  assert.ok(labels.includes("while"), "while snippet is suggested");
  assert.ok(labels.includes("struct"), "struct snippet is suggested");
  assert.ok(labels.includes("typedef struct"), "typedef struct snippet is suggested");
  assert.ok(labels.includes("qsort_cmp"), "qsort_cmp snippet is suggested");
});

test("C: Pointer and struct dereferencing with arrow (->) and dot (.)", () => {
  // ListNode pointer dereferencing with ->
  const headLabels = cLabels("struct ListNode *head;\nhead->");
  assert.ok(headLabels.includes("val"), "head-> suggests val");
  assert.ok(headLabels.includes("next"), "head-> suggests next");
  assert.ok(!headLabels.includes("printf"), "head-> does not suggest printf");
  assert.ok(!headLabels.includes("int"), "head-> does not suggest keyword int");

  // TreeNode pointer dereferencing with ->
  const rootLabels = cLabels("struct TreeNode *root;\nroot->");
  assert.ok(rootLabels.includes("val"), "root-> suggests val");
  assert.ok(rootLabels.includes("left"), "root-> suggests left");
  assert.ok(rootLabels.includes("right"), "root-> suggests right");

  // Point struct value dereferencing with .
  const pointLabels = cLabels("struct Point pt;\npt.");
  assert.ok(pointLabels.includes("x"), "pt. suggests x");
  assert.ok(pointLabels.includes("y"), "pt. suggests y");

  // Pair struct value dereferencing with .
  const pairLabels = cLabels("struct Pair p;\np.");
  assert.ok(pairLabels.includes("first"), "p. suggests first");
  assert.ok(pairLabels.includes("second"), "p. suggests second");
});

test("C: Recursive chained pointer dereferencing (head->next->next->, root->left->right->)", () => {
  // head->next->
  const nextLabels = cLabels("struct ListNode *head;\nhead->next->");
  assert.ok(nextLabels.includes("val"), "head->next-> suggests val");
  assert.ok(nextLabels.includes("next"), "head->next-> suggests next");

  // head->next->next->
  const nextNextLabels = cLabels("struct ListNode *head;\nhead->next->next->");
  assert.ok(nextNextLabels.includes("val"), "head->next->next-> suggests val");
  assert.ok(nextNextLabels.includes("next"), "head->next->next-> suggests next");

  // root->left->right->
  const treeChildLabels = cLabels("struct TreeNode *root;\nroot->left->right->");
  assert.ok(treeChildLabels.includes("val"), "root->left->right-> suggests val");
  assert.ok(treeChildLabels.includes("left"), "root->left->right-> suggests left");
  assert.ok(treeChildLabels.includes("right"), "root->left->right-> suggests right");
});

test("C: User-defined struct member extraction (struct Foo { int x; char y; })", () => {
  const src = `struct Student {
    int id;
    char grade;
    double score;
};

int main() {
    struct Student s;
    s.
}`;
  const sLabels = cLabels(src, 7, 9);
  assert.ok(sLabels.includes("id"), "s. suggests custom struct field id");
  assert.ok(sLabels.includes("grade"), "s. suggests custom struct field grade");
  assert.ok(sLabels.includes("score"), "s. suggests custom struct field score");
  assert.ok(!sLabels.includes("val"), "s. does not suggest unrelated ListNode val");

  // Pointer to user-defined struct
  const ptrSrc = `typedef struct Book {
    int isbn;
    char title[100];
} Book;

int main() {
    Book *b;
    b->
}`;
  const bLabels = cLabels(ptrSrc, 8, 8);
  assert.ok(bLabels.includes("isbn"), "b-> suggests Book field isbn");
  assert.ok(bLabels.includes("title"), "b-> suggests Book field title");
});

test("C: Multi-bracket subscript dereferencing and primitive array suppression", () => {
  // Struct array: struct ListNode nodes[10]; nodes[0]. -> suggests val, next
  const nodeElem = cLabels("struct ListNode nodes[10];\nnodes[0].");
  assert.ok(nodeElem.includes("val"), "nodes[0]. suggests val");
  assert.ok(nodeElem.includes("next"), "nodes[0]. suggests next");

  // Struct pointer array: struct ListNode* ptrs[10]; ptrs[i]-> -> suggests val, next
  const ptrElem = cLabels("struct ListNode* ptrs[10];\nptrs[0]->");
  assert.ok(ptrElem.includes("val"), "ptrs[0]-> suggests val");
  assert.ok(ptrElem.includes("next"), "ptrs[0]-> suggests next");

  // Primitive array: int arr[10]; arr[0]. -> 0 suggestions
  const intElem = cLabels("int arr[10];\narr[0].");
  assert.equal(intElem.length, 0, "int array element dereferencing yields 0 suggestions");

  // 2D primitive array: int matrix[5][5]; matrix[0][0]. -> 0 suggestions
  const matElem = cLabels("int matrix[5][5];\nmatrix[0][0].");
  assert.equal(matElem.length, 0, "2D primitive array element dereferencing yields 0 suggestions");
});

test("C: Primitive dereferencing suppression (int x; x. or 5. returns 0 suggestions)", () => {
  // Primitives cannot be dereferenced in C
  const intLabels = cLabels("int x = 42;\nx.");
  assert.equal(intLabels.length, 0, "int x; x. yields 0 suggestions");

  const charLabels = cLabels("char c = 'A';\nc.");
  assert.equal(charLabels.length, 0, "char c; c. yields 0 suggestions");

  const floatLabels = cLabels("float f = 3.14f;\nf->");
  assert.equal(floatLabels.length, 0, "float f; f-> yields 0 suggestions");

  // Literal number: 5.
  const numLabels = cLabels("5.");
  assert.equal(numLabels.length, 0, "5. yields 0 suggestions");

  // String literal: "test".
  const strLabels = cLabels('"test".');
  assert.equal(strLabels.length, 0, '"test". yields 0 suggestions');
});

test("C: Function scope isolation prevents local variables and parameters from leaking", () => {
  const src = `void funcA(int paramA) {
    int localA = 100;
}

void funcB(int paramB) {
    int localB = 200;
    
}`;
  // Cursor inside funcB (line 7, col 5)
  const bLabels = cLabels(src, 5, 7);

  // funcB should see its own parameter and local variable
  assert.ok(bLabels.includes("paramB"), "funcB sees paramB");
  assert.ok(bLabels.includes("localB"), "funcB sees localB");

  // funcB must NOT see funcA's local variable or parameter!
  assert.ok(!bLabels.includes("paramA"), "paramA must not leak into funcB");
  assert.ok(!bLabels.includes("localA"), "localA must not leak into funcB");
});

test("C: Global variables and user functions are visible across all functions", () => {
  const src = `int globalCounter = 0;

void helper() {
}

void test() {
    
}`;
  // Cursor inside test (line 7, col 5)
  const labels = cLabels(src, 5, 7);

  assert.ok(labels.includes("globalCounter"), "Global variable is visible inside test()");
  assert.ok(labels.includes("helper"), "User-defined function helper() is visible inside test()");
});

test("C: Comment shielding prevents quotes and brackets in comments from breaking parsers", () => {
  const src = `// Comment with quotes "hello" and parens (test)
/* Block comment with { braces } and 'single quotes' */
int validVar = 10;

void test() {
    
}`;
  const labels = cLabels(src, 5, 6);
  assert.ok(labels.includes("validVar"), "validVar is extracted despite comments");

  // Signature help with comments containing parens
  const sigSrc = `void calculate(int x, int y) {}

int main() {
    // Calling calculate(foo)
    calculate(/* arg 1 */ 42, `;
  const sig = cSig(sigSrc);
  assert.ok(sig !== null, "Signature help succeeds with comments");
  assert.equal(sig.value.activeParameter, 1, "Second parameter is active after comma");
});

test("C: Signature help accurately handles standard library, user functions, and nested arguments", () => {
  // Standard library: printf
  const sigPrintf = cSig('printf("%d %s", ');
  assert.ok(sigPrintf !== null, "printf returns signature help");
  assert.equal(sigPrintf.value.activeParameter, 1, "activeParameter is 1 after first comma");
  assert.ok(
    sigPrintf.value.signatures[0].label.includes("printf"),
    "Signature label contains printf",
  );

  // Standard library: malloc
  const sigMalloc = cSig("malloc(");
  assert.ok(sigMalloc !== null, "malloc returns signature help");
  assert.equal(sigMalloc.value.activeParameter, 0, "activeParameter is 0 for malloc(");
  assert.equal(sigMalloc.value.signatures[0].parameters.length, 1, "malloc has 1 parameter");

  // Nested parens and brackets: commas inside nested calls do not increment outer activeParameter
  const sigNested = cSig('printf("%d %d\\n", abs(-5), ');
  assert.ok(sigNested !== null, "Nested call returns signature help");
  assert.equal(
    sigNested.value.activeParameter,
    1,
    "Comma inside abs(-5) was not counted towards printf",
  );

  // Multiline call signature help
  const sigMulti = cSig(`snprintf(
    buffer,
    sizeof(buffer), `);
  assert.ok(sigMulti !== null, "Multiline signature help works");
  assert.equal(
    sigMulti.value.activeParameter,
    2,
    "Multiline activeParameter is 2 after second comma",
  );

  // User-defined function signature help
  const userFuncSrc = `int computeDistance(int x1, int y1, int x2, int y2) {
    return 0;
}

int main() {
    computeDistance(1, 2, `;
  const sigUser = cSig(userFuncSrc);
  assert.ok(sigUser !== null, "User-defined function returns signature help");
  assert.equal(sigUser.value.activeParameter, 2, "activeParameter is 2 for third argument");
  assert.equal(sigUser.value.signatures[0].parameters.length, 4, "Parsed 4 parameters");
});

test("C: No false signature help for C keywords (if, while, for, switch, sizeof, return)", () => {
  for (const call of [
    "if (x > 0, ",
    "while (condition, ",
    "for (int i = 0; ",
    "switch (val, ",
    "sizeof(int, ",
    "return (x, ",
  ]) {
    const sig = cSig(call);
    assert.equal(sig, null, `No signature help for keyword '${call}'`);
  }
});

test("C: Hover provider shows documentation for functions, types, constants, keywords, and structs", () => {
  // Hover over printf
  const hPrintf = cHover("printf", 3, 1);
  assert.ok(hPrintf !== null, "Hover on printf returns documentation");
  assert.ok(hPrintf.contents[0].value.includes("printf"), "Hover contains printf signature");

  // Hover over NULL
  const hNull = cHover("NULL", 2, 1);
  assert.ok(hNull !== null, "Hover on NULL returns documentation");
  assert.ok(hNull.contents[0].value.includes("NULL"), "Hover contains NULL definition");

  // Hover over size_t
  const hSizeT = cHover("size_t", 3, 1);
  assert.ok(hSizeT !== null, "Hover on size_t returns documentation");
  assert.ok(hSizeT.contents[0].value.includes("size_t"), "Hover contains size_t");

  // Hover over typedef keyword
  const hTypedef = cHover("typedef", 3, 1);
  assert.ok(hTypedef !== null, "Hover on typedef returns keyword info");
  assert.ok(hTypedef.contents[0].value.includes("typedef"), "Hover contains typedef");

  // Hover over user-defined function
  const docFuncSrc = `int solveProblem(int n) { return n * 2; }
int main() {
    solveProblem(5);
}`;
  const hDocFunc = cHover(docFuncSrc, 7, 3);
  assert.ok(hDocFunc !== null, "Hover on user function returns documentation");
  assert.ok(hDocFunc.contents[0].value.includes("solveProblem"), "Hover contains solveProblem");
  assert.ok(hDocFunc.contents[1].value.includes("line 1"), "Hover indicates declaration at line 1");
});

test("C: Advanced edge cases (commas in strings, member name hygiene, local variable hover)", () => {
  // 1. Commas inside format strings must NOT increment activeParameter
  const sigStrCommas = cSig('printf("one, two, three, four, %d", ');
  assert.ok(sigStrCommas !== null, "printf with commas inside string returns sig help");
  assert.equal(
    sigStrCommas.value.activeParameter,
    1,
    "Commas inside string literal do not affect argument index",
  );

  // 2. Member name hygiene: node->val and s.grade must NOT be captured as standalone variables
  const hygieneSrc = `void process(struct ListNode *node) {
    node->val = 5;
    node->next = NULL;
}

void other() {
    
}`;
  const otherLabels = cLabels(hygieneSrc, 5, 8);
  assert.ok(
    !otherLabels.includes("val"),
    "Struct member access '->val' is not captured as standalone variable",
  );
  assert.ok(
    !otherLabels.includes("next"),
    "Struct member access '->next' is not captured as standalone variable",
  );

  // 3. Local variable hover
  const localVarSrc = `int main() {
    int totalItems = 42;
    totalItems++;
}`;
  const hVar = cHover(localVarSrc, 7, 3);
  assert.ok(hVar !== null, "Hover on local variable returns documentation");
  assert.ok(hVar.contents[0].value.includes("totalItems"), "Hover shows variable name");
  assert.ok(hVar.contents[0].value.includes("int"), "Hover shows variable type");
});

test("C: Multi-variable initializers, enums, and nested bracket subscript dereferencing", () => {
  // 1. Nested bracket subscript expressions: matrix[row[0]][col[0]]. is primitive int -> 0 suggestions
  const matNested = cLabels("int matrix[5][5];\nmatrix[row[0]][col[0]].");
  assert.equal(matNested.length, 0, "matrix[row[0]][col[0]]. yields 0 suggestions (primitive int)");

  // 2. Multi-variable declarations with initializers
  const multiVars = cLabels("int a = 1, b = 2;\nb.");
  assert.equal(
    multiVars.length,
    0,
    "b. in 'int a = 1, b = 2;' yields 0 suggestions (primitive int)",
  );

  // 3. Initialized pointer declaration: struct ListNode *head = NULL, *cur;
  const initPtrLabels = cLabels("struct ListNode *head = NULL, *cur;\ncur->");
  assert.ok(initPtrLabels.includes("val"), "cur-> suggests val");
  assert.ok(initPtrLabels.includes("next"), "cur-> suggests next");

  // 4. Enumerations: enum Direction { NORTH, SOUTH, EAST, WEST };
  const enumSrc = `enum Direction { NORTH, SOUTH, EAST, WEST };
void test() {
    
}`;
  const enumLabels = cLabels(enumSrc, 5, 3);
  assert.ok(enumLabels.includes("NORTH"), "Enum member NORTH is suggested");
  assert.ok(enumLabels.includes("SOUTH"), "Enum member SOUTH is suggested");

  // 5. Multiple variables on one line extracted as document symbols
  const multiVarsSrc = `void test() {
    int count = 10, total = 100, *ptr = NULL;
    
}`;
  const docVars = cLabels(multiVarsSrc, 5, 3);
  assert.ok(docVars.includes("count"), "count is suggested");
  assert.ok(docVars.includes("total"), "total is suggested");
  assert.ok(docVars.includes("ptr"), "ptr is suggested");
});

test("C: A function taking a struct parameter does not replace the struct's fields", () => {
  const src = `struct Student {
    int id;
    char name[20];
};

void show(struct Student s) {
    int total = 0;
    s.
}`;
  const labels = cLabels(src, 7, 8);
  assert.ok(labels.includes("id"), "s. suggests id");
  assert.ok(labels.includes("name"), "s. suggests name");
  assert.ok(!labels.includes("total"), "the function's local total is not a field");

  // Brace on the line after `struct Name`
  const nextLine = cLabels("struct Box\n{\n    int w;\n};\nstruct Box b;\nb.");
  assert.ok(nextLine.includes("w"), "struct with brace on next line still has its fields");
});

test("C: else-if blocks stay inside the enclosing function's scope", () => {
  const src = `int main(int argc) {
    int count = 0;
    if (argc) {
    }
    else if (count) {
        
    }
}`;
  const labels = cLabels(src, 9, 6);
  assert.ok(labels.includes("count"), "main's local is visible inside else-if");
  assert.ok(labels.includes("argc"), "main's parameter is visible inside else-if");
});

test("C: A variable name is not matched inside a longer word", () => {
  const src = `typedef struct Point2 { int x; int y; } Point2;
Point2 *p;
int tmp = p->`;
  const labels = cLabels(src);
  assert.ok(labels.includes("x"), "p-> suggests x");
  assert.ok(labels.includes("y"), "p-> suggests y");
});

test("C: Member access works mid-expression, through (*p), and through struct fields", () => {
  const structs = `struct Addr { int zip; };
struct Person { int age; struct Addr addr; };
struct Person *pp;
struct Person me;
`;
  assert.ok(cLabels(`${structs}int a = me.`).includes("age"), "after `=`");
  assert.ok(cLabels(`${structs}printf("%d", pp->`).includes("age"), "inside a call");
  assert.ok(cLabels(`${structs}(*pp).`).includes("age"), "(*pp). works like pp->");
  assert.ok(cLabels(`${structs}me.addr.`).includes("zip"), "me.addr. resolves the field type");
  assert.ok(cLabels(`${structs}me.ag`).includes("age"), "partial member name after the dot");
});

test("C: Calls are not recorded as user-defined functions", () => {
  const src = `int fact(int n) {
    if (n < 2) return 1;
    return fact(n - 1);
}
int main() {
    int x = 1;
    printf("%d", x);
    
}`;
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerCCompletions(mockMonaco);
  const res = completionProviders["c"].provideCompletionItems(createMockModel(src), {
    lineNumber: 8,
    column: 5,
  });
  const printfs = res.suggestions.filter((s: any) => s.label === "printf");
  assert.equal(printfs.length, 1, "only the standard printf");
  const facts = res.suggestions.filter((s: any) => s.label === "fact");
  assert.equal(facts.length, 1, "fact appears once");
  assert.equal(facts[0].detail, "int fact(int n)", "detail is the definition");

  // Signature help uses the definition, not a recursive call above the cursor
  const sigSrc = `int fact(int n);
int helper() { return fact(3 - 1); }
int fact(int n) { return n; }
int main() {
    fact(`;
  const sig = cSig(sigSrc);
  assert.equal(sig.value.signatures[0].label, "int fact(int n)");
});

test("C: Text inside multi-line block comments is not parsed as code", () => {
  const src = `/*
 * int helper(int x) returns things
 * struct Node *ghost is the list
 */
void run() {
    
}`;
  const labels = cLabels(src, 5, 6);
  assert.ok(!labels.includes("helper"), "commented helper is not a function");
  assert.ok(!labels.includes("ghost"), "commented ghost is not a variable");
  assert.ok(labels.includes("run"), "real function is still found");
});

test("C: Trigger characters with nothing to complete show no list", () => {
  assert.equal(cLabels("int a = 1;\nif (a >").length, 0, "comparison >");
  assert.equal(cLabels("int a = 1;\nif (a <").length, 0, "comparison <");
  assert.equal(cLabels('printf("').length, 0, "opening a string");
  assert.equal(cLabels("#include <stdio.h>").length, 0, "closing #include <...>");
  assert.ok(cLabels("#include <").includes("stdio.h"), "#include < still lists headers");
});

test("C: No member suggestions inside strings, comments, or after calls", () => {
  assert.equal(cLabels('printf("Done.').length, 0, "dot inside a string");
  assert.equal(cLabels("// see the list.").length, 0, "dot inside a line comment");
  assert.equal(cLabels("/* a\n b.").length, 0, "dot inside a block comment");
  assert.equal(cLabels("int x = foo().").length, 0, "member of a call result");
  assert.ok(cLabels("unknownThing->").includes("val"), "unknown variable keeps the fallback");
});

test("C: Signature help keeps function-pointer parameters whole", () => {
  const q = cSig("int a[3];\nqsort(a, 3, sizeof(int), ");
  const params = q.value.signatures[0].parameters.map((p: any) => p.label);
  assert.equal(params.length, 4, "qsort has 4 parameters");
  assert.ok(params[3].startsWith("int (*compar)("), "comparator parameter is whole");
  assert.equal(q.value.activeParameter, 3);

  const at = cSig("atexit(");
  assert.equal(at.value.signatures[0].parameters.length, 1, "atexit has 1 parameter");
});
