import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { SAVE_FILE_MUTATION_KEY } from "@/lib/queries";

export function SaveStatus() {
  const saving = useIsMutating({ mutationKey: SAVE_FILE_MUTATION_KEY }) > 0;
  const statuses = useMutationState({
    filters: { mutationKey: SAVE_FILE_MUTATION_KEY },
    select: (mutation) => mutation.state.status,
  });
  const last = statuses[statuses.length - 1];

  if (saving) return <span className="text-xs text-muted-foreground">Saving…</span>;
  if (last === "error") return <span className="text-xs text-destructive">Save failed</span>;
  if (last === "success") return <span className="text-xs text-muted-foreground">Saved</span>;
  return null;
}
