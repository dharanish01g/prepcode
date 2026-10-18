import {
  Fragment,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  CheckCheckIcon,
  CheckIcon,
  LightbulbIcon,
  LockIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Markdown } from "@/components/markdown";
import { CategoryIcon } from "@/components/practice-categories";
import type { Crumb } from "@/components/questions-screen";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useCategoryMcqsQuery, type Mcq } from "@/lib/mcq";
import type { Category } from "@/lib/practice";
import { cn } from "@/lib/utils";

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

/** How long Try again and Next stay disabled after a submit, so the student reads the explanation first. */
const READ_SECONDS = 10;

/** Every question has at least this many options, and exactly one correct. */
const MIN_OPTIONS = 4;

/** Every question has at least this many hints. */
const MIN_HINTS = 1;

/** How long opening each hint locks the options: hints have a cost, so they're opened only when needed. */
const HINT_PENALTY_SECONDS = 30;

/**
 * How long after the last hint was opened a question's hints close and lock again, so reading them once more costs
 * the penalty again: the student has to remember them.
 */
const HINTS_RESET_MS = 5 * 60 * 1000;

/**
 * Where the student is in an MCQ card. WorkspaceScreen keeps it, so leaving the card and coming back carries on where
 * it was: the same question, its waits still running (leaving doesn't skip them), and the same hints opened. Opening
 * another card starts that one afresh.
 */
export interface McqProgress {
  /** The card's slug. */
  category: string;
  /** Which of the card's questions. */
  index: number;
  /** Every question has been answered: the card shows it's finished. */
  finished: boolean;
  /** The option ids in the order shown: shuffled when the question is first shown, and again on every Try again. */
  order: string[];
  /** Each option's colour (an index into COLORS), drawn again with every shuffle. */
  colors: Record<string, number>;
  selected: string | null;
  /**
   * The option just submitted, and wrong. Until Try again, the options are blurred and only its explanation shows.
   * Nothing marks it afterwards: the student has to remember what they tried, and why it was wrong.
   */
  missed: string | null;
  solved: boolean;
  /** When Try again or Next can be clicked (a Date.now() time). */
  readUntil: number;
  /** The hints expanded now, by index (as strings, the accordion's values). */
  hintsOpen: string[];
  /** How many hints have been opened. They open in order, so this is also the index of the next one. */
  hintsShown: number;
  /** When the last hint's penalty ends and the options unlock. */
  hintUntil: number;
  /** When the last hint was opened. */
  lastHintAt: number;
}

/** A fresh start on question `index` of a card, its options in a different order and colours from `previous`'s. */
function startMcq(
  category: string,
  questions: Mcq[],
  index: number,
  previous?: McqProgress,
): McqProgress {
  const ids = questions[index].options.map((o) => o.id);
  return {
    category,
    index,
    finished: false,
    order: shuffled(ids, previous?.order),
    colors: colored(ids, previous?.colors),
    selected: null,
    missed: null,
    solved: false,
    readUntil: 0,
    hintsOpen: [],
    hintsShown: 0,
    hintUntil: 0,
    lastHintAt: 0,
  };
}

/** Whole seconds left until `until` (a Date.now() time), ticking down to 0 while shown. */
function useSecondsLeft(until: number): number {
  const [, setNow] = useState(0);
  useEffect(() => {
    if (until <= Date.now()) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= until) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

/** Whether `progress` still fits `questions`: a refetch can bring fewer questions, or a question's options changed. */
function fits(progress: McqProgress, questions: Mcq[]): boolean {
  const question = questions[progress.index];
  if (!question) return false;
  const ids = new Set(question.options.map((o) => o.id));
  return progress.order.length === ids.size && progress.order.every((id) => ids.has(id));
}

/**
 * A Practice card of multiple-choice questions (aptitude first), answered one
 * at a time, in order, until the right option is picked. Always uses the whole
 * main area, with no sidebar column: there's no skipping. See
 * user_doc/practice-mcq.md.
 */
export function McqScreen({
  category,
  parents,
  progress,
  onChange,
}: {
  category: Category;
  /** The breadcrumb before the card's title, e.g. Practice. */
  parents: Crumb[];
  /** Null, or another card's, until this card's questions load and it starts. */
  progress: McqProgress | null;
  onChange: Dispatch<SetStateAction<McqProgress | null>>;
}) {
  const questions = useCategoryMcqsQuery(category.slug);
  const data = questions.data;
  const current =
    data && progress?.category === category.slug && fits(progress, data) ? progress : null;
  // Start at question 1, or where the student was if the questions changed under them.
  useEffect(() => {
    if (!data?.length || current) return;
    const index =
      progress?.category === category.slug ? Math.min(progress.index, data.length - 1) : 0;
    onChange(startMcq(category.slug, data, index));
  }, [data, current, progress, category.slug, onChange]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {parents.map((parent) => (
              <Fragment key={parent.label}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <button type="button" className="cursor-pointer" onClick={parent.onClick} />
                    }
                  >
                    {parent.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{category.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {questions.isError ? (
        // Most likely offline: questions come from Supabase.
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WifiOffIcon />
            </EmptyMedia>
            <EmptyTitle>Couldn't load {category.title}</EmptyTitle>
            <EmptyDescription>{questions.error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => questions.refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : data?.length === 0 ? (
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyTitle>Coming soon</EmptyTitle>
            <EmptyDescription>
              {category.title} questions are on their way. Check back soon.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : data && current?.finished ? (
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCheckIcon />
            </EmptyMedia>
            <EmptyTitle>All done</EmptyTitle>
            <EmptyDescription>
              You've answered all {data.length} {category.title} questions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button
              variant="outline"
              onClick={() => onChange(startMcq(category.slug, data, 0, current))}
            >
              Start again
            </Button>
            {parents[0]?.onClick && (
              <Button onClick={parents[0].onClick}>Back to {parents[0].label}</Button>
            )}
          </EmptyContent>
        </Empty>
      ) : data && current ? (
        <McqQuestion
          category={category}
          questions={data}
          progress={current}
          onChange={(action) =>
            onChange((p) => p && (typeof action === "function" ? action(p) : action))
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      )}
    </>
  );
}

/** The card's current question: the question on the left, its options on the right. */
function McqQuestion({
  category,
  questions,
  progress,
  onChange,
}: {
  category: Category;
  questions: Mcq[];
  progress: McqProgress;
  onChange: Dispatch<SetStateAction<McqProgress>>;
}) {
  const { index, order, colors, selected, missed, solved, hintsOpen, hintsShown, lastHintAt } =
    progress;
  const question = questions[index];
  const last = index === questions.length - 1;
  const ids = question.options.map((o) => o.id);
  const update = (change: Partial<McqProgress>) => onChange((p) => ({ ...p, ...change }));
  const reshuffle = (p: McqProgress) => ({
    order: shuffled(ids, p.order),
    colors: colored(ids, p.colors),
  });
  // Seconds left before Try again or Next can be clicked.
  const wait = useSecondsLeft(progress.readUntil);
  // Seconds left of the last hint's penalty, while the options are locked.
  const hintWait = useSecondsLeft(progress.hintUntil);
  // Five minutes after the last hint was opened, the hints reset; at once if that passed while away. Not once
  // solved: then they're free to read.
  useEffect(() => {
    if (hintsShown === 0 || solved) return;
    const timer = setTimeout(
      () => onChange((p) => ({ ...p, hintsShown: 0, hintsOpen: [] })),
      Math.max(0, lastHintAt + HINTS_RESET_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [hintsShown, lastHintAt, solved, onChange]);
  // Blurred and unclickable: after a wrong submit (until Try again), and during the hint's penalty.
  const locked = missed !== null || hintWait > 0;

  const byId = new Map(question.options.map((o) => [o.id, o]));
  // One that breaks the rules is shown as unavailable rather than guessed at (practice-mcq.md §4.4).
  const broken =
    question.options.length < MIN_OPTIONS ||
    question.options.filter((o) => o.is_correct).length !== 1 ||
    question.hints.length < MIN_HINTS;
  const missedOption = missed ? byId.get(missed) : undefined;

  function submit() {
    const option = selected ? byId.get(selected) : undefined;
    if (!option) return;
    const readUntil = Date.now() + READ_SECONDS * 1000;
    if (option.is_correct) update({ solved: true, readUntil });
    else update({ missed: option.id, selected: null, readUntil });
  }

  // Opening the next hint before it's solved locks the options. Hints already opened, and all of them once solved,
  // open and close freely.
  // Every hint opened before it's solved, new or again, also shuffles the options.
  function toggleHints(open: string[]) {
    const opening = open.some((value) => !hintsOpen.includes(value));
    if (solved || !opening) {
      update({ hintsOpen: open });
      return;
    }
    const isNext = open.includes(String(hintsShown));
    const now = Date.now();
    onChange((p) => ({
      ...p,
      ...reshuffle(p),
      hintsOpen: open,
      selected: null,
      ...(isNext && {
        hintsShown: p.hintsShown + 1,
        hintUntil: now + HINT_PENALTY_SECONDS * 1000,
        lastHintAt: now,
      }),
    }));
  }

  // Shuffled only now, so the new order is never seen next to the explanation.
  function tryAgain() {
    onChange((p) => ({ ...p, ...reshuffle(p), missed: null }));
  }

  // The next question in order, or, after the last, the card is finished.
  function next() {
    onChange((p) =>
      last ? { ...p, finished: true } : startMcq(category.slug, questions, p.index + 1, p),
    );
  }

  return (
    <>
      {/* A card in the middle, three quarters of the area's width and height. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Card className="h-3/4 w-3/4 gap-0 py-0">
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
            <ResizablePanel id="question" defaultSize="50%" minSize="30%">
              <McqPanel
                title={
                  <>
                    {category.logoUrl ? (
                      <img src={category.logoUrl} alt="" />
                    ) : (
                      <CategoryIcon name={category.icon} />
                    )}
                    {category.title}
                  </>
                }
                footer={
                  <span className="mr-auto text-sm text-muted-foreground tabular-nums">
                    Question {index + 1} of {questions.length}
                  </span>
                }
              >
                <h1 className="mb-1 text-base font-semibold">{question.title}</h1>
                <p className="mb-3 text-xs text-muted-foreground">
                  {DIFFICULTY_LABEL[question.difficulty]} · {question.topic}
                </p>
                <Markdown>{question.description}</Markdown>
                {!broken && (
                  <Accordion
                    multiple
                    className="mt-6 border px-4"
                    value={hintsOpen}
                    onValueChange={(value) => toggleHints(value as string[])}
                  >
                    {question.hints.map((hint, i) => {
                      const opened = solved || i < hintsShown;
                      // Only the next hint can open, and not while the last one's penalty is running.
                      const note = opened
                        ? null
                        : i > hintsShown
                          ? `Open hint ${i} first`
                          : hintWait > 0
                            ? `Opens in ${hintWait}s`
                            : `Locks the options for ${HINT_PENALTY_SECONDS} seconds`;
                      return (
                        <AccordionItem
                          key={i}
                          value={String(i)}
                          disabled={!opened && (i > hintsShown || hintWait > 0)}
                        >
                          <AccordionTrigger className="items-center gap-1.5 py-3 hover:no-underline">
                            <LightbulbIcon className="size-3.5 text-yellow-500" />
                            Hint {i + 1}
                            {note && (
                              <span className="font-normal text-muted-foreground tabular-nums">
                                · {note}
                              </span>
                            )}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <Markdown>{hint}</Markdown>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </McqPanel>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel id="options" defaultSize="50%" minSize="30%">
              <McqPanel
                title="Options"
                footer={
                  broken ? (
                    <Button onClick={next}>{last ? "Finish" : "Next"}</Button>
                  ) : solved ? (
                    <Button disabled={wait > 0} onClick={next}>
                      {last ? "Finish" : "Next"}
                      {wait > 0 && <span className="tabular-nums">({wait})</span>}
                    </Button>
                  ) : missed ? (
                    <Button disabled={wait > 0} onClick={tryAgain}>
                      Try again
                      {wait > 0 && <span className="tabular-nums">({wait})</span>}
                    </Button>
                  ) : (
                    <Button disabled={!selected || locked} onClick={submit}>
                      Submit
                    </Button>
                  )
                }
              >
                {/* The options and, below them, why they're locked: a wrong submit's explanation, or the hint's
                    penalty. */}
                {broken ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>This question isn't available</EmptyTitle>
                      <EmptyDescription>
                        Something's wrong with it. Move on to the next one.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid gap-4">
                    <ul
                      aria-hidden={locked}
                      className={cn(
                        "grid gap-2 transition-[filter]",
                        locked && "pointer-events-none blur-sm select-none",
                      )}
                    >
                      {order.map((id, i) => {
                        const option = byId.get(id)!;
                        // Once solved, every option shows whether it's right and why.
                        const isCorrect = solved && option.is_correct;
                        const isWrong = solved && !option.is_correct;
                        const isSelected = selected === id && !solved;
                        // The selected option shows the theme colour, and solved ones green or red, instead of their own.
                        const color = solved || isSelected ? undefined : COLORS[colors[id]];
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              disabled={solved || locked}
                              onClick={() => update({ selected: id })}
                              className={cn(
                                "flex w-full items-start gap-3 border p-3 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                                color?.box,
                                !solved &&
                                  !locked &&
                                  "cursor-pointer hover:brightness-95 dark:hover:brightness-125",
                                isSelected && "border-primary bg-primary/15 ring-1 ring-primary",
                                isCorrect &&
                                  "border-emerald-600 bg-emerald-600/5 dark:border-emerald-400",
                                isWrong && "border-destructive/50 bg-destructive/5",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center border text-xs font-medium",
                                  color?.badge,
                                  isSelected && "border-primary bg-primary text-primary-foreground",
                                  isCorrect &&
                                    "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400",
                                  isWrong && "border-destructive text-destructive",
                                )}
                              >
                                {isCorrect ? (
                                  <CheckIcon className="size-3.5" />
                                ) : isWrong ? (
                                  <XIcon className="size-3.5" />
                                ) : (
                                  String.fromCharCode(65 + i)
                                )}
                              </span>
                              <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                                <Markdown>{option.body}</Markdown>
                                {solved && (
                                  <div
                                    className={cn(
                                      "border-t pt-2 text-muted-foreground",
                                      isCorrect ? "border-emerald-600/30" : "border-destructive/30",
                                    )}
                                  >
                                    <p
                                      className={cn(
                                        "mb-1 text-xs font-medium",
                                        isCorrect
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-destructive",
                                      )}
                                    >
                                      {isCorrect ? "Correct" : "Wrong"}
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
                    {hintWait > 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <LockIcon className="size-3.5" />
                        Hint opened: the options unlock in{" "}
                        <span className="tabular-nums">{hintWait}s</span>
                      </p>
                    )}
                    {missedOption && (
                      <div className="border border-destructive/50 p-4">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                          <XIcon className="size-3.5" />
                          Wrong
                        </p>
                        <Markdown>{missedOption.explanation}</Markdown>
                      </div>
                    )}
                  </div>
                )}
              </McqPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      </div>
    </>
  );
}

/** One side of the card: a bar with its name, what's in it, and an optional bar at the bottom (e.g. its buttons). */
function McqPanel({
  title,
  footer,
  children,
}: {
  title: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Same height as the bottom bar. */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 text-sm font-medium [&_svg]:size-4">
        {title}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4 text-sm">{children}</div>
      </ScrollArea>
      {footer && (
        // A fixed height (a button's plus padding) so both sides' bars line up.
        <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-t px-4">
          {footer}
        </div>
      )}
    </div>
  );
}
