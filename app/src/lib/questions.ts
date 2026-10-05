/** A practice question. Programs read the input from stdin and print the answer. */
export type Question = {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** What it practises, e.g. "Strings". */
  topic: string;
  /** Markdown: the problem, with its input, output and an example. */
  description: string;
  /** Markdown: how to solve it. */
  explanation: string;
};

// Samples to build the Questions screen with, until questions come from Supabase.
export const QUESTIONS: Question[] = [
  {
    slug: "sum-of-two-numbers",
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    topic: "Basics",
    description: `Read two integers and print their sum.

**Input:** two integers \`a\` and \`b\`, separated by a space.

**Output:** \`a + b\`.

| Input | Output |
| --- | --- |
| \`3 5\` | \`8\` |`,
    explanation: `Split the line into two parts, convert each to an integer, and print the sum.

Converting matters: without it, \`"3" + "5"\` joins the text into \`"35"\` in many languages.`,
  },
  {
    slug: "even-or-odd",
    title: "Even or Odd",
    difficulty: "Easy",
    topic: "Basics",
    description: `Read an integer and print \`Even\` if it's even, otherwise \`Odd\`.

| Input | Output |
| --- | --- |
| \`4\` | \`Even\` |
| \`7\` | \`Odd\` |`,
    explanation: `A number is even when dividing it by 2 leaves no remainder. Check \`n % 2 == 0\`.

This works for negative numbers too, as long as you compare the remainder with 0.`,
  },
  {
    slug: "reverse-a-string",
    title: "Reverse a String",
    difficulty: "Easy",
    topic: "Strings",
    description: `Read a word and print it reversed.

| Input | Output |
| --- | --- |
| \`hello\` | \`olleh\` |`,
    explanation: `Walk from the last character to the first and build a new string.

Most languages have a shortcut too, like slicing with \`s[::-1]\` in Python, but try the loop first.`,
  },
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
];
