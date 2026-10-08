import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { AuthHeader } from "@/components/auth-header";
import { BrowserSignInDialog, type BrowserProvider } from "@/components/browser-sign-in-dialog";
import { GitHubIcon } from "@/components/github-icon";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  cancelSignIn,
  discardWaitingAccount,
  finishSignIn,
  guestLogin,
  startGitHubConnect,
  startGitHubSignIn,
  startGoogleLink,
  startGoogleSignIn,
  type Session,
  type SignInLink,
} from "@/lib/auth";

/**
 * Where the student is: choosing how to sign in, or (after Google, for an
 * account with no GitHub yet) connecting GitHub, which may use another email.
 */
type View = { name: "sign-in" } | { name: "connect-github"; email: string | null; taken: boolean };

type Busy = BrowserProvider | "guest" | "connect" | "switch" | "cancel";

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [view, setView] = useState<View>({ name: "sign-in" });
  const [error, setError] = useState("");
  // Which button is working, so only that one shows a spinner.
  const [busy, setBusy] = useState<Busy | null>(null);
  // Set while the student approves prepcode in the browser.
  const [link, setLink] = useState<SignInLink | null>(null);
  const [provider, setProvider] = useState<BrowserProvider>("GitHub");

  /** One trip to the browser: opens it, then waits for it to come back. */
  async function inBrowser(which: BrowserProvider, start: () => Promise<SignInLink>) {
    setProvider(which);
    try {
      setLink(await start());
      return await finishSignIn();
    } finally {
      setLink(null);
    }
  }

  async function run(what: Busy, task: () => Promise<void>) {
    setError("");
    setBusy(what);
    try {
      await task();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  function signIn(which: BrowserProvider) {
    return run(which, async () => {
      const result = await inBrowser(
        which,
        which === "GitHub" ? startGitHubSignIn : startGoogleSignIn,
      );
      if (result?.kind === "signedIn") onAuthenticated(result.session);
      else if (result?.kind === "needsGitHub")
        setView({ name: "connect-github", email: result.email, taken: false });
    });
  }

  /** After Google: connect GitHub to the new account. */
  function connectGitHub(email: string | null) {
    return run("connect", async () => {
      const result = await inBrowser("GitHub", startGitHubConnect);
      if (result?.kind === "signedIn") onAuthenticated(result.session);
      else if (result?.kind === "gitHubTaken")
        setView({ name: "connect-github", email, taken: true });
    });
  }

  /**
   * The GitHub already has a prepcode account: drop the new Google one, sign in
   * to that account with GitHub, then add the Gmail to it.
   */
  function useExistingAccount() {
    return run("switch", async () => {
      await discardWaitingAccount();
      setView({ name: "sign-in" });
      const signedIn = await inBrowser("GitHub", startGitHubSignIn);
      if (signedIn?.kind !== "signedIn") return;
      try {
        const linked = await inBrowser("Google", startGoogleLink);
        if (linked?.kind === "signedIn") {
          toast.success("Gmail connected", {
            description: "You can sign in with Google from now on.",
          });
        } else {
          toast("Gmail not connected", {
            description: "You can connect it later in Profile → Gmail.",
          });
        }
      } catch (err) {
        toast.error("Couldn't connect Gmail", {
          description: `${String(err)} You can connect it later in Profile → Gmail.`,
        });
      }
      onAuthenticated(signedIn.session);
    });
  }

  /** Back to the start: the new Google account is deleted. */
  function startOver() {
    return run("cancel", async () => {
      await discardWaitingAccount();
      setView({ name: "sign-in" });
    });
  }

  function handleCancel() {
    // finishSignIn then resolves to null, which ends the trip.
    cancelSignIn().catch((err) => console.error("Cancel failed:", err));
    setLink(null);
  }

  function handleGuest() {
    return run("guest", async () => {
      const session = await guestLogin();
      toast("You're using prepcode as a guest", {
        description: "Your files will be deleted when you log out or close prepcode.",
        duration: 8000,
      });
      onAuthenticated(session);
    });
  }

  const spinning = (what: Busy) => busy === what && link === null;
  const dialog = <BrowserSignInDialog provider={provider} link={link} onCancel={handleCancel} />;
  const errorText = error && <p className="text-xs text-destructive">{error}</p>;

  if (view.name === "connect-github") {
    const who = view.email ? <span className="text-foreground">{view.email}</span> : "Google";
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <AuthHeader
          subtitle={view.taken ? "This GitHub already has an account." : "One more step."}
        />
        <div className="flex w-full flex-col gap-3">
          {view.taken ? (
            <>
              <p className="text-sm text-muted-foreground">
                The GitHub you chose is already connected to a prepcode account. Sign in with it,
                and we'll add {who} to that account.
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={busy !== null}
                onClick={useExistingAccount}
              >
                {spinning("switch") ? <Spinner /> : <GitHubIcon />}
                Sign in with that GitHub
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={busy !== null}
                onClick={() => connectGitHub(view.email)}
              >
                {spinning("connect") && <Spinner />}
                Connect a different GitHub
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You're signed in with {who}. Connect your GitHub account to save your programs
                there. It can use a different email.
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={busy !== null}
                onClick={() => connectGitHub(view.email)}
              >
                {spinning("connect") ? <Spinner /> : <GitHubIcon />}
                Connect GitHub
              </Button>
            </>
          )}
          <Button variant="ghost" disabled={busy !== null} onClick={startOver}>
            {spinning("cancel") && <Spinner />}
            Cancel
          </Button>
          {errorText}
        </div>
        <p className="text-sm text-muted-foreground">
          Don't have a GitHub account?{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() => openUrl("https://github.com/signup")}
          >
            Sign up on GitHub
          </Button>
        </p>
        {dialog}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      <AuthHeader subtitle="Sign in to save your code to GitHub." />

      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          className="w-full"
          disabled={busy !== null}
          onClick={() => signIn("GitHub")}
        >
          {spinning("GitHub") ? <Spinner /> : <GitHubIcon />}
          Sign in with GitHub
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={busy !== null}
          onClick={() => signIn("Google")}
        >
          {spinning("Google") ? <Spinner /> : <GoogleIcon />}
          Continue with Google
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={busy !== null}
          onClick={handleGuest}
        >
          {busy === "guest" && <Spinner />}
          Continue as guest
        </Button>
        {errorText}
      </div>

      <p className="text-sm text-muted-foreground">
        Don't have a GitHub account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={() => openUrl("https://github.com/signup")}
        >
          Sign up on GitHub
        </Button>
      </p>

      {dialog}
    </div>
  );
}
