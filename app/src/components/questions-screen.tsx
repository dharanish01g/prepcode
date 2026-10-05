import { useState } from "react";
import { PlayIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { FileIcon } from "@/components/file-icon";
import { NotInstalledRow } from "@/components/not-installed-row";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QuestionView } from "@/components/question-view";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getLanguages } from "@/lib/languages";
import { QUESTIONS } from "@/lib/questions";
import { useInstalledRuntimes } from "@/lib/runtimes";

/**
 * Questions: where the practice question screens are built for now. They'll
 * move into Practice, opened from a category. The questions are listed in the
 * sidebar; the open one shows here.
 */
export function QuestionsScreen({ selectedQuestion }: { selectedQuestion: string | null }) {
  const question = QUESTIONS.find((q) => q.slug === selectedQuestion);
  const runtimes = useInstalledRuntimes();
  const languages = getLanguages("program");
  const installed = languages.filter((lang) => runtimes.data?.includes(lang.extension));
  const notInstalled = languages.filter((lang) => !runtimes.data?.includes(lang.extension));
  const [pickedExtension, setPickedExtension] = useState<string | null>(null);
  // The first installed language until the student picks one. Kept across
  // questions, so they don't pick it again for each.
  const language =
    installed.find((lang) => lang.extension === pickedExtension) ?? installed[0] ?? null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {question ? "Questions" : <BreadcrumbPage>Questions</BreadcrumbPage>}
            </BreadcrumbItem>
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
              value={language?.extension ?? null}
              onValueChange={(value) => {
                if (value) setPickedExtension(value);
              }}
            >
              <SelectTrigger className="ml-auto" disabled={runtimes.isPending}>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {installed.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Installed</SelectLabel>
                    {installed.map((lang) => (
                      <SelectItem key={lang.extension} value={lang.extension}>
                        <FileIcon extension={lang.extension} />
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {installed.length > 0 && notInstalled.length > 0 && <SelectSeparator />}
                {notInstalled.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Not installed</SelectLabel>
                    {notInstalled.map((lang) => (
                      <NotInstalledRow
                        key={lang.extension}
                        extension={lang.extension}
                        label={lang.name}
                        onInstalled={() => setPickedExtension(lang.extension)}
                      />
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {/* Not connected yet. */}
            <Button
              variant="outline"
              disabled={!language}
              onClick={() => toast.info("Running isn't connected yet.")}
            >
              <PlayIcon />
              Run
            </Button>
            <Button
              disabled={!language}
              onClick={() => toast.info("Submitting isn't connected yet.")}
            >
              <SendIcon />
              Submit
            </Button>
          </>
        )}
      </header>
      {question ? (
        // Keyed so each question opens on its Question tab.
        <QuestionView key={question.slug} question={question} language={language} />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
    </>
  );
}
