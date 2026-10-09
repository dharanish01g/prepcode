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
  /** The Practice category it belongs to, by slug, e.g. "basics" (Programming Basics). */
  category: string | null;
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
 * explanation under `## Explanation`. The header has `title`, `difficulty`,
 * `topic`, `category` (a Practice category's slug, optional), and the method
 * to write:
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
    category: header.category || null,
    description: description.trim(),
    explanation: explanation.trim(),
    signature,
    examples: parseExamples(description, signature, slug),
  };
}

const FROM_FILES = Object.entries(FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, text]) => parseQuestion(path.replace(/^.*\/\d+-|\.md$/g, ""), text));

/** Every question, in order. */
export const QUESTIONS: Question[] = FROM_FILES;

/** A Practice category's questions, by its slug, in order. */
export function questionsIn(category: string) {
  return QUESTIONS.filter((question) => question.category === category);
}
