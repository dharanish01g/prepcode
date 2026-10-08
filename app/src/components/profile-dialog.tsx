import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVersion } from "@tauri-apps/api/app";
import {
  Building2Icon,
  DownloadIcon,
  InfoIcon,
  LanguagesIcon,
  MailIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { COMPANY } from "@/components/auth-footer";
import { FileIcon } from "@/components/file-icon";
import { BrowserSignInDialog } from "@/components/browser-sign-in-dialog";
import { GitHubIcon } from "@/components/github-icon";
import { GoogleIcon } from "@/components/google-icon";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  accountDetails,
  cancelSignIn,
  displayName,
  finishSignIn,
  startGoogleLink,
  unlinkGoogle,
  type Session,
  type SignInLink,
} from "@/lib/auth";
import { getLanguages, type Language } from "@/lib/languages";
import { queryKeys } from "@/lib/queries";
import {
  progressLabel,
  sameRuntime,
  useInstalledRuntimes,
  useInstallingRuntimes,
  useInstallRuntimeMutation,
  useRemoveRuntimeMutation,
  useRuntimeProgress,
} from "@/lib/runtimes";
import { checkForUpdate, type UpdateStatus } from "@/lib/updates";

type Section = "GitHub" | "Gmail" | "Org mail" | "Authenticator" | "Languages" | "About";

type NavItem = { name: Section; icon: React.ReactNode };

// The ways to sign in to this account, plus the authenticator's second step,
// one page each.
const accountNav: NavItem[] = [
  { name: "GitHub", icon: <GitHubIcon /> },
  { name: "Gmail", icon: <MailIcon /> },
  { name: "Org mail", icon: <Building2Icon /> },
  { name: "Authenticator", icon: <ShieldCheckIcon /> },
];

const appNav: NavItem[] = [
  { name: "Languages", icon: <LanguagesIcon /> },
  { name: "About", icon: <InfoIcon /> },
];

const isAccountSection = (section: Section) => accountNav.some((item) => item.name === section);

/** The profile, opened from the avatar at the bottom of the sidebar. */
export function ProfileDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = React.useState<Section>("GitHub");

  const menu = (items: NavItem[]) => (
    // gap-2 matches the main sidebar's spacing between items.
    <SidebarMenu className="gap-2">
      {items.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton isActive={item.name === section} onClick={() => setSection(item.name)}>
            {item.icon}
            <span>{item.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Profile</DialogTitle>
        <DialogDescription className="sr-only">
          Your account and the languages installed on this computer.
        </DialogDescription>
        <SidebarProvider className="min-h-0 items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>{menu(accountNav)}</SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupContent>{menu(appNav)}</SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          {/* The divider sits on the content, which fills the dialog's 500px; the
              sidebar only grows as tall as its items. Like the sidebar, desktop only. */}
          <main className="flex h-[500px] flex-1 flex-col overflow-hidden md:border-l">
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">Profile</BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  {isAccountSection(section) && (
                    <>
                      <BreadcrumbItem className="hidden md:block">Account</BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{section}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {section === "GitHub" ? (
                <GitHubSection session={session} />
              ) : section === "Gmail" ? (
                <GmailSection session={session} />
              ) : section === "Org mail" ? (
                <NotConnected
                  icon={<Building2Icon />}
                  title="No org mail connected"
                  description="Connect the email your college or company gave you. It links your account to your college, so your tests and progress show up there."
                  action="Connect org mail"
                />
              ) : section === "Authenticator" ? (
                <NotConnected
                  icon={<ShieldCheckIcon />}
                  title="No authenticator set up"
                  description="Add a second step to signing in: after GitHub, Gmail or org mail, enter a 6-digit code from an app like Google Authenticator or Microsoft Authenticator."
                  action="Set up authenticator"
                />
              ) : section === "Languages" ? (
                <LanguagesSection />
              ) : (
                <AboutSection />
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

/** The GitHub account a student signed in with. A guest has none. */
function GitHubSection({ session }: { session: Session }) {
  if (session.guest) {
    return (
      <NotConnected
        icon={<GitHubIcon />}
        title="No GitHub connected"
        description="You're using prepcode as a guest, so your files stay on this computer and are deleted when you log out. Connect GitHub to save your programs there."
        action="Connect GitHub"
      />
    );
  }
  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {session.avatarUrl && <AvatarImage src={session.avatarUrl} alt="" />}
        <AvatarFallback>
          <UserIcon className="size-6" />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-medium">{displayName(session)}</span>
          <Badge variant="outline">Connected</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in with GitHub. Sync saves your programs to your GitHub account.
        </p>
      </div>
    </div>
  );
}

/**
 * The student's personal Gmail, connected through Google so they can sign in
 * with it too (Continue with Google). GitHub, which made the account, stays.
 */
function GmailSection({ session }: { session: Session }) {
  const queryClient = useQueryClient();
  const key = queryKeys.accountDetails(session.id);
  const details = useQuery({ queryKey: key, queryFn: accountDetails, enabled: !session.guest });
  // Set while the student picks their Google account in the browser.
  const [link, setLink] = React.useState<SignInLink | null>(null);
  const [busy, setBusy] = React.useState<"connect" | "disconnect" | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  async function connect() {
    setBusy("connect");
    try {
      setLink(await startGoogleLink());
      if ((await finishSignIn())?.kind === "signedIn") {
        await queryClient.invalidateQueries({ queryKey: key });
        toast.success("Gmail connected", {
          description: "You can now sign in with Continue with Google too.",
        });
      }
    } catch (err) {
      toast.error("Couldn't connect Gmail", { description: String(err) });
    } finally {
      setLink(null);
      setBusy(null);
    }
  }

  function cancel() {
    // finishSignIn then resolves to null, which ends connect.
    cancelSignIn().catch((err) => console.error("Cancel failed:", err));
    setLink(null);
  }

  async function disconnect() {
    setBusy("disconnect");
    try {
      queryClient.setQueryData(key, await unlinkGoogle());
      setConfirming(false);
      toast.success("Gmail disconnected", { description: "Sign in with GitHub from now on." });
    } catch (err) {
      toast.error("Couldn't disconnect Gmail", { description: String(err) });
    } finally {
      setBusy(null);
    }
  }

  if (session.guest) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MailIcon />
          </EmptyMedia>
          <EmptyTitle>No Gmail connected</EmptyTitle>
          <EmptyDescription>
            Guests have no account to connect Gmail to. Sign in with GitHub first, then connect your
            Gmail here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (details.isPending) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (details.data?.googleConnected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border">
            <GoogleIcon className="size-7" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-medium">
                {details.data.googleEmail ?? "Google account"}
              </span>
              <Badge variant="outline">Connected</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You can sign in with Continue with Google, as well as with GitHub.
            </p>
          </div>
        </div>
        <Button variant="outline" className="self-start" onClick={() => setConfirming(true)}>
          Disconnect Gmail
        </Button>
        <AlertDialog open={confirming} onOpenChange={(open) => !busy && setConfirming(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <MailIcon />
              </AlertDialogMedia>
              <AlertDialogTitle>Disconnect Gmail?</AlertDialogTitle>
              <AlertDialogDescription>
                You won't be able to sign in with Google any more. You can still sign in with
                GitHub, and connect Gmail again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={busy !== null}
                onClick={(e) => {
                  // Stay open until it's done.
                  e.preventDefault();
                  disconnect();
                }}
              >
                {busy === "disconnect" && <Spinner />}
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MailIcon />
        </EmptyMedia>
        <EmptyTitle>No Gmail connected</EmptyTitle>
        <EmptyDescription>
          Connect your personal Gmail to sign in with it. It stays yours after you leave college, so
          you keep your account and job alerts.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" disabled={busy !== null} onClick={connect}>
          {busy === "connect" && link === null ? <Spinner /> : <GoogleIcon />}
          Connect Gmail
        </Button>
      </EmptyContent>
      <BrowserSignInDialog provider="Google" link={link} onCancel={cancel} />
    </Empty>
  );
}

/** A way to sign in that isn't linked yet. UI only for now: the button doesn't connect anything. */
function NotConnected({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          onClick={() =>
            toast("Not connected yet", { description: "Linking accounts is coming soon." })
          }
        >
          {action}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/**
 * The version comes from the runtime's catalog id, e.g. "python-3.13.15".
 * Languages that share a runtime (C and C++ use Zig) name it, so "0.16.0"
 * isn't mistaken for the language's own version.
 */
function versionLabel(language: Language, languages: Language[]) {
  const dash = language.runtime.indexOf("-");
  const version = dash === -1 ? language.runtime : language.runtime.slice(dash + 1);
  const shared = languages.some(
    (other) => other !== language && other.runtime === language.runtime,
  );
  if (!shared || dash === -1) return version;
  const tool = language.runtime.slice(0, dash);
  return `${tool.charAt(0).toUpperCase()}${tool.slice(1)} ${version}`;
}

/**
 * Every language prepcode can run, with the version it uses: installed ones
 * first, each with Remove, then the rest, each with Download.
 */
function LanguagesSection() {
  const installed = useInstalledRuntimes();
  const languages = getLanguages("program");

  if (installed.isPending) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (installed.isError) {
    return (
      <p className="text-sm text-destructive">
        Could not check the installed languages: {String(installed.error)}
      </p>
    );
  }

  const isInstalled = (lang: Language) => installed.data.includes(lang.extension);
  const rows = [
    ...languages.filter(isInstalled),
    ...languages.filter((lang) => !isInstalled(lang)),
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Language</TableHead>
          <TableHead>Version</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((lang) =>
          isInstalled(lang) ? (
            <InstalledLanguageRow
              key={lang.extension}
              language={lang}
              version={versionLabel(lang, languages)}
              // C and C++ share one download, so removing one removes both.
              alsoRemoves={languages
                .filter((other) => other !== lang && isInstalled(other))
                .filter((other) => sameRuntime(other.extension, lang.extension))
                .map((other) => other.name)}
            />
          ) : (
            <NotInstalledLanguageRow
              key={lang.extension}
              language={lang}
              version={versionLabel(lang, languages)}
            />
          ),
        )}
      </TableBody>
    </Table>
  );
}

function InstalledLanguageRow({
  language,
  version,
  alsoRemoves,
}: {
  language: Language;
  version: string;
  alsoRemoves: string[];
}) {
  const [confirming, setConfirming] = React.useState(false);
  const remove = useRemoveRuntimeMutation();

  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2">
          <FileIcon extension={language.extension} />
          {language.name}
        </span>
      </TableCell>
      <TableCell className="tabular-nums">{version}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${language.name}`}
          onClick={() => setConfirming(true)}
        >
          <Trash2Icon />
        </Button>
        <AlertDialog
          open={confirming}
          onOpenChange={(open) => {
            if (!open && !remove.isPending) {
              remove.reset();
              setConfirming(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="text-destructive">
                <Trash2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>Remove {language.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes {language.name} from this computer to free up space. Your files stay,
                and you can download it again any time.
                {alsoRemoves.length > 0 &&
                  ` ${alsoRemoves.join(" and ")} uses the same download, so it's removed too.`}
                {SHARED_WITH_OTHER_ACCOUNTS &&
                  " Everyone who uses prepcode on this computer shares it, so it's removed for them too."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {remove.isError && <p className="text-xs text-destructive">{String(remove.error)}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(language.extension, {
                    onSuccess: () => {
                      remove.reset();
                      setConfirming(false);
                    },
                  })
                }
              >
                {remove.isPending && <Spinner />}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

/** Greyed out, with a Download button that shows progress, like the new-file dialog. */
function NotInstalledLanguageRow({ language, version }: { language: Language; version: string }) {
  const install = useInstallRuntimeMutation();
  // C and C++ share one download, so either one downloading covers both rows.
  const downloadingAs = useInstallingRuntimes().find((ext) => sameRuntime(ext, language.extension));
  const downloading = downloadingAs !== undefined;
  const progress = useRuntimeProgress(downloadingAs ?? language.extension);

  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2 text-muted-foreground">
          <FileIcon extension={language.extension} className="opacity-60 grayscale" />
          {language.name}
        </span>
        {install.isError && !downloading && (
          <p className="mt-1 text-xs whitespace-normal text-destructive">{String(install.error)}</p>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{version}</TableCell>
      <TableCell className="text-right">
        <span className="inline-flex items-center gap-2">
          {downloading && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {progressLabel(progress)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={downloading}
            onClick={() => install.mutate(language.extension)}
          >
            {downloading ? <Spinner /> : <DownloadIcon />}
            {downloading ? "Downloading" : "Download"}
          </Button>
        </span>
      </TableCell>
    </TableRow>
  );
}

// On Windows, downloads live in ProgramData and every account on the PC uses
// them (see shared_data_dir in runtimes.rs).
const SHARED_WITH_OTHER_ACCOUNTS = navigator.userAgent.includes("Windows");

const FEATURES = [
  {
    title: "Programs",
    text: "Write and run code in Python, JavaScript, C, C++, Java, Go and C#. prepcode downloads each language for you, so there's nothing to set up.",
  },
  {
    title: "Sync",
    text: "Save your programs to your GitHub account and get them back on any computer.",
  },
  { title: "Practice", text: "Solve job-prep questions, grouped by topic." },
  { title: "Jobs", text: "Find openings for your engineering branch." },
];

function updateMessage(status: UpdateStatus) {
  switch (status.kind) {
    case "dev":
      return "This is a development build, so it doesn't update.";
    case "latest":
      return "You're on the latest version.";
    case "ready":
      return `Version ${status.version} is ready. It installs when you close prepcode.`;
  }
}

/** Checks for a newer version now, instead of waiting for the next launch. */
function CheckForUpdates() {
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState<{ message: string; failed: boolean } | null>(null);

  async function handleCheck() {
    setChecking(true);
    setResult(null);
    try {
      const status = await checkForUpdate();
      setResult({ message: updateMessage(status), failed: false });
    } catch (err) {
      console.error("Update check failed:", err);
      setResult({
        message: "Couldn't check for updates. Check your internet connection.",
        failed: true,
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="ml-auto flex max-w-56 flex-col items-end gap-1 text-right">
      <Button variant="outline" disabled={checking} onClick={handleCheck}>
        {checking && <Spinner />}
        {checking ? "Checking…" : "Check for updates"}
      </Button>
      {result && (
        <span
          role="status"
          className={result.failed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}

/** What prepcode is, its version and who makes it. */
function AboutSection() {
  const [version, setVersion] = React.useState("");

  React.useEffect(() => {
    // From tauri.conf.json, so it always matches the installed release.
    getVersion()
      .then(setVersion)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <img src={logo} alt="" className="size-16" />
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium">prepcode</span>
          {version && <span className="text-muted-foreground">Version {version}</span>}
        </div>
        <CheckForUpdates />
      </div>
      <p>
        prepcode helps students get ready for placements. Write and run code without installing
        anything, practice the questions companies ask, and find jobs, all in one place.
      </p>
      <div className="flex flex-col gap-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-0.5">
            <span className="font-medium">{feature.title}</span>
            <span className="text-muted-foreground">{feature.text}</span>
          </div>
        ))}
      </div>
      <Separator />
      <p className="text-muted-foreground">
        © {new Date().getFullYear()} {COMPANY}. All rights reserved.
      </p>
    </div>
  );
}
