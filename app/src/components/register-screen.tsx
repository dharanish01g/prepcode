import { useState } from "react";
import { AuthHeader } from "@/components/auth-header";
import { ConfirmDobDialog } from "@/components/confirm-dob-dialog";
import { DobPicker, formatDob } from "@/components/dob-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, type Session } from "@/lib/auth";

export function RegisterScreen({
  onAuthenticated,
  onShowLogin,
}: {
  onAuthenticated: (session: Session) => void;
  onShowLogin: () => void;
}) {
  const [regNo, setRegNo] = useState("");
  const [dob, setDob] = useState<Date>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // The account is only created once the DOB has been double-checked.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNo.trim()) return setError("Enter your register number.");
    if (!dob) return setError("Select your date of birth.");

    setError("");
    setConfirmOpen(true);
  }

  async function createAccount() {
    if (!dob) return;
    setSubmitting(true);
    try {
      onAuthenticated(await register(regNo, formatDob(dob)));
    } catch (err) {
      // e.g. already registered: show it on the form, where it can be fixed.
      setConfirmOpen(false);
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8">
      <AuthHeader subtitle="Create your account." />

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
          <p className="text-xs text-muted-foreground">
            This is your password. Remember the date you pick.
          </p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          Create account
        </Button>
      </form>

      <ConfirmDobDialog
        open={confirmOpen}
        dob={dob}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirmed={createAccount}
      />

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onShowLogin}>
          Sign in
        </Button>
      </p>
    </div>
  );
}
