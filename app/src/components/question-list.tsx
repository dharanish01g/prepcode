import { FlameIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { QUESTIONS, type Question } from "@/lib/questions";

const DIFFICULTY_COLORS = {
  Easy: "fill-green-500 text-green-500",
  Medium: "fill-yellow-500 text-yellow-500",
  Hard: "fill-red-500 text-red-500",
} as const;

/** A flame colored by difficulty: green is easy, yellow medium, red hard. */
function DifficultyFlame({ difficulty }: { difficulty: Question["difficulty"] }) {
  return <FlameIcon aria-label={difficulty} className={DIFFICULTY_COLORS[difficulty]} />;
}

/** The questions in the sidebar, with a flame for their difficulty on the right. Click one to open it. */
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
                <span className="ml-auto shrink-0">
                  <DifficultyFlame difficulty={question.difficulty} />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
