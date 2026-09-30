import { useState } from "react";
import { flushSync } from "react-dom";
import { AuthFooter } from "@/components/auth-footer";
import { LoginScreen } from "@/components/login-screen";
import { RegisterScreen } from "@/components/register-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceScreen } from "@/components/workspace-screen";
import { logout, type Session } from "@/lib/auth";
import { disposeEditorModels } from "@/lib/monaco";
import { queryClient } from "@/lib/query-client";
import "./App.css";

function App() {
  // Kept in memory only: the machine is shared, so every launch starts at login.
  const [session, setSession] = useState<Session | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");

  if (session) {
    return (
      <WorkspaceScreen
        session={session}
        onLogout={() => {
          logout().catch((err) => console.error("Logout failed:", err));
          // Unmount the workspace first (synchronously), then drop the previous
          // student's cached files and editor models, which it was still using.
          flushSync(() => {
            setSession(null);
            setAuthScreen("login");
          });
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

      {authScreen === "login" ? (
        <LoginScreen
          onAuthenticated={setSession}
          onShowRegister={() => setAuthScreen("register")}
        />
      ) : (
        <RegisterScreen
          onAuthenticated={setSession}
          onShowLogin={() => setAuthScreen("login")}
        />
      )}

      <AuthFooter />
    </main>
  );
}

export default App;
