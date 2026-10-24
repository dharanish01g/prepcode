import * as monacoDefault from "monaco-editor";
import {
  type CompletionItemDef as MethodItem,
  deduplicateSuggestions,
  toCompletionItems,
} from "./completion-utils.ts";

type Monaco = typeof monacoDefault;

// --- System Members -------------------------------------------------------------------

const SYSTEM_MEMBERS: MethodItem[] = [
  {
    label: "out",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "out",
    detail: "static final PrintStream System.out",
    documentation: "The 'standard' output stream.",
  },
  {
    label: "err",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "err",
    detail: "static final PrintStream System.err",
    documentation: "The 'standard' error output stream.",
  },
  {
    label: "in",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "in",
    detail: "static final InputStream System.in",
    documentation: "The 'standard' input stream.",
  },
  {
    label: "currentTimeMillis",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "currentTimeMillis()",
    detail: "static long System.currentTimeMillis()",
    documentation: "Returns the current time in milliseconds since UTC midnight, January 1, 1970.",
  },
  {
    label: "nanoTime",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "nanoTime()",
    detail: "static long System.nanoTime()",
    documentation:
      "Returns the current value of the running Java Virtual Machine's high-resolution time source, in nanoseconds.",
  },
  {
    label: "arraycopy",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "arraycopy(${1:src}, ${2:srcPos}, ${3:dest}, ${4:destPos}, ${5:length});",
    detail:
      "static void System.arraycopy(Object src, int srcPos, Object dest, int destPos, int length)",
    documentation:
      "Copies an array from the specified source array to the specified destination array.",
  },
  {
    label: "exit",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "exit(${1:status});",
    detail: "static void System.exit(int status)",
    documentation: "Terminates the currently running Java Virtual Machine.",
  },
  {
    label: "gc",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "gc();",
    detail: "static void System.gc()",
    documentation: "Runs the garbage collector in the Java Virtual Machine.",
  },
  {
    label: "lineSeparator",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "lineSeparator()",
    detail: "static String System.lineSeparator()",
    documentation: "Returns the system-dependent line separator string.",
  },
];

const PRINTSTREAM_MEMBERS: MethodItem[] = [
  {
    label: "println",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "println(${1});",
    detail: "void PrintStream.println(Object x)",
    documentation: "Prints an Object and then terminates the line.",
  },
  {
    label: "print",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "print(${1});",
    detail: "void PrintStream.print(Object x)",
    documentation: "Prints an object.",
  },
  {
    label: "printf",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: 'printf("${1:%s}\\n", ${2:args});',
    detail: "PrintStream PrintStream.printf(String format, Object... args)",
    documentation: "A convenience method to write a formatted string to this output stream.",
  },
  {
    label: "format",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: 'format("${1:%s}\\n", ${2:args});',
    detail: "PrintStream PrintStream.format(String format, Object... args)",
    documentation:
      "Writes a formatted string to this output stream using the specified format string and arguments.",
  },
  {
    label: "flush",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "flush();",
    detail: "void PrintStream.flush()",
    documentation: "Flushes the stream.",
  },
];

// --- Math Members ---------------------------------------------------------------------

const MATH_MEMBERS: MethodItem[] = [
  {
    label: "abs",
    snippet: "abs(${1:a})",
    detail: "static int/double Math.abs(int/double a)",
    documentation: "Returns the absolute value of the argument.",
  },
  {
    label: "max",
    snippet: "max(${1:a}, ${2:b})",
    detail: "static int/double Math.max(int/double a, int/double b)",
    documentation: "Returns the greater of two values.",
  },
  {
    label: "min",
    snippet: "min(${1:a}, ${2:b})",
    detail: "static int/double Math.min(int/double a, int/double b)",
    documentation: "Returns the smaller of two values.",
  },
  {
    label: "sqrt",
    snippet: "sqrt(${1:a})",
    detail: "static double Math.sqrt(double a)",
    documentation: "Returns the correctly rounded positive square root of a double value.",
  },
  {
    label: "cbrt",
    snippet: "cbrt(${1:a})",
    detail: "static double Math.cbrt(double a)",
    documentation: "Returns the cube root of a double value.",
  },
  {
    label: "pow",
    snippet: "pow(${1:a}, ${2:b})",
    detail: "static double Math.pow(double a, double b)",
    documentation:
      "Returns the value of the first argument raised to the power of the second argument.",
  },
  {
    label: "round",
    snippet: "round(${1:a})",
    detail: "static long/int Math.round(double/float a)",
    documentation: "Returns the closest long or int to the argument.",
  },
  {
    label: "floor",
    snippet: "floor(${1:a})",
    detail: "static double Math.floor(double a)",
    documentation:
      "Returns the largest (closest to positive infinity) double value that is less than or equal to the argument and is equal to a mathematical integer.",
  },
  {
    label: "ceil",
    snippet: "ceil(${1:a})",
    detail: "static double Math.ceil(double a)",
    documentation:
      "Returns the smallest (closest to negative infinity) double value that is greater than or equal to the argument and is equal to a mathematical integer.",
  },
  {
    label: "random",
    snippet: "random()",
    detail: "static double Math.random()",
    documentation:
      "Returns a double value with a positive sign, greater than or equal to 0.0 and less than 1.0.",
  },
  {
    label: "sin",
    snippet: "sin(${1:a})",
    detail: "static double Math.sin(double a)",
    documentation: "Returns the trigonometric sine of an angle.",
  },
  {
    label: "cos",
    snippet: "cos(${1:a})",
    detail: "static double Math.cos(double a)",
    documentation: "Returns the trigonometric cosine of an angle.",
  },
  {
    label: "tan",
    snippet: "tan(${1:a})",
    detail: "static double Math.tan(double a)",
    documentation: "Returns the trigonometric tangent of an angle.",
  },
  {
    label: "log",
    snippet: "log(${1:a})",
    detail: "static double Math.log(double a)",
    documentation: "Returns the natural logarithm (base e) of a double value.",
  },
  {
    label: "log10",
    snippet: "log10(${1:a})",
    detail: "static double Math.log10(double a)",
    documentation: "Returns the base 10 logarithm of a double value.",
  },
  {
    label: "signum",
    snippet: "signum(${1:d})",
    detail: "static double Math.signum(double d)",
    documentation:
      "Returns the signum function of the argument; zero if the argument is zero, 1.0 if the argument is greater than zero, -1.0 if the argument is less than zero.",
  },
  {
    label: "PI",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "PI",
    detail: "static final double Math.PI = 3.141592653589793",
    documentation:
      "The double value that is closer than any other to pi, the ratio of the circumference of a circle to its diameter.",
  },
  {
    label: "E",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "E",
    detail: "static final double Math.E = 2.718281828459045",
    documentation:
      "The double value that is closer than any other to e, the base of the natural logarithms.",
  },
];

// --- Arrays Members -------------------------------------------------------------------

const ARRAYS_MEMBERS: MethodItem[] = [
  {
    label: "sort",
    snippet: "sort(${1:a});",
    detail: "static void Arrays.sort(int[]/Object[] a)",
    documentation: "Sorts the specified array into ascending numerical/natural order.",
  },
  {
    label: "binarySearch",
    snippet: "binarySearch(${1:a}, ${2:key})",
    detail: "static int Arrays.binarySearch(int[] a, int key)",
    documentation:
      "Searches the specified array for the specified value using the binary search algorithm.",
  },
  {
    label: "fill",
    snippet: "fill(${1:a}, ${2:val});",
    detail: "static void Arrays.fill(int[] a, int val)",
    documentation: "Assigns the specified value to each element of the specified array.",
  },
  {
    label: "equals",
    snippet: "equals(${1:a}, ${2:b})",
    detail: "static boolean Arrays.equals(int[] a, int[] b)",
    documentation: "Returns true if the two specified arrays are equal to one another.",
  },
  {
    label: "deepEquals",
    snippet: "deepEquals(${1:a1}, ${2:a2})",
    detail: "static boolean Arrays.deepEquals(Object[] a1, Object[] a2)",
    documentation: "Returns true if the two specified arrays are deeply equal to one another.",
  },
  {
    label: "toString",
    snippet: "toString(${1:a})",
    detail: "static String Arrays.toString(int[]/Object[] a)",
    documentation: "Returns a string representation of the contents of the specified array.",
  },
  {
    label: "deepToString",
    snippet: "deepToString(${1:a})",
    detail: "static String Arrays.deepToString(Object[] a)",
    documentation: "Returns a string representation of the 'deep contents' of the specified array.",
  },
  {
    label: "copyOf",
    snippet: "copyOf(${1:original}, ${2:newLength})",
    detail: "static T[] Arrays.copyOf(T[] original, int newLength)",
    documentation:
      "Copies the specified array, truncating or padding with zeros/nulls (if necessary) so the copy has the specified length.",
  },
  {
    label: "copyOfRange",
    snippet: "copyOfRange(${1:original}, ${2:from}, ${3:to})",
    detail: "static T[] Arrays.copyOfRange(T[] original, int from, int to)",
    documentation: "Copies the specified range of the specified array into a new array.",
  },
  {
    label: "asList",
    snippet: "asList(${1:a})",
    detail: "static <T> List<T> Arrays.asList(T... a)",
    documentation: "Returns a fixed-size list backed by the specified array.",
  },
];

// --- Array Instance Members -----------------------------------------------------------

const ARRAY_MEMBERS: MethodItem[] = [
  {
    label: "length",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "length",
    detail: "final int [].length",
    documentation: "The number of components (length) of the array.",
  },
  {
    label: "clone",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "clone()",
    detail: "Object [].clone()",
    documentation: "Creates and returns a copy of this array.",
  },
];

// --- Collections Members --------------------------------------------------------------

const COLLECTIONS_MEMBERS: MethodItem[] = [
  {
    label: "sort",
    snippet: "sort(${1:list});",
    detail: "static <T extends Comparable<? super T>> void Collections.sort(List<T> list)",
    documentation:
      "Sorts the specified list into ascending order, according to the natural ordering of its elements.",
  },
  {
    label: "reverse",
    snippet: "reverse(${1:list});",
    detail: "static void Collections.reverse(List<?> list)",
    documentation: "Reverses the order of the elements in the specified list.",
  },
  {
    label: "shuffle",
    snippet: "shuffle(${1:list});",
    detail: "static void Collections.shuffle(List<?> list)",
    documentation: "Randomly permutes the specified list using a default source of randomness.",
  },
  {
    label: "min",
    snippet: "min(${1:coll})",
    detail:
      "static <T extends Object & Comparable<? super T>> T Collections.min(Collection<? extends T> coll)",
    documentation:
      "Returns the minimum element of the given collection, according to the natural ordering of its elements.",
  },
  {
    label: "max",
    snippet: "max(${1:coll})",
    detail:
      "static <T extends Object & Comparable<? super T>> T Collections.max(Collection<? extends T> coll)",
    documentation:
      "Returns the maximum element of the given collection, according to the natural ordering of its elements.",
  },
  {
    label: "binarySearch",
    snippet: "binarySearch(${1:list}, ${2:key})",
    detail:
      "static <T> int Collections.binarySearch(List<? extends Comparable<? super T>> list, T key)",
    documentation:
      "Searches the specified list for the specified object using the binary search algorithm.",
  },
  {
    label: "swap",
    snippet: "swap(${1:list}, ${2:i}, ${3:j});",
    detail: "static void Collections.swap(List<?> list, int i, int j)",
    documentation: "Swaps the elements at the specified positions in the specified list.",
  },
  {
    label: "frequency",
    snippet: "frequency(${1:c}, ${2:o})",
    detail: "static int Collections.frequency(Collection<?> c, Object o)",
    documentation:
      "Returns the number of elements in the specified collection equal to the specified object.",
  },
  {
    label: "disjoint",
    snippet: "disjoint(${1:c1}, ${2:c2})",
    detail: "static boolean Collections.disjoint(Collection<?> c1, Collection<?> c2)",
    documentation: "Returns true if the two specified collections have no elements in common.",
  },
  {
    label: "emptyList",
    snippet: "emptyList()",
    detail: "static <T> List<T> Collections.emptyList()",
    documentation: "Returns an empty list (immutable).",
  },
  {
    label: "emptySet",
    snippet: "emptySet()",
    detail: "static <T> Set<T> Collections.emptySet()",
    documentation: "Returns an empty set (immutable).",
  },
  {
    label: "emptyMap",
    snippet: "emptyMap()",
    detail: "static <K, V> Map<K, V> Collections.emptyMap()",
    documentation: "Returns an empty map (immutable).",
  },
];

// --- Primitive Wrapper Static Members -------------------------------------------------

const INTEGER_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "parseInt",
    snippet: "parseInt(${1:s})",
    detail: "static int Integer.parseInt(String s)",
    documentation: "Parses the string argument as a signed decimal integer.",
  },
  {
    label: "valueOf",
    snippet: "valueOf(${1:s})",
    detail: "static Integer Integer.valueOf(String s / int i)",
    documentation: "Returns an Integer instance representing the specified int or String value.",
  },
  {
    label: "toString",
    snippet: "toString(${1:i})",
    detail: "static String Integer.toString(int i)",
    documentation: "Returns a String object representing the specified integer.",
  },
  {
    label: "toBinaryString",
    snippet: "toBinaryString(${1:i})",
    detail: "static String Integer.toBinaryString(int i)",
    documentation:
      "Returns a string representation of the integer argument as an unsigned integer in base 2.",
  },
  {
    label: "toHexString",
    snippet: "toHexString(${1:i})",
    detail: "static String Integer.toHexString(int i)",
    documentation:
      "Returns a string representation of the integer argument as an unsigned integer in base 16.",
  },
  {
    label: "compare",
    snippet: "compare(${1:x}, ${2:y})",
    detail: "static int Integer.compare(int x, int y)",
    documentation: "Compares two int values numerically.",
  },
  {
    label: "max",
    snippet: "max(${1:a}, ${2:b})",
    detail: "static int Integer.max(int a, int b)",
    documentation: "Returns the greater of two int values as if by calling Math.max.",
  },
  {
    label: "min",
    snippet: "min(${1:a}, ${2:b})",
    detail: "static int Integer.min(int a, int b)",
    documentation: "Returns the smaller of two int values as if by calling Math.min.",
  },
  {
    label: "bitCount",
    snippet: "bitCount(${1:i})",
    detail: "static int Integer.bitCount(int i)",
    documentation:
      "Returns the number of one-bits in the two's complement binary representation of the specified int value.",
  },
  {
    label: "MAX_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "MAX_VALUE",
    detail: "static final int Integer.MAX_VALUE = 2147483647",
    documentation: "A constant holding the maximum value an int can have, 2^31 - 1.",
  },
  {
    label: "MIN_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "MIN_VALUE",
    detail: "static final int Integer.MIN_VALUE = -2147483648",
    documentation: "A constant holding the minimum value an int can have, -2^31.",
  },
];

const LONG_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "parseLong",
    snippet: "parseLong(${1:s})",
    detail: "static long Long.parseLong(String s)",
    documentation: "Parses the string argument as a signed decimal long.",
  },
  {
    label: "valueOf",
    snippet: "valueOf(${1:s})",
    detail: "static Long Long.valueOf(String s / long l)",
    documentation: "Returns a Long instance representing the specified long value.",
  },
  {
    label: "toString",
    snippet: "toString(${1:l})",
    detail: "static String Long.toString(long l)",
    documentation: "Returns a String object representing the specified long.",
  },
  {
    label: "compare",
    snippet: "compare(${1:x}, ${2:y})",
    detail: "static int Long.compare(long x, long y)",
    documentation: "Compares two long values numerically.",
  },
  {
    label: "MAX_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "MAX_VALUE",
    detail: "static final long Long.MAX_VALUE = 9223372036854775807L",
    documentation: "A constant holding the maximum value a long can have, 2^63 - 1.",
  },
  {
    label: "MIN_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "MIN_VALUE",
    detail: "static final long Long.MIN_VALUE = -9223372036854775808L",
    documentation: "A constant holding the minimum value a long can have, -2^63.",
  },
];

const DOUBLE_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "parseDouble",
    snippet: "parseDouble(${1:s})",
    detail: "static double Double.parseDouble(String s)",
    documentation:
      "Returns a new double initialized to the value represented by the specified String.",
  },
  {
    label: "valueOf",
    snippet: "valueOf(${1:s})",
    detail: "static Double Double.valueOf(String s / double d)",
    documentation: "Returns a Double instance representing the specified double value.",
  },
  {
    label: "isNaN",
    snippet: "isNaN(${1:v})",
    detail: "static boolean Double.isNaN(double v)",
    documentation:
      "Returns true if the specified number is a Not-a-Number (NaN) value, false otherwise.",
  },
  {
    label: "isInfinite",
    snippet: "isInfinite(${1:v})",
    detail: "static boolean Double.isInfinite(double v)",
    documentation:
      "Returns true if the specified number is infinitely large in magnitude, false otherwise.",
  },
  {
    label: "compare",
    snippet: "compare(${1:d1}, ${2:d2})",
    detail: "static int Double.compare(double d1, double d2)",
    documentation: "Compares the two specified double values.",
  },
];

const CHARACTER_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "isDigit",
    snippet: "isDigit(${1:ch})",
    detail: "static boolean Character.isDigit(char ch)",
    documentation: "Determines if the specified character is a digit.",
  },
  {
    label: "isLetter",
    snippet: "isLetter(${1:ch})",
    detail: "static boolean Character.isLetter(char ch)",
    documentation: "Determines if the specified character is a letter.",
  },
  {
    label: "isLetterOrDigit",
    snippet: "isLetterOrDigit(${1:ch})",
    detail: "static boolean Character.isLetterOrDigit(char ch)",
    documentation: "Determines if the specified character is a letter or digit.",
  },
  {
    label: "isWhitespace",
    snippet: "isWhitespace(${1:ch})",
    detail: "static boolean Character.isWhitespace(char ch)",
    documentation: "Determines if the specified character is white space according to Java.",
  },
  {
    label: "isUpperCase",
    snippet: "isUpperCase(${1:ch})",
    detail: "static boolean Character.isUpperCase(char ch)",
    documentation: "Determines if the specified character is an uppercase character.",
  },
  {
    label: "isLowerCase",
    snippet: "isLowerCase(${1:ch})",
    detail: "static boolean Character.isLowerCase(char ch)",
    documentation: "Determines if the specified character is a lowercase character.",
  },
  {
    label: "toUpperCase",
    snippet: "toUpperCase(${1:ch})",
    detail: "static char Character.toUpperCase(char ch)",
    documentation:
      "Converts the character argument to uppercase using case mapping information from the UnicodeData file.",
  },
  {
    label: "toLowerCase",
    snippet: "toLowerCase(${1:ch})",
    detail: "static char Character.toLowerCase(char ch)",
    documentation:
      "Converts the character argument to lowercase using case mapping information from the UnicodeData file.",
  },
  {
    label: "toString",
    snippet: "toString(${1:ch})",
    detail: "static String Character.toString(char ch)",
    documentation: "Returns a String object representing the specified char value.",
  },
  {
    label: "getNumericValue",
    snippet: "getNumericValue(${1:ch})",
    detail: "static int Character.getNumericValue(char ch)",
    documentation: "Returns the int value that the specified Unicode character represents.",
  },
];

// --- Boolean Static Members -----------------------------------------------------------

const BOOLEAN_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "parseBoolean",
    snippet: "parseBoolean(${1:s})",
    detail: "static boolean Boolean.parseBoolean(String s)",
    documentation: "Parses the string argument as a boolean.",
  },
  {
    label: "valueOf",
    snippet: "valueOf(${1:b})",
    detail: "static Boolean Boolean.valueOf(boolean b)",
    documentation: "Returns a Boolean instance representing the specified boolean value.",
  },
  {
    label: "compare",
    snippet: "compare(${1:x}, ${2:y})",
    detail: "static int Boolean.compare(boolean x, boolean y)",
    documentation: "Compares two boolean values.",
  },
  {
    label: "TRUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "TRUE",
    detail: "static final Boolean Boolean.TRUE",
    documentation: "The Boolean object corresponding to the primitive value true.",
  },
  {
    label: "FALSE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "FALSE",
    detail: "static final Boolean Boolean.FALSE",
    documentation: "The Boolean object corresponding to the primitive value false.",
  },
];

// --- Objects Static Members -----------------------------------------------------------

const OBJECTS_MEMBERS: MethodItem[] = [
  {
    label: "equals",
    snippet: "equals(${1:a}, ${2:b})",
    detail: "static boolean Objects.equals(Object a, Object b)",
    documentation: "Returns true if the arguments are equal to each other and false otherwise.",
  },
  {
    label: "hashCode",
    snippet: "hashCode(${1:o})",
    detail: "static int Objects.hashCode(Object o)",
    documentation: "Returns the hash code of a non-null argument and 0 for a null argument.",
  },
  {
    label: "requireNonNull",
    snippet: "requireNonNull(${1:obj})",
    detail: "static <T> T Objects.requireNonNull(T obj)",
    documentation: "Checks that the specified object reference is not null.",
  },
  {
    label: "isNull",
    snippet: "isNull(${1:obj})",
    detail: "static boolean Objects.isNull(Object obj)",
    documentation: "Returns true if the provided reference is null otherwise returns false.",
  },
  {
    label: "nonNull",
    snippet: "nonNull(${1:obj})",
    detail: "static boolean Objects.nonNull(Object obj)",
    documentation: "Returns true if the provided reference is non-null otherwise returns false.",
  },
];

// --- String Members -------------------------------------------------------------------

const STRING_INSTANCE_MEMBERS: MethodItem[] = [
  {
    label: "length",
    snippet: "length()",
    detail: "int String.length()",
    documentation: "Returns the length of this string.",
  },
  {
    label: "charAt",
    snippet: "charAt(${1:index})",
    detail: "char String.charAt(int index)",
    documentation: "Returns the char value at the specified index.",
  },
  {
    label: "substring",
    snippet: "substring(${1:beginIndex})",
    detail: "String String.substring(int beginIndex [, int endIndex])",
    documentation: "Returns a string that is a substring of this string.",
  },
  {
    label: "indexOf",
    snippet: "indexOf(${1:str})",
    detail: "int String.indexOf(String str / char ch)",
    documentation:
      "Returns the index within this string of the first occurrence of the specified substring or character.",
  },
  {
    label: "lastIndexOf",
    snippet: "lastIndexOf(${1:str})",
    detail: "int String.lastIndexOf(String str / char ch)",
    documentation:
      "Returns the index within this string of the last occurrence of the specified substring.",
  },
  {
    label: "contains",
    snippet: "contains(${1:s})",
    detail: "boolean String.contains(CharSequence s)",
    documentation:
      "Returns true if and only if this string contains the specified sequence of char values.",
  },
  {
    label: "equals",
    snippet: "equals(${1:anObject})",
    detail: "boolean String.equals(Object anObject)",
    documentation: "Compares this string to the specified object.",
  },
  {
    label: "equalsIgnoreCase",
    snippet: "equalsIgnoreCase(${1:anotherString})",
    detail: "boolean String.equalsIgnoreCase(String anotherString)",
    documentation: "Compares this String to another String, ignoring case considerations.",
  },
  {
    label: "compareTo",
    snippet: "compareTo(${1:anotherString})",
    detail: "int String.compareTo(String anotherString)",
    documentation: "Compares two strings lexicographically.",
  },
  {
    label: "compareToIgnoreCase",
    snippet: "compareToIgnoreCase(${1:str})",
    detail: "int String.compareToIgnoreCase(String str)",
    documentation: "Compares two strings lexicographically, ignoring case differences.",
  },
  {
    label: "toLowerCase",
    snippet: "toLowerCase()",
    detail: "String String.toLowerCase()",
    documentation:
      "Converts all of the characters in this String to lower case using the rules of the default locale.",
  },
  {
    label: "toUpperCase",
    snippet: "toUpperCase()",
    detail: "String String.toUpperCase()",
    documentation:
      "Converts all of the characters in this String to upper case using the rules of the default locale.",
  },
  {
    label: "trim",
    snippet: "trim()",
    detail: "String String.trim()",
    documentation:
      "Returns a string whose value is this string, with all leading and trailing space removed.",
  },
  {
    label: "strip",
    snippet: "strip()",
    detail: "String String.strip()",
    documentation:
      "Returns a string whose value is this string, with all leading and trailing white space removed.",
  },
  {
    label: "replace",
    snippet: "replace(${1:target}, ${2:replacement})",
    detail: "String String.replace(CharSequence target, CharSequence replacement)",
    documentation:
      "Replaces each substring of this string that matches the literal target sequence with the specified literal replacement sequence.",
  },
  {
    label: "replaceAll",
    snippet: "replaceAll(${1:regex}, ${2:replacement})",
    detail: "String String.replaceAll(String regex, String replacement)",
    documentation:
      "Replaces each substring of this string that matches the given regular expression with the given replacement.",
  },
  {
    label: "split",
    snippet: 'split("${1:regex}")',
    detail: "String[] String.split(String regex)",
    documentation: "Splits this string around matches of the given regular expression.",
  },
  {
    label: "toCharArray",
    snippet: "toCharArray()",
    detail: "char[] String.toCharArray()",
    documentation: "Converts this string to a new character array.",
  },
  {
    label: "startsWith",
    snippet: "startsWith(${1:prefix})",
    detail: "boolean String.startsWith(String prefix)",
    documentation: "Tests if this string starts with the specified prefix.",
  },
  {
    label: "endsWith",
    snippet: "endsWith(${1:suffix})",
    detail: "boolean String.endsWith(String suffix)",
    documentation: "Tests if this string ends with the specified suffix.",
  },
  {
    label: "isEmpty",
    snippet: "isEmpty()",
    detail: "boolean String.isEmpty()",
    documentation: "Returns true if, and only if, length() is 0.",
  },
  {
    label: "isBlank",
    snippet: "isBlank()",
    detail: "boolean String.isBlank()",
    documentation:
      "Returns true if the string is empty or contains only white space codepoints, otherwise false.",
  },
  {
    label: "repeat",
    snippet: "repeat(${1:count})",
    detail: "String String.repeat(int count)",
    documentation:
      "Returns a string whose value is the concatenation of this string repeated count times.",
  },
  {
    label: "join",
    snippet: 'join("${1:, }", ${2:elements})',
    detail: "static String String.join(CharSequence delimiter, CharSequence... elements)",
    documentation:
      "Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter.",
  },
  {
    label: "valueOf",
    snippet: "valueOf(${1:data})",
    detail: "static String String.valueOf(Object obj / char[] data / int i)",
    documentation: "Returns the string representation of the argument.",
  },
];

/** `String.` only reaches the static methods. */
const STRING_STATIC_MEMBERS = STRING_INSTANCE_MEMBERS.filter((m) =>
  m.detail?.startsWith("static "),
);

// --- StringBuilder Members -----------------------------------------------------------

const STRINGBUILDER_MEMBERS: MethodItem[] = [
  {
    label: "append",
    snippet: "append(${1:str})",
    detail: "StringBuilder StringBuilder.append(Object obj / String str / int i)",
    documentation: "Appends the string representation of the argument to this sequence.",
  },
  {
    label: "insert",
    snippet: "insert(${1:offset}, ${2:str})",
    detail: "StringBuilder StringBuilder.insert(int offset, Object obj / String str)",
    documentation:
      "Inserts the string representation of the argument into this character sequence.",
  },
  {
    label: "delete",
    snippet: "delete(${1:start}, ${2:end})",
    detail: "StringBuilder StringBuilder.delete(int start, int end)",
    documentation: "Removes the characters in a substring of this sequence.",
  },
  {
    label: "deleteCharAt",
    snippet: "deleteCharAt(${1:index})",
    detail: "StringBuilder StringBuilder.deleteCharAt(int index)",
    documentation: "Removes the char at the specified position in this sequence.",
  },
  {
    label: "replace",
    snippet: "replace(${1:start}, ${2:end}, ${3:str})",
    detail: "StringBuilder StringBuilder.replace(int start, int end, String str)",
    documentation:
      "Replaces the characters in a substring of this sequence with characters in the specified String.",
  },
  {
    label: "reverse",
    snippet: "reverse()",
    detail: "StringBuilder StringBuilder.reverse()",
    documentation: "Causes this character sequence to be replaced by the reverse of the sequence.",
  },
  {
    label: "length",
    snippet: "length()",
    detail: "int StringBuilder.length()",
    documentation: "Returns the length (character count).",
  },
  {
    label: "charAt",
    snippet: "charAt(${1:index})",
    detail: "char StringBuilder.charAt(int index)",
    documentation: "Returns the char value in this sequence at the specified index.",
  },
  {
    label: "setCharAt",
    snippet: "setCharAt(${1:index}, ${2:ch});",
    detail: "void StringBuilder.setCharAt(int index, char ch)",
    documentation: "The character at the specified index is set to ch.",
  },
  {
    label: "substring",
    snippet: "substring(${1:start})",
    detail: "String StringBuilder.substring(int start [, int end])",
    documentation:
      "Returns a new String that contains a subsequence of characters currently contained in this character sequence.",
  },
  {
    label: "toString",
    snippet: "toString()",
    detail: "String StringBuilder.toString()",
    documentation: "Returns a string representing the data in this sequence.",
  },
];

// --- Scanner Members ------------------------------------------------------------------

const SCANNER_MEMBERS: MethodItem[] = [
  {
    label: "nextInt",
    snippet: "nextInt()",
    detail: "int Scanner.nextInt()",
    documentation: "Scans the next token of the input as an int.",
  },
  {
    label: "nextLong",
    snippet: "nextLong()",
    detail: "long Scanner.nextLong()",
    documentation: "Scans the next token of the input as a long.",
  },
  {
    label: "nextDouble",
    snippet: "nextDouble()",
    detail: "double Scanner.nextDouble()",
    documentation: "Scans the next token of the input as a double.",
  },
  {
    label: "next",
    snippet: "next()",
    detail: "String Scanner.next()",
    documentation: "Finds and returns the next complete token from this scanner.",
  },
  {
    label: "nextLine",
    snippet: "nextLine()",
    detail: "String Scanner.nextLine()",
    documentation:
      "Advances this scanner past the current line and returns the input that was skipped.",
  },
  {
    label: "hasNext",
    snippet: "hasNext()",
    detail: "boolean Scanner.hasNext()",
    documentation: "Returns true if this scanner has another token in its input.",
  },
  {
    label: "hasNextInt",
    snippet: "hasNextInt()",
    detail: "boolean Scanner.hasNextInt()",
    documentation:
      "Returns true if the next token in this scanner's input can be interpreted as an int value.",
  },
  {
    label: "hasNextLine",
    snippet: "hasNextLine()",
    detail: "boolean Scanner.hasNextLine()",
    documentation: "Returns true if there is another line in the input of this scanner.",
  },
  {
    label: "close",
    snippet: "close();",
    detail: "void Scanner.close()",
    documentation: "Closes this scanner.",
  },
];

// --- Collection & Map Members ---------------------------------------------------------

const LIST_MEMBERS: MethodItem[] = [
  {
    label: "add",
    snippet: "add(${1:element})",
    detail: "boolean List.add(E e) / void List.add(int index, E element)",
    documentation: "Appends the specified element to the end of this list.",
  },
  {
    label: "get",
    snippet: "get(${1:index})",
    detail: "E List.get(int index)",
    documentation: "Returns the element at the specified position in this list.",
  },
  {
    label: "set",
    snippet: "set(${1:index}, ${2:element})",
    detail: "E List.set(int index, E element)",
    documentation:
      "Replaces the element at the specified position in this list with the specified element.",
  },
  {
    label: "remove",
    snippet: "remove(${1:index})",
    detail: "E List.remove(int index) / boolean List.remove(Object o)",
    documentation: "Removes the element at the specified position in this list.",
  },
  {
    label: "size",
    snippet: "size()",
    detail: "int List.size()",
    documentation: "Returns the number of elements in this list.",
  },
  {
    label: "isEmpty",
    snippet: "isEmpty()",
    detail: "boolean List.isEmpty()",
    documentation: "Returns true if this list contains no elements.",
  },
  {
    label: "contains",
    snippet: "contains(${1:o})",
    detail: "boolean List.contains(Object o)",
    documentation: "Returns true if this list contains the specified element.",
  },
  {
    label: "indexOf",
    snippet: "indexOf(${1:o})",
    detail: "int List.indexOf(Object o)",
    documentation:
      "Returns the index of the first occurrence of the specified element in this list, or -1 if not found.",
  },
  {
    label: "clear",
    snippet: "clear();",
    detail: "void List.clear()",
    documentation: "Removes all of the elements from this list.",
  },
  {
    label: "toArray",
    snippet: "toArray()",
    detail: "Object[] List.toArray() / <T> T[] toArray(T[] a)",
    documentation:
      "Returns an array containing all of the elements in this list in proper sequence.",
  },
  {
    label: "subList",
    snippet: "subList(${1:fromIndex}, ${2:toIndex})",
    detail: "List<E> List.subList(int fromIndex, int toIndex)",
    documentation:
      "Returns a view of the portion of this list between the specified fromIndex, inclusive, and toIndex, exclusive.",
  },
];

const MAP_MEMBERS: MethodItem[] = [
  {
    label: "put",
    snippet: "put(${1:key}, ${2:value})",
    detail: "V Map.put(K key, V value)",
    documentation: "Associates the specified value with the specified key in this map.",
  },
  {
    label: "get",
    snippet: "get(${1:key})",
    detail: "V Map.get(Object key)",
    documentation:
      "Returns the value to which the specified key is mapped, or null if this map contains no mapping for the key.",
  },
  {
    label: "getOrDefault",
    snippet: "getOrDefault(${1:key}, ${2:defaultValue})",
    detail: "V Map.getOrDefault(Object key, V defaultValue)",
    documentation:
      "Returns the value to which the specified key is mapped, or defaultValue if this map contains no mapping for the key.",
  },
  {
    label: "containsKey",
    snippet: "containsKey(${1:key})",
    detail: "boolean Map.containsKey(Object key)",
    documentation: "Returns true if this map contains a mapping for the specified key.",
  },
  {
    label: "containsValue",
    snippet: "containsValue(${1:value})",
    detail: "boolean Map.containsValue(Object value)",
    documentation: "Returns true if this map maps one or more keys to the specified value.",
  },
  {
    label: "remove",
    snippet: "remove(${1:key})",
    detail: "V Map.remove(Object key)",
    documentation: "Removes the mapping for a key from this map if it is present.",
  },
  {
    label: "size",
    snippet: "size()",
    detail: "int Map.size()",
    documentation: "Returns the number of key-value mappings in this map.",
  },
  {
    label: "isEmpty",
    snippet: "isEmpty()",
    detail: "boolean Map.isEmpty()",
    documentation: "Returns true if this map contains no key-value mappings.",
  },
  {
    label: "keySet",
    snippet: "keySet()",
    detail: "Set<K> Map.keySet()",
    documentation: "Returns a Set view of the keys contained in this map.",
  },
  {
    label: "values",
    snippet: "values()",
    detail: "Collection<V> Map.values()",
    documentation: "Returns a Collection view of the values contained in this map.",
  },
  {
    label: "entrySet",
    snippet: "entrySet()",
    detail: "Set<Map.Entry<K, V>> Map.entrySet()",
    documentation: "Returns a Set view of the mappings contained in this map.",
  },
  {
    label: "putIfAbsent",
    snippet: "putIfAbsent(${1:key}, ${2:value})",
    detail: "V Map.putIfAbsent(K key, V value)",
    documentation:
      "If the specified key is not already associated with a value associates it with the given value.",
  },
  {
    label: "clear",
    snippet: "clear();",
    detail: "void Map.clear()",
    documentation: "Removes all of the mappings from this map.",
  },
];

const SET_MEMBERS: MethodItem[] = [
  {
    label: "add",
    snippet: "add(${1:e})",
    detail: "boolean Set.add(E e)",
    documentation: "Adds the specified element to this set if it is not already present.",
  },
  {
    label: "remove",
    snippet: "remove(${1:o})",
    detail: "boolean Set.remove(Object o)",
    documentation: "Removes the specified element from this set if it is present.",
  },
  {
    label: "contains",
    snippet: "contains(${1:o})",
    detail: "boolean Set.contains(Object o)",
    documentation: "Returns true if this set contains the specified element.",
  },
  {
    label: "size",
    snippet: "size()",
    detail: "int Set.size()",
    documentation: "Returns the number of elements in this set.",
  },
  {
    label: "isEmpty",
    snippet: "isEmpty()",
    detail: "boolean Set.isEmpty()",
    documentation: "Returns true if this set contains no elements.",
  },
  {
    label: "clear",
    snippet: "clear();",
    detail: "void Set.clear()",
    documentation: "Removes all of the elements from this set.",
  },
];

const QUEUE_MEMBERS: MethodItem[] = [
  {
    label: "offer",
    snippet: "offer(${1:e})",
    detail: "boolean Queue.offer(E e)",
    documentation:
      "Inserts the specified element into this queue if it is possible to do so immediately without violating capacity restrictions.",
  },
  {
    label: "poll",
    snippet: "poll()",
    detail: "E Queue.poll()",
    documentation:
      "Retrieves and removes the head of this queue, or returns null if this queue is empty.",
  },
  {
    label: "peek",
    snippet: "peek()",
    detail: "E Queue.peek()",
    documentation:
      "Retrieves, but does not remove, the head of this queue, or returns null if this queue is empty.",
  },
  {
    label: "add",
    snippet: "add(${1:e})",
    detail: "boolean Queue.add(E e)",
    documentation:
      "Inserts the specified element into this queue if it is possible to do so immediately without violating capacity restrictions.",
  },
  {
    label: "remove",
    snippet: "remove()",
    detail: "E Queue.remove()",
    documentation: "Retrieves and removes the head of this queue.",
  },
  {
    label: "size",
    snippet: "size()",
    detail: "int Queue.size()",
    documentation: "Returns the number of elements in this queue.",
  },
  {
    label: "isEmpty",
    snippet: "isEmpty()",
    detail: "boolean Queue.isEmpty()",
    documentation: "Returns true if this collection contains no elements.",
  },
];

const STACK_MEMBERS: MethodItem[] = [
  {
    label: "push",
    snippet: "push(${1:item})",
    detail: "E Stack.push(E item)",
    documentation: "Pushes an item onto the top of this stack.",
  },
  {
    label: "pop",
    snippet: "pop()",
    detail: "E Stack.pop()",
    documentation:
      "Removes the object at the top of this stack and returns that object as the value of this function.",
  },
  {
    label: "peek",
    snippet: "peek()",
    detail: "E Stack.peek()",
    documentation:
      "Looks at the object at the top of this stack without removing it from the stack.",
  },
  {
    label: "empty",
    snippet: "empty()",
    detail: "boolean Stack.empty()",
    documentation: "Tests if this stack is empty.",
  },
  {
    label: "search",
    snippet: "search(${1:o})",
    detail: "int Stack.search(Object o)",
    documentation: "Returns the 1-based position where an object is on this stack.",
  },
];

const COMMON_INSTANCE_MEMBERS: MethodItem[] = [
  {
    label: "toString",
    snippet: "toString()",
    detail: "String Object.toString()",
    documentation: "Returns a string representation of the object.",
  },
  {
    label: "equals",
    snippet: "equals(${1:obj})",
    detail: "boolean Object.equals(Object obj)",
    documentation: "Indicates whether some other object is 'equal to' this one.",
  },
  {
    label: "hashCode",
    snippet: "hashCode()",
    detail: "int Object.hashCode()",
    documentation: "Returns a hash code value for the object.",
  },
  {
    label: "getClass",
    snippet: "getClass()",
    detail: "Class<?> Object.getClass()",
    documentation: "Returns the runtime class of this Object.",
  },
];

// --- Keywords & Types -----------------------------------------------------------------

const JAVA_KEYWORDS = [
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "record",
  "var",
  "yield",
  "true",
  "false",
  "null",
];

const JAVA_KEYWORD_DOCS: Record<string, string> = {
  abstract: "Declares that a class or method is abstract and must be implemented by subclasses.",
  assert: "Tests an expression during execution to verify developer assumptions.",
  boolean: "Primitive data type with only two possible values: true and false.",
  break: "Terminates the current loop or switch statement.",
  byte: "8-bit signed two's complement integer (-128 to 127).",
  case: "Marks a branch in a switch statement.",
  catch: "Declares a block of statements to handle exceptions thrown in a try block.",
  char: "16-bit Unicode character (0 to 65,535).",
  class: "Declares a class, the blueprint from which individual objects are created.",
  continue: "Skips the remainder of the current loop iteration and proceeds to the next.",
  default: "Specifies the default block in a switch, or default method in an interface.",
  do: "Starts a do-while loop whose body executes at least once before testing condition.",
  double: "Double-precision 64-bit IEEE 754 floating point number.",
  else: "Executes statements when the boolean condition of an if statement is false.",
  enum: "Declares an enumerated type (a fixed set of constants).",
  extends: "Indicates that a class or interface inherits from a superclass or superinterface.",
  final:
    "Prevents a class from being subclassed, a method from being overridden, or a variable from being reassigned.",
  finally: "Block executed after a try-catch block regardless of whether an exception occurred.",
  float: "Single-precision 32-bit IEEE 754 floating point number.",
  for: "Defines a loop with initialization, termination condition, and step increment.",
  if: "Executes a block of code only if the specified condition is true.",
  implements: "Declares that a class implements one or more interfaces.",
  import: "Imports classes, packages, or static members from other packages.",
  instanceof: "Tests whether an object is an instance of a specified class or interface.",
  int: "32-bit signed two's complement integer (-2^31 to 2^31-1).",
  interface: "Declares an interface, a reference type containing abstract methods and constants.",
  long: "64-bit signed two's complement integer (-2^63 to 2^63-1).",
  native: "Specifies that a method is implemented in native code using JNI.",
  new: "Creates a new object instance or array and allocates memory on the heap.",
  package: "Specifies the namespace/package to which the Java source file belongs.",
  private: "Restricts access to members within the declaring class only.",
  protected: "Allows access to members within the package and by subclasses.",
  public: "Allows unrestricted access from any other class.",
  return: "Exits from the current method, optionally returning a value.",
  short: "16-bit signed two's complement integer (-32,768 to 32,767).",
  static: "Specifies that a field or method belongs to the class itself rather than instances.",
  strictfp: "Restricts floating-point calculations to ensure portability across hardware.",
  super: "Refers to the superclass of the current object or constructor.",
  switch: "Selects one of many code blocks to execute based on an expression value.",
  synchronized: "Ensures thread-safe access to a block or method via object monitor lock.",
  this: "Refers to the current object instance within an instance method or constructor.",
  throw: "Explicitly throws an exception object.",
  throws: "Declares exceptions that can be thrown by a method.",
  transient: "Specifies that a field should not be serialized.",
  try: "Defines a block of code to be tested for errors while being executed.",
  void: "Specifies that a method does not return any value.",
  volatile: "Indicates that a field's value may be modified asynchronously by multiple threads.",
  while: "Repeats a statement block while a boolean condition remains true.",
  record: "Declares a transparent, immutable data carrier class (Java 14+).",
  var: "Infers the type of a local variable from its initializer expression (Java 10+).",
  yield: "Yields a value from a switch expression (Java 14+).",
  true: "Boolean literal representing truth.",
  false: "Boolean literal representing falsehood.",
  null: "Literal value representing a null reference pointing to no object.",
};

const JAVA_TYPES = [
  { name: "String", doc: "The String class represents character strings." },
  {
    name: "Integer",
    doc: "The Integer class wraps a value of the primitive type int in an object.",
  },
  { name: "Long", doc: "The Long class wraps a value of the primitive type long in an object." },
  {
    name: "Double",
    doc: "The Double class wraps a value of the primitive type double in an object.",
  },
  { name: "Float", doc: "The Float class wraps a value of the primitive type float in an object." },
  {
    name: "Boolean",
    doc: "The Boolean class wraps a value of the primitive type boolean in an object.",
  },
  {
    name: "Character",
    doc: "The Character class wraps a value of the primitive type char in an object.",
  },
  { name: "Byte", doc: "The Byte class wraps a value of the primitive type byte in an object." },
  { name: "Short", doc: "The Short class wraps a value of the primitive type short in an object." },
  { name: "Object", doc: "Class Object is the root of the class hierarchy." },
  {
    name: "Scanner",
    doc: "A simple text scanner which can parse primitive types and strings using regular expressions.",
  },
  { name: "Math", doc: "The class Math contains methods for performing basic numeric operations." },
  {
    name: "Arrays",
    doc: "This class contains various methods for manipulating arrays (such as sorting and searching).",
  },
  {
    name: "Collections",
    doc: "This class consists exclusively of static methods that operate on or return collections.",
  },
  { name: "ArrayList", doc: "Resizable-array implementation of the List interface." },
  {
    name: "LinkedList",
    doc: "Doubly-linked list implementation of the List and Deque interfaces.",
  },
  { name: "List", doc: "An ordered collection (also known as a sequence)." },
  { name: "HashMap", doc: "Hash table based implementation of the Map interface." },
  { name: "TreeMap", doc: "A Red-Black tree based NavigableMap implementation." },
  { name: "Map", doc: "An object that maps keys to values." },
  { name: "HashSet", doc: "This class implements the Set interface, backed by a hash table." },
  { name: "TreeSet", doc: "A NavigableSet implementation based on a TreeMap." },
  { name: "Set", doc: "A collection that contains no duplicate elements." },
  { name: "Queue", doc: "A collection designed for holding elements prior to processing." },
  {
    name: "Deque",
    doc: "A linear collection that supports element insertion and removal at both ends.",
  },
  { name: "PriorityQueue", doc: "An unbounded priority queue based on a priority heap." },
  { name: "Stack", doc: "The Stack class represents a last-in-first-out (LIFO) stack of objects." },
  { name: "StringBuilder", doc: "A mutable sequence of characters (not synchronized)." },
  { name: "StringBuffer", doc: "A thread-safe, mutable sequence of characters." },
  {
    name: "BufferedReader",
    doc: "Reads text from a character-input stream, buffering characters for efficient reading.",
  },
  {
    name: "InputStreamReader",
    doc: "An InputStreamReader is a bridge from byte streams to character streams.",
  },
  {
    name: "PrintWriter",
    doc: "Prints formatted representations of objects to a text-output stream.",
  },
  {
    name: "Exception",
    doc: "The class Exception and its subclasses indicate conditions that a reasonable application might want to catch.",
  },
];

const COMMON_PACKAGES = [
  "java.util",
  "java.util.concurrent",
  "java.util.regex",
  "java.util.stream",
  "java.io",
  "java.nio",
  "java.math",
  "java.net",
  "java.text",
  "java.time",
];

const STATIC_TYPES = [
  { name: "Math", fullName: "java.lang.Math", doc: "Math utility methods and constants." },
  { name: "Arrays", fullName: "java.util.Arrays", doc: "Array manipulation utilities." },
  {
    name: "Collections",
    fullName: "java.util.Collections",
    doc: "Collection manipulation utilities.",
  },
  { name: "System", fullName: "java.lang.System", doc: "System facilities and standard I/O." },
  {
    name: "Integer",
    fullName: "java.lang.Integer",
    doc: "Integer parsing and conversion utilities.",
  },
  { name: "Long", fullName: "java.lang.Long", doc: "Long parsing and conversion utilities." },
  { name: "Double", fullName: "java.lang.Double", doc: "Double parsing and conversion utilities." },
  {
    name: "Character",
    fullName: "java.lang.Character",
    doc: "Character classification and conversion.",
  },
  { name: "String", fullName: "java.lang.String", doc: "String creation and static methods." },
  { name: "Boolean", fullName: "java.lang.Boolean", doc: "Boolean parsing and constants." },
  { name: "Objects", fullName: "java.util.Objects", doc: "Object utility methods." },
];

// --- Snippets -------------------------------------------------------------------------

const SNIPPETS = [
  {
    label: "sout",
    insertText: "System.out.println(${1});",
    detail: "System.out.println(...);",
    documentation: "Prints the value to standard output followed by a newline.",
  },
  {
    label: "sysout",
    insertText: "System.out.println(${1});",
    detail: "System.out.println(...);",
    documentation: "Prints the value to standard output followed by a newline (Eclipse shortcut).",
  },
  {
    label: "souf",
    insertText: 'System.out.printf("${1:%s}\\n", ${2});',
    detail: "System.out.printf(...);",
    documentation: "Prints formatted text to standard output.",
  },
  {
    label: "serr",
    insertText: "System.err.println(${1});",
    detail: "System.err.println(...);",
    documentation: "Prints the value to standard error output followed by a newline.",
  },
  {
    label: "main",
    insertText: "public static void main(String[] args) {\n    ${1}\n}",
    detail: "public static void main(String[] args)",
    documentation: "Standard Java main method entry point.",
  },
  {
    label: "psvm",
    insertText: "public static void main(String[] args) {\n    ${1}\n}",
    detail: "public static void main(String[] args)",
    documentation: "Standard Java main method entry point (IntelliJ shortcut).",
  },
  {
    label: "for",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}",
    detail: "for (int i = 0; i < n; i++)",
    documentation: "Standard indexed for loop.",
  },
  {
    label: "forr",
    insertText: "for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n    ${3}\n}",
    detail: "for (int i = n - 1; i >= 0; i--)",
    documentation: "Reverse indexed for loop.",
  },
  {
    label: "foreach",
    insertText: "for (${1:var} ${2:item} : ${3:collection}) {\n    ${4}\n}",
    detail: "for (var item : collection)",
    documentation: "Enhanced for-each loop over an array or Iterable.",
  },
  {
    label: "while",
    insertText: "while (${1:condition}) {\n    ${2}\n}",
    detail: "while (condition) { ... }",
    documentation: "While loop.",
  },
  {
    label: "if",
    insertText: "if (${1:condition}) {\n    ${2}\n}",
    detail: "if (condition) { ... }",
    documentation: "If statement.",
  },
  {
    label: "ifelse",
    insertText: "if (${1:condition}) {\n    ${2}\n} else {\n    ${3}\n}",
    detail: "if (condition) { ... } else { ... }",
    documentation: "If-else statement.",
  },
  {
    label: "scanner",
    insertText: "Scanner ${1:sc} = new Scanner(System.in);",
    detail: "Scanner sc = new Scanner(System.in);",
    documentation: "Initialize a Scanner for reading standard input.",
  },
  {
    label: "try",
    insertText:
      "try {\n    ${1}\n} catch (${2:Exception} ${3:e}) {\n    ${4:e.printStackTrace();}\n}",
    detail: "try { ... } catch (Exception e) { ... }",
    documentation: "Try-catch exception handling block.",
  },
  {
    label: "class",
    insertText:
      "public class ${1:Main} {\n    public static void main(String[] args) {\n        ${2}\n    }\n}",
    detail: "public class Main { ... }",
    documentation: "Basic public class declaration with main method.",
  },
];

// --- Helpers --------------------------------------------------------------------------

const JAVA_KEYWORD_SET = new Set(JAVA_KEYWORDS);
const JAVA_TYPE_SET = new Set(JAVA_TYPES.map((t) => t.name));
const JAVA_NON_TYPE_KEYWORDS = new Set([
  "abstract",
  "assert",
  "break",
  "case",
  "catch",
  "class",
  "continue",
  "default",
  "do",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "for",
  "if",
  "implements",
  "import",
  "instanceof",
  "interface",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "record",
  "return",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "yield",
  "true",
  "false",
  "null",
]);

export type JavaCategory =
  | "array"
  | "primitive"
  | "scanner"
  | "stringbuilder"
  | "string"
  | "list"
  | "map"
  | "set"
  | "queue"
  | "stack"
  | "other";

export interface JavaVariableInfo {
  name: string;
  typeString: string;
  category: JavaCategory;
  elementType?: string;
  elementCategory?: JavaCategory;
  origin?: string;
}

export interface JavaMethodInfo {
  name: string;
  returnType: string;
  parameters: { type: string; name: string }[];
  signature: string;
}

function classifyJavaType(
  rawType: string,
  rhs?: string,
): {
  typeString: string;
  category: JavaCategory;
  elementType?: string;
  elementCategory?: JavaCategory;
} {
  const typeStr = rawType.trim().replace(/\s*\[\s*\]/g, "[]");

  // If declared with `var`, inspect RHS initializer
  if (typeStr === "var" && rhs) {
    const trimmedRhs = rhs.trim();
    const newArrayMatch = trimmedRhs.match(/^new\s+([a-zA-Z_]\w*(?:<[^>]+>)?)(?:\s*\[[^\]]*\])+/);
    if (newArrayMatch) {
      const elemType = newArrayMatch[1];
      const elemInfo = classifyJavaType(elemType);
      return {
        typeString: `${elemType}[]`,
        category: "array",
        elementType: elemType,
        elementCategory: elemInfo.category,
      };
    }
    if (/^\{/.test(trimmedRhs)) {
      return { typeString: "array", category: "array" };
    }
    if (/^new\s+Scanner\b/.test(trimmedRhs)) {
      return { typeString: "Scanner", category: "scanner" };
    }
    if (/^new\s+StringBuilder\b/.test(trimmedRhs)) {
      return { typeString: "StringBuilder", category: "stringbuilder" };
    }
    if (/^new\s+StringBuffer\b/.test(trimmedRhs)) {
      return { typeString: "StringBuffer", category: "stringbuilder" };
    }
    if (
      /^new\s+(?:Array|Linked)?List\b/.test(trimmedRhs) ||
      /^List\s*\.\s*of\b/.test(trimmedRhs) ||
      /^Arrays\s*\.\s*asList\b/.test(trimmedRhs)
    ) {
      return { typeString: "List", category: "list" };
    }
    if (
      /^new\s+(?:Hash|Tree|LinkedHash)?Map\b/.test(trimmedRhs) ||
      /^Map\s*\.\s*of\b/.test(trimmedRhs)
    ) {
      return { typeString: "Map", category: "map" };
    }
    if (
      /^new\s+(?:Hash|Tree|LinkedHash)?Set\b/.test(trimmedRhs) ||
      /^Set\s*\.\s*of\b/.test(trimmedRhs)
    ) {
      return { typeString: "Set", category: "set" };
    }
    if (/^new\s+(?:PriorityQueue|ArrayDeque|LinkedList)\b/.test(trimmedRhs)) {
      return { typeString: "Queue", category: "queue" };
    }
    if (/^new\s+Stack\b/.test(trimmedRhs)) {
      return { typeString: "Stack", category: "stack" };
    }
    if (trimmedRhs.startsWith('"') && trimmedRhs.endsWith('"')) {
      return { typeString: "String", category: "string" };
    }
    if (/^(?:-?\d+(\.\d+)?[fFdDlL]?|true|false|'(\\.|[^'\\])')$/.test(trimmedRhs)) {
      return { typeString: "primitive", category: "primitive" };
    }
  }

  // Array check: int[], String[], List<Integer>[], Object[][]
  if (typeStr.endsWith("[]")) {
    const baseType = typeStr.slice(0, -2).trim();
    const baseInfo = classifyJavaType(baseType);
    return {
      typeString: typeStr,
      category: "array",
      elementType: baseType,
      elementCategory: baseInfo.category,
    };
  }

  // Primitive types
  if (/^(?:int|long|double|float|boolean|char|byte|short)$/.test(typeStr)) {
    return { typeString: typeStr, category: "primitive" };
  }

  // String / CharSequence
  if (/^(?:String|CharSequence)$/.test(typeStr)) {
    return { typeString: typeStr, category: "string" };
  }

  // Scanner / BufferedReader
  if (/^(?:Scanner|BufferedReader)$/.test(typeStr)) {
    return { typeString: typeStr, category: "scanner" };
  }

  // StringBuilder / StringBuffer
  if (/^(?:StringBuilder|StringBuffer)$/.test(typeStr)) {
    return { typeString: typeStr, category: "stringbuilder" };
  }

  // List: List<T>, ArrayList<T>, LinkedList<T>, Vector<T>
  const listMatch = typeStr.match(/^(?:List|ArrayList|LinkedList|Vector)(?:<(.+)>)?$/);
  if (listMatch) {
    const elemType = listMatch[1] ? listMatch[1].trim() : undefined;
    const elemInfo = elemType ? classifyJavaType(elemType) : undefined;
    return {
      typeString: typeStr,
      category: "list",
      elementType: elemType,
      elementCategory: elemInfo?.category,
    };
  }

  // Map: Map<K, V>, HashMap<K, V>, TreeMap<K, V>, LinkedHashMap<K, V>
  const mapMatch = typeStr.match(
    /^(?:Map|HashMap|TreeMap|LinkedHashMap|ConcurrentHashMap)<([^,]+),\s*(.+)>$/,
  );
  if (mapMatch) {
    const valType = mapMatch[2].trim();
    const valInfo = classifyJavaType(valType);
    return {
      typeString: typeStr,
      category: "map",
      elementType: valType,
      elementCategory: valInfo.category,
    };
  }
  if (/^(?:Map|HashMap|TreeMap|LinkedHashMap|ConcurrentHashMap)(?:<.*>)?$/.test(typeStr)) {
    return { typeString: typeStr, category: "map" };
  }

  // Set: Set<T>, HashSet<T>, TreeSet<T>, LinkedHashSet<T>
  const setMatch = typeStr.match(/^(?:Set|HashSet|TreeSet|LinkedHashSet)(?:<(.+)>)?$/);
  if (setMatch) {
    const elemType = setMatch[1] ? setMatch[1].trim() : undefined;
    const elemInfo = elemType ? classifyJavaType(elemType) : undefined;
    return {
      typeString: typeStr,
      category: "set",
      elementType: elemType,
      elementCategory: elemInfo?.category,
    };
  }

  // Queue / Deque
  const queueMatch = typeStr.match(/^(?:Queue|Deque|ArrayDeque|PriorityQueue)(?:<(.+)>)?$/);
  if (queueMatch) {
    const elemType = queueMatch[1] ? queueMatch[1].trim() : undefined;
    const elemInfo = elemType ? classifyJavaType(elemType) : undefined;
    return {
      typeString: typeStr,
      category: "queue",
      elementType: elemType,
      elementCategory: elemInfo?.category,
    };
  }

  // Stack
  const stackMatch = typeStr.match(/^Stack(?:<(.+)>)?$/);
  if (stackMatch) {
    const elemType = stackMatch[1] ? stackMatch[1].trim() : undefined;
    const elemInfo = elemType ? classifyJavaType(elemType) : undefined;
    return {
      typeString: typeStr,
      category: "stack",
      elementType: elemType,
      elementCategory: elemInfo?.category,
    };
  }

  return { typeString: typeStr, category: "other" };
}

/**
 * Peels `depth` array dimensions from `typeStr` (e.g. `int[][]` with depth 2 becomes `int`).
 */
export function peelArrayDimensions(
  typeStr: string,
  depth: number,
  fallbackElemCategory?: JavaCategory,
): { baseType: string; category: JavaCategory } {
  let current = typeStr.trim().replace(/\s*\[\s*\]/g, "[]");
  for (let i = 0; i < depth; i++) {
    if (current.endsWith("[]")) {
      current = current.slice(0, -2).trim();
    } else {
      break;
    }
  }
  if (current === "array" && fallbackElemCategory) {
    return { baseType: current, category: fallbackElemCategory };
  }
  const classified = classifyJavaType(current);
  return { baseType: current, category: classified.category };
}

/**
 * Peels `depth` generic levels from a List type (e.g. `List<List<String>>` with depth 1 becomes `List<String>`).
 */
export function peelListElementType(
  typeStr: string,
  depth: number,
): { baseType: string; category: JavaCategory } {
  let current = typeStr.trim();
  for (let i = 0; i < depth; i++) {
    const m = current.match(/^(?:List|ArrayList|LinkedList|Vector)<(.+)>$/);
    if (m) {
      current = m[1].trim();
    } else {
      break;
    }
  }
  const classified = classifyJavaType(current);
  return { baseType: current, category: classified.category };
}

/**
 * Splits variable declarations on commas that occur at the top level
 * (not inside braces, parens, brackets, or string literals).
 */
function splitByTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      inString = !inString;
      current += ch;
    } else if (inString) {
      current += ch;
    } else if (ch === "(") {
      parenDepth++;
      current += ch;
    } else if (ch === ")") {
      if (parenDepth > 0) parenDepth--;
      current += ch;
    } else if (ch === "{") {
      braceDepth++;
      current += ch;
    } else if (ch === "}") {
      if (braceDepth > 0) braceDepth--;
      current += ch;
    } else if (ch === "[") {
      bracketDepth++;
      current += ch;
    } else if (ch === "]") {
      if (bracketDepth > 0) bracketDepth--;
      current += ch;
    } else if (ch === "," && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    parts.push(current);
  }
  return parts;
}

/**
 * Masks single-line (// ...) and block (/* ... * /) comments with space characters,
 * preserving exact string length and line/column indices so delimiter tracking
 * is not corrupted by apostrophes or parens inside comments.
 */
export function maskJavaComments(text: string): string {
  let result = "";
  let inString = false;
  let inChar = false;
  let inLineComment = false;
  let inBlockComment = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        result += "  ";
        i++;
      } else if (ch === "\n") {
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inString) {
      result += ch;
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === "\\") {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (inChar) {
      result += ch;
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === "\\") {
        isEscaped = true;
      } else if (ch === "'") {
        inChar = false;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      result += "  ";
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      result += "  ";
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }
    if (ch === "'") {
      inChar = true;
      result += ch;
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Masks comments, string literals, and char literals with spaces, preserving
 * newlines. Used for brace parsing so braces inside strings or comments are ignored.
 */
export function maskJavaCommentsAndStrings(text: string): string {
  let result = "";
  let inString = false;
  let inChar = false;
  let inLineComment = false;
  let inBlockComment = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        result += "  ";
        i++;
      } else if (ch === "\n") {
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        result += " ";
      } else if (ch === "\\") {
        isEscaped = true;
        result += " ";
      } else if (ch === '"') {
        inString = false;
        result += " ";
      } else if (ch === "\n") {
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (inChar) {
      if (isEscaped) {
        isEscaped = false;
        result += " ";
      } else if (ch === "\\") {
        isEscaped = true;
        result += " ";
      } else if (ch === "'") {
        inChar = false;
        result += " ";
      } else if (ch === "\n") {
        result += "\n";
      } else {
        result += " ";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      result += "  ";
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      result += "  ";
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += " ";
      continue;
    }
    if (ch === "'") {
      inChar = true;
      result += " ";
      continue;
    }

    result += ch;
  }

  return result;
}

export interface JavaScopes {
  /** owner[ln] = scope ID of the innermost scope containing line ln (0 = top-level / package). */
  owner: number[];
  /** Scope IDs visible from the cursor line. */
  visible: Set<number>;
  /** Map from scope ID to kind: "class" | "method" | "block". */
  kind: Map<number, "class" | "method" | "block">;
  /** Map from method header line number to its method scope ID. */
  methodScopeByHeaderLine: Map<number, number>;
  /** Map from method header line number to its declaring/enclosing class scope ID. */
  methodEnclosingClassScope: Map<number, number>;
  /** Map from class header line number to its class scope ID. */
  classScopeByHeaderLine: Map<number, number>;
}

const CONTROL_FLOW_KEYWORDS = new Set([
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "try",
  "catch",
  "finally",
  "synchronized",
  "static",
  "new",
  "return",
]);

/**
 * Computes Java block scopes based on curly brace blocks and method/class declarations.
 * Isolates local variables and parameters inside methods from leaking into other methods
 * or outer class scopes.
 */
export function computeJavaScopes(
  model: monacoDefault.editor.ITextModel,
  cursorLine: number,
): JavaScopes {
  const lineCount = model.getLineCount();
  const owner: number[] = new Array(lineCount + 2).fill(0);
  const parent = new Map<number, number>();
  const kind = new Map<number, "class" | "method" | "block">();
  const methodScopeByHeaderLine = new Map<number, number>();
  const methodEnclosingClassScope = new Map<number, number>();
  const classScopeByHeaderLine = new Map<number, number>();

  const fullText = model.getValue();
  const maskedText = maskJavaCommentsAndStrings(fullText);
  const lines = maskedText.split("\n");

  const stack: { id: number; kind: "class" | "method" | "block"; headerLine: number }[] = [];
  let nextScopeId = 1;

  let pendingHeader: { kind: "class" | "method"; startLine: number; headerLines: number[] } | null =
    null;

  for (let ln = 1; ln <= lineCount; ln++) {
    const line = lines[ln - 1] ?? "";
    const trimmed = line.trim();

    // Check if line starts a class declaration
    const classMatch = line.match(/\b(?:class|interface|enum|record)\s+([a-zA-Z_]\w*)/);
    if (classMatch && !trimmed.endsWith(";")) {
      pendingHeader = { kind: "class", startLine: ln, headerLines: [ln] };
    } else {
      // Check if line looks like a method or constructor declaration
      const methodMatch = line.match(
        /\b(?:public|private|protected|static|final|synchronized|abstract|default|native|\s)*(?:<[^>]+>\s+)?([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([a-zA-Z_]\w*)\s*\(/,
      );
      const constructorMatch = !methodMatch
        ? line.match(/\b(?:public|private|protected|\s)*\s*([A-Z]\w*)\s*\(/)
        : null;

      if (methodMatch && !trimmed.endsWith(";")) {
        const name = methodMatch[2];
        if (!CONTROL_FLOW_KEYWORDS.has(name)) {
          pendingHeader = { kind: "method", startLine: ln, headerLines: [ln] };
        }
      } else if (constructorMatch && !trimmed.endsWith(";")) {
        const name = constructorMatch[1];
        if (!CONTROL_FLOW_KEYWORDS.has(name)) {
          pendingHeader = { kind: "method", startLine: ln, headerLines: [ln] };
        }
      } else if (pendingHeader) {
        pendingHeader.headerLines.push(ln);
      }
    }

    const startTop = stack.length ? stack[stack.length - 1].id : 0;

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === "{") {
        const currentTop = stack.length ? stack[stack.length - 1].id : 0;
        let scopeKind: "class" | "method" | "block" = "block";
        let hLines = [ln];

        if (pendingHeader) {
          scopeKind = pendingHeader.kind;
          hLines = pendingHeader.headerLines;
          pendingHeader = null;
        }

        const scopeId = nextScopeId++;
        parent.set(scopeId, currentTop);
        kind.set(scopeId, scopeKind);

        if (scopeKind === "method") {
          for (const hl of hLines) {
            methodScopeByHeaderLine.set(hl, scopeId);
            methodEnclosingClassScope.set(hl, currentTop);
          }
        } else if (scopeKind === "class") {
          for (const hl of hLines) {
            classScopeByHeaderLine.set(hl, scopeId);
          }
        }

        stack.push({ id: scopeId, kind: scopeKind, headerLine: hLines[0] });
      } else if (ch === "}") {
        if (stack.length > 0) {
          stack.pop();
        }
      }
    }

    const endTop = stack.length ? stack[stack.length - 1].id : 0;
    owner[ln] = endTop !== 0 ? endTop : startTop;
  }

  // Work out which scopes are visible from cursorLine
  let cursorScope = owner[cursorLine] ?? 0;
  const headerMethodScope = methodScopeByHeaderLine.get(cursorLine);
  if (headerMethodScope !== undefined) {
    cursorScope = headerMethodScope;
  }
  const headerClassScope = classScopeByHeaderLine.get(cursorLine);
  if (headerClassScope !== undefined) {
    cursorScope = headerClassScope;
  }

  const visible = new Set<number>();
  for (let c = cursorScope; c !== 0; c = parent.get(c) ?? 0) {
    visible.add(c);
  }

  return {
    owner,
    visible,
    kind,
    methodScopeByHeaderLine,
    methodEnclosingClassScope,
    classScopeByHeaderLine,
  };
}

export function isLineVisible(scopes: JavaScopes, ln: number): boolean {
  const methodScope = scopes.methodScopeByHeaderLine.get(ln);
  if (methodScope !== undefined) {
    return scopes.visible.has(methodScope);
  }

  const classScope = scopes.classScopeByHeaderLine.get(ln);
  if (classScope !== undefined) {
    return scopes.visible.has(classScope);
  }

  const o = scopes.owner[ln] ?? 0;
  return o === 0 || scopes.visible.has(o);
}

function inferJavaVariablesAndTypes(
  model: monacoDefault.editor.ITextModel,
  cursorLine?: number,
): Map<string, JavaVariableInfo> {
  const vars = new Map<string, JavaVariableInfo>();
  const lineCount = model.getLineCount();
  const scopes = cursorLine !== undefined ? computeJavaScopes(model, cursorLine) : null;
  const codeLines = maskJavaComments(model.getValue()).split("\n");

  for (let ln = 1; ln <= lineCount; ln++) {
    if (scopes && !isLineVisible(scopes, ln)) {
      continue;
    }

    const line = (codeLines[ln - 1] ?? "").trim();
    if (!line) continue;

    // 1. Foreach variable: `for (int x : nums)` or `for (String item : list)`
    const foreachMatch = line.match(
      /\bfor\s*\(\s*(?:final\s+)?([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([a-zA-Z_]\w*)\s*:/,
    );
    if (foreachMatch) {
      const typeStr = foreachMatch[1].replace(/\s*\[\s*\]/g, "[]");
      const name = foreachMatch[2];
      if (!JAVA_KEYWORD_SET.has(name) && !JAVA_TYPE_SET.has(name)) {
        const classified = classifyJavaType(typeStr);
        vars.set(name, {
          name,
          typeString: typeStr,
          category: classified.category,
          elementType: classified.elementType,
          elementCategory: classified.elementCategory,
          origin: "foreach variable",
        });
      }
    }

    // 2. Method parameters: `public int solve(int[] nums, int target)`
    const methodParamMatch = line.match(
      /\b(?:public|private|protected|static|final|\s)*(?:<[^>]+>\s+)?(?:(?:[a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+)?[a-zA-Z_]\w*\s*\(([^)]*)\)/,
    );
    if (methodParamMatch && methodParamMatch[1].trim()) {
      const paramsRaw = methodParamMatch[1].trim();
      const pTokens = paramsRaw.split(",");
      for (const pt of pTokens) {
        const pm = pt
          .trim()
          .match(
            /^(?:final\s+)?([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([a-zA-Z_]\w*)((?:\s*\[\s*\])*)$/,
          );
        if (pm) {
          let pType = pm[1].replace(/\s*\[\s*\]/g, "[]");
          const pName = pm[2];
          if (pm[3]) pType += pm[3].replace(/\s*\[\s*\]/g, "[]");
          if (!JAVA_KEYWORD_SET.has(pName) && !JAVA_TYPE_SET.has(pName)) {
            const classified = classifyJavaType(pType);
            vars.set(pName, {
              name: pName,
              typeString: pType,
              category: classified.category,
              elementType: classified.elementType,
              elementCategory: classified.elementCategory,
              origin: "parameter",
            });
          }
        }
      }
    }

    // 3. Local variables and fields:
    const varDeclMatch = line.match(
      /^(?:public\s+|private\s+|protected\s+|static\s+|final\s+|transient\s+|volatile\s+)*([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([^;]+);$/,
    );
    if (varDeclMatch) {
      const baseType = varDeclMatch[1].replace(/\s*\[\s*\]/g, "[]");
      const rest = varDeclMatch[2].trim();
      const isField = Boolean(scopes && scopes.kind.get(scopes.owner[ln]) === "class");

      if (
        !JAVA_NON_TYPE_KEYWORDS.has(baseType) &&
        (!rest.includes("(") || (rest.includes("=") && rest.indexOf("=") < rest.indexOf("(")))
      ) {
        const entries = splitByTopLevelCommas(rest);
        for (const entry of entries) {
          const m = entry.trim().match(/^([a-zA-Z_]\w*)((?:\s*\[\s*\])*)(?:\s*=\s*(.+))?$/);
          if (m) {
            const name = m[1];
            const extraBrackets = m[2] ? m[2].replace(/\s*\[\s*\]/g, "[]") : "";
            const rhs = m[3] ? m[3].trim() : undefined;
            const fullType = baseType + extraBrackets;
            if (!JAVA_KEYWORD_SET.has(name) && !JAVA_TYPE_SET.has(name)) {
              const classified = classifyJavaType(fullType, rhs);
              vars.set(name, {
                name,
                typeString: baseType === "var" ? classified.typeString : fullType,
                category: classified.category,
                elementType: classified.elementType,
                elementCategory: classified.elementCategory,
                origin: isField ? "field" : "local variable",
              });
            }
          }
        }
      }
    }
  }

  return vars;
}

/** Words that can come before `name(` in a statement that calls rather than declares. */
const STATEMENT_KEYWORDS = new Set([
  "return",
  "new",
  "else",
  "throw",
  "yield",
  "case",
  "do",
  "assert",
]);

function extractJavaDocumentMethods(
  model: monacoDefault.editor.ITextModel,
  cursorLine?: number,
): Map<string, JavaMethodInfo> {
  const methods = new Map<string, JavaMethodInfo>();
  const lineCount = model.getLineCount();
  const scopes = cursorLine !== undefined ? computeJavaScopes(model, cursorLine) : null;
  const codeLines = maskJavaComments(model.getValue()).split("\n");

  for (let ln = 1; ln <= lineCount; ln++) {
    if (scopes) {
      const classScope = scopes.methodEnclosingClassScope.get(ln) ?? scopes.owner[ln] ?? 0;
      if (classScope !== 0 && !scopes.visible.has(classScope)) {
        continue;
      }
    }

    const line = (codeLines[ln - 1] ?? "").trim();
    if (!line) continue;

    const methodMatch = line.match(
      /\b(?:public|private|protected|static|final|\s)*(?:<[^>]+>\s+)?([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/,
    );
    if (methodMatch) {
      const returnType = methodMatch[1].replace(/\s*\[\s*\]/g, "[]");
      const name = methodMatch[2];
      const paramsRaw = methodMatch[3].trim();

      if (
        !STATEMENT_KEYWORDS.has(returnType) &&
        !JAVA_KEYWORD_SET.has(name) &&
        !JAVA_TYPE_SET.has(name)
      ) {
        const paramList: { type: string; name: string }[] = [];
        if (paramsRaw) {
          for (const p of paramsRaw.split(",")) {
            const pm = p
              .trim()
              .match(
                /^(?:final\s+)?([a-zA-Z_]\w*(?:<[^>]+>)?(?:\s*\[\s*\])*)\s+([a-zA-Z_]\w*)((?:\s*\[\s*\])*)$/,
              );
            if (pm) {
              let pType = pm[1].replace(/\s*\[\s*\]/g, "[]");
              if (pm[3]) pType += pm[3].replace(/\s*\[\s*\]/g, "[]");
              paramList.push({
                type: pType,
                name: pm[2],
              });
            }
          }
        }
        const sig = `${returnType} ${name}(${paramList.map((p) => `${p.type} ${p.name}`).join(", ")})`;
        methods.set(name, {
          name,
          returnType,
          parameters: paramList,
          signature: sig,
        });
      }
    }
  }

  return methods;
}

/**
 * Scans the current Java document for user-defined variables, methods,
 * classes, and identifiers so they appear instantly in autocomplete.
 */
function extractJavaDocumentSymbols(
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
  range: monacoDefault.IRange,
  monaco: Monaco,
): monacoDefault.languages.CompletionItem[] {
  const currentWord = model.getWordUntilPosition(position).word;
  const seen = new Set<string>();
  const items: monacoDefault.languages.CompletionItem[] = [];
  const scopes = computeJavaScopes(model, position.lineNumber);

  // 1. Inferred variables and parameters
  const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
  for (const [name, info] of varsMap) {
    if (!seen.has(name) && name !== currentWord) {
      seen.add(name);
      items.push({
        label: name,
        kind:
          info.origin === "field"
            ? monaco.languages.CompletionItemKind.Field
            : monaco.languages.CompletionItemKind.Variable,
        insertText: name,
        detail: `${info.typeString} ${name} (${info.origin ?? "local"})`,
        range,
        sortText: `0_${name}`,
      });
    }
  }

  // 2. User-defined methods in enclosing class
  const docMethods = extractJavaDocumentMethods(model, position.lineNumber);
  for (const [name, info] of docMethods) {
    if (!seen.has(name) && name !== currentWord) {
      seen.add(name);
      items.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: `${name}()`,
        detail: info.signature,
        range,
        sortText: `0_${name}`,
      });
    }
  }

  // 3. User-defined classes: `class Solution`
  const lineCount = model.getLineCount();
  const codeLines = maskJavaComments(model.getValue()).split("\n");
  for (let ln = 1; ln <= lineCount; ln++) {
    const line = (codeLines[ln - 1] ?? "").trim();
    if (!line) continue;

    const classMatch = line.match(/\bclass\s+([a-zA-Z_]\w*)/);
    if (classMatch) {
      const name = classMatch[1];
      if (!seen.has(name) && name !== currentWord && !JAVA_KEYWORD_SET.has(name)) {
        seen.add(name);
        items.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: name,
          detail: `class ${name} (local)`,
          range,
          sortText: `0_${name}`,
        });
      }
    }
  }

  // 4. General identifier extraction from visible document lines (comments & strings stripped)
  const fullText = model.getValue();
  const codeWithoutCommentsAndStrings = fullText
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ");

  const lines = codeWithoutCommentsAndStrings.split("\n");
  for (let ln = 1; ln <= lines.length; ln++) {
    if (!isLineVisible(scopes, ln)) continue;
    const cleanLine = lines[ln - 1];
    let wMatch: RegExpExecArray | null;
    const lineWordRegex = /(?:^|[^.])\b([a-zA-Z_]\w{1,})\b/g;
    while ((wMatch = lineWordRegex.exec(cleanLine)) !== null) {
      const word = wMatch[1];
      if (
        !seen.has(word) &&
        word !== currentWord &&
        !JAVA_KEYWORD_SET.has(word) &&
        !JAVA_TYPE_SET.has(word)
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
 * hover tooltips, and signature help for Java in Monaco.
 */
export function registerJavaCompletions(mInstance?: Monaco) {
  const m = mInstance ?? monacoDefault;
  if (registeredMonacoInstances.has(m)) return;
  registeredMonacoInstances.add(m);

  // 1. Autocomplete & Suggestions Provider
  m.languages.registerCompletionItemProvider("java", {
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

      // Check if user is typing immediately after a dot (e.g. "System.", "Math.", "sc.", "list.")
      if (textBeforeWord.endsWith(".")) {
        // If the token before the dot is a numeric literal (e.g. "5."), do not suggest members
        if (/\b\d+\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        const isImportStaticLine = /^\s*import\s+static\s+/i.test(
          lineContent.slice(0, position.column - 1),
        );
        const isImportPackageLine =
          !isImportStaticLine && /^\s*import\s+/i.test(lineContent.slice(0, position.column - 1));

        // Chained split subscript: e.g. `s.split(" ")[0].`
        if (/\.split\s*\([^)]*\)\s*\[[^\]]*\]\.$/.test(textBeforeWord)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }

        // Chained toCharArray subscript: e.g. `s.toCharArray()[0].` (primitive char cannot dereference)
        if (/\.toCharArray\s*\([^)]*\)\s*\[[^\]]*\]\.$/.test(textBeforeWord)) {
          return { suggestions: [] };
        }

        // Subscript access: e.g. `words[0].`, `nums[i].`, `matrix[0].`, `matrix[0][0].`
        const subMatch = textBeforeWord.match(/([a-zA-Z_]\w*)((?:\s*\[[^\]]*\])+)\.$/);
        if (subMatch) {
          const baseVar = subMatch[1];
          const brackets = subMatch[2];
          const subDepth = (brackets.match(/\[/g) || []).length;
          const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
          const varInfo = varsMap.get(baseVar);
          if (varInfo) {
            if (varInfo.category === "array") {
              const peeled = peelArrayDimensions(
                varInfo.typeString,
                subDepth,
                varInfo.elementCategory,
              );
              if (peeled.category === "primitive") {
                // Primitive element of array (e.g. int[] nums; nums[0]. or matrix[0][0].) cannot be dereferenced
                return { suggestions: [] };
              }
              if (peeled.category === "string") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems(
                      [...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
                      range,
                    ),
                  ),
                };
              }
              if (peeled.category === "array") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              if (peeled.category === "list") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              if (peeled.category === "map") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...MAP_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              if (peeled.category === "set") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...SET_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              return {
                suggestions: deduplicateSuggestions(
                  toCompletionItems(COMMON_INSTANCE_MEMBERS, range),
                ),
              };
            } else if (varInfo.category === "list" && subDepth === 1) {
              if (varInfo.elementCategory === "string") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems(
                      [...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
                      range,
                    ),
                  ),
                };
              }
            }
          }
          if (subDepth === 1 && /^(?:matrix|grid|board)\d*$/i.test(baseVar)) {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(COMMON_INSTANCE_MEMBERS, range)),
          };
        }

        // String literal access: e.g. `"hello".`
        if (/"(?:\\.|[^"\\])*"\.$/.test(textBeforeWord)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }

        // Chained string return: e.g. `.toString().`, `.nextLine().`, `.substring(...).`
        if (
          /\.(?:toString|nextLine|next|substring|trim|toLowerCase|toUpperCase)\s*\([^)]*\)\.$/.test(
            textBeforeWord,
          )
        ) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }

        // Chained array return: e.g. `.toArray().` or `.toCharArray().`
        if (/\.(?:toArray|toCharArray)\s*\([^)]*\)\.$/.test(textBeforeWord)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }

        // Chained collection .get(...) access: e.g. `list.get(0).` or `map.get(k).` or `matrix.get(0).get(0).`
        const getMatch = textBeforeWord.match(/([a-zA-Z_]\w*)((?:\.get\s*\([^)]*\))+)\.$/);
        if (getMatch) {
          const baseVar = getMatch[1];
          const gets = getMatch[2];
          const getDepth = (gets.match(/\.get\s*\(/g) || []).length;
          const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
          const varInfo = varsMap.get(baseVar);

          if (varInfo) {
            if (varInfo.category === "list") {
              const peeled = peelListElementType(varInfo.typeString, getDepth);
              if (peeled.category === "string") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems(
                      [...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
                      range,
                    ),
                  ),
                };
              }
              if (peeled.category === "list") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              if (peeled.category === "array") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              return {
                suggestions: deduplicateSuggestions(
                  toCompletionItems(COMMON_INSTANCE_MEMBERS, range),
                ),
              };
            } else if (varInfo.category === "map") {
              if (varInfo.elementCategory === "string") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems(
                      [...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
                      range,
                    ),
                  ),
                };
              }
              if (varInfo.elementCategory === "list") {
                return {
                  suggestions: deduplicateSuggestions(
                    toCompletionItems([...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
                  ),
                };
              }
              return {
                suggestions: deduplicateSuggestions(
                  toCompletionItems(COMMON_INSTANCE_MEMBERS, range),
                ),
              };
            }
          }

          // Fallback for .get(...) calls
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems(
                [...STRING_INSTANCE_MEMBERS, ...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
                range,
              ),
            ),
          };
        }

        // Double chain before dot: e.g. "System.out." or "System.err."
        const doubleChainMatch = textBeforeWord.match(/([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\.$/);
        if (doubleChainMatch) {
          const prefix = doubleChainMatch[1];
          const sub = doubleChainMatch[2];
          if (prefix === "System" && (sub === "out" || sub === "err")) {
            return {
              suggestions: deduplicateSuggestions(toCompletionItems(PRINTSTREAM_MEMBERS, range)),
            };
          }
        }

        const singleMatch = textBeforeWord.match(/([a-zA-Z_]\w*)\.$/);
        if (!singleMatch) {
          return { suggestions: [] };
        }

        const target = singleMatch[1];
        const lowerTarget = target.toLowerCase();

        // this. and super. instance member access
        if (lowerTarget === "this" || lowerTarget === "super") {
          const thisSuggestions: monacoDefault.languages.CompletionItem[] = [];
          const seenThis = new Set<string>();

          // 1. Methods declared in enclosing class
          const docMethods = extractJavaDocumentMethods(model, position.lineNumber);
          for (const [name, info] of docMethods) {
            if (!seenThis.has(name)) {
              seenThis.add(name);
              thisSuggestions.push({
                label: name,
                kind: m.languages.CompletionItemKind.Method,
                insertText: `${name}()`,
                detail: info.signature,
                range,
                sortText: `0_${name}`,
              });
            }
          }

          // 2. Class fields (only fields, NOT local variables or parameters)
          if (lowerTarget === "this") {
            const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
            for (const [name, info] of varsMap) {
              if (info.origin === "field" && !seenThis.has(name)) {
                seenThis.add(name);
                thisSuggestions.push({
                  label: name,
                  kind: m.languages.CompletionItemKind.Field,
                  insertText: name,
                  detail: `${info.typeString} ${name} (field)`,
                  range,
                  sortText: `0_${name}`,
                });
              }
            }
          }

          // 3. Object common instance members (equals, hashCode, toString, getClass, etc.)
          const commonItems = toCompletionItems(COMMON_INSTANCE_MEMBERS, range);
          for (const item of commonItems) {
            const labelStr = typeof item.label === "string" ? item.label : item.label.label;
            if (!seenThis.has(labelStr)) {
              seenThis.add(labelStr);
              thisSuggestions.push(item);
            }
          }

          return {
            suggestions: deduplicateSuggestions(thisSuggestions),
          };
        }

        // Standard library static classes
        if (target === "System") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(SYSTEM_MEMBERS, range)),
          };
        }
        if (target === "Math") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(MATH_MEMBERS, range)),
          };
        }
        if (target === "Arrays") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(ARRAYS_MEMBERS, range)),
          };
        }
        if (target === "Collections") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(COLLECTIONS_MEMBERS, range)),
          };
        }
        if (target === "Integer") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(INTEGER_STATIC_MEMBERS, range)),
          };
        }
        if (target === "Long") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(LONG_STATIC_MEMBERS, range)),
          };
        }
        if (target === "Double") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(DOUBLE_STATIC_MEMBERS, range)),
          };
        }
        if (target === "Character") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(CHARACTER_STATIC_MEMBERS, range)),
          };
        }
        if (target === "Boolean") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(BOOLEAN_STATIC_MEMBERS, range)),
          };
        }
        if (target === "Objects") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(OBJECTS_MEMBERS, range)),
          };
        }
        if (target === "String") {
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(STRING_STATIC_MEMBERS, range)),
          };
        }

        // Handle `import java.`
        if (lowerTarget === "java" && isImportPackageLine) {
          const subPackages = COMMON_PACKAGES.filter((p) => p.startsWith("java.")).map((p) =>
            p.slice("java.".length),
          );
          return {
            suggestions: deduplicateSuggestions(
              subPackages.map((sub) => ({
                label: sub,
                kind: m.languages.CompletionItemKind.Module,
                insertText: `${sub}.*;`,
                detail: `package java.${sub}`,
                range,
              })),
            ),
          };
        }

        // Inferred variable type from the current Java document in visible scope
        const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
        const inferredVar = varsMap.get(target);

        if (inferredVar) {
          if (inferredVar.category === "primitive") {
            // Primitive types in Java cannot be dereferenced (e.g. `int count; count.`)
            return { suggestions: [] };
          }
          if (inferredVar.category === "array") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "scanner") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...SCANNER_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "stringbuilder") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...STRINGBUILDER_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "string") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "list") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "map") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...MAP_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "set") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...SET_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "queue") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...QUEUE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          if (inferredVar.category === "stack") {
            return {
              suggestions: deduplicateSuggestions(
                toCompletionItems([...STACK_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
              ),
            };
          }
          return {
            suggestions: deduplicateSuggestions(toCompletionItems(COMMON_INSTANCE_MEMBERS, range)),
          };
        }

        // Fallback: identifier name heuristic when declaration is undeclared or outside scope
        if (/^(?:sc|scanner|in|reader)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...SCANNER_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:sb|strbuild|builder)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STRINGBUILDER_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:str|s|text|line|word|name|msg)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STRING_INSTANCE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:arr|nums)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...ARRAY_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:list|items|values|res|result)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:map|dict|counts|freq|seen)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...MAP_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:set|unique|visited)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...SET_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:q|queue|dq|deque)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...QUEUE_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }
        if (/^(?:st|stack)\d*$/i.test(lowerTarget)) {
          return {
            suggestions: deduplicateSuggestions(
              toCompletionItems([...STACK_MEMBERS, ...COMMON_INSTANCE_MEMBERS], range),
            ),
          };
        }

        // Default instance member access for any other object
        return {
          suggestions: deduplicateSuggestions(
            toCompletionItems(
              [...STRING_INSTANCE_MEMBERS, ...LIST_MEMBERS, ...COMMON_INSTANCE_MEMBERS],
              range,
            ),
          ),
        };
      }

      // Check if user is typing an `import static` directive
      const textBeforeCursor = lineContent.slice(0, position.column - 1);
      const isImportStaticDirective = /^\s*import\s+static\s+([a-zA-Z_][\w.]*)?$/i.test(
        textBeforeCursor,
      );

      const textBeforeCursorFull = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: 1,
      });
      const cleanedTopLevel = textBeforeCursorFull
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/.*/g, " ")
        .replace(/"(?:\\.|[^"\\])*"/g, " ");
      const hasClassBefore = /\b(?:class|interface|enum|record)\b/.test(cleanedTopLevel);

      if (isImportStaticDirective && !hasClassBefore) {
        const staticSuggestions: monacoDefault.languages.CompletionItem[] = [];
        for (const st of STATIC_TYPES) {
          staticSuggestions.push({
            label: st.name,
            kind: m.languages.CompletionItemKind.Class,
            insertText: `${st.fullName}.*;`,
            detail: `static import ${st.fullName}.*`,
            documentation: st.doc,
            range,
          });
        }
        return {
          suggestions: deduplicateSuggestions(staticSuggestions),
        };
      }

      // Check if user is typing a standard `import` statement
      const isImportDirective = /^\s*import\s+(?!static\b)([a-zA-Z_][\w.]*)?$/i.test(
        textBeforeCursor,
      );

      let importPackages: monacoDefault.languages.CompletionItem[] = [];
      if (isImportDirective && !hasClassBefore) {
        importPackages = COMMON_PACKAGES.map((pkg) => ({
          label: pkg,
          kind: m.languages.CompletionItemKind.Module,
          insertText: `${pkg}.*;`,
          detail: `import ${pkg}.*`,
          range,
        }));
      }

      // Suggest Keywords, Types, Snippets, and Local Symbols
      const keywordItems: monacoDefault.languages.CompletionItem[] = JAVA_KEYWORDS.map((kw) => ({
        label: kw,
        kind: m.languages.CompletionItemKind.Keyword,
        insertText: kw,
        detail: `keyword ${kw}`,
        range,
      }));

      const typeItems: monacoDefault.languages.CompletionItem[] = JAVA_TYPES.map((t) => ({
        label: t.name,
        kind: m.languages.CompletionItemKind.Class,
        insertText: t.name,
        detail: `class ${t.name}`,
        documentation: t.doc,
        range,
      }));

      const snippetItems: monacoDefault.languages.CompletionItem[] = SNIPPETS.map((s) => {
        let insertText = s.insertText;

        // Context-aware adjustment for "main" / "psvm" snippet:
        // If user already typed "public static void", "static void", "public static", "public", or "void",
        // avoid duplicating keywords.
        if (s.label === "main" || s.label === "psvm") {
          if (/(?:^|\s)public\s+static\s+void$/.test(textBeforeWord)) {
            insertText = "main(String[] args) {\n    ${1}\n}";
          } else if (/(?:^|\s)public\s+static$/.test(textBeforeWord)) {
            insertText = "void main(String[] args) {\n    ${1}\n}";
          } else if (/(?:^|\s)static\s+void$/.test(textBeforeWord)) {
            insertText = "main(String[] args) {\n    ${1}\n}";
          } else if (/(?:^|\s)public$/.test(textBeforeWord)) {
            insertText = "static void main(String[] args) {\n    ${1}\n}";
          } else if (/(?:^|\s)void$/.test(textBeforeWord)) {
            insertText = "main(String[] args) {\n    ${1}\n}";
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

      const localSymbols = extractJavaDocumentSymbols(model, position, range, m);

      return {
        suggestions: deduplicateSuggestions([
          ...localSymbols,
          ...importPackages,
          ...snippetItems,
          ...typeItems,
          ...keywordItems,
        ]),
      };
    },
  });

  // 2. Hover Provider: displays method signatures, variable types, and keyword docs on mouse hover
  m.languages.registerHoverProvider("java", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();
      const name = word.word;

      // Check qualification before the word
      let qualifier: string | null = null;
      let rawQualifier: string | null = null;
      const doubleMatch = textBefore.match(/([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\.$/);
      if (doubleMatch) {
        rawQualifier = `${doubleMatch[1]}.${doubleMatch[2]}`;
        qualifier = rawQualifier.toLowerCase();
      } else {
        const singleMatch = textBefore.match(/([a-zA-Z_]\w*)\.$/);
        if (singleMatch) {
          rawQualifier = singleMatch[1];
          qualifier = rawQualifier.toLowerCase();
        }
      }

      const findInList = (list: MethodItem[], w: string) =>
        list.find((item) => item.label.toLowerCase() === w.toLowerCase());

      let match: MethodItem | undefined;

      if (rawQualifier === "System.out" || rawQualifier === "System.err") {
        match = findInList(PRINTSTREAM_MEMBERS, name);
      } else if (rawQualifier === "System") {
        match = findInList(SYSTEM_MEMBERS, name);
      } else if (rawQualifier === "Math") {
        match = findInList(MATH_MEMBERS, name);
      } else if (rawQualifier === "Arrays") {
        match = findInList(ARRAYS_MEMBERS, name);
      } else if (rawQualifier === "Collections") {
        match = findInList(COLLECTIONS_MEMBERS, name);
      } else if (rawQualifier === "Integer") {
        match = findInList(INTEGER_STATIC_MEMBERS, name);
      } else if (rawQualifier === "Long") {
        match = findInList(LONG_STATIC_MEMBERS, name);
      } else if (rawQualifier === "Double") {
        match = findInList(DOUBLE_STATIC_MEMBERS, name);
      } else if (rawQualifier === "Character") {
        match = findInList(CHARACTER_STATIC_MEMBERS, name);
      } else if (rawQualifier === "Boolean") {
        match = findInList(BOOLEAN_STATIC_MEMBERS, name);
      } else if (rawQualifier === "Objects") {
        match = findInList(OBJECTS_MEMBERS, name);
      } else if (rawQualifier === "String") {
        match = findInList(STRING_STATIC_MEMBERS, name);
      } else if (qualifier === "this" || qualifier === "super") {
        const docMethods = extractJavaDocumentMethods(model, position.lineNumber);
        const dm = docMethods.get(name);
        if (dm) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`java\n${dm.signature}\n\`\`\`` },
              { value: `*Method declared in current class.*` },
            ],
          };
        }
        if (qualifier === "this") {
          const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
          const f = varsMap.get(name);
          if (f && f.origin === "field") {
            return {
              range: new m.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              ),
              contents: [
                { value: `\`\`\`java\n${f.typeString} ${f.name}\n\`\`\`` },
                { value: `*Field of current class.*` },
              ],
            };
          }
        }
        match = findInList(COMMON_INSTANCE_MEMBERS, name);
      } else if (qualifier) {
        // Check inferred variable types from the document in visible scope
        const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
        const v = varsMap.get(rawQualifier ?? qualifier) ?? varsMap.get(qualifier);
        if (v) {
          if (v.category === "array") match = findInList(ARRAY_MEMBERS, name);
          else if (v.category === "string") match = findInList(STRING_INSTANCE_MEMBERS, name);
          else if (v.category === "stringbuilder") match = findInList(STRINGBUILDER_MEMBERS, name);
          else if (v.category === "scanner") match = findInList(SCANNER_MEMBERS, name);
          else if (v.category === "list") match = findInList(LIST_MEMBERS, name);
          else if (v.category === "map") match = findInList(MAP_MEMBERS, name);
          else if (v.category === "set") match = findInList(SET_MEMBERS, name);
          else if (v.category === "queue") match = findInList(QUEUE_MEMBERS, name);
          else if (v.category === "stack") match = findInList(STACK_MEMBERS, name);
        }
        // Fallback to name heuristics
        if (!match) {
          if (/^(?:sc|scanner|in|reader)\d*$/i.test(qualifier))
            match = findInList(SCANNER_MEMBERS, name);
          else if (/^(?:sb|strbuild|builder)\d*$/i.test(qualifier))
            match = findInList(STRINGBUILDER_MEMBERS, name);
          else if (/^(?:str|s|text|line|word|name|msg)\d*$/i.test(qualifier))
            match = findInList(STRING_INSTANCE_MEMBERS, name);
          else if (/^(?:arr|nums)\d*$/i.test(qualifier)) match = findInList(ARRAY_MEMBERS, name);
          else if (/^(?:list|items|values|res|result)\d*$/i.test(qualifier))
            match = findInList(LIST_MEMBERS, name);
          else if (/^(?:map|dict|counts|freq|seen)\d*$/i.test(qualifier))
            match = findInList(MAP_MEMBERS, name);
          else if (/^(?:set|unique|visited)\d*$/i.test(qualifier))
            match = findInList(SET_MEMBERS, name);
          else if (/^(?:q|queue|dq|deque)\d*$/i.test(qualifier))
            match = findInList(QUEUE_MEMBERS, name);
          else if (/^(?:st|stack)\d*$/i.test(qualifier)) match = findInList(STACK_MEMBERS, name);
        }
        if (!match) {
          match = findInList(COMMON_INSTANCE_MEMBERS, name);
        }
      }

      if (match) {
        return {
          range: new m.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `\`\`\`java\n${match.detail ?? match.label}\n\`\`\`` },
            { value: match.documentation ?? "" },
          ],
        };
      }

      // Standalone hover without qualifier
      if (!qualifier) {
        // 1. User-defined local variable / parameter in visible scope
        const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
        const v = varsMap.get(name);
        if (v) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`java\n${v.typeString} ${v.name}\n\`\`\`` },
              {
                value: `*${v.origin === "field" ? "Field" : v.origin === "parameter" ? "Parameter" : v.origin === "foreach variable" ? "Foreach variable" : "Local variable"}*`,
              },
            ],
          };
        }

        // 2. User-defined method in document
        const docMethods = extractJavaDocumentMethods(model, position.lineNumber);
        const dm = docMethods.get(name);
        if (dm) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`java\n${dm.signature}\n\`\`\`` },
              { value: `*Method declared in current file.*` },
            ],
          };
        }

        // 3. Types
        const typeMatch = JAVA_TYPES.find((t) => t.name === name);
        if (typeMatch) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `\`\`\`java\nclass ${typeMatch.name}\n\`\`\`` },
              { value: typeMatch.doc },
            ],
          };
        }

        // 4. Keywords
        const kwDoc = JAVA_KEYWORD_DOCS[name];
        if (kwDoc) {
          return {
            range: new m.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [{ value: `\`\`\`java\nkeyword ${name}\n\`\`\`` }, { value: kwDoc }],
          };
        }
      }

      return null;
    },
  });

  // 3. Signature Help Provider: shows parameter hints for method calls
  m.languages.registerSignatureHelpProvider("java", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      const startLine = Math.max(1, position.lineNumber - 50);
      const textBefore = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Mask comments before scanning delimiters to prevent comment contents
      // (like apostrophes or parens) from corrupting the string or block parser
      const cleanedText = maskJavaComments(textBefore);

      const blockStack: { char: string; openIdx: number; argCount: number }[] = [];
      let inQuote: string | null = null;
      let isEscaped = false;

      for (let i = 0; i < cleanedText.length; i++) {
        const ch = cleanedText[i];

        if (inQuote !== null) {
          if (ch === inQuote && !isEscaped) {
            inQuote = null;
          } else if (ch === "\\" && !isEscaped) {
            isEscaped = true;
            continue;
          }
          isEscaped = false;
          continue;
        }

        if (ch === '"' || ch === "'") {
          inQuote = ch;
          continue;
        }

        if (ch === "(") {
          blockStack.push({ char: "(", openIdx: i, argCount: 0 });
        } else if (ch === ")") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(")
            blockStack.pop();
        } else if (ch === "[") {
          blockStack.push({ char: "[", openIdx: i, argCount: 0 });
        } else if (ch === "]") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "[")
            blockStack.pop();
        } else if (ch === "{") {
          blockStack.push({ char: "{", openIdx: i, argCount: 0 });
        } else if (ch === "}") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "{")
            blockStack.pop();
        } else if (ch === "<") {
          // Check if this '<' starts a generic type argument list (e.g. ArrayList<String>)
          const textPrior = cleanedText.slice(0, i).trimEnd();
          const isPrecededByIdentifier = /[a-zA-Z_]\w*$/.test(textPrior);
          if (isPrecededByIdentifier) {
            let tempDepth = 1;
            let isValidGeneric = true;
            let closeIdx = -1;
            for (let j = i + 1; j < cleanedText.length; j++) {
              const cj = cleanedText[j];
              if (cj === "<") {
                tempDepth++;
              } else if (cj === ">") {
                tempDepth--;
                if (tempDepth === 0) {
                  closeIdx = j;
                  break;
                }
              } else if (/[a-zA-Z0-9_.,\s?\[\]]/.test(cj)) {
                continue;
              } else {
                isValidGeneric = false;
                break;
              }
            }
            if (isValidGeneric && closeIdx !== -1) {
              i = closeIdx;
              continue;
            }
          }
        } else if (ch === ",") {
          if (blockStack.length > 0 && blockStack[blockStack.length - 1].char === "(") {
            blockStack[blockStack.length - 1].argCount++;
          }
        }
      }

      if (blockStack.length === 0) return null;
      const top = blockStack[blockStack.length - 1];
      if (top.char !== "(") return null;

      // Extract the call text preceding '('
      const callPrefix = cleanedText.slice(0, top.openIdx).trimEnd();
      const callMatch = callPrefix.match(/([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)$/);
      if (!callMatch) return null;

      const callText = callMatch[1];
      const callParts = callText.split(".");
      const methodName = callParts[callParts.length - 1];
      const rawQualifier = callParts.slice(0, -1).join(".");
      const qualifier = rawQualifier.toLowerCase();

      // 1. If keyword and no qualifier, return null immediately (e.g. `if (`, `while (`)
      if (!qualifier && JAVA_KEYWORD_SET.has(methodName)) {
        return null;
      }

      // Helper function to build signature result
      const buildSigResult = (item: MethodItem, argCount: number) => {
        if (!item.detail) return null;
        const paramMatch = item.detail.match(/\(([^)]*)\)/);
        const paramsRaw = paramMatch ? paramMatch[1].trim() : "";
        const paramList = paramsRaw ? paramsRaw.split(/\s*,\s*/) : [];

        return {
          value: {
            signatures: [
              {
                label: item.detail,
                documentation: item.documentation,
                parameters: paramList.map((p) => ({ label: p })),
              },
            ],
            activeSignature: 0,
            activeParameter: Math.min(argCount, Math.max(0, paramList.length - 1)),
          },
          dispose: () => {},
        };
      };

      // 2. Unqualified call (e.g. `solve(`, `max(`) or this/super call (e.g. `this.solve(`)
      if (!qualifier || qualifier === "this" || qualifier === "super") {
        // Check document-defined methods in scope
        const docMethods = extractJavaDocumentMethods(model, position.lineNumber);
        const docMethod = docMethods.get(methodName);
        if (docMethod) {
          return {
            value: {
              signatures: [
                {
                  label: docMethod.signature,
                  documentation: "Method declared in current file.",
                  parameters: docMethod.parameters.map((p) => ({
                    label: `${p.type} ${p.name}`,
                  })),
                },
              ],
              activeSignature: 0,
              activeParameter: Math.min(top.argCount, Math.max(0, docMethod.parameters.length - 1)),
            },
            dispose: () => {},
          };
        }

        if (qualifier === "this" || qualifier === "super") {
          const commonFound = COMMON_INSTANCE_MEMBERS.find((item) => item.label === methodName);
          if (commonFound) return buildSigResult(commonFound, top.argCount);
          return null;
        }

        // Check statically imported Math methods
        const fullDoc = model.getValue();
        if (
          /import\s+static\s+java\.lang\.Math\s*\.\s*(?:\*|max|min|abs|sqrt|pow|round|floor|ceil)\s*;/i.test(
            fullDoc,
          )
        ) {
          const mathFound = MATH_MEMBERS.find((mItem) => mItem.label === methodName);
          if (mathFound) return buildSigResult(mathFound, top.argCount);
        }

        // Check statically imported Arrays methods
        if (
          /import\s+static\s+java\.util\.Arrays\s*\.\s*(?:\*|sort|binarySearch|fill)\s*;/i.test(
            fullDoc,
          )
        ) {
          const arrFound = ARRAYS_MEMBERS.find((aItem) => aItem.label === methodName);
          if (arrFound) return buildSigResult(arrFound, top.argCount);
        }

        // Unqualified calls that are NOT user methods or statically imported:
        // Do NOT match instance methods (like List.add or String.charAt)
        return null;
      }

      // 3. Qualified call: look up signature definition
      const ALL_LISTS: { qual?: string; items: MethodItem[] }[] = [
        { qual: "System.out", items: PRINTSTREAM_MEMBERS },
        { qual: "System.err", items: PRINTSTREAM_MEMBERS },
        { qual: "System", items: SYSTEM_MEMBERS },
        { qual: "Math", items: MATH_MEMBERS },
        { qual: "Arrays", items: ARRAYS_MEMBERS },
        { qual: "Collections", items: COLLECTIONS_MEMBERS },
        { qual: "Integer", items: INTEGER_STATIC_MEMBERS },
        { qual: "Long", items: LONG_STATIC_MEMBERS },
        { qual: "Double", items: DOUBLE_STATIC_MEMBERS },
        { qual: "Character", items: CHARACTER_STATIC_MEMBERS },
        { qual: "Boolean", items: BOOLEAN_STATIC_MEMBERS },
        { qual: "Objects", items: OBJECTS_MEMBERS },
      ];

      for (const entry of ALL_LISTS) {
        if (entry.qual === rawQualifier) {
          const found = entry.items.find((item) => item.label === methodName);
          if (found) return buildSigResult(found, top.argCount);
        }
      }

      // Check inferred variable types from document in visible scope
      const varsMap = inferJavaVariablesAndTypes(model, position.lineNumber);
      const varInfo = varsMap.get(rawQualifier) ?? varsMap.get(qualifier);
      let targetList: MethodItem[] | null = null;

      if (varInfo) {
        if (varInfo.category === "string") targetList = STRING_INSTANCE_MEMBERS;
        else if (varInfo.category === "stringbuilder") targetList = STRINGBUILDER_MEMBERS;
        else if (varInfo.category === "scanner") targetList = SCANNER_MEMBERS;
        else if (varInfo.category === "list") targetList = LIST_MEMBERS;
        else if (varInfo.category === "map") targetList = MAP_MEMBERS;
        else if (varInfo.category === "set") targetList = SET_MEMBERS;
        else if (varInfo.category === "queue") targetList = QUEUE_MEMBERS;
        else if (varInfo.category === "stack") targetList = STACK_MEMBERS;
        else if (varInfo.category === "array") targetList = ARRAY_MEMBERS;
      }

      // Name heuristics fallback
      if (!targetList) {
        if (/^(?:sc|scanner|in|reader)\d*$/i.test(qualifier)) targetList = SCANNER_MEMBERS;
        else if (/^(?:sb|strbuild|builder)\d*$/i.test(qualifier))
          targetList = STRINGBUILDER_MEMBERS;
        else if (/^(?:str|s|text|line|word|name|msg)\d*$/i.test(qualifier))
          targetList = STRING_INSTANCE_MEMBERS;
        else if (/^(?:list|items|values|res|result)\d*$/i.test(qualifier))
          targetList = LIST_MEMBERS;
        else if (/^(?:arr|nums)\d*$/i.test(qualifier)) targetList = ARRAY_MEMBERS;
        else if (/^(?:map|dict|counts|freq|seen)\d*$/i.test(qualifier)) targetList = MAP_MEMBERS;
        else if (/^(?:set|unique|visited)\d*$/i.test(qualifier)) targetList = SET_MEMBERS;
        else if (/^(?:q|queue|dq|deque)\d*$/i.test(qualifier)) targetList = QUEUE_MEMBERS;
        else if (/^(?:st|stack)\d*$/i.test(qualifier)) targetList = STACK_MEMBERS;
      }

      if (targetList) {
        const found = targetList.find((item) => item.label === methodName);
        if (found) return buildSigResult(found, top.argCount);
      }

      // General fallback across instance method lists for the method name
      const GENERAL_INSTANCE_LISTS = [
        STRING_INSTANCE_MEMBERS,
        STRINGBUILDER_MEMBERS,
        SCANNER_MEMBERS,
        LIST_MEMBERS,
        MAP_MEMBERS,
        SET_MEMBERS,
        QUEUE_MEMBERS,
        STACK_MEMBERS,
        ARRAY_MEMBERS,
      ];
      for (const list of GENERAL_INSTANCE_LISTS) {
        const found = list.find((item) => item.label === methodName);
        if (found) return buildSigResult(found, top.argCount);
      }

      return null;
    },
  });
}
