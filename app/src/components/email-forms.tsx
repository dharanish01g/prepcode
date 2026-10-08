import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { GoogleIcon } from "@/components/google-icon";
import { EMAIL_CODE_LENGTH, isGoogleEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth";

// The forms for signing in with email and a password. They only collect what
// the student types; the login screen does the signing in.

/** How long before "Send a new code" works again (Supabase limits sends too). */
const RESEND_AFTER_SECONDS = 60;

/** Email and password, with Forgot password? beside the password. */
export function EmailSignInForm({
  busy,
  disabled,
  onSubmit,
  onForgot,
  onGoogle,
}: {
  busy: boolean;
  disabled: boolean;
  onSubmit: (email: string, password: string) => void;
  onForgot: (email: string) => void;
  /** Gmail signs in with Google, not with a password. */
  onGoogle: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <EmailField value={email} onChange={setEmail} onGoogle={onGoogle} />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => onForgot(email)}
          >
            Forgot password?
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || !email || !password || isGoogleEmail(email)}
      >
        {busy && <Spinner />}
        Sign in
      </Button>
    </form>
  );
}

/** Name (optional), email and a new password. */
export function SignUpForm({
  busy,
  disabled,
  onSubmit,
  onGoogle,
}: {
  busy: boolean;
  disabled: boolean;
  onSubmit: (name: string, email: string, password: string) => void;
  /** Gmail signs in with Google, not with a password. */
  onGoogle: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(name.trim(), email, password);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
      </div>
      <EmailField
        value={email}
        onChange={setEmail}
        onGoogle={onGoogle}
        hint="Use your college or work email."
      />
      <NewPasswordField
        id="new-password"
        label="Password"
        value={password}
        onChange={setPassword}
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={
          disabled || !email || password.length < MIN_PASSWORD_LENGTH || isGoogleEmail(email)
        }
      >
        {busy && <Spinner />}
        Create account
      </Button>
    </form>
  );
}

/** The email to send a reset code to. */
export function ForgotForm({
  initialEmail,
  busy,
  disabled,
  onSubmit,
  onGoogle,
}: {
  initialEmail: string;
  busy: boolean;
  disabled: boolean;
  onSubmit: (email: string) => void;
  /** Gmail signs in with Google, not with a password. */
  onGoogle: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(email);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter the email you sign in with and we'll send you a code to choose a new password.
      </p>
      <EmailField value={email} onChange={setEmail} onGoogle={onGoogle} autoFocus />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={disabled || !email || isGoogleEmail(email)}
      >
        {busy && <Spinner />}
        Send code
      </Button>
    </form>
  );
}

/**
 * The code from an email, and (when resetting) the new password it unlocks.
 * "Send a new code" waits a minute between sends.
 */
export function CodeForm({
  description,
  submitLabel,
  withNewPassword = false,
  busy,
  resending,
  disabled,
  onSubmit,
  onResend,
}: {
  description: ReactNode;
  submitLabel: string;
  withNewPassword?: boolean;
  busy: boolean;
  resending: boolean;
  disabled: boolean;
  onSubmit: (code: string, password: string) => void;
  onResend: () => Promise<boolean>;
}) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);
  const ready =
    code.length === EMAIL_CODE_LENGTH &&
    (!withNewPassword || password.length >= MIN_PASSWORD_LENGTH);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (ready) onSubmit(code, password);
  }

  async function resend() {
    if (await onResend()) {
      setCode("");
      setWait(RESEND_AFTER_SECONDS);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col items-center gap-2">
        <InputOTP maxLength={EMAIL_CODE_LENGTH} value={code} onChange={setCode} autoFocus>
          <InputOTPGroup>
            {Array.from({ length: EMAIL_CODE_LENGTH }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-10 text-base" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs"
          disabled={disabled || wait > 0}
          onClick={resend}
        >
          {resending && <Spinner />}
          {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
        </Button>
      </div>
      {withNewPassword && (
        <NewPasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
        />
      )}
      <Button type="submit" size="lg" className="w-full" disabled={disabled || !ready}>
        {busy && <Spinner />}
        {submitLabel}
      </Button>
    </form>
  );
}

/**
 * An email address. A Gmail address is turned away here, with a button to
 * Continue with Google instead.
 */
function EmailField({
  value,
  onChange,
  onGoogle,
  hint,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onGoogle: () => void;
  hint?: string;
  autoFocus?: boolean;
}) {
  const gmail = isGoogleEmail(value);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        autoComplete="username"
        placeholder="you@college.edu"
        autoFocus={autoFocus}
        aria-invalid={gmail || undefined}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
      {gmail ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-destructive">
            Gmail addresses sign in with Google. Use your college or work email here.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** A password being chosen, with the length rule under it. */
function NewPasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
      <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
    </div>
  );
}
