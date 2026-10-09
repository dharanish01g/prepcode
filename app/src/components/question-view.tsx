import Editor from "@monaco-editor/react";
import { ConsolePanel } from "@/components/console-panel";
import { Markdown } from "@/components/markdown";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsDark } from "@/hooks/use-theme";
import type { Language } from "@/lib/languages";
import type { Question } from "@/lib/questions";
import { starterCode } from "@/lib/starter-code";
import {
  blockClipboard,
  EDITOR_FONT_SIZE,
  EDITOR_PADDING,
  NO_CLIPBOARD_OPTIONS,
} from "@/lib/monaco";

/**
 * A question being solved: the question and its explanation on the left, the
 * code with its output below on the right.
 */
export function QuestionView({
  question,
  language,
}: {
  question: Question;
  /** The picked language; null until one is installed. */
  language: Language | null;
}) {
  const isDark = useIsDark();

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel id="question" defaultSize="45%" minSize="25%">
        <Tabs defaultValue="question" className="h-full min-h-0 gap-0">
          <div className="flex shrink-0 items-center border-b px-2">
            <TabsList variant="line">
              <TabsTrigger value="question">Question</TabsTrigger>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="question" className="min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h1 className="mb-3 text-base font-semibold">{question.title}</h1>
                <Markdown>{question.description}</Markdown>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="explanation" className="min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <Markdown>{question.explanation}</Markdown>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />

      <ResizablePanel id="code" defaultSize="55%" minSize="30%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel id="editor" defaultSize="70%" minSize="20%">
            <Editor
              // One model per question and language, so switching either keeps
              // what was typed, until logout disposes every model.
              path={language ? `practice/${question.slug}.${language.extension}` : undefined}
              defaultValue={language ? starterCode(language.extension) : ""}
              language={language?.monaco ?? "plaintext"}
              keepCurrentModel
              theme={isDark ? "vs-dark" : "light"}
              loading={null}
              onMount={blockClipboard}
              options={{
                ...NO_CLIPBOARD_OPTIONS,
                fontSize: EDITOR_FONT_SIZE,
                padding: EDITOR_PADDING,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          {/* Not connected to running yet. */}
          <ResizablePanel id="console" defaultSize="30%" minSize="10%">
            <ConsolePanel
              entries={[]}
              loading={false}
              running={false}
              acceptingInput={false}
              onSend={() => {}}
              onClear={() => {}}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
