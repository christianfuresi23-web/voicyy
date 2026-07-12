import { afterEach, describe, expect, it, vi } from "vitest";

import { submissionHashes } from "./submission-rate-limit";
import { DatabaseConfigurationError } from "./supabase-write";

afterEach(() => {
  vi.unstubAllEnvs();
});

function requestFor(ip: string) {
  return new Request("https://voicyy.example/api/requests", {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

describe("submissionHashes", () => {
  it("returns a deterministic 64-character HMAC without exposing the IP", () => {
    vi.stubEnv("SUBMISSION_WRITE_SECRET", "A".repeat(64));

    const first = submissionHashes(requestFor("203.0.113.8"), "a@example.com").ipHash;
    const second = submissionHashes(requestFor("203.0.113.8"), "a@example.com").ipHash;

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("203.0.113.8");
  });

  it("separates rate buckets for different client addresses", () => {
    vi.stubEnv("SUBMISSION_WRITE_SECRET", "B".repeat(64));

    expect(submissionHashes(requestFor("203.0.113.8"), "a@example.com").ipHash).not.toBe(
      submissionHashes(requestFor("203.0.113.9"), "a@example.com").ipHash,
    );
  });

  it("normalizes and separates recipient buckets without exposing email", () => {
    vi.stubEnv("SUBMISSION_WRITE_SECRET", "C".repeat(64));

    const first = submissionHashes(requestFor("203.0.113.8"), " A@Example.COM ");
    const second = submissionHashes(requestFor("203.0.113.8"), "a@example.com");
    const other = submissionHashes(requestFor("203.0.113.8"), "b@example.com");

    expect(first.recipientHash).toBe(second.recipientHash);
    expect(first.recipientHash).not.toBe(other.recipientHash);
    expect(first.recipientHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.recipientHash).not.toContain("example.com");
  });

  it("rejects a write secret that is too short for production", () => {
    vi.stubEnv("SUBMISSION_WRITE_SECRET", "too-short");

    expect(() => submissionHashes(requestFor("203.0.113.8"), "a@example.com")).toThrow(
      DatabaseConfigurationError,
    );
  });
});
