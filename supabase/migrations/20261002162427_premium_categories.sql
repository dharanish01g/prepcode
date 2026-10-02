-- Paid categories, marked with a star on the Practice screen.
alter table public.categories add column premium boolean not null default false;

-- To preview how a paid category looks.
update public.categories set premium = true where slug = 'ibm';
