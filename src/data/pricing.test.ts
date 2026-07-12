import { describe, expect, it } from "vitest";

import {
  calculateMonthlyPrice,
  PRICING_MARKUP,
  PRICING_SOURCE_READY,
  pricingKey,
} from "./pricing";

describe("pricing", () => {
  it("uses a total markup of 40 percent", () => {
    expect(PRICING_MARKUP).toBe(1.4);
  });

  it("normalizes combination keys", () => {
    expect(
      pricingKey({
        llm: " GPT 5.5 ",
        textToSpeech: "OpenAI Voices",
        telephony: "Twilio/Telnyx",
      }),
    ).toBe("gpt 5.5|openai voices|twilio/telnyx");
  });

  it("does not fabricate prices before the workbook is imported", () => {
    expect(PRICING_SOURCE_READY).toBe(false);
    expect(
      calculateMonthlyPrice({
        llm: "GPT 5.5",
        textToSpeech: "OpenAI Voices",
        telephony: "Twilio/Telnyx",
        minutes: 1_000,
      }),
    ).toBeNull();
  });

  it("rejects volumes outside zero to ten thousand minutes", () => {
    expect(
      calculateMonthlyPrice({
        llm: "GPT 5.5",
        textToSpeech: "OpenAI Voices",
        telephony: "Twilio/Telnyx",
        minutes: 10_001,
      }),
    ).toBeNull();
  });
});
