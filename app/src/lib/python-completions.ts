import * as monacoDefault from "monaco-editor";

type Monaco = typeof monacoDefault;

interface CompletionItemDef {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  snippet?: string;
  detail?: string;
  documentation?: string;
}

const BUILTIN_FUNCTIONS: CompletionItemDef[] = [
  {
    label: "print",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "print(${1})",
    detail: "print(*values, sep=' ', end='\\n', file=sys.stdout, flush=False)",
    documentation: "Prints the values to a stream, or to sys.stdout by default.",
  },
  {
    label: "len",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "len(${1:obj})",
    detail: "len(obj, /) -> int",
    documentation: "Return the number of items in a container.",
  },
  {
    label: "range",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "range(${1:stop})",
    detail: "range(stop) -> range object | range(start, stop[, step])",
    documentation:
      "Returns an object that produces a sequence of integers from start to stop by step.",
  },
  {
    label: "input",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "input(${1:prompt})",
    detail: "input(prompt='', /) -> str",
    documentation: "Read a string from standard input. The trailing newline is stripped.",
  },
  {
    label: "int",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "int(${1:x})",
    detail: "int(x=0) -> integer | int(x, base=10)",
    documentation:
      "Convert a number or string to an integer, or return 0 if no arguments are given.",
  },
  {
    label: "str",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "str(${1:object})",
    detail: "str(object='') -> str",
    documentation: "Create a new string object from the given object.",
  },
  {
    label: "float",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "float(${1:x})",
    detail: "float(x=0) -> floating point number",
    documentation: "Convert a string or number to a floating point number.",
  },
  {
    label: "bool",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "bool(${1:x})",
    detail: "bool(x=False) -> bool",
    documentation: "Returns True when the argument x is true, False otherwise.",
  },
  {
    label: "list",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "list(${1:iterable})",
    detail: "list(iterable=(), /) -> new list",
    documentation: "Built-in mutable sequence.",
  },
  {
    label: "dict",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "dict(${1})",
    detail: "dict() -> new empty dictionary",
    documentation: "Built-in mutable key-value associative mapping.",
  },
  {
    label: "set",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "set(${1:iterable})",
    detail: "set(iterable=(), /) -> new set object",
    documentation: "Built-in mutable unordered collection of unique elements.",
  },
  {
    label: "tuple",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "tuple(${1:iterable})",
    detail: "tuple(iterable=(), /) -> empty tuple",
    documentation: "Built-in immutable sequence.",
  },
  {
    label: "enumerate",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "enumerate(${1:iterable})",
    detail: "enumerate(iterable, start=0) -> enumerate object",
    documentation:
      "Yields pairs containing a count (from start) and the values obtained from iterating over iterable.",
  },
  {
    label: "zip",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "zip(${1:iter1}, ${2:iter2})",
    detail: "zip(*iterables, strict=False) -> zip object",
    documentation:
      "The zip object yields n-length tuples, where n is the number of iterables passed as arguments.",
  },
  {
    label: "map",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "map(${1:function}, ${2:iterable})",
    detail: "map(func, *iterables) -> map object",
    documentation:
      "Make an iterator that computes the function using arguments from each of the iterables.",
  },
  {
    label: "filter",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "filter(${1:function}, ${2:iterable})",
    detail: "filter(function or None, iterable) -> filter object",
    documentation:
      "Return an iterator yielding those items of iterable for which function(item) is true.",
  },
  {
    label: "sorted",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "sorted(${1:iterable})",
    detail: "sorted(iterable, /, *, key=None, reverse=False) -> list",
    documentation: "Return a new list containing all items from the iterable in ascending order.",
  },
  {
    label: "sum",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "sum(${1:iterable})",
    detail: "sum(iterable, /, start=0) -> number",
    documentation: "Return the sum of a 'start' value (default: 0) plus an iterable of numbers.",
  },
  {
    label: "min",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "min(${1:arg1}, ${2:arg2})",
    detail:
      "min(iterable, *[, default=obj, key=func]) -> value | min(arg1, arg2, *args, *[, key=func])",
    documentation:
      "Return the smallest item in an iterable or the smallest of two or more arguments.",
  },
  {
    label: "max",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "max(${1:arg1}, ${2:arg2})",
    detail:
      "max(iterable, *[, default=obj, key=func]) -> value | max(arg1, arg2, *args, *[, key=func])",
    documentation:
      "Return the largest item in an iterable or the largest of two or more arguments.",
  },
  {
    label: "abs",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "abs(${1:x})",
    detail: "abs(x, /) -> number",
    documentation: "Return the absolute value of the argument.",
  },
  {
    label: "round",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "round(${1:number}, ${2:ndigits})",
    detail: "round(number, ndigits=None) -> number",
    documentation: "Round a number to a given precision in decimal digits.",
  },
  {
    label: "type",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "type(${1:object})",
    detail: "type(object) -> the object's type",
    documentation: "Returns the type of an object.",
  },
  {
    label: "isinstance",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "isinstance(${1:object}, ${2:classinfo})",
    detail: "isinstance(obj, class_or_tuple, /) -> bool",
    documentation: "Return whether an object is an instance of a class or of a subclass thereof.",
  },
  {
    label: "open",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: 'open(${1:file}, "${2:r}")',
    detail:
      "open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)",
    documentation: "Open file and return a stream.",
  },
  {
    label: "any",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "any(${1:iterable})",
    detail: "any(iterable, /) -> bool",
    documentation: "Return True if bool(x) is True for any x in the iterable.",
  },
  {
    label: "all",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "all(${1:iterable})",
    detail: "all(iterable, /) -> bool",
    documentation: "Return True if bool(x) is True for all values x in the iterable.",
  },
  {
    label: "reversed",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "reversed(${1:sequence})",
    detail: "reversed(sequence, /) -> reverse iterator",
    documentation: "Return a reverse iterator over the values of the given sequence.",
  },
  {
    label: "chr",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "chr(${1:i})",
    detail: "chr(i, /) -> str",
    documentation: "Return a Unicode string of one character with ordinal i; 0 <= i <= 0x10ffff.",
  },
  {
    label: "ord",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "ord(${1:c})",
    detail: "ord(c, /) -> int",
    documentation: "Return the integer ordinal of a one-character string.",
  },
  {
    label: "bin",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "bin(${1:number})",
    detail: "bin(number, /) -> str",
    documentation: "Return the binary representation of an integer.",
  },
  {
    label: "hex",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "hex(${1:number})",
    detail: "hex(number, /) -> str",
    documentation: "Return the hexadecimal representation of an integer.",
  },
  {
    label: "oct",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "oct(${1:number})",
    detail: "oct(number, /) -> str",
    documentation: "Return the octal representation of an integer.",
  },
];

const MATH_MEMBERS: CompletionItemDef[] = [
  {
    label: "sqrt",
    snippet: "sqrt(${1:x})",
    detail: "math.sqrt(x, /) -> float",
    documentation: "Return the square root of x.",
  },
  {
    label: "ceil",
    snippet: "ceil(${1:x})",
    detail: "math.ceil(x, /) -> int",
    documentation: "Return the ceiling of x as an Integral.",
  },
  {
    label: "floor",
    snippet: "floor(${1:x})",
    detail: "math.floor(x, /) -> int",
    documentation: "Return the floor of x as an Integral.",
  },
  {
    label: "pow",
    snippet: "pow(${1:x}, ${2:y})",
    detail: "math.pow(x, y, /) -> float",
    documentation: "Return x**y (x to the power of y).",
  },
  {
    label: "fabs",
    snippet: "fabs(${1:x})",
    detail: "math.fabs(x, /) -> float",
    documentation: "Return the absolute value of the float x.",
  },
  {
    label: "factorial",
    snippet: "factorial(${1:n})",
    detail: "math.factorial(n, /) -> int",
    documentation: "Find n!.",
  },
  {
    label: "gcd",
    snippet: "gcd(${1:a}, ${2:b})",
    detail: "math.gcd(*integers) -> int",
    documentation: "Greatest Common Divisor.",
  },
  {
    label: "lcm",
    snippet: "lcm(${1:a}, ${2:b})",
    detail: "math.lcm(*integers) -> int",
    documentation: "Least Common Multiple.",
  },
  {
    label: "sin",
    snippet: "sin(${1:x})",
    detail: "math.sin(x, /) -> float",
    documentation: "Return the sine of x (measured in radians).",
  },
  {
    label: "cos",
    snippet: "cos(${1:x})",
    detail: "math.cos(x, /) -> float",
    documentation: "Return the cosine of x (measured in radians).",
  },
  {
    label: "tan",
    snippet: "tan(${1:x})",
    detail: "math.tan(x, /) -> float",
    documentation: "Return the tangent of x (measured in radians).",
  },
  {
    label: "log",
    snippet: "log(${1:x}, ${2:base})",
    detail: "math.log(x, [base=math.e]) -> float",
    documentation: "Return the logarithm of x to the given base.",
  },
  {
    label: "log10",
    snippet: "log10(${1:x})",
    detail: "math.log10(x, /) -> float",
    documentation: "Return the base 10 logarithm of x.",
  },
  {
    label: "log2",
    snippet: "log2(${1:x})",
    detail: "math.log2(x, /) -> float",
    documentation: "Return the base 2 logarithm of x.",
  },
  {
    label: "exp",
    snippet: "exp(${1:x})",
    detail: "math.exp(x, /) -> float",
    documentation: "Return e raised to the power of x.",
  },
  {
    label: "degrees",
    snippet: "degrees(${1:x})",
    detail: "math.degrees(x, /) -> float",
    documentation: "Convert angle x from radians to degrees.",
  },
  {
    label: "radians",
    snippet: "radians(${1:x})",
    detail: "math.radians(x, /) -> float",
    documentation: "Convert angle x from degrees to radians.",
  },
  {
    label: "pi",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "pi",
    detail: "math.pi = 3.141592653589793",
    documentation: "The mathematical constant π = 3.141592…",
  },
  {
    label: "e",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "e",
    detail: "math.e = 2.718281828459045",
    documentation: "The mathematical constant e = 2.718281…",
  },
  {
    label: "inf",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "inf",
    detail: "math.inf",
    documentation: "A floating-point positive infinity.",
  },
];

const RANDOM_MEMBERS: CompletionItemDef[] = [
  {
    label: "randint",
    snippet: "randint(${1:a}, ${2:b})",
    detail: "random.randint(a, b) -> int",
    documentation: "Return random integer in range [a, b], including both end points.",
  },
  {
    label: "choice",
    snippet: "choice(${1:seq})",
    detail: "random.choice(seq) -> element",
    documentation: "Choose a random element from a non-empty sequence.",
  },
  {
    label: "choices",
    snippet: "choices(${1:population}, k=${2:1})",
    detail: "random.choices(population, weights=None, *, cum_weights=None, k=1)",
    documentation: "Return a k sized list of population elements chosen with replacement.",
  },
  {
    label: "shuffle",
    snippet: "shuffle(${1:x})",
    detail: "random.shuffle(x) -> None",
    documentation: "Shuffle list x in place, and return None.",
  },
  {
    label: "random",
    snippet: "random()",
    detail: "random.random() -> float",
    documentation: "Return the next random floating point number in the range [0.0, 1.0).",
  },
  {
    label: "uniform",
    snippet: "uniform(${1:a}, ${2:b})",
    detail: "random.uniform(a, b) -> float",
    documentation: "Get a random number in the range [a, b) or [a, b] depending on rounding.",
  },
  {
    label: "randrange",
    snippet: "randrange(${1:start}, ${2:stop})",
    detail: "random.randrange(start, stop[, step]) -> int",
    documentation: "Choose a random item from range(start, stop[, step]).",
  },
  {
    label: "sample",
    snippet: "sample(${1:population}, ${2:k})",
    detail: "random.sample(population, k, *, counts=None) -> list",
    documentation: "Chooses k unique random elements from a population sequence or set.",
  },
  {
    label: "seed",
    snippet: "seed(${1:a})",
    detail: "random.seed(a=None, version=2) -> None",
    documentation: "Initialize internal state from a hashable object.",
  },
];

const SYS_MEMBERS: CompletionItemDef[] = [
  {
    label: "argv",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "argv",
    detail: "sys.argv: list[str]",
    documentation: "The list of command line arguments passed to a Python script.",
  },
  {
    label: "exit",
    snippet: "exit(${1:0})",
    detail: "sys.exit([status])",
    documentation: "Exit the interpreter by raising SystemExit(status).",
  },
  {
    label: "stdin",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "stdin",
    detail: "sys.stdin",
    documentation: "Standard input stream.",
  },
  {
    label: "stdout",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "stdout",
    detail: "sys.stdout",
    documentation: "Standard output stream.",
  },
  {
    label: "stderr",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "stderr",
    detail: "sys.stderr",
    documentation: "Standard error stream.",
  },
  {
    label: "version",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "version",
    detail: "sys.version: str",
    documentation: "A string containing the version number of the Python interpreter.",
  },
  {
    label: "path",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "path",
    detail: "sys.path: list[str]",
    documentation: "A list of strings that specifies the search path for modules.",
  },
  {
    label: "maxsize",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "maxsize",
    detail: "sys.maxsize: int",
    documentation: "An integer giving the maximum value a variable of type Py_ssize_t can take.",
  },
];

const OS_MEMBERS: CompletionItemDef[] = [
  {
    label: "path",
    kind: monacoDefault.languages.CompletionItemKind.Module,
    snippet: "path",
    detail: "os.path",
    documentation: "Common pathname manipulations.",
  },
  {
    label: "listdir",
    snippet: 'listdir(${1:"."})',
    detail: "os.listdir(path='.') -> list[str]",
    documentation: "Return a list containing the names of the entries in the directory.",
  },
  {
    label: "getcwd",
    snippet: "getcwd()",
    detail: "os.getcwd() -> str",
    documentation: "Return a string representing the current working directory.",
  },
  {
    label: "mkdir",
    snippet: "mkdir(${1:path})",
    detail: "os.mkdir(path, mode=0o777) -> None",
    documentation: "Create a directory named path.",
  },
  {
    label: "makedirs",
    snippet: "makedirs(${1:name}, exist_ok=True)",
    detail: "os.makedirs(name, mode=0o777, exist_ok=False) -> None",
    documentation: "Super-mkdir; create-directory recursively.",
  },
  {
    label: "remove",
    snippet: "remove(${1:path})",
    detail: "os.remove(path) -> None",
    documentation: "Remove (delete) the file path.",
  },
  {
    label: "environ",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "environ",
    detail: "os.environ: Mapping",
    documentation: "A mapping object representing the string environment.",
  },
  {
    label: "system",
    snippet: "system(${1:command})",
    detail: "os.system(command) -> int",
    documentation: "Execute the command in a subshell.",
  },
  {
    label: "name",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "name",
    detail: "os.name: str",
    documentation:
      "The name of the operating system dependent module imported ('posix', 'nt', etc.).",
  },
];

const OS_PATH_MEMBERS: CompletionItemDef[] = [
  {
    label: "exists",
    snippet: "exists(${1:path})",
    detail: "os.path.exists(path) -> bool",
    documentation: "Test whether a path exists.",
  },
  {
    label: "join",
    snippet: "join(${1:path}, *${2:paths})",
    detail: "os.path.join(path, *paths) -> str",
    documentation: "Join two or more pathname components inserting '/' as needed.",
  },
  {
    label: "basename",
    snippet: "basename(${1:path})",
    detail: "os.path.basename(path) -> str",
    documentation: "Returns the final component of a pathname.",
  },
  {
    label: "dirname",
    snippet: "dirname(${1:path})",
    detail: "os.path.dirname(path) -> str",
    documentation: "Returns the directory component of a pathname.",
  },
  {
    label: "split",
    snippet: "split(${1:path})",
    detail: "os.path.split(path) -> tuple[str, str]",
    documentation: "Split a pathname into (head, tail).",
  },
  {
    label: "splitext",
    snippet: "splitext(${1:path})",
    detail: "os.path.splitext(path) -> tuple[str, str]",
    documentation: "Split the extension from a pathname (root, ext).",
  },
  {
    label: "isfile",
    snippet: "isfile(${1:path})",
    detail: "os.path.isfile(path) -> bool",
    documentation: "Test whether a path is a regular file.",
  },
  {
    label: "isdir",
    snippet: "isdir(${1:path})",
    detail: "os.path.isdir(path) -> bool",
    documentation: "Test whether a path is a directory.",
  },
  {
    label: "getsize",
    snippet: "getsize(${1:path})",
    detail: "os.path.getsize(path) -> int",
    documentation: "Return the size of a file in bytes.",
  },
];

const JSON_MEMBERS: CompletionItemDef[] = [
  {
    label: "dumps",
    snippet: "dumps(${1:obj}, indent=${2:4})",
    detail: "json.dumps(obj, *, indent=None) -> str",
    documentation: "Serialize obj to a JSON formatted str.",
  },
  {
    label: "loads",
    snippet: "loads(${1:s})",
    detail: "json.loads(s) -> Any",
    documentation:
      "Deserialize s (a str, bytes or bytearray instance containing a JSON document) to a Python object.",
  },
  {
    label: "dump",
    snippet: "dump(${1:obj}, ${2:fp})",
    detail: "json.dump(obj, fp, *, indent=None)",
    documentation: "Serialize obj as a JSON formatted stream to fp.",
  },
  {
    label: "load",
    snippet: "load(${1:fp})",
    detail: "json.load(fp) -> Any",
    documentation:
      "Deserialize fp (a .read()-supporting file-like object containing a JSON document) to a Python object.",
  },
];

const STRING_MEMBERS: CompletionItemDef[] = [
  {
    label: "split",
    snippet: 'split("${1: }")',
    detail: "str.split(sep=None, maxsplit=-1) -> list[str]",
    documentation: "Return a list of the words in the string, using sep as the delimiter.",
  },
  {
    label: "join",
    snippet: "join(${1:iterable})",
    detail: "str.join(iterable, /) -> str",
    documentation: "Concatenate any number of strings.",
  },
  {
    label: "strip",
    snippet: "strip()",
    detail: "str.strip(chars=None, /) -> str",
    documentation: "Return a copy of the string with leading and trailing whitespace removed.",
  },
  {
    label: "lstrip",
    snippet: "lstrip()",
    detail: "str.lstrip(chars=None, /) -> str",
    documentation: "Return a copy of the string with leading whitespace removed.",
  },
  {
    label: "rstrip",
    snippet: "rstrip()",
    detail: "str.rstrip(chars=None, /) -> str",
    documentation: "Return a copy of the string with trailing whitespace removed.",
  },
  {
    label: "lower",
    snippet: "lower()",
    detail: "str.lower() -> str",
    documentation: "Return a copy of the string converted to lowercase.",
  },
  {
    label: "upper",
    snippet: "upper()",
    detail: "str.upper() -> str",
    documentation: "Return a copy of the string converted to uppercase.",
  },
  {
    label: "replace",
    snippet: 'replace("${1:old}", "${2:new}")',
    detail: "str.replace(old, new, count=-1) -> str",
    documentation: "Return a copy with all occurrences of substring old replaced by new.",
  },
  {
    label: "startswith",
    snippet: 'startswith("${1:prefix}")',
    detail: "str.startswith(prefix[, start[, end]]) -> bool",
    documentation: "Return True if the string starts with the specified prefix.",
  },
  {
    label: "endswith",
    snippet: 'endswith("${1:suffix}")',
    detail: "str.endswith(suffix[, start[, end]]) -> bool",
    documentation: "Return True if the string ends with the specified suffix.",
  },
  {
    label: "find",
    snippet: 'find("${1:sub}")',
    detail: "str.find(sub[, start[, end]]) -> int",
    documentation:
      "Return the lowest index in S where substring sub is found. Return -1 on failure.",
  },
  {
    label: "count",
    snippet: "count(${1:value})",
    detail: "count(value) -> int",
    documentation: "Return number of occurrences of value.",
  },
  {
    label: "format",
    snippet: "format(${1:args})",
    detail: "str.format(*args, **kwargs) -> str",
    documentation: "Return a formatted version of S, using substitutions from args and kwargs.",
  },
  {
    label: "isdigit",
    snippet: "isdigit()",
    detail: "str.isdigit() -> bool",
    documentation: "Return True if all characters in S are digits.",
  },
  {
    label: "isalpha",
    snippet: "isalpha()",
    detail: "str.isalpha() -> bool",
    documentation: "Return True if all characters in S are alphabetic.",
  },
  {
    label: "isalnum",
    snippet: "isalnum()",
    detail: "str.isalnum() -> bool",
    documentation: "Return True if all characters in S are alphanumeric.",
  },
];

const LIST_MEMBERS: CompletionItemDef[] = [
  {
    label: "append",
    snippet: "append(${1:item})",
    detail: "list.append(object, /) -> None",
    documentation: "Append object to the end of the list.",
  },
  {
    label: "extend",
    snippet: "extend(${1:iterable})",
    detail: "list.extend(iterable, /) -> None",
    documentation: "Extend list by appending elements from the iterable.",
  },
  {
    label: "insert",
    snippet: "insert(${1:index}, ${2:item})",
    detail: "list.insert(index, object, /) -> None",
    documentation: "Insert object before index.",
  },
  {
    label: "pop",
    snippet: "pop()",
    detail: "pop([index]) -> item",
    documentation: "Remove and return item at index (default last).",
  },
  {
    label: "remove",
    snippet: "remove(${1:value})",
    detail: "remove(value, /) -> None",
    documentation: "Remove first occurrence of value.",
  },
  {
    label: "clear",
    snippet: "clear()",
    detail: "clear() -> None",
    documentation: "Remove all items.",
  },
  {
    label: "index",
    snippet: "index(${1:value})",
    detail: "index(value, [start, [stop]]) -> int",
    documentation: "Return first index of value.",
  },
  {
    label: "sort",
    snippet: "sort()",
    detail: "list.sort(*, key=None, reverse=False) -> None",
    documentation: "Sort the list in ascending order and return None.",
  },
  {
    label: "reverse",
    snippet: "reverse()",
    detail: "list.reverse() -> None",
    documentation: "Reverse IN PLACE.",
  },
  {
    label: "copy",
    snippet: "copy()",
    detail: "copy() -> shallow copy",
    documentation: "Return a shallow copy.",
  },
];

const DICT_MEMBERS: CompletionItemDef[] = [
  {
    label: "keys",
    snippet: "keys()",
    detail: "dict.keys() -> a set-like object providing a view on D's keys",
    documentation: "Return a set-like object of dictionary keys.",
  },
  {
    label: "values",
    snippet: "values()",
    detail: "dict.values() -> an object providing a view on D's values",
    documentation: "Return an object of dictionary values.",
  },
  {
    label: "items",
    snippet: "items()",
    detail: "dict.items() -> a set-like object providing a view on D's items",
    documentation: "Return a set-like object of dictionary (key, value) pairs.",
  },
  {
    label: "get",
    snippet: "get(${1:key}, ${2:default})",
    detail: "dict.get(key, default=None, /) -> value",
    documentation: "Return the value for key if key is in the dictionary, else default.",
  },
  {
    label: "update",
    snippet: "update(${1:other})",
    detail: "dict.update([E, ]**F) -> None",
    documentation: "Update D from dict/iterable E and F.",
  },
  {
    label: "setdefault",
    snippet: "setdefault(${1:key}, ${2:default})",
    detail: "dict.setdefault(key, default=None, /) -> value",
    documentation: "Insert key with a value of default if key is not in the dictionary.",
  },
];

const SET_MEMBERS: CompletionItemDef[] = [
  {
    label: "add",
    snippet: "add(${1:element})",
    detail: "set.add(element, /) -> None",
    documentation: "Add an element to a set.",
  },
  {
    label: "discard",
    snippet: "discard(${1:element})",
    detail: "set.discard(element, /) -> None",
    documentation: "Remove an element from a set if it is a member.",
  },
  {
    label: "union",
    snippet: "union(${1:other})",
    detail: "set.union(*others) -> set",
    documentation: "Return the union of sets as a new set.",
  },
  {
    label: "intersection",
    snippet: "intersection(${1:other})",
    detail: "set.intersection(*others) -> set",
    documentation: "Return the intersection of two sets as a new set.",
  },
  {
    label: "difference",
    snippet: "difference(${1:other})",
    detail: "set.difference(*others) -> set",
    documentation: "Return the difference of two or more sets as a new set.",
  },
];

const COMMON_INSTANCE_MEMBERS: CompletionItemDef[] = [
  {
    label: "__class__",
    snippet: "__class__",
    detail: "type(self)",
    documentation: "The type/class of the instance.",
  },
  {
    label: "__doc__",
    snippet: "__doc__",
    detail: "Documentation string",
    documentation: "The documentation string of the object.",
  },
  {
    label: "__init__",
    snippet: "__init__(${1:self})",
    detail: "Constructor method",
    documentation: "Called when the instance is created.",
  },
  {
    label: "__str__",
    snippet: "__str__()",
    detail: "str(self) string representation",
    documentation: "Called by str(object) and the built-in format() and print().",
  },
  {
    label: "__repr__",
    snippet: "__repr__()",
    detail: "repr(self) formal representation",
    documentation: "Called by the repr() built-in function to compute the string representation.",
  },
  {
    label: "__eq__",
    snippet: "__eq__(${1:other})",
    detail: "bool self.__eq__(other)",
    documentation: "Equality comparison operator (==).",
  },
  {
    label: "__ne__",
    snippet: "__ne__(${1:other})",
    detail: "bool self.__ne__(other)",
    documentation: "Inequality comparison operator (!=).",
  },
  {
    label: "__hash__",
    snippet: "__hash__()",
    detail: "int self.__hash__()",
    documentation:
      "Called by built-in function hash() and for operations on members of hashed collections.",
  },
  {
    label: "__sizeof__",
    snippet: "__sizeof__()",
    detail: "int self.__sizeof__()",
    documentation: "Returns the size of the object in bytes.",
  },
  {
    label: "__dir__",
    snippet: "__dir__()",
    detail: "list[str] self.__dir__()",
    documentation: "Returns list of valid attributes for the object.",
  },
];

const PYTHON_KEYWORDS = [
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
];

const PYTHON_MODULES = [
  { name: "math", doc: "Provides access to the mathematical functions defined by the C standard." },
  { name: "random", doc: "Implements pseudo-random number generators for various distributions." },
  { name: "sys", doc: "Provides access to some variables used or maintained by the interpreter." },
  { name: "os", doc: "Provides a portable way of using operating system dependent functionality." },
  { name: "json", doc: "JSON (JavaScript Object Notation) encoder and decoder." },
  { name: "time", doc: "Provides various time-related functions." },
  { name: "datetime", doc: "Supplies classes for manipulating dates and times." },
  { name: "re", doc: "Regular expression operations." },
  {
    name: "collections",
    doc: "High-performance container datatypes (Counter, defaultdict, deque, etc.).",
  },
  { name: "itertools", doc: "Functions creating iterators for efficient looping." },
  { name: "functools", doc: "Higher-order functions and operations on callable objects." },
  { name: "heapq", doc: "Heap queue algorithm, also known as the priority queue algorithm." },
  { name: "bisect", doc: "Array bisection algorithm for maintaining lists in sorted order." },
  { name: "copy", doc: "Shallow and deep copy operations." },
  { name: "string", doc: "Common string operations and constants." },
];

const SNIPPETS = [
  {
    label: "main",
    insertText: 'if __name__ == "__main__":\n    ${0:main()}',
    detail: "Main entry point boilerplate",
    documentation: "Boilerplate check for direct script execution.",
  },
  {
    label: "def",
    insertText: "def ${1:func_name}(${2:args}):\n    ${0:pass}",
    detail: "def function",
    documentation: "Define a new function.",
  },
  {
    label: "class",
    insertText: "class ${1:ClassName}:\n    def __init__(self, ${2:args}):\n        ${0:pass}",
    detail: "class definition",
    documentation: "Define a new class with an __init__ constructor.",
  },
  {
    label: "for",
    insertText: "for ${1:i} in range(${2:n}):\n    ${0:pass}",
    detail: "for loop with range",
    documentation: "Iterate over a sequence of numbers generated by range.",
  },
  {
    label: "forin",
    insertText: "for ${1:item} in ${2:iterable}:\n    ${0:pass}",
    detail: "for-in loop",
    documentation: "Iterate over elements of an iterable.",
  },
  {
    label: "forenum",
    insertText: "for ${1:i}, ${2:item} in enumerate(${3:iterable}):\n    ${0:pass}",
    detail: "for-in loop with enumerate",
    documentation: "Iterate over elements with an index counter.",
  },
  {
    label: "while",
    insertText: "while ${1:condition}:\n    ${0:pass}",
    detail: "while loop",
    documentation: "Executes a block of code as long as a condition is true.",
  },
  {
    label: "if",
    insertText: "if ${1:condition}:\n    ${0:pass}",
    detail: "if statement",
    documentation: "Conditional statement.",
  },
  {
    label: "ifelse",
    insertText: "if ${1:condition}:\n    ${2:pass}\nelse:\n    ${0:pass}",
    detail: "if-else statement",
    documentation: "Conditional branch with an else clause.",
  },
  {
    label: "ifelif",
    insertText:
      "if ${1:condition1}:\n    ${2:pass}\nelif ${3:condition2}:\n    ${4:pass}\nelse:\n    ${0:pass}",
    detail: "if-elif-else statement",
    documentation: "Multi-branch conditional statement.",
  },
  {
    label: "try",
    insertText: "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${0:print(e)}",
    detail: "try-except block",
    documentation: "Structured exception handling block.",
  },
  {
    label: "with",
    insertText: 'with open(${1:"filename"}, "${2:r}") as ${3:f}:\n    ${0:content = f.read()}',
    detail: "with open() context manager",
    documentation: "Safely open a file with automatic closing on exit.",
  },
  {
    label: "lam",
    insertText: "lambda ${1:x}: ${0:x}",
    detail: "lambda anonymous function",
    documentation: "Small anonymous inline function.",
  },
  {
    label: "listcomp",
    insertText: "[${1:x} for ${1:x} in ${2:iterable}]",
    detail: "list comprehension",
    documentation: "Construct a new list using a comprehension expression.",
  },
  {
    label: "dictcomp",
    insertText: "{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:iterable}}",
    detail: "dict comprehension",
    documentation: "Construct a new dictionary using a comprehension expression.",
  },
  {
    label: "mapinp",
    insertText: "map(int, input().split())",
    detail: "map(int, input().split())",
    documentation: "Map space-separated input strings to integers.",
  },
  {
    label: "listinp",
    insertText: "list(map(int, input().split()))",
    detail: "list(map(int, input().split()))",
    documentation: "Read space-separated integers as a list.",
  },
  {
    label: "fastio",
    insertText: "import sys\ninput = sys.stdin.readline\n$0",
    detail: "fast I/O setup",
    documentation: "Speed up input reading for competitive programming with sys.stdin.readline.",
  },
  {
    label: "intinp",
    insertText: "int(input())",
    detail: "read single integer from input",
    documentation: "Read a line from stdin and convert it to an integer.",
  },
  {
    label: "strinp",
    insertText: "input().strip()",
    detail: "read stripped string from input",
    documentation: "Read a line from stdin and strip surrounding whitespace.",
  },
];

function toCompletionItems(
  items: CompletionItemDef[],
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

const PYTHON_KEYWORD_SET = new Set(PYTHON_KEYWORDS);
const PYTHON_BUILTIN_SET = new Set(BUILTIN_FUNCTIONS.map((f) => f.label));
const PYTHON_MODULE_SET = new Set(PYTHON_MODULES.map((m) => m.name));

/**
 * Deduplicates completion items keyed by label, kind, insertText, and detail.
 * Preserves legitimate overloads while removing identical duplicate items.
 */
function deduplicateSuggestions(
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
 * Strips Python '#' comments from a single line while respecting string literals.
 * Preserves '#' characters occurring inside single or double quoted strings.
 */
function stripPythonComment(line: string): string {
  let inQuote: string | null = null;
  let isEscaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (ch === "\\") {
      isEscaped = true;
      continue;
    }
    if (inQuote !== null) {
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === "#") {
      return line.slice(0, i);
    }
  }
  return line;
}

interface PythonScopes {
  /** owner[ln] = header line of the innermost def/class that contains line ln (0 = module level). */
  owner: number[];
  /** Header lines of the def/class scopes whose names are visible from the cursor line. */
  visible: Set<number>;
  /** Whether each header line is a def or a class. */
  kind: Map<number, "def" | "class">;
}

/**
 * Works out which def/class body every line belongs to, and which of those scopes
 * the cursor can see. Indented lines inside module-level if/for/while/with blocks
 * still belong to the module, so their variables stay visible after the block ends.
 */
function computePythonScopes(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): PythonScopes {
  const lineCount = model.getLineCount();
  const owner: number[] = new Array(lineCount + 2).fill(0);
  const parent = new Map<number, number>();
  const kind = new Map<number, "def" | "class">();
  const stack: { line: number; indent: number }[] = [];
  let cursorOwner = 0;

  for (let ln = 1; ln <= lineCount; ln++) {
    const raw = model.getLineContent(ln);
    const code = stripPythonComment(raw);
    const isCursor = ln === cursorLine;
    if (!code.trim() && !isCursor) {
      owner[ln] = stack.length ? stack[stack.length - 1].line : 0;
      continue;
    }
    const indent = raw.match(/^\s*/)?.[0].length ?? 0;
    // A line starting with a closing bracket continues a multi-line statement
    if (!isCursor && /^\s*[)\\]}]/.test(code)) {
      owner[ln] = stack.length ? stack[stack.length - 1].line : 0;
      continue;
    }
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const top = stack.length ? stack[stack.length - 1].line : 0;
    owner[ln] = top;
    if (isCursor) cursorOwner = top;

    const header = code.match(/^\s*(?:async\s+)?(def|class)\s+[a-zA-Z_]\w*/);
    if (header) {
      parent.set(ln, top);
      kind.set(ln, header[1] === "def" ? "def" : "class");
      stack.push({ line: ln, indent });
    }
  }

  // Python rule: a function body can't see the variables of an enclosing class body.
  const visible = new Set<number>();
  let sawDef = false;
  for (let c = cursorOwner; c !== 0; c = parent.get(c) ?? 0) {
    if (kind.get(c) === "def") {
      visible.add(c);
      sawDef = true;
    } else if (!sawDef) {
      visible.add(c);
    }
  }
  return { owner, visible, kind };
}

function isLineVisible(scopes: PythonScopes, ln: number): boolean {
  const o = scopes.owner[ln] ?? 0;
  return o === 0 || scopes.visible.has(o);
}

/**
 * Lightweight type inference for Python expressions preceding a dot.
 * Scans the preceding code backwards to find assignments, type annotations,
 * or literal values to determine if the target is a str, list, dict, set, etc.
 */
function inferPythonType(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  textBeforeWord: string,
): "str" | "list" | "dict" | "set" | "unknown" {
  const expr = textBeforeWord.slice(0, -1).trim();
  if (!expr) return "unknown";

  // Only look at declarations the cursor can actually see (not other functions' locals)
  const scopes = computePythonScopes(model, position.lineNumber);

  // Check literal expressions:
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'")) ||
    (/^f["']/.test(expr) && (expr.endsWith('"') || expr.endsWith("'")))
  ) {
    return "str";
  }

  // List literal: must start with [ and end with ] (not subscript indexing like student["name"])
  if (expr.startsWith("[") && expr.endsWith("]")) {
    return "list";
  }

  // Dict / Set literal: must start with { and end with }
  if (expr.startsWith("{") && expr.endsWith("}")) {
    return expr.includes(":") ? "dict" : "set";
  }

  // Subscript / index access: e.g. student["name"], arr[0], or text[0]
  const subscriptMatch = expr.match(/^([a-zA-Z_]\w*)\[(.*)\]$/);
  if (subscriptMatch) {
    const baseVar = subscriptMatch[1];
    const keyPart = subscriptMatch[2].trim();
    // Scan backwards to find the base variable's declaration
    for (let ln = position.lineNumber; ln >= 1; ln--) {
      const rawLine = model.getLineContent(ln);
      const line = stripPythonComment(rawLine).trim();
      if (!line) continue;
      if (!isLineVisible(scopes, ln)) continue;

      // Type annotations: baseVar: list[str], baseVar: list[list[int]], baseVar: str
      const annotMatch = line.match(new RegExp(`^${baseVar}\\s*:\\s*(.+)`));
      if (annotMatch) {
        const hint = annotMatch[1].toLowerCase();
        if (
          hint.startsWith("str") ||
          hint.includes("list[str]") ||
          hint.includes("list[string]") ||
          hint.includes("dict[str, str]")
        ) {
          return "str";
        }
        if (hint.includes("list[list") || hint.includes("list[list[")) {
          return "list";
        }
      }

      const assignMatch = line.match(new RegExp(`^${baseVar}\\s*(?::[^=]+)?\\s*=\\s*(.+)`));
      if (assignMatch) {
        const rhs = assignMatch[1].trim();

        // 1. Indexing a string literal or string function produces a str (e.g. text[0])
        if (
          (rhs.startsWith('"') && rhs.endsWith('"')) ||
          (rhs.startsWith("'") && rhs.endsWith("'")) ||
          /^f["']/.test(rhs) ||
          /^str\s*\(/.test(rhs) ||
          /^input\s*\(/.test(rhs)
        ) {
          return "str";
        }

        // 2. Indexing a nested list produces a list (e.g. matrix = [[1, 2]]; matrix[0].)
        if (/^\[\s*\[/.test(rhs)) {
          return "list";
        }

        // 3. Indexing a list of dicts produces a dict (e.g. records = [{"a": 1}]; records[0].)
        if (/^\[\s*\{/.test(rhs)) {
          return "dict";
        }

        // 4. Indexing a list of strings produces a str (e.g. words = ["hello", "world"] or words = text.split(); words[0].)
        if (/\.split(?:lines)?\s*\(/.test(rhs) || /^\[\s*["']/.test(rhs)) {
          return "str";
        }

        // 5. Indexing a dict literal: inspect the specific key's value if possible
        if (rhs.startsWith("{")) {
          let dictContent = rhs;
          if (!dictContent.includes("}")) {
            for (let fwd = ln + 1; fwd <= Math.min(model.getLineCount(), ln + 25); fwd++) {
              const nextL = stripPythonComment(model.getLineContent(fwd)).trim();
              dictContent += " " + nextL;
              if (nextL.includes("}")) break;
            }
          }
          const cleanKey = keyPart.replace(/['"]/g, "");
          // Escape regex special characters in the key to prevent crashes
          const escapedKey = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Use exact key match with word boundaries to avoid substring matching
          // e.g. "name" must not match inside "username"
          const keyRegex = new RegExp(`["']${escapedKey}["']\\s*:\\s*(.+)`);
          const valMatch = dictContent.match(keyRegex);
          if (valMatch) {
            const valRhs = valMatch[1].trim();
            if (valRhs.startsWith('"') || valRhs.startsWith("'") || /^f["']/.test(valRhs)) {
              return "str";
            }
            if (valRhs.startsWith("[")) return "list";
            if (valRhs.startsWith("{")) return "dict";
          }
          return "unknown";
        }
        break;
      }
    }
    // Subscript result is not guaranteed to be a list or str; return unknown
    return "unknown";
  }

  // Extract the variable or identifier immediately before the dot
  const match = expr.match(/([a-zA-Z_]\w*)$/);
  if (!match) return "unknown";
  const varName = match[1];

  // Scan backwards from the current line to line 1
  const startLine = position.lineNumber;
  for (let ln = startLine; ln >= 1; ln--) {
    const rawLine = model.getLineContent(ln);
    const line = stripPythonComment(rawLine).trim();
    if (!line) continue;
    if (!isLineVisible(scopes, ln)) continue;

    // Type annotation: varName: str or varName: list[...]
    const annotMatch = line.match(new RegExp(`^${varName}\\s*:\\s*([a-zA-Z_]\\w*)`));
    if (annotMatch) {
      const typeHint = annotMatch[1].toLowerCase();
      if (typeHint === "str") return "str";
      if (typeHint === "list") return "list";
      if (typeHint === "dict") return "dict";
      if (typeHint === "set") return "set";
    }

    // Function parameter type annotation: def ...(varName: str, ...)
    // Only for the def(s) that actually enclose the cursor
    if (scopes.visible.has(ln) && scopes.kind.get(ln) === "def") {
      const paramMatch = line.match(new RegExp(`\\b${varName}\\s*:\\s*([a-zA-Z_]\\w*)`));
      if (paramMatch) {
        const typeHint = paramMatch[1].toLowerCase();
        if (typeHint === "str") return "str";
        if (typeHint === "list") return "list";
        if (typeHint === "dict") return "dict";
        if (typeHint === "set") return "set";
      }
    }

    // Variable assignment: varName = ...
    const assignMatch = line.match(new RegExp(`^${varName}\\s*(?::[^=]+)?\\s*=\\s*(.+)`));
    if (assignMatch) {
      const rhs = assignMatch[1].trim();

      // List detection (placed before string detection to correctly handle "hello world".split())
      // Only match .split()/.splitlines() when it's the outermost call, not wrapped inside
      // another function like len(text.strip())
      if (
        (/^\.split(?:lines)?\s*\(/.test(rhs.slice(rhs.search(/\.split/))) &&
          !(/^[a-zA-Z_]\w*\s*\(/.test(rhs) && !/\.split/.test(rhs.slice(0, rhs.indexOf("("))))) ||
        /^"[^"]*"\.split(?:lines)?\s*\(/.test(rhs) ||
        /^'[^']*'\.split(?:lines)?\s*\(/.test(rhs) ||
        /^[a-zA-Z_]\w*\.split(?:lines)?\s*\(/.test(rhs) ||
        rhs.startsWith("[") ||
        /^list\s*\(/.test(rhs)
      ) {
        return "list";
      }

      // String detection — only match patterns that clearly produce a string.
      // Do NOT match .strip()/.lower() etc. when they appear inside wrapping calls
      // like len(text.strip()), since the outer call determines the type.
      const isOutermostStringMethod =
        /^[a-zA-Z_]\w*\.(strip|lower|upper|replace|format|title|capitalize)\s*\(/.test(rhs) ||
        /^"[^"]*"\.(strip|lower|upper|replace|format|title|capitalize)\s*\(/.test(rhs) ||
        /^'[^']*'\.(strip|lower|upper|replace|format|title|capitalize)\s*\(/.test(rhs);
      if (
        (rhs.startsWith('"') && rhs.endsWith('"') && !rhs.includes(".split")) ||
        (rhs.startsWith("'") && rhs.endsWith("'") && !rhs.includes(".split")) ||
        (/^f["']/.test(rhs) && (rhs.endsWith('"') || rhs.endsWith("'"))) ||
        (/^r["']/.test(rhs) && (rhs.endsWith('"') || rhs.endsWith("'"))) ||
        /^str\s*\(/.test(rhs) ||
        /^input\s*\(/.test(rhs) ||
        isOutermostStringMethod ||
        /["']\.join\s*\(/.test(rhs)
      ) {
        return "str";
      }

      // Dict detection
      if (
        (rhs.startsWith("{") && (rhs.includes(":") || rhs === "{}")) ||
        /^dict\s*\(/.test(rhs) ||
        /json\.loads\s*\(/.test(rhs)
      ) {
        return "dict";
      }

      // Set detection
      if ((rhs.startsWith("{") && !rhs.includes(":")) || /^set\s*\(/.test(rhs)) {
        return "set";
      }

      // If assigned to something else, stop tracing further
      break;
    }

    // For loop: for varName in ...
    const forMatch = line.match(new RegExp(`^for\\s+${varName}\\s+in\\s+(.+):?`));
    if (forMatch) {
      const iterable = forMatch[1].trim().replace(/:$/, "").trim();
      // Iterating a string, or the list returned by a final .split()/.splitlines() call,
      // yields strings. Don't match a .split() buried inside range(len(...)) and similar.
      if (
        iterable.startsWith('"') ||
        iterable.startsWith("'") ||
        /\.(?:split|splitlines)\s*\([^()]*\)$/.test(iterable)
      ) {
        return "str";
      }
      // The for-loop is the most recent binding for this variable; stop searching.
      break;
    }
  }

  return "unknown";
}

/**
 * Scans the current document for user-defined variables, functions,
 * classes, and identifiers so they appear instantly in autocomplete.
 */
function extractPythonDocumentSymbols(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  range: monacoDefault.IRange,
  monaco: Monaco,
): monacoDefault.languages.CompletionItem[] {
  const lineCount = model.getLineCount();
  const currentWord = model.getWordUntilPosition(position).word;
  const currentLine = position.lineNumber;

  // Which def/class bodies can the cursor see? Variables inside other functions stay hidden,
  // while variables inside module-level if/for/while/with blocks remain visible everywhere.
  const scopes = computePythonScopes(model, currentLine);

  const seen = new Set<string>();
  const items: monacoDefault.languages.CompletionItem[] = [];

  for (let ln = 1; ln <= lineCount; ln++) {
    const rawLine = model.getLineContent(ln);
    const line = stripPythonComment(rawLine);
    if (!line.trim()) continue;

    // Function definition (always visible module-wide)
    const funcMatch = line.match(/^\s*def\s+([a-zA-Z_]\w*)/);
    if (funcMatch) {
      const name = funcMatch[1];
      if (!seen.has(name) && name !== currentWord && !PYTHON_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${name}(${ln === currentLine ? "" : "$0"})`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `def ${name}() (local function)`,
          range,
          sortText: `0_${name}`,
        });
      }

      // If this is the active enclosing function, also extract its parameters
      if (scopes.visible.has(ln) && scopes.kind.get(ln) === "def") {
        const paramMatch = line.match(/def\s+[a-zA-Z_]\w*\s*\(([^)]*)\)/);
        if (paramMatch) {
          const params: string[] = [];
          let currentParam = "";
          let pBracketDepth = 0;
          for (let i = 0; i < paramMatch[1].length; i++) {
            const ch = paramMatch[1][i];
            if (ch === "[" || ch === "(") pBracketDepth++;
            else if (ch === "]" || ch === ")") pBracketDepth--;

            if (ch === "," && pBracketDepth === 0) {
              params.push(currentParam);
              currentParam = "";
            } else {
              currentParam += ch;
            }
          }
          if (currentParam) params.push(currentParam);

          for (const p of params) {
            // Strip leading * or ** from parameter names (*args -> args, **kwargs -> kwargs)
            let pRaw = p.trim().replace(/^\*{1,2}/, "");
            // Split on first : or = that's not inside brackets (for type annotations like Dict[str, int])
            let bracketD = 0;
            let splitIdx = -1;
            for (let ci = 0; ci < pRaw.length; ci++) {
              const cc = pRaw[ci];
              if (cc === "[" || cc === "(") bracketD++;
              else if (cc === "]" || cc === ")") bracketD--;
              else if ((cc === ":" || cc === "=") && bracketD === 0) {
                splitIdx = ci;
                break;
              }
            }
            const pName = splitIdx === -1 ? pRaw.trim() : pRaw.slice(0, splitIdx).trim();
            if (
              pName &&
              pName !== "self" &&
              pName !== "cls" &&
              !seen.has(pName) &&
              pName !== currentWord &&
              !PYTHON_KEYWORD_SET.has(pName)
            ) {
              seen.add(pName);
              items.push({
                label: pName,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: pName,
                detail: `parameter ${pName}`,
                range,
                sortText: `0_${pName}`,
              });
            }
          }
        }
      }
    }

    // Class definition (always visible module-wide)
    const classMatch = line.match(/^\s*class\s+([a-zA-Z_]\w*)/);
    if (classMatch) {
      const name = classMatch[1];
      if (!seen.has(name) && name !== currentWord && !PYTHON_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: name,
          detail: `class ${name} (local class)`,
          range,
          sortText: `0_${name}`,
        });
      }
    }

    // Check scope for local variables and loop variables:
    // Module-level variables (unindented) are always in scope.
    // Indented variables are only in scope if defined within the current active function,
    // or within a module-level block (if/for/while/with) that contains the cursor.
    const isIndented = /^\s+/.test(rawLine);
    if (!isLineVisible(scopes, ln)) continue;

    // Variable assignment: username = ... or username: str = ...
    const varMatch = line.match(/^\s*([a-zA-Z_]\w*)\s*(?::\s*[^=]+)?\s*=/);
    if (varMatch) {
      const name = varMatch[1];
      if (!seen.has(name) && name !== currentWord && !PYTHON_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: name,
          detail: `variable ${name} (${isIndented ? "local" : "module"})`,
          range,
          sortText: `0_${name}`,
        });
      }
    }

    // For loop variable: for user in users:
    const forMatch = line.match(/^\s*for\s+([a-zA-Z_]\w*)\s+in\b/);
    if (forMatch) {
      const name = forMatch[1];
      if (!seen.has(name) && name !== currentWord && !PYTHON_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: name,
          detail: `variable ${name} (loop)`,
          range,
          sortText: `0_${name}`,
        });
      }
    }
  }

  // Also collect general identifier words from code only (excluding multiline strings, strings, and comments)
  // But skip method/attribute names (words that appear immediately after a dot) to avoid
  // polluting suggestions with things like 'append', 'strip', 'lower', etc.
  const fullText = model.getValue();
  const codeOnly = fullText
    .replace(/"""[\s\S]*?"""/g, " ")
    .replace(/'''[\s\S]*?'''/g, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ")
    .replace(/#.*$/gm, " ");

  const codeLines = codeOnly.split("\n");
  for (let ln = 1; ln <= codeLines.length; ln++) {
    if (!isLineVisible(scopes, ln)) continue;
    const cleanLine = codeLines[ln - 1];
    let wMatch: RegExpExecArray | null;
    // Match identifiers but skip those preceded by a dot (method/attribute names)
    const lineWordRegex = /(?:^|[^.])\b([a-zA-Z_]\w{1,})\b/g;
    while ((wMatch = lineWordRegex.exec(cleanLine)) !== null) {
      const word = wMatch[1];
      if (
        !seen.has(word) &&
        word !== currentWord &&
        !PYTHON_KEYWORD_SET.has(word) &&
        !PYTHON_BUILTIN_SET.has(word) &&
        !PYTHON_MODULE_SET.has(word)
      ) {
        seen.add(word);
        items.push({
          label: word,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: word,
          detail: `identifier (in scope)`,
          range,
          sortText: `1_${word}`,
        });
      }
    }
  }

  return items;
}

const registeredMonacoInstances = new WeakSet<object>();

/**
 * Registers offline autocomplete suggestions, standard library completions,
 * Python snippets, and signature assistance for Python in the Monaco Editor.
 */
export function registerPythonCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (registeredMonacoInstances.has(m)) return;
  registeredMonacoInstances.add(m);

  // 1. Autocomplete & Suggestions Provider
  m.languages.registerCompletionItemProvider("python", {
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
      const textBeforeWord = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Check if user is typing immediately after a dot (e.g. "math." or "math.sq")
      if (textBeforeWord.endsWith(".")) {
        // If preceded by a number literal (e.g. "5." or "3.14."), do not suggest member completions
        if (/\b\d+\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        // Check explicit module qualifier before the dot with word boundary
        if (/(?:^|[^\w.])os\.path\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(OS_PATH_MEMBERS, range) };
        }
        if (/(?:^|[^\w.])os\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(OS_MEMBERS, range) };
        }
        if (/(?:^|[^\w.])math\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(MATH_MEMBERS, range) };
        }
        if (/(?:^|[^\w.])random\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(RANDOM_MEMBERS, range) };
        }
        if (/(?:^|[^\w.])sys\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(SYS_MEMBERS, range) };
        }
        if (/(?:^|[^\w.])json\.$/.test(textBeforeWord)) {
          return { suggestions: toCompletionItems(JSON_MEMBERS, range) };
        }

        // Infer type of the expression immediately before the dot:
        const inferred = inferPythonType(model, position, textBeforeWord);
        if (inferred === "str") {
          return { suggestions: toCompletionItems(STRING_MEMBERS, range) };
        }
        if (inferred === "list") {
          return { suggestions: toCompletionItems(LIST_MEMBERS, range) };
        }
        if (inferred === "dict") {
          return { suggestions: toCompletionItems(DICT_MEMBERS, range) };
        }
        if (inferred === "set") {
          return { suggestions: toCompletionItems(SET_MEMBERS, range) };
        }

        // Default member access for any object / instance expression (strings, lists, dicts, sets, etc.):
        return { suggestions: toCompletionItems(COMMON_INSTANCE_MEMBERS, range) };
      }

      // Check if user is typing an import statement (handling indented lines as well)
      const trimmedLineBefore = lineContent.slice(0, position.column - 1).trimStart();

      // Check for "from <module> import [member]"
      const fromImportMatch = trimmedLineBefore.match(
        /^from\s+([a-zA-Z_]\w*)\s+import\s*([a-zA-Z_]\w*)?$/,
      );
      if (fromImportMatch) {
        const modName = fromImportMatch[1].toLowerCase();
        let memberList: CompletionItemDef[] = [];
        if (modName === "math") memberList = MATH_MEMBERS;
        else if (modName === "random") memberList = RANDOM_MEMBERS;
        else if (modName === "sys") memberList = SYS_MEMBERS;
        else if (modName === "os") memberList = OS_MEMBERS;
        else if (modName === "json") memberList = JSON_MEMBERS;

        return {
          suggestions: memberList.map((mItem) => ({
            label: mItem.label,
            kind: mItem.kind ?? m.languages.CompletionItemKind.Function,
            insertText: mItem.label,
            detail: mItem.detail,
            documentation: mItem.documentation,
            range,
          })),
        };
      }

      // Check for "from <module>" (before typing import)
      if (/^from\s+[a-zA-Z_]\w*$/.test(trimmedLineBefore)) {
        return {
          suggestions: PYTHON_MODULES.map((mod) => ({
            label: mod.name,
            kind: m.languages.CompletionItemKind.Module,
            insertText: `${mod.name} import `,
            detail: `from ${mod.name} import ...`,
            documentation: mod.doc,
            range,
          })),
        };
      }

      // Check for "import <module>"
      if (/^import\s+[a-zA-Z_]\w*$/.test(trimmedLineBefore)) {
        return {
          suggestions: PYTHON_MODULES.map((mod) => ({
            label: mod.name,
            kind: m.languages.CompletionItemKind.Module,
            insertText: mod.name,
            detail: `module ${mod.name}`,
            documentation: mod.doc,
            range,
          })),
        };
      }

      // Otherwise: suggest Builtin Functions, Keywords, Modules, and Snippets
      const builtinItems: monacoDefault.languages.CompletionItem[] = toCompletionItems(
        BUILTIN_FUNCTIONS,
        range,
      );

      const keywordItems: monacoDefault.languages.CompletionItem[] = PYTHON_KEYWORDS.map((kw) => ({
        label: kw,
        kind: m.languages.CompletionItemKind.Keyword,
        insertText: kw,
        detail: `keyword ${kw}`,
        range,
      }));

      const moduleItems: monacoDefault.languages.CompletionItem[] = PYTHON_MODULES.map((mod) => ({
        label: mod.name,
        kind: m.languages.CompletionItemKind.Module,
        insertText: mod.name,
        detail: `module ${mod.name}`,
        documentation: mod.doc,
        range,
      }));

      const snippetItems: monacoDefault.languages.CompletionItem[] = SNIPPETS.map((s) => ({
        label: s.label,
        kind: m.languages.CompletionItemKind.Snippet,
        insertText: s.insertText,
        insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: s.detail,
        documentation: s.documentation,
        range,
      }));

      const localSymbols = extractPythonDocumentSymbols(model, position, range, m);

      return {
        suggestions: deduplicateSuggestions([
          ...localSymbols,
          ...snippetItems,
          ...builtinItems,
          ...keywordItems,
          ...moduleItems,
        ]),
      };
    },
  });

  // 2. Hover Provider: displays function signatures and docstrings on mouse hover
  m.languages.registerHoverProvider("python", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const name = word.word;
      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Only show math member docs when preceded by "math." with a word boundary
      if (/(?:^|[^\w.])math\.$/.test(textBefore)) {
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
              { value: `\`\`\`python\n${mathMatch.detail ?? mathMatch.label}\n\`\`\`` },
              { value: mathMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show random member docs when preceded by "random." with a word boundary
      if (/(?:^|[^\w.])random\.$/.test(textBefore)) {
        const randMatch = RANDOM_MEMBERS.find((item) => item.label === name);
        if (randMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${randMatch.detail ?? randMatch.label}\n\`\`\`` },
              { value: randMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show sys member docs when preceded by "sys." with a word boundary
      if (/(?:^|[^\w.])sys\.$/.test(textBefore)) {
        const sysMatch = SYS_MEMBERS.find((item) => item.label === name);
        if (sysMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${sysMatch.detail ?? sysMatch.label}\n\`\`\`` },
              { value: sysMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show os.path member docs when preceded by "os.path." with a word boundary
      if (/(?:^|[^\w.])os\.path\.$/.test(textBefore)) {
        const pathMatch = OS_PATH_MEMBERS.find((item) => item.label === name);
        if (pathMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${pathMatch.detail ?? pathMatch.label}\n\`\`\`` },
              { value: pathMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show os member docs when preceded by "os." with a word boundary (and not os.path.)
      if (/(?:^|[^\w.])os\.$/.test(textBefore)) {
        const osMatch = OS_MEMBERS.find((item) => item.label === name);
        if (osMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${osMatch.detail ?? osMatch.label}\n\`\`\`` },
              { value: osMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show json member docs when preceded by "json." with a word boundary
      if (/(?:^|[^\w.])json\.$/.test(textBefore)) {
        const jsonMatch = JSON_MEMBERS.find((item) => item.label === name);
        if (jsonMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${jsonMatch.detail ?? jsonMatch.label}\n\`\`\`` },
              { value: jsonMatch.documentation ?? "" },
            ],
          };
        }
      }

      // Only show Builtin functions and module docs when not preceded by a dot
      if (!textBefore.endsWith(".")) {
        const builtinMatch = BUILTIN_FUNCTIONS.find((item) => item.label === name);
        if (builtinMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\n${builtinMatch.detail ?? builtinMatch.label}\n\`\`\`` },
              { value: builtinMatch.documentation ?? "" },
            ],
          };
        }

        const moduleMatch = PYTHON_MODULES.find((mod) => mod.name === name);
        if (moduleMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`python\nmodule ${moduleMatch.name}\n\`\`\`` },
              { value: moduleMatch.doc },
            ],
          };
        }
      }

      return null;
    },
  });

  interface SigDef {
    label: string;
    doc: string;
    params: { label: string; doc: string }[];
    varargPositionalIdx?: number;
  }

  // 3. Signature Help Provider: shows parameter hints for known calls, tracking strings & nested parens
  m.languages.registerSignatureHelpProvider("python", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      // Scan up to 50 lines backwards to support multiline function calls
      const startLine = Math.max(1, position.lineNumber - 50);
      const textBefore = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Strip Python comments from each line before parsing, so that
      // apostrophes inside comments (like # don't forget) do not
      // corrupt the string-tracking state.
      const strippedLines = textBefore.split("\n").map((l) => stripPythonComment(l));
      const cleanedText = strippedLines.join("\n");

      // Parse from left to right tracking quotes ("...", '...') and nested parenthesis depth
      const parenStack: { openIdx: number; argCount: number; lastCommaIdx: number }[] = [];
      let inQuote: string | null = null;
      let isEscaped = false;
      let bracketDepth = 0;
      let braceDepth = 0;

      for (let i = 0; i < cleanedText.length; i++) {
        const ch = cleanedText[i];
        if (isEscaped) {
          isEscaped = false;
          continue;
        }
        if (ch === "\\") {
          isEscaped = true;
          continue;
        }
        if (inQuote !== null) {
          if (ch === inQuote) {
            inQuote = null;
          }
          continue;
        }
        if (ch === '"' || ch === "'") {
          inQuote = ch;
          continue;
        }

        if (ch === "(") {
          parenStack.push({ openIdx: i, argCount: 0, lastCommaIdx: i });
        } else if (ch === ")") {
          parenStack.pop();
        } else if (ch === "[") {
          bracketDepth++;
        } else if (ch === "]") {
          if (bracketDepth > 0) bracketDepth--;
        } else if (ch === "{") {
          braceDepth++;
        } else if (ch === "}") {
          if (braceDepth > 0) braceDepth--;
        } else if (ch === ",") {
          if (parenStack.length > 0 && bracketDepth === 0 && braceDepth === 0) {
            parenStack[parenStack.length - 1].argCount++;
            parenStack[parenStack.length - 1].lastCommaIdx = i;
          }
        }
      }

      if (parenStack.length === 0) return null;

      const activeCall = parenStack[parenStack.length - 1];
      const callEnd = activeCall.openIdx;
      let activeParameter = activeCall.argCount;

      const textBeforeCall = cleanedText.slice(0, callEnd).trimEnd();
      // Match full qualified target chain (e.g. "os.path.join" or "math.sqrt" or "print")
      const match = textBeforeCall.match(/(?:^|[^\w.])([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)$/);
      if (!match) return null;

      const callTarget = match[1];

      const signaturesMap: Record<string, SigDef> = {
        print: {
          label: "print(*values, sep=' ', end='\\n', file=sys.stdout, flush=False)",
          doc: "Prints the values to a stream, or to sys.stdout by default.",
          params: [
            { label: "*values", doc: "Objects to print; any number of positional arguments." },
            { label: "sep=' '", doc: "String inserted between values, default a space." },
            { label: "end='\\n'", doc: "String appended after the last value, default a newline." },
            {
              label: "file=sys.stdout",
              doc: "A file-like stream; defaults to current sys.stdout.",
            },
            { label: "flush=False", doc: "Whether to forcibly flush the stream." },
          ],
          varargPositionalIdx: 0,
        },
        range: {
          label: "range(start, stop, step=1)",
          doc: "Returns a sequence of numbers from start to stop by step.",
          params: [
            {
              label: "start",
              doc: "Integer starting number (defaults to 0 if only stop is given).",
            },
            { label: "stop", doc: "Integer stopping number (exclusive limit)." },
            { label: "step=1", doc: "Integer step difference (defaults to 1)." },
          ],
        },
        input: {
          label: "input(prompt='') -> str",
          doc: "Read a string from standard input. The trailing newline is stripped.",
          params: [
            {
              label: "prompt=''",
              doc: "Optional prompt message displayed on stdout without newline.",
            },
          ],
        },
        round: {
          label: "round(number, ndigits=None) -> number",
          doc: "Round a number to a given precision in decimal digits.",
          params: [
            { label: "number", doc: "Number to round." },
            { label: "ndigits=None", doc: "Number of decimal digits to round to." },
          ],
        },
        int: {
          label: "int(x=0, base=10) -> int",
          doc: "Convert a number or string to an integer.",
          params: [
            { label: "x=0", doc: "Number or string to convert." },
            { label: "base=10", doc: "Numeric base (between 2 and 36) when converting a string." },
          ],
        },
        float: {
          label: "float(x=0.0) -> float",
          doc: "Convert a string or number to a floating point number.",
          params: [{ label: "x=0.0", doc: "Number or string to convert." }],
        },
        str: {
          label: "str(object='') -> str",
          doc: "Create a new string object from the given object.",
          params: [{ label: "object=''", doc: "Object to convert to string." }],
        },
        len: {
          label: "len(obj) -> int",
          doc: "Return the number of items in a container.",
          params: [{ label: "obj", doc: "A sequence or collection container." }],
        },
        open: {
          label: "open(file, mode='r', encoding=None)",
          doc: "Open file and return a stream.",
          params: [
            { label: "file", doc: "Path to file to open." },
            { label: "mode='r'", doc: "Opening mode ('r', 'w', 'a', 'rb', 'wb')." },
            {
              label: "encoding=None",
              doc: "Encoding used to decode or encode the file (e.g. 'utf-8').",
            },
          ],
        },
        isinstance: {
          label: "isinstance(obj, class_or_tuple) -> bool",
          doc: "Return whether an object is an instance of a class or a subclass thereof.",
          params: [
            { label: "obj", doc: "Object to test." },
            {
              label: "class_or_tuple",
              doc: "Class, type, or tuple of classes/types to check against.",
            },
          ],
        },
        enumerate: {
          label: "enumerate(iterable, start=0)",
          doc: "Return an enumerate object yielding (index, value) pairs.",
          params: [
            { label: "iterable", doc: "An iterable sequence." },
            { label: "start=0", doc: "Starting index value." },
          ],
        },
        zip: {
          label: "zip(*iterables, strict=False)",
          doc: "Iterate over several iterables in parallel.",
          params: [
            { label: "*iterables", doc: "Two or more iterables to aggregate in parallel." },
            {
              label: "strict=False",
              doc: "If True, raises ValueError if an iterable exhausts before others.",
            },
          ],
          varargPositionalIdx: 0,
        },
        min: {
          label: "min(arg1, arg2, *args, key=None)",
          doc: "Return the smallest item among two or more arguments.",
          params: [
            { label: "arg1", doc: "First item to compare or single iterable." },
            { label: "arg2", doc: "Second item to compare." },
            { label: "*args", doc: "Additional items to compare." },
            { label: "key=None", doc: "One-argument ordering function." },
          ],
        },
        max: {
          label: "max(arg1, arg2, *args, key=None)",
          doc: "Return the largest item among two or more arguments.",
          params: [
            { label: "arg1", doc: "First item to compare or single iterable." },
            { label: "arg2", doc: "Second item to compare." },
            { label: "*args", doc: "Additional items to compare." },
            { label: "key=None", doc: "One-argument ordering function." },
          ],
        },
        abs: {
          label: "abs(x) -> number",
          doc: "Return the absolute value of the argument.",
          params: [{ label: "x", doc: "A number whose magnitude is returned." }],
        },
        sum: {
          label: "sum(iterable, start=0) -> number",
          doc: "Return the sum of a 'start' value plus an iterable of numbers.",
          params: [
            { label: "iterable", doc: "Iterable of numbers to sum." },
            { label: "start=0", doc: "Starting value added to the sum of elements." },
          ],
        },
        sorted: {
          label: "sorted(iterable, *, key=None, reverse=False) -> list",
          doc: "Return a new list containing all items from the iterable in ascending order.",
          params: [
            { label: "iterable", doc: "Sequence or collection to sort." },
            { label: "key=None", doc: "Function of one argument to extract a comparison key." },
            { label: "reverse=False", doc: "If True, sort elements in descending order." },
          ],
        },
        "math.sqrt": {
          label: "math.sqrt(x) -> float",
          doc: "Return the square root of x.",
          params: [{ label: "x", doc: "Non-negative float value." }],
        },
        "math.pow": {
          label: "math.pow(x, y) -> float",
          doc: "Return x**y (x to the power of y).",
          params: [
            { label: "x", doc: "Base value." },
            { label: "y", doc: "Exponent value." },
          ],
        },
        "math.floor": {
          label: "math.floor(x) -> int",
          doc: "Return the floor of x as an Integral.",
          params: [{ label: "x", doc: "Float value to round down." }],
        },
        "math.ceil": {
          label: "math.ceil(x) -> int",
          doc: "Return the ceiling of x as an Integral.",
          params: [{ label: "x", doc: "Float value to round up." }],
        },
        "math.gcd": {
          label: "math.gcd(*integers) -> int",
          doc: "Greatest Common Divisor.",
          params: [{ label: "*integers", doc: "Two or more integer values." }],
          varargPositionalIdx: 0,
        },
        "math.log": {
          label: "math.log(x, base=math.e) -> float",
          doc: "Return the logarithm of x to the given base.",
          params: [
            { label: "x", doc: "Positive float value." },
            { label: "base=math.e", doc: "Logarithmic base (default e)." },
          ],
        },
        "random.randint": {
          label: "random.randint(a, b) -> int",
          doc: "Return random integer in range [a, b], including both end points.",
          params: [
            { label: "a", doc: "Lower inclusive bound." },
            { label: "b", doc: "Upper inclusive bound." },
          ],
        },
        "random.choice": {
          label: "random.choice(seq) -> Any",
          doc: "Choose a random element from a non-empty sequence.",
          params: [{ label: "seq", doc: "A non-empty sequence." }],
        },
        "random.sample": {
          label: "random.sample(population, k) -> list",
          doc: "Chooses k unique random elements from a population sequence or set.",
          params: [
            { label: "population", doc: "A sequence or set of items." },
            { label: "k", doc: "Number of unique samples to choose." },
          ],
        },
        "json.dumps": {
          label: "json.dumps(obj, indent=None) -> str",
          doc: "Serialize obj to a JSON formatted str.",
          params: [
            { label: "obj", doc: "Python object to serialize to a JSON string." },
            { label: "indent=None", doc: "Indentation level for formatting." },
          ],
        },
        "json.loads": {
          label: "json.loads(s) -> Any",
          doc: "Deserialize s (a str, bytes or bytearray instance containing a JSON document) to a Python object.",
          params: [{ label: "s", doc: "JSON string to deserialize." }],
        },
        "os.path.join": {
          label: "os.path.join(path, *paths) -> str",
          doc: "Join two or more pathname components inserting '/' as needed.",
          params: [
            { label: "path", doc: "Initial path segment." },
            { label: "*paths", doc: "Additional path segments to append." },
          ],
          varargPositionalIdx: 1,
        },
        "sys.exit": {
          label: "sys.exit(status=0)",
          doc: "Exit the interpreter by raising SystemExit(status).",
          params: [{ label: "status=0", doc: "Exit code or error message." }],
        },
      };

      // Also support "path.join" as alias for "os.path.join"
      signaturesMap["path.join"] = signaturesMap["os.path.join"];

      const sigInfo =
        signaturesMap[callTarget] || signaturesMap[callTarget.split(".").slice(-2).join(".")];
      if (!sigInfo) return null;

      // Handle varargs highlighting (e.g. print(a, b, c) keeps *values active for all positional args)
      const currentArgText = cleanedText.slice(activeCall.lastCommaIdx + 1).trim();
      if (sigInfo.varargPositionalIdx !== undefined) {
        const isKeywordArg = currentArgText.includes("=");
        if (!isKeywordArg && activeParameter >= sigInfo.varargPositionalIdx) {
          activeParameter = sigInfo.varargPositionalIdx;
        } else if (isKeywordArg) {
          const kwName = currentArgText.split("=")[0].trim();
          const kwIndex = sigInfo.params.findIndex((p) => p.label.startsWith(kwName));
          if (kwIndex !== -1) {
            activeParameter = kwIndex;
          }
        }
      }

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
