import { useState } from "react";
import { PlayIcon, SendIcon, WifiOffIcon } from "lucide-react";
import { toast } from "sonner";
import { FileIcon } from "@/components/file-icon";
import { PracticeCategories, PracticeCategoriesSkeleton } from "@/components/practice-categories";
import { PracticeList } from "@/components/practice-list";
import { PracticeQuestion } from "@/components/practice-question";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLanguages } from "@/lib/languages";
import { QUESTIONS, useSectionsQuery } from "@/lib/practice";

/** Practice: the categories, then a category's questions, then the one being solved. */
export function PracticeScreen() {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [extension, setExtension] = useState("py");
  const sections = useSectionsQuery();
  const category = sections.data
    ?.flatMap((section) => section.categories)
    .find((c) => c.slug === categorySlug);
  const questions = QUESTIONS.filter((q) => q.category === categorySlug);
  const question = questions.find((q) => q.slug === slug);
  const languages = getLanguages("program");

  function showCategories() {
    setCategorySlug(null);
    setSlug(null);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {category ? (
                <BreadcrumbLink render={<button type="button" />} onClick={showCategories}>
                  Practice
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Practice</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {question ? (
                    <BreadcrumbLink render={<button type="button" />} onClick={() => setSlug(null)}>
                      {category.title}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{category.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {question && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{question.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        {question && (
          <>
            <Select
              items={languages.map((lang) => ({ value: lang.extension, label: lang.name }))}
              value={extension}
              onValueChange={(value) => {
                if (value) setExtension(value);
              }}
            >
              <SelectTrigger className="ml-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.extension} value={lang.extension}>
                    <FileIcon extension={lang.extension} />
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info("Running isn't connected yet.")}>
              <PlayIcon />
              Run
            </Button>
            <Button onClick={() => toast.info("Submitting isn't connected yet.")}>
              <SendIcon />
              Submit
            </Button>
          </>
        )}
      </header>
      {question ? (
        // Keyed so the custom input starts fresh for each question.
        <PracticeQuestion key={question.slug} question={question} extension={extension} />
      ) : category ? (
        // Keyed so the search starts empty for each category.
        <PracticeList
          key={category.slug}
          details={category.details}
          questions={questions}
          onSelect={setSlug}
        />
      ) : sections.isPending ? (
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
        <PracticeCategories
          sections={sections.data}
          questions={QUESTIONS}
          onSelect={setCategorySlug}
        />
      )}
    </>
  );
}
