import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DataEncryptionConfigurationError,
  encryptRequestPayload,
} from "./request-encryption";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("encryptRequestPayload", () => {
  it("creates a fresh AES-GCM envelope without plaintext", () => {
    vi.stubEnv("REQUEST_DATA_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
    const payload = { contactEmail: "mario@example.com", businessName: "Studio" };

    const first = encryptRequestPayload(payload, "00000000-0000-4000-8000-000000000001");
    const second = encryptRequestPayload(payload, "00000000-0000-4000-8000-000000000001");

    expect(first.encryptionVersion).toBe(1);
    expect(first.payloadIv).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(first.payloadAuthTag).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(first.payloadCiphertext).not.toContain("mario");
    expect(first.payloadCiphertext).not.toBe(second.payloadCiphertext);
  });

  it("rejects missing or incorrectly sized keys", () => {
    vi.stubEnv("REQUEST_DATA_ENCRYPTION_KEY", Buffer.alloc(16).toString("base64"));
    expect(() => encryptRequestPayload({}, crypto.randomUUID())).toThrow(
      DataEncryptionConfigurationError,
    );
  });
});
