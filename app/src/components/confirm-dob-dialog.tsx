import { useState } from "react";
import { isSameDay } from "date-fns";
import { TriangleAlertIcon } from "lucide-react";
import { DobPicker } from "@/components/dob-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

/**
 * Students often pick a random date of birth and then can't sign in, because
 * the DOB is their password. Before creating the account, warn them and make
 * them pick it a second time, in one popup.
 */
export function ConfirmDobDialog({
  open,
  dob,
  submitting,
  onCancel,
  onConfirmed,
}: {
  open: boolean;
  dob: Date | undefined;
  submitting: boolean;
  onCancel: () => void;
  /** Both checks passed: create the account. */
  onConfirmed: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !submitting) onCancel();
      }}
    >
      <AlertDialogContent>
        {/* Mounted only while open, so the second pick starts empty each time. */}
        {open && dob && (
          <ConfirmForm
            dob={dob}
            submitting={submitting}
            onConfirmed={onConfirmed}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmForm({
  dob,
  submitting,
  onConfirmed,
}: {
  dob: Date;
  submitting: boolean;
  onConfirmed: () => void;
}) {
  const [again, setAgain] = useState<Date>();
  const [error, setError] = useState("");

  function handleCreate() {
    if (!again) return setError("Pick your date of birth.");
    if (!isSameDay(again, dob)) {
      return setError("The dates don't match. Check your date of birth and try again.");
    }
    onConfirmed();
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogMedia className="text-amber-600 dark:text-amber-400">
          <TriangleAlertIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>Your date of birth is your password</AlertDialogTitle>
        <AlertDialogDescription>
          You'll need this exact date every time you sign in. Pick it again to confirm.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dob-again">Confirm date of birth</Label>
        <DobPicker
          id="dob-again"
          value={again}
          onChange={(date) => {
            setAgain(date);
            setError("");
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={submitting}>Change date</AlertDialogCancel>
        <AlertDialogAction disabled={submitting} onClick={handleCreate}>
          Create account
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
