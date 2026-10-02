import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders a question's markdown with Tailwind Typography's default styles. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
