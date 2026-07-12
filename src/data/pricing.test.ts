import { describe, expect, it } from "vitest";

import {
  calculateMonthlyPrice,
  calculatePricePerMinute,
  PRICING_MARKUP,
  PRICING_SOURCE_READY,
  pricingKey,
} from "./pricing";

describe("pricing", () => {
  it("uses a total markup of 45 percent", () => {
    expect(PRICING_MARKUP).toBe(1.45);
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

  it("uses the reviewed workbook and exposes per-minute and monthly prices", () => {
    expect(PRICING_SOURCE_READY).toBe(true);
    expect(
      calculatePricePerMinute({
        llm: "GPT 5.5",
        textToSpeech: "OpenAI Voices",
        telephony: "Twilio/Telnyx",
      }),
    ).toBe(0.35525);
    expect(
      calculateMonthlyPrice({
        llm: "GPT 5.5",
        textToSpeech: "OpenAI Voices",
        telephony: "Twilio/Telnyx",
        minutes: 1_000,
      }),
    ).toBe(355.25);
  });

  it("does not invent a price for Custom LLM", () => {
    expect(
      calculateMonthlyPrice({
        llm: "Custom LLM",
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
