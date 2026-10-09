import { expect, it } from "vitest";
import {
  parseRuntimeEnvironment,
  runtimePlan,
  installedModelUnit,
} from "../deploy/runtime-policy.mjs";
const manifest = {
  selection: "accepted",
  candidates: {
    accepted: {
      alias: "tested-model",
      minimumHostGiB: 4,
      files: [
        { local: "model.gguf", sha256: "a".repeat(64) },
        { local: "vision.gguf", sha256: "b".repeat(64) },
      ],
    },
  },
};
const live = {
  AI_PROVIDER: "self_hosted",
  AI_MODE: "live",
  AI_MODEL: "tested-model",
  VOICE_MODE: "local",
};

it("handles an absent exact unit while preserving systemd inspection errors", () => {
  expect(installedModelUnit({ status: 1, stdout: "", stderr: "" })).toBe(false);
  expect(
    installedModelUnit({
      status: 0,
      stdout: "buyerguard-model.service enabled",
      stderr: "",
    }),
  ).toBe(true);
  expect(() =>
    installedModelUnit({
      status: 1,
      stdout: "",
      stderr: "Failed to connect to bus",
    }),
  ).toThrow(/inspect/);
  expect(() =>
    installedModelUnit({ status: 2, stdout: "", stderr: "" }),
  ).toThrow(/inspect/);
});

it("preserves literal private values without evaluating shell substitutions", () => {
  const secret = 'quote" dollars$ backtick` $(execute) newline\nend';
  expect(
    parseRuntimeEnvironment(
      `SECRET=${JSON.stringify(secret)}\nVOICE_MODE="local"\n`,
    ),
  ).toEqual({ SECRET: secret, VOICE_MODE: "local" });
  for (const line of [
    "SECRET=unquoted",
    "SECRET=42",
    'export SECRET="x"',
    'SECRET="unterminated',
  ])
    expect(() => parseRuntimeEnvironment(line)).toThrow(
      /format|quoted|strings/,
    );
});

it("checks aggregate capacity and gives the app room for child-process speech", () => {
  const plan = runtimePlan(live, manifest, 4 * 1024 ** 3);
  expect(plan).toMatchObject({
    modelEnabled: true,
    voiceEnabled: true,
    appMemoryMiB: 768,
    modelMemoryMiB: 2048,
    requiredMiB: 3696,
  });
  expect(() =>
    runtimePlan(
      { ...live, LOCAL_MODEL_MEMORY_MAX_MIB: "3000" },
      manifest,
      4 * 1024 ** 3,
    ),
  ).toThrow(/lacks memory/);
  expect(() => runtimePlan(live, manifest, 1024 ** 3)).toThrow(/memory class/);
});

it("cannot enable a downloaded but unqualified or differently configured model", () => {
  expect(() =>
    runtimePlan(live, { ...manifest, selection: null }, 8 * 1024 ** 3),
  ).toThrow(/qualified/);
  expect(() =>
    runtimePlan({ ...live, AI_MODEL: "other-model" }, manifest, 8 * 1024 ** 3),
  ).toThrow(/qualified/);
  expect(() =>
    runtimePlan(
      { ...live, LOCAL_MODEL_MEMORY_MAX_MIB: "2048; execute" },
      manifest,
      8 * 1024 ** 3,
    ),
  ).toThrow(/limit/);
});

it("keeps fixture installs provider-free and allows speech without a selected agent", () => {
  expect(
    runtimePlan(
      { AI_MODE: "fixture", VOICE_MODE: "disabled" },
      { ...manifest, selection: null },
      1024 ** 3,
    ),
  ).toMatchObject({
    modelEnabled: false,
    voiceEnabled: false,
    appMemoryMiB: 380,
  });
  expect(
    runtimePlan(
      { AI_MODE: "fixture", VOICE_MODE: "local" },
      { ...manifest, selection: null },
      4 * 1024 ** 3,
    ),
  ).toMatchObject({
    modelEnabled: false,
    voiceEnabled: true,
    appMemoryMiB: 768,
  });
});

it("rejects artifact traversal or absent integrity before installation", () => {
  for (const file of [
    { local: "../model.gguf", sha256: "a".repeat(64) },
    { local: "model.gguf", sha256: "unverified" },
  ])
    expect(() =>
      runtimePlan(
        live,
        {
          ...manifest,
          candidates: {
            accepted: {
              ...manifest.candidates.accepted,
              files: [file, manifest.candidates.accepted.files[1]],
            },
          },
        },
        4 * 1024 ** 3,
      ),
    ).toThrow(/artifact/);
});
