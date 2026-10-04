import * as React from "react";
import { getVersion } from "@tauri-apps/api/app";
import { InfoIcon, LanguagesIcon, UserIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import { COMPANY } from "@/components/auth-footer";
import { FileIcon } from "@/components/file-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { displayName, type Session } from "@/lib/auth";
import { getLanguages, type Language } from "@/lib/languages";
import { useInstalledRuntimes } from "@/lib/runtimes";

type Section = "Account" | "Languages" | "About";

const nav: { name: Section; icon: React.ReactNode }[] = [
  { name: "Account", icon: <UserIcon /> },
  { name: "Languages", icon: <LanguagesIcon /> },
  { name: "About", icon: <InfoIcon /> },
];

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
  const [section, setSection] = React.useState<Section>("Account");
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
                <SidebarGroupContent>
                  {/* gap-2 matches the main sidebar's spacing between items. */}
                  <SidebarMenu className="gap-2">
                    {nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === section}
                          onClick={() => setSection(item.name)}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
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
                  <BreadcrumbItem>
                    <BreadcrumbPage>{section}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {section === "Account" ? (
                <AccountSection session={session} />
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

function AccountSection({ session }: { session: Session }) {
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
          <Badge variant="outline">{session.guest ? "Guest" : "GitHub"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.guest
            ? "Your files stay on this computer and are deleted when you log out."
            : "Signed in with GitHub. Sync saves your programs to your GitHub account."}
        </p>
      </div>
    </div>
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

/** Languages installed on this computer, with the version prepcode runs. */
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

  const rows = languages.filter((lang) => installed.data.includes(lang.extension));
  if (rows.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LanguagesIcon />
          </EmptyMedia>
          <EmptyTitle>No languages installed yet</EmptyTitle>
          <EmptyDescription>
            Pick a language when you create a new file, and prepcode downloads it for you.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Language</TableHead>
          <TableHead>Version</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((lang) => (
          <TableRow key={lang.extension}>
            <TableCell>
              <span className="flex items-center gap-2">
                <FileIcon extension={lang.extension} />
                {lang.name}
              </span>
            </TableCell>
            <TableCell className="tabular-nums">{versionLabel(lang, languages)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const FEATURES = [
  {
    title: "Programs",
    text: "Write and run code in Python, JavaScript, C, C++, Java and Go. prepcode downloads each language for you, so there's nothing to set up.",
  },
  {
    title: "Sync",
    text: "Save your programs to your GitHub account and get them back on any computer.",
  },
  { title: "Practice", text: "Solve job-prep questions, grouped by topic." },
  { title: "Jobs", text: "Find openings for your engineering branch." },
];

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
