import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { CheckIcon, LightbulbIcon, LockIcon, XIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Markdown } from "@/components/markdown";
import { CategoryIcon } from "@/components/practice-categories";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/** An MCQ as user_doc/practice-mcq.md §4 describes it. The question and each option are markdown. */
interface Mcq {
  /** The category (card) it's in, with its Lucide icon name as in pc_categories, e.g. "calculator". */
  category: { title: string; icon: string | null };
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  description: string;
  /** Nudges towards the method, each a little stronger than the last, never the answer. Markdown. */
  hints: string[];
  options: { id: string; body: string; explanation: string; is_correct: boolean }[];
}

// Sample data until the question tables are in prepwisely.
const SAMPLES: Mcq[] = [
  {
    category: { title: "Quantitative Aptitude", icon: "calculator" },
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
    hints: [
      "To clear the platform, how far does the train's **front** have to travel?",
      "It travels the platform's length **plus its own length**: 300 m + 150 m.",
      "Convert the speed to m/s first: multiply km/h by `5/18`. Then time = distance ÷ speed.",
    ],
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
      {
        id: "e",
        body: "15 seconds",
        explanation:
          "15 is the speed in m/s, not a time. Divide the distance the train covers, 450 m, by it.",
        is_correct: false,
      },
    ],
  },
  {
    category: { title: "Quantitative Aptitude", icon: "calculator" },
    title: "Price Up, Price Down",
    difficulty: "easy",
    topic: "Percentages",
    description: `During a festival sale, **ShopKart** raised a phone's price by **20%** on Monday, then cut the new price
by **20%** on Friday.

Compared with the price before Monday, what is the price on Friday?`,
    hints: [
      "Start with a price of **₹100** and apply each change in turn.",
      "After Monday's rise the price is ₹120. Friday's 20% is taken off **₹120**, not ₹100.",
    ],
    options: [
      {
        id: "a",
        body: "The same as before",
        explanation:
          "The 20% cut is on the **raised** price, which is bigger, so it takes away more than the rise added.",
        is_correct: false,
      },
      {
        id: "b",
        body: "4% lower",
        explanation:
          "Right. Take ₹100: up 20% is ₹120, and 20% off ₹120 is ₹24, leaving **₹96**. That's 4% lower.",
        is_correct: true,
      },
      {
        id: "c",
        body: "4% higher",
        explanation:
          "The size is right, the direction isn't: ₹100 becomes ₹120, then ₹96, which is **below** ₹100.",
        is_correct: false,
      },
      {
        id: "d",
        body: "20% lower",
        explanation:
          "That counts only Friday's cut, as if Monday's rise never happened. Work through both: ₹100 → ₹120 → ₹96.",
        is_correct: false,
      },
    ],
  },
  {
    category: { title: "Quantitative Aptitude", icon: "calculator" },
    title: "Two Painters, One Wall",
    difficulty: "medium",
    topic: "Time and Work",
    description: `A housing society in **Coimbatore** hires two painters for its compound wall:

| Painter | Alone, the wall takes |
| ------- | --------------------- |
| Ravi    | 12 days               |
| Suresh  | 18 days               |

If both work on it together every day, how long will the wall take?`,
    hints: [
      "Work out what **part of the wall** each painter finishes in one day.",
      "Ravi does `1/12` of the wall a day and Suresh `1/18`. Add them to get what both do in a day.",
      "Use 36 as the common denominator. If together they do `x/36` of the wall a day, the wall takes `36/x` days.",
      "Check your answer: it must be **less than 12 days**, the time the faster painter needs alone.",
    ],
    options: [
      {
        id: "a",
        body: "15 days",
        explanation:
          "That's the average of 12 and 18. Two people working together finish **sooner** than even the faster one alone.",
        is_correct: false,
      },
      {
        id: "b",
        body: "30 days",
        explanation:
          "That adds the days. Add the **work per day** instead: each painter's share makes the job faster, not slower.",
        is_correct: false,
      },
      {
        id: "c",
        body: "7.2 days",
        explanation:
          "Right. Per day, Ravi does `1/12` and Suresh `1/18`. Together that's `3/36 + 2/36 = 5/36`, so the wall takes `36/5` = **7.2 days**.",
        is_correct: true,
      },
      {
        id: "d",
        body: "6 days",
        explanation:
          "That's 12 ÷ 2, as if Suresh were as fast as Ravi. He's slower, so together they take a little longer than 6 days.",
        is_correct: false,
      },
      {
        id: "e",
        body: "12 days",
        explanation: "That's Ravi alone. With Suresh helping, the wall is finished **sooner**.",
        is_correct: false,
      },
      {
        id: "f",
        body: "9 days",
        explanation:
          "That's 18 ÷ 2, as if Ravi were as slow as Suresh. He's faster, so together they need less than 9 days.",
        is_correct: false,
      },
    ],
  },
  {
    category: { title: "Logical Reasoning", icon: "puzzle" },
    title: "The Girl in the Photo",
    difficulty: "medium",
    topic: "Blood Relations",
    description: `Pointing to a girl in a photo, **Arjun** says:

> "She is the daughter of my father's father's **only son**."

How is the girl related to Arjun?`,
    hints: ["Who is Arjun's father's father's only son **to Arjun**? Work back from there."],
    options: [
      {
        id: "a",
        body: "Cousin",
        explanation:
          "A cousin would be the child of an uncle or aunt. Arjun's father's father has **only one son**, Arjun's father, so there's no uncle on this side.",
        is_correct: false,
      },
      {
        id: "b",
        body: "Sister",
        explanation:
          "Right. Arjun's father's father's only son is Arjun's **father**, and his father's daughter is Arjun's **sister**.",
        is_correct: true,
      },
      {
        id: "c",
        body: "Mother",
        explanation:
          "His mother would be the son's **wife**, not his daughter. Read each link of the relation in turn.",
        is_correct: false,
      },
      {
        id: "d",
        body: "Aunt",
        explanation:
          "An aunt would be his father's father's **daughter**. Here she is the daughter of that man's son, one generation lower.",
        is_correct: false,
      },
    ],
  },
  {
    category: { title: "Quantitative Aptitude", icon: "calculator" },
    title: "Mark Up, Then Discount",
    difficulty: "medium",
    topic: "Profit and Loss",
    description: `A shopkeeper in **Madurai** buys a mixer grinder for **₹400**. He marks it **25%** above that, then gives a
customer a **10%** discount on the marked price.

What is his profit percentage?`,
    hints: [
      "Find the marked price first: ₹400 plus 25% of ₹400.",
      "The 10% discount is taken off the **marked** price, which gives the selling price.",
      "Profit percentage = profit ÷ **cost price** × 100.",
    ],
    options: [
      {
        id: "a",
        body: "15%",
        explanation:
          "That's 25 − 10. The discount is on the **marked** price (₹500), not the cost, so percentages can't be subtracted like that.",
        is_correct: false,
      },
      {
        id: "b",
        body: "10%",
        explanation:
          "That's ₹50 as a share of the **marked** price, ₹500. Profit percentage is always worked out on the **cost**.",
        is_correct: false,
      },
      {
        id: "c",
        body: "11.1%",
        explanation:
          "That's ₹50 as a share of the **selling** price, ₹450. Profit percentage is always worked out on the **cost**.",
        is_correct: false,
      },
      {
        id: "d",
        body: "12.5%",
        explanation:
          "Right. Marked price = ₹400 + 25% = ₹500. After 10% off he sells at ₹450, a profit of ₹50 on ₹400 = **12.5%**.",
        is_correct: true,
      },
      {
        id: "e",
        body: "25%",
        explanation:
          "That's only the mark-up. The 10% discount takes part of it back before the customer pays.",
        is_correct: false,
      },
    ],
  },
];

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
 * Where the student is in MCQ. WorkspaceScreen keeps it, so leaving MCQ and coming back carries on where it was: the
 * same question, its waits still running (leaving doesn't skip them), and the same hints opened.
 */
export interface McqProgress {
  /** Which of SAMPLES. */
  index: number;
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

/** A fresh start on question `index`, its options in a different order and colours from `previous`'s. */
export function startMcq(index = 0, previous?: McqProgress): McqProgress {
  const ids = SAMPLES[index].options.map((o) => o.id);
  return {
    index,
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

/**
 * MCQ: multiple-choice questions (aptitude first), answered one at a time
 * until the right option is picked. Always uses the whole main area, with no
 * sidebar column: a card in the middle, with the question on the left and
 * its options on the right. See user_doc/practice-mcq.md.
 */
export function McqScreen({
  progress,
  onChange,
}: {
  progress: McqProgress;
  onChange: Dispatch<SetStateAction<McqProgress>>;
}) {
  const { index, order, colors, selected, missed, solved, hintsOpen, hintsShown, lastHintAt } =
    progress;
  const question = SAMPLES[index];
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

  // The next sample, back to the first after the last.
  function next() {
    onChange((p) => startMcq((p.index + 1) % SAMPLES.length, p));
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
              <McqPanel
                title={
                  <>
                    <CategoryIcon name={question.category.icon} />
                    {question.category.title}
                  </>
                }
                footer={
                  <span className="mr-auto text-sm text-muted-foreground tabular-nums">
                    Question {index + 1} of {SAMPLES.length}
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
                    <Button onClick={next}>Next</Button>
                  ) : solved ? (
                    <Button disabled={wait > 0} onClick={next}>
                      Next
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
