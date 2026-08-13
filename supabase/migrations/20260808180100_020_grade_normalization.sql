set search_path = '';

create table if not exists public.grade_systems (
  id serial primary key,
  country_code text not null,
  system_name text not null,
  scale_max numeric(5,2) not null,
  first_class_min numeric(5,2),
  second_upper_min numeric(5,2),
  pass_min numeric(5,2),
  percentile_formula text not null default 'linear',
  notes text,
  unique(country_code, system_name)
);

-- Enable RLS
alter table public.grade_systems enable row level security;

create policy "grade_systems readable by everyone"
  on public.grade_systems for select
  using (true);

insert into public.grade_systems (country_code, system_name, scale_max, first_class_min, second_upper_min, pass_min, percentile_formula) values
('PK', 'CGPA', 4.0, 3.5, 3.0, 2.0, 'linear'),
('PK', 'Percentage', 100, 70, 60, 50, 'linear'),
('IN', 'CGPA', 10.0, 8.0, 6.5, 5.0, 'linear'),
('IN', 'Percentage', 100, 70, 60, 50, 'linear'),
('BD', 'CGPA', 4.0, 3.5, 3.0, 2.0, 'linear'),
('GB', 'Classification', 100, 70, 60, 40, 'linear'),
('US', 'GPA', 4.0, 3.9, 3.7, 2.0, 'linear'),
('DE', '1.0-5.0 INVERTED', 5.0, 1.5, 2.5, 4.0, 'inverted'),
('CN', 'Percentage', 100, 90, 80, 60, 'linear'),
('JP', 'GPA', 4.0, 3.5, 3.0, 2.0, 'linear'),
('KR', 'CGPA', 4.5, 4.0, 3.5, 2.0, 'linear'),
('AU', 'GPA', 7.0, 6.0, 5.0, 3.0, 'linear'),
('TR', 'CGPA', 4.0, 3.5, 3.0, 2.0, 'linear')
on conflict (country_code, system_name) do nothing;
