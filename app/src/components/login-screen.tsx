import { useState } from "react";
import { AuthHeader } from "@/components/auth-header";
import { DobPicker, formatDob } from "@/components/dob-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type Session } from "@/lib/auth";

// Only the register number is remembered. The DOB is always re-entered
// because the machine is shared.
const REMEMBER_KEY = "remembered-reg-no";

function readRemembered() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeRemembered(regNo: string | null) {
  try {
    if (regNo) localStorage.setItem(REMEMBER_KEY, regNo);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Storage unavailable; nothing to remember.
  }
}

export function LoginScreen({
  onAuthenticated,
  onShowRegister,
}: {
  onAuthenticated: (session: Session) => void;
  onShowRegister: () => void;
}) {
  const [regNo, setRegNo] = useState(readRemembered);
  const [dob, setDob] = useState<Date>();
  const [remember, setRemember] = useState(() => readRemembered() !== "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNo.trim()) return setError("Enter your register number.");
    if (!dob) return setError("Select your date of birth.");

    setError("");
    setSubmitting(true);
    try {
      const session = await login(regNo, formatDob(dob));
      writeRemembered(remember ? session.reg_no : null);
      onAuthenticated(session);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      <AuthHeader subtitle="Sign in to continue." />

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-no">Register number</Label>
          <Input
            id="reg-no"
            value={regNo}
            onChange={(e) => setRegNo(e.currentTarget.value.toUpperCase())}
            placeholder="e.g. 21CS001"
            autoComplete="off"
            autoFocus
            maxLength={32}
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dob">Date of birth</Label>
          <DobPicker id="dob" value={dob} onChange={setDob} />
        </div>

        <Label className="gap-2 font-normal">
          <Checkbox checked={remember} onCheckedChange={setRemember} />
          Remember my register number
        </Label>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          Sign in
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={onShowRegister}
        >
          Create a new one
        </Button>
      </p>
    </div>
  );
}
