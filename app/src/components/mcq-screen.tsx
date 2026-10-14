import { useState, type ReactNode } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/** An MCQ as user_doc/practice-mcq.md §4 describes it. The question and each option are markdown. */
interface Mcq {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  description: string;
  options: { id: string; body: string; explanation: string; is_correct: boolean }[];
}

// Sample data until the question tables are in prepwisely.
const SAMPLE: Mcq = {
  title: "Train Crossing a Platform",
  difficulty: "easy",
  topic: "Time and Distance",
  description: `**RailMitra**, a train-tracking app, shows passengers how long a train takes to clear a station. At
**Vijayawada Junction**, an express train has these details:

| Detail          | Value   |
| --------------- | ------- |
| Train length    | 150 m   |
| Speed           | 54 km/h |
| Platform length | 300 m   |

The train has cleared the platform once its **last coach** leaves the far end.

How long does the train take to cross the platform completely?`,
  options: [
    {
      id: "a",
      body: "20 seconds",
      explanation:
        "That's 300 ÷ 15: only the platform's length. The train must cover its own length too.",
      is_correct: false,
    },
    {
      id: "b",
      body: "30 seconds",
      explanation:
        "Right. 54 km/h = 15 m/s, and the train covers 150 + 300 = 450 m, so 450 ÷ 15 = **30 seconds**.",
      is_correct: true,
    },
    {
      id: "c",
      body: "10 seconds",
      explanation:
        "That's 150 ÷ 15: only the train's length. It must also cover the whole platform.",
      is_correct: false,
    },
    {
      id: "d",
      body: "8.3 seconds",
      explanation:
        "This uses 54 m/s. Convert km/h to m/s first: multiply by `5/18`, so 54 km/h = 15 m/s.",
      is_correct: false,
    },
  ],
};

const DIFFICULTY_LABEL: Record<Mcq["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** The option ids in a random order, different from `current` when there's more than one (practice-mcq.md §5.2). */
function shuffled(ids: string[], current: string[] = ids): string[] {
  if (ids.length < 2) return ids;
  for (;;) {
    const next = [...ids];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (next.some((id, i) => id !== current[i])) return next;
  }
}

/**
 * Colours for the options, so a student reads each option instead of remembering "the blue one". No green or red:
 * those mean correct and wrong once an option is submitted.
 */
const COLORS = [
  { box: "border-sky-500 bg-sky-500/25", badge: "border-sky-500 bg-sky-500 text-white" },
  {
    box: "border-violet-500 bg-violet-500/25",
    badge: "border-violet-500 bg-violet-500 text-white",
  },
  { box: "border-amber-500 bg-amber-500/25", badge: "border-amber-500 bg-amber-500 text-white" },
  { box: "border-pink-500 bg-pink-500/25", badge: "border-pink-500 bg-pink-500 text-white" },
  {
    box: "border-orange-500 bg-orange-500/25",
    badge: "border-orange-500 bg-orange-500 text-white",
  },
  {
    box: "border-indigo-500 bg-indigo-500/25",
    badge: "border-indigo-500 bg-indigo-500 text-white",
  },
  { box: "border-cyan-500 bg-cyan-500/25", badge: "border-cyan-500 bg-cyan-500 text-white" },
  {
    box: "border-fuchsia-500 bg-fuchsia-500/25",
    badge: "border-fuchsia-500 bg-fuchsia-500 text-white",
  },
  {
    box: "border-yellow-500 bg-yellow-500/25",
    badge: "border-yellow-500 bg-yellow-500 text-white",
  },
];

/** A different colour for each option, at random, and none keeping the colour it had in `current`. */
function colored(ids: string[], current: Record<string, number> = {}): Record<string, number> {
  for (let attempt = 0; ; attempt++) {
    const picks = shuffled(COLORS.map((_, i) => String(i))).map(Number);
    const next = Object.fromEntries(ids.map((id, i) => [id, picks[i % picks.length]]));
    // Give up on "all new colours" after a few tries rather than loop forever on a long option list.
    if (attempt > 20 || ids.every((id) => next[id] !== current[id])) return next;
  }
}

/**
 * MCQ: multiple-choice questions (aptitude first), answered one at a time
 * until the right option is picked. Always uses the whole main area, with no
 * sidebar column: a card in the middle, with the question on the left and
 * its options on the right. See user_doc/practice-mcq.md.
 */
export function McqScreen() {
  const question = SAMPLE;
  const ids = question.options.map((o) => o.id);
  // Shuffled when the question is first shown, and again after every wrong submit.
  const [order, setOrder] = useState(() => shuffled(ids));
  // Each option's colour (an index into COLORS), drawn again with every shuffle.
  const [colors, setColors] = useState(() => colored(ids));
  const [selected, setSelected] = useState<string | null>(null);
  // Options submitted and wrong: they stay marked, with their explanation, and can't be picked again.
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const byId = new Map(question.options.map((o) => [o.id, o]));

  function submit() {
    const option = selected ? byId.get(selected) : undefined;
    if (!option) return;
    if (option.is_correct) {
      setSolved(true);
      return;
    }
    setWrong((list) => [...list, option.id]);
    setSelected(null);
    setOrder((current) => shuffled(ids, current));
    setColors((current) => colored(ids, current));
  }

  // The sample has one question, so Next starts it again.
  function next() {
    setOrder((current) => shuffled(ids, current));
    setColors((current) => colored(ids, current));
    setSelected(null);
    setWrong([]);
    setSolved(false);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Breadcrumb>
          {/* Same size as the Programs, Database and Sync column headings. */}
          <BreadcrumbList className="text-base">
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">MCQ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {/* A card in the middle, three quarters of the area's width and height. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Card className="h-3/4 w-3/4 gap-0 py-0">
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
            <ResizablePanel id="question" defaultSize="50%" minSize="30%">
              <McqPanel title="Question">
                <h1 className="mb-1 text-base font-semibold">{question.title}</h1>
                <p className="mb-3 text-xs text-muted-foreground">
                  {DIFFICULTY_LABEL[question.difficulty]} · {question.topic}
                </p>
                <Markdown>{question.description}</Markdown>
              </McqPanel>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel id="options" defaultSize="50%" minSize="30%">
              <McqPanel
                title="Options"
                footer={
                  solved ? (
                    <Button onClick={next}>Next</Button>
                  ) : (
                    <Button disabled={!selected} onClick={submit}>
                      Submit
                    </Button>
                  )
                }
              >
                <ul className="grid gap-2">
                  {order.map((id, i) => {
                    const option = byId.get(id)!;
                    const isWrong = wrong.includes(id);
                    const isCorrect = solved && option.is_correct;
                    const isSelected = selected === id && !solved;
                    const explained = isWrong || isCorrect;
                    // The selected option shows the theme colour, and submitted ones red or green, instead of their own.
                    const color = explained || isSelected ? undefined : COLORS[colors[id]];
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          disabled={solved || isWrong}
                          onClick={() => setSelected(id)}
                          className={cn(
                            "flex w-full items-start gap-3 border p-3 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                            color?.box,
                            !solved &&
                              !isWrong &&
                              "cursor-pointer hover:brightness-95 dark:hover:brightness-125",
                            isSelected && "border-primary bg-primary/15 ring-1 ring-primary",
                            isWrong && "border-destructive/50 bg-destructive/5",
                            isCorrect &&
                              "border-emerald-600 bg-emerald-600/5 dark:border-emerald-400",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center border text-xs font-medium",
                              color?.badge,
                              isSelected && "border-primary bg-primary text-primary-foreground",
                              isWrong && "border-destructive text-destructive",
                              isCorrect &&
                                "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400",
                            )}
                          >
                            {isWrong ? (
                              <XIcon className="size-3.5" />
                            ) : isCorrect ? (
                              <CheckIcon className="size-3.5" />
                            ) : (
                              String.fromCharCode(65 + i)
                            )}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                            <Markdown>{option.body}</Markdown>
                            {explained && (
                              <div
                                className={cn(
                                  "border-t pt-2 text-muted-foreground",
                                  isWrong ? "border-destructive/30" : "border-emerald-600/30",
                                )}
                              >
                                <p
                                  className={cn(
                                    "mb-1 text-xs font-medium",
                                    isWrong
                                      ? "text-destructive"
                                      : "text-emerald-600 dark:text-emerald-400",
                                  )}
                                >
                                  {isWrong ? "Wrong" : "Correct"}
                                </p>
                                <Markdown>{option.explanation}</Markdown>
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </McqPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      </div>
    </>
  );
}

/** One side of the card: a bar with its name, what's in it, and an optional bar at the bottom for its buttons. */
function McqPanel({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Same height as the coding screen's editor bar. */}
      <div className="flex h-9 shrink-0 items-center border-b px-4 text-sm font-medium">
        {title}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4 text-sm">{children}</div>
      </ScrollArea>
      {footer && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
