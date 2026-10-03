import * as React from "react";
import { LanguagesIcon, UserIcon } from "lucide-react";
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

type Section = "Account" | "Languages";

const nav: { name: Section; icon: React.ReactNode }[] = [
  { name: "Account", icon: <UserIcon /> },
  { name: "Languages", icon: <LanguagesIcon /> },
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
        <SidebarProvider className="items-start">
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
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
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
              {section === "Account" ? <AccountSection session={session} /> : <LanguagesSection />}
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
  const languages = getLanguages();

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
