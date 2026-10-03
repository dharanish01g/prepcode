-- Any job published over 90 days ago is removed, including ones added by hand:
-- by then it's stale or someone forgot to take it down. This replaces the
-- 60-day rule for synced jobs.
--
-- Indian jobs matter most to students, so SerpApi now gets most of the
-- 900-row cap (under the Data API's 1000-row limit the app reads in one
-- request). At ~56 jobs a day, 700 rows is about 12 days of them. The abroad
-- feeds refill their caps within hours, so they keep only a small sample.
--
-- create or replace swaps the whole function: copy it from the latest
-- migration that defines it, or older rules come back.
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

  delete from public.jobs where posted_at < now() - interval '90 days';

  delete from public.jobs
  using (
    select id, source, row_number() over (partition by source order by posted_at desc) as newest
    from public.jobs
    where source <> 'manual'
  ) ranked
  where public.jobs.id = ranked.id
    and ranked.newest > case ranked.source
      when 'serpapi' then 700
      when 'arbeitnow' then 80
      when 'himalayas' then 60
      else 30
    end;

  delete from private.job_sync_runs where ran_at < now() - interval '30 days';
end;
$$;
