import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { adminEncryptionKey } from "./admin-config";

const PREFIX = "enc:v1";

/**
 * Bcrypt only considers the first 72 bytes of its input. Hash the normalized
 * recovery phrase first so every word remains significant before bcrypt is
 * applied to the fixed-length digest stored in the environment.
 */
export function recoveryPhraseDigest(normalizedPhrase: string) {
  return createHash("sha256")
    .update(normalizedPhrase, "utf8")
    .digest("base64url");
}

export function encryptAdminSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", adminEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptAdminSecret(payload: string) {
  const [prefix, version, ivValue, tagValue, encryptedValue] = payload.split(":");
  if (`${prefix}:${version}` !== PREFIX || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Formato del secret TOTP non valido");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    adminEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
