import { useQuery } from "@tanstack/react-query";
import { VALUE_TYPES, type Param, type Signature, type ValueType } from "@/lib/drivers";
import { supabase } from "@/lib/supabase";

export type Difficulty = "Easy" | "Medium" | "Hard";

/** A question as its category lists it, before it's opened. */
export type QuestionSummary = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  /** What it practises, e.g. "Strings". */
  topic: string;
  /** Private: listed, but students can't open it yet. */
  locked: boolean;
};

/**
 * A practice question, LeetCode style: the student writes one method, which
 * is called with each example's values and must return its output.
 */
export type Question = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  /** Markdown: the case study, without the examples or constraints. */
  description: string;
  /** Markdown, one line, e.g. `1 ≤ year ≤ 9999`. Shown after the examples. */
  constraints: string;
  /** Markdown: how to solve it. */
  explanation: string;
  /** The method to write, or null for a question not ready to solve yet. */
  signature: Signature | null;
  /** The examples Run and Submit check the code against, in order. */
  examples: Example[];
};

/** An example: the method's arguments and what it should return. */
export type Example = {
  /** As shown, e.g. `a = 3, b = 5`. */
  inputText: string;
  /** One per parameter, in order. */
  values: unknown[];
  /** What the method should return, e.g. 8. */
  expected: unknown;
  /** A line shown under the example; may be empty. */
  note: string;
};

// The rows as the database returns them.
type SummaryRow = {
  slug: string;
  title: string;
  difficulty: string;
  topic: string;
  access: string;
};
type QuestionRow = {
  slug: string;
  title: string;
  difficulty: string;
  topic: string;
  description: string;
  constraints: string;
  explanation: string;
  method: string;
  params: { name: string; type: string }[];
  returns: string;
  examples: { inputs: unknown[]; expected: unknown; note: string }[];
};

const DIFFICULTIES: Record<string, Difficulty> = { easy: "Easy", medium: "Medium", hard: "Hard" };

function parseDifficulty(text: string, where: string): Difficulty {
  const difficulty = DIFFICULTIES[text];
  if (!difficulty) throw new Error(`${where}: ${text} isn't a difficulty`);
  return difficulty;
}

function parseType(text: string, where: string): ValueType {
  if (!VALUE_TYPES.includes(text as ValueType)) {
    throw new Error(`${where}: ${text} isn't a type (use ${VALUE_TYPES.join(", ")})`);
  }
  return text as ValueType;
}

/** Whether a value (parsed from JSON) is of a question's type. */
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

/** A value of `type`, or an error naming where it came from. */
function checkValue(value: unknown, type: ValueType, where: string) {
  if (!isType(value, type)) throw new Error(`${where}: ${JSON.stringify(value)} isn't a ${type}`);
  return value;
}

/**
 * A question from its row, checked the way the drivers need it: a bad value
 * would otherwise only show up as a confusing failed Run.
 */
function toQuestion(row: QuestionRow): Question {
  const { slug } = row;
  const params: Param[] = row.params.map(({ name, type }) => ({
    name,
    type: parseType(type, slug),
  }));
  const signature: Signature | null = row.method
    ? { method: row.method, params, returns: parseType(row.returns, slug) }
    : null;
  const examples = signature
    ? row.examples.map(({ inputs, expected, note }, i): Example => {
        const where = `${slug}, example ${i + 1}`;
        if (inputs.length !== params.length) {
          throw new Error(`${where}: needs ${params.length} inputs, has ${inputs.length}`);
        }
        const values = params.map(({ type }, j) => checkValue(inputs[j], type, where));
        return {
          inputText: params
            .map(({ name }, j) => `${name} = ${JSON.stringify(values[j])}`)
            .join(", "),
          values,
          expected: checkValue(expected, signature.returns, where),
          note,
        };
      })
    : [];
  return {
    slug,
    title: row.title,
    difficulty: parseDifficulty(row.difficulty, slug),
    topic: row.topic,
    description: row.description,
    constraints: row.constraints,
    explanation: row.explanation,
    signature,
    examples,
  };
}

/** A category's published questions, in order; private ones come locked. */
async function fetchCategoryQuestions(category: string): Promise<QuestionSummary[]> {
  const { data, error } = await supabase.rpc("pc_category_questions", {
    p_category_slug: category,
  });
  if (error) throw new Error(error.message);
  return (data as SummaryRow[]).map((row) => ({
    slug: row.slug,
    title: row.title,
    difficulty: parseDifficulty(row.difficulty, row.slug),
    topic: row.topic,
    locked: row.access !== "public",
  }));
}

/**
 * A question with its examples. Hidden test cases never come: the database
 * only gives students the examples.
 */
async function fetchQuestion(slug: string): Promise<Question> {
  const { data, error } = await supabase
    .from("pc_questions")
    .select(
      "slug, title, difficulty, topic, description, constraints, explanation, method, params, returns, examples:pc_test_cases (inputs, expected, note)",
    )
    .eq("slug", slug)
    .eq("examples.visibility", "example")
    .order("position", { referencedTable: "examples" })
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Unpublished since the list loaded, or private.
  if (!data) throw new Error("This question isn't available.");
  return toQuestion(data as QuestionRow);
}

// Questions change more often than categories, as the content team
// publishes them, but not by the minute.
const QUESTIONS_STALE_MS = 5 * 60 * 1000;

/** A category's questions, by its slug; null while none is open. */
export function useCategoryQuestionsQuery(category: string | null) {
  return useQuery({
    queryKey: ["practice-questions", category],
    queryFn: () => fetchCategoryQuestions(category!),
    enabled: category !== null,
    staleTime: QUESTIONS_STALE_MS,
  });
}

/** A question to solve, by its slug; null while none is open. */
export function useQuestionQuery(slug: string | null) {
  return useQuery({
    queryKey: ["practice-question", slug],
    queryFn: () => fetchQuestion(slug!),
    enabled: slug !== null,
    staleTime: QUESTIONS_STALE_MS,
  });
}
