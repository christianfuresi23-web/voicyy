-- Voicyy encrypted request ingress — revision 2026-07-12.
-- Apply to a fresh Supabase project as `postgres`.
--
-- Security boundary:
--   * request PII is encrypted in the Vercel Function with AES-256-GCM;
--   * Postgres stores only ciphertext, consent metadata and delivery status;
--   * the Data API exposes two authenticated, write-only RPCs and no reads;
--   * a separate local role can read ciphertext, never plaintext;
--   * the decryption key exists only in Vercel secrets and on the authorised PC.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;
alter default privileges in schema private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema private
  revoke all on functions from public, anon, authenticated, service_role;

do $roles$
begin
  if not exists (
    select 1 from pg_catalog.pg_roles where rolname = 'voicyy_ingress_owner'
  ) then
    create role voicyy_ingress_owner nologin noinherit;
  end if;
  if not exists (
    select 1 from pg_catalog.pg_roles where rolname = 'voicyy_local_reader'
  ) then
    create role voicyy_local_reader nologin inherit;
  end if;
end
$roles$;

alter role voicyy_ingress_owner
  nologin noinherit nocreatedb nocreaterole;
alter role voicyy_local_reader
  nologin inherit nocreatedb nocreaterole;

-- Supabase's managed `postgres` role is not a superuser. Temporary membership
-- is required to transfer object ownership to the NOLOGIN least-privilege
-- owner; it is revoked at the end of the migration.
grant voicyy_ingress_owner to postgres;

grant usage on schema private to voicyy_ingress_owner, voicyy_local_reader;
grant usage on schema public to voicyy_ingress_owner;
grant usage on schema extensions to voicyy_ingress_owner;
grant create on schema private, public to voicyy_ingress_owner;

create table if not exists private.agent_requests (
  id bigint generated always as identity primary key,
  submission_id uuid not null unique,
  reference_code text not null unique,
  status text not null default 'new',
  payload_ciphertext text not null,
  payload_iv text not null,
  payload_auth_tag text not null,
  encryption_version smallint not null default 1,
  terms_accepted boolean not null,
  terms_version text not null,
  privacy_version text not null,
  marketing_consent boolean not null,
  marketing_consent_version text,
  marketing_consented_at timestamptz,
  consented_at timestamptz not null,
  owner_email_status text not null default 'pending',
  owner_email_attempted_at timestamptz,
  owner_email_accepted_at timestamptz,
  client_email_status text not null default 'pending',
  client_email_attempted_at timestamptz,
  client_email_accepted_at timestamptz,
  drive_status text not null default 'skipped',
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint agent_requests_reference_code_check
    check (reference_code ~ '^VY-[A-F0-9]{16}$'),
  constraint agent_requests_status_check
    check (status in ('new', 'contacted', 'qualified', 'in_progress', 'completed', 'rejected')),
  constraint agent_requests_ciphertext_check
    check (
      pg_catalog.octet_length(payload_ciphertext) between 16 and 100000
      and payload_ciphertext ~ '^[A-Za-z0-9_-]+$'
    ),
  constraint agent_requests_iv_check
    check (payload_iv ~ '^[A-Za-z0-9_-]{16}$'),
  constraint agent_requests_auth_tag_check
    check (payload_auth_tag ~ '^[A-Za-z0-9_-]{22}$'),
  constraint agent_requests_encryption_version_check
    check (encryption_version = 1),
  constraint agent_requests_terms_accepted_check check (terms_accepted = true),
  constraint agent_requests_owner_email_status_check
    check (owner_email_status in ('pending', 'accepted', 'failed', 'skipped')),
  constraint agent_requests_client_email_status_check
    check (client_email_status in ('pending', 'accepted', 'failed', 'skipped')),
  constraint agent_requests_drive_status_check
    check (drive_status in ('saved', 'failed', 'skipped'))
);

create index if not exists agent_requests_created_at_idx
  on private.agent_requests (created_at desc);
create index if not exists agent_requests_status_created_at_idx
  on private.agent_requests (status, created_at desc);

-- Only a SHA-256 digest of the high-entropy ingress secret is stored. A fast
-- digest is intentional: this is a random 48-byte key, not a human password,
-- and avoids making an anonymous RPC a bcrypt CPU-amplification primitive.
create table if not exists private.request_ingress_secret (
  id smallint primary key,
  secret_hash text not null,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint request_ingress_secret_singleton_check check (id = 1),
  constraint request_ingress_secret_hash_check
    check (secret_hash ~ '^[a-f0-9]{64}$')
);

create table if not exists private.submission_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (scope, key_hash),
  constraint submission_rate_limits_scope_check
    check (scope in ('global', 'ip', 'recipient')),
  constraint submission_rate_limits_key_hash_check
    check (key_hash ~ '^[a-f0-9]{64}$'),
  constraint submission_rate_limits_count_check check (request_count >= 0)
);

alter table private.agent_requests owner to voicyy_ingress_owner;
alter table private.request_ingress_secret owner to voicyy_ingress_owner;
alter table private.submission_rate_limits owner to voicyy_ingress_owner;

alter table private.agent_requests enable row level security;
alter table private.agent_requests force row level security;
alter table private.request_ingress_secret enable row level security;
alter table private.request_ingress_secret force row level security;
alter table private.submission_rate_limits enable row level security;
alter table private.submission_rate_limits force row level security;

revoke all on table private.agent_requests
  from public, anon, authenticated, service_role, voicyy_local_reader;
revoke all on table private.request_ingress_secret
  from public, anon, authenticated, service_role, voicyy_local_reader;
revoke all on table private.submission_rate_limits
  from public, anon, authenticated, service_role, voicyy_local_reader;

grant select, insert, update, delete on table private.agent_requests
  to voicyy_ingress_owner;
grant select, insert, update, delete on table private.request_ingress_secret
  to voicyy_ingress_owner;
grant select, insert, update, delete on table private.submission_rate_limits
  to voicyy_ingress_owner;
grant usage, select on all sequences in schema private to voicyy_ingress_owner;
grant select on table private.agent_requests to voicyy_local_reader;

drop policy if exists ingress_owner_agent_requests on private.agent_requests;
create policy ingress_owner_agent_requests
  on private.agent_requests
  for all
  to voicyy_ingress_owner
  using (true)
  with check (true);

drop policy if exists local_reader_select_agent_requests on private.agent_requests;
create policy local_reader_select_agent_requests
  on private.agent_requests
  for select
  to voicyy_local_reader
  using (true);

drop policy if exists ingress_owner_secret on private.request_ingress_secret;
create policy ingress_owner_secret
  on private.request_ingress_secret
  for all
  to voicyy_ingress_owner
  using (true)
  with check (true);

drop policy if exists ingress_owner_rate_limits on private.submission_rate_limits;
create policy ingress_owner_rate_limits
  on private.submission_rate_limits
  for all
  to voicyy_ingress_owner
  using (true)
  with check (true);

-- Provision once after generating a 48-byte random secret locally:
-- insert into private.request_ingress_secret (id, secret_hash)
-- values (1, pg_catalog.encode(extensions.digest('<SUBMISSION_WRITE_SECRET>', 'sha256'), 'hex'))
-- on conflict (id) do update
-- set secret_hash = excluded.secret_hash,
--     updated_at = pg_catalog.clock_timestamp();

create or replace function private.verify_submission_write_secret(
  p_write_secret text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    p_write_secret is not null
    and pg_catalog.octet_length(p_write_secret) between 43 and 72
    and exists (
      select 1
      from private.request_ingress_secret as secret
      where secret.id = 1
        and secret.secret_hash = pg_catalog.encode(
          extensions.digest(p_write_secret, 'sha256'),
          'hex'
        )
    );
$function$;

alter function private.verify_submission_write_secret(text)
  owner to voicyy_ingress_owner;
revoke all on function private.verify_submission_write_secret(text)
  from public, anon, authenticated, service_role, voicyy_local_reader;

create or replace function private.consume_submission_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_now timestamptz
)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  v_window_started timestamptz;
  v_count integer;
begin
  insert into private.submission_rate_limits as bucket (
    scope,
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_scope, p_key_hash, p_now, 1, p_now)
  on conflict (scope, key_hash) do update
  set
    window_started_at = case
      when bucket.window_started_at <= p_now - interval '1 hour' then p_now
      else bucket.window_started_at
    end,
    request_count = case
      when bucket.window_started_at <= p_now - interval '1 hour' then 1
      else bucket.request_count + 1
    end,
    updated_at = p_now
  returning bucket.window_started_at, bucket.request_count
  into v_window_started, v_count;

  if v_count <= p_limit then
    return 0;
  end if;

  return greatest(
    1,
    pg_catalog.ceil(
      extract(epoch from (
        v_window_started + interval '1 hour' - p_now
      ))
    )::integer
  );
end
$function$;

alter function private.consume_submission_limit(text, text, integer, timestamptz)
  owner to voicyy_ingress_owner;
revoke all on function private.consume_submission_limit(text, text, integer, timestamptz)
  from public, anon, authenticated, service_role, voicyy_local_reader;

create or replace function public.submit_agent_request(
  p_write_secret text,
  p_submission_id uuid,
  p_ip_key_hash text,
  p_recipient_key_hash text,
  p_payload_ciphertext text,
  p_payload_iv text,
  p_payload_auth_tag text,
  p_encryption_version smallint,
  p_terms_accepted boolean,
  p_marketing_consent boolean
)
returns table (
  accepted boolean,
  reference_code text,
  client_email_status text,
  inserted boolean,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_reference text;
  v_client_status text;
  v_retry integer;
  v_attempt integer;
begin
  if not private.verify_submission_write_secret(p_write_secret) then
    raise insufficient_privilege using message = 'request ingress authentication failed';
  end if;

  if p_submission_id is null
     or p_ip_key_hash !~ '^[a-f0-9]{64}$'
     or p_recipient_key_hash !~ '^[a-f0-9]{64}$'
     or pg_catalog.octet_length(p_payload_ciphertext) not between 16 and 100000
     or p_payload_ciphertext !~ '^[A-Za-z0-9_-]+$'
     or p_payload_iv !~ '^[A-Za-z0-9_-]{16}$'
     or p_payload_auth_tag !~ '^[A-Za-z0-9_-]{22}$'
     or p_encryption_version <> 1
     or p_terms_accepted is distinct from true
     or p_marketing_consent is null then
    raise invalid_parameter_value using message = 'invalid request ingress payload';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_submission_id::text, 0)
  );

  select request.reference_code, request.client_email_status
  into v_reference, v_client_status
  from private.agent_requests as request
  where request.submission_id = p_submission_id;

  if found then
    return query select true, v_reference, v_client_status, false, 0;
    return;
  end if;

  v_retry := private.consume_submission_limit(
    'global', pg_catalog.repeat('0', 64), 100, v_now
  );
  if v_retry = 0 then
    v_retry := private.consume_submission_limit('ip', p_ip_key_hash, 5, v_now);
  end if;
  if v_retry = 0 then
    v_retry := private.consume_submission_limit(
      'recipient', p_recipient_key_hash, 3, v_now
    );
  end if;
  if v_retry > 0 then
    return query select false, null::text, null::text, false, v_retry;
    return;
  end if;

  for v_attempt in 1..5 loop
    v_reference := 'VY-' || pg_catalog.upper(
      pg_catalog.substr(
        pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
        1,
        16
      )
    );

    begin
      insert into private.agent_requests (
        submission_id,
        reference_code,
        payload_ciphertext,
        payload_iv,
        payload_auth_tag,
        encryption_version,
        terms_accepted,
        terms_version,
        privacy_version,
        marketing_consent,
        marketing_consent_version,
        marketing_consented_at,
        consented_at
      )
      values (
        p_submission_id,
        v_reference,
        p_payload_ciphertext,
        p_payload_iv,
        p_payload_auth_tag,
        p_encryption_version,
        true,
        '2025-06',
        '2026-07',
        p_marketing_consent,
        case when p_marketing_consent then '2026-07' else null end,
        case when p_marketing_consent then v_now else null end,
        v_now
      );
      exit;
    exception when unique_violation then
      if v_attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  return query select true, v_reference, 'pending'::text, true, 0;
end
$function$;

alter function public.submit_agent_request(
  text, uuid, text, text, text, text, text, smallint, boolean, boolean
) owner to voicyy_ingress_owner;

create or replace function public.update_agent_request_delivery(
  p_write_secret text,
  p_submission_id uuid,
  p_reference_code text,
  p_delivery jsonb
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_owner_status text;
  v_client_status text;
  v_drive_status text;
  v_rows integer;
begin
  if not private.verify_submission_write_secret(p_write_secret) then
    raise insufficient_privilege using message = 'request ingress authentication failed';
  end if;

  if p_submission_id is null
     or p_reference_code !~ '^VY-[A-F0-9]{16}$'
     or p_delivery is null
     or pg_catalog.jsonb_typeof(p_delivery) <> 'object' then
    raise invalid_parameter_value using message = 'invalid delivery payload';
  end if;

  v_owner_status := p_delivery#>>'{owner,status}';
  v_client_status := p_delivery#>>'{client,status}';
  v_drive_status := p_delivery#>>'{drive,status}';

  if v_owner_status not in ('pending', 'accepted', 'failed', 'skipped')
     or v_client_status not in ('pending', 'accepted', 'failed', 'skipped')
     or v_drive_status not in ('saved', 'failed', 'skipped') then
    raise invalid_parameter_value using message = 'invalid delivery status';
  end if;

  update private.agent_requests as request
  set
    owner_email_status = v_owner_status,
    owner_email_attempted_at = nullif(
      p_delivery#>>'{owner,attemptedAt}', ''
    )::timestamptz,
    owner_email_accepted_at = nullif(
      p_delivery#>>'{owner,acceptedAt}', ''
    )::timestamptz,
    client_email_status = v_client_status,
    client_email_attempted_at = nullif(
      p_delivery#>>'{client,attemptedAt}', ''
    )::timestamptz,
    client_email_accepted_at = nullif(
      p_delivery#>>'{client,acceptedAt}', ''
    )::timestamptz,
    drive_status = v_drive_status,
    updated_at = pg_catalog.clock_timestamp()
  where request.submission_id = p_submission_id
    and request.reference_code = p_reference_code;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end
$function$;

alter function public.update_agent_request_delivery(text, uuid, text, jsonb)
  owner to voicyy_ingress_owner;

revoke all on function public.submit_agent_request(
  text, uuid, text, text, text, text, text, smallint, boolean, boolean
) from public, authenticated, service_role, voicyy_local_reader;
revoke all on function public.update_agent_request_delivery(text, uuid, text, jsonb)
  from public, authenticated, service_role, voicyy_local_reader;
grant execute on function public.submit_agent_request(
  text, uuid, text, text, text, text, text, smallint, boolean, boolean
) to anon;
grant execute on function public.update_agent_request_delivery(text, uuid, text, jsonb)
  to anon;

create or replace function private.enforce_data_retention()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  update private.agent_requests
  set
    marketing_consent = false,
    marketing_consent_version = null,
    marketing_consented_at = null,
    updated_at = v_now
  where marketing_consent = true
    and marketing_consented_at < v_now - interval '24 months';

  delete from private.agent_requests
  where created_at < v_now - interval '10 years';

  delete from private.submission_rate_limits
  where updated_at < v_now - interval '2 days';
end
$function$;

alter function private.enforce_data_retention()
  owner to voicyy_ingress_owner;
revoke all on function private.enforce_data_retention()
  from public, anon, authenticated, service_role, voicyy_local_reader;

create extension if not exists pg_cron with schema pg_catalog;

do $cron$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select job.jobid
    from cron.job as job
    where job.jobname = 'voicyy-private-data-retention'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'voicyy-private-data-retention',
    '17 2 * * *',
    'select private.enforce_data_retention()'
  );
end
$cron$;

revoke voicyy_ingress_owner from postgres;
revoke create on schema private, public from voicyy_ingress_owner;

-- Create the PC-only login separately with a unique password:
-- create role voicyy_local_viewer
--   login password '<LONG_RANDOM_PASSWORD>'
--   in role voicyy_local_reader connection limit 1;
-- alter role voicyy_local_viewer set default_transaction_read_only = on;
