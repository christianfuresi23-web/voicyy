import pricingTable from "./pricing.generated.json";

export const PRICING_MARKUP = 1.4;

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
 * Returns the estimated monthly usage price after Voicyy's 40% markup.
 * The generated table stores the source cost per minute for each exact
 * LLM/TTS/telephony combination. A missing combination intentionally returns
 * null: prices must never be guessed when the reviewed workbook is absent.
 */
export function calculateMonthlyPrice({
  llm,
  textToSpeech,
  telephony,
  minutes,
}: PricingInput): number | null {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10_000) {
    return null;
  }

  const sourceRate = baseRates[pricingKey({ llm, textToSpeech, telephony })];

  if (typeof sourceRate !== "number" || sourceRate < 0) {
    return null;
  }

  return Math.round(sourceRate * PRICING_MARKUP * minutes * 100) / 100;
}
