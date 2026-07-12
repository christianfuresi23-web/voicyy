-- Voicyy database schema, revision 2026-07-12.
-- Idempotent provisioning script. Apply with Supabase MCP execute_sql after the
-- project is created, then generate an official CLI migration from the verified DB.

create extension if not exists "pgcrypto";

create table if not exists public.agent_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  reference_code text not null unique,
  status text not null default 'new',
  contact_name text not null,
  business_name text not null,
  contact_email text not null,
  notification_email text not null,
  phone text not null,
  website text,
  details text not null default '',
  services jsonb not null,
  working_days jsonb not null,
  schedule jsonb not null,
  hours_per_day real not null,
  calendar_email text not null,
  drive_folder_id text,
  llm text not null,
  text_to_speech text not null,
  telephony text not null,
  monthly_minutes integer not null,
  estimated_monthly_price numeric(12, 4),
  configuration jsonb not null,
  terms_accepted boolean not null,
  terms_version text not null,
  privacy_version text not null,
  marketing_consent boolean not null,
  marketing_consent_version text,
  marketing_consented_at timestamptz,
  consented_at timestamptz not null,
  admin_email_status text not null default 'pending',
  admin_email_id text,
  admin_email_error text,
  admin_email_attempted_at timestamptz,
  admin_email_accepted_at timestamptz,
  client_email_status text not null default 'pending',
  client_email_id text,
  client_email_error text,
  client_email_attempted_at timestamptz,
  client_email_accepted_at timestamptz,
  drive_status text not null default 'skipped',
  drive_file_id text,
  drive_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_requests_monthly_minutes_check
    check (monthly_minutes between 0 and 10000),
  constraint agent_requests_terms_accepted_check check (terms_accepted = true),
  constraint agent_requests_status_check
    check (status in ('new', 'contacted', 'qualified', 'in_progress', 'completed', 'rejected')),
  constraint agent_requests_hours_per_day_check
    check (hours_per_day > 0 and hours_per_day <= 24),
  constraint agent_requests_admin_email_status_check
    check (admin_email_status in ('pending', 'accepted', 'failed', 'skipped')),
  constraint agent_requests_client_email_status_check
    check (client_email_status in ('pending', 'accepted', 'failed', 'skipped')),
  constraint agent_requests_drive_status_check
    check (drive_status in ('saved', 'failed', 'skipped'))
);

alter table public.agent_requests
  add column if not exists marketing_consent_version text;
alter table public.agent_requests
  add column if not exists marketing_consented_at timestamptz;
alter table public.agent_requests
  add column if not exists submission_id uuid;
alter table public.agent_requests
  add column if not exists admin_email_accepted_at timestamptz;
alter table public.agent_requests
  add column if not exists client_email_accepted_at timestamptz;
update public.agent_requests
  set admin_email_status = 'accepted'
  where admin_email_status = 'sent';
update public.agent_requests
  set client_email_status = 'accepted'
  where client_email_status = 'sent';
alter table public.agent_requests
  drop constraint if exists agent_requests_admin_email_status_check;
alter table public.agent_requests
  add constraint agent_requests_admin_email_status_check
  check (admin_email_status in ('pending', 'accepted', 'failed', 'skipped'));
alter table public.agent_requests
  drop constraint if exists agent_requests_client_email_status_check;
alter table public.agent_requests
  add constraint agent_requests_client_email_status_check
  check (client_email_status in ('pending', 'accepted', 'failed', 'skipped'));
update public.agent_requests
  set submission_id = gen_random_uuid()
  where submission_id is null;
alter table public.agent_requests
  alter column submission_id set not null;

create unique index if not exists agent_requests_submission_id_uidx
  on public.agent_requests (submission_id);

create index if not exists agent_requests_created_at_idx
  on public.agent_requests (created_at desc);
create index if not exists agent_requests_status_idx
  on public.agent_requests (status);
create index if not exists agent_requests_contact_email_idx
  on public.agent_requests (contact_email);
create table if not exists public.admin_settings (
  id integer primary key,
  totp_secret_encrypted text,
  totp_enabled boolean not null default false,
  totp_confirmed_at timestamptz,
  last_totp_time_step bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton_check check (id = 1)
);

alter table public.admin_settings
  add column if not exists last_totp_time_step bigint;

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  ip_hash text not null,
  user_agent_hash text not null,
  stage text not null,
  successful boolean not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint admin_login_attempts_stage_check
    check (stage in ('password', 'totp', 'phrase'))
);

create index if not exists admin_login_attempts_fingerprint_created_idx
  on public.admin_login_attempts (fingerprint_hash, created_at desc);
create index if not exists admin_login_attempts_created_at_idx
  on public.admin_login_attempts (created_at desc);
create index if not exists admin_login_attempts_failed_ip_created_idx
  on public.admin_login_attempts (ip_hash, created_at desc)
  where successful = false;

create table if not exists public.rate_limit_buckets (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash),
  constraint rate_limit_buckets_count_check check (request_count >= 0),
  constraint rate_limit_buckets_scope_check
    check (scope in ('submission', 'admin'))
);

create table if not exists public.admin_auth_flows (
  jti_hash text primary key,
  fingerprint_hash text not null,
  step text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_auth_flows_step_check check (step in ('totp', 'phrase'))
);

create index if not exists admin_auth_flows_expires_idx
  on public.admin_auth_flows (expires_at);

create table if not exists public.admin_sessions (
  jti_hash text primary key,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_expires_idx
  on public.admin_sessions (expires_at);

-- Atomically consumes one request in a fixed window. The insert/upsert and
-- decision happen in the same statement, preventing parallel-request bypasses.
create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_count integer;
begin
  if p_scope not in ('submission', 'admin')
    or p_key_hash is null
    or length(p_key_hash) < 32
    or p_limit < 1
    or p_window_seconds < 1
  then
    raise exception 'invalid rate limit arguments';
  end if;

  insert into public.rate_limit_buckets as bucket (
    scope,
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_scope, p_key_hash, v_now, 1, v_now)
  on conflict (scope, key_hash) do update
  set
    window_started_at = case
      when bucket.window_started_at <=
        v_now - make_interval(secs => p_window_seconds)
        then v_now
      else bucket.window_started_at
    end,
    request_count = case
      when bucket.window_started_at <=
        v_now - make_interval(secs => p_window_seconds)
        then 1
      else bucket.request_count + 1
    end,
    updated_at = v_now
  returning window_started_at, request_count
  into v_window_started, v_count;

  allowed := v_count <= p_limit;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (
        v_window_started + make_interval(secs => p_window_seconds) - v_now
      )))::integer
    )
  end;

  -- Buckets outlive their longest window only briefly and contain HMAC values,
  -- never raw IP addresses.
  delete from public.rate_limit_buckets
    where updated_at < v_now - interval '2 days';

  return next;
end;
$$;

-- Persists the last accepted TOTP counter with a compare-and-set update so a
-- code cannot be replayed, even by two concurrent requests.
create or replace function public.consume_totp_time_step(p_time_step bigint)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_rows integer := 0;
begin
  if p_time_step is null or p_time_step < 0 then
    return false;
  end if;

  update public.admin_settings
  set
    last_totp_time_step = p_time_step,
    updated_at = clock_timestamp()
  where id = 1
    and (
      last_totp_time_step is null
      or last_totp_time_step < p_time_step
    );

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.enforce_data_retention()
returns table (
  expired_marketing_consents integer,
  deleted_admin_attempts integer,
  deleted_rate_buckets integer,
  deleted_auth_flows integer,
  deleted_admin_sessions integer
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  update public.agent_requests
  set marketing_consent = false, updated_at = v_now
  where marketing_consent = true
    and marketing_consented_at < v_now - interval '24 months';
  get diagnostics expired_marketing_consents = row_count;

  delete from public.admin_login_attempts
  where created_at < v_now - interval '90 days';
  get diagnostics deleted_admin_attempts = row_count;

  delete from public.rate_limit_buckets
  where updated_at < v_now - interval '2 days';
  get diagnostics deleted_rate_buckets = row_count;

  delete from public.admin_auth_flows
  where expires_at < v_now - interval '1 day';
  get diagnostics deleted_auth_flows = row_count;

  delete from public.admin_sessions
  where expires_at < v_now - interval '1 day';
  get diagnostics deleted_admin_sessions = row_count;

  return next;
end;
$$;

-- Tables live in an exposed schema because supabase-js uses the Data API.
-- RLS remains enabled as defense in depth. There are deliberately no policies:
-- browser roles cannot access any row, and only the server secret client is used.
alter table public.agent_requests enable row level security;
alter table public.admin_settings enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.admin_auth_flows enable row level security;
alter table public.admin_sessions enable row level security;

revoke all on table public.agent_requests from public, anon, authenticated;
revoke all on table public.admin_settings from public, anon, authenticated;
revoke all on table public.admin_login_attempts from public, anon, authenticated;
revoke all on table public.rate_limit_buckets from public, anon, authenticated;
revoke all on table public.admin_auth_flows from public, anon, authenticated;
revoke all on table public.admin_sessions from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.consume_totp_time_step(bigint)
  from public, anon, authenticated;
revoke all on function public.enforce_data_retention()
  from public, anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.agent_requests to service_role;
grant select, insert, update, delete on table public.admin_settings to service_role;
grant select, insert, update, delete on table public.admin_login_attempts to service_role;
grant select, insert, update, delete on table public.rate_limit_buckets to service_role;
grant select, insert, update, delete on table public.admin_auth_flows to service_role;
grant select, insert, update, delete on table public.admin_sessions to service_role;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;
grant execute on function public.consume_totp_time_step(bigint) to service_role;
grant execute on function public.enforce_data_retention() to service_role;
