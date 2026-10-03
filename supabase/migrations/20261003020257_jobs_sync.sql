-- Real openings instead of hand-written samples: every 6 hours a pg_cron job
-- calls free public job APIs (Arbeitnow, Himalayas, Jobicy, The Muse) and
-- upserts what they return into public.jobs. Rows the APIs stop returning are
-- dropped after a few days, so the table stays a few hundred fresh jobs.
--
-- Each API asks to be credited with a link back: `source` says which one a job
-- came from, and apply_url is the job's page on that site.

create extension if not exists http with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- 'manual' for rows added by hand (the admin website, later); otherwise the
-- API the row came from.
alter table public.jobs
  add column source text not null default 'manual',
  -- When the sync last saw this job in its API; null for manual rows.
  add column last_seen_at timestamptz;

alter table public.jobs
  drop constraint jobs_job_type_check,
  add constraint jobs_job_type_check
    check (job_type in ('full-time', 'part-time', 'internship', 'contract')),
  drop constraint jobs_experience_check,
  add constraint jobs_experience_check
    check (experience in ('fresher', '0-2 years', '2-5 years', '5+ years', 'not specified'));

-- API locations often contain commas themselves ("Princeton, NJ"), so several
-- locations are separated by semicolons instead.
comment on column public.jobs.location is
  'One location, or several separated by "; ", e.g. "Berlin; Munich".';

-- The sample listings from the jobs migration.
delete from public.jobs where source = 'manual';

-- Not exposed through the Data API: nothing here is callable from the app.
create schema if not exists private;

-- One row per API per sync, to see what each run fetched or why it failed.
create table private.job_sync_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  source text not null,
  upserted int,
  error text
);

-- GET a JSON API. The Muse rejects requests without a User-Agent.
create function private.fetch_json(url text) returns jsonb
language plpgsql as $$
declare
  response extensions.http_response;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '60');
  response := extensions.http((
    'GET', url,
    array[extensions.http_header('User-Agent', 'prepcode-jobs-sync/1.0')],
    null, null
  )::extensions.http_request);
  if response.status <> 200 then
    raise exception 'GET % returned %', url, response.status;
  end if;
  return response.content::jsonb;
end;
$$;

-- "&amp;" to "&", "&#8217;" to "’", and so on.
create function private.decode_entities(s text) returns text
language plpgsql immutable as $$
declare
  code text;
begin
  if s is null then
    return null;
  end if;
  for code in select distinct m[1] from regexp_matches(s, '&#([0-9]{1,7});', 'g') m loop
    if code::int between 1 and 1114111 and code::int not between 55296 and 57343 then
      s := replace(s, '&#' || code || ';', chr(code::int));
    end if;
  end loop;
  for code in select distinct m[1] from regexp_matches(s, '&#x([0-9a-fA-F]{1,6});', 'g') m loop
    declare
      n int := ('x' || lpad(code, 8, '0'))::bit(32)::int;
    begin
      if n between 1 and 1114111 and n not between 55296 and 57343 then
        s := replace(s, '&#x' || code || ';', chr(n));
      end if;
    end;
  end loop;
  s := replace(s, '&nbsp;', ' ');
  s := replace(s, '&quot;', '"');
  s := replace(s, '&apos;', '''');
  s := replace(s, '&lt;', '<');
  s := replace(s, '&gt;', '>');
  s := replace(s, '&hellip;', '…');
  s := replace(s, '&ndash;', '–');
  s := replace(s, '&mdash;', '—');
  s := replace(s, '&lsquo;', '‘');
  s := replace(s, '&rsquo;', '’');
  s := replace(s, '&ldquo;', '“');
  s := replace(s, '&rdquo;', '”');
  s := replace(s, '&bull;', '•');
  s := replace(s, '&euro;', '€');
  s := replace(s, '&pound;', '£');
  -- Last, so "&amp;lt;" becomes "&lt;" and not "<".
  return replace(s, '&amp;', '&');
end;
$$;

-- The APIs send HTML descriptions; the app renders markdown. Keeps headings,
-- paragraphs, lists and bold, and drops every other tag (links, images,
-- scripts).
create function private.html_to_markdown(html text) returns text
language plpgsql immutable as $$
declare
  s text := coalesce(html, '');
begin
  s := regexp_replace(s, '<(script|style)[^>]*>.*?</\1>', '', 'gi');
  -- Line breaks in HTML source are just spaces.
  s := regexp_replace(s, '\s+', ' ', 'g');
  s := regexp_replace(s, '<br\s*/?>', E'\n', 'gi');
  s := regexp_replace(s, '<h[1-6](\s[^>]*)?>', E'\n\n### ', 'gi');
  s := regexp_replace(s, '</h[1-6]>', E'\n\n', 'gi');
  s := regexp_replace(s, '<li(\s[^>]*)?>', E'\n- ', 'gi');
  s := regexp_replace(s, '</?(p|div|ul|ol|section|article|table|tr|blockquote)(\s[^>]*)?>', E'\n\n', 'gi');
  s := regexp_replace(s, '</?(strong|b)(\s[^>]*)?>', '**', 'gi');
  s := regexp_replace(s, '<[^>]*>', '', 'g');
  s := private.decode_entities(s);
  s := regexp_replace(s, '\*\*\s*\*\*', '', 'g');
  s := regexp_replace(s, '[ \t]+\n', E'\n', 'g');
  s := regexp_replace(s, '\n[ \t]+', E'\n', 'g');
  -- A list item whose text was wrapped in <p>.
  s := regexp_replace(s, '\n-\n+', E'\n- ', 'g');
  s := regexp_replace(s, '\n{3,}', E'\n\n', 'g');
  return trim(s);
end;
$$;

-- E.g. "USD 120,000–135,000 / year"; null when the API gives no salary.
create function private.format_salary(low numeric, high numeric, currency text, period text)
returns text
language sql immutable as $$
  select case
    when coalesce(low, high) is null or coalesce(low, high) <= 0 then null
    else trim(
      coalesce(currency || ' ', '')
      || to_char(round(coalesce(low, high)), 'FM999,999,999')
      || case when high > low then '–' || to_char(round(high), 'FM999,999,999') else '' end
      || coalesce(' / ' || case lower(period)
           when 'annual' then 'year' when 'yearly' then 'year' when 'year' then 'year'
           when 'monthly' then 'month' when 'month' then 'month'
           when 'hourly' then 'hour' when 'hour' then 'hour'
         end, '')
    )
  end;
$$;

-- https://www.arbeitnow.com/api/job-board-api: newest ~325 jobs, mostly in
-- Europe. Descriptions arrive HTML-escaped, so they're decoded once first.
create function private.sync_arbeitnow() returns int
language plpgsql as $$
declare
  body jsonb := private.fetch_json('https://www.arbeitnow.com/api/job-board-api');
  upserted int;
begin
  insert into public.jobs
    (slug, source, title, company, logo_url, location, work_mode, job_type, experience,
     salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
  select distinct on (slug) * from (
    select
      'arbeitnow-' || (j->>'slug') as slug,
      'arbeitnow',
      private.decode_entities(j->>'title'),
      private.decode_entities(j->>'company_name'),
      null::text,
      coalesce(nullif(trim(j->>'location'), ''), 'Remote'),
      case when (j->>'remote')::boolean then 'remote' else 'onsite' end,
      case
        when types ~ '(intern|student|trainee|praktik)' then 'internship'
        when types ~ 'part' and types !~ 'full' then 'part-time'
        when types ~ '(contract|freelance|temporary|fixed term)' then 'contract'
        else 'full-time'
      end,
      case
        when types ~ '(intern|student|trainee|entry|berufseinstieg|graduate|junior)' then 'fresher'
        when types ~ '(senior|executive|lead)' then '5+ years'
        when types ~ '(mid|experienced|professional|berufserfahren)' then '2-5 years'
        else 'not specified'
      end,
      null::text,
      array(select jsonb_array_elements_text(j->'tags')),
      private.html_to_markdown(private.decode_entities(j->>'description')),
      j->>'url',
      to_timestamp((j->>'created_at')::bigint),
      null::date,
      now()
    from jsonb_array_elements(body->'data') j,
      lateral (select lower(coalesce((select string_agg(t, ' ') from jsonb_array_elements_text(j->'job_types') t), ''))) as x(types)
    where j->>'title' <> '' and j->>'company_name' <> '' and j->>'url' <> ''
  ) fetched
  on conflict (slug) do update set
    (title, company, logo_url, location, work_mode, job_type, experience,
     salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
    = (excluded.title, excluded.company, excluded.logo_url, excluded.location,
       excluded.work_mode, excluded.job_type, excluded.experience, excluded.salary,
       excluded.skills, excluded.description, excluded.apply_url, excluded.posted_at,
       excluded.deadline, excluded.last_seen_at);
  get diagnostics upserted = row_count;
  return upserted;
end;
$$;

-- https://himalayas.app/jobs/api: remote jobs, newest first, 20 per page.
create function private.sync_himalayas() returns int
language plpgsql as $$
declare
  next_cursor text;
  body jsonb;
  page_rows int;
  upserted int := 0;
begin
  for page in 1..10 loop
    body := private.fetch_json(
      'https://himalayas.app/jobs/api?limit=20'
      || coalesce('&cursor=' || extensions.urlencode(next_cursor), '')
    );
    insert into public.jobs
      (slug, source, title, company, logo_url, location, work_mode, job_type, experience,
       salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
    select distinct on (slug) * from (
      select
        'himalayas-' || md5(j->>'guid') as slug,
        'himalayas',
        private.decode_entities(j->>'title'),
        private.decode_entities(j->>'companyName'),
        nullif(j->>'companyLogo', ''),
        coalesce(
          (select string_agg(r, '; ') from jsonb_array_elements_text(j->'locationRestrictions') r),
          'Worldwide'
        ),
        'remote',
        case lower(j->>'employmentType')
          when 'part time' then 'part-time'
          when 'contractor' then 'contract'
          when 'temporary' then 'contract'
          when 'intern' then 'internship'
          when 'internship' then 'internship'
          else 'full-time'
        end,
        case
          when j->'seniority' ? 'Entry-level' then 'fresher'
          when j->'seniority' ? 'Mid-level' then '2-5 years'
          when jsonb_array_length(coalesce(j->'seniority', '[]')) > 0 then '5+ years'
          else 'not specified'
        end,
        private.format_salary(
          nullif(j->>'minSalary', '')::numeric, nullif(j->>'maxSalary', '')::numeric,
          j->>'currency', j->>'salaryPeriod'
        ),
        array(select jsonb_array_elements_text(coalesce(j->'parentCategories', '[]'))),
        private.html_to_markdown(j->>'description'),
        j->>'applicationLink',
        to_timestamp((j->>'pubDate')::bigint),
        to_timestamp((j->>'expiryDate')::bigint)::date,
        now()
      from jsonb_array_elements(body->'jobs') j
      where j->>'title' <> '' and j->>'companyName' <> '' and j->>'applicationLink' <> ''
    ) fetched
    on conflict (slug) do update set
      (title, company, logo_url, location, work_mode, job_type, experience,
       salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
      = (excluded.title, excluded.company, excluded.logo_url, excluded.location,
         excluded.work_mode, excluded.job_type, excluded.experience, excluded.salary,
         excluded.skills, excluded.description, excluded.apply_url, excluded.posted_at,
         excluded.deadline, excluded.last_seen_at);
    get diagnostics page_rows = row_count;
    upserted := upserted + page_rows;
    next_cursor := body->>'nextCursor';
    exit when next_cursor is null;
  end loop;
  return upserted;
end;
$$;

-- https://jobicy.com/api/v2/remote-jobs: newest 100 remote jobs.
create function private.sync_jobicy() returns int
language plpgsql as $$
declare
  body jsonb := private.fetch_json('https://jobicy.com/api/v2/remote-jobs?count=100');
  upserted int;
begin
  insert into public.jobs
    (slug, source, title, company, logo_url, location, work_mode, job_type, experience,
     salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
  select distinct on (slug) * from (
    select
      'jobicy-' || (j->>'id') as slug,
      'jobicy',
      private.decode_entities(j->>'jobTitle'),
      private.decode_entities(j->>'companyName'),
      nullif(j->>'companyLogo', ''),
      coalesce(nullif(regexp_replace(trim(j->>'jobGeo'), '\s*,\s*', '; ', 'g'), ''), 'Anywhere'),
      'remote',
      case lower(j->'jobType'->>0)
        when 'part-time' then 'part-time'
        when 'contract' then 'contract'
        when 'internship' then 'internship'
        else 'full-time'
      end,
      case
        when j->>'jobLevel' ilike '%entry%' or j->>'jobLevel' ilike '%junior%' then 'fresher'
        when j->>'jobLevel' ilike '%mid%' then '2-5 years'
        when j->>'jobLevel' in ('Senior', 'Director', 'Manager', 'Lead') then '5+ years'
        else 'not specified'
      end,
      private.format_salary(
        nullif(j->>'salaryMin', '')::numeric, nullif(j->>'salaryMax', '')::numeric,
        j->>'salaryCurrency', j->>'salaryPeriod'
      ),
      array(select private.decode_entities(i) from jsonb_array_elements_text(coalesce(j->'jobIndustry', '[]')) i),
      private.html_to_markdown(j->>'jobDescription'),
      j->>'url',
      (j->>'pubDate')::timestamptz,
      null::date,
      now()
    from jsonb_array_elements(body->'jobs') j
    where j->>'jobTitle' <> '' and j->>'companyName' <> '' and j->>'url' <> ''
  ) fetched
  on conflict (slug) do update set
    (title, company, logo_url, location, work_mode, job_type, experience,
     salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
    = (excluded.title, excluded.company, excluded.logo_url, excluded.location,
       excluded.work_mode, excluded.job_type, excluded.experience, excluded.salary,
       excluded.skills, excluded.description, excluded.apply_url, excluded.posted_at,
       excluded.deadline, excluded.last_seen_at);
  get diagnostics upserted = row_count;
  return upserted;
end;
$$;

-- https://www.themuse.com/api/public/jobs: a large global feed, but unordered
-- and full of year-old listings, so only the last 30 days' jobs are kept.
create function private.sync_themuse() returns int
language plpgsql as $$
declare
  body jsonb;
  page_rows int;
  upserted int := 0;
begin
  for page in 1..10 loop
    body := private.fetch_json('https://www.themuse.com/api/public/jobs?page=' || page);
    insert into public.jobs
      (slug, source, title, company, logo_url, location, work_mode, job_type, experience,
       salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
    select distinct on (slug) * from (
      select
        'themuse-' || (j->>'id') as slug,
        'themuse',
        private.decode_entities(j->>'name'),
        private.decode_entities(j->'company'->>'name'),
        null::text,
        coalesce(
          (select string_agg(l->>'name', '; ') from jsonb_array_elements(j->'locations') l
           where l->>'name' <> 'Flexible / Remote'),
          'Remote'
        ),
        case when j->'locations' @> '[{"name": "Flexible / Remote"}]' then 'remote' else 'onsite' end,
        case when j->'levels' @> '[{"name": "Internship"}]' then 'internship' else 'full-time' end,
        case
          when j->'levels' @> '[{"name": "Internship"}]'
            or j->'levels' @> '[{"name": "Entry Level"}]' then 'fresher'
          when j->'levels' @> '[{"name": "Mid Level"}]' then '2-5 years'
          when j->'levels' @> '[{"name": "Senior Level"}]'
            or j->'levels' @> '[{"name": "management"}]' then '5+ years'
          else 'not specified'
        end,
        null::text,
        array(select c->>'name' from jsonb_array_elements(j->'categories') c),
        private.html_to_markdown(j->>'contents'),
        j->'refs'->>'landing_page',
        (j->>'publication_date')::timestamptz,
        null::date,
        now()
      from jsonb_array_elements(body->'results') j
      where (j->>'publication_date')::timestamptz > now() - interval '30 days'
        and j->>'name' <> '' and j->'company'->>'name' <> ''
        and j->'refs'->>'landing_page' <> ''
    ) fetched
    on conflict (slug) do update set
      (title, company, logo_url, location, work_mode, job_type, experience,
       salary, skills, description, apply_url, posted_at, deadline, last_seen_at)
      = (excluded.title, excluded.company, excluded.logo_url, excluded.location,
         excluded.work_mode, excluded.job_type, excluded.experience, excluded.salary,
         excluded.skills, excluded.description, excluded.apply_url, excluded.posted_at,
         excluded.deadline, excluded.last_seen_at);
    get diagnostics page_rows = row_count;
    upserted := upserted + page_rows;
  end loop;
  return upserted;
end;
$$;

-- Syncs every API (one failing doesn't stop the others), then drops jobs no API
-- has returned for 3 days or posted over 60 days ago.
create function private.sync_jobs() returns void
language plpgsql as $$
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
  where source <> 'manual'
    and (last_seen_at < now() - interval '3 days' or posted_at < now() - interval '60 days');

  delete from private.job_sync_runs where ran_at < now() - interval '30 days';
end;
$$;

-- Every 6 hours, on the hour (UTC). A run takes about a minute, more than
-- some roles' default statement timeout.
select cron.schedule(
  'sync-jobs',
  '0 */6 * * *',
  $$set statement_timeout = '10min'; select private.sync_jobs();$$
);
