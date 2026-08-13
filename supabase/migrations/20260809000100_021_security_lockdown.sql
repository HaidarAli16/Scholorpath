set search_path = '';

-- SECURITY DEFINER routines must never resolve attacker-controlled objects.
alter function public.create_notification(uuid, text, text, text, text, text, text)
  set search_path = pg_catalog, public;
alter function public.notify_matching_users_on_publish()
  set search_path = pg_catalog, public;
alter function public.notify_matching_users_on_programme_publish()
  set search_path = pg_catalog, public;

-- These are internal routines. Triggers and trusted service processes invoke them;
-- browser roles must not call them directly.
revoke all on function public.create_notification(uuid, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.notify_matching_users_on_publish() from public, anon, authenticated;
revoke all on function public.notify_matching_users_on_programme_publish() from public, anon, authenticated;
grant execute on function public.create_notification(uuid, text, text, text, text, text, text) to service_role;

-- Keep user-owned tables inaccessible unless a policy explicitly authorizes a row.
revoke all on table public.student_profiles, public.assessments, public.applications,
  public.application_requirements, public.tasks, public.task_events,
  public.documents, public.portfolios, public.portfolio_items,
  public.notifications, public.writing_items, public.funding_scenarios,
  public.offers, public.recommenders from anon;
