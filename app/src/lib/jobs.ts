import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const WORK_MODES = ["onsite", "remote", "hybrid"] as const;
export const JOB_TYPES = ["full-time", "part-time", "internship", "contract"] as const;
export const EXPERIENCE_LEVELS = [
  "fresher",
  "0-2 years",
  "2-5 years",
  "5+ years",
  "not specified",
] as const;

/** Engineering branches, in the Branch filter's order. */
export const BRANCHES = ["cs", "it", "ai", "ece", "eee", "mech", "civil"] as const;

/** Where a job came from: added by hand, or synced from a job API. */
export type JobSource = "manual" | "arbeitnow" | "himalayas" | "jobicy" | "themuse" | "serpapi";

/** A job opening on the Jobs screen. */
export type Job = {
  slug: string;
  title: string;
  company: string;
  /** The company's logo (an image URL). */
  logoUrl: string | null;
  /** A location, or several separated by semicolons, e.g. "Berlin; Munich". */
  location: string;
  workMode: (typeof WORK_MODES)[number];
  jobType: (typeof JOB_TYPES)[number];
  experience: (typeof EXPERIENCE_LEVELS)[number];
  /** Free text, e.g. "₹4–6 LPA"; null when not disclosed. */
  salary: string | null;
  skills: string[];
  /** Markdown. */
  description: string;
  applyUrl: string;
  /** ISO timestamp. */
  postedAt: string;
  /** The last day to apply (YYYY-MM-DD); null when open until filled. */
  deadline: string | null;
  source: JobSource;
  /** The branch it's for; null when unknown (only SerpApi jobs have one). */
  branch: (typeof BRANCHES)[number] | null;
};

/** Today in the student's time zone, as YYYY-MM-DD. */
function today() {
  return new Date().toLocaleDateString("en-CA");
}

/** Published jobs still open to applications, newest first. */
async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "slug, title, company, logoUrl:logo_url, location, workMode:work_mode, jobType:job_type, experience, salary, skills, description, applyUrl:apply_url, postedAt:posted_at, deadline, source, branch",
    )
    .or(`deadline.is.null,deadline.gte.${today()}`)
    .order("posted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Job[];
}

/** Guests never fetch jobs: pass `enabled: false` for them. */
export function useJobsQuery({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    enabled,
    // Openings change more often than Practice, but not by the minute.
    staleTime: 5 * 60 * 1000,
  });
}

/** Each location a job lists, e.g. "Berlin; Munich" gives both. */
export function jobCities(job: Job) {
  return job.location
    .split(";")
    .map((city) => city.trim())
    .filter(Boolean);
}
