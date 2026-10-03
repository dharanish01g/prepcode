-- Jobs screen: openings students can search, filter and apply to. Only
-- logged-in students see it; the app doesn't query this table for guests.
-- Anyone can read published jobs; only admins will write them (from the
-- admin website, later).

create table public.jobs (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  company text not null,
  -- The company's logo: an image URL, either https or an inline data URL.
  logo_url text,
  -- City, or e.g. "Bengaluru, Hyderabad" for several.
  location text not null,
  work_mode text not null check (work_mode in ('onsite', 'remote', 'hybrid')),
  job_type text not null check (job_type in ('full-time', 'internship', 'contract')),
  experience text not null check (experience in ('fresher', '0-2 years', '2-5 years', '5+ years')),
  -- Free text, e.g. "₹4–6 LPA" or "₹25,000/month"; null when not disclosed.
  salary text,
  skills text[] not null default '{}',
  -- Markdown: responsibilities, eligibility and how to apply.
  description text not null default '',
  -- Where Apply goes: the company's own careers page or posting.
  apply_url text not null,
  posted_at timestamptz not null default now(),
  -- Last day to apply; null when open until filled.
  deadline date,
  -- Hidden from the app until ready.
  published boolean not null default true
);

create index jobs_posted_at_idx on public.jobs (posted_at desc) where published;

alter table public.jobs enable row level security;

create policy "Anyone can read published jobs"
  on public.jobs for select
  to anon, authenticated
  using (published);

-- Sample listings to build the screen against; replace with real openings
-- before release. Apply links go to each company's careers site.
insert into public.jobs
  (slug, title, company, logo_url, location, work_mode, job_type, experience, salary, skills, description, apply_url, posted_at, deadline)
values
  ('tcs-ninja-2027', 'Assistant System Engineer (Ninja)', 'TCS',
   'https://www.tcs.com/favicon.ico',
   'Chennai, Bengaluru, Pune', 'onsite', 'full-time', 'fresher', '₹3.36 LPA',
   array['Java', 'Python', 'SQL', 'Aptitude'],
   E'## About the role\nJoin TCS as an Assistant System Engineer and work on client projects after initial training.\n\n## Eligibility\n- B.E./B.Tech/MCA/M.Sc graduating in 2027\n- 60% or above throughout\n- No active backlogs\n\n## Selection\n1. TCS NQT (aptitude and coding)\n2. Technical and HR interview',
   'https://www.tcs.com/careers', '2026-09-28', '2026-10-31'),

  ('infosys-se-2027', 'Systems Engineer', 'Infosys',
   'https://www.google.com/s2/favicons?domain=infosys.com&sz=64',
   'Mysuru, Bengaluru, Hyderabad', 'onsite', 'full-time', 'fresher', '₹3.6 LPA',
   array['Java', 'Python', 'DBMS', 'OOP'],
   E'## About the role\nStart with training at the Mysuru campus, then join a delivery team.\n\n## Eligibility\n- B.E./B.Tech/MCA/M.Sc, 2027 batch\n- 60% or above in 10th, 12th and degree\n\n## Selection\n1. Online test (reasoning, maths, verbal, pseudocode)\n2. Interview',
   'https://www.infosys.com/careers/', '2026-09-25', '2026-10-20'),

  ('zoho-mts-2027', 'Member Technical Staff', 'Zoho',
   'https://www.zohowebstatic.com/sites/zweb/images/favicon.ico',
   'Chennai', 'onsite', 'full-time', 'fresher', '₹6–8 LPA',
   array['C', 'Java', 'Data Structures', 'Problem Solving'],
   E'## About the role\nBuild and maintain features across Zoho''s products.\n\n## Eligibility\n- Any degree; strong programming skills matter more than marks\n\n## Selection\n1. Written test (C output and aptitude)\n2. Programming rounds\n3. Advanced programming\n4. Technical and HR interview',
   'https://www.zoho.com/careers/', '2026-09-30', null),

  ('accenture-ase-2027', 'Associate Software Engineer', 'Accenture',
   'https://www.accenture.com/favicon.ico',
   'Bengaluru, Hyderabad, Pune, Gurugram', 'hybrid', 'full-time', 'fresher', '₹4.5 LPA',
   array['Java', 'SQL', 'Cloud Basics', 'Communication'],
   E'## About the role\nWork on application development and maintenance for global clients.\n\n## Eligibility\n- B.E./B.Tech/M.E./M.Tech/MCA/M.Sc, 2027 batch\n- 65% or above, no active backlogs\n\n## Selection\n1. Cognitive and technical assessment\n2. Coding assessment\n3. Communication assessment\n4. Interview',
   'https://www.accenture.com/in-en/careers', '2026-09-22', '2026-10-15'),

  ('google-step-2027', 'STEP Intern', 'Google',
   'https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico',
   'Bengaluru, Hyderabad', 'onsite', 'internship', 'fresher', '₹1,00,000/month',
   array['Data Structures', 'Algorithms', 'C++', 'Java', 'Python'],
   E'## About the role\nA summer internship for first- and second-year students to work on a real software project with a Google team.\n\n## Eligibility\n- Currently in the first or second year of a B.E./B.Tech in CS or a related field\n\n## Selection\n1. Online coding challenge\n2. Two technical interviews',
   'https://www.google.com/about/careers/applications/', '2026-09-20', '2026-11-15'),

  ('microsoft-swe-intern-2027', 'Software Engineer Intern', 'Microsoft',
   'https://www.microsoft.com/favicon.ico?v2',
   'Hyderabad, Bengaluru', 'onsite', 'internship', 'fresher', '₹1,25,000/month',
   array['Data Structures', 'Algorithms', 'OOP', 'System Design Basics'],
   E'## About the role\nA 10–12 week internship building features on a Microsoft product team.\n\n## Eligibility\n- Pre-final year B.E./B.Tech/M.Tech in CS or a related field\n\n## Selection\n1. Online assessment (coding)\n2. Technical interviews',
   'https://careers.microsoft.com/', '2026-09-18', '2026-10-25'),

  ('amazon-sde1', 'Software Development Engineer I', 'Amazon',
   'https://www.amazon.com/favicon.ico',
   'Bengaluru, Hyderabad, Chennai', 'hybrid', 'full-time', '0-2 years', '₹18–28 LPA',
   array['Java', 'Data Structures', 'Algorithms', 'AWS'],
   E'## About the role\nDesign, build and own services used by millions of customers.\n\n## Requirements\n- 0–2 years of software development experience, or a 2026/2027 graduate\n- Strong data structures and problem solving\n\n## Selection\n1. Online assessment\n2. Three to four interviews, including a bar raiser',
   'https://www.amazon.jobs/', '2026-09-29', null),

  ('freshworks-frontend-intern', 'Frontend Developer Intern', 'Freshworks',
   'https://www.google.com/s2/favicons?domain=freshworks.com&sz=64',
   'Chennai', 'remote', 'internship', 'fresher', '₹35,000/month',
   array['JavaScript', 'React', 'HTML', 'CSS'],
   E'## About the role\nA six-month internship building UI for Freshworks products, with a chance of a full-time offer.\n\n## Eligibility\n- Final-year students of any degree with a portfolio or GitHub projects\n\n## Selection\n1. Take-home frontend task\n2. Technical interview\n3. HR interview',
   'https://www.freshworks.com/company/careers/', '2026-09-26', '2026-10-18'),

  ('wipro-elite-2027', 'Project Engineer (Elite NTH)', 'Wipro',
   'https://www.wipro.com/content/dam/nexus/en/favicon.png',
   'Bengaluru, Chennai, Kochi', 'onsite', 'full-time', 'fresher', '₹3.5 LPA',
   array['Java', 'Python', 'Aptitude', 'Communication'],
   E'## About the role\nJoin Wipro as a Project Engineer after the National Talent Hunt.\n\n## Eligibility\n- B.E./B.Tech, 2027 batch\n- 60% or above in 10th, 12th and degree\n\n## Selection\n1. Online assessment (aptitude, written communication, coding)\n2. Technical and HR interview',
   'https://careers.wipro.com/', '2026-09-24', '2026-10-28'),

  ('capgemini-analyst-contract', 'Data Analyst (Contract)', 'Capgemini',
   'https://www.capgemini.com/wp-content/uploads/2025/10/cropped-Capgemini_spade_32x32.png?w=192',
   'Mumbai', 'hybrid', 'contract', '2-5 years', null,
   array['SQL', 'Python', 'Power BI', 'Excel'],
   E'## About the role\nA 12-month contract building dashboards and reports for a banking client.\n\n## Requirements\n- 2–5 years with SQL and a BI tool\n- Comfortable presenting findings to business teams',
   'https://www.capgemini.com/in-en/careers/', '2026-09-27', null);
