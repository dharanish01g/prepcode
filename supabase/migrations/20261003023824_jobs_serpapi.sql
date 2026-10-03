-- Indian jobs by engineering branch, from Google Jobs through SerpApi. Once a
-- day pg_cron calls the sync-serpapi-jobs Edge Function, which runs one search
-- per branch (7 a day, under the free plan's 250 a month), filters out junk
-- and upserts the rest here with source 'serpapi'.

alter table public.jobs
  add column branch text check (branch in ('cs', 'it', 'ai', 'ece', 'eee', 'mech', 'civil'));

comment on column public.jobs.branch is
  'The engineering branch a job is for (SerpApi jobs); null when unknown.';

-- What pg_cron sends the Edge Function to prove the call is the schedule.
-- Generated here, so it's in Vault and never in git.
select vault.create_secret(
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  'jobs_sync_secret',
  'Sent by pg_cron to the sync-serpapi-jobs Edge Function'
);

-- Starts a SerpApi run unless one already ran today in India, so however often
-- the function is called, it spends at most one day's searches per day.
create function private.claim_serpapi_run() returns bigint
language plpgsql
set search_path = ''
as $$
declare
  run_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('sync-serpapi-jobs'));
  if exists (
    select 1 from private.job_sync_runs
    where source = 'serpapi'
      and (ran_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date
  ) then
    return null;
  end if;
  insert into private.job_sync_runs (source) values ('serpapi') returning id into run_id;
  return run_id;
end;
$$;

-- Upserts the Edge Function's rows (already filtered and mapped).
create function private.upsert_serpapi_jobs(rows jsonb) returns int
language plpgsql
set search_path = ''
as $$
declare
  upserted int;
begin
  insert into public.jobs
    (slug, source, branch, title, company, logo_url, location, work_mode, job_type,
     experience, salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
  select
    r.slug, 'serpapi', r.branch, r.title, r.company, r.logo_url, r.location, r.work_mode,
    r.job_type, r.experience, r.salary, '{}', r.description, r.apply_url, r.posted_at,
    null, now()
  from jsonb_to_recordset(rows) as r(
    slug text, branch text, title text, company text, logo_url text, location text,
    work_mode text, job_type text, experience text, salary text, description text,
    apply_url text, posted_at timestamptz
  )
  on conflict (slug) do update set
    (branch, title, company, logo_url, location, work_mode, job_type, experience,
     salary, description, apply_url, last_seen_at)
    = (excluded.branch, excluded.title, excluded.company, excluded.logo_url,
       excluded.location, excluded.work_mode, excluded.job_type, excluded.experience,
       excluded.salary, excluded.description, excluded.apply_url, excluded.last_seen_at),
    -- "3 days ago" is coarse: keep the earliest estimate.
    posted_at = least(public.jobs.posted_at, excluded.posted_at);
  get diagnostics upserted = row_count;
  return upserted;
end;
$$;

-- Calls the Edge Function; 409 means today's run already happened.
create function private.trigger_serpapi_sync() returns void
language plpgsql
set search_path = ''
as $$
declare
  response extensions.http_response;
begin
  -- Seven searches of a few seconds each.
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '150');
  response := extensions.http((
    'POST',
    'https://osprwlsbdioyejpbwcmj.supabase.co/functions/v1/sync-serpapi-jobs',
    array[extensions.http_header(
      'x-sync-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'jobs_sync_secret')
    )],
    'application/json',
    '{}'
  )::extensions.http_request);
  if response.status not in (200, 409) then
    raise exception 'sync-serpapi-jobs returned %: %', response.status, left(response.content, 500);
  end if;
end;
$$;

-- 00:30 UTC is 6:00 in India.
select cron.schedule(
  'sync-serpapi-jobs',
  '30 0 * * *',
  $$select private.trigger_serpapi_sync();$$
);

-- Room for SerpApi in the 900-row cap (under the Data API's 1000-row limit the
-- app reads in one request): ~300 rows is about a week of its jobs.
create or replace function private.sync_jobs() returns void
language plpgsql
set search_path = ''
as $$
declare
  api text;
  upserted int;
begin
  foreach api in array array['arbeitnow', 'himalayas', 'jobicy', 'themuse'] loop
    begin
      execute format('select private.sync_%s()', api) into upserted;
      insert into private.job_sync_runs (source, upserted) values (api, upserted);
    exception when others then
      insert into private.job_sync_runs (source, error) values (api, sqlerrm);
    end;
  end loop;

  delete from public.jobs
  where source <> 'manual' and posted_at < now() - interval '60 days';

  delete from public.jobs
  using (
    select id, source, row_number() over (partition by source order by posted_at desc) as newest
    from public.jobs
    where source <> 'manual'
  ) ranked
  where public.jobs.id = ranked.id
    and ranked.newest > case ranked.source
      when 'serpapi' then 300
      when 'arbeitnow' then 250
      when 'himalayas' then 200
      else 75
    end;

  delete from private.job_sync_runs where ran_at < now() - interval '30 days';
end;
$$;
