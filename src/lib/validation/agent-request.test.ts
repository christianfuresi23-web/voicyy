import { describe, expect, it } from "vitest";

import { agentRequestSchema } from "./agent-request";

const validRequest = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  contactName: "Mario Rossi",
  businessName: "Studio Demo",
  services: [{ name: "Visita", durationHours: 1 }],
  workingDays: ["Lunedì", "MARTEDI"],
  schedule: { start: "09:00", end: "13:00", secondStart: "14:00", secondEnd: "18:00" },
  hoursPerDay: 8,
  calendarEmail: "CALENDAR@example.com",
  driveFolderId: "folder-id",
  notificationEmail: "notify@example.com",
  contactEmail: "CLIENT@example.com",
  phone: "+39 392 000 0000",
  website: "https://example.com",
  details: "Dettagli",
  configuration: {
    llm: "GPT 5",
    textToSpeech: "Platform Voices",
    telephony: "Twilio/Telnyx",
    minutes: 0,
    estimatedMonthlyPrice: 1,
  },
  termsAccepted: true,
  marketingConsent: false,
  botField: "",
};

describe("agentRequestSchema", () => {
  it("normalizza giorni ed email e accetta lo slider a zero", () => {
    const parsed = agentRequestSchema.parse(validRequest);
    expect(parsed.workingDays).toEqual(["lunedi", "martedi"]);
    expect(parsed.contactEmail).toBe("client@example.com");
    expect(parsed.configuration.minutes).toBe(0);
  });

  it("rifiuta richieste senza consenso contrattuale", () => {
    expect(
      agentRequestSchema.safeParse({ ...validRequest, termsAccepted: false }).success,
    ).toBe(false);
  });

  it("rifiuta fasce orarie sovrapposte", () => {
    const result = agentRequestSchema.safeParse({
      ...validRequest,
      schedule: {
        start: "09:00",
        end: "13:00",
        secondStart: "12:30",
        secondEnd: "18:00",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rifiuta ore giornaliere alterate rispetto alle fasce", () => {
    expect(
      agentRequestSchema.safeParse({
        ...validRequest,
        hoursPerDay: 20,
      }).success,
    ).toBe(false);
  });

  it("rifiuta il campo honeypot compilato", () => {
    expect(
      agentRequestSchema.safeParse({
        ...validRequest,
        botField: "spam.example",
      }).success,
    ).toBe(false);
  });
});
