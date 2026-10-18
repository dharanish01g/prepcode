import { Fragment } from "react";
import { FolderIcon, StarIcon } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Section } from "@/lib/practice";
import { useCategoryQuestionsQuery, type QuestionSummary } from "@/lib/questions";
import { cn } from "@/lib/utils";

const ICON_NAMES: ReadonlySet<string> = new Set(iconNames);

/**
 * A category's icon: any Lucide icon, by the name in its `icon` column (e.g.
 * "baby"), loaded when first shown. A name Lucide doesn't have, or none,
 * shows a folder, as does any icon while it loads.
 */
export function CategoryIcon({ name }: { name: string | null }) {
  if (!name || !ICON_NAMES.has(name)) return <FolderIcon />;
  return <DynamicIcon name={name as IconName} fallback={() => <FolderIcon />} />;
}

/**
 * The centered column every Practice list sits in, so the category cards and
 * the question list line up: exactly four cards wide (4 × 14rem cards, 3 × 1rem
 * gaps, 2 × 1rem padding).
 */
export const PRACTICE_COLUMN = "mx-auto w-full max-w-[61rem] p-4";

// Fixed-size columns, centered when fewer than four fit. Cards sized by the
// window would resize on every frame while the sidebar column slides shut.
const CARD_GRID = "grid grid-cols-[repeat(auto-fill,--spacing(56))] justify-center gap-4";

/** The categories as square cards under their sections. Click one to open its questions. */
export function PracticeCategories({
  sections,
  solved,
  onOpen,
}: {
  sections: Section[];
  /** The questions the student has solved, by slug. */
  solved: ReadonlySet<string>;
  onOpen: (category: Category) => void;
}) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      {/* One grid: each heading spans a whole row, so it lines up with the
          first card below it. */}
      <div className={cn(PRACTICE_COLUMN, CARD_GRID)}>
        {sections
          .filter((section) => section.categories.length > 0)
          .map((section, i) => (
            <Fragment key={section.slug}>
              <h2 className={cn("col-span-full text-sm font-medium", i > 0 && "mt-4")}>
                {section.title}
              </h2>
              {section.categories.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  solved={solved}
                  onOpen={() => onOpen(category)}
                />
              ))}
            </Fragment>
          ))}
      </div>
    </ScrollArea>
  );
}

/**
 * A category's card. One with no questions yet says it's coming soon and
 * doesn't open; while its list loads, or if that failed, it still opens (the
 * question list then says what's wrong).
 */
function CategoryCard({
  category,
  solved,
  onOpen,
}: {
  category: Category;
  solved: ReadonlySet<string>;
  onOpen: () => void;
}) {
  // The same list the category shows when opened, so opening it is instant.
  const questions = useCategoryQuestionsQuery(category.slug);
  const comingSoon = questions.data?.length === 0;
  return (
    <button
      type="button"
      disabled={comingSoon}
      className="group/open cursor-pointer text-left outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default"
      onClick={onOpen}
    >
      <Card
        className={cn("size-56 transition-colors", !comingSoon && "group-hover/open:bg-muted/50")}
      >
        <CardHeader>
          {category.logoUrl ? (
            <img src={category.logoUrl} alt="" className="size-4" />
          ) : (
            <CategoryIcon name={category.icon} />
          )}
          <CardTitle>{category.title}</CardTitle>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto gap-2 text-xs tabular-nums">
          {questions.isPending ? (
            <Skeleton className="h-4 w-28" />
          ) : comingSoon ? (
            <span className="text-muted-foreground">Coming soon</span>
          ) : (
            questions.data && <CategoryProgress questions={questions.data} solved={solved} />
          )}
          {category.premium && (
            <StarIcon
              aria-label="Paid content"
              className="ml-auto size-3.5 shrink-0 fill-amber-500 text-amber-500"
            />
          )}
        </CardFooter>
      </Card>
    </button>
  );
}

/**
 * How far the student is in a category: what's left to do, so they can pick
 * where to go next, and what's done.
 */
function CategoryProgress({
  questions,
  solved,
}: {
  questions: QuestionSummary[];
  solved: ReadonlySet<string>;
}) {
  // Locked questions can't be solved yet, so they don't count.
  const open = questions.filter((question) => !question.locked);
  const total = open.length;
  const done = open.filter((question) => solved.has(question.slug)).length;
  if (total === 0) {
    return (
      <span className="text-muted-foreground">
        {questions.length} locked {questions.length === 1 ? "question" : "questions"}
      </span>
    );
  }
  if (done === total) {
    return (
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        All {total} completed
      </span>
    );
  }
  return (
    <>
      <span className="font-medium">{total - done} pending</span>
      <span className="text-muted-foreground">
        {done}/{total} completed
      </span>
    </>
  );
}

/** Stands in for the cards while they load from Supabase. */
export function PracticeCategoriesSkeleton() {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className={cn(PRACTICE_COLUMN, CARD_GRID)}>
        {[0, 1].map((section) => (
          <Fragment key={section}>
            <Skeleton className={cn("col-span-full h-5 w-40", section > 0 && "mt-4")} />
            {[0, 1, 2, 3].map((card) => (
              <Skeleton key={card} className="size-56" />
            ))}
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  );
}
