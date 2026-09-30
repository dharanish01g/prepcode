import { FileCodeIcon } from "lucide-react";
import c from "@/assets/file-icons/c.svg";
import cpp from "@/assets/file-icons/cpp.svg";
import java from "@/assets/file-icons/java.svg";
import js from "@/assets/file-icons/js.svg";
import python from "@/assets/file-icons/python.svg";
import { extensionOf, type Extension } from "@/lib/files";
import { cn } from "@/lib/utils";

// From the "Icons – Maintained" VS Code theme (MIT, see assets/file-icons/LICENSE).
const ICONS: Record<Extension, string> = { py: python, js, c, cpp, java };

/**
 * The language logo for a file or extension, like VS Code's file icons.
 * Rendered as <img> so each SVG keeps its own styles and gradient ids.
 */
export function FileIcon({
  filename,
  extension,
  className,
}: {
  filename?: string;
  extension?: Extension;
  className?: string;
}) {
  const ext = extension ?? (filename ? extensionOf(filename) : "");
  const src = ICONS[ext as Extension];
  if (!src) return <FileCodeIcon className={cn("size-4 shrink-0", className)} />;
  return <img src={src} alt="" className={cn("size-4 shrink-0", className)} />;
}
