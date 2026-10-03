import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const WORK_MODE_LABELS: Record<Job["workMode"], string> = {
  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const JOB_TYPE_LABELS: Record<Job["jobType"], string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  internship: "Internship",
  contract: "Contract",
};

export const EXPERIENCE_LABELS: Record<Job["experience"], string> = {
  fresher: "Fresher",
  "0-2 years": "0–2 years",
  "2-5 years": "2–5 years",
  "5+ years": "5+ years",
  "not specified": "Experience not specified",
};

export const BRANCH_LABELS: Record<NonNullable<Job["branch"]>, string> = {
  cs: "Computer Science",
  it: "IT",
  ai: "AI / ML",
  ece: "ECE",
  eee: "EEE",
  mech: "Mechanical",
  civil: "Civil",
};

/** The job APIs we sync from, credited with a link back as their terms ask. */
const SOURCES: Partial<Record<Job["source"], { name: string; url: string }>> = {
  arbeitnow: { name: "Arbeitnow", url: "https://www.arbeitnow.com" },
  himalayas: { name: "Himalayas", url: "https://himalayas.app" },
  jobicy: { name: "Jobicy", url: "https://jobicy.com" },
  themuse: { name: "The Muse", url: "https://www.themuse.com" },
};

/** The company's logo, or a building when it has none or it fails to load. */
export function CompanyLogo({ job, className }: { job: Job; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center border bg-background", className)}
    >
      {job.logoUrl && !failed ? (
        <img src={job.logoUrl} alt="" className="size-1/2" onError={() => setFailed(true)} />
      ) : (
        <Building2Icon className="size-1/2 text-muted-foreground" />
      )}
    </div>
  );
}

/** E.g. "Just now", "25 minutes ago", "3 hours ago", "Yesterday" or "5 days ago". */
export function postedAgo(postedAt: string) {
  const minutes = Math.floor((Date.now() - new Date(postedAt).getTime()) / (60 * 1000));
  if (minutes < 1) return "Just now";
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const hours = Math.floor(minutes / 60);
  const ago =
    minutes < 60
      ? format.format(-minutes, "minute")
      : hours < 24
        ? format.format(-hours, "hour")
        : format.format(-Math.floor(hours / 24), "day");
  // "yesterday" comes back lowercase.
  return ago.charAt(0).toUpperCase() + ago.slice(1);
}

/** E.g. "3 Oct 2026, 6:10 am", in the student's time zone. */
function formatPostedAt(postedAt: string) {
  return new Date(postedAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** E.g. "31 Oct 2026". */
function formatDeadline(deadline: string) {
  // Noon, so no time zone moves it to the day before.
  return new Date(`${deadline}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function open(url: string, purpose: string) {
  openUrl(url).catch((err) =>
    toast.error("Couldn't open your browser", {
      description: `Go to ${url}${purpose}. (${err})`,
    }),
  );
}

/** Everything about one job, with Apply. */
export function JobDetails({ job }: { job: Job }) {
  const source = SOURCES[job.source];
  const facts = [
    { icon: <MapPinIcon />, label: `${job.location} · ${WORK_MODE_LABELS[job.workMode]}` },
    { icon: <BriefcaseIcon />, label: JOB_TYPE_LABELS[job.jobType] },
    { icon: <GraduationCapIcon />, label: EXPERIENCE_LABELS[job.experience] },
    { icon: <WalletIcon />, label: job.salary ?? "Salary not disclosed" },
    {
      icon: <CalendarIcon />,
      label: job.deadline ? `Apply by ${formatDeadline(job.deadline)}` : "Open until filled",
    },
    ...(job.branch ? [{ icon: <WrenchIcon />, label: `For ${BRANCH_LABELS[job.branch]}` }] : []),
  ];

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo job={job} className="size-12" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold">{job.title}</h2>
            <p className="text-sm text-muted-foreground">
              {job.company} · Posted {formatPostedAt(job.postedAt)} (
              {postedAgo(job.postedAt).toLowerCase()})
              {source && (
                <>
                  {" · via "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-normal text-muted-foreground"
                    onClick={() => open(source.url, "")}
                  >
                    {source.name}
                  </Button>
                </>
              )}
            </p>
          </div>
          <Button onClick={() => open(job.applyUrl, " to apply")}>
            Apply
            <ExternalLinkIcon />
          </Button>
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {facts.map((fact) => (
            <li
              key={fact.label}
              className="flex items-center gap-2 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
            >
              {fact.icon}
              {fact.label}
            </li>
          ))}
        </ul>
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}
        <Separator />
        <Markdown>{job.description}</Markdown>
      </div>
    </ScrollArea>
  );
}
