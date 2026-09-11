-- Casework authenticated case storage
-- The application remains local-first; this table is the remote replica.

create table if not exists public.casework_cases (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null check (schema_version > 0),
  revision integer not null check (revision >= 0),
  title text not null,
  organization text not null default '',
  status text not null check (status in ('active', 'paused', 'complete', 'archived')),
  data jsonb not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists casework_cases_owner_updated_idx
  on public.casework_cases (owner_id, client_updated_at desc);

alter table public.casework_cases enable row level security;

drop policy if exists "casework_cases_select_own" on public.casework_cases;
create policy "casework_cases_select_own"
  on public.casework_cases
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "casework_cases_insert_own" on public.casework_cases;
create policy "casework_cases_insert_own"
  on public.casework_cases
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "casework_cases_update_own" on public.casework_cases;
create policy "casework_cases_update_own"
  on public.casework_cases
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "casework_cases_delete_own" on public.casework_cases;
create policy "casework_cases_delete_own"
  on public.casework_cases
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.set_casework_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_casework_cases_updated_at on public.casework_cases;
create trigger set_casework_cases_updated_at
before update on public.casework_cases
for each row execute function public.set_casework_updated_at();

revoke all on table public.casework_cases from anon;
grant select, insert, update, delete on table public.casework_cases to authenticated;

-- Atomic optimistic write. A client may replace the remote replica only when its
-- revision is at least as recent as the stored revision. A rejected write returns
-- the remote value so the client can surface a conflict instead of silently
-- choosing a winner.
create or replace function public.sync_casework_case(p_case jsonb)
returns table(outcome text, remote_data jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_data jsonb;
begin
  if v_owner is null then
    raise exception 'Authentication required';
  end if;

  insert into public.casework_cases (
    id,
    owner_id,
    schema_version,
    revision,
    title,
    organization,
    status,
    data,
    client_updated_at
  )
  values (
    (p_case->>'id')::uuid,
    v_owner,
    (p_case->>'schemaVersion')::integer,
    (p_case->>'revision')::integer,
    p_case->>'title',
    coalesce(p_case->>'organization', ''),
    p_case->>'status',
    p_case,
    (p_case->>'updatedAt')::timestamptz
  )
  on conflict (id) do update
  set
    schema_version = excluded.schema_version,
    revision = excluded.revision,
    title = excluded.title,
    organization = excluded.organization,
    status = excluded.status,
    data = excluded.data,
    client_updated_at = excluded.client_updated_at
  where
    public.casework_cases.owner_id = v_owner
    and (
      excluded.revision > public.casework_cases.revision
      or (
        excluded.revision = public.casework_cases.revision
        and excluded.data = public.casework_cases.data
      )
    )
  returning data into v_data;

  if v_data is not null then
    return query select 'accepted'::text, v_data;
    return;
  end if;

  select data
  into v_data
  from public.casework_cases
  where id = (p_case->>'id')::uuid and owner_id = v_owner;

  return query select 'conflict'::text, v_data;
end;
$$;

revoke all on function public.sync_casework_case(jsonb) from public, anon;
grant execute on function public.sync_casework_case(jsonb) to authenticated;
