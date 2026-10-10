import { expect, test } from "@playwright/test";
import { liveVoiceConfig } from "../src/server/voice";
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});
test("native Live protocol handles synthetic microphone PCM, tools, playback and stop without Google traffic", async ({
  page,
}) => {
  let audioChunks = 0,
    toolResponses = 0,
    closed = false,
    connections = 0;
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    (window as unknown as { testTracks: MediaStreamTrack[] }).testTracks = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      (window as unknown as { testTracks: MediaStreamTrack[] }).testTracks.push(
        ...stream.getTracks(),
      );
      return stream;
    };
  });
  await page.route("**/api/voice/session", (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? { mode: "live", message: "Synthetic native transport test" }
          : {
              mode: "live",
              message: "Synthetic native transport test",
              token: "auth_tokens/browser-fixture",
              model: "gemini-3.8-live",
              expiresAt: new Date(Date.now() + 120000).toISOString(),
              config: liveVoiceConfig,
            },
    }),
  );
  await page.routeWebSocket(
    "wss://generativelanguage.googleapis.com/**",
    (socket) => {
      const connection = ++connections;
      socket.onClose(() => {
        closed = true;
      });
      socket.onMessage((message) => {
        const data = JSON.parse(message.toString());
        if (data.setup) socket.send(JSON.stringify({ setupComplete: {} }));
        if (data.realtimeInput?.audio) {
          audioChunks++;
          if (connection === 2) {
            socket.close({ code: 1011, reason: "Synthetic provider failure" });
            return;
          }
          expect(data.realtimeInput.audio.mimeType).toBe(
            "audio/pcm;rate=16000",
          );
          if (audioChunks === 1) {
            socket.send(
              JSON.stringify({
                serverContent: {
                  inputTranscription: { text: "Find a 65W charger under $40" },
                },
              }),
            );
            socket.send(
              JSON.stringify({
                toolCall: {
                  functionCalls: [
                    {
                      name: "prepare_request",
                      id: "fixture-call",
                      args: { request: "Find a 65W charger under $40" },
                    },
                  ],
                },
              }),
            );
          }
        }
        if (data.toolResponse) {
          toolResponses++;
          socket.send(
            JSON.stringify({
              serverContent: {
                outputTranscription: {
                  text: "Review the compatible catalog options on screen.",
                },
                modelTurn: {
                  role: "model",
                  parts: [
                    {
                      inlineData: {
                        mimeType: "audio/pcm;rate=24000",
                        data: Buffer.alloc(2400).toString("base64"),
                      },
                    },
                  ],
                },
                turnComplete: true,
              },
            }),
          );
        }
      });
    },
  );
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page
    .getByRole("button", { name: "Start microphone conversation" })
    .click();
  await expect(page.getByLabel("Maximum budget, USD")).toHaveValue("40");
  await expect.poll(() => audioChunks).toBeGreaterThan(0);
  await expect.poll(() => toolResponses).toBe(1);
  await expect(page.locator(".voice-reply")).toContainText(
    "Review the compatible",
  );
  await page.getByRole("button", { name: "Stop voice" }).click();
  await expect.poll(() => closed).toBe(true);
  expect(
    await page.evaluate(() =>
      (window as unknown as { testTracks: MediaStreamTrack[] }).testTracks.map(
        (track) => track.readyState,
      ),
    ),
  ).toEqual(["ended"]);
  await page
    .getByRole("button", { name: "Start microphone conversation" })
    .click();
  await expect(page.locator(".voice-heading")).toContainText("Unavailable");
  await expect(
    page.getByLabel("DALE voice companion").getByRole("alert"),
  ).toContainText("Typed shopping remains available", { ignoreCase: true });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { testTracks: MediaStreamTrack[] }
        ).testTracks.every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Start microphone conversation" })
    .click();
  await expect.poll(() => connections).toBe(3);
  await expect(page.locator(".voice-heading")).toContainText("Listening");
  await page.getByRole("button", { name: "Stop voice" }).click();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testTracks: MediaStreamTrack[] }).testTracks.map(
        (track) => track.readyState,
      ),
    ),
  ).toEqual(["ended", "ended", "ended"]);
  const stopped = audioChunks;
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  expect(audioChunks).toBe(stopped);
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
});
