import { FileIcon } from "@/components/file-icon";
import { NotInstalledRow } from "@/components/not-installed-row";
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
import type { Language } from "@/lib/languages";

/**
 * Picks the language to solve a question in. Only installed languages can be
 * picked; the others show a Download button, and are picked once downloaded.
 */
export function LanguagePicker({
  installed,
  notInstalled,
  value,
  onPick,
  disabled,
}: {
  installed: Language[];
  notInstalled: Language[];
  value: Language | null;
  onPick: (extension: string) => void;
  disabled: boolean;
}) {
  return (
    <Select
      items={installed.map((lang) => ({ value: lang.extension, label: lang.name }))}
      value={value?.extension ?? null}
      onValueChange={(extension) => {
        if (extension) onPick(extension);
      }}
    >
      {/* Borderless, like the ghost Reset button beside it. */}
      <SelectTrigger
        size="sm"
        disabled={disabled}
        className="border-transparent bg-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted data-popup-open:bg-muted dark:bg-transparent dark:hover:bg-muted/50"
      >
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
                onInstalled={() => onPick(lang.extension)}
              />
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
