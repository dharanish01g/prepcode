import { useState } from "react";
import Editor from "@monaco-editor/react";
import { FlaskConicalIcon, TerminalIcon, TextCursorInputIcon } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { DifficultyBadge } from "@/components/practice-list";
import { Badge } from "@/components/ui/badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIsDark } from "@/hooks/use-theme";
import { findLanguage } from "@/lib/languages";
import {
  blockClipboard,
  EDITOR_FONT_SIZE,
  EDITOR_PADDING,
  NO_CLIPBOARD_OPTIONS,
} from "@/lib/monaco";
import type { Question } from "@/lib/practice";

/** The question on the left; the editor and its input, output and tests on the right. */
export function PracticeQuestion({
  question,
  extension,
}: {
  question: Question;
  /** The language being written in, e.g. "py". */
  extension: string;
}) {
  const isDark = useIsDark();
  // The custom input for Run, starting as the first sample.
  const [input, setInput] = useState(question.samples[0]?.input ?? "");

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel defaultSize="40%" minSize="20%">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{question.title}</h1>
              <DifficultyBadge difficulty={question.difficulty} />
            </div>
            <Markdown>{question.description + samplesMarkdown(question)}</Markdown>
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%" minSize="30%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="65%" minSize="20%">
            <Editor
              // One model per question and language, kept while switching.
              path={`practice/${question.slug}.${extension}`}
              defaultValue={question.starterCode[extension] ?? ""}
              language={findLanguage(extension)?.monaco ?? "plaintext"}
              theme={isDark ? "vs-dark" : "light"}
              keepCurrentModel
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
          <ResizablePanel defaultSize="35%" minSize="10%">
            <Tabs defaultValue="input" className="h-full gap-0">
              <div className="shrink-0 border-b px-4 py-1">
                <TabsList variant="line">
                  <TabsTrigger value="input">
                    <TextCursorInputIcon />
                    Input
                  </TabsTrigger>
                  <TabsTrigger value="output">
                    <TerminalIcon />
                    Output
                  </TabsTrigger>
                  <TabsTrigger value="tests">
                    <FlaskConicalIcon />
                    Tests
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="input" className="min-h-0 p-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  placeholder="Input for your program when you press Run"
                  spellCheck={false}
                  className="h-full resize-none font-mono"
                />
              </TabsContent>
              <TabsContent value="output" className="min-h-0">
                <ScrollArea className="h-full">
                  <pre className="p-4 font-mono text-xs text-muted-foreground">
                    Press Run to see your program's output here.
                  </pre>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="tests" className="min-h-0">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-3 p-4">
                    {question.samples.map((sample, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 font-medium">
                          Test {i + 1}
                          <Badge variant="outline">Not run</Badge>
                        </div>
                        <pre className="font-mono text-muted-foreground">
                          Input: {sample.input}
                          {"\n"}Expected: {sample.output}
                        </pre>
                      </div>
                    ))}
                    <p className="text-muted-foreground">
                      Press Submit to check your code against every test.
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** The samples as markdown examples, shown after the description. */
function samplesMarkdown(question: Question) {
  return question.samples
    .map(
      (sample, i) =>
        `\n\n## Example ${i + 1}\n\n**Input**\n\n\`\`\`\n${sample.input}\n\`\`\`\n\n**Output**\n\n\`\`\`\n${sample.output}\n\`\`\``,
    )
    .join("");
}
