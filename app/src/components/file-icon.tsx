import { FileCodeIcon } from "lucide-react";
import { extensionOf } from "@/lib/files";
import { findLanguage } from "@/lib/languages";
import { cn } from "@/lib/utils";

// Icons come from the language catalog (the bundled ones are from the "Icons –
// Maintained" VS Code theme, MIT, see src-tauri/catalog/ICONS-LICENSE).

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
  extension?: string;
  className?: string;
}) {
  const ext = extension ?? (filename ? extensionOf(filename) : "");
  const icon = findLanguage(ext)?.icon;
  if (!icon) return <FileCodeIcon className={cn("size-4 shrink-0", className)} />;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`;
  return <img src={src} alt="" className={cn("size-4 shrink-0", className)} />;
}
