import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { repoSetup, type RepoSetup } from "@/lib/sync";

/** How often to check again while the student is on GitHub, and for how long. */
const POLL_MS = 5_000;
const POLL_FOR_MS = 10 * 60_000;

/** What the student does on the GitHub page prepcode opened. */
const ON_GITHUB: Record<"needsInstall" | "needsAccess" | "needsApproval", string> = {
  needsInstall:
    "Click Install there. prepcode then creates your prepcode-programs repository by itself.",
  needsAccess: "Only your prepcode-programs repository is selected. Click Install or Save there.",
  needsApproval:
    "Accept prepcode's new permissions there, so it can create your prepcode-programs repository.",
};

/**
 * Gets a student's GitHub ready for syncing by itself: checks their
 * prepcode-programs repo and prepcode's access, and opens the one GitHub page
 * that's left (installing the prepcodes app; prepcode creates the repo).
 * Checks again when the student comes back from GitHub, and calls `onReady`
 * once it's done.
 */
export function RepoSetupSteps({
  onReady,
  onSkip,
  skipLabel,
}: {
  onReady: () => void;
  /** Shown only when the check itself fails (e.g. offline). */
  onSkip: () => void;
  skipLabel: string;
}) {
  // Null until the first check has answered.
  const [setup, setSetup] = useState<RepoSetup | null>(null);
  const [checking, setChecking] = useState(false);
  // Until when to keep checking after GitHub was opened.
  const [pollUntil, setPollUntil] = useState(0);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const inFlight = useRef(false);
  // Each GitHub page is opened by itself only once; after that it's the button.
  const opened = useRef(new Set<string>());

  const openGitHub = useCallback((url: string) => {
    opened.current.add(url);
    setPollUntil(Date.now() + POLL_FOR_MS);
    openUrl(url).catch((err) =>
      toast.error("Couldn't open your browser", { description: String(err) }),
    );
  }, []);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    try {
      const next = await repoSetup();
      setSetup(next);
      if (next.kind === "ready") onReadyRef.current();
      else if ("url" in next && !opened.current.has(next.url)) openGitHub(next.url);
    } catch (err) {
      setSetup({ kind: "unknown", message: String(err) });
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, [openGitHub]);

  useEffect(() => {
    check();
  }, [check]);

  // Coming back from the browser is the usual moment it's done.
  useEffect(() => {
    const listening = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) check();
    });
    return () => {
      listening.then((stop) => stop());
    };
  }, [check]);

  const waiting = setup !== null && "url" in setup;
  useEffect(() => {
    if (!waiting || pollUntil <= Date.now()) return;
    const timer = setInterval(() => {
      if (Date.now() > pollUntil) clearInterval(timer);
      else check();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, pollUntil, check]);

  if (setup === null || setup.kind === "ready") {
    return (
      <p className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Spinner />
        Setting up your GitHub…
      </p>
    );
  }

  if (setup.kind === "unknown") {
    return (
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm text-muted-foreground">Couldn't check your GitHub: {setup.message}</p>
        <Button size="lg" className="w-full" disabled={checking} onClick={check}>
          {checking && <Spinner />}
          Try again
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          {skipLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        prepcode saves your programs to a public repository called{" "}
        <span className="font-medium text-foreground">prepcode-programs</span> on your GitHub.
        GitHub is open in your browser. {ON_GITHUB[setup.kind]}
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Waiting for GitHub…
      </p>
      <Button variant="outline" className="w-full" onClick={() => openGitHub(setup.url)}>
        <ExternalLinkIcon />
        Open GitHub again
      </Button>
    </div>
  );
}
