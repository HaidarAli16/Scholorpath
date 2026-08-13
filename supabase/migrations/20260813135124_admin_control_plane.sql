create table if not exists public.platform_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.-]{1,79}$'),
  category text not null default 'general' check (category ~ '^[a-z][a-z0-9_-]{1,39}$'),
  value jsonb not null default 'null'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from public, anon, authenticated;
grant all on public.platform_settings to service_role;

drop trigger if exists platform_settings_touch_updated on public.platform_settings;
create trigger platform_settings_touch_updated
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();

create index if not exists user_roles_role_user_idx on public.user_roles(role, user_id);
create index if not exists audit_events_created_idx on public.audit_events(created_at desc, id desc);
create index if not exists correction_tickets_updated_queue_idx on public.correction_tickets(status, updated_at desc);

create or replace function public.admin_replace_user_roles(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_roles public.app_role[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_roles public.app_role[];
  remaining_admins integer;
begin
  if p_actor_user_id is null or p_target_user_id is null then
    raise exception 'actor and target are required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = p_actor_user_id and role = 'admin'
  ) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct role_value order by role_value), array[]::public.app_role[])
  into normalized_roles
  from unnest(coalesce(p_roles, array[]::public.app_role[])) role_value;

  if cardinality(normalized_roles) = 0 then
    normalized_roles := array['student'::public.app_role];
  end if;

  if p_actor_user_id = p_target_user_id and not ('admin'::public.app_role = any(normalized_roles)) then
    raise exception 'you cannot remove your own admin role' using errcode = '23514';
  end if;

  perform pg_advisory_xact_lock(hashtext('candidroute-admin-role-guard'));
  if exists (
    select 1 from public.user_roles where user_id = p_target_user_id and role = 'admin'
  ) and not ('admin'::public.app_role = any(normalized_roles)) then
    select count(distinct user_id) into remaining_admins
    from public.user_roles where role = 'admin' and user_id <> p_target_user_id;
    if remaining_admins = 0 then
      raise exception 'the final administrator cannot be removed' using errcode = '23514';
    end if;
  end if;

  delete from public.user_roles where user_id = p_target_user_id;
  insert into public.user_roles(user_id, role, granted_by)
  select p_target_user_id, role_value, p_actor_user_id
  from unnest(normalized_roles) role_value;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, after_data)
  values (
    p_actor_user_id,
    'admin_roles_replaced',
    'user_roles',
    p_target_user_id::text,
    jsonb_build_object('roles', to_jsonb(normalized_roles))
  );

  return jsonb_build_object('user_id', p_target_user_id, 'roles', to_jsonb(normalized_roles));
end;
$$;

revoke all on function public.admin_replace_user_roles(uuid, uuid, public.app_role[]) from public, anon, authenticated;
grant execute on function public.admin_replace_user_roles(uuid, uuid, public.app_role[]) to service_role;

insert into public.platform_settings(key, category, value, description, is_public)
values
  ('product.name', 'product', '"CandidRoute"'::jsonb, 'Public product name.', true),
  ('recommendations.minimum_evidence_score', 'recommendations', '35'::jsonb, 'Minimum evidence score used by the operating team as a review signal.', false),
  ('catalogue.review_window_days', 'catalogue', '90'::jsonb, 'Default interval before a published fact requires review.', false),
  ('support.target_response_hours', 'support', '48'::jsonb, 'Internal support response target.', false)
on conflict (key) do nothing;
