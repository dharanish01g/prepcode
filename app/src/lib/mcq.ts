import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
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
  /** Its id in the database, which answers are recorded against. */
  id: string;
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
      "id, slug, title, difficulty, topic, description, hints, options:pc_question_options (id, body, explanation, is_correct), category:pc_categories!inner (slug)",
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

/** Something the student did on an MCQ, recorded for their progress and for staff. */
export type McqEvent = { questionId: string; question: string } & (
  { kind: "submit"; optionId: string; correct: boolean } | { kind: "hint"; hintIndex: number }
);

/**
 * Records an event on this computer, then sends it to the database in the
 * background (a guest's stay here). Offline, it waits and goes later.
 */
export function recordMcqEvent(event: McqEvent) {
  return invoke<void>("record_mcq_event", { event });
}

/** Sends the student's events still waiting on this computer, e.g. after being offline. */
export function sendMcqEvents() {
  return invoke<void>("send_mcq_events");
}

/** The MCQs the student has answered right, by slug, from here and (online) the database. */
export function listMcqSolved() {
  return invoke<string[]>("list_mcq_solved");
}
