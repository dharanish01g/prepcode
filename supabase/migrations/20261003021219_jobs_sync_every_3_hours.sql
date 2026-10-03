-- Sync every 3 hours instead of 6, and keep the table bounded. Dropping jobs
-- only once the APIs stopped returning them let it grow without limit: the
-- sync reads each feed's newest page, and Himalayas alone moves ~200 jobs an
-- hour past it. Now each source keeps its newest jobs up to a cap (900 rows in
-- all, under the Data API's 1000-row limit the app reads in one request).
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
      when 'arbeitnow' then 400
      when 'himalayas' then 300
      else 100
    end;

  delete from private.job_sync_runs where ran_at < now() - interval '30 days';
end;
$$;

-- Same job name, so this replaces the 6-hourly schedule.
select cron.schedule(
  'sync-jobs',
  '0 */3 * * *',
  $$set statement_timeout = '10min'; select private.sync_jobs();$$
);
