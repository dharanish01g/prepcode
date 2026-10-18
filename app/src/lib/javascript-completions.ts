import * as monacoDefault from "monaco-editor";

type Monaco = typeof monacoDefault;

export interface MethodItem {
  label: string;
  kind?: monacoDefault.languages.CompletionItemKind;
  snippet?: string;
  detail?: string;
  documentation?: string;
}

export interface SigDef {
  label: string;
  doc: string;
  params: { label: string; doc?: string }[];
}

// -----------------------------------------------------------------------------
// Standard Built-in JavaScript Libraries & Members
// -----------------------------------------------------------------------------

export const CONSOLE_MEMBERS: MethodItem[] = [
  {
    label: "log",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "log(${1:data});",
    detail: "console.log(...data: any[]): void",
    documentation: "Prints to stdout with newline. Multiple arguments are formatted with spaces.",
  },
  {
    label: "error",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "error(${1:data});",
    detail: "console.error(...data: any[]): void",
    documentation: "Prints to stderr with newline.",
  },
  {
    label: "warn",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "warn(${1:data});",
    detail: "console.warn(...data: any[]): void",
    documentation: "Prints a warning message to stderr.",
  },
  {
    label: "info",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "info(${1:data});",
    detail: "console.info(...data: any[]): void",
    documentation: "Prints informational message to stdout.",
  },
  {
    label: "table",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "table(${1:tabularData});",
    detail: "console.table(tabularData: any, properties?: string[]): void",
    documentation: "Displays tabular data as a table.",
  },
  {
    label: "dir",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "dir(${1:item});",
    detail: "console.dir(item: any, options?: any): void",
    documentation:
      "Displays an interactive list of the properties of the specified JavaScript object.",
  },
  {
    label: "time",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "time(${1:'label'});",
    detail: "console.time(label?: string): void",
    documentation: "Starts a timer that can be used to track the duration of an operation.",
  },
  {
    label: "timeEnd",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "timeEnd(${1:'label'});",
    detail: "console.timeEnd(label?: string): void",
    documentation:
      "Stops a timer that was previously started by console.time() and prints the result.",
  },
  {
    label: "assert",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "assert(${1:condition}, ${2:message});",
    detail: "console.assert(condition: boolean, ...data: any[]): void",
    documentation: "Writes an error message to the console if the assertion is false.",
  },
  {
    label: "clear",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "clear();",
    detail: "console.clear(): void",
    documentation: "Clears the console buffer.",
  },
];

export const MATH_MEMBERS: MethodItem[] = [
  {
    label: "abs",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "abs(${1:x})",
    detail: "Math.abs(x: number): number",
    documentation: "Returns the absolute value of a number.",
  },
  {
    label: "max",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "max(${1:a}, ${2:b})",
    detail: "Math.max(...values: number[]): number",
    documentation: "Returns the larger of a set of supplied numeric expressions.",
  },
  {
    label: "min",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "min(${1:a}, ${2:b})",
    detail: "Math.min(...values: number[]): number",
    documentation: "Returns the smaller of a set of supplied numeric expressions.",
  },
  {
    label: "floor",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "floor(${1:x})",
    detail: "Math.floor(x: number): number",
    documentation: "Returns the greatest integer less than or equal to its numeric argument.",
  },
  {
    label: "ceil",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "ceil(${1:x})",
    detail: "Math.ceil(x: number): number",
    documentation: "Returns the smallest integer greater than or equal to its numeric argument.",
  },
  {
    label: "round",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "round(${1:x})",
    detail: "Math.round(x: number): number",
    documentation: "Returns a supplied numeric expression rounded to the nearest integer.",
  },
  {
    label: "trunc",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "trunc(${1:x})",
    detail: "Math.trunc(x: number): number",
    documentation:
      "Returns the integral part of the a numeric expression, x, removing any fractional digits.",
  },
  {
    label: "sqrt",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "sqrt(${1:x})",
    detail: "Math.sqrt(x: number): number",
    documentation: "Returns the square root of a number.",
  },
  {
    label: "cbrt",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "cbrt(${1:x})",
    detail: "Math.cbrt(x: number): number",
    documentation: "Returns the cube root of a number.",
  },
  {
    label: "pow",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "pow(${1:base}, ${2:exponent})",
    detail: "Math.pow(base: number, exponent: number): number",
    documentation: "Returns the value of a base expression taken to a specified power.",
  },
  {
    label: "sign",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "sign(${1:x})",
    detail: "Math.sign(x: number): number",
    documentation: "Returns the sign of the x, indicating whether x is positive, negative or zero.",
  },
  {
    label: "random",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "random()",
    detail: "Math.random(): number",
    documentation: "Returns a pseudorandom number between 0 (inclusive) and 1 (exclusive).",
  },
  {
    label: "hypot",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "hypot(${1:...values})",
    detail: "Math.hypot(...values: number[]): number",
    documentation: "Returns the square root of the sum of squares of its arguments.",
  },
  {
    label: "clz32",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "clz32(${1:x})",
    detail: "Math.clz32(x: number): number",
    documentation:
      "Returns the number of leading zero bits in the 32-bit binary representation of a number.",
  },
  {
    label: "imul",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "imul(${1:a}, ${2:b})",
    detail: "Math.imul(a: number, b: number): number",
    documentation: "Returns the result of the C-like 32-bit multiplication of the two parameters.",
  },
  {
    label: "log",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "log(${1:x})",
    detail: "Math.log(x: number): number",
    documentation: "Returns the natural logarithm (base e) of a number.",
  },
  {
    label: "log2",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "log2(${1:x})",
    detail: "Math.log2(x: number): number",
    documentation: "Returns the base 2 logarithm of a number.",
  },
  {
    label: "log10",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "log10(${1:x})",
    detail: "Math.log10(x: number): number",
    documentation: "Returns the base 10 logarithm of a number.",
  },
  {
    label: "exp",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "exp(${1:x})",
    detail: "Math.exp(x: number): number",
    documentation: "Returns e (Euler's number) raised to the specified power.",
  },
  {
    label: "sin",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "sin(${1:x})",
    detail: "Math.sin(x: number): number",
    documentation: "Returns the sine of a number in radians.",
  },
  {
    label: "cos",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "cos(${1:x})",
    detail: "Math.cos(x: number): number",
    documentation: "Returns the cosine of a number in radians.",
  },
  {
    label: "tan",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "tan(${1:x})",
    detail: "Math.tan(x: number): number",
    documentation: "Returns the tangent of a number in radians.",
  },
  {
    label: "PI",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Math.PI = 3.141592653589793",
    documentation: "Ratio of the circumference of a circle to its diameter.",
  },
  {
    label: "E",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Math.E = 2.718281828459045",
    documentation: "Euler's constant and the base of natural logarithms.",
  },
  {
    label: "SQRT2",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Math.SQRT2 = 1.4142135623730951",
    documentation: "Square root of 2.",
  },
];

export const ARRAY_PROTOTYPE_MEMBERS: MethodItem[] = [
  {
    label: "push",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "push(${1:item})",
    detail: "Array.prototype.push(...items: T[]): number",
    documentation:
      "Appends new elements to the end of an array, and returns the new length of the array.",
  },
  {
    label: "pop",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "pop()",
    detail: "Array.prototype.pop(): T | undefined",
    documentation: "Removes the last element from an array and returns it.",
  },
  {
    label: "shift",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "shift()",
    detail: "Array.prototype.shift(): T | undefined",
    documentation: "Removes the first element from an array and returns it.",
  },
  {
    label: "unshift",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "unshift(${1:item})",
    detail: "Array.prototype.unshift(...items: T[]): number",
    documentation:
      "Inserts new elements at the start of an array, and returns the new length of the array.",
  },
  {
    label: "slice",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "slice(${1:start}, ${2:end})",
    detail: "Array.prototype.slice(start?: number, end?: number): T[]",
    documentation: "Returns a copy of a section of an array.",
  },
  {
    label: "splice",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "splice(${1:start}, ${2:deleteCount}, ${3:...items})",
    detail: "Array.prototype.splice(start: number, deleteCount?: number, ...items: T[]): T[]",
    documentation:
      "Removes elements from an array and, if necessary, inserts new elements in their place.",
  },
  {
    label: "concat",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "concat(${1:...items})",
    detail: "Array.prototype.concat(...items: ConcatArray<T>[]): T[]",
    documentation: "Combines two or more arrays.",
  },
  {
    label: "join",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "join(${1:separator})",
    detail: "Array.prototype.join(separator?: string): string",
    documentation:
      "Adds all the elements of an array into a string, separated by the specified separator string.",
  },
  {
    label: "indexOf",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "indexOf(${1:searchElement})",
    detail: "Array.prototype.indexOf(searchElement: T, fromIndex?: number): number",
    documentation:
      "Returns the index of the first occurrence of a value in an array, or -1 if not found.",
  },
  {
    label: "lastIndexOf",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "lastIndexOf(${1:searchElement})",
    detail: "Array.prototype.lastIndexOf(searchElement: T, fromIndex?: number): number",
    documentation:
      "Returns the index of the last occurrence of a specified value in an array, or -1 if not found.",
  },
  {
    label: "includes",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "includes(${1:valueToFind})",
    detail: "Array.prototype.includes(valueToFind: T, fromIndex?: number): boolean",
    documentation:
      "Determines whether an array includes a certain value among its entries, returning true or false.",
  },
  {
    label: "find",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "find((${1:x}) => ${2:condition})",
    detail: "Array.prototype.find(predicate: (value: T) => boolean): T | undefined",
    documentation:
      "Returns the value of the first element in the array where predicate is true, and undefined otherwise.",
  },
  {
    label: "findIndex",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "findIndex((${1:x}) => ${2:condition})",
    detail: "Array.prototype.findIndex(predicate: (value: T) => boolean): number",
    documentation:
      "Returns the index of the first element in the array where predicate is true, and -1 otherwise.",
  },
  {
    label: "filter",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "filter((${1:x}) => ${2:condition})",
    detail: "Array.prototype.filter(predicate: (value: T) => boolean): T[]",
    documentation:
      "Returns the elements of an array that meet the condition specified in a callback function.",
  },
  {
    label: "map",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "map((${1:x}) => ${2:x})",
    detail: "Array.prototype.map<U>(callbackfn: (value: T) => U): U[]",
    documentation:
      "Calls a defined callback function on each element of an array, and returns an array containing the results.",
  },
  {
    label: "reduce",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "reduce((${1:acc}, ${2:cur}) => ${3:acc + cur}, ${4:0})",
    detail: "Array.prototype.reduce(callbackfn: (acc: U, cur: T) => U, initialValue: U): U",
    documentation:
      "Calls the specified callback function for all the elements in an array. The return value is the accumulated result.",
  },
  {
    label: "reduceRight",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "reduceRight((${1:acc}, ${2:cur}) => ${3:acc + cur}, ${4:0})",
    detail: "Array.prototype.reduceRight(callbackfn: (acc: U, cur: T) => U, initialValue: U): U",
    documentation:
      "Calls the specified callback function for all the elements in an array, in descending order.",
  },
  {
    label: "forEach",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "forEach((${1:x}) => {\n\t${2}\n})",
    detail: "Array.prototype.forEach(callbackfn: (value: T) => void): void",
    documentation: "Performs the specified action for each element in an array.",
  },
  {
    label: "some",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "some((${1:x}) => ${2:condition})",
    detail: "Array.prototype.some(predicate: (value: T) => boolean): boolean",
    documentation:
      "Determines whether the specified callback function returns true for any element of an array.",
  },
  {
    label: "every",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "every((${1:x}) => ${2:condition})",
    detail: "Array.prototype.every(predicate: (value: T) => boolean): boolean",
    documentation: "Determines whether all the members of an array satisfy the specified test.",
  },
  {
    label: "sort",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "sort((${1:a}, ${2:b}) => ${3:a - b})",
    detail: "Array.prototype.sort(compareFn?: (a: T, b: T) => number): this",
    documentation:
      "Sorts an array in place. By default, sorts elements as strings in ascending order.",
  },
  {
    label: "reverse",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "reverse()",
    detail: "Array.prototype.reverse(): this",
    documentation: "Reverses the elements in an array in place.",
  },
  {
    label: "fill",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "fill(${1:value})",
    detail: "Array.prototype.fill(value: T, start?: number, end?: number): this",
    documentation:
      "Changes all array elements from start to end index to a static value and returns the modified array.",
  },
  {
    label: "flat",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "flat(${1:depth})",
    detail: "Array.prototype.flat(depth?: number): any[]",
    documentation:
      "Returns a new array with all sub-array elements concatenated into it recursively up to the specified depth.",
  },
  {
    label: "flatMap",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "flatMap((${1:x}) => ${2:[x]})",
    detail: "Array.prototype.flatMap<U>(callback: (value: T) => U | readonly U[]): U[]",
    documentation:
      "Calls a defined callback function on each element of an array, and then flattens the result by one level.",
  },
  {
    label: "at",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "at(${1:index})",
    detail: "Array.prototype.at(index: number): T | undefined",
    documentation:
      "Takes an integer value and returns the item at that index, allowing for positive and negative integers.",
  },
  {
    label: "keys",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "keys()",
    detail: "Array.prototype.keys(): IterableIterator<number>",
    documentation: "Returns an iterable of keys in the array.",
  },
  {
    label: "values",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "values()",
    detail: "Array.prototype.values(): IterableIterator<T>",
    documentation: "Returns an iterable of values in the array.",
  },
  {
    label: "entries",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "entries()",
    detail: "Array.prototype.entries(): IterableIterator<[number, T]>",
    documentation: "Returns an iterable of key, value pairs for every entry in the array.",
  },
  {
    label: "length",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    detail: "Array.prototype.length: number",
    documentation: "Gets or sets the length of the array.",
  },
];

export const ARRAY_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "from",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "from(${1:arrayLike})",
    detail: "Array.from<T>(arrayLike: ArrayLike<T>): T[]",
    documentation: "Creates an array from an iterable or array-like object.",
  },
  {
    label: "isArray",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "isArray(${1:arg})",
    detail: "Array.isArray(arg: any): arg is any[]",
    documentation: "Returns true if the argument is an array, false otherwise.",
  },
  {
    label: "of",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "of(${1:...items})",
    detail: "Array.of<T>(...items: T[]): T[]",
    documentation: "Returns a new array from a set of elements.",
  },
];

export const STRING_PROTOTYPE_MEMBERS: MethodItem[] = [
  {
    label: "charAt",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "charAt(${1:pos})",
    detail: "String.prototype.charAt(pos: number): string",
    documentation: "Returns the character at the specified index.",
  },
  {
    label: "charCodeAt",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "charCodeAt(${1:index})",
    detail: "String.prototype.charCodeAt(index: number): number",
    documentation: "Returns the Unicode value of the character at the specified location.",
  },
  {
    label: "includes",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "includes(${1:searchString})",
    detail: "String.prototype.includes(searchString: string, position?: number): boolean",
    documentation:
      "Returns true if searchString appears as a substring of the result of converting this object to a String.",
  },
  {
    label: "startsWith",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "startsWith(${1:searchString})",
    detail: "String.prototype.startsWith(searchString: string, position?: number): boolean",
    documentation:
      "Returns true if the sequence of elements of searchString is the same as the corresponding elements of this object starting at position.",
  },
  {
    label: "endsWith",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "endsWith(${1:searchString})",
    detail: "String.prototype.endsWith(searchString: string, endPosition?: number): boolean",
    documentation:
      "Returns true if the sequence of elements of searchString is the same as the corresponding elements of this object ending at endPosition.",
  },
  {
    label: "indexOf",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "indexOf(${1:searchValue})",
    detail: "String.prototype.indexOf(searchValue: string, fromIndex?: number): number",
    documentation: "Returns the position of the first occurrence of a substring.",
  },
  {
    label: "lastIndexOf",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "lastIndexOf(${1:searchValue})",
    detail: "String.prototype.lastIndexOf(searchValue: string, fromIndex?: number): number",
    documentation: "Returns the last occurrence of a substring in the string.",
  },
  {
    label: "slice",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "slice(${1:start}, ${2:end})",
    detail: "String.prototype.slice(start?: number, end?: number): string",
    documentation: "Returns a section of a string.",
  },
  {
    label: "split",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "split(${1:separator})",
    detail: "String.prototype.split(separator: string | RegExp, limit?: number): string[]",
    documentation:
      "Split a string into substrings using the specified separator and return them as an array.",
  },
  {
    label: "substring",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "substring(${1:start}, ${2:end})",
    detail: "String.prototype.substring(start: number, end?: number): string",
    documentation: "Returns the substring at the specified location within a String object.",
  },
  {
    label: "toLowerCase",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "toLowerCase()",
    detail: "String.prototype.toLowerCase(): string",
    documentation: "Converts all the alphabetic characters in a string to lowercase.",
  },
  {
    label: "toUpperCase",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "toUpperCase()",
    detail: "String.prototype.toUpperCase(): string",
    documentation: "Converts all the alphabetic characters in a string to uppercase.",
  },
  {
    label: "trim",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "trim()",
    detail: "String.prototype.trim(): string",
    documentation:
      "Removes leading and trailing white space and line terminator characters from a string.",
  },
  {
    label: "trimStart",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "trimStart()",
    detail: "String.prototype.trimStart(): string",
    documentation: "Removes leading white space and line terminator characters from a string.",
  },
  {
    label: "trimEnd",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "trimEnd()",
    detail: "String.prototype.trimEnd(): string",
    documentation: "Removes trailing white space and line terminator characters from a string.",
  },
  {
    label: "replace",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "replace(${1:searchValue}, ${2:replaceValue})",
    detail: "String.prototype.replace(searchValue: string | RegExp, replaceValue: string): string",
    documentation: "Replaces text in a string, using a regular expression or search string.",
  },
  {
    label: "replaceAll",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "replaceAll(${1:searchValue}, ${2:replaceValue})",
    detail:
      "String.prototype.replaceAll(searchValue: string | RegExp, replaceValue: string): string",
    documentation: "Replaces all matches of a pattern in a string.",
  },
  {
    label: "repeat",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "repeat(${1:count})",
    detail: "String.prototype.repeat(count: number): string",
    documentation: "Returns a String value that is made from count copies appended together.",
  },
  {
    label: "padStart",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "padStart(${1:maxLength}, ${2:fillString})",
    detail: "String.prototype.padStart(maxLength: number, fillString?: string): string",
    documentation:
      "Pads the current string with a given string (possibly repeated) so that the resulting string reaches a given length.",
  },
  {
    label: "padEnd",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "padEnd(${1:maxLength}, ${2:fillString})",
    detail: "String.prototype.padEnd(maxLength: number, fillString?: string): string",
    documentation:
      "Pads the current string with a given string (possibly repeated) so that the resulting string reaches a given length from the end.",
  },
  {
    label: "at",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "at(${1:index})",
    detail: "String.prototype.at(index: number): string | undefined",
    documentation:
      "Takes an integer value and returns a new String consisting of the single UTF-16 code unit located at the specified offset.",
  },
  {
    label: "length",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    detail: "String.prototype.length: number",
    documentation: "Returns the length of the String object.",
  },
];

export const STRING_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "fromCharCode",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "fromCharCode(${1:...codes})",
    detail: "String.fromCharCode(...codes: number[]): string",
    documentation: "Returns a string created from the specified sequence of UTF-16 code units.",
  },
  {
    label: "fromCodePoint",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "fromCodePoint(${1:...codePoints})",
    detail: "String.fromCodePoint(...codePoints: number[]): string",
    documentation: "Returns a string created by using the specified sequence of code points.",
  },
  {
    label: "raw",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "raw`${1:template}`",
    detail: "String.raw(template: TemplateStringsArray, ...substitutions: any[]): string",
    documentation: "Returns the raw string form of template strings.",
  },
];

export const OBJECT_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "keys",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "keys(${1:obj})",
    detail: "Object.keys(o: object): string[]",
    documentation:
      "Returns the names of the enumerable string properties and methods of an object.",
  },
  {
    label: "values",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "values(${1:obj})",
    detail: "Object.values<T>(o: { [s: string]: T }): T[]",
    documentation: "Returns an array of values of the enumerable properties of an object.",
  },
  {
    label: "entries",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "entries(${1:obj})",
    detail: "Object.entries<T>(o: { [s: string]: T }): [string, T][]",
    documentation: "Returns an array of key/values of the enumerable properties of an object.",
  },
  {
    label: "fromEntries",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "fromEntries(${1:iterable})",
    detail:
      "Object.fromEntries<T>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T }",
    documentation: "Returns an object created by key-value entries for properties and methods.",
  },
  {
    label: "assign",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "assign(${1:target}, ${2:...sources})",
    detail: "Object.assign<T, U>(target: T, source: U): T & U",
    documentation:
      "Copy the values of all of the enumerable own properties from one or more source objects to a target object.",
  },
  {
    label: "hasOwn",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "hasOwn(${1:obj}, ${2:'prop'})",
    detail: "Object.hasOwn(o: object, v: PropertyKey): boolean",
    documentation:
      "Determines whether an object has a property with the specified name as an own property.",
  },
  {
    label: "freeze",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "freeze(${1:obj})",
    detail: "Object.freeze<T>(a: T): Readonly<T>",
    documentation:
      "Prevents the modification of existing property attributes and values, and prevents the addition of new properties.",
  },
  {
    label: "create",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "create(${1:proto})",
    detail: "Object.create(o: object | null): any",
    documentation: "Creates an object that has the specified prototype.",
  },
];

export const MAP_PROTOTYPE_MEMBERS: MethodItem[] = [
  {
    label: "get",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "get(${1:key})",
    detail: "Map.prototype.get(key: K): V | undefined",
    documentation: "Returns a specified element from a Map object.",
  },
  {
    label: "set",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "set(${1:key}, ${2:value})",
    detail: "Map.prototype.set(key: K, value: V): this",
    documentation: "Adds a new element with a specified key and value to the Map.",
  },
  {
    label: "has",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "has(${1:key})",
    detail: "Map.prototype.has(key: K): boolean",
    documentation:
      "Returns a boolean asserting whether a value has been associated to the key in the Map object or not.",
  },
  {
    label: "delete",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "delete(${1:key})",
    detail: "Map.prototype.delete(key: K): boolean",
    documentation: "Removes the specified element from a Map.",
  },
  {
    label: "clear",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "clear()",
    detail: "Map.prototype.clear(): void",
    documentation: "Removes all elements from the Map object.",
  },
  {
    label: "keys",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "keys()",
    detail: "Map.prototype.keys(): IterableIterator<K>",
    documentation: "Returns an iterable of keys in the map.",
  },
  {
    label: "values",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "values()",
    detail: "Map.prototype.values(): IterableIterator<V>",
    documentation: "Returns an iterable of values in the map.",
  },
  {
    label: "entries",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "entries()",
    detail: "Map.prototype.entries(): IterableIterator<[K, V]>",
    documentation: "Returns an iterable of key, value pairs for every entry in the map.",
  },
  {
    label: "forEach",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "forEach((${1:val}, ${2:key}) => {\n\t${3}\n})",
    detail: "Map.prototype.forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void",
    documentation:
      "Executes a provided function once per each key/value pair in the Map, in insertion order.",
  },
  {
    label: "size",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    detail: "Map.prototype.size: number",
    documentation: "Returns the number of elements in the Map.",
  },
];

export const SET_PROTOTYPE_MEMBERS: MethodItem[] = [
  {
    label: "add",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "add(${1:value})",
    detail: "Set.prototype.add(value: T): this",
    documentation: "Appends a new element with a specified value to the Set.",
  },
  {
    label: "has",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "has(${1:value})",
    detail: "Set.prototype.has(value: T): boolean",
    documentation:
      "Returns a boolean asserting whether an element is present with the given value in the Set.",
  },
  {
    label: "delete",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "delete(${1:value})",
    detail: "Set.prototype.delete(value: T): boolean",
    documentation: "Removes a specified value from the Set.",
  },
  {
    label: "clear",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "clear()",
    detail: "Set.prototype.clear(): void",
    documentation: "Removes all elements from the Set object.",
  },
  {
    label: "keys",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "keys()",
    detail: "Set.prototype.keys(): IterableIterator<T>",
    documentation: "Returns an iterable of values in the set.",
  },
  {
    label: "values",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "values()",
    detail: "Set.prototype.values(): IterableIterator<T>",
    documentation: "Returns an iterable of values in the set.",
  },
  {
    label: "entries",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "entries()",
    detail: "Set.prototype.entries(): IterableIterator<[T, T]>",
    documentation: "Returns an iterable of [v,v] pairs for every element in the set.",
  },
  {
    label: "forEach",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "forEach((${1:val}) => {\n\t${2}\n})",
    detail: "Set.prototype.forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void",
    documentation:
      "Executes a provided function once per each value in the Set object, in insertion order.",
  },
  {
    label: "size",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    detail: "Set.prototype.size: number",
    documentation: "Returns the number of (unique) elements in the Set.",
  },
];

export const NUMBER_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "isInteger",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "isInteger(${1:number})",
    detail: "Number.isInteger(number: any): boolean",
    documentation: "Returns true if the value passed is an integer, false otherwise.",
  },
  {
    label: "isNaN",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "isNaN(${1:number})",
    detail: "Number.isNaN(number: any): boolean",
    documentation: "Returns true if the value passed is NaN, false otherwise.",
  },
  {
    label: "isFinite",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "isFinite(${1:number})",
    detail: "Number.isFinite(number: any): boolean",
    documentation: "Returns true if the value passed is a finite number, false otherwise.",
  },
  {
    label: "parseInt",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "parseInt(${1:string}, ${2:10})",
    detail: "Number.parseInt(string: string, radix?: number): number",
    documentation: "Converts a string to an integer.",
  },
  {
    label: "parseFloat",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "parseFloat(${1:string})",
    detail: "Number.parseFloat(string: string): number",
    documentation: "Converts a string to a floating-point number.",
  },
  {
    label: "MAX_SAFE_INTEGER",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Number.MAX_SAFE_INTEGER = 9007199254740991",
    documentation: "The maximum safe integer in JavaScript (2^53 - 1).",
  },
  {
    label: "MIN_SAFE_INTEGER",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Number.MIN_SAFE_INTEGER = -9007199254740991",
    documentation: "The minimum safe integer in JavaScript (-(2^53 - 1)).",
  },
  {
    label: "MAX_VALUE",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Number.MAX_VALUE = 1.7976931348623157e+308",
    documentation: "The largest positive representable number.",
  },
  {
    label: "POSITIVE_INFINITY",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Number.POSITIVE_INFINITY = Infinity",
    documentation: "A value representing the positive Infinity value.",
  },
  {
    label: "NEGATIVE_INFINITY",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    detail: "Number.NEGATIVE_INFINITY = -Infinity",
    documentation: "A value representing the negative Infinity value.",
  },
];

export const JSON_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "stringify",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "stringify(${1:value})",
    detail: "JSON.stringify(value: any, replacer?: any, space?: string | number): string",
    documentation: "Converts a JavaScript value to a JSON string.",
  },
  {
    label: "parse",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "parse(${1:text})",
    detail: "JSON.parse(text: string, reviver?: (key: any, value: any) => any): any",
    documentation: "Converts a JSON string into an object.",
  },
];

export const PROMISE_STATIC_MEMBERS: MethodItem[] = [
  {
    label: "resolve",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "resolve(${1:value})",
    detail: "Promise.resolve<T>(value: T): Promise<T>",
    documentation: "Creates a new resolved promise for the provided value.",
  },
  {
    label: "reject",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "reject(${1:reason})",
    detail: "Promise.reject(reason?: any): Promise<never>",
    documentation: "Creates a new rejected promise for the provided reason.",
  },
  {
    label: "all",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "all(${1:values})",
    detail: "Promise.all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>",
    documentation:
      "Creates a Promise that is resolved with an array of results when all of the provided Promises resolve.",
  },
  {
    label: "allSettled",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "allSettled(${1:values})",
    detail:
      "Promise.allSettled(values: Iterable<Promise<any>>): Promise<PromiseSettledResult<any>[]>",
    documentation:
      "Creates a Promise that is resolved with an array of result objects after all the given promises have either resolved or rejected.",
  },
  {
    label: "race",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "race(${1:values})",
    detail: "Promise.race<T>(values: Iterable<T>): Promise<Awaited<T>>",
    documentation:
      "Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.",
  },
];

export const NODE_PROCESS_MEMBERS: MethodItem[] = [
  {
    label: "stdout",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "stdout",
    detail: "process.stdout: WritableStream",
    documentation: "A stream connected to stdout.",
  },
  {
    label: "stdin",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "stdin",
    detail: "process.stdin: ReadableStream",
    documentation: "A stream connected to stdin.",
  },
  {
    label: "argv",
    kind: monacoDefault.languages.CompletionItemKind.Property,
    snippet: "argv",
    detail: "process.argv: string[]",
    documentation: "Command-line arguments passed to the Node.js process.",
  },
  {
    label: "exit",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "exit(${1:0});",
    detail: "process.exit(code?: number): never",
    documentation: "Instructs Node.js to terminate the process synchronously with an exit status.",
  },
  {
    label: "cwd",
    kind: monacoDefault.languages.CompletionItemKind.Method,
    snippet: "cwd()",
    detail: "process.cwd(): string",
    documentation: "Returns the current working directory of the Node.js process.",
  },
];

export const LIST_NODE_MEMBERS: MethodItem[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "val",
    detail: "ListNode.val: any",
    documentation: "The value stored in this linked list node.",
  },
  {
    label: "next",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "next",
    detail: "ListNode.next: ListNode | null",
    documentation: "Pointer to the next linked list node.",
  },
];

export const TREE_NODE_MEMBERS: MethodItem[] = [
  {
    label: "val",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "val",
    detail: "TreeNode.val: any",
    documentation: "The value stored in this binary tree node.",
  },
  {
    label: "left",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "left",
    detail: "TreeNode.left: TreeNode | null",
    documentation: "Pointer to the left child tree node.",
  },
  {
    label: "right",
    kind: monacoDefault.languages.CompletionItemKind.Field,
    snippet: "right",
    detail: "TreeNode.right: TreeNode | null",
    documentation: "Pointer to the right child tree node.",
  },
];

// -----------------------------------------------------------------------------
// Global Identifiers, Functions, & Snippets
// -----------------------------------------------------------------------------

export const JS_GLOBAL_ITEMS: MethodItem[] = [
  {
    label: "console",
    kind: monacoDefault.languages.CompletionItemKind.Module,
    detail: "console: Console",
    documentation: "The console module provides a simple debugging console.",
  },
  {
    label: "Math",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Math: Math",
    documentation:
      "An intrinsic object that provides basic mathematics functionality and constants.",
  },
  {
    label: "JSON",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "JSON: JSON",
    documentation:
      "An intrinsic object that provides functions to convert JavaScript values to and from JSON.",
  },
  {
    label: "Array",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Array: ArrayConstructor",
    documentation: "The Array constructor creates Array instances.",
  },
  {
    label: "Object",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Object: ObjectConstructor",
    documentation: "Provides functionality common to all JavaScript objects.",
  },
  {
    label: "String",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "String: StringConstructor",
    documentation:
      "Allows manipulation and formatting of text strings and determination and location of substrings.",
  },
  {
    label: "Number",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Number: NumberConstructor",
    documentation:
      "An object that represents a number of any kind. All JavaScript numbers are 64-bit floating-point numbers.",
  },
  {
    label: "Boolean",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Boolean: BooleanConstructor",
    documentation: "An object that represents a boolean value.",
  },
  {
    label: "Map",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "new Map()",
    detail: "new Map<K, V>(): Map<K, V>",
    documentation:
      "A collection of keyed data items, similar to an Object. Keys can be of any type.",
  },
  {
    label: "Set",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "new Set()",
    detail: "new Set<T>(): Set<T>",
    documentation: "A collection of unique values.",
  },
  {
    label: "Promise",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Promise: PromiseConstructor",
    documentation: "Represents the eventual completion (or failure) of an asynchronous operation.",
  },
  {
    label: "Date",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "Date: DateConstructor",
    documentation: "Enables basic storage and retrieval of dates and times.",
  },
  {
    label: "RegExp",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    detail: "RegExp: RegExpConstructor",
    documentation: "Creates regular expression objects.",
  },
  {
    label: "parseInt",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "parseInt(${1:string}, ${2:10})",
    detail: "parseInt(string: string, radix?: number): number",
    documentation: "Converts a string to an integer with the specified radix.",
  },
  {
    label: "parseFloat",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "parseFloat(${1:string})",
    detail: "parseFloat(string: string): number",
    documentation: "Converts a string to a floating-point number.",
  },
  {
    label: "isNaN",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "isNaN(${1:number})",
    detail: "isNaN(number: number): boolean",
    documentation:
      "Returns a Boolean value that indicates whether a value is the reserved value NaN (not a number).",
  },
  {
    label: "isFinite",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "isFinite(${1:number})",
    detail: "isFinite(number: number): boolean",
    documentation: "Returns true if the argument is a finite number, false otherwise.",
  },
  {
    label: "structuredClone",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "structuredClone(${1:value})",
    detail: "structuredClone<T>(value: T): T",
    documentation: "Creates a deep clone of a given value using the structured clone algorithm.",
  },
  {
    label: "require",
    kind: monacoDefault.languages.CompletionItemKind.Function,
    snippet: "require(${1:'module'})",
    detail: "require(id: string): any",
    documentation: "Node.js module loader function.",
  },
  {
    label: "process",
    kind: monacoDefault.languages.CompletionItemKind.Variable,
    detail: "process: NodeJS.Process",
    documentation: "Provides information about, and control over, the current Node.js process.",
  },
  {
    label: "ListNode",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "new ListNode(${1:val})",
    detail: "ListNode(val, next)",
    documentation: "Singly linked list node data structure commonly used in coding interviews.",
  },
  {
    label: "TreeNode",
    kind: monacoDefault.languages.CompletionItemKind.Class,
    snippet: "new TreeNode(${1:val})",
    detail: "TreeNode(val, left, right)",
    documentation: "Binary tree node data structure commonly used in coding interviews.",
  },
];

export const JS_SNIPPETS: MethodItem[] = [
  {
    label: "clg",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "console.log(${1});",
    detail: "console.log(...) statement",
    documentation: "Logs an expression to stdout.",
  },
  {
    label: "log",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "console.log(${1});",
    detail: "console.log(...) statement",
    documentation: "Logs an expression to stdout.",
  },
  {
    label: "fori",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}",
    detail: "Standard for loop",
    documentation: "Iterates with an index variable from 0 to n.",
  },
  {
    label: "forof",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for (const ${1:item} of ${2:iterable}) {\n\t${0}\n}",
    detail: "for...of loop",
    documentation: "Iterates over values of an iterable object (Array, Set, Map, String).",
  },
  {
    label: "forin",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "for (const ${1:key} in ${2:object}) {\n\t${0}\n}",
    detail: "for...in loop",
    documentation: "Iterates over the enumerable property keys of an object.",
  },
  {
    label: "afn",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "const ${1:name} = (${2:params}) => {\n\t${0}\n};",
    detail: "Arrow function declaration",
    documentation: "Declares an arrow function assigned to a const variable.",
  },
  {
    label: "fn",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "function ${1:name}(${2:params}) {\n\t${0}\n}",
    detail: "Function declaration",
    documentation: "Declares a named function.",
  },
  {
    label: "class",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet:
      "class ${1:Solution} {\n\tconstructor(${2:params}) {\n\t\t${3}\n\t}\n\n\t${4:method}(${5:args}) {\n\t\t${0}\n\t}\n}",
    detail: "Class declaration",
    documentation: "Declares an ES6 class with constructor and method.",
  },
  {
    label: "sortnum",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "${1:arr}.sort((a, b) => a - b);",
    detail: "Numeric sort ascending",
    documentation: "Sorts numbers in ascending order without string lexicographical conversion.",
  },
  {
    label: "sortdesc",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "${1:arr}.sort((a, b) => b - a);",
    detail: "Numeric sort descending",
    documentation: "Sorts numbers in descending order.",
  },
  {
    label: "trycatch",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet: "try {\n\t${1}\n} catch (${2:err}) {\n\t${0}\n}",
    detail: "try...catch block",
    documentation: "Catches exceptions thrown in the try block.",
  },
  {
    label: "bsearch",
    kind: monacoDefault.languages.CompletionItemKind.Snippet,
    snippet:
      "let left = 0, right = ${1:nums}.length - 1;\nwhile (left <= right) {\n\tconst mid = Math.floor((left + right) / 2);\n\tif (${1:nums}[mid] === ${2:target}) {\n\t\treturn mid;\n\t} else if (${1:nums}[mid] < ${2:target}) {\n\t\tleft = mid + 1;\n\t} else {\n\t\tright = mid - 1;\n\t}\n}\nreturn -1;",
    detail: "Binary search skeleton",
    documentation: "Standard iterative binary search over a sorted array.",
  },
];

export const JS_KEYWORDS: string[] = [
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "class",
  "extends",
  "constructor",
  "new",
  "this",
  "super",
  "try",
  "catch",
  "finally",
  "throw",
  "async",
  "await",
  "yield",
  "import",
  "export",
  "from",
  "typeof",
  "instanceof",
  "in",
  "of",
  "void",
  "delete",
  "null",
  "undefined",
  "true",
  "false",
  "NaN",
  "Infinity",
];

const CONTROL_FLOW_KEYWORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "throw",
  "await",
  "function",
  "class",
]);

// -----------------------------------------------------------------------------
// Comment & String Shielding
// -----------------------------------------------------------------------------

/**
 * Strips comments from a single line, replacing them with spaces to preserve length.
 */
export function stripJSComment(line: string): string {
  let result = "";
  let inString: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      result += ch;
      if (ch === "\\" && i + 1 < line.length) {
        result += line[++i];
      } else if (ch === inString) {
        inString = null;
      }
    } else {
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        result += ch;
      } else if (ch === "/" && i + 1 < line.length && line[i + 1] === "/") {
        result += " ".repeat(line.length - i);
        break;
      } else {
        result += ch;
      }
    }
  }
  return result;
}

/**
 * Checks if a specific 0-based character index on a line falls within a string or comment.
 */
export function isInsideCommentOrString(line: string, col: number): boolean {
  let inQuote: string | null = null;
  let inBlockComment = false;

  for (let i = 0; i < line.length && i <= col; i++) {
    const ch = line[i];
    const next = i + 1 < line.length ? line[i + 1] : "";

    if (inQuote) {
      if (ch === "\\" && i + 1 < line.length) {
        if (i === col || i + 1 === col) return true;
        i++;
        continue;
      }
      if (ch === inQuote) {
        if (i === col) return true;
        inQuote = null;
        continue;
      }
      if (i === col) return true;
    } else if (inBlockComment) {
      if (ch === "*" && next === "/") {
        if (i === col || i + 1 === col) return true;
        inBlockComment = false;
        i++;
        continue;
      }
      if (i === col) return true;
    } else {
      if (ch === "/" && next === "/") {
        return i <= col;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        if (i === col || i + 1 === col) return true;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inQuote = ch;
        if (i === col) return true;
      }
    }
  }
  return inQuote !== null || inBlockComment;
}

/**
 * Replaces comments and string literals across multiple lines with spaces to preserve column offsets.
 */
export function maskCommentsAndStrings(code: string): string {
  let result = "";
  let inString: string | null = null;
  let inBlockComment = false;
  let inTemplateExpr = 0;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : "";

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        result += "  ";
        inBlockComment = false;
        i++;
      } else {
        result += ch === "\n" ? "\n" : " ";
      }
    } else if (inString) {
      if (ch === "\\" && i + 1 < code.length) {
        result += "  ";
        i++;
      } else if (inString === "`" && ch === "$" && next === "{") {
        result += "${";
        inTemplateExpr++;
        inString = null;
        i++;
      } else if (ch === inString) {
        result += " ";
        inString = null;
      } else {
        result += ch === "\n" ? "\n" : " ";
      }
    } else if (inTemplateExpr > 0 && ch === "}") {
      result += "}";
      inTemplateExpr--;
      inString = "`";
    } else {
      if (ch === "/" && next === "/") {
        // Single line comment
        let end = code.indexOf("\n", i);
        if (end === -1) end = code.length;
        result += " ".repeat(end - i);
        i = end - 1;
      } else if (ch === "/" && next === "*") {
        result += "  ";
        inBlockComment = true;
        i++;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        result += " ";
      } else {
        result += ch;
      }
    }
  }
  return result;
}

// -----------------------------------------------------------------------------
// Document Scope & Symbol Extraction
// -----------------------------------------------------------------------------

export interface JSSymbols {
  variables: Map<string, { type?: string; line: number }>;
  functions: Map<string, { params: string[]; line: number }>;
  classes: Map<string, { methods: string[]; fields: string[]; line: number }>;
}

export interface JSScope {
  startLine: number;
  endLine: number;
  variables: Map<string, { type?: string; line: number }>;
  functions: Map<string, { params: string[]; line: number }>;
}

/**
 * Extracts visible scopes in a JavaScript document based on curly brace blocks.
 */
export function extractJSScopeStack(
  model: monacoDefault.editor.ITextModel,
  targetLine: number,
): JSScope[] {
  const lineCount = model.getLineCount();
  const allLines: string[] = [];
  for (let ln = 1; ln <= lineCount; ln++) {
    allLines.push(model.getLineContent(ln));
  }
  const cleanCode = maskCommentsAndStrings(allLines.join("\n"));
  const cleanLines = cleanCode.split("\n");

  const scopes: JSScope[] = [
    { startLine: 1, endLine: lineCount, variables: new Map(), functions: new Map() },
  ];
  const blockStack: { startLine: number; scope: JSScope }[] = [];

  for (let ln = 1; ln <= lineCount; ln++) {
    const cleanLine = cleanLines[ln - 1] ?? "";

    // 1. Function declarations: function foo(a, b) {
    const fnMatch = cleanLine.match(/\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/);
    if (fnMatch) {
      const name = fnMatch[1];
      const params = fnMatch[2]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const targetScope = scopes[scopes.length - 1];
      targetScope.functions.set(name, { params, line: ln });
    }

    // 2. Arrow function / variable assignment: const foo = (a, b) => { ... }
    const arrowFnMatch = cleanLine.match(
      /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/,
    );
    if (arrowFnMatch) {
      const name = arrowFnMatch[1];
      const params = arrowFnMatch[2]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const targetScope = scopes[scopes.length - 1];
      targetScope.functions.set(name, { params, line: ln });
    }

    // 3. Variable declarations: const / let / var
    // Negative lookbehind ensures we do not match property assignments like obj.let
    const varMatches = cleanLine.matchAll(/(?:^|[^.\w$])\b(const|let|var)\s+([^;]+)/g);
    for (const vm of varMatches) {
      const declStr = vm[2].trim();
      // Handle comma-separated declarations like const a = 1, b = 2;
      const declParts = splitByTopLevelCommas(declStr);
      for (const part of declParts) {
        const itemMatch = part.trim().match(/^([a-zA-Z_$][\w$]*)(?:\s*=\s*(.+))?$/);
        if (itemMatch) {
          const varName = itemMatch[1];
          const valExpr = itemMatch[2]?.trim();
          let inferredType: string | undefined;
          if (valExpr) {
            if (
              valExpr.startsWith("[") ||
              valExpr.includes(".split(") ||
              valExpr.includes("Array.from")
            ) {
              inferredType = "Array";
            } else if (
              valExpr.startsWith('"') ||
              valExpr.startsWith("'") ||
              valExpr.startsWith("`")
            ) {
              inferredType = "String";
            } else if (valExpr.startsWith("new Map")) {
              inferredType = "Map";
            } else if (valExpr.startsWith("new Set")) {
              inferredType = "Set";
            } else if (/^\d+$/.test(valExpr)) {
              inferredType = "Number";
            } else if (valExpr.startsWith("new ListNode")) {
              inferredType = "ListNode";
            } else if (valExpr.startsWith("new TreeNode")) {
              inferredType = "TreeNode";
            }
          }
          const targetScope = scopes[scopes.length - 1];
          targetScope.variables.set(varName, { type: inferredType, line: ln });
        }
      }
    }

    // 4. For loop variable declarations: for (const x of arr) or for (let i = 0; ...)
    const forOfMatch = cleanLine.match(
      /for\s*\(\s*(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s+of\s+([a-zA-Z_$][\w$]*)/,
    );
    if (forOfMatch) {
      const loopVar = forOfMatch[1];
      const targetScope = scopes[scopes.length - 1];
      targetScope.variables.set(loopVar, { line: ln });
    }

    // 5. Track braces to manage scope stack
    for (let ci = 0; ci < cleanLine.length; ci++) {
      const ch = cleanLine[ci];
      if (ch === "{") {
        const newScope: JSScope = {
          startLine: ln,
          endLine: lineCount,
          variables: new Map(),
          functions: new Map(),
        };
        blockStack.push({ startLine: ln, scope: newScope });
        scopes.push(newScope);
      } else if (ch === "}") {
        if (blockStack.length > 0) {
          const popped = blockStack.pop()!;
          popped.scope.endLine = ln;
          // If the closed scope ends before targetLine, it's not enclosing targetLine
          if (targetLine > ln) {
            const idx = scopes.indexOf(popped.scope);
            if (idx !== -1) scopes.splice(idx, 1);
          }
        }
      }
    }
  }

  return scopes;
}

/**
 * Splits a parameter or declaration string by top-level commas, respecting parentheses and brackets.
 */
function splitByTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let current = "";

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "(") depthParen++;
    else if (ch === ")") {
      if (depthParen > 0) depthParen--;
    } else if (ch === "[") depthBracket++;
    else if (ch === "]") {
      if (depthBracket > 0) depthBracket--;
    } else if (ch === "{") depthBrace++;
    else if (ch === "}") {
      if (depthBrace > 0) depthBrace--;
    }

    if (ch === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Parses balanced brackets from subscript access like matrix[0][0] or arr[i + 1].
 */
export function parseSubscriptExpression(expr: string): { baseVar: string; dim: number } | null {
  const match = expr.match(/^([a-zA-Z_$][\w$]*)((?:\[[^\]]*\])+)$/);
  if (!match) return null;
  const baseVar = match[1];
  const bracketParts = match[2].match(/\[[^\]]*\]/g) || [];
  return { baseVar, dim: bracketParts.length };
}

/**
 * Extracts methods and fields from the enclosing class (for `this.` resolution).
 */
export function extractEnclosingClassMembers(
  model: monacoDefault.editor.ITextModel,
  targetLine: number,
): MethodItem[] {
  const lineCount = model.getLineCount();
  let classStartLine = -1;
  let braceDepth = 0;

  // Scan backwards to find the nearest enclosing class
  for (let ln = targetLine; ln >= 1; ln--) {
    const raw = model.getLineContent(ln);
    const clean = stripJSComment(raw).trim();
    if (/\bclass\s+([a-zA-Z_$][\w$]*)/.test(clean)) {
      classStartLine = ln;
      break;
    }
  }
  if (classStartLine === -1) return [];

  const members: MethodItem[] = [];
  const foundNames = new Set<string>();

  for (let ln = classStartLine; ln <= Math.min(lineCount, classStartLine + 150); ln++) {
    const raw = model.getLineContent(ln);
    const clean = stripJSComment(raw).trim();
    if (!clean) continue;

    // Track braces
    for (const c of clean) {
      if (c === "{") braceDepth++;
      else if (c === "}") braceDepth--;
    }
    if (braceDepth === 0 && ln > classStartLine) {
      break;
    }

    // Match class methods: methodName(a, b) { or async methodName(a, b) {
    const methodMatch = clean.match(/^(?:async\s+)?([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)\s*\{/);
    if (methodMatch) {
      const name = methodMatch[1];
      if (name !== "constructor" && !foundNames.has(name) && !CONTROL_FLOW_KEYWORDS.has(name)) {
        foundNames.add(name);
        members.push({
          label: name,
          kind: monacoDefault.languages.CompletionItemKind.Method,
          snippet: `${name}(${methodMatch[2].trim() ? "$1" : ""})`,
          detail: `(method) Solution.${name}(${methodMatch[2].trim()})`,
        });
      }
    }

    // Match field assignments in constructor: this.val = val;
    const fieldMatch = clean.match(/this\.([a-zA-Z_$][\w$]*)\s*=/);
    if (fieldMatch) {
      const name = fieldMatch[1];
      if (!foundNames.has(name)) {
        foundNames.add(name);
        members.push({
          label: name,
          kind: monacoDefault.languages.CompletionItemKind.Field,
          detail: `(property) Solution.${name}`,
        });
      }
    }
  }

  return members;
}

/**
 * Extracts the full expression before a trailing dot, handling balanced parens, brackets, and string literals.
 */
export function extractExpressionBeforeDot(textBefore: string): string {
  if (!textBefore.endsWith(".")) return "";
  const beforeDot = textBefore.slice(0, -1).trimEnd();
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inQuote: string | null = null;
  let startIdx = 0;

  for (let i = beforeDot.length - 1; i >= 0; i--) {
    const ch = beforeDot[i];
    if (inQuote) {
      if (ch === inQuote && (i === 0 || beforeDot[i - 1] !== "\\")) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inQuote = ch;
      continue;
    }

    if (ch === ")") depthParen++;
    else if (ch === "(") {
      if (depthParen > 0) depthParen--;
      else {
        startIdx = i + 1;
        break;
      }
    } else if (ch === "]") depthBracket++;
    else if (ch === "[") {
      if (depthBracket > 0) depthBracket--;
      else {
        startIdx = i + 1;
        break;
      }
    } else if (ch === "}") depthBrace++;
    else if (ch === "{") {
      if (depthBrace > 0) depthBrace--;
      else {
        startIdx = i + 1;
        break;
      }
    } else if (depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      if (/[\s;=+\-*/%&|^!~?:,]/.test(ch)) {
        startIdx = i + 1;
        break;
      }
    }
  }

  return beforeDot.slice(startIdx).trim();
}

/**
 * Infers variable type by scanning backwards from position.
 */
export function inferJSType(
  expr: string,
  model: monacoDefault.editor.ITextModel,
  position: monacoDefault.Position,
): string | null {
  expr = expr.trim();
  if (!expr) return null;

  // Direct constructor calls: new Map(), new Set()
  if (expr.startsWith("new Map")) return "Map";
  if (expr.startsWith("new Set")) return "Set";
  if (expr.startsWith("new Array") || expr.startsWith("[")) return "Array";

  // Subscript dereferencing: matrix[0][0] or words[i]
  const subscript = parseSubscriptExpression(expr);
  if (subscript) {
    const { baseVar, dim } = subscript;
    for (let ln = position.lineNumber; ln >= 1; ln--) {
      const line = stripJSComment(model.getLineContent(ln)).trim();
      const match = line.match(new RegExp(`(?:const|let|var)\\s+${baseVar}\\s*=\\s*(.+)`));
      if (match) {
        const val = match[1].trim();
        if (dim === 1 && (val.includes('["') || val.includes("['") || val.includes("Array.from"))) {
          return "String";
        }
        if (dim >= 2) return null;
        return "Array";
      }
    }
    return null;
  }

  // Method chaining: s.trim().split(" ")
  if (expr.includes(".")) {
    const cleanExpr = expr.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "");
    if (/\.split\s*\(/.test(cleanExpr)) return "Array";
    if (/\.join\s*\(/.test(cleanExpr)) return "String";
    if (/\.trim(?:Start|End)?\s*\(/.test(cleanExpr)) return "String";
    if (/\.(?:toLowerCase|toUpperCase|substring)\s*\(/.test(cleanExpr)) return "String";
    if (/\.(?:slice|filter|map|concat)\s*\(/.test(cleanExpr)) {
      const dotIdx = expr.lastIndexOf(".");
      return inferJSType(expr.slice(0, dotIdx), model, position) ?? "Array";
    }
    if (/\.toString\s*\(/.test(cleanExpr)) return "String";
  }

  // Backwards variable declaration scan
  for (let ln = position.lineNumber; ln >= 1; ln--) {
    const line = stripJSComment(model.getLineContent(ln)).trim();
    if (!line) continue;

    // Match: const name = ... or let name = ...
    const declMatch = line.match(
      new RegExp(`(?:^|[^.\\w$])(?:const|let|var)\\s+${expr}\\s*=\\s*(.+)`),
    );
    if (declMatch) {
      const right = declMatch[1].trim();
      if (
        right.startsWith("[") ||
        right.includes(".split(") ||
        right.includes("Array.from") ||
        right.startsWith("new Array")
      ) {
        return "Array";
      }
      if (right.startsWith('"') || right.startsWith("'") || right.startsWith("`")) {
        return "String";
      }
      if (right.startsWith("new Map")) return "Map";
      if (right.startsWith("new Set")) return "Set";
      if (right.startsWith("new ListNode")) return "ListNode";
      if (right.startsWith("new TreeNode")) return "TreeNode";
      if (right.startsWith("new Date")) return "Date";
      if (/^\d+$/.test(right)) return "Number";
      break;
    }

    // Match JSDoc parameter annotations: * @param {string[]} words
    const jsDocParamMatch = line.match(new RegExp(`@param\\s*\\{([^}]+)\\}\\s*${expr}`));
    if (jsDocParamMatch) {
      const docType = jsDocParamMatch[1].trim().toLowerCase();
      if (docType.includes("string[]") || docType.includes("number[]") || docType.includes("array"))
        return "Array";
      if (docType === "string") return "String";
      if (docType === "number") return "Number";
      if (docType === "boolean") return "Boolean";
      if (docType === "listnode") return "ListNode";
      if (docType === "treenode") return "TreeNode";
      break;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Register JavaScript Completions, Hover, & Signature Help
// -----------------------------------------------------------------------------

export function registerJavaScriptCompletions(mInstance?: Monaco) {
  const monaco = mInstance ?? monacoDefault;

  // 1. Completion Item Provider
  monaco.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: [".", "(", "'", '"', "`", " "],

    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);

      // Check if cursor is inside comment or string
      if (isInsideCommentOrString(lineContent, position.column - 1)) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();

      const toItems = (
        list: MethodItem[],
        itemRange: monacoDefault.Range,
      ): monacoDefault.languages.CompletionItem[] =>
        list.map((item) => ({
          label: item.label,
          kind: item.kind ?? monaco.languages.CompletionItemKind.Method,
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.snippet ?? item.label,
          insertTextRules: item.snippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          range: itemRange,
        }));

      // --- Member Access Context (e.g. "Math.", "console.", "arr.") ---
      if (textBefore.endsWith(".")) {
        // Numeric literal suppression (e.g. "5.")
        if (/\b\d+\.$/.test(textBefore)) {
          return { suggestions: [] };
        }

        const targetExpr = extractExpressionBeforeDot(textBefore);
        if (!targetExpr) return { suggestions: [] };

        // 1. Exact Built-in Globals
        if (targetExpr === "console") {
          return { suggestions: toItems(CONSOLE_MEMBERS, range) };
        }
        if (targetExpr === "Math") {
          return { suggestions: toItems(MATH_MEMBERS, range) };
        }
        if (targetExpr === "Array") {
          return { suggestions: toItems(ARRAY_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "String") {
          return { suggestions: toItems(STRING_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "Object") {
          return { suggestions: toItems(OBJECT_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "Number") {
          return { suggestions: toItems(NUMBER_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "JSON") {
          return { suggestions: toItems(JSON_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "Promise") {
          return { suggestions: toItems(PROMISE_STATIC_MEMBERS, range) };
        }
        if (targetExpr === "process") {
          return { suggestions: toItems(NODE_PROCESS_MEMBERS, range) };
        }
        if (targetExpr === "this") {
          const classMembers = extractEnclosingClassMembers(model, position.lineNumber);
          return { suggestions: toItems(classMembers, range) };
        }

        // 2. Inferred Variable / Expression Types
        const inferred = inferJSType(targetExpr, model, position);
        if (inferred === "Array") {
          return { suggestions: toItems(ARRAY_PROTOTYPE_MEMBERS, range) };
        }
        if (inferred === "String") {
          return { suggestions: toItems(STRING_PROTOTYPE_MEMBERS, range) };
        }
        if (inferred === "Map") {
          return { suggestions: toItems(MAP_PROTOTYPE_MEMBERS, range) };
        }
        if (inferred === "Set") {
          return { suggestions: toItems(SET_PROTOTYPE_MEMBERS, range) };
        }
        if (inferred === "ListNode") {
          return { suggestions: toItems(LIST_NODE_MEMBERS, range) };
        }
        if (inferred === "TreeNode") {
          return { suggestions: toItems(TREE_NODE_MEMBERS, range) };
        }

        // Fallback for general objects: common array/string/object methods
        return { suggestions: toItems([...ARRAY_PROTOTYPE_MEMBERS.slice(0, 15)], range) };
      }

      // --- Top-Level / Identifier Context ---
      const suggestions: monacoDefault.languages.CompletionItem[] = [];

      // 1. Built-in Globals & Functions
      suggestions.push(...toItems(JS_GLOBAL_ITEMS, range));

      // 2. Competitive Programming Snippets
      suggestions.push(...toItems(JS_SNIPPETS, range));

      // 3. Keywords
      for (const kw of JS_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      }

      // 4. In-Scope Document Symbols (Variables, Functions, Classes)
      const scopes = extractJSScopeStack(model, position.lineNumber);
      const seenNames = new Set<string>();

      for (const scope of scopes) {
        // Local/In-scope variables
        for (const [varName, info] of scope.variables.entries()) {
          if (!seenNames.has(varName)) {
            seenNames.add(varName);
            suggestions.push({
              label: varName,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: info.type ? `(variable) ${varName}: ${info.type}` : `(variable) ${varName}`,
              insertText: varName,
              range,
            });
          }
        }
        // Functions
        for (const [fnName, info] of scope.functions.entries()) {
          if (!seenNames.has(fnName)) {
            seenNames.add(fnName);
            suggestions.push({
              label: fnName,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: `function ${fnName}(${info.params.join(", ")})`,
              insertText: `${fnName}(${info.params.length > 0 ? "$1" : ""})`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            });
          }
        }
      }

      return { suggestions };
    },
  });

  // 2. Hover Provider
  monaco.languages.registerHoverProvider("javascript", {
    provideHover(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      if (isInsideCommentOrString(lineContent, position.column - 1)) return null;

      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const name = word.word;
      const textBefore = lineContent.slice(0, word.startColumn - 1).trimEnd();

      // Qualified hover: Math.max or console.log or arr.push
      if (textBefore.endsWith(".")) {
        const qualifierMatch = textBefore.match(/([a-zA-Z_$][\w$]*)\.$/);
        const qualifier = qualifierMatch ? qualifierMatch[1] : "";

        if (qualifier === "Math") {
          const item = MATH_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              contents: [
                { value: `\`\`\`javascript\n${item.detail ?? item.label}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }
        if (qualifier === "console") {
          const item = CONSOLE_MEMBERS.find((m) => m.label === name);
          if (item) {
            return {
              contents: [
                { value: `\`\`\`javascript\n${item.detail ?? item.label}\n\`\`\`` },
                { value: item.documentation ?? "" },
              ],
            };
          }
        }
        // Array or String prototype methods
        const arrItem = ARRAY_PROTOTYPE_MEMBERS.find((m) => m.label === name);
        if (arrItem) {
          return {
            contents: [
              { value: `\`\`\`javascript\n${arrItem.detail ?? arrItem.label}\n\`\`\`` },
              { value: arrItem.documentation ?? "" },
            ],
          };
        }
        const strItem = STRING_PROTOTYPE_MEMBERS.find((m) => m.label === name);
        if (strItem) {
          return {
            contents: [
              { value: `\`\`\`javascript\n${strItem.detail ?? strItem.label}\n\`\`\`` },
              { value: strItem.documentation ?? "" },
            ],
          };
        }
      }

      // Built-in globals hover
      const globalItem = JS_GLOBAL_ITEMS.find((g) => g.label === name);
      if (globalItem) {
        return {
          contents: [
            { value: `\`\`\`javascript\n${globalItem.detail ?? globalItem.label}\n\`\`\`` },
            { value: globalItem.documentation ?? "" },
          ],
        };
      }

      // Keyword hover
      if (JS_KEYWORDS.includes(name)) {
        return {
          contents: [
            { value: `\`\`\`javascript\nkeyword ${name}\n\`\`\`` },
            { value: `JavaScript language keyword \`${name}\`.` },
          ],
        };
      }

      return null;
    },
  });

  // 3. Signature Help Provider
  monaco.languages.registerSignatureHelpProvider("javascript", {
    signatureHelpTriggerCharacters: ["(", ","],

    provideSignatureHelp(model, position) {
      const startLine = Math.max(1, position.lineNumber - 50);
      const lines: string[] = [];
      for (let ln = startLine; ln <= position.lineNumber; ln++) {
        lines.push(model.getLineContent(ln));
      }

      // Truncate the current line at cursor position
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, position.column - 1);
      const textToCursor = lines.join("\n");
      const cleaned = maskCommentsAndStrings(textToCursor);

      // Track call parens and argument delimiters
      interface CallState {
        openIdx: number;
        argCount: number;
      }
      const callStack: CallState[] = [];
      let bracketDepth = 0;
      let braceDepth = 0;

      for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (ch === "(") {
          callStack.push({ openIdx: i, argCount: 0 });
        } else if (ch === ")") {
          callStack.pop();
        } else if (ch === "[") {
          bracketDepth++;
        } else if (ch === "]") {
          if (bracketDepth > 0) bracketDepth--;
        } else if (ch === "{") {
          braceDepth++;
        } else if (ch === "}") {
          if (braceDepth > 0) braceDepth--;
        } else if (ch === ",") {
          if (callStack.length > 0 && bracketDepth === 0 && braceDepth === 0) {
            callStack[callStack.length - 1].argCount++;
          }
        }
      }

      if (callStack.length === 0) return null;

      const activeCall = callStack[callStack.length - 1];
      const callPrefix = cleaned.slice(0, activeCall.openIdx).trimEnd();

      // Check if preceded by a control-flow keyword (e.g. if (, while (, for ()
      const wordMatch = callPrefix.match(/\b([a-zA-Z_$][\w$]*)$/);
      if (wordMatch && CONTROL_FLOW_KEYWORDS.has(wordMatch[1])) {
        return null;
      }

      const targetMatch = callPrefix.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)$/);
      if (!targetMatch) return null;

      const callTarget = targetMatch[1];
      const simpleName = callTarget.includes(".") ? callTarget.split(".").pop()! : callTarget;

      const signaturesMap: Record<string, SigDef> = {
        "Math.max": {
          label: "Math.max(...values: number[]): number",
          doc: "Returns the largest of zero or more numbers.",
          params: [{ label: "...values", doc: "Numbers to compare." }],
        },
        "Math.min": {
          label: "Math.min(...values: number[]): number",
          doc: "Returns the smallest of zero or more numbers.",
          params: [{ label: "...values", doc: "Numbers to compare." }],
        },
        "Math.pow": {
          label: "Math.pow(base: number, exponent: number): number",
          doc: "Returns the value of a base expression taken to a specified power.",
          params: [
            { label: "base", doc: "The base value of the expression." },
            { label: "exponent", doc: "The exponent value of the expression." },
          ],
        },
        "Math.abs": {
          label: "Math.abs(x: number): number",
          doc: "Returns the absolute value of a number.",
          params: [{ label: "x", doc: "A numeric expression." }],
        },
        "Math.round": {
          label: "Math.round(x: number): number",
          doc: "Returns a supplied numeric expression rounded to the nearest integer.",
          params: [{ label: "x", doc: "A numeric expression." }],
        },
        "Math.floor": {
          label: "Math.floor(x: number): number",
          doc: "Returns the greatest integer less than or equal to its numeric argument.",
          params: [{ label: "x", doc: "A numeric expression." }],
        },
        "Math.ceil": {
          label: "Math.ceil(x: number): number",
          doc: "Returns the smallest integer greater than or equal to its numeric argument.",
          params: [{ label: "x", doc: "A numeric expression." }],
        },
        "Math.sqrt": {
          label: "Math.sqrt(x: number): number",
          doc: "Returns the square root of a number.",
          params: [{ label: "x", doc: "A numeric expression." }],
        },
        "console.log": {
          label: "console.log(...data: any[]): void",
          doc: "Prints to stdout with newline.",
          params: [{ label: "...data", doc: "Objects to log." }],
        },
        parseInt: {
          label: "parseInt(string: string, radix?: number): number",
          doc: "Converts a string to an integer.",
          params: [
            { label: "string", doc: "A string to convert into a number." },
            { label: "radix=10", doc: "An integer between 2 and 36 that represents the radix." },
          ],
        },
        parseFloat: {
          label: "parseFloat(string: string): number",
          doc: "Converts a string to a floating-point number.",
          params: [{ label: "string", doc: "A string that contains a floating-point number." }],
        },
        push: {
          label: "push(...items: T[]): number",
          doc: "Appends new elements to the end of an array.",
          params: [{ label: "...items", doc: "New elements to append to the array." }],
        },
        slice: {
          label: "slice(start?: number, end?: number): T[]",
          doc: "Returns a copy of a section of an array or string.",
          params: [
            { label: "start", doc: "The beginning index of the specified portion." },
            { label: "end", doc: "The end index of the specified portion." },
          ],
        },
        splice: {
          label: "splice(start: number, deleteCount?: number, ...items: T[]): T[]",
          doc: "Removes elements from an array and inserts new items in their place.",
          params: [
            {
              label: "start",
              doc: "The zero-based location in the array from which to start removing elements.",
            },
            { label: "deleteCount", doc: "The number of elements to remove." },
            {
              label: "...items",
              doc: "Elements to insert into the array in place of the deleted elements.",
            },
          ],
        },
        split: {
          label: "split(separator: string | RegExp, limit?: number): string[]",
          doc: "Split a string into substrings using the specified separator.",
          params: [
            { label: "separator", doc: "Separator to split the string by." },
            { label: "limit", doc: "Value to limit the number of elements returned in the array." },
          ],
        },
        join: {
          label: "join(separator?: string): string",
          doc: "Adds all the elements of an array into a string, separated by the specified separator string.",
          params: [
            {
              label: "separator",
              doc: "A string used to separate one element of the array from the next.",
            },
          ],
        },
        indexOf: {
          label: "indexOf(searchElement: T, fromIndex?: number): number",
          doc: "Returns the index of the first occurrence of a value in an array or string.",
          params: [
            { label: "searchElement", doc: "The value to locate." },
            { label: "fromIndex", doc: "The array index at which to begin the search." },
          ],
        },
        includes: {
          label: "includes(valueToFind: T, fromIndex?: number): boolean",
          doc: "Determines whether an array or string includes a certain value.",
          params: [
            { label: "valueToFind", doc: "The value to search for." },
            { label: "fromIndex", doc: "The position in this array at which to begin searching." },
          ],
        },
      };

      const sigInfo =
        signaturesMap[callTarget] ||
        signaturesMap[callTarget.split(".").slice(-2).join(".")] ||
        signaturesMap[simpleName];

      if (!sigInfo) return null;

      let activeParam = activeCall.argCount;
      const hasVarargs = sigInfo.params.some((p) => p.label.startsWith("..."));
      if (!hasVarargs && sigInfo.params.length > 0) {
        activeParam = Math.min(activeParam, sigInfo.params.length - 1);
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
          activeParameter: activeParam,
        },
        dispose: () => {},
      };
    },
  });
}
