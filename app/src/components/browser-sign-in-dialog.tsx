import { ExternalLinkIcon } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { SignInLink } from "@/lib/auth";

export type BrowserProvider = "GitHub" | "Google";

const what: Record<BrowserProvider, string> = {
  GitHub:
    "Approve prepcodes there, and check that GitHub shows your own account, not someone else's.",
  Google: "Choose your own Google account there.",
};

/**
 * Shown while the student signs in with GitHub or Google (or connects Google)
 * in their browser; prepcode carries on by itself when the browser comes
 * back. Open while `link` is set.
 */
export function BrowserSignInDialog({
  provider,
  link,
  onCancel,
}: {
  provider: BrowserProvider;
  link: SignInLink | null;
  onCancel: () => void;
}) {
  function openAgain() {
    if (!link) return;
    openUrl(link.url).catch((err) =>
      toast.error("Couldn't open your browser", { description: String(err) }),
    );
  }

  return (
    <Dialog open={link !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue in your browser</DialogTitle>
          <DialogDescription>
            {provider} has opened in your browser. {what[provider]} prepcode carries on by itself
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <Spinner />
          Waiting for you to finish in your browser…
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={openAgain}>
            <ExternalLinkIcon />
            Open browser again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
