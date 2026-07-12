import "server-only";

import { createCipheriv, randomBytes } from "node:crypto";

import type { Json } from "./supabase-types";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = 1;
const IV_BYTES = 12;
const KEY_BYTES = 32;

export class DataEncryptionConfigurationError extends Error {
  constructor(
    message = "REQUEST_DATA_ENCRYPTION_KEY non configurata o non valida",
  ) {
    super(message);
    this.name = "DataEncryptionConfigurationError";
  }
}

function encryptionKey() {
  const encoded = process.env.REQUEST_DATA_ENCRYPTION_KEY?.trim();
  if (!encoded || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded)) {
    throw new DataEncryptionConfigurationError();
  }

  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== KEY_BYTES) {
    throw new DataEncryptionConfigurationError(
      "REQUEST_DATA_ENCRYPTION_KEY deve contenere esattamente 32 byte in base64",
    );
  }
  return key;
}

function additionalAuthenticatedData(submissionId: string) {
  return Buffer.from(
    `voicyy-agent-request:v${ENCRYPTION_VERSION}:${submissionId}`,
    "utf8",
  );
}

export type EncryptedRequestEnvelope = {
  payloadCiphertext: string;
  payloadIv: string;
  payloadAuthTag: string;
  encryptionVersion: 1;
};

/**
 * Encrypts the complete validated request before it leaves the Vercel runtime.
 * The submission UUID is authenticated as AAD, preventing ciphertext envelopes
 * from being moved between database rows without detection.
 */
export function encryptRequestPayload(
  payload: Json,
  submissionId: string,
): EncryptedRequestEnvelope {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  cipher.setAAD(additionalAuthenticatedData(submissionId));

  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);

  return {
    payloadCiphertext: ciphertext.toString("base64url"),
    payloadIv: iv.toString("base64url"),
    payloadAuthTag: cipher.getAuthTag().toString("base64url"),
    encryptionVersion: ENCRYPTION_VERSION,
  };
}
