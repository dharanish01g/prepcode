-- trim() only strips spaces, so synced descriptions started with blank lines.
create or replace function private.html_to_markdown(html text) returns text
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
  return btrim(s, E' \t\n');
end;
$$;

update public.jobs set description = btrim(description, E' \t\n') where source <> 'manual';
