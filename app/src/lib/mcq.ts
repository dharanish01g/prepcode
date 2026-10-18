import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** An option of an MCQ. Its body and explanation are markdown. */
export type McqOption = {
  /** Picks are kept against this, never against the option's place on screen: options are shuffled. */
  id: string;
  body: string;
  /** Why it's right or wrong, shown once it's been picked. */
  explanation: string;
  is_correct: boolean;
};

/** An MCQ as user_doc/practice-mcq.md §4 describes it. The question and each hint are markdown. */
export type Mcq = {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  description: string;
  /** Nudges towards the method, each a little stronger than the last, never the answer. Opened in order. */
  hints: string[];
  /** In the author's order; the MCQ screen shuffles them. */
  options: McqOption[];
};

/**
 * An MCQ category's questions, in order, with their options and hints. The
 * database returns only the open ones (published and Public), so private
 * questions and their answers never reach the app.
 */
async function fetchCategoryMcqs(category: string): Promise<Mcq[]> {
  const { data, error } = await supabase
    .from("pc_questions")
    .select(
      "slug, title, difficulty, topic, description, hints, options:pc_question_options (id, body, explanation, is_correct), category:pc_categories!inner (slug)",
    )
    .eq("category.slug", category)
    .order("position")
    .order("position", { referencedTable: "options" });
  if (error) throw new Error(error.message);
  return data.map(({ category: _, ...mcq }) => mcq as Mcq);
}

/** A category's MCQs, by its slug; null while none is open. */
export function useCategoryMcqsQuery(category: string | null) {
  return useQuery({
    queryKey: ["practice-mcqs", category],
    queryFn: () => fetchCategoryMcqs(category!),
    enabled: category !== null,
    // Like coding questions: published now and then, not by the minute.
    staleTime: 5 * 60 * 1000,
  });
}
