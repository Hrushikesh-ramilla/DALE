import { afterAll, beforeAll, expect, it } from "vitest";
import {
  enqueueOperatorJob,
  claimOperatorJob,
  finishOperatorJob,
  processOperatorJobs,
  getOperatorJob,
  listOperatorJobs,
  deterministicJobId,
} from "../src/server/catalog-operator-jobs";
import {
  loadAndPublishManifestFixture,
  rollbackManifestFixture,
} from "../src/server/catalog-fixture-loader";
import { enqueueJob as enqueueCustomerJob, claimJob as claimCustomerJob } from "../src/server/jobs";
import { getDatabase, closeDatabase } from "../src/server/database";
import { productById } from "../src/domain/catalog";
import type { CatalogManifestV2 } from "../src/domain/catalog-manifest";
import { getStoredProduct } from "../src/server/catalog-store";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});

afterAll(() => closeDatabase());

it("enqueues jobs with deterministic IDs and deduplicates identical tasks", async () => {
  const payload = { category: "laptops", brand: "Dell", targetModel: "XPS 13 9340" };
  const expectedId = deterministicJobId("collect_census", payload);

  const res1 = await enqueueOperatorJob("collect_census", payload);
  expect(res1.id).toBe(expectedId);
  expect(res1.enqueued).toBe(true);

  // Second enqueue with same payload is deduplicated
  const res2 = await enqueueOperatorJob("collect_census", payload);
  expect(res2.id).toBe(expectedId);
  expect(res2.enqueued).toBe(false);

  const job = await getOperatorJob(expectedId);
  expect(job).toBeDefined();
  expect(job?.status).toBe("pending");
  expect(job?.kind).toBe("collect_census");
});

it("claims jobs transactionally with lease fencing across concurrent workers", async () => {
  const payload = { category: "tablets", brand: "Apple" };
  const { id } = await enqueueOperatorJob("collect_census", payload);

  const worker1 = "worker-alpha";
  const worker2 = "worker-beta";

  // Worker 1 claims job
  const job = await claimOperatorJob(worker1, Date.now(), undefined, undefined, id);
  expect(job).toBeDefined();
  expect(job?.id).toBe(id);
  expect(job?.locked_by).toBe(worker1);
  expect(job?.status).toBe("running");

  // Worker 2 cannot claim the same job (it's leased)
  const job2 = await claimOperatorJob(worker2, Date.now(), undefined, undefined, id);
  expect(job2).toBeUndefined();

  // Worker 1 finishes job
  const finished = await finishOperatorJob(job!, { success: true });
  expect(finished).toBe(true);

  const completedJob = await getOperatorJob(id);
  expect(completedJob?.status).toBe("completed");
  expect(completedJob?.completed_at).not.toBeNull();
});

it("prevents stale worker from acknowledging work after lease expiration", async () => {
  const payload = { category: "headphones", brand: "Sennheiser" };
  const { id } = await enqueueOperatorJob("collect_census", payload);

  const worker1 = "worker-slow";
  const worker2 = "worker-fast";

  const startTime = Date.now();
  const job = await claimOperatorJob(worker1, startTime, undefined, undefined, id);
  expect(job?.id).toBe(id);

  // Fast-forward past lease timeout (6 minutes)
  const futureTime = startTime + 6 * 60000;

  // Worker 2 claims the expired job (it transitions to retry and is claimed)
  const reclaimed = await claimOperatorJob(worker2, futureTime, undefined, undefined, id);
  expect(reclaimed?.id).toBe(id);
  expect(reclaimed?.locked_by).toBe(worker2);

  // Stale worker 1 tries to finish job — rejected by lease fence
  const staleFinished = await finishOperatorJob(job!, { success: true }, futureTime);
  expect(staleFinished).toBe(false);

  // Worker 2 successfully finishes job
  const activeFinished = await finishOperatorJob(reclaimed!, { success: true }, futureTime);
  expect(activeFinished).toBe(true);

  const finalJob = await getOperatorJob(id);
  expect(finalJob?.status).toBe("completed");
});

it("transitions to dead_letter after exceeding max attempts and redacts errors", async () => {
  const payload = { category: "wall-chargers", brand: "UnsafeSource" };
  const { id } = await enqueueOperatorJob("collect_census", payload);

  let currentTime = Date.now();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const job = await claimOperatorJob("worker-retry", currentTime, 5000, maxAttempts, id);
    expect(job).toBeDefined();

    if (attempt < maxAttempts) {
      await finishOperatorJob(
        job!,
        {
          success: false,
          error: "Connection failed with token=secret_token_12345bearer",
        },
        currentTime,
        maxAttempts,
      );
    } else {
      await finishOperatorJob(
        job!,
        {
          success: false,
          error: "Authentication fatal with bearer secret_token_12345bearer",
        },
        currentTime,
        maxAttempts,
      );
    }
    currentTime += 10000;
  }

  const finalJob = await getOperatorJob(id);
  expect(finalJob?.status).toBe("dead_letter");
  expect(finalJob?.last_error).not.toContain("secret_token_12345bearer");
  expect(finalJob?.last_error).toContain("[REDACTED]");
});

it("transitions to review_required without automatic publication when uncertain data is found", async () => {
  const payload = { category: "portable-ssds", brand: "UnconfirmedBrand" };
  const { id } = await enqueueOperatorJob("collect_census", payload);

  const job = await claimOperatorJob("worker-review", Date.now(), undefined, undefined, id);
  expect(job?.id).toBe(id);

  // Worker identifies conflicting manufacturer facts requiring human inspection
  await finishOperatorJob(job!, {
    success: false,
    status: "review_required",
    error: "Manufacturer lists two conflicting TBW specifications for this model.",
  });

  const reviewedJob = await getOperatorJob(id);
  expect(reviewedJob?.status).toBe("review_required");
  expect(reviewedJob?.last_error).toContain("conflicting TBW specifications");
});

it("maintains strict queue isolation between operator jobs and customer jobs", async () => {
  const database = await getDatabase();
  // Create dummy workspace for customer job test
  const wsId = "ws-operator-isolation-test";
  await database.query("INSERT INTO workspaces(id, state) VALUES($1, '{}'::jsonb) ON CONFLICT DO NOTHING", [wsId]);

  // Enqueue customer job requiring workspace_id
  const customerJobId = await enqueueCustomerJob(database, wsId, "sync_customer_brief", { note: "test" });

  // Enqueue operator job without workspace_id
  const { id: operatorJobId } = await enqueueOperatorJob("stage_manifest", { releaseId: "test-rel" });

  // Customer worker claims only customer jobs
  const customerClaimed = await claimCustomerJob(Date.now(), wsId);
  expect(customerClaimed?.id).toBe(customerJobId);
  expect(customerClaimed?.workspace_id).toBe(wsId);

  // Operator claimer claims only operator jobs
  const operatorClaimed = await claimOperatorJob("op-worker", Date.now(), undefined, undefined, operatorJobId);
  expect(operatorClaimed?.id).toBe(operatorJobId);
  expect((operatorClaimed as any).workspace_id).toBeUndefined();
});

it("fixture loader enforces 500-record batch limit, stages/publishes idempotently and rolls back", async () => {
  const original = productById("B010");
  const manifest: CatalogManifestV2 = {
    schemaVersion: "catalog-manifest-v2",
    id: "fixture-batch-test",
    reviewedBy: "fixture-loader-test",
    reviewedAt: "2026-10-11",
    approvedSourceHosts: [new URL(original.source).hostname],
    products: [
      {
        ...original,
        sponsored: false,
        provenance: "manufacturer_evidence",
        brand: original.brand ?? "Maison Francis Kurkdjian",
        offerKind: "sandbox",
        evidence: original.evidence ?? {
          checkedAt: "2026-10-11",
          region: "US",
          missing: [],
          review: "specifications",
        },
        attributes: {
          ...original.attributes,
          brand: original.brand ?? "Maison Francis Kurkdjian",
        },
        id: "fixture-p1",
        name: "Fixture Loader Test Product",
        leafType: "fragrance",
        modelName: "Fixture 540",
        media: {
          url: "https://www.franciskurkdjian.com/test-fixture.jpg",
          source: original.source,
          alt: "Synthetic media contract fixture",
          attribution: "Synthetic test fixture",
          reviewedAt: "2026-10-11",
          usage: "external_reference",
        },
      },
    ],
  };

  // Enforce max 500
  const oversizedManifest = {
    ...manifest,
    id: "oversized-manifest",
    products: Array.from({ length: 501 }, (_, i) => ({
      ...manifest.products[0],
      id: `oversized-${i}`,
    })),
  };
  await expect(loadAndPublishManifestFixture(oversizedManifest)).rejects.toThrow("exceeds the maximum allowed batch size of 500");

  // Load and publish valid manifest
  const res1 = await loadAndPublishManifestFixture(manifest);
  expect(res1.status).toBe("published");
  expect(res1.count).toBe(1);

  const product = await getStoredProduct("fixture-p1");
  expect(product.name).toBe("Fixture Loader Test Product");

  // Idempotent reload reports already_published
  const res2 = await loadAndPublishManifestFixture(manifest);
  expect(res2.status).toBe("already_published");

  // Rollback retires the batch
  const rollbackRes = await rollbackManifestFixture(manifest.id);
  expect(rollbackRes.retired).toBe(true);

  // Stored product now retired
  await expect(getStoredProduct("fixture-p1", undefined, true)).rejects.toThrow("retired");
});
