import { z } from "zod";

export const LLM_OPTIONS = [
  "GPT 5.5",
  "GPT 5.4",
  "GPT 5.2",
  "GPT 5.1",
  "GPT 5",
  "GPT 5 nano",
  "GPT 5 mini",
  "GPT 4.1",
  "GPT 4.1 mini",
  "GPT 4.1 nano",
  "Claude 4.5 sonnet",
  "Claude 4.6 sonnet",
  "Claude 4.5 haiku",
  "Gemini 3.0 Flash",
  "Gemini 2.5 Flash",
  "Gemini 2.5 Flash Lite",
  "Custom LLM",
] as const;

export const TTS_OPTIONS = [
  "Platform Voices",
  "Minimax Voices",
  "Fish Voices",
  "Elevenlabs Voices",
  "Cartesia Voices",
  "OpenAI Voices",
] as const;

export const TELEPHONY_OPTIONS = [
  "Custom Telephony",
  "Twilio/Telnyx",
] as const;

export const WORKING_DAYS = [
  "lunedi",
  "martedi",
  "mercoledi",
  "giovedi",
  "venerdi",
  "sabato",
  "domenica",
] as const;

function normalizeDay(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const email = z
  .string()
  .trim()
  .max(254)
  .email("Inserisci un indirizzo email valido")
  .transform((value) => value.toLocaleLowerCase("it-IT"));

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalWebsite = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(2048)
    .url("Inserisci un URL completo, ad esempio https://esempio.it")
    .refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
      message: "Sono consentiti solo link http o https",
    })
    .optional(),
);

const time = z
  .string()
  .trim()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Usa il formato HH:MM");

const optionalTime = z.preprocess(emptyToUndefined, time.optional());

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function calculateScheduleHours(schedule: {
  start: string;
  end: string;
  secondStart?: string;
  secondEnd?: string;
}) {
  const first = minutesFromTime(schedule.end) - minutesFromTime(schedule.start);
  const second =
    schedule.secondStart && schedule.secondEnd
      ? minutesFromTime(schedule.secondEnd) -
        minutesFromTime(schedule.secondStart)
      : 0;
  return Math.round(((first + second) / 60) * 100) / 100;
}

const scheduleSchema = z
  .object({
    start: time,
    end: time,
    secondStart: optionalTime,
    secondEnd: optionalTime,
  })
  .strict()
  .superRefine((schedule, context) => {
    if (minutesFromTime(schedule.end) <= minutesFromTime(schedule.start)) {
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "L'orario di fine deve essere successivo a quello di inizio",
      });
    }

    const hasSecondStart = Boolean(schedule.secondStart);
    const hasSecondEnd = Boolean(schedule.secondEnd);
    if (hasSecondStart !== hasSecondEnd) {
      context.addIssue({
        code: "custom",
        path: hasSecondStart ? ["secondEnd"] : ["secondStart"],
        message: "Completa entrambi gli orari della seconda fascia",
      });
      return;
    }

    if (schedule.secondStart && schedule.secondEnd) {
      if (
        minutesFromTime(schedule.secondStart) <= minutesFromTime(schedule.end)
      ) {
        context.addIssue({
          code: "custom",
          path: ["secondStart"],
          message: "La seconda fascia deve iniziare dopo la prima",
        });
      }
      if (
        minutesFromTime(schedule.secondEnd) <=
        minutesFromTime(schedule.secondStart)
      ) {
        context.addIssue({
          code: "custom",
          path: ["secondEnd"],
          message: "La fine della seconda fascia deve essere successiva all'inizio",
        });
      }
    }
  });

const workingDaySchema = z
  .string()
  .max(20)
  .transform(normalizeDay)
  .pipe(z.enum(WORKING_DAYS));

export const agentRequestSchema = z
  .object({
    submissionId: z.string().uuid("Identificativo invio non valido"),
    contactName: z
      .string()
      .trim()
      .min(2, "Inserisci nome e cognome del referente")
      .max(120, "Il nome del referente è troppo lungo"),
    businessName: z
      .string()
      .trim()
      .min(2, "Inserisci il nome dell’attività")
      .max(160, "Il nome dell’attività è troppo lungo"),
    services: z
      .array(
        z
          .object({
            name: z
              .string()
              .trim()
              .min(1, "Inserisci il nome del servizio")
              .max(120, "Il nome del servizio è troppo lungo"),
            durationHours: z.coerce
              .number()
              .positive("La durata deve essere maggiore di zero")
              .max(24, "La durata non può superare 24 ore"),
          })
          .strict(),
      )
      .min(1, "Inserisci almeno un servizio")
      .max(30),
    workingDays: z
      .array(workingDaySchema)
      .min(1, "Seleziona almeno un giorno")
      .max(7)
      .refine((days) => new Set(days).size === days.length, {
        message: "Ogni giorno può essere selezionato una sola volta",
      }),
    schedule: scheduleSchema,
    hoursPerDay: z.coerce.number().min(0.5).max(24),
    calendarEmail: email,
    driveFolderId: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(200)
        .regex(/^[A-Za-z0-9_-]+$/, "Inserisci solo l'ID della cartella Drive")
        .optional(),
    ),
    notificationEmail: email,
    contactEmail: email,
    phone: z
      .string()
      .trim()
      .min(6, "Inserisci un numero di telefono valido")
      .max(32, "Il numero di telefono è troppo lungo")
      .regex(/^[+\d][\d\s()./-]*$/, "Inserisci un numero di telefono valido"),
    website: optionalWebsite,
    details: z
      .string()
      .trim()
      .max(5000, "I dettagli aggiuntivi non possono superare 5.000 caratteri")
      .optional()
      .default(""),
    configuration: z
      .object({
        llm: z.enum(LLM_OPTIONS),
        textToSpeech: z.enum(TTS_OPTIONS),
        telephony: z.enum(TELEPHONY_OPTIONS),
        minutes: z.coerce.number().int().min(0).max(10_000),
        // Accepted for backwards-compatible UI payloads, but never trusted.
        estimatedMonthlyPrice: z.number().finite().nonnegative().nullable().optional(),
      })
      .strict(),
    termsAccepted: z.literal(true, {
      error: "Devi accettare Termini e Condizioni e dichiarare di aver letto la Privacy Policy",
    }),
    marketingConsent: z.boolean(),
    botField: z.string().max(0).optional().default(""),
  })
  .strict()
  .superRefine((request, context) => {
    const calculatedHours = calculateScheduleHours(request.schedule);
    if (Math.abs(request.hoursPerDay - calculatedHours) > 0.01) {
      context.addIssue({
        code: "custom",
        path: ["hoursPerDay"],
        message: "Le ore giornaliere non corrispondono alle fasce indicate",
      });
    }
  });

export type AgentRequestInput = z.infer<typeof agentRequestSchema>;
