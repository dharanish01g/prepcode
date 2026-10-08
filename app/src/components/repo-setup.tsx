import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheckIcon, ExternalLinkIcon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { repoSetup, type RepoSetup } from "@/lib/sync";

/** How often to check again while the student is on GitHub, and for how long. */
const POLL_MS = 10_000;
const POLL_FOR_MS = 3 * 60_000;

/**
 * The steps that get a student's GitHub ready for syncing: their
 * prepcode-programs repo (prepcode creates it when it can), then giving the
 * prepcodes app access to it. Checks again by itself when the student comes
 * back from GitHub, and calls `onReady` once it's done.
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
  // Until when to keep checking after the student opened GitHub.
  const [pollUntil, setPollUntil] = useState(0);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    try {
      const next = await repoSetup();
      setSetup(next);
      if (next.kind === "ready") onReadyRef.current();
    } catch (err) {
      setSetup({ kind: "unknown", message: String(err) });
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, []);

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

  const waiting = setup?.kind === "needsRepo" || setup?.kind === "needsAccess";
  useEffect(() => {
    if (!waiting || pollUntil <= Date.now()) return;
    const timer = setInterval(() => {
      if (Date.now() > pollUntil) clearInterval(timer);
      else check();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, pollUntil, check]);

  function openGitHub(url: string) {
    setPollUntil(Date.now() + POLL_FOR_MS);
    openUrl(url).catch((err) =>
      toast.error("Couldn't open your browser", { description: String(err) }),
    );
  }

  if (setup === null || setup.kind === "ready") {
    return (
      <p className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Spinner />
        Checking your GitHub…
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

  const hasRepo = setup.kind === "needsAccess";
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        prepcode saves your programs to a public repository called{" "}
        <span className="font-medium text-foreground">prepcode-programs</span> on your GitHub.
      </p>

      <Step number={1} done={hasRepo} title="Create your repository">
        {hasRepo ? (
          <p className="text-xs text-muted-foreground">
            Your prepcode-programs repository is ready.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              GitHub opens with the name filled in. Click Create repository there.
            </p>
            <Button className="w-full" onClick={() => openGitHub(setup.url)}>
              <ExternalLinkIcon />
              Create repository
            </Button>
          </>
        )}
      </Step>

      <Step number={2} done={false} title="Give prepcode access">
        <p className="text-xs text-muted-foreground">
          Only your prepcode-programs repository is selected. Click Install there.
        </p>
        <Button className="w-full" disabled={!hasRepo} onClick={() => openGitHub(setup.url)}>
          <ExternalLinkIcon />
          Give access on GitHub
        </Button>
      </Step>

      <Button variant="outline" disabled={checking} onClick={check}>
        {checking && <Spinner />}
        {checking ? "Checking…" : "I've done it"}
      </Button>
    </div>
  );
}

function Step({
  number,
  done,
  title,
  children,
}: {
  number: number;
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  // The number sits beside the title, so the text and button below use the
  // full width, like the buttons outside the steps.
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {done ? (
          <CircleCheckIcon className="size-5 shrink-0 text-primary" aria-label="Done" />
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">
            {number}
          </span>
        )}
        <p className="text-sm font-medium">{title}</p>
      </div>
      {children}
    </div>
  );
}
