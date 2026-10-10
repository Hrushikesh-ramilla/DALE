import { expect, test } from "@playwright/test";
import { liveVoiceConfig } from "../src/server/voice";

for (const failure of ["permission", "quota", "expired"] as const) {
  test(`voice ${failure} failure preserves typed requests without starting a provider socket`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { micCalls: number }).micCalls = 0;
      navigator.mediaDevices.getUserMedia = async () => {
        (window as unknown as { micCalls: number }).micCalls++;
        throw new DOMException(
          "Microphone permission denied",
          "NotAllowedError",
        );
      };
    });
    let sockets = 0;
    await page.routeWebSocket(
      "wss://generativelanguage.googleapis.com/**",
      (socket) => {
        sockets++;
        socket.close();
      },
    );
    await page.route("**/api/voice/session", (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({
          json: { mode: "live", message: "Synthetic failure test" },
        });
      if (failure === "quota")
        return route.fulfill({
          status: 429,
          json: {
            error:
              "Live voice quota is unavailable. Typed shopping remains available.",
          },
        });
      return route.fulfill({
        json: {
          mode: "live",
          message: "Synthetic failure test",
          token: "auth_tokens/failure-fixture",
          model: "gemini-3.8-live",
          config: liveVoiceConfig,
          expiresAt: new Date(
            Date.now() + (failure === "expired" ? -1000 : 120000),
          ).toISOString(),
        },
      });
    });
    await page.goto("/demo");
    await page.getByRole("button", { name: /Start shopping/ }).click();
    await page.getByRole("button", { name: "Talk to DALE" }).click();
    await page
      .getByRole("button", { name: "Start microphone conversation" })
      .click();
    await expect(page.locator(".voice-heading")).toContainText("Unavailable");
    await expect(
      page.getByLabel("DALE voice companion").getByRole("alert"),
    ).toContainText(
      failure === "permission"
        ? "permission denied"
        : failure === "quota"
          ? "quota"
          : "expired",
    );
    expect(
      await page.evaluate(
        () => (window as unknown as { micCalls: number }).micCalls,
      ),
    ).toBe(failure === "permission" ? 1 : 0);
    expect(sockets).toBe(0);
    await page
      .getByLabel("Transcript — editable before preparing a request")
      .fill("Find a 65W charger under $40");
    await page.getByRole("button", { name: "Use this request" }).click();
    await expect(page.getByLabel("Maximum budget, USD")).toHaveValue("40");
    expect(
      (await (await page.request.get("/api/session")).json()).orders,
    ).toHaveLength(0);
  });
}
