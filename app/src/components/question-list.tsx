import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { QUESTIONS } from "@/lib/questions";

const DIFFICULTY_COLORS = {
  Easy: "text-green-600 dark:text-green-500",
  Medium: "text-yellow-600 dark:text-yellow-500",
  Hard: "text-red-600 dark:text-red-500",
} as const;

/** The questions in the sidebar, with their difficulty on the right. Click one to open it. */
export function QuestionList({
  search,
  selectedQuestion,
  onSelectQuestion,
}: {
  /** Lowercase and trimmed; matches titles, or a question's number. */
  search: string;
  selectedQuestion: string | null;
  onSelectQuestion: (slug: string) => void;
}) {
  // "3" or "3." finds question 3, as well as titles with a 3 in them.
  const number = search.replace(/\.$/, "");
  const shown = QUESTIONS.filter(
    (q, i) => q.title.toLowerCase().includes(search) || String(i + 1) === number,
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
          {shown.map((question) => (
            <SidebarMenuItem key={question.slug}>
              <SidebarMenuButton
                isActive={selectedQuestion === question.slug}
                onClick={() => onSelectQuestion(question.slug)}
              >
                <span className="text-muted-foreground tabular-nums">
                  {QUESTIONS.indexOf(question) + 1}.
                </span>
                <span className="truncate">{question.title}</span>
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
