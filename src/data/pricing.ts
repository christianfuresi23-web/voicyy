import pricingTable from "./pricing.generated.json";

export const PRICING_MARKUP = 1.45;

type PricingInput = {
  llm: string;
  textToSpeech: string;
  telephony: string;
  minutes: number;
};

type PricingTable = Record<string, number>;

const baseRates = pricingTable as PricingTable;

export const PRICING_SOURCE_READY = Object.keys(baseRates).length > 0;

export function pricingKey({
  llm,
  textToSpeech,
  telephony,
}: Omit<PricingInput, "minutes">) {
  return [llm, textToSpeech, telephony]
    .map((value) => value.trim().toLocaleLowerCase("it-IT"))
    .join("|");
}
/**
 * Returns the customer price per minute after Voicyy's 45% markup.
 * The generated table stores the source cost per minute for each exact
 * LLM/TTS/telephony combination. A missing combination intentionally returns
 * null: prices must never be guessed for configurations absent from the
 * reviewed workbook.
 */
export function calculatePricePerMinute({
  llm,
  textToSpeech,
  telephony,
}: Omit<PricingInput, "minutes">): number | null {
  const sourceRate = baseRates[pricingKey({ llm, textToSpeech, telephony })];

  if (typeof sourceRate !== "number" || sourceRate < 0) {
    return null;
  }

  return Math.round(sourceRate * PRICING_MARKUP * 1_000_000) / 1_000_000;
}

/** Returns the estimated monthly usage price for 0–10,000 minutes. */
export function calculateMonthlyPrice({
  llm,
  textToSpeech,
  telephony,
  minutes,
}: PricingInput): number | null {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10_000) {
    return null;
  }

  const pricePerMinute = calculatePricePerMinute({
    llm,
    textToSpeech,
    telephony,
  });
  if (pricePerMinute === null) return null;

  return Math.round(pricePerMinute * minutes * 100) / 100;
}
