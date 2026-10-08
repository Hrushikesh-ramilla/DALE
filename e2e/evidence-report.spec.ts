import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("optional video stays private and claim-level reports retain sources, uncertainty and open remedies", async ({
  page,
  browser,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /^Conflicting evidence/ }).click();
  await expect(page).toHaveURL(/\/support$/);
  await page.getByRole("button", { name: "Add your evidence" }).click();
  await page.getByLabel("Item serial / identifier").fill("FIXTURE-100");
  await page
    .getByLabel("What does this record show?")
    .fill("Optional synthetic clip retained for a person to review.");
  await page
    .getByRole("button", { name: "Get capture code (optional)" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Capture code:");
  await page
    .getByLabel("Video (optional, MP4 or WebM, up to 8 MB)")
    .setInputFiles("fixtures/evidence-media/synthetic.webm");
  await page.getByRole("button", { name: "Record evidence" }).click();
  const originalUrl = await page
    .locator(".evidence-card")
    .getByRole("link", { name: "View original video" })
    .getAttribute("href");
  const original = await page.request.get(originalUrl!);
  expect(original.headers()["content-type"]).toBe("video/webm");
  expect(original.headers()["cache-control"]).toBe("private, no-store");
  expect(original.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await original.body()).toEqual(
    await readFile("fixtures/evidence-media/synthetic.webm"),
  );
  const anonymous = await browser.newContext();
  expect(
    (
      await anonymous.request.get(new URL(originalUrl!, page.url()).toString())
    ).status(),
  ).toBe(401);
  await anonymous.close();
  await page
    .getByRole("button", { name: "Review evidence", exact: true })
    .click();
  await expect(page.locator(".analysis-panel").first()).toContainText(
    "does not analyze video",
  );
  const firstClaim = page.locator(".claim-proposition").first();
  await firstClaim.locator("summary").click();
  await expect(firstClaim).toContainText("submitted records");
  await expect(firstClaim).toContainText("Source:");
  const reportUrl = await page
    .getByRole("link", { name: "Download private case report" })
    .getAttribute("href");
  const report = await (await page.request.get(reportUrl!)).json();
  expect(report.schemaVersion).toBe("case-report-v2");
  const video = report.submittedRecords.find(
    (record: { media?: { kind: string } }) => record.media?.kind === "video",
  );
  expect(video.integrity).toBe("verified_at_export");
  expect(video.provenance.source).toBe("challenge_associated_upload");
  expect(
    report.propositions.find(
      (claim: { id: string }) => claim.id === `integrity:${video.id}`,
    ).outcome,
  ).toBe("supported");
  expect(
    report.propositions.find(
      (claim: { category: string }) => claim.category === "physical_causation",
    ).outcome,
  ).toBe("insufficient");
  expect(
    report.propositions.every(
      (claim: { sourceIds: string[]; uncertainty: string[] }) =>
        claim.uncertainty.length &&
        claim.sourceIds.every((id) =>
          report.sourceIndex.some((source: { id: string }) => source.id === id),
        ),
    ),
  ).toBe(true);
  expect(report.claim.status).not.toBe("resolved");
  expect(report.transactionRecords.refundedAmount).toBe(0);
  await page.reload();
  await expect(
    page
      .locator(".evidence-card")
      .getByRole("link", { name: "View original video" }),
  ).toBeVisible();
  await expect(page.locator(".claim-proposition").first()).toBeVisible();
});
