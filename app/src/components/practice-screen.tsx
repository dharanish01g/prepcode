import { WifiOffIcon } from "lucide-react";
import { PracticeCategories, PracticeCategoriesSkeleton } from "@/components/practice-categories";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSectionsQuery } from "@/lib/practice";

/** Practice: the categories under their sections. */
export function PracticeScreen() {
  const sections = useSectionsQuery();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Practice</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {sections.isPending ? (
        <PracticeCategoriesSkeleton />
      ) : sections.isError ? (
        // Most likely offline: the categories come from Supabase.
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WifiOffIcon />
            </EmptyMedia>
            <EmptyTitle>Couldn't load Practice</EmptyTitle>
            <EmptyDescription>Check your internet connection and try again.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => sections.refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <PracticeCategories sections={sections.data} />
      )}
    </>
  );
}
