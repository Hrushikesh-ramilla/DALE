import { afterEach, expect, it, vi } from "vitest";
import { releaseProviderConfig } from "../scripts/release-provider-config.mjs";
import { liveStatus } from "../src/server/live-status";
afterEach(() => vi.unstubAllEnvs());
it("preserves self-hosted inference without a cloud key and prevents Gemini voice calls", () => {
  const source = {
    AI_PROVIDER: "self_hosted",
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "true",
    AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
    AI_SELF_HOSTED_API_KEY: "private-local-key",
    VOICE_MODE: "live",
    VOICE_FREE_TIER_CONFIRMED: "true",
    VOICE_BILLING_DISABLED: "true",
  };
  const release = releaseProviderConfig(source);
  expect(release).toMatchObject({
    AI_PROVIDER: "self_hosted",
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "true",
    AI_SELF_HOSTED_API_KEY: "private-local-key",
    VOICE_MODE: "disabled",
  });
  Object.entries(source).forEach(([key, value]) => vi.stubEnv(key, value));
  vi.stubEnv("AI_MODEL", "tested-local-model");
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_BILLING_DISABLED", "false");
  expect(liveStatus()).toMatchObject({
    ready: true,
    provider: "Self-hosted",
    voiceReady: false,
  });
  expect(JSON.stringify(liveStatus())).not.toContain("private-local-key");
});
it("preserves an owner's enabled live agent across release packaging", () => {
  const source = {
    AI_MODE: "live",
    AGENT_MODEL_ENABLED: "true",
    AI_BILLING_DISABLED: "true",
    AI_FREE_QUOTA_CONFIRMED: "true",
  };
  const previous = {
    AI_MODE: "fixture",
    AGENT_MODEL_ENABLED: "false",
    AI_BILLING_DISABLED: "false",
  };
  const first = releaseProviderConfig(source, previous);
  expect(first).toMatchObject(source);
  expect(releaseProviderConfig({}, first)).toMatchObject(source);
  expect(releaseProviderConfig({ AI_MODE: "fixture" }, first)).toMatchObject({
    AI_MODE: "fixture",
    AGENT_MODEL_ENABLED: "false",
  });
});
it("does not enable provider calls from credentials or unconfirmed billing flags", () => {
  expect(
    releaseProviderConfig({
      AI_API_KEY: "not-real",
      AI_MODE: "live",
      AGENT_MODEL_ENABLED: "true",
    }),
  ).toMatchObject({
    AI_MODE: "fixture",
    AGENT_MODEL_ENABLED: "false",
    VOICE_MODE: "disabled",
  });
  expect(
    releaseProviderConfig({
      VOICE_MODE: "live",
      VOICE_FREE_TIER_CONFIRMED: "true",
    }),
  ).toMatchObject({ VOICE_MODE: "disabled" });
});
it("reports live readiness without returning credentials or access codes", () => {
  vi.stubEnv("AI_API_KEY", "private-key");
  vi.stubEnv("DEMO_ACCESS_CODE", "private-access");
  vi.stubEnv("AI_MODEL", "gemini-3.8-flash");
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AGENT_MODEL_ENABLED", "true");
  vi.stubEnv("AI_BILLING_DISABLED", "false");
  expect(liveStatus().ready).toBe(false);
  vi.stubEnv("AI_BILLING_DISABLED", "true");
  expect(liveStatus().ready).toBe(true);
  expect(JSON.stringify(liveStatus())).not.toMatch(
    /private-key|private-access/,
  );
});
