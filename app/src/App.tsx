import { useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { RegisterScreen } from "@/components/register-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/auth";
import "./App.css";

function App() {
  // Kept in memory only: the machine is shared, so every launch starts at login.
  const [session, setSession] = useState<Session | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {session ? (
        // Placeholder until the editor screen is built.
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm">
            Logged in as <span className="font-semibold">{session.reg_no}</span>
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSession(null);
              setAuthScreen("login");
            }}
          >
            Log out
          </Button>
        </div>
      ) : authScreen === "login" ? (
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
    </main>
  );
}

export default App;
