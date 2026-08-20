-- MoneyCove v2.5.2 finance backup safety migration
create table if not exists public.moneycove_finance_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists moneycove_finance_backups_user_created_idx on public.moneycove_finance_backups(user_id, created_at desc);
alter table public.moneycove_finance_backups enable row level security;
drop policy if exists "moneycove_finance_backups_select_own" on public.moneycove_finance_backups;
create policy "moneycove_finance_backups_select_own" on public.moneycove_finance_backups for select to authenticated using (auth.uid() = user_id);

create or replace function public.moneycove_save_finance_state(p_state jsonb) returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_existing jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select state into v_existing from public.pesapilot_finance_states where user_id=v_user for update;
  if v_existing is not null and v_existing is distinct from p_state then insert into public.moneycove_finance_backups(user_id,state) values(v_user,v_existing); end if;
  insert into public.pesapilot_finance_states(user_id,state,updated_at) values(v_user,coalesce(p_state,'{}'::jsonb),now())
  on conflict(user_id) do update set state=excluded.state,updated_at=now();
  delete from public.moneycove_finance_backups b where b.user_id=v_user and b.id in (select id from public.moneycove_finance_backups where user_id=v_user order by created_at desc offset 20);
end; $$;
revoke all on function public.moneycove_save_finance_state(jsonb) from public,anon; grant execute on function public.moneycove_save_finance_state(jsonb) to authenticated;

create or replace function public.moneycove_restore_latest_finance_backup() returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_state jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select state into v_state from public.moneycove_finance_backups where user_id=v_user order by created_at desc limit 1;
  if v_state is null then return null; end if;
  insert into public.pesapilot_finance_states(user_id,state,updated_at) values(v_user,v_state,now()) on conflict(user_id) do update set state=excluded.state,updated_at=now();
  return v_state;
end; $$;
revoke all on function public.moneycove_restore_latest_finance_backup() from public,anon; grant execute on function public.moneycove_restore_latest_finance_backup() to authenticated;
