import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { AuthFooter } from "@/components/auth-footer";
import { AuthHeader } from "@/components/auth-header";
import { LoginScreen } from "@/components/login-screen";
import { RepoSetupSteps } from "@/components/repo-setup";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceScreen } from "@/components/workspace-screen";
import { logout, restoreSession, type Session } from "@/lib/auth";
import { disposeEditorModels } from "@/lib/monaco";
import { queryClient } from "@/lib/query-client";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  // A student stays signed in until they log out, so check on launch.
  const [restoring, setRestoring] = useState(true);
  // Until logging out has finished on this computer, nobody can sign in: it
  // would race with the previous student's saved sign-in being removed.
  const [loggingOut, setLoggingOut] = useState(false);
  // A student's GitHub must be ready for syncing (their repo, and prepcode's
  // access to it) before the workspace opens. Signing in checks it
  // (session.syncReady); if it isn't, the setup screen shows until it is.
  const [setUp, setSetUp] = useState(false);

  useEffect(() => {
    restoreSession()
      .then(setSession)
      .catch((err) => console.error("Could not restore the sign-in:", err))
      .finally(() => setRestoring(false));
  }, []);

  if (restoring) return null;

  function handleLogout() {
    setLoggingOut(true);
    logout()
      .catch((err) => console.error("Logout failed:", err))
      .finally(() => setLoggingOut(false));
    // Unmount the workspace first (synchronously), then drop the previous
    // student's cached files and editor models, which it was still using.
    flushSync(() => {
      setSession(null);
      setSetUp(false);
    });
    queryClient.clear();
    disposeEditorModels();
  }

  if (session && (session.guest || session.syncReady || setUp)) {
    return <WorkspaceScreen session={session} onLogout={handleLogout} />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {loggingOut ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Logging out…
        </p>
      ) : session ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <AuthHeader subtitle="Last step: set up GitHub sync." />
          <RepoSetupSteps
            onReady={() => setSetUp(true)}
            onSkip={() => setSetUp(true)}
            skipLabel="Open prepcode anyway"
          />
          <Button variant="ghost" className="-mt-4" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      ) : (
        <LoginScreen onAuthenticated={setSession} />
      )}

      <AuthFooter />
    </main>
  );
}

export default App;
