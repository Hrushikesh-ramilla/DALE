import { expect, it } from "vitest";
import { validateReleaseRuntime } from "../scripts/validate-release-runtime.mjs";

const manifest = {
  selection: "accepted",
  candidates: { accepted: { alias: "tested-model" } },
};
const live = {
  AI_PROVIDER: "self_hosted",
  AI_MODE: "live",
  AI_MODEL: "tested-model",
  AI_SELF_HOSTED_BASE_URL: "http://127.0.0.1:8081/v1",
};

it("rejects unselected or different models before live release configuration is written", () => {
  expect(() =>
    validateReleaseRuntime(live, { ...manifest, selection: null }),
  ).toThrow(/qualified/);
  expect(() =>
    validateReleaseRuntime(
      { ...live, AI_MODEL: "downloaded-candidate" },
      manifest,
    ),
  ).toThrow(/qualified/);
  expect(() => validateReleaseRuntime(live, manifest)).not.toThrow();
});

it("rejects a remote or credential-bearing endpoint without exposing its value", () => {
  for (const endpoint of [
    "https://api.example.test/v1",
    "http://127.0.0.1:8081/v1?token=private",
    "http://private:secret@localhost:8081/v1",
    "invalid",
  ])
    expect(() =>
      validateReleaseRuntime(
        { ...live, AI_SELF_HOSTED_BASE_URL: endpoint },
        manifest,
      ),
    ).toThrow(/endpoint|loopback/);
});

it("rejects copied Windows paths and traversal for Linux local speech", () => {
  for (const path of [
    "C:\\models\\whisper.exe",
    "relative/model.bin",
    "/opt/../model.bin",
    "/opt/model\n.bin",
  ])
    expect(() =>
      validateReleaseRuntime(
        {
          VOICE_MODE: "local",
          LOCAL_SPEECH_EXECUTABLE: path,
          LOCAL_SPEECH_MODEL: "/var/lib/dale/model.bin",
        },
        manifest,
      ),
    ).toThrow(/Linux/);
  expect(() =>
    validateReleaseRuntime(
      {
        VOICE_MODE: "local",
        LOCAL_SPEECH_EXECUTABLE: "/opt/dale/whisper-cli",
        LOCAL_SPEECH_MODEL: "/var/lib/dale/model.bin",
      },
      manifest,
    ),
  ).not.toThrow();
});

it("keeps fixture releases available without an accepted inference model", () => {
  expect(() =>
    validateReleaseRuntime(
      { ...live, AI_MODE: "fixture", AI_MODEL: "", VOICE_MODE: "disabled" },
      { ...manifest, selection: null },
    ),
  ).not.toThrow();
});
