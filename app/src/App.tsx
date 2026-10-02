import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { AuthFooter } from "@/components/auth-footer";
import { LoginScreen } from "@/components/login-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceScreen } from "@/components/workspace-screen";
import { logout, restoreSession, type Session } from "@/lib/auth";
import { disposeEditorModels } from "@/lib/monaco";
import { queryClient } from "@/lib/query-client";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  // A student stays signed in until they log out, so check on launch.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    restoreSession()
      .then(setSession)
      .catch((err) => console.error("Could not restore the sign-in:", err))
      .finally(() => setRestoring(false));
  }, []);

  if (restoring) return null;

  if (session) {
    return (
      <WorkspaceScreen
        session={session}
        onLogout={() => {
          logout().catch((err) => console.error("Logout failed:", err));
          // Unmount the workspace first (synchronously), then drop the previous
          // student's cached files and editor models, which it was still using.
          flushSync(() => setSession(null));
          queryClient.clear();
          disposeEditorModels();
        }}
      />
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <LoginScreen onAuthenticated={setSession} />

      <AuthFooter />
    </main>
  );
}

export default App;
