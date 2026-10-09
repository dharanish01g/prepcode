import * as monacoDefault from "monaco-editor";

type Monaco = typeof monacoDefault;

interface MethodItem {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  snippet?: string;
  detail?: string;
  documentation?: string;
}

const CONSOLE_MEMBERS: MethodItem[] = [
  {
    label: "WriteLine",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "WriteLine(${1});",
    detail: "void Console.WriteLine(object? value)",
    documentation:
      "Writes the specified data, followed by the current line terminator, to standard output.",
  },
  {
    label: "Write",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Write(${1});",
    detail: "void Console.Write(object? value)",
    documentation: "Writes the specified data to standard output.",
  },
  {
    label: "ReadLine",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "ReadLine()",
    detail: "string? Console.ReadLine()",
    documentation: "Reads the next line of characters from standard input.",
  },
  {
    label: "ReadKey",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "ReadKey()",
    detail: "ConsoleKeyInfo Console.ReadKey()",
    documentation: "Obtains the next character or function key pressed by the user.",
  },
  {
    label: "Clear",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Clear();",
    detail: "void Console.Clear()",
    documentation: "Clears the console buffer and corresponding display window.",
  },
  {
    label: "ResetColor",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "ResetColor();",
    detail: "void Console.ResetColor()",
    documentation: "Sets the foreground and background console colors to their defaults.",
  },
  {
    label: "ForegroundColor",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "ForegroundColor",
    detail: "ConsoleColor Console.ForegroundColor",
    documentation: "Gets or sets the foreground color of the console.",
  },
  {
    label: "BackgroundColor",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "BackgroundColor",
    detail: "ConsoleColor Console.BackgroundColor",
    documentation: "Gets or sets the background color of the console.",
  },
  {
    label: "Title",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "Title",
    detail: "string Console.Title",
    documentation: "Gets or sets the title to display in the console title bar.",
  },
  {
    label: "Beep",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "Beep();",
    detail: "void Console.Beep()",
    documentation: "Plays the sound of a beep through the console speaker.",
  },
];

const MATH_MEMBERS: MethodItem[] = [
  {
    label: "Abs",
    snippet: "Abs(${1:value})",
    detail: "T Math.Abs(T value)",
    documentation: "Returns the absolute value of a specified number.",
  },
  {
    label: "Max",
    snippet: "Max(${1:val1}, ${2:val2})",
    detail: "T Math.Max(T val1, T val2)",
    documentation: "Returns the larger of two specified numbers.",
  },
  {
    label: "Min",
    snippet: "Min(${1:val1}, ${2:val2})",
    detail: "T Math.Min(T val1, T val2)",
    documentation: "Returns the smaller of two numbers.",
  },
  {
    label: "Pow",
    snippet: "Pow(${1:x}, ${2:y})",
    detail: "double Math.Pow(double x, double y)",
    documentation: "Returns a specified number raised to the specified power.",
  },
  {
    label: "Sqrt",
    snippet: "Sqrt(${1:d})",
    detail: "double Math.Sqrt(double d)",
    documentation: "Returns the square root of a specified number.",
  },
  {
    label: "Round",
    snippet: "Round(${1:a})",
    detail: "double Math.Round(double a)",
    documentation: "Rounds a decimal value to the nearest integral value.",
  },
  {
    label: "Floor",
    snippet: "Floor(${1:d})",
    detail: "double Math.Floor(double d)",
    documentation: "Returns the largest integral value less than or equal to the specified number.",
  },
  {
    label: "Ceiling",
    snippet: "Ceiling(${1:a})",
    detail: "double Math.Ceiling(double a)",
    documentation:
      "Returns the smallest integral value that is greater than or equal to the specified number.",
  },
  {
    label: "Truncate",
    snippet: "Truncate(${1:d})",
    detail: "double Math.Truncate(double d)",
    documentation: "Calculates the integral part of a specified number.",
  },
  {
    label: "Clamp",
    snippet: "Clamp(${1:value}, ${2:min}, ${3:max})",
    detail: "T Math.Clamp(T value, T min, T max)",
    documentation: "Returns value clamped to the inclusive range of min and max.",
  },
  {
    label: "Sin",
    snippet: "Sin(${1:a})",
    detail: "double Math.Sin(double a)",
    documentation: "Returns the sine of the specified angle.",
  },
  {
    label: "Cos",
    snippet: "Cos(${1:d})",
    detail: "double Math.Cos(double d)",
    documentation: "Returns the cosine of the specified angle.",
  },
  {
    label: "Tan",
    snippet: "Tan(${1:a})",
    detail: "double Math.Tan(double a)",
    documentation: "Returns the tangent of the specified angle.",
  },
  {
    label: "Log",
    snippet: "Log(${1:d})",
    detail: "double Math.Log(double d)",
    documentation: "Returns the natural logarithm of a specified number.",
  },
  {
    label: "Log10",
    snippet: "Log10(${1:d})",
    detail: "double Math.Log10(double d)",
    documentation: "Returns the base 10 logarithm of a specified number.",
  },
  {
    label: "Exp",
    snippet: "Exp(${1:d})",
    detail: "double Math.Exp(double d)",
    documentation: "Returns e raised to the specified power.",
  },
  {
    label: "Sign",
    snippet: "Sign(${1:value})",
    detail: "int Math.Sign(T value)",
    documentation: "Returns an integer indicating the sign of a number (-1, 0, or 1).",
  },
  {
    label: "PI",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "PI",
    detail: "const double Math.PI = 3.1415926535897931",
    documentation: "Represents the ratio of the circumference of a circle to its diameter.",
  },
  {
    label: "E",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "E",
    detail: "const double Math.E = 2.7182818284590451",
    documentation: "Represents the natural logarithmic base, specified by the constant, e.",
  },
  {
    label: "Tau",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "Tau",
    detail: "const double Math.Tau = 6.2831853071795862",
    documentation: "Represents the number of radians in one turn (2 * PI).",
  },
];

const CONVERT_MEMBERS: MethodItem[] = [
  {
    label: "ToInt32",
    snippet: "ToInt32(${1:value})",
    detail: "int Convert.ToInt32(object? value)",
    documentation: "Converts a specified value to a 32-bit signed integer.",
  },
  {
    label: "ToInt64",
    snippet: "ToInt64(${1:value})",
    detail: "long Convert.ToInt64(object? value)",
    documentation: "Converts a specified value to a 64-bit signed integer.",
  },
  {
    label: "ToDouble",
    snippet: "ToDouble(${1:value})",
    detail: "double Convert.ToDouble(object? value)",
    documentation: "Converts a specified value to a double-precision floating-point number.",
  },
  {
    label: "ToString",
    snippet: "ToString(${1:value})",
    detail: "string? Convert.ToString(object? value)",
    documentation: "Converts a specified value to its equivalent string representation.",
  },
  {
    label: "ToBoolean",
    snippet: "ToBoolean(${1:value})",
    detail: "bool Convert.ToBoolean(object? value)",
    documentation: "Converts a specified value to an equivalent Boolean value.",
  },
  {
    label: "ToChar",
    snippet: "ToChar(${1:value})",
    detail: "char Convert.ToChar(object? value)",
    documentation: "Converts a specified value to a Unicode character.",
  },
  {
    label: "ToByte",
    snippet: "ToByte(${1:value})",
    detail: "byte Convert.ToByte(object? value)",
    documentation: "Converts a specified value to an 8-bit unsigned integer.",
  },
  {
    label: "ToDecimal",
    snippet: "ToDecimal(${1:value})",
    detail: "decimal Convert.ToDecimal(object? value)",
    documentation: "Converts a specified value to a decimal number.",
  },
  {
    label: "ToSingle",
    snippet: "ToSingle(${1:value})",
    detail: "float Convert.ToSingle(object? value)",
    documentation: "Converts a specified value to a single-precision floating-point number.",
  },
];

const STRING_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "IsNullOrEmpty",
    snippet: "IsNullOrEmpty(${1:value})",
    detail: "bool string.IsNullOrEmpty(string? value)",
    documentation: "Indicates whether the specified string is null or an empty string.",
  },
  {
    label: "IsNullOrWhiteSpace",
    snippet: "IsNullOrWhiteSpace(${1:value})",
    detail: "bool string.IsNullOrWhiteSpace(string? value)",
    documentation:
      "Indicates whether a specified string is null, empty, or consists only of white-space characters.",
  },
  {
    label: "Join",
    snippet: 'Join("${1:, }", ${2:values})',
    detail: "string string.Join(string separator, IEnumerable<T> values)",
    documentation: "Concatenates the elements of an object array, using the specified separator.",
  },
  {
    label: "Concat",
    snippet: "Concat(${1:str0}, ${2:str1})",
    detail: "string string.Concat(string? str0, string? str1)",
    documentation: "Concatenates one or more instances of String.",
  },
  {
    label: "Format",
    snippet: 'Format("${1:{0}}", ${2:args})',
    detail: "string string.Format(string format, params object?[] args)",
    documentation: "Replaces format items with string representation of corresponding objects.",
  },
  {
    label: "Compare",
    snippet: "Compare(${1:strA}, ${2:strB})",
    detail: "int string.Compare(string? strA, string? strB)",
    documentation: "Compares two specified String objects.",
  },
  {
    label: "Empty",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "Empty",
    detail: 'readonly string string.Empty = ""',
    documentation: "Represents the empty string.",
  },
];

const ARRAY_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "Sort",
    snippet: "Sort(${1:array});",
    detail: "void Array.Sort(Array array)",
    documentation: "Sorts the elements in an entire one-dimensional Array.",
  },
  {
    label: "Reverse",
    snippet: "Reverse(${1:array});",
    detail: "void Array.Reverse(Array array)",
    documentation: "Reverses the sequence of the elements in the entire Array.",
  },
  {
    label: "IndexOf",
    snippet: "IndexOf(${1:array}, ${2:value})",
    detail: "int Array.IndexOf(Array array, object? value)",
    documentation:
      "Searches for the specified object and returns the index of its first occurrence.",
  },
  {
    label: "LastIndexOf",
    snippet: "LastIndexOf(${1:array}, ${2:value})",
    detail: "int Array.LastIndexOf(Array array, object? value)",
    documentation:
      "Searches for the specified object and returns the index of its last occurrence.",
  },
  {
    label: "Clear",
    snippet: "Clear(${1:array}, 0, ${2:length});",
    detail: "void Array.Clear(Array array, int index, int length)",
    documentation: "Sets a range of elements in an array to the default value.",
  },
  {
    label: "Copy",
    snippet: "Copy(${1:sourceArray}, ${2:destinationArray}, ${3:length});",
    detail: "void Array.Copy(Array source, Array dest, int length)",
    documentation: "Copies a range of elements from an Array starting at the first element.",
  },
  {
    label: "Resize",
    snippet: "Resize(ref ${1:array}, ${2:newSize});",
    detail: "void Array.Resize<T>(ref T[]? array, int newSize)",
    documentation: "Changes the number of elements of an array to the specified new size.",
  },
  {
    label: "Empty",
    snippet: "Empty<${1:int}>()",
    detail: "T[] Array.Empty<T>()",
    documentation: "Returns an empty array of the given type.",
  },
];

const COMMON_INSTANCE_MEMBERS: MethodItem[] = [
  {
    label: "ToString",
    snippet: "ToString()",
    detail: "string? object.ToString()",
    documentation: "Returns a string that represents the current object.",
  },
  {
    label: "Equals",
    snippet: "Equals(${1:obj})",
    detail: "bool object.Equals(object? obj)",
    documentation: "Determines whether the specified object is equal to the current object.",
  },
  {
    label: "GetHashCode",
    snippet: "GetHashCode()",
    detail: "int object.GetHashCode()",
    documentation: "Serves as the default hash function.",
  },
  {
    label: "GetType",
    snippet: "GetType()",
    detail: "Type object.GetType()",
    documentation: "Gets the Type of the current instance.",
  },
  {
    label: "Length",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "Length",
    detail: "int Length",
    documentation: "Gets the total number of elements or characters.",
  },
  {
    label: "Count",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "Count",
    detail: "int Count",
    documentation: "Gets the number of elements contained in the collection.",
  },
  {
    label: "Add",
    snippet: "Add(${1:item});",
    detail: "void Add(T item)",
    documentation: "Adds an object to the end of the collection.",
  },
  {
    label: "AddRange",
    snippet: "AddRange(${1:collection});",
    detail: "void AddRange(IEnumerable<T> collection)",
    documentation: "Adds the elements of the specified collection to the end.",
  },
  {
    label: "Clear",
    snippet: "Clear();",
    detail: "void Clear()",
    documentation: "Removes all elements from the collection.",
  },
  {
    label: "Contains",
    snippet: "Contains(${1:item})",
    detail: "bool Contains(T item)",
    documentation: "Determines whether an element is in the collection or string.",
  },
  {
    label: "ContainsKey",
    snippet: "ContainsKey(${1:key})",
    detail: "bool ContainsKey(TKey key)",
    documentation: "Determines whether the dictionary contains the specified key.",
  },
  {
    label: "ContainsValue",
    snippet: "ContainsValue(${1:value})",
    detail: "bool ContainsValue(TValue value)",
    documentation: "Determines whether the dictionary contains a specific value.",
  },
  {
    label: "IndexOf",
    snippet: "IndexOf(${1:item})",
    detail: "int IndexOf(T item)",
    documentation:
      "Searches for the specified object and returns the zero-based index of the first occurrence.",
  },
  {
    label: "LastIndexOf",
    snippet: "LastIndexOf(${1:item})",
    detail: "int LastIndexOf(T item)",
    documentation:
      "Searches for the specified object and returns the zero-based index of the last occurrence.",
  },
  {
    label: "Insert",
    snippet: "Insert(${1:index}, ${2:item});",
    detail: "void Insert(int index, T item)",
    documentation: "Inserts an element into the collection at the specified index.",
  },
  {
    label: "Remove",
    snippet: "Remove(${1:item})",
    detail: "bool Remove(T item)",
    documentation: "Removes the first occurrence of a specific object.",
  },
  {
    label: "RemoveAt",
    snippet: "RemoveAt(${1:index});",
    detail: "void RemoveAt(int index)",
    documentation: "Removes the element at the specified index.",
  },
  {
    label: "Reverse",
    snippet: "Reverse()",
    detail: "void Reverse()",
    documentation: "Reverses the order of the elements.",
  },
  {
    label: "Sort",
    snippet: "Sort()",
    detail: "void Sort()",
    documentation: "Sorts the elements in the collection.",
  },
  {
    label: "ToArray",
    snippet: "ToArray()",
    detail: "T[] ToArray()",
    documentation: "Copies the elements to a new array.",
  },
  {
    label: "ToList",
    snippet: "ToList()",
    detail: "List<T> ToList()",
    documentation: "Creates a List<T> from an IEnumerable<T>.",
  },
  {
    label: "Substring",
    snippet: "Substring(${1:startIndex})",
    detail: "string Substring(int startIndex)",
    documentation: "Retrieves a substring from this instance.",
  },
  {
    label: "Split",
    snippet: "Split(${1:' '})",
    detail: "string[] Split(params char[]? separator)",
    documentation: "Splits a string into substrings based on specified delimiter characters.",
  },
  {
    label: "Trim",
    snippet: "Trim()",
    detail: "string Trim()",
    documentation: "Removes all leading and trailing white-space characters.",
  },
  {
    label: "TrimStart",
    snippet: "TrimStart()",
    detail: "string TrimStart()",
    documentation: "Removes all leading white-space characters.",
  },
  {
    label: "TrimEnd",
    snippet: "TrimEnd()",
    detail: "string TrimEnd()",
    documentation: "Removes all trailing white-space characters.",
  },
  {
    label: "ToLower",
    snippet: "ToLower()",
    detail: "string ToLower()",
    documentation: "Returns a copy of this string converted to lowercase.",
  },
  {
    label: "ToUpper",
    snippet: "ToUpper()",
    detail: "string ToUpper()",
    documentation: "Returns a copy of this string converted to uppercase.",
  },
  {
    label: "StartsWith",
    snippet: "StartsWith(${1:value})",
    detail: "bool StartsWith(string value)",
    documentation: "Determines whether the beginning of this string matches the specified string.",
  },
  {
    label: "EndsWith",
    snippet: "EndsWith(${1:value})",
    detail: "bool EndsWith(string value)",
    documentation: "Determines whether the end of this string matches the specified string.",
  },
  {
    label: "Replace",
    snippet: "Replace(${1:oldValue}, ${2:newValue})",
    detail: "string Replace(string oldValue, string newValue)",
    documentation:
      "Returns a new string in which all occurrences of a specified string are replaced.",
  },
  {
    label: "Where",
    snippet: "Where(${1:x} => ${2:condition})",
    detail: "IEnumerable<T> Where(Func<T, bool> predicate)",
    documentation: "Filters a sequence of values based on a predicate.",
  },
  {
    label: "Select",
    snippet: "Select(${1:x} => ${2:expression})",
    detail: "IEnumerable<TResult> Select(Func<T, TResult> selector)",
    documentation: "Projects each element of a sequence into a new form.",
  },
  {
    label: "First",
    snippet: "First()",
    detail: "T First()",
    documentation: "Returns the first element of a sequence.",
  },
  {
    label: "FirstOrDefault",
    snippet: "FirstOrDefault()",
    detail: "T? FirstOrDefault()",
    documentation: "Returns the first element of a sequence, or a default value if empty.",
  },
  {
    label: "Last",
    snippet: "Last()",
    detail: "T Last()",
    documentation: "Returns the last element of a sequence.",
  },
  {
    label: "Any",
    snippet: "Any()",
    detail: "bool Any()",
    documentation: "Determines whether a sequence contains any elements.",
  },
  {
    label: "All",
    snippet: "All(${1:x} => ${2:condition})",
    detail: "bool All(Func<T, bool> predicate)",
    documentation: "Determines whether all elements of a sequence satisfy a condition.",
  },
  {
    label: "Sum",
    snippet: "Sum()",
    detail: "int Sum()",
    documentation: "Computes the sum of a sequence of numeric values.",
  },
  {
    label: "Min",
    snippet: "Min()",
    detail: "T Min()",
    documentation: "Returns the minimum value in a generic sequence.",
  },
  {
    label: "Max",
    snippet: "Max()",
    detail: "T Max()",
    documentation: "Returns the maximum value in a generic sequence.",
  },
  {
    label: "OrderBy",
    snippet: "OrderBy(${1:x} => ${2:key})",
    detail: "IOrderedEnumerable<T> OrderBy(Func<T, TKey> keySelector)",
    documentation: "Sorts the elements of a sequence in ascending order according to a key.",
  },
  {
    label: "OrderByDescending",
    snippet: "OrderByDescending(${1:x} => ${2:key})",
    detail: "IOrderedEnumerable<T> OrderByDescending(Func<T, TKey> keySelector)",
    documentation: "Sorts the elements of a sequence in descending order according to a key.",
  },
];

const CSHARP_KEYWORDS = [
  "using",
  "namespace",
  "class",
  "interface",
  "struct",
  "record",
  "enum",
  "public",
  "private",
  "protected",
  "internal",
  "static",
  "readonly",
  "const",
  "abstract",
  "virtual",
  "override",
  "sealed",
  "void",
  "int",
  "string",
  "bool",
  "double",
  "float",
  "char",
  "long",
  "short",
  "byte",
  "sbyte",
  "uint",
  "ulong",
  "ushort",
  "decimal",
  "object",
  "var",
  "dynamic",
  "if",
  "else",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "return",
  "for",
  "foreach",
  "while",
  "do",
  "in",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "this",
  "base",
  "null",
  "true",
  "false",
  "async",
  "await",
  "yield",
  "get",
  "set",
  "init",
  "out",
  "ref",
  "is",
  "as",
  "typeof",
  "sizeof",
];

const CSHARP_TYPES = [
  {
    name: "Console",
    doc: "Represents standard input, output, and error streams for console applications.",
  },
  {
    name: "Math",
    doc: "Provides constants and static methods for trigonometric, logarithmic, and mathematical functions.",
  },
  { name: "Convert", doc: "Converts a base data type to another base data type." },
  { name: "String", doc: "Represents text as a sequence of UTF-16 code units." },
  { name: "Int32", doc: "Represents a 32-bit signed integer." },
  { name: "Int64", doc: "Represents a 64-bit signed integer." },
  { name: "Double", doc: "Represents a double-precision floating-point number." },
  { name: "Boolean", doc: "Represents a Boolean (true or false) value." },
  { name: "Char", doc: "Represents a character as a UTF-16 code unit." },
  {
    name: "Array",
    doc: "Provides methods for creating, manipulating, searching, and sorting arrays.",
  },
  {
    name: "List",
    doc: "Represents a strongly typed list of objects that can be accessed by index.",
  },
  { name: "Dictionary", doc: "Represents a collection of keys and values." },
  { name: "HashSet", doc: "Represents a set of values." },
  { name: "Queue", doc: "Represents a first-in, first-out collection of objects." },
  {
    name: "Stack",
    doc: "Represents a simple last-in-first-out (LIFO) non-generic collection of objects.",
  },
  {
    name: "DateTime",
    doc: "Represents an instant in time, typically expressed as a date and time of day.",
  },
  { name: "TimeSpan", doc: "Represents a time interval." },
  { name: "StringBuilder", doc: "Represents a mutable string of characters." },
  {
    name: "File",
    doc: "Provides static methods for the creation, copying, deletion, moving, and opening of a single file.",
  },
  {
    name: "Directory",
    doc: "Exposes static methods for creating, moving, and enumerating through directories and subdirectories.",
  },
  {
    name: "Path",
    doc: "Performs operations on String instances that contain file or directory path information.",
  },
  { name: "Task", doc: "Represents an asynchronous operation." },
  { name: "Thread", doc: "Creates and controls a thread, sets its priority, and gets its status." },
  { name: "Exception", doc: "Represents errors that occur during application execution." },
  {
    name: "Environment",
    doc: "Provides information about, and means to manipulate, the current environment and platform.",
  },
  { name: "Random", doc: "Represents a pseudo-random number generator." },
  { name: "Regex", doc: "Represents an immutable regular expression." },
  { name: "ConsoleKey", doc: "Specifies the standard keys on a console keyboard." },
  {
    name: "ConsoleColor",
    doc: "Specifies constants that define foreground and background colors for the console.",
  },
];

const SNIPPETS = [
  {
    label: "cw",
    insertText: "Console.WriteLine(${1});",
    detail: "Console.WriteLine();",
    documentation: "Standard output print line snippet (Visual Studio shortcut)",
  },
  {
    label: "cr",
    insertText: "Console.ReadLine();",
    detail: "Console.ReadLine();",
    documentation: "Standard input read line snippet",
  },
  {
    label: "for",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n    $0\n}",
    detail: "for loop",
    documentation: "Iterates with an index variable from 0 to length.",
  },
  {
    label: "forr",
    insertText: "for (int ${1:i} = ${2:length} - 1; ${1:i} >= 0; ${1:i}--)\n{\n    $0\n}",
    detail: "reverse for loop",
    documentation: "Iterates with an index variable in reverse order.",
  },
  {
    label: "foreach",
    insertText: "foreach (var ${1:item} in ${2:collection})\n{\n    $0\n}",
    detail: "foreach loop",
    documentation: "Iterates through each element in an enumerable collection.",
  },
  {
    label: "while",
    insertText: "while (${1:condition})\n{\n    $0\n}",
    detail: "while loop",
    documentation: "Executes a statement or block until condition is false.",
  },
  {
    label: "do",
    insertText: "do\n{\n    $0\n} while (${1:condition});",
    detail: "do-while loop",
    documentation: "Executes a statement or block once and continues while condition is true.",
  },
  {
    label: "if",
    insertText: "if (${1:condition})\n{\n    $0\n}",
    detail: "if statement",
    documentation: "Conditional execution block.",
  },
  {
    label: "ifelse",
    insertText: "if (${1:condition})\n{\n    $2\n}\nelse\n{\n    $0\n}",
    detail: "if-else statement",
    documentation: "Conditional branch with else fallback.",
  },
  {
    label: "switch",
    insertText:
      "switch (${1:expr})\n{\n    case ${2:value}:\n        $0\n        break;\n    default:\n        break;\n}",
    detail: "switch statement",
    documentation: "Branching statement for multiple cases.",
  },
  {
    label: "class",
    insertText: "class ${1:Program}\n{\n    $0\n}",
    detail: "class declaration",
    documentation: "Defines a new C# class.",
  },
  {
    label: "main",
    insertText: "static void Main(string[] args)\n{\n    $0\n}",
    detail: "Main method",
    documentation: "Standard entry point for a C# program.",
  },
  {
    label: "svm",
    insertText: "static void Main(string[] args)\n{\n    $0\n}",
    detail: "static void Main method",
    documentation: "Standard entry point for a C# program.",
  },
  {
    label: "prop",
    insertText: "public ${1:int} ${2:MyProperty} { get; set; }$0",
    detail: "auto-implemented property",
    documentation: "Declares an auto-implemented C# property.",
  },
  {
    label: "propg",
    insertText: "public ${1:int} ${2:MyProperty} { get; private set; }$0",
    detail: "property with private setter",
    documentation: "Declares an auto-implemented property with private setter.",
  },
  {
    label: "try",
    insertText: "try\n{\n    $1\n}\ncatch (Exception ex)\n{\n    $0\n}",
    detail: "try-catch block",
    documentation: "Structured exception handling block.",
  },
  {
    label: "tryf",
    insertText: "try\n{\n    $1\n}\nfinally\n{\n    $0\n}",
    detail: "try-finally block",
    documentation: "Execution block with cleanup finally guarantee.",
  },
  {
    label: "ctor",
    insertText: "public ${1:Program}()\n{\n    $0\n}",
    detail: "constructor snippet",
    documentation: "Constructor declaration.",
  },
  {
    label: "parse",
    insertText: "int.Parse(${1:Console.ReadLine()})",
    detail: "parse integer from input",
    documentation: "Parses console input string as an integer.",
  },
];

const COMMON_NAMESPACES = [
  "System",
  "System.Collections.Generic",
  "System.IO",
  "System.Linq",
  "System.Text",
  "System.Text.RegularExpressions",
  "System.Threading.Tasks",
];

function toCompletionItems(
  items: MethodItem[],
  range: monacoDefault.IRange,
): monacoDefault.languages.CompletionItem[] {
  return items.map((m) => ({
    label: m.label,
    kind: m.kind ?? monacoDefault.languages.CompletionItemKind.Method,
    insertText: m.snippet ?? m.label,
    insertTextRules: m.snippet
      ? monacoDefault.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    detail: m.detail,
    documentation: m.documentation,
    range,
  }));
}

let isRegistered = false;

/**
 * Registers offline autocomplete suggestions, standard library completions,
 * snippets, and signature assistance for C# in the Monaco Editor.
 */
export function registerCSharpCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (isRegistered) return;
  isRegistered = true;

  // 1. Autocomplete & Suggestions Provider
  m.languages.registerCompletionItemProvider("csharp", {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: monacoDefault.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      // The text on this line preceding the word currently being typed:
      const textBeforeWord = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check if user is typing immediately after a dot (e.g. "Console." or "Console.W")
      if (textBeforeWord.endsWith(".")) {
        // If the token before the dot is a numeric literal (e.g. "5."), do not suggest members
        if (/\b\d+\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        // Find identifier before the dot, handling chains like "System.Console."
        const match = textBeforeWord.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.$/);
        if (!match) {
          return { suggestions: [] };
        }

        const target = match[1].toLowerCase();

        if (target === "system") {
          return {
            suggestions: CSHARP_TYPES.map((t) => ({
              label: t.name,
              kind: m.languages.CompletionItemKind.Class,
              insertText: t.name,
              detail: `class System.${t.name}`,
              documentation: t.doc,
              range,
            })),
          };
        }
        if (target === "console") {
          return { suggestions: toCompletionItems(CONSOLE_MEMBERS, range) };
        }
        if (target === "math") {
          return { suggestions: toCompletionItems(MATH_MEMBERS, range) };
        }
        if (target === "convert") {
          return { suggestions: toCompletionItems(CONVERT_MEMBERS, range) };
        }
        if (target === "string") {
          const allString = [...STRING_STATIC_MEMBERS, ...COMMON_INSTANCE_MEMBERS];
          return { suggestions: toCompletionItems(allString, range) };
        }
        if (target === "array") {
          const allArray = [...ARRAY_STATIC_MEMBERS, ...COMMON_INSTANCE_MEMBERS];
          return { suggestions: toCompletionItems(allArray, range) };
        }

        // Default member access for any object / instance expression:
        return { suggestions: toCompletionItems(COMMON_INSTANCE_MEMBERS, range) };
      }

      // Check if user is typing a `using` statement (e.g. "using ")
      if (textBeforeWord.trim().startsWith("using")) {
        return {
          suggestions: COMMON_NAMESPACES.map((ns) => ({
            label: ns,
            kind: m.languages.CompletionItemKind.Module,
            insertText: `${ns};`,
            detail: `namespace ${ns}`,
            range,
          })),
        };
      }

      // Otherwise: suggest Keywords, Types, and Snippets (Monaco handles document word completions natively)
      const keywordItems: monacoDefault.languages.CompletionItem[] = CSHARP_KEYWORDS.map((kw) => ({
        label: kw,
        kind: m.languages.CompletionItemKind.Keyword,
        insertText: kw,
        detail: `keyword ${kw}`,
        range,
      }));

      const typeItems: monacoDefault.languages.CompletionItem[] = CSHARP_TYPES.map((t) => ({
        label: t.name,
        kind: m.languages.CompletionItemKind.Class,
        insertText: t.name,
        detail: `class System.${t.name}`,
        documentation: t.doc,
        range,
      }));

      const snippetItems: monacoDefault.languages.CompletionItem[] = SNIPPETS.map((s) => {
        let insertText = s.insertText;

        // Context-aware adjustment for "main" / "svm" snippet:
        // If user already typed "static void", "static", or "void", avoid duplicating keywords.
        if (s.label === "main" || s.label === "svm") {
          if (/(?:^|\s)static\s+void$/.test(textBeforeWord)) {
            insertText = "Main(string[] args)\n{\n    $0\n}";
          } else if (/(?:^|\s)static$/.test(textBeforeWord)) {
            insertText = "void Main(string[] args)\n{\n    $0\n}";
          } else if (/(?:^|\s)void$/.test(textBeforeWord)) {
            insertText = "Main(string[] args)\n{\n    $0\n}";
          }
        }

        return {
          label: s.label,
          kind: m.languages.CompletionItemKind.Snippet,
          insertText,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: s.detail,
          documentation: s.documentation,
          range,
        };
      });

      return {
        suggestions: [...snippetItems, ...typeItems, ...keywordItems],
      };
    },
  });

  // 2. Hover Provider: displays method signatures and docs on mouse hover only when properly qualified
  m.languages.registerHoverProvider("csharp", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();
      const name = word.word;

      // Only show Console member docs when preceded by "Console." with a word boundary
      if (/(?:^|[^\w.])(?:System\.)?Console\.$/.test(textBefore)) {
        const consoleMatch = CONSOLE_MEMBERS.find((item) => item.label === name);
        if (consoleMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`csharp\n${consoleMatch.detail ?? consoleMatch.label}\n\`\`\`` },
              { value: consoleMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show Math member docs when preceded by "Math." with a word boundary
      if (/(?:^|[^\w.])(?:System\.)?Math\.$/.test(textBefore)) {
        const mathMatch = MATH_MEMBERS.find((item) => item.label === name);
        if (mathMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`csharp\n${mathMatch.detail ?? mathMatch.label}\n\`\`\`` },
              { value: mathMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show Convert member docs when preceded by "Convert." with a word boundary
      if (/(?:^|[^\w.])(?:System\.)?Convert\.$/.test(textBefore)) {
        const convertMatch = CONVERT_MEMBERS.find((item) => item.label === name);
        if (convertMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`csharp\n${convertMatch.detail ?? convertMatch.label}\n\`\`\`` },
              { value: convertMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show Class docs when hovering directly on the type name or preceded by System.
      if (!textBefore.endsWith(".") || /(?:^|[^\w.])System\.$/.test(textBefore)) {
        const typeMatch = CSHARP_TYPES.find((t) => t.name === name);
        if (typeMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`csharp\nclass System.${typeMatch.name}\n\`\`\`` },
              { value: typeMatch.doc },
            ],
          };
        }
      }

      return null;
    },
  });

  // 3. Signature Help Provider: shows parameter hints for known qualified calls and correctly handles nested parens & string literals
  m.languages.registerSignatureHelpProvider("csharp", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, position.column - 1);

      // Parse parentheses and parameters with string quote awareness
      interface CallContext {
        target: string;
        paramIndex: number;
      }

      const stack: CallContext[] = [];
      let inQuote: "'" | '"' | null = null;
      let isEscaped = false;

      for (let i = 0; i < textBefore.length; i++) {
        const ch = textBefore[i];

        if (inQuote) {
          if (isEscaped) {
            isEscaped = false;
          } else if (ch === "\\") {
            isEscaped = true;
          } else if (ch === inQuote) {
            inQuote = null;
          }
          continue;
        }

        if (ch === '"' || ch === "'") {
          inQuote = ch;
          continue;
        }

        if (ch === "(") {
          const textPrior = textBefore.slice(0, i).trimEnd();
          const targetMatch = textPrior.match(/([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?)$/);
          stack.push({
            target: targetMatch ? targetMatch[1] : "",
            paramIndex: 0,
          });
        } else if (ch === ")") {
          stack.pop();
        } else if (ch === ",") {
          if (stack.length > 0) {
            stack[stack.length - 1].paramIndex++;
          }
        }
      }

      const activeCall = stack[stack.length - 1];
      if (!activeCall || !activeCall.target) return null;

      const callTarget = activeCall.target;
      const activeParameter = activeCall.paramIndex;

      interface CSharpSig {
        label: string;
        doc: string;
        params: { label: string; doc: string }[];
      }

      const signaturesMap: Record<string, CSharpSig> = {
        "Console.WriteLine": {
          label: "void Console.WriteLine(object? value)",
          doc: "Writes the specified value to standard output followed by a line terminator.",
          params: [{ label: "value", doc: "The value to write." }],
        },
        "Console.Write": {
          label: "void Console.Write(object? value)",
          doc: "Writes the specified value to standard output.",
          params: [{ label: "value", doc: "The value to write." }],
        },
        "Console.ReadLine": {
          label: "string? Console.ReadLine()",
          doc: "Reads the next line of characters from standard input.",
          params: [],
        },
        "Math.Abs": {
          label: "T Math.Abs(T value)",
          doc: "Returns the absolute value of a number.",
          params: [{ label: "value", doc: "A number whose absolute value is to be found." }],
        },
        "Math.Max": {
          label: "T Math.Max(T val1, T val2)",
          doc: "Returns the larger of two numbers.",
          params: [
            { label: "val1", doc: "The first of two values." },
            { label: "val2", doc: "The second of two values." },
          ],
        },
        "Math.Min": {
          label: "T Math.Min(T val1, T val2)",
          doc: "Returns the smaller of two numbers.",
          params: [
            { label: "val1", doc: "The first of two values." },
            { label: "val2", doc: "The second of two values." },
          ],
        },
        "Math.Pow": {
          label: "double Math.Pow(double x, double y)",
          doc: "Returns a specified number raised to the specified power.",
          params: [
            { label: "x", doc: "A double to be raised to a power." },
            { label: "y", doc: "A double that specifies a power." },
          ],
        },
        "Math.Sqrt": {
          label: "double Math.Sqrt(double d)",
          doc: "Returns the square root of a specified number.",
          params: [{ label: "d", doc: "The number whose square root is to be found." }],
        },
        "Math.Round": {
          label: "double Math.Round(double a)",
          doc: "Rounds a value to the nearest integral value.",
          params: [{ label: "a", doc: "A double-precision floating-point number to be rounded." }],
        },
        "Convert.ToInt32": {
          label: "int Convert.ToInt32(object? value)",
          doc: "Converts a value to a 32-bit signed integer.",
          params: [{ label: "value", doc: "The value to convert." }],
        },
        "int.Parse": {
          label: "int int.Parse(string s)",
          doc: "Converts the string representation of a number to its 32-bit signed integer equivalent.",
          params: [{ label: "s", doc: "A string containing a number to convert." }],
        },
        "Int32.Parse": {
          label: "int int.Parse(string s)",
          doc: "Converts the string representation of a number to its 32-bit signed integer equivalent.",
          params: [{ label: "s", doc: "A string containing a number to convert." }],
        },
        "double.Parse": {
          label: "double double.Parse(string s)",
          doc: "Converts the string representation of a number to its double-precision floating-point equivalent.",
          params: [{ label: "s", doc: "A string containing a number to convert." }],
        },
        "Double.Parse": {
          label: "double double.Parse(string s)",
          doc: "Converts the string representation of a number to its double-precision floating-point equivalent.",
          params: [{ label: "s", doc: "A string containing a number to convert." }],
        },
      };

      const sigInfo =
        signaturesMap[callTarget] || signaturesMap[callTarget.split(".").slice(-2).join(".")];
      if (!sigInfo) return null;

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
          activeParameter: Math.min(activeParameter, Math.max(0, sigInfo.params.length - 1)),
        },
        dispose: () => {},
      };
    },
  });
}
