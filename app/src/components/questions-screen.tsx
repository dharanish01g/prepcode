import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, SendIcon } from "lucide-react";
import { passedCount, type CheckState } from "@/components/check-results";
import type { FlushRef } from "@/components/code-editor";
import { LanguagePicker } from "@/components/language-picker";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QuestionView, type CodeRef } from "@/components/question-view";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { celebrate } from "@/lib/celebrate";
import { buildProgram, encodeInput } from "@/lib/drivers";
import { getLanguages } from "@/lib/languages";
import { QUESTIONS } from "@/lib/questions";
import { checkPractice, stopProgram } from "@/lib/run";
import { useInstalledRuntimes } from "@/lib/runtimes";

/**
 * The shortest a Run or Submit shows as loading, so a quick result doesn't
 * flash the loader, and every check looks the same.
 */
const MIN_CHECK_MS = 1000;

/**
 * Questions: where the practice question screens are built for now. They'll
 * move into Practice, opened from a category. The questions are listed in the
 * sidebar; the open one shows here.
 */
export function QuestionsScreen({
  userId,
  selectedQuestion,
  onSelectQuestion,
  flushRef,
}: {
  userId: string;
  selectedQuestion: string | null;
  onSelectQuestion: (slug: string) => void;
  /** Set to a function that saves pending edits (used before logout). */
  flushRef: FlushRef;
}) {
  const index = QUESTIONS.findIndex((q) => q.slug === selectedQuestion);
  const question = index >= 0 ? QUESTIONS[index] : undefined;
  const runtimes = useInstalledRuntimes();
  const languages = getLanguages("program");
  const installed = languages.filter((lang) => runtimes.data?.includes(lang.extension));
  const notInstalled = languages.filter((lang) => !runtimes.data?.includes(lang.extension));
  const [pickedExtension, setPickedExtension] = useState<string | null>(null);
  // The first installed language until the student picks one. Kept across
  // questions, so they don't pick it again for each.
  const language =
    installed.find((lang) => lang.extension === pickedExtension) ?? installed[0] ?? null;
  const codeRef: CodeRef = useRef(() => null);
  // Each question and language keeps its last Run or Submit, keyed like its
  // file, e.g. "fizzbuzz.py".
  const fileKey = question && language ? `${question.slug}.${language.extension}` : null;
  const [checks, setChecks] = useState<Partial<Record<string, CheckState>>>({});
  const check = fileKey ? checks[fileKey] : undefined;
  const checking = Object.values(checks).some((state) => state?.status === "checking");

  /**
   * Runs the code on every example. Submit does the same for now; hidden
   * tests come later.
   */
  async function handleCheck(kind: "run" | "submit") {
    if (!question || !language || !fileKey) return;
    const setCheck = (state: CheckState) => setChecks((prev) => ({ ...prev, [fileKey]: state }));
    const { signature, examples } = question;
    if (!signature || examples.length === 0) {
      setCheck({ status: "error", message: "This question isn't ready to solve yet." });
      return;
    }
    // Saves it too, so what runs is what's kept.
    const code = codeRef.current();
    if (code === null) return;
    setCheck({ status: "checking", kind });
    // Every Run and Submit loads for at least this long, however it ends.
    const minimum = new Promise((resolve) => setTimeout(resolve, MIN_CHECK_MS));
    try {
      const program = buildProgram(signature, language.extension, code, fileKey);
      const inputs = examples.map((example) => encodeInput(signature, example.values));
      const result = await checkPractice(question.slug, language.extension, program, inputs);
      await minimum;
      const done: CheckState = { status: "done", kind, result, examples };
      setCheck(done);
      // Every example passed on Run.
      const count = passedCount(done);
      if (kind === "run" && count && count.passed === count.total) celebrate();
    } catch (err) {
      await minimum;
      setCheck({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        {/* Three columns, so the question number stays centred. */}
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb className="min-w-0">
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
        </div>
        {question && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={index === 0}
              onClick={() => onSelectQuestion(QUESTIONS[index - 1].slug)}
              aria-label="Previous question"
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-14 text-center text-sm tabular-nums">
              {index + 1} / {QUESTIONS.length}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={index === QUESTIONS.length - 1}
              onClick={() => onSelectQuestion(QUESTIONS[index + 1].slug)}
              aria-label="Next question"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
        <div className="flex flex-1 basis-0 items-center justify-end gap-2">
          {question && (
            <>
              {checking ? (
                // One program runs at a time, so Stop ends whichever is going.
                <Button variant="destructive" onClick={() => void stopProgram()}>
                  <Spinner />
                  Stop
                </Button>
              ) : (
                <>
                  <Button variant="outline" disabled={!language} onClick={() => handleCheck("run")}>
                    <PlayIcon />
                    Run
                  </Button>
                  <Button disabled={!language} onClick={() => handleCheck("submit")}>
                    <SendIcon />
                    Submit
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </header>
      {question ? (
        // Keyed so each question opens fresh.
        <QuestionView
          key={question.slug}
          userId={userId}
          question={question}
          language={language}
          flushRef={flushRef}
          codeRef={codeRef}
          check={check}
          languagePicker={
            <LanguagePicker
              installed={installed}
              notInstalled={notInstalled}
              value={language}
              onPick={setPickedExtension}
              disabled={runtimes.isPending}
            />
          }
        />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
    </>
  );
}
