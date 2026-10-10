import { z } from "zod";
import { models } from "./catalog";
import { mentionedModels } from "./identification";
import { briefSchema, type ShoppingBrief } from "./brief";
export const voiceRequest = z.object({
  transcript: z.string().trim().min(1).max(2000),
  model: z.enum(models as [string, ...string[]]),
  budget: z.number().int().min(1).max(100000),
});
export type VoiceIntent =
  | { kind: "shopping"; brief: ShoppingBrief }
  | { kind: "navigate"; destination: "orders" | "support" }
  | {
      kind: "support_draft";
      text: string;
      reason?: "damaged" | "wrong_item" | "not_delivered" | "canceled";
      request?: "refund" | "replacement";
    }
  | { kind: "clarification" | "review_required"; message: string };
export function understandVoice(
  input: z.infer<typeof voiceRequest>,
): VoiceIntent {
  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };
  const numberWords =
    "(?:" + Object.keys(words).join("|") + "|hundred|thousand|and)";
  function number(phrase: string) {
    let total = 0,
      part = 0;
    for (const word of phrase.toLowerCase().split(/[ -]+/)) {
      if (word === "hundred") part = (part || 1) * 100;
      else if (word === "thousand") {
        total += (part || 1) * 1000;
        part = 0;
      } else part += words[word] || 0;
    }
    return total + part;
  }
  const text = input.transcript
    .replace(
      new RegExp(
        "((?:under|below|up to|budget(?: of| is)?|maximum(?: of)?)\\s+)(" +
          numberWords +
          "(?:[ -]+" +
          numberWords +
          "){0,6})\\b",
        "gi",
      ),
      (_, prefix: string, phrase: string) => prefix + number(phrase),
    )
    .replace(
      new RegExp(
        "\\b(" +
          numberWords +
          "(?:[ -]+" +
          numberWords +
          "){0,3})\\s+watts?\\b",
        "gi",
      ),
      (_, phrase: string) => number(phrase) + "W",
    );
  if (/\b(?:euros?|pounds?|rupees?|inr|eur|gbp)\b|[€£₹]/i.test(text))
    return {
      kind: "clarification",
      message:
        "This test catalog uses USD. Please state the maximum amount in US dollars.",
    };
  if (
    /\b(?:approve|pay|purchase|execute|run code|transfer|delete)\b/i.test(text)
  )
    return {
      kind: "review_required",
      message:
        "Voice cannot approve payments, execute code or authorize a financial remedy. Use the protected review controls.",
    };
  if (
    /\b(?:refund|replace|replacement|return|damaged|wrong item)\b/i.test(text)
  )
    return {
      kind: "support_draft",
      text,
      reason: /\bwrong (?:item|product)\b/i.test(text)
        ? "wrong_item"
        : /\bdamag(?:ed|e)\b/i.test(text)
          ? "damaged"
          : /\b(?:not arrived|not delivered|hasn't arrived)\b/i.test(text)
            ? "not_delivered"
            : /\bcancel/i.test(text)
              ? "canceled"
              : undefined,
      request: /\breplac(?:e|ement)\b/i.test(text)
        ? "replacement"
        : /\brefund\b/i.test(text)
          ? "refund"
          : undefined,
    };
  if (/\b(?:my orders?|track (?:my )?order|order status)\b/i.test(text))
    return { kind: "navigate", destination: "orders" };
  if (/\b(?:support|customer care|help with (?:my )?order)\b/i.test(text))
    return { kind: "navigate", destination: "support" };
  const amounts = [
    ...text.matchAll(
      /(?:under|below|up to|budget(?: of| is)?|maximum(?: of)?)\s*\$?\s*(\d+(?:\.\d{1,2})?)(?:\s*(?:dollars?|usd))?/gi,
    ),
  ].map((match) => Math.round(Number(match[1]) * 100));
  if (new Set(amounts).size > 1)
    return {
      kind: "clarification",
      message:
        "I heard more than one budget. Please choose one maximum amount in USD.",
    };
  const budget = amounts[0] ?? input.budget;
  if (budget < 1 || budget > 100000)
    return {
      kind: "clarification",
      message: "Choose a maximum budget between $0.01 and $1,000 USD.",
    };
  const devices = mentionedModels(text);
  if (devices.length > 1)
    return {
      kind: "clarification",
      message:
        "I heard multiple device profiles. Choose the one this purchase is for.",
    };
  const categories = [
    ["chargers", /\b(?:chargers?|charging|power adapter)\b/i],
    ["storage", /\b(?:ssd|storage|drive)\b/i],
    ["audio", /\b(?:headphones?|audio|headset)\b/i],
    ["docks", /\b(?:docks?|hubs?|ethernet)\b/i],
    ["accessories", /\b(?:mouse|accessories)\b/i],
  ] as const;
  const found = categories.filter(([, pattern]) => pattern.test(text));
  if (found.length !== 1)
    return {
      kind: "clarification",
      message:
        "Choose one product type: charger, dock, SSD, headphones or mouse.",
    };
  const preference =
    text.match(/\b\d{2,3}\s*w\b/i)?.[0].replace(/\s/g, "") || "";
  return {
    kind: "shopping",
    brief: briefSchema.parse({
      message: text,
      model: devices[0] || input.model,
      budget,
      category: found[0][0],
      preference,
      priority: preference ? "features" : "price",
    }),
  };
}
