-- Pin search_path on the sync functions (Supabase lint 0011); they already
-- schema-qualify everything they use.
alter function private.fetch_json(text) set search_path = '';
alter function private.decode_entities(text) set search_path = '';
alter function private.html_to_markdown(text) set search_path = '';
alter function private.format_salary(numeric, numeric, text, text) set search_path = '';
alter function private.sync_arbeitnow() set search_path = '';
alter function private.sync_himalayas() set search_path = '';
alter function private.sync_jobicy() set search_path = '';
alter function private.sync_themuse() set search_path = '';
alter function private.sync_jobs() set search_path = '';
