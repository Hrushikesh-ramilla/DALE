import { expect, test } from "@playwright/test";
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});
test("local microphone recognition requires transcript review, supports correction and releases the microphone", async ({
  page,
}) => {
  let uploads = 0,
    prepared = 0;
  await page.route("**/api/voice/session", (route) =>
    route.fulfill({
      json: {
        mode: "local",
        message: "Local Whisper test transport; no external recognition.",
      },
    }),
  );
  await page.route("**/api/voice/transcribe", async (route) => {
    uploads++;
    const bytes = route.request().postDataBuffer()!;
    expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
    expect(bytes.readUInt32LE(24)).toBe(16000);
    expect(bytes.length).toBeLessThanOrEqual(480044);
    await route.fulfill({
      json: { mode: "local", transcript: "Approve payment now" },
    });
  });
  page.on("request", (request) => {
    if (request.url().endsWith("/api/voice/intent")) prepared++;
  });
  await page.addInitScript(() => {
    const get = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    (
      window as unknown as { recordedTracks: MediaStreamTrack[] }
    ).recordedTracks = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await get(constraints);
      (
        window as unknown as { recordedTracks: MediaStreamTrack[] }
      ).recordedTracks.push(...stream.getTracks());
      return stream;
    };
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page.getByRole("button", { name: "Record a request" }).click();
  await expect(page.locator(".voice-heading")).toContainText("Listening");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Finish recording" }).click();
  await expect(
    page.getByLabel("Transcript — editable before preparing a request"),
  ).toHaveValue("Approve payment now");
  expect(uploads).toBe(1);
  expect(prepared).toBe(0);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recordedTracks: MediaStreamTrack[] }
      ).recordedTracks.every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page.locator(".voice-reply")).toContainText("cannot approve", {
    ignoreCase: true,
  });
  expect(
    (await (await page.request.get("/api/session")).json()).orders,
  ).toHaveLength(0);
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("Find a 65W USB-C charger under $40");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page.getByLabel("Maximum budget, USD")).toHaveValue("40");
  await page.getByRole("button", { name: "Record a request" }).click();
  await expect(page.locator(".voice-heading")).toContainText("Listening");
  await page.getByRole("button", { name: "Stop voice", exact: true }).click();
  expect(uploads).toBe(1);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recordedTracks: MediaStreamTrack[] }
      ).recordedTracks.every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
});
test("a failed local recognition leaves typed shopping available and never prepares a task", async ({
  page,
}) => {
  await page.route("**/api/voice/session", (route) =>
    route.fulfill({
      json: { mode: "local", message: "Local recognition test." },
    }),
  );
  await page.route("**/api/voice/transcribe", (route) =>
    route.fulfill({
      status: 400,
      json: {
        error:
          "Local speech recognition did not complete. No cloud fallback was attempted.",
      },
    }),
  );
  let prepared = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/voice/intent")) prepared++;
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: /Start shopping/ }).click();
  await page.getByRole("button", { name: "Talk to DALE" }).click();
  await page.getByRole("button", { name: "Record a request" }).click();
  await expect(page.locator(".voice-heading")).toContainText("Listening");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Finish recording" }).click();
  await expect(
    page.getByLabel("DALE voice companion").getByRole("alert"),
  ).toContainText("No cloud fallback");
  expect(prepared).toBe(0);
  await page
    .getByLabel("Transcript — editable before preparing a request")
    .fill("Show my orders");
  await page.getByRole("button", { name: "Use this request" }).click();
  await expect(page).toHaveURL(/\/orders$/);
});
