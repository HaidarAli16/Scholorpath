-- Normalize catalogue display text to transport-safe ASCII punctuation.
-- This corrects records whose en dash was corrupted during remote migration transport.

update public.programmes
set title = 'MSc Computer Science - Data Science'
where slug = 'trinity-computer-science-data-science-msc-2026';

update public.scholarships
set title = 'Chevening Scholarship 2027-28',
    cycle_label = '2027-28'
where slug = 'chevening-scholarship-2027-28';

update public.scholarships
set title = 'NL Scholarship 2026-27',
    cycle_label = '2026-27'
where slug = 'nl-scholarship-2026-27';

update public.scholarships
set title = 'Development-Related Postgraduate Courses (EPOS) 2027-28',
    cycle_label = '2027-28'
where slug = 'daad-epos-2027-28';
