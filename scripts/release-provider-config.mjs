// Preserve deliberate owner configuration across releases. Credentials alone
// never opt an application into generation or microphone use.
export function releaseProviderConfig(source, previous = {}, overrides = {}) {
  const setting = (name, fallback) =>
    source[name] ?? previous[name] ?? fallback;
  const billingDisabled = setting("AI_BILLING_DISABLED", "false");
  const requestedMode =
    overrides.DEPLOY_AI_MODE ?? setting("AI_MODE", "fixture");
  const aiMode =
    requestedMode === "live" && billingDisabled === "true" ? "live" : "fixture";
  const voiceConfirmed = setting("VOICE_FREE_TIER_CONFIRMED", "false");
  const voiceBilling = setting("VOICE_BILLING_DISABLED", "false");
  const voiceRequested = setting("VOICE_MODE", "disabled");
  return {
    AI_MODE: aiMode,
    AGENT_MODEL_ENABLED:
      aiMode === "live" && setting("AGENT_MODEL_ENABLED", "false") === "true"
        ? "true"
        : "false",
    AI_BILLING_DISABLED: billingDisabled,
    AI_FREE_QUOTA_CONFIRMED: setting("AI_FREE_QUOTA_CONFIRMED", "false"),
    VOICE_MODEL: setting("VOICE_MODEL", "gemini-3.8-live"),
    VOICE_MODE:
      voiceRequested === "live" &&
      voiceConfirmed === "true" &&
      voiceBilling === "true"
        ? "live"
        : "disabled",
    VOICE_FREE_TIER_CONFIRMED: voiceConfirmed,
    VOICE_BILLING_DISABLED: voiceBilling,
  };
}
