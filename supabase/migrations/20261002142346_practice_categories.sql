-- Practice screen: sections (e.g. "Indian Company Exams") holding categories
-- (e.g. "TCS NQT"), each shown as a card. Anyone can read them; only admins
-- will write them (from the admin website, later).

create table public.sections (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  -- Display order, smallest first.
  position integer not null default 0
);

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  section_id bigint not null references public.sections (id) on delete restrict,
  title text not null,
  description text not null default '',
  -- A lucide icon name (e.g. "brain") from the set the app knows.
  icon text,
  -- Markdown shown above the questions: e.g. a company's exam pattern and
  -- eligibility requirements.
  details text,
  -- Display order within the section, smallest first.
  position integer not null default 0,
  -- Hidden from the app until ready.
  published boolean not null default true
);

create index categories_section_id_idx on public.categories (section_id);

alter table public.sections enable row level security;
alter table public.categories enable row level security;

create policy "Anyone can read sections"
  on public.sections for select
  to anon, authenticated
  using (true);

create policy "Anyone can read published categories"
  on public.categories for select
  to anon, authenticated
  using (published);

insert into public.sections (slug, title, position) values
  ('coding', 'Coding', 1),
  ('indian-companies', 'Indian Company Exams', 2),
  ('international-companies', 'International Company Exams', 3),
  ('aptitude', 'Aptitude & Fundamentals', 4);

insert into public.categories (slug, section_id, title, description, icon, position)
select c.slug, s.id, c.title, c.description, c.icon, c.position
from (values
  ('basics', 'coding', 'Programming Basics', 'Patterns, number programs and loops: the first programs every exam asks.', 'square-terminal', 1),
  ('dsa', 'coding', 'DSA', 'Data structures and algorithms: arrays, strings, searching and more.', 'brain', 2),
  ('interview', 'coding', 'Interview Questions', 'Questions companies often ask in coding interviews.', 'briefcase', 3),
  ('sql', 'coding', 'SQL', 'Writing queries: filtering, joins and grouping.', 'database', 4),
  ('system-design', 'coding', 'System Design', 'Designing larger programs and how their parts fit together.', 'boxes', 5),

  ('tcs', 'indian-companies', 'TCS NQT', 'Coding and aptitude in the style of the TCS National Qualifier Test.', 'building-2', 1),
  ('infosys', 'indian-companies', 'Infosys', 'Coding questions in the style of Infosys hiring tests.', 'building-2', 2),
  ('wipro', 'indian-companies', 'Wipro', 'Coding and aptitude in the style of Wipro''s hiring tests.', 'building-2', 3),
  ('accenture', 'indian-companies', 'Accenture', 'Coding and cognitive questions in the style of Accenture''s tests.', 'building-2', 4),
  ('cognizant', 'indian-companies', 'Cognizant', 'Coding questions in the style of Cognizant GenC tests.', 'building-2', 5),
  ('capgemini', 'indian-companies', 'Capgemini', 'Coding and pseudocode questions in the style of Capgemini''s tests.', 'building-2', 6),
  ('hcltech', 'indian-companies', 'HCLTech', 'Coding and aptitude in the style of HCLTech''s hiring tests.', 'building-2', 7),
  ('tech-mahindra', 'indian-companies', 'Tech Mahindra', 'Coding and aptitude in the style of Tech Mahindra''s tests.', 'building-2', 8),
  ('zoho', 'indian-companies', 'Zoho', 'Programming round questions in the style of Zoho''s interviews.', 'building-2', 9),

  ('google', 'international-companies', 'Google', 'Coding questions in the style of Google''s online assessments and interviews.', 'globe', 1),
  ('microsoft', 'international-companies', 'Microsoft', 'Coding questions in the style of Microsoft''s online assessments.', 'globe', 2),
  ('amazon', 'international-companies', 'Amazon', 'Coding and work-style questions in the style of Amazon''s online assessment.', 'globe', 3),
  ('meta', 'international-companies', 'Meta', 'Coding questions in the style of Meta''s interviews.', 'globe', 4),
  ('adobe', 'international-companies', 'Adobe', 'Coding and aptitude in the style of Adobe''s hiring tests.', 'globe', 5),
  ('oracle', 'international-companies', 'Oracle', 'Coding and CS fundamentals in the style of Oracle''s hiring tests.', 'globe', 6),
  ('ibm', 'international-companies', 'IBM', 'Coding and cognitive questions in the style of IBM''s assessments.', 'globe', 7),
  ('deloitte', 'international-companies', 'Deloitte', 'Coding and aptitude in the style of Deloitte''s hiring tests.', 'globe', 8),
  ('goldman-sachs', 'international-companies', 'Goldman Sachs', 'Coding and quantitative questions in the style of Goldman Sachs'' tests.', 'globe', 9),
  ('jpmorgan', 'international-companies', 'JPMorgan Chase', 'Coding questions in the style of JPMorgan Chase''s assessments.', 'globe', 10),

  ('quantitative', 'aptitude', 'Quantitative Aptitude', 'Percentages, ratios, time and work, profit and loss.', 'calculator', 1),
  ('logical', 'aptitude', 'Logical Reasoning', 'Series, puzzles, seating arrangements and coding-decoding.', 'puzzle', 2),
  ('verbal', 'aptitude', 'Verbal Ability', 'Grammar, reading comprehension and vocabulary.', 'spell-check', 3),
  ('cs-fundamentals', 'aptitude', 'CS Fundamentals', 'OOP, DBMS, operating systems and computer networks.', 'cpu', 4)
) as c (slug, section_slug, title, description, icon, position)
join public.sections s on s.slug = c.section_slug;
