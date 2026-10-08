import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { AuthHeader } from "@/components/auth-header";
import { GitHubSignInDialog } from "@/components/github-sign-in-dialog";
import { GitHubIcon } from "@/components/github-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  cancelGitHubSignIn,
  finishGitHubSignIn,
  guestLogin,
  startGitHubSignIn,
  type SignInLink,
  type Session,
} from "@/lib/auth";

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Set while the student approves prepcode on GitHub in the browser.
  const [link, setLink] = useState<SignInLink | null>(null);

  async function handleGitHub() {
    setError("");
    setBusy(true);
    try {
      setLink(await startGitHubSignIn());
      const session = await finishGitHubSignIn();
      if (session) onAuthenticated(session);
    } catch (err) {
      setError(String(err));
    } finally {
      setLink(null);
      setBusy(false);
    }
  }

  function handleCancel() {
    // finishGitHubSignIn then resolves to null, which ends handleGitHub.
    cancelGitHubSignIn().catch((err) => console.error("Cancel failed:", err));
    setLink(null);
  }

  async function handleGuest() {
    setError("");
    setBusy(true);
    try {
      const session = await guestLogin();
      toast("You're using prepcode as a guest", {
        description: "Your files will be deleted when you log out or close prepcode.",
        duration: 8000,
      });
      onAuthenticated(session);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      <AuthHeader subtitle="Sign in to save your code to GitHub." />

      <div className="flex w-full flex-col gap-3">
        <Button size="lg" className="w-full" disabled={busy} onClick={handleGitHub}>
          {busy && link === null ? <Spinner /> : <GitHubIcon />}
          Sign in with GitHub
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={handleGuest}
        >
          Continue as guest
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
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

      <GitHubSignInDialog link={link} onCancel={handleCancel} />
    </div>
  );
}
