import { Fragment } from "react";
import {
  BoxesIcon,
  BrainIcon,
  BriefcaseIcon,
  Building2Icon,
  CalculatorIcon,
  CpuIcon,
  DatabaseIcon,
  FolderIcon,
  GlobeIcon,
  PuzzleIcon,
  SpellCheckIcon,
  SquareTerminalIcon,
  StarIcon,
} from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Section } from "@/lib/practice";
import { cn } from "@/lib/utils";

// The icons a category's `icon` column can name. Others show a folder, so add
// an icon here before using it in the database.
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  boxes: <BoxesIcon />,
  brain: <BrainIcon />,
  briefcase: <BriefcaseIcon />,
  "building-2": <Building2Icon />,
  calculator: <CalculatorIcon />,
  cpu: <CpuIcon />,
  database: <DatabaseIcon />,
  globe: <GlobeIcon />,
  puzzle: <PuzzleIcon />,
  "spell-check": <SpellCheckIcon />,
  "square-terminal": <SquareTerminalIcon />,
};

/**
 * The centered column every Practice list sits in, so the category cards and
 * the question list line up: exactly four cards wide (4 × 14rem cards, 3 × 1rem
 * gaps, 2 × 1rem padding).
 */
export const PRACTICE_COLUMN = "mx-auto w-full max-w-[61rem] p-4";

// Fixed-size columns, centered when fewer than four fit. Cards sized by the
// window would resize on every frame while the sidebar column slides shut.
const CARD_GRID = "grid grid-cols-[repeat(auto-fill,--spacing(56))] justify-center gap-4";

/** The categories as square cards under their sections. */
export function PracticeCategories({ sections }: { sections: Section[] }) {
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
                <Card key={category.slug} className="size-56">
                  <CardHeader>
                    {category.logoUrl ? (
                      <img src={category.logoUrl} alt="" className="size-4" />
                    ) : (
                      ((category.icon && CATEGORY_ICONS[category.icon]) ?? <FolderIcon />)
                    )}
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  {category.premium && (
                    <CardFooter className="mt-auto">
                      <StarIcon
                        aria-label="Paid content"
                        className="ml-auto size-3.5 fill-amber-500 text-amber-500"
                      />
                    </CardFooter>
                  )}
                </Card>
              ))}
            </Fragment>
          ))}
      </div>
    </ScrollArea>
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
