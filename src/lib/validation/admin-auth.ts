import { z } from "zod";

export const adminPasswordSchema = z
  .object({ password: z.string().min(1).max(256) })
  .strict();

export const adminTotpSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Il codice deve contenere 6 cifre"),
  })
  .strict();

export const adminPhraseSchema = z
  .object({ phrase: z.string().trim().min(1).max(512) })
  .strict();

export function normalizeRecoveryPhrase(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("it-IT")
    .split(/\s+/u)
    .join(" ");
}
