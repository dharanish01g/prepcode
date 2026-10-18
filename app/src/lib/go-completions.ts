import * as monacoDefault from "monaco-editor";

type Monaco = typeof monacoDefault;

export interface CompletionItemDef {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  snippet?: string;
  detail?: string;
  documentation?: string;
}

// ---------------------------------------------------------------------------
// 1. Standard Library Packages & Exported Members
// ---------------------------------------------------------------------------

export const FMT_MEMBERS: CompletionItemDef[] = [
  {
    label: "Println",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Println(${1:a...})",
    detail: "func fmt.Println(a ...any) (n int, err error)",
    documentation:
      "Println formats using the default formats for its operands and writes to standard output followed by a newline.",
  },
  {
    label: "Printf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Printf("${1:%v}\\n", ${2:args})',
    detail: "func fmt.Printf(format string, a ...any) (n int, err error)",
    documentation: "Printf formats according to a format specifier and writes to standard output.",
  },
  {
    label: "Print",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Print(${1:a...})",
    detail: "func fmt.Print(a ...any) (n int, err error)",
    documentation:
      "Print formats using the default formats for its operands and writes to standard output.",
  },
  {
    label: "Sprintf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Sprintf("${1:%v}", ${2:args})',
    detail: "func fmt.Sprintf(format string, a ...any) string",
    documentation:
      "Sprintf formats according to a format specifier and returns the resulting string.",
  },
  {
    label: "Sprint",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sprint(${1:a...})",
    detail: "func fmt.Sprint(a ...any) string",
    documentation:
      "Sprint formats using the default formats for its operands and returns the resulting string.",
  },
  {
    label: "Sprintln",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sprintln(${1:a...})",
    detail: "func fmt.Sprintln(a ...any) string",
    documentation:
      "Sprintln formats using the default formats for its operands and returns the resulting string followed by a newline.",
  },
  {
    label: "Errorf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Errorf("${1:%w}", ${2:err})',
    detail: "func fmt.Errorf(format string, a ...any) error",
    documentation:
      "Errorf formats according to a format specifier and returns the string as a value that satisfies error.",
  },
  {
    label: "Scan",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Scan(&${1:val})",
    detail: "func fmt.Scan(a ...any) (n int, err error)",
    documentation:
      "Scan scans text read from standard input, storing successive space-separated values into successive arguments.",
  },
  {
    label: "Scanf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Scanf("${1:%s}", &${2:val})',
    detail: "func fmt.Scanf(format string, a ...any) (n int, err error)",
    documentation:
      "Scanf scans text read from standard input, storing successive space-separated values into successive arguments as determined by the format.",
  },
  {
    label: "Scanln",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Scanln(&${1:val})",
    detail: "func fmt.Scanln(a ...any) (n int, err error)",
    documentation:
      "Scanln is similar to Scan, but stops scanning at a newline and after the final item there must be a newline or EOF.",
  },
  {
    label: "Sscan",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sscan(${1:str}, &${2:val})",
    detail: "func fmt.Sscan(str string, a ...any) (n int, err error)",
    documentation: "Sscan scans the argument string, storing values into arguments.",
  },
  {
    label: "Sscanf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Sscanf(${1:str}, "${2:%s}", &${3:val})',
    detail: "func fmt.Sscanf(str string, format string, a ...any) (n int, err error)",
    documentation: "Sscanf scans the argument string according to format.",
  },
  {
    label: "Fprint",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Fprint(${1:w}, ${2:a...})",
    detail: "func fmt.Fprint(w io.Writer, a ...any) (n int, err error)",
    documentation: "Fprint formats using the default formats and writes to w.",
  },
  {
    label: "Fprintf",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Fprintf(${1:w}, "${2:%v}\\n", ${3:args})',
    detail: "func fmt.Fprintf(w io.Writer, format string, a ...any) (n int, err error)",
    documentation: "Fprintf formats according to a format specifier and writes to w.",
  },
  {
    label: "Fprintln",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Fprintln(${1:w}, ${2:a...})",
    detail: "func fmt.Fprintln(w io.Writer, a ...any) (n int, err error)",
    documentation: "Fprintln formats using the default formats and writes to w with a newline.",
  },
];

export const STRINGS_MEMBERS: CompletionItemDef[] = [
  {
    label: "Split",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Split(${1:s}, "${2:sep}")',
    detail: "func strings.Split(s, sep string) []string",
    documentation:
      "Split slices s into all substrings separated by sep and returns a slice of substrings.",
  },
  {
    label: "SplitN",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'SplitN(${1:s}, "${2:sep}", ${3:n})',
    detail: "func strings.SplitN(s, sep string, n int) []string",
    documentation:
      "SplitN slices s into substrings separated by sep and returns a slice of at most n substrings.",
  },
  {
    label: "Join",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Join(${1:elems}, "${2:sep}")',
    detail: "func strings.Join(elems []string, sep string) string",
    documentation:
      "Join concatenates the elements of its first argument to create a single string.",
  },
  {
    label: "Contains",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Contains(${1:s}, "${2:substr}")',
    detail: "func strings.Contains(s, substr string) bool",
    documentation: "Contains reports whether substr is within s.",
  },
  {
    label: "ContainsAny",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'ContainsAny(${1:s}, "${2:chars}")',
    detail: "func strings.ContainsAny(s, chars string) bool",
    documentation: "ContainsAny reports whether any Unicode code points in chars are within s.",
  },
  {
    label: "ContainsRune",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ContainsRune(${1:s}, ${2:r})",
    detail: "func strings.ContainsRune(s string, r rune) bool",
    documentation: "ContainsRune reports whether the Unicode code point r is within s.",
  },
  {
    label: "HasPrefix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'HasPrefix(${1:s}, "${2:prefix}")',
    detail: "func strings.HasPrefix(s, prefix string) bool",
    documentation: "HasPrefix tests whether the string s begins with prefix.",
  },
  {
    label: "HasSuffix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'HasSuffix(${1:s}, "${2:suffix}")',
    detail: "func strings.HasSuffix(s, suffix string) bool",
    documentation: "HasSuffix tests whether the string s ends with suffix.",
  },
  {
    label: "Count",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Count(${1:s}, "${2:substr}")',
    detail: "func strings.Count(s, substr string) int",
    documentation: "Count counts the number of non-overlapping instances of substr in s.",
  },
  {
    label: "Cut",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Cut(${1:s}, "${2:sep}")',
    detail: "func strings.Cut(s, sep string) (before, after string, found bool)",
    documentation:
      "Cut slices s around the first instance of sep, returning the text before and after sep.",
  },
  {
    label: "CutPrefix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'CutPrefix(${1:s}, "${2:prefix}")',
    detail: "func strings.CutPrefix(s, prefix string) (after string, found bool)",
    documentation:
      "CutPrefix returns s without the provided leading prefix string and reports whether it found the prefix.",
  },
  {
    label: "CutSuffix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'CutSuffix(${1:s}, "${2:suffix}")',
    detail: "func strings.CutSuffix(s, suffix string) (before string, found bool)",
    documentation:
      "CutSuffix returns s without the provided ending suffix string and reports whether it found the suffix.",
  },
  {
    label: "Index",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Index(${1:s}, "${2:substr}")',
    detail: "func strings.Index(s, substr string) int",
    documentation:
      "Index returns the index of the first instance of substr in s, or -1 if substr is not present.",
  },
  {
    label: "LastIndex",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'LastIndex(${1:s}, "${2:substr}")',
    detail: "func strings.LastIndex(s, substr string) int",
    documentation:
      "LastIndex returns the index of the last instance of substr in s, or -1 if substr is not present.",
  },
  {
    label: "ToLower",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ToLower(${1:s})",
    detail: "func strings.ToLower(s string) string",
    documentation: "ToLower returns s with all Unicode letters mapped to their lower case.",
  },
  {
    label: "ToUpper",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ToUpper(${1:s})",
    detail: "func strings.ToUpper(s string) string",
    documentation: "ToUpper returns s with all Unicode letters mapped to their upper case.",
  },
  {
    label: "TrimSpace",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "TrimSpace(${1:s})",
    detail: "func strings.TrimSpace(s string) string",
    documentation: "TrimSpace returns all leading and trailing white space removed.",
  },
  {
    label: "Trim",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Trim(${1:s}, "${2:cutset}")',
    detail: "func strings.Trim(s, cutset string) string",
    documentation:
      "Trim returns a slice of the string s with all leading and trailing Unicode code points contained in cutset removed.",
  },
  {
    label: "TrimPrefix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'TrimPrefix(${1:s}, "${2:prefix}")',
    detail: "func strings.TrimPrefix(s, prefix string) string",
    documentation: "TrimPrefix returns s without the provided leading prefix string.",
  },
  {
    label: "TrimSuffix",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'TrimSuffix(${1:s}, "${2:suffix}")',
    detail: "func strings.TrimSuffix(s, suffix string) string",
    documentation: "TrimSuffix returns s without the provided trailing suffix string.",
  },
  {
    label: "Replace",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Replace(${1:s}, "${2:old}", "${3:new}", ${4:n})',
    detail: "func strings.Replace(s, old, new string, n int) string",
    documentation:
      "Replace returns a copy of the string s with the first n non-overlapping instances of old replaced by new.",
  },
  {
    label: "ReplaceAll",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'ReplaceAll(${1:s}, "${2:old}", "${3:new}")',
    detail: "func strings.ReplaceAll(s, old, new string) string",
    documentation:
      "ReplaceAll returns a copy of the string s with all non-overlapping instances of old replaced by new.",
  },
  {
    label: "Repeat",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Repeat(${1:s}, ${2:count})",
    detail: "func strings.Repeat(s string, count int) string",
    documentation: "Repeat returns a new string consisting of count copies of the string s.",
  },
  {
    label: "Fields",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Fields(${1:s})",
    detail: "func strings.Fields(s string) []string",
    documentation:
      "Fields splits the string s around each instance of one or more consecutive white space characters.",
  },
  {
    label: "EqualFold",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "EqualFold(${1:s1}, ${2:s2})",
    detail: "func strings.EqualFold(s, t string) bool",
    documentation: "EqualFold reports whether s and t are equal under simple Unicode case-folding.",
  },
  {
    label: "Builder",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "Builder{}",
    detail: "type strings.Builder struct",
    documentation:
      "A Builder is used to efficiently build a string using Write methods. It minimizes memory copying.",
  },
  {
    label: "NewReader",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewReader(${1:s})",
    detail: "func strings.NewReader(s string) *strings.Reader",
    documentation: "NewReader returns a new Reader reading from s.",
  },
];

export const STRCONV_MEMBERS: CompletionItemDef[] = [
  {
    label: "Atoi",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Atoi(${1:s})",
    detail: "func strconv.Atoi(s string) (int, error)",
    documentation: "Atoi is equivalent to ParseInt(s, 10, 0), converted to type int.",
  },
  {
    label: "Itoa",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Itoa(${1:i})",
    detail: "func strconv.Itoa(i int) string",
    documentation: "Itoa is equivalent to FormatInt(int64(i), 10).",
  },
  {
    label: "ParseInt",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ParseInt(${1:s}, ${2:10}, ${3:64})",
    detail: "func strconv.ParseInt(s string, base int, bitSize int) (i int64, err error)",
    documentation: "ParseInt interprets a string s in the given base (0, 2 to 36) and bit size.",
  },
  {
    label: "ParseUint",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ParseUint(${1:s}, ${2:10}, ${3:64})",
    detail: "func strconv.ParseUint(s string, base int, bitSize int) (n uint64, err error)",
    documentation: "ParseUint is like ParseInt but for unsigned numbers.",
  },
  {
    label: "ParseFloat",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ParseFloat(${1:s}, ${2:64})",
    detail: "func strconv.ParseFloat(s string, bitSize int) (float64, error)",
    documentation:
      "ParseFloat converts the string s to a floating-point number with the specified precision.",
  },
  {
    label: "ParseBool",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ParseBool(${1:str})",
    detail: "func strconv.ParseBool(str string) (bool, error)",
    documentation: "ParseBool returns the boolean value represented by the string.",
  },
  {
    label: "FormatInt",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "FormatInt(${1:i}, ${2:10})",
    detail: "func strconv.FormatInt(i int64, base int) string",
    documentation: "FormatInt returns the string representation of i in the given base.",
  },
  {
    label: "FormatUint",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "FormatUint(${1:i}, ${2:10})",
    detail: "func strconv.FormatUint(i uint64, base int) string",
    documentation: "FormatUint returns the string representation of i in the given base.",
  },
  {
    label: "FormatFloat",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "FormatFloat(${1:f}, '${2:f}', ${3:2}, ${4:64})",
    detail: "func strconv.FormatFloat(f float64, fmt byte, prec, bitSize int) string",
    documentation: "FormatFloat converts the floating-point number f to a string.",
  },
  {
    label: "FormatBool",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "FormatBool(${1:b})",
    detail: "func strconv.FormatBool(b bool) string",
    documentation: 'FormatBool returns "true" or "false" according to the value of b.',
  },
  {
    label: "Quote",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Quote(${1:s})",
    detail: "func strconv.Quote(s string) string",
    documentation: "Quote returns a double-quoted Go string literal representing s.",
  },
  {
    label: "Unquote",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Unquote(${1:s})",
    detail: "func strconv.Unquote(s string) (string, error)",
    documentation:
      "Unquote interprets s as a single-quoted, double-quoted, or backquoted Go string literal.",
  },
];

export const MATH_MEMBERS: CompletionItemDef[] = [
  {
    label: "Abs",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Abs(${1:x})",
    detail: "func math.Abs(x float64) float64",
    documentation: "Abs returns the absolute value of x.",
  },
  {
    label: "Max",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Max(${1:x}, ${2:y})",
    detail: "func math.Max(x, y float64) float64",
    documentation: "Max returns the larger of x or y.",
  },
  {
    label: "Min",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Min(${1:x}, ${2:y})",
    detail: "func math.Min(x, y float64) float64",
    documentation: "Min returns the smaller of x or y.",
  },
  {
    label: "Pow",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Pow(${1:x}, ${2:y})",
    detail: "func math.Pow(x, y float64) float64",
    documentation: "Pow returns x**y, the base-x exponential of y.",
  },
  {
    label: "Sqrt",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sqrt(${1:x})",
    detail: "func math.Sqrt(x float64) float64",
    documentation: "Sqrt returns the square root of x.",
  },
  {
    label: "Floor",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Floor(${1:x})",
    detail: "func math.Floor(x float64) float64",
    documentation: "Floor returns the greatest integer value less than or equal to x.",
  },
  {
    label: "Ceil",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Ceil(${1:x})",
    detail: "func math.Ceil(x float64) float64",
    documentation: "Ceil returns the least integer value greater than or equal to x.",
  },
  {
    label: "Round",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Round(${1:x})",
    detail: "func math.Round(x float64) float64",
    documentation: "Round returns the nearest integer, rounding half away from zero.",
  },
  {
    label: "Mod",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Mod(${1:x}, ${2:y})",
    detail: "func math.Mod(x, y float64) float64",
    documentation: "Mod returns the floating-point remainder of x/y.",
  },
  {
    label: "Sin",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sin(${1:x})",
    detail: "func math.Sin(x float64) float64",
    documentation: "Sin returns the sine of the radian argument x.",
  },
  {
    label: "Cos",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Cos(${1:x})",
    detail: "func math.Cos(x float64) float64",
    documentation: "Cos returns the cosine of the radian argument x.",
  },
  {
    label: "Tan",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Tan(${1:x})",
    detail: "func math.Tan(x float64) float64",
    documentation: "Tan returns the tangent of the radian argument x.",
  },
  {
    label: "Log",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Log(${1:x})",
    detail: "func math.Log(x float64) float64",
    documentation: "Log returns the natural logarithm of x.",
  },
  {
    label: "Log10",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Log10(${1:x})",
    detail: "func math.Log10(x float64) float64",
    documentation: "Log10 returns the 10-based logarithm of x.",
  },
  {
    label: "Log2",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Log2(${1:x})",
    detail: "func math.Log2(x float64) float64",
    documentation: "Log2 returns the binary logarithm of x.",
  },
  {
    label: "Exp",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Exp(${1:x})",
    detail: "func math.Exp(x float64) float64",
    documentation: "Exp returns e**x, the base-e exponential of x.",
  },
  {
    label: "Pi",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "Pi",
    detail: "const math.Pi = 3.14159265358979323846264338327950288419716939937510582097494459",
    documentation: "Mathematical constant Pi.",
  },
  {
    label: "E",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "E",
    detail: "const math.E = 2.71828182845904523536028747135266249775724709369995957496696763",
    documentation: "Mathematical constant E (Euler's number).",
  },
  {
    label: "MaxInt",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "MaxInt",
    detail: "const math.MaxInt",
    documentation: "Maximum value of a signed int.",
  },
  {
    label: "MinInt",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "MinInt",
    detail: "const math.MinInt",
    documentation: "Minimum value of a signed int.",
  },
  {
    label: "MaxInt64",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "MaxInt64",
    detail: "const math.MaxInt64 = 1<<63 - 1",
    documentation: "Maximum value of a signed 64-bit int.",
  },
  {
    label: "MinInt64",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "MinInt64",
    detail: "const math.MinInt64 = -1 << 63",
    documentation: "Minimum value of a signed 64-bit int.",
  },
  {
    label: "MaxFloat64",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "MaxFloat64",
    detail: "const math.MaxFloat64 = 1.797693134862315708145274237317043567981e+308",
    documentation: "Largest positive finite value representable by a float64.",
  },
];

export const SLICES_MEMBERS: CompletionItemDef[] = [
  {
    label: "Sort",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sort(${1:s})",
    detail: "func slices.Sort[S ~[]E, E cmp.Ordered](x S)",
    documentation: "Sort sorts a slice of any ordered type in ascending order.",
  },
  {
    label: "SortFunc",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "SortFunc(${1:s}, ${2:cmp})",
    detail: "func slices.SortFunc[S ~[]E, E any](x S, cmp func(a, b E) int)",
    documentation:
      "SortFunc sorts the slice x in ascending order as determined by the cmp function.",
  },
  {
    label: "IsSorted",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "IsSorted(${1:s})",
    detail: "func slices.IsSorted[S ~[]E, E cmp.Ordered](x S) bool",
    documentation: "IsSorted reports whether x is sorted in ascending order.",
  },
  {
    label: "Contains",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Contains(${1:s}, ${2:v})",
    detail: "func slices.Contains[S ~[]E, E comparable](s S, v E) bool",
    documentation: "Contains reports whether v is present in s.",
  },
  {
    label: "Index",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Index(${1:s}, ${2:v})",
    detail: "func slices.Index[S ~[]E, E comparable](s S, v E) int",
    documentation:
      "Index returns the index of the first occurrence of v in s, or -1 if not present.",
  },
  {
    label: "Reverse",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Reverse(${1:s})",
    detail: "func slices.Reverse[S ~[]E, E any](s S)",
    documentation: "Reverse reverses the elements of the slice in place.",
  },
  {
    label: "Clone",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Clone(${1:s})",
    detail: "func slices.Clone[S ~[]E, E any](s S) S",
    documentation: "Clone returns a copy of the slice.",
  },
  {
    label: "Compact",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Compact(${1:s})",
    detail: "func slices.Compact[S ~[]E, E comparable](s S) S",
    documentation:
      "Compact replaces consecutive runs of equal elements with a single copy (like uniq).",
  },
  {
    label: "Min",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Min(${1:s})",
    detail: "func slices.Min[S ~[]E, E cmp.Ordered](x S) E",
    documentation: "Min returns the minimal value in x. Panics if x is empty.",
  },
  {
    label: "Max",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Max(${1:s})",
    detail: "func slices.Max[S ~[]E, E cmp.Ordered](x S) E",
    documentation: "Max returns the maximal value in x. Panics if x is empty.",
  },
  {
    label: "BinarySearch",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "BinarySearch(${1:s}, ${2:target})",
    detail: "func slices.BinarySearch[S ~[]E, E cmp.Ordered](x S, target E) (int, bool)",
    documentation: "BinarySearch searches for target in a sorted slice.",
  },
  {
    label: "Equal",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Equal(${1:s1}, ${2:s2})",
    detail: "func slices.Equal[S ~[]E, E comparable](s1, s2 S) bool",
    documentation:
      "Equal reports whether two slices are equal: the same length and all elements equal.",
  },
  {
    label: "Delete",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Delete(${1:s}, ${2:i}, ${3:j})",
    detail: "func slices.Delete[S ~[]E, E any](s S, i, j int) S",
    documentation: "Delete removes the elements s[i:j] from s, returning the modified slice.",
  },
  {
    label: "Insert",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Insert(${1:s}, ${2:i}, ${3:values...})",
    detail: "func slices.Insert[S ~[]E, E any](s S, i int, v ...E) S",
    documentation: "Insert inserts the values v into s at index i, returning the modified slice.",
  },
];

export const MAPS_MEMBERS: CompletionItemDef[] = [
  {
    label: "Keys",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Keys(${1:m})",
    detail: "func maps.Keys[M ~map[K]V, K comparable, V any](m M) []K",
    documentation:
      "Keys returns the keys of the map m. The keys will be in an indeterminate order.",
  },
  {
    label: "Values",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Values(${1:m})",
    detail: "func maps.Values[M ~map[K]V, K comparable, V any](m M) []V",
    documentation:
      "Values returns the values of the map m. The values will be in an indeterminate order.",
  },
  {
    label: "Clone",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Clone(${1:m})",
    detail: "func maps.Clone[M ~map[K]V, K comparable, V any](m M) M",
    documentation: "Clone returns a shallow copy of m.",
  },
  {
    label: "Copy",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Copy(${1:dst}, ${2:src})",
    detail: "func maps.Copy[M1 ~map[K]V, M2 ~map[K]V, K comparable, V any](dst M1, src M2)",
    documentation: "Copy copies all key/value pairs in src to dst.",
  },
  {
    label: "DeleteFunc",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "DeleteFunc(${1:m}, ${2:del})",
    detail: "func maps.DeleteFunc[M ~map[K]V, K comparable, V any](m M, del func(K, V) bool)",
    documentation: "DeleteFunc deletes any key/value pairs from m for which del returns true.",
  },
  {
    label: "Equal",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Equal(${1:m1}, ${2:m2})",
    detail: "func maps.Equal[M1, M2 ~map[K]V, K, V comparable](m1 M1, m2 M2) bool",
    documentation: "Equal reports whether two maps contain the same key/value pairs.",
  },
];

export const SORT_MEMBERS: CompletionItemDef[] = [
  {
    label: "Ints",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Ints(${1:x})",
    detail: "func sort.Ints(x []int)",
    documentation: "Ints sorts a slice of ints in increasing order.",
  },
  {
    label: "Float64s",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Float64s(${1:x})",
    detail: "func sort.Float64s(x []float64)",
    documentation: "Float64s sorts a slice of float64s in increasing order.",
  },
  {
    label: "Strings",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Strings(${1:x})",
    detail: "func sort.Strings(x []string)",
    documentation: "Strings sorts a slice of strings in increasing order.",
  },
  {
    label: "Slice",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Slice(${1:x}, func(i, j int) bool {\n\treturn ${2:x[i] < x[j]}\n})",
    detail: "func sort.Slice(x any, less func(i, j int) bool)",
    documentation: "Slice sorts the slice x given the provided less function.",
  },
  {
    label: "SliceStable",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "SliceStable(${1:x}, func(i, j int) bool {\n\treturn ${2:x[i] < x[j]}\n})",
    detail: "func sort.SliceStable(x any, less func(i, j int) bool)",
    documentation:
      "SliceStable sorts the slice x using the provided less function, keeping original order of equal elements.",
  },
  {
    label: "SearchInts",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "SearchInts(${1:a}, ${2:x})",
    detail: "func sort.SearchInts(a []int, x int) int",
    documentation:
      "SearchInts searches for x in a sorted slice of ints and returns the index as specified by Search.",
  },
  {
    label: "SearchStrings",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "SearchStrings(${1:a}, ${2:x})",
    detail: "func sort.SearchStrings(a []string, x string) int",
    documentation:
      "SearchStrings searches for x in a sorted slice of strings and returns the index as specified by Search.",
  },
];

export const OS_MEMBERS: CompletionItemDef[] = [
  {
    label: "Args",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "Args",
    detail: "var os.Args []string",
    documentation: "Args hold the command-line arguments, starting with the program name.",
  },
  {
    label: "Exit",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Exit(${1:0})",
    detail: "func os.Exit(code int)",
    documentation: "Exit causes the current program to exit with the given status code.",
  },
  {
    label: "ReadFile",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'ReadFile("${1:filename}")',
    detail: "func os.ReadFile(name string) ([]byte, error)",
    documentation: "ReadFile reads the named file and returns the contents.",
  },
  {
    label: "WriteFile",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'WriteFile("${1:filename}", ${2:data}, ${3:0644})',
    detail: "func os.WriteFile(name string, data []byte, perm FileMode) error",
    documentation: "WriteFile writes data to the named file, creating it if necessary.",
  },
  {
    label: "Open",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Open("${1:name}")',
    detail: "func os.Open(name string) (*os.File, error)",
    documentation: "Open opens the named file for reading.",
  },
  {
    label: "Create",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Create("${1:name}")',
    detail: "func os.Create(name string) (*os.File, error)",
    documentation: "Create creates or truncates the named file.",
  },
  {
    label: "Remove",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Remove("${1:name}")',
    detail: "func os.Remove(name string) error",
    documentation: "Remove removes the named file or empty directory.",
  },
  {
    label: "RemoveAll",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'RemoveAll("${1:path}")',
    detail: "func os.RemoveAll(path string) error",
    documentation: "RemoveAll removes path and any children it contains.",
  },
  {
    label: "Stat",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Stat("${1:name}")',
    detail: "func os.Stat(name string) (os.FileInfo, error)",
    documentation: "Stat returns a FileInfo describing the named file.",
  },
  {
    label: "Getenv",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Getenv("${1:key}")',
    detail: "func os.Getenv(key string) string",
    documentation: "Getenv retrieves the value of the environment variable named by the key.",
  },
  {
    label: "Setenv",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Setenv("${1:key}", "${2:value}")',
    detail: "func os.Setenv(key, value string) error",
    documentation: "Setenv sets the value of the environment variable named by the key.",
  },
  {
    label: "Stdin",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "Stdin",
    detail: "var os.Stdin *os.File",
    documentation: "Stdin points to the standard input file descriptor.",
  },
  {
    label: "Stdout",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "Stdout",
    detail: "var os.Stdout *os.File",
    documentation: "Stdout points to the standard output file descriptor.",
  },
  {
    label: "Stderr",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "Stderr",
    detail: "var os.Stderr *os.File",
    documentation: "Stderr points to the standard error file descriptor.",
  },
  {
    label: "IsNotExist",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "IsNotExist(${1:err})",
    detail: "func os.IsNotExist(err error) bool",
    documentation:
      "IsNotExist returns a boolean indicating whether the error is known to report that a file does not exist.",
  },
];

export const IO_MEMBERS: CompletionItemDef[] = [
  {
    label: "ReadAll",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ReadAll(${1:r})",
    detail: "func io.ReadAll(r io.Reader) ([]byte, error)",
    documentation: "ReadAll reads from r until an error or EOF and returns the data it read.",
  },
  {
    label: "Copy",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Copy(${1:dst}, ${2:src})",
    detail: "func io.Copy(dst io.Writer, src io.Reader) (written int64, err error)",
    documentation:
      "Copy copies from src to dst until either EOF is reached on src or an error occurs.",
  },
  {
    label: "WriteString",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "WriteString(${1:w}, ${2:s})",
    detail: "func io.WriteString(w io.Writer, s string) (n int, err error)",
    documentation: "WriteString writes the contents of the string s to w.",
  },
  {
    label: "EOF",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "EOF",
    detail: 'var io.EOF = errors.New("EOF")',
    documentation: "EOF is the error returned by Read when no more input is available.",
  },
  {
    label: "Discard",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    snippet: "Discard",
    detail: "var io.Discard io.Writer",
    documentation: "Discard is a Writer on which all Write calls succeed without doing anything.",
  },
];

export const BUFIO_MEMBERS: CompletionItemDef[] = [
  {
    label: "NewScanner",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewScanner(${1:r})",
    detail: "func bufio.NewScanner(r io.Reader) *bufio.Scanner",
    documentation: "NewScanner returns a new Scanner to read from r.",
  },
  {
    label: "NewReader",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewReader(${1:r})",
    detail: "func bufio.NewReader(r io.Reader) *bufio.Reader",
    documentation: "NewReader returns a new Reader whose buffer has the default size.",
  },
  {
    label: "NewWriter",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewWriter(${1:w})",
    detail: "func bufio.NewWriter(w io.Writer) *bufio.Writer",
    documentation: "NewWriter returns a new Writer whose buffer has the default size.",
  },
  {
    label: "Scanner",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "Scanner",
    detail: "type bufio.Scanner struct",
    documentation:
      "Scanner provides a convenient interface for reading data such as a file of newline-delimited lines.",
  },
];

export const TIME_MEMBERS: CompletionItemDef[] = [
  {
    label: "Now",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Now()",
    detail: "func time.Now() time.Time",
    documentation: "Now returns the current local time.",
  },
  {
    label: "Sleep",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Sleep(${1:d})",
    detail: "func time.Sleep(d time.Duration)",
    documentation: "Sleep pauses the current goroutine for at least the duration d.",
  },
  {
    label: "Since",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Since(${1:t})",
    detail: "func time.Since(t time.Time) time.Duration",
    documentation: "Since returns the time elapsed since t.",
  },
  {
    label: "Until",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Until(${1:t})",
    detail: "func time.Until(t time.Time) time.Duration",
    documentation: "Until returns the duration until t.",
  },
  {
    label: "Second",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "Second",
    detail: "const time.Second time.Duration = 1000 * time.Millisecond",
    documentation: "Common duration representing one second.",
  },
  {
    label: "Millisecond",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "Millisecond",
    detail: "const time.Millisecond time.Duration = 1000 * time.Microsecond",
    documentation: "Common duration representing one millisecond.",
  },
  {
    label: "Minute",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "Minute",
    detail: "const time.Minute time.Duration = 60 * time.Second",
    documentation: "Common duration representing one minute.",
  },
  {
    label: "Hour",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "Hour",
    detail: "const time.Hour time.Duration = 60 * time.Minute",
    documentation: "Common duration representing one hour.",
  },
  {
    label: "Parse",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Parse("${1:layout}", "${2:value}")',
    detail: "func time.Parse(layout, value string) (time.Time, error)",
    documentation: "Parse parses a formatted string and returns the time value it represents.",
  },
  {
    label: "Date",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet:
      "Date(${1:year}, ${2:month}, ${3:day}, ${4:hour}, ${5:min}, ${6:sec}, ${7:nsec}, ${8:loc})",
    detail:
      "func time.Date(year int, month Month, day, hour, min, sec, nsec int, loc *Location) time.Time",
    documentation: "Date returns the Time corresponding to y-m-d h:m:s.n in the appropriate zone.",
  },
];

export const SYNC_MEMBERS: CompletionItemDef[] = [
  {
    label: "WaitGroup",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "WaitGroup{}",
    detail: "type sync.WaitGroup struct",
    documentation: "A WaitGroup waits for a collection of goroutines to finish.",
  },
  {
    label: "Mutex",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "Mutex{}",
    detail: "type sync.Mutex struct",
    documentation:
      "A Mutex is a mutual exclusion lock. The zero value for a Mutex is an unlocked mutex.",
  },
  {
    label: "RWMutex",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "RWMutex{}",
    detail: "type sync.RWMutex struct",
    documentation: "An RWMutex is a reader/writer mutual exclusion lock.",
  },
  {
    label: "Once",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "Once{}",
    detail: "type sync.Once struct",
    documentation: "Once is an object that will perform exactly one action.",
  },
  {
    label: "Map",
    kind: monacoDefault.languages.CompletionItemKind.Struct,
    snippet: "Map{}",
    detail: "type sync.Map struct",
    documentation:
      "Map is like a Go map[any]any but is safe for concurrent use by multiple goroutines.",
  },
];

export const JSON_MEMBERS: CompletionItemDef[] = [
  {
    label: "Marshal",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Marshal(${1:v})",
    detail: "func json.Marshal(v any) ([]byte, error)",
    documentation: "Marshal returns the JSON encoding of v.",
  },
  {
    label: "MarshalIndent",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'MarshalIndent(${1:v}, "", "  ")',
    detail: "func json.MarshalIndent(v any, prefix, indent string) ([]byte, error)",
    documentation: "MarshalIndent is like Marshal but applies Indent to format the output.",
  },
  {
    label: "Unmarshal",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Unmarshal(${1:data}, &${2:v})",
    detail: "func json.Unmarshal(data []byte, v any) error",
    documentation:
      "Unmarshal parses the JSON-encoded data and stores the result in the value pointed to by v.",
  },
  {
    label: "NewDecoder",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewDecoder(${1:r})",
    detail: "func json.NewDecoder(r io.Reader) *json.Decoder",
    documentation: "NewDecoder returns a new decoder that reads from r.",
  },
  {
    label: "NewEncoder",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "NewEncoder(${1:w})",
    detail: "func json.NewEncoder(w io.Writer) *json.Encoder",
    documentation: "NewEncoder returns a new encoder that writes to w.",
  },
  {
    label: "Valid",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "Valid(${1:data})",
    detail: "func json.Valid(data []byte) bool",
    documentation: "Valid reports whether data is a valid JSON encoding.",
  },
];

export const HTTP_MEMBERS: CompletionItemDef[] = [
  {
    label: "Get",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Get("${1:url}")',
    detail: "func http.Get(url string) (resp *http.Response, err error)",
    documentation: "Get issues a GET to the specified URL.",
  },
  {
    label: "Post",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'Post("${1:url}", "${2:contentType}", ${3:body})',
    detail:
      "func http.Post(url, contentType string, body io.Reader) (resp *http.Response, err error)",
    documentation: "Post issues a POST to the specified URL.",
  },
  {
    label: "ListenAndServe",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'ListenAndServe("${1::8080}", ${2:nil})',
    detail: "func http.ListenAndServe(addr string, handler http.Handler) error",
    documentation:
      "ListenAndServe listens on the TCP network address addr and handles requests on incoming connections.",
  },
  {
    label: "HandleFunc",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'HandleFunc("${1:/}", func(w http.ResponseWriter, r *http.Request) {\n\t${2}\n})',
    detail:
      "func http.HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))",
    documentation:
      "HandleFunc registers the handler function for the given pattern in the DefaultServeMux.",
  },
  {
    label: "StatusOK",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "StatusOK",
    detail: "const http.StatusOK = 200",
    documentation: "HTTP status code 200 OK.",
  },
  {
    label: "StatusNotFound",
    kind: monacoDefault.languages.CompletionItemKind.Constant,
    snippet: "StatusNotFound",
    detail: "const http.StatusNotFound = 404",
    documentation: "HTTP status code 404 Not Found.",
  },
];

// ---------------------------------------------------------------------------
// 2. Type Instance Members (Methods available on instances)
// ---------------------------------------------------------------------------

export const SCANNER_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Scan",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Scan()",
    detail: "func (s *Scanner) Scan() bool",
    documentation: "Scan advances the Scanner to the next token, returning false when scan stops.",
  },
  {
    label: "Text",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Text()",
    detail: "func (s *Scanner) Text() string",
    documentation:
      "Text returns the most recent token generated by a call to Scan as a newly allocated string.",
  },
  {
    label: "Bytes",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Bytes()",
    detail: "func (s *Scanner) Bytes() []byte",
    documentation:
      "Bytes returns the most recent token generated by a call to Scan as a slice pointing to the buffer.",
  },
  {
    label: "Err",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Err()",
    detail: "func (s *Scanner) Err() error",
    documentation: "Err returns the first non-EOF error that was encountered by the Scanner.",
  },
];

export const BUILDER_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "WriteString",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "WriteString(${1:s})",
    detail: "func (b *Builder) WriteString(s string) (int, error)",
    documentation: "WriteString appends the contents of s to b's buffer.",
  },
  {
    label: "WriteByte",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "WriteByte(${1:c})",
    detail: "func (b *Builder) WriteByte(c byte) error",
    documentation: "WriteByte appends the byte c to b's buffer.",
  },
  {
    label: "WriteRune",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "WriteRune(${1:r})",
    detail: "func (b *Builder) WriteRune(r rune) (int, error)",
    documentation: "WriteRune appends the UTF-8 encoding of Unicode code point r to b's buffer.",
  },
  {
    label: "String",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "String()",
    detail: "func (b *Builder) String() string",
    documentation: "String returns the accumulated string.",
  },
  {
    label: "Len",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Len()",
    detail: "func (b *Builder) Len() int",
    documentation: "Len returns the number of accumulated bytes.",
  },
  {
    label: "Reset",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Reset()",
    detail: "func (b *Builder) Reset()",
    documentation: "Reset resets the Builder to be empty.",
  },
];

export const WAITGROUP_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Add",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Add(${1:delta})",
    detail: "func (wg *WaitGroup) Add(delta int)",
    documentation: "Add adds delta, which may be negative, to the WaitGroup counter.",
  },
  {
    label: "Done",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Done()",
    detail: "func (wg *WaitGroup) Done()",
    documentation: "Done decrements the WaitGroup counter by one.",
  },
  {
    label: "Wait",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Wait()",
    detail: "func (wg *WaitGroup) Wait()",
    documentation: "Wait blocks until the WaitGroup counter is zero.",
  },
];

export const MUTEX_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Lock",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Lock()",
    detail: "func (m *Mutex) Lock()",
    documentation:
      "Lock locks m. If the lock is already in use, the calling goroutine blocks until the mutex is available.",
  },
  {
    label: "Unlock",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Unlock()",
    detail: "func (m *Mutex) Unlock()",
    documentation:
      "Unlock unlocks m. It is a run-time error if m is not locked on entry to Unlock.",
  },
];

export const RWMUTEX_INSTANCE_MEMBERS: CompletionItemDef[] = [
  ...MUTEX_INSTANCE_MEMBERS,
  {
    label: "RLock",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "RLock()",
    detail: "func (rw *RWMutex) RLock()",
    documentation: "RLock locks rw for reading.",
  },
  {
    label: "RUnlock",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "RUnlock()",
    detail: "func (rw *RWMutex) RUnlock()",
    documentation: "RUnlock undoes a single RLock call.",
  },
];

export const TIME_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Format",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: 'Format("${1:2006-01-02 15:04:05}")',
    detail: "func (t Time) Format(layout string) string",
    documentation:
      "Format returns a textual representation of the time value formatted according to the layout defined by the argument.",
  },
  {
    label: "Unix",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Unix()",
    detail: "func (t Time) Unix() int64",
    documentation:
      "Unix returns t as a Unix time, the number of seconds elapsed since January 1, 1970 UTC.",
  },
  {
    label: "UnixMilli",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "UnixMilli()",
    detail: "func (t Time) UnixMilli() int64",
    documentation:
      "UnixMilli returns t as a Unix time, the number of milliseconds elapsed since January 1, 1970 UTC.",
  },
  {
    label: "Year",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Year()",
    detail: "func (t Time) Year() int",
    documentation: "Year returns the year in which t occurs.",
  },
  {
    label: "Month",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Month()",
    detail: "func (t Time) Month() Month",
    documentation: "Month returns the month of the year specified by t.",
  },
  {
    label: "Day",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Day()",
    detail: "func (t Time) Day() int",
    documentation: "Day returns the day of the month specified by t.",
  },
  {
    label: "Hour",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Hour()",
    detail: "func (t Time) Hour() int",
    documentation: "Hour returns the hour within the day specified by t, in the range [0, 23].",
  },
  {
    label: "Minute",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Minute()",
    detail: "func (t Time) Minute() int",
    documentation:
      "Minute returns the minute offset within the hour specified by t, in the range [0, 59].",
  },
  {
    label: "Second",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Second()",
    detail: "func (t Time) Second() int",
    documentation:
      "Second returns the second offset within the minute specified by t, in the range [0, 59].",
  },
  {
    label: "Add",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Add(${1:d})",
    detail: "func (t Time) Add(d Duration) Time",
    documentation: "Add returns the time t+d.",
  },
  {
    label: "Sub",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Sub(${1:u})",
    detail: "func (t Time) Sub(u Time) Duration",
    documentation: "Sub returns the duration t-u.",
  },
  {
    label: "After",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "After(${1:u})",
    detail: "func (t Time) After(u Time) bool",
    documentation: "After reports whether the time instant t is after u.",
  },
  {
    label: "Before",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Before(${1:u})",
    detail: "func (t Time) Before(u Time) bool",
    documentation: "Before reports whether the time instant t is before u.",
  },
  {
    label: "Equal",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Equal(${1:u})",
    detail: "func (t Time) Equal(u Time) bool",
    documentation: "Equal reports whether t and u represent the same time instant.",
  },
  {
    label: "String",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "String()",
    detail: "func (t Time) String() string",
    documentation:
      'String returns the time formatted using the format string "2006-01-02 15:04:05.999999999 -0700 MST".',
  },
];

export const OS_FILE_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Read",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Read(${1:b})",
    detail: "func (f *File) Read(b []byte) (n int, err error)",
    documentation: "Read reads up to len(b) bytes from the File.",
  },
  {
    label: "Write",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Write(${1:b})",
    detail: "func (f *File) Write(b []byte) (n int, err error)",
    documentation: "Write writes len(b) bytes to the File.",
  },
  {
    label: "WriteString",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "WriteString(${1:s})",
    detail: "func (f *File) WriteString(s string) (n int, err error)",
    documentation:
      "WriteString is like Write, but writes the contents of string s rather than a slice of bytes.",
  },
  {
    label: "Close",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Close()",
    detail: "func (f *File) Close() error",
    documentation: "Close closes the File, rendering it unusable for I/O.",
  },
  {
    label: "Name",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Name()",
    detail: "func (f *File) Name() string",
    documentation: "Name returns the name of the file as presented to Open.",
  },
  {
    label: "Stat",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Stat()",
    detail: "func (f *File) Stat() (FileInfo, error)",
    documentation: "Stat returns the FileInfo structure describing file.",
  },
  {
    label: "Sync",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Sync()",
    detail: "func (f *File) Sync() error",
    documentation: "Sync commits the current contents of the file to stable storage.",
  },
];

export const ERROR_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "Error",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Error()",
    detail: "func (e error) Error() string",
    documentation: "Error returns the error message string.",
  },
];

// ---------------------------------------------------------------------------
// 3. Predeclared Packages, Built-in Types, Constants, Functions & Keywords
// ---------------------------------------------------------------------------

export const GO_PACKAGES: { name: string; doc: string; members: CompletionItemDef[] }[] = [
  {
    name: "fmt",
    doc: "Package fmt implements formatted I/O with functions analogous to C's printf and scanf.",
    members: FMT_MEMBERS,
  },
  {
    name: "strings",
    doc: "Package strings implements simple functions to manipulate UTF-8 encoded strings.",
    members: STRINGS_MEMBERS,
  },
  {
    name: "strconv",
    doc: "Package strconv implements conversions to and from string representations of basic data types.",
    members: STRCONV_MEMBERS,
  },
  {
    name: "math",
    doc: "Package math provides basic constants and mathematical functions.",
    members: MATH_MEMBERS,
  },
  {
    name: "slices",
    doc: "Package slices defines various functions useful with slices of any type.",
    members: SLICES_MEMBERS,
  },
  {
    name: "maps",
    doc: "Package maps defines various functions useful with maps of any type.",
    members: MAPS_MEMBERS,
  },
  {
    name: "sort",
    doc: "Package sort provides primitives for sorting slices and user-defined collections.",
    members: SORT_MEMBERS,
  },
  {
    name: "os",
    doc: "Package os provides a platform-independent interface to operating system functionality.",
    members: OS_MEMBERS,
  },
  {
    name: "io",
    doc: "Package io provides basic interfaces to I/O primitives.",
    members: IO_MEMBERS,
  },
  {
    name: "bufio",
    doc: "Package bufio implements buffered I/O. It wraps an io.Reader or io.Writer object.",
    members: BUFIO_MEMBERS,
  },
  {
    name: "time",
    doc: "Package time provides functionality for measuring and displaying time.",
    members: TIME_MEMBERS,
  },
  {
    name: "sync",
    doc: "Package sync provides basic synchronization primitives such as mutual exclusion locks.",
    members: SYNC_MEMBERS,
  },
  {
    name: "json",
    doc: "Package json implements encoding and decoding of JSON as defined in RFC 7159 (encoding/json).",
    members: JSON_MEMBERS,
  },
  {
    name: "http",
    doc: "Package http provides HTTP client and server implementations (net/http).",
    members: HTTP_MEMBERS,
  },
];

export const BUILTIN_TYPES: CompletionItemDef[] = [
  {
    label: "int",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type int",
    documentation: "Signed integer type that is at least 32 bits in size, depending on platform.",
  },
  {
    label: "int8",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type int8",
    documentation: "Signed 8-bit integer (-128 to 127).",
  },
  {
    label: "int16",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type int16",
    documentation: "Signed 16-bit integer (-32768 to 32767).",
  },
  {
    label: "int32",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type int32",
    documentation: "Signed 32-bit integer (-2147483648 to 2147483647).",
  },
  {
    label: "int64",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type int64",
    documentation: "Signed 64-bit integer (-9223372036854775808 to 9223372036854775807).",
  },
  {
    label: "uint",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uint",
    documentation: "Unsigned integer type that is at least 32 bits in size.",
  },
  {
    label: "uint8",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uint8",
    documentation: "Unsigned 8-bit integer (0 to 255).",
  },
  {
    label: "uint16",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uint16",
    documentation: "Unsigned 16-bit integer (0 to 65535).",
  },
  {
    label: "uint32",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uint32",
    documentation: "Unsigned 32-bit integer (0 to 4294967295).",
  },
  {
    label: "uint64",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uint64",
    documentation: "Unsigned 64-bit integer (0 to 18446744073709551615).",
  },
  {
    label: "uintptr",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type uintptr",
    documentation:
      "Unsigned integer large enough to store the uninterpreted bits of a pointer value.",
  },
  {
    label: "float32",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type float32",
    documentation: "IEEE 754 32-bit floating-point numbers.",
  },
  {
    label: "float64",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type float64",
    documentation: "IEEE 754 64-bit floating-point numbers.",
  },
  {
    label: "complex64",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type complex64",
    documentation: "Complex numbers with float32 real and imaginary parts.",
  },
  {
    label: "complex128",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type complex128",
    documentation: "Complex numbers with float64 real and imaginary parts.",
  },
  {
    label: "bool",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type bool",
    documentation: "Boolean type, can be true or false.",
  },
  {
    label: "byte",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type byte = uint8",
    documentation: "byte is an alias for uint8 and is equivalent to uint8 in all ways.",
  },
  {
    label: "rune",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type rune = int32",
    documentation:
      "rune is an alias for int32 and is used to distinguish characters from integers.",
  },
  {
    label: "string",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "type string",
    documentation: "The set of all strings of 8-bit bytes, conventionally UTF-8-encoded text.",
  },
  {
    label: "error",
    kind: monacoDefault.languages.CompletionItemKind.Interface,
    detail: "type error interface { Error() string }",
    documentation:
      "The error built-in interface type is the conventional interface for representing an error condition.",
  },
  {
    label: "any",
    kind: monacoDefault.languages.CompletionItemKind.Interface,
    detail: "type any = interface{}",
    documentation: "any is an alias for interface{} and is equivalent to interface{} in all ways.",
  },
  {
    label: "comparable",
    kind: monacoDefault.languages.CompletionItemKind.Interface,
    detail: "type comparable interface",
    documentation: "comparable is an interface that is implemented by all comparable types.",
  },
];

export const BUILTIN_CONSTANTS: CompletionItemDef[] = [
  {
    label: "true",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    detail: "true",
    documentation: "Boolean constant true.",
  },
  {
    label: "false",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    detail: "false",
    documentation: "Boolean constant false.",
  },
  {
    label: "iota",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    detail: "iota",
    documentation:
      "Untyped integer constant used in const declarations to create successive untyped integer constants.",
  },
  {
    label: "nil",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    detail: "nil",
    documentation:
      "Predeclared identifier representing the zero value for pointer, channel, func, interface, map, or slice type.",
  },
];

export const BUILTIN_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "append",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "append(${1:slice}, ${2:elems...})",
    detail: "func append(slice []Type, elems ...Type) []Type",
    documentation: "The append built-in function appends elements to the end of a slice.",
  },
  {
    label: "make",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "make(${1:Type}, ${2:size})",
    detail: "func make(t Type, size ...IntegerType) Type",
    documentation:
      "The make built-in function allocates and initializes an object of type slice, map, or chan.",
  },
  {
    label: "new",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "new(${1:Type})",
    detail: "func new(Type) *Type",
    documentation:
      "The new built-in function allocates memory. It returns a pointer to a newly allocated zero value of that type.",
  },
  {
    label: "len",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "len(${1:v})",
    detail: "func len(v Type) int",
    documentation:
      "The len built-in function returns the length of v, according to its type (array, slice, map, string, or channel).",
  },
  {
    label: "cap",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "cap(${1:v})",
    detail: "func cap(v Type) int",
    documentation:
      "The cap built-in function returns the capacity of v, according to its type (array, slice, or channel).",
  },
  {
    label: "copy",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "copy(${1:dst}, ${2:src})",
    detail: "func copy(dst, src []Type) int",
    documentation:
      "The copy built-in function copies elements from a source slice into a destination slice. It returns the number of elements copied.",
  },
  {
    label: "delete",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "delete(${1:m}, ${2:key})",
    detail: "func delete(m map[Type]Type1, key Type)",
    documentation:
      "The delete built-in function deletes the element with the specified key from the map.",
  },
  {
    label: "close",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "close(${1:c})",
    detail: "func close(c chan<- Type)",
    documentation:
      "The close built-in function closes a channel, which must be either bidirectional or send-only.",
  },
  {
    label: "panic",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "panic(${1:v})",
    detail: "func panic(v any)",
    documentation:
      "The panic built-in function stops the normal execution of the current goroutine.",
  },
  {
    label: "recover",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "recover()",
    detail: "func recover() any",
    documentation:
      "The recover built-in function allows a program to manage behavior of a panicking goroutine.",
  },
  {
    label: "min",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "min(${1:x}, ${2:y})",
    detail: "func min[T cmp.Ordered](x T, y ...T) T",
    documentation:
      "The min built-in function returns the smallest value of a fixed number of arguments.",
  },
  {
    label: "max",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "max(${1:x}, ${2:y})",
    detail: "func max[T cmp.Ordered](x T, y ...T) T",
    documentation:
      "The max built-in function returns the largest value of a fixed number of arguments.",
  },
  {
    label: "clear",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "clear(${1:m})",
    detail: "func clear[T ~[]Type | ~map[Key]Type](t T)",
    documentation: "The clear built-in function clears all elements of a slice or map.",
  },
  {
    label: "print",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "print(${1:args})",
    detail: "func print(args ...Type)",
    documentation:
      "The print built-in function formats its arguments in an implementation-specific way and writes to standard error.",
  },
  {
    label: "println",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "println(${1:args})",
    detail: "func println(args ...Type)",
    documentation:
      "The println built-in function formats its arguments and writes to standard error, ending with a newline.",
  },
];

export const GO_KEYWORDS: CompletionItemDef[] = [
  {
    label: "break",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    documentation: "Terminates execution of the innermost for, switch, or select statement.",
  },
  {
    label: "case",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "case ${1:value}:\n\t${0}",
    documentation: "Declares a case in a switch or select statement.",
  },
  {
    label: "chan",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "chan ${1:type}",
    documentation: "Declares a channel type for concurrent communication.",
  },
  {
    label: "const",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "const ${1:name} = ${2:value}",
    documentation: "Declares a constant value.",
  },
  {
    label: "continue",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    documentation: "Begins the next iteration of the innermost for loop.",
  },
  {
    label: "default",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "default:\n\t${0}",
    documentation: "Declares default branch in a switch or select statement.",
  },
  {
    label: "defer",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "defer ${1:func}()",
    documentation: "Defers execution of a function until surrounding function returns.",
  },
  {
    label: "else",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "else {\n\t${0}\n}",
    documentation: "Executes block when preceding if condition evaluates to false.",
  },
  {
    label: "fallthrough",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    documentation: "Transfers execution to first statement of next case in a switch.",
  },
  {
    label: "for",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "for ${1:condition} {\n\t${0}\n}",
    documentation: "Declares a for loop.",
  },
  {
    label: "func",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "func ${1:name}(${2}) ${3} {\n\t${0}\n}",
    documentation: "Declares a function or method.",
  },
  {
    label: "go",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "go ${1:func}()",
    documentation: "Starts execution of a function call in a new concurrent goroutine.",
  },
  {
    label: "goto",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "goto ${1:label}",
    documentation: "Transfers execution unconditionally to matching labeled statement.",
  },
  {
    label: "if",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "if ${1:condition} {\n\t${0}\n}",
    documentation: "Declares a conditional branching statement.",
  },
  {
    label: "import",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: 'import (\n\t"${1:package}"\n)',
    documentation: "Declares package imports.",
  },
  {
    label: "interface",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "interface {\n\t${0}\n}",
    documentation: "Declares an interface type.",
  },
  {
    label: "map",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "map[${1:keyType}]${2:valueType}",
    documentation: "Declares an associative hash map type.",
  },
  {
    label: "package",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "package ${1:main}",
    documentation: "Declares the package to which the current file belongs.",
  },
  {
    label: "range",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    documentation: "Iterates over slice, array, string, map, or channel in a for loop.",
  },
  {
    label: "return",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "return ${1}",
    documentation: "Returns from current function.",
  },
  {
    label: "select",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "select {\ncase ${1}:\n\t${0}\n}",
    documentation: "Waits on multiple channel operations.",
  },
  {
    label: "struct",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "struct {\n\t${0}\n}",
    documentation: "Declares a composite struct type containing named fields.",
  },
  {
    label: "switch",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "switch ${1:expr} {\ncase ${2}:\n\t${0}\n}",
    documentation: "Declares a multi-way switch statement.",
  },
  {
    label: "type",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "type ${1:Name} ${2:type}",
    documentation: "Declares a new defined type or type alias.",
  },
  {
    label: "var",
    kind: monacoDefault.languages.CompletionItemKind.Keyword,
    snippet: "var ${1:name} ${2:type}",
    documentation: "Declares one or more variables.",
  },
];

export const GO_SNIPPETS: CompletionItemDef[] = [
  {
    label: "pkgm",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet:
      'package main\n\nimport (\n\t"fmt"\n)\n\nfunc main() {\n\t${1:fmt.Println("Hello, World!")}\n}\n',
    detail: "Go main package boilerplate",
    documentation: "Generates package main with fmt import and main function.",
  },
  {
    label: "main",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "func main() {\n\t${0}\n}",
    detail: "func main()",
    documentation: "Generates main entrypoint function.",
  },
  {
    label: "fn",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "func ${1:name}(${2:params}) ${3:error} {\n\t${0}\n}",
    detail: "func declaration",
    documentation: "Generates a function declaration.",
  },
  {
    label: "fnm",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "func (${1:recv} *${2:Type}) ${3:name}(${4:params}) ${5:error} {\n\t${0}\n}",
    detail: "method with receiver",
    documentation: "Generates a method with a pointer receiver.",
  },
  {
    label: "fori",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t${0}\n}",
    detail: "for index loop",
    documentation: "Standard indexed for loop.",
  },
  {
    label: "forr",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for ${1:i}, ${2:val} := range ${3:items} {\n\t${0}\n}",
    detail: "for range loop",
    documentation: "Range loop iterating index and value over collection.",
  },
  {
    label: "forw",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for ${1:condition} {\n\t${0}\n}",
    detail: "for while-style loop",
    documentation: "Go while-style loop with condition.",
  },
  {
    label: "iferr",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "if err != nil {\n\treturn ${1:err}\n}",
    detail: "if err != nil check",
    documentation: "Idiomatic Go error check and return.",
  },
  {
    label: "ife",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "if ${1:condition} {\n\t${2}\n} else {\n\t${0}\n}",
    detail: "if-else statement",
    documentation: "if-else conditional statement.",
  },
  {
    label: "typs",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "type ${1:Name} struct {\n\t${0}\n}",
    detail: "type struct declaration",
    documentation: "Declares a new struct type.",
  },
  {
    label: "typi",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "type ${1:Name} interface {\n\t${0}\n}",
    detail: "type interface declaration",
    documentation: "Declares a new interface type.",
  },
  {
    label: "makem",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "make(map[${1:string}]${2:int})",
    detail: "make map",
    documentation: "Initializes a new map.",
  },
  {
    label: "gofunc",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "go func() {\n\t${0}\n}()",
    detail: "anonymous goroutine",
    documentation: "Launches an anonymous goroutine.",
  },
];

// Sets for quick lookup
export const GO_KEYWORD_SET = new Set(GO_KEYWORDS.map((k) => k.label));
export const BUILTIN_TYPE_SET = new Set(BUILTIN_TYPES.map((t) => t.label));
export const BUILTIN_FUNC_SET = new Set(BUILTIN_FUNCTIONS.map((f) => f.label));
export const BUILTIN_CONST_SET = new Set(BUILTIN_CONSTANTS.map((c) => c.label));

// ---------------------------------------------------------------------------
// 4. Comment & String Masking and Guardrails
// ---------------------------------------------------------------------------

/**
 * Masks all Go comments and string/rune literals in the entire text,
 * replacing contents with spaces while strictly preserving line breaks ('\n')
 * so line numbers and indices remain completely synchronized.
 */
export function maskGoCommentsAndStrings(text: string): string {
  const chars = text.split("");
  const len = chars.length;
  let i = 0;

  while (i < len) {
    const ch = chars[i];
    const next = i + 1 < len ? chars[i + 1] : "";

    // Line comment: // ...
    if (ch === "/" && next === "/") {
      chars[i] = " ";
      chars[i + 1] = " ";
      i += 2;
      while (i < len && chars[i] !== "\n") {
        chars[i] = " ";
        i++;
      }
      continue;
    }

    // Block comment: /* ... */
    if (ch === "/" && next === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      i += 2;
      while (i < len) {
        if (chars[i] === "*" && i + 1 < len && chars[i + 1] === "/") {
          chars[i] = " ";
          chars[i + 1] = " ";
          i += 2;
          break;
        }
        if (chars[i] !== "\n") {
          chars[i] = " ";
        }
        i++;
      }
      continue;
    }

    // Raw string literal: ` ... ` (can be multiline)
    if (ch === "`") {
      chars[i] = " ";
      i++;
      while (i < len && chars[i] !== "`") {
        if (chars[i] !== "\n") {
          chars[i] = " ";
        }
        i++;
      }
      if (i < len && chars[i] === "`") {
        chars[i] = " ";
        i++;
      }
      continue;
    }

    // Interpreted string literal: " ... "
    if (ch === '"') {
      chars[i] = " ";
      i++;
      while (i < len && chars[i] !== '"' && chars[i] !== "\n") {
        if (chars[i] === "\\" && i + 1 < len) {
          chars[i] = " ";
          i++;
        }
        chars[i] = " ";
        i++;
      }
      if (i < len && chars[i] === '"') {
        chars[i] = " ";
        i++;
      }
      continue;
    }

    // Rune literal: 'a', '\n'
    if (ch === "'") {
      chars[i] = " ";
      i++;
      while (i < len && chars[i] !== "'" && chars[i] !== "\n") {
        if (chars[i] === "\\" && i + 1 < len) {
          chars[i] = " ";
          i++;
        }
        chars[i] = " ";
        i++;
      }
      if (i < len && chars[i] === "'") {
        chars[i] = " ";
        i++;
      }
      continue;
    }

    i++;
  }

  return chars.join("");
}

/**
 * Checks whether the cursor at the given position is inside a comment or string literal.
 */
export function isInsideGoCommentOrString(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
): boolean {
  const targetLn = position.lineNumber;
  const targetCol = position.column;

  let inBlockComment = false;
  let inRawString = false;

  for (let ln = 1; ln <= targetLn; ln++) {
    const rawLine = model.getLineContent(ln);
    const isTargetLine = ln === targetLn;
    const maxCol = isTargetLine ? targetCol - 1 : rawLine.length;

    let inString = false;
    let inRune = false;
    let i = 0;

    while (i < rawLine.length) {
      if (isTargetLine && i >= maxCol) {
        return inBlockComment || inRawString || inString || inRune;
      }

      const ch = rawLine[i];
      const next = i + 1 < rawLine.length ? rawLine[i + 1] : "";

      if (inBlockComment) {
        if (ch === "*" && next === "/") {
          inBlockComment = false;
          i += 2;
          continue;
        }
        i++;
        continue;
      }

      if (inRawString) {
        if (ch === "`") {
          inRawString = false;
          i++;
          continue;
        }
        i++;
        continue;
      }

      if (inString) {
        if (ch === "\\" && i + 1 < rawLine.length) {
          i += 2;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        i++;
        continue;
      }

      if (inRune) {
        if (ch === "\\" && i + 1 < rawLine.length) {
          i += 2;
          continue;
        }
        if (ch === "'") {
          inRune = false;
        }
        i++;
        continue;
      }

      // Check starters
      if (ch === "/" && next === "/") {
        // Line comment: everything from here to end of line is comment
        if (isTargetLine && maxCol >= i) {
          return true;
        }
        break; // skip rest of line
      }

      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }

      if (ch === "`") {
        inRawString = true;
        i++;
        continue;
      }

      if (ch === '"') {
        inString = true;
        i++;
        continue;
      }

      if (ch === "'") {
        inRune = true;
        i++;
        continue;
      }

      i++;
    }

    if (isTargetLine) {
      return inBlockComment || inRawString || inString || inRune;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 5. Scope Analysis (Curly Brace Stack Tracking)
// ---------------------------------------------------------------------------

export interface ScopeBlock {
  startLine: number;
  endLine: number;
  depth: number;
  parentIndex: number | null;
}

export interface GoScopeAnalysis {
  blocks: ScopeBlock[];
  visibleBlocksForCursor: Set<number>;
}

/**
 * Computes block scopes based on `{ ... }` in masked Go source text.
 */
export function computeGoScopes(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): GoScopeAnalysis {
  const masked = maskGoCommentsAndStrings(model.getValue());
  const lines = masked.split("\n");

  const blocks: ScopeBlock[] = [];
  const stack: { blockIndex: number; isScope: boolean }[] = [];

  for (let ln = 1; ln <= lines.length; ln++) {
    const line = lines[ln - 1];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === "{") {
        const textBeforeBrace = line.slice(0, c).trim();
        // A '{' introduces a lexical block scope if preceded by func, if, else, for, switch, select, struct, interface,
        // or a closing parenthesis ')', or if at the start of a statement (bare block)
        const isScope =
          /(?:^|[;{}])\s*$/.test(textBeforeBrace) ||
          /\b(?:func|if|else|for|switch|select|struct|interface|case|default)\b/.test(
            textBeforeBrace,
          ) ||
          textBeforeBrace.endsWith(")");

        if (isScope) {
          const parentIndex =
            stack.length > 0 && stack[stack.length - 1].isScope
              ? stack[stack.length - 1].blockIndex
              : null;
          const depth = blocks.length;
          const blockIndex = blocks.length;
          blocks.push({
            startLine: ln,
            endLine: lines.length, // updated when closed
            depth,
            parentIndex,
          });
          stack.push({ blockIndex, isScope: true });
        } else {
          stack.push({ blockIndex: -1, isScope: false });
        }
      } else if (ch === "}") {
        if (stack.length > 0) {
          const top = stack.pop()!;
          if (top.isScope && top.blockIndex >= 0 && top.blockIndex < blocks.length) {
            blocks[top.blockIndex].endLine = ln;
          }
        }
      }
    }
  }

  // Find all enclosing block indices that contain the cursor
  const visibleBlocksForCursor = new Set<number>();
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (cursorLine >= b.startLine && cursorLine <= b.endLine) {
      visibleBlocksForCursor.add(i);
    }
  }

  return { blocks, visibleBlocksForCursor };
}

/**
 * Checks whether a declaration at declLine is visible to cursor at cursorLine.
 */
export function isGoLineVisible(
  scopes: GoScopeAnalysis,
  declLine: number,
  cursorLine: number,
): boolean {
  if (declLine > cursorLine) return false;

  // Find the deepest block that encloses declLine
  let declBlockIdx: number | null = null;
  let maxDepth = -1;
  for (let i = 0; i < scopes.blocks.length; i++) {
    const b = scopes.blocks[i];
    // Blocks that open and close on the same line are not lexical scopes for subsequent lines
    if (b.startLine === b.endLine && cursorLine > declLine) continue;

    if (declLine >= b.startLine && declLine <= b.endLine) {
      if (b.depth > maxDepth) {
        maxDepth = b.depth;
        declBlockIdx = i;
      }
    }
  }

  // If declared at package level (outside any braces), visible everywhere in the file
  if (declBlockIdx === null) {
    return true;
  }

  // If declared inside a block, that block must be an active enclosing block of the cursor
  return scopes.visibleBlocksForCursor.has(declBlockIdx);
}

// ---------------------------------------------------------------------------
// 6. User Struct & Function Symbol Extraction
// ---------------------------------------------------------------------------

export interface GoStructDef {
  name: string;
  fields: CompletionItemDef[];
  methods: CompletionItemDef[];
}

export interface GoDocumentSymbols {
  structs: Map<string, GoStructDef>;
  functions: Map<string, CompletionItemDef>;
}

export function extractGoDocumentSymbols(
  model: monacoDefault.editor.ITextModel,
): GoDocumentSymbols {
  const masked = maskGoCommentsAndStrings(model.getValue());
  const lines = masked.split("\n");
  const structs = new Map<string, GoStructDef>();
  const functions = new Map<string, CompletionItemDef>();

  let currentStruct: GoStructDef | null = null;
  let inStructBraceCount = 0;

  for (let ln = 0; ln < lines.length; ln++) {
    const rawLine = lines[ln].trim();
    if (!rawLine) continue;

    // 1. Struct declaration: type Name struct {
    const structStartMatch = rawLine.match(/\btype\s+([A-Za-z_]\w*)\s+struct\b/);
    if (structStartMatch) {
      const structName = structStartMatch[1];
      currentStruct = {
        name: structName,
        fields: [],
        methods: [],
      };
      structs.set(structName, currentStruct);
      inStructBraceCount = 0;
      for (const ch of rawLine) {
        if (ch === "{") inStructBraceCount++;
        if (ch === "}") inStructBraceCount--;
      }
      if (inStructBraceCount <= 0 && rawLine.includes("}")) {
        currentStruct = null;
      }
      continue;
    }

    if (currentStruct) {
      for (const ch of rawLine) {
        if (ch === "{") inStructBraceCount++;
        if (ch === "}") inStructBraceCount--;
      }
      if (inStructBraceCount <= 0 && rawLine.includes("}")) {
        currentStruct = null;
        continue;
      }

      // Inside struct: parse fields e.g. "Name string", "Age int", "Tags []string", "Address *Address"
      // or multiple fields: "X, Y float64"
      const fieldMatch = rawLine.match(
        /^([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s+([*]?(?:\[\])?[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)/,
      );
      if (fieldMatch) {
        const fieldNames = fieldMatch[1].split(",").map((s) => s.trim());
        const fieldType = fieldMatch[2].trim();
        for (const fname of fieldNames) {
          if (!GO_KEYWORD_SET.has(fname)) {
            currentStruct.fields.push({
              label: fname,
              kind: monacoDefault.languages.CompletionItemKind.Field,
              detail: `${fname} ${fieldType}`,
              documentation: `Field of struct ${currentStruct.name}`,
            });
          }
        }
      }
      continue;
    }

    let lineToParse = rawLine;
    if (/\bfunc\b/.test(rawLine) && !rawLine.includes(")")) {
      for (let fwd = ln + 1; fwd <= Math.min(lines.length - 1, ln + 10); fwd++) {
        const nextL = lines[fwd].trim();
        lineToParse += " " + nextL;
        if (nextL.includes(")")) break;
      }
    }

    // 2. Method declaration with receiver: func (r *Receiver) Method(params) returnType
    const methodMatch = lineToParse.match(
      /\bfunc\s*\(\s*(?:[A-Za-z_]\w*\s+)?(\*?[A-Za-z_]\w*)\s*\)\s*([A-Za-z_]\w*)\s*\(([^)]*)\)(?:\s*([^{]+))?/,
    );
    if (methodMatch) {
      const rawRecvType = methodMatch[1];
      const methodName = methodMatch[2];
      const params = methodMatch[3].trim();
      const returnType = methodMatch[4] ? methodMatch[4].trim() : "";
      const baseRecvType = rawRecvType.replace(/^\*/, "").trim();

      let sDef = structs.get(baseRecvType);
      if (!sDef) {
        sDef = { name: baseRecvType, fields: [], methods: [] };
        structs.set(baseRecvType, sDef);
      }

      const sigLabel = `func (${rawRecvType}) ${methodName}(${params}) ${returnType}`.trim();
      sDef.methods.push({
        label: methodName,
        kind: monacoDefault.languages.CompletionItemKind.Method,
        snippet: `${methodName}(${params ? "${1}" : ""})`,
        detail: sigLabel,
        documentation: `Method of ${baseRecvType}`,
      });
      continue;
    }

    // 3. Regular function declaration: func FuncName(params) returnType
    const funcMatch = lineToParse.match(/\bfunc\s+([A-Za-z_]\w*)\s*\(([^)]*)\)(?:\s*([^{]+))?/);
    if (funcMatch) {
      const fname = funcMatch[1];
      const params = funcMatch[2].trim();
      const returnType = funcMatch[3] ? funcMatch[3].trim() : "";
      if (!GO_KEYWORD_SET.has(fname)) {
        functions.set(fname, {
          label: fname,
          kind: monacoDefault.languages.CompletionItemKind.Function,
          snippet: `${fname}(${params ? "${1}" : ""})`,
          detail: `func ${fname}(${params}) ${returnType}`.trim(),
          documentation: `User defined function ${fname}`,
        });
      }
    }
  }

  return { structs, functions };
}

/**
 * Parses Go parameter list, supporting grouped parameters sharing a type (e.g. "a, b int, s, t string")
 * and nested delimiters in parameter types like "cb func(x, y int) bool".
 */
export function parseGoParams(paramsRaw: string): Array<{ name: string; type: string }> {
  if (!paramsRaw.trim()) return [];

  // Split by top-level commas (ignoring commas inside nested (), [], {})
  const tokens: string[] = [];
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let currentToken = "";

  for (let i = 0; i < paramsRaw.length; i++) {
    const ch = paramsRaw[i];
    if (ch === "(") depthParen++;
    else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
    else if (ch === "[") depthBracket++;
    else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
    else if (ch === "{") depthBrace++;
    else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);

    if (ch === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      tokens.push(currentToken.trim());
      currentToken = "";
    } else {
      currentToken += ch;
    }
  }
  if (currentToken.trim()) {
    tokens.push(currentToken.trim());
  }

  const result: Array<{ name: string; type: string }> = [];
  const pendingNames: string[] = [];

  for (const token of tokens) {
    if (!token) continue;
    // Check if token has both name and type: "name Type" e.g. "b int" or "cb func(x, y int)"
    const match = token.match(/^([a-zA-Z_]\w*)\s+(.+)$/);
    if (match) {
      const name = match[1];
      const type = match[2].trim();
      for (const pName of pendingNames) {
        result.push({ name: pName, type });
      }
      pendingNames.length = 0;
      result.push({ name, type });
    } else {
      // Just a name in a grouped declaration: "a" in "a, b int"
      const nameMatch = token.match(/^([a-zA-Z_]\w*)$/);
      if (nameMatch) {
        pendingNames.push(nameMatch[1]);
      }
    }
  }

  for (const pName of pendingNames) {
    result.push({ name: pName, type: "" });
  }

  return result;
}

// ---------------------------------------------------------------------------
// 7. Type Inference Engine
// ---------------------------------------------------------------------------

export type InferredGoType =
  | "string"
  | "int"
  | "float64"
  | "bool"
  | "error"
  | "[]string"
  | "[]int"
  | "[]float64"
  | "[]byte"
  | "slice"
  | "map"
  | "time.Time"
  | "strings.Builder"
  | "*bufio.Scanner"
  | "bufio.Scanner"
  | "sync.WaitGroup"
  | "sync.Mutex"
  | "sync.RWMutex"
  | "*os.File"
  | "os.File"
  | string; // or user struct name e.g. "Person" or "*Person"

/**
 * Normalizes pointer and package prefixes: "*Person" -> "Person"
 */
export function normalizeGoTypeName(t: string): string {
  return t.replace(/^\*/, "").trim();
}

/**
 * Infers the Go type of an expression immediately before the dot.
 */
export function inferGoType(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  textBeforeDot: string,
): InferredGoType {
  const expr = textBeforeDot.trim();
  if (!expr) return "unknown";

  // String literals
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("`") && expr.endsWith("`"))
  ) {
    return "string";
  }

  // Direct constructor / function call expressions
  if (/^strings\.(?:Split|Fields)\b/.test(expr)) return "[]string";
  if (/^bufio\.NewScanner\b/.test(expr)) return "*bufio.Scanner";
  if (/^time\.Now\b/.test(expr)) return "time.Time";

  // Index access e.g. words[0], matrix[0][0], or m["key"]
  const indexMatch = expr.match(/^(.+)\[[^\[\]]*\]$/);
  if (indexMatch) {
    const baseExpr = indexMatch[1].trim();
    const baseType = inferGoType(model, position, baseExpr);
    if (baseType === "[]string") return "string";
    if (baseType === "[]int") return "int";
    if (baseType === "[]float64") return "float64";
    if (baseType === "[]byte") return "byte";
    if (baseType.startsWith("[]")) return baseType.slice(2);
    if (baseType.startsWith("map[")) {
      const valTypeMatch = baseType.match(/^map\[.+\](.+)$/);
      if (valTypeMatch) return valTypeMatch[1].trim();
    }
    return "unknown";
  }

  // Identifier check (variable name)
  const varMatch = expr.match(/([a-zA-Z_]\w*)$/);
  if (!varMatch) return "unknown";
  const varName = varMatch[1];

  const scopes = computeGoScopes(model, position.lineNumber);

  // Scan backwards from position.lineNumber to line 1
  for (let ln = position.lineNumber; ln >= 1; ln--) {
    if (!isGoLineVisible(scopes, ln, position.lineNumber)) {
      continue;
    }

    const rawLine = model.getLineContent(ln);
    const maskedLine = maskGoCommentsAndStrings(rawLine).trim();
    if (!maskedLine) continue;

    // 1. For range loops: for idx, val := range items OR for idx := range items
    const forRangeMatch = maskedLine.match(
      /\bfor\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?\s*:=\s*range\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?(?:\([^)]*\))?)/,
    );
    if (forRangeMatch) {
      const firstVar = forRangeMatch[1];
      const secondVar = forRangeMatch[2];
      const itemsVar = forRangeMatch[3];
      if (varName === firstVar) {
        return "int"; // loop index
      }
      if (varName === secondVar) {
        const itemsType = inferGoType(model, position, itemsVar);
        if (itemsType === "[]string") return "string";
        if (itemsType === "[]int") return "int";
        if (itemsType === "[]float64") return "float64";
        if (itemsType === "[]byte") return "byte";
        if (itemsType.startsWith("[]")) return itemsType.slice(2);
        if (itemsType.startsWith("map[")) {
          const valTypeMatch = itemsType.match(/^map\[.+\](.+)$/);
          if (valTypeMatch) return valTypeMatch[1].trim();
        }
        return "unknown";
      }
    }

    // 2. Multi-return tuple checks: val, err := ... or val, ok := ...
    if (varName === "err" && /\b[a-zA-Z_]\w*\s*,\s*err\s*:=/.test(maskedLine)) {
      return "error";
    }
    if (varName === "ok" && /\b[a-zA-Z_]\w*\s*,\s*ok\s*:=/.test(maskedLine)) {
      return "bool";
    }

    // 3. Short or standard variable assignment: x := ... or var x = ... or x = ...
    if (!/^\s*for\b/.test(maskedLine)) {
      const shortAssign = maskedLine.match(
        new RegExp(
          `(?:\\bvar\\s+)?\\b${varName}\\s*(?:,\\s*(?:err|ok|[a-zA-Z_]\\w*))?\\s*(?::=|=)\\s*(.+)`,
        ),
      );
      if (shortAssign) {
        const rhs = shortAssign[1].trim();

        // Literal string
        if (rhs.startsWith('"') || rhs.startsWith("`")) return "string";
        // String functions
        if (
          /^strings\.(?:Join|ToLower|ToUpper|TrimSpace|Trim|ReplaceAll|Repeat|Sprintf)\b/.test(rhs)
        )
          return "string";
        if (/^fmt\.Sprintf\b/.test(rhs)) return "string";
        if (/^strconv\.Itoa\b/.test(rhs)) return "string";

        // Integer functions
        if (/^strconv\.Atoi\b/.test(rhs)) return "int";
        if (/^len\s*\(/.test(rhs)) return "int";
        if (/^\d+$/.test(rhs)) return "int";

        // Float
        if (/^math\.(?:Sqrt|Pow|Abs|Floor|Ceil|Round|Sin|Cos)\b/.test(rhs)) return "float64";
        if (/^\d+\.\d+$/.test(rhs)) return "float64";

        // Boolean
        if (/^(?:true|false)\b/.test(rhs)) return "bool";
        if (/^strings\.(?:Contains|HasPrefix|HasSuffix)\b/.test(rhs)) return "bool";

        // Slices & arrays: [][]int{}, []string{}, make([][]int, 5), []*Node{}
        const sliceTypeMatch = rhs.match(/^(?:make\s*\(\s*)?((?:\[\])+[*]?\w+(?:\.\w+)?)/);
        if (sliceTypeMatch) {
          return sliceTypeMatch[1];
        }

        // Map
        if (/^make\s*\(\s*map\[/.test(rhs)) {
          const mMatch = rhs.match(/make\s*\(\s*(map\[[^\]]+\]\w+)/);
          if (mMatch) return mMatch[1];
          return "map";
        }

        // Scanner
        if (/^bufio\.NewScanner\b/.test(rhs)) return "*bufio.Scanner";

        // Builder
        if (/^strings\.Builder\b/.test(rhs)) return "strings.Builder";

        // Time
        if (/^time\.Now\b/.test(rhs)) return "time.Time";

        // OS File
        if (/^os\.(?:Open|Create)\b/.test(rhs)) return "*os.File";

        // User Struct or Package struct instantiation: &Person{...} or strings.Builder{}
        const structInst = rhs.match(/&?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*\{/);
        if (structInst && !GO_KEYWORD_SET.has(structInst[1])) {
          return structInst[1];
        }

        return "unknown";
      }
    }

    // 4. Var declaration: var x string, var x = ..., var x int, or var a, b int
    const varDecl = maskedLine.match(
      new RegExp(
        `\\bvar\\s+[^=;]*\\b${varName}\\b[^=;]*\\s+([*]?(?:\\[\\])?[A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)?)`,
      ),
    );
    if (varDecl) {
      const explicitType = varDecl[1].trim();
      if (!GO_KEYWORD_SET.has(explicitType)) {
        return explicitType;
      }
    }

    // 5. Function parameter in enclosing function or method (with multiline accumulation)
    let funcLineToParse = maskedLine;
    if (/\bfunc\b/.test(maskedLine) && !maskedLine.includes(")")) {
      for (let fwd = ln + 1; fwd <= Math.min(model.getLineCount(), ln + 10); fwd++) {
        const nextL = maskGoCommentsAndStrings(model.getLineContent(fwd)).trim();
        funcLineToParse += " " + nextL;
        if (nextL.includes(")")) break;
      }
    }

    const funcHeaderMatch = funcLineToParse.match(
      /\bfunc\s*(?:\([^)]*\)\s*)?[A-Za-z_]\w*\s*\(([^)]*)\)/,
    );
    if (funcHeaderMatch) {
      const paramsRaw = funcHeaderMatch[1].trim();
      if (paramsRaw) {
        const parsed = parseGoParams(paramsRaw);
        for (const p of parsed) {
          if (p.name === varName && p.type) {
            return p.type;
          }
        }
      }
    }

    // 6. Method receiver parameter: func (s *Student) Method()
    const recvMatch = maskedLine.match(/\bfunc\s*\(\s*([A-Za-z_]\w*)\s+(\*?[A-Za-z_]\w*)\s*\)/);
    if (recvMatch && recvMatch[1] === varName) {
      return recvMatch[2].trim();
    }
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// 8. Signature Help Signatures Map
// ---------------------------------------------------------------------------

export interface SignatureParam {
  label: string;
  doc: string;
}

export interface SignatureDef {
  label: string;
  doc: string;
  params: SignatureParam[];
  varargPositionalIdx?: number;
}

export const GO_SIGNATURES: Record<string, SignatureDef> = {
  // Builtins
  append: {
    label: "func append(slice []Type, elems ...Type) []Type",
    doc: "Appends elements to the end of a slice and returns the updated slice.",
    params: [
      { label: "slice: []Type", doc: "The destination slice." },
      { label: "elems ...Type", doc: "Elements to append to the slice." },
    ],
    varargPositionalIdx: 1,
  },
  make: {
    label: "func make(t Type, size ...IntegerType) Type",
    doc: "Allocates and initializes an object of type slice, map, or chan.",
    params: [
      { label: "t: Type", doc: "Type of object to create (slice, map, chan)." },
      { label: "size: IntegerType", doc: "Length of slice or initial capacity of map/chan." },
      { label: "cap: IntegerType", doc: "Optional capacity of slice." },
    ],
  },
  new: {
    label: "func new(Type) *Type",
    doc: "Allocates memory and returns a pointer to a newly zero-initialized value.",
    params: [{ label: "Type", doc: "The type to allocate." }],
  },
  len: {
    label: "func len(v Type) int",
    doc: "Returns the length of v according to its type.",
    params: [{ label: "v: Type", doc: "Array, slice, string, map, or channel." }],
  },
  cap: {
    label: "func cap(v Type) int",
    doc: "Returns the capacity of v according to its type.",
    params: [{ label: "v: Type", doc: "Array, slice, or channel." }],
  },
  copy: {
    label: "func copy(dst, src []Type) int",
    doc: "Copies elements from src to dst. Returns number of elements copied.",
    params: [
      { label: "dst: []Type", doc: "Destination slice." },
      { label: "src: []Type", doc: "Source slice." },
    ],
  },
  delete: {
    label: "func delete(m map[Type]Type1, key Type)",
    doc: "Deletes the element with the specified key from the map.",
    params: [
      { label: "m: map[Type]Type1", doc: "The map to delete from." },
      { label: "key: Type", doc: "Key to remove." },
    ],
  },
  close: {
    label: "func close(c chan<- Type)",
    doc: "Closes a channel, which must be either bidirectional or send-only.",
    params: [{ label: "c: chan<- Type", doc: "Channel to close." }],
  },
  panic: {
    label: "func panic(v any)",
    doc: "Stops the normal execution of the current goroutine.",
    params: [{ label: "v: any", doc: "Value to pass to panic." }],
  },
  recover: {
    label: "func recover() any",
    doc: "Manages behavior of a panicking goroutine.",
    params: [],
  },
  min: {
    label: "func min[T cmp.Ordered](x T, y ...T) T",
    doc: "Returns the smallest value of a fixed number of arguments.",
    params: [
      { label: "x: T", doc: "First ordered value." },
      { label: "y ...T", doc: "Additional ordered values." },
    ],
    varargPositionalIdx: 1,
  },
  max: {
    label: "func max[T cmp.Ordered](x T, y ...T) T",
    doc: "Returns the largest value of a fixed number of arguments.",
    params: [
      { label: "x: T", doc: "First ordered value." },
      { label: "y ...T", doc: "Additional ordered values." },
    ],
    varargPositionalIdx: 1,
  },

  // fmt
  "fmt.Println": {
    label: "func fmt.Println(a ...any) (n int, err error)",
    doc: "Formats using default formats and writes to standard output followed by a newline.",
    params: [{ label: "a ...any", doc: "Values to format and print." }],
    varargPositionalIdx: 0,
  },
  "fmt.Printf": {
    label: "func fmt.Printf(format string, a ...any) (n int, err error)",
    doc: "Formats according to a format specifier and writes to standard output.",
    params: [
      { label: "format: string", doc: "Format specifier string." },
      { label: "a ...any", doc: "Values matching format verbs." },
    ],
    varargPositionalIdx: 1,
  },
  "fmt.Print": {
    label: "func fmt.Print(a ...any) (n int, err error)",
    doc: "Formats using default formats and writes to standard output.",
    params: [{ label: "a ...any", doc: "Values to print." }],
    varargPositionalIdx: 0,
  },
  "fmt.Sprintf": {
    label: "func fmt.Sprintf(format string, a ...any) string",
    doc: "Formats according to a format specifier and returns the resulting string.",
    params: [
      { label: "format: string", doc: "Format specifier string." },
      { label: "a ...any", doc: "Values matching format verbs." },
    ],
    varargPositionalIdx: 1,
  },
  "fmt.Sprint": {
    label: "func fmt.Sprint(a ...any) string",
    doc: "Formats using default formats and returns the resulting string.",
    params: [{ label: "a ...any", doc: "Values to format." }],
    varargPositionalIdx: 0,
  },
  "fmt.Errorf": {
    label: "func fmt.Errorf(format string, a ...any) error",
    doc: "Formats according to a format specifier and returns the string as an error.",
    params: [
      { label: "format: string", doc: "Format string." },
      { label: "a ...any", doc: "Values matching format verbs." },
    ],
    varargPositionalIdx: 1,
  },
  "fmt.Scan": {
    label: "func fmt.Scan(a ...any) (n int, err error)",
    doc: "Scans text read from standard input, storing values into arguments.",
    params: [{ label: "a ...any", doc: "Pointers to variables receiving scanned values." }],
    varargPositionalIdx: 0,
  },
  "fmt.Scanf": {
    label: "func fmt.Scanf(format string, a ...any) (n int, err error)",
    doc: "Scans text from standard input according to a format string.",
    params: [
      { label: "format: string", doc: "Format specifier string." },
      { label: "a ...any", doc: "Pointers to variables receiving scanned values." },
    ],
    varargPositionalIdx: 1,
  },
  "fmt.Scanln": {
    label: "func fmt.Scanln(a ...any) (n int, err error)",
    doc: "Scans text from standard input, stopping at newline.",
    params: [{ label: "a ...any", doc: "Pointers to variables receiving scanned values." }],
    varargPositionalIdx: 0,
  },

  // strings
  "strings.Split": {
    label: "func strings.Split(s, sep string) []string",
    doc: "Slices s into all substrings separated by sep.",
    params: [
      { label: "s: string", doc: "Source string." },
      { label: "sep: string", doc: "Delimiter substring." },
    ],
  },
  "strings.Join": {
    label: "func strings.Join(elems []string, sep string) string",
    doc: "Concatenates elements of elems separated by sep.",
    params: [
      { label: "elems: []string", doc: "Slice of strings to join." },
      { label: "sep: string", doc: "Separator string placed between elements." },
    ],
  },
  "strings.Contains": {
    label: "func strings.Contains(s, substr string) bool",
    doc: "Reports whether substr is within s.",
    params: [
      { label: "s: string", doc: "Target string to search within." },
      { label: "substr: string", doc: "Substring to look for." },
    ],
  },
  "strings.HasPrefix": {
    label: "func strings.HasPrefix(s, prefix string) bool",
    doc: "Reports whether string s begins with prefix.",
    params: [
      { label: "s: string", doc: "Target string." },
      { label: "prefix: string", doc: "Prefix to check." },
    ],
  },
  "strings.HasSuffix": {
    label: "func strings.HasSuffix(s, suffix string) bool",
    doc: "Reports whether string s ends with suffix.",
    params: [
      { label: "s: string", doc: "Target string." },
      { label: "suffix: string", doc: "Suffix to check." },
    ],
  },
  "strings.ReplaceAll": {
    label: "func strings.ReplaceAll(s, old, new string) string",
    doc: "Returns copy of s with all occurrences of old replaced by new.",
    params: [
      { label: "s: string", doc: "Original string." },
      { label: "old: string", doc: "Pattern to replace." },
      { label: "new: string", doc: "Replacement string." },
    ],
  },
  "strings.TrimSpace": {
    label: "func strings.TrimSpace(s string) string",
    doc: "Returns string with leading and trailing whitespace removed.",
    params: [{ label: "s: string", doc: "Input string." }],
  },
  "strings.Trim": {
    label: "func strings.Trim(s, cutset string) string",
    doc: "Returns string with leading and trailing cutset characters removed.",
    params: [
      { label: "s: string", doc: "Input string." },
      { label: "cutset: string", doc: "Characters to strip from ends." },
    ],
  },

  // strconv
  "strconv.Atoi": {
    label: "func strconv.Atoi(s string) (int, error)",
    doc: "Converts string s to an int.",
    params: [{ label: "s: string", doc: "Numeric string to convert." }],
  },
  "strconv.Itoa": {
    label: "func strconv.Itoa(i int) string",
    doc: "Converts integer i to a base-10 string.",
    params: [{ label: "i: int", doc: "Integer to format." }],
  },
  "strconv.ParseInt": {
    label: "func strconv.ParseInt(s string, base int, bitSize int) (i int64, err error)",
    doc: "Interprets string s in given base and bit size.",
    params: [
      { label: "s: string", doc: "Numeric string." },
      { label: "base: int", doc: "Number base (e.g. 10, 16, 2, or 0)." },
      { label: "bitSize: int", doc: "Integer bit size (0, 8, 16, 32, 64)." },
    ],
  },
  "strconv.ParseFloat": {
    label: "func strconv.ParseFloat(s string, bitSize int) (float64, error)",
    doc: "Converts string s to float64 with specified bit precision.",
    params: [
      { label: "s: string", doc: "Floating point string." },
      { label: "bitSize: int", doc: "Precision (32 or 64)." },
    ],
  },

  // math
  "math.Abs": {
    label: "func math.Abs(x float64) float64",
    doc: "Returns the absolute value of x.",
    params: [{ label: "x: float64", doc: "Number." }],
  },
  "math.Max": {
    label: "func math.Max(x, y float64) float64",
    doc: "Returns the larger of x or y.",
    params: [
      { label: "x: float64", doc: "First number." },
      { label: "y: float64", doc: "Second number." },
    ],
  },
  "math.Min": {
    label: "func math.Min(x, y float64) float64",
    doc: "Returns the smaller of x or y.",
    params: [
      { label: "x: float64", doc: "First number." },
      { label: "y: float64", doc: "Second number." },
    ],
  },
  "math.Pow": {
    label: "func math.Pow(x, y float64) float64",
    doc: "Returns x raised to power y.",
    params: [
      { label: "x: float64", doc: "Base value." },
      { label: "y: float64", doc: "Exponent value." },
    ],
  },
  "math.Sqrt": {
    label: "func math.Sqrt(x float64) float64",
    doc: "Returns the square root of x.",
    params: [{ label: "x: float64", doc: "Non-negative number." }],
  },
  "math.Round": {
    label: "func math.Round(x float64) float64",
    doc: "Returns the nearest integer, rounding half away from zero.",
    params: [{ label: "x: float64", doc: "Floating point number." }],
  },

  // slices
  "slices.Sort": {
    label: "func slices.Sort[S ~[]E, E cmp.Ordered](x S)",
    doc: "Sorts a slice of ordered elements in ascending order.",
    params: [{ label: "x: S", doc: "Slice to sort in place." }],
  },
  "slices.Contains": {
    label: "func slices.Contains[S ~[]E, E comparable](s S, v E) bool",
    doc: "Reports whether element v is in slice s.",
    params: [
      { label: "s: S", doc: "Slice to search." },
      { label: "v: E", doc: "Element to find." },
    ],
  },
  "slices.Index": {
    label: "func slices.Index[S ~[]E, E comparable](s S, v E) int",
    doc: "Returns index of first occurrence of v in s, or -1.",
    params: [
      { label: "s: S", doc: "Slice to search." },
      { label: "v: E", doc: "Element to look for." },
    ],
  },

  // time
  "time.Sleep": {
    label: "func time.Sleep(d time.Duration)",
    doc: "Pauses the current goroutine for at least the duration d.",
    params: [{ label: "d: time.Duration", doc: "Duration to pause." }],
  },
  "time.Since": {
    label: "func time.Since(t time.Time) time.Duration",
    doc: "Returns elapsed time since t.",
    params: [{ label: "t: time.Time", doc: "Starting time instant." }],
  },

  // os
  "os.ReadFile": {
    label: "func os.ReadFile(name string) ([]byte, error)",
    doc: "Reads the named file and returns its contents.",
    params: [{ label: "name: string", doc: "Path to file." }],
  },
  "os.WriteFile": {
    label: "func os.WriteFile(name string, data []byte, perm os.FileMode) error",
    doc: "Writes data to named file with given permissions.",
    params: [
      { label: "name: string", doc: "Path to file." },
      { label: "data: []byte", doc: "Bytes to write." },
      { label: "perm: os.FileMode", doc: "File permission bits (e.g. 0644)." },
    ],
  },
  "os.Open": {
    label: "func os.Open(name string) (*os.File, error)",
    doc: "Opens the named file for reading.",
    params: [{ label: "name: string", doc: "Path to file." }],
  },
  "os.Create": {
    label: "func os.Create(name string) (*os.File, error)",
    doc: "Creates or truncates the named file.",
    params: [{ label: "name: string", doc: "Path to file." }],
  },

  // slices
  "slices.Reverse": {
    label: "func slices.Reverse[S ~[]E, E any](s S)",
    doc: "Reverses the elements of the slice in place.",
    params: [{ label: "s: S", doc: "Slice to reverse." }],
  },
  "slices.Clone": {
    label: "func slices.Clone[S ~[]E, E any](s S) S",
    doc: "Returns a shallow copy of the slice.",
    params: [{ label: "s: S", doc: "Slice to clone." }],
  },
  "slices.Compact": {
    label: "func slices.Compact[S ~[]E, E comparable](s S) S",
    doc: "Replaces consecutive runs of equal elements with a single copy.",
    params: [{ label: "s: S", doc: "Slice to compact." }],
  },
  "slices.Equal": {
    label: "func slices.Equal[S ~[]E, E comparable](s1, s2 S) bool",
    doc: "Reports whether two slices are equal: same length and all elements equal.",
    params: [
      { label: "s1: S", doc: "First slice." },
      { label: "s2: S", doc: "Second slice." },
    ],
  },

  // maps
  "maps.Keys": {
    label: "func maps.Keys[M ~map[K]V, K comparable, V any](m M) []K",
    doc: "Returns the keys of the map m.",
    params: [{ label: "m: M", doc: "Map to extract keys from." }],
  },
  "maps.Values": {
    label: "func maps.Values[M ~map[K]V, K comparable, V any](m M) []V",
    doc: "Returns the values of the map m.",
    params: [{ label: "m: M", doc: "Map to extract values from." }],
  },
  "maps.Clone": {
    label: "func maps.Clone[M ~map[K]V, K comparable, V any](m M) M",
    doc: "Returns a shallow copy of the map.",
    params: [{ label: "m: M", doc: "Map to clone." }],
  },
  "maps.Equal": {
    label: "func maps.Equal[M1, M2 ~map[K]V, K, V comparable](m1 M1, m2 M2) bool",
    doc: "Reports whether two maps contain the same key/value pairs.",
    params: [
      { label: "m1: M1", doc: "First map." },
      { label: "m2: M2", doc: "Second map." },
    ],
  },

  // sort
  "sort.Ints": {
    label: "func sort.Ints(x []int)",
    doc: "Sorts a slice of ints in increasing order.",
    params: [{ label: "x: []int", doc: "Slice of ints to sort." }],
  },
  "sort.Float64s": {
    label: "func sort.Float64s(x []float64)",
    doc: "Sorts a slice of float64s in increasing order.",
    params: [{ label: "x: []float64", doc: "Slice of float64s to sort." }],
  },
  "sort.Strings": {
    label: "func sort.Strings(x []string)",
    doc: "Sorts a slice of strings in increasing order.",
    params: [{ label: "x: []string", doc: "Slice of strings to sort." }],
  },
  "sort.Slice": {
    label: "func sort.Slice(x any, less func(i, j int) bool)",
    doc: "Sorts the slice x given the provided less function.",
    params: [
      { label: "x: any", doc: "Slice to sort." },
      { label: "less: func(i, j int) bool", doc: "Comparator function." },
    ],
  },
  "sort.SliceStable": {
    label: "func sort.SliceStable(x any, less func(i, j int) bool)",
    doc: "Sorts the slice x keeping original order of equal elements.",
    params: [
      { label: "x: any", doc: "Slice to sort." },
      { label: "less: func(i, j int) bool", doc: "Comparator function." },
    ],
  },
  "sort.SearchInts": {
    label: "func sort.SearchInts(a []int, x int) int",
    doc: "Searches for x in a sorted slice of ints and returns the index.",
    params: [
      { label: "a: []int", doc: "Sorted slice of ints." },
      { label: "x: int", doc: "Target value." },
    ],
  },
  "sort.SearchStrings": {
    label: "func sort.SearchStrings(a []string, x string) int",
    doc: "Searches for x in a sorted slice of strings and returns the index.",
    params: [
      { label: "a: []string", doc: "Sorted slice of strings." },
      { label: "x: string", doc: "Target string." },
    ],
  },

  // bufio
  "bufio.NewScanner": {
    label: "func bufio.NewScanner(r io.Reader) *bufio.Scanner",
    doc: "Returns a new Scanner to read from r.",
    params: [{ label: "r: io.Reader", doc: "Reader interface source (e.g. os.Stdin)." }],
  },
  "bufio.NewReader": {
    label: "func bufio.NewReader(rd io.Reader) *bufio.Reader",
    doc: "Returns a new Reader whose buffer has the default size.",
    params: [{ label: "rd: io.Reader", doc: "Reader interface source." }],
  },
  "bufio.NewWriter": {
    label: "func bufio.NewWriter(w io.Writer) *bufio.Writer",
    doc: "Returns a new Writer whose buffer has the default size.",
    params: [{ label: "w: io.Writer", doc: "Writer destination." }],
  },

  // io
  "io.ReadAll": {
    label: "func io.ReadAll(r io.Reader) ([]byte, error)",
    doc: "Reads from r until an error or EOF and returns the data it read.",
    params: [{ label: "r: io.Reader", doc: "Reader to read from." }],
  },
  "io.Copy": {
    label: "func io.Copy(dst io.Writer, src io.Reader) (written int64, err error)",
    doc: "Copies from src to dst until either EOF is reached or an error occurs.",
    params: [
      { label: "dst: io.Writer", doc: "Destination writer." },
      { label: "src: io.Reader", doc: "Source reader." },
    ],
  },

  // json
  "json.Marshal": {
    label: "func json.Marshal(v any) ([]byte, error)",
    doc: "Returns the JSON encoding of v.",
    params: [{ label: "v: any", doc: "Value to encode as JSON." }],
  },
  "json.Unmarshal": {
    label: "func json.Unmarshal(data []byte, v any) error",
    doc: "Parses the JSON-encoded data and stores the result in the value pointed to by v.",
    params: [
      { label: "data: []byte", doc: "JSON byte slice." },
      { label: "v: any", doc: "Pointer to receiving variable or struct." },
    ],
  },

  // http
  "http.Get": {
    label: "func http.Get(url string) (resp *http.Response, err error)",
    doc: "Issues a GET to the specified URL.",
    params: [{ label: "url: string", doc: "URL to send GET request to." }],
  },
  "http.Post": {
    label:
      "func http.Post(url, contentType string, body io.Reader) (resp *http.Response, err error)",
    doc: "Issues a POST to the specified URL.",
    params: [
      { label: "url: string", doc: "Target URL." },
      { label: "contentType: string", doc: "MIME type header." },
      { label: "body: io.Reader", doc: "Request body reader." },
    ],
  },
};

// ---------------------------------------------------------------------------
// 9. Monaco Registration Helper
// ---------------------------------------------------------------------------

function deduplicateSuggestions(
  items: monacoDefault.languages.CompletionItem[],
): monacoDefault.languages.CompletionItem[] {
  const seen = new Set<string>();
  const result: monacoDefault.languages.CompletionItem[] = [];
  for (const item of items) {
    const key = typeof item.label === "string" ? item.label : item.label.label;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function toCompletionItems(
  items: CompletionItemDef[],
  range: monacoDefault.IRange,
): monacoDefault.languages.CompletionItem[] {
  return items.map((item) => ({
    label: item.label,
    kind: item.kind ?? monacoDefault.languages.CompletionItemKind.Property,
    insertText: item.snippet ?? item.label,
    insertTextRules: item.snippet
      ? monacoDefault.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    detail: item.detail,
    documentation: item.documentation,
    range,
  }));
}

export function registerGoCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (!m?.languages) return;

  // -------------------------------------------------------------------------
  // A. Completion Item Provider
  // -------------------------------------------------------------------------
  m.languages.registerCompletionItemProvider("go", {
    triggerCharacters: [".", ":"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: monacoDefault.IRange = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      // Suppress completions if cursor is inside a comment, string, or rune
      if (isInsideGoCommentOrString(model, position)) {
        return { suggestions: [] };
      }

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeWord = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check if user is typing immediately after a dot (e.g. "fmt.", "strings.", "s.")
      if (textBeforeWord.endsWith(".")) {
        // Prevent member completion on numeric literal dot (e.g. "100.", "1.0.", "0x10.")
        if (/(?:\b\d+(?:\.\d+)?|\b0x[0-9a-fA-F]+)\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        // Prevent member completion if dot is preceded by operators, empty start of line, or commas
        if (/(?:^|[=+\-*/%&|^~<>,:;([{!])\s*\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        const targetExpr = textBeforeWord.slice(0, -1).trim();
        const pkgMatch = targetExpr.match(/([a-zA-Z_]\w*)$/);
        const pkgOrVarName = pkgMatch ? pkgMatch[1] : "";

        // 1. Standard Library Package match: fmt., strings., strconv., math., etc.
        const pkg = GO_PACKAGES.find((p) => p.name === pkgOrVarName);
        if (pkg) {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(pkg.members, range)),
          };
        }

        // 2. Type-inferred receiver methods & fields
        const inferredType = inferGoType(model, position, targetExpr);
        const normalizedType = normalizeGoTypeName(inferredType);

        if (normalizedType === "bufio.Scanner" || inferredType === "*bufio.Scanner") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(SCANNER_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "strings.Builder" || inferredType === "*strings.Builder") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(BUILDER_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "sync.WaitGroup" || inferredType === "*sync.WaitGroup") {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems(WAITGROUP_INSTANCE_MEMBERS, range),
            ),
          };
        }
        if (normalizedType === "sync.Mutex" || inferredType === "*sync.Mutex") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(MUTEX_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "sync.RWMutex" || inferredType === "*sync.RWMutex") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(RWMUTEX_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "time.Time") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(TIME_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "os.File" || inferredType === "*os.File") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(OS_FILE_INSTANCE_MEMBERS, range)),
          };
        }
        if (normalizedType === "error") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(ERROR_INSTANCE_MEMBERS, range)),
          };
        }

        // 3. User Defined Struct fields and methods
        const docSymbols = extractGoDocumentSymbols(model);
        const userStruct = docSymbols.structs.get(normalizedType);
        if (userStruct) {
          const structMembers = [...userStruct.fields, ...userStruct.methods];
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(structMembers, range)),
          };
        }

        return { suggestions: [] };
      }

      // Not typing after a dot: provide top-level identifiers, keywords, types, builtins, packages, snippets, and local variables in scope
      const suggestions: CompletionItemDef[] = [
        ...GO_KEYWORDS,
        ...BUILTIN_TYPES,
        ...BUILTIN_CONSTANTS,
        ...BUILTIN_FUNCTIONS,
        ...GO_SNIPPETS,
        ...GO_PACKAGES.map((p) => ({
          label: p.name,
          kind: monacoDefault.languages.CompletionItemKind.Module,
          detail: `package ${p.name}`,
          documentation: p.doc,
        })),
      ];

      // Add local variables visible in current scope
      const scopes = computeGoScopes(model, position.lineNumber);
      const docSymbols = extractGoDocumentSymbols(model);

      // User functions
      for (const fdef of docSymbols.functions.values()) {
        suggestions.push(fdef);
      }
      // User structs
      for (const sname of docSymbols.structs.keys()) {
        suggestions.push({
          label: sname,
          kind: monacoDefault.languages.CompletionItemKind.Struct,
          detail: `type ${sname} struct`,
          documentation: `User defined struct ${sname}`,
        });
      }

      // Scan backwards for local variables in scope
      const seenVars = new Set<string>();
      for (let ln = position.lineNumber; ln >= 1; ln--) {
        if (!isGoLineVisible(scopes, ln, position.lineNumber)) continue;

        const rawLine = model.getLineContent(ln);
        const line = maskGoCommentsAndStrings(rawLine).trim();
        if (!line) continue;

        // := declarations
        const shortMatch = line.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*:=/);
        if (shortMatch) {
          const vnames = shortMatch[1].split(",").map((v) => v.trim());
          for (const vn of vnames) {
            if (!GO_KEYWORD_SET.has(vn) && !seenVars.has(vn)) {
              seenVars.add(vn);
              suggestions.push({
                label: vn,
                kind: monacoDefault.languages.CompletionItemKind.Variable,
                detail: `var ${vn}`,
                documentation: "Local variable",
              });
            }
          }
        }

        // var declarations
        const varMatch = line.match(
          /\bvar\s+([a-zA-Z_]\w*)\s+([*]?(?:\[\])?[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)/,
        );
        if (varMatch) {
          const vn = varMatch[1];
          const vt = varMatch[2];
          if (!GO_KEYWORD_SET.has(vn) && !seenVars.has(vn)) {
            seenVars.add(vn);
            suggestions.push({
              label: vn,
              kind: monacoDefault.languages.CompletionItemKind.Variable,
              detail: `var ${vn} ${vt}`,
              documentation: "Variable",
            });
          }
        }

        // parameters (with multiline accumulation and grouped parameter support)
        let funcLine = line;
        if (/\bfunc\b/.test(line) && !line.includes(")")) {
          for (let fwd = ln + 1; fwd <= Math.min(model.getLineCount(), ln + 10); fwd++) {
            const nextL = maskGoCommentsAndStrings(model.getLineContent(fwd)).trim();
            funcLine += " " + nextL;
            if (nextL.includes(")")) break;
          }
        }

        const paramMatch = funcLine.match(/\bfunc\s*(?:\([^)]*\)\s*)?[A-Za-z_]\w*\s*\(([^)]*)\)/);
        if (paramMatch && paramMatch[1]) {
          const parsed = parseGoParams(paramMatch[1]);
          for (const p of parsed) {
            if (!GO_KEYWORD_SET.has(p.name) && !seenVars.has(p.name)) {
              seenVars.add(p.name);
              suggestions.push({
                label: p.name,
                kind: monacoDefault.languages.CompletionItemKind.Variable,
                detail: p.type ? `${p.name}: ${p.type}` : p.name,
                documentation: "Parameter",
              });
            }
          }
        }
      }

      return {
        suggestions: deduplicateSuggestions(toCompletionItems(suggestions, range)),
      };
    },
  });

  // -------------------------------------------------------------------------
  // B. Hover Provider
  // -------------------------------------------------------------------------
  m.languages.registerHoverProvider("go", {
    provideHover(model, position) {
      if (isInsideGoCommentOrString(model, position)) {
        return null;
      }

      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const name = word.word;

      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check if preceded by package name e.g. "fmt.Println"
      const pkgCallMatch = textBefore.match(/(?:^|[^\w.])([a-zA-Z_]\w*)\.$/);
      if (pkgCallMatch) {
        const pkgName = pkgCallMatch[1];
        const pkg = GO_PACKAGES.find((p) => p.name === pkgName);
        if (pkg) {
          const member = pkg.members.find((m) => m.label === name);
          if (member) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${member.detail ?? member.label}\n\`\`\`` },
                { value: member.documentation ?? "" },
              ],
            };
          }
        }

        // Check if preceded by a struct instance
        const inferredType = inferGoType(model, position, textBefore.slice(0, -1));
        const normalizedType = normalizeGoTypeName(inferredType);

        if (normalizedType === "bufio.Scanner" || inferredType === "*bufio.Scanner") {
          const item = SCANNER_INSTANCE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${item.detail}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }

        if (normalizedType === "strings.Builder" || inferredType === "*strings.Builder") {
          const item = BUILDER_INSTANCE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${item.detail}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }

        if (normalizedType === "sync.WaitGroup" || inferredType === "*sync.WaitGroup") {
          const item = WAITGROUP_INSTANCE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${item.detail}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }

        if (normalizedType === "sync.Mutex" || inferredType === "*sync.Mutex") {
          const item = MUTEX_INSTANCE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${item.detail}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }

        if (normalizedType === "time.Time") {
          const item = TIME_INSTANCE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${item.detail}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }

        // User defined struct member hover
        const docSymbols = extractGoDocumentSymbols(model);
        const sDef = docSymbols.structs.get(normalizedType);
        if (sDef) {
          const mem = [...sDef.fields, ...sDef.methods].find((m) => m.label === name);
          if (mem) {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`go\n${mem.detail ?? mem.label}\n\`\`\`` },
                { value: mem.documentation ?? "" },
              ],
            };
          }
        }

        return null;
      }

      // Not preceded by dot: check top-level packages, built-in functions, keywords, types, constants
      if (!textBefore.endsWith(".")) {
        // Standard package
        const pkgMatch = GO_PACKAGES.find((p) => p.name === name);
        if (pkgMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\npackage ${pkgMatch.name}\n\`\`\`` },
              { value: pkgMatch.doc },
            ],
          };
        }

        // Built-in function
        const builtinFunc = BUILTIN_FUNCTIONS.find((f) => f.label === name);
        if (builtinFunc) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\n${builtinFunc.detail ?? builtinFunc.label}\n\`\`\`` },
              { value: builtinFunc.documentation ?? "" },
            ],
          };
        }

        // Built-in type
        const builtinType = BUILTIN_TYPES.find((t) => t.label === name);
        if (builtinType) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\n${builtinType.detail ?? builtinType.label}\n\`\`\`` },
              { value: builtinType.documentation ?? "" },
            ],
          };
        }

        // Built-in constant
        const builtinConst = BUILTIN_CONSTANTS.find((c) => c.label === name);
        if (builtinConst) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\n${builtinConst.detail ?? builtinConst.label}\n\`\`\`` },
              { value: builtinConst.documentation ?? "" },
            ],
          };
        }

        // Keyword
        const keywordMatch = GO_KEYWORDS.find((k) => k.label === name);
        if (keywordMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\nkeyword ${keywordMatch.label}\n\`\`\`` },
              { value: keywordMatch.documentation ?? "" },
            ],
          };
        }

        // User functions and structs
        const docSymbols = extractGoDocumentSymbols(model);
        const userFn = docSymbols.functions.get(name);
        if (userFn) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\n${userFn.detail ?? userFn.label}\n\`\`\`` },
              { value: userFn.documentation ?? "" },
            ],
          };
        }

        const userStruct = docSymbols.structs.get(name);
        if (userStruct) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\ntype ${userStruct.name} struct\n\`\`\`` },
              {
                value: `User defined struct with ${userStruct.fields.length} field(s) and ${userStruct.methods.length} method(s).`,
              },
            ],
          };
        }

        // Local variable hover
        const inferredVarType = inferGoType(model, position, name);
        if (inferredVarType && inferredVarType !== "unknown") {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`go\nvar ${name} ${inferredVarType}\n\`\`\`` },
              { value: `Local variable \`${name}\` of type \`${inferredVarType}\`` },
            ],
          };
        }
      }

      return null;
    },
  });

  // -------------------------------------------------------------------------
  // C. Signature Help Provider
  // -------------------------------------------------------------------------
  m.languages.registerSignatureHelpProvider("go", {
    signatureHelpTriggerCharacters: ["(", ","],
    signatureHelpRetriggerCharacters: [","],
    provideSignatureHelp(model, position) {
      if (isInsideGoCommentOrString(model, position)) {
        return null;
      }

      // Collect text up to the cursor with comments and strings masked
      const fullText = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const maskedText = maskGoCommentsAndStrings(fullText);

      // Stack parsing tracking '(', '[', '{'
      const blockStack: {
        char: string;
        openIdx: number;
        argCount: number;
        lastCommaIdx: number;
      }[] = [];

      for (let i = 0; i < maskedText.length; i++) {
        const ch = maskedText[i];
        if (ch === "(") {
          blockStack.push({ char: "(", openIdx: i, argCount: 0, lastCommaIdx: i });
        } else if (ch === ")") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
            blockStack.pop();
          }
        } else if (ch === "[") {
          blockStack.push({ char: "[", openIdx: i, argCount: 0, lastCommaIdx: i });
        } else if (ch === "]") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "[") {
            blockStack.pop();
          }
        } else if (ch === "{") {
          blockStack.push({ char: "{", openIdx: i, argCount: 0, lastCommaIdx: i });
        } else if (ch === "}") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "{") {
            blockStack.pop();
          }
        } else if (ch === ",") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
            blockStack[blockStack.length - 1].argCount++;
            blockStack[blockStack.length - 1].lastCommaIdx = i;
          }
        }
      }

      // Find the innermost active '(' call
      let activeCall: {
        char: string;
        openIdx: number;
        argCount: number;
        lastCommaIdx: number;
      } | null = null;
      for (let i = blockStack.length - 1; i >= 0; i--) {
        if (blockStack[i].char === "(") {
          activeCall = blockStack[i];
          break;
        }
      }

      if (!activeCall) return null;

      const callPrefix = maskedText.slice(0, activeCall.openIdx).trimEnd();

      // Guardrail: Exclude control-flow statements like "for (", "if (", "switch (", "func ("
      if (/\b(?:if|for|switch|select|go|defer|return|func)\s*$/.test(callPrefix)) {
        return null;
      }

      // Extract call target: e.g. "fmt.Println", "make", "append", "strings.Split", "s.Scan", "calc.Add"
      const match = callPrefix.match(/([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?)$/);
      if (!match) return null;

      const callTarget = match[1];

      // Check known standard signatures
      let sigInfo = GO_SIGNATURES[callTarget];

      // Check method call on receiver/variable (e.g. "s.Scan", "wg.Add", "calc.Add")
      if (!sigInfo && callTarget.includes(".")) {
        const dotIdx = callTarget.indexOf(".");
        const receiverExpr = callTarget.slice(0, dotIdx);
        const methodName = callTarget.slice(dotIdx + 1);

        const inferredType = inferGoType(model, position, receiverExpr);
        const normalizedType = normalizeGoTypeName(inferredType);

        let memberDef: CompletionItemDef | undefined;
        if (normalizedType === "bufio.Scanner" || inferredType === "*bufio.Scanner") {
          memberDef = SCANNER_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "strings.Builder" || inferredType === "*strings.Builder") {
          memberDef = BUILDER_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "sync.WaitGroup" || inferredType === "*sync.WaitGroup") {
          memberDef = WAITGROUP_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "sync.Mutex" || inferredType === "*sync.Mutex") {
          memberDef = MUTEX_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "sync.RWMutex" || inferredType === "*sync.RWMutex") {
          memberDef = RWMUTEX_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "time.Time") {
          memberDef = TIME_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "os.File" || inferredType === "*os.File") {
          memberDef = OS_FILE_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else if (normalizedType === "error") {
          memberDef = ERROR_INSTANCE_MEMBERS.find((m) => m.label === methodName);
        } else {
          // Check user defined struct methods
          const docSymbols = extractGoDocumentSymbols(model);
          const userStruct = docSymbols.structs.get(normalizedType);
          if (userStruct) {
            memberDef = userStruct.methods.find((m) => m.label === methodName);
          }
        }

        if (memberDef) {
          const pMatch = memberDef.detail?.match(new RegExp(`\\b${methodName}\\s*\\(([^)]*)\\)`));
          const rawParams = pMatch ? pMatch[1].trim() : "";
          const parsed = parseGoParams(rawParams);
          let varargIdx: number | undefined;
          const params: SignatureParam[] = parsed.map((p, idx) => {
            if (p.type.includes("...") || p.type.startsWith("...")) varargIdx = idx;
            return {
              label: p.type ? `${p.name}: ${p.type}` : p.name,
              doc: p.type ? `${p.name} (${p.type})` : p.name,
            };
          });

          sigInfo = {
            label: memberDef.detail ?? memberDef.label,
            doc: memberDef.documentation ?? "",
            params,
            varargPositionalIdx: varargIdx,
          };
        }
      }

      // Check user defined standalone function
      if (!sigInfo && !callTarget.includes(".")) {
        const docSymbols = extractGoDocumentSymbols(model);
        const userFn = docSymbols.functions.get(callTarget);
        if (userFn) {
          const pMatch = userFn.detail?.match(new RegExp(`\\b${callTarget}\\s*\\(([^)]*)\\)`));
          const rawParams = pMatch ? pMatch[1].trim() : "";
          const parsed = parseGoParams(rawParams);
          let varargIdx: number | undefined;
          const params: SignatureParam[] = parsed.map((p, idx) => {
            if (p.type.includes("...") || p.type.startsWith("...")) varargIdx = idx;
            return {
              label: p.type ? `${p.name}: ${p.type}` : p.name,
              doc: p.type ? `${p.name} (${p.type})` : p.name,
            };
          });

          sigInfo = {
            label: userFn.detail ?? userFn.label,
            doc: userFn.documentation ?? "",
            params,
            varargPositionalIdx: varargIdx,
          };
        }
      }

      if (!sigInfo) return null;

      let activeParameter = activeCall.argCount;

      // Varargs parameter handling
      if (sigInfo.varargPositionalIdx !== undefined) {
        if (activeParameter >= sigInfo.varargPositionalIdx) {
          activeParameter = sigInfo.varargPositionalIdx;
        }
      }

      const safeActiveParam = Math.min(activeParameter, Math.max(0, sigInfo.params.length - 1));

      return {
        value: {
          signatures: [
            {
              label: sigInfo.label,
              documentation: sigInfo.doc,
              parameters: sigInfo.params.map((p) => ({
                label: p.label,
                documentation: p.doc,
              })),
            },
          ],
          activeSignature: 0,
          activeParameter: safeActiveParam,
        },
        dispose: () => {},
      };
    },
  });
}
