/**
 * LeetCode-style questions: the student writes one method (in a Solution
 * class, or a plain function in C and Go, which have no classes), and
 * prepcode adds a hidden driver that reads an example's values from stdin,
 * calls the method, and prints what it returned after RESULT_MARKER.
 *
 * Values reach the driver one per line: a number, `true`/`false`, or a
 * string's text; an array is its length on one line, then its values (ints
 * space-separated on one line, strings one per line). The driver prints the
 * result as JSON, so it compares with JSON.stringify of the expected value.
 *
 * The driver never changes the student's line numbers, so compile errors
 * point at their code: it goes after their code, or for headers it must come
 * before, on their first line (Java) or reset with a line directive (C, C++, Go).
 */

export type ValueType = "int" | "long" | "bool" | "string" | "int[]" | "string[]";

export const VALUE_TYPES: readonly ValueType[] = [
  "int",
  "long",
  "bool",
  "string",
  "int[]",
  "string[]",
];

export type Param = { name: string; type: ValueType };

/** The method a question asks for. */
export type Signature = { method: string; params: Param[]; returns: ValueType };

/** Printed on its own line before the result, after anything the student printed. */
export const RESULT_MARKER = "<<prepcode-result>>";

/** An example's values as the driver reads them from stdin. */
export function encodeInput(signature: Signature, values: unknown[]) {
  return (
    signature.params
      .flatMap(({ type }, i) => {
        const value = values[i];
        if (type === "int[]")
          return [String((value as number[]).length), (value as number[]).join(" ")];
        if (type === "string[]")
          return [String((value as string[]).length), ...(value as string[])];
        return [String(value)];
      })
      .join("\n") + "\n"
  );
}

/** Splits what a run printed into the student's own output and the method's result. */
export function splitOutput(stdout: string): { printed: string; returned: string | null } {
  const marker = `\n${RESULT_MARKER}\n`;
  const at = stdout.lastIndexOf(marker);
  if (at < 0) return { printed: stdout, returned: null };
  return { printed: stdout.slice(0, at), returned: stdout.slice(at + marker.length).trim() };
}

/** The code a student starts from, for a method in a language. */
export function starterCode(signature: Signature, extension: string): string {
  const language = LANGUAGES[extension];
  return language ? language.starter(signature) : "// Write your code here\n";
}

/** The student's code with the driver added, ready to run. */
export function buildProgram(
  signature: Signature,
  extension: string,
  code: string,
  filename: string,
) {
  const language = LANGUAGES[extension];
  if (!language) throw new Error(`Questions can't be solved in .${extension} yet.`);
  return language.program(signature, code, filename);
}

type LanguageDriver = {
  starter: (signature: Signature) => string;
  program: (signature: Signature, code: string, filename: string) => string;
};

const args = (signature: Signature) => signature.params.map((p) => p.name).join(", ");

// --- Python ---------------------------------------------------------------------------

const PY_TYPES: Record<ValueType, string> = {
  int: "int",
  long: "int",
  bool: "bool",
  string: "str",
  "int[]": "list[int]",
  "string[]": "list[str]",
};

const PY_READ: Record<ValueType, string> = {
  int: "int(_pc_line())",
  long: "int(_pc_line())",
  bool: '_pc_line().strip() == "true"',
  string: "_pc_line()",
  "int[]": "(_pc_line(), [int(x) for x in _pc_line().split()])[1]",
  "string[]": "[_pc_line() for _ in range(int(_pc_line()))]",
};

const python: LanguageDriver = {
  starter: ({ method, params, returns }) => {
    const list = ["self", ...params.map((p) => `${p.name}: ${PY_TYPES[p.type]}`)].join(", ");
    return `class Solution:
    def ${method}(${list}) -> ${PY_TYPES[returns]}:
        # Write your code here
        pass
`;
  },
  program: (signature, code) => String.raw`${code}


import sys as _pc_sys, json as _pc_json

_pc_lines = _pc_sys.stdin.read().split("\n")
_pc_at = 0


def _pc_line():
    global _pc_at
    _pc_at += 1
    return _pc_lines[_pc_at - 1] if _pc_at <= len(_pc_lines) else ""


${signature.params.map((p) => `${p.name} = ${PY_READ[p.type]}`).join("\n")}
_pc_result = Solution().${signature.method}(${args(signature)})
print("\n${RESULT_MARKER}")
print(_pc_json.dumps(_pc_result, ensure_ascii=False, separators=(",", ":")))
`,
};

// --- JavaScript -----------------------------------------------------------------------

const JS_TYPES: Record<ValueType, string> = {
  int: "number",
  long: "number",
  bool: "boolean",
  string: "string",
  "int[]": "number[]",
  "string[]": "string[]",
};

const JS_READ: Record<ValueType, string> = {
  int: "Number(pcLine())",
  long: "Number(pcLine())",
  bool: 'pcLine().trim() === "true"',
  string: "pcLine()",
  "int[]": '(pcLine(), pcLine().split(" ").filter(Boolean).map(Number))',
  "string[]": "Array.from({ length: Number(pcLine()) }, () => pcLine())",
};

const javascript: LanguageDriver = {
  starter: ({ method, params, returns }) => `class Solution {
    /**
${params.map((p) => `     * @param {${JS_TYPES[p.type]}} ${p.name}`).join("\n")}
     * @return {${JS_TYPES[returns]}}
     */
    ${method}(${params.map((p) => p.name).join(", ")}) {
        // Write your code here
    }
}
`,
  program: (signature, code) => String.raw`${code}

{
    const pcLines = require("fs").readFileSync(0, "utf8").split("\n");
    let pcAt = 0;
    const pcLine = () => pcLines[pcAt++] ?? "";
${signature.params.map((p) => `    const ${p.name} = ${JS_READ[p.type]};`).join("\n")}
    const pcResult = new Solution().${signature.method}(${args(signature)});
    process.stdout.write("\n${RESULT_MARKER}\n" + JSON.stringify(pcResult) + "\n");
}
`,
};

// --- Java -----------------------------------------------------------------------------

const JAVA_TYPES: Record<ValueType, string> = {
  int: "int",
  long: "long",
  bool: "boolean",
  string: "String",
  "int[]": "int[]",
  "string[]": "String[]",
};

const javaRead = ({ name, type }: Param) =>
  ({
    int: `int ${name}=Integer.parseInt(pcLine().trim());`,
    long: `long ${name}=Long.parseLong(pcLine().trim());`,
    bool: `boolean ${name}=pcLine().trim().equals("true");`,
    string: `String ${name}=pcLine();`,
    "int[]": `pcLine();int[] ${name}=pcInts(pcLine());`,
    "string[]": `String[] ${name}=new String[Integer.parseInt(pcLine().trim())];for(int i=0;i<${name}.length;i++)${name}[i]=pcLine();`,
  })[type];

const JAVA_IMPORT = /^\s*import\s+[\w.]+(\s*\.\s*\*)?\s*;\s*$/;

const java: LanguageDriver = {
  starter: ({ method, params, returns }) => `class Solution {
    public ${JAVA_TYPES[returns]} ${method}(${params.map((p) => `${JAVA_TYPES[p.type]} ${p.name}`).join(", ")}) {
        // Write your code here

    }
}
`,
  // Java runs the file's first class, so the driver goes first, all on the
  // student's first line. Their imports must come before any class, so they
  // move up there too, leaving blank lines behind.
  program: (signature, code) => {
    const lines = code.split("\n");
    const imports = lines.filter((line) => JAVA_IMPORT.test(line)).map((line) => line.trim());
    const rest = lines.map((line) => (JAVA_IMPORT.test(line) ? "" : line));
    const driver = String.raw`import java.util.*;import java.io.*;${imports.join("")}public class PrepcodeMain{static BufferedReader pcIn=new BufferedReader(new InputStreamReader(System.in));static String pcLine()throws IOException{String s=pcIn.readLine();return s==null?"":s;}static int[] pcInts(String s){s=s.trim();if(s.isEmpty())return new int[0];String[] p=s.split("\\s+");int[] r=new int[p.length];for(int i=0;i<p.length;i++)r[i]=Integer.parseInt(p[i]);return r;}static String pcQ(String s){return s==null?"null":"\""+s.replace("\\","\\\\").replace("\"","\\\"")+"\"";}static String pcF(Object v){if(v==null)return "null";if(v instanceof String s)return pcQ(s);if(v instanceof int[] a){StringBuilder b=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)b.append(',');b.append(a[i]);}return b.append(']').toString();}if(v instanceof String[] a){StringBuilder b=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)b.append(',');b.append(pcQ(a[i]));}return b.append(']').toString();}return String.valueOf(v);}public static void main(String[] args)throws Exception{${signature.params.map(javaRead).join("")}var pcResult=new Solution().${signature.method}(${args(signature)});System.out.print("\n${RESULT_MARKER}\n"+pcF(pcResult)+"\n");System.out.flush();}}`;
    rest[0] = driver + rest[0];
    return rest.join("\n");
  },
};

// --- C# -------------------------------------------------------------------------------

const CS_TYPES: Record<ValueType, string> = {
  int: "int",
  long: "long",
  bool: "bool",
  string: "string",
  "int[]": "int[]",
  "string[]": "string[]",
};

const csRead = ({ name, type }: Param) =>
  ({
    int: `int ${name} = int.Parse(PcLine().Trim());`,
    long: `long ${name} = long.Parse(PcLine().Trim());`,
    bool: `bool ${name} = PcLine().Trim() == "true";`,
    string: `string ${name} = PcLine();`,
    "int[]": `PcLine(); int[] ${name} = System.Array.ConvertAll(PcLine().Split(' ', System.StringSplitOptions.RemoveEmptyEntries), int.Parse);`,
    "string[]": `string[] ${name} = new string[int.Parse(PcLine().Trim())]; for (int i = 0; i < ${name}.Length; i++) ${name}[i] = PcLine();`,
  })[type];

/** C# methods are PascalCase: sum -> Sum. */
const pascal = (name: string) => name[0].toUpperCase() + name.slice(1);

const csharp: LanguageDriver = {
  starter: ({ method, params, returns }) => `public class Solution {
    public ${CS_TYPES[returns]} ${pascal(method)}(${params.map((p) => `${CS_TYPES[p.type]} ${p.name}`).join(", ")}) {
        // Write your code here

    }
}
`,
  program: (signature, code) => String.raw`${code}

#nullable disable
static class PrepcodeMain
{
    static string PcLine() => System.Console.ReadLine() ?? "";
    static string PcQ(string s) => s == null ? "null" : "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
    static string PcF(object v) => v switch
    {
        null => "null",
        string s => PcQ(s),
        bool b => b ? "true" : "false",
        int[] a => "[" + string.Join(",", a) + "]",
        string[] a => "[" + string.Join(",", System.Array.ConvertAll(a, PcQ)) + "]",
        _ => System.Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture),
    };

    static void Main()
    {
${signature.params.map((p) => `        ${csRead(p)}`).join("\n")}
        var pcResult = new Solution().${pascal(signature.method)}(${args(signature)});
        System.Console.Write("\n${RESULT_MARKER}\n" + PcF(pcResult) + "\n");
    }
}
`,
};

// --- C++ ------------------------------------------------------------------------------

const CPP_PARAM_TYPES: Record<ValueType, string> = {
  int: "int",
  long: "long long",
  bool: "bool",
  string: "string",
  "int[]": "vector<int>&",
  "string[]": "vector<string>&",
};

const CPP_RETURN_TYPES: Record<ValueType, string> = {
  ...CPP_PARAM_TYPES,
  "int[]": "vector<int>",
  "string[]": "vector<string>",
};

const cppRead = ({ name, type }: Param) =>
  ({
    int: `int ${name} = std::stoi(pc_line());`,
    long: `long long ${name} = std::stoll(pc_line());`,
    bool: `bool ${name} = pc_line() == "true";`,
    string: `std::string ${name} = pc_line();`,
    "int[]": `pc_line(); std::vector<int> ${name} = pc_ints(pc_line());`,
    "string[]": `std::vector<std::string> ${name}(std::stoi(pc_line())); for (auto& x : ${name}) x = pc_line();`,
  })[type];

const cpp: LanguageDriver = {
  starter: ({ method, params, returns }) => `class Solution {
public:
    ${CPP_RETURN_TYPES[returns]} ${method}(${params.map((p) => `${CPP_PARAM_TYPES[p.type]} ${p.name}`).join(", ")}) {
        // Write your code here

    }
};
`,
  program: (signature, code) => String.raw`#include <algorithm>
#include <climits>
#include <cmath>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
#line 1
${code}

static std::string pc_line() {
    std::string s;
    if (!std::getline(std::cin, s)) return "";
    if (!s.empty() && s.back() == '\r') s.pop_back();
    return s;
}
static std::vector<int> pc_ints(const std::string& s) {
    std::vector<int> r;
    std::istringstream in(s);
    for (int x; in >> x;) r.push_back(x);
    return r;
}
static std::string pc_f(const std::string& s) {
    std::string r = "\"";
    for (char c : s) {
        if (c == '"' || c == '\\') r += '\\';
        r += c;
    }
    return r + "\"";
}
static std::string pc_f(int v) { return std::to_string(v); }
static std::string pc_f(long long v) { return std::to_string(v); }
static std::string pc_f(bool v) { return v ? "true" : "false"; }
template <typename T>
static std::string pc_f(const std::vector<T>& v) {
    std::string r = "[";
    for (size_t i = 0; i < v.size(); i++) r += (i ? "," : "") + pc_f(v[i]);
    return r + "]";
}

int main() {
${signature.params.map((p) => `    ${cppRead(p)}`).join("\n")}
    auto pc_result = Solution().${signature.method}(${args(signature)});
    std::cout << "\n${RESULT_MARKER}\n" << pc_f(pc_result) << "\n";
    return 0;
}
`,
};

// --- C --------------------------------------------------------------------------------

const C_SCALARS: Partial<Record<ValueType, string>> = {
  int: "int",
  long: "long long",
  bool: "bool",
  string: "char*",
};

/** C has no array type with a length: arrays come with a size, like LeetCode's. */
function cParams({ params, returns }: Signature) {
  const list = params.flatMap(({ name, type }) =>
    type === "int[]"
      ? [`int* ${name}`, `int ${name}Size`]
      : type === "string[]"
        ? [`char** ${name}`, `int ${name}Size`]
        : [`${C_SCALARS[type]} ${name}`],
  );
  if (returns === "int[]" || returns === "string[]") list.push("int* returnSize");
  return list.join(", ");
}

function cReturnType(returns: ValueType) {
  return returns === "int[]" ? "int*" : returns === "string[]" ? "char**" : C_SCALARS[returns]!;
}

const cRead = ({ name, type }: Param) =>
  ({
    int: `int ${name} = atoi(pc_line());`,
    long: `long long ${name} = atoll(pc_line());`,
    bool: `bool ${name} = strcmp(pc_line(), "true") == 0;`,
    string: `char* ${name} = pc_line();`,
    "int[]": `int ${name}Size = atoi(pc_line()); int* ${name} = pc_ints(pc_line(), ${name}Size);`,
    "string[]": `int ${name}Size = atoi(pc_line()); char** ${name} = malloc(sizeof(char*) * (${name}Size + 1)); for (int i = 0; i < ${name}Size; i++) ${name}[i] = pc_line();`,
  })[type];

const C_PRINT: Record<ValueType, string> = {
  int: `printf("%d", pc_result);`,
  long: `printf("%lld", pc_result);`,
  bool: `fputs(pc_result ? "true" : "false", stdout);`,
  string: `pc_q(pc_result);`,
  "int[]": `putchar('['); for (int i = 0; i < returnSize; i++) printf(i ? ",%d" : "%d", pc_result[i]); putchar(']');`,
  "string[]": `putchar('['); for (int i = 0; i < returnSize; i++) { if (i) putchar(','); pc_q(pc_result[i]); } putchar(']');`,
};

const c: LanguageDriver = {
  starter: (signature) => {
    const note =
      signature.returns === "int[]" || signature.returns === "string[]"
        ? "    // Return a malloc'd array, and set *returnSize to its length.\n"
        : "";
    return `${cReturnType(signature.returns)} ${signature.method}(${cParams(signature)}) {
${note}    // Write your code here

}
`;
  },
  program: (signature, code) => {
    const callArgs = signature.params.flatMap(({ name, type }) =>
      type === "int[]" || type === "string[]" ? [name, `${name}Size`] : [name],
    );
    const returnsArray = signature.returns === "int[]" || signature.returns === "string[]";
    if (returnsArray) callArgs.push("&returnSize");
    return String.raw`#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#line 1
${code}

static char* pc_line(void) {
    size_t cap = 64, len = 0;
    char* s = malloc(cap);
    int ch;
    while ((ch = getchar()) != EOF && ch != '\n') {
        if (len + 1 >= cap) s = realloc(s, cap *= 2);
        s[len++] = (char)ch;
    }
    if (len && s[len - 1] == '\r') len--;
    s[len] = 0;
    return s;
}
static int* pc_ints(const char* s, int count) {
    int* r = malloc(sizeof(int) * (count + 1));
    char* end;
    for (int i = 0; i < count; i++) {
        r[i] = (int)strtol(s, &end, 10);
        s = end;
    }
    return r;
}
static void pc_q(const char* s) {
    if (!s) {
        fputs("null", stdout);
        return;
    }
    putchar('"');
    for (; *s; s++) {
        if (*s == '"' || *s == '\\') putchar('\\');
        putchar(*s);
    }
    putchar('"');
}

int main(void) {
${signature.params.map((p) => `    ${cRead(p)}`).join("\n")}
${returnsArray ? "    int returnSize = 0;\n" : ""}    ${cReturnType(signature.returns)} pc_result = ${signature.method}(${callArgs.join(", ")});
    printf("\n${RESULT_MARKER}\n");
    ${C_PRINT[signature.returns]}
    printf("\n");
    return 0;
}
`;
  },
};

// --- Go -------------------------------------------------------------------------------

const GO_TYPES: Record<ValueType, string> = {
  int: "int",
  long: "int64",
  bool: "bool",
  string: "string",
  "int[]": "[]int",
  "string[]": "[]string",
};

const goRead = ({ name, type }: Param) =>
  ({
    int: `${name}, _ := pcstrconv.Atoi(pcstrings.TrimSpace(pcLine()))`,
    long: `${name}, _ := pcstrconv.ParseInt(pcstrings.TrimSpace(pcLine()), 10, 64)`,
    bool: `${name} := pcstrings.TrimSpace(pcLine()) == "true"`,
    string: `${name} := pcLine()`,
    "int[]": `pcLine()\n\t${name} := pcInts(pcLine())`,
    "string[]": `${name}Size, _ := pcstrconv.Atoi(pcstrings.TrimSpace(pcLine()))\n\t${name} := make([]string, ${name}Size)\n\tfor i := range ${name} {\n\t\t${name}[i] = pcLine()\n\t}`,
  })[type];

const go: LanguageDriver = {
  starter: ({
    method,
    params,
    returns,
  }) => `func ${method}(${params.map((p) => `${p.name} ${GO_TYPES[p.type]}`).join(", ")}) ${GO_TYPES[returns]} {
	// Write your code here

}
`,
  // The driver's imports have their own names, so the student can import
  // the same packages without a clash.
  program: (signature, code, filename) => String.raw`package main

import (
	pcbufio "bufio"
	pcfmt "fmt"
	pcos "os"
	pcstrconv "strconv"
	pcstrings "strings"
)

//line ${filename}:1
${code}

var pcIn = pcbufio.NewReaderSize(pcos.Stdin, 1<<20)

func pcLine() string {
	s, _ := pcIn.ReadString('\n')
	return pcstrings.TrimRight(s, "\r\n")
}

func pcInts(s string) []int {
	fields := pcstrings.Fields(s)
	r := make([]int, len(fields))
	for i, f := range fields {
		r[i], _ = pcstrconv.Atoi(f)
	}
	return r
}

func pcQ(s string) string {
	return "\"" + pcstrings.ReplaceAll(pcstrings.ReplaceAll(s, "\\", "\\\\"), "\"", "\\\"") + "\""
}

func pcF(v any) string {
	switch x := v.(type) {
	case string:
		return pcQ(x)
	case []int:
		parts := make([]string, len(x))
		for i, n := range x {
			parts[i] = pcstrconv.Itoa(n)
		}
		return "[" + pcstrings.Join(parts, ",") + "]"
	case []string:
		parts := make([]string, len(x))
		for i, s := range x {
			parts[i] = pcQ(s)
		}
		return "[" + pcstrings.Join(parts, ",") + "]"
	default:
		return pcfmt.Sprint(x)
	}
}

func main() {
${signature.params.map((p) => `\t${goRead(p)}`).join("\n")}
	pcResult := ${signature.method}(${args(signature)})
	pcfmt.Print("\n${RESULT_MARKER}\n" + pcF(pcResult) + "\n")
}
`,
};

const LANGUAGES: Record<string, LanguageDriver> = {
  py: python,
  js: javascript,
  java,
  cs: csharp,
  cpp,
  c,
  go,
};
