-- MoneyCove v2.3.0 commercial schema for the shared Nile Core Supabase project.
-- Legacy pesapilot_* table names are intentionally retained so existing users and data migrate safely.

create extension if not exists pgcrypto;

create table if not exists public.pesapilot_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.pesapilot_finance_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pesapilot_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'free' check (status in ('free','active','past_due','cancelled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider text,
  provider_reference text,
  updated_at timestamptz not null default now()
);

create table if not exists public.pesapilot_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  input_summary jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pesapilot_manual_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null default 5,
  currency text not null default 'USD',
  reference text,
  note text,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pesapilot_profiles_last_seen_idx on public.pesapilot_profiles(last_seen_at desc);
create index if not exists pesapilot_ai_usage_user_created_idx on public.pesapilot_ai_usage(user_id, created_at desc);
create index if not exists pesapilot_manual_payments_user_created_idx on public.pesapilot_manual_payments(user_id, created_at desc);

alter table public.pesapilot_profiles enable row level security;
alter table public.pesapilot_finance_states enable row level security;
alter table public.pesapilot_subscriptions enable row level security;
alter table public.pesapilot_ai_usage enable row level security;
alter table public.pesapilot_manual_payments enable row level security;

drop policy if exists "pesapilot_profiles_select_own" on public.pesapilot_profiles;
create policy "pesapilot_profiles_select_own" on public.pesapilot_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "pesapilot_profiles_insert_own" on public.pesapilot_profiles;
create policy "pesapilot_profiles_insert_own" on public.pesapilot_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "pesapilot_profiles_update_own" on public.pesapilot_profiles;
create policy "pesapilot_profiles_update_own" on public.pesapilot_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pesapilot_finance_states_select_own" on public.pesapilot_finance_states;
create policy "pesapilot_finance_states_select_own" on public.pesapilot_finance_states for select to authenticated using (auth.uid() = user_id);
drop policy if exists "pesapilot_finance_states_insert_own" on public.pesapilot_finance_states;
create policy "pesapilot_finance_states_insert_own" on public.pesapilot_finance_states for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "pesapilot_finance_states_update_own" on public.pesapilot_finance_states;
create policy "pesapilot_finance_states_update_own" on public.pesapilot_finance_states for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "pesapilot_finance_states_delete_own" on public.pesapilot_finance_states;
create policy "pesapilot_finance_states_delete_own" on public.pesapilot_finance_states for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "pesapilot_subscriptions_select_own" on public.pesapilot_subscriptions;
create policy "pesapilot_subscriptions_select_own" on public.pesapilot_subscriptions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "pesapilot_subscriptions_insert_free_own" on public.pesapilot_subscriptions;
create policy "pesapilot_subscriptions_insert_free_own" on public.pesapilot_subscriptions for insert to authenticated with check (auth.uid() = user_id and plan = 'free' and status = 'free');

drop policy if exists "pesapilot_ai_usage_select_own" on public.pesapilot_ai_usage;
create policy "pesapilot_ai_usage_select_own" on public.pesapilot_ai_usage for select to authenticated using (auth.uid() = user_id);

-- pesapilot_manual_payments intentionally has no browser policy. Founder/server only.

create or replace function public.pesapilot_founder_grant_pro(
  p_user_id uuid,
  p_days integer default 30,
  p_reference text default null,
  p_amount numeric default 5,
  p_currency text default 'USD',
  p_founder_id uuid default null,
  p_note text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_start timestamptz;
  v_existing_end timestamptz;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_days < 1 or p_days > 365 then raise exception 'Days must be between 1 and 365'; end if;

  select current_period_start, current_period_end
  into v_existing_start, v_existing_end
  from public.pesapilot_subscriptions
  where user_id = p_user_id
  for update;

  v_start := greatest(coalesce(v_existing_end, now()), now());
  v_end := v_start + make_interval(days => p_days);

  insert into public.pesapilot_subscriptions (
    user_id, plan, status, current_period_start, current_period_end, provider, provider_reference, updated_at
  ) values (
    p_user_id, 'pro', 'active',
    case when v_existing_end is not null and v_existing_end > now() then coalesce(v_existing_start, now()) else now() end,
    v_end, 'manual', p_reference, now()
  ) on conflict (user_id) do update set
    plan='pro', status='active', current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end, provider='manual',
    provider_reference=excluded.provider_reference, updated_at=now();

  insert into public.pesapilot_manual_payments (user_id, amount, currency, reference, note, granted_by)
  values (
    p_user_id,
    greatest(coalesce(p_amount,5),0),
    upper(coalesce(nullif(trim(p_currency),''),'USD')),
    nullif(trim(p_reference),''),
    nullif(trim(p_note),''),
    p_founder_id
  );

  return v_end;
end;
$$;

create or replace function public.pesapilot_founder_revoke_pro(p_user_id uuid, p_founder_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pesapilot_subscriptions (
    user_id, plan, status, current_period_start, current_period_end, provider, provider_reference, updated_at
  ) values (
    p_user_id, 'free', 'free', null, null, 'manual', 'founder_revoke', now()
  ) on conflict (user_id) do update set
    plan='free', status='free', current_period_start=null, current_period_end=null,
    provider='manual', provider_reference='founder_revoke', updated_at=now();
end;
$$;

revoke all on function public.pesapilot_founder_grant_pro(uuid, integer, text, numeric, text, uuid, text) from public, anon, authenticated;
grant execute on function public.pesapilot_founder_grant_pro(uuid, integer, text, numeric, text, uuid, text) to service_role;
revoke all on function public.pesapilot_founder_revoke_pro(uuid, uuid) from public, anon, authenticated;
grant execute on function public.pesapilot_founder_revoke_pro(uuid, uuid) to service_role;
