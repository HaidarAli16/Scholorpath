create table if not exists public.subscription_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null default 'free' check (plan_code in ('free', 'pro')),
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((plan_code = 'free') or (provider is not null))
);

create unique index if not exists subscription_entitlements_provider_customer_uidx
  on public.subscription_entitlements(provider, provider_customer_id)
  where provider_customer_id is not null;

create unique index if not exists subscription_entitlements_provider_subscription_uidx
  on public.subscription_entitlements(provider, provider_subscription_id)
  where provider_subscription_id is not null;

alter table public.subscription_entitlements enable row level security;

drop policy if exists "Students can read their own entitlement" on public.subscription_entitlements;
create policy "Students can read their own entitlement"
  on public.subscription_entitlements for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists subscription_entitlements_touch_updated on public.subscription_entitlements;
create trigger subscription_entitlements_touch_updated
  before update on public.subscription_entitlements
  for each row execute function public.touch_updated_at();

comment on table public.subscription_entitlements is
  'Server-managed CandidRoute plan access. Clients may read only their own row and cannot grant themselves access.';
