import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  sendAdminNotification: vi.fn(),
  sendClientConfirmation: vi.fn(),
  saveRequestToDrive: vi.fn(),
}));

vi.mock("@/lib/server/supabase-write", () => {
  class DatabaseConfigurationError extends Error {}
  class DatabaseOperationError extends Error {}
  return {
    DatabaseConfigurationError,
    DatabaseOperationError,
    getSupabaseWriter: () => ({ rpc: mocks.rpc }),
    submissionWriteSecret: () => "S".repeat(64),
    assertDatabaseResult: (error: unknown, operation: string) => {
      if (error) throw new DatabaseOperationError(operation);
    },
  };
});

vi.mock("@/lib/server/email", () => ({
  sendAdminNotification: mocks.sendAdminNotification,
  sendClientConfirmation: mocks.sendClientConfirmation,
}));

vi.mock("@/lib/server/drive", () => ({
  saveRequestToDrive: mocks.saveRequestToDrive,
}));

import { POST } from "./route";

const validRequest = {
  submissionId: "b984ec20-43ec-4f43-953f-e9700b5f714d",
  contactName: "Mario Rossi",
  businessName: "Studio Rossi",
  services: [{ name: "Visita", durationHours: 1 }],
  workingDays: ["lunedi", "martedi"],
  schedule: { start: "09:00", end: "17:00" },
  hoursPerDay: 8,
  calendarEmail: "calendar@example.com",
  driveFolderId: "folder_123",
  notificationEmail: "notify@example.com",
  contactEmail: "mario@example.com",
  phone: "+39 333 1234567",
  website: "https://example.com",
  details: "Test",
  configuration: {
    llm: "GPT 5",
    textToSpeech: "OpenAI Voices",
    telephony: "Twilio/Telnyx",
    minutes: 1000,
  },
  termsAccepted: true,
  marketingConsent: false,
  botField: "",
};

function postRequest() {
  return new Request("http://localhost/api/requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(validRequest),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv(
    "REQUEST_DATA_ENCRYPTION_KEY",
    Buffer.alloc(32, 9).toString("base64"),
  );
  mocks.sendAdminNotification.mockResolvedValue({
    status: "accepted",
    id: "admin-email-id",
    error: null,
    attemptedAt: new Date("2026-07-12T12:00:00.000Z"),
    acceptedAt: new Date("2026-07-12T12:00:01.000Z"),
  });
  mocks.sendClientConfirmation.mockResolvedValue({
    status: "accepted",
    id: "client-email-id",
    error: null,
    attemptedAt: new Date("2026-07-12T12:00:00.000Z"),
    acceptedAt: new Date("2026-07-12T12:00:01.000Z"),
  });
  mocks.saveRequestToDrive.mockResolvedValue({
    status: "skipped",
    fileId: null,
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/requests", () => {
  it("persists through the write-only RPC, sends both emails and updates delivery", async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: [
          {
            accepted: true,
            reference_code: "VY-ABCDEF1234567890",
            client_email_status: "pending",
            inserted: true,
            retry_after_seconds: 0,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    const response = await POST(postRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      referenceCode: "VY-ABCDEF1234567890",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      "submit_agent_request",
      expect.objectContaining({
        p_write_secret: "S".repeat(64),
        p_submission_id: validRequest.submissionId,
        p_ip_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        p_recipient_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        p_payload_ciphertext: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
        p_payload_iv: expect.stringMatching(/^[A-Za-z0-9_-]{16}$/),
        p_payload_auth_tag: expect.stringMatching(/^[A-Za-z0-9_-]{22}$/),
        p_encryption_version: 1,
      }),
    );
    expect(mocks.sendAdminNotification).toHaveBeenCalledOnce();
    expect(mocks.sendClientConfirmation).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      "update_agent_request_delivery",
      expect.objectContaining({ p_reference_code: "VY-ABCDEF1234567890" }),
    );
  });

  it("retries idempotent email delivery after an interrupted first request", async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: [
          {
            accepted: true,
            reference_code: "VY-ABCDEF1234567890",
            client_email_status: "pending",
            inserted: false,
            retry_after_seconds: 0,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.sendAdminNotification).toHaveBeenCalledOnce();
    expect(mocks.sendClientConfirmation).toHaveBeenCalledOnce();
  });

  it("maps the atomic database rate limit to HTTP 429", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          accepted: false,
          reference_code: null,
          client_email_status: null,
          inserted: false,
          retry_after_seconds: 900,
        },
      ],
      error: null,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("900");
    expect(mocks.sendAdminNotification).not.toHaveBeenCalled();
  });
});
