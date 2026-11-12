// Preserve deliberate owner configuration across releases. Credentials alone
// never opt an application into generation or microphone use.
export function releaseProviderConfig(source, previous = {}, overrides = {}) {
  const setting = (name, fallback) =>
    source[name] ?? previous[name] ?? fallback;
  const billingDisabled = setting("AI_BILLING_DISABLED", "false");
  const provider = setting("AI_PROVIDER", "cloud");
  const requestedMode =
    overrides.DEPLOY_AI_MODE ?? setting("AI_MODE", "fixture");
  const aiMode =
    requestedMode === "live" &&
    (provider === "self_hosted" || billingDisabled === "true")
      ? "live"
      : "fixture";
  const voiceConfirmed = setting("VOICE_FREE_TIER_CONFIRMED", "false");
  const voiceBilling = setting("VOICE_BILLING_DISABLED", "false");
  const voiceRequested = setting("VOICE_MODE", "disabled");
  return {
    AI_PROVIDER: provider,
    AI_MODEL: setting("AI_MODEL", ""),
    AI_SELF_HOSTED_BASE_URL: setting("AI_SELF_HOSTED_BASE_URL", ""),
    AI_SELF_HOSTED_PROFILE: setting("AI_SELF_HOSTED_PROFILE", ""),
    AI_SELF_HOSTED_API_KEY: setting("AI_SELF_HOSTED_API_KEY", ""),
    LOCAL_MODEL_MEMORY_MAX_MIB: setting("LOCAL_MODEL_MEMORY_MAX_MIB", "2048"),
    LOCAL_OCR_MODE: setting("LOCAL_OCR_MODE", "disabled"),
    AI_MODE: aiMode,
    AGENT_MODEL_ENABLED:
      aiMode === "live" && setting("AGENT_MODEL_ENABLED", "false") === "true"
        ? "true"
        : "false",
    AI_BILLING_DISABLED: billingDisabled,
    AI_FREE_QUOTA_CONFIRMED: setting("AI_FREE_QUOTA_CONFIRMED", "false"),
    VOICE_MODEL: setting("VOICE_MODEL", "gemini-3.8-live"),
    VOICE_MODE:
      voiceRequested === "local" &&
      setting("LOCAL_SPEECH_EXECUTABLE", "") &&
      setting("LOCAL_SPEECH_MODEL", "")
        ? "local"
        : provider !== "self_hosted" &&
            voiceRequested === "live" &&
            voiceConfirmed === "true" &&
            voiceBilling === "true"
          ? "live"
          : "disabled",
    LOCAL_SPEECH_EXECUTABLE: setting("LOCAL_SPEECH_EXECUTABLE", ""),
    LOCAL_SPEECH_MODEL: setting("LOCAL_SPEECH_MODEL", ""),
    VOICE_FREE_TIER_CONFIRMED: voiceConfirmed,
    VOICE_BILLING_DISABLED: voiceBilling,
    CONCIERGE_PROVIDER: setting("CONCIERGE_PROVIDER", provider === "gemini" ? "gemini" : "gemini"),
    CONCIERGE_MODEL: setting("CONCIERGE_MODEL", setting("AI_MODEL", "gemini-3.5-flash-lite")),
    CONCIERGE_ALLOW_CLOUD: setting("CONCIERGE_ALLOW_CLOUD", "true"),
    CONCIERGE_INPUT_TOKEN_LIMIT: setting("CONCIERGE_INPUT_TOKEN_LIMIT", "1048576"),
    CONCIERGE_CONTEXT_BUDGET_TOKENS: setting("CONCIERGE_CONTEXT_BUDGET_TOKENS", "1048576"),
    CONCIERGE_GENERATIONS_PER_MINUTE: setting("CONCIERGE_GENERATIONS_PER_MINUTE", "60"),
  };
}
