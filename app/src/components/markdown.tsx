import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// shadcn's typography styles, sized down to the app's text-sm so a question
// reads like the rest of the app. Spacing comes from the wrapper's gap.
const COMPONENTS: Components = {
  h1: ({ node: _, ...props }) => <h1 className="text-base font-semibold" {...props} />,
  h2: ({ node: _, ...props }) => <h2 className="mt-2 text-sm font-semibold" {...props} />,
  h3: ({ node: _, ...props }) => <h3 className="text-sm font-medium" {...props} />,
  p: ({ node: _, ...props }) => <p className="leading-relaxed" {...props} />,
  a: ({ node: _, ...props }) => (
    <a className="font-medium text-primary underline underline-offset-4" {...props} />
  ),
  strong: ({ node: _, ...props }) => <strong className="font-semibold" {...props} />,
  ul: ({ node: _, ...props }) => <ul className="ml-5 list-disc [&>li]:mt-1" {...props} />,
  ol: ({ node: _, ...props }) => <ol className="ml-5 list-decimal [&>li]:mt-1" {...props} />,
  blockquote: ({ node: _, ...props }) => (
    <blockquote className="border-l-2 pl-4 text-muted-foreground italic" {...props} />
  ),
  hr: ({ node: _, ...props }) => <hr className="border-border" {...props} />,
  // Inline code, at the editor's 13px. Inside a code block, the block's styles override it.
  code: ({ node: _, ...props }) => (
    <code
      className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.8125rem]"
      {...props}
    />
  ),
  pre: ({ node: _, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-[0.8125rem] leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  table: ({ node: _, ...props }) => (
    <div className="w-full overflow-x-auto">
      <table className="w-full" {...props} />
    </div>
  ),
  th: ({ node: _, ...props }) => (
    <th className="border px-3 py-1.5 text-left font-medium" {...props} />
  ),
  td: ({ node: _, ...props }) => <td className="border px-3 py-1.5" {...props} />,
};

/** Renders a question's or job's markdown in the app's theme. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
