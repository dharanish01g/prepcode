import { TerminalIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ConsolePanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
        <TerminalIcon className="size-3.5" />
        Console
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {/* Output will stream here once running programs is built. */}
        <pre className="p-4 font-mono text-xs text-muted-foreground">
          Run your program to see its output here.
        </pre>
      </ScrollArea>
    </div>
  );
}
