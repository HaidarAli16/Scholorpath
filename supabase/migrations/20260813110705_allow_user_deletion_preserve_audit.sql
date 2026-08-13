alter table public.audit_events
  drop constraint if exists audit_events_actor_user_id_fkey;

alter table public.audit_events
  add constraint audit_events_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

comment on column public.audit_events.actor_user_id is
  'Optional actor reference. Audit history is retained and anonymised when an account is deleted.';
