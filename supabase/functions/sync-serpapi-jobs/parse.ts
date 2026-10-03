// Turns SerpApi Google Jobs results into rows for public.jobs, dropping the
// ones not worth showing students. Pure functions, so they're testable
// without the network.

export const BRANCHES = {
  cs: "software engineer",
  it: "IT support engineer",
  ai: "AI ML engineer",
  ece: "electronics engineer",
  eee: "electrical engineer",
  mech: "mechanical engineer",
  civil: "civil engineer",
} as const;

export type Branch = keyof typeof BRANCHES;

/** One result from SerpApi's `jobs_results`; only the fields we read. */
export type SerpJob = {
  title?: string;
  company_name?: string;
  location?: string;
  via?: string;
  description?: string;
  thumbnail?: string;
  extensions?: string[];
  apply_options?: { title?: string; link?: string }[];
  job_id?: string;
};

/** A row for public.jobs (snake_case, as the table has it). */
export type JobRow = {
  slug: string;
  title: string;
  company: string;
  logo_url: string | null;
  location: string;
  work_mode: "onsite" | "remote" | "hybrid";
  job_type: "full-time" | "part-time" | "internship" | "contract";
  experience: "fresher" | "0-2 years" | "2-5 years" | "5+ years" | "not specified";
  salary: string | null;
  description: string;
  apply_url: string;
  posted_at: string;
  branch: Branch;
};

/** Why a result was left out, counted per run to tune the filters. */
export type DropReason =
  | "missing fields"
  | "junk company"
  | "junk title"
  | "junk salary"
  | "thin description"
  | "no trusted apply link";

// Job boards students can trust, best first. A result only on other sites
// (blogs, reposting aggregators) is dropped.
const BOARDS = [
  "naukri.com",
  "linkedin.com",
  "indeed.com",
  "foundit.in",
  "shine.com",
  "glassdoor.co.in",
  "glassdoor.com",
  "internshala.com",
  "instahyre.com",
  "hirist.tech",
  "iimjobs.com",
  "cutshort.io",
  "wellfound.com",
  "unstop.com",
  "apna.co",
  "timesjobs.com",
  "simplyhired.co.in",
  "simplyhired.com",
  "adzuna.in",
];

// Hiring systems companies run their own careers pages on.
const APPLICANT_TRACKING = [
  "myworkdayjobs.com",
  "oraclecloud.com",
  "successfactors.com",
  "successfactors.eu",
  "greenhouse.io",
  "lever.co",
  "smartrecruiters.com",
  "icims.com",
  "taleo.net",
  "workable.com",
  "ashbyhq.com",
  "zohorecruit.com",
  "zohorecruit.in",
  "keka.com",
  "darwinbox.in",
  "freshteam.com",
  "recruitee.com",
  "eightfold.ai",
  "phenompeople.com",
];

function hostOf(link: string) {
  try {
    return new URL(link).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const onDomain = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/** Letters and digits only, lowercased: "Hitachi Energy" -> "hitachienergy". */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The best place to apply: the company's own careers site, else the best job
 * board. Null when every link is somewhere we don't trust.
 */
export function pickApplyUrl(job: SerpJob): string | null {
  const options = (job.apply_options ?? []).filter((o) => o.link?.startsWith("https://"));
  // The company's first word, e.g. "hitachi" from "Hitachi Global".
  const companyWord = squash((job.company_name ?? "").split(/\s+/)[0] ?? "");

  const ownSite = options.find((o) => {
    const host = hostOf(o.link!);
    const title = (o.title ?? "").toLowerCase();
    return (
      APPLICANT_TRACKING.some((d) => onDomain(host, d)) ||
      /\bcareers?\b/.test(title) ||
      (companyWord.length >= 4 && squash(host).includes(companyWord))
    );
  });
  if (ownSite) return ownSite.link!;

  let best: { link: string; rank: number } | null = null;
  for (const o of options) {
    const rank = BOARDS.findIndex((d) => onDomain(hostOf(o.link!), d));
    if (rank >= 0 && (!best || rank < best.rank)) best = { link: o.link!, rank };
  }
  return best?.link ?? null;
}

/** "₹4L–₹7L a year" -> [400000, 700000]; null without a range. */
function salaryRange(text: string): [number, number] | null {
  const amounts = [...text.matchAll(/₹\s?([\d.,]+)\s?(K|L|Cr)?/gi)].map(([, n, unit]) => {
    const value = Number(n.replace(/,/g, ""));
    const scale = { k: 1e3, l: 1e5, cr: 1e7 }[(unit ?? "").toLowerCase()] ?? 1;
    return value * scale;
  });
  return amounts.length >= 2 && amounts.every(Number.isFinite) ? [amounts[0], amounts[1]] : null;
}

/** "3 days ago" -> that moment; `now` when it can't tell. */
export function postedAt(extensions: string[], now: Date): Date {
  for (const ext of extensions) {
    const text = ext.toLowerCase();
    if (text === "yesterday") return new Date(now.getTime() - 86_400_000);
    const match = text.match(/^(\d+)\+?\s+(minute|hour|day|week|month)s?\s+ago$/);
    if (match) {
      const unit = { minute: 60e3, hour: 3600e3, day: 86_400e3, week: 7 * 86_400e3, month: 30 * 86_400e3 }[
        match[2] as "minute" | "hour" | "day" | "week" | "month"
      ];
      return new Date(now.getTime() - Number(match[1]) * unit);
    }
  }
  return now;
}

/** From the title (and a few phrases in the description). */
export function experienceOf(title: string, description: string): JobRow["experience"] {
  const t = title.toLowerCase();
  if (/\b(intern|internship|trainee|fresher|freshers|graduate|entry[- ]level|campus|apprentice|junior|jr)\b/.test(t)) {
    return "fresher";
  }
  if (/\b(senior|sr|lead|manager|principal|head|architect|director|staff)\b/.test(t)) return "5+ years";
  if (/\b(ii|iii|2|3|mid[- ]level)\b/.test(t)) return "2-5 years";
  if (/\bfreshers?\b.{0,40}\b(can|may) apply\b|\bfreshers? (are )?(eligible|welcome)\b|\b0\s*(-|–|to)\s*[12]\s*(years|yrs)\b/i.test(description)) {
    return "fresher";
  }
  return "not specified";
}

/** Short hex SHA-1 of the job's id, for a stable slug. */
async function shortHash(text: string) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/** One SerpApi result as a row, or why it was left out. */
export async function toRow(
  job: SerpJob,
  branch: Branch,
  now: Date,
): Promise<{ row: JobRow } | { dropped: DropReason }> {
  const title = job.title?.trim() ?? "";
  // "Emerson Career Site" -> "Emerson".
  const company = (job.company_name ?? "").replace(/\s+(career site|careers?)$/i, "").trim();
  const description = (job.description ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const extensions = job.extensions ?? [];
  if (!title || !company || !job.job_id) return { dropped: "missing fields" };

  // E.g. "httpswwwicloudemscomvlog", or a site's name instead of a company's.
  if (/^(https?|www)/i.test(company) || /\.(com|in|org|net|co)\b/i.test(company)) {
    return { dropped: "junk company" };
  }
  // Keyword-stuffed ("FRESHER web design.java.react.php…"), shouting, or a
  // listing page rather than a job ("Fresher Software Engineer jobs in India").
  const letters = title.replace(/[^a-z]/gi, "");
  const upper = title.replace(/[^A-Z]/g, "").length;
  if (
    title.length > 100 ||
    (title.match(/[./]/g) ?? []).length >= 3 ||
    (letters.length > 15 && upper / letters.length > 0.7) ||
    /\bjobs (in|for)\b/i.test(title)
  ) {
    return { dropped: "junk title" };
  }
  const salary = extensions.find((e) => e.includes("₹")) ?? null;
  const range = salary ? salaryRange(salary) : null;
  // "₹1L–₹50L a year": a range that wide isn't a real offer.
  if (range && range[0] > 0 && range[1] / range[0] > 10) return { dropped: "junk salary" };
  if (description.length < 200) return { dropped: "thin description" };

  const applyUrl = pickApplyUrl(job);
  if (!applyUrl) return { dropped: "no trusted apply link" };

  const ext = extensions.join(" ").toLowerCase();
  const location = (job.location ?? "").replace(/\s*\(\+\d+ others?\)/i, "").trim();
  const remote = ext.includes("work from home") || /^anywhere$/i.test(location);

  return {
    row: {
      slug: `serpapi-${await shortHash(job.job_id)}`,
      title,
      company,
      logo_url: job.thumbnail?.startsWith("https://") ? job.thumbnail : null,
      location: remote && (!location || /^anywhere$/i.test(location)) ? "Remote" : location || "India",
      work_mode: remote ? "remote" : /\bhybrid\b/i.test(`${title} ${description}`) ? "hybrid" : "onsite",
      job_type: /intern/.test(ext) || /\bintern(ship)?\b/i.test(title)
        ? "internship"
        : /part.time/.test(ext)
          ? "part-time"
          : /contract|temporary/.test(ext)
            ? "contract"
            : "full-time",
      experience: experienceOf(title, description),
      salary,
      // Long enough for any real posting; keeps the table (and the app's one
      // request for every job) small.
      description: description.slice(0, 10_000),
      apply_url: applyUrl,
      posted_at: postedAt(extensions, now).toISOString(),
      branch,
    },
  };
}
