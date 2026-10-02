-- Order the Practice screen the way students prepare: aptitude (non-tech)
-- first, then technical skills, then company exams. CS Fundamentals is
-- technical, so it moves out of aptitude.

update public.sections set slug = 'technical', title = 'Technical', position = 2
  where slug = 'coding';
update public.sections set title = 'Aptitude', position = 1
  where slug = 'aptitude';
update public.sections set position = 3 where slug = 'indian-companies';
update public.sections set position = 4 where slug = 'international-companies';

update public.categories
  set section_id = (select id from public.sections where slug = 'technical')
  where slug = 'cs-fundamentals';

update public.categories c set position = v.position
from (values
  ('basics', 1),
  ('dsa', 2),
  ('cs-fundamentals', 3),
  ('sql', 4),
  ('interview', 5),
  ('system-design', 6)
) as v (slug, position)
where c.slug = v.slug;
