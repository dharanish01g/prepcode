import { CircleCheckIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import type { QuestionSummary } from "@/lib/questions";

const DIFFICULTY_COLORS = {
  Easy: "text-green-600 dark:text-green-500",
  Medium: "text-yellow-600 dark:text-yellow-500",
  Hard: "text-red-600 dark:text-red-500",
} as const;

/**
 * Questions in the sidebar, numbered, with a tick once solved and their
 * difficulty on the right. Click one to open it; locked ones don't open.
 */
export function QuestionList({
  questions,
  loading,
  error,
  onRetry,
  solved,
  search,
  selectedQuestion,
  onSelectQuestion,
}: {
  /** All the questions being listed, in order; numbers count from the first. */
  questions: QuestionSummary[];
  /** Still loading the list. */
  loading: boolean;
  /** The list couldn't load (most likely offline). */
  error: boolean;
  onRetry: () => void;
  /** The ones the student has solved, by slug: ticked, so what's left stands out. */
  solved: ReadonlySet<string>;
  /** Lowercase and trimmed; matches titles, or a question's number. */
  search: string;
  selectedQuestion: string | null;
  onSelectQuestion: (slug: string) => void;
}) {
  if (loading) {
    return (
      <SidebarGroup className="py-0">
        <SidebarMenu>
          {[0, 1, 2, 3, 4].map((row) => (
            <SidebarMenuItem key={row}>
              <SidebarMenuSkeleton />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 px-4 py-2 text-sm text-muted-foreground">
        Couldn't load the questions. Check your internet connection.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  if (questions.length === 0) {
    return <p className="px-4 py-2 text-sm text-muted-foreground">Questions coming soon.</p>;
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
                disabled={question.locked}
                title={question.locked ? "Locked" : undefined}
                onClick={() => onSelectQuestion(question.slug)}
              >
                <span className="text-muted-foreground tabular-nums">{n}.</span>
                <span className="truncate">{question.title}</span>
                {question.locked ? (
                  <LockIcon aria-label="Locked" className="shrink-0 text-muted-foreground" />
                ) : (
                  solved.has(question.slug) && (
                    <CircleCheckIcon
                      aria-label="Solved"
                      className="shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                  )
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
