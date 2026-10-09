import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { splitOutput } from "@/lib/drivers";
import type { Example } from "@/lib/questions";
import { describeRunEnd, type CaseRun, type CheckResult } from "@/lib/run";
import { cn } from "@/lib/utils";

/** Where a Run or Submit is: checking, failed to start, or done. */
export type CheckState =
  | { status: "checking"; kind: "run" | "submit" }
  | { status: "error"; message: string }
  | { status: "done"; kind: "run" | "submit"; result: CheckResult; examples: Example[] };

/** One example's run: what the method returned, and what the code printed itself. */
function outcome(run: CaseRun, example: Example) {
  const { printed, returned } = splitOutput(run.stdout);
  const expected = JSON.stringify(example.expected);
  const passed = !run.timedOut && run.code === 0 && returned === expected;
  return { printed, returned, expected, passed };
}

/** How many examples the last Run or Submit passed, once it has run them. */
export function passedCount(state: CheckState | undefined) {
  if (state?.status !== "done" || state.result.type !== "ran") return null;
  const { cases } = state.result;
  const passed = cases.filter((run, i) => outcome(run, state.examples[i]).passed).length;
  return { passed, total: cases.length };
}

/** What Run or Submit found: a pass or fail for each example. */
export function CheckResults({ state }: { state: CheckState | undefined }) {
  if (!state) {
    return <Message>Run or submit your code to check it against the examples.</Message>;
  }
  if (state.status === "checking") {
    return (
      <Message>
        <Spinner />
        {state.kind === "submit" ? "Submitting…" : "Running the examples…"}
      </Message>
    );
  }
  if (state.status === "error") {
    return <Message className="text-destructive">{state.message}</Message>;
  }

  const { kind, result, examples } = state;
  if (result.type === "stopped") {
    return <Message>Stopped.</Message>;
  }
  if (result.type === "compileFailed") {
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-3 p-4 text-sm">
          <p className="font-medium text-destructive">
            Your code didn't compile. Fix the errors below and try again.
          </p>
          <Output text={result.output} className="text-destructive" />
        </div>
      </ScrollArea>
    );
  }

  const results = result.cases.map((run, i) => ({
    run,
    example: examples[i],
    ...outcome(run, examples[i]),
  }));
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;
  const summary =
    kind === "submit"
      ? allPassed
        ? `Accepted: all ${results.length} examples passed.`
        : `Wrong answer: ${passedCount} of ${results.length} examples passed.`
      : allPassed
        ? `All ${results.length} examples passed.`
        : `${passedCount} of ${results.length} examples passed.`;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p
          className={cn(
            "font-medium",
            allPassed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {summary}
        </p>
        {results.map(({ run, example, printed, returned, expected, passed }, i) => (
          <div key={i} className="border">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5 font-medium">
              Example {i + 1}
              {passed ? (
                <Badge className="bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
                  Passed
                </Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
            <div className="flex flex-col gap-2 p-3">
              <Field label="Input">
                <Output text={example.inputText} />
              </Field>
              <Field label="Expected">
                <Output text={expected} />
              </Field>
              <Field label="Returned">
                <Output text={returned ?? ""} empty="Nothing returned" />
              </Field>
              {/* What the code printed itself, e.g. while debugging. */}
              {printed.trim() && (
                <Field label="Printed">
                  <Output text={printed.replace(/\n+$/, "")} />
                </Field>
              )}
              {run.stderr && (
                <Field label="Errors">
                  <Output text={run.stderr} className="text-destructive" />
                </Field>
              )}
              {run.timedOut ? (
                <p className="text-xs text-destructive">
                  Stopped after 10 seconds. Your code may be stuck in a loop.
                </p>
              ) : (
                run.code !== 0 && (
                  // Worded like the console's last line for a run.
                  <p className="text-xs text-destructive">
                    {
                      describeRunEnd({
                        type: "exit",
                        code: run.code,
                        signal: run.signal,
                        stopped: false,
                        stage: "run",
                      }).label
                    }
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function Message({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full items-center justify-center gap-2 p-4 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Code, values and output, at the editor's 13px, in the same box as the examples. */
function Output({
  text,
  className,
  empty = "Nothing printed",
}: {
  text: string;
  className?: string;
  empty?: string;
}) {
  return (
    <pre
      className={cn(
        "border bg-muted px-3 py-2 font-mono text-[0.8125rem] break-words whitespace-pre-wrap",
        className,
      )}
    >
      {text || <span className="text-muted-foreground italic">{empty}</span>}
    </pre>
  );
}
