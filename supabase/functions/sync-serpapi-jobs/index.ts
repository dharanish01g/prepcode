// Once a day (pg_cron, see the jobs_serpapi migration): one Google Jobs search
// per engineering branch through SerpApi, filtered and upserted into
// public.jobs. The free plan allows 250 searches a month; the database lets
// this run at most once per Indian calendar day, so 7 a day stays under it
// whoever calls the function.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { BRANCHES, type Branch, type DropReason, type JobRow, type SerpJob, toRow } from "./parse.ts";

// Transaction pooler: no prepared statements.
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });

async function search(branch: Branch, apiKey: string): Promise<SerpJob[]> {
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: BRANCHES[branch],
    location: "India",
    // Indian Google, in English: real employers with cities, and labels
    // ("3 days ago", "₹4L–₹7L a year") the parser understands.
    google_domain: "google.co.in",
    gl: "in",
    hl: "en",
    api_key: apiKey,
  });
  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  // SerpApi reports "no results" as an error; it's just an empty day.
  if (typeof body.error === "string" && /hasn't returned any results/i.test(body.error)) return [];
  if (!response.ok || body.error) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body.jobs_results ?? [];
}

type BranchReport =
  | { fetched: number; kept: number; dropped: Partial<Record<DropReason, number>> }
  | { error: string };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Only pg_cron knows this secret: it's generated in the database, in Vault.
  const [secret] = await sql`
    select decrypted_secret from vault.decrypted_secrets where name = 'jobs_sync_secret'`;
  if (!secret || req.headers.get("x-sync-secret") !== secret.decrypted_secret) {
    return new Response("Forbidden", { status: 403 });
  }
  const apiKey = Deno.env.get("SERPAPI_KEY");
  if (!apiKey) return Response.json({ error: "SERPAPI_KEY isn't set" }, { status: 500 });

  const [{ run_id: runId }] = await sql`select private.claim_serpapi_run() as run_id`;
  if (runId === null) {
    return Response.json({ skipped: "Already ran today (India time)" }, { status: 409 });
  }

  const now = new Date();
  const rows = new Map<string, JobRow>();
  const branches: Partial<Record<Branch, BranchReport>> = {};
  const errors: string[] = [];
  for (const branch of Object.keys(BRANCHES) as Branch[]) {
    try {
      const jobs = await search(branch, apiKey);
      const dropped: Partial<Record<DropReason, number>> = {};
      let kept = 0;
      for (const job of jobs) {
        const result = await toRow(job, branch, now);
        if ("dropped" in result) {
          dropped[result.dropped] = (dropped[result.dropped] ?? 0) + 1;
        } else {
          kept++;
          // A job found by two branches' searches keeps the first branch.
          if (!rows.has(result.row.slug)) rows.set(result.row.slug, result.row);
        }
      }
      branches[branch] = { fetched: jobs.length, kept, dropped };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`${branch}: ${message}`);
      branches[branch] = { error: message };
    }
  }

  let upserted = 0;
  try {
    [{ upserted }] = await sql`
      select private.upsert_serpapi_jobs(${sql.json([...rows.values()])}) as upserted`;
  } catch (e) {
    errors.push(`saving: ${e instanceof Error ? e.message : String(e)}`);
  }
  await sql`
    update private.job_sync_runs
    set upserted = ${upserted}, error = ${errors.length ? errors.join("; ") : null}
    where id = ${runId}`;

  return Response.json({ upserted, branches, errors });
});
