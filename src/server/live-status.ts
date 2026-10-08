export function liveStatus() {
  const reasons: string[] = [];
  if (!process.env.AI_API_KEY || !process.env.AI_MODEL)
    reasons.push("The server needs its configured Gemini key and model.");
  if (process.env.AI_BILLING_DISABLED !== "true")
    reasons.push(
      "The owner must confirm that Google project billing is disabled.",
    );
  if (
    process.env.AI_MODE !== "live" ||
    process.env.AGENT_MODEL_ENABLED !== "true"
  )
    reasons.push(
      "Live analysis and agent planning are not enabled on this server.",
    );
  return {
    ready: reasons.length === 0,
    model: process.env.AI_MODEL || "Not configured",
    reasons,
    accessCodeRequired: Boolean(process.env.DEMO_ACCESS_CODE),
    payments:
      process.env.PAYMENT_MODE === "sandbox"
        ? "PayPal sandbox"
        : "Simulated payments",
    voiceReady:
      process.env.VOICE_MODE === "live" &&
      process.env.VOICE_FREE_TIER_CONFIRMED === "true" &&
      process.env.VOICE_BILLING_DISABLED === "true" &&
      Boolean(process.env.AI_API_KEY) &&
      process.env.VOICE_MODEL === "gemini-3.8-live",
  };
}
