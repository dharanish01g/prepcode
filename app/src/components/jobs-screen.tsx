import { LockIcon } from "lucide-react";
import { JobsBrowser } from "@/components/jobs-browser";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Jobs to search and apply to. Students only: guests are asked to log in. */
export function JobsScreen({ guest, onLogin }: { guest: boolean; onLogin: () => void }) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Jobs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {guest ? (
        // JobsBrowser (and its query) never mounts for a guest, so nothing is fetched.
        <Empty className="pb-24">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockIcon />
            </EmptyMedia>
            <EmptyTitle>Log in to see jobs</EmptyTitle>
            <EmptyDescription>
              Jobs are for students who log in with GitHub. Log in to search openings and apply.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onLogin}>Log in with GitHub</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <JobsBrowser />
      )}
    </>
  );
}
