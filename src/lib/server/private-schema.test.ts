import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "database", "schema.sql"), "utf8");

describe("private database boundary", () => {
  it("keeps PII outside the exposed public schema", () => {
    expect(schema).toContain("create table if not exists private.agent_requests");
    expect(schema).not.toContain("create table if not exists public.agent_requests");
    expect(schema).toContain("alter table private.agent_requests force row level security");
    expect(schema).toContain("payload_ciphertext text not null");
    expect(schema).not.toMatch(/\bcontact_email\s+text\b/i);
    expect(schema).not.toMatch(/\bbusiness_name\s+text\b/i);
  });

  it("gives anon only the two secret-authenticated write RPCs", () => {
    const anonGrants = schema
      .split(/\r?\n/)
      .filter((line) => line.trim().startsWith("grant ") || line.trim().startsWith("  to anon"))
      .join("\n");

    expect(anonGrants).toContain("grant execute on function public.submit_agent_request");
    expect(anonGrants).toContain("grant execute on function public.update_agent_request_delivery");
    expect(schema).not.toMatch(/grant\s+select[\s\S]{0,120}\bto\s+anon\b/i);
    expect(schema).not.toMatch(/grant\s+(?:all|select|insert|update|delete)[\s\S]{0,120}\bto\s+service_role\b/i);
  });

  it("pins security-definer search paths and runs retention inside Postgres", () => {
    expect(schema.match(/security definer\s+set search_path = ''/g)).toHaveLength(3);
    expect(schema).toContain("create extension if not exists pg_cron");
    expect(schema).toContain("select private.enforce_data_retention()");
  });

  it("uses a fast digest for a random ingress key and layered rate limits", () => {
    expect(schema).toContain("extensions.digest(p_write_secret, 'sha256')");
    expect(schema).not.toContain("extensions.crypt(");
    expect(schema).toContain("'global', pg_catalog.repeat('0', 64), 100");
    expect(schema).toContain("'recipient', p_recipient_key_hash, 3");
  });
});
