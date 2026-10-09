import { VALUE_TYPES, type Param, type Signature, type ValueType } from "@/lib/drivers";

/**
 * A practice question, LeetCode style: the student writes one method, which
 * is called with each example's values and must return its output.
 */
export type Question = {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** What it practises, e.g. "Strings". */
  topic: string;
  /** Markdown: the problem and its examples. */
  description: string;
  /** Markdown: how to solve it. */
  explanation: string;
  /** The method to write, or null for a question not ready to solve yet. */
  signature: Signature | null;
  /** The examples in the description, which Run and Submit check the code against. */
  examples: Example[];
};

/** An example: the method's arguments and what it should return. */
export type Example = {
  /** As written, e.g. `a = 3, b = 5`. */
  inputText: string;
  /** One per parameter, in order. */
  values: unknown[];
  /** What the method should return, e.g. 8. */
  expected: unknown;
};

/**
 * Splits `a = 3, s = "x, y", nums = [1,2]` at the commas between arguments,
 * not those inside strings or arrays.
 */
function splitArguments(text: string) {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "[") depth++;
    else if (ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim());
}

/** Whether a value (parsed as JSON) is of a question's type. */
function isType(value: unknown, type: ValueType): boolean {
  switch (type) {
    case "int":
    case "long":
      return Number.isInteger(value);
    case "bool":
      return typeof value === "boolean";
    case "string":
      // A string reaches the driver as one line.
      return typeof value === "string" && !/[\r\n]/.test(value);
    case "int[]":
      return Array.isArray(value) && value.every((v) => isType(v, "int"));
    case "string[]":
      return Array.isArray(value) && value.every((v) => isType(v, "string"));
  }
}

/** A JSON value of `type`, or an error naming where it came from. */
function parseValue(text: string, type: ValueType, where: string) {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`${where}: ${text} isn't a valid value`);
  }
  if (!isType(value, type)) throw new Error(`${where}: ${text} isn't a ${type}`);
  return value;
}

/**
 * The examples in a question's markdown: each ```text block with an `Input:`
 * line naming every argument and an `Output:` line, values written as JSON:
 *
 *     Input:  s = "hello", nums = [1,2,3]
 *     Output: true
 */
export function parseExamples(markdown: string, signature: Signature, slug: string): Example[] {
  return [...markdown.matchAll(/^```text\n([\s\S]*?)\n```$/gm)].flatMap(([, block], i) => {
    const where = `${slug}, example ${i + 1}`;
    const input = /^Input:(.*)$/m.exec(block)?.[1].trim();
    const output = /^Output:(.*)$/m.exec(block)?.[1].trim();
    if (input === undefined || output === undefined) return [];
    const args = new Map(
      splitArguments(input).map((arg) => {
        const eq = arg.indexOf("=");
        return [arg.slice(0, eq).trim(), arg.slice(eq + 1).trim()];
      }),
    );
    const values = signature.params.map(({ name, type }) => {
      const text = args.get(name);
      if (text === undefined) throw new Error(`${where}: the input has no ${name}`);
      return parseValue(text, type, where);
    });
    return [{ inputText: input, values, expected: parseValue(output, signature.returns, where) }];
  });
}

/** The question files, by path: `NNN-slug.md`, where NNN is its place in the list. */
const FILES = import.meta.glob<string>("../questions/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseType(text: string, where: string): ValueType {
  if (!VALUE_TYPES.includes(text as ValueType)) {
    throw new Error(`${where}: ${text} isn't a type (use ${VALUE_TYPES.join(", ")})`);
  }
  return text as ValueType;
}

/**
 * Reads a question file: a `---` header, then the question, then the
 * explanation under `## Explanation`. The header has `title`, `difficulty`
 * and `topic`, and the method to write:
 *
 *     method: sum
 *     params: a int, b int
 *     returns: int
 */
export function parseQuestion(slug: string, text: string): Question {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, "\n"));
  if (!match) throw new Error(`${slug}: missing the --- header`);
  const header: Record<string, string | undefined> = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }),
  );
  const [description, explanation = ""] = match[2].split(/^## Explanation$/m);
  if (!["Easy", "Medium", "Hard"].includes(header.difficulty ?? "")) {
    throw new Error(`${slug}: difficulty must be Easy, Medium or Hard`);
  }
  if (!header.method || !header.returns) throw new Error(`${slug}: missing method or returns`);
  if (!/^[a-z][A-Za-z0-9]*$/.test(header.method)) {
    throw new Error(`${slug}: method must be camelCase, e.g. reverseString`);
  }
  const params: Param[] = (header.params ?? "")
    .split(",")
    .filter((param) => param.trim())
    .map((param) => {
      const [name, type, extra] = param.trim().split(/\s+/);
      if (!/^[a-z][A-Za-z0-9]*$/.test(name) || extra !== undefined) {
        throw new Error(`${slug}: write each param as "name type", e.g. "nums int[]"`);
      }
      return { name, type: parseType(type, slug) };
    });
  const signature: Signature = {
    method: header.method,
    params,
    returns: parseType(header.returns, slug),
  };
  return {
    slug,
    title: header.title ?? slug,
    difficulty: header.difficulty as Question["difficulty"],
    topic: header.topic ?? "",
    description: description.trim(),
    explanation: explanation.trim(),
    signature,
    examples: parseExamples(description, signature, slug),
  };
}

const FROM_FILES = Object.entries(FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, text]) => parseQuestion(path.replace(/^.*\/\d+-|\.md$/g, ""), text));

// Samples still to move into question files. They have no method yet, so
// they can't be solved.
const SAMPLES: Omit<Question, "signature" | "examples">[] = [
  {
    slug: "palindrome-check",
    title: "Palindrome Check",
    difficulty: "Easy",
    topic: "Strings",
    description: `A palindrome reads the same backwards. Read a word and print \`Yes\` if it's a palindrome, otherwise \`No\`.

| Input | Output |
| --- | --- |
| \`madam\` | \`Yes\` |
| \`hello\` | \`No\` |`,
    explanation: `Compare the first character with the last, the second with the second last, and so on, moving inwards. Stop at the first mismatch.

You only need to check up to the middle.`,
  },
  {
    slug: "factorial",
    title: "Factorial",
    difficulty: "Easy",
    topic: "Loops",
    description: `Read \`n\` and print \`n!\`, the product \`1 × 2 × … × n\`. \`0!\` is 1.

| Input | Output |
| --- | --- |
| \`5\` | \`120\` |`,
    explanation: `Start with \`result = 1\` and multiply it by every number from 1 to \`n\`.

Starting at 1, not 0, is what makes \`0!\` come out as 1.`,
  },
  {
    slug: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "Easy",
    topic: "Loops",
    description: `Read \`n\` and print the numbers 1 to \`n\`, one per line. For multiples of 3 print \`Fizz\`, for multiples of 5 print \`Buzz\`, and for multiples of both print \`FizzBuzz\`.

| Input | Output |
| --- | --- |
| \`5\` | \`1\` \`2\` \`Fizz\` \`4\` \`Buzz\` (one per line) |`,
    explanation: `Loop from 1 to \`n\`. Check divisibility by 15 first: a multiple of 15 is also a multiple of 3 and 5, so checking 3 first would print \`Fizz\` instead of \`FizzBuzz\`.`,
  },
  {
    slug: "largest-in-array",
    title: "Largest Element in an Array",
    difficulty: "Easy",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers on the next line. Print the largest.

| Input | Output |
| --- | --- |
| \`5\`<br>\`3 9 2 7 4\` | \`9\` |`,
    explanation: `Keep the largest seen so far, starting with the first element. Compare it with each of the rest and replace it when you find a bigger one.

Starting with 0 instead would fail when every number is negative.`,
  },
  {
    slug: "prime-numbers-up-to-n",
    title: "Prime Numbers up to N",
    difficulty: "Medium",
    topic: "Math",
    description: `Read \`n\` and print every prime number from 2 to \`n\`, separated by spaces.

| Input | Output |
| --- | --- |
| \`20\` | \`2 3 5 7 11 13 17 19\` |`,
    explanation: `A number is prime if nothing from 2 up to its square root divides it. Checking only up to the square root is enough: if \`a × b = n\`, one of them is at most \`√n\`.

For large \`n\`, the Sieve of Eratosthenes is faster: cross out the multiples of each prime, and what's left is prime.`,
  },
  {
    slug: "count-vowels",
    title: "Count Vowels",
    difficulty: "Easy",
    topic: "Strings",
    description: `Read a line of text and print how many vowels (a, e, i, o, u, in either case) it has.

| Input | Output |
| --- | --- |
| \`Hello World\` | \`3\` |`,
    explanation: `Go through each character, convert it to lowercase, and count it if it's one of \`aeiou\`.`,
  },
  {
    slug: "second-largest",
    title: "Second Largest Element",
    difficulty: "Medium",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers. Print the second largest distinct value, or \`-1\` if there isn't one.

| Input | Output |
| --- | --- |
| \`5\`<br>\`3 9 2 9 4\` | \`4\` |
| \`3\`<br>\`5 5 5\` | \`-1\` |`,
    explanation: `Track two values in one pass: the largest and the second largest. When a number beats the largest, the old largest becomes second. When it's between them, and not equal to the largest, it becomes second.

Sorting works too, but one pass is faster and handles duplicates more clearly.`,
  },
  {
    slug: "anagram-check",
    title: "Anagram Check",
    difficulty: "Medium",
    topic: "Strings",
    description: `Two words are anagrams if they use the same letters the same number of times. Read two words and print \`Yes\` or \`No\`.

| Input | Output |
| --- | --- |
| \`listen silent\` | \`Yes\` |
| \`hello world\` | \`No\` |`,
    explanation: `Count how many times each letter appears in both words and compare the counts.

Sorting both words and comparing them also works, but counting is faster.`,
  },
  {
    slug: "longest-increasing-subarray",
    title: "Longest Increasing Subarray",
    difficulty: "Hard",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers. Print the length of the longest run of consecutive elements where each is bigger than the one before.

| Input | Output |
| --- | --- |
| \`7\`<br>\`1 3 5 4 6 8 9\` | \`4\` |`,
    explanation: `Keep the length of the current run and the best so far. If an element is bigger than the previous one, extend the run; otherwise start a new run of length 1. Update the best after each step.

One pass, no extra memory.`,
  },
  {
    slug: "leap-year",
    title: "Leap Year",
    difficulty: "Easy",
    topic: "Basics",
    description: `Read a year and print \`Yes\` if it's a leap year, otherwise \`No\`.

A year is a leap year if it's divisible by 4, except years divisible by 100, which must also be divisible by 400.

| Input | Output |
| --- | --- |
| \`2024\` | \`Yes\` |
| \`1900\` | \`No\` |
| \`2000\` | \`Yes\` |`,
    explanation: `Check the rules from the most specific: divisible by 400 is a leap year, otherwise divisible by 100 is not, otherwise divisible by 4 is.

In one condition: \`(y % 4 == 0 && y % 100 != 0) || y % 400 == 0\`.`,
  },
  {
    slug: "sum-of-digits",
    title: "Sum of Digits",
    difficulty: "Easy",
    topic: "Math",
    description: `Read a positive integer and print the sum of its digits.

| Input | Output |
| --- | --- |
| \`1234\` | \`10\` |`,
    explanation: `\`n % 10\` gives the last digit and \`n / 10\` (integer division) removes it. Add the last digit to a total and remove it, until \`n\` is 0.`,
  },
  {
    slug: "reverse-a-number",
    title: "Reverse a Number",
    difficulty: "Easy",
    topic: "Math",
    description: `Read a positive integer and print its digits in reverse order, as a number.

| Input | Output |
| --- | --- |
| \`1234\` | \`4321\` |
| \`1200\` | \`21\` |`,
    explanation: `Start with \`rev = 0\`. Take the last digit with \`n % 10\`, append it with \`rev = rev * 10 + digit\`, and remove it with \`n / 10\`. Repeat until \`n\` is 0.

Building a number, not a string, is what drops the leading zeros of \`0021\`.`,
  },
  {
    slug: "armstrong-number",
    title: "Armstrong Number",
    difficulty: "Easy",
    topic: "Math",
    description: `An Armstrong number equals the sum of its digits, each raised to the power of the number of digits. Read a number and print \`Yes\` if it's an Armstrong number, otherwise \`No\`.

| Input | Output |
| --- | --- |
| \`153\` | \`Yes\` |
| \`123\` | \`No\` |

\`153\` has 3 digits, and \`1³ + 5³ + 3³ = 153\`.`,
    explanation: `First count the digits. Then go through them again, adding each digit raised to that count, and compare the total with the original number.

Keep a copy of the number: taking digits off with \`n / 10\` changes it.`,
  },
  {
    slug: "gcd-of-two-numbers",
    title: "GCD of Two Numbers",
    difficulty: "Easy",
    topic: "Math",
    description: `Read two positive integers and print their greatest common divisor: the largest number that divides both.

| Input | Output |
| --- | --- |
| \`12 18\` | \`6\` |`,
    explanation: `Use Euclid's algorithm: the GCD of \`a\` and \`b\` is the GCD of \`b\` and \`a % b\`. Repeat until \`b\` is 0; then \`a\` is the answer.

For \`12 18\`: (12, 18) → (18, 12) → (12, 6) → (6, 0), so 6.`,
  },
  {
    slug: "lcm-of-two-numbers",
    title: "LCM of Two Numbers",
    difficulty: "Easy",
    topic: "Math",
    description: `Read two positive integers and print their least common multiple: the smallest number both divide.

| Input | Output |
| --- | --- |
| \`4 6\` | \`12\` |`,
    explanation: `\`LCM(a, b) = a × b / GCD(a, b)\`. Find the GCD with Euclid's algorithm first.

Divide before multiplying, \`a / gcd * b\`, so the product doesn't overflow for large numbers.`,
  },
  {
    slug: "fibonacci-series",
    title: "Fibonacci Series",
    difficulty: "Easy",
    topic: "Loops",
    description: `Read \`n\` and print the first \`n\` Fibonacci numbers, separated by spaces. The series starts with 0 and 1, and each next number is the sum of the two before it.

| Input | Output |
| --- | --- |
| \`7\` | \`0 1 1 2 3 5 8\` |`,
    explanation: `Keep the last two numbers, \`a = 0\` and \`b = 1\`. Each step, print \`a\`, then move forward: \`a, b = b, a + b\`.

A loop is much faster than recursion here, which recalculates the same numbers again and again.`,
  },
  {
    slug: "multiplication-table",
    title: "Multiplication Table",
    difficulty: "Easy",
    topic: "Loops",
    description: `Read \`n\` and print its multiplication table from 1 to 10, one line each, in the form \`n x i = result\`.

**Input:**

\`\`\`
3
\`\`\`

**Output:**

\`\`\`
3 x 1 = 3
3 x 2 = 6
...
3 x 10 = 30
\`\`\``,
    explanation: `Loop \`i\` from 1 to 10 and print \`n\`, \`i\` and \`n * i\` in the right format.

Watch the spaces: the output must match exactly.`,
  },
  {
    slug: "right-triangle-pattern",
    title: "Right Triangle Pattern",
    difficulty: "Easy",
    topic: "Patterns",
    description: `Read \`n\` and print a right triangle of \`*\` with \`n\` rows. Row \`i\` has \`i\` stars.

**Input:**

\`\`\`
4
\`\`\`

**Output:**

\`\`\`
*
**
***
****
\`\`\``,
    explanation: `Use two loops: the outer one for rows 1 to \`n\`, and the inner one printing \`i\` stars on row \`i\`. Print a new line after each row.`,
  },
  {
    slug: "pyramid-pattern",
    title: "Pyramid Pattern",
    difficulty: "Medium",
    topic: "Patterns",
    description: `Read \`n\` and print a centred pyramid of \`*\` with \`n\` rows.

**Input:**

\`\`\`
3
\`\`\`

**Output:**

\`\`\`
  *
 ***
*****
\`\`\``,
    explanation: `Row \`i\` (from 1) has \`n - i\` spaces, then \`2 × i - 1\` stars.

Work out these two counts for each row first; the loops follow from them. Don't print spaces after the stars.`,
  },
  {
    slug: "sum-of-array",
    title: "Sum of Array Elements",
    difficulty: "Easy",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers on the next line. Print their sum.

| Input | Output |
| --- | --- |
| \`5\`<br>\`1 2 3 4 5\` | \`15\` |`,
    explanation: `Start a total at 0 and add each element to it.

For very large inputs, use a 64-bit type (\`long\` in Java and C#, \`long long\` in C and C++) so the total doesn't overflow.`,
  },
  {
    slug: "reverse-an-array",
    title: "Reverse an Array",
    difficulty: "Easy",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers. Print them in reverse order, separated by spaces.

| Input | Output |
| --- | --- |
| \`5\`<br>\`1 2 3 4 5\` | \`5 4 3 2 1\` |`,
    explanation: `Printing from the last index to the first is enough here.

To reverse the array itself, swap the first and last elements, then the second and second last, moving inwards until the two ends meet.`,
  },
  {
    slug: "remove-duplicates",
    title: "Remove Duplicates from an Array",
    difficulty: "Medium",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers. Print each value once, in the order it first appears.

| Input | Output |
| --- | --- |
| \`7\`<br>\`1 2 2 3 1 4 3\` | \`1 2 3 4\` |`,
    explanation: `Keep a set of values already printed. For each element, print it and add it to the set only if it isn't there yet.

Checking a set is fast; searching back through the array for every element is much slower for big inputs.`,
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    difficulty: "Medium",
    topic: "Arrays",
    description: `Read \`n\`, then \`n - 1\` distinct integers from 1 to \`n\`. One number is missing; print it.

| Input | Output |
| --- | --- |
| \`5\`<br>\`1 2 4 5\` | \`3\` |`,
    explanation: `The numbers 1 to \`n\` add up to \`n × (n + 1) / 2\`. Subtract the sum of the given numbers from that, and what's left is the missing one.

No sorting and no extra memory.`,
  },
  {
    slug: "rotate-array",
    title: "Rotate an Array",
    difficulty: "Medium",
    topic: "Arrays",
    description: `Read \`n\` and \`k\`, then \`n\` integers. Rotate the array to the right by \`k\` places and print it.

| Input | Output |
| --- | --- |
| \`5 2\`<br>\`1 2 3 4 5\` | \`4 5 1 2 3\` |`,
    explanation: `Rotating by \`n\` gives back the same array, so use \`k % n\` first; \`k\` can be bigger than \`n\`.

The element at index \`i\` moves to \`(i + k) % n\`. Or, in place: reverse the whole array, then reverse the first \`k\` elements and the rest separately.`,
  },
  {
    slug: "count-words",
    title: "Count Words in a Sentence",
    difficulty: "Easy",
    topic: "Strings",
    description: `Read a line of text and print how many words it has. Words are separated by one or more spaces.

| Input | Output |
| --- | --- |
| \`I love coding\` | \`3\` |`,
    explanation: `Count the places where a word starts: a character that isn't a space, coming after a space or at the start of the line.

Counting spaces and adding 1 breaks when there are extra spaces between words or at the ends.`,
  },
  {
    slug: "first-non-repeating-character",
    title: "First Non-Repeating Character",
    difficulty: "Medium",
    topic: "Strings",
    description: `Read a word and print its first character that appears only once, or \`-1\` if every character repeats.

| Input | Output |
| --- | --- |
| \`swiss\` | \`w\` |
| \`aabb\` | \`-1\` |`,
    explanation: `Go through the word twice. First count how often each character appears. Then go through it again in order and print the first one with a count of 1.`,
  },
  {
    slug: "toggle-case",
    title: "Toggle Case",
    difficulty: "Easy",
    topic: "Strings",
    description: `Read a line of text and print it with every uppercase letter made lowercase and every lowercase letter made uppercase. Leave other characters as they are.

| Input | Output |
| --- | --- |
| \`Hello World\` | \`hELLO wORLD\` |`,
    explanation: `Check each character: if it's uppercase, convert it to lowercase, and the other way round. Spaces, digits and punctuation pass through unchanged.`,
  },
  {
    slug: "binary-to-decimal",
    title: "Binary to Decimal",
    difficulty: "Easy",
    topic: "Math",
    description: `Read a binary number (only 0s and 1s) and print its decimal value.

| Input | Output |
| --- | --- |
| \`1011\` | \`11\` |`,
    explanation: `Read the digits from left to right, starting with \`value = 0\`. For each digit, \`value = value * 2 + digit\`.

For \`1011\`: 0 → 1 → 2 → 5 → 11.`,
  },
  {
    slug: "decimal-to-binary",
    title: "Decimal to Binary",
    difficulty: "Easy",
    topic: "Math",
    description: `Read a non-negative integer and print it in binary.

| Input | Output |
| --- | --- |
| \`10\` | \`1010\` |
| \`0\` | \`0\` |`,
    explanation: `Divide by 2 repeatedly, keeping each remainder. The remainders, read from last to first, are the binary digits.

Handle 0 on its own: the loop never runs for it, and it should print \`0\`.`,
  },
  {
    slug: "pair-with-given-sum",
    title: "Pair with Given Sum",
    difficulty: "Medium",
    topic: "Arrays",
    description: `Read \`n\` and a target, then \`n\` integers. Print \`Yes\` if two different elements add up to the target, otherwise \`No\`.

| Input | Output |
| --- | --- |
| \`5 9\`<br>\`2 7 11 15 1\` | \`Yes\` |
| \`3 10\`<br>\`1 2 3\` | \`No\` |`,
    explanation: `Checking every pair works but is slow for big arrays. Instead, keep a set of the numbers seen so far. For each number \`x\`, if \`target - x\` is in the set, there's a pair; otherwise add \`x\` and move on.

One pass instead of one per element.`,
  },
  {
    slug: "transpose-of-matrix",
    title: "Transpose of a Matrix",
    difficulty: "Medium",
    topic: "Matrices",
    description: `Read the number of rows \`r\` and columns \`c\`, then \`r\` lines of \`c\` integers. Print the transpose: rows become columns.

| Input | Output |
| --- | --- |
| \`2 3\`<br>\`1 2 3\`<br>\`4 5 6\` | \`1 4\`<br>\`2 5\`<br>\`3 6\` |`,
    explanation: `The transpose has \`c\` rows and \`r\` columns, and the element at row \`i\`, column \`j\` is the original's row \`j\`, column \`i\`.

So loop over the original's columns on the outside and its rows on the inside.`,
  },
  {
    slug: "balanced-parentheses",
    title: "Balanced Parentheses",
    difficulty: "Medium",
    topic: "Stacks",
    description: `Read a string of brackets \`()\`, \`[]\` and \`{}\`. Print \`Yes\` if every bracket is closed by the right kind, in the right order, otherwise \`No\`.

| Input | Output |
| --- | --- |
| \`{[()]}\` | \`Yes\` |
| \`([)]\` | \`No\` |`,
    explanation: `Use a stack. Push each opening bracket. For a closing bracket, the top of the stack must be its matching opener: pop it, or the answer is \`No\` if it doesn't match or the stack is empty.

At the end, the stack must be empty too, or some bracket was never closed.`,
  },
  {
    slug: "maximum-subarray-sum",
    title: "Maximum Subarray Sum",
    difficulty: "Hard",
    topic: "Arrays",
    description: `Read \`n\`, then \`n\` integers. Print the largest sum of any run of consecutive elements (at least one).

| Input | Output |
| --- | --- |
| \`9\`<br>\`-2 1 -3 4 -1 2 1 -5 4\` | \`6\` |

The run \`4 -1 2 1\` adds up to 6.`,
    explanation: `This is Kadane's algorithm. Go through the array keeping the best sum of a run ending at the current element: either extend the previous run or start fresh, \`current = max(x, current + x)\`. Keep the largest \`current\` seen.

Start both with the first element, not 0, so an array of only negative numbers gives its largest element.`,
  },
  {
    slug: "longest-substring-without-repeats",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Hard",
    topic: "Strings",
    description: `Read a word and print the length of its longest run of consecutive characters with no character repeated.

| Input | Output |
| --- | --- |
| \`abcabcbb\` | \`3\` |
| \`bbbbb\` | \`1\` |`,
    explanation: `Use a sliding window: two positions, \`start\` and the current character. Remember the last index of each character. When the current character was already seen inside the window, move \`start\` just past that earlier index.

The window's length after each step is a candidate for the answer. One pass over the word.`,
  },
];

export const QUESTIONS: Question[] = [
  ...FROM_FILES,
  ...SAMPLES.map((question) => ({ ...question, signature: null, examples: [] })),
];
