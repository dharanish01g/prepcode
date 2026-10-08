import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { AuthHeader } from "@/components/auth-header";
import { BrowserSignInDialog, type BrowserProvider } from "@/components/browser-sign-in-dialog";
import { CodeForm, EmailSignInForm, ForgotForm, SignUpForm } from "@/components/email-forms";
import { GitHubIcon } from "@/components/github-icon";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  cancelSignIn,
  discardWaitingAccount,
  emailResendCode,
  emailResetPassword,
  emailSendResetCode,
  emailSignIn,
  emailSignUp,
  emailVerifyCode,
  finishSignIn,
  guestLogin,
  startGitHubConnect,
  startGitHubSignIn,
  startGoogleLink,
  startGoogleSignIn,
  type Session,
  type SignInLink,
  type SignInResult,
} from "@/lib/auth";

/**
 * Where the student is: choosing how to sign in; creating an account with
 * email (then entering the code we email); resetting a password; or, for an
 * account with no GitHub yet (made with Google or email), connecting GitHub,
 * which may use another email.
 */
type View =
  | { name: "sign-in" }
  | { name: "sign-up" }
  | { name: "verify"; email: string }
  | { name: "forgot"; email: string }
  | { name: "reset"; email: string }
  | { name: "connect-github"; email: string | null; taken: boolean };

type Busy =
  | BrowserProvider
  | "guest"
  | "connect"
  | "switch"
  | "cancel"
  | "email"
  | "sign-up"
  | "code"
  | "resend"
  | "forgot";

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

  function go(next: View) {
    setError("");
    setView(next);
  }

  /** Where a sign-in ends up, however it was made. */
  function handleResult(result: SignInResult | null) {
    if (result?.kind === "signedIn") onAuthenticated(result.session);
    else if (result?.kind === "needsGitHub")
      go({ name: "connect-github", email: result.email, taken: false });
    else if (result?.kind === "needsEmailCode") {
      go({ name: "verify", email: result.email });
      toast("Confirm your email first", { description: `We sent a new code to ${result.email}.` });
    }
  }

  function signInWithEmail(email: string, password: string) {
    return run("email", async () => handleResult(await emailSignIn(email, password)));
  }

  function signUp(name: string, email: string, password: string) {
    return run("sign-up", async () => {
      await emailSignUp(email, password, name);
      go({ name: "verify", email: email.trim() });
    });
  }

  function verify(email: string, code: string) {
    return run("code", async () => handleResult(await emailVerifyCode(email, code)));
  }

  function sendResetCode(email: string) {
    return run("forgot", async () => {
      await emailSendResetCode(email);
      go({ name: "reset", email: email.trim() });
    });
  }

  function resetPassword(email: string, code: string, password: string) {
    return run("code", async () => handleResult(await emailResetPassword(email, code, password)));
  }

  /** Resolves to whether a new code was sent. */
  async function resend(send: () => Promise<void>) {
    let sent = false;
    await run("resend", async () => {
      await send();
      sent = true;
      toast.success("New code sent");
    });
    return sent;
  }

  function signIn(which: BrowserProvider) {
    return run(which, async () => {
      const result = await inBrowser(
        which,
        which === "GitHub" ? startGitHubSignIn : startGoogleSignIn,
      );
      handleResult(result);
    });
  }

  /** After Google or email: connect GitHub to the new account. */
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

  /** Back to the start: the new account (Google or email) is deleted. */
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
  const working = busy !== null;
  const back = (label = "Back to sign in") => (
    <Button variant="ghost" disabled={working} onClick={() => go({ name: "sign-in" })}>
      {label}
    </Button>
  );

  if (view.name === "sign-up") {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <AuthHeader subtitle="Create your free account." />
        <div className="flex w-full flex-col gap-3">
          <SignUpForm
            busy={spinning("sign-up")}
            disabled={working}
            onSubmit={signUp}
            onGoogle={() => signIn("Google")}
          />
          {errorText}
          <p className="text-xs text-muted-foreground">
            After confirming your email, you'll connect your GitHub, where prepcode saves your
            programs.
          </p>
          {back("I already have an account")}
        </div>
        {dialog}
      </div>
    );
  }

  if (view.name === "verify" || view.name === "reset") {
    const resetting = view.name === "reset";
    const email = view.email;
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <AuthHeader subtitle={resetting ? "Choose a new password." : "Check your email."} />
        <div className="flex w-full flex-col gap-3">
          <CodeForm
            key={view.name}
            description={
              <>
                We sent a code to <span className="text-foreground">{email}</span>.{" "}
                {resetting
                  ? "Enter it with your new password."
                  : "Enter it to finish creating your account."}{" "}
                Didn't get it? Check your spam folder.
                {!resetting && " If this email already has an account, sign in instead."}
              </>
            }
            submitLabel={resetting ? "Set new password" : "Confirm email"}
            withNewPassword={resetting}
            busy={spinning("code")}
            resending={spinning("resend")}
            disabled={working}
            onSubmit={(code, password) =>
              resetting ? resetPassword(email, code, password) : verify(email, code)
            }
            onResend={() => resend(() => (resetting ? emailSendResetCode : emailResendCode)(email))}
          />
          {errorText}
          {back()}
        </div>
      </div>
    );
  }

  if (view.name === "forgot") {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <AuthHeader subtitle="Reset your password." />
        <div className="flex w-full flex-col gap-3">
          <ForgotForm
            initialEmail={view.email}
            busy={spinning("forgot")}
            disabled={working}
            onSubmit={sendResetCode}
            onGoogle={() => signIn("Google")}
          />
          {errorText}
          {back()}
        </div>
        {dialog}
      </div>
    );
  }

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
        <EmailSignInForm
          busy={spinning("email")}
          disabled={working}
          onSubmit={signInWithEmail}
          onForgot={(email) => go({ name: "forgot", email })}
          onGoogle={() => signIn("Google")}
        />
        <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          or
          <Separator className="flex-1" />
        </div>
        <Button
          variant="outline"
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
        New to prepcode?{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-sm"
          disabled={working}
          onClick={() => go({ name: "sign-up" })}
        >
          Create an account
        </Button>
      </p>

      {dialog}
    </div>
  );
}
