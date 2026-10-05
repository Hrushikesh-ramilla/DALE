import { afterEach, expect, it, vi } from "vitest";
import { scanMessage } from "../src/domain/scams";
import { scamAnalysis } from "../src/server/ai";
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.AI_MODE = "fixture";
});
it.each([
  "P4y using g1ft c4rds right now",
  "Please s.e.n.d your verification c.o.d.e",
  "Sеnd your one-time cоde", // Cyrillic homoglyphs.
  "Share your verifi\u200bcation code",
  "Ｐａｙ with crypto right now",
  "Hello, we can help with delivery.\nSeller: send your OTP.\nSeller: use a wire transfer to release the item.",
  "Never share codes. Please send your verification code to me.",
  "Do not panic, send your verification code to support.",
  "Never share your password but send me your OTP.",
])("warns on obfuscated or escalating instructions: %s", (message) => {
  expect(scanMessage(message).level).not.toBe("low");
});
it.each([
  "Never share your password or verification code.",
  "Do not pay by gift card; use the store checkout.",
  "We sell gift cards in our catalog.",
  "The delivery driver arrives within 5 minutes.",
  "Your account is locked. Reset it through your account settings.",
  "Use your one-time code only in the official login form. Never send it to staff.",
  "We provide product information. Your password belongs only in the official login.",
  "We sell gift cards. Pay for the charger in the protected checkout.",
])("keeps benign safety and retail messages low: %s", (message) => {
  expect(scanMessage(message).level).toBe("low");
});
it("a model cannot suppress rule warnings or display a free-text accusation", async () => {
  process.env.AI_MODE = "live";
  process.env.AI_API_KEY = "test-only";
  process.env.AI_MODEL = "gemini-test";
  delete process.env.AI_API_BASE_URL;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    signals: [],
                    reasons: ["Customer fraud"],
                    level: "low",
                  }),
                },
              ],
            },
          },
        ],
      }),
    ),
  );
  const result = await scamAnalysis("Pay with gift cards right now");
  expect(result.level).toBe("high");
  expect(result.reasons.join(" ")).not.toContain("Customer fraud");
});
it("retains local warning rules during a provider outage", async () => {
  process.env.AI_MODE = "live";
  delete process.env.AI_API_KEY;
  const result = await scamAnalysis("Send your password");
  expect(result.mode).toBe("unavailable");
  expect(result.level).toBe("caution");
  expect(result.nextStep).toContain("local warning rules");
});
