-- Company logos for the Practice cards, in place of the generic icon: an
-- image URL, either https or an inline data URL.
alter table public.categories add column logo_url text;
