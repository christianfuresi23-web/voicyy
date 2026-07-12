import { randomBytes } from "node:crypto";

import { compare, hash } from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";

import {
  decryptAdminSecret,
  encryptAdminSecret,
  recoveryPhraseDigest,
} from "./admin-crypto";
import { normalizeRecoveryPhrase } from "../validation/admin-auth";

const originalKey = process.env.ADMIN_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.ADMIN_ENCRYPTION_KEY;
  else process.env.ADMIN_ENCRYPTION_KEY = originalKey;
});

describe("admin secret protection", () => {
  it("cifra e decifra il secret TOTP con AES-GCM", () => {
    process.env.ADMIN_ENCRYPTION_KEY = randomBytes(32).toString("base64url");
    const encrypted = encryptAdminSecret("JBSWY3DPEHPK3PXP");
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptAdminSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("rifiuta un ciphertext manomesso", () => {
    process.env.ADMIN_ENCRYPTION_KEY = randomBytes(32).toString("base64url");
    const encrypted = encryptAdminSecret("secret");
    expect(() => decryptAdminSecret(`${encrypted.slice(0, -1)}A`)).toThrow();
  });

  it("normalizza la frase senza alterare l'ordine", () => {
    expect(normalizeRecoveryPhrase("  ALFA   Beta  Gamma ")).toBe("alfa beta gamma");
  });

  it("rende significativo anche il suffisso oltre 72 byte", async () => {
    const normalized = "alfa beta gamma delta epsilon zeta eta theta iota kappa lambda mu";
    const storedHash = await hash(recoveryPhraseDigest(normalized), 4);

    expect(await compare(recoveryPhraseDigest(normalized), storedHash)).toBe(true);
    expect(
      await compare(recoveryPhraseDigest(`${normalized} extra`), storedHash),
    ).toBe(false);
  });
});
