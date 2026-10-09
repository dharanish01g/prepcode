import { CircleCheckIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Question } from "@/lib/questions";

const DIFFICULTY_COLORS = {
  Easy: "text-green-600 dark:text-green-500",
  Medium: "text-yellow-600 dark:text-yellow-500",
  Hard: "text-red-600 dark:text-red-500",
} as const;

/**
 * Questions in the sidebar, numbered, with a tick once solved and their
 * difficulty on the right. Click one to open it.
 */
export function QuestionList({
  questions,
  solved,
  search,
  selectedQuestion,
  onSelectQuestion,
}: {
  /** All the questions being listed, in order; numbers count from the first. */
  questions: Question[];
  /** The ones the student has solved, by slug: ticked, so what's left stands out. */
  solved: ReadonlySet<string>;
  /** Lowercase and trimmed; matches titles, or a question's number. */
  search: string;
  selectedQuestion: string | null;
  onSelectQuestion: (slug: string) => void;
}) {
  if (questions.length === 0) {
    return <p className="px-4 py-2 text-sm text-muted-foreground">No questions here yet.</p>;
  }
  // "3" or "3." finds question 3, as well as titles with a 3 in them.
  const number = search.replace(/\.$/, "");
  const shown = questions
    .map((question, i) => ({ question, number: i + 1 }))
    .filter(
      ({ question, number: n }) =>
        question.title.toLowerCase().includes(search) || String(n) === number,
    );
  if (shown.length === 0) {
    return (
      <p className="px-4 py-2 text-sm text-muted-foreground">No questions match your search.</p>
    );
  }

  return (
    // Vertical padding lives on SidebarContent, as with the file list.
    <SidebarGroup className="py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {shown.map(({ question, number: n }) => (
            <SidebarMenuItem key={question.slug}>
              <SidebarMenuButton
                isActive={selectedQuestion === question.slug}
                onClick={() => onSelectQuestion(question.slug)}
              >
                <span className="text-muted-foreground tabular-nums">{n}.</span>
                <span className="truncate">{question.title}</span>
                {solved.has(question.slug) && (
                  <CircleCheckIcon
                    aria-label="Solved"
                    className="shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                )}
                <span
                  className={`ml-auto shrink-0 text-xs ${DIFFICULTY_COLORS[question.difficulty]}`}
                >
                  {question.difficulty}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
