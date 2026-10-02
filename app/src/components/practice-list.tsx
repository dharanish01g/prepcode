import { useState } from "react";
import { CircleCheckIcon } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { PRACTICE_COLUMN } from "@/components/practice-categories";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Question } from "@/lib/practice";
import { cn } from "@/lib/utils";

const DIFFICULTY_VARIANTS = {
  Easy: "secondary",
  Medium: "outline",
  Hard: "destructive",
} as const;

export function DifficultyBadge({ difficulty }: { difficulty: Question["difficulty"] }) {
  return <Badge variant={DIFFICULTY_VARIANTS[difficulty]}>{difficulty}</Badge>;
}

/** A category's questions, to pick one to solve. */
export function PracticeList({
  details,
  questions,
  onSelect,
}: {
  /** The category's markdown details, e.g. a company's exam pattern. */
  details: string | null;
  questions: Question[];
  onSelect: (slug: string) => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const shown = questions.filter((q) => q.title.toLowerCase().includes(query));

  if (questions.length === 0 && !details) {
    return (
      <Empty className="pb-24">
        <EmptyHeader>
          <EmptyTitle>No questions yet</EmptyTitle>
          <EmptyDescription>Questions for this category are coming soon.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className={cn(PRACTICE_COLUMN, "flex flex-col gap-4")}>
        {details && <Markdown>{details}</Markdown>}
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          className="max-w-sm"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Difficulty</TableHead>
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((question) => (
              <TableRow
                key={question.slug}
                className="cursor-pointer"
                onClick={() => onSelect(question.slug)}
              >
                <TableCell className="text-muted-foreground">
                  {questions.indexOf(question) + 1}
                </TableCell>
                <TableCell className="font-medium">{question.title}</TableCell>
                <TableCell>
                  <DifficultyBadge difficulty={question.difficulty} />
                </TableCell>
                <TableCell>
                  {question.solved && <CircleCheckIcon className="size-4" aria-label="Solved" />}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {questions.length === 0 ? "No questions yet." : "No questions match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
