import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
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
import type { DeviceCode } from "@/lib/auth";

/**
 * Shows the code to enter on GitHub while prepcode waits for the student to
 * approve it. Open while `code` is set.
 */
export function GitHubCodeDialog({
  code,
  onCancel,
}: {
  code: DeviceCode | null;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Could not copy the code:", err);
    }
  }

  // GitHub has just opened in the browser: have the code ready to paste.
  useEffect(() => {
    if (code) copy(code.user_code);
  }, [code]);

  function openGitHub() {
    if (!code) return;
    openUrl(code.verification_uri).catch((err) =>
      toast.error("Couldn't open your browser", {
        description: `Go to ${code.verification_uri} and enter the code. (${err})`,
      }),
    );
  }

  return (
    <Dialog open={code !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in with GitHub</DialogTitle>
          <DialogDescription>
            GitHub has opened in your browser. Paste this code there (it's already copied) and
            approve prepcode. Check that GitHub shows your own account, not someone else's.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          <span className="font-mono text-3xl font-semibold tracking-widest">
            {code?.user_code}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => code && copy(code.user_code)}
            aria-label="Copy code"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Spinner />
          Waiting for you to approve on GitHub…
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={openGitHub}>
            <ExternalLinkIcon />
            Open GitHub again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
