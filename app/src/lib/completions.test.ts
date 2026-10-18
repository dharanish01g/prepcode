import assert from "node:assert/strict";
import test from "node:test";
import { registerCSharpCompletions } from "./csharp-completions.ts";
import { registerGoCompletions } from "./go-completions.ts";
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
// GO AUTOCOMPLETE, SIGNATURE HELP & HOVER TESTS
// ==========================================

function goLabels(src: string): string[] {
  const { mockMonaco, completionProviders } = setupMockMonaco();
  registerGoCompletions(mockMonaco);
  const r = completionProviders["go"].provideCompletionItems(createMockModel(src), endOf(src));
  return r.suggestions.map((s: any) => s.label);
}

function goSig(src: string): number | null {
  const { mockMonaco, sigHelpProviders } = setupMockMonaco();
  registerGoCompletions(mockMonaco);
  const r = sigHelpProviders["go"].provideSignatureHelp(createMockModel(src), endOf(src));
  return r ? r.value.activeParameter : null;
}

function goHover(src: string, word: string): string | null {
  const { mockMonaco, hoverProviders } = setupMockMonaco();
  registerGoCompletions(mockMonaco);
  const lines = src.split("\n");
  const lastLine = lines[lines.length - 1];
  const col = lastLine.lastIndexOf(word) + 1;
  const r = hoverProviders["go"].provideHover(createMockModel(src), {
    lineNumber: lines.length,
    column: col + 1,
  });
  return r ? r.contents[0].value : null;
}

test("Go Issue 1: Standard library package completions", () => {
  // fmt package
  const fmtItems = goLabels("fmt.");
  assert.ok(fmtItems.includes("Println"), "fmt. should suggest Println");
  assert.ok(fmtItems.includes("Printf"), "fmt. should suggest Printf");
  assert.ok(fmtItems.includes("Sprintf"), "fmt. should suggest Sprintf");
  assert.ok(!fmtItems.includes("Split"), "fmt. should not suggest strings.Split");
  assert.ok(!fmtItems.includes("func"), "fmt. should not suggest keyword func");

  // strings package
  const strItems = goLabels("strings.");
  assert.ok(strItems.includes("Split"), "strings. should suggest Split");
  assert.ok(strItems.includes("Join"), "strings. should suggest Join");
  assert.ok(strItems.includes("Contains"), "strings. should suggest Contains");
  assert.ok(!strItems.includes("Println"), "strings. should not suggest Println");

  // strconv package
  const strconvItems = goLabels("strconv.");
  assert.ok(strconvItems.includes("Atoi"), "strconv. should suggest Atoi");
  assert.ok(strconvItems.includes("Itoa"), "strconv. should suggest Itoa");
  assert.ok(strconvItems.includes("ParseInt"), "strconv. should suggest ParseInt");

  // math package
  const mathItems = goLabels("math.");
  assert.ok(mathItems.includes("Sqrt"), "math. should suggest Sqrt");
  assert.ok(mathItems.includes("Abs"), "math. should suggest Abs");
  assert.ok(mathItems.includes("Max"), "math. should suggest Max");
  assert.ok(mathItems.includes("Pi"), "math. should suggest Pi");

  // slices package
  const slicesItems = goLabels("slices.");
  assert.ok(slicesItems.includes("Sort"), "slices. should suggest Sort");
  assert.ok(slicesItems.includes("Contains"), "slices. should suggest Contains");
  assert.ok(slicesItems.includes("Index"), "slices. should suggest Index");
  assert.ok(slicesItems.includes("Reverse"), "slices. should suggest Reverse");

  // maps package
  const mapsItems = goLabels("maps.");
  assert.ok(mapsItems.includes("Keys"), "maps. should suggest Keys");
  assert.ok(mapsItems.includes("Values"), "maps. should suggest Values");
  assert.ok(mapsItems.includes("Clone"), "maps. should suggest Clone");
});

test("Go Issue 2: Deduplication and clean suggestions", () => {
  const items = goLabels("var x = 1\n");
  const uniqueItems = new Set(items);
  assert.equal(items.length, uniqueItems.size, "Completions must not contain duplicate items");
  assert.ok(items.includes("fmt"), "Top-level suggestions should include package fmt");
  assert.ok(items.includes("append"), "Top-level suggestions should include builtin append");
  assert.ok(items.includes("func"), "Top-level suggestions should include keyword func");
});

test("Go Issue 3: Comment and string masking & suppression", () => {
  // Inside single-line comment
  assert.deepEqual(goLabels("// fmt."), [], "Inside line comment must return no suggestions");
  assert.deepEqual(goLabels("x := 1 // fmt."), [], "After line comment must return no suggestions");

  // Inside block comment
  assert.deepEqual(goLabels("/* fmt."), [], "Inside block comment must return no suggestions");
  assert.deepEqual(
    goLabels("/* multiline\ncomment\nfmt."),
    [],
    "Inside multiline block comment must return no suggestions",
  );

  // Inside interpreted string literal
  assert.deepEqual(
    goLabels('msg := "fmt.'),
    [],
    "Inside interpreted string must return no suggestions",
  );

  // Inside raw multiline string literal
  const rawCode = "raw := `\nmultiline\nfmt.";
  assert.deepEqual(goLabels(rawCode), [], "Inside raw string must return no suggestions");

  // After closed raw string, completions work normally and lines are not desynced
  const afterRaw = "raw := `line1\nline2`\nfmt.";
  const afterItems = goLabels(afterRaw);
  assert.ok(
    afterItems.includes("Println"),
    "After closed raw string, fmt. completions work normally",
  );
});

test("Go Issue 4: Numeric literal & empty dot protection", () => {
  assert.deepEqual(goLabels("100."), [], "Numeric literal 100. must not trigger member completion");
  assert.deepEqual(goLabels("1.0."), [], "Float literal 1.0. must not trigger member completion");
  assert.deepEqual(goLabels("x := 1 + ."), [], "Operator + . must not trigger member completion");
  assert.deepEqual(goLabels("."), [], "Lone . must not trigger member completion");
  assert.deepEqual(
    goLabels("func f() {\n\t."),
    [],
    "Indented lone . must not trigger member completion",
  );
});

test("Go Issue 5: Block scoping isolation", () => {
  const src = `package main

func foo() {
	secretFoo := 42
	_ = secretFoo
}

func bar() {
	sec`;
  const items = goLabels(src);
  assert.ok(!items.includes("secretFoo"), "Variable declared in foo() must not leak into bar()");

  const innerScopeSrc = `package main

func main() {
	outerVar := 10
	if true {
		innerVar := 20
		out`;
  const innerItems = goLabels(innerScopeSrc);
  assert.ok(
    innerItems.includes("outerVar"),
    "Outer variable must be visible inside nested if block",
  );

  const outerAfterBlockSrc = `package main

func main() {
	if true {
		scopedVal := 99
		_ = scopedVal
	}
	scop`;
  const outerAfterItems = goLabels(outerAfterBlockSrc);
  assert.ok(
    !outerAfterItems.includes("scopedVal"),
    "Variable scoped to if block must not leak outside if block",
  );
});

test("Go Issue 6: Type inference & pointer dereferencing", () => {
  // bufio.Scanner inference
  const scannerSrc = `package main
import "bufio"; import "os"
func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.`;
  const scannerItems = goLabels(scannerSrc);
  assert.ok(scannerItems.includes("Scan"), "bufio.Scanner should offer Scan");
  assert.ok(scannerItems.includes("Text"), "bufio.Scanner should offer Text");
  assert.ok(scannerItems.includes("Bytes"), "bufio.Scanner should offer Bytes");
  assert.ok(scannerItems.includes("Err"), "bufio.Scanner should offer Err");

  // sync.WaitGroup inference
  const wgSrc = `package main
import "sync"
func main() {
	var wg sync.WaitGroup
	wg.`;
  const wgItems = goLabels(wgSrc);
  assert.ok(wgItems.includes("Add"), "sync.WaitGroup should offer Add");
  assert.ok(wgItems.includes("Done"), "sync.WaitGroup should offer Done");
  assert.ok(wgItems.includes("Wait"), "sync.WaitGroup should offer Wait");

  // time.Time inference
  const timeSrc = `package main
import "time"
func main() {
	now := time.Now()
	now.`;
  const timeItems = goLabels(timeSrc);
  assert.ok(timeItems.includes("Format"), "time.Time should offer Format");
  assert.ok(timeItems.includes("Unix"), "time.Time should offer Unix");
  assert.ok(timeItems.includes("Year"), "time.Time should offer Year");

  // User defined struct and method
  const structSrc = `package main

type Person struct {
	Name string
	Age  int
}

func (p *Person) Greet() string {
	return "Hello"
}

func main() {
	p := Person{}
	p.`;
  const structItems = goLabels(structSrc);
  assert.ok(structItems.includes("Name"), "Person struct should offer Name field");
  assert.ok(structItems.includes("Age"), "Person struct should offer Age field");
  assert.ok(structItems.includes("Greet"), "Person struct should offer Greet method");

  // Pointer dereferencing
  const ptrSrc = `package main

type Person struct {
	Name string
}

func (p *Person) Greet() string {
	return "Hello"
}

func main() {
	p := &Person{}
	p.`;
  const ptrItems = goLabels(ptrSrc);
  assert.ok(ptrItems.includes("Name"), "Pointer to struct should offer Name field");
  assert.ok(ptrItems.includes("Greet"), "Pointer to struct should offer Greet method");
});

test("Go Issue 7: Signature Help argument tracking and varargs", () => {
  // Builtin append
  assert.equal(goSig("append(mySlice, "), 1, "append(slice, elems) param 1");
  assert.equal(goSig("append(mySlice, 1, 2, 3, "), 1, "append varargs stays on param 1");

  // fmt.Println varargs
  assert.equal(goSig("fmt.Println("), 0, "fmt.Println param 0");
  assert.equal(goSig("fmt.Println(1, 2, 3, "), 0, "fmt.Println varargs stays on param 0");

  // fmt.Printf format string and varargs
  assert.equal(goSig('fmt.Printf("%d %s", '), 1, "fmt.Printf second arg is param 1");
  assert.equal(goSig('fmt.Printf("%d %s", 1, 2, '), 1, "fmt.Printf varargs stays on param 1");

  // strings.Split
  assert.equal(goSig('strings.Split("hello", '), 1, "strings.Split second arg is sep");

  // Nested delimiters & composite literals
  assert.equal(
    goSig("strings.Split(make([]string, 2)[0], "),
    1,
    "Comma inside make([]string, 2) must not count as top-level arg",
  );

  // Multiline call
  const multilineCall = `
fmt.Printf(
	"%s %d",
	"score",
`;
  assert.equal(goSig(multilineCall), 1, "Multiline call argument index should be 1");

  // Control flow keywords must not produce signature help
  assert.equal(goSig("if ("), null, "if ( must not produce signature help");
  assert.equal(goSig("for ("), null, "for ( must not produce signature help");
  assert.equal(goSig("switch ("), null, "switch ( must not produce signature help");

  // User defined function signature help
  const userFnCall = `
func Add(a int, b int) int { return a + b }

func main() {
	Add(1, 
`;
  assert.equal(goSig(userFnCall), 1, "User function Add second parameter should be 1");
});

test("Go Issue 8: Hover matching & boundaries", () => {
  // Package hover
  const pkgHover = goHover("package main\nfmt", "fmt");
  assert.ok(pkgHover?.includes("package fmt"), "fmt hover should display package description");

  // Package member hover
  const memberHover = goHover("package main\nfmt.Println", "Println");
  assert.ok(
    memberHover?.includes("func fmt.Println"),
    "fmt.Println hover should display signature",
  );

  // Boundary check: "format" should not match "fmt"
  const falseHover = goHover("package main\nformat", "format");
  assert.ok(!falseHover?.includes("package fmt"), "word 'format' must not match 'fmt'");

  // Local variable hover
  const varHover = goHover("count := 10\ncount", "count");
  assert.ok(varHover?.includes("var count int"), "Hover on count should infer int");
});

test("Go Issue 9: Advanced Go type inference and multi-return tuples", () => {
  // val, err := strconv.Atoi(...)
  const errSrc = `package main
import "strconv"
func main() {
	val, err := strconv.Atoi("123")
	_ = val
	err.`;
  const errItems = goLabels(errSrc);
  assert.ok(
    errItems.includes("Error"),
    "err from (val, err :=) should infer error interface and suggest Error()",
  );

  // val hover
  const valHover = goHover(
    `package main
import "strconv"
func main() {
	val, err := strconv.Atoi("123")
	val`,
    "val",
  );
  assert.ok(valHover?.includes("var val int"), "val from strconv.Atoi should infer int");

  // val, ok := map lookup
  const okHover = goHover(
    `package main
func main() {
	val, ok := myMap["key"]
	ok`,
    "ok",
  );
  assert.ok(okHover?.includes("var ok bool"), "ok from comma-ok idiom should infer bool");

  // for idx, item := range items
  const forLoopSrc = `package main
func main() {
	words := []string{"hello", "world"}
	for idx, item := range words {
		idx`;
  const idxHover = goHover(forLoopSrc, "idx");
  assert.ok(idxHover?.includes("var idx int"), "loop index in for range should infer int");

  // Multi-var declaration
  const multiVarHover = goHover(
    `package main
func main() {
	var width, height int
	width`,
    "width",
  );
  assert.ok(
    multiVarHover?.includes("var width int"),
    "var width, height int should infer int for width",
  );

  // Signature help with composite literal inside call
  assert.equal(
    goSig('append([]string{"a", "b"}, '),
    1,
    "append([]string{...}, ...) parameter should be 1",
  );
  assert.equal(
    goSig("make(map[string]int, "),
    1,
    "make(map[string]int, ...) parameter should be 1",
  );
});
